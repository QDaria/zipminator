use aes_gcm::aead::{Aead, KeyInit, Payload};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use getrandom::getrandom;
use pqcrypto_kyber::kyber768;
use pqcrypto_traits::kem::{Ciphertext, PublicKey, SharedSecret};
use std::convert::TryInto;

pub struct PqcRatchet {
    pub local_static_public: kyber768::PublicKey,
    pub local_static_secret: kyber768::SecretKey,
    pub remote_static_public: Option<kyber768::PublicKey>,
    pub root_key: [u8; 32],
}

impl PqcRatchet {
    pub fn new() -> Self {
        let (pk, sk) = kyber768::keypair();
        Self {
            local_static_public: pk,
            local_static_secret: sk,
            remote_static_public: None,
            root_key: [0u8; 32], // Initialized via KEX
        }
    }

    pub fn set_remote_public(&mut self, pk_bytes: &[u8]) -> Result<(), &'static str> {
        if pk_bytes.len() != kyber768::public_key_bytes() {
            return Err("Invalid public key length");
        }
        self.remote_static_public = Some(
            kyber768::PublicKey::from_bytes(pk_bytes).map_err(|_| "Failed to parse public key")?,
        );
        Ok(())
    }

    pub fn encapsulate(&self) -> Result<(Vec<u8>, [u8; 32]), &'static str> {
        let pk = self
            .remote_static_public
            .as_ref()
            .ok_or("Remote public key not set")?;
        let (ct, ss) = kyber768::encapsulate(pk);
        let ss_bytes: [u8; 32] = ss
            .as_bytes()
            .try_into()
            .map_err(|_| "Invalid shared secret length")?;
        Ok((ct.as_bytes().to_vec(), ss_bytes))
    }

    pub fn decapsulate(&self, ct_bytes: &[u8]) -> Result<[u8; 32], &'static str> {
        if ct_bytes.len() != kyber768::ciphertext_bytes() {
            return Err("Invalid ciphertext length");
        }
        let ct =
            kyber768::Ciphertext::from_bytes(ct_bytes).map_err(|_| "Failed to parse ciphertext")?;
        let ss = kyber768::decapsulate(&ct, &self.local_static_secret);
        let ss_bytes: [u8; 32] = ss
            .as_bytes()
            .try_into()
            .map_err(|_| "Invalid shared secret length")?;
        Ok(ss_bytes)
    }

    /// Encrypt data with AES-256-GCM using a random 12-byte nonce.
    /// The nonce is prepended to the ciphertext (first 12 bytes of output).
    /// Associated data is authenticated but not included in the output.
    pub fn encrypt(&self, data: &[u8], key: &[u8; 32], ad: &[u8]) -> Result<Vec<u8>, &'static str> {
        let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));

        let mut nonce_bytes = [0u8; 12];
        getrandom(&mut nonce_bytes).map_err(|_| "Failed to generate random nonce")?;
        let nonce = Nonce::from_slice(&nonce_bytes);

        let payload = Payload { msg: data, aad: ad };
        let ciphertext = cipher.encrypt(nonce, payload).map_err(|_| "AES-GCM encryption failed")?;

        // Prepend nonce to ciphertext so decrypt can recover it
        let mut output = Vec::with_capacity(12 + ciphertext.len());
        output.extend_from_slice(&nonce_bytes);
        output.extend_from_slice(&ciphertext);
        Ok(output)
    }

    /// Decrypt data encrypted by `encrypt`. Expects the first 12 bytes to be the nonce.
    pub fn decrypt(&self, encrypted_data: &[u8], key: &[u8; 32], ad: &[u8]) -> Result<Vec<u8>, &'static str> {
        if encrypted_data.len() < 12 {
            return Err("Ciphertext too short to contain nonce");
        }
        let (nonce_bytes, ciphertext) = encrypted_data.split_at(12);
        let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
        let nonce = Nonce::from_slice(nonce_bytes);

        let payload = Payload { msg: ciphertext, aad: ad };
        cipher.decrypt(nonce, payload).map_err(|_| "AES-GCM decryption failed")
    }
}
