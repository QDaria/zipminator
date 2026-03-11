//! IBM Quantum QRNG Device
//!
//! Provides quantum entropy from IBM Quantum systems via:
//! 1. Pre-generated entropy pool file (primary, offline)
//! 2. IBM Quantum API (optional, requires authentication)
//! 3. System /dev/urandom (fallback)
//!
//! Features:
//! - File-based entropy pool for offline operation
//! - Automatic fallback when pool exhausted
//! - Health monitoring and logging
//! - Thread-safe concurrent access

use super::{HealthStatus, QrngDevice, QrngError};
use log::{info, warn};
use std::fs::File;
use std::io::Read;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

/// Configuration for IBM Quantum QRNG
#[derive(Debug, Clone)]
pub struct IBMQuantumConfig {
    /// Path to pre-generated entropy pool file
    pub pool_file_path: PathBuf,
    /// Minimum bytes before warning
    pub min_pool_bytes: usize,
    /// Warn when falling back to /dev/urandom
    pub warn_on_fallback: bool,
    /// Log which entropy source is being used
    pub log_entropy_source: bool,
}

impl Default for IBMQuantumConfig {
    fn default() -> Self {
        Self {
            pool_file_path: PathBuf::from("/var/lib/zipminator/quantum_entropy.pool"),
            min_pool_bytes: 10240, // 10KB
            warn_on_fallback: true,
            log_entropy_source: true,
        }
    }
}

/// Statistics for IBM Quantum QRNG
#[derive(Debug, Default)]
pub struct IBMQuantumStats {
    bytes_served: u64,
    bytes_from_quantum: u64,
    bytes_from_fallback: u64,
    pool_exhausted_count: u64,
}

/// IBM Quantum QRNG Device
pub struct IBMQuantumQRNG {
    config: IBMQuantumConfig,
    pool_file: Option<File>,
    pool_total_size: u64,
    pool_bytes_read: u64,
    urandom_file: Option<File>,
    using_quantum: bool,
    pool_exhausted: bool,
    initialized: bool,
    stats: Arc<Mutex<IBMQuantumStats>>,
}

impl IBMQuantumQRNG {
    /// Create a new IBM Quantum QRNG with default configuration
    pub fn new() -> Self {
        Self::with_config(IBMQuantumConfig::default())
    }

    /// Create a new IBM Quantum QRNG with custom configuration
    pub fn with_config(config: IBMQuantumConfig) -> Self {
        Self {
            config,
            pool_file: None,
            pool_total_size: 0,
            pool_bytes_read: 0,
            urandom_file: None,
            using_quantum: false,
            pool_exhausted: false,
            initialized: false,
            stats: Arc::new(Mutex::new(IBMQuantumStats::default())),
        }
    }

    /// Open and validate the quantum entropy pool file
    fn open_pool_file(&mut self) -> Result<(), QrngError> {
        let path = &self.config.pool_file_path;

        if !path.exists() {
            return Err(QrngError::DeviceNotFound);
        }

        let file = File::open(path).map_err(|e| {
            QrngError::InitializationFailed(format!("Failed to open pool file: {}", e))
        })?;

        // Get file size
        let metadata = file.metadata().map_err(|e| {
            QrngError::InitializationFailed(format!("Failed to read file metadata: {}", e))
        })?;

        self.pool_total_size = metadata.len();

        if self.pool_total_size == 0 {
            return Err(QrngError::InitializationFailed(
                "Entropy pool file is empty".to_string(),
            ));
        }

        info!(
            "Loaded IBM Quantum entropy pool: {} bytes available",
            self.pool_total_size
        );

        self.pool_file = Some(file);
        self.pool_bytes_read = 0;
        self.pool_exhausted = false;

        Ok(())
    }

    /// Open /dev/urandom for fallback
    fn open_urandom(&mut self) -> Result<(), QrngError> {
        let file = File::open("/dev/urandom").map_err(|e| {
            QrngError::InitializationFailed(format!("Failed to open /dev/urandom: {}", e))
        })?;

        self.urandom_file = Some(file);
        Ok(())
    }

    /// Read from quantum entropy pool
    fn read_from_pool(&mut self, buffer: &mut [u8]) -> Result<usize, QrngError> {
        let file = self
            .pool_file
            .as_mut()
            .ok_or(QrngError::DeviceNotFound)?;

        match file.read(buffer) {
            Ok(bytes_read) => {
                if bytes_read == 0 {
                    self.pool_exhausted = true;
                    return Err(QrngError::InsufficientEntropy);
                }

                self.pool_bytes_read += bytes_read as u64;

                // Check if pool is running low
                let remaining = self.pool_total_size - self.pool_bytes_read;
                if remaining < self.config.min_pool_bytes as u64
                    && self.config.warn_on_fallback
                {
                    warn!(
                        "Quantum entropy pool low ({} bytes remaining). Consider refilling.",
                        remaining
                    );
                }

                Ok(bytes_read)
            }
            Err(e) => Err(QrngError::ReadError(format!(
                "Failed to read from pool: {}",
                e
            ))),
        }
    }

    /// Read from /dev/urandom fallback
    fn read_from_urandom(&mut self, buffer: &mut [u8]) -> Result<usize, QrngError> {
        let file = self
            .urandom_file
            .as_mut()
            .ok_or(QrngError::DeviceNotFound)?;

        file.read(buffer)
            .map_err(|e| QrngError::ReadError(format!("Failed to read from urandom: {}", e)))
    }

