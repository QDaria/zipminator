/// Entropy Pool for QRNG Buffering
///
/// Provides thread-safe buffering of quantum random data with automatic refilling,
/// health monitoring, and minimum entropy guarantees.

use super::{HealthStatus, QrngDevice, QrngError};
use crossbeam::channel::{bounded, Receiver, Sender};
use log::{debug, error, info, warn};
use std::sync::{Arc, Mutex};
use std::thread::{self, JoinHandle};
use std::time::{Duration, Instant};

/// Configuration for the entropy pool
#[derive(Debug, Clone)]
pub struct EntropyPoolConfig {
    /// Minimum bytes to maintain in pool
    pub min_bytes: usize,
    /// Maximum bytes to buffer
    pub max_bytes: usize,
    /// Size of each refill chunk
    pub refill_chunk_size: usize,
    /// Trigger refill when bytes drop below this threshold
    pub refill_threshold: usize,
    /// Interval for periodic health checks
    pub health_check_interval: Duration,
}

impl Default for EntropyPoolConfig {
    fn default() -> Self {
        Self {
            min_bytes: 4096,         // 4KB minimum
            max_bytes: 65536,        // 64KB maximum
            refill_chunk_size: 8192, // 8KB chunks
            refill_threshold: 16384, // Refill when below 16KB
            health_check_interval: Duration::from_secs(60),
        }
    }
}

/// Thread-safe entropy pool with automatic background refilling
pub struct EntropyPool {
    /// Internal buffer protected by mutex
    buffer: Arc<Mutex<Vec<u8>>>,
    /// Configuration
    config: EntropyPoolConfig,
    /// Channel for requesting refills
    refill_tx: Sender<usize>,
    /// Background worker thread handle
    worker_handle: Option<JoinHandle<()>>,
    /// Shutdown signal
    shutdown: Arc<Mutex<bool>>,
    /// Statistics
    stats: Arc<Mutex<PoolStats>>,
}

#[derive(Debug, Default)]
struct PoolStats {
    total_bytes_served: u64,
    total_refills: u64,
    refill_errors: u64,
    last_health_check: Option<Instant>,
    last_health_status: HealthStatus,
}

impl EntropyPool {
    /// Create a new entropy pool with the given QRNG device
    pub fn new(
        mut device: Box<dyn QrngDevice>,
        config: EntropyPoolConfig,
    ) -> Result<Self, QrngError> {
        info!("Creating entropy pool with config: {:?}", config);

        // Validate configuration
        if config.min_bytes > config.max_bytes {
            return Err(QrngError::InitializationFailed(
                "min_bytes cannot exceed max_bytes".to_string(),
            ));
        }

        if config.refill_threshold > config.max_bytes {
            return Err(QrngError::InitializationFailed(
                "refill_threshold cannot exceed max_bytes".to_string(),
            ));
        }

        // Initialize device
        device.initialize()?;

        // Create buffer with initial capacity
        let buffer = Arc::new(Mutex::new(Vec::with_capacity(config.max_bytes)));
        let (refill_tx, refill_rx) = bounded(10);
        let shutdown = Arc::new(Mutex::new(false));
        let stats = Arc::new(Mutex::new(PoolStats {
            last_health_status: HealthStatus::Healthy,
            ..Default::default()
        }));

        // Spawn background worker thread
        let worker_handle = Self::spawn_worker(
            device,
            Arc::clone(&buffer),
            config.clone(),
            refill_rx,
            Arc::clone(&shutdown),
            Arc::clone(&stats),
        );

        let pool = Self {
            buffer,
            config,
            refill_tx,
            worker_handle: Some(worker_handle),
            shutdown,
            stats,
        };

        // Initial fill
        pool.request_refill(pool.config.refill_chunk_size)?;

        // Wait for initial fill to complete
        let start = Instant::now();
        while pool.available_bytes() < pool.config.min_bytes {
            if start.elapsed() > Duration::from_secs(5) {
                return Err(QrngError::Timeout(5000));
            }
            thread::sleep(Duration::from_millis(10));
        }

        info!("Entropy pool initialized with {} bytes", pool.available_bytes());
        Ok(pool)
    }

    /// Spawn the background worker thread
    fn spawn_worker(
        mut device: Box<dyn QrngDevice>,
        buffer: Arc<Mutex<Vec<u8>>>,
        config: EntropyPoolConfig,
        refill_rx: Receiver<usize>,
        shutdown: Arc<Mutex<bool>>,
        stats: Arc<Mutex<PoolStats>>,
    ) -> JoinHandle<()> {
        thread::spawn(move || {
            let mut last_health_check = Instant::now();

            loop {
                // Check shutdown signal
                if *shutdown.lock().unwrap() {
                    info!("Entropy pool worker shutting down");
                    break;
                }

                // Handle refill requests
                match refill_rx.recv_timeout(Duration::from_millis(100)) {
                    Ok(requested_bytes) => {
                        debug!("Processing refill request for {} bytes", requested_bytes);

                        let mut chunk = vec![0u8; requested_bytes];
                        match device.get_random_bytes(&mut chunk) {
                            Ok(bytes_read) => {
                                let mut buf = buffer.lock().unwrap();

                                // Ensure we don't exceed max_bytes
                                let available_space = config.max_bytes.saturating_sub(buf.len());
                                let bytes_to_add = bytes_read.min(available_space);

                                buf.extend_from_slice(&chunk[..bytes_to_add]);

                                let mut stats_lock = stats.lock().unwrap();
                                stats_lock.total_refills += 1;

                                debug!("Refilled {} bytes, pool now contains {} bytes",
                                       bytes_to_add, buf.len());
                            }
                            Err(e) => {
                                error!("Failed to refill entropy pool: {}", e);
                                stats.lock().unwrap().refill_errors += 1;
                            }
                        }
                    }
                    Err(_) => {
                        // Timeout, check if we need periodic health check
                        if last_health_check.elapsed() >= config.health_check_interval {
                            match device.health_check() {
                                Ok(status) => {
                                    stats.lock().unwrap().last_health_status = status;
                                    if status != HealthStatus::Healthy {
                                        warn!("Device health status: {:?}", status);
                                    }
                                }
                                Err(e) => {
                                    error!("Health check failed: {}", e);
                                }
                            }
                            last_health_check = Instant::now();
                        }
                    }
                }
            }

            // Cleanup
            let _ = device.shutdown();
        })
    }

