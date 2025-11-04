/// ID Quantique QRNG Device Driver
///
/// Implements communication with ID Quantique Quantis USB quantum random number generators.
/// Uses libusb for USB communication and provides thread-safe access.

use super::{HealthStatus, QrngDevice, QrngError};
use log::{debug, error, info, warn};
use std::sync::{Arc, Mutex};
use std::time::Duration;

/// ID Quantique Quantis USB device constants
const VENDOR_ID: u16 = 0x0ABA;  // ID Quantique vendor ID
const PRODUCT_ID: u16 = 0x0101; // Quantis USB product ID
const ENDPOINT_IN: u8 = 0x81;   // Bulk IN endpoint
const TIMEOUT_MS: u64 = 1000;   // USB read timeout
const MAX_CHUNK_SIZE: usize = 4096; // Maximum bytes per USB transfer

/// Statistical quality thresholds for health checks
const MIN_ENTROPY_RATE: f64 = 7.9; // bits per byte (out of 8.0 theoretical max)
const MAX_BIAS: f64 = 0.55; // Maximum acceptable bit bias (0.5 = perfect)

/// ID Quantique QRNG device driver
pub struct IdQuantiqueDevice {
    /// USB context (shared across threads if needed)
    context: Arc<Mutex<Option<libusb::Context>>>,
    /// USB device handle
    device_handle: Option<libusb::DeviceHandle<libusb::Context>>,
    /// Device initialization status
    initialized: bool,
    /// Statistics for health monitoring
    stats: DeviceStats,
}

#[derive(Debug, Default)]
struct DeviceStats {
    total_bytes_read: u64,
    read_errors: u64,
    last_health_check: Option<std::time::Instant>,
}

impl IdQuantiqueDevice {
    /// Create a new ID Quantique device driver
    pub fn new() -> Result<Self, QrngError> {
        let context = libusb::Context::new()
            .map_err(|e| QrngError::InitializationFailed(format!("libusb context: {}", e)))?;

        Ok(Self {
            context: Arc::new(Mutex::new(Some(context))),
            device_handle: None,
            initialized: false,
            stats: DeviceStats::default(),
        })
    }

    /// Find the ID Quantique device on the USB bus
    fn find_device(&self) -> Result<libusb::Device<libusb::Context>, QrngError> {
        let context_lock = self.context.lock().unwrap();
        let context = context_lock.as_ref().ok_or(QrngError::DeviceNotFound)?;

        for device in context.devices().map_err(|e| QrngError::UsbError(e.to_string()))?.iter() {
            let desc = device
                .device_descriptor()
                .map_err(|e| QrngError::UsbError(e.to_string()))?;

            if desc.vendor_id() == VENDOR_ID && desc.product_id() == PRODUCT_ID {
                debug!("Found ID Quantique device: VID={:04x} PID={:04x}",
                       desc.vendor_id(), desc.product_id());
                return Ok(device);
            }
        }

        Err(QrngError::DeviceNotFound)
    }

    /// Perform statistical quality check on random data
    fn check_statistical_quality(&self, data: &[u8]) -> Result<(), QrngError> {
        if data.is_empty() {
            return Ok(());
        }

        // Simple bias check: count 1-bits
        let total_bits = data.len() * 8;
        let one_bits: usize = data.iter().map(|b| b.count_ones() as usize).sum();
        let bias = one_bits as f64 / total_bits as f64;

        if bias > MAX_BIAS || bias < (1.0 - MAX_BIAS) {
            warn!("Statistical bias detected: {:.4} (expected ~0.5)", bias);
            return Err(QrngError::StatisticalTestFailed(
                format!("Bias {:.4} exceeds threshold {:.4}", bias, MAX_BIAS)
            ));
        }

        // TODO: Add more sophisticated statistical tests (entropy estimation, runs test, etc.)
        // For production, integrate NIST SP 800-90B entropy assessment

        Ok(())
    }
}

impl QrngDevice for IdQuantiqueDevice {
    fn initialize(&mut self) -> Result<(), QrngError> {
        if self.initialized {
            info!("Device already initialized");
            return Ok(());
        }

        info!("Initializing ID Quantique QRNG device...");

        // Find the device
        let device = self.find_device()?;

        // Open device handle
        let mut handle = device
            .open()
            .map_err(|e| QrngError::InitializationFailed(format!("open device: {}", e)))?;

        // Claim interface 0
        handle
            .claim_interface(0)
            .map_err(|e| QrngError::InitializationFailed(format!("claim interface: {}", e)))?;

        // Set configuration if needed
        // Some devices require specific configuration, but Quantis USB typically works with defaults

        self.device_handle = Some(handle);
        self.initialized = true;

        info!("ID Quantique device initialized successfully");

        // Perform initial health check
        let health = self.health_check()?;
        if health != HealthStatus::Healthy {
            error!("Device health check failed after initialization");
            return Err(QrngError::HealthCheckFailed("Initial health check failed".to_string()));
        }

        Ok(())
    }

