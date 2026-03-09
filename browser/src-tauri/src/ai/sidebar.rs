//! AI sidebar state management and Tauri command handlers.
//!
//! This module is the bridge between the Tauri frontend (React) and the
//! AI inference backends (local + cloud). It:
//!
//! - Maintains [`SidebarState`] in the Tauri app state (a `Mutex`-guarded struct).
//! - Exposes Tauri commands invoked by the React UI via `invoke()`.
//! - Emits Tauri events for streaming token delivery.
//! - Handles page content extraction from the active webview.

use std::path::PathBuf;
use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::sync::{mpsc, Mutex};

use crate::ai::cloud_llm::{CloudClientConfig, CloudLlmClient, CloudTokenEvent};
use crate::ai::config::{AiConfig, AiConfigPublic, AiMode};
use crate::ai::local_llm::{
    ChatMessage, InferenceRequest, LocalLlmEngine, Role, TokenEvent,
    CHAT_SYSTEM_PROMPT, SUMMARIZE_SYSTEM_PROMPT, WRITING_SYSTEM_PROMPT,
};
use crate::ai::page_context::{PageContext, RawPageData};

// ---------------------------------------------------------------------------
// Event names emitted to the frontend
// ---------------------------------------------------------------------------

/// Event emitted for each token in a streaming local response.
pub const EVENT_AI_TOKEN: &str = "ai-token-generated";
/// Event emitted when the AI starts generating (used to show a spinner).
pub const EVENT_AI_START: &str = "ai-generation-start";
/// Event emitted when the AI finishes generating.
pub const EVENT_AI_DONE: &str = "ai-generation-done";
/// Event emitted on model download progress.
pub const EVENT_MODEL_DOWNLOAD: &str = "ai-model-download";
/// Event emitted when an error occurs in the AI pipeline.
pub const EVENT_AI_ERROR: &str = "ai-error";

// ---------------------------------------------------------------------------
// Sidebar state (held in Tauri's managed state)
// ---------------------------------------------------------------------------

/// Mutable sidebar state shared across Tauri command handlers.
pub struct SidebarState {
    pub config: AiConfig,
    /// Loaded local inference engine (`None` until the model is loaded).
    pub local_engine: Option<LocalLlmEngine>,
    /// Cloud client (`None` until the config is valid).
    pub cloud_client: Option<CloudLlmClient>,
    /// Per-tab chat history keyed by tab ID.
    pub chat_histories: std::collections::HashMap<String, Vec<ChatMessage>>,
    /// PQC proxy port (forwarded from the proxy module at startup).
    pub proxy_port: Option<u16>,
}

impl Default for SidebarState {
    fn default() -> Self {
        Self {
            config: AiConfig::default(),
            local_engine: None,
            cloud_client: None,
            chat_histories: std::collections::HashMap::new(),
            proxy_port: None,
        }
    }
}

/// Thread-safe handle to [`SidebarState`].
pub type AiState = Arc<Mutex<SidebarState>>;

// ---------------------------------------------------------------------------
// Command input / output types
// ---------------------------------------------------------------------------

/// Request payload for `ai_chat`.
#[derive(Debug, Deserialize)]
pub struct ChatRequest {
    /// Identifier of the browser tab (for history isolation).
    pub tab_id: String,
    /// The user's new message.
    pub message: String,
    /// Current page context (if "Ask about this page" is active).
    pub page_context: Option<PageContext>,
}

/// Request payload for `ai_summarize`.
#[derive(Debug, Deserialize)]
pub struct SummarizeRequest {
    pub page_context: PageContext,
}

/// Request payload for `ai_rewrite`.
#[derive(Debug, Deserialize)]
pub struct RewriteRequest {
    pub text: String,
    pub action: WritingAction,
    pub tone: Option<WritingTone>,
}

/// Writing transformation action.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum WritingAction {
    Rewrite,
    Simplify,
    Expand,
    FixGrammar,
    Translate,
}

/// Writing tone modifier.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum WritingTone {
    Professional,
    Casual,
    Academic,
    Creative,
}

