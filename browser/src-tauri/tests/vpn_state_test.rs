#![cfg(feature = "vpn")]
//! Integration tests for the VPN state machine.
//!
//! These tests exercise the full transition table, concurrency safety, and
//! edge cases that are harder to cover in the unit tests inside `state.rs`.

// Pull in the crate under test.  Adjust the crate name as needed if
// Cargo.toml changes.
use zipbrowser::vpn::state::{StateError, VpnState, VpnStateMachine};

// ── Happy-path lifecycle ───────────────────────────────────────────────────

#[test]
fn full_connect_rekey_disconnect_lifecycle() {
    let sm = VpnStateMachine::new();

    // Boot sequence.
    assert_eq!(sm.current(), VpnState::Disconnected);

    sm.transition(VpnState::Connecting).expect("Disconnected → Connecting");
    assert_eq!(sm.current(), VpnState::Connecting);

    sm.transition(VpnState::Connected).expect("Connecting → Connected");
    assert_eq!(sm.current(), VpnState::Connected);

    // Periodic rekey cycle.
    sm.transition(VpnState::Rekeying).expect("Connected → Rekeying");
    assert_eq!(sm.current(), VpnState::Rekeying);

    sm.transition(VpnState::Connected).expect("Rekeying → Connected");
    assert_eq!(sm.current(), VpnState::Connected);

    // User-initiated disconnect.
    sm.transition(VpnState::Disconnected).expect("Connected → Disconnected");
    assert_eq!(sm.current(), VpnState::Disconnected);
}

// ── Error recovery paths ──────────────────────────────────────────────────

#[test]
fn error_during_connecting_then_reset() {
    let sm = VpnStateMachine::new();
    sm.transition(VpnState::Connecting).unwrap();
    sm.transition(VpnState::Error("TLS timeout".to_string())).unwrap();
    assert!(matches!(sm.current(), VpnState::Error(_)));

    sm.transition(VpnState::Disconnected).unwrap();
    assert_eq!(sm.current(), VpnState::Disconnected);
}

#[test]
fn error_during_connected_then_reset() {
    let sm = VpnStateMachine::new();
    sm.transition(VpnState::Connecting).unwrap();
    sm.transition(VpnState::Connected).unwrap();
    sm.transition(VpnState::Error("packet loss".to_string())).unwrap();

    sm.transition(VpnState::Disconnected).unwrap();
    assert_eq!(sm.current(), VpnState::Disconnected);
}

#[test]
fn retry_connection_after_error() {
    let sm = VpnStateMachine::new();
    sm.transition(VpnState::Connecting).unwrap();
    sm.transition(VpnState::Error("unreachable".to_string())).unwrap();
    // Retry: Error → Connecting is allowed.
    sm.transition(VpnState::Connecting).unwrap();
    sm.transition(VpnState::Connected).unwrap();
    assert_eq!(sm.current(), VpnState::Connected);
}

#[test]
fn multiple_rekey_cycles() {
    let sm = VpnStateMachine::new();
    sm.transition(VpnState::Connecting).unwrap();
    sm.transition(VpnState::Connected).unwrap();

    for i in 0..5 {
        sm.transition(VpnState::Rekeying)
            .unwrap_or_else(|e| panic!("cycle {} Rekeying: {}", i, e));
        sm.transition(VpnState::Connected)
            .unwrap_or_else(|e| panic!("cycle {} Connected: {}", i, e));
    }
    assert_eq!(sm.current(), VpnState::Connected);
}

// ── Forbidden transitions ─────────────────────────────────────────────────

#[test]
fn cannot_skip_directly_to_rekeying() {
    let sm = VpnStateMachine::new();
    let err = sm.transition(VpnState::Rekeying).unwrap_err();
    assert!(
        matches!(err, StateError::InvalidTransition { .. }),
        "expected InvalidTransition, got {:?}",
        err
    );
    // State must not change.
    assert_eq!(sm.current(), VpnState::Disconnected);
}

#[test]
fn cannot_skip_directly_to_connected_from_disconnected() {
    let sm = VpnStateMachine::new();
    assert!(sm.transition(VpnState::Connected).is_err());
    assert_eq!(sm.current(), VpnState::Disconnected);
}

#[test]
fn cannot_connect_while_rekeying() {
    let sm = VpnStateMachine::new();
    sm.transition(VpnState::Connecting).unwrap();
    sm.transition(VpnState::Connected).unwrap();
    sm.transition(VpnState::Rekeying).unwrap();
    // Rekeying → Connecting is NOT in the transition table.
    let err = sm.transition(VpnState::Connecting).unwrap_err();
    assert!(matches!(err, StateError::InvalidTransition { .. }));
    // State must remain Rekeying.
    assert_eq!(sm.current(), VpnState::Rekeying);
}

