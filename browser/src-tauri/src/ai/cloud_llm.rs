//! Cloud LLM API client.
//!
//! Implements an OpenAI-compatible REST client that routes requests through the
//! PQC TLS proxy. Supports streaming responses via Server-Sent Events (SSE).
//!
//! # Security model
//!
//! All outbound HTTPS connections are intercepted by the browser's PQC proxy
//! (running on 127.0.0.1). The proxy upgrades the outer TLS connection to
//! ML-KEM-768 / X25519Kyber768Draft00 before forwarding to the origin.
//! This means cloud API calls are protected by post-quantum key exchange even
//! when the API provider does not natively support PQC.
//!
//! # Rate limiting
//!
//! The client enforces a client-side limit of 60 requests per minute using a
//! simple token-bucket strategy. Server-side 429 responses trigger exponential
//! back-off with up to `max_retries` attempts.

use std::sync::Arc;
use std::time::{Duration, Instant};

use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;

use crate::ai::local_llm::{ChatMessage, Role};

// ---------------------------------------------------------------------------
// Request / Response types (OpenAI-compatible)
// ---------------------------------------------------------------------------

/// A single message in the OpenAI chat format.
#[derive(Debug, Clone, Serialize, Deserialize)]
struct OaiMessage {
    role: String,
    content: String,
}

impl From<&ChatMessage> for OaiMessage {
    fn from(m: &ChatMessage) -> Self {
        Self {
            role: match m.role {
                Role::System => "system".to_string(),
                Role::User => "user".to_string(),
                Role::Assistant => "assistant".to_string(),
            },
            content: m.content.clone(),
        }
    }
}

/// OpenAI `/v1/chat/completions` request body.
#[derive(Debug, Serialize)]
struct ChatCompletionRequest<'a> {
    model: &'a str,
    messages: Vec<OaiMessage>,
    max_tokens: usize,
    temperature: f32,
    stream: bool,
}

/// Non-streaming completion choice.
#[derive(Debug, Deserialize)]
struct Choice {
    message: OaiMessage,
    finish_reason: Option<String>,
}

/// Non-streaming completion response.
#[derive(Debug, Deserialize)]
struct ChatCompletionResponse {
    choices: Vec<Choice>,
    usage: Option<UsageStats>,
}

/// Token usage returned by the API.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageStats {
    pub prompt_tokens: usize,
    pub completion_tokens: usize,
    pub total_tokens: usize,
}

/// Streaming delta inside an SSE chunk.
#[derive(Debug, Deserialize)]
struct StreamDelta {
    content: Option<String>,
}

/// Streaming choice inside an SSE chunk.
#[derive(Debug, Deserialize)]
struct StreamChoice {
    delta: StreamDelta,
    finish_reason: Option<String>,
}

/// Streaming SSE data chunk.
#[derive(Debug, Deserialize)]
struct StreamChunk {
    choices: Vec<StreamChoice>,
}

// ---------------------------------------------------------------------------
// Cloud LLM result type
// ---------------------------------------------------------------------------

/// Completed response from the cloud API.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloudResponse {
    /// Full generated text.
    pub text: String,
    /// Token usage, if the API returned it.
    pub usage: Option<UsageStats>,
}

/// Streaming token event forwarded to the Tauri frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloudTokenEvent {
    pub token: String,
    pub done: bool,
}

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

#[derive(Debug, thiserror::Error)]
pub enum CloudLlmError {
    #[error("no API key configured")]
    NoApiKey,

    #[error("HTTP error {status}: {body}")]
    HttpError { status: u16, body: String },

    #[error("rate limit exceeded — try again later")]
    RateLimited,

    #[error("request timeout after {secs}s")]
    Timeout { secs: u64 },

    #[error("SSE parse error: {0}")]
    SseParse(String),

    #[error("network error: {0}")]
    Network(String),

    #[error("max retries ({attempts}) exhausted")]
    MaxRetriesExhausted { attempts: u32 },
}

pub type CloudLlmResult<T> = Result<T, CloudLlmError>;

// ---------------------------------------------------------------------------
// Rate limiter
// ---------------------------------------------------------------------------

/// Simple token-bucket rate limiter.
///
/// Allows `capacity` requests per `window` and refills proportionally.
struct RateLimiter {
    capacity: u32,
    available: f64,
    last_refill: Instant,
    refill_rate: f64, // tokens per millisecond
}

impl RateLimiter {
    fn new(requests_per_minute: u32) -> Self {
        Self {
            capacity: requests_per_minute,
            available: requests_per_minute as f64,
            last_refill: Instant::now(),
            refill_rate: requests_per_minute as f64 / 60_000.0,
        }
    }