/// Generic response sent back to the frontend for non-streaming calls.
#[derive(Debug, Serialize)]
pub struct AiResponse {
    pub text: String,
    pub mode: AiMode,
}

/// Error wrapper that Tauri can serialise and send to the frontend.
#[derive(Debug, Serialize)]
pub struct AiError {
    pub message: String,
    pub code: String,
}

impl AiError {
    fn new(code: impl Into<String>, msg: impl Into<String>) -> Self {
        Self {
            message: msg.into(),
            code: code.into(),
        }
    }
}

// ---------------------------------------------------------------------------
// Tauri commands
// ---------------------------------------------------------------------------

/// Return the current AI configuration (safe subset without raw keys).
#[tauri::command]
pub async fn ai_get_config(state: State<'_, AiState>) -> Result<AiConfigPublic, AiError> {
    let guard = state.lock().await;
    Ok(AiConfigPublic::from(&guard.config))
}

/// Update AI configuration from the settings panel.
#[tauri::command]
pub async fn ai_set_config(
    state: State<'_, AiState>,
    app: AppHandle,
    new_config: AiConfig,
) -> Result<AiConfigPublic, AiError> {
    let mut guard = state.lock().await;
    guard.config = new_config;

    // Re-build the cloud client if cloud mode is now active.
    if guard.config.mode == AiMode::Cloud {
        guard.cloud_client = build_cloud_client(&guard.config, guard.proxy_port);
    }

    let public = AiConfigPublic::from(&guard.config);

    // Emit config-changed event so other windows can react.
    let _ = app.emit("ai-config-changed", &public);

    Ok(public)
}

/// Extract the current page's content and return it as structured context.
///
/// The frontend calls this, which in turn injects the JS extraction snippet
/// into the active webview. The result is returned synchronously here because
/// Tauri commands are async.
#[tauri::command]
pub async fn ai_extract_page_context(
    state: State<'_, AiState>,
    raw: RawPageData,
) -> Result<PageContext, AiError> {
    let guard = state.lock().await;
    let max_tokens = guard.config.effective_context_window();
    Ok(raw.into_page_context(max_tokens))
}

/// Send a chat message. Streams tokens back via `ai-token-generated` events.
///
/// Returns the full response text once generation is complete (useful for
/// non-streaming callers that just need the result).
#[tauri::command]
pub async fn ai_chat(
    state: State<'_, AiState>,
    app: AppHandle,
    request: ChatRequest,
) -> Result<AiResponse, AiError> {
    let (mode, engine_opt, cloud_opt, history, config_snapshot) = {
        let mut guard = state.lock().await;

        // Build user message, optionally prefixed with page context.
        let user_msg = if let Some(ctx) = &request.page_context {
            format!(
                "Page context:\n{}\n\n---\n\nUser question: {}",
                ctx.to_prompt_context(),
                request.message
            )
        } else {
            request.message.clone()
        };

        // Update history with user turn.
        let history = guard
            .chat_histories
            .entry(request.tab_id.clone())
            .or_default();
        history.push(ChatMessage {
            role: Role::User,
            content: user_msg.clone(),
        });

        // Clone what we need so we can release the mutex before I/O.
        let history_snapshot = history.clone();
        let mode = guard.config.mode;
        let engine_opt = guard.local_engine.clone();
        let cloud_opt = guard.cloud_client.as_ref().map(|_| ());
        let config = guard.config.clone();

        (mode, engine_opt, cloud_opt, history_snapshot, config)
    };

    let _ = app.emit(EVENT_AI_START, ());

    let result_text = match mode {
        AiMode::Local => {
            run_local_chat(&app, engine_opt, &history, &config_snapshot).await?
        }
        AiMode::Cloud => {
            run_cloud_chat(&app, &state, &history, &config_snapshot).await?
        }
        AiMode::Off => {
            return Err(AiError::new("ai_disabled", "AI assistant is turned off."));
        }
    };

    // Persist assistant response to history.
    {
        let mut guard = state.lock().await;
        if let Some(history) = guard.chat_histories.get_mut(&request.tab_id) {
            history.push(ChatMessage {
                role: Role::Assistant,
                content: result_text.clone(),
            });
        }
    }

    let _ = app.emit(EVENT_AI_DONE, ());

    Ok(AiResponse {
        text: result_text,
        mode,
    })
}

