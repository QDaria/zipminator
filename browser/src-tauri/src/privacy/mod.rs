//! Privacy engine for ZipBrowser.
//!
//! This module is the single entry point for all privacy-related components:
//!
//! | Module              | Responsibility                                           |
//! |---------------------|----------------------------------------------------------|
//! | `entropy`           | QRNG reader — wraps the quantum entropy pool file        |
//! | `session`           | QRNG-seeded session tokens                               |
//! | `fingerprint`       | JavaScript injection to defeat browser fingerprinting    |
//! | `cookie_rotation`   | Per-tab cookie isolation and QRNG-seeded rotation        |
//! | `password_manager`  | PQC-layered encrypted password vault                     |
//! | `telemetry_blocker` | Domain/pattern-level tracker and telemetry blocking      |
//! | `audit`             | Zero-telemetry audit system with privacy scoring         |
//!
//! ## Initialization
//!
//! Call `PrivacyEngine::init(project_root)` during Tauri setup.  The returned
//! `Arc<PrivacyEngine>` should be stored in Tauri's managed state so that
//! Tauri commands can access all sub-systems through a single handle.
//!
//! ```ignore
//! // In your Tauri builder:
//! let engine = PrivacyEngine::init("/path/to/zipminator");
//! tauri::Builder::default()
//!     .manage(engine)
//!     ...
//! ```

pub mod audit;
pub mod cookie_rotation;
pub mod entropy;
pub mod fingerprint;
pub mod password_manager;
pub mod session;
pub mod telemetry_blocker;

use std::path::Path;
use std::sync::Arc;
use std::time::Duration;

use serde::{Deserialize, Serialize};

use audit::PrivacyAuditor;
use cookie_rotation::CookieRotator;
use entropy::QrngReader;
use fingerprint::{FingerprintConfig, FingerprintGuard};
use password_manager::PasswordVault;
use session::SessionManager;
use telemetry_blocker::TelemetryBlocker;

// ── Engine configuration ──────────────────────────────────────────────────────

/// Top-level configuration for the privacy engine.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrivacyConfig {
    /// Enable canvas/WebGL/audio fingerprint resistance.
    pub fingerprint_resistance: bool,
    /// Enable automatic cookie rotation.
    pub cookie_rotation: bool,
    /// Cookie rotation interval.
    #[serde(with = "duration_secs")]
    pub cookie_rotation_interval: Duration,
    /// Enable telemetry / tracker blocking.
    pub telemetry_blocking: bool,
    /// Enforce strict PQC mode (refuse classical TLS connections).
    pub strict_pqc_mode: bool,
    /// Fingerprint resistance configuration details.
    pub fingerprint_config: FingerprintConfig,
}

impl Default for PrivacyConfig {
    fn default() -> Self {
        Self {
            fingerprint_resistance: true,
            cookie_rotation: true,
            cookie_rotation_interval: cookie_rotation::DEFAULT_ROTATION_INTERVAL,
            telemetry_blocking: true,
            strict_pqc_mode: false, // Off by default; user can enable.
            fingerprint_config: FingerprintConfig::default(),
        }
    }
}

// ── Engine ────────────────────────────────────────────────────────────────────

/// The privacy engine — a single handle to all privacy subsystems.
pub struct PrivacyEngine {
    pub config: PrivacyConfig,
    pub entropy: Arc<QrngReader>,
    pub session: Arc<SessionManager>,
    pub fingerprint: Arc<std::sync::Mutex<FingerprintGuard>>,
    pub cookies: Arc<CookieRotator>,
    pub passwords: Arc<PasswordVault>,
    pub blocker: Arc<TelemetryBlocker>,
    pub auditor: Arc<PrivacyAuditor>,
}

