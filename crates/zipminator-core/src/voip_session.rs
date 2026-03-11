//! VoIP Session Manager — PQ-SRTP key exchange over WebRTC signaling
//!
//! Connects Kyber768 KEM to SRTP key derivation, producing SDP extensions
//! that carry PQ key material alongside standard WebRTC offer/answer flow.
//!
//! # Protocol
//! 1. Offerer generates Kyber768 keypair, embeds public key in SDP offer
//! 2. Answerer encapsulates against offerer's public key, embeds ciphertext in SDP answer
//! 3. Both sides derive sender/receiver SRTP keys from the shared secret

use base64::{engine::general_purpose::STANDARD as B64, Engine};
use sha2::{Digest, Sha256};

use crate::kyber768::{Kyber768, PublicKey, SecretKey};
use crate::srtp::{derive_srtp_keys_labeled, SrtpKeyMaterial};

/// Session lifecycle states.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SessionState {
    Idle,
    Offering,
    Answering,
    Connected,
    Ended,
}

/// A VoIP session with PQ-SRTP key material.
pub struct VoipSession {
    pub session_id: u64,
    pub peer_id: Option<String>,
    pub state: SessionState,
    pub local_keys: SrtpKeyMaterial,
    pub remote_keys: Option<SrtpKeyMaterial>,
    /// Shared secret bytes (32), kept until handshake completes.
    shared_secret: Option<[u8; 32]>,
    /// Offerer retains the secret key until the answer arrives.
    local_sk: Option<SecretKey>,
}

impl std::fmt::Debug for VoipSession {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("VoipSession")
            .field("session_id", &self.session_id)
            .field("peer_id", &self.peer_id)
            .field("state", &self.state)
            .field("local_keys", &self.local_keys)
            .field("remote_keys", &self.remote_keys)
            .field("local_sk", &self.local_sk.as_ref().map(|_| "[REDACTED]"))
            .finish()
    }
}

/// SDP extension carrying PQ key material.
#[derive(Debug, Clone)]
pub struct SdpPqExtension {
    /// `a=pq-kem:ML-KEM-768 <base64 pk>`
    pub kem_line: String,
    /// `a=pq-ct:<base64 ct>` (answer only)
    pub ct_line: Option<String>,
    /// `a=pq-srtp-key-fingerprint:<hex sha256>`
    pub fingerprint_line: String,
}

/// Offer payload returned by `create_offer`.
#[derive(Debug)]
pub struct SdpOffer {
    pub session_id: u64,
    pub pq_ext: SdpPqExtension,
    /// Raw public key bytes for the answerer.
    pub pk_bytes: Vec<u8>,
}

/// Answer payload returned by `accept_offer`.
#[derive(Debug)]
pub struct SdpAnswer {
    pub session_id: u64,
    pub pq_ext: SdpPqExtension,
    /// Raw ciphertext bytes for the offerer.
    pub ct_bytes: Vec<u8>,
}

/// Manages VoIP sessions with PQ key exchange.
pub struct VoipSessionManager {
    next_id: u64,
}

impl VoipSessionManager {
    pub fn new() -> Self {
        Self { next_id: 1 }
    }

    /// Create an SDP offer with a fresh Kyber768 public key.
    pub fn create_offer(&mut self) -> (VoipSession, SdpOffer) {
        let id = self.next_id;
        self.next_id += 1;

        let (pk, sk) = Kyber768::keypair();

        // Derive placeholder local keys from a zero secret (will be replaced on handshake)
        let placeholder_ss = [0u8; 32];
        let local_keys = derive_srtp_keys_labeled(&placeholder_ss, b"offerer");

        let pk_b64 = B64.encode(&pk.data);
        let fingerprint = hex_sha256(&pk.data);

        let pq_ext = SdpPqExtension {
            kem_line: format!("a=pq-kem:ML-KEM-768 {pk_b64}"),
            ct_line: None,
            fingerprint_line: format!("a=pq-srtp-key-fingerprint:{fingerprint}"),
        };

        let offer = SdpOffer {
            session_id: id,
            pq_ext,
            pk_bytes: pk.data.clone(),
        };

        let session = VoipSession {
            session_id: id,
            peer_id: None,
            state: SessionState::Offering,
            local_keys,
            remote_keys: None,
            shared_secret: None,
            local_sk: Some(sk),
        };

        (session, offer)
    }

    /// Accept an incoming offer: encapsulate against the offerer's public key.
    pub fn accept_offer(&mut self, offer: &SdpOffer) -> Result<(VoipSession, SdpAnswer), &'static str> {
        let pk = PublicKey::from_bytes(&offer.pk_bytes)?;
        let (ct, ss) = Kyber768::encapsulate(&pk);

        let mut ss_arr = [0u8; 32];
        ss_arr.copy_from_slice(ss.as_bytes());

        let local_keys = derive_srtp_keys_labeled(&ss_arr, b"answerer");
        let remote_keys = derive_srtp_keys_labeled(&ss_arr, b"offerer");

        let ct_b64 = B64.encode(&ct.data);
        let fingerprint = hex_sha256(&ct.data);

        let pq_ext = SdpPqExtension {
            kem_line: format!("a=pq-kem:ML-KEM-768 {}", B64.encode(&offer.pk_bytes)),
            ct_line: Some(format!("a=pq-ct:{ct_b64}")),
            fingerprint_line: format!("a=pq-srtp-key-fingerprint:{fingerprint}"),
        };

        let answer = SdpAnswer {
            session_id: offer.session_id,
            pq_ext,
            ct_bytes: ct.data.clone(),
        };

