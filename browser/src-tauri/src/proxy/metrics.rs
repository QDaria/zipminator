//! Connection metrics tracking.
//!
//! Records PQC vs classical connection counts, per-domain PQC status,
//! and connection latency. Emits Tauri events for the browser status bar.

use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Duration;

use dashmap::DashMap;
use serde::{Deserialize, Serialize};

use super::pqc_detector::PqcStatus;

/// Per-domain connection record.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DomainMetric {
    /// The domain name.
    pub domain: String,
    /// Last observed PQC status.
    pub pqc_status: PqcStatus,
    /// Total connections to this domain.
    pub total_connections: u64,
    /// Average handshake latency in milliseconds.
    pub avg_latency_ms: f64,
    /// Last connection timestamp (Unix millis).
    pub last_seen_ms: u64,
}

/// Aggregated proxy metrics.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyMetrics {
    pub pqc_connections: u64,
    pub classical_connections: u64,
    pub failed_connections: u64,
    pub total_connections: u64,
    pub domains: Vec<DomainMetric>,
}

/// Tauri event payload for a PQC connection.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PqcConnectionEvent {
    pub domain: String,
    pub algorithm: String,
    pub latency_ms: u64,
}

/// Tauri event payload for a classical fallback.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClassicalFallbackEvent {
    pub domain: String,
    pub algorithm: String,
    pub reason: String,
}

/// Internal record for per-domain latency tracking.
#[derive(Debug)]
struct LatencyAccumulator {
    total_ms: AtomicU64,
    count: AtomicU64,
}

impl LatencyAccumulator {
    fn new() -> Self {
        Self {
            total_ms: AtomicU64::new(0),
            count: AtomicU64::new(0),
        }
    }

    fn record(&self, duration: Duration) {
        let ms = duration.as_millis() as u64;
        self.total_ms.fetch_add(ms, Ordering::Relaxed);
        self.count.fetch_add(1, Ordering::Relaxed);
    }

    fn average_ms(&self) -> f64 {
        let total = self.total_ms.load(Ordering::Relaxed) as f64;
        let count = self.count.load(Ordering::Relaxed) as f64;
        if count == 0.0 {
            0.0
        } else {
            total / count
        }
    }

    fn count(&self) -> u64 {
        self.count.load(Ordering::Relaxed)
    }
}

/// Thread-safe metrics collector.
#[derive(Debug, Clone)]
pub struct MetricsCollector {
    pqc_count: Arc<AtomicU64>,
    classical_count: Arc<AtomicU64>,
    failed_count: Arc<AtomicU64>,
    /// Per-domain PQC status cache.
    domain_status: Arc<DashMap<String, PqcStatus>>,
    /// Per-domain latency accumulator.
    domain_latency: Arc<DashMap<String, Arc<LatencyAccumulator>>>,
    /// Per-domain last-seen timestamp (Unix millis).
    domain_last_seen: Arc<DashMap<String, u64>>,
}

impl MetricsCollector {
    /// Create a new metrics collector.
    pub fn new() -> Self {
        Self {
            pqc_count: Arc::new(AtomicU64::new(0)),
            classical_count: Arc::new(AtomicU64::new(0)),
            failed_count: Arc::new(AtomicU64::new(0)),
            domain_status: Arc::new(DashMap::new()),
            domain_latency: Arc::new(DashMap::new()),
            domain_last_seen: Arc::new(DashMap::new()),
        }
    }

    /// Record a successful PQC connection.
    pub fn record_pqc(&self, domain: &str, algorithm: &str, handshake_duration: Duration) {
        self.pqc_count.fetch_add(1, Ordering::Relaxed);

        self.domain_status.insert(
            domain.to_string(),
            PqcStatus::Active(algorithm.to_string()),
        );

        self.record_latency(domain, handshake_duration);
        self.touch(domain);

        tracing::info!(
            domain,
            algorithm,
            latency_ms = handshake_duration.as_millis() as u64,
            "PQC connection established"
        );
    }

    /// Record a classical (non-PQC) connection.
    pub fn record_classical(&self, domain: &str, algorithm: &str, handshake_duration: Duration) {
        self.classical_count.fetch_add(1, Ordering::Relaxed);

        self.domain_status.insert(
            domain.to_string(),
            PqcStatus::Classical(algorithm.to_string()),
        );

        self.record_latency(domain, handshake_duration);
        self.touch(domain);

        tracing::info!(
            domain,
            algorithm,
            latency_ms = handshake_duration.as_millis() as u64,
            "classical TLS connection"
        );
    }

