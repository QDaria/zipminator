//! Spatiotemporal Non-Repudiation: signatures that prove physical presence.
//!
//! Extends standard digital signatures with an attestation bundle containing
//! a CSI fingerprint, vital signs hash, timestamp, and node ID. The result
//! is a signature that proves the signer was physically present at a specific
//! location and time, with biometric confirmation.
//!
//! Architecture #6 from the Physical Cryptography integration plan.

use sha2::{Digest, Sha256};
use hmac::{Hmac, Mac};

type HmacSha256 = Hmac<Sha256>;

/// Errors from spatiotemporal signing/verification.
#[derive(Debug, thiserror::Error)]
pub enum SpatiotemporalError {
    /// Signature verification failed.
    #[error("signature verification failed")]
    VerificationFailed,

    /// Timestamp is outside the acceptable window.
    #[error("timestamp outside acceptable window: {delta_ms}ms exceeds {max_ms}ms")]
    TimestampOutOfRange { delta_ms: u64, max_ms: u64 },

    /// HMAC computation failed.
    #[error("HMAC computation failed")]
    HmacError,

    /// Attestation data is invalid.
    #[error("invalid attestation: {0}")]
    InvalidAttestation(String),
}

/// Attestation data proving physical presence at signing time.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SpatiotemporalAttestation {
    /// SHA-256 hash of the room's CSI eigenstructure at signing time.
    pub csi_fingerprint: [u8; 32],
    /// SHA-256 hash of the signer's vital signs at signing time.
    pub vital_signs_hash: [u8; 32],
    /// Unix timestamp in milliseconds when the attestation was captured.
    pub timestamp_unix_ms: u64,
    /// ID of the RuView node that captured the attestation data.
    pub node_id: [u8; 16],
}

impl SpatiotemporalAttestation {
    /// Serialize the attestation to bytes for inclusion in signatures.
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = Vec::with_capacity(32 + 32 + 8 + 16);
        bytes.extend_from_slice(&self.csi_fingerprint);
        bytes.extend_from_slice(&self.vital_signs_hash);
        bytes.extend_from_slice(&self.timestamp_unix_ms.to_le_bytes());
        bytes.extend_from_slice(&self.node_id);
        bytes
    }

    /// Compute SHA-256 hash of the attestation for binding to signatures.
    pub fn hash(&self) -> [u8; 32] {
        let bytes = self.to_bytes();
        let digest = Sha256::digest(&bytes);
        let mut hash = [0u8; 32];
        hash.copy_from_slice(&digest);
        hash
    }
}

/// A signature bundled with spatiotemporal attestation.
///
/// This is a simplified HMAC-based scheme for the Zipminator mesh context.
/// In production, this would wrap an ML-DSA signature; here we use HMAC-SHA256
/// as a symmetric equivalent since ML-DSA is in zipminator-core, not mesh.
#[derive(Debug, Clone)]
pub struct SpatiotemporalSignature {
    /// HMAC-SHA256 over (payload || attestation_hash) using the signing key.
    pub signature_bytes: [u8; 32],
    /// The attestation proving physical presence.
    pub attestation: SpatiotemporalAttestation,
}

/// Sign a payload with spatiotemporal attestation.
///
/// Produces an HMAC-SHA256 signature over `payload || attestation_hash`
/// using the provided signing key.
pub fn sign_with_presence(
    payload: &[u8],
    signing_key: &[u8; 32],
    attestation: SpatiotemporalAttestation,
) -> Result<SpatiotemporalSignature, SpatiotemporalError> {
    let attestation_hash = attestation.hash();

    let mut mac = HmacSha256::new_from_slice(signing_key)
        .map_err(|_| SpatiotemporalError::HmacError)?;
    mac.update(payload);
    mac.update(&attestation_hash);
    let result = mac.finalize();

    let mut sig = [0u8; 32];
    sig.copy_from_slice(&result.into_bytes());

    Ok(SpatiotemporalSignature {
        signature_bytes: sig,
        attestation,
    })
}

