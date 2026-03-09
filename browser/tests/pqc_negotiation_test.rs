//! Unit tests for PQC detection and TLS configuration.
//!
//! These tests verify:
//! - The PQC detector correctly classifies key exchange algorithms.
//! - The TLS client configs build without error.
//! - The PQC status enum serialization round-trips.

use std::time::Duration;

use zipbrowser::proxy::pqc_detector::{PqcDetector, PqcStatus};
use zipbrowser::proxy::tls;

// ── Algorithm classification ──────────────────────────────────────────────

#[test]
fn classify_x25519_mlkem768_hybrid() {
    let status = PqcDetector::classify_key_exchange("X25519MLKEM768");
    assert_eq!(status, PqcStatus::Active("X25519MLKEM768".to_string()));
    assert!(status.is_pqc());
    assert!(status.description().contains("PQC active"));
}

#[test]
fn classify_kyber768_draft() {
    let status = PqcDetector::classify_key_exchange("X25519Kyber768Draft00");
    assert!(status.is_pqc());
    assert!(status.description().contains("PQC active"));
}

#[test]
fn classify_pure_mlkem() {
    let status = PqcDetector::classify_key_exchange("MLKEM768");
    assert!(status.is_pqc());
}

#[test]
fn classify_ml_kem_hyphenated() {
    let status = PqcDetector::classify_key_exchange("ML-KEM-768");
    assert!(status.is_pqc());
}

#[test]
fn classify_classical_x25519() {
    let status = PqcDetector::classify_key_exchange("X25519");
    assert_eq!(status, PqcStatus::Classical("X25519".to_string()));
    assert!(!status.is_pqc());
}

#[test]
fn classify_classical_p256() {
    let status = PqcDetector::classify_key_exchange("secp256r1");
    assert!(!status.is_pqc());
}

#[test]
fn classify_classical_p384() {
    let status = PqcDetector::classify_key_exchange("P384");
    assert!(!status.is_pqc());
}

#[test]
fn classify_unknown_algorithm() {
    let status = PqcDetector::classify_key_exchange("NovelCurve2030");
    assert!(!status.is_pqc());
    match status {
        PqcStatus::Classical(alg) => assert!(alg.contains("unknown")),
        _ => panic!("expected Classical variant"),
    }
}

// ── PQC status serialization ──────────────────────────────────────────────

#[test]
fn pqc_status_json_roundtrip() {
    let statuses = vec![
        PqcStatus::Active("X25519MLKEM768".to_string()),
        PqcStatus::Classical("X25519".to_string()),
        PqcStatus::Failed("timeout".to_string()),
    ];

    for status in statuses {
        let json = serde_json::to_string(&status).unwrap();
        let back: PqcStatus = serde_json::from_str(&json).unwrap();
        assert_eq!(back, status);
    }
}

#[test]
fn pqc_status_description_format() {
    assert_eq!(
        PqcStatus::Active("X25519MLKEM768".into()).description(),
        "PQC active: X25519MLKEM768"
    );
    assert_eq!(
        PqcStatus::Classical("X25519".into()).description(),
        "classical: X25519"
    );
    assert_eq!(
        PqcStatus::Failed("cert error".into()).description(),
        "failed: cert error"
    );
}

// ── Detector cache behavior ───────────────────────────────────────────────

#[test]
fn cache_insert_and_lookup() {
    let det = PqcDetector::new();

    det.record("a.com", PqcStatus::Active("X25519MLKEM768".into()));
    det.record("b.com", PqcStatus::Classical("X25519".into()));

    assert_eq!(det.cache_size(), 2);
    assert!(det.lookup("a.com").unwrap().is_pqc());
    assert!(!det.lookup("b.com").unwrap().is_pqc());
    assert!(det.lookup("c.com").is_none());
}

#[test]
fn cache_overwrite() {
    let det = PqcDetector::new();

    det.record("site.com", PqcStatus::Classical("X25519".into()));
    assert!(!det.lookup("site.com").unwrap().is_pqc());

    // Server now supports PQC after an upgrade.
    det.record("site.com", PqcStatus::Active("X25519MLKEM768".into()));
    assert!(det.lookup("site.com").unwrap().is_pqc());

    // Cache size should still be 1.
    assert_eq!(det.cache_size(), 1);
}

#[test]
fn cache_clear() {
    let det = PqcDetector::new();
    det.record("a.com", PqcStatus::Active("X25519MLKEM768".into()));
    det.record("b.com", PqcStatus::Active("X25519MLKEM768".into()));
    assert_eq!(det.cache_size(), 2);

    det.clear_cache();
    assert_eq!(det.cache_size(), 0);
    assert!(det.lookup("a.com").is_none());
}

// ── TLS config construction ───────────────────────────────────────────────

#[test]
fn pqc_client_config_builds_successfully() {
    let config = tls::build_pqc_client_config();
    assert!(
        config.is_ok(),
        "PQC config should build: {:?}",
        config.err()
    );
}

#[test]
fn classical_client_config_builds_successfully() {
    let config = tls::build_classical_client_config();
    assert!(
        config.is_ok(),
        "classical config should build: {:?}",
        config.err()
    );
}

#[test]
fn tls_info_fields() {
    let info = tls::tls_info();
    assert_eq!(info.pqc_provider, "rustls-post-quantum (aws-lc-rs)");
    assert!(info.preferred_kx.contains("MLKEM"));
    assert!(info.fallback_kx.contains("X25519"));
    assert_eq!(info.min_tls_version, "TLS 1.3");
    assert!(info.cipher_suites.len() >= 2);
    assert!(info.cipher_suites.contains(&"TLS_AES_256_GCM_SHA384"));
}

// ── Known domain list ─────────────────────────────────────────────────────

#[test]
fn known_pqc_domains_correct() {
    assert!(PqcDetector::is_known_pqc_domain("pq.cloudflareresearch.com"));
    assert!(PqcDetector::is_known_pqc_domain("blog.cloudflare.com"));
    assert!(PqcDetector::is_known_pqc_domain("cloudflare.com"));
    assert!(!PqcDetector::is_known_pqc_domain("example.com"));
    assert!(!PqcDetector::is_known_pqc_domain("google.com"));
}

// ── TLS provider verification ─────────────────────────────────────────────

#[test]
fn verify_tls_provider() {
    let result = zipbrowser::proxy::verify_tls_provider();
    assert!(result.is_ok());
}