    /// Request a refill of the entropy pool
    fn request_refill(&self, bytes: usize) -> Result<(), QrngError> {
        self.refill_tx
            .send(bytes)
            .map_err(|e| QrngError::InitializationFailed(format!("refill channel: {}", e)))
    }

    /// Get the number of bytes currently available in the pool
    pub fn available_bytes(&self) -> usize {
        self.buffer.lock().unwrap().len()
    }

    /// Get random bytes from the pool
    ///
    /// This will block if insufficient entropy is available until the background
    /// worker refills the pool.
    pub fn get_random_bytes(&self, buffer: &mut [u8]) -> Result<(), QrngError> {
        let requested = buffer.len();

        // Trigger refill if below threshold
        let available = self.available_bytes();
        if available < self.config.refill_threshold {
            debug!("Pool below threshold ({} < {}), requesting refill",
                   available, self.config.refill_threshold);
            self.request_refill(self.config.refill_chunk_size)?;
        }

        // Wait for sufficient entropy with timeout
        let start = Instant::now();
        let timeout = Duration::from_secs(5);

        loop {
            let mut buf = self.buffer.lock().unwrap();

            if buf.len() >= requested {
                // Copy requested bytes
                buffer.copy_from_slice(&buf[..requested]);

                // Remove from pool
                buf.drain(..requested);

                // Update stats
                self.stats.lock().unwrap().total_bytes_served += requested as u64;

                debug!("Served {} bytes, {} remaining in pool", requested, buf.len());
                return Ok(());
            }

            drop(buf);

            if start.elapsed() >= timeout {
                return Err(QrngError::Timeout(timeout.as_millis() as u64));
            }

            thread::sleep(Duration::from_millis(10));
        }
    }

    /// Get the current health status
    pub fn health_status(&self) -> HealthStatus {
        self.stats.lock().unwrap().last_health_status
    }

    /// Get pool statistics
    pub fn stats(&self) -> String {
        let stats = self.stats.lock().unwrap();
        format!(
            "Entropy Pool Stats: {} bytes served, {} refills, {} errors, health: {:?}",
            stats.total_bytes_served,
            stats.total_refills,
            stats.refill_errors,
            stats.last_health_status
        )
    }
}

impl Drop for EntropyPool {
    fn drop(&mut self) {
        info!("Shutting down entropy pool");
        *self.shutdown.lock().unwrap() = true;

        if let Some(handle) = self.worker_handle.take() {
            let _ = handle.join();
        }

        info!("{}", self.stats());
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::qrng::mock::MockQrngDevice;

    #[test]
    fn test_pool_creation() {
        let device = Box::new(MockQrngDevice::new());
        let config = EntropyPoolConfig::default();
        let pool = EntropyPool::new(device, config);
        assert!(pool.is_ok());
    }

    #[test]
    fn test_pool_get_random_bytes() {
        let device = Box::new(MockQrngDevice::new());
        let config = EntropyPoolConfig::default();
        let pool = EntropyPool::new(device, config).unwrap();

        let mut buffer = [0u8; 32];
        assert!(pool.get_random_bytes(&mut buffer).is_ok());

        // Mock device uses predictable pattern, verify it's not all zeros
        assert!(buffer.iter().any(|&b| b != 0));
    }

    #[test]
    fn test_pool_refill_on_low_entropy() {
        let device = Box::new(MockQrngDevice::new());
        let mut config = EntropyPoolConfig::default();
        config.min_bytes = 256;
        config.refill_threshold = 512;

        let pool = EntropyPool::new(device, config).unwrap();

        // Drain most of the pool
        let mut buffer = [0u8; 4000];
        assert!(pool.get_random_bytes(&mut buffer).is_ok());

        // Should still be able to get more (triggers refill)
        assert!(pool.get_random_bytes(&mut buffer).is_ok());
    }

    #[test]
    fn test_invalid_config() {
        let device = Box::new(MockQrngDevice::new());
        let mut config = EntropyPoolConfig::default();
        config.min_bytes = 10000;
        config.max_bytes = 1000; // Invalid: min > max

        let result = EntropyPool::new(device, config);
        assert!(matches!(result, Err(QrngError::InitializationFailed(_))));
    }
}
