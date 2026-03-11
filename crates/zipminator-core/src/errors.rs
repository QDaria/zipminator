// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025 Zipminator Project

#[cfg(feature = "config")]
use serde::{Deserialize, Serialize};
use std::fmt;
use thiserror::Error;

/// Error codes matching C++ implementation for ABI compatibility
#[repr(u32)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[cfg_attr(feature = "config", derive(Serialize, Deserialize))]
pub enum ErrorCode {
    // Success (0x0000)
    Success = 0x0000,

    // QRNG Errors (0x1000-0x1FFF)
    QrngInitializationFailed = 0x1001,
    QrngHealthCheckFailed = 0x1002,
    QrngDeviceNotFound = 0x1003,
    QrngDeviceDisconnected = 0x1004,
    QrngInsufficientEntropy = 0x1005,
    QrngEntropyTestFailed = 0x1006,

    // Cryptographic Errors (0x2000-0x2FFF)
    InvalidPublicKey = 0x2001,
    InvalidSecretKey = 0x2002,
    InvalidCiphertext = 0x2003,
    InvalidSharedSecret = 0x2004,
    KeyGenerationFailed = 0x2005,
    EncapsulationFailed = 0x2006,
    DecapsulationFailed = 0x2007,
    SignatureVerificationFailed = 0x2008,

    // Memory Errors (0x3000-0x3FFF)
    MemoryAllocationFailed = 0x3001,
    BufferOverflowDetected = 0x3002,
    InvalidMemoryAccess = 0x3003,
    OutOfMemory = 0x3004,

    // Configuration Errors (0x4000-0x4FFF)
    InvalidConfiguration = 0x4001,
    MissingConfiguration = 0x4002,
    ConfigFileNotFound = 0x4003,
    ConfigParseError = 0x4004,

    // System Errors (0x5000-0x5FFF)
    IoError = 0x5001,
    Timeout = 0x5002,
    ResourceExhausted = 0x5003,
    PermissionDenied = 0x5004,

    // Internal Errors (0xF000-0xFFFF)
    InternalError = 0xF001,
    NotImplemented = 0xF002,
    AssertionFailed = 0xF003,
    InvariantViolation = 0xF004,
}

impl fmt::Display for ErrorCode {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

/// Error severity levels
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
#[cfg_attr(feature = "config", derive(Serialize, Deserialize))]
pub enum ErrorSeverity {
    Info = 0,
    Warning = 1,
    Error = 2,
    Critical = 3,
    Fatal = 4,
}

impl fmt::Display for ErrorSeverity {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Info => write!(f, "INFO"),
            Self::Warning => write!(f, "WARNING"),
            Self::Error => write!(f, "ERROR"),
            Self::Critical => write!(f, "CRITICAL"),
            Self::Fatal => write!(f, "FATAL"),
        }
    }
}

/// Error context with location information
#[derive(Debug, Clone)]
#[cfg_attr(feature = "config", derive(Serialize, Deserialize))]
pub struct ErrorContext {
    pub file: String,
    pub line: u32,
    pub column: u32,
    pub operation: Option<String>,
    pub details: Option<String>,
    #[cfg_attr(feature = "config", serde(skip, default = "std::time::SystemTime::now"))]
    pub timestamp: std::time::SystemTime,
}

impl ErrorContext {
    pub fn new(file: &str, line: u32, column: u32) -> Self {
        Self {
            file: file.to_string(),
            line,
            column,
            operation: None,
            details: None,
            timestamp: std::time::SystemTime::now(),
        }
    }

    pub fn with_operation(mut self, operation: impl Into<String>) -> Self {
        self.operation = Some(operation.into());
        self
    }

    pub fn with_details(mut self, details: impl Into<String>) -> Self {
        self.details = Some(details.into());
        self
    }
}

/// Main error type for Zipminator operations
#[derive(Error, Debug, Clone)]
#[cfg_attr(feature = "config", derive(Serialize, Deserialize))]
pub struct ZipminatorError {
    pub code: ErrorCode,
    pub severity: ErrorSeverity,
    pub message: String,
    pub context: ErrorContext,
    #[cfg_attr(feature = "config", serde(skip))]
    pub source: Option<Box<ZipminatorError>>,
}

impl fmt::Display for ZipminatorError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "[{}] {} (0x{:04X}): {}",
            self.severity,
            self.code,
            self.code as u32,
            self.message
        )?;

        if let Some(ref operation) = self.context.operation {
            write!(f, "\n  Operation: {}", operation)?;
        }

        if let Some(ref details) = self.context.details {
            write!(f, "\n  Details: {}", details)?;
        }

        write!(
            f,
            "\n  Location: {}:{}:{}",
            self.context.file, self.context.line, self.context.column
        )?;

        if let Some(ref source) = self.source {
            write!(f, "\nCaused by: {}", source)?;
        }

        Ok(())
    }
}

impl ZipminatorError {
    pub fn new(
        code: ErrorCode,
        message: impl Into<String>,
        severity: ErrorSeverity,
        context: ErrorContext,
    ) -> Self {
        Self {
            code,
            severity,
            message: message.into(),
            context,
            source: None,
        }
    }

