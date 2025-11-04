// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025 Zipminator Project

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Once;
use tracing::{debug, error, info, trace, warn, Level};
use tracing_appender::rolling::{RollingFileAppender, Rotation};
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

static LOGGER_INIT: Once = Once::new();

/// Log level configuration
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum LogLevel {
    Trace,
    Debug,
    Info,
    Warn,
    Error,
}

impl From<LogLevel> for Level {
    fn from(level: LogLevel) -> Self {
        match level {
            LogLevel::Trace => Level::TRACE,
            LogLevel::Debug => Level::DEBUG,
            LogLevel::Info => Level::INFO,
            LogLevel::Warn => Level::WARN,
            LogLevel::Error => Level::ERROR,
        }
    }
}

/// Logging configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogConfig {
    pub level: LogLevel,
    pub use_json_format: bool,
    pub log_to_console: bool,
    pub log_to_file: bool,
    pub log_file_path: PathBuf,
    pub max_file_size: usize,
    pub sensitive_data_masking: bool,
    pub include_thread_id: bool,
    pub include_target: bool,
}

impl Default for LogConfig {
    fn default() -> Self {
        Self {
            level: LogLevel::Info,
            use_json_format: true,
            log_to_console: true,
            log_to_file: true,
            log_file_path: PathBuf::from("/var/log/zipminator/app.log"),
            max_file_size: 10 * 1024 * 1024, // 10 MB
            sensitive_data_masking: true,
            include_thread_id: true,
            include_target: true,
        }
    }
}

/// Initialize the logging system
pub fn initialize_logging(config: &LogConfig) -> Result<(), Box<dyn std::error::Error>> {
    LOGGER_INIT.call_once(|| {
        let env_filter = EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| {
                let level: Level = config.level.into();
                EnvFilter::new(format!("zipminator={}", level))
            });

        let mut layers = Vec::new();

        // Console layer
        if config.log_to_console {
            let console_layer = if config.use_json_format {
                fmt::layer()
                    .json()
                    .with_thread_ids(config.include_thread_id)
                    .with_target(config.include_target)
                    .boxed()
            } else {
                fmt::layer()
                    .pretty()
                    .with_thread_ids(config.include_thread_id)
                    .with_target(config.include_target)
                    .boxed()
            };
            layers.push(console_layer);
        }

        // File layer
        if config.log_to_file {
            if let Some(parent) = config.log_file_path.parent() {
                std::fs::create_dir_all(parent).ok();
            }

            let file_appender = RollingFileAppender::new(
                Rotation::DAILY,
                config.log_file_path.parent().unwrap_or_else(|| std::path::Path::new(".")),
                config.log_file_path.file_name().unwrap_or_else(|| std::ffi::OsStr::new("zipminator.log")),
            );

            let file_layer = if config.use_json_format {
                fmt::layer()
                    .json()
                    .with_writer(file_appender)
                    .with_thread_ids(config.include_thread_id)
                    .with_target(config.include_target)
                    .boxed()
            } else {
                fmt::layer()
                    .with_writer(file_appender)
                    .with_thread_ids(config.include_thread_id)
                    .with_target(config.include_target)
                    .boxed()
            };
            layers.push(file_layer);
        }

        tracing_subscriber::registry()
            .with(env_filter)
            .with(layers)
            .init();
    });

    info!("Zipminator logging initialized");
    info!("Log level: {:?}", config.level);
    info!("JSON format: {}", config.use_json_format);

    Ok(())
}

/// Mask sensitive data in strings
pub fn mask_sensitive_data(input: &str) -> String {
    use regex::Regex;

    lazy_static::lazy_static! {
        static ref KEY_PATTERN: Regex = Regex::new(r"\b[A-Fa-f0-9]{64}\b").unwrap();
        static ref BASE64_PATTERN: Regex = Regex::new(r"\b[A-Za-z0-9+/]{43}=\b").unwrap();
        static ref SECRET_PATTERN: Regex = Regex::new(r"(?i)secret[_-]?key[:\s]*[A-Za-z0-9+/=]+").unwrap();
        static ref PRIVATE_PATTERN: Regex = Regex::new(r"(?i)private[_-]?key[:\s]*[A-Za-z0-9+/=]+").unwrap();
        static ref PASSWORD_PATTERN: Regex = Regex::new(r"(?i)password[:\s]*\S+").unwrap();
    }

    let mut result = input.to_string();
    result = KEY_PATTERN.replace_all(&result, "[REDACTED]").to_string();
    result = BASE64_PATTERN.replace_all(&result, "[REDACTED]").to_string();
    result = SECRET_PATTERN.replace_all(&result, "[REDACTED]").to_string();
    result = PRIVATE_PATTERN.replace_all(&result, "[REDACTED]").to_string();
    result = PASSWORD_PATTERN.replace_all(&result, "[REDACTED]").to_string();

    result
}

/// Log scope RAII guard for automatic enter/exit logging
pub struct LogScope {
    name: String,
    start: std::time::Instant,
}

impl LogScope {
    pub fn new(name: impl Into<String>) -> Self {
        let name = name.into();
        debug!("Entering scope: {}", name);
        Self {
            name,
            start: std::time::Instant::now(),
        }
    }
}

impl Drop for LogScope {
    fn drop(&mut self) {
        let duration = self.start.elapsed();
        debug!("Exiting scope: {} (duration: {:?})", self.name, duration);
    }
}

/// Macro for creating log scopes
#[macro_export]
macro_rules! log_scope {
    ($name:expr) => {
        let _log_scope = $crate::logging::LogScope::new($name);
    };
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sensitive_data_masking() {
        let input = "secret_key: 1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
        let masked = mask_sensitive_data(input);
        assert!(masked.contains("[REDACTED]"));
        assert!(!masked.contains("1234567890abcdef"));
    }

    #[test]
    fn test_log_scope() {
        let _scope = LogScope::new("test_function");
        // Scope will automatically log on drop
    }
}
