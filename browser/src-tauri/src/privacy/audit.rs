//! Zero-telemetry audit system.
//!
//! The audit system periodically scans all outbound connections to verify:
//!   - Every connection traverses the PQC proxy.
//!   - The VPN tunnel is active.
//!   - The kill switch is enforcing its policy.
//!   - No connection bypasses PQC encryption.
//!
//! Audit reports are stored in memory (ring buffer) and emitted as Tauri
//! events so the frontend can display real-time privacy status.
//!
//! Strict mode: when enabled, any connection that is not PQC-secured is
//! flagged as a `AuditViolation` and (optionally) refused.

use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, RwLock};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};

use crate::privacy::entropy::{EntropySource, QrngReader};

// ── Data structures ───────────────────────────────────────────────────────────

/// Category of audit violation.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum ViolationKind {
    /// A connection bypassed the PQC proxy.
    ProxyBypass,
    /// A connection used classical (non-PQC) TLS when strict mode is on.
    ClassicalTlsInStrictMode,
    /// The VPN tunnel dropped while strict mode was active.
    VpnDropped,
    /// The kill switch failed to block a connection.
    KillSwitchFailure,
    /// An outbound connection was detected with no encryption.
    UnencryptedConnection,
}

impl std::fmt::Display for ViolationKind {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ViolationKind::ProxyBypass => write!(f, "proxy bypass"),
            ViolationKind::ClassicalTlsInStrictMode => write!(f, "classical TLS in strict mode"),
            ViolationKind::VpnDropped => write!(f, "VPN tunnel dropped"),
            ViolationKind::KillSwitchFailure => write!(f, "kill switch failure"),
            ViolationKind::UnencryptedConnection => write!(f, "unencrypted connection"),
        }
    }
}

/// A single audit violation record.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditViolation {
    pub kind: ViolationKind,
    pub description: String,
    pub destination: Option<String>,
    pub timestamp: u64,
}

impl AuditViolation {
    fn new(kind: ViolationKind, description: impl Into<String>, destination: Option<String>) -> Self {
        Self {
            kind,
            description: description.into(),
            destination,
            timestamp: unix_now(),
        }
    }
}

/// The result of one audit cycle.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditReport {
    pub timestamp: u64,
    /// Total outbound connections observed in this cycle.
    pub total_connections: u64,
    /// Connections that went through the PQC proxy with PQC TLS.
    pub pqc_connections: u64,
    /// Connections that used classical TLS (non-zero is a warning in strict mode).
    pub classical_connections: u64,
    /// Requests blocked by the telemetry blocker.
    pub blocked_trackers: u64,
    /// Whether the VPN tunnel was active at audit time.
    pub vpn_active: bool,
    /// Whether the kill switch was active at audit time.
    pub kill_switch_active: bool,
    /// Current entropy source (quantum or OS fallback).
    pub entropy_source: EntropySource,
    /// Violations detected in this cycle.
    pub violations: Vec<AuditViolation>,
    /// Overall privacy score 0–100.
    pub privacy_score: u8,
}

impl AuditReport {
    /// Whether all critical protections are active (green badge).
    pub fn fully_protected(&self) -> bool {
        self.vpn_active && self.kill_switch_active && self.violations.is_empty()
    }

    /// Privacy grade: "A" (≥90), "B" (≥75), "C" (≥60), "D" (≥40), "F" (<40).
    pub fn grade(&self) -> char {
        match self.privacy_score {
            90..=100 => 'A',
            75..=89 => 'B',
            60..=74 => 'C',
            40..=59 => 'D',
            _ => 'F',
        }
    }
}

/// Tauri event name emitted after each audit cycle.
pub const EVENT_AUDIT_COMPLETE: &str = "privacy-audit-complete";

// ── Auditor ───────────────────────────────────────────────────────────────────

/// Connection observation submitted by the proxy / VPN layers.
#[derive(Debug, Clone)]
pub struct ConnectionObservation {
    pub destination: String,
    pub pqc: bool,
    pub proxied: bool,
    pub encrypted: bool,
}

/// The audit engine.  Holds counters and recent reports.
pub struct PrivacyAuditor {
    entropy: Arc<QrngReader>,

    // Counters for the current audit window.
    total_connections: AtomicU64,
    pqc_connections: AtomicU64,
    classical_connections: AtomicU64,
    blocked_trackers: AtomicU64,

    // Environment state (updated by VPN / kill-switch layers).
    vpn_active: AtomicBool,
    kill_switch_active: AtomicBool,

    // Strict mode: treat classical TLS as a violation.
    strict_mode: AtomicBool,

    // Ring buffer of recent reports (newest last, capped at 50).
    reports: RwLock<Vec<AuditReport>>,

    // Accumulated violations in the current window (reset each audit).
    current_violations: RwLock<Vec<AuditViolation>>,
}

const REPORT_CAP: usize = 50;

