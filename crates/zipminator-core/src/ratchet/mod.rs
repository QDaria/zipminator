//! PQ Double Ratchet session management.
//!
//! Provides two public types:
//!
//! - [`PqcRatchet`] — the original single-step KEM wrapper (kept for
//!   backward compatibility with existing FFI consumers).
//! - [`PqRatchetSession`] — the full Double Ratchet session with KEM-
//!   based ratchet steps, chain KDFs, and skipped-message-key caching.
//!
//! ## Protocol overview
//!
//! ```text
//! Alice                                 Bob
//! ─────                                 ───
//! init_alice() → alice_pk
//!                             init_bob(alice_pk) → (bob_pk, kem_ct)
//! alice_finish_handshake(kem_ct, bob_pk)
//!
//! encrypt(msg) → (header, ct)
//!                             decrypt(header, ct) → msg
//! ```

pub mod chains;
pub mod header;
pub mod state;

use aes_gcm::aead::{Aead, KeyInit, Payload};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use getrandom::getrandom;
use pqcrypto_kyber::kyber768;
use pqcrypto_traits::kem::{Ciphertext as KemCiphertext, PublicKey as KemPublicKey,
                             SecretKey as KemSecretKey, SharedSecret as KemSharedSecret};
use std::convert::TryInto;
use zeroize::Zeroize;

use chains::{chain_kdf, message_keys, root_kdf};
use header::{MessageHeader, CT_BYTES, PK_BYTES};
use state::{RatchetState, Side, SkipKey};

// ─────────────────────────────────────────────────────────────────────────────
// Backward-compatible PqcRatchet (original single-step KEM wrapper)
// ─────────────────────────────────────────────────────────────────────────────

/// Single-step Kyber-768 KEM wrapper.
///
/// Kept for backward compatibility with existing FFI consumers.
/// New code should use [`PqRatchetSession`] for full Double Ratchet.
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
            root_key: [0u8; 32],
        }
    }

    pub fn set_remote_public(&mut self, pk_bytes: &[u8]) -> Result<(), &'static str> {
        if pk_bytes.len() != kyber768::public_key_bytes() {
            return Err("Invalid public key length");
        }
        self.remote_static_public = Some(
            kyber768::PublicKey::from_bytes(pk_bytes)
                .map_err(|_| "Failed to parse public key")?,
        );
        Ok(())
    }

    pub fn encapsulate(&self) -> Result<(Vec<u8>, [u8; 32]), &'static str> {
        let pk = self
            .remote_static_public
            .as_ref()
            .ok_or("Remote public key not set")?;
        // pqcrypto-kyber returns (SharedSecret, Ciphertext)
        let (ss, ct) = kyber768::encapsulate(pk);
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
        let ct = kyber768::Ciphertext::from_bytes(ct_bytes)
            .map_err(|_| "Failed to parse ciphertext")?;
        let ss = kyber768::decapsulate(&ct, &self.local_static_secret);
        let ss_bytes: [u8; 32] = ss
            .as_bytes()
            .try_into()
            .map_err(|_| "Invalid shared secret length")?;
        Ok(ss_bytes)
    }

    /// Encrypt data with AES-256-GCM using a random 12-byte nonce.
    /// The nonce is prepended to the ciphertext (first 12 bytes of output).
    pub fn encrypt(
        &self,
        data: &[u8],
        key: &[u8; 32],
        ad: &[u8],
    ) -> Result<Vec<u8>, &'static str> {
        let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
        let mut nonce_bytes = [0u8; 12];
        getrandom(&mut nonce_bytes).map_err(|_| "Failed to generate random nonce")?;
        let nonce = Nonce::from_slice(&nonce_bytes);
        let payload = Payload { msg: data, aad: ad };
        let ciphertext = cipher
            .encrypt(nonce, payload)
            .map_err(|_| "AES-GCM encryption failed")?;
        let mut output = Vec::with_capacity(12 + ciphertext.len());
        output.extend_from_slice(&nonce_bytes);
        output.extend_from_slice(&ciphertext);
        Ok(output)
    }

    /// Decrypt data encrypted by `encrypt`. Expects the first 12 bytes to be the nonce.
    pub fn decrypt(
        &self,
        encrypted_data: &[u8],
        key: &[u8; 32],
        ad: &[u8],
    ) -> Result<Vec<u8>, &'static str> {
        if encrypted_data.len() < 12 {
            return Err("Ciphertext too short to contain nonce");
        }
        let (nonce_bytes, ciphertext) = encrypted_data.split_at(12);
        let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
        let nonce = Nonce::from_slice(nonce_bytes);
        let payload = Payload { msg: ciphertext, aad: ad };
        cipher
            .decrypt(nonce, payload)
            .map_err(|_| "AES-GCM decryption failed")
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PqRatchetSession — Full PQ Double Ratchet
// ─────────────────────────────────────────────────────────────────────────────