    /// Record a failed connection attempt.
    pub fn record_failure(&self, domain: &str, reason: &str) {
        self.failed_count.fetch_add(1, Ordering::Relaxed);

        self.domain_status.insert(
            domain.to_string(),
            PqcStatus::Failed(reason.to_string()),
        );
        self.touch(domain);

        tracing::warn!(domain, reason, "connection failed");
    }

    /// Get a snapshot of all metrics.
    pub fn snapshot(&self) -> ProxyMetrics {
        let pqc = self.pqc_count.load(Ordering::Relaxed);
        let classical = self.classical_count.load(Ordering::Relaxed);
        let failed = self.failed_count.load(Ordering::Relaxed);

        let mut domains = Vec::new();
        for entry in self.domain_status.iter() {
            let domain = entry.key().clone();
            let pqc_status = entry.value().clone();
            let avg_latency_ms = self
                .domain_latency
                .get(&domain)
                .map(|a| a.average_ms())
                .unwrap_or(0.0);
            let total_connections = self
                .domain_latency
                .get(&domain)
                .map(|a| a.count())
                .unwrap_or(0);
            let last_seen_ms = self
                .domain_last_seen
                .get(&domain)
                .map(|v| *v.value())
                .unwrap_or(0);

            domains.push(DomainMetric {
                domain,
                pqc_status,
                total_connections,
                avg_latency_ms,
                last_seen_ms,
            });
        }

        ProxyMetrics {
            pqc_connections: pqc,
            classical_connections: classical,
            failed_connections: failed,
            total_connections: pqc + classical + failed,
            domains,
        }
    }

    /// Build a Tauri event payload for a PQC connection.
    pub fn pqc_event(&self, domain: &str, algorithm: &str, duration: Duration) -> PqcConnectionEvent {
        PqcConnectionEvent {
            domain: domain.to_string(),
            algorithm: algorithm.to_string(),
            latency_ms: duration.as_millis() as u64,
        }
    }

    /// Build a Tauri event payload for a classical fallback.
    pub fn classical_event(
        &self,
        domain: &str,
        algorithm: &str,
        reason: &str,
    ) -> ClassicalFallbackEvent {
        ClassicalFallbackEvent {
            domain: domain.to_string(),
            algorithm: algorithm.to_string(),
            reason: reason.to_string(),
        }
    }

    fn record_latency(&self, domain: &str, duration: Duration) {
        let acc = self
            .domain_latency
            .entry(domain.to_string())
            .or_insert_with(|| Arc::new(LatencyAccumulator::new()))
            .clone();
        acc.record(duration);
    }

    fn touch(&self, domain: &str) {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64;
        self.domain_last_seen.insert(domain.to_string(), now);
    }
}

impl Default for MetricsCollector {
    fn default() -> Self {
        Self::new()
    }
}

/// Tauri event names.
pub mod events {
    /// Emitted when a PQC-secured connection is established.
    pub const PQC_CONNECTION_ESTABLISHED: &str = "pqc-connection-established";
    /// Emitted when a connection falls back to classical TLS.
    pub const PQC_FALLBACK_CLASSICAL: &str = "pqc-fallback-classical";
    /// Emitted when proxy metrics are updated (periodic).
    pub const PROXY_METRICS_UPDATED: &str = "proxy-metrics-updated";
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn metrics_counting() {
        let m = MetricsCollector::new();
        m.record_pqc("example.com", "X25519MLKEM768", Duration::from_millis(42));
        m.record_classical("old.com", "X25519", Duration::from_millis(10));
        m.record_failure("bad.com", "timeout");

        let snap = m.snapshot();
        assert_eq!(snap.pqc_connections, 1);
        assert_eq!(snap.classical_connections, 1);
        assert_eq!(snap.failed_connections, 1);
        assert_eq!(snap.total_connections, 3);
        assert_eq!(snap.domains.len(), 3);
    }

    #[test]
    fn latency_average() {
        let m = MetricsCollector::new();
        m.record_pqc("a.com", "X25519MLKEM768", Duration::from_millis(20));
        m.record_pqc("a.com", "X25519MLKEM768", Duration::from_millis(40));

        let snap = m.snapshot();
        let domain = snap.domains.iter().find(|d| d.domain == "a.com").unwrap();
        assert!((domain.avg_latency_ms - 30.0).abs() < 1.0);
        assert_eq!(domain.total_connections, 2);
    }
}
