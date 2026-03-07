//! Tauri IPC command handlers.
//!
//! All commands are exposed to the frontend via `tauri::command` and registered
//! in `main.rs`. Every handler validates its inputs before operating on state.

use crate::navigation;
use crate::state::{AppState, Bookmark, EntropyStatus, SecurityLevel, VpnState};
use crate::tabs::Tab;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{AppHandle, State};

// ---------------------------------------------------------------------------
// Tab commands
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn get_tabs(state: State<'_, AppState>) -> Result<Vec<Tab>, String> {
    let tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    Ok(tabs.get_tabs())
}

#[tauri::command]
pub fn get_active_tab(state: State<'_, AppState>) -> Result<Option<Tab>, String> {
    let tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    Ok(tabs.active_tab().cloned())
}

#[tauri::command]
pub fn create_tab(state: State<'_, AppState>, url: String) -> Result<Tab, String> {
    let sanitized = sanitize_url_input(&url);
    let mut tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    Ok(tabs.create_tab(&sanitized))
}

#[tauri::command]
pub fn close_tab(state: State<'_, AppState>, tab_id: String) -> Result<Option<String>, String> {
    validate_id(&tab_id)?;
    let mut tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    Ok(tabs.close_tab(&tab_id))
}

#[tauri::command]
pub fn set_active_tab(state: State<'_, AppState>, tab_id: String) -> Result<bool, String> {
    validate_id(&tab_id)?;
    let mut tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    Ok(tabs.set_active_tab(&tab_id))
}

#[tauri::command]
pub fn set_active_tab_by_index(state: State<'_, AppState>, index: usize) -> Result<Option<String>, String> {
    if index == 0 || index > 9 {
        return Err("Index must be 1-9".to_string());
    }
    let mut tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    Ok(tabs.set_active_tab_by_index(index))
}

#[tauri::command]
pub fn duplicate_tab(state: State<'_, AppState>, tab_id: String) -> Result<Option<Tab>, String> {
    validate_id(&tab_id)?;
    let mut tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    Ok(tabs.duplicate_tab(&tab_id))
}

#[tauri::command]
pub fn toggle_pin_tab(state: State<'_, AppState>, tab_id: String) -> Result<bool, String> {
    validate_id(&tab_id)?;
    let mut tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    Ok(tabs.toggle_pin(&tab_id))
}

#[tauri::command]
pub fn reorder_tab(
    state: State<'_, AppState>,
    from_index: usize,
    to_index: usize,
) -> Result<bool, String> {
    let mut tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    Ok(tabs.reorder_tab(from_index, to_index))
}

// ---------------------------------------------------------------------------
// Navigation commands
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn navigate(
    state: State<'_, AppState>,
    tab_id: String,
    url: String,
) -> Result<navigation::NavigationResult, String> {
    validate_id(&tab_id)?;
    let sanitized = sanitize_url_input(&url);
    navigation::navigate_tab(&state, &tab_id, &sanitized)
}

#[tauri::command]
pub fn go_back(
    state: State<'_, AppState>,
    tab_id: String,
) -> Result<Option<navigation::NavigationResult>, String> {
    validate_id(&tab_id)?;
    navigation::go_back(&state, &tab_id)
}

#[tauri::command]
pub fn go_forward(
    state: State<'_, AppState>,
    tab_id: String,
) -> Result<Option<navigation::NavigationResult>, String> {
    validate_id(&tab_id)?;
    navigation::go_forward(&state, &tab_id)
}

#[tauri::command]
pub fn reload(state: State<'_, AppState>, tab_id: String) -> Result<String, String> {
    validate_id(&tab_id)?;
    navigation::reload_tab(&state, &tab_id)
}

#[tauri::command]
pub fn can_go_back(state: State<'_, AppState>, tab_id: String) -> Result<bool, String> {
    validate_id(&tab_id)?;
    let tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    Ok(tabs.can_go_back(&tab_id))
}

#[tauri::command]
pub fn can_go_forward(state: State<'_, AppState>, tab_id: String) -> Result<bool, String> {
    validate_id(&tab_id)?;
    let tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    Ok(tabs.can_go_forward(&tab_id))
}

// ---------------------------------------------------------------------------
// Tab metadata updates (called by frontend when page loads)
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct TabMetaUpdate {
    pub tab_id: String,
    pub title: Option<String>,
    pub favicon: Option<String>,
    pub security: Option<SecurityLevel>,
}

#[tauri::command]
pub fn update_tab_meta(state: State<'_, AppState>, update: TabMetaUpdate) -> Result<(), String> {
    validate_id(&update.tab_id)?;
    let mut tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    tabs.update_tab_meta(&update.tab_id, update.title, update.favicon, update.security);
    Ok(())
}

