//! Entropy Bridge: reads quantum entropy from pool file and derives mesh keys.
//!
//! Uses HKDF-SHA256 to derive purpose-specific keys from raw quantum entropy.
//! The pool file path is configurable (default: `quantum_entropy/quantum_entropy_pool.bin`).

use std::io::Read;
use std::path::{Path, PathBuf};

use hkdf::Hkdf;
use sha2::Sha256;
use zeroize::Zeroize;

use crate::mesh_key::{MeshKey, MESH_PSK_SIZE};
use crate::siphash_key::{SipHashKey, SIPHASH_KEY_SIZE};

/// Default path to the quantum entropy pool file.
pub const DEFAULT_POOL_PATH: &str = "quantum_entropy/quantum_entropy_pool.bin";

/// Minimum entropy bytes required to derive keys (32 bytes for HKDF input keying material).
const MIN_ENTROPY_BYTES: usize = 32;

/// HKDF info string for mesh PSK derivation.
const HKDF_INFO_MESH_PSK: &[u8] = b"zipminator-mesh-psk-v1";

/// HKDF info string for SipHash key derivation.
const HKDF_INFO_SIPHASH: &[u8] = b"zipminator-mesh-siphash-v1";

/// Errors from the entropy bridge.
#[derive(Debug, thiserror::Error)]
pub enum EntropyBridgeError {
    /// Pool file not found or inaccessible.
    #[error("entropy pool not accessible: {0}")]
    PoolNotAccessible(String),

    /// Pool file contains insufficient entropy.
    #[error("insufficient entropy: need {needed} bytes, pool has {available}")]
    InsufficientEntropy { needed: usize, available: usize },

    /// IO error reading the pool.
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    /// HKDF expansion failed (should not happen with valid inputs).
    #[error("key derivation failed")]
    KeyDerivationFailed,
}

/// Trait for providing raw entropy bytes. Enables testing with mock sources.
pub trait PoolEntropySource: Send + Sync {
    /// Read up to `buf.len()` bytes of entropy into `buf`.
    /// Returns the number of bytes actually read.
    fn read_entropy(&mut self, buf: &mut [u8]) -> Result<usize, EntropyBridgeError>;

    /// Return the total available entropy in bytes.
    fn available(&self) -> Result<usize, EntropyBridgeError>;
}

/// File-backed entropy source that reads from the quantum entropy pool binary.
#[derive(Debug)]
pub struct FilePoolSource {
    path: PathBuf,
}

impl FilePoolSource {
    /// Create a new file-backed entropy source.
    ///
    /// The path should point to a raw binary file of quantum entropy bytes
    /// (e.g., the output of `scripts/qrng_harvester.py`).
    pub fn new(path: impl AsRef<Path>) -> Result<Self, EntropyBridgeError> {
        let path = path.as_ref().to_path_buf();
        if !path.exists() {
            return Err(EntropyBridgeError::PoolNotAccessible(format!(
                "file not found: {}",
                path.display()
            )));
        }
        Ok(Self { path })
    }
}

impl PoolEntropySource for FilePoolSource {
    fn read_entropy(&mut self, buf: &mut [u8]) -> Result<usize, EntropyBridgeError> {
        let mut file = std::fs::File::open(&self.path)?;
        let bytes_read = file.read(buf)?;
        Ok(bytes_read)
    }

    fn available(&self) -> Result<usize, EntropyBridgeError> {
        let metadata = std::fs::metadata(&self.path)?;
        Ok(metadata.len() as usize)
    }
}

/// In-memory entropy source for testing.
#[cfg(test)]
pub struct MemoryEntropySource {
    data: Vec<u8>,
    offset: usize,
}

#[cfg(test)]
impl MemoryEntropySource {
    pub fn new(data: Vec<u8>) -> Self {
        Self { data, offset: 0 }
    }
}

#[cfg(test)]
impl PoolEntropySource for MemoryEntropySource {
    fn read_entropy(&mut self, buf: &mut [u8]) -> Result<usize, EntropyBridgeError> {
        let remaining = self.data.len().saturating_sub(self.offset);
        let to_read = buf.len().min(remaining);
        buf[..to_read].copy_from_slice(&self.data[self.offset..self.offset + to_read]);
        self.offset += to_read;
        Ok(to_read)
    }

    fn available(&self) -> Result<usize, EntropyBridgeError> {
        Ok(self.data.len().saturating_sub(self.offset))
    }
}

/// The entropy bridge: derives mesh cryptographic keys from quantum entropy.
pub struct EntropyBridge<S: PoolEntropySource> {
    source: S,
}

impl<S: PoolEntropySource> EntropyBridge<S> {
    /// Create a new entropy bridge with the given entropy source.
    pub fn new(source: S) -> Self {
        Self { source }
    }

