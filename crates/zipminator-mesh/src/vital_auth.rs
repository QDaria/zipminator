//! Vital-Sign Continuous Authentication Session.
//!
//! Maintains a session authenticated by continuous biometric readings from RuView.
//! The session key is refreshed via rolling HMAC over biometric embeddings + QRNG
//! nonces. If biometric drift exceeds the enrolled envelope, the session is killed.
//!
//! Architecture #2 from the Physical Cryptography integration plan.

use hmac::{Hmac, Mac};
use sha2::Sha256;
use zeroize::Zeroize;

type HmacSha256 = Hmac<Sha256>;

/// Errors from the vital-sign auth system.
#[derive(Debug, thiserror::Error)]
pub enum VitalAuthError {
    /// Biometric reading has drifted outside the enrolled envelope.
    #[error("biometric drift detected: distance {distance:.4} exceeds tolerance {tolerance:.4}")]
    BiometricDrift { distance: f64, tolerance: f64 },

    /// Session has been terminated.
    #[error("session terminated")]
    SessionTerminated,

    /// HMAC computation failed.
    #[error("HMAC computation failed")]
    HmacError,
}

/// A biometric profile captured by RuView's WiFi CSI sensing.
///
/// All values are derived from CSI signal analysis, not cameras or wearables.
#[derive(Debug, Clone)]
pub struct BiometricProfile {
    /// Breathing rate in breaths per minute (derived from CSI periodicity).
    pub breathing_rate: f32,
    /// Heart rate in BPM (derived from micro-Doppler in CSI).
    pub heart_rate: f32,
    /// Micro-movement signature — unique body motion pattern from CSI.
    pub micro_movement_signature: [f32; 8],
}

impl BiometricProfile {
    /// Compute Euclidean distance between two biometric profiles.
    ///
    /// Normalizes each dimension to give equal weight:
    /// - Breathing rate: /20 (typical range 12-20)
    /// - Heart rate: /100 (typical range 60-100)
    /// - Micro-movements: already normalized
    fn distance(&self, other: &BiometricProfile) -> f64 {
        let br_diff = ((self.breathing_rate - other.breathing_rate) / 20.0) as f64;
        let hr_diff = ((self.heart_rate - other.heart_rate) / 100.0) as f64;

        let mut mm_diff_sq = 0.0f64;
        for i in 0..8 {
            let d = (self.micro_movement_signature[i] - other.micro_movement_signature[i]) as f64;
            mm_diff_sq += d * d;
        }

        (br_diff * br_diff + hr_diff * hr_diff + mm_diff_sq).sqrt()
    }

    /// Serialize to bytes for HMAC input.
    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = Vec::with_capacity(4 + 4 + 32);
        bytes.extend_from_slice(&self.breathing_rate.to_le_bytes());
        bytes.extend_from_slice(&self.heart_rate.to_le_bytes());
        for &v in &self.micro_movement_signature {
            bytes.extend_from_slice(&v.to_le_bytes());
        }
        bytes
    }
}

/// A vital-sign authenticated session.
///
/// The session key evolves with each biometric update via rolling HMAC.
/// If biometric readings drift outside the enrolled envelope, the session
/// is automatically terminated.
pub struct VitalAuthSession {
    /// The enrolled biometric profile (baseline).
    enrolled_profile: BiometricProfile,
    /// Current session key (evolves with each update).
    session_key: [u8; 32],
    /// Maximum allowed biometric distance before session kill.
    tolerance: f64,
    /// Whether the session is still active.
    alive: bool,
    /// Number of successful updates since enrollment.
    update_count: u64,
}

impl VitalAuthSession {
    /// Create a new session from an initial biometric enrollment and seed key.
    ///
    /// - `enrolled`: The baseline biometric profile.
    /// - `initial_key`: Initial 32-byte session key (from QRNG or key exchange).
    /// - `tolerance`: Maximum allowed biometric distance (0.0-1.0 typical).
    pub fn new(
        enrolled: BiometricProfile,
        initial_key: [u8; 32],
        tolerance: f64,
    ) -> Self {
        Self {
            enrolled_profile: enrolled,
            session_key: initial_key,
            tolerance,
            alive: true,
            update_count: 0,
        }
    }

    /// Update the session with a fresh biometric reading.
    ///
    /// If the reading is within tolerance, the session key evolves via:
    /// `new_key = HMAC-SHA256(current_key, biometric_bytes || nonce)`
    ///
    /// If biometric drift exceeds tolerance, the session is killed.
    pub fn update(
        &mut self,
        fresh: &BiometricProfile,
        nonce: &[u8; 16],
    ) -> Result<(), VitalAuthError> {
        if !self.alive {
            return Err(VitalAuthError::SessionTerminated);
        }

        let distance = self.enrolled_profile.distance(fresh);
        if distance > self.tolerance {
            self.kill();
            return Err(VitalAuthError::BiometricDrift {
                distance,
                tolerance: self.tolerance,
            });
        }

        // Evolve session key via rolling HMAC
        let mut mac = HmacSha256::new_from_slice(&self.session_key)
            .map_err(|_| VitalAuthError::HmacError)?;
        let bio_bytes = fresh.to_bytes();
        mac.update(&bio_bytes);
        mac.update(nonce);
        let result = mac.finalize();
        self.session_key.copy_from_slice(&result.into_bytes());

        self.update_count += 1;
        Ok(())
    }