impl PrivacyAuditor {
    /// Create a new auditor.
    pub fn new(entropy: Arc<QrngReader>, strict_mode: bool) -> Self {
        Self {
            entropy,
            total_connections: AtomicU64::new(0),
            pqc_connections: AtomicU64::new(0),
            classical_connections: AtomicU64::new(0),
            blocked_trackers: AtomicU64::new(0),
            vpn_active: AtomicBool::new(false),
            kill_switch_active: AtomicBool::new(false),
            strict_mode: AtomicBool::new(strict_mode),
            reports: RwLock::new(Vec::new()),
            current_violations: RwLock::new(Vec::new()),
        }
    }

    // ── Observation ingestion ─────────────────────────────────────────────

    /// Record an outbound connection observation from the proxy layer.
    pub fn observe_connection(&self, obs: ConnectionObservation) {
        self.total_connections.fetch_add(1, Ordering::Relaxed);

        if !obs.encrypted {
            self.flag_violation(AuditViolation::new(
                ViolationKind::UnencryptedConnection,
                format!("unencrypted connection to {}", obs.destination),
                Some(obs.destination.clone()),
            ));
        }

        if !obs.proxied {
            self.flag_violation(AuditViolation::new(
                ViolationKind::ProxyBypass,
                format!("connection to {} bypassed proxy", obs.destination),
                Some(obs.destination.clone()),
            ));
        }

        if obs.pqc {
            self.pqc_connections.fetch_add(1, Ordering::Relaxed);
        } else {
            self.classical_connections.fetch_add(1, Ordering::Relaxed);
            if self.strict_mode.load(Ordering::Relaxed) {
                self.flag_violation(AuditViolation::new(
                    ViolationKind::ClassicalTlsInStrictMode,
                    format!("classical TLS to {} in strict mode", obs.destination),
                    Some(obs.destination.clone()),
                ));
            }
        }
    }

    /// Record that a tracker was blocked.
    pub fn record_blocked_tracker(&self) {
        self.blocked_trackers.fetch_add(1, Ordering::Relaxed);
    }

    /// Update VPN status.
    pub fn set_vpn_active(&self, active: bool) {
        let was_active = self.vpn_active.swap(active, Ordering::Relaxed);
        if was_active && !active && self.strict_mode.load(Ordering::Relaxed) {
            self.flag_violation(AuditViolation::new(
                ViolationKind::VpnDropped,
                "VPN tunnel dropped while strict mode was active",
                None,
            ));
            tracing::warn!("VPN tunnel dropped in strict mode");
        }
        tracing::info!(vpn_active = active, "VPN status updated");
    }

    /// Update kill switch status.
    pub fn set_kill_switch_active(&self, active: bool) {
        self.kill_switch_active.store(active, Ordering::Relaxed);
    }

    /// Enable or disable strict mode.
    pub fn set_strict_mode(&self, enabled: bool) {
        self.strict_mode.store(enabled, Ordering::Relaxed);
        tracing::info!(strict_mode = enabled, "audit strict mode changed");
    }

    // ── Report generation ─────────────────────────────────────────────────

    /// Run an audit cycle and produce a report.
    ///
    /// Resets per-window counters after building the report.
    pub fn run_audit(&self) -> AuditReport {
        let total = self.total_connections.swap(0, Ordering::Relaxed);
        let pqc = self.pqc_connections.swap(0, Ordering::Relaxed);
        let classical = self.classical_connections.swap(0, Ordering::Relaxed);
        let blocked = self.blocked_trackers.swap(0, Ordering::Relaxed);

        let vpn = self.vpn_active.load(Ordering::Relaxed);
        let ks = self.kill_switch_active.load(Ordering::Relaxed);

        let violations = {
            let mut v = self.current_violations.write().expect("violations lock poisoned");
            std::mem::take(&mut *v)
        };

        let score = compute_score(pqc, total, vpn, ks, &violations);

        let report = AuditReport {
            timestamp: unix_now(),
            total_connections: total,
            pqc_connections: pqc,
            classical_connections: classical,
            blocked_trackers: blocked,
            vpn_active: vpn,
            kill_switch_active: ks,
            entropy_source: self.entropy.pool_source(),
            violations,
            privacy_score: score,
        };

        // Store in ring buffer.
        {
            let mut reports = self.reports.write().expect("reports lock poisoned");
            if reports.len() >= REPORT_CAP {
                reports.remove(0);
            }
            reports.push(report.clone());
        }

        tracing::info!(
            score = report.privacy_score,
            grade = %report.grade(),
            violations = report.violations.len(),
            "privacy audit complete"
        );

        report
    }

    /// Return recent audit reports (newest last).
    pub fn recent_reports(&self) -> Vec<AuditReport> {
        self.reports.read().expect("reports lock poisoned").clone()
    }

    /// Return the most recent report, if any.
    pub fn latest_report(&self) -> Option<AuditReport> {
        self.reports.read().expect("reports lock poisoned").last().cloned()
    }

    // ── Private ───────────────────────────────────────────────────────────

