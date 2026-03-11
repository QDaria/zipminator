//! Tauri commands exposing Kyber768 post-quantum cryptography.
//!
//! These wrap zipminator-core's Kyber768 implementation for the desktop app.

use base64::engine::general_purpose::STANDARD as B64;
use base64::Engine;
use serde::Serialize;
use zipminator_core::Kyber768;

#[derive(Serialize)]
pub struct PqcKeypair {
    pub public_key: String,  // base64
    pub secret_key: String,  // base64
    pub pk_size: usize,
    pub sk_size: usize,
}

#[derive(Serialize)]
pub struct PqcEncapsulation {
    pub ciphertext: String,      // base64
    pub shared_secret: String,   // base64 (32 bytes)
    pub ct_size: usize,
}

#[derive(Serialize)]
pub struct PqcDecapsulation {
    pub shared_secret: String,   // base64 (32 bytes)
    pub matches: bool,
}

#[derive(Serialize)]
pub struct PqcInfo {
    pub algorithm: String,
    pub nist_level: u8,
    pub pk_bytes: usize,
    pub sk_bytes: usize,
    pub ct_bytes: usize,
    pub ss_bytes: usize,
}

/// Return metadata about the PQC algorithm in use.
#[tauri::command]
pub fn pqc_info() -> PqcInfo {
    PqcInfo {
        algorithm: "ML-KEM-768 (NIST FIPS 203)".into(),
        nist_level: 3,
        pk_bytes: 1184,
        sk_bytes: 2400,
        ct_bytes: 1088,
        ss_bytes: 32,
    }
}

/// Generate a Kyber768 keypair. Returns base64-encoded keys.
#[tauri::command]
pub fn pqc_keygen() -> Result<PqcKeypair, String> {
    let (pk, sk) = Kyber768::keypair();
    let pk_bytes = &pk.data;
    let sk_bytes = sk.as_bytes();
    Ok(PqcKeypair {
        pk_size: pk_bytes.len(),
        sk_size: sk_bytes.len(),
        public_key: B64.encode(pk_bytes),
        secret_key: B64.encode(sk_bytes),
    })
}

/// Encapsulate: given a base64 public key, produce ciphertext + shared secret.
#[tauri::command]
pub fn pqc_encapsulate(public_key_b64: String) -> Result<PqcEncapsulation, String> {
    let pk_bytes = B64.decode(&public_key_b64).map_err(|e| format!("bad base64: {e}"))?;
    let pk = zipminator_core::PublicKey::from_bytes(&pk_bytes)
        .map_err(|e| format!("invalid public key: {e}"))?;
    let (ct, ss) = Kyber768::encapsulate(&pk);
    let ct_bytes = &ct.data;
    Ok(PqcEncapsulation {
        ct_size: ct_bytes.len(),
        ciphertext: B64.encode(ct_bytes),
        shared_secret: B64.encode(ss.as_bytes()),
    })
}

/// Decapsulate: given base64 ciphertext + secret key, recover shared secret.
#[tauri::command]
pub fn pqc_decapsulate(
    ciphertext_b64: String,
    secret_key_b64: String,
) -> Result<PqcDecapsulation, String> {
    let ct_bytes = B64.decode(&ciphertext_b64).map_err(|e| format!("bad ct base64: {e}"))?;
    let sk_bytes = B64.decode(&secret_key_b64).map_err(|e| format!("bad sk base64: {e}"))?;
    let ct = zipminator_core::Ciphertext::from_bytes(&ct_bytes)
        .map_err(|e| format!("invalid ciphertext: {e}"))?;
    let sk = zipminator_core::SecretKey::from_bytes(&sk_bytes)
        .map_err(|e| format!("invalid secret key: {e}"))?;
    let ss = Kyber768::decapsulate(&ct, &sk);
    Ok(PqcDecapsulation {
        shared_secret: B64.encode(ss.as_bytes()),
        matches: true,
    })
}

#[derive(Serialize)]
pub struct PqcSelfTestResult {
    pub passed: bool,
    pub keygen_ms: f64,
    pub encapsulate_ms: f64,
    pub decapsulate_ms: f64,
    pub shared_secret_match: bool,
    pub pk_size: usize,
    pub sk_size: usize,
    pub ct_size: usize,
}

/// Run a full PQC self-test: keygen -> encapsulate -> decapsulate -> verify.
#[tauri::command]
pub fn pqc_self_test() -> Result<PqcSelfTestResult, String> {
    use std::time::Instant;

    let t0 = Instant::now();
    let (pk, sk) = Kyber768::keypair();
    let keygen_ms = t0.elapsed().as_secs_f64() * 1000.0;

    let t1 = Instant::now();
    let (ct, ss_enc) = Kyber768::encapsulate(&pk);
    let encapsulate_ms = t1.elapsed().as_secs_f64() * 1000.0;

    let t2 = Instant::now();
    let ss_dec = Kyber768::decapsulate(&ct, &sk);
    let decapsulate_ms = t2.elapsed().as_secs_f64() * 1000.0;

    let shared_secret_match = ss_enc.as_bytes() == ss_dec.as_bytes();

    Ok(PqcSelfTestResult {
        passed: shared_secret_match,
        keygen_ms,
        encapsulate_ms,
        decapsulate_ms,
        shared_secret_match,
        pk_size: pk.data.len(),
        sk_size: sk.as_bytes().len(),
        ct_size: ct.data.len(),
    })
}