/// Summarise the current page content.
#[tauri::command]
pub async fn ai_summarize(
    state: State<'_, AiState>,
    app: AppHandle,
    request: SummarizeRequest,
) -> Result<AiResponse, AiError> {
    let (mode, engine_opt, config_snapshot) = {
        let guard = state.lock().await;
        (
            guard.config.mode,
            guard.local_engine.clone(),
            guard.config.clone(),
        )
    };

    let _ = app.emit(EVENT_AI_START, ());

    let prompt_content = request.page_context.to_prompt_context();

    let history = vec![ChatMessage {
        role: Role::User,
        content: format!(
            "Please summarise the following web page:\n\n{prompt_content}"
        ),
    }];

    let result_text = match mode {
        AiMode::Local => {
            let full_prompt = crate::ai::local_llm::format_phi3_prompt(
                SUMMARIZE_SYSTEM_PROMPT,
                &[],
                &history[0].content,
            );
            let (tx, mut rx) = mpsc::channel::<TokenEvent>(128);
            let engine = engine_opt.ok_or_else(|| {
                AiError::new("no_model", "Local model not loaded. Please download the model.")
            })?;

            let app_clone = app.clone();
            tokio::spawn(async move {
                while let Some(event) = rx.recv().await {
                    let _ = app_clone.emit(EVENT_AI_TOKEN, &event);
                }
            });

            let result = engine
                .generate(
                    InferenceRequest {
                        prompt: full_prompt,
                        max_new_tokens: config_snapshot.max_tokens,
                        temperature: config_snapshot.temperature,
                        streaming: config_snapshot.streaming,
                    },
                    Some(tx),
                )
                .await
                .map_err(|e| AiError::new("inference_error", e.to_string()))?;

            result.text
        }
        AiMode::Cloud => {
            run_cloud_chat(&app, &state, &history, &config_snapshot).await?
        }
        AiMode::Off => {
            return Err(AiError::new("ai_disabled", "AI assistant is turned off."));
        }
    };

    let _ = app.emit(EVENT_AI_DONE, ());

    Ok(AiResponse {
        text: result_text,
        mode,
    })
}

/// Rewrite / transform text using the writing assistant.
#[tauri::command]
pub async fn ai_rewrite(
    state: State<'_, AiState>,
    app: AppHandle,
    request: RewriteRequest,
) -> Result<AiResponse, AiError> {
    let action_instruction = match request.action {
        WritingAction::Rewrite => "Rewrite the following text to be clearer and more engaging.",
        WritingAction::Simplify => "Simplify the following text so that a general audience can understand it easily.",
        WritingAction::Expand => "Expand the following text with more detail and supporting information.",
        WritingAction::FixGrammar => "Fix all grammar, punctuation, and spelling errors in the following text. Keep the meaning unchanged.",
        WritingAction::Translate => "Translate the following text to English (if not already English), or to Spanish (if in English).",
    };

    let tone_instruction = request.tone.as_ref().map(|t| match t {
        WritingTone::Professional => " Use a professional, formal tone.",
        WritingTone::Casual => " Use a casual, conversational tone.",
        WritingTone::Academic => " Use an academic, scholarly tone with precise language.",
        WritingTone::Creative => " Use a creative, expressive tone.",
    }).unwrap_or("");

    let user_message = format!(
        "{action_instruction}{tone_instruction}\n\nText:\n{text}",
        text = request.text
    );

    let (mode, engine_opt, config_snapshot) = {
        let guard = state.lock().await;
        (
            guard.config.mode,
            guard.local_engine.clone(),
            guard.config.clone(),
        )
    };

    let _ = app.emit(EVENT_AI_START, ());

    let history = vec![ChatMessage {
        role: Role::User,
        content: user_message,
    }];

    let result_text = match mode {
        AiMode::Local => {
            let full_prompt = crate::ai::local_llm::format_phi3_prompt(
                WRITING_SYSTEM_PROMPT,
                &[],
                &history[0].content,
            );
            let (tx, mut rx) = mpsc::channel::<TokenEvent>(128);
            let engine = engine_opt.ok_or_else(|| {
                AiError::new("no_model", "Local model not loaded.")
            })?;

            let app_clone = app.clone();
            tokio::spawn(async move {
                while let Some(event) = rx.recv().await {
                    let _ = app_clone.emit(EVENT_AI_TOKEN, &event);
                }
            });

            let result = engine
                .generate(
                    InferenceRequest {
                        prompt: full_prompt,
                        max_new_tokens: config_snapshot.max_tokens,
                        temperature: config_snapshot.temperature,
                        streaming: config_snapshot.streaming,
                    },
                    Some(tx),
                )
                .await
                .map_err(|e| AiError::new("inference_error", e.to_string()))?;

            result.text
        }
        AiMode::Cloud => run_cloud_chat(&app, &state, &history, &config_snapshot).await?,
        AiMode::Off => {
            return Err(AiError::new("ai_disabled", "AI assistant is turned off."));
        }
    };

    let _ = app.emit(EVENT_AI_DONE, ());

    Ok(AiResponse {
        text: result_text,
        mode,
    })
}

