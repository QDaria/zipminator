//! Integration tests for the PQC HTTPS proxy server.
//!
//! These tests verify:
//! - The proxy starts and listens on the configured port.
//! - The proxy rejects plain HTTP.
//! - The proxy configuration (bypass, PAC script) works.
//! - Metrics are recorded correctly.
//! - The CA generates valid certificates.

use std::time::Duration;

use zipbrowser::proxy::certificate::CertificateAuthority;
use zipbrowser::proxy::config::{ProxyConfig, ProxyMode};
use zipbrowser::proxy::metrics::MetricsCollector;
use zipbrowser::proxy::pqc_detector::{PqcDetector, PqcStatus};

// ── Configuration tests ───────────────────────────────────────────────────

#[test]
fn config_defaults_are_sane() {
    let cfg = ProxyConfig::default();
    assert_eq!(cfg.host, "127.0.0.1");
    assert_eq!(cfg.port, 18443);
    assert_eq!(cfg.max_connections, 256);
    assert_eq!(cfg.timeout_secs, 30);
    assert_eq!(cfg.mode, ProxyMode::Hybrid);
    assert!(cfg.should_bypass("localhost"));
    assert!(cfg.should_bypass("127.0.0.1"));
    assert!(!cfg.should_bypass("example.com"));
}

#[test]
fn config_bypass_builder_chainable() {
    let cfg = ProxyConfig::default()
        .bypass("internal.corp")
        .bypass("10.0.0.1")
        .with_mode(ProxyMode::PqcOnly)
        .with_port(9999);

    assert!(cfg.should_bypass("internal.corp"));
    assert!(cfg.should_bypass("10.0.0.1"));
    assert!(!cfg.should_bypass("external.com"));
    assert_eq!(cfg.port, 9999);
    assert_eq!(cfg.mode, ProxyMode::PqcOnly);
}

#[test]
fn pac_script_is_valid_javascript() {
    let cfg = ProxyConfig::default();
    let pac = cfg.generate_pac_script();

    // Must be a valid FindProxyForURL function.
    assert!(pac.contains("function FindProxyForURL"));
    assert!(pac.contains("PROXY 127.0.0.1:18443"));
    assert!(pac.contains("DIRECT"));
    // Bypass entries present.
    assert!(pac.contains("localhost"));
}

// ── PQC detector tests ───────────────────────────────────────────────────

#[test]
fn detector_classifies_pqc_algorithms() {
    let cases = vec![
        ("X25519MLKEM768", true),
        ("x25519mlkem768", true),
        ("X25519_MLKEM768", true),
        ("ML-KEM-768", true),
        ("X25519Kyber768Draft00", true),
        ("X25519", false),
        ("secp256r1", false),
        ("P384", false),
        ("ECDHE", false),
    ];

    for (alg, expected_pqc) in cases {
        let status = PqcDetector::classify_key_exchange(alg);
        assert_eq!(
            status.is_pqc(),
            expected_pqc,
            "algorithm {alg}: expected pqc={expected_pqc}, got {:?}",
            status
        );
    }
}

#[test]
fn detector_cache_workflow() {
    let det = PqcDetector::new();

    // Empty cache.
    assert!(det.lookup("example.com").is_none());
    assert_eq!(det.cache_size(), 0);

    // Record and retrieve.
    det.record("pq.cloudflareresearch.com", PqcStatus::Active("X25519MLKEM768".into()));
    det.record("old-server.com", PqcStatus::Classical("X25519".into()));
    det.record("broken.com", PqcStatus::Failed("timeout".into()));

    assert_eq!(det.cache_size(), 3);
    assert!(det.lookup("pq.cloudflareresearch.com").unwrap().is_pqc());
    assert!(!det.lookup("old-server.com").unwrap().is_pqc());
    assert_eq!(
        det.lookup("broken.com").unwrap(),
        PqcStatus::Failed("timeout".into())
    );

    // Clear.
    det.clear_cache();
    assert_eq!(det.cache_size(), 0);
}

#[test]
fn known_pqc_domains() {
    assert!(PqcDetector::is_known_pqc_domain("pq.cloudflareresearch.com"));
    assert!(PqcDetector::is_known_pqc_domain("cloudflare.com"));
    assert!(!PqcDetector::is_known_pqc_domain("random-site.org"));
}

// ── Metrics tests ─────────────────────────────────────────────────────────

#[test]
fn metrics_counting_and_snapshot() {
    let m = MetricsCollector::new();

    m.record_pqc("a.com", "X25519MLKEM768", Duration::from_millis(25));
    m.record_pqc("b.com", "X25519MLKEM768", Duration::from_millis(30));
    m.record_classical("c.com", "X25519", Duration::from_millis(10));
    m.record_failure("d.com", "connection refused");

    let snap = m.snapshot();
    assert_eq!(snap.pqc_connections, 2);
    assert_eq!(snap.classical_connections, 1);
    assert_eq!(snap.failed_connections, 1);
    assert_eq!(snap.total_connections, 4);
    assert_eq!(snap.domains.len(), 4);
}

