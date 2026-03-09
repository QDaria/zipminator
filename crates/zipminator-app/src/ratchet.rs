//! Safe wrappers for the PQ Double Ratchet session protocol.
//!
//! Provides a session-based API using only simple types (`Vec<u8>`, `String`,
//! `Result`) for flutter_rust_bridge compatibility.

use thiserror::Error;
use zipminator_core::ratchet::{PqRatchetSession, RatchetError as CoreRatchetError};

#[derive(Debug, Error)]
pub enum RatchetSessionError {
    #[error("Invalid public key: {0}")]
    InvalidPublicKey(String),
    #[error("Invalid ciphertext: {0}")]
    InvalidCiphertext(String),
    #[error("Handshake not completed")]
    HandshakeIncomplete,
    #[error("Crypto operation failed: {0}")]
    CryptoError(String),
    #[error("Too many skipped keys")]
    TooManySkippedKeys,
}

impl From<CoreRatchetError> for RatchetSessionError {
    fn from(e: CoreRatchetError) -> Self {
        match e {
            CoreRatchetError::InvalidPublicKey(m) => {
                RatchetSessionError::InvalidPublicKey(m.to_string())
            }
            CoreRatchetError::InvalidCiphertext(m) => {
                RatchetSessionError::InvalidCiphertext(m.to_string())
            }
            CoreRatchetError::HandshakeIncomplete => RatchetSessionError::HandshakeIncomplete,
            CoreRatchetError::CryptoError(m) => RatchetSessionError::CryptoError(m.to_string()),
            CoreRatchetError::TooManySkippedKeys => RatchetSessionError::TooManySkippedKeys,
            CoreRatchetError::Other(m) => RatchetSessionError::CryptoError(m.to_string()),
        }
    }
}

/// Result of Alice's session initialization.
pub struct AliceInitResult {
    /// Opaque session handle (index into session store).
    pub session_id: u64,
    /// Alice's ephemeral public key (1184 bytes) — send to Bob.
    pub public_key: Vec<u8>,
}

/// Result of Bob's session initialization.
pub struct BobInitResult {
    /// Opaque session handle.
    pub session_id: u64,
    /// KEM ciphertext (1088 bytes) — send to Alice.
    pub kem_ciphertext: Vec<u8>,
    /// Bob's ratchet public key (1184 bytes) — send to Alice.
    pub public_key: Vec<u8>,
}

/// Encrypted message result.
pub struct EncryptedMessage {
    /// Message header bytes.
    pub header: Vec<u8>,
    /// Ciphertext bytes.
    pub ciphertext: Vec<u8>,
}

// Session store: maps u64 IDs to sessions.
// In a real app this would use a proper concurrent map;
// for flutter_rust_bridge we keep it simple with a Mutex<HashMap>.
use std::collections::HashMap;
use std::sync::Mutex;

static SESSIONS: std::sync::LazyLock<Mutex<HashMap<u64, PqRatchetSession>>> =
    std::sync::LazyLock::new(|| Mutex::new(HashMap::new()));

static NEXT_ID: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(1);

fn next_id() -> u64 {
    NEXT_ID.fetch_add(1, std::sync::atomic::Ordering::Relaxed)
}

fn with_session<F, R>(id: u64, f: F) -> Result<R, RatchetSessionError>
where
    F: FnOnce(&mut PqRatchetSession) -> Result<R, RatchetSessionError>,
{
    let mut sessions = SESSIONS
        .lock()
        .map_err(|_| RatchetSessionError::CryptoError("session lock poisoned".into()))?;
    let session = sessions
        .get_mut(&id)
        .ok_or_else(|| RatchetSessionError::CryptoError("session not found".into()))?;
    f(session)
}

/// Initialize Alice's side of a ratchet session.
///
/// Returns the session ID and Alice's ephemeral public key.
pub fn init_alice() -> AliceInitResult {
    let (session, pk) = PqRatchetSession::init_alice();
    let id = next_id();
    SESSIONS.lock().unwrap().insert(id, session);
    AliceInitResult {
        session_id: id,
        public_key: pk,
    }
}