/// Clear the chat history for a specific tab.
#[tauri::command]
pub async fn ai_clear_history(
    state: State<'_, AiState>,
    tab_id: String,
) -> Result<(), AiError> {
    let mut guard = state.lock().await;
    guard.chat_histories.remove(&tab_id);
    Ok(())
}

/// Download the default local model, streaming progress events.
#[tauri::command]
pub async fn ai_download_model(
    state: State<'_, AiState>,
    app: AppHandle,
    dest_dir: String,
) -> Result<String, AiError> {
    use crate::ai::local_llm::{ensure_model_downloaded, DownloadProgress};

    let (tx, mut rx) = mpsc::channel::<DownloadProgress>(32);
    let app_clone = app.clone();

    // Forward download progress to the frontend.
    tokio::spawn(async move {
        while let Some(progress) = rx.recv().await {
            let _ = app_clone.emit(EVENT_MODEL_DOWNLOAD, &progress);
        }
    });

    let path = ensure_model_downloaded(std::path::Path::new(&dest_dir), Some(tx))
        .await
        .map_err(|e| AiError::new("download_failed", e.to_string()))?;

    // Load the engine now that the model is present.
    let engine = LocalLlmEngine::load(path.clone())
        .await
        .map_err(|e| AiError::new("load_failed", e.to_string()))?;

    {
        let mut guard = state.lock().await;
        guard.local_engine = Some(engine);
        guard.config.local_model_path = Some(path.clone());
    }

    Ok(path.display().to_string())
}

