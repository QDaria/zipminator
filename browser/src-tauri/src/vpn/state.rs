//! VPN state machine with thread-safe transitions and Tauri event emission.
//!
//! The state machine governs valid transitions among five states.  Invalid
//! transitions (e.g. jumping directly from `Disconnected` to `Rekeying`)
//! return a [`StateError`] without mutating the state.
//!
//! Every successful transition emits a `vpn-state-changed` Tauri event so
//! the browser chrome can update the status bar in real time.
//!
//! ```text
//! Disconnected ──connect──→ Connecting ──tunnel_up──→ Connected
//!                                                         │
//!              ←──disconnect──────────────────────────────┤
//!                                                         │
//!                                              ──rekey──→ Rekeying ──done──→ Connected
//!                                                         │
//!              ←──error────────────────────────────────── Error(msg)
//! ```

use serde::{Deserialize, Serialize};
use std::sync::{Arc, RwLock};
use thiserror::Error;
use tracing::{info, warn};

// ── VpnState ───────────────────────────────────────────────────────────────

/// All possible states of the PQ-WireGuard VPN tunnel.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "state", content = "detail")]
pub enum VpnState {
    /// No tunnel is active; safe to call `connect()`.
    Disconnected,
    /// Tunnel negotiation in progress (WireGuard handshake + PQ exchange).
    Connecting,
    /// Tunnel is active and all traffic is flowing through it.
    Connected,
    /// Performing a Kyber768 rekey; existing tunnel remains up during this phase.
    Rekeying,
    /// An unrecoverable error occurred.  Call `disconnect()` to reset.
    Error(String),
}

impl std::fmt::Display for VpnState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Disconnected => write!(f, "disconnected"),
            Self::Connecting => write!(f, "connecting"),
            Self::Connected => write!(f, "connected"),
            Self::Rekeying => write!(f, "rekeying"),
            Self::Error(msg) => write!(f, "error: {}", msg),
        }
    }
}

// ── StateError ─────────────────────────────────────────────────────────────

/// Errors produced by invalid state transitions.
#[derive(Debug, Error)]
pub enum StateError {
    #[error("invalid transition from {from} to {to}")]
    InvalidTransition { from: String, to: String },

    #[error("state lock poisoned")]
    LockPoisoned,
}

// ── Valid transition table ──────────────────────────────────────────────────

/// Return `true` when transitioning from `from` to `to` is a valid step.
fn is_valid_transition(from: &VpnState, to: &VpnState) -> bool {
    use VpnState::*;
    matches!(
        (from, to),
        (Disconnected, Connecting)   // user calls connect()
        | (Connecting, Connected)    // WireGuard + PQ handshake done
        | (Connecting, Error(_))     // handshake failed
        | (Connecting, Disconnected) // user cancelled during connect
        | (Connected, Rekeying)      // periodic rekey starts
        | (Connected, Disconnected)  // user or kill switch disconnects
        | (Connected, Error(_))      // tunnel error detected
        | (Rekeying, Connected)      // rekey succeeded
        | (Rekeying, Error(_))       // rekey failed
        | (Rekeying, Disconnected)   // user disconnects during rekey
        | (Error(_), Disconnected)   // reset after error
        | (Error(_), Connecting)     // retry after error
    )
}

// ── VpnStateMachine ────────────────────────────────────────────────────────

/// Thread-safe VPN state machine.
///
/// Clone the `Arc` to share across async tasks; the inner `RwLock` serialises
/// writes while allowing concurrent reads.
#[derive(Clone)]
pub struct VpnStateMachine {
    inner: Arc<RwLock<VpnState>>,
}

impl VpnStateMachine {
    /// Create a new state machine, initially `Disconnected`.
    pub fn new() -> Self {
        Self {
            inner: Arc::new(RwLock::new(VpnState::Disconnected)),
        }
    }

    /// Return a snapshot of the current state.
    ///
    /// # Panics
    /// Panics if the lock is poisoned (should never happen under normal use).
    pub fn current(&self) -> VpnState {
        self.inner
            .read()
            .expect("VPN state lock poisoned on read")
            .clone()
    }

    /// Attempt to transition to `next_state`.
    ///
    /// Emits a `tracing` log line on every successful transition.
    /// The Tauri `app_handle` event is emitted by the caller (in `mod.rs`)
    /// after this returns `Ok`, so this function remains dependency-free.
    ///
    /// # Errors
    /// Returns [`StateError::InvalidTransition`] if the transition is not
    /// permitted by the state machine table.
    pub fn transition(&self, next_state: VpnState) -> Result<VpnState, StateError> {
        let mut lock = self
            .inner
            .write()
            .map_err(|_| StateError::LockPoisoned)?;

        let current = lock.clone();

        if !is_valid_transition(&current, &next_state) {
            warn!(
                from = %current,
                to   = %next_state,
                "rejected invalid VPN state transition"
            );
            return Err(StateError::InvalidTransition {
                from: current.to_string(),
                to: next_state.to_string(),
            });
        }

        info!(from = %current, to = %next_state, "VPN state transition");
        *lock = next_state.clone();
        Ok(next_state)
    }