    /// Derive a MeshKey (16-byte PSK) for HMAC-SHA256 beacon authentication.
    ///
    /// Reads `MIN_ENTROPY_BYTES` from the pool and uses HKDF-SHA256 to derive
    /// a 16-byte key with the info string `zipminator-mesh-psk-v1`.
    ///
    /// An optional `salt` can be provided for domain separation (e.g., mesh network ID).
    pub fn derive_mesh_key(&mut self, salt: Option<&[u8]>) -> Result<MeshKey, EntropyBridgeError> {
        let mut ikm = self.read_ikm()?;
        let result = self.hkdf_derive(&ikm, salt, HKDF_INFO_MESH_PSK, MESH_PSK_SIZE);
        ikm.zeroize();
        let derived = result?;
        MeshKey::from_bytes(&derived).ok_or(EntropyBridgeError::KeyDerivationFailed)
    }

    /// Derive a SipHashKey (16-byte / 128-bit) for SipHash-2-4 frame integrity.
    ///
    /// Reads `MIN_ENTROPY_BYTES` from the pool and uses HKDF-SHA256 to derive
    /// a 16-byte key with the info string `zipminator-mesh-siphash-v1`.
    pub fn derive_siphash_key(
        &mut self,
        salt: Option<&[u8]>,
    ) -> Result<SipHashKey, EntropyBridgeError> {
        let mut ikm = self.read_ikm()?;
        let result = self.hkdf_derive(&ikm, salt, HKDF_INFO_SIPHASH, SIPHASH_KEY_SIZE);
        ikm.zeroize();
        let derived = result?;
        SipHashKey::from_bytes(&derived).ok_or(EntropyBridgeError::KeyDerivationFailed)
    }

    /// Derive both mesh keys in one call (PSK + SipHash), reading entropy once.
    pub fn derive_mesh_key_pair(
        &mut self,
        salt: Option<&[u8]>,
    ) -> Result<(MeshKey, SipHashKey), EntropyBridgeError> {
        let mut ikm = self.read_ikm()?;

        let psk_bytes = self.hkdf_derive(&ikm, salt, HKDF_INFO_MESH_PSK, MESH_PSK_SIZE)?;
        let sip_bytes = self.hkdf_derive(&ikm, salt, HKDF_INFO_SIPHASH, SIPHASH_KEY_SIZE)?;

        ikm.zeroize();

        let mesh_key =
            MeshKey::from_bytes(&psk_bytes).ok_or(EntropyBridgeError::KeyDerivationFailed)?;
        let siphash_key =
            SipHashKey::from_bytes(&sip_bytes).ok_or(EntropyBridgeError::KeyDerivationFailed)?;

        Ok((mesh_key, siphash_key))
    }

    /// Read input keying material from entropy source.
    fn read_ikm(&mut self) -> Result<Vec<u8>, EntropyBridgeError> {
        let available = self.source.available()?;
        if available < MIN_ENTROPY_BYTES {
            return Err(EntropyBridgeError::InsufficientEntropy {
                needed: MIN_ENTROPY_BYTES,
                available,
            });
        }

        let mut ikm = vec![0u8; MIN_ENTROPY_BYTES];
        let bytes_read = self.source.read_entropy(&mut ikm)?;
        if bytes_read < MIN_ENTROPY_BYTES {
            return Err(EntropyBridgeError::InsufficientEntropy {
                needed: MIN_ENTROPY_BYTES,
                available: bytes_read,
            });
        }

        Ok(ikm)
    }

