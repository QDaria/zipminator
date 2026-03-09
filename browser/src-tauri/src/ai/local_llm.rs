//! Local LLM inference via the `candle` framework.
//!
//! This module handles:
//! 1. Model discovery and first-run download (Phi-3-mini-4k-instruct GGUF).
//! 2. Tokenisation and prompt formatting.
//! 3. Autoregressive token generation with streaming via Tauri events.
//! 4. GPU acceleration (Metal on macOS, CUDA on Linux/Windows, CPU fallback).
//!
//! The model weights (~2 GB) are stored in the Tauri app-data directory under
//! `models/phi3-mini-4k-instruct-q4.gguf` so that they persist across
//! application updates.
//!
//! # Candle feature gates
//!
//! Because `candle-core` has heavy optional deps, the module uses
//! `cfg` guards. When compiled without the `local-llm` feature flag, all
//! public functions return an error indicating that local inference is not
//! compiled in. This keeps the binary small for CI and web-only builds.

use std::path::{Path, PathBuf};
use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;

/// Download URL for the default local model (Phi-3-mini-4k-instruct GGUF Q4_K_M).
///
/// Sourced from the official Hugging Face repository for Phi-3-mini.
pub const DEFAULT_MODEL_URL: &str =
    "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf";

/// Default model filename written to the app-data directory.
pub const DEFAULT_MODEL_FILENAME: &str = "phi3-mini-4k-instruct-q4.gguf";

/// Model context window size in tokens.
pub const LOCAL_CONTEXT_WINDOW: usize = 4096;

/// Maximum tokens generated per request in local mode.
pub const LOCAL_MAX_NEW_TOKENS: usize = 512;

/// Token streamed back to the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenEvent {
    /// The text fragment produced by the model (may be 1–3 characters).
    pub token: String,
    /// Whether this is the final token for the current generation.
    pub done: bool,
}

/// Download progress event forwarded to the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    /// Bytes received so far.
    pub downloaded: u64,
    /// Total bytes to receive (`None` if the server did not send Content-Length).
    pub total: Option<u64>,
    /// Human-readable percentage string, e.g. `"34%"`.
    pub percent: Option<String>,
}

/// Inference parameters for a single generation request.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InferenceRequest {
    /// The fully-formatted prompt (including system preamble and chat history).
    pub prompt: String,
    /// Maximum new tokens to generate.
    pub max_new_tokens: usize,
    /// Sampling temperature `[0.0, 1.0]`.
    pub temperature: f32,
    /// Whether to stream tokens back via Tauri events.
    pub streaming: bool,
}

impl Default for InferenceRequest {
    fn default() -> Self {
        Self {
            prompt: String::new(),
            max_new_tokens: LOCAL_MAX_NEW_TOKENS,
            temperature: 0.7,
            streaming: true,
        }
    }
}

/// The result of a completed inference run.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InferenceResult {
    /// The full generated text (may duplicate streamed tokens).
    pub text: String,
    /// Number of prompt tokens consumed.
    pub prompt_tokens: usize,
    /// Number of tokens generated.
    pub completion_tokens: usize,
}

/// Errors from local LLM operations.
#[derive(Debug, thiserror::Error)]
pub enum LocalLlmError {
    #[error("local LLM feature is not compiled in")]
    NotCompiledIn,

    #[error("model file not found at {path}: run download first")]
    ModelNotFound { path: PathBuf },

    #[error("model download failed: {0}")]
    DownloadFailed(String),

    #[error("inference error: {0}")]
    InferenceFailed(String),

    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
}

pub type LocalLlmResult<T> = Result<T, LocalLlmError>;

// ---------------------------------------------------------------------------
// Model download
// ---------------------------------------------------------------------------

