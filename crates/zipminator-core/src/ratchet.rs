use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use pqcrypto_kyber::kyber768;
use pqcrypto_traits::kem::{Ciphertext, PublicKey, SecretKey, SharedSecret};
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

    pub fn encrypt(&self, data: &[u8], key: &[u8; 32], _ad: &[u8]) -> Vec<u8> {
        let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
        let nonce = Nonce::from_slice(b"pqc-zipminator"); // Use meaningful nonces in prod
        cipher.encrypt(nonce, data).expect("encryption failure")
    }

    pub fn decrypt(&self, encrypted_data: &[u8], key: &[u8; 32], _ad: &[u8]) -> Vec<u8> {
        let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
        let nonce = Nonce::from_slice(b"pqc-zipminator");
        cipher
            .decrypt(nonce, encrypted_data)
            .expect("decryption failure")
    }
}