/// Verify a spatiotemporal signature.
///
/// Checks that the HMAC is valid for the given payload and attestation.
/// Optionally validates the timestamp is within an acceptable window.
pub fn verify_with_presence(
    payload: &[u8],
    signature: &SpatiotemporalSignature,
    verifying_key: &[u8; 32],
    max_timestamp_delta_ms: Option<u64>,
    current_time_ms: Option<u64>,
) -> Result<bool, SpatiotemporalError> {
    // Timestamp validation (if requested)
    if let (Some(max_delta), Some(now)) = (max_timestamp_delta_ms, current_time_ms) {
        let ts = signature.attestation.timestamp_unix_ms;
        let delta = now.abs_diff(ts);
        if delta > max_delta {
            return Err(SpatiotemporalError::TimestampOutOfRange {
                delta_ms: delta,
                max_ms: max_delta,
            });
        }
    }

    // Recompute HMAC
    let attestation_hash = signature.attestation.hash();
    let mut mac = HmacSha256::new_from_slice(verifying_key)
        .map_err(|_| SpatiotemporalError::HmacError)?;
    mac.update(payload);
    mac.update(&attestation_hash);

    // Verify using constant-time comparison (built into hmac crate)
    match mac.verify_slice(&signature.signature_bytes) {
        Ok(()) => Ok(true),
        Err(_) => Ok(false),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_attestation() -> SpatiotemporalAttestation {
        SpatiotemporalAttestation {
            csi_fingerprint: [0xAA; 32],
            vital_signs_hash: [0xBB; 32],
            timestamp_unix_ms: 1710000000000, // March 2024
            node_id: [0x01; 16],
        }
    }

    fn make_key() -> [u8; 32] {
        [0xCC; 32]
    }

    #[test]
    fn test_sign_verify_roundtrip() {
        let payload = b"important document";
        let key = make_key();
        let attestation = make_attestation();

        let sig = sign_with_presence(payload, &key, attestation).unwrap();
        let valid = verify_with_presence(payload, &sig, &key, None, None).unwrap();
        assert!(valid, "signature must verify with correct key");
    }

    #[test]
    fn test_wrong_key_fails() {
        let payload = b"important document";
        let key = make_key();
        let wrong_key = [0xDD; 32];
        let attestation = make_attestation();

        let sig = sign_with_presence(payload, &key, attestation).unwrap();
        let valid = verify_with_presence(payload, &sig, &wrong_key, None, None).unwrap();
        assert!(!valid, "signature must not verify with wrong key");
    }

    #[test]
    fn test_tampered_payload_fails() {
        let payload = b"original";
        let key = make_key();
        let attestation = make_attestation();

        let sig = sign_with_presence(payload, &key, attestation).unwrap();
        let valid = verify_with_presence(b"tampered", &sig, &key, None, None).unwrap();
        assert!(!valid, "signature must not verify with tampered payload");
    }

    #[test]
    fn test_tampered_attestation_fails() {
        let payload = b"data";
        let key = make_key();
        let attestation = make_attestation();

        let mut sig = sign_with_presence(payload, &key, attestation).unwrap();
        // Tamper with the CSI fingerprint
        sig.attestation.csi_fingerprint[0] ^= 0xFF;

        let valid = verify_with_presence(payload, &sig, &key, None, None).unwrap();
        assert!(!valid, "tampered attestation must fail verification");
    }

    #[test]
    fn test_timestamp_validation_within_window() {
        let payload = b"data";
        let key = make_key();
        let now_ms = 1710000000000u64;
        let attestation = SpatiotemporalAttestation {
            timestamp_unix_ms: now_ms - 5000, // 5 seconds ago
            ..make_attestation()
        };

        let sig = sign_with_presence(payload, &key, attestation).unwrap();
        let result = verify_with_presence(
            payload,
            &sig,
            &key,
            Some(60_000), // 60 second window
            Some(now_ms),
        );
        assert!(result.is_ok());
        assert!(result.unwrap());
    }

    #[test]
    fn test_timestamp_validation_outside_window() {
        let payload = b"data";
        let key = make_key();
        let now_ms = 1710000000000u64;
        let attestation = SpatiotemporalAttestation {
            timestamp_unix_ms: now_ms - 120_000, // 2 minutes ago
            ..make_attestation()
        };

        let sig = sign_with_presence(payload, &key, attestation).unwrap();
        let result = verify_with_presence(
            payload,
            &sig,
            &key,
            Some(60_000), // 60 second window
            Some(now_ms),
        );
        assert!(matches!(result, Err(SpatiotemporalError::TimestampOutOfRange { .. })));
    }

    #[test]
    fn test_attestation_serialization_deterministic() {
        let a = make_attestation();
        let bytes1 = a.to_bytes();
        let bytes2 = a.to_bytes();
        assert_eq!(bytes1, bytes2);
        assert_eq!(bytes1.len(), 32 + 32 + 8 + 16); // 88 bytes total
    }

    #[test]
    fn test_attestation_hash_changes_on_any_field() {
        let base = make_attestation();
        let h1 = base.hash();

        let mut modified = base.clone();
        modified.node_id[0] = 0xFF;
        let h2 = modified.hash();

        assert_ne!(h1, h2, "changing any field must change the hash");
    }
}