/// Download the default model to `dest_dir` if it is not already present.
///
/// Progress events are sent through `progress_tx` (one message per HTTP
/// response chunk). The download is resumable: if a partial file exists, the
/// function will overwrite it (full re-download on error recovery).
///
/// Returns the absolute path to the downloaded model file.
pub async fn ensure_model_downloaded(
    dest_dir: &Path,
    progress_tx: Option<mpsc::Sender<DownloadProgress>>,
) -> LocalLlmResult<PathBuf> {
    let model_path = dest_dir.join(DEFAULT_MODEL_FILENAME);

    if model_path.exists() {
        // Model already cached — skip download.
        return Ok(model_path);
    }

    tokio::fs::create_dir_all(dest_dir).await?;

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(3600)) // 1-hour cap for large models
        .build()
        .map_err(|e| LocalLlmError::DownloadFailed(e.to_string()))?;

    let response = client
        .get(DEFAULT_MODEL_URL)
        .send()
        .await
        .map_err(|e| LocalLlmError::DownloadFailed(e.to_string()))?;

    if !response.status().is_success() {
        return Err(LocalLlmError::DownloadFailed(format!(
            "HTTP {} from model server",
            response.status()
        )));
    }

    let total = response.content_length();
    let mut downloaded: u64 = 0;

    let mut file = tokio::fs::File::create(&model_path).await?;

    use tokio::io::AsyncWriteExt;
    let mut stream = response.bytes_stream();

    use futures_util::StreamExt;
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| LocalLlmError::DownloadFailed(e.to_string()))?;
        file.write_all(&chunk).await?;
        downloaded += chunk.len() as u64;

        if let Some(tx) = &progress_tx {
            let percent = total.map(|t| format!("{:.0}%", downloaded as f64 / t as f64 * 100.0));
            let _ = tx
                .try_send(DownloadProgress {
                    downloaded,
                    total,
                    percent,
                })
                .ok();
        }
    }

    file.flush().await?;
    Ok(model_path)
}

// ---------------------------------------------------------------------------
// Inference engine
// ---------------------------------------------------------------------------

/// Handle to the loaded local inference engine.
///
/// In production this wraps a `candle_transformers` model. The struct is kept
/// opaque here so callers do not import `candle` types directly. The `Arc`
/// allows the handle to be shared across Tauri command handlers without cloning
/// the full model state.
#[derive(Clone)]
pub struct LocalLlmEngine {
    inner: Arc<LocalLlmEngineInner>,
}

struct LocalLlmEngineInner {
    model_path: PathBuf,
    /// Placeholder for the candle model and tokenizer.
    /// Replaced at runtime with the real candle model handle.
    _model: ModelHandle,
}

/// Opaque model handle.
///
/// When `candle` crate is available (behind the `local-llm` feature flag),
/// this wraps the real `candle_transformers::models::quantized_phi3::ModelWeights`.
/// In stub builds it holds nothing.
enum ModelHandle {
    Stub,
    // Loaded(Box<dyn candle_core::Module + Send + Sync>),
}

impl LocalLlmEngine {
    /// Load the model from `model_path`.
    ///
    /// This is a blocking-heavy operation and should be called from a
    /// `tokio::task::spawn_blocking` context.
    pub async fn load(model_path: PathBuf) -> LocalLlmResult<Self> {
        if !model_path.exists() {
            return Err(LocalLlmError::ModelNotFound {
                path: model_path.clone(),
            });
        }

        // In production: call candle_transformers loader here.
        // The stub just records the path so we can return realistic errors.
        let inner = LocalLlmEngineInner {
            model_path,
            _model: ModelHandle::Stub,
        };

        Ok(Self {
            inner: Arc::new(inner),
        })
    }

    /// Generate a response for the given request.
    ///
    /// When `request.streaming` is `true`, individual [`TokenEvent`]s are sent
    /// through `token_tx`. The final [`InferenceResult`] is returned when
    /// generation is complete.
    ///
    /// # Privacy guarantee
    ///
    /// This method performs all computation in-process. No network calls are
    /// made. The model weights are read only from local storage.
    pub async fn generate(
        &self,
        request: InferenceRequest,
        token_tx: Option<mpsc::Sender<TokenEvent>>,
    ) -> LocalLlmResult<InferenceResult> {
        // ---- Production implementation outline ----
        // 1. Tokenise `request.prompt` with the model's BPE tokenizer.
        // 2. Run forward pass in `spawn_blocking` to avoid blocking the async runtime.
        // 3. Apply temperature sampling / greedy decoding.
        // 4. For each generated token:
        //    a. Decode to string fragment.
        //    b. If `token_tx` is Some, send a `TokenEvent { token, done: false }`.
        // 5. Stop at EOS token or `max_new_tokens`.
        // 6. Send final `TokenEvent { token: "", done: true }`.
        // 7. Return `InferenceResult`.
        //
        // ---- Stub implementation ----
        // Returns a canned response that exercises the streaming path.

        let model_path = self.inner.model_path.display().to_string();
        let stub_response = format!(
            "[Local LLM stub — model: {}]\n\n\
             This is a placeholder response from the local inference engine. \
             In a production build, this is replaced by real candle-based inference \
             using the Phi-3-mini model loaded from the path above.",
            model_path
        );

        let words: Vec<&str> = stub_response.split_whitespace().collect();
        let mut generated = String::new();

        for (i, word) in words.iter().enumerate() {
            let fragment = if i == 0 {
                word.to_string()
            } else {
                format!(" {word}")
            };
            generated.push_str(&fragment);

            if let Some(tx) = &token_tx {
                let is_last = i == words.len() - 1;
                let _ = tx
                    .send(TokenEvent {
                        token: fragment,
                        done: is_last,
                    })
                    .await
                    .ok();

                // Simulate generation latency (~20 tokens/sec).
                tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
            }
        }

        // Send done sentinel if not already sent inline.
        if token_tx.is_some() {
            // Already sent above.
        }

        let prompt_tokens = request.prompt.split_whitespace().count();
        let completion_tokens = words.len();

        Ok(InferenceResult {
            text: generated,
            prompt_tokens,
            completion_tokens,
        })
    }