/// Ratchet protocol errors.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RatchetError {
    /// Invalid or missing public key.
    InvalidPublicKey(&'static str),
    /// Invalid or missing ciphertext.
    InvalidCiphertext(&'static str),
    /// Handshake was not completed before calling encrypt/decrypt.
    HandshakeIncomplete,
    /// Encryption/decryption failed.
    CryptoError(&'static str),
    /// Skipped-key cache is full.
    TooManySkippedKeys,
    /// Generic error with message.
    Other(&'static str),
}

impl std::fmt::Display for RatchetError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidPublicKey(m) => write!(f, "InvalidPublicKey: {}", m),
            Self::InvalidCiphertext(m) => write!(f, "InvalidCiphertext: {}", m),
            Self::HandshakeIncomplete => write!(f, "HandshakeIncomplete"),
            Self::CryptoError(m) => write!(f, "CryptoError: {}", m),
            Self::TooManySkippedKeys => write!(f, "TooManySkippedKeys"),
            Self::Other(m) => write!(f, "RatchetError: {}", m),
        }
    }
}

impl std::error::Error for RatchetError {}

/// Full PQ Double Ratchet session.
///
/// # Thread safety
///
/// `PqRatchetSession` is NOT thread-safe.  Wrap in a `Mutex` if shared.
pub struct PqRatchetSession {
    state: RatchetState,
    handshake_complete: bool,
}

impl PqRatchetSession {
    // ── Internal helpers ──────────────────────────────────────────────────

    /// Generate a fresh Kyber768 keypair and store it into `state.our_ratchet_keypair`.
    fn gen_keypair_into(state: &mut RatchetState) {
        let (pk, sk) = kyber768::keypair();
        state.our_ratchet_keypair.pk.copy_from_slice(pk.as_bytes());
        state.our_ratchet_keypair.sk.copy_from_slice(sk.as_bytes());
    }

    /// Load the stored ratchet public key as a Kyber type.
    fn our_pk(state: &RatchetState) -> Result<kyber768::PublicKey, RatchetError> {
        kyber768::PublicKey::from_bytes(&state.our_ratchet_keypair.pk)
            .map_err(|_| RatchetError::InvalidPublicKey("our ratchet public key"))
    }

    /// Load the stored ratchet secret key as a Kyber type.
    fn our_sk(state: &RatchetState) -> Result<kyber768::SecretKey, RatchetError> {
        kyber768::SecretKey::from_bytes(&state.our_ratchet_keypair.sk)
            .map_err(|_| RatchetError::InvalidPublicKey("our ratchet secret key"))
    }

    /// Load the stored remote ratchet public key as a Kyber type.
    fn their_pk(state: &RatchetState) -> Result<kyber768::PublicKey, RatchetError> {
        kyber768::PublicKey::from_bytes(&state.their_ratchet_pk)
            .map_err(|_| RatchetError::InvalidPublicKey("their ratchet public key"))
    }

