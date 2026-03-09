//! VPN configuration — loaded from Tauri app data directory.
//!
//! [`VpnConfig`] holds all settings required to establish a PQ-WireGuard
//! tunnel.  The struct validates all fields before a connection attempt so
//! failures surface early with clear diagnostics.

use serde::{Deserialize, Serialize};
use thiserror::Error;

// ── Constants ──────────────────────────────────────────────────────────────

/// Default rekey interval in seconds (5 minutes).
pub const DEFAULT_REKEY_INTERVAL_SECS: u64 = 300;

/// Minimum acceptable rekey interval.
pub const MIN_REKEY_INTERVAL_SECS: u64 = 60;

/// Maximum acceptable rekey interval.
pub const MAX_REKEY_INTERVAL_SECS: u64 = 3600;

/// Conservative MTU for the tunnel interface.
/// 1280 bytes leaves headroom for PQC handshake overhead on top of WireGuard
/// framing (32-byte auth tag + 32-byte header = 64 bytes over 1280-byte IP minimum).
pub const TUNNEL_MTU: u32 = 1280;

// ── Errors ─────────────────────────────────────────────────────────────────

/// Errors produced during configuration validation.
#[derive(Debug, Error)]
pub enum ConfigError {
    #[error("server_endpoint is empty")]
    EmptyServerEndpoint,

    #[error("server_endpoint does not resolve to a valid socket address: {0}")]
    UnresolvableEndpoint(String),

    #[error("server_public_key must be exactly 32 bytes (Curve25519)")]
    InvalidServerPublicKey,

    #[error("client_private_key must be exactly 32 bytes (Curve25519)")]
    InvalidClientPrivateKey,

    #[error("tunnel_address must be a valid CIDR string (e.g. 10.14.0.2/32)")]
    InvalidTunnelAddress,

    #[error("dns list must not be empty")]
    EmptyDnsList,

    #[error(
        "rekey_interval_secs ({0}) is out of range [{min}..{max}]",
        min = MIN_REKEY_INTERVAL_SECS,
        max = MAX_REKEY_INTERVAL_SECS
    )]
    InvalidRekeyInterval(u64),
}

// ── VpnConfig ──────────────────────────────────────────────────────────────

/// Complete configuration for the PQ-WireGuard VPN tunnel.
///
/// Serialised to/from JSON in the Tauri app data directory.
/// All key material uses raw bytes internally; the Tauri commands layer
/// accepts base64-encoded strings and converts before passing here.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VpnConfig {
    /// WireGuard server endpoint in `host:port` format.
    ///
    /// The host may be a hostname or IP address.
    pub server_endpoint: String,

    /// WireGuard server Curve25519 public key (32 bytes).
    #[serde(with = "hex_bytes_32")]
    pub server_public_key: [u8; 32],

    /// WireGuard client Curve25519 private key (32 bytes).
    ///
    /// Never logged; zeroized when the config is dropped via the Tauri
    /// command context lifetime.
    #[serde(with = "hex_bytes_32")]
    pub client_private_key: [u8; 32],

    /// Virtual tunnel interface CIDR address (e.g. `"10.14.0.2/32"`).
    pub tunnel_address: String,

    /// DNS servers to configure inside the tunnel.
    pub dns: Vec<String>,

    /// How often (seconds) to perform a Kyber768 rekey.
    /// Range: [`MIN_REKEY_INTERVAL_SECS`]..[`MAX_REKEY_INTERVAL_SECS`].
    #[serde(default = "default_rekey_interval")]
    pub rekey_interval_secs: u64,

    /// When `true` (the default), block all non-VPN traffic while the tunnel
    /// is active and immediately on unexpected disconnection.
    #[serde(default = "default_kill_switch")]
    pub kill_switch_enabled: bool,
}

fn default_rekey_interval() -> u64 {
    DEFAULT_REKEY_INTERVAL_SECS
}

fn default_kill_switch() -> bool {
    true
}

impl VpnConfig {
    /// Validate the configuration, returning a detailed error on the first
    /// invalid field found.
    ///
    /// DNS resolution of `server_endpoint` is deliberately *not* performed
    /// here (that would be I/O); we only check the format.
    pub fn validate(&self) -> Result<(), ConfigError> {
        if self.server_endpoint.trim().is_empty() {
            return Err(ConfigError::EmptyServerEndpoint);
        }

        // Validate format: must contain a ':' separating host and port.
        // We do NOT perform DNS resolution here (that would require I/O and
        // could block or fail in test environments).
        if !self.server_endpoint.contains(':') {
            return Err(ConfigError::UnresolvableEndpoint(self.server_endpoint.clone()));
        }
        // The port portion must be a valid u16.
        let port_str = self
            .server_endpoint
            .rsplit(':')
            .next()
            .unwrap_or("");
        if port_str.parse::<u16>().is_err() {
            return Err(ConfigError::UnresolvableEndpoint(self.server_endpoint.clone()));
        }

        // Curve25519 keys are always 32 bytes; the serde layer enforces this,
        // but we double-check here for runtime safety.
        if self.server_public_key == [0u8; 32] {
            return Err(ConfigError::InvalidServerPublicKey);
        }
        if self.client_private_key == [0u8; 32] {
            return Err(ConfigError::InvalidClientPrivateKey);
        }

        // CIDR format check: must contain exactly one '/'.
        if !self.tunnel_address.contains('/') {
            return Err(ConfigError::InvalidTunnelAddress);
        }
        let parts: Vec<&str> = self.tunnel_address.splitn(2, '/').collect();
        if parts.len() != 2 || parts[1].is_empty() {
            return Err(ConfigError::InvalidTunnelAddress);
        }

        if self.dns.is_empty() {
            return Err(ConfigError::EmptyDnsList);
        }

        if self.rekey_interval_secs < MIN_REKEY_INTERVAL_SECS
            || self.rekey_interval_secs > MAX_REKEY_INTERVAL_SECS
        {
            return Err(ConfigError::InvalidRekeyInterval(self.rekey_interval_secs));
        }

        Ok(())
    }

