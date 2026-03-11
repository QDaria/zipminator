use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use uuid::Uuid;

/// Security level of the current connection.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SecurityLevel {
    /// Post-quantum TLS via the PQC proxy.
    Pqc,
    /// Standard classical TLS.
    Classical,
    /// No TLS (plain HTTP).
    None,
}

/// Proxy configuration for routing webview traffic through the PQC TLS proxy.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyConfig {
    pub host: String,
    pub port: u16,
    pub enabled: bool,
}

impl Default for ProxyConfig {
    fn default() -> Self {
        Self {
            host: "127.0.0.1".to_string(),
            port: 8443,
            enabled: false,
        }
    }
}

/// VPN connection status (mirrored in AppState for synchronous read by the status bar).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[derive(Default)]
pub struct VpnState {
    pub connected: bool,
    pub server_location: Option<String>,
    pub protocol: Option<String>,
    pub uptime_secs: u64,
    /// When `true`, the VPN is configured to auto-connect on browser launch.
    #[serde(default)]
    pub always_on: bool,
}


/// QRNG entropy pool status.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
#[derive(Default)]
pub enum EntropyStatus {
    Available,
    Harvesting,
    Depleted,
    #[default]
    Unknown,
}


/// Bookmark entry.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bookmark {
    pub id: String,
    pub url: String,
    pub title: String,
    pub created_at: String,
}

/// Full application state shared across Tauri commands.
#[derive(Debug)]
pub struct AppState {
    pub tabs: Mutex<super::tabs::TabManager>,
    pub proxy_config: Mutex<ProxyConfig>,
    pub vpn_state: Mutex<VpnState>,
    pub entropy_status: Mutex<EntropyStatus>,
    pub bookmarks: Mutex<Vec<Bookmark>>,
    pub session_token: Mutex<String>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            tabs: Mutex::new(super::tabs::TabManager::new()),
            proxy_config: Mutex::new(ProxyConfig::default()),
            vpn_state: Mutex::new(VpnState::default()),
            entropy_status: Mutex::new(EntropyStatus::default()),
            bookmarks: Mutex::new(Vec::new()),
            session_token: Mutex::new(Uuid::new_v4().to_string()),
        }
    }

    /// Generate a new session token. The privacy engine can override this
    /// to provide QRNG-seeded tokens.
    pub fn regenerate_session_token(&self) -> String {
        let new_token = Uuid::new_v4().to_string();
        if let Ok(mut token) = self.session_token.lock() {
            *token = new_token.clone();
        }
        new_token
    }

    /// Persist bookmarks to the app data directory.
    pub fn save_bookmarks(&self, app_data_dir: &std::path::Path) -> Result<(), String> {
        let bookmarks = self
            .bookmarks
            .lock()
            .map_err(|e| format!("Failed to lock bookmarks: {}", e))?;
        let path = app_data_dir.join("bookmarks.json");
        let data =
            serde_json::to_string_pretty(&*bookmarks).map_err(|e| format!("Serialize: {}", e))?;
        std::fs::write(&path, data).map_err(|e| format!("Write: {}", e))?;
        Ok(())
    }

    /// Load bookmarks from the app data directory.
    pub fn load_bookmarks(&self, app_data_dir: &std::path::Path) -> Result<(), String> {
        let path = app_data_dir.join("bookmarks.json");
        if !path.exists() {
            return Ok(());
        }
        let data = std::fs::read_to_string(&path).map_err(|e| format!("Read: {}", e))?;
        let loaded: Vec<Bookmark> =
            serde_json::from_str(&data).map_err(|e| format!("Deserialize: {}", e))?;
        let mut bookmarks = self
            .bookmarks
            .lock()
            .map_err(|e| format!("Lock: {}", e))?;
        *bookmarks = loaded;
        Ok(())
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