/// Initialize Bob's side of a ratchet session.
///
/// Takes Alice's ephemeral public key (1184 bytes).
/// Returns the session ID, KEM ciphertext, and Bob's public key.
pub fn init_bob(alice_public_key: Vec<u8>) -> Result<BobInitResult, RatchetSessionError> {
    let (session, kem_ct, bob_pk) = PqRatchetSession::init_bob(&alice_public_key)?;
    let id = next_id();
    SESSIONS.lock().unwrap().insert(id, session);
    Ok(BobInitResult {
        session_id: id,
        kem_ciphertext: kem_ct,
        public_key: bob_pk,
    })
}

/// Complete Alice's handshake with Bob's response.
pub fn alice_finish(
    session_id: u64,
    kem_ciphertext: Vec<u8>,
    bob_public_key: Vec<u8>,
) -> Result<(), RatchetSessionError> {
    with_session(session_id, |session| {
        session
            .alice_finish_handshake(&kem_ciphertext, &bob_public_key)
            .map_err(Into::into)
    })
}

/// Encrypt a plaintext message.
pub fn encrypt(
    session_id: u64,
    plaintext: Vec<u8>,
) -> Result<EncryptedMessage, RatchetSessionError> {
    with_session(session_id, |session| {
        let (header, ct) = session.encrypt(&plaintext)?;
        Ok(EncryptedMessage {
            header,
            ciphertext: ct,
        })
    })
}

/// Decrypt a message given its header and ciphertext.
pub fn decrypt(
    session_id: u64,
    header: Vec<u8>,
    ciphertext: Vec<u8>,
) -> Result<Vec<u8>, RatchetSessionError> {
    with_session(session_id, |session| {
        session.decrypt(&header, &ciphertext).map_err(Into::into)
    })
}

/// Destroy a session and free its memory.
pub fn destroy_session(session_id: u64) {
    if let Ok(mut sessions) = SESSIONS.lock() {
        sessions.remove(&session_id);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_full_ratchet_roundtrip() {
        // Alice init
        let alice = init_alice();
        assert_eq!(alice.public_key.len(), 1184);

        // Bob init
        let bob = init_bob(alice.public_key).expect("bob init");
        assert_eq!(bob.kem_ciphertext.len(), 1088);
        assert_eq!(bob.public_key.len(), 1184);

        // Alice finish
        alice_finish(alice.session_id, bob.kem_ciphertext, bob.public_key)
            .expect("alice finish");

        // Alice encrypts
        let msg = b"hello from alice".to_vec();
        let enc = encrypt(alice.session_id, msg.clone()).expect("encrypt");
        assert!(!enc.header.is_empty());
        assert!(!enc.ciphertext.is_empty());

        // Bob decrypts
        let plaintext = decrypt(bob.session_id, enc.header, enc.ciphertext)
            .expect("decrypt");
        assert_eq!(plaintext, msg);

        // Cleanup
        destroy_session(alice.session_id);
        destroy_session(bob.session_id);
    }

    #[test]
    fn test_bidirectional_messages() {
        let alice = init_alice();
        let bob = init_bob(alice.public_key).expect("bob init");
        alice_finish(alice.session_id, bob.kem_ciphertext, bob.public_key)
            .expect("alice finish");

        for i in 0..3 {
            // Alice -> Bob
            let msg_a = format!("alice-{i}").into_bytes();
            let enc = encrypt(alice.session_id, msg_a.clone()).expect("enc");
            let dec = decrypt(bob.session_id, enc.header, enc.ciphertext).expect("dec");
            assert_eq!(dec, msg_a);

            // Bob -> Alice
            let msg_b = format!("bob-{i}").into_bytes();
            let enc = encrypt(bob.session_id, msg_b.clone()).expect("enc");
            let dec = decrypt(alice.session_id, enc.header, enc.ciphertext).expect("dec");
            assert_eq!(dec, msg_b);
        }

        destroy_session(alice.session_id);
        destroy_session(bob.session_id);
    }
}
