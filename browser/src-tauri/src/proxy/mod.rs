//! PQC HTTPS Proxy module for ZipBrowser.
//!
//! Provides a local forward proxy that intercepts HTTPS traffic and
//! negotiates post-quantum (ML-KEM-768 / X25519MLKEM768) TLS with
//! servers that support it, falling back to classical TLS otherwise.
//!
//! # Architecture
//!
//! ```text
//!   Webview
//!     |
//!     | HTTP CONNECT
//!     v
//!   ProxyServer (127.0.0.1:18443)
//!     |
//!     |-- client-side TLS (leaf cert from local CA)
//!     |-- upstream TLS (PQC-preferred via rustls-post-quantum)
//!     |
//!     v
//!   Remote Server
//! ```
//!
//! # Modules
//!
//! - [`config`] — Port selection, bypass lists, PAC script, PQC mode.
//! - [`server`] — HTTP CONNECT proxy server (hyper + tokio).
//! - [`tls`] — PQC TLS negotiation (rustls + rustls-post-quantum).
//! - [`certificate`] — Local CA generation, per-site leaf certs.
//! - [`pqc_detector`] — Key exchange classification and caching.
//! - [`metrics`] — Connection counters, latency tracking, Tauri events.

pub mod certificate;
pub mod config;
pub mod metrics;
pub mod pqc_detector;
pub mod server;
pub mod tls;

// Re-export the VPN tunnel registration API so it is accessible as
// `zipbrowser::proxy::server::set_vpn_tunnel_ip` from integration tests
// and from `VpnManager` when it calls back into the proxy on connect/disconnect.
pub use server::{clear_vpn_tunnel_ip, set_vpn_tunnel_ip};

use std::net::SocketAddr;
use std::path::Path;

use tokio::sync::broadcast;

use self::certificate::CertificateAuthority;
use self::config::ProxyConfig;
use self::metrics::MetricsCollector;
use self::pqc_detector::PqcDetector;

/// Handle for a running proxy instance.
///
/// Drop the handle or call [`ProxyHandle::shutdown`] to stop the server.
pub struct ProxyHandle {
    /// The address the proxy is listening on.
    pub addr: SocketAddr,
    /// The proxy port (convenience accessor).
    pub port: u16,
    /// Metrics collector — query for connection stats.
    pub metrics: MetricsCollector,
    /// PQC detector — query per-domain PQC status cache.
    pub detector: PqcDetector,
    /// CA authority — export CA cert for trust store.
    pub ca: CertificateAuthority,
    /// Send a message here to stop the server.
    shutdown_tx: broadcast::Sender<()>,
}

impl ProxyHandle {
    /// Stop the proxy server gracefully.
    pub fn shutdown(&self) {
        let _ = self.shutdown_tx.send(());
        tracing::info!("proxy shutdown signal sent");
    }

    /// Get the PAC script URL for configuring the webview.
    pub fn pac_url(&self) -> String {
        // In a real deployment this would serve the PAC file over HTTP.
        // For now, return the proxy address for direct configuration.
        format!("http://127.0.0.1:{}/proxy.pac", self.port)
    }

    /// Get the CA certificate PEM for trust store installation.
    pub fn ca_cert_pem(&self) -> &str {
        self.ca.ca_cert_pem()
    }
}

impl Drop for ProxyHandle {
    fn drop(&mut self) {
        self.shutdown();
    }
}

/// Start the PQC HTTPS proxy with the given configuration.
///
/// `ca_dir` is the directory where the CA certificate and key are stored
/// (typically the Tauri app data directory).
///
/// Returns a [`ProxyHandle`] that can be used to query metrics, get the
/// listening port, or shut down the server.
///
/// # Example
///
/// ```ignore
/// # use zipbrowser::proxy;
/// # #[tokio::main]
/// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
/// let config = proxy::config::ProxyConfig::default();
/// let handle = proxy::start(config, "/tmp/zipbrowser-ca").await?;
/// println!("Proxy listening on {}", handle.addr);
///
/// // ... browser runs ...
///
/// handle.shutdown();
/// # Ok(())
/// # }
/// ```
pub async fn start(
    config: ProxyConfig,
    ca_dir: impl AsRef<Path>,
) -> Result<ProxyHandle, Box<dyn std::error::Error + Send + Sync>> {
    // Load or generate the CA.
    let ca = CertificateAuthority::load_or_generate(ca_dir.as_ref())?;

    tracing::info!(
        ca_cert_path = %CertificateAuthority::ca_cert_path(ca_dir.as_ref()).display(),
        "CA certificate ready"
    );

    // Create the shutdown channel.
    let (shutdown_tx, _) = broadcast::channel(1);

    // Start the server.
    let addr = server::start(config.clone(), ca.clone(), shutdown_tx.clone()).await?;

    let metrics = MetricsCollector::new();
    let detector = PqcDetector::new();

    Ok(ProxyHandle {
        addr,
        port: addr.port(),
        metrics,
        detector,
        ca,
        shutdown_tx,
    })
}

/// Quick health check: verify the TLS provider loads correctly.
pub fn verify_tls_provider() -> Result<(), String> {
    tls::build_pqc_client_config()
        .map(|_| ())
        .map_err(|e| format!("TLS provider check failed: {e}"))
}

/// Get diagnostic information about the proxy's TLS configuration.
pub fn tls_diagnostics() -> tls::TlsInfo {
    tls::tls_info()
}
