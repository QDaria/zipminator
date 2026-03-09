//! Email encryption module (CMS KEMRecipientInfo-inspired)
//!
//! Implements per-email envelope encryption using ML-KEM-768 for key
//! encapsulation, HKDF-SHA-256 for key derivation, AES-256 Key Wrap
//! (RFC 3394) for CEK wrapping, and AES-256-GCM for body encryption.
//!
//! # Envelope encryption flow
//!
//! ```text
//! Encrypt:
//!   1. KEM encapsulate(recipient_pk) -> (ct, shared_secret)
//!   2. KEK = HKDF-SHA-256(shared_secret, salt=ct[..32], info="ZipminatorEmailKEK_v1")
//!   3. CEK = random 32 bytes
//!   4. wrapped_cek = AES-256-KW(KEK, CEK)
//!   5. (ciphertext, nonce, tag) = AES-256-GCM(CEK, plaintext, aad=headers)
//!   6. Zeroize KEK, CEK, shared_secret
//!
//! Decrypt:
//!   1. shared_secret = KEM decapsulate(ct, sk)
//!   2. KEK = HKDF-SHA-256(shared_secret, salt=ct[..32], info="ZipminatorEmailKEK_v1")
//!   3. CEK = AES-256-KW-UNWRAP(KEK, wrapped_cek)
//!   4. plaintext = AES-256-GCM-DECRYPT(CEK, ciphertext, nonce, tag, aad)
//!   5. Zeroize everything
//! ```

use aes_gcm::aead::{Aead, KeyInit, Payload};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use getrandom::getrandom;
use hkdf::Hkdf;
use pqcrypto_kyber::kyber768;
use pqcrypto_traits::kem::{
    Ciphertext as KemCiphertext, PublicKey as KemPublicKey, SecretKey as KemSecretKey,
    SharedSecret as KemSharedSecret,
};
use sha2::Sha256;
use zeroize::{Zeroize, ZeroizeOnDrop};

use std::convert::TryInto;

// ── Error types ──────────────────────────────────────────────────────────────