    /// Extract the IP portion of `tunnel_address` (everything before the `/`).
    pub fn tunnel_ip(&self) -> &str {
        self.tunnel_address
            .split('/')
            .next()
            .unwrap_or(&self.tunnel_address)
    }

    /// Extract the prefix length from `tunnel_address` (everything after the `/`).
    pub fn tunnel_prefix_len(&self) -> u8 {
        self.tunnel_address
            .split('/')
            .nth(1)
            .and_then(|s| s.parse().ok())
            .unwrap_or(32)
    }

    /// Return a sanitised copy of the config safe for logging — private key
    /// is redacted.
    pub fn redacted_display(&self) -> String {
        format!(
            "VpnConfig {{ server_endpoint: {:?}, tunnel_address: {:?}, \
             dns: {:?}, rekey_interval_secs: {}, kill_switch_enabled: {}, \
             client_private_key: [REDACTED] }}",
            self.server_endpoint,
            self.tunnel_address,
            self.dns,
            self.rekey_interval_secs,
            self.kill_switch_enabled,
        )
    }
}

// ── Serde helpers ──────────────────────────────────────────────────────────

/// Serialise/deserialise a `[u8; 32]` as a lowercase hex string.
mod hex_bytes_32 {
    use serde::{Deserialize, Deserializer, Serializer};

    pub fn serialize<S>(bytes: &[u8; 32], ser: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        ser.serialize_str(&hex::encode(bytes))
    }

    pub fn deserialize<'de, D>(de: D) -> Result<[u8; 32], D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(de)?;
        let decoded = hex::decode(&s).map_err(serde::de::Error::custom)?;
        decoded
            .try_into()
            .map_err(|_| serde::de::Error::custom("expected exactly 32 bytes"))
    }
}

// ── Tests ──────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    fn valid_config() -> VpnConfig {
        VpnConfig {
            server_endpoint: "vpn.example.com:51820".to_string(),
            server_public_key: [0x01u8; 32],
            client_private_key: [0x02u8; 32],
            tunnel_address: "10.14.0.2/32".to_string(),
            dns: vec!["1.1.1.1".to_string()],
            rekey_interval_secs: DEFAULT_REKEY_INTERVAL_SECS,
            kill_switch_enabled: true,
        }
    }

    #[test]
    fn valid_config_passes_validation() {
        assert!(valid_config().validate().is_ok());
    }

    #[test]
    fn empty_server_endpoint_fails() {
        let mut cfg = valid_config();
        cfg.server_endpoint = "".to_string();
        assert!(matches!(cfg.validate(), Err(ConfigError::EmptyServerEndpoint)));
    }

    #[test]
    fn all_zero_server_key_fails() {
        let mut cfg = valid_config();
        cfg.server_public_key = [0u8; 32];
        assert!(matches!(cfg.validate(), Err(ConfigError::InvalidServerPublicKey)));
    }

    #[test]
    fn all_zero_client_key_fails() {
        let mut cfg = valid_config();
        cfg.client_private_key = [0u8; 32];
        assert!(matches!(cfg.validate(), Err(ConfigError::InvalidClientPrivateKey)));
    }

    #[test]
    fn missing_cidr_slash_fails() {
        let mut cfg = valid_config();
        cfg.tunnel_address = "10.14.0.2".to_string();
        assert!(matches!(cfg.validate(), Err(ConfigError::InvalidTunnelAddress)));
    }

    #[test]
    fn empty_dns_fails() {
        let mut cfg = valid_config();
        cfg.dns = vec![];
        assert!(matches!(cfg.validate(), Err(ConfigError::EmptyDnsList)));
    }

    #[test]
    fn rekey_interval_too_low_fails() {
        let mut cfg = valid_config();
        cfg.rekey_interval_secs = 30;
        assert!(matches!(cfg.validate(), Err(ConfigError::InvalidRekeyInterval(30))));
    }

    #[test]
    fn rekey_interval_too_high_fails() {
        let mut cfg = valid_config();
        cfg.rekey_interval_secs = 7200;
        assert!(matches!(cfg.validate(), Err(ConfigError::InvalidRekeyInterval(7200))));
    }

    #[test]
    fn tunnel_ip_extraction() {
        let cfg = valid_config();
        assert_eq!(cfg.tunnel_ip(), "10.14.0.2");
    }

    #[test]
    fn tunnel_prefix_len_extraction() {
        let cfg = valid_config();
        assert_eq!(cfg.tunnel_prefix_len(), 32);
    }

    #[test]
    fn redacted_display_hides_private_key() {
        let cfg = valid_config();
        let display = cfg.redacted_display();
        assert!(display.contains("[REDACTED]"));
        assert!(!display.contains("0202020202"));
    }
}
