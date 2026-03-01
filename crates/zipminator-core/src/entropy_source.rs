/// Entropy Source Abstraction
///
/// Provides a unified interface for accessing entropy from multiple sources with
/// automatic fallback handling.

use crate::qrng::{ibm_quantum::IBMQuantumQRNG, mock::MockQrngDevice, QrngDevice, QrngError};
use log::{info, warn};

/// Entropy source types
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum EntropySourceType {
    /// IBM Quantum QRNG
    IBMQuantum,
    /// Mock QRNG for testing
    Mock,
    /// System /dev/urandom
    SystemUrandom,
}

/// Trait for entropy sources with quantum entropy capabilities
pub trait EntropySource: Send + Sync {
    /// Get random bytes from the entropy source
    fn get_random_bytes(&mut self, buffer: &mut [u8]) -> Result<usize, Error>;

    /// Check if currently using quantum entropy
    fn is_quantum(&self) -> bool;

    /// Perform health check
    fn health_check(&self) -> Result<(), Error>;

    /// Get source information
    fn source_info(&self) -> String;
}

/// Errors for entropy source operations
#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("Entropy source not available: {0}")]
    NotAvailable(String),

    #[error("Insufficient entropy")]
    InsufficientEntropy,

    #[error("QRNG error: {0}")]
    QrngError(#[from] QrngError),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
}

/// IBM Quantum entropy source wrapper
pub struct IBMQuantumEntropySource {
    device: IBMQuantumQRNG,
}

impl IBMQuantumEntropySource {
    /// Create a new IBM Quantum entropy source
    pub fn new(pool_path: &str) -> Result<Self, Error> {
        let mut config = crate::qrng::ibm_quantum::IBMQuantumConfig::default();
        config.pool_file_path = pool_path.into();

        let mut device = IBMQuantumQRNG::with_config(config);
        device.initialize()?;

        Ok(Self { device })
    }
}

impl EntropySource for IBMQuantumEntropySource {
    fn get_random_bytes(&mut self, buffer: &mut [u8]) -> Result<usize, Error> {
        self.device.get_random_bytes(buffer).map_err(Error::from)
    }

    fn is_quantum(&self) -> bool {
        self.device.is_using_quantum()
    }

    fn health_check(&self) -> Result<(), Error> {
        let status = self.device.health_check()?;
        match status {
            crate::qrng::HealthStatus::Healthy => Ok(()),
            _ => Err(Error::NotAvailable(format!(
                "Device health status: {:?}",
                status
            ))),
        }
    }

    fn source_info(&self) -> String {
        self.device.device_info()
    }
}

/// System urandom entropy source
pub struct SystemUrandomSource {
    file: std::fs::File,
}

impl SystemUrandomSource {
    /// Create a new system urandom source
    pub fn new() -> Result<Self, Error> {
        use std::fs::OpenOptions;

        let file = OpenOptions::new()
            .read(true)
            .open("/dev/urandom")
            .map_err(|e| {
                Error::NotAvailable(format!("Failed to open /dev/urandom: {}", e))
            })?;

        Ok(Self { file })
    }
}

impl EntropySource for SystemUrandomSource {
    fn get_random_bytes(&mut self, buffer: &mut [u8]) -> Result<usize, Error> {
        use std::io::Read;
        self.file.read(buffer).map_err(Error::from)
    }

    fn is_quantum(&self) -> bool {
        false
    }

    fn health_check(&self) -> Result<(), Error> {
        Ok(())
    }

    fn source_info(&self) -> String {
        "System /dev/urandom".to_string()
    }
}

/// Entropy manager with automatic fallback
pub struct EntropyManager {
    sources: Vec<Box<dyn EntropySource>>,
    active_index: usize,
    warn_on_fallback: bool,
}

impl EntropyManager {
    /// Create a new entropy manager with priority-ordered sources
    pub fn new(warn_on_fallback: bool) -> Self {
        Self {
            sources: Vec::new(),
            active_index: 0,
            warn_on_fallback,
        }
    }

    /// Add an entropy source (in priority order)
    pub fn add_source(&mut self, source: Box<dyn EntropySource>) {
        info!("Added entropy source: {}", source.source_info());
        self.sources.push(source);
    }

    /// Get random bytes from best available source
    pub fn get_random_bytes(&mut self, buffer: &mut [u8]) -> Result<(), Error> {
        if self.sources.is_empty() {
            return Err(Error::NotAvailable("No entropy sources available".into()));
        }

        // Try active source first
        match self.sources[self.active_index].get_random_bytes(buffer) {
            Ok(bytes_read) if bytes_read == buffer.len() => return Ok(()),
            _ => {}
        }

        // Try other sources - store info before borrowing mutably
        let old_active_index = self.active_index;

        for idx in 0..self.sources.len() {
            if idx == old_active_index {
                continue;
            }

            match self.sources[idx].get_random_bytes(buffer) {
                Ok(bytes_read) if bytes_read == buffer.len() => {
                    // Get source info after successful read, before fallback warning
                    let new_info = self.sources[idx].source_info();

                    if self.warn_on_fallback {
                        let old_info = self.sources[old_active_index].source_info();
                        warn!(
                            "Entropy source changed: {} → {}",
                            old_info, new_info
                        );
                    }

                    self.active_index = idx;
                    return Ok(());
                }
                _ => continue,
            }
        }

        Err(Error::InsufficientEntropy)
    }

    /// Check if currently using quantum entropy
    pub fn is_quantum(&self) -> bool {
        if self.sources.is_empty() {
            return false;
        }
        self.sources[self.active_index].is_quantum()
    }

    /// Get active source info
    pub fn active_source_info(&self) -> String {
        if self.sources.is_empty() {
            return "No source active".to_string();
        }
        self.sources[self.active_index].source_info()
    }

    /// Run health check on all sources
    pub fn health_check_all(&self) -> usize {
        self.sources
            .iter()
            .filter(|s| s.health_check().is_ok())
            .count()
    }
}

impl Default for EntropyManager {
    fn default() -> Self {
        Self::new(true)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_system_urandom_source() {
        let mut source = SystemUrandomSource::new().unwrap();
        let mut buffer = [0u8; 32];
        let result = source.get_random_bytes(&mut buffer);
        assert!(result.is_ok());
        assert!(!source.is_quantum());
    }

    #[test]
    fn test_entropy_manager() {
        let mut manager = EntropyManager::new(true);
        let source = Box::new(SystemUrandomSource::new().unwrap());
        manager.add_source(source);

        let mut buffer = [0u8; 32];
        assert!(manager.get_random_bytes(&mut buffer).is_ok());
    }
}