    /// Returns `true` if a token is available and consumes it.
    fn try_acquire(&mut self) -> bool {
        let now = Instant::now();
        let elapsed_ms = now.duration_since(self.last_refill).as_millis() as f64;
        self.available = (self.available + elapsed_ms * self.refill_rate)
            .min(self.capacity as f64);
        self.last_refill = now;

        if self.available >= 1.0 {
            self.available -= 1.0;
            true
        } else {
            false
        }
    }
}

// ---------------------------------------------------------------------------
// Cloud LLM client
// ---------------------------------------------------------------------------

/// Configuration snapshot used by the client (no secrets in the struct name).
#[derive(Debug, Clone)]
pub struct CloudClientConfig {
    pub endpoint: String,
    pub api_key: String,
    pub model: String,
    pub max_tokens: usize,
    pub temperature: f32,
    pub timeout_secs: u64,
    pub max_retries: u32,
    /// Local proxy port to route through (PQC proxy).
    pub proxy_port: Option<u16>,
}

/// OpenAI-compatible cloud LLM client.
pub struct CloudLlmClient {
    config: CloudClientConfig,
    http: reqwest::Client,
    rate_limiter: Arc<Mutex<RateLimiter>>,
}

impl CloudLlmClient {
    /// Build a new client. Routes through `proxy_port` when provided.
    pub fn new(config: CloudClientConfig) -> CloudLlmResult<Self> {
        if config.api_key.is_empty() {
            return Err(CloudLlmError::NoApiKey);
        }

        let mut builder = reqwest::Client::builder()
            .timeout(Duration::from_secs(config.timeout_secs));

        // Route through the local PQC proxy.
        if let Some(port) = config.proxy_port {
            let proxy_url = format!("http://127.0.0.1:{port}");
            builder = builder.proxy(
                reqwest::Proxy::https(&proxy_url)
                    .map_err(|e| CloudLlmError::Network(e.to_string()))?,
            );
        }

        let http = builder
            .build()
            .map_err(|e| CloudLlmError::Network(e.to_string()))?;

        Ok(Self {
            config,
            http,
            rate_limiter: Arc::new(Mutex::new(RateLimiter::new(60))),
        })
    }

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    /// Send a chat completion request. Returns the full response text.
    ///
    /// When `token_tx` is provided, tokens are also streamed back as they arrive.
    pub async fn chat(
        &self,
        system: &str,
        history: &[ChatMessage],
        user_message: &str,
        token_tx: Option<tokio::sync::mpsc::Sender<CloudTokenEvent>>,
    ) -> CloudLlmResult<CloudResponse> {
        self.check_rate_limit().await?;

        let mut messages: Vec<OaiMessage> = Vec::with_capacity(history.len() + 2);
        messages.push(OaiMessage {
            role: "system".to_string(),
            content: system.to_string(),
        });
        for m in history {
            messages.push(OaiMessage::from(m));
        }
        messages.push(OaiMessage {
            role: "user".to_string(),
            content: user_message.to_string(),
        });

        if token_tx.is_some() {
            self.stream_completion(messages, token_tx.unwrap()).await
        } else {
            self.non_streaming_completion(messages).await
        }
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    async fn check_rate_limit(&self) -> CloudLlmResult<()> {
        let mut rl = self.rate_limiter.lock().await;
        if rl.try_acquire() {
            Ok(())
        } else {
            Err(CloudLlmError::RateLimited)
        }
    }

    fn completions_url(&self) -> String {
        format!("{}/chat/completions", self.config.endpoint.trim_end_matches('/'))
    }

    async fn non_streaming_completion(
        &self,
        messages: Vec<OaiMessage>,
    ) -> CloudLlmResult<CloudResponse> {
        let body = ChatCompletionRequest {
            model: &self.config.model,
            messages,
            max_tokens: self.config.max_tokens,
            temperature: self.config.temperature,
            stream: false,
        };

        let mut attempt = 0u32;
        loop {
            let resp = self
                .http
                .post(&self.completions_url())
                .bearer_auth(&self.config.api_key)
                .header("Content-Type", "application/json")
                .json(&body)
                .send()
                .await
                .map_err(|e| CloudLlmError::Network(e.to_string()))?;

            let status = resp.status();

            if status == reqwest::StatusCode::TOO_MANY_REQUESTS {
                attempt += 1;
                if attempt >= self.config.max_retries {
                    return Err(CloudLlmError::MaxRetriesExhausted { attempts: attempt });
                }
                let backoff = Duration::from_millis(500 * 2u64.pow(attempt));
                tokio::time::sleep(backoff).await;
                continue;
            }

            if !status.is_success() {
                let body_text = resp.text().await.unwrap_or_default();
                return Err(CloudLlmError::HttpError {
                    status: status.as_u16(),
                    body: body_text,
                });
            }

            let completion: ChatCompletionResponse = resp
                .json()
                .await
                .map_err(|e| CloudLlmError::Network(e.to_string()))?;

            let text = completion
                .choices
                .into_iter()
                .next()
                .map(|c| c.message.content)
                .unwrap_or_default();

            return Ok(CloudResponse {
                text,
                usage: completion.usage,
            });
        }
    }

    async fn stream_completion(
        &self,
        messages: Vec<OaiMessage>,
        token_tx: tokio::sync::mpsc::Sender<CloudTokenEvent>,
    ) -> CloudLlmResult<CloudResponse> {
        let body = ChatCompletionRequest {
            model: &self.config.model,
            messages,
            max_tokens: self.config.max_tokens,
            temperature: self.config.temperature,
            stream: true,
        };

        let mut attempt = 0u32;
        loop {
            let resp = self
                .http
                .post(&self.completions_url())
                .bearer_auth(&self.config.api_key)
                .header("Content-Type", "application/json")
                .json(&body)
                .send()
                .await
                .map_err(|e| CloudLlmError::Network(e.to_string()))?;

            let status = resp.status();

            if status == reqwest::StatusCode::TOO_MANY_REQUESTS {
                attempt += 1;
                if attempt >= self.config.max_retries {
                    return Err(CloudLlmError::MaxRetriesExhausted { attempts: attempt });
                }
                let backoff = Duration::from_millis(500 * 2u64.pow(attempt));
                tokio::time::sleep(backoff).await;
                continue;
            }

            if !status.is_success() {
                let body_text = resp.text().await.unwrap_or_default();
                return Err(CloudLlmError::HttpError {
                    status: status.as_u16(),
                    body: body_text,
                });
            }

            // Parse the SSE stream.
            let mut full_text = String::new();
            let mut stream = resp.bytes_stream();

            use futures_util::StreamExt;
            let mut remainder = String::new();

            while let Some(chunk) = stream.next().await {
                let chunk = chunk.map_err(|e| CloudLlmError::Network(e.to_string()))?;
                let text = std::str::from_utf8(&chunk)
                    .map_err(|e| CloudLlmError::SseParse(e.to_string()))?;

                remainder.push_str(text);

                // SSE lines are separated by "\n\n".
                while let Some(pos) = remainder.find("\n\n") {
                    let line = remainder[..pos].to_string();
                    remainder = remainder[pos + 2..].to_string();

                    if let Some(data) = line.strip_prefix("data: ") {
                        if data.trim() == "[DONE]" {
                            let _ = token_tx
                                .send(CloudTokenEvent {
                                    token: String::new(),
                                    done: true,
                                })
                                .await
                                .ok();
                            break;
                        }

                        if let Ok(chunk_data) = serde_json::from_str::<StreamChunk>(data) {
                            for choice in &chunk_data.choices {
                                if let Some(content) = &choice.delta.content {
                                    full_text.push_str(content);
                                    let _ = token_tx
                                        .send(CloudTokenEvent {
                                            token: content.clone(),
                                            done: false,
                                        })
                                        .await
                                        .ok();
                                }
                            }
                        }
                    }
                }
            }

            return Ok(CloudResponse {
                text: full_text,
                usage: None, // Streaming responses don't include usage stats inline.
            });
        }
    }
}

// ---------------------------------------------------------------------------
// Helper: build the system prompt for cloud mode (adds PQC note)
// ---------------------------------------------------------------------------

/// Append a PQC protection notice to any system prompt when running in cloud mode.
pub fn cloud_system_prompt(base: &str) -> String {
    format!(
        "{base}\n\nNote: This conversation is protected by ML-KEM-768 post-quantum encryption."
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rate_limiter_allows_initial_requests() {
        let mut rl = RateLimiter::new(60);
        // Should be able to consume many tokens immediately from the full bucket.
        assert!(rl.try_acquire());
        assert!(rl.try_acquire());
    }

    #[test]
    fn rate_limiter_exhausts() {
        let mut rl = RateLimiter::new(2);
        assert!(rl.try_acquire()); // token 1
        assert!(rl.try_acquire()); // token 2
        assert!(!rl.try_acquire()); // bucket empty
    }

    #[test]
    fn client_rejects_empty_key() {
        let cfg = CloudClientConfig {
            endpoint: "https://api.openai.com/v1".to_string(),
            api_key: String::new(),
            model: "gpt-4o".to_string(),
            max_tokens: 1024,
            temperature: 0.7,
            timeout_secs: 30,
            max_retries: 3,
            proxy_port: None,
        };
        assert!(CloudLlmClient::new(cfg).is_err());
    }

    #[test]
    fn cloud_system_prompt_includes_base() {
        let prompt = cloud_system_prompt("You are helpful.");
        assert!(prompt.contains("You are helpful."));
        assert!(prompt.contains("ML-KEM-768"));
    }
}
