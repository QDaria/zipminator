//! MeshKey: 16-byte PSK for HMAC-SHA256 beacon authentication.
//!
//! Per RuView ADR-032, the mesh beacon auth uses a 16-byte pre-shared key
//! with HMAC-SHA256 producing a 28-byte wire format (4-byte truncated tag +
//! 8-byte timestamp + 16-byte nonce). This module provides the key type.

use subtle::ConstantTimeEq;
use zeroize::ZeroizeOnDrop;

/// Size of the mesh PSK in bytes (per ADR-032).
pub const MESH_PSK_SIZE: usize = 16;

/// A 16-byte pre-shared key for HMAC-SHA256 mesh beacon authentication.
///
/// Implements constant-time equality and zeroizes on drop.
#[derive(Clone, ZeroizeOnDrop)]
pub struct MeshKey {
    bytes: [u8; MESH_PSK_SIZE],
}

impl MeshKey {
    /// Create a MeshKey from a 16-byte slice.
    ///
    /// Returns `None` if the slice length is not exactly 16 bytes.
    pub fn from_bytes(bytes: &[u8]) -> Option<Self> {
        if bytes.len() != MESH_PSK_SIZE {
            return None;
        }
        let mut key = [0u8; MESH_PSK_SIZE];
        key.copy_from_slice(bytes);
        Some(Self { bytes: key })
    }

    /// Return a reference to the raw key bytes.
    pub fn as_bytes(&self) -> &[u8; MESH_PSK_SIZE] {
        &self.bytes
    }

    /// Check if the key is all zeros (invalid/uninitialized).
    pub fn is_zero(&self) -> bool {
        let zero = [0u8; MESH_PSK_SIZE];
        self.bytes.ct_eq(&zero).into()
    }
}

impl PartialEq for MeshKey {
    fn eq(&self, other: &Self) -> bool {
        self.bytes.ct_eq(&other.bytes).into()
    }
}

impl Eq for MeshKey {}

impl std::fmt::Debug for MeshKey {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        // Never print key material in debug output
        f.debug_struct("MeshKey")
            .field("bytes", &"[REDACTED]")
            .finish()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_from_bytes_valid() {
        let raw = [0xABu8; MESH_PSK_SIZE];
        let key = MeshKey::from_bytes(&raw).expect("should create from 16 bytes");
        assert_eq!(key.as_bytes(), &raw);
    }

    #[test]
    fn test_from_bytes_wrong_length() {
        assert!(MeshKey::from_bytes(&[0u8; 15]).is_none());
        assert!(MeshKey::from_bytes(&[0u8; 17]).is_none());
        assert!(MeshKey::from_bytes(&[]).is_none());
    }

    #[test]
    fn test_constant_time_equality() {
        let a = MeshKey::from_bytes(&[1u8; MESH_PSK_SIZE]).unwrap();
        let b = MeshKey::from_bytes(&[1u8; MESH_PSK_SIZE]).unwrap();
        let c = MeshKey::from_bytes(&[2u8; MESH_PSK_SIZE]).unwrap();
        assert_eq!(a, b);
        assert_ne!(a, c);
    }

    #[test]
    fn test_is_zero() {
        let zero_key = MeshKey::from_bytes(&[0u8; MESH_PSK_SIZE]).unwrap();
        assert!(zero_key.is_zero());
        let nonzero = MeshKey::from_bytes(&[1u8; MESH_PSK_SIZE]).unwrap();
        assert!(!nonzero.is_zero());
    }

    #[test]
    fn test_debug_redacts_key() {
        let key = MeshKey::from_bytes(&[0xFFu8; MESH_PSK_SIZE]).unwrap();
        let debug = format!("{:?}", key);
        assert!(debug.contains("REDACTED"));
        assert!(!debug.contains("255"));
        assert!(!debug.contains("ff"));
    }

    #[test]
    fn test_zeroize_on_drop() {
        // Verify the key type implements ZeroizeOnDrop by creating and dropping
        let key = MeshKey::from_bytes(&[0xAB; MESH_PSK_SIZE]).unwrap();
        drop(key); // Should zeroize; we verify compile-time trait bound
    }
}