    /// HKDF-SHA256 key derivation.
    fn hkdf_derive(
        &self,
        ikm: &[u8],
        salt: Option<&[u8]>,
        info: &[u8],
        output_len: usize,
    ) -> Result<Vec<u8>, EntropyBridgeError> {
        let hk = Hkdf::<Sha256>::new(salt, ikm);
        let mut okm = vec![0u8; output_len];
        hk.expand(info, &mut okm)
            .map_err(|_| EntropyBridgeError::KeyDerivationFailed)?;
        Ok(okm)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_entropy(len: usize) -> Vec<u8> {
        // Deterministic pseudo-entropy for testing (NOT for production)
        (0..len).map(|i| (i % 256) as u8).collect()
    }

    #[test]
    fn test_derive_mesh_key_success() {
        let source = MemoryEntropySource::new(make_entropy(64));
        let mut bridge = EntropyBridge::new(source);
        let key = bridge.derive_mesh_key(None).expect("should derive key");
        assert!(!key.is_zero(), "derived key should not be all zeros");
        assert_eq!(key.as_bytes().len(), MESH_PSK_SIZE);
    }

    #[test]
    fn test_derive_siphash_key_success() {
        let source = MemoryEntropySource::new(make_entropy(64));
        let mut bridge = EntropyBridge::new(source);
        let key = bridge.derive_siphash_key(None).expect("should derive key");
        assert!(!key.is_zero(), "derived key should not be all zeros");
        assert_eq!(key.as_bytes().len(), SIPHASH_KEY_SIZE);
    }

    #[test]
    fn test_derive_key_pair() {
        let source = MemoryEntropySource::new(make_entropy(128));
        let mut bridge = EntropyBridge::new(source);
        let (mesh, siphash) = bridge.derive_mesh_key_pair(None).expect("should derive pair");
        assert!(!mesh.is_zero());
        assert!(!siphash.is_zero());
        // PSK and SipHash keys should differ (different HKDF info strings)
        assert_ne!(mesh.as_bytes()[..], siphash.as_bytes()[..]);
    }

    #[test]
    fn test_insufficient_entropy() {
        let source = MemoryEntropySource::new(make_entropy(16)); // too few
        let mut bridge = EntropyBridge::new(source);
        let result = bridge.derive_mesh_key(None);
        assert!(result.is_err());
        match result.unwrap_err() {
            EntropyBridgeError::InsufficientEntropy { needed, available } => {
                assert_eq!(needed, MIN_ENTROPY_BYTES);
                assert_eq!(available, 16);
            }
            other => panic!("expected InsufficientEntropy, got: {:?}", other),
        }
    }

    #[test]
    fn test_empty_entropy() {
        let source = MemoryEntropySource::new(Vec::new());
        let mut bridge = EntropyBridge::new(source);
        assert!(bridge.derive_mesh_key(None).is_err());
    }

    #[test]
    fn test_salt_produces_different_keys() {
        let source1 = MemoryEntropySource::new(make_entropy(64));
        let source2 = MemoryEntropySource::new(make_entropy(64));

        let mut bridge1 = EntropyBridge::new(source1);
        let mut bridge2 = EntropyBridge::new(source2);

        let key_no_salt = bridge1.derive_mesh_key(None).unwrap();
        let key_with_salt = bridge2.derive_mesh_key(Some(b"mesh-net-42")).unwrap();

        // Same IKM + different salt => different output
        assert_ne!(key_no_salt, key_with_salt);
    }

    #[test]
    fn test_deterministic_derivation() {
        // Same entropy + same salt => same key
        let source1 = MemoryEntropySource::new(make_entropy(64));
        let source2 = MemoryEntropySource::new(make_entropy(64));

        let mut bridge1 = EntropyBridge::new(source1);
        let mut bridge2 = EntropyBridge::new(source2);

        let key1 = bridge1.derive_mesh_key(Some(b"test")).unwrap();
        let key2 = bridge2.derive_mesh_key(Some(b"test")).unwrap();
        assert_eq!(key1, key2);
    }

    #[test]
    fn test_file_pool_source_missing_file() {
        let result = FilePoolSource::new("/nonexistent/path/pool.bin");
        assert!(result.is_err());
        match result.unwrap_err() {
            EntropyBridgeError::PoolNotAccessible(msg) => {
                assert!(msg.contains("not found"));
            }
            other => panic!("expected PoolNotAccessible, got: {:?}", other),
        }
    }

    #[test]
    fn test_file_pool_source_read() {
        let dir = tempfile::tempdir().unwrap();
        let pool_path = dir.path().join("test_pool.bin");
        let entropy = make_entropy(256);
        std::fs::write(&pool_path, &entropy).unwrap();

        let mut source = FilePoolSource::new(&pool_path).unwrap();
        assert_eq!(source.available().unwrap(), 256);

        let mut buf = [0u8; 32];
        let read = source.read_entropy(&mut buf).unwrap();
        assert_eq!(read, 32);
        assert_eq!(&buf[..], &entropy[..32]);
    }

    #[test]
    fn test_file_backed_bridge() {
        let dir = tempfile::tempdir().unwrap();
        let pool_path = dir.path().join("test_pool.bin");
        std::fs::write(&pool_path, &make_entropy(256)).unwrap();

        let source = FilePoolSource::new(&pool_path).unwrap();
        let mut bridge = EntropyBridge::new(source);

        let key = bridge.derive_mesh_key(None).unwrap();
        assert!(!key.is_zero());
    }

    #[test]
    fn test_ikm_is_zeroized_after_derivation() {
        // This test verifies the code path that zeroizes IKM.
        // We cannot directly inspect memory, but we verify that
        // successive derivations with fresh entropy produce valid keys.
        let source = MemoryEntropySource::new(make_entropy(128));
        let mut bridge = EntropyBridge::new(source);

        let key1 = bridge.derive_mesh_key(None).unwrap();
        // The internal IKM should have been zeroized by now.
        // Second derivation reads fresh entropy bytes from offset 32..64.
        let key2 = bridge.derive_mesh_key(None).unwrap();

        // Different IKM bytes => different keys
        assert_ne!(key1, key2);
    }
}