    fn flag_violation(&self, v: AuditViolation) {
        tracing::warn!(kind = %v.kind, description = %v.description, "audit violation");
        self.current_violations
            .write()
            .expect("violations lock poisoned")
            .push(v);
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/// Compute a 0–100 privacy score.
fn compute_score(
    pqc: u64,
    total: u64,
    vpn: bool,
    kill_switch: bool,
    violations: &[AuditViolation],
) -> u8 {
    let mut score: i32 = 100;

    // PQC ratio deduction (up to -40 if 0 PQC connections).
    if total > 0 {
        let pqc_ratio = pqc as f64 / total as f64;
        let deduction = ((1.0 - pqc_ratio) * 40.0) as i32;
        score -= deduction;
    }

    // VPN: -30 if inactive.
    if !vpn {
        score -= 30;
    }

    // Kill switch: -15 if inactive.
    if !kill_switch {
        score -= 15;
    }

    // Each violation: -5 (capped).
    let violation_deduction = (violations.len() as i32 * 5).min(30);
    score -= violation_deduction;

    score.clamp(0, 100) as u8
}

fn unix_now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::privacy::entropy::QrngReader;

    fn make_auditor(strict: bool) -> PrivacyAuditor {
        let entropy = Arc::new(QrngReader::new("/nonexistent/pool.bin"));
        PrivacyAuditor::new(entropy, strict)
    }

    fn pqc_obs(dest: &str) -> ConnectionObservation {
        ConnectionObservation {
            destination: dest.to_string(),
            pqc: true,
            proxied: true,
            encrypted: true,
        }
    }

    fn classical_obs(dest: &str) -> ConnectionObservation {
        ConnectionObservation {
            destination: dest.to_string(),
            pqc: false,
            proxied: true,
            encrypted: true,
        }
    }

    #[test]
    fn perfect_score_with_all_active() {
        let auditor = make_auditor(false);
        auditor.set_vpn_active(true);
        auditor.set_kill_switch_active(true);
        auditor.observe_connection(pqc_obs("example.com"));
        auditor.observe_connection(pqc_obs("github.com"));

        let report = auditor.run_audit();
        assert_eq!(report.privacy_score, 100);
        assert_eq!(report.grade(), 'A');
        assert!(report.fully_protected());
    }

    #[test]
    fn missing_vpn_reduces_score() {
        let auditor = make_auditor(false);
        auditor.set_vpn_active(false);
        auditor.set_kill_switch_active(true);
        auditor.observe_connection(pqc_obs("x.com"));

        let report = auditor.run_audit();
        assert!(report.privacy_score < 100);
        assert!(!report.fully_protected());
    }

    #[test]
    fn classical_tls_in_strict_mode_is_violation() {
        let auditor = make_auditor(true);
        auditor.set_vpn_active(true);
        auditor.set_kill_switch_active(true);
        auditor.observe_connection(classical_obs("legacy.com"));

        let report = auditor.run_audit();
        assert!(!report.violations.is_empty());
        assert!(report.violations.iter().any(|v| v.kind == ViolationKind::ClassicalTlsInStrictMode));
    }

    #[test]
    fn proxy_bypass_flagged() {
        let auditor = make_auditor(false);
        auditor.observe_connection(ConnectionObservation {
            destination: "leaked.com".to_string(),
            pqc: false,
            proxied: false,
            encrypted: true,
        });

        let report = auditor.run_audit();
        assert!(report.violations.iter().any(|v| v.kind == ViolationKind::ProxyBypass));
    }

    #[test]
    fn vpn_drop_in_strict_mode_is_violation() {
        let auditor = make_auditor(true);
        auditor.set_vpn_active(true);
        auditor.set_vpn_active(false); // Simulates VPN drop.

        let report = auditor.run_audit();
        assert!(report.violations.iter().any(|v| v.kind == ViolationKind::VpnDropped));
    }

    #[test]
    fn blocked_tracker_count() {
        let auditor = make_auditor(false);
        auditor.record_blocked_tracker();
        auditor.record_blocked_tracker();

        let report = auditor.run_audit();
        assert_eq!(report.blocked_trackers, 2);
    }

    #[test]
    fn counters_reset_after_audit() {
        let auditor = make_auditor(false);
        auditor.observe_connection(pqc_obs("a.com"));
        auditor.run_audit();

        // Second audit should show 0 connections.
        let report2 = auditor.run_audit();
        assert_eq!(report2.total_connections, 0);
    }

    #[test]
    fn recent_reports_ring_buffer() {
        let auditor = make_auditor(false);
        for _ in 0..(REPORT_CAP + 5) {
            auditor.run_audit();
        }
        assert_eq!(auditor.recent_reports().len(), REPORT_CAP);
    }

    #[test]
    fn grade_mapping() {
        let report = |score: u8| AuditReport {
            timestamp: 0,
            total_connections: 1,
            pqc_connections: 1,
            classical_connections: 0,
            blocked_trackers: 0,
            vpn_active: true,
            kill_switch_active: true,
            entropy_source: EntropySource::Quantum,
            violations: vec![],
            privacy_score: score,
        };

        assert_eq!(report(95).grade(), 'A');
        assert_eq!(report(80).grade(), 'B');
        assert_eq!(report(65).grade(), 'C');
        assert_eq!(report(45).grade(), 'D');
        assert_eq!(report(20).grade(), 'F');
    }
}