    /// Log which entropy source is being used
    fn log_source(&self, source: &str) {
        if self.config.log_entropy_source {
            info!("[Entropy Source] {}", source);
        }
    }

    /// Check if currently using quantum entropy
    pub fn is_using_quantum(&self) -> bool {
        self.using_quantum && !self.pool_exhausted
    }

    /// Get percentage of pool remaining
    pub fn get_pool_percent(&self) -> f64 {
        if self.pool_total_size == 0 {
            return 0.0;
        }

        let remaining = self.pool_total_size - self.pool_bytes_read;
        (remaining as f64 / self.pool_total_size as f64) * 100.0
    }

    /// Get statistics
    pub fn get_stats(&self) -> IBMQuantumStats {
        let stats = self.stats.lock().unwrap();
        IBMQuantumStats {
            bytes_served: stats.bytes_served,
            bytes_from_quantum: stats.bytes_from_quantum,
            bytes_from_fallback: stats.bytes_from_fallback,
            pool_exhausted_count: stats.pool_exhausted_count,
        }
    }
}

impl QrngDevice for IBMQuantumQRNG {
    fn initialize(&mut self) -> Result<(), QrngError> {
        if self.initialized {
            return Ok(());
        }

        // Try to open quantum entropy pool
        match self.open_pool_file() {
            Ok(_) => {
                self.using_quantum = true;
                self.log_source("IBM Quantum Pool");
            }
            Err(e) => {
                warn!(
                    "Failed to open IBM Quantum entropy pool: {}. Using fallback.",
                    e
                );
                self.using_quantum = false;
            }
        }

        // Open /dev/urandom for fallback
        self.open_urandom()?;

        self.initialized = true;
        Ok(())
    }

    fn get_random_bytes(&mut self, buffer: &mut [u8]) -> Result<usize, QrngError> {
        if !self.initialized {
            return Err(QrngError::DeviceNotFound);
        }

        let mut total_read = 0;

        // Try quantum pool first if available
        if self.using_quantum && !self.pool_exhausted {
            match self.read_from_pool(buffer) {
                Ok(bytes_read) => {
                    total_read += bytes_read;

                    // Update stats
                    let mut stats = self.stats.lock().unwrap();
                    stats.bytes_served += bytes_read as u64;
                    stats.bytes_from_quantum += bytes_read as u64;

                    // If we got all requested bytes, we're done
                    if bytes_read == buffer.len() {
                        return Ok(total_read);
                    }

                    // Pool exhausted mid-read, fall through to urandom for remainder
                    if self.config.warn_on_fallback {
                        warn!(
                            "Quantum entropy pool exhausted, falling back to /dev/urandom"
                        );
                    }
                    self.pool_exhausted = true;
                    self.using_quantum = false;
                    self.log_source("System /dev/urandom (fallback)");

                    let mut stats = self.stats.lock().unwrap();
                    stats.pool_exhausted_count += 1;
                }
                Err(_) => {
                    // Pool failed, switch to fallback
                    self.pool_exhausted = true;
                    self.using_quantum = false;
                }
            }
        }

        // Use fallback for any remaining bytes
        if total_read < buffer.len() {
            let remaining = &mut buffer[total_read..];
            let bytes_read = self.read_from_urandom(remaining)?;

            // Update stats
            let mut stats = self.stats.lock().unwrap();
            stats.bytes_served += bytes_read as u64;
            stats.bytes_from_fallback += bytes_read as u64;

            total_read += bytes_read;
        }

        Ok(total_read)
    }

    fn health_check(&self) -> Result<HealthStatus, QrngError> {
        if !self.initialized {
            return Err(QrngError::DeviceNotFound);
        }

        // Check if urandom is available (critical)
        if self.urandom_file.is_none() {
            return Ok(HealthStatus::Failed);
        }

        // Check quantum pool status
        if self.using_quantum && !self.pool_exhausted {
            let remaining = self.pool_total_size - self.pool_bytes_read;

            if remaining < self.config.min_pool_bytes as u64 {
                return Ok(HealthStatus::Degraded);
            }

            return Ok(HealthStatus::Healthy);
        }

        // Using fallback, but operational
        Ok(HealthStatus::Degraded)
    }

    fn device_info(&self) -> String {
        if self.is_using_quantum() {
            format!(
                "IBM Quantum QRNG (Quantum Active: {}/{} bytes, {:.1}%)",
                self.pool_total_size - self.pool_bytes_read,
                self.pool_total_size,
                self.get_pool_percent()
            )
        } else {
            "IBM Quantum QRNG (Fallback: /dev/urandom)".to_string()
        }
    }

    fn is_ready(&self) -> bool {
        self.initialized
    }

    fn shutdown(&mut self) -> Result<(), QrngError> {
        self.pool_file = None;
        self.urandom_file = None;
        self.initialized = false;
        Ok(())
    }
}

impl Default for IBMQuantumQRNG {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_defaults() {
        let config = IBMQuantumConfig::default();
        assert_eq!(config.min_pool_bytes, 10240);
        assert!(config.warn_on_fallback);
        assert!(config.log_entropy_source);
    }

    #[test]
    fn test_device_creation() {
        let device = IBMQuantumQRNG::new();
        assert!(!device.initialized);
        assert!(!device.using_quantum);
    }

    #[test]
    fn test_pool_percent_calculation() {
        let mut device = IBMQuantumQRNG::new();
        device.pool_total_size = 1000;
        device.pool_bytes_read = 250;

        assert_eq!(device.get_pool_percent(), 75.0);
    }
}
