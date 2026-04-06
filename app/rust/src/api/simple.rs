//! Flutter Rust Bridge API — thin wrappers around zipminator-app.
//!
//! Each `pub fn` here auto-generates a Dart function via FRB codegen.
//! Keep types simple: Vec<u8>, String, u64, Result<T, String>.

use zipminator_app::crypto;
use zipminator_app::email;
use zipminator_app::pii;
use zipminator_app::ratchet;
use zipminator_app::srtp;

// ── Initialization ──────────────────────────────────────────────────────

#[flutter_rust_bridge::frb(init)]
pub fn init_app() {
    flutter_rust_bridge::setup_default_user_utils();
}

/// Library version.
#[flutter_rust_bridge::frb(sync)]
pub fn version() -> String {
    zipminator_app::version()
}

// ── Pillar 1: Vault (Crypto) ────────────────────────────────────────────

/// Generate an ML-KEM-768 keypair.
/// Returns (public_key: 1184 bytes, secret_key: 2400 bytes).
pub fn keypair() -> KeypairResult {
    let kp = crypto::keypair();
    KeypairResult {
        public_key: kp.public_key,
        secret_key: kp.secret_key,
    }
}

/// Encapsulate: create a shared secret for the given public key.
/// Returns (ciphertext: 1088 bytes, shared_secret: 32 bytes).
pub fn encapsulate(public_key: Vec<u8>) -> Result<EncapsulationResult, String> {
    let enc = crypto::encapsulate(&public_key).map_err(|e| e.to_string())?;
    Ok(EncapsulationResult {
        ciphertext: enc.ciphertext,
        shared_secret: enc.shared_secret,
    })
}

/// Decapsulate: recover the shared secret from ciphertext + secret key.
/// Returns 32-byte shared secret.
pub fn decapsulate(ciphertext: Vec<u8>, secret_key: Vec<u8>) -> Result<Vec<u8>, String> {
    crypto::decapsulate(&ciphertext, &secret_key).map_err(|e| e.to_string())
}

/// Generate a composite keypair (ML-KEM-768 + X25519).
/// Returns (public_key: 1216 bytes, secret_key: 2432 bytes).
pub fn composite_keypair() -> KeypairResult {
    let kp = crypto::composite_keypair();
    KeypairResult {
        public_key: kp.public_key,
        secret_key: kp.secret_key,
    }
}

// ── Pillar 2: Messenger (Ratchet) ───────────────────────────────────────

/// Initialize Alice's side of a ratchet session.
/// Returns session_id and Alice's ephemeral public key (1184 bytes).
pub fn ratchet_init_alice() -> RatchetAliceResult {
    let result = ratchet::init_alice();
    RatchetAliceResult {
        session_id: result.session_id,
        public_key: result.public_key,
    }
}

/// Initialize Bob's side given Alice's public key.
/// Returns session_id, KEM ciphertext (1088), and Bob's public key (1184).
pub fn ratchet_init_bob(alice_public_key: Vec<u8>) -> Result<RatchetBobResult, String> {
    let result = ratchet::init_bob(alice_public_key).map_err(|e| e.to_string())?;
    Ok(RatchetBobResult {
        session_id: result.session_id,
        kem_ciphertext: result.kem_ciphertext,
        public_key: result.public_key,
    })
}

/// Complete Alice's handshake with Bob's response.
pub fn ratchet_alice_finish(
    session_id: u64,
    kem_ciphertext: Vec<u8>,
    bob_public_key: Vec<u8>,
) -> Result<(), String> {
    ratchet::alice_finish(session_id, kem_ciphertext, bob_public_key)
        .map_err(|e| e.to_string())
}

/// Encrypt a message in a ratchet session.
/// Returns (header, ciphertext).
pub fn ratchet_encrypt(
    session_id: u64,
    plaintext: Vec<u8>,
) -> Result<RatchetMessage, String> {
    let enc = ratchet::encrypt(session_id, plaintext).map_err(|e| e.to_string())?;
    Ok(RatchetMessage {
        header: enc.header,
        ciphertext: enc.ciphertext,
    })
}

/// Decrypt a message in a ratchet session.
pub fn ratchet_decrypt(
    session_id: u64,
    header: Vec<u8>,
    ciphertext: Vec<u8>,
) -> Result<Vec<u8>, String> {
    ratchet::decrypt(session_id, header, ciphertext).map_err(|e| e.to_string())
}

/// Destroy a ratchet session.
#[flutter_rust_bridge::frb(sync)]
pub fn ratchet_destroy(session_id: u64) {
    ratchet::destroy_session(session_id);
}

// ── Pillar 3: VoIP (SRTP) ──────────────────────────────────────────────

/// Derive SRTP key material from a 32-byte shared secret.
/// Returns (master_key: 16 bytes, master_salt: 14 bytes).
pub fn derive_srtp_keys(shared_secret: Vec<u8>) -> Result<SrtpKeysResult, String> {
    let keys = srtp::derive_srtp_keys(shared_secret)?;
    Ok(SrtpKeysResult {
        master_key: keys.master_key,
        master_salt: keys.master_salt,
    })
}

// ── Pillar 5: Anonymizer (PII) ─────────────────────────────────────────

/// Scan text for PII patterns.
/// Returns a JSON array of matches.
#[flutter_rust_bridge::frb(sync)]
pub fn pii_scan(text: String, country_codes: String) -> String {
    pii::scan_text_json(text, country_codes)
}

// ── Pillar 7: Email ─────────────────────────────────────────────────────

/// Encrypt an email body with ML-KEM-768 envelope encryption.
pub fn email_encrypt(
    recipient_pk: Vec<u8>,
    plaintext: Vec<u8>,
    aad: Vec<u8>,
) -> Result<Vec<u8>, String> {
    email::encrypt_email(recipient_pk, plaintext, aad).map_err(|e| e.to_string())
}

/// Decrypt an email envelope.
pub fn email_decrypt(
    secret_key: Vec<u8>,
    envelope: Vec<u8>,
    aad: Vec<u8>,
) -> Result<Vec<u8>, String> {
    email::decrypt_email(secret_key, envelope, aad).map_err(|e| e.to_string())
}

// ── FRB-compatible structs ──────────────────────────────────────────────

pub struct KeypairResult {
    pub public_key: Vec<u8>,
    pub secret_key: Vec<u8>,
}

pub struct EncapsulationResult {
    pub ciphertext: Vec<u8>,
    pub shared_secret: Vec<u8>,
}

pub struct RatchetAliceResult {
    pub session_id: u64,
    pub public_key: Vec<u8>,
}

pub struct RatchetBobResult {
    pub session_id: u64,
    pub kem_ciphertext: Vec<u8>,
    pub public_key: Vec<u8>,
}

pub struct RatchetMessage {
    pub header: Vec<u8>,
    pub ciphertext: Vec<u8>,
}

pub struct SrtpKeysResult {
    pub master_key: Vec<u8>,
    pub master_salt: Vec<u8>,
}
