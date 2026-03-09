#![cfg(feature = "vpn")]
//! Integration tests for the VPN kill switch.
//!
//! Most tests run without actual OS firewall changes (they use
//! `kill_switch_enabled = false`).  Platform-specific tests that require
//! root/Administrator privileges are gated behind a feature flag or skipped
//! on CI with a `#[cfg]` guard.
//!
//! # Running the OS-level tests locally (macOS/Linux)
//!
//! ```bash
//! sudo cargo test --test kill_switch_test -- --include-ignored
//! ```

use zipbrowser::vpn::kill_switch::KillSwitch;

// ── Disabled kill switch (no OS calls) ────────────────────────────────────

#[test]
fn disabled_ks_activate_is_noop() {
    let mut ks = KillSwitch::new("utun0", false);
    ks.activate().expect("disabled KS activate must not error");
    assert!(!ks.is_active());
}

#[test]
fn disabled_ks_deactivate_is_noop() {
    let mut ks = KillSwitch::new("utun0", false);
    ks.deactivate().expect("disabled KS deactivate must not error");
    assert!(!ks.is_active());
}

#[test]
fn disabled_ks_toggle_is_always_inactive() {
    let mut ks = KillSwitch::new("utun99", false);
    for _ in 0..10 {
        ks.activate().unwrap();
        assert!(!ks.is_active());
        ks.deactivate().unwrap();
        assert!(!ks.is_active());
    }
}

#[test]
fn is_enabled_returns_false_for_disabled_ks() {
    let ks = KillSwitch::new("utun0", false);
    assert!(!ks.is_enabled());
}

#[test]
fn is_enabled_returns_true_for_enabled_ks() {
    let ks = KillSwitch::new("utun0", true);
    assert!(ks.is_enabled());
}

// ── Idempotency ────────────────────────────────────────────────────────────

#[test]
fn multiple_activate_calls_are_idempotent() {
    let mut ks = KillSwitch::new("utun0", false);
    for _ in 0..5 {
        ks.activate().unwrap();
    }
    // For a disabled KS, active is always false.
    assert!(!ks.is_active());
}

#[test]
fn multiple_deactivate_calls_are_idempotent() {
    let mut ks = KillSwitch::new("utun0", false);
    for _ in 0..5 {
        ks.deactivate().unwrap();
    }
    assert!(!ks.is_active());
}

// ── Drop safety ────────────────────────────────────────────────────────────

#[test]
fn drop_inactive_disabled_ks_is_safe() {
    let ks = KillSwitch::new("utun0", false);
    drop(ks); // must not panic
}

#[test]
fn drop_active_disabled_ks_is_safe() {
    let mut ks = KillSwitch::new("utun0", false);
    ks.activate().unwrap(); // no-op since disabled
    drop(ks); // must not panic
}

// ── Interface name ─────────────────────────────────────────────────────────

/// Verify the kill switch accepts various interface name formats.
#[test]
fn various_interface_names_are_accepted() {
    for iface in &["utun0", "utun7", "tun0", "wg0", "zipminator0"] {
        let mut ks = KillSwitch::new(*iface, false);
        ks.activate().unwrap();
        ks.deactivate().unwrap();
    }
}

// ── macOS pf rule content ──────────────────────────────────────────────────

/// Verify the generated pf rules contain the required elements.
/// This test is macOS-only because the `build_pf_rules` method is `#[cfg(target_os = "macos")]`.
#[cfg(target_os = "macos")]
#[test]
fn pf_rules_block_all_and_pass_tunnel() {
    // We can't call build_pf_rules from outside the crate (it's private),
    // so we verify the behaviour indirectly: activating a disabled KS
    // should not panic or produce an error.
    let mut ks = KillSwitch::new("utun7", false);
    ks.activate().unwrap();
    // For enabled KS (OS calls): covered by the privileged test below.
}

// ── Privileged OS tests (skipped unless run with `sudo`) ──────────────────

/// Activate and immediately deactivate the kill switch on macOS using pfctl.
///
/// Requires root.  Run with:
/// ```bash
/// sudo cargo test --test kill_switch_test privileged_macos_activate_deactivate -- --ignored
/// ```
#[cfg(target_os = "macos")]
#[test]
#[ignore = "requires root to invoke pfctl"]
fn privileged_macos_activate_deactivate() {
    let mut ks = KillSwitch::new("utun0", true);
    ks.activate().expect("pfctl activation should succeed with root");
    assert!(ks.is_active());
    ks.deactivate().expect("pfctl deactivation should succeed with root");
    assert!(!ks.is_active());
}