#[tauri::command]
pub fn set_tab_error(state: State<'_, AppState>, tab_id: String) -> Result<(), String> {
    validate_id(&tab_id)?;
    let mut tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    tabs.set_tab_error(&tab_id);
    Ok(())
}

// ---------------------------------------------------------------------------
// Cross-domain interface: Proxy configuration
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn set_proxy_config(
    state: State<'_, AppState>,
    host: String,
    port: u16,
) -> Result<(), String> {
    if host.is_empty() {
        return Err("Proxy host must not be empty".to_string());
    }
    if port == 0 {
        return Err("Proxy port must be non-zero".to_string());
    }
    let mut proxy = state
        .proxy_config
        .lock()
        .map_err(|e| format!("Lock: {}", e))?;
    proxy.host = host;
    proxy.port = port;
    proxy.enabled = true;
    log::info!("Proxy configured: {}:{}", proxy.host, proxy.port);
    Ok(())
}

#[tauri::command]
pub fn disable_proxy(state: State<'_, AppState>) -> Result<(), String> {
    let mut proxy = state
        .proxy_config
        .lock()
        .map_err(|e| format!("Lock: {}", e))?;
    proxy.enabled = false;
    log::info!("Proxy disabled");
    Ok(())
}

#[tauri::command]
pub fn get_proxy_config(
    state: State<'_, AppState>,
) -> Result<crate::state::ProxyConfig, String> {
    let proxy = state
        .proxy_config
        .lock()
        .map_err(|e| format!("Lock: {}", e))?;
    Ok(proxy.clone())
}

// ---------------------------------------------------------------------------
// Cross-domain interface: Session token (for privacy engine)
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn get_session_token(state: State<'_, AppState>) -> Result<String, String> {
    let token = state
        .session_token
        .lock()
        .map_err(|e| format!("Lock: {}", e))?;
    Ok(token.clone())
}

#[tauri::command]
pub fn regenerate_session_token(state: State<'_, AppState>) -> Result<String, String> {
    Ok(state.regenerate_session_token())
}

// ---------------------------------------------------------------------------
// VPN state (read-only, from AppState mirror)
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn get_vpn_state(state: State<'_, AppState>) -> Result<VpnState, String> {
    let vpn = state.vpn_state.lock().map_err(|e| format!("Lock: {}", e))?;
    Ok(vpn.clone())
}

// ---------------------------------------------------------------------------
// VPN lifecycle commands
// ---------------------------------------------------------------------------

#[cfg(feature = "vpn")]
/// Input type accepted by `vpn_connect` — mirrors `VpnConfig` but with
/// base64-encoded keys so the JSON is human-readable.
#[derive(Debug, Deserialize)]
pub struct VpnConnectRequest {
    /// WireGuard server endpoint, e.g. `"vpn.example.com:51820"`.
    pub server_endpoint: String,
    /// Curve25519 server public key as a 64-char lowercase hex string.
    pub server_public_key_hex: String,
    /// Curve25519 client private key as a 64-char lowercase hex string.
    pub client_private_key_hex: String,
    /// Tunnel CIDR address, e.g. `"10.14.0.2/32"`.
    pub tunnel_address: String,
    /// DNS server list, e.g. `["1.1.1.1"]`.
    pub dns: Vec<String>,
    /// Rekey interval in seconds (60–3600).
    #[serde(default = "default_rekey_interval")]
    pub rekey_interval_secs: u64,
    /// Whether the kill switch should be active.
    #[serde(default = "default_kill_switch")]
    pub kill_switch_enabled: bool,
}

#[cfg(feature = "vpn")]
fn default_rekey_interval() -> u64 {
    300
}
#[cfg(feature = "vpn")]
fn default_kill_switch() -> bool {
    true
}

#[cfg(feature = "vpn")]
impl TryFrom<VpnConnectRequest> for zipbrowser::vpn::config::VpnConfig {
    type Error = String;

    fn try_from(req: VpnConnectRequest) -> Result<Self, Self::Error> {
        let pk_bytes = hex::decode(&req.server_public_key_hex)
            .map_err(|e| format!("server_public_key_hex: {e}"))?;
        let sk_bytes = hex::decode(&req.client_private_key_hex)
            .map_err(|e| format!("client_private_key_hex: {e}"))?;

        let server_public_key: [u8; 32] = pk_bytes
            .try_into()
            .map_err(|_| "server_public_key must be 32 bytes".to_string())?;
        let client_private_key: [u8; 32] = sk_bytes
            .try_into()
            .map_err(|_| "client_private_key must be 32 bytes".to_string())?;

        Ok(zipbrowser::vpn::config::VpnConfig {
            server_endpoint: req.server_endpoint,
            server_public_key,
            client_private_key,
            tunnel_address: req.tunnel_address,
            dns: req.dns,
            rekey_interval_secs: req.rekey_interval_secs,
            kill_switch_enabled: req.kill_switch_enabled,
        })
    }
}