/// Load a local model from an existing file path.
#[tauri::command]
pub async fn ai_load_model(
    state: State<'_, AiState>,
    model_path: String,
) -> Result<String, AiError> {
    let path = PathBuf::from(&model_path);
    let engine = LocalLlmEngine::load(path.clone())
        .await
        .map_err(|e| AiError::new("load_failed", e.to_string()))?;

    {
        let mut guard = state.lock().await;
        guard.local_engine = Some(engine);
        guard.config.local_model_path = Some(path);
    }

    Ok(model_path)
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

fn build_cloud_client(config: &AiConfig, proxy_port: Option<u16>) -> Option<CloudLlmClient> {
    let key = config.cloud_api_key.as_ref()?.clone();
    CloudLlmClient::new(CloudClientConfig {
        endpoint: config.cloud_api_endpoint.clone(),
        api_key: key,
        model: config.cloud_model.clone(),
        max_tokens: config.max_tokens,
        temperature: config.temperature,
        timeout_secs: config.cloud_timeout_secs,
        max_retries: config.cloud_max_retries,
        proxy_port,
    })
    .ok()
}

async fn run_local_chat(
    app: &AppHandle,
    engine_opt: Option<LocalLlmEngine>,
    history: &[ChatMessage],
    config: &AiConfig,
) -> Result<String, AiError> {
    let engine = engine_opt.ok_or_else(|| {
        AiError::new("no_model", "Local model not loaded. Please download the model first.")
    })?;

    let last_user_msg = history
        .iter()
        .filter(|m| m.role == Role::User)
        .last()
        .map(|m| m.content.as_str())
        .unwrap_or("");

    let prior_history = if history.len() > 1 {
        &history[..history.len() - 1]
    } else {
        &[]
    };

    let full_prompt =
        crate::ai::local_llm::format_phi3_prompt(CHAT_SYSTEM_PROMPT, prior_history, last_user_msg);

    let (tx, mut rx) = mpsc::channel::<TokenEvent>(128);
    let app_clone = app.clone();

    tokio::spawn(async move {
        while let Some(event) = rx.recv().await {
            let _ = app_clone.emit(EVENT_AI_TOKEN, &event);
        }
    });

    let result = engine
        .generate(
            InferenceRequest {
                prompt: full_prompt,
                max_new_tokens: config.max_tokens,
                temperature: config.temperature,
                streaming: config.streaming,
            },
            Some(tx),
        )
        .await
        .map_err(|e| AiError::new("inference_error", e.to_string()))?;

    Ok(result.text)
}

async fn run_cloud_chat(
    app: &AppHandle,
    state: &State<'_, AiState>,
    history: &[ChatMessage],
    config: &AiConfig,
) -> Result<String, AiError> {
    let key = config
        .cloud_api_key
        .as_ref()
        .ok_or_else(|| AiError::new("no_api_key", "No cloud API key configured."))?
        .clone();

    let proxy_port = state.lock().await.proxy_port;

    let client = CloudLlmClient::new(CloudClientConfig {
        endpoint: config.cloud_api_endpoint.clone(),
        api_key: key,
        model: config.cloud_model.clone(),
        max_tokens: config.max_tokens,
        temperature: config.temperature,
        timeout_secs: config.cloud_timeout_secs,
        max_retries: config.cloud_max_retries,
        proxy_port,
    })
    .map_err(|e| AiError::new("client_init", e.to_string()))?;

    let system = crate::ai::cloud_llm::cloud_system_prompt(CHAT_SYSTEM_PROMPT);

    let prior_history = if history.len() > 1 {
        &history[..history.len() - 1]
    } else {
        &[]
    };

    let last_user_msg = history
        .iter()
        .filter(|m| m.role == Role::User)
        .last()
        .map(|m| m.content.as_str())
        .unwrap_or("");

    let (tx, mut rx) = mpsc::channel::<CloudTokenEvent>(128);
    let app_clone = app.clone();

    tokio::spawn(async move {
        while let Some(event) = rx.recv().await {
            let token_event = TokenEvent {
                token: event.token,
                done: event.done,
            };
            let _ = app_clone.emit(EVENT_AI_TOKEN, &token_event);
        }
    });

    let result = client
        .chat(&system, prior_history, last_user_msg, Some(tx))
        .await
        .map_err(|e| AiError::new("cloud_error", e.to_string()))?;

    Ok(result.text)
}

// ---------------------------------------------------------------------------
// Command registration helper
// ---------------------------------------------------------------------------

/// Register all AI sidebar Tauri commands.
///
/// Call this from `main.rs` inside the `tauri::Builder` chain:
/// ```ignore
/// .invoke_handler(tauri::generate_handler![
///     ...
///     ...ai::sidebar::tauri_commands()...,
/// ])
/// ```
///
/// Because `tauri::generate_handler!` is a macro, the individual command
/// function names are listed in `mod.rs` alongside the macro invocation.
pub fn initial_state(proxy_port: Option<u16>) -> AiState {
    Arc::new(Mutex::new(SidebarState {
        proxy_port,
        ..Default::default()
    }))
}