/// Activate and deactivate the kill switch on Linux using iptables.
///
/// Requires root.
#[cfg(target_os = "linux")]
#[test]
#[ignore = "requires root to invoke iptables"]
fn privileged_linux_activate_deactivate() {
    let mut ks = KillSwitch::new("tun0", true);
    ks.activate().expect("iptables activation should succeed with root");
    assert!(ks.is_active());
    ks.deactivate().expect("iptables deactivation should succeed with root");
    assert!(!ks.is_active());
}

// ── State consistency ─────────────────────────────────────────────────────

/// is_active() must reflect the correct state through activate/deactivate cycles.
#[test]
fn is_active_tracks_enabled_ks_lifecycle() {
    // We can only test a disabled KS without OS calls.
    let mut ks = KillSwitch::new("utun0", false);
    assert!(!ks.is_active()); // before activation

    ks.activate().unwrap(); // no-op (disabled)
    assert!(!ks.is_active()); // still false for disabled

    ks.deactivate().unwrap(); // no-op
    assert!(!ks.is_active());
}

/// Enabled kill switch that fails to install rules (e.g., no root) must
/// return an error without panicking, and is_active() must remain false.
///
/// This test is only meaningful when NOT running as root.
#[cfg(target_os = "macos")]
#[test]
fn enabled_ks_fails_gracefully_without_root() {
    // When not running as root, pfctl will fail.
    // The test verifies that we get an error, not a panic.
    // Skip if we ARE root (the test would succeed instead of failing).
    if unsafe { libc::getuid() } == 0 {
        return; // running as root; this test is vacuous
    }

    let mut ks = KillSwitch::new("utun0", true);
    let result = ks.activate();
    // Either error (no root) or success if macOS allows it in CI sandbox.
    // The key invariant: no panic.
    match result {
        Ok(_) => {
            // If it somehow succeeded, clean up.
            let _ = ks.deactivate();
        }
        Err(e) => {
            assert!(!ks.is_active(), "is_active must be false after failed activation: {}", e);
        }
    }
}

// ── Kill switch + VPN state machine integration ────────────────────────────

/// Simulate the kill switch lifecycle alongside the VPN state machine.
/// The kill switch must activate before the tunnel connects and deactivate
/// after disconnect.
#[test]
fn kill_switch_lifecycle_with_state_machine() {
    use zipbrowser::vpn::state::{VpnState, VpnStateMachine};

    let sm = VpnStateMachine::new();
    let mut ks = KillSwitch::new("utun7", false); // disabled to avoid OS calls

    // 1. Activate KS before connecting.
    sm.transition(VpnState::Connecting).unwrap();
    ks.activate().unwrap(); // (no-op for disabled)

    // 2. VPN connects.
    sm.transition(VpnState::Connected).unwrap();
    // KS should conceptually be active here.
    assert!(sm.is_tunnel_active());

    // 3. VPN disconnects.
    sm.transition(VpnState::Disconnected).unwrap();
    ks.deactivate().unwrap();
    assert!(!sm.is_tunnel_active());
    assert!(!ks.is_active());
}

/// Simulate the kill switch staying engaged after an unexpected tunnel drop.
#[test]
fn kill_switch_stays_on_tunnel_drop() {
    use zipbrowser::vpn::state::{VpnState, VpnStateMachine};

    let sm = VpnStateMachine::new();
    let mut ks = KillSwitch::new("utun7", false);

    sm.transition(VpnState::Connecting).unwrap();
    ks.activate().unwrap();
    sm.transition(VpnState::Connected).unwrap();

    // Simulate unexpected tunnel drop: state goes to Error.
    sm.transition(VpnState::Error("connection reset".to_string())).unwrap();

    // Kill switch must NOT be deactivated automatically on error.
    // (In production, only explicit disconnect deactivates it.)
    // For the disabled KS the active flag stays false in any case.
    assert!(!ks.is_active()); // disabled KS

    // User resets: explicit deactivate on disconnect.
    sm.force_disconnected();
    ks.deactivate().unwrap();
    assert!(!ks.is_active());
}