    /// Check if the session is still alive.
    pub fn is_alive(&self) -> bool {
        self.alive
    }

    /// Get the current session key.
    pub fn session_key(&self) -> &[u8; 32] {
        &self.session_key
    }

    /// Number of successful biometric updates.
    pub fn update_count(&self) -> u64 {
        self.update_count
    }

    /// Manually kill the session and zeroize keys.
    pub fn kill(&mut self) {
        self.alive = false;
        self.session_key.zeroize();
    }
}

impl Drop for VitalAuthSession {
    fn drop(&mut self) {
        self.session_key.zeroize();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_profile(breathing: f32, heart: f32) -> BiometricProfile {
        BiometricProfile {
            breathing_rate: breathing,
            heart_rate: heart,
            micro_movement_signature: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
        }
    }

    fn make_nonce(seed: u8) -> [u8; 16] {
        let mut n = [0u8; 16];
        for (i, b) in n.iter_mut().enumerate() {
            *b = seed.wrapping_add(i as u8);
        }
        n
    }

    #[test]
    fn test_session_creation() {
        let profile = make_profile(16.0, 72.0);
        let key = [0xAA; 32];
        let session = VitalAuthSession::new(profile, key, 0.3);
        assert!(session.is_alive());
        assert_eq!(session.update_count(), 0);
    }

    #[test]
    fn test_update_within_tolerance() {
        let enrolled = make_profile(16.0, 72.0);
        let key = [0xAA; 32];
        let mut session = VitalAuthSession::new(enrolled, key, 0.3);

        // Slightly different readings
        let fresh = make_profile(16.5, 73.0);
        let result = session.update(&fresh, &make_nonce(1));
        assert!(result.is_ok());
        assert!(session.is_alive());
        assert_eq!(session.update_count(), 1);
    }

    #[test]
    fn test_key_evolves_on_update() {
        let enrolled = make_profile(16.0, 72.0);
        let key = [0xAA; 32];
        let mut session = VitalAuthSession::new(enrolled, key, 0.5);

        let initial_key = *session.session_key();
        let fresh = make_profile(16.2, 72.5);
        session.update(&fresh, &make_nonce(1)).unwrap();

        assert_ne!(session.session_key(), &initial_key, "key must evolve after update");
    }

    #[test]
    fn test_different_nonce_different_key() {
        let enrolled = make_profile(16.0, 72.0);
        let fresh = make_profile(16.2, 72.5);
        let key = [0xAA; 32];

        let mut s1 = VitalAuthSession::new(enrolled.clone(), key, 0.5);
        let mut s2 = VitalAuthSession::new(enrolled, key, 0.5);

        s1.update(&fresh, &make_nonce(1)).unwrap();
        s2.update(&fresh, &make_nonce(2)).unwrap();

        assert_ne!(s1.session_key(), s2.session_key(), "different nonces must produce different keys");
    }

    #[test]
    fn test_drift_kills_session() {
        let enrolled = make_profile(16.0, 72.0);
        let key = [0xAA; 32];
        let mut session = VitalAuthSession::new(enrolled, key, 0.1); // Very tight tolerance

        // Way outside tolerance
        let fresh = make_profile(25.0, 120.0);
        let result = session.update(&fresh, &make_nonce(1));
        assert!(result.is_err());
        assert!(!session.is_alive());
    }

    #[test]
    fn test_dead_session_rejects_updates() {
        let enrolled = make_profile(16.0, 72.0);
        let key = [0xAA; 32];
        let mut session = VitalAuthSession::new(enrolled, key, 0.5);
        session.kill();

        let fresh = make_profile(16.0, 72.0);
        let result = session.update(&fresh, &make_nonce(1));
        assert!(matches!(result, Err(VitalAuthError::SessionTerminated)));
    }

    #[test]
    fn test_key_zeroized_on_kill() {
        let enrolled = make_profile(16.0, 72.0);
        let key = [0xAA; 32];
        let mut session = VitalAuthSession::new(enrolled, key, 0.5);
        session.kill();
        assert_eq!(session.session_key(), &[0u8; 32], "key must be zeroized after kill");
    }

    #[test]
    fn test_biometric_distance_identical() {
        let p = make_profile(16.0, 72.0);
        assert!(p.distance(&p) < f64::EPSILON);
    }

    #[test]
    fn test_biometric_distance_different() {
        let p1 = make_profile(16.0, 72.0);
        let p2 = make_profile(20.0, 80.0);
        assert!(p1.distance(&p2) > 0.0);
    }

    #[test]
    fn test_multiple_updates_accumulate() {
        let enrolled = make_profile(16.0, 72.0);
        let key = [0xAA; 32];
        let mut session = VitalAuthSession::new(enrolled, key, 0.5);

        for i in 0..10 {
            let fresh = make_profile(16.0 + i as f32 * 0.1, 72.0);
            session.update(&fresh, &make_nonce(i as u8)).unwrap();
        }
        assert_eq!(session.update_count(), 10);
        assert!(session.is_alive());
    }
}
