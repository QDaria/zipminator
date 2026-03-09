//! Safe wrappers for ML-KEM-768 (Kyber) key encapsulation.
//!
//! All types are plain `Vec<u8>` / `[u8; N]` — no opaque handles cross the FFI.

use pqcrypto_kyber::kyber768;
use pqcrypto_traits::kem::{
    Ciphertext as KemCiphertext, PublicKey as KemPublicKey, SecretKey as KemSecretKey,
    SharedSecret as KemSharedSecret,
};
use thiserror::Error;

/// Crypto operation errors.
#[derive(Debug, Error)]
pub enum CryptoError {
    #[error("Invalid public key: {0}")]
    InvalidPublicKey(String),
    #[error("Invalid secret key: {0}")]
    InvalidSecretKey(String),
    #[error("Invalid ciphertext: {0}")]
    InvalidCiphertext(String),
    #[error("Key generation failed")]
    KeyGenFailed,
}

/// ML-KEM-768 keypair (public key + secret key as raw bytes).
#[derive(Clone)]
pub struct KemKeypair {
    /// Public key (1184 bytes)
    pub public_key: Vec<u8>,
    /// Secret key (2400 bytes)
    pub secret_key: Vec<u8>,
}

/// KEM encapsulation result.
pub struct EncapsulationResult {
    /// Ciphertext to send to the key holder (1088 bytes)
    pub ciphertext: Vec<u8>,
    /// 32-byte shared secret
    pub shared_secret: Vec<u8>,
}

/// Generate an ML-KEM-768 keypair.
///
/// Returns (public_key: 1184 bytes, secret_key: 2400 bytes).
pub fn keypair() -> KemKeypair {
    let (pk, sk) = kyber768::keypair();
    KemKeypair {
        public_key: pk.as_bytes().to_vec(),
        secret_key: sk.as_bytes().to_vec(),
    }
}

/// Encapsulate: generate a shared secret for the given public key.
///
/// Returns the ciphertext (1088 bytes) and shared secret (32 bytes).
pub fn encapsulate(public_key: &[u8]) -> Result<EncapsulationResult, CryptoError> {
    let pk = kyber768::PublicKey::from_bytes(public_key)
        .map_err(|_| CryptoError::InvalidPublicKey("wrong size or format".into()))?;
    let (ss, ct) = kyber768::encapsulate(&pk);
    Ok(EncapsulationResult {
        ciphertext: ct.as_bytes().to_vec(),
        shared_secret: ss.as_bytes().to_vec(),
    })
}

/// Decapsulate: recover the shared secret from a ciphertext and secret key.
///
/// Returns the 32-byte shared secret.
pub fn decapsulate(ciphertext: &[u8], secret_key: &[u8]) -> Result<Vec<u8>, CryptoError> {
    let ct = kyber768::Ciphertext::from_bytes(ciphertext)
        .map_err(|_| CryptoError::InvalidCiphertext("wrong size or format".into()))?;
    let sk = kyber768::SecretKey::from_bytes(secret_key)
        .map_err(|_| CryptoError::InvalidSecretKey("wrong size or format".into()))?;
    let ss = kyber768::decapsulate(&ct, &sk);
    Ok(ss.as_bytes().to_vec())
}

/// Generate a composite keypair (ML-KEM-768 + X25519).
///
/// Returns (composite_pk: 1216 bytes, composite_sk: 2432 bytes).
pub fn composite_keypair() -> KemKeypair {
    let kp = zipminator_core::openpgp_keys::CompositeEncryptionKeypair::generate();
    let pub_key = kp.export_public();
    let pk_bytes = pub_key.to_bytes();

    let mut sk_bytes = vec![0u8; 2432];
    sk_bytes[..2400].copy_from_slice(kp.mlkem_sk());
    sk_bytes[2400..].copy_from_slice(kp.x25519_sk());

    KemKeypair {
        public_key: pk_bytes,
        secret_key: sk_bytes,
    }
}

/// Key size constants.
pub const PK_BYTES: usize = 1184;
pub const SK_BYTES: usize = 2400;
pub const CT_BYTES: usize = 1088;
pub const SS_BYTES: usize = 32;
pub const COMPOSITE_PK_BYTES: usize = 1216;
pub const COMPOSITE_SK_BYTES: usize = 2432;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_keypair_sizes() {
        let kp = keypair();
        assert_eq!(kp.public_key.len(), PK_BYTES);
        assert_eq!(kp.secret_key.len(), SK_BYTES);
    }

    #[test]
    fn test_encapsulate_decapsulate_roundtrip() {
        let kp = keypair();
        let enc = encapsulate(&kp.public_key).expect("encapsulate");
        assert_eq!(enc.ciphertext.len(), CT_BYTES);
        assert_eq!(enc.shared_secret.len(), SS_BYTES);

        let ss = decapsulate(&enc.ciphertext, &kp.secret_key).expect("decapsulate");
        assert_eq!(ss, enc.shared_secret);
    }

    #[test]
    fn test_invalid_pk_rejected() {
        let bad_pk = vec![0u8; 100];
        assert!(encapsulate(&bad_pk).is_err());
    }

    #[test]
    fn test_composite_keypair_sizes() {
        let kp = composite_keypair();
        assert_eq!(kp.public_key.len(), COMPOSITE_PK_BYTES);
        assert_eq!(kp.secret_key.len(), COMPOSITE_SK_BYTES);
    }
}
