//! AI sidebar configuration.
//!
//! Defines the runtime configuration for the AI assistant including
//! mode selection (local vs. cloud), model paths, API endpoints,
//! and generation parameters.

use std::path::PathBuf;

use serde::{Deserialize, Serialize};

/// Which inference backend the AI sidebar uses.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum AiMode {
    /// Run inference locally — no data leaves the device.
    #[default]
    Local,
    /// Route requests through the PQC proxy to a cloud API.
    Cloud,
    /// AI sidebar is disabled entirely.
    Off,
}

/// Full AI sidebar configuration.
///
/// Stored in the Tauri app-data directory as `ai_config.json`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiConfig {
    /// Active inference mode.
    pub mode: AiMode,

    /// Absolute path to the GGUF model file used for local inference.
    /// `None` if the model has not been downloaded yet.
    pub local_model_path: Option<PathBuf>,

    /// Base URL for the OpenAI-compatible cloud API
    /// (e.g. `https://api.openai.com/v1`).
    pub cloud_api_endpoint: String,

    /// Encrypted API key blob. The key is stored as a hex-encoded ciphertext
    /// produced by the Tauri keystore plugin. `None` until the user enters a key.
    pub cloud_api_key: Option<String>,

    /// Cloud model identifier (e.g. `"gpt-4o"`, `"claude-3-opus-20240229"`).
    pub cloud_model: String,

    /// Maximum tokens the model may generate in a single response.
    pub max_tokens: usize,

    /// Sampling temperature in `[0.0, 1.0]`. Lower values are more deterministic.
    pub temperature: f32,

    /// Context window size in tokens.
    /// Recommended: 4096 for local, 8192 for cloud.
    pub context_window: usize,

    /// Whether to stream tokens back to the frontend as they are generated.
    pub streaming: bool,

    /// Timeout for cloud API requests in seconds.
    pub cloud_timeout_secs: u64,

    /// Maximum retries for failed cloud requests.
    pub cloud_max_retries: u32,
}

impl Default for AiConfig {
    fn default() -> Self {
        Self {
            mode: AiMode::Local,
            local_model_path: None,
            cloud_api_endpoint: "https://api.openai.com/v1".to_string(),
            cloud_api_key: None,
            cloud_model: "gpt-4o".to_string(),
            max_tokens: 1024,
            temperature: 0.7,
            context_window: 4096,
            streaming: true,
            cloud_timeout_secs: 30,
            cloud_max_retries: 3,
        }
    }
}

impl AiConfig {
    /// Return the effective context window for the current mode.
    pub fn effective_context_window(&self) -> usize {
        match self.mode {
            AiMode::Local => self.context_window.min(4096),
            AiMode::Cloud => self.context_window.min(8192),
            AiMode::Off => 0,
        }
    }

    /// Return `true` if the configuration is valid for the current mode.
    pub fn is_valid(&self) -> bool {
        match self.mode {
            AiMode::Local => {
                // Local mode only needs a model path (or pending download).
                true
            }
            AiMode::Cloud => {
                // Cloud mode needs an API endpoint and a key.
                !self.cloud_api_endpoint.is_empty() && self.cloud_api_key.is_some()
            }
            AiMode::Off => true,
        }
    }

    /// Override the mode and adjust the context window accordingly.
    pub fn with_mode(mut self, mode: AiMode) -> Self {
        self.mode = mode;
        self.context_window = match mode {
            AiMode::Local => 4096,
            AiMode::Cloud => 8192,
            AiMode::Off => 0,
        };
        self
    }
}

/// A lightweight version of the config that is safe to send to the frontend
/// (no raw API keys, only a flag indicating whether a key is set).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiConfigPublic {
    pub mode: AiMode,
    pub local_model_path: Option<String>,
    pub cloud_api_endpoint: String,
    pub has_cloud_api_key: bool,
    pub cloud_model: String,
    pub max_tokens: usize,
    pub temperature: f32,
    pub context_window: usize,
    pub streaming: bool,
}

impl From<&AiConfig> for AiConfigPublic {
    fn from(cfg: &AiConfig) -> Self {
        Self {
            mode: cfg.mode,
            local_model_path: cfg
                .local_model_path
                .as_ref()
                .and_then(|p| p.to_str().map(str::to_string)),
            cloud_api_endpoint: cfg.cloud_api_endpoint.clone(),
            has_cloud_api_key: cfg.cloud_api_key.is_some(),
            cloud_model: cfg.cloud_model.clone(),
            max_tokens: cfg.max_tokens,
            temperature: cfg.temperature,
            context_window: cfg.context_window,
            streaming: cfg.streaming,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_config_is_local_mode() {
        let cfg = AiConfig::default();
        assert_eq!(cfg.mode, AiMode::Local);
        assert!(cfg.is_valid());
    }

    #[test]
    fn cloud_mode_invalid_without_key() {
        let cfg = AiConfig::default().with_mode(AiMode::Cloud);
        assert!(!cfg.is_valid());
    }

    #[test]
    fn cloud_mode_valid_with_key() {
        let mut cfg = AiConfig::default().with_mode(AiMode::Cloud);
        cfg.cloud_api_key = Some("encrypted_blob".to_string());
        assert!(cfg.is_valid());
    }

    #[test]
    fn context_window_clamped_for_local() {
        let mut cfg = AiConfig::default();
        cfg.context_window = 99_999;
        assert_eq!(cfg.effective_context_window(), 4096);
    }

    #[test]
    fn public_config_hides_api_key() {
        let mut cfg = AiConfig::default().with_mode(AiMode::Cloud);
        cfg.cloud_api_key = Some("secret".to_string());
        let public = AiConfigPublic::from(&cfg);
        assert!(public.has_cloud_api_key);
        // Raw key must not appear
        let json = serde_json::to_string(&public).unwrap();
        assert!(!json.contains("secret"));
    }
}