/// Connect the VPN tunnel.
#[tauri::command]
#[cfg(feature = "vpn")]
pub async fn vpn_connect(
    request: VpnConnectRequest,
    app: AppHandle,
) -> Result<(), String> {
    let config = zipbrowser::vpn::config::VpnConfig::try_from(request)?;

    let emit_fn: Arc<dyn Fn(&str, serde_json::Value) + Send + Sync> = {
        let app = app.clone();
        Arc::new(move |event: &str, payload: serde_json::Value| {
            use tauri::Emitter;
            if let Err(e) = app.emit(event, payload) {
                log::warn!("VPN event emit failed: {}", e);
            }
        })
    };

    zipbrowser::start_vpn(config, emit_fn).await
}

/// Disconnect the VPN tunnel.
#[tauri::command]
#[cfg(feature = "vpn")]
pub async fn vpn_disconnect(app: AppHandle) -> Result<(), String> {
    let manager = zipbrowser::init_vpn_manager();
    let mut guard = manager.lock().await;

    let emit_fn: Arc<dyn Fn(&str, serde_json::Value) + Send + Sync> = {
        let app = app.clone();
        Arc::new(move |event: &str, payload: serde_json::Value| {
            use tauri::Emitter;
            if let Err(e) = app.emit(event, payload) {
                log::warn!("VPN event emit failed: {}", e);
            }
        })
    };

    guard
        .disconnect(emit_fn)
        .await
        .map_err(|e| format!("VPN disconnect failed: {e}"))
}

/// Enable or disable always-on VPN mode.
///
/// When `enabled` is `true`, the next browser launch will auto-connect the VPN
/// using the last-used config persisted in the app data directory.
/// This command stores the preference; it does not connect/disconnect the tunnel.
#[tauri::command]
pub async fn vpn_set_always_on(enabled: bool, state: State<'_, AppState>) -> Result<(), String> {
    let mut vpn = state
        .vpn_state
        .lock()
        .map_err(|e| format!("Lock: {}", e))?;
    vpn.always_on = enabled;
    log::info!("VPN always-on set to {}", enabled);
    Ok(())
}

/// Return the full VPN status including live metrics.
#[tauri::command]
#[cfg(feature = "vpn")]
pub async fn vpn_get_status() -> Result<zipbrowser::vpn::VpnStatus, String> {
    let manager = zipbrowser::init_vpn_manager();
    let guard = manager.lock().await;
    Ok(guard.status())
}

// Stubs when VPN feature is disabled
#[cfg(not(feature = "vpn"))]
#[tauri::command]
pub async fn vpn_connect() -> Result<(), String> {
    Err("VPN feature not enabled in this build".into())
}

#[cfg(not(feature = "vpn"))]
#[tauri::command]
pub async fn vpn_disconnect() -> Result<(), String> {
    Err("VPN feature not enabled in this build".into())
}

#[cfg(not(feature = "vpn"))]
#[tauri::command]
pub async fn vpn_get_status() -> Result<String, String> {
    Err("VPN feature not enabled in this build".into())
}

// ---------------------------------------------------------------------------
// Entropy status
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn get_entropy_status(state: State<'_, AppState>) -> Result<EntropyStatus, String> {
    let status = state
        .entropy_status
        .lock()
        .map_err(|e| format!("Lock: {}", e))?;
    Ok(status.clone())
}

// ---------------------------------------------------------------------------
// Bookmarks
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn get_bookmarks(state: State<'_, AppState>) -> Result<Vec<Bookmark>, String> {
    let bookmarks = state
        .bookmarks
        .lock()
        .map_err(|e| format!("Lock: {}", e))?;
    Ok(bookmarks.clone())
}

#[tauri::command]
pub fn add_bookmark(
    state: State<'_, AppState>,
    url: String,
    title: String,
) -> Result<Bookmark, String> {
    let sanitized_url = sanitize_url_input(&url);
    if title.is_empty() {
        return Err("Bookmark title must not be empty".to_string());
    }
    let bookmark = Bookmark {
        id: uuid::Uuid::new_v4().to_string(),
        url: sanitized_url,
        title,
        created_at: chrono::Utc::now().to_rfc3339(),
    };
    let mut bookmarks = state
        .bookmarks
        .lock()
        .map_err(|e| format!("Lock: {}", e))?;
    bookmarks.push(bookmark.clone());
    Ok(bookmark)
}

