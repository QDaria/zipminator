//! VPN metrics: uptime, bytes transferred, rekey count.
//!
//! [`VpnMetrics`] maintains a snapshot updated by the tunnel and rekey tasks.
//! A background ticker emits `vpn-metrics-updated` Tauri events every 5 seconds
//! so the browser status bar stays current without polling.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::sync::{
    atomic::{AtomicU64, Ordering},
    Arc, Mutex,
};
use std::time::Instant;
use tokio::time::{interval, Duration};
use tracing::debug;

// ── VpnMetricsSnapshot ────────────────────────────────────────────────────

/// A point-in-time snapshot of VPN metrics, suitable for JSON serialisation
/// and delivery to the Tauri frontend as a `vpn-metrics-updated` event payload.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VpnMetricsSnapshot {
    /// Seconds the tunnel has been up (0 when disconnected).
    pub uptime_secs: u64,
    /// Total bytes sent through the tunnel since the last connect.
    pub bytes_sent: u64,
    /// Total bytes received through the tunnel since the last connect.
    pub bytes_received: u64,
    /// How many Kyber768 rekeys have completed in this session.
    pub rekey_count: u64,
    /// UTC timestamp of the last successful rekey (ISO-8601), or `null`.
    pub last_rekey_at: Option<DateTime<Utc>>,
    /// UTC timestamp when the tunnel was established, or `null`.
    pub connected_since: Option<DateTime<Utc>>,
}

// ── VpnMetrics ────────────────────────────────────────────────────────────

/// Thread-safe VPN metrics accumulator.
///
/// Byte counters use atomics (relaxed ordering is acceptable: the counters
/// are statistical, not used for cryptographic decisions).  Timestamps use
/// a `Mutex<Option<…>>` since `Instant`/`DateTime` are not atomic.
#[derive(Clone)]
pub struct VpnMetrics {
    inner: Arc<MetricsInner>,
}

struct MetricsInner {
    bytes_sent: AtomicU64,
    bytes_received: AtomicU64,
    rekey_count: AtomicU64,
    connected_since: Mutex<Option<Instant>>,
    connected_since_utc: Mutex<Option<DateTime<Utc>>>,
    last_rekey_at: Mutex<Option<DateTime<Utc>>>,
}

impl VpnMetrics {
    /// Create a zeroed metrics instance.
    pub fn new() -> Self {
        Self {
            inner: Arc::new(MetricsInner {
                bytes_sent: AtomicU64::new(0),
                bytes_received: AtomicU64::new(0),
                rekey_count: AtomicU64::new(0),
                connected_since: Mutex::new(None),
                connected_since_utc: Mutex::new(None),
                last_rekey_at: Mutex::new(None),
            }),
        }
    }

    /// Record that the tunnel has come up.  Sets the connection timestamps.
    pub fn record_connected(&self) {
        *self.inner.connected_since.lock().expect("metrics lock") = Some(Instant::now());
        *self.inner.connected_since_utc.lock().expect("metrics lock") = Some(Utc::now());
    }

    /// Reset all counters (called when the tunnel is brought down).
    pub fn record_disconnected(&self) {
        self.inner.bytes_sent.store(0, Ordering::Relaxed);
        self.inner.bytes_received.store(0, Ordering::Relaxed);
        self.inner.rekey_count.store(0, Ordering::Relaxed);
        *self.inner.connected_since.lock().expect("metrics lock") = None;
        *self.inner.connected_since_utc.lock().expect("metrics lock") = None;
        *self.inner.last_rekey_at.lock().expect("metrics lock") = None;
    }

    /// Add `n` bytes to the sent counter.
    pub fn add_bytes_sent(&self, n: u64) {
        self.inner.bytes_sent.fetch_add(n, Ordering::Relaxed);
    }

    /// Add `n` bytes to the received counter.
    pub fn add_bytes_received(&self, n: u64) {
        self.inner.bytes_received.fetch_add(n, Ordering::Relaxed);
    }

    /// Increment the rekey counter and record the rekey timestamp.
    pub fn record_rekey(&self) {
        self.inner.rekey_count.fetch_add(1, Ordering::Relaxed);
        *self.inner.last_rekey_at.lock().expect("metrics lock") = Some(Utc::now());
    }

    /// Return a snapshot of the current metrics.
    pub fn snapshot(&self) -> VpnMetricsSnapshot {
        let uptime_secs = self
            .inner
            .connected_since
            .lock()
            .expect("metrics lock")
            .map(|start| start.elapsed().as_secs())
            .unwrap_or(0);

        VpnMetricsSnapshot {
            uptime_secs,
            bytes_sent: self.inner.bytes_sent.load(Ordering::Relaxed),
            bytes_received: self.inner.bytes_received.load(Ordering::Relaxed),
            rekey_count: self.inner.rekey_count.load(Ordering::Relaxed),
            last_rekey_at: *self
                .inner
                .last_rekey_at
                .lock()
                .expect("metrics lock"),
            connected_since: *self
                .inner
                .connected_since_utc
                .lock()
                .expect("metrics lock"),
        }
    }

