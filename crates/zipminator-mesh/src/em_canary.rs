//! EM Canary Session Controller: responds to electromagnetic anomaly events.
//!
//! When RuView detects eigenstructure deviation (indicating physical environment
//! change — new person, equipment, jamming), the session controller escalates
//! through threat levels: Normal → Elevated → High → Critical.
//!
//! Architecture #4 from the Physical Cryptography integration plan.

/// Re-export for callers who need the key type in EM Canary context.
pub use crate::mesh_key::MeshKey;

/// Threat levels representing the severity of EM anomaly detection.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum ThreatLevel {
    /// No anomaly detected. Normal operations.
    Normal = 0,
    /// Minor deviation detected. Shorten key rotation interval.
    Elevated = 1,
    /// Significant deviation. Immediate re-keying required.
    High = 2,
    /// Critical deviation. Session termination + key destruction.
    Critical = 3,
}

/// Action to take in response to a threat assessment.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ThreatAction {
    /// No action needed.
    NoOp,
    /// Rotate session keys to limit exposure window.
    RotateKeys,
    /// Terminate the current session.
    TerminateSession,
    /// Destroy all session keys and terminate.
    DestroyKeys,
}

/// Policy configuration for the EM Canary.
#[derive(Debug, Clone)]
pub struct EmCanaryPolicy {
    /// Eigenstructure deviation percentage to trigger Elevated (0.0-1.0).
    pub elevated_threshold: f64,
    /// Eigenstructure deviation percentage to trigger High (0.0-1.0).
    pub high_threshold: f64,
    /// Eigenstructure deviation percentage to trigger Critical (0.0-1.0).
    pub critical_threshold: f64,
    /// Whether to automatically rekey on Elevated threat.
    pub rekey_on_elevated: bool,
    /// Whether to terminate session on Critical threat.
    pub terminate_on_critical: bool,
    /// Maximum consecutive anomaly events before forced escalation.
    pub max_consecutive_anomalies: u32,
}

impl Default for EmCanaryPolicy {
    fn default() -> Self {
        Self {
            elevated_threshold: 0.10,  // 10% deviation
            high_threshold: 0.25,      // 25% deviation
            critical_threshold: 0.50,  // 50% deviation
            rekey_on_elevated: true,
            terminate_on_critical: true,
            max_consecutive_anomalies: 5,
        }
    }
}

/// EM Canary session controller.
///
/// Tracks the current threat level and enforces policy-driven actions
/// in response to EM anomaly events from RuView.
pub struct EmCanaryController {
    policy: EmCanaryPolicy,
    current_threat: ThreatLevel,
    consecutive_anomalies: u32,
    session_alive: bool,
    keys_destroyed: bool,
}

impl EmCanaryController {
    /// Create a new controller with the given policy. Session starts alive.
    pub fn new(policy: EmCanaryPolicy) -> Self {
        Self {
            policy,
            current_threat: ThreatLevel::Normal,
            consecutive_anomalies: 0,
            session_alive: true,
            keys_destroyed: false,
        }
    }

    /// Create with default policy.
    pub fn with_defaults() -> Self {
        Self::new(EmCanaryPolicy::default())
    }

    /// Current threat level.
    pub fn threat_level(&self) -> ThreatLevel {
        self.current_threat
    }

    /// Whether the session is still alive.
    pub fn is_alive(&self) -> bool {
        self.session_alive
    }

    /// Whether keys have been destroyed.
    pub fn keys_destroyed(&self) -> bool {
        self.keys_destroyed
    }

    /// Process an anomaly event with the given eigenstructure deviation.
    ///
    /// `deviation` is a value from 0.0 (no change) to 1.0+ (complete change).
    /// Returns the action the caller should take.
    pub fn on_anomaly(&mut self, deviation: f64) -> ThreatAction {
        if !self.session_alive {
            return ThreatAction::NoOp;
        }

        self.consecutive_anomalies += 1;

        // Classify threat level based on deviation magnitude
        let new_threat = if deviation >= self.policy.critical_threshold {
            ThreatLevel::Critical
        } else if deviation >= self.policy.high_threshold {
            ThreatLevel::High
        } else if deviation >= self.policy.elevated_threshold {
            ThreatLevel::Elevated
        } else {
            // Below all thresholds — anomaly event but minor
            self.consecutive_anomalies = 0;
            self.current_threat = ThreatLevel::Normal;
            return ThreatAction::NoOp;
        };

        // Forced escalation on consecutive anomalies
        let effective_threat = if self.consecutive_anomalies >= self.policy.max_consecutive_anomalies
            && new_threat < ThreatLevel::Critical
        {
            ThreatLevel::Critical
        } else {
            new_threat
        };

        self.current_threat = effective_threat;

        match effective_threat {
            ThreatLevel::Normal => ThreatAction::NoOp,
            ThreatLevel::Elevated => {
                if self.policy.rekey_on_elevated {
                    ThreatAction::RotateKeys
                } else {
                    ThreatAction::NoOp
                }
            }
            ThreatLevel::High => ThreatAction::RotateKeys,
            ThreatLevel::Critical => {
                if self.policy.terminate_on_critical {
                    self.session_alive = false;
                    self.keys_destroyed = true;
                    ThreatAction::DestroyKeys
                } else {
                    ThreatAction::TerminateSession
                }
            }
        }
    }