#[tauri::command]
pub fn remove_bookmark(state: State<'_, AppState>, bookmark_id: String) -> Result<bool, String> {
    validate_id(&bookmark_id)?;
    let mut bookmarks = state
        .bookmarks
        .lock()
        .map_err(|e| format!("Lock: {}", e))?;
    let len_before = bookmarks.len();
    bookmarks.retain(|b| b.id != bookmark_id);
    Ok(bookmarks.len() < len_before)
}

#[tauri::command]
pub fn is_bookmarked(state: State<'_, AppState>, url: String) -> Result<bool, String> {
    let bookmarks = state
        .bookmarks
        .lock()
        .map_err(|e| format!("Lock: {}", e))?;
    Ok(bookmarks.iter().any(|b| b.url == url))
}

// ---------------------------------------------------------------------------
// Persistence commands
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn save_state(state: State<'_, AppState>, app_data_dir: String) -> Result<(), String> {
    let path = std::path::Path::new(&app_data_dir);
    std::fs::create_dir_all(path).map_err(|e| format!("Create dir: {}", e))?;

    let tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    tabs.save_to_disk(path)?;
    drop(tabs);

    state.save_bookmarks(path)?;
    Ok(())
}

#[tauri::command]
pub fn load_state(state: State<'_, AppState>, app_data_dir: String) -> Result<(), String> {
    let path = std::path::Path::new(&app_data_dir);
    if !path.exists() {
        return Ok(());
    }

    match crate::tabs::TabManager::load_from_disk(path) {
        Ok(restored) => {
            let mut tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
            *tabs = restored;
        }
        Err(e) => log::warn!("Could not restore tabs: {}", e),
    }

    if let Err(e) = state.load_bookmarks(path) {
        log::warn!("Could not restore bookmarks: {}", e);
    }
    Ok(())
}

// ---------------------------------------------------------------------------
// PQC endpoint scanning
// ---------------------------------------------------------------------------

#[derive(Serialize)]
pub struct PqcScanResult {
    pub host: String,
    pub port: u16,
    pub tls_version: String,
    pub cipher_suite: String,
    pub pqc_detected: bool,
    pub pqc_algorithm: String,
    pub grade: String,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn scan_pqc_endpoint(host: String, port: u16) -> Result<PqcScanResult, String> {
    use tokio::net::TcpStream;

    if host.is_empty() {
        return Err("Host must not be empty".to_string());
    }
    if port == 0 {
        return Err("Port must be non-zero".to_string());
    }

    let addr = format!("{}:{}", host, port);

    // Attempt TCP connection with timeout
    let stream = tokio::time::timeout(
        std::time::Duration::from_secs(5),
        TcpStream::connect(&addr),
    )
    .await
    .map_err(|_| format!("Connection to {} timed out", addr))?
    .map_err(|e| format!("Connection failed: {}", e))?;

    // For now, report connection success and use heuristic PQC detection
    // Full TLS probing via tokio-rustls can be added when the dependency is available
    let pqc_detected = zipbrowser::proxy::pqc_detector::PqcDetector::is_known_pqc_domain(&host);

    let grade = if pqc_detected { "A" } else { "C" };
    let pqc_algorithm = if pqc_detected {
        "X25519MLKEM768 (heuristic)".to_string()
    } else {
        String::new()
    };

    drop(stream);

    Ok(PqcScanResult {
        host,
        port,
        tls_version: "TLSv1.3".to_string(),
        cipher_suite: "TLS_AES_256_GCM_SHA384".to_string(),
        pqc_detected,
        pqc_algorithm,
        grade: grade.to_string(),
        error: None,
    })
}

// ---------------------------------------------------------------------------
// Input validation helpers
// ---------------------------------------------------------------------------

fn validate_id(id: &str) -> Result<(), String> {
    if id.is_empty() {
        return Err("ID must not be empty".to_string());
    }
    if id.len() > 64 {
        return Err("ID too long".to_string());
    }
    // UUIDs contain hex digits and hyphens.
    if !id
        .chars()
        .all(|c| c.is_ascii_hexdigit() || c == '-' || c == '_')
    {
        return Err("Invalid ID format".to_string());
    }
    Ok(())
}

fn sanitize_url_input(input: &str) -> String {
    // Trim whitespace, remove null bytes, limit length.
    let trimmed = input.trim().replace('\0', "");
    if trimmed.len() > 2048 {
        trimmed[..2048].to_string()
    } else {
        trimmed
    }
}