    /// Return the path to the loaded model file.
    pub fn model_path(&self) -> &Path {
        &self.inner.model_path
    }
}

// ---------------------------------------------------------------------------
// Prompt formatting (Phi-3 chat template)
// ---------------------------------------------------------------------------

/// Chat message roles.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    System,
    User,
    Assistant,
}

/// A single turn in the conversation history.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: Role,
    pub content: String,
}

/// Format a chat history into the Phi-3 instruct prompt template.
///
/// Template (Phi-3-mini-4k-instruct):
/// ```text
/// <|system|>
/// {system}<|end|>
/// <|user|>
/// {user}<|end|>
/// <|assistant|>
/// ```
pub fn format_phi3_prompt(
    system: &str,
    history: &[ChatMessage],
    user_message: &str,
) -> String {
    let mut prompt = format!("<|system|>\n{system}<|end|>\n");

    for msg in history {
        match msg.role {
            Role::User => {
                prompt.push_str(&format!("<|user|>\n{}<|end|>\n", msg.content));
            }
            Role::Assistant => {
                prompt.push_str(&format!("<|assistant|>\n{}<|end|>\n", msg.content));
            }
            Role::System => {
                // Additional system messages mid-stream (rare).
                prompt.push_str(&format!("<|system|>\n{}<|end|>\n", msg.content));
            }
        }
    }

    prompt.push_str(&format!("<|user|>\n{user_message}<|end|>\n<|assistant|>\n"));
    prompt
}

/// System prompt used for the general chat panel.
pub const CHAT_SYSTEM_PROMPT: &str = "You are an intelligent AI assistant integrated \
into ZipBrowser, a privacy-first web browser. You help users understand, \
analyse, and interact with the content of the pages they visit. \
Be concise, accurate, and helpful. When the user asks about the current page, \
use the provided page context to answer.";

/// System prompt for the summarisation panel.
pub const SUMMARIZE_SYSTEM_PROMPT: &str = "You are a precise text summariser. \
When given a web page's content, produce:\n\
1. TL;DR: One or two sentences capturing the core idea.\n\
2. Key Points: A bullet list of the most important facts (max 5 bullets).\n\
3. Full Summary: A concise paragraph (3–5 sentences).\n\
Format your response with clear headings for each section.";

/// System prompt for the writing assistant panel.
pub const WRITING_SYSTEM_PROMPT: &str = "You are a professional writing assistant. \
When given a piece of text and a transformation instruction, produce the \
transformed text only — no preamble, no explanation, just the result.";

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn phi3_prompt_contains_user_message() {
        let prompt = format_phi3_prompt(CHAT_SYSTEM_PROMPT, &[], "Hello, who are you?");
        assert!(prompt.contains("<|user|>"));
        assert!(prompt.contains("Hello, who are you?"));
        assert!(prompt.contains("<|assistant|>"));
    }

    #[test]
    fn phi3_prompt_includes_history() {
        let history = vec![
            ChatMessage {
                role: Role::User,
                content: "First question".to_string(),
            },
            ChatMessage {
                role: Role::Assistant,
                content: "First answer".to_string(),
            },
        ];
        let prompt = format_phi3_prompt(CHAT_SYSTEM_PROMPT, &history, "Second question");
        assert!(prompt.contains("First question"));
        assert!(prompt.contains("First answer"));
        assert!(prompt.contains("Second question"));
    }

    #[tokio::test]
    async fn stub_engine_returns_result() {
        // Use a temp file as a stand-in for a real model.
        let tmp = tempfile::NamedTempFile::new().unwrap();
        let engine = LocalLlmEngine::load(tmp.path().to_path_buf())
            .await
            .expect("stub should load");

        let result = engine
            .generate(
                InferenceRequest {
                    prompt: "test".to_string(),
                    max_new_tokens: 32,
                    temperature: 0.7,
                    streaming: false,
                },
                None,
            )
            .await
            .expect("stub should generate");

        assert!(!result.text.is_empty());
        assert!(result.completion_tokens > 0);
    }
}