    /// Signal that the environment has returned to normal.
    ///
    /// De-escalates threat level and resets the consecutive anomaly counter.
    pub fn on_clear(&mut self) -> ThreatAction {
        if !self.session_alive {
            return ThreatAction::NoOp;
        }

        self.consecutive_anomalies = 0;

        let previous = self.current_threat;
        self.current_threat = ThreatLevel::Normal;

        // If we were at High, recommend a final rekey as precaution
        if previous >= ThreatLevel::High {
            ThreatAction::RotateKeys
        } else {
            ThreatAction::NoOp
        }
    }

    /// Signal that session keys should be destroyed.
    ///
    /// The caller should drop (or replace) their `MeshKey` values after
    /// receiving `ThreatAction::DestroyKeys`. `MeshKey` implements
    /// `ZeroizeOnDrop`, so dropping is sufficient for secure cleanup.
    pub fn should_destroy_keys(&self) -> bool {
        self.keys_destroyed
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_policy() {
        let policy = EmCanaryPolicy::default();
        assert_eq!(policy.elevated_threshold, 0.10);
        assert_eq!(policy.high_threshold, 0.25);
        assert_eq!(policy.critical_threshold, 0.50);
        assert!(policy.rekey_on_elevated);
        assert!(policy.terminate_on_critical);
    }

    #[test]
    fn test_normal_deviation_no_action() {
        let mut ctrl = EmCanaryController::with_defaults();
        let action = ctrl.on_anomaly(0.05); // Below elevated threshold
        assert_eq!(action, ThreatAction::NoOp);
        assert_eq!(ctrl.threat_level(), ThreatLevel::Normal);
        assert!(ctrl.is_alive());
    }

    #[test]
    fn test_elevated_triggers_rekey() {
        let mut ctrl = EmCanaryController::with_defaults();
        let action = ctrl.on_anomaly(0.15); // Between elevated and high
        assert_eq!(action, ThreatAction::RotateKeys);
        assert_eq!(ctrl.threat_level(), ThreatLevel::Elevated);
        assert!(ctrl.is_alive());
    }

    #[test]
    fn test_high_triggers_rekey() {
        let mut ctrl = EmCanaryController::with_defaults();
        let action = ctrl.on_anomaly(0.30); // Between high and critical
        assert_eq!(action, ThreatAction::RotateKeys);
        assert_eq!(ctrl.threat_level(), ThreatLevel::High);
        assert!(ctrl.is_alive());
    }

    #[test]
    fn test_critical_destroys_keys() {
        let mut ctrl = EmCanaryController::with_defaults();
        let action = ctrl.on_anomaly(0.60); // Above critical threshold
        assert_eq!(action, ThreatAction::DestroyKeys);
        assert_eq!(ctrl.threat_level(), ThreatLevel::Critical);
        assert!(!ctrl.is_alive());
        assert!(ctrl.keys_destroyed());
    }

    #[test]
    fn test_dead_session_no_action() {
        let mut ctrl = EmCanaryController::with_defaults();
        ctrl.on_anomaly(0.60); // Kill the session
        assert!(!ctrl.is_alive());
        let action = ctrl.on_anomaly(0.60);
        assert_eq!(action, ThreatAction::NoOp); // Already dead
    }

    #[test]
    fn test_clear_deescalates() {
        let mut ctrl = EmCanaryController::with_defaults();
        ctrl.on_anomaly(0.30); // High
        assert_eq!(ctrl.threat_level(), ThreatLevel::High);

        let action = ctrl.on_clear();
        assert_eq!(action, ThreatAction::RotateKeys); // Precautionary rekey
        assert_eq!(ctrl.threat_level(), ThreatLevel::Normal);
    }

    #[test]
    fn test_consecutive_anomalies_force_escalation() {
        let policy = EmCanaryPolicy {
            max_consecutive_anomalies: 3,
            ..EmCanaryPolicy::default()
        };
        let mut ctrl = EmCanaryController::new(policy);

        // 3 consecutive elevated anomalies should escalate to critical
        ctrl.on_anomaly(0.15);
        ctrl.on_anomaly(0.15);
        let action = ctrl.on_anomaly(0.15);
        assert_eq!(action, ThreatAction::DestroyKeys);
        assert!(!ctrl.is_alive());
    }

    #[test]
    fn test_clear_resets_consecutive_counter() {
        let policy = EmCanaryPolicy {
            max_consecutive_anomalies: 3,
            ..EmCanaryPolicy::default()
        };
        let mut ctrl = EmCanaryController::new(policy);

        ctrl.on_anomaly(0.15); // count: 1
        ctrl.on_anomaly(0.15); // count: 2
        ctrl.on_clear();       // resets counter

        // Should not escalate because counter was reset
        let action = ctrl.on_anomaly(0.15); // count: 1
        assert_eq!(action, ThreatAction::RotateKeys);
        assert!(ctrl.is_alive());
    }

    #[test]
    fn test_elevated_without_rekey_policy() {
        let policy = EmCanaryPolicy {
            rekey_on_elevated: false,
            ..EmCanaryPolicy::default()
        };
        let mut ctrl = EmCanaryController::new(policy);
        let action = ctrl.on_anomaly(0.15);
        assert_eq!(action, ThreatAction::NoOp);
        assert_eq!(ctrl.threat_level(), ThreatLevel::Elevated);
    }
}