    pub fn with_source(mut self, source: ZipminatorError) -> Self {
        self.source = Some(Box::new(source));
        self
    }

    #[cfg(feature = "config")]
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "error_code": format!("{:?}", self.code),
            "error_code_value": self.code as u32,
            "severity": format!("{}", self.severity),
            "message": self.message,
            "location": {
                "file": self.context.file,
                "line": self.context.line,
                "column": self.context.column,
            },
            "operation": self.context.operation,
            "details": self.context.details,
            "source": self.source.as_ref().map(|s| s.to_json()),
        })
    }
}

/// Result type alias for Zipminator operations
pub type Result<T> = std::result::Result<T, ZipminatorError>;

/// Macro for creating errors with location information
#[macro_export]
macro_rules! zipminator_error {
    ($code:expr, $msg:expr) => {
        $crate::errors::ZipminatorError::new(
            $code,
            $msg,
            $crate::errors::ErrorSeverity::Error,
            $crate::errors::ErrorContext::new(file!(), line!(), column!()),
        )
    };
    ($code:expr, $msg:expr, $severity:expr) => {
        $crate::errors::ZipminatorError::new(
            $code,
            $msg,
            $severity,
            $crate::errors::ErrorContext::new(file!(), line!(), column!()),
        )
    };
}

/// Macro for propagating errors with context
#[macro_export]
macro_rules! zipminator_try {
    ($expr:expr) => {
        match $expr {
            Ok(val) => val,
            Err(err) => return Err(err),
        }
    };
}

/// Convert standard IO errors to Zipminator errors
impl From<std::io::Error> for ZipminatorError {
    fn from(err: std::io::Error) -> Self {
        ZipminatorError::new(
            ErrorCode::IoError,
            format!("IO error: {}", err),
            ErrorSeverity::Error,
            ErrorContext::new("", 0, 0),
        )
    }
}

/// Convert serde JSON errors to Zipminator errors
#[cfg(feature = "config")]
impl From<serde_json::Error> for ZipminatorError {
    fn from(err: serde_json::Error) -> Self {
        ZipminatorError::new(
            ErrorCode::ConfigParseError,
            format!("JSON parse error: {}", err),
            ErrorSeverity::Error,
            ErrorContext::new("", 0, 0),
        )
    }
}

/// Convert QRNG errors to Zipminator errors.
///
/// Mapping:
/// - `InitializationFailed` -> `QrngInitializationFailed`
/// - `DeviceNotFound`       -> `QrngDeviceNotFound`
/// - `ReadError`            -> `QrngDeviceDisconnected`
/// - `UsbError`             -> `QrngDeviceDisconnected`
/// - `InsufficientEntropy`  -> `QrngInsufficientEntropy`
/// - `HealthCheckFailed`    -> `QrngHealthCheckFailed`
/// - `InvalidBufferSize`    -> `InternalError`
/// - `Timeout`              -> `Timeout`
/// - `StatisticalTestFailed`-> `QrngEntropyTestFailed`
impl From<crate::qrng::QrngError> for ZipminatorError {
    fn from(err: crate::qrng::QrngError) -> Self {
        let (code, severity) = match &err {
            crate::qrng::QrngError::InitializationFailed(_) => {
                (ErrorCode::QrngInitializationFailed, ErrorSeverity::Critical)
            }
            crate::qrng::QrngError::DeviceNotFound => {
                (ErrorCode::QrngDeviceNotFound, ErrorSeverity::Critical)
            }
            crate::qrng::QrngError::ReadError(_) => {
                (ErrorCode::QrngDeviceDisconnected, ErrorSeverity::Error)
            }
            crate::qrng::QrngError::UsbError(_) => {
                (ErrorCode::QrngDeviceDisconnected, ErrorSeverity::Error)
            }
            crate::qrng::QrngError::InsufficientEntropy => {
                (ErrorCode::QrngInsufficientEntropy, ErrorSeverity::Warning)
            }
            crate::qrng::QrngError::HealthCheckFailed(_) => {
                (ErrorCode::QrngHealthCheckFailed, ErrorSeverity::Error)
            }
            crate::qrng::QrngError::InvalidBufferSize { .. } => {
                (ErrorCode::InternalError, ErrorSeverity::Error)
            }
            crate::qrng::QrngError::Timeout(_) => {
                (ErrorCode::Timeout, ErrorSeverity::Error)
            }
            crate::qrng::QrngError::StatisticalTestFailed(_) => {
                (ErrorCode::QrngEntropyTestFailed, ErrorSeverity::Critical)
            }
        };

        ZipminatorError::new(
            code,
            format!("QRNG error: {}", err),
            severity,
            ErrorContext::new("", 0, 0).with_operation("qrng"),
        )
    }
}