        let session = VoipSession {
            session_id: offer.session_id,
            peer_id: None,
            state: SessionState::Connected,
            local_keys,
            remote_keys: Some(remote_keys),
            shared_secret: Some(ss_arr),
            local_sk: None,
        };

        Ok((session, answer))
    }

    /// Complete the handshake on the offerer side using the answerer's ciphertext.
    pub fn complete_handshake(
        session: &mut VoipSession,
        answer: &SdpAnswer,
    ) -> Result<(), &'static str> {
        let sk = session.local_sk.take().ok_or("No secret key — session already completed or not an offerer")?;
        let ct = crate::kyber768::Ciphertext::from_bytes(&answer.ct_bytes)?;

        let ss = Kyber768::decapsulate(&ct, &sk);
        let mut ss_arr = [0u8; 32];
        ss_arr.copy_from_slice(ss.as_bytes());

        session.local_keys = derive_srtp_keys_labeled(&ss_arr, b"offerer");
        session.remote_keys = Some(derive_srtp_keys_labeled(&ss_arr, b"answerer"));
        session.shared_secret = Some(ss_arr);
        session.state = SessionState::Connected;

        Ok(())
    }
}

impl Default for VoipSessionManager {
    fn default() -> Self {
        Self::new()
    }
}

/// SHA-256 hash as lowercase hex string.
fn hex_sha256(data: &[u8]) -> String {
    let hash = Sha256::digest(data);
    hash.iter().map(|b| format!("{b:02x}")).collect()
}

// ── Tests ──────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn create_session_initial_state() {
        let mut mgr = VoipSessionManager::new();
        let (session, _offer) = mgr.create_offer();
        assert_eq!(session.state, SessionState::Offering);
        assert_eq!(session.session_id, 1);
        assert!(session.local_sk.is_some());
        assert!(session.remote_keys.is_none());
    }

    #[test]
    fn offer_contains_pq_sdp_extensions() {
        let mut mgr = VoipSessionManager::new();
        let (_session, offer) = mgr.create_offer();

        assert!(offer.pq_ext.kem_line.starts_with("a=pq-kem:ML-KEM-768 "));
        assert!(offer.pq_ext.ct_line.is_none(), "Offer must not contain ciphertext");
        assert!(offer.pq_ext.fingerprint_line.starts_with("a=pq-srtp-key-fingerprint:"));
        // Fingerprint is 64 hex chars (SHA-256)
        let fp = offer.pq_ext.fingerprint_line.strip_prefix("a=pq-srtp-key-fingerprint:").unwrap();
        assert_eq!(fp.len(), 64);
    }

    #[test]
    fn accept_offer_generates_answer_with_ciphertext() {
        let mut mgr = VoipSessionManager::new();
        let (_offerer, offer) = mgr.create_offer();
        let (answerer, answer) = mgr.accept_offer(&offer).unwrap();

        assert_eq!(answerer.state, SessionState::Connected);
        assert!(answer.pq_ext.ct_line.is_some(), "Answer must contain ciphertext");
        let ct_line = answer.pq_ext.ct_line.as_ref().unwrap();
        assert!(ct_line.starts_with("a=pq-ct:"));
        assert!(answerer.remote_keys.is_some());
    }

    #[test]
    fn complete_handshake_matching_shared_secret() {
        let mut mgr = VoipSessionManager::new();
        let (mut offerer, offer) = mgr.create_offer();
        let (answerer, answer) = mgr.accept_offer(&offer).unwrap();

        VoipSessionManager::complete_handshake(&mut offerer, &answer).unwrap();

        // Both sides must have derived the same shared secret
        assert_eq!(offerer.shared_secret, answerer.shared_secret);
        assert_eq!(offerer.state, SessionState::Connected);
    }

    #[test]
    fn state_transitions_offer_to_connected() {
        let mut mgr = VoipSessionManager::new();
        let (mut offerer, offer) = mgr.create_offer();
        assert_eq!(offerer.state, SessionState::Offering);

        let (_answerer, answer) = mgr.accept_offer(&offer).unwrap();
        VoipSessionManager::complete_handshake(&mut offerer, &answer).unwrap();
        assert_eq!(offerer.state, SessionState::Connected);

        // Double complete must fail (sk consumed)
        let result = VoipSessionManager::complete_handshake(&mut offerer, &answer);
        assert!(result.is_err());
    }

    #[test]
    fn srtp_keys_match_on_both_sides() {
        let mut mgr = VoipSessionManager::new();
        let (mut offerer, offer) = mgr.create_offer();
        let (answerer, answer) = mgr.accept_offer(&offer).unwrap();
        VoipSessionManager::complete_handshake(&mut offerer, &answer).unwrap();

        // Offerer's local keys == Answerer's remote keys (both labeled "offerer")
        assert_eq!(
            offerer.local_keys, answerer.remote_keys.as_ref().unwrap().clone(),
            "Offerer local keys must match answerer's view of offerer keys"
        );

        // Answerer's local keys == Offerer's remote keys (both labeled "answerer")
        assert_eq!(
            answerer.local_keys, offerer.remote_keys.as_ref().unwrap().clone(),
            "Answerer local keys must match offerer's view of answerer keys"
        );

        // Sender and receiver keys must differ
        assert_ne!(offerer.local_keys, answerer.local_keys);
    }

    #[test]
    fn session_ids_increment() {
        let mut mgr = VoipSessionManager::new();
        let (s1, _) = mgr.create_offer();
        let (s2, _) = mgr.create_offer();
        let (s3, _) = mgr.create_offer();
        assert_eq!(s1.session_id, 1);
        assert_eq!(s2.session_id, 2);
        assert_eq!(s3.session_id, 3);
    }
}
