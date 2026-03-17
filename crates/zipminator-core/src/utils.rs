//! Utility functions for Kyber-768

use sha3::{Sha3_256, Sha3_512, Shake128, Shake256};
use sha3::digest::{Update, FixedOutput, ExtendableOutput, XofReader};

/// SHA3-256 hash
pub fn sha3_256(data: &[u8]) -> [u8; 32] {
    let mut hasher = Sha3_256::default();
    hasher.update(data);
    let result = hasher.finalize_fixed();
    let mut out = [0u8; 32];
    out.copy_from_slice(&result);
    out
}

/// SHA3-512 hash
pub fn sha3_512(data: &[u8]) -> [u8; 64] {
    let mut hasher = Sha3_512::default();
    hasher.update(data);
    let result = hasher.finalize_fixed();
    let mut out = [0u8; 64];
    out.copy_from_slice(&result);
    out
}

/// SHAKE-128 XOF
pub fn shake128(data: &[u8], outlen: usize) -> Vec<u8> {
    let mut hasher = Shake128::default();
    hasher.update(data);
    let mut reader = hasher.finalize_xof();
    let mut out = vec![0u8; outlen];
    reader.read(&mut out);
    out
}

/// SHAKE-256 XOF
pub fn shake256(data: &[u8], outlen: usize) -> Vec<u8> {
    let mut hasher = Shake256::default();
    hasher.update(data);
    let mut reader = hasher.finalize_xof();
    let mut out = vec![0u8; outlen];
    reader.read(&mut out);
    out
}

/// Constant-time comparison
pub fn ct_eq(a: &[u8], b: &[u8]) -> bool {
    use subtle::ConstantTimeEq;
    if a.len() != b.len() {
        return false;
    }
    a.ct_eq(b).into()
}

/// Generate random bytes (for testing, replace with QRNG in production)
pub fn randombytes(out: &mut [u8]) {
    use getrandom::getrandom;
    getrandom(out).expect("Failed to generate random bytes");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sha3_256() {
        let data = b"test";
        let hash1 = sha3_256(data);
        let hash2 = sha3_256(data);
        assert_eq!(hash1, hash2);
        assert_eq!(hash1.len(), 32);
    }

    #[test]
    fn test_ct_eq() {
        let a = [1u8, 2, 3, 4];
        let b = [1u8, 2, 3, 4];
        let c = [1u8, 2, 3, 5];

        assert!(ct_eq(&a, &b));
        assert!(!ct_eq(&a, &c));
    }
}
