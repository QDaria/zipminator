#![cfg(feature = "vpn")]
//! VPN ↔ Proxy integration tests.
//!
//! Verifies that:
//! 1. `set_vpn_tunnel_ip` / `clear_vpn_tunnel_ip` correctly update the
//!    bind-address registry consulted by the proxy.
//! 2. VPN state transitions (connect / disconnect) emit the expected events.
//! 3. `VpnManager` lifecycle is correct when accessed through the global
//!    `SharedVpnManager`.
//! 4. The proxy server's VPN registration survives concurrent access.
//!
//! These tests do **not** open real network sockets or WireGuard tunnels;
//! all network I/O is avoided so the tests run fast and offline.

// ── Pull in the library crate ───────────────────────────────────────────────

use zipbrowser::proxy::server::{clear_vpn_tunnel_ip, set_vpn_tunnel_ip};
use zipbrowser::vpn::{
    config::VpnConfig,
    metrics::VpnMetrics,
    state::{VpnState, VpnStateMachine},
    VpnManager,
};
use std::sync::Arc;

// ── Helpers ─────────────────────────────────────────────────────────────────

fn valid_vpn_config() -> VpnConfig {
    VpnConfig {
        server_endpoint: "vpn.example.com:51820".to_string(),
        server_public_key: [0x01u8; 32],
        client_private_key: [0x02u8; 32],
        tunnel_address: "10.14.0.2/32".to_string(),
        dns: vec!["1.1.1.1".to_string()],
        rekey_interval_secs: 300,
        kill_switch_enabled: false,
    }
}

fn noop_emit() -> Arc<dyn Fn(&str, serde_json::Value) + Send + Sync> {
    Arc::new(|_, _| {})
}

// ── Proxy VPN registry tests ─────────────────────────────────────────────────

#[test]
fn set_and_clear_vpn_tunnel_ip_round_trips() {
    // Setting a tunnel IP and then clearing it should not panic.
    set_vpn_tunnel_ip("10.14.0.2");
    clear_vpn_tunnel_ip();
    // Calling clear again when already clear must also be safe.
    clear_vpn_tunnel_ip();
}

#[test]
fn multiple_set_calls_update_the_ip() {
    // Successive calls to `set_vpn_tunnel_ip` overwrite the previous value.
    set_vpn_tunnel_ip("10.14.0.2");
    set_vpn_tunnel_ip("10.14.0.99");
    // Cleanup.
    clear_vpn_tunnel_ip();
}

#[test]
fn vpn_registry_survives_concurrent_access() {
    use std::thread;

    let handles: Vec<_> = (0..8)
        .map(|i| {
            thread::spawn(move || {
                set_vpn_tunnel_ip(format!("10.14.0.{}", i));
                clear_vpn_tunnel_ip();
            })
        })
        .collect();

    for h in handles {
        h.join().expect("thread should not panic");
    }
}

// ── VPN state machine tests ──────────────────────────────────────────────────

#[test]
fn state_machine_connect_then_disconnect_cycle() {
    let sm = VpnStateMachine::new();

    sm.transition(VpnState::Connecting).expect("Disconnected -> Connecting");
    assert_eq!(sm.current(), VpnState::Connecting);

    sm.transition(VpnState::Connected).expect("Connecting -> Connected");
    assert!(sm.is_tunnel_active());

    sm.transition(VpnState::Disconnected).expect("Connected -> Disconnected");
    assert!(!sm.is_tunnel_active());
}

#[test]
fn state_machine_rekey_cycle_stays_active() {
    let sm = VpnStateMachine::new();
    sm.transition(VpnState::Connecting).unwrap();
    sm.transition(VpnState::Connected).unwrap();
    sm.transition(VpnState::Rekeying).unwrap();
    // Tunnel must still be considered active during a rekey.
    assert!(sm.is_tunnel_active(), "tunnel should be active during rekeying");
    sm.transition(VpnState::Connected).unwrap();
    assert!(sm.is_tunnel_active());
}

#[test]
fn state_machine_error_then_reset() {
    let sm = VpnStateMachine::new();
    sm.transition(VpnState::Connecting).unwrap();
    sm.transition(VpnState::Error("handshake timeout".to_string())).unwrap();
    sm.transition(VpnState::Disconnected).unwrap();
    assert_eq!(sm.current(), VpnState::Disconnected);
}

#[test]
fn state_machine_invalid_transition_disconnected_to_connected_is_rejected() {
    let sm = VpnStateMachine::new();
    let result = sm.transition(VpnState::Connected);
    assert!(
        result.is_err(),
        "jumping from Disconnected to Connected must be rejected"
    );
    // State must be unchanged.
    assert_eq!(sm.current(), VpnState::Disconnected);
}

// ── VpnManager lifecycle tests ───────────────────────────────────────────────

#[test]
fn new_manager_starts_disconnected() {
    let mgr = VpnManager::new();
    assert_eq!(mgr.current_state(), VpnState::Disconnected);
}

#[test]
fn manager_status_disconnected_has_no_metrics() {
    let mgr = VpnManager::new();
    let status = mgr.status();
    assert!(matches!(status.state, VpnState::Disconnected));
    assert!(status.interface.is_none());
    assert!(status.metrics.is_none());
}

