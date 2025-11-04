/// Comprehensive Integration Tests for QRNG Module
///
/// Tests the complete QRNG integration including device drivers, entropy pool,
/// and statistical quality verification.

use qdaria_qrng::qrng::{
    entropy_pool::{EntropyPool, EntropyPoolConfig},
    mock::{MockFailureMode, MockQrngDevice},
    HealthStatus, QrngDevice, QrngError,
};
use std::collections::HashMap;
use std::time::Duration;

#[test]
fn test_mock_device_basic_operations() {
    let mut device = MockQrngDevice::new();

    // Should not be ready before initialization
    assert!(!device.is_ready());

    // Initialize
    assert!(device.initialize().is_ok());
    assert!(device.is_ready());

    // Get random bytes
    let mut buffer = [0u8; 64];
    assert_eq!(device.get_random_bytes(&mut buffer).unwrap(), 64);

    // Verify not all zeros
    assert!(buffer.iter().any(|&b| b != 0));

    // Health check
    assert_eq!(device.health_check().unwrap(), HealthStatus::Healthy);

    // Shutdown
    assert!(device.shutdown().is_ok());
    assert!(!device.is_ready());
}

#[test]
fn test_mock_device_failure_modes() {
    // Test initialization failure
    let mut device = MockQrngDevice::with_failure_mode(MockFailureMode::InitFailed);
    assert!(matches!(
        device.initialize(),
        Err(QrngError::InitializationFailed(_))
    ));

    // Test read failure
    let mut device = MockQrngDevice::with_failure_mode(MockFailureMode::ReadFailed);
    device.initialize().unwrap();
    let mut buffer = [0u8; 32];
    assert!(matches!(
        device.get_random_bytes(&mut buffer),
        Err(QrngError::ReadError(_))
    ));

    // Test degraded health status
    let mut device = MockQrngDevice::with_failure_mode(MockFailureMode::Degraded);
    device.initialize().unwrap();
    assert_eq!(device.health_check().unwrap(), HealthStatus::Degraded);
}

#[test]
fn test_entropy_pool_creation() {
    let device = Box::new(MockQrngDevice::new());
    let config = EntropyPoolConfig::default();

    let pool = EntropyPool::new(device, config);
    assert!(pool.is_ok());

    let pool = pool.unwrap();
    assert!(pool.available_bytes() >= pool.config.min_bytes);
}

#[test]
fn test_entropy_pool_get_bytes() {
    let device = Box::new(MockQrngDevice::new());
    let config = EntropyPoolConfig::default();
    let pool = EntropyPool::new(device, config).unwrap();

    // Get various sizes
    for size in [16, 32, 64, 128, 256, 512, 1024] {
        let mut buffer = vec![0u8; size];
        assert!(pool.get_random_bytes(&mut buffer).is_ok());
        assert!(buffer.iter().any(|&b| b != 0));
    }
}

#[test]
fn test_entropy_pool_refill() {
    let device = Box::new(MockQrngDevice::new());
    let mut config = EntropyPoolConfig::default();
    config.min_bytes = 512;
    config.max_bytes = 4096;
    config.refill_threshold = 1024;
    config.refill_chunk_size = 1024;

    let pool = EntropyPool::new(device, config).unwrap();

    // Drain the pool below refill threshold
    let mut buffer = vec![0u8; 2048];
    assert!(pool.get_random_bytes(&mut buffer).is_ok());

    // Should trigger refill automatically
    std::thread::sleep(Duration::from_millis(100));

    // Should still be able to get more bytes
    assert!(pool.get_random_bytes(&mut buffer).is_ok());
}

#[test]
fn test_entropy_pool_concurrent_access() {
    use std::sync::Arc;
    use std::thread;

    let device = Box::new(MockQrngDevice::new());
    let config = EntropyPoolConfig::default();
    let pool = Arc::new(EntropyPool::new(device, config).unwrap());

    let mut handles = vec![];

    // Spawn multiple threads requesting random bytes
    for _ in 0..8 {
        let pool_clone = Arc::clone(&pool);
        let handle = thread::spawn(move || {
            let mut buffer = [0u8; 128];
            for _ in 0..10 {
                assert!(pool_clone.get_random_bytes(&mut buffer).is_ok());
            }
        });
        handles.push(handle);
    }

    // Wait for all threads
    for handle in handles {
        handle.join().unwrap();
    }
}

#[test]
fn test_entropy_pool_health_monitoring() {
    let device = Box::new(MockQrngDevice::new());
    let config = EntropyPoolConfig {
        health_check_interval: Duration::from_millis(100),
        ..Default::default()
    };

    let pool = EntropyPool::new(device, config).unwrap();

    // Initial health should be healthy
    assert_eq!(pool.health_status(), HealthStatus::Healthy);

    // Wait for health check interval
    std::thread::sleep(Duration::from_millis(200));

    // Should still be healthy
    assert_eq!(pool.health_status(), HealthStatus::Healthy);
}

