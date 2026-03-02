//! OpenPGP Composite Key Types (draft-ietf-openpgp-pqc-17 inspired)
//!
//! Provides composite encryption keypairs (ML-KEM-768 + X25519) and composite
//! signing keypairs (Ed25519, with ML-DSA placeholder) following the hybrid
//! approach from the OpenPGP PQC draft.
//!
//! Composite encryption combines two KEM shared secrets via HKDF to produce
//! a single session key, providing security even if one primitive is broken.

use crate::email_crypto::{EmailCrypto, EmailCryptoError, EmailEnvelope};

use hkdf::Hkdf;
use sha2::Sha256;
use x25519_dalek::{EphemeralSecret, PublicKey as X25519PublicKey, StaticSecret};
use ed25519_dalek::{SigningKey, VerifyingKey};
use zeroize::{Zeroize, ZeroizeOnDrop};

use aes_gcm::aead::{Aead, KeyInit, Payload};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use getrandom::getrandom;

use std::convert::TryInto;

use pqcrypto_kyber::kyber768;
use pqcrypto_traits::kem::{
    Ciphertext as KemCiphertext, PublicKey as KemPublicKey, SecretKey as KemSecretKey,
    SharedSecret as KemSharedSecret,
};

// ── Error types ──────────────────────────────────────────────────────────────

/// Errors from composite key operations.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum KeyError {
    /// Invalid key format or length.
    InvalidKey(&'static str),
    /// Serialization/deserialization error.
    SerializationError(&'static str),
    /// Crypto operation failed.
    CryptoError(&'static str),
}

impl std::fmt::Display for KeyError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidKey(m) => write!(f, "InvalidKey: {}", m),
            Self::SerializationError(m) => write!(f, "SerializationError: {}", m),
            Self::CryptoError(m) => write!(f, "CryptoError: {}", m),
        }
    }
}

impl std::error::Error for KeyError {}

// ── Constants ────────────────────────────────────────────────────────────────

/// ML-KEM-768 public key size.
const MLKEM_PK_BYTES: usize = 1184;
/// ML-KEM-768 secret key size.
const MLKEM_SK_BYTES: usize = 2400;
/// ML-KEM-768 ciphertext size.
const MLKEM_CT_BYTES: usize = 1088;
/// X25519 key size.
const X25519_BYTES: usize = 32;
/// Ed25519 public key size.
const ED25519_PK_BYTES: usize = 32;
/// Ed25519 secret key size.
const ED25519_SK_BYTES: usize = 32;

const COMPOSITE_KEK_INFO: &[u8] = b"ZipminatorCompositeKEK_v1";

// ── Key Fingerprint ──────────────────────────────────────────────────────────

/// SHA-256 fingerprint of composite public key material.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct KeyFingerprint(pub [u8; 32]);

impl KeyFingerprint {
    /// Compute fingerprint from concatenated public key material.
    pub fn compute(mlkem_pk: &[u8], x25519_pk: &[u8; 32]) -> Self {
        use sha2::Digest;
        let mut hasher = Sha256::new();
        hasher.update(b"zipminator-composite-v1");
        hasher.update(mlkem_pk);
        hasher.update(x25519_pk);
        let hash = hasher.finalize();
        Self(hash.into())
    }

    /// Return the fingerprint as a hex string.
    pub fn to_hex(&self) -> String {
        self.0.iter().map(|b| format!("{:02x}", b)).collect()
    }
}

// ── Composite Public Key ─────────────────────────────────────────────────────

/// Exportable composite public key (ML-KEM-768 + X25519).
#[derive(Debug, Clone)]
pub struct CompositePublicKey {
    pub mlkem_pk: Vec<u8>,
    pub x25519_pk: [u8; 32],
}

