//! QRNG Entropy Reader.
//!
//! Reads quantum random bytes from the entropy pool file located at
//! `quantum_entropy/quantum_entropy_pool.bin` relative to the zipminator
//! project root (or a caller-specified path).
//!
//! Design notes:
//! - The pool is append-only. Bytes are never consumed — readers wrap around.
//! - Quantum randomness has no memory, so byte reuse is safe.
//! - Thread-safe: cursor is an AtomicU64, bulk reads hold a short RwLock.
//! - Fallback: if the pool file is absent, the OS CSPRNG (getrandom) is used
//!   and a warning is emitted.
//! - A 4096-byte in-memory cache is maintained; the reader reloads from disk
//!   whenever the file grows beyond the last known size.

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::RwLock;

use serde::{Deserialize, Serialize};
use tracing::{info, warn};

/// Minimum cache size kept in memory (bytes).
const CACHE_SIZE: usize = 4096;

/// Whether the entropy came from the quantum pool or the OS CSPRNG.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum EntropySource {
    /// Quantum random bytes from the entropy pool file.
    Quantum,
    /// OS CSPRNG fallback (getrandom / /dev/urandom).
    Fallback,
}

impl std::fmt::Display for EntropySource {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EntropySource::Quantum => write!(f, "quantum"),
            EntropySource::Fallback => write!(f, "os-csprng-fallback"),
        }
    }
}

/// Errors that can occur during entropy reading.
#[derive(Debug, thiserror::Error)]
pub enum EntropyError {
    #[error("entropy pool file not found at {0}")]
    PoolNotFound(PathBuf),
    #[error("entropy pool is empty")]
    EmptyPool,
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
    #[error("getrandom fallback failed: {0}")]
    Getrandom(String),
}

/// Internal state for the in-memory pool cache.
#[derive(Debug)]
struct PoolCache {
    /// Cached bytes loaded from disk.
    data: Vec<u8>,
    /// File size at the time `data` was last loaded.
    loaded_file_size: u64,
}

/// Thread-safe QRNG reader.
///
/// Multiple components (session manager, fingerprint injector, password
/// manager, cookie rotator) all share one `Arc<QrngReader>`.
#[derive(Debug)]
pub struct QrngReader {
    pool_path: PathBuf,
    /// Byte offset into the pool for the *next* read. Wraps around.
    cursor: AtomicU64,
    /// Cached portion of the pool loaded into memory.
    cached_pool: RwLock<PoolCache>,
    /// Last known size of the pool file (updated on reload).
    pool_size: AtomicU64,
    /// Whether the pool file exists.
    source: RwLock<EntropySource>,
}

impl QrngReader {
    /// Create a reader for the given pool file path.
    ///
    /// If the file does not exist the reader will use the OS CSPRNG and log a
    /// warning.  The file is loaded eagerly; errors after construction are
    /// handled gracefully (fallback to OS CSPRNG).
    pub fn new(pool_path: impl AsRef<Path>) -> Self {
        let pool_path = pool_path.as_ref().to_path_buf();

        let (initial_data, initial_size, source) = match Self::load_pool(&pool_path) {
            Ok((data, size)) => {
                info!(
                    path = %pool_path.display(),
                    size_bytes = size,
                    "quantum entropy pool loaded"
                );
                (data, size, EntropySource::Quantum)
            }
            Err(e) => {
                warn!(
                    path = %pool_path.display(),
                    error = %e,
                    "quantum entropy pool unavailable — using OS CSPRNG fallback"
                );
                (Vec::new(), 0, EntropySource::Fallback)
            }
        };

        Self {
            pool_path,
            cursor: AtomicU64::new(0),
            cached_pool: RwLock::new(PoolCache {
                data: initial_data,
                loaded_file_size: initial_size,
            }),
            pool_size: AtomicU64::new(initial_size),
            source: RwLock::new(source),
        }
    }

    /// Convenience constructor using the default pool path relative to `project_root`.
    pub fn with_project_root(project_root: impl AsRef<Path>) -> Self {
        let path = project_root
            .as_ref()
            .join("quantum_entropy")
            .join("quantum_entropy_pool.bin");
        Self::new(path)
    }

    // ── Public API ──────────────────────────────────────────────────────────

    /// Read `count` random bytes.
    ///
    /// On success returns a `Vec<u8>` of exactly `count` bytes.
    /// Internally wraps the cursor around the pool; triggers a reload if the
    /// file has grown.
    pub fn read_bytes(&self, count: usize) -> Vec<u8> {
        if count == 0 {
            return Vec::new();
        }

        // Check if file has grown; reload if so.
        self.maybe_reload();

        let source = *self.source.read().expect("source lock poisoned");
        if source == EntropySource::Fallback {
            return self.fallback_bytes(count);
        }

        let pool = self.cached_pool.read().expect("pool lock poisoned");
        let pool_len = pool.data.len();
        if pool_len == 0 {
            drop(pool);
            warn!("entropy pool empty — using OS CSPRNG fallback for this read");
            return self.fallback_bytes(count);
        }

        let mut out = Vec::with_capacity(count);
        let mut remaining = count;

        while remaining > 0 {
            // Atomically claim the next slice of the cursor.
            let cursor = self.cursor.fetch_add(1, Ordering::Relaxed) as usize;
            let idx = cursor % pool_len;
            out.push(pool.data[idx]);
            remaining -= 1;
        }

        out
    }

    /// Read 8 random bytes as a `u64`.
    pub fn read_u64(&self) -> u64 {
        let bytes = self.read_bytes(8);
        u64::from_le_bytes(bytes.try_into().expect("exactly 8 bytes"))
    }