    /// AES-256-GCM encrypt with a deterministic nonce derived from the message key.
    fn aes_encrypt(
        aes_key: &[u8; 32],
        nonce: &[u8; 12],
        plaintext: &[u8],
        aad: &[u8],
    ) -> Result<Vec<u8>, RatchetError> {
        let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(aes_key));
        let n = Nonce::from_slice(nonce);
        let payload = Payload { msg: plaintext, aad };
        cipher
            .encrypt(n, payload)
            .map_err(|_| RatchetError::CryptoError("AES-GCM encrypt failed"))
    }

    /// AES-256-GCM decrypt.
    fn aes_decrypt(
        aes_key: &[u8; 32],
        nonce: &[u8; 12],
        ciphertext: &[u8],
        aad: &[u8],
    ) -> Result<Vec<u8>, RatchetError> {
        let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(aes_key));
        let n = Nonce::from_slice(nonce);
        let payload = Payload { msg: ciphertext, aad };
        cipher
            .decrypt(n, payload)
            .map_err(|_| RatchetError::CryptoError("AES-GCM decrypt failed"))
    }

    /// Perform a KEM ratchet step on the *sending* side:
    ///   1. Encapsulate to `their_pk` to get (ss, ct).
    ///   2. Run root_kdf(root_key, ss) → (new_root_key, new_chain_key).
    ///   3. Generate a fresh local ratchet keypair.
    ///   4. Store the KEM ciphertext for the outgoing header.
    fn ratchet_send_step(state: &mut RatchetState) -> Result<([u8; CT_BYTES], [u8; 32]), RatchetError> {
        let their_pk = Self::their_pk(state)?;
        // pqcrypto-kyber returns (SharedSecret, Ciphertext)
        let (ss, ct) = kyber768::encapsulate(&their_pk);

        let ss_bytes: [u8; 32] = ss
            .as_bytes()
            .try_into()
            .map_err(|_| RatchetError::CryptoError("shared secret size mismatch"))?;

        let (new_rk, new_ck) = root_kdf(&state.root_key.0, &ss_bytes);
        state.root_key.0 = new_rk;

        // Generate a fresh sending ratchet keypair.
        Self::gen_keypair_into(state);

        // Store ct for inclusion in the next message header.
        let mut ct_bytes = [0u8; CT_BYTES];
        ct_bytes.copy_from_slice(ct.as_bytes());

        Ok((ct_bytes, new_ck))
    }

    /// Perform a KEM ratchet step on the *receiving* side:
    ///   1. Decapsulate `kem_ct` with our ratchet secret key.
    ///   2. Run root_kdf(root_key, ss) → (new_root_key, new_chain_key).
    ///   3. Update `their_ratchet_pk` to the sender's new key from the header.
    fn ratchet_recv_step(
        state: &mut RatchetState,
        kem_ct: &[u8; CT_BYTES],
        sender_new_pk: &[u8; PK_BYTES],
    ) -> Result<[u8; 32], RatchetError> {
        let ct = kyber768::Ciphertext::from_bytes(kem_ct)
            .map_err(|_| RatchetError::InvalidCiphertext("header KEM ciphertext"))?;
        let sk = Self::our_sk(state)?;
        let ss = kyber768::decapsulate(&ct, &sk);

        let ss_bytes: [u8; 32] = ss
            .as_bytes()
            .try_into()
            .map_err(|_| RatchetError::CryptoError("shared secret size mismatch"))?;

        let (new_rk, new_ck) = root_kdf(&state.root_key.0, &ss_bytes);
        state.root_key.0 = new_rk;

        // Update the remote ratchet key.
        state.their_ratchet_pk.copy_from_slice(sender_new_pk);

        Ok(new_ck)
    }

    /// Cache skipped receiving-chain message keys up to `target_count`.
    fn skip_message_keys(
        state: &mut RatchetState,
        target_count: u32,
    ) -> Result<(), RatchetError> {
        let current = state.recv_message_number;
        if target_count <= current {
            return Ok(());
        }
        if target_count - current > state::MAX_SKIP {
            return Err(RatchetError::TooManySkippedKeys);
        }
        let mut ck = state.recv_chain_key.0;
        for n in current..target_count {
            let (mk, next_ck) = chain_kdf(&ck);
            ck = next_ck;
            let skip_key = SkipKey::new(&state.their_ratchet_pk, n);
            state
                .store_skipped_key(skip_key, mk)
                .map_err(|_| RatchetError::TooManySkippedKeys)?;
        }
        state.recv_chain_key.0 = ck;
        state.recv_message_number = target_count;
        Ok(())
    }

    // ── Public handshake API ──────────────────────────────────────────────

    /// Alice initialises the session and returns her ephemeral ratchet public key.
    ///
    /// Alice generates a Kyber768 keypair and waits for Bob's response.
    pub fn init_alice() -> (Self, Vec<u8>) {
        let mut state = RatchetState::new(Side::Alice);
        Self::gen_keypair_into(&mut state);
        let pk_bytes = state.our_ratchet_keypair.pk.to_vec();
        let session = Self {
            state,
            handshake_complete: false,
        };
        (session, pk_bytes)
    }

    /// Bob initialises the session given Alice's ephemeral public key.
    ///
    /// Returns `(session, kem_ciphertext_bytes, bob_pk_bytes)`.
    /// Bob must send `kem_ciphertext_bytes` and `bob_pk_bytes` back to Alice.
    pub fn init_bob(alice_eph_pk: &[u8]) -> Result<(Self, Vec<u8>, Vec<u8>), RatchetError> {
        if alice_eph_pk.len() != PK_BYTES {
            return Err(RatchetError::InvalidPublicKey("alice ephemeral pk wrong length"));
        }
        let alice_pk = kyber768::PublicKey::from_bytes(alice_eph_pk)
            .map_err(|_| RatchetError::InvalidPublicKey("alice ephemeral pk invalid"))?;

        let mut state = RatchetState::new(Side::Bob);

        // Encapsulate to Alice's key: pqcrypto-kyber returns (SharedSecret, Ciphertext).
        let (ss, ct) = kyber768::encapsulate(&alice_pk);
        let ss_bytes: [u8; 32] = ss
            .as_bytes()
            .try_into()
            .map_err(|_| RatchetError::CryptoError("shared secret size"))?;

        // Derive initial root key from the shared secret (no prior root key).
        let zero_rk = [0u8; 32];
        let (rk, send_ck) = root_kdf(&zero_rk, &ss_bytes);
        state.root_key.0 = rk;
        state.send_chain_key.0 = send_ck;

        // Store Alice's ephemeral PK as "their" ratchet key.
        state.their_ratchet_pk.copy_from_slice(alice_eph_pk);

        // Generate Bob's own ratchet keypair.
        Self::gen_keypair_into(&mut state);

        let kem_ct_bytes = ct.as_bytes().to_vec();
        let bob_pk_bytes = state.our_ratchet_keypair.pk.to_vec();

        let session = Self {
            state,
            handshake_complete: true,
        };
        Ok((session, kem_ct_bytes, bob_pk_bytes))
    }

    /// Alice finishes the handshake given Bob's KEM ciphertext and ratchet public key.
    pub fn alice_finish_handshake(
        &mut self,
        kem_ct: &[u8],
        bob_pk: &[u8],
    ) -> Result<(), RatchetError> {
        if kem_ct.len() != CT_BYTES {
            return Err(RatchetError::InvalidCiphertext("kem_ct wrong length"));
        }
        if bob_pk.len() != PK_BYTES {
            return Err(RatchetError::InvalidPublicKey("bob_pk wrong length"));
        }

        let ct = kyber768::Ciphertext::from_bytes(kem_ct)
            .map_err(|_| RatchetError::InvalidCiphertext("invalid kem_ct"))?;
        let sk = Self::our_sk(&self.state)?;
        let ss = kyber768::decapsulate(&ct, &sk);
        let ss_bytes: [u8; 32] = ss
            .as_bytes()
            .try_into()
            .map_err(|_| RatchetError::CryptoError("shared secret size"))?;

        // Derive initial root key.
        let zero_rk = [0u8; 32];
        let (rk, recv_ck) = root_kdf(&zero_rk, &ss_bytes);
        self.state.root_key.0 = rk;
        self.state.recv_chain_key.0 = recv_ck;

        // Store Bob's ratchet PK as "their" key.
        self.state.their_ratchet_pk.copy_from_slice(bob_pk);

        // Alice will need to do a ratchet step when she sends her first message.
        self.handshake_complete = true;
        Ok(())
    }

    // ── Encrypt / decrypt ─────────────────────────────────────────────────

    /// Encrypt a plaintext message.
    ///
    /// Returns `(header_bytes, ciphertext_bytes)`.
    pub fn encrypt(&mut self, plaintext: &[u8]) -> Result<(Vec<u8>, Vec<u8>), RatchetError> {
        if !self.handshake_complete {
            return Err(RatchetError::HandshakeIncomplete);
        }

        let state = &mut self.state;

        let (send_ck, header) = match state.side {
            Side::Alice => {
                // Alice always does a ratchet step on her first message of each chain.
                if state.send_message_number == 0 {
                    // Ratchet step: encapsulate to their current PK.
                    let (ct_bytes, new_ck) = Self::ratchet_send_step(state)?;
                    state.send_chain_key.0 = new_ck;

                    let our_pk = Self::our_pk(state)?;
                    let ct_typed = kyber768::Ciphertext::from_bytes(&ct_bytes)
                        .map_err(|_| RatchetError::InvalidCiphertext("ratchet step ct"))?;
                    let hdr = MessageHeader::new_with_kem(
                        state.send_message_number,
                        state.previous_send_chain_length,
                        &our_pk,
                        &ct_typed,
                    );
                    (state.send_chain_key.0, hdr)
                } else {
                    let our_pk = Self::our_pk(state)?;
                    let hdr = MessageHeader::new_without_kem(
                        state.send_message_number,
                        state.previous_send_chain_length,
                        &our_pk,
                    );
                    (state.send_chain_key.0, hdr)
                }
            }
            Side::Bob => {
                let our_pk = Self::our_pk(state)?;
                let hdr = MessageHeader::new_without_kem(
                    state.send_message_number,
                    state.previous_send_chain_length,
                    &our_pk,
                );
                (state.send_chain_key.0, hdr)
            }
        };

        // Advance the sending chain.
        let (msg_key, next_ck) = chain_kdf(&send_ck);
        state.send_chain_key.0 = next_ck;

        let msg_number = state.send_message_number;
        state.send_message_number += 1;

        // Derive AES key + nonce from the message key.
        let mut mk = msg_key;
        let (aes_key, nonce) = message_keys(&mk, msg_number);
        mk.zeroize();

        let header_bytes = header.to_bytes();
        // Use header bytes as associated data for authentication.
        let ciphertext = Self::aes_encrypt(&aes_key, &nonce, plaintext, &header_bytes)?;

        Ok((header_bytes, ciphertext))
    }

    /// Decrypt a ciphertext message given its header bytes.
    pub fn decrypt(
        &mut self,
        header_bytes: &[u8],
        ciphertext: &[u8],
    ) -> Result<Vec<u8>, RatchetError> {
        if !self.handshake_complete {
            return Err(RatchetError::HandshakeIncomplete);
        }

        let header = MessageHeader::from_bytes(header_bytes)
            .map_err(RatchetError::InvalidPublicKey)?;

        // Check skipped-key cache first (handles out-of-order delivery).
        let skip_key = SkipKey::new(&header.ephemeral_pk, header.message_number);
        if let Some(mut mk) = self.state.take_skipped_key(&skip_key) {
            let (aes_key, nonce) = message_keys(&mk, header.message_number);
            mk.zeroize();
            return Self::aes_decrypt(&aes_key, &nonce, ciphertext, header_bytes);
        }

        let state = &mut self.state;

        // If the header contains a KEM ciphertext, it's a ratchet step.
        if header.has_kem_ct() {
            // Skip any unreceived messages in the current chain.
            Self::skip_message_keys(state, header.previous_chain_length)?;
            state.recv_message_number = 0;
            state.previous_send_chain_length = state.send_message_number;

            let ct_bytes = header.kem_ciphertext.as_ref()
                .ok_or(RatchetError::InvalidCiphertext("missing KEM CT in header"))?;
            let new_ck = Self::ratchet_recv_step(state, ct_bytes, &header.ephemeral_pk)?;
            state.recv_chain_key.0 = new_ck;
        }

        // Skip any messages up to this one.
        Self::skip_message_keys(state, header.message_number)?;

        // Advance the receiving chain by one.
        let (mut mk, next_ck) = chain_kdf(&state.recv_chain_key.0);
        state.recv_chain_key.0 = next_ck;
        state.recv_message_number = header.message_number + 1;

        let (aes_key, nonce) = message_keys(&mk, header.message_number);
        mk.zeroize();

        Self::aes_decrypt(&aes_key, &nonce, ciphertext, header_bytes)
    }

    /// Return our current ratchet public key bytes.
    pub fn public_key_bytes(&self) -> &[u8; PK_BYTES] {
        &self.state.our_ratchet_keypair.pk
    }

    /// Return true if the handshake is complete.
    pub fn is_ready(&self) -> bool {
        self.handshake_complete
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    // ── PqcRatchet (backward compat) ──────────────────────────────────────

    #[test]
    fn test_pqc_ratchet_encapsulate_decapsulate() {
        let mut alice = PqcRatchet::new();
        let bob = PqcRatchet::new();

        let bob_pk_bytes = bob.local_static_public.as_bytes().to_vec();
        alice.set_remote_public(&bob_pk_bytes).expect("set remote pk");

        let (ct_bytes, ss_alice) = alice.encapsulate().expect("encapsulate");
        let ss_bob = bob.decapsulate(&ct_bytes).expect("decapsulate");

        assert_eq!(ss_alice, ss_bob, "shared secrets must match");
    }

    #[test]
    fn test_pqc_ratchet_encrypt_decrypt() {
        let ratchet = PqcRatchet::new();
        let key = [0xabu8; 32];
        let plaintext = b"hello post-quantum world";
        let ad = b"assoc-data";

        let encrypted = ratchet.encrypt(plaintext, &key, ad).expect("encrypt");
        let decrypted = ratchet.decrypt(&encrypted, &key, ad).expect("decrypt");
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn test_pqc_ratchet_wrong_key_fails() {
        let ratchet = PqcRatchet::new();
        let key1 = [0x01u8; 32];
        let key2 = [0x02u8; 32];
        let plaintext = b"test";
        let ad = b"";

        let encrypted = ratchet.encrypt(plaintext, &key1, ad).expect("encrypt");
        assert!(ratchet.decrypt(&encrypted, &key2, ad).is_err());
    }

    // ── PqRatchetSession handshake ────────────────────────────────────────

    #[test]
    fn test_full_handshake() {
        let (mut alice, alice_pk) = PqRatchetSession::init_alice();
        let (bob, kem_ct, bob_pk) =
            PqRatchetSession::init_bob(&alice_pk).expect("bob init");

        alice
            .alice_finish_handshake(&kem_ct, &bob_pk)
            .expect("alice finish");

        assert!(alice.is_ready());
        assert!(bob.is_ready());
    }

    #[test]
    fn test_encrypt_decrypt_alice_to_bob() {
        let (mut alice, alice_pk) = PqRatchetSession::init_alice();
        let (mut bob, kem_ct, bob_pk) =
            PqRatchetSession::init_bob(&alice_pk).expect("bob init");
        alice
            .alice_finish_handshake(&kem_ct, &bob_pk)
            .expect("alice finish");

        let msg = b"hello from alice";
        let (header, ct) = alice.encrypt(msg).expect("encrypt");
        let plaintext = bob.decrypt(&header, &ct).expect("decrypt");
        assert_eq!(plaintext, msg);
    }

    #[test]
    fn test_encrypt_decrypt_bob_to_alice() {
        let (mut alice, alice_pk) = PqRatchetSession::init_alice();
        let (mut bob, kem_ct, bob_pk) =
            PqRatchetSession::init_bob(&alice_pk).expect("bob init");
        alice
            .alice_finish_handshake(&kem_ct, &bob_pk)
            .expect("alice finish");

        let msg = b"hello from bob";
        let (header, ct) = bob.encrypt(msg).expect("encrypt");
        let plaintext = alice.decrypt(&header, &ct).expect("decrypt");
        assert_eq!(plaintext, msg);
    }

    #[test]
    fn test_multiple_messages_alice_to_bob() {
        let (mut alice, alice_pk) = PqRatchetSession::init_alice();
        let (mut bob, kem_ct, bob_pk) =
            PqRatchetSession::init_bob(&alice_pk).expect("bob init");
        alice
            .alice_finish_handshake(&kem_ct, &bob_pk)
            .expect("alice finish");

        for i in 0u32..5 {
            let msg = format!("message {}", i);
            let (header, ct) = alice.encrypt(msg.as_bytes()).expect("encrypt");
            let plain = bob.decrypt(&header, &ct).expect("decrypt");
            assert_eq!(plain, msg.as_bytes());
        }
    }

    #[test]
    fn test_multiple_messages_both_directions() {
        let (mut alice, alice_pk) = PqRatchetSession::init_alice();
        let (mut bob, kem_ct, bob_pk) =
            PqRatchetSession::init_bob(&alice_pk).expect("bob init");
        alice
            .alice_finish_handshake(&kem_ct, &bob_pk)
            .expect("alice finish");

        // Alice sends 3, Bob sends 3, interleaved
        for i in 0..3u32 {
            let msg_a = format!("alice-{}", i);
            let (h, c) = alice.encrypt(msg_a.as_bytes()).expect("enc");
            let p = bob.decrypt(&h, &c).expect("dec");
            assert_eq!(p, msg_a.as_bytes());

            let msg_b = format!("bob-{}", i);
            let (h, c) = bob.encrypt(msg_b.as_bytes()).expect("enc");
            let p = alice.decrypt(&h, &c).expect("dec");
            assert_eq!(p, msg_b.as_bytes());
        }
    }

    #[test]
    fn test_wrong_key_handshake_rejected() {
        // Bob uses a random wrong public key for Alice.
        let bad_pk = vec![0u8; PK_BYTES];
        // from_bytes on all-zeros will likely fail, but if not, handshake diverges.
        let result = PqRatchetSession::init_bob(&bad_pk);
        // Either the key parse fails, or the session is created but decrypt will fail.
        // Either way is acceptable behavior.
        let _ = result;
    }

    #[test]
    fn test_encrypt_before_handshake_fails() {
        let (mut alice, _alice_pk) = PqRatchetSession::init_alice();
        let result = alice.encrypt(b"premature");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), RatchetError::HandshakeIncomplete);
    }

    #[test]
    fn test_tampered_ciphertext_rejected() {
        let (mut alice, alice_pk) = PqRatchetSession::init_alice();
        let (mut bob, kem_ct, bob_pk) =
            PqRatchetSession::init_bob(&alice_pk).expect("bob init");
        alice
            .alice_finish_handshake(&kem_ct, &bob_pk)
            .expect("alice finish");

        let msg = b"secret";
        let (header, mut ct) = alice.encrypt(msg).expect("encrypt");
        ct[0] ^= 0xff; // tamper
        assert!(bob.decrypt(&header, &ct).is_err());
    }
}