impl CompositePublicKey {
    /// Serialize to bytes: [mlkem_pk (1184)] [x25519_pk (32)]
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut buf = Vec::with_capacity(MLKEM_PK_BYTES + X25519_BYTES);
        buf.extend_from_slice(&self.mlkem_pk);
        buf.extend_from_slice(&self.x25519_pk);
        buf
    }

    /// Deserialize from bytes.
    pub fn from_bytes(data: &[u8]) -> Result<Self, KeyError> {
        if data.len() != MLKEM_PK_BYTES + X25519_BYTES {
            return Err(KeyError::SerializationError(
                "composite public key must be 1216 bytes (1184 + 32)",
            ));
        }
        let mlkem_pk = data[..MLKEM_PK_BYTES].to_vec();
        let x25519_pk: [u8; 32] = data[MLKEM_PK_BYTES..].try_into().unwrap();
        Ok(Self {
            mlkem_pk,
            x25519_pk,
        })
    }

    /// Compute fingerprint.
    pub fn fingerprint(&self) -> KeyFingerprint {
        KeyFingerprint::compute(&self.mlkem_pk, &self.x25519_pk)
    }
}

// ── Composite Encryption Keypair ─────────────────────────────────────────────

/// Composite encryption keypair: ML-KEM-768 + X25519.
///
/// Secret key material implements `ZeroizeOnDrop`.
pub struct CompositeEncryptionKeypair {
    pub mlkem_pk: Vec<u8>,
    mlkem_sk: Vec<u8>,
    pub x25519_pk: [u8; 32],
    x25519_sk: [u8; 32],
}

impl Drop for CompositeEncryptionKeypair {
    fn drop(&mut self) {
        self.mlkem_sk.zeroize();
        self.x25519_sk.zeroize();
    }
}

impl CompositeEncryptionKeypair {
    /// Generate a new composite encryption keypair.
    pub fn generate() -> Self {
        // ML-KEM-768 keypair
        let (mlkem_pk, mlkem_sk) = kyber768::keypair();

        // X25519 keypair
        let x25519_secret = StaticSecret::random_from_rng(rand::thread_rng());
        let x25519_public = X25519PublicKey::from(&x25519_secret);

        Self {
            mlkem_pk: mlkem_pk.as_bytes().to_vec(),
            mlkem_sk: mlkem_sk.as_bytes().to_vec(),
            x25519_pk: x25519_public.to_bytes(),
            x25519_sk: x25519_secret.to_bytes(),
        }
    }

    /// Export the public component.
    pub fn export_public(&self) -> CompositePublicKey {
        CompositePublicKey {
            mlkem_pk: self.mlkem_pk.clone(),
            x25519_pk: self.x25519_pk,
        }
    }

    /// Compute the key fingerprint.
    pub fn fingerprint(&self) -> KeyFingerprint {
        KeyFingerprint::compute(&self.mlkem_pk, &self.x25519_pk)
    }

    /// Get a reference to the ML-KEM-768 secret key.
    pub fn mlkem_sk(&self) -> &[u8] {
        &self.mlkem_sk
    }

    /// Get a reference to the X25519 secret key.
    pub fn x25519_sk(&self) -> &[u8; 32] {
        &self.x25519_sk
    }
}

// ── Composite Signing Keypair ────────────────────────────────────────────────

/// Composite signing keypair: Ed25519 (classical component).
///
/// ML-DSA (Dilithium) integration is a TODO pending `pqcrypto-dilithium` dep.
pub struct CompositeSigningKeypair {
    pub ed25519_pk: [u8; 32],
    ed25519_sk: [u8; 32],
}

impl Drop for CompositeSigningKeypair {
    fn drop(&mut self) {
        self.ed25519_sk.zeroize();
    }
}

impl CompositeSigningKeypair {
    /// Generate a new Ed25519 signing keypair.
    pub fn generate() -> Self {
        let mut sk_bytes = [0u8; 32];
        getrandom(&mut sk_bytes).expect("RNG failure");

        let signing_key = SigningKey::from_bytes(&sk_bytes);
        let verifying_key = signing_key.verifying_key();

        Self {
            ed25519_pk: verifying_key.to_bytes(),
            ed25519_sk: sk_bytes,
        }
    }

    /// Sign a message with Ed25519.
    pub fn sign(&self, message: &[u8]) -> [u8; 64] {
        use ed25519_dalek::Signer;
        let signing_key = SigningKey::from_bytes(&self.ed25519_sk);
        let signature = signing_key.sign(message);
        signature.to_bytes()
    }

    /// Verify a signature.
    pub fn verify(pk: &[u8; 32], message: &[u8], signature: &[u8; 64]) -> Result<(), KeyError> {
        use ed25519_dalek::{Signature, Verifier};
        let verifying_key = VerifyingKey::from_bytes(pk)
            .map_err(|_| KeyError::InvalidKey("invalid Ed25519 public key"))?;
        let sig = Signature::from_bytes(signature);
        verifying_key
            .verify(message, &sig)
            .map_err(|_| KeyError::CryptoError("Ed25519 signature verification failed"))
    }