#[test]
fn cannot_rekey_from_connecting() {
    let sm = VpnStateMachine::new();
    sm.transition(VpnState::Connecting).unwrap();
    assert!(sm.transition(VpnState::Rekeying).is_err());
    assert_eq!(sm.current(), VpnState::Connecting);
}

// ── Concurrency ───────────────────────────────────────────────────────────

#[test]
fn concurrent_readers_do_not_deadlock() {
    use std::thread;

    let sm = std::sync::Arc::new(VpnStateMachine::new());
    sm.transition(VpnState::Connecting).unwrap();
    sm.transition(VpnState::Connected).unwrap();

    let handles: Vec<_> = (0..10)
        .map(|_| {
            let sm_clone = sm.clone();
            thread::spawn(move || {
                // Each thread reads the state 100 times.
                for _ in 0..100 {
                    let _ = sm_clone.current();
                }
            })
        })
        .collect();

    for h in handles {
        h.join().expect("reader thread panicked");
    }
}

#[test]
fn sequential_transitions_from_multiple_clones() {
    let sm = VpnStateMachine::new();
    let sm2 = sm.clone();

    // Both clones share the same inner state.
    sm.transition(VpnState::Connecting).unwrap();
    assert_eq!(sm2.current(), VpnState::Connecting);

    sm2.transition(VpnState::Connected).unwrap();
    assert_eq!(sm.current(), VpnState::Connected);
}

// ── Force-disconnect ──────────────────────────────────────────────────────

#[test]
fn force_disconnected_from_rekeying() {
    let sm = VpnStateMachine::new();
    sm.transition(VpnState::Connecting).unwrap();
    sm.transition(VpnState::Connected).unwrap();
    sm.transition(VpnState::Rekeying).unwrap();
    sm.force_disconnected();
    assert_eq!(sm.current(), VpnState::Disconnected);
}

#[test]
fn force_disconnected_from_error() {
    let sm = VpnStateMachine::new();
    sm.transition(VpnState::Connecting).unwrap();
    sm.transition(VpnState::Error("crash".to_string())).unwrap();
    sm.force_disconnected();
    assert_eq!(sm.current(), VpnState::Disconnected);
}

#[test]
fn force_disconnected_is_idempotent() {
    let sm = VpnStateMachine::new();
    sm.force_disconnected();
    sm.force_disconnected();
    assert_eq!(sm.current(), VpnState::Disconnected);
}

// ── is_tunnel_active ──────────────────────────────────────────────────────

#[test]
fn is_tunnel_active_only_when_connected_or_rekeying() {
    let sm = VpnStateMachine::new();
    assert!(!sm.is_tunnel_active()); // Disconnected

    sm.transition(VpnState::Connecting).unwrap();
    assert!(!sm.is_tunnel_active()); // Connecting

    sm.transition(VpnState::Connected).unwrap();
    assert!(sm.is_tunnel_active()); // Connected ✓

    sm.transition(VpnState::Rekeying).unwrap();
    assert!(sm.is_tunnel_active()); // Rekeying ✓

    sm.transition(VpnState::Connected).unwrap();
    sm.transition(VpnState::Disconnected).unwrap();
    assert!(!sm.is_tunnel_active()); // Disconnected
}

// ── Display / serialisation ────────────────────────────────────────────────

#[test]
fn vpn_state_display_strings_are_stable() {
    assert_eq!(VpnState::Disconnected.to_string(), "disconnected");
    assert_eq!(VpnState::Connecting.to_string(), "connecting");
    assert_eq!(VpnState::Connected.to_string(), "connected");
    assert_eq!(VpnState::Rekeying.to_string(), "rekeying");
    assert!(VpnState::Error("boom".to_string())
        .to_string()
        .contains("error"));
}

#[test]
fn vpn_state_serialises_to_json() {
    let s = serde_json::to_string(&VpnState::Connected).expect("serialise");
    // Internally-tagged serde: tag field uses the Rust variant name.
    assert!(s.contains("Connected"), "unexpected JSON for Connected: {}", s);

    let s2 = serde_json::to_string(&VpnState::Error("oops".to_string())).expect("serialise");
    assert!(s2.contains("oops"), "unexpected JSON for Error: {}", s2);
}