/// Convert entropy source errors to Zipminator errors.
///
/// The `entropy_source::Error` enum wraps `QrngError` via `#[from]`, so the
/// `QrngError` variant delegates to the `From<QrngError>` impl above.
impl From<crate::entropy_source::Error> for ZipminatorError {
    fn from(err: crate::entropy_source::Error) -> Self {
        match err {
            crate::entropy_source::Error::NotAvailable(msg) => ZipminatorError::new(
                ErrorCode::QrngDeviceNotFound,
                format!("Entropy source not available: {}", msg),
                ErrorSeverity::Critical,
                ErrorContext::new("", 0, 0).with_operation("entropy_source"),
            ),
            crate::entropy_source::Error::InsufficientEntropy => ZipminatorError::new(
                ErrorCode::QrngInsufficientEntropy,
                "Insufficient entropy from all sources".to_string(),
                ErrorSeverity::Critical,
                ErrorContext::new("", 0, 0).with_operation("entropy_source"),
            ),
            crate::entropy_source::Error::QrngError(qrng_err) => {
                // Delegate to the From<QrngError> implementation
                let mut z_err = ZipminatorError::from(qrng_err);
                z_err.context.operation = Some("entropy_source".to_string());
                z_err
            }
            crate::entropy_source::Error::IoError(io_err) => ZipminatorError::new(
                ErrorCode::IoError,
                format!("Entropy source IO error: {}", io_err),
                ErrorSeverity::Error,
                ErrorContext::new("", 0, 0).with_operation("entropy_source"),
            ),
        }
    }
}

/// Convert entropy pool errors to Zipminator errors.
///
/// Mapping:
/// - `IoError`                 -> `IoError`
/// - `InvalidMagic`            -> `InvariantViolation`
/// - `UnsupportedVersion`      -> `InvalidConfiguration`
/// - `HmacVerificationFailed`  -> `SignatureVerificationFailed`
/// - `DecryptionFailed`        -> `DecapsulationFailed`
/// - `InsufficientEntropy`     -> `QrngInsufficientEntropy`
/// - `KeyDerivationFailed`     -> `KeyGenerationFailed`
/// - `KeyNotFound`             -> `MissingConfiguration`
/// - `ValidationFailed`        -> `QrngEntropyTestFailed`
impl From<crate::quantum_entropy_pool::EntropyPoolError> for ZipminatorError {
    fn from(err: crate::quantum_entropy_pool::EntropyPoolError) -> Self {
        use crate::quantum_entropy_pool::EntropyPoolError;

        let (code, severity) = match &err {
            EntropyPoolError::IoError(_) => (ErrorCode::IoError, ErrorSeverity::Error),
            EntropyPoolError::InvalidMagic => {
                (ErrorCode::InvariantViolation, ErrorSeverity::Critical)
            }
            EntropyPoolError::UnsupportedVersion => {
                (ErrorCode::InvalidConfiguration, ErrorSeverity::Error)
            }
            EntropyPoolError::HmacVerificationFailed => {
                (ErrorCode::SignatureVerificationFailed, ErrorSeverity::Fatal)
            }
            EntropyPoolError::DecryptionFailed => {
                (ErrorCode::DecapsulationFailed, ErrorSeverity::Fatal)
            }
            EntropyPoolError::InsufficientEntropy => {
                (ErrorCode::QrngInsufficientEntropy, ErrorSeverity::Warning)
            }
            EntropyPoolError::KeyDerivationFailed => {
                (ErrorCode::KeyGenerationFailed, ErrorSeverity::Critical)
            }
            EntropyPoolError::KeyNotFound => {
                (ErrorCode::MissingConfiguration, ErrorSeverity::Critical)
            }
            EntropyPoolError::ValidationFailed => {
                (ErrorCode::QrngEntropyTestFailed, ErrorSeverity::Critical)
            }
        };

        ZipminatorError::new(
            code,
            format!("Entropy pool error: {}", err),
            severity,
            ErrorContext::new("", 0, 0).with_operation("entropy_pool"),
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_creation() {
        let err = zipminator_error!(
            ErrorCode::QrngInitializationFailed,
            "Failed to initialize QRNG device"
        );

        assert_eq!(err.code, ErrorCode::QrngInitializationFailed);
        assert_eq!(err.severity, ErrorSeverity::Error);
        assert!(err.message.contains("QRNG"));
    }

    #[cfg(feature = "config")]
    #[test]
    fn test_error_serialization() {
        let err = zipminator_error!(
            ErrorCode::InvalidCiphertext,
            "Ciphertext validation failed"
        );

        let json = err.to_json();
        assert_eq!(json["error_code_value"], 0x2003);
        assert_eq!(json["severity"], "ERROR");
    }

    #[test]
    fn test_error_chain() {
        let source_err = zipminator_error!(
            ErrorCode::QrngDeviceNotFound,
            "Device not found"
        );

        let err = zipminator_error!(
            ErrorCode::QrngInitializationFailed,
            "Initialization failed"
        ).with_source(source_err);

        assert!(err.source.is_some());
        let error_str = format!("{}", err);
        assert!(error_str.contains("Caused by"));
    }
}