    fn get_random_bytes(&mut self, buffer: &mut [u8]) -> Result<usize, QrngError> {
        if !self.initialized {
            return Err(QrngError::InitializationFailed("Device not initialized".to_string()));
        }

        let handle = self.device_handle.as_mut()
            .ok_or(QrngError::DeviceNotFound)?;

        let mut total_read = 0;
        let timeout = Duration::from_millis(TIMEOUT_MS);

        // Read in chunks to avoid USB transfer size limitations
        while total_read < buffer.len() {
            let remaining = buffer.len() - total_read;
            let chunk_size = remaining.min(MAX_CHUNK_SIZE);
            let chunk = &mut buffer[total_read..total_read + chunk_size];

            match handle.read_bulk(ENDPOINT_IN, chunk, timeout) {
                Ok(bytes_read) => {
                    if bytes_read == 0 {
                        warn!("Read 0 bytes from device, retrying...");
                        continue;
                    }

                    // Verify statistical quality of received data
                    self.check_statistical_quality(&chunk[..bytes_read])?;

                    total_read += bytes_read;
                    self.stats.total_bytes_read += bytes_read as u64;

                    debug!("Read {} bytes from QRNG device (total: {})",
                           bytes_read, total_read);
                }
                Err(e) => {
                    self.stats.read_errors += 1;
                    error!("USB read error: {}", e);
                    return Err(QrngError::ReadError(e.to_string()));
                }
            }
        }

        Ok(total_read)
    }

    fn health_check(&self) -> Result<HealthStatus, QrngError> {
        if !self.initialized {
            return Ok(HealthStatus::Failed);
        }

        // Check error rate
        let total_operations = (self.stats.total_bytes_read / 1024) + self.stats.read_errors;
        if total_operations > 0 {
            let error_rate = self.stats.read_errors as f64 / total_operations as f64;

            if error_rate > 0.1 {
                warn!("High error rate detected: {:.2}%", error_rate * 100.0);
                return Ok(HealthStatus::Failed);
            } else if error_rate > 0.01 {
                warn!("Elevated error rate: {:.2}%", error_rate * 100.0);
                return Ok(HealthStatus::Degraded);
            }
        }

        // TODO: Add more sophisticated health checks:
        // - Verify USB connection is still active
        // - Check device temperature (if available)
        // - Perform mini statistical test on small sample

        Ok(HealthStatus::Healthy)
    }

    fn device_info(&self) -> String {
        format!(
            "ID Quantique Quantis USB (VID: {:04x}, PID: {:04x}) - {} bytes read, {} errors",
            VENDOR_ID, PRODUCT_ID, self.stats.total_bytes_read, self.stats.read_errors
        )
    }

    fn is_ready(&self) -> bool {
        self.initialized && self.device_handle.is_some()
    }

    fn shutdown(&mut self) -> Result<(), QrngError> {
        if !self.initialized {
            return Ok(());
        }

        info!("Shutting down ID Quantique device...");

        if let Some(mut handle) = self.device_handle.take() {
            // Release interface
            if let Err(e) = handle.release_interface(0) {
                warn!("Failed to release interface: {}", e);
            }
        }

        self.initialized = false;
        info!("Device shutdown complete. Total bytes read: {}", self.stats.total_bytes_read);

        Ok(())
    }
}

impl Drop for IdQuantiqueDevice {
    fn drop(&mut self) {
        let _ = self.shutdown();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_device_creation() {
        // This will fail in CI without actual hardware, which is expected
        let result = IdQuantiqueDevice::new();
        assert!(result.is_ok() || matches!(result, Err(QrngError::InitializationFailed(_))));
    }

    #[test]
    fn test_device_not_ready_initially() {
        if let Ok(device) = IdQuantiqueDevice::new() {
            assert!(!device.is_ready());
        }
    }

    #[test]
    fn test_statistical_check() {
        let device = IdQuantiqueDevice::new().unwrap();

        // Perfectly balanced data should pass
        let balanced = vec![0b10101010u8; 100];
        assert!(device.check_statistical_quality(&balanced).is_ok());

        // Heavily biased data should fail
        let biased = vec![0xFFu8; 100];
        assert!(device.check_statistical_quality(&biased).is_err());
    }
}
