//! KDF functions for the PQ Double Ratchet protocol.
//!
//! Implements the three-layer key derivation:
//!   - Root KDF: mixing a KEM shared secret into root/chain keys
//!   - Chain KDF: advancing a chain key to produce message keys
//!   - Message key expansion: deriving AES-256-GCM key + nonce

use hkdf::Hkdf;
use hmac::{Hmac, Mac};
use sha2::Sha256;
use zeroize::Zeroize;

type HmacSha256 = Hmac<Sha256>;

const ROOT_KDF_INFO: &[u8] = b"PQRatchetRootKDF_v1";
const MSG_KEY_INFO: &[u8] = b"PQRatchetMsgKey_v1";

/// Root KDF: mix a KEM shared secret into the root key to produce
/// a new root key and a new chain key.
///
/// `root_key`  — current 32-byte root key
/// `ss`        — 32-byte KEM shared secret from a DH/KEM ratchet step
///
/// Returns `(new_root_key, new_chain_key)`.
pub fn root_kdf(root_key: &[u8; 32], ss: &[u8; 32]) -> ([u8; 32], [u8; 32]) {
    let hk = Hkdf::<Sha256>::new(Some(root_key), ss);
    let mut okm = [0u8; 64];
    hk.expand(ROOT_KDF_INFO, &mut okm).expect("HKDF expand 64 bytes");

    let mut rk = [0u8; 32];
    let mut ck = [0u8; 32];
    rk.copy_from_slice(&okm[..32]);
    ck.copy_from_slice(&okm[32..]);
    okm.zeroize();
    (rk, ck)
}

/// Chain KDF: advance a chain key by one step.
///
/// Uses HMAC-SHA-256 with two fixed input bytes to maintain
/// forward secrecy: output 0x01 becomes the message key,
/// output 0x02 becomes the next chain key.
///
/// Returns `(message_key, next_chain_key)`.
pub fn chain_kdf(chain_key: &[u8; 32]) -> ([u8; 32], [u8; 32]) {
    // message key: HMAC-SHA256(chain_key, 0x01)
    let mut mac1 = HmacSha256::new_from_slice(chain_key).expect("HMAC accepts any key length");
    mac1.update(&[0x01]);
    let msg_key: [u8; 32] = mac1
        .finalize()
        .into_bytes()
        .into();

    // next chain key: HMAC-SHA256(chain_key, 0x02)
    let mut mac2 = HmacSha256::new_from_slice(chain_key).expect("HMAC accepts any key length");
    mac2.update(&[0x02]);
    let next_ck: [u8; 32] = mac2
        .finalize()
        .into_bytes()
        .into();

    (msg_key, next_ck)
}

/// Message key expansion: derive an AES-256-GCM key and a 12-byte nonce
/// from a 32-byte message key and a message counter.
///
/// The counter is XOR'd into the last 4 bytes of the nonce to ensure
/// uniqueness even if message keys are reused across out-of-order messages.
///
/// Returns `(aes_256_key, gcm_nonce)`.
pub fn message_keys(msg_key: &[u8; 32], counter: u32) -> ([u8; 32], [u8; 12]) {
    // Use a zero-byte salt so the IKM (msg_key) fully determines the output.
    let hk = Hkdf::<Sha256>::new(Some(&[0u8; 32]), msg_key);
    let mut okm = [0u8; 44]; // 32-byte key + 12-byte nonce
    hk.expand(MSG_KEY_INFO, &mut okm).expect("HKDF expand 44 bytes");

    let mut aes_key = [0u8; 32];
    aes_key.copy_from_slice(&okm[..32]);

    let mut nonce = [0u8; 12];
    nonce.copy_from_slice(&okm[32..44]);

    // XOR counter into last 4 bytes of nonce for per-message uniqueness.
    let counter_bytes = counter.to_be_bytes();
    for i in 0..4 {
        nonce[8 + i] ^= counter_bytes[i];
    }

    okm.zeroize();
    (aes_key, nonce)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_root_kdf_deterministic() {
        let rk = [1u8; 32];
        let ss = [2u8; 32];
        let (rk1a, ck1a) = root_kdf(&rk, &ss);
        let (rk1b, ck1b) = root_kdf(&rk, &ss);
        assert_eq!(rk1a, rk1b);
        assert_eq!(ck1a, ck1b);
        // Root key and chain key must differ
        assert_ne!(rk1a, ck1a);
        // Output must differ from inputs
        assert_ne!(rk1a, rk);
        assert_ne!(ck1a, ss);
    }

    #[test]
    fn test_chain_kdf_produces_distinct_keys() {
        let ck = [3u8; 32];
        let (mk, next_ck) = chain_kdf(&ck);
        assert_ne!(mk, next_ck, "message key and next chain key must differ");
        assert_ne!(mk, ck, "message key must differ from chain key");
        assert_ne!(next_ck, ck, "next chain key must differ from input");
    }

    #[test]
    fn test_chain_kdf_advances_chain() {
        let ck0 = [5u8; 32];
        let (_mk0, ck1) = chain_kdf(&ck0);
        let (_mk1, ck2) = chain_kdf(&ck1);
        assert_ne!(ck0, ck1);
        assert_ne!(ck1, ck2);
    }

    #[test]
    fn test_message_keys_counter_uniqueness() {
        let mk = [7u8; 32];
        let (key0, nonce0) = message_keys(&mk, 0);
        let (key1, nonce1) = message_keys(&mk, 1);
        // Key should be the same (derived from same msg_key)
        assert_eq!(key0, key1, "AES key does not depend on counter");
        // Nonces must differ due to counter XOR
        assert_ne!(nonce0, nonce1, "nonces must differ per counter");
    }

    #[test]
    fn test_message_keys_sizes() {
        let mk = [9u8; 32];
        let (aes_key, nonce) = message_keys(&mk, 42);
        assert_eq!(aes_key.len(), 32);
        assert_eq!(nonce.len(), 12);
    }
}