/// Errors that can occur during email envelope encryption/decryption.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EmailCryptoError {
    /// Invalid public key bytes.
    InvalidPublicKey(&'static str),
    /// Invalid secret key bytes.
    InvalidSecretKey(&'static str),
    /// Invalid ciphertext bytes.
    InvalidCiphertext(&'static str),
    /// AES-GCM encryption or decryption failed.
    AeadError(&'static str),
    /// AES Key Wrap/Unwrap failed.
    KeyWrapError(&'static str),
    /// HKDF expansion failed.
    KdfError(&'static str),
    /// RNG failure.
    RngError(&'static str),
}

impl std::fmt::Display for EmailCryptoError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidPublicKey(m) => write!(f, "InvalidPublicKey: {}", m),
            Self::InvalidSecretKey(m) => write!(f, "InvalidSecretKey: {}", m),
            Self::InvalidCiphertext(m) => write!(f, "InvalidCiphertext: {}", m),
            Self::AeadError(m) => write!(f, "AeadError: {}", m),
            Self::KeyWrapError(m) => write!(f, "KeyWrapError: {}", m),
            Self::KdfError(m) => write!(f, "KdfError: {}", m),
            Self::RngError(m) => write!(f, "RngError: {}", m),
        }
    }
}

impl std::error::Error for EmailCryptoError {}

// ── HKDF info label ──────────────────────────────────────────────────────────

const EMAIL_KEK_INFO: &[u8] = b"ZipminatorEmailKEK_v1";

// ── AES-256 Key Wrap (RFC 3394) ──────────────────────────────────────────────
//
// Wraps/unwraps a key encryption key around a content encryption key.
// The plaintext must be a multiple of 8 bytes (our CEK is 32 bytes = 4 blocks).
// Output is plaintext_len + 8 bytes (IV prepended).

/// AES-256 Key Wrap default IV per RFC 3394 section 2.2.3.1.
const KW_IV: u64 = 0xA6A6_A6A6_A6A6_A6A6;

/// AES-256 Key Wrap (RFC 3394).
///
/// `kek` is the 32-byte key-encryption-key.
/// `plaintext` must be a multiple of 8 bytes and at least 16 bytes.
/// Returns wrapped key of `plaintext.len() + 8` bytes.
fn aes256_key_wrap(kek: &[u8; 32], plaintext: &[u8]) -> Result<Vec<u8>, EmailCryptoError> {
    use aes::cipher::{BlockEncrypt, KeyInit as AesKeyInit};
    use aes::Aes256;

    let n = plaintext.len() / 8;
    if plaintext.len() % 8 != 0 || n < 2 {
        return Err(EmailCryptoError::KeyWrapError(
            "plaintext must be >= 16 bytes and a multiple of 8",
        ));
    }

    let cipher = Aes256::new(kek.into());

    // Split plaintext into 64-bit blocks R[1..n].
    let mut r: Vec<[u8; 8]> = (0..n)
        .map(|i| {
            let mut block = [0u8; 8];
            block.copy_from_slice(&plaintext[i * 8..(i + 1) * 8]);
            block
        })
        .collect();

    let mut a = KW_IV.to_be_bytes();

    for j in 0..6u64 {
        for i in 0..n {
            // B = AES(A || R[i])
            let mut block = [0u8; 16];
            block[..8].copy_from_slice(&a);
            block[8..].copy_from_slice(&r[i]);

            let b = aes::Block::from_mut_slice(&mut block);
            cipher.encrypt_block(b);

            // A = MSB(64, B) XOR t  where t = (n * j) + (i + 1)
            let t = (n as u64) * j + (i as u64) + 1;
            let mut a_val = u64::from_be_bytes(block[..8].try_into().unwrap());
            a_val ^= t;
            a = a_val.to_be_bytes();

            r[i].copy_from_slice(&block[8..]);
        }
    }

    let mut output = Vec::with_capacity(8 + plaintext.len());
    output.extend_from_slice(&a);
    for block in &r {
        output.extend_from_slice(block);
    }
    Ok(output)
}

/// AES-256 Key Unwrap (RFC 3394).
///
/// `kek` is the 32-byte key-encryption-key.
/// `wrapped` is the wrapped key (plaintext_len + 8 bytes).
/// Returns the unwrapped plaintext.
fn aes256_key_unwrap(kek: &[u8; 32], wrapped: &[u8]) -> Result<Vec<u8>, EmailCryptoError> {
    use aes::cipher::{BlockDecrypt, KeyInit as AesKeyInit};
    use aes::Aes256;

    if wrapped.len() < 24 || wrapped.len() % 8 != 0 {
        return Err(EmailCryptoError::KeyWrapError(
            "wrapped key must be >= 24 bytes and a multiple of 8",
        ));
    }

    let n = (wrapped.len() / 8) - 1;
    let cipher = Aes256::new(kek.into());

    let mut a: [u8; 8] = wrapped[..8].try_into().unwrap();
    let mut r: Vec<[u8; 8]> = (0..n)
        .map(|i| {
            let mut block = [0u8; 8];
            block.copy_from_slice(&wrapped[(i + 1) * 8..(i + 2) * 8]);
            block
        })
        .collect();

    for j in (0..6u64).rev() {
        for i in (0..n).rev() {
            let t = (n as u64) * j + (i as u64) + 1;

            // A = A XOR t
            let mut a_val = u64::from_be_bytes(a);
            a_val ^= t;
            a = a_val.to_be_bytes();

            // B = AES-1(A || R[i])
            let mut block = [0u8; 16];
            block[..8].copy_from_slice(&a);
            block[8..].copy_from_slice(&r[i]);

            let b = aes::Block::from_mut_slice(&mut block);
            cipher.decrypt_block(b);

            a.copy_from_slice(&block[..8]);
            r[i].copy_from_slice(&block[8..]);
        }
    }

    // Verify IV
    if a != KW_IV.to_be_bytes() {
        return Err(EmailCryptoError::KeyWrapError(
            "key unwrap IV check failed: wrong KEK or corrupted data",
        ));
    }

    let mut output = Vec::with_capacity(n * 8);
    for block in &r {
        output.extend_from_slice(block);
    }
    Ok(output)
}

// ── Email Envelope ───────────────────────────────────────────────────────────

/// An encrypted email envelope containing all material needed to decrypt.
#[derive(Clone, Debug)]
pub struct EmailEnvelope {
    /// ML-KEM-768 ciphertext (1088 bytes).
    pub kem_ciphertext: Vec<u8>,
    /// AES-256-KW wrapped CEK (40 bytes for a 32-byte CEK).
    pub wrapped_cek: Vec<u8>,
    /// AES-256-GCM encrypted body (ciphertext without tag).
    pub encrypted_body: Vec<u8>,
    /// GCM nonce (12 bytes).
    pub nonce: [u8; 12],
    /// Additional authenticated data (email headers).
    pub aad: Vec<u8>,
    /// GCM authentication tag (16 bytes).
    pub tag: [u8; 16],
}

impl EmailEnvelope {
    /// Serialize the envelope to a byte vector for transport.
    ///
    /// Format: [kem_ct_len:4][kem_ct][wrapped_cek_len:4][wrapped_cek]
    ///         [nonce:12][tag:16][aad_len:4][aad][body_len:4][encrypted_body]
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut buf = Vec::new();

        buf.extend_from_slice(&(self.kem_ciphertext.len() as u32).to_be_bytes());
        buf.extend_from_slice(&self.kem_ciphertext);

        buf.extend_from_slice(&(self.wrapped_cek.len() as u32).to_be_bytes());
        buf.extend_from_slice(&self.wrapped_cek);

        buf.extend_from_slice(&self.nonce);
        buf.extend_from_slice(&self.tag);

        buf.extend_from_slice(&(self.aad.len() as u32).to_be_bytes());
        buf.extend_from_slice(&self.aad);

        buf.extend_from_slice(&(self.encrypted_body.len() as u32).to_be_bytes());
        buf.extend_from_slice(&self.encrypted_body);

        buf
    }

    /// Deserialize an envelope from bytes.
    pub fn from_bytes(data: &[u8]) -> Result<Self, EmailCryptoError> {
        let mut pos = 0;

        let read_u32 = |data: &[u8], pos: &mut usize| -> Result<usize, EmailCryptoError> {
            if *pos + 4 > data.len() {
                return Err(EmailCryptoError::InvalidCiphertext("truncated envelope"));
            }
            let val =
                u32::from_be_bytes(data[*pos..*pos + 4].try_into().unwrap()) as usize;
            *pos += 4;
            Ok(val)
        };

        let read_bytes =
            |data: &[u8], pos: &mut usize, len: usize| -> Result<Vec<u8>, EmailCryptoError> {
                if *pos + len > data.len() {
                    return Err(EmailCryptoError::InvalidCiphertext("truncated envelope"));
                }
                let bytes = data[*pos..*pos + len].to_vec();
                *pos += len;
                Ok(bytes)
            };

        let kem_ct_len = read_u32(data, &mut pos)?;
        let kem_ciphertext = read_bytes(data, &mut pos, kem_ct_len)?;

        let wrapped_cek_len = read_u32(data, &mut pos)?;
        let wrapped_cek = read_bytes(data, &mut pos, wrapped_cek_len)?;

        let nonce_bytes = read_bytes(data, &mut pos, 12)?;
        let nonce: [u8; 12] = nonce_bytes.try_into().unwrap();

        let tag_bytes = read_bytes(data, &mut pos, 16)?;
        let tag: [u8; 16] = tag_bytes.try_into().unwrap();

        let aad_len = read_u32(data, &mut pos)?;
        let aad = read_bytes(data, &mut pos, aad_len)?;

        let body_len = read_u32(data, &mut pos)?;
        let encrypted_body = read_bytes(data, &mut pos, body_len)?;

        Ok(Self {
            kem_ciphertext,
            wrapped_cek,
            encrypted_body,
            nonce,
            aad,
            tag,
        })
    }
}

// ── Zeroizing secret wrappers ────────────────────────────────────────────────

#[derive(Zeroize, ZeroizeOnDrop)]
struct SecretBytes32([u8; 32]);

#[derive(Zeroize, ZeroizeOnDrop)]
struct SecretBytesVec(Vec<u8>);

// ── EmailCrypto ──────────────────────────────────────────────────────────────

/// Stateless email encryption/decryption operations.
pub struct EmailCrypto;

impl EmailCrypto {
    /// Encrypt an email body for a recipient.
    ///
    /// See module-level documentation for the full envelope encryption flow.
    pub fn encrypt(
        recipient_pk: &[u8],
        plaintext: &[u8],
        headers_aad: &[u8],
    ) -> Result<EmailEnvelope, EmailCryptoError> {
        // 1. Parse recipient public key and encapsulate
        let pk = kyber768::PublicKey::from_bytes(recipient_pk)
            .map_err(|_| EmailCryptoError::InvalidPublicKey("invalid ML-KEM-768 public key"))?;

        let (ss, ct) = kyber768::encapsulate(&pk);
        let shared_secret = SecretBytes32(
            ss.as_bytes()
                .try_into()
                .map_err(|_| EmailCryptoError::InvalidCiphertext("shared secret length"))?,
        );
        let ct_bytes = ct.as_bytes().to_vec();

        // 2. Derive KEK via HKDF-SHA-256
        let salt = &ct_bytes[..32.min(ct_bytes.len())];
        let hkdf = Hkdf::<Sha256>::new(Some(salt), &shared_secret.0);
        let mut kek = SecretBytes32([0u8; 32]);
        hkdf.expand(EMAIL_KEK_INFO, &mut kek.0)
            .map_err(|_| EmailCryptoError::KdfError("HKDF expand failed for KEK"))?;

        // 3. Generate random CEK
        let mut cek = SecretBytes32([0u8; 32]);
        getrandom(&mut cek.0)
            .map_err(|_| EmailCryptoError::RngError("failed to generate CEK"))?;

        // 4. Wrap CEK with KEK using AES-256-KW
        let wrapped_cek = aes256_key_wrap(&kek.0, &cek.0)?;

        // 5. Encrypt body with AES-256-GCM(CEK)
        let mut nonce_bytes = [0u8; 12];
        getrandom(&mut nonce_bytes)
            .map_err(|_| EmailCryptoError::RngError("failed to generate nonce"))?;

        let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&cek.0));
        let nonce = Nonce::from_slice(&nonce_bytes);
        let payload = Payload {
            msg: plaintext,
            aad: headers_aad,
        };
        let ciphertext_with_tag = cipher
            .encrypt(nonce, payload)
            .map_err(|_| EmailCryptoError::AeadError("AES-256-GCM encryption failed"))?;

        // AES-GCM appends the 16-byte tag to the ciphertext
        let tag_offset = ciphertext_with_tag.len() - 16;
        let encrypted_body = ciphertext_with_tag[..tag_offset].to_vec();
        let mut tag = [0u8; 16];
        tag.copy_from_slice(&ciphertext_with_tag[tag_offset..]);

        // 6. Zeroize is handled automatically by ZeroizeOnDrop on shared_secret, kek, cek
        drop(shared_secret);
        drop(kek);
        drop(cek);

        Ok(EmailEnvelope {
            kem_ciphertext: ct_bytes,
            wrapped_cek,
            encrypted_body,
            nonce: nonce_bytes,
            aad: headers_aad.to_vec(),
            tag,
        })
    }

    /// Decrypt an email envelope.
    ///
    /// See module-level documentation for the full decryption flow.
    pub fn decrypt(
        secret_key: &[u8],
        envelope: &EmailEnvelope,
        headers_aad: &[u8],
    ) -> Result<Vec<u8>, EmailCryptoError> {
        // 1. Decapsulate KEM ciphertext
        let sk = kyber768::SecretKey::from_bytes(secret_key)
            .map_err(|_| EmailCryptoError::InvalidSecretKey("invalid ML-KEM-768 secret key"))?;
        let ct = kyber768::Ciphertext::from_bytes(&envelope.kem_ciphertext)
            .map_err(|_| EmailCryptoError::InvalidCiphertext("invalid KEM ciphertext"))?;

        let ss = kyber768::decapsulate(&ct, &sk);
        let shared_secret = SecretBytes32(
            ss.as_bytes()
                .try_into()
                .map_err(|_| EmailCryptoError::InvalidCiphertext("shared secret length"))?,
        );

        // 2. Derive KEK via HKDF-SHA-256 (same parameters as encrypt)
        let salt = &envelope.kem_ciphertext[..32.min(envelope.kem_ciphertext.len())];
        let hkdf = Hkdf::<Sha256>::new(Some(salt), &shared_secret.0);
        let mut kek = SecretBytes32([0u8; 32]);
        hkdf.expand(EMAIL_KEK_INFO, &mut kek.0)
            .map_err(|_| EmailCryptoError::KdfError("HKDF expand failed for KEK"))?;

        // 3. Unwrap CEK
        let cek_bytes = aes256_key_unwrap(&kek.0, &envelope.wrapped_cek)?;
        let cek = SecretBytes32(
            cek_bytes
                .as_slice()
                .try_into()
                .map_err(|_| EmailCryptoError::KeyWrapError("unwrapped CEK is not 32 bytes"))?,
        );

        // 4. Decrypt body with AES-256-GCM
        // Reconstruct ciphertext + tag for aes-gcm (it expects them concatenated)
        let mut ct_with_tag =
            Vec::with_capacity(envelope.encrypted_body.len() + envelope.tag.len());
        ct_with_tag.extend_from_slice(&envelope.encrypted_body);
        ct_with_tag.extend_from_slice(&envelope.tag);

        let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&cek.0));
        let nonce = Nonce::from_slice(&envelope.nonce);
        let payload = Payload {
            msg: &ct_with_tag,
            aad: headers_aad,
        };
        let plaintext = cipher
            .decrypt(nonce, payload)
            .map_err(|_| EmailCryptoError::AeadError("AES-256-GCM decryption failed"))?;

        // 5. Zeroize
        drop(shared_secret);
        drop(kek);
        drop(cek);

        Ok(plaintext)
    }
}

// ── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_aes_key_wrap_unwrap_roundtrip() {
        let kek = [0x42u8; 32];
        let plaintext = [0x01u8; 32]; // 32-byte CEK

        let wrapped = aes256_key_wrap(&kek, &plaintext).expect("wrap");
        assert_eq!(wrapped.len(), 40); // 32 + 8

        let unwrapped = aes256_key_unwrap(&kek, &wrapped).expect("unwrap");
        assert_eq!(unwrapped, plaintext);
    }

    #[test]
    fn test_aes_key_wrap_wrong_kek_fails() {
        let kek1 = [0x01u8; 32];
        let kek2 = [0x02u8; 32];
        let plaintext = [0xabu8; 32];

        let wrapped = aes256_key_wrap(&kek1, &plaintext).expect("wrap");
        let result = aes256_key_unwrap(&kek2, &wrapped);
        assert!(result.is_err());
    }

    #[test]
    fn test_aes_key_wrap_16_byte_key() {
        let kek = [0xffu8; 32];
        let plaintext = [0xabu8; 16]; // minimum 2 blocks

        let wrapped = aes256_key_wrap(&kek, &plaintext).expect("wrap");
        assert_eq!(wrapped.len(), 24);

        let unwrapped = aes256_key_unwrap(&kek, &wrapped).expect("unwrap");
        assert_eq!(unwrapped, plaintext);
    }

    #[test]
    fn test_aes_key_wrap_rejects_small_plaintext() {
        let kek = [0u8; 32];
        let plaintext = [0u8; 8]; // too small (need >= 16)
        assert!(aes256_key_wrap(&kek, &plaintext).is_err());
    }

    #[test]
    fn test_email_encrypt_decrypt_roundtrip() {
        let (pk, sk) = kyber768::keypair();
        let pk_bytes = pk.as_bytes();
        let sk_bytes = sk.as_bytes();

        let plaintext = b"Subject: Test\n\nHello, post-quantum email!";
        let headers = b"From: alice@qdaria.com\r\nTo: bob@qdaria.com\r\n";

        let envelope =
            EmailCrypto::encrypt(pk_bytes, plaintext, headers).expect("encrypt");

        assert_eq!(envelope.kem_ciphertext.len(), kyber768::ciphertext_bytes());
        assert_eq!(envelope.wrapped_cek.len(), 40); // 32-byte CEK + 8 wrap overhead
        assert_eq!(envelope.nonce.len(), 12);
        assert_eq!(envelope.tag.len(), 16);

        let decrypted =
            EmailCrypto::decrypt(sk_bytes, &envelope, headers).expect("decrypt");
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn test_email_wrong_key_fails() {
        let (pk, _sk) = kyber768::keypair();
        let (_pk2, sk2) = kyber768::keypair(); // different keypair

        let plaintext = b"secret message";
        let headers = b"";

        let envelope =
            EmailCrypto::encrypt(pk.as_bytes(), plaintext, headers).expect("encrypt");

        // Decrypting with wrong SK should fail (shared secret will differ)
        let result = EmailCrypto::decrypt(sk2.as_bytes(), &envelope, headers);
        assert!(result.is_err());
    }

    #[test]
    fn test_email_wrong_aad_fails() {
        let (pk, sk) = kyber768::keypair();

        let plaintext = b"secret";
        let headers1 = b"From: alice@qdaria.com";
        let headers2 = b"From: eve@evil.com";

        let envelope =
            EmailCrypto::encrypt(pk.as_bytes(), plaintext, headers1).expect("encrypt");

        // Decrypting with wrong AAD should fail (GCM authentication)
        let result = EmailCrypto::decrypt(sk.as_bytes(), &envelope, headers2);
        assert!(result.is_err());
    }

    #[test]
    fn test_email_tampered_body_fails() {
        let (pk, sk) = kyber768::keypair();

        let plaintext = b"important message";
        let headers = b"";

        let mut envelope =
            EmailCrypto::encrypt(pk.as_bytes(), plaintext, headers).expect("encrypt");

        // Tamper with the encrypted body
        if !envelope.encrypted_body.is_empty() {
            envelope.encrypted_body[0] ^= 0xff;
        }

        let result = EmailCrypto::decrypt(sk.as_bytes(), &envelope, headers);
        assert!(result.is_err());
    }

    #[test]
    fn test_email_empty_plaintext() {
        let (pk, sk) = kyber768::keypair();

        let plaintext = b"";
        let headers = b"empty-body-test";

        let envelope =
            EmailCrypto::encrypt(pk.as_bytes(), plaintext, headers).expect("encrypt");

        let decrypted =
            EmailCrypto::decrypt(sk.as_bytes(), &envelope, headers).expect("decrypt");
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn test_email_large_body() {
        let (pk, sk) = kyber768::keypair();

        let plaintext = vec![0xab_u8; 100_000]; // 100 KB
        let headers = b"large-body";

        let envelope =
            EmailCrypto::encrypt(pk.as_bytes(), &plaintext, headers).expect("encrypt");

        let decrypted =
            EmailCrypto::decrypt(sk.as_bytes(), &envelope, headers).expect("decrypt");
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn test_envelope_serialization_roundtrip() {
        let (pk, sk) = kyber768::keypair();

        let plaintext = b"serialization test";
        let headers = b"test-headers";

        let envelope =
            EmailCrypto::encrypt(pk.as_bytes(), plaintext, headers).expect("encrypt");

        let serialized = envelope.to_bytes();
        let deserialized =
            EmailEnvelope::from_bytes(&serialized).expect("deserialize");

        let decrypted =
            EmailCrypto::decrypt(sk.as_bytes(), &deserialized, headers).expect("decrypt");
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn test_invalid_pk_rejected() {
        let result = EmailCrypto::encrypt(&[0u8; 100], b"test", b"");
        assert!(matches!(result, Err(EmailCryptoError::InvalidPublicKey(_))));
    }

    #[test]
    fn test_invalid_sk_rejected() {
        let (pk, _sk) = kyber768::keypair();
        let envelope =
            EmailCrypto::encrypt(pk.as_bytes(), b"test", b"").expect("encrypt");

        let result = EmailCrypto::decrypt(&[0u8; 100], &envelope, b"");
        assert!(matches!(result, Err(EmailCryptoError::InvalidSecretKey(_))));
    }
}