    /// Spawn a Tokio task that emits `vpn-metrics-updated` Tauri events every
    /// `interval_secs` seconds.
    ///
    /// Returns a [`tokio::task::JoinHandle`] that can be aborted when the
    /// tunnel disconnects.
    ///
    /// The `emit_fn` callback receives a snapshot; it is responsible for
    /// forwarding it to the Tauri app handle.  This decouples the metrics
    /// module from the Tauri dependency so it can be unit-tested without a
    /// running Tauri application.
    pub fn start_emitter<F>(
        &self,
        interval_secs: u64,
        emit_fn: F,
    ) -> tokio::task::JoinHandle<()>
    where
        F: Fn(VpnMetricsSnapshot) + Send + 'static,
    {
        let metrics = self.clone();
        let period = Duration::from_secs(interval_secs);
        tokio::spawn(async move {
            let mut ticker = interval(period);
            ticker.tick().await; // consume the immediate first tick
            loop {
                ticker.tick().await;
                let snap = metrics.snapshot();
                debug!(
                    uptime = snap.uptime_secs,
                    bytes_sent = snap.bytes_sent,
                    bytes_recv = snap.bytes_received,
                    rekeys = snap.rekey_count,
                    "VPN metrics tick"
                );
                emit_fn(snap);
            }
        })
    }
}

impl Default for VpnMetrics {
    fn default() -> Self {
        Self::new()
    }
}

// ── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn initial_snapshot_is_zeroed() {
        let m = VpnMetrics::new();
        let snap = m.snapshot();
        assert_eq!(snap.uptime_secs, 0);
        assert_eq!(snap.bytes_sent, 0);
        assert_eq!(snap.bytes_received, 0);
        assert_eq!(snap.rekey_count, 0);
        assert!(snap.last_rekey_at.is_none());
        assert!(snap.connected_since.is_none());
    }

    #[test]
    fn bytes_accumulate_correctly() {
        let m = VpnMetrics::new();
        m.add_bytes_sent(1000);
        m.add_bytes_sent(500);
        m.add_bytes_received(2000);
        let snap = m.snapshot();
        assert_eq!(snap.bytes_sent, 1500);
        assert_eq!(snap.bytes_received, 2000);
    }

    #[test]
    fn rekey_count_increments() {
        let m = VpnMetrics::new();
        m.record_rekey();
        m.record_rekey();
        m.record_rekey();
        let snap = m.snapshot();
        assert_eq!(snap.rekey_count, 3);
        assert!(snap.last_rekey_at.is_some());
    }

    #[test]
    fn record_connected_sets_uptime() {
        let m = VpnMetrics::new();
        m.record_connected();
        // Sleep briefly to ensure elapsed > 0.
        std::thread::sleep(std::time::Duration::from_millis(10));
        let snap = m.snapshot();
        // Uptime may still be 0 (if < 1s), but connected_since must be set.
        assert!(snap.connected_since.is_some());
    }

    #[test]
    fn record_disconnected_resets_all() {
        let m = VpnMetrics::new();
        m.record_connected();
        m.add_bytes_sent(999);
        m.record_rekey();
        m.record_disconnected();
        let snap = m.snapshot();
        assert_eq!(snap.bytes_sent, 0);
        assert_eq!(snap.rekey_count, 0);
        assert!(snap.connected_since.is_none());
        assert!(snap.last_rekey_at.is_none());
    }

    #[test]
    fn metrics_is_clone_and_shared() {
        let m = VpnMetrics::new();
        let m2 = m.clone();
        m.add_bytes_sent(42);
        // Both handles share the same inner Arc.
        assert_eq!(m2.snapshot().bytes_sent, 42);
    }

    #[tokio::test]
    async fn emitter_calls_emit_fn() {
        use std::sync::{Arc, Mutex};

        let m = VpnMetrics::new();
        m.record_connected();
        m.add_bytes_sent(100);

        let received: Arc<Mutex<Vec<VpnMetricsSnapshot>>> =
            Arc::new(Mutex::new(Vec::new()));
        let received_clone = received.clone();

        let handle = m.start_emitter(1, move |snap| {
            received_clone.lock().unwrap().push(snap);
        });

        // Wait for at least one emission.
        tokio::time::sleep(Duration::from_millis(1200)).await;
        handle.abort();

        let snaps = received.lock().unwrap();
        assert!(!snaps.is_empty(), "emitter must have fired at least once");
        assert_eq!(snaps[0].bytes_sent, 100);
    }

    #[test]
    fn snapshot_serialises_to_json() {
        let m = VpnMetrics::new();
        m.record_connected();
        m.add_bytes_sent(512);
        m.record_rekey();
        let snap = m.snapshot();
        let json = serde_json::to_string(&snap).expect("serialisation must succeed");
        assert!(json.contains("\"bytes_sent\":512"));
        assert!(json.contains("\"rekey_count\":1"));
    }
}