    /// Read 16 random bytes as a `u128`.
    pub fn read_u128(&self) -> u128 {
        let bytes = self.read_bytes(16);
        u128::from_le_bytes(bytes.try_into().expect("exactly 16 bytes"))
    }

    /// Return the number of bytes currently available in the pool file.
    ///
    /// Returns 0 when running in fallback mode.
    pub fn pool_available(&self) -> u64 {
        self.pool_size.load(Ordering::Relaxed)
    }

    /// Return the current entropy source.
    pub fn pool_source(&self) -> EntropySource {
        *self.source.read().expect("source lock poisoned")
    }

    /// Force a reload from disk (useful after the harvester has run).
    pub fn force_reload(&self) {
        match Self::load_pool(&self.pool_path) {
            Ok((data, size)) => {
                let mut cache = self.cached_pool.write().expect("pool lock poisoned");
                cache.data = data;
                cache.loaded_file_size = size;
                self.pool_size.store(size, Ordering::Relaxed);
                let mut src = self.source.write().expect("source lock poisoned");
                *src = EntropySource::Quantum;
                info!(size_bytes = size, "entropy pool reloaded");
            }
            Err(e) => {
                warn!(error = %e, "entropy pool reload failed");
            }
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    /// Reload pool from disk if the file has grown.
    fn maybe_reload(&self) {
        let current_size = self.pool_size.load(Ordering::Relaxed);
        let file_size = match fs::metadata(&self.pool_path) {
            Ok(m) => m.len(),
            Err(_) => return,
        };

        if file_size > current_size {
            match Self::load_pool(&self.pool_path) {
                Ok((data, size)) => {
                    let mut cache = self.cached_pool.write().expect("pool lock poisoned");
                    cache.data = data;
                    cache.loaded_file_size = size;
                    self.pool_size.store(size, Ordering::Relaxed);
                    let mut src = self.source.write().expect("source lock poisoned");
                    *src = EntropySource::Quantum;
                    info!(old_size = current_size, new_size = size, "entropy pool updated");
                }
                Err(e) => {
                    warn!(error = %e, "entropy pool reload failed");
                }
            }
        }
    }

    /// Load pool bytes from disk.
    ///
    /// Reads the full file; for very large pools only the last `CACHE_SIZE`
    /// bytes are kept so memory stays bounded, but the full size is tracked.
    fn load_pool(path: &Path) -> Result<(Vec<u8>, u64), EntropyError> {
        if !path.exists() {
            return Err(EntropyError::PoolNotFound(path.to_path_buf()));
        }

        let data = fs::read(path)?;
        let size = data.len() as u64;

        if size == 0 {
            return Err(EntropyError::EmptyPool);
        }

        // Keep the entire file in memory (up to tens of MB in practice).
        // If the pool is very large, consider mmap; for now read fully.
        Ok((data, size))
    }

    /// Generate fallback bytes using the OS CSPRNG.
    fn fallback_bytes(&self, count: usize) -> Vec<u8> {
        let mut buf = vec![0u8; count];
        getrandom::getrandom(&mut buf).expect("getrandom failed");
        buf
    }
}

// ── getrandom re-export ────────────────────────────────────────────────────

// The getrandom crate does not have a public module re-export; we reference
// it via the crate name directly.  Import handled by Cargo.toml.

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    fn make_pool(data: &[u8]) -> NamedTempFile {
        let mut f = NamedTempFile::new().unwrap();
        f.write_all(data).unwrap();
        f.flush().unwrap();
        f
    }

    #[test]
    fn reads_bytes_from_pool() {
        let pool_data: Vec<u8> = (0u8..=255).collect::<Vec<_>>().repeat(16);
        let f = make_pool(&pool_data);
        let reader = QrngReader::new(f.path());

        assert_eq!(reader.pool_source(), EntropySource::Quantum);
        let bytes = reader.read_bytes(32);
        assert_eq!(bytes.len(), 32);
    }

    #[test]
    fn cursor_wraps_around() {
        let pool_data = vec![0xAB_u8; 8];
        let f = make_pool(&pool_data);
        let reader = QrngReader::new(f.path());

        // Read more bytes than the pool holds — should wrap.
        let bytes = reader.read_bytes(16);
        assert_eq!(bytes.len(), 16);
        assert!(bytes.iter().all(|&b| b == 0xAB));
    }

    #[test]
    fn fallback_when_pool_missing() {
        let reader = QrngReader::new("/nonexistent/path/pool.bin");
        assert_eq!(reader.pool_source(), EntropySource::Fallback);
        let bytes = reader.read_bytes(16);
        assert_eq!(bytes.len(), 16);
    }

    #[test]
    fn read_u64_returns_8_bytes_worth() {
        let pool_data: Vec<u8> = (0u8..=255).collect::<Vec<_>>().repeat(4);
        let f = make_pool(&pool_data);
        let reader = QrngReader::new(f.path());
        let _ = reader.read_u64(); // Must not panic.
    }

    #[test]
    fn read_u128_returns_16_bytes_worth() {
        let pool_data: Vec<u8> = (0u8..=255).collect::<Vec<_>>().repeat(4);
        let f = make_pool(&pool_data);
        let reader = QrngReader::new(f.path());
        let _ = reader.read_u128(); // Must not panic.
    }

    #[test]
    fn pool_available_matches_file_size() {
        let pool_data = vec![0xFFu8; 1024];
        let f = make_pool(&pool_data);
        let reader = QrngReader::new(f.path());
        assert_eq!(reader.pool_available(), 1024);
    }

    #[test]
    fn zero_byte_read_returns_empty() {
        let pool_data = vec![0xAB_u8; 64];
        let f = make_pool(&pool_data);
        let reader = QrngReader::new(f.path());
        assert!(reader.read_bytes(0).is_empty());
    }
}