    /// Force the state to `Disconnected` regardless of the current state.
    ///
    /// Used only by the kill switch and crash recovery paths where a clean
    /// transition is not possible.
    pub fn force_disconnected(&self) {
        if let Ok(mut lock) = self.inner.write() {
            let current = lock.clone();
            warn!(from = %current, "VPN state forced to Disconnected (kill switch / crash)");
            *lock = VpnState::Disconnected;
        }
    }

    /// Return `true` when the VPN is in `Connected` or `Rekeying` state —
    /// i.e. the tunnel is expected to be carrying traffic.
    pub fn is_tunnel_active(&self) -> bool {
        matches!(
            self.inner.read().map(|s| s.clone()),
            Ok(VpnState::Connected) | Ok(VpnState::Rekeying)
        )
    }
}

impl Default for VpnStateMachine {
    fn default() -> Self {
        Self::new()
    }
}

// ── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn initial_state_is_disconnected() {
        let sm = VpnStateMachine::new();
        assert_eq!(sm.current(), VpnState::Disconnected);
    }

    #[test]
    fn connect_flow_transitions_correctly() {
        let sm = VpnStateMachine::new();
        sm.transition(VpnState::Connecting).unwrap();
        sm.transition(VpnState::Connected).unwrap();
        assert_eq!(sm.current(), VpnState::Connected);
    }

    #[test]
    fn rekey_cycle_transitions_correctly() {
        let sm = VpnStateMachine::new();
        sm.transition(VpnState::Connecting).unwrap();
        sm.transition(VpnState::Connected).unwrap();
        sm.transition(VpnState::Rekeying).unwrap();
        sm.transition(VpnState::Connected).unwrap();
        assert_eq!(sm.current(), VpnState::Connected);
    }

    #[test]
    fn disconnect_from_connected() {
        let sm = VpnStateMachine::new();
        sm.transition(VpnState::Connecting).unwrap();
        sm.transition(VpnState::Connected).unwrap();
        sm.transition(VpnState::Disconnected).unwrap();
        assert_eq!(sm.current(), VpnState::Disconnected);
    }

    #[test]
    fn error_then_reset() {
        let sm = VpnStateMachine::new();
        sm.transition(VpnState::Connecting).unwrap();
        sm.transition(VpnState::Error("timeout".to_string())).unwrap();
        sm.transition(VpnState::Disconnected).unwrap();
        assert_eq!(sm.current(), VpnState::Disconnected);
    }

    #[test]
    fn invalid_transition_disconnected_to_rekeying() {
        let sm = VpnStateMachine::new();
        let err = sm.transition(VpnState::Rekeying).unwrap_err();
        assert!(matches!(err, StateError::InvalidTransition { .. }));
        // State must not have changed.
        assert_eq!(sm.current(), VpnState::Disconnected);
    }

    #[test]
    fn invalid_transition_disconnected_to_connected() {
        let sm = VpnStateMachine::new();
        let err = sm.transition(VpnState::Connected).unwrap_err();
        assert!(matches!(err, StateError::InvalidTransition { .. }));
    }

    #[test]
    fn is_tunnel_active_true_when_connected() {
        let sm = VpnStateMachine::new();
        sm.transition(VpnState::Connecting).unwrap();
        sm.transition(VpnState::Connected).unwrap();
        assert!(sm.is_tunnel_active());
    }

    #[test]
    fn is_tunnel_active_true_when_rekeying() {
        let sm = VpnStateMachine::new();
        sm.transition(VpnState::Connecting).unwrap();
        sm.transition(VpnState::Connected).unwrap();
        sm.transition(VpnState::Rekeying).unwrap();
        assert!(sm.is_tunnel_active());
    }

    #[test]
    fn is_tunnel_active_false_when_disconnected() {
        let sm = VpnStateMachine::new();
        assert!(!sm.is_tunnel_active());
    }

    #[test]
    fn force_disconnected_from_any_state() {
        let sm = VpnStateMachine::new();
        sm.transition(VpnState::Connecting).unwrap();
        sm.transition(VpnState::Connected).unwrap();
        sm.force_disconnected();
        assert_eq!(sm.current(), VpnState::Disconnected);
    }

    #[test]
    fn retry_after_error_via_connecting() {
        let sm = VpnStateMachine::new();
        sm.transition(VpnState::Connecting).unwrap();
        sm.transition(VpnState::Error("handshake timed out".to_string())).unwrap();
        sm.transition(VpnState::Connecting).unwrap();
        sm.transition(VpnState::Connected).unwrap();
        assert_eq!(sm.current(), VpnState::Connected);
    }

    #[test]
    fn state_machine_is_clone_and_shared() {
        let sm = VpnStateMachine::new();
        let sm2 = sm.clone();
        sm.transition(VpnState::Connecting).unwrap();
        // Clone shares the same inner Arc<RwLock<_>>.
        assert_eq!(sm2.current(), VpnState::Connecting);
    }
}