#[test]
fn test_statistical_distribution() {
    let device = Box::new(MockQrngDevice::new());
    let config = EntropyPoolConfig::default();
    let pool = EntropyPool::new(device, config).unwrap();

    // Get a large sample
    let mut buffer = vec![0u8; 10000];
    pool.get_random_bytes(&mut buffer).unwrap();

    // Count byte frequency
    let mut frequency = HashMap::new();
    for &byte in &buffer {
        *frequency.entry(byte).or_insert(0u32) += 1;
    }

    // Should have reasonable distribution (not all same value)
    assert!(frequency.len() > 200); // At least 200 different byte values

    // Calculate bit bias
    let total_bits = buffer.len() * 8;
    let one_bits: usize = buffer.iter().map(|b| b.count_ones() as usize).sum();
    let bias = one_bits as f64 / total_bits as f64;

    // Should be close to 0.5 (allowing for pseudo-random variance)
    assert!(bias > 0.45 && bias < 0.55, "Bias: {}", bias);
}

#[test]
fn test_runs_test() {
    let device = Box::new(MockQrngDevice::new());
    let config = EntropyPoolConfig::default();
    let pool = EntropyPool::new(device, config).unwrap();

    // Get sample for runs test
    let mut buffer = vec![0u8; 1000];
    pool.get_random_bytes(&mut buffer).unwrap();

    // Count runs (sequences of identical bits)
    let mut runs = 0;
    let mut prev_bit = buffer[0] & 1;

    for &byte in &buffer {
        for i in 0..8 {
            let bit = (byte >> i) & 1;
            if bit != prev_bit {
                runs += 1;
                prev_bit = bit;
            }
        }
    }

    // Expected runs for random data is approximately n/2
    let total_bits = buffer.len() * 8;
    let expected_runs = total_bits as f64 / 2.0;
    let actual_runs = runs as f64;

    // Allow 20% variance
    assert!(
        actual_runs > expected_runs * 0.8 && actual_runs < expected_runs * 1.2,
        "Runs: {}, Expected: {}",
        actual_runs,
        expected_runs
    );
}

#[test]
fn test_entropy_pool_timeout() {
    use std::sync::{Arc, Mutex};

    // Create a device that never provides data
    struct SlowDevice {
        initialized: bool,
    }

    impl QrngDevice for SlowDevice {
        fn initialize(&mut self) -> Result<(), QrngError> {
            self.initialized = true;
            Ok(())
        }

        fn get_random_bytes(&mut self, _buffer: &mut [u8]) -> Result<usize, QrngError> {
            // Never return any data
            std::thread::sleep(Duration::from_secs(10));
            Ok(0)
        }

        fn health_check(&self) -> Result<HealthStatus, QrngError> {
            Ok(HealthStatus::Healthy)
        }

        fn is_ready(&self) -> bool {
            self.initialized
        }
    }

    unsafe impl Send for SlowDevice {}
    unsafe impl Sync for SlowDevice {}

    let device = Box::new(SlowDevice { initialized: false });
    let mut config = EntropyPoolConfig::default();
    config.min_bytes = 0; // Allow pool to start with no data

    // Pool creation should timeout
    let result = EntropyPool::new(device, config);
    assert!(matches!(result, Err(QrngError::Timeout(_))));
}

#[test]
fn test_error_types() {
    // Test error display messages
    let err = QrngError::DeviceNotFound;
    assert!(err.to_string().contains("not found"));

    let err = QrngError::InsufficientEntropy;
    assert!(err.to_string().contains("Insufficient"));

    let err = QrngError::InvalidBufferSize {
        expected: 32,
        actual: 16,
    };
    assert!(err.to_string().contains("32"));
    assert!(err.to_string().contains("16"));
}

#[cfg(feature = "proptest")]
mod property_tests {
    use super::*;
    use proptest::prelude::*;

    proptest! {
        #[test]
        fn test_pool_returns_requested_size(size in 1usize..4096) {
            let device = Box::new(MockQrngDevice::new());
            let config = EntropyPoolConfig::default();
            let pool = EntropyPool::new(device, config).unwrap();

            let mut buffer = vec![0u8; size];
            prop_assert!(pool.get_random_bytes(&mut buffer).is_ok());
        }

        #[test]
        fn test_different_calls_produce_different_data(size in 32usize..256) {
            let device = Box::new(MockQrngDevice::new());
            let config = EntropyPoolConfig::default();
            let pool = EntropyPool::new(device, config).unwrap();

            let mut buffer1 = vec![0u8; size];
            let mut buffer2 = vec![0u8; size];

            pool.get_random_bytes(&mut buffer1).unwrap();
            pool.get_random_bytes(&mut buffer2).unwrap();

            // Very unlikely to be identical for quantum/pseudo-random data
            prop_assert_ne!(buffer1, buffer2);
        }
    }
}
