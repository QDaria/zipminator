//! PQC TLS negotiation.
//!
//! Configures `rustls` with the post-quantum crypto provider so that outbound
//! connections prefer the hybrid X25519MLKEM768 key exchange. Falls back to
//! classical X25519 when the server does not support PQC.
//!
//! The proxy terminates TLS on the client side (using a leaf cert from our CA)
//! and re-establishes TLS to the upstream server with PQC preference.

use std::sync::Arc;
use std::time::Instant;

use rustls::ClientConfig;
use rustls_pki_types::ServerName;
use thiserror::Error;
use tokio::net::TcpStream;
use tokio_rustls::TlsConnector;

use super::pqc_detector::{PqcDetector, PqcStatus};

#[derive(Debug, Error)]
pub enum TlsError {
    #[error("TLS handshake failed: {0}")]
    Handshake(String),
    #[error("invalid server name: {0}")]
    InvalidServerName(String),
    #[error("PQC required but server only supports classical TLS")]
    PqcRequired,
    #[error("certificate error: {0}")]
    Certificate(#[from] super::certificate::CertError),
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
}

/// Outcome of an upstream TLS connection attempt.
pub struct TlsConnection {
    /// The established TLS stream.
    pub stream: tokio_rustls::client::TlsStream<TcpStream>,
    /// PQC status of the negotiated key exchange.
    pub pqc_status: PqcStatus,
    /// How long the handshake took.
    pub handshake_duration: std::time::Duration,
    /// The negotiated key exchange algorithm name.
    pub kx_algorithm: String,
}

/// Builds the `rustls` client configuration with PQC preference.
///
/// Uses `rustls_post_quantum::provider()` which is built on aws-lc-rs and
/// provides X25519MLKEM768 (hybrid PQC + classical) as the preferred key
/// exchange, with X25519 as fallback.
pub fn build_pqc_client_config() -> Result<Arc<ClientConfig>, TlsError> {
    // The rustls-post-quantum crate provides a CryptoProvider that adds
    // X25519MLKEM768 as the preferred key exchange, falling back to
    // X25519 and other classical groups.
    let provider = rustls_post_quantum::provider();

    let mut root_store = rustls::RootCertStore::empty();
    root_store.extend(webpki_roots::TLS_SERVER_ROOTS.iter().cloned());

    let config = ClientConfig::builder_with_provider(Arc::new(provider))
        .with_safe_default_protocol_versions()
        .map_err(|e| TlsError::Handshake(e.to_string()))?
        .with_root_certificates(root_store)
        .with_no_client_auth();

    Ok(Arc::new(config))
}

/// Build a classical-only client configuration (no PQC).
///
/// Used as a fallback when PQC negotiation fails or when connecting to
/// servers known not to support PQC.
pub fn build_classical_client_config() -> Result<Arc<ClientConfig>, TlsError> {
    let mut root_store = rustls::RootCertStore::empty();
    root_store.extend(webpki_roots::TLS_SERVER_ROOTS.iter().cloned());

    let config = ClientConfig::builder()
        .with_root_certificates(root_store)
        .with_no_client_auth();

    Ok(Arc::new(config))
}

/// Connect to an upstream server with PQC-preferred TLS.
///
/// Steps:
/// 1. Attempt connection with PQC (X25519MLKEM768) preference.
/// 2. If the handshake fails, retry with classical TLS.
/// 3. Inspect the negotiated key exchange to determine PQC status.
///
/// If `require_pqc` is true, step 2 is skipped and the connection fails
/// if PQC cannot be negotiated.
pub async fn connect_upstream(
    tcp_stream: TcpStream,
    domain: &str,
    require_pqc: bool,
    detector: &PqcDetector,
) -> Result<TlsConnection, TlsError> {
    let server_name = ServerName::try_from(domain.to_string())
        .map_err(|_| TlsError::InvalidServerName(domain.to_string()))?;

    // Try PQC-preferred config first.
    let pqc_config = build_pqc_client_config()?;
    let connector = TlsConnector::from(pqc_config);

    let start = Instant::now();
    match connector.connect(server_name.clone(), tcp_stream).await {
        Ok(tls_stream) => {
            let handshake_duration = start.elapsed();
            let (_, client_conn) = tls_stream.get_ref();

            // Extract the negotiated key exchange group.
            let kx_algorithm = client_conn
                .negotiated_key_exchange_group()
                .map(|g| format!("{:?}", g.name()))
                .unwrap_or_else(|| "unknown".to_string());

            let pqc_status = PqcDetector::classify_key_exchange(&kx_algorithm);
            detector.record(domain, pqc_status.clone());

            // If PQC is required but we got classical, fail.
            if require_pqc && !pqc_status.is_pqc() {
                return Err(TlsError::PqcRequired);
            }

            tracing::info!(
                domain,
                kx = %kx_algorithm,
                pqc = pqc_status.is_pqc(),
                latency_ms = handshake_duration.as_millis() as u64,
                "upstream TLS connected"
            );

            Ok(TlsConnection {
                stream: tls_stream,
                pqc_status,
                handshake_duration,
                kx_algorithm,
            })
        }
        Err(e) => {
            let handshake_duration = start.elapsed();
            tracing::warn!(
                domain,
                error = %e,
                latency_ms = handshake_duration.as_millis() as u64,
                "PQC TLS handshake failed"
            );

            if require_pqc {
                return Err(TlsError::PqcRequired);
            }

            // Fall back to classical TLS on a new TCP connection.
            tracing::info!(domain, "retrying with classical TLS");
            connect_classical(domain, detector).await
        }
    }
}

/// Connect to an upstream server with classical TLS only.
async fn connect_classical(
    domain: &str,
    detector: &PqcDetector,
) -> Result<TlsConnection, TlsError> {
    let server_name = ServerName::try_from(domain.to_string())
        .map_err(|_| TlsError::InvalidServerName(domain.to_string()))?;

    // Open a new TCP connection for the retry.
    let addr = format!("{domain}:443");
    let tcp_stream = TcpStream::connect(&addr).await.map_err(TlsError::Io)?;

    let config = build_classical_client_config()?;
    let connector = TlsConnector::from(config);

    let start = Instant::now();
    let tls_stream = connector
        .connect(server_name, tcp_stream)
        .await
        .map_err(|e| TlsError::Handshake(e.to_string()))?;

    let handshake_duration = start.elapsed();
    let (_, client_conn) = tls_stream.get_ref();

    let kx_algorithm = client_conn
        .negotiated_key_exchange_group()
        .map(|g| format!("{:?}", g.name()))
        .unwrap_or_else(|| "unknown".to_string());

    let pqc_status = PqcDetector::classify_key_exchange(&kx_algorithm);
    detector.record(domain, pqc_status.clone());

    tracing::info!(
        domain,
        kx = %kx_algorithm,
        "classical TLS fallback connected"
    );

    Ok(TlsConnection {
        stream: tls_stream,
        pqc_status,
        handshake_duration,
        kx_algorithm,
    })
}

/// Information about the TLS configuration for diagnostics.
#[derive(Debug, Clone, serde::Serialize)]
pub struct TlsInfo {
    pub pqc_provider: &'static str,
    pub preferred_kx: &'static str,
    pub fallback_kx: &'static str,
    pub min_tls_version: &'static str,
    pub cipher_suites: Vec<&'static str>,
}

/// Return diagnostic information about the TLS configuration.
pub fn tls_info() -> TlsInfo {
    TlsInfo {
        pqc_provider: "rustls-post-quantum (aws-lc-rs)",
        preferred_kx: "X25519MLKEM768 (hybrid PQC + classical)",
        fallback_kx: "X25519 (classical ECDH)",
        min_tls_version: "TLS 1.3",
        cipher_suites: vec![
            "TLS_AES_256_GCM_SHA384",
            "TLS_AES_128_GCM_SHA256",
            "TLS_CHACHA20_POLY1305_SHA256",
        ],
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pqc_client_config_builds() {
        let config = build_pqc_client_config();
        assert!(config.is_ok(), "PQC client config should build: {:?}", config.err());
    }

    #[test]
    fn classical_client_config_builds() {
        let _ = rustls::crypto::aws_lc_rs::default_provider().install_default();
        let config = build_classical_client_config();
        assert!(config.is_ok());
    }

    #[test]
    fn tls_info_populated() {
        let info = tls_info();
        assert_eq!(info.min_tls_version, "TLS 1.3");
        assert!(info.preferred_kx.contains("MLKEM"));
    }
}
