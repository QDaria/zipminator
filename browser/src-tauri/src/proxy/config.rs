//! Proxy configuration.
//!
//! Manages port selection, bypass lists, PAC script generation,
//! and PQC enforcement policy.

use std::collections::HashSet;
use std::net::{SocketAddr, TcpListener};

use serde::{Deserialize, Serialize};

/// Default proxy listen port.
pub const DEFAULT_PORT: u16 = 18443;

/// Maximum concurrent connections the proxy will serve.
pub const MAX_CONCURRENT_CONNECTIONS: usize = 256;

/// Connection timeout in seconds.
pub const CONNECTION_TIMEOUT_SECS: u64 = 30;

/// Proxy operating mode.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[derive(Default)]
pub enum ProxyMode {
    /// Allow both PQC and classical TLS (prefer PQC).
    #[default]
    Hybrid,
    /// Refuse connections that cannot negotiate PQC key exchange.
    PqcOnly,
}


/// Full proxy configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyConfig {
    /// Address the proxy listens on (always 127.0.0.1).
    pub host: String,
    /// TCP port. If the default is unavailable, an ephemeral port is chosen.
    pub port: u16,
    /// Domains that bypass the proxy entirely.
    pub bypass_list: HashSet<String>,
    /// PQC enforcement mode.
    pub mode: ProxyMode,
    /// Maximum concurrent connections.
    pub max_connections: usize,
    /// Connection timeout in seconds.
    pub timeout_secs: u64,
}

impl Default for ProxyConfig {
    fn default() -> Self {
        let mut bypass = HashSet::new();
        bypass.insert("localhost".to_string());
        bypass.insert("127.0.0.1".to_string());
        bypass.insert("::1".to_string());

        Self {
            host: "127.0.0.1".to_string(),
            port: DEFAULT_PORT,
            bypass_list: bypass,
            mode: ProxyMode::default(),
            max_connections: MAX_CONCURRENT_CONNECTIONS,
            timeout_secs: CONNECTION_TIMEOUT_SECS,
        }
    }
}

impl ProxyConfig {
    /// Build a new configuration with the given port.
    pub fn with_port(mut self, port: u16) -> Self {
        self.port = port;
        self
    }

    /// Add a domain to the bypass list.
    pub fn bypass(mut self, domain: impl Into<String>) -> Self {
        self.bypass_list.insert(domain.into());
        self
    }

    /// Set the proxy mode.
    pub fn with_mode(mut self, mode: ProxyMode) -> Self {
        self.mode = mode;
        self
    }

    /// Check whether a host should bypass the proxy.
    pub fn should_bypass(&self, host: &str) -> bool {
        self.bypass_list.contains(host)
    }

    /// Resolve the listen address, picking an available port if necessary.
    pub fn resolve_listen_addr(&mut self) -> SocketAddr {
        let addr: SocketAddr = format!("{}:{}", self.host, self.port)
            .parse()
            .expect("invalid listen address");

        // Check if the port is available.
        if TcpListener::bind(addr).is_ok() {
            return addr;
        }

        // Fall back to an ephemeral port.
        tracing::warn!(
            port = self.port,
            "default port unavailable, selecting ephemeral port"
        );
        let fallback = portpicker::pick_unused_port().expect("no free ports available");
        self.port = fallback;

        format!("{}:{}", self.host, self.port)
            .parse()
            .expect("invalid listen address")
    }

    /// Generate a PAC (Proxy Auto-Config) script for the webview.
    ///
    /// The PAC script routes all HTTPS traffic through our proxy and
    /// lets bypass-listed hosts connect directly.
    pub fn generate_pac_script(&self) -> String {
        let bypass_conditions: Vec<String> = self
            .bypass_list
            .iter()
            .map(|d| format!("    if (dnsDomainIs(host, \"{d}\")) return \"DIRECT\";"))
            .collect();
        let bypass_block = bypass_conditions.join("\n");

        format!(
            r#"function FindProxyForURL(url, host) {{
{bypass_block}
    if (url.substring(0, 5) == "http:") return "DIRECT";
    return "PROXY {host}:{port}";
}}"#,
            bypass_block = bypass_block,
            host = self.host,
            port = self.port,
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_config_has_localhost_bypass() {
        let cfg = ProxyConfig::default();
        assert!(cfg.should_bypass("localhost"));
        assert!(cfg.should_bypass("127.0.0.1"));
    }

    #[test]
    fn bypass_builder() {
        let cfg = ProxyConfig::default().bypass("example.com");
        assert!(cfg.should_bypass("example.com"));
        assert!(!cfg.should_bypass("other.com"));
    }

    #[test]
    fn pac_script_contains_proxy() {
        let cfg = ProxyConfig::default();
        let pac = cfg.generate_pac_script();
        assert!(pac.contains("PROXY 127.0.0.1:18443"));
        assert!(pac.contains("localhost"));
    }

    #[test]
    fn pqc_only_mode() {
        let cfg = ProxyConfig::default().with_mode(ProxyMode::PqcOnly);
        assert_eq!(cfg.mode, ProxyMode::PqcOnly);
    }
}