    /// Get the public key bytes.
    pub fn public_key(&self) -> &[u8; 32] {
        &self.ed25519_pk
    }
}

// ── Composite Envelope ───────────────────────────────────────────────────────

/// Composite encrypted envelope: ML-KEM-768 ciphertext + X25519 ephemeral
/// public key + encrypted body.
#[derive(Clone, Debug)]
pub struct CompositeEnvelope {
    /// ML-KEM-768 ciphertext (1088 bytes).
    pub mlkem_ct: Vec<u8>,
    /// X25519 ephemeral public key (32 bytes).
    pub x25519_ephemeral_pk: [u8; 32],
    /// AES-256-GCM encrypted body (ciphertext without tag).
    pub encrypted_body: Vec<u8>,
    /// GCM nonce (12 bytes).
    pub nonce: [u8; 12],
    /// GCM auth tag (16 bytes).
    pub tag: [u8; 16],
    /// Additional authenticated data.
    pub aad: Vec<u8>,
}

// ── Composite encrypt/decrypt ────────────────────────────────────────────────

/// Zeroizing 32-byte buffer.
#[derive(Zeroize, ZeroizeOnDrop)]
struct Secret32([u8; 32]);

/// Composite encryption: encrypt to both ML-KEM-768 and X25519, then combine
/// shared secrets via HKDF to derive a single AES-256-GCM session key.
pub fn composite_encrypt(
    recipient: &CompositePublicKey,
    plaintext: &[u8],
    aad: &[u8],
) -> Result<CompositeEnvelope, EmailCryptoError> {
    // 1. ML-KEM-768 encapsulation
    let mlkem_pk = kyber768::PublicKey::from_bytes(&recipient.mlkem_pk)
        .map_err(|_| EmailCryptoError::InvalidPublicKey("invalid ML-KEM-768 public key"))?;
    let (mlkem_ss, mlkem_ct) = kyber768::encapsulate(&mlkem_pk);
    let mut mlkem_secret = Secret32(
        mlkem_ss
            .as_bytes()
            .try_into()
            .map_err(|_| EmailCryptoError::InvalidCiphertext("ML-KEM shared secret length"))?,
    );

    // 2. X25519 ECDH
    let x25519_ephemeral = EphemeralSecret::random_from_rng(rand::thread_rng());
    let x25519_ephemeral_pk = X25519PublicKey::from(&x25519_ephemeral);
    let x25519_recipient = X25519PublicKey::from(recipient.x25519_pk);
    let x25519_shared = x25519_ephemeral.diffie_hellman(&x25519_recipient);
    let mut x25519_secret = Secret32(x25519_shared.to_bytes());

    // 3. Combine shared secrets via HKDF
    //    IKM = mlkem_ss || x25519_ss
    let mut combined_ikm = [0u8; 64];
    combined_ikm[..32].copy_from_slice(&mlkem_secret.0);
    combined_ikm[32..].copy_from_slice(&x25519_secret.0);

    let hkdf = Hkdf::<Sha256>::new(None, &combined_ikm);
    let mut session_key = Secret32([0u8; 32]);
    hkdf.expand(COMPOSITE_KEK_INFO, &mut session_key.0)
        .map_err(|_| EmailCryptoError::KdfError("HKDF expand for composite key failed"))?;

    combined_ikm.zeroize();

    // 4. AES-256-GCM encrypt
    let mut nonce_bytes = [0u8; 12];
    getrandom(&mut nonce_bytes)
        .map_err(|_| EmailCryptoError::RngError("nonce generation failed"))?;

    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&session_key.0));
    let nonce = Nonce::from_slice(&nonce_bytes);
    let payload = Payload {
        msg: plaintext,
        aad,
    };
    let ciphertext_with_tag = cipher
        .encrypt(nonce, payload)
        .map_err(|_| EmailCryptoError::AeadError("AES-256-GCM encryption failed"))?;

    let tag_offset = ciphertext_with_tag.len() - 16;
    let encrypted_body = ciphertext_with_tag[..tag_offset].to_vec();
    let mut tag = [0u8; 16];
    tag.copy_from_slice(&ciphertext_with_tag[tag_offset..]);

    // Zeroize
    drop(mlkem_secret);
    drop(x25519_secret);
    drop(session_key);

    Ok(CompositeEnvelope {
        mlkem_ct: mlkem_ct.as_bytes().to_vec(),
        x25519_ephemeral_pk: x25519_ephemeral_pk.to_bytes(),
        encrypted_body,
        nonce: nonce_bytes,
        tag,
        aad: aad.to_vec(),
    })
}

