//! AI sidebar module.
//!
//! Re-exports the public API and provides the Tauri command list for
//! registration in `main.rs`.
//!
//! ## Feature flag: `local-llm`
//!
//! Compile with `--features local-llm` to enable real `candle`-based
//! inference. Without it, local inference returns a stub response (useful
//! for CI and UI-only development builds).
//!
//! ## Feature flag: `tauri-shell`
//!
//! The `sidebar` module (Tauri commands) is gated behind `tauri-shell`.
//! Core AI types (config, page_context, local_llm, cloud_llm) compile
//! without Tauri and can be used in unit tests independently.

pub mod cloud_llm;
pub mod config;
pub mod local_llm;
pub mod page_context;

#[cfg(feature = "tauri-shell")]
pub mod sidebar;

pub use config::{AiConfig, AiMode};

#[cfg(feature = "tauri-shell")]
pub use sidebar::{
    AiState,
    ai_chat,
    ai_clear_history,
    ai_download_model,
    ai_extract_page_context,
    ai_get_config,
    ai_load_model,
    ai_rewrite,
    ai_set_config,
    ai_summarize,
    initial_state,
};
