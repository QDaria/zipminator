/// QRNG (Quantum Random Number Generator) Integration Module
///
/// Provides trait definitions and implementations for integrating quantum RNG devices
/// into the Kyber-768 post-quantum cryptographic implementation.

pub mod id_quantique;
pub mod ibm_quantum;
pub mod entropy_pool;
pub mod mock;

use thiserror::Error;

/// Health status of a QRNG device
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HealthStatus {
    /// Device is healthy and operating normally
    Healthy,
    /// Device is degraded but still functional
    Degraded,
    /// Device has failed and cannot provide randomness
    Failed,
}

/// Errors that can occur during QRNG operations
#[derive(Error, Debug)]
pub enum QrngError {
    #[error("Device initialization failed: {0}")]
    InitializationFailed(String),

    #[error("Device not found or not connected")]
    DeviceNotFound,

    #[error("Failed to read from device: {0}")]
    ReadError(String),

    #[error("USB communication error: {0}")]
    UsbError(String),

    #[error("Insufficient entropy available")]
    InsufficientEntropy,

    #[error("Device health check failed: {0}")]
    HealthCheckFailed(String),

    #[error("Buffer size invalid: expected {expected}, got {actual}")]
    InvalidBufferSize { expected: usize, actual: usize },

    #[error("Device timeout after {0}ms")]
    Timeout(u64),

    #[error("Statistical test failed: {0}")]
    StatisticalTestFailed(String),
}

/// Trait for quantum random number generator devices
///
/// Implementors must be thread-safe (Send + Sync) to support concurrent access
/// from multiple threads via the entropy pool.
pub trait QrngDevice: Send + Sync {
    /// Initialize the QRNG device
    ///
    /// This should establish connection, configure the device, and verify
    /// it's ready to provide random data.
    fn initialize(&mut self) -> Result<(), QrngError>;

    /// Get random bytes from the QRNG device
    ///
    /// # Arguments
    /// * `buffer` - Buffer to fill with random bytes
    ///
    /// # Returns
    /// The number of bytes actually read, or an error
    fn get_random_bytes(&mut self, buffer: &mut [u8]) -> Result<usize, QrngError>;

    /// Check the health status of the device
    ///
    /// This should perform diagnostic checks to ensure the device is
    /// functioning correctly and producing high-quality random data.
    fn health_check(&self) -> Result<HealthStatus, QrngError>;

    /// Get device information string
    fn device_info(&self) -> String {
        "Generic QRNG Device".to_string()
    }

    /// Check if device is initialized and ready
    fn is_ready(&self) -> bool;

    /// Shutdown the device gracefully
    fn shutdown(&mut self) -> Result<(), QrngError> {
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_health_status_equality() {
        assert_eq!(HealthStatus::Healthy, HealthStatus::Healthy);
        assert_ne!(HealthStatus::Healthy, HealthStatus::Degraded);
        assert_ne!(HealthStatus::Degraded, HealthStatus::Failed);
    }

    #[test]
    fn test_error_display() {
        let error = QrngError::DeviceNotFound;
        assert!(error.to_string().contains("not found"));

        let error = QrngError::InvalidBufferSize { expected: 32, actual: 16 };
        assert!(error.to_string().contains("32"));
        assert!(error.to_string().contains("16"));
    }
}
