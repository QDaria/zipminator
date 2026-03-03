//! ZipBrowser — PQC-aware browser shell.
//!
//! This is the Tauri backend for ZipBrowser. It starts the PQC HTTPS proxy
//! on launch and exposes Tauri commands for the frontend to query proxy
//! status and metrics.

pub mod ai;
pub mod privacy;
pub mod proxy;
pub mod vpn;

use std::sync::Mutex;

use proxy::config::ProxyConfig;
use proxy::metrics::ProxyMetrics;
use proxy::pqc_detector::PqcStatus;
use proxy::tls::TlsInfo;
use proxy::ProxyHandle;

/// Global proxy handle, initialized at startup.
static PROXY_HANDLE: once_cell::sync::OnceCell<Mutex<Option<ProxyHandle>>> =
    once_cell::sync::OnceCell::new();

/// Global VPN manager, initialized at startup.
///
/// Stored as a `once_cell` global so it can be shared between the Tauri setup
/// hook (which auto-connects) and the Tauri commands (which expose
/// `vpn_connect` / `vpn_disconnect` to the frontend).
pub static VPN_MANAGER: once_cell::sync::OnceCell<vpn::SharedVpnManager> =
    once_cell::sync::OnceCell::new();

/// Initialize the VPN manager and return a reference to it.
///
/// This must be called once during Tauri setup.  Subsequent calls are no-ops
/// and return the existing manager.
pub fn init_vpn_manager() -> &'static vpn::SharedVpnManager {
    VPN_MANAGER.get_or_init(vpn::new_shared_manager)
}

/// Start the VPN and connect using the provided config.
///
/// The `emit_fn` callback forwards Tauri events (`vpn-state-changed`,
/// `vpn-metrics-updated`) to all webview windows.
pub async fn start_vpn(
    config: vpn::config::VpnConfig,
    emit_fn: std::sync::Arc<dyn Fn(&str, serde_json::Value) + Send + Sync>,
) -> Result<(), String> {
    let manager = init_vpn_manager();
    let mut guard = manager.lock().await;
    guard
        .connect(config, emit_fn)
        .await
        .map_err(|e| format!("VPN connect failed: {e}"))
}

/// Initialize and start the PQC proxy during Tauri setup.
///
/// Call this from the Tauri `setup` hook:
/// ```no_run
/// # fn main() {}
/// // In your Tauri builder:
/// // .setup(|app| { zipbrowser::setup_proxy(app)?; Ok(()) })
/// ```
pub async fn start_proxy(
    app_data_dir: std::path::PathBuf,
) -> Result<(String, u16), String> {
    let ca_dir = app_data_dir.join("pqc-ca");
    let config = ProxyConfig::default();

    let handle = proxy::start(config, &ca_dir)
        .await
        .map_err(|e| format!("proxy start failed: {e}"))?;

    let host = "127.0.0.1".to_string();
    let port = handle.port;

    PROXY_HANDLE
        .get_or_init(|| Mutex::new(Some(handle)));

    tracing::info!(port, "PQC proxy started");
    Ok((host, port))
}

/// Shut down the proxy (called on app exit).
pub fn stop_proxy() {
    if let Some(lock) = PROXY_HANDLE.get() {
        if let Ok(mut guard) = lock.lock() {
            if let Some(handle) = guard.take() {
                handle.shutdown();
            }
        }
    }
}

// -- Tauri commands --

/// Get current proxy metrics.
pub fn get_proxy_metrics() -> Option<ProxyMetrics> {
    let lock = PROXY_HANDLE.get()?;
    let guard = lock.lock().ok()?;
    let handle = guard.as_ref()?;
    Some(handle.metrics.snapshot())
}

/// Get the PQC status for a specific domain.
pub fn get_domain_pqc_status(domain: &str) -> Option<PqcStatus> {
    let lock = PROXY_HANDLE.get()?;
    let guard = lock.lock().ok()?;
    let handle = guard.as_ref()?;
    handle.detector.lookup(domain)
}

/// Get TLS diagnostic information.
pub fn get_tls_info() -> TlsInfo {
    proxy::tls_diagnostics()
}

/// Get the CA certificate PEM (for trust store installation).
pub fn get_ca_cert_pem() -> Option<String> {
    let lock = PROXY_HANDLE.get()?;
    let guard = lock.lock().ok()?;
    let handle = guard.as_ref()?;
    Some(handle.ca_cert_pem().to_string())
}

/// Verify the TLS provider is working.
pub fn verify_tls() -> Result<(), String> {
    proxy::verify_tls_provider()
}