#[test]
fn metrics_latency_averaging() {
    let m = MetricsCollector::new();
    m.record_pqc("fast.com", "X25519MLKEM768", Duration::from_millis(10));
    m.record_pqc("fast.com", "X25519MLKEM768", Duration::from_millis(30));

    let snap = m.snapshot();
    let dom = snap.domains.iter().find(|d| d.domain == "fast.com").unwrap();
    // Average of 10 and 30 = 20.
    assert!((dom.avg_latency_ms - 20.0).abs() < 1.0);
    assert_eq!(dom.total_connections, 2);
}

#[test]
fn metrics_event_builders() {
    let m = MetricsCollector::new();
    let evt = m.pqc_event("a.com", "X25519MLKEM768", Duration::from_millis(42));
    assert_eq!(evt.domain, "a.com");
    assert_eq!(evt.algorithm, "X25519MLKEM768");
    assert_eq!(evt.latency_ms, 42);

    let fallback = m.classical_event("b.com", "X25519", "server too old");
    assert_eq!(fallback.domain, "b.com");
    assert_eq!(fallback.reason, "server too old");
}

// ── Certificate tests ─────────────────────────────────────────────────────

#[test]
fn ca_generation_and_leaf_issuance() {
    let ca = CertificateAuthority::load_or_generate(
        &std::env::temp_dir().join("zipbrowser-test-ca"),
    )
    .expect("CA generation failed");

    // CA cert should be non-empty PEM.
    assert!(ca.ca_cert_pem().starts_with("-----BEGIN CERTIFICATE-----"));
    assert!(!ca.ca_cert_der().is_empty());

    // Issue a leaf cert.
    let leaf = ca.issue_leaf_cert("test.example.com").unwrap();
    assert!(!leaf.cert_der.is_empty());
    assert!(!leaf.key_der.is_empty());

    // Should be cached.
    assert_eq!(ca.cached_leaf_count(), 1);

    // Issue for a different domain.
    let _ = ca.issue_leaf_cert("other.example.com").unwrap();
    assert_eq!(ca.cached_leaf_count(), 2);

    // Re-request should use cache.
    let _ = ca.issue_leaf_cert("test.example.com").unwrap();
    assert_eq!(ca.cached_leaf_count(), 2);
}

#[test]
fn ca_persistence() {
    let dir = tempfile::TempDir::new().unwrap();

    let ca1 = CertificateAuthority::load_or_generate(dir.path()).unwrap();
    let pem1 = ca1.ca_cert_pem().to_string();

    // Re-load should return the same CA.
    let ca2 = CertificateAuthority::load_or_generate(dir.path()).unwrap();
    assert_eq!(ca2.ca_cert_pem(), pem1);
}

#[test]
fn server_config_for_domain_builds() {
    let ca = CertificateAuthority::load_or_generate(
        &std::env::temp_dir().join("zipbrowser-test-ca-2"),
    )
    .unwrap();

    let config = ca.server_config_for_domain("www.example.com");
    assert!(config.is_ok(), "server config should build: {:?}", config.err());
}

// ── TLS configuration tests ──────────────────────────────────────────────

#[test]
fn tls_provider_loads() {
    // This verifies that the rustls-post-quantum provider
    // can be instantiated without panicking.
    let result = zipbrowser::proxy::verify_tls_provider();
    assert!(result.is_ok(), "TLS provider should load: {:?}", result.err());
}

#[test]
fn tls_info_populated() {
    let info = zipbrowser::proxy::tls_diagnostics();
    assert_eq!(info.min_tls_version, "TLS 1.3");
    assert!(info.preferred_kx.contains("MLKEM"));
    assert!(info.fallback_kx.contains("X25519"));
    assert!(!info.cipher_suites.is_empty());
}

// ── Proxy server lifecycle tests ──────────────────────────────────────────

#[tokio::test]
async fn proxy_starts_and_listens() {
    let dir = tempfile::TempDir::new().unwrap();
    let config = ProxyConfig::default().with_port(0); // ephemeral port

    let handle = zipbrowser::proxy::start(config, dir.path())
        .await
        .expect("proxy should start");

    assert_ne!(handle.port, 0, "should have bound to a real port");
    assert_eq!(handle.addr.ip().to_string(), "127.0.0.1");

    // Verify we can connect to the proxy.
    let connect_result =
        tokio::net::TcpStream::connect(handle.addr).await;
    assert!(connect_result.is_ok(), "should connect to proxy");

    // Shutdown.
    handle.shutdown();
}

#[tokio::test]
async fn proxy_rejects_plain_http() {
    let dir = tempfile::TempDir::new().unwrap();
    let config = ProxyConfig::default().with_port(0);

    let handle = zipbrowser::proxy::start(config, dir.path())
        .await
        .expect("proxy should start");

    // Send a plain GET request (not CONNECT).
    let client = reqwest::Client::builder()
        .no_proxy()
        .build()
        .unwrap();

    let resp = client
        .get(format!("http://127.0.0.1:{}/test", handle.port))
        .timeout(Duration::from_secs(5))
        .send()
        .await;

    match resp {
        Ok(r) => {
            // Should get 403 Forbidden (plain HTTP blocked).
            assert_eq!(r.status().as_u16(), 403);
        }
        Err(e) => {
            // Connection reset is also acceptable — the proxy may
            // close the connection before sending a response.
            tracing::info!(error = %e, "connection error (acceptable)");
        }
    }

    handle.shutdown();
}
