//! Safe wrappers for PQC email encryption/decryption.

use thiserror::Error;
use zipminator_core::email_crypto::{EmailCrypto, EmailCryptoError, EmailEnvelope};

#[derive(Debug, Error)]
pub enum EmailError {
    #[error("Invalid public key")]
    InvalidPublicKey,
    #[error("Invalid secret key")]
    InvalidSecretKey,
    #[error("Encryption failed: {0}")]
    EncryptionFailed(String),
    #[error("Decryption failed: {0}")]
    DecryptionFailed(String),
    #[error("Invalid envelope format")]
    InvalidEnvelope,
}

impl From<EmailCryptoError> for EmailError {
    fn from(e: EmailCryptoError) -> Self {
        match e {
            EmailCryptoError::InvalidPublicKey(_) => EmailError::InvalidPublicKey,
            EmailCryptoError::InvalidSecretKey(_) => EmailError::InvalidSecretKey,
            EmailCryptoError::InvalidCiphertext(_) => EmailError::InvalidEnvelope,
            _ => EmailError::EncryptionFailed(format!("{:?}", e)),
        }
    }
}

/// Encrypt an email body for a recipient's ML-KEM-768 public key.
///
/// - `recipient_pk`: 1184-byte ML-KEM-768 public key
/// - `plaintext`: email body to encrypt
/// - `aad`: additional authenticated data (e.g. email headers)
///
/// Returns the serialized envelope bytes.
pub fn encrypt_email(
    recipient_pk: Vec<u8>,
    plaintext: Vec<u8>,
    aad: Vec<u8>,
) -> Result<Vec<u8>, EmailError> {
    let envelope = EmailCrypto::encrypt(&recipient_pk, &plaintext, &aad)?;
    Ok(envelope.to_bytes())
}

/// Decrypt an email envelope using the recipient's secret key.
///
/// - `secret_key`: 2400-byte ML-KEM-768 secret key
/// - `envelope_bytes`: serialized envelope from `encrypt_email`
/// - `aad`: additional authenticated data (must match encryption AAD)
///
/// Returns the decrypted plaintext.
pub fn decrypt_email(
    secret_key: Vec<u8>,
    envelope_bytes: Vec<u8>,
    aad: Vec<u8>,
) -> Result<Vec<u8>, EmailError> {
    let envelope =
        EmailEnvelope::from_bytes(&envelope_bytes).map_err(|_| EmailError::InvalidEnvelope)?;
    let plaintext = EmailCrypto::decrypt(&secret_key, &envelope, &aad)?;
    Ok(plaintext)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::crypto::keypair;

    #[test]
    fn test_email_encrypt_decrypt_roundtrip() {
        let kp = keypair();
        let body = b"Confidential email content".to_vec();
        let headers = b"From: alice@qdaria.com\nTo: bob@qdaria.com".to_vec();

        let envelope = encrypt_email(kp.public_key, body.clone(), headers.clone())
            .expect("encrypt");
        assert!(!envelope.is_empty());

        let decrypted = decrypt_email(kp.secret_key, envelope, headers).expect("decrypt");
        assert_eq!(decrypted, body);
    }

    #[test]
    fn test_email_wrong_key_fails() {
        let kp1 = keypair();
        let kp2 = keypair();
        let body = b"Secret".to_vec();
        let aad = b"headers".to_vec();

        let envelope = encrypt_email(kp1.public_key, body, aad.clone()).expect("encrypt");
        assert!(decrypt_email(kp2.secret_key, envelope, aad).is_err());
    }
}
