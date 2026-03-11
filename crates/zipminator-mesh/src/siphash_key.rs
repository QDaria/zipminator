//! SipHashKey: 16-byte key for SipHash-2-4 frame integrity.
//!
//! Per RuView ADR-032, mesh frame integrity uses SipHash-2-4 with a
//! 128-bit key (two u64 halves: k0, k1). This module provides the key type
//! with QRNG-derived key material.

use subtle::ConstantTimeEq;
use zeroize::ZeroizeOnDrop;

/// Size of SipHash-2-4 key in bytes (128 bits = two u64).
pub const SIPHASH_KEY_SIZE: usize = 16;

/// A 128-bit SipHash-2-4 key split into two u64 halves (k0, k1).
///
/// Implements constant-time equality and zeroizes on drop.
#[derive(Clone, ZeroizeOnDrop)]
pub struct SipHashKey {
    bytes: [u8; SIPHASH_KEY_SIZE],
}

impl SipHashKey {
    /// Create a SipHashKey from a 16-byte slice.
    ///
    /// Returns `None` if the slice length is not exactly 16 bytes.
    pub fn from_bytes(bytes: &[u8]) -> Option<Self> {
        if bytes.len() != SIPHASH_KEY_SIZE {
            return None;
        }
        let mut key = [0u8; SIPHASH_KEY_SIZE];
        key.copy_from_slice(bytes);
        Some(Self { bytes: key })
    }

    /// Return the raw key bytes.
    pub fn as_bytes(&self) -> &[u8; SIPHASH_KEY_SIZE] {
        &self.bytes
    }

    /// Return the first half of the key (k0) as u64, little-endian.
    pub fn k0(&self) -> u64 {
        u64::from_le_bytes(self.bytes[..8].try_into().expect("slice is 8 bytes"))
    }

    /// Return the second half of the key (k1) as u64, little-endian.
    pub fn k1(&self) -> u64 {
        u64::from_le_bytes(self.bytes[8..16].try_into().expect("slice is 8 bytes"))
    }

    /// Check if the key is all zeros (invalid/uninitialized).
    pub fn is_zero(&self) -> bool {
        let zero = [0u8; SIPHASH_KEY_SIZE];
        self.bytes.ct_eq(&zero).into()
    }
}

impl PartialEq for SipHashKey {
    fn eq(&self, other: &Self) -> bool {
        self.bytes.ct_eq(&other.bytes).into()
    }
}

impl Eq for SipHashKey {}

impl std::fmt::Debug for SipHashKey {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("SipHashKey")
            .field("bytes", &"[REDACTED]")
            .finish()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_from_bytes_valid() {
        let raw = [0xCDu8; SIPHASH_KEY_SIZE];
        let key = SipHashKey::from_bytes(&raw).expect("should create from 16 bytes");
        assert_eq!(key.as_bytes(), &raw);
    }

    #[test]
    fn test_from_bytes_wrong_length() {
        assert!(SipHashKey::from_bytes(&[0u8; 15]).is_none());
        assert!(SipHashKey::from_bytes(&[0u8; 17]).is_none());
    }

    #[test]
    fn test_k0_k1_extraction() {
        let mut raw = [0u8; SIPHASH_KEY_SIZE];
        // k0 = 0x0807060504030201 (LE), k1 = 0x100f0e0d0c0b0a09 (LE)
        for i in 0..16 {
            raw[i] = (i + 1) as u8;
        }
        let key = SipHashKey::from_bytes(&raw).unwrap();
        assert_eq!(key.k0(), u64::from_le_bytes([1, 2, 3, 4, 5, 6, 7, 8]));
        assert_eq!(key.k1(), u64::from_le_bytes([9, 10, 11, 12, 13, 14, 15, 16]));
    }

    #[test]
    fn test_constant_time_equality() {
        let a = SipHashKey::from_bytes(&[0x11u8; SIPHASH_KEY_SIZE]).unwrap();
        let b = SipHashKey::from_bytes(&[0x11u8; SIPHASH_KEY_SIZE]).unwrap();
        let c = SipHashKey::from_bytes(&[0x22u8; SIPHASH_KEY_SIZE]).unwrap();
        assert_eq!(a, b);
        assert_ne!(a, c);
    }

    #[test]
    fn test_is_zero() {
        let zero = SipHashKey::from_bytes(&[0u8; SIPHASH_KEY_SIZE]).unwrap();
        assert!(zero.is_zero());
        let nonzero = SipHashKey::from_bytes(&[1u8; SIPHASH_KEY_SIZE]).unwrap();
        assert!(!nonzero.is_zero());
    }

    #[test]
    fn test_debug_redacts_key() {
        let key = SipHashKey::from_bytes(&[0xAA; SIPHASH_KEY_SIZE]).unwrap();
        let debug = format!("{:?}", key);
        assert!(debug.contains("REDACTED"));
        assert!(!debug.contains("170")); // 0xAA = 170
    }
}
