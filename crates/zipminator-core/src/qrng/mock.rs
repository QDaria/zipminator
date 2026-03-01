/// Mock QRNG Device for Testing
///
/// Provides a deterministic mock implementation of QrngDevice for use in tests
/// and CI environments where real quantum hardware is not available.

use super::{HealthStatus, QrngDevice, QrngError};
use std::sync::Mutex;

/// Mock QRNG device that generates pseudo-random data for testing
///
/// This device uses a simple PRNG for testing purposes. DO NOT use in production
/// for actual cryptographic operations.
pub struct MockQrngDevice {
    initialized: bool,
    counter: Mutex<u64>,
    fail_mode: Option<MockFailureMode>,
}

#[derive(Debug, Clone, Copy)]
pub enum MockFailureMode {
    /// Always fail health checks
    HealthCheckFailed,
    /// Fail on initialization
    InitFailed,
    /// Fail on reads
    ReadFailed,
    /// Return degraded health status
    Degraded,
}

impl MockQrngDevice {
    /// Create a new mock device with default behavior
    pub fn new() -> Self {
        Self {
            initialized: false,
            counter: Mutex::new(0),
            fail_mode: None,
        }
    }

    /// Create a mock device with specific failure behavior for testing
    pub fn with_failure_mode(mode: MockFailureMode) -> Self {
        Self {
            initialized: false,
            counter: Mutex::new(0),
            fail_mode: Some(mode),
        }
    }

    /// Generate deterministic pseudo-random bytes
    /// Uses a simple counter-based PRNG for reproducibility in tests
    fn generate_bytes(&self, buffer: &mut [u8]) -> Result<usize, QrngError> {
        let mut counter = self.counter.lock().unwrap();

        for (i, byte) in buffer.iter_mut().enumerate() {
            // Simple mixing function for test data
            // XOR counter with index and use rotating bits
            let value = (*counter + i as u64) ^ (*counter >> 8);
            *byte = ((value ^ (value >> 16) ^ (value >> 32)) & 0xFF) as u8;
            *counter = counter.wrapping_add(1);
        }

        Ok(buffer.len())
    }
}

impl Default for MockQrngDevice {
    fn default() -> Self {
        Self::new()
    }
}

impl QrngDevice for MockQrngDevice {
    fn initialize(&mut self) -> Result<(), QrngError> {
        if let Some(MockFailureMode::InitFailed) = self.fail_mode {
            return Err(QrngError::InitializationFailed("Mock init failure".to_string()));
        }

        self.initialized = true;
        Ok(())
    }

    fn get_random_bytes(&mut self, buffer: &mut [u8]) -> Result<usize, QrngError> {
        if !self.initialized {
            return Err(QrngError::InitializationFailed("Not initialized".to_string()));
        }

        if let Some(MockFailureMode::ReadFailed) = self.fail_mode {
            return Err(QrngError::ReadError("Mock read failure".to_string()));
        }

        self.generate_bytes(buffer)
    }

    fn health_check(&self) -> Result<HealthStatus, QrngError> {
        if !self.initialized {
            return Ok(HealthStatus::Failed);
        }

        match self.fail_mode {
            Some(MockFailureMode::HealthCheckFailed) => {
                Err(QrngError::HealthCheckFailed("Mock health check failure".to_string()))
            }
            Some(MockFailureMode::Degraded) => Ok(HealthStatus::Degraded),
            _ => Ok(HealthStatus::Healthy),
        }
    }

    fn device_info(&self) -> String {
        format!("Mock QRNG Device (counter: {})", self.counter.lock().unwrap())
    }

    fn is_ready(&self) -> bool {
        self.initialized
    }

    fn shutdown(&mut self) -> Result<(), QrngError> {
        self.initialized = false;
        Ok(())
    }
}

unsafe impl Send for MockQrngDevice {}
unsafe impl Sync for MockQrngDevice {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mock_device_initialization() {
        let mut device = MockQrngDevice::new();
        assert!(!device.is_ready());

        assert!(device.initialize().is_ok());
        assert!(device.is_ready());
    }

    #[test]
    fn test_mock_device_random_bytes() {
        let mut device = MockQrngDevice::new();
        device.initialize().unwrap();

        let mut buffer = [0u8; 32];
        assert_eq!(device.get_random_bytes(&mut buffer).unwrap(), 32);

        // Verify not all zeros
        assert!(buffer.iter().any(|&b| b != 0));
    }

    #[test]
    fn test_mock_device_deterministic() {
        let mut device1 = MockQrngDevice::new();
        device1.initialize().unwrap();

        let mut device2 = MockQrngDevice::new();
        device2.initialize().unwrap();

        let mut buffer1 = [0u8; 32];
        let mut buffer2 = [0u8; 32];

        device1.get_random_bytes(&mut buffer1).unwrap();
        device2.get_random_bytes(&mut buffer2).unwrap();

        // Should produce same sequence
        assert_eq!(buffer1, buffer2);
    }

    #[test]
    fn test_mock_device_failure_modes() {
        // Test init failure
        let mut device = MockQrngDevice::with_failure_mode(MockFailureMode::InitFailed);
        assert!(device.initialize().is_err());

        // Test read failure
        let mut device = MockQrngDevice::with_failure_mode(MockFailureMode::ReadFailed);
        device.initialized = true; // Force initialized for this test
        let mut buffer = [0u8; 32];
        assert!(device.get_random_bytes(&mut buffer).is_err());

        // Test health check failure
        let mut device = MockQrngDevice::with_failure_mode(MockFailureMode::HealthCheckFailed);
        device.initialize().unwrap();
        assert!(device.health_check().is_err());

        // Test degraded status
        let mut device = MockQrngDevice::with_failure_mode(MockFailureMode::Degraded);
        device.initialize().unwrap();
        assert_eq!(device.health_check().unwrap(), HealthStatus::Degraded);
    }

    #[test]
    fn test_mock_device_health_check() {
        let mut device = MockQrngDevice::new();

        // Should be failed before init
        assert_eq!(device.health_check().unwrap(), HealthStatus::Failed);

        device.initialize().unwrap();

        // Should be healthy after init
        assert_eq!(device.health_check().unwrap(), HealthStatus::Healthy);
    }
}