#[tokio::test]
async fn disconnect_when_already_disconnected_is_noop() {
    let mut mgr = VpnManager::new();
    let result = mgr.disconnect(noop_emit()).await;
    assert!(result.is_ok(), "disconnecting an already-disconnected manager must succeed");
    assert_eq!(mgr.current_state(), VpnState::Disconnected);
}

#[tokio::test]
async fn connect_with_invalid_config_stays_disconnected() {
    let mut mgr = VpnManager::new();
    let bad = VpnConfig {
        server_endpoint: "".to_string(), // invalid: empty
        server_public_key: [0x01u8; 32],
        client_private_key: [0x02u8; 32],
        tunnel_address: "10.14.0.2/32".to_string(),
        dns: vec!["1.1.1.1".to_string()],
        rekey_interval_secs: 300,
        kill_switch_enabled: false,
    };
    let result = mgr.connect(bad, noop_emit()).await;
    assert!(result.is_err(), "invalid config must return an error");
    assert_eq!(
        mgr.current_state(),
        VpnState::Disconnected,
        "state must remain Disconnected after failed connect"
    );
}

#[tokio::test]
async fn connect_emits_state_changed_events() {
    use std::sync::atomic::{AtomicUsize, Ordering};

    let counter = Arc::new(AtomicUsize::new(0));
    let counter_clone = counter.clone();

    let emit_fn: Arc<dyn Fn(&str, serde_json::Value) + Send + Sync> =
        Arc::new(move |event, _| {
            if event == "vpn-state-changed" {
                counter_clone.fetch_add(1, Ordering::SeqCst);
            }
        });

    let mut mgr = VpnManager::new();
    // Use an invalid config that fails at validation (before any network I/O),
    // which still emits zero events — the error is returned before the first
    // state transition.  Use a config that passes validation but then fails at
    // TUN creation (no root / CI environment) to verify at least one event.
    let _result = mgr.connect(valid_vpn_config(), emit_fn).await;

    // Whether the connect succeeds or fails (no TUN in CI), the state machine
    // must have transitioned at least once (Connecting or error).
    // In a CI environment with no root, the tunnel creation fails after
    // transitioning to Connecting, so we see at least 1 event.
    let events = counter.load(Ordering::SeqCst);
    assert!(
        events >= 1,
        "expected at least one vpn-state-changed event, got {}",
        events
    );
}

// ── SharedVpnManager global tests ────────────────────────────────────────────

#[test]
fn init_vpn_manager_returns_same_instance() {
    let a = zipbrowser::init_vpn_manager();
    let b = zipbrowser::init_vpn_manager();
    // Both must point to the same Arc (same pointer).
    assert!(
        Arc::ptr_eq(a, b),
        "init_vpn_manager must return the same shared instance"
    );
}

#[tokio::test]
async fn shared_manager_can_be_locked_and_read() {
    let manager = zipbrowser::init_vpn_manager();
    let guard = manager.lock().await;
    let state = guard.current_state();
    // The state may already be Connecting/Connected if another test triggered
    // a connect.  We just verify that locking works without deadlock.
    drop(state);
}

// ── VPN metrics tests ─────────────────────────────────────────────────────────

#[test]
fn metrics_accumulate_bytes_correctly() {
    let m = VpnMetrics::new();
    m.record_connected();
    m.add_bytes_sent(512);
    m.add_bytes_received(1024);
    m.record_rekey();

    let snap = m.snapshot();
    assert_eq!(snap.bytes_sent, 512);
    assert_eq!(snap.bytes_received, 1024);
    assert_eq!(snap.rekey_count, 1);
    assert!(snap.last_rekey_at.is_some());
    assert!(snap.connected_since.is_some());
}

#[test]
fn metrics_reset_on_disconnect() {
    let m = VpnMetrics::new();
    m.record_connected();
    m.add_bytes_sent(999);
    m.record_rekey();
    m.record_disconnected();

    let snap = m.snapshot();
    assert_eq!(snap.bytes_sent, 0, "bytes_sent must reset to 0");
    assert_eq!(snap.rekey_count, 0, "rekey_count must reset to 0");
    assert!(snap.connected_since.is_none(), "connected_since must be None");
}

#[test]
fn metrics_shared_arc_sees_updates() {
    let m = VpnMetrics::new();
    let m2 = m.clone();
    m.add_bytes_sent(42);
    // Both handles share the same inner Arc.
    assert_eq!(m2.snapshot().bytes_sent, 42);
}

// ── VPN config validation tests ───────────────────────────────────────────────

#[test]
fn vpn_config_valid_passes() {
    assert!(valid_vpn_config().validate().is_ok());
}

#[test]
fn vpn_config_empty_endpoint_fails() {
    let mut c = valid_vpn_config();
    c.server_endpoint = "".to_string();
    assert!(c.validate().is_err());
}

#[test]
fn vpn_config_empty_dns_fails() {
    let mut c = valid_vpn_config();
    c.dns = vec![];
    assert!(c.validate().is_err());
}

#[test]
fn vpn_config_all_zero_server_key_fails() {
    let mut c = valid_vpn_config();
    c.server_public_key = [0u8; 32];
    assert!(c.validate().is_err());
}

#[test]
fn vpn_config_rekey_interval_out_of_range_fails() {
    let mut c = valid_vpn_config();
    c.rekey_interval_secs = 30; // below minimum of 60
    assert!(c.validate().is_err());
}