/// Composite decryption: decrypt both ML-KEM-768 and X25519, combine shared
/// secrets, and decrypt the body.
pub fn composite_decrypt(
    keypair: &CompositeEncryptionKeypair,
    envelope: &CompositeEnvelope,
    aad: &[u8],
) -> Result<Vec<u8>, EmailCryptoError> {
    // 1. ML-KEM-768 decapsulation
    let mlkem_sk = kyber768::SecretKey::from_bytes(&keypair.mlkem_sk)
        .map_err(|_| EmailCryptoError::InvalidSecretKey("invalid ML-KEM-768 secret key"))?;
    let mlkem_ct = kyber768::Ciphertext::from_bytes(&envelope.mlkem_ct)
        .map_err(|_| EmailCryptoError::InvalidCiphertext("invalid ML-KEM ciphertext"))?;
    let mlkem_ss = kyber768::decapsulate(&mlkem_ct, &mlkem_sk);
    let mut mlkem_secret = Secret32(
        mlkem_ss
            .as_bytes()
            .try_into()
            .map_err(|_| EmailCryptoError::InvalidCiphertext("ML-KEM shared secret length"))?,
    );

    // 2. X25519 ECDH
    let x25519_sk = StaticSecret::from(keypair.x25519_sk);
    let x25519_ephemeral_pk = X25519PublicKey::from(envelope.x25519_ephemeral_pk);
    let x25519_shared = x25519_sk.diffie_hellman(&x25519_ephemeral_pk);
    let mut x25519_secret = Secret32(x25519_shared.to_bytes());

    // 3. Combine shared secrets via HKDF (same as encrypt)
    let mut combined_ikm = [0u8; 64];
    combined_ikm[..32].copy_from_slice(&mlkem_secret.0);
    combined_ikm[32..].copy_from_slice(&x25519_secret.0);

    let hkdf = Hkdf::<Sha256>::new(None, &combined_ikm);
    let mut session_key = Secret32([0u8; 32]);
    hkdf.expand(COMPOSITE_KEK_INFO, &mut session_key.0)
        .map_err(|_| EmailCryptoError::KdfError("HKDF expand for composite key failed"))?;

    combined_ikm.zeroize();

    // 4. AES-256-GCM decrypt
    let mut ct_with_tag =
        Vec::with_capacity(envelope.encrypted_body.len() + envelope.tag.len());
    ct_with_tag.extend_from_slice(&envelope.encrypted_body);
    ct_with_tag.extend_from_slice(&envelope.tag);

    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&session_key.0));
    let nonce = Nonce::from_slice(&envelope.nonce);
    let payload = Payload {
        msg: &ct_with_tag,
        aad,
    };
    let plaintext = cipher
        .decrypt(nonce, payload)
        .map_err(|_| EmailCryptoError::AeadError("AES-256-GCM decryption failed"))?;

    // Zeroize
    drop(mlkem_secret);
    drop(x25519_secret);
    drop(session_key);

    Ok(plaintext)
}

// ── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_composite_keygen_sizes() {
        let kp = CompositeEncryptionKeypair::generate();
        assert_eq!(kp.mlkem_pk.len(), MLKEM_PK_BYTES);
        assert_eq!(kp.mlkem_sk().len(), MLKEM_SK_BYTES);
        assert_eq!(kp.x25519_pk.len(), X25519_BYTES);
        assert_eq!(kp.x25519_sk().len(), X25519_BYTES);
    }

    #[test]
    fn test_composite_encrypt_decrypt_roundtrip() {
        let kp = CompositeEncryptionKeypair::generate();
        let recipient = kp.export_public();

        let plaintext = b"Hello from composite PQC encryption!";
        let aad = b"email-headers";

        let envelope =
            composite_encrypt(&recipient, plaintext, aad).expect("composite encrypt");
        let decrypted =
            composite_decrypt(&kp, &envelope, aad).expect("composite decrypt");

        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn test_composite_wrong_key_fails() {
        let kp1 = CompositeEncryptionKeypair::generate();
        let kp2 = CompositeEncryptionKeypair::generate();
        let recipient = kp1.export_public();

        let plaintext = b"secret";
        let aad = b"";

        let envelope =
            composite_encrypt(&recipient, plaintext, aad).expect("encrypt");
        let result = composite_decrypt(&kp2, &envelope, aad);
        assert!(result.is_err());
    }

    #[test]
    fn test_composite_wrong_aad_fails() {
        let kp = CompositeEncryptionKeypair::generate();
        let recipient = kp.export_public();

        let plaintext = b"test";
        let aad1 = b"correct-headers";
        let aad2 = b"wrong-headers";

        let envelope =
            composite_encrypt(&recipient, plaintext, aad1).expect("encrypt");
        let result = composite_decrypt(&kp, &envelope, aad2);
        assert!(result.is_err());
    }

    #[test]
    fn test_fingerprint_determinism() {
        let kp = CompositeEncryptionKeypair::generate();
        let fp1 = kp.fingerprint();
        let fp2 = kp.fingerprint();
        assert_eq!(fp1, fp2);
    }

    #[test]
    fn test_fingerprint_differs_for_different_keys() {
        let kp1 = CompositeEncryptionKeypair::generate();
        let kp2 = CompositeEncryptionKeypair::generate();
        assert_ne!(kp1.fingerprint(), kp2.fingerprint());
    }

    #[test]
    fn test_public_key_serialization_roundtrip() {
        let kp = CompositeEncryptionKeypair::generate();
        let exported = kp.export_public();

        let bytes = exported.to_bytes();
        assert_eq!(bytes.len(), MLKEM_PK_BYTES + X25519_BYTES);

        let imported = CompositePublicKey::from_bytes(&bytes).expect("import");
        assert_eq!(imported.mlkem_pk, exported.mlkem_pk);
        assert_eq!(imported.x25519_pk, exported.x25519_pk);
    }

    #[test]
    fn test_public_key_wrong_size_rejected() {
        let result = CompositePublicKey::from_bytes(&[0u8; 100]);
        assert!(matches!(result, Err(KeyError::SerializationError(_))));
    }

    #[test]
    fn test_fingerprint_matches_exported_key() {
        let kp = CompositeEncryptionKeypair::generate();
        let exported = kp.export_public();
        assert_eq!(kp.fingerprint(), exported.fingerprint());
    }

    #[test]
    fn test_signing_keypair_generate() {
        let sk = CompositeSigningKeypair::generate();
        assert_eq!(sk.ed25519_pk.len(), ED25519_PK_BYTES);
    }

    #[test]
    fn test_signing_roundtrip() {
        let sk = CompositeSigningKeypair::generate();
        let message = b"sign this message";

        let signature = sk.sign(message);
        assert_eq!(signature.len(), 64);

        CompositeSigningKeypair::verify(&sk.ed25519_pk, message, &signature)
            .expect("signature should verify");
    }

    #[test]
    fn test_signing_wrong_key_fails() {
        let sk1 = CompositeSigningKeypair::generate();
        let sk2 = CompositeSigningKeypair::generate();

        let message = b"test";
        let signature = sk1.sign(message);

        let result = CompositeSigningKeypair::verify(&sk2.ed25519_pk, message, &signature);
        assert!(result.is_err());
    }

    #[test]
    fn test_signing_tampered_message_fails() {
        let sk = CompositeSigningKeypair::generate();
        let message = b"original";
        let tampered = b"tampered";

        let signature = sk.sign(message);
        let result = CompositeSigningKeypair::verify(&sk.ed25519_pk, tampered, &signature);
        assert!(result.is_err());
    }

    #[test]
    fn test_composite_empty_plaintext() {
        let kp = CompositeEncryptionKeypair::generate();
        let recipient = kp.export_public();

        let plaintext = b"";
        let aad = b"empty";

        let envelope =
            composite_encrypt(&recipient, plaintext, aad).expect("encrypt");
        let decrypted =
            composite_decrypt(&kp, &envelope, aad).expect("decrypt");
        assert_eq!(decrypted, plaintext);
    }
}