impl PrivacyEngine {
    /// Initialize the privacy engine.
    ///
    /// `project_root` should point to the zipminator project root so that the
    /// entropy pool at `quantum_entropy/quantum_entropy_pool.bin` is found.
    ///
    /// `vault_path` is the path where the password vault file will be stored
    /// (typically inside Tauri's app data directory).
    pub fn init(
        project_root: impl AsRef<Path>,
        vault_path: impl AsRef<Path>,
        config: PrivacyConfig,
    ) -> Arc<Self> {
        let entropy = Arc::new(QrngReader::with_project_root(&project_root));

        let session = Arc::new(SessionManager::new(Arc::clone(&entropy)));

        let fingerprint_guard = FingerprintGuard::new(
            Arc::clone(&entropy),
            config.fingerprint_config.clone(),
        );
        let fingerprint = Arc::new(std::sync::Mutex::new(fingerprint_guard));

        let cookies = Arc::new(CookieRotator::new(
            Arc::clone(&entropy),
            config.cookie_rotation_interval,
        ));

        let passwords = Arc::new(PasswordVault::new(
            Arc::clone(&entropy),
            vault_path.as_ref(),
        ));

        let blocker = Arc::new(TelemetryBlocker::new());

        let auditor = Arc::new(PrivacyAuditor::new(
            Arc::clone(&entropy),
            config.strict_pqc_mode,
        ));

        tracing::info!(
            entropy_source = %entropy.pool_source(),
            pool_bytes = entropy.pool_available(),
            "privacy engine initialized"
        );

        Arc::new(Self {
            config,
            entropy,
            session,
            fingerprint,
            cookies,
            passwords,
            blocker,
            auditor,
        })
    }

    /// Generate the fingerprint resistance JavaScript for injection into a new page.
    pub fn fingerprint_script(&self) -> String {
        self.fingerprint
            .lock()
            .expect("fingerprint lock poisoned")
            .injection_script()
    }

    /// Rotate the session (new token + new fingerprint seed).
    pub fn rotate_session(&self) -> session::SessionInfo {
        let info = self.session.rotate();
        self.fingerprint
            .lock()
            .expect("fingerprint lock poisoned")
            .rotate_seed();
        info
    }

    /// Check whether a URL should be blocked.
    ///
    /// Also updates the audit counter if blocked.
    pub fn check_url(&self, url: &str) -> Option<telemetry_blocker::BlockReason> {
        let result = self.blocker.should_block(url);
        if let Some(ref reason) = result {
            self.blocker.record_blocked(url, reason.clone());
            self.auditor.record_blocked_tracker();
        }
        result
    }

    /// Run a full audit cycle and return the report.
    pub fn audit(&self) -> audit::AuditReport {
        self.auditor.run_audit()
    }

    /// Update VPN status (call from the VPN service layer).
    pub fn set_vpn_active(&self, active: bool) {
        self.auditor.set_vpn_active(active);
    }

    /// Update kill switch status.
    pub fn set_kill_switch_active(&self, active: bool) {
        self.auditor.set_kill_switch_active(active);
    }

    /// Record a connection observation from the proxy layer.
    pub fn observe_connection(&self, obs: audit::ConnectionObservation) {
        self.auditor.observe_connection(obs);
    }
}

// ── Serde helper for Duration ─────────────────────────────────────────────────

mod duration_secs {
    use serde::{Deserialize, Deserializer, Serializer};
    use std::time::Duration;

    pub fn serialize<S: Serializer>(d: &Duration, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_u64(d.as_secs())
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<Duration, D::Error> {
        let secs = u64::deserialize(d)?;
        Ok(Duration::from_secs(secs))
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn make_engine(tmp: &TempDir) -> Arc<PrivacyEngine> {
        PrivacyEngine::init(
            "/nonexistent/project",
            tmp.path().join("vault.json"),
            PrivacyConfig::default(),
        )
    }

    #[test]
    fn engine_initializes() {
        let tmp = TempDir::new().unwrap();
        let engine = make_engine(&tmp);
        // Should not panic; fallback entropy used.
        let script = engine.fingerprint_script();
        assert!(!script.is_empty());
    }

    #[test]
    fn check_url_blocks_tracker() {
        let tmp = TempDir::new().unwrap();
        let engine = make_engine(&tmp);
        let result = engine.check_url("https://google-analytics.com/collect");
        assert!(result.is_some());
    }

    #[test]
    fn check_url_allows_normal_site() {
        let tmp = TempDir::new().unwrap();
        let engine = make_engine(&tmp);
        let result = engine.check_url("https://example.com/page");
        assert!(result.is_none());
    }

    #[test]
    fn session_rotation_changes_token() {
        let tmp = TempDir::new().unwrap();
        let engine = make_engine(&tmp);
        let before = engine.session.current_token();
        engine.rotate_session();
        let after = engine.session.current_token();
        assert_ne!(before, after);
    }

    #[test]
    fn audit_produces_report() {
        let tmp = TempDir::new().unwrap();
        let engine = make_engine(&tmp);
        engine.set_vpn_active(true);
        engine.set_kill_switch_active(true);
        let report = engine.audit();
        assert!(report.privacy_score > 0);
    }
}
