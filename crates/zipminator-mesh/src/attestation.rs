//! RuView Attestation Wire Format: binary message protocol for RuView → Zipminator.
//!
//! Wire format:
//! ```text
//! [magic: 4B "RVAT"] [version: 1B] [type: 1B] [payload_len: 2B LE] [payload: N bytes] [hmac: 32B]
//! ```
//!
//! All messages are HMAC-SHA256 authenticated using a shared `MeshKey`. Key material
//! is zeroized on drop and HMAC verification uses constant-time comparison.

use hmac::{Hmac, Mac};
use sha2::Sha256;
use subtle::ConstantTimeEq;

use crate::mesh_key::MeshKey;
use crate::topology_auth::NodeId;

type HmacSha256 = Hmac<Sha256>;

/// Magic bytes identifying a RuView attestation message.
pub const MAGIC: &[u8; 4] = b"RVAT";

/// Current wire format version.
pub const VERSION: u8 = 1;

/// Size of the fixed header: magic(4) + version(1) + type(1) + payload_len(2).
const HEADER_SIZE: usize = 8;

/// Size of the HMAC-SHA256 tag appended to every message.
const HMAC_SIZE: usize = 32;

/// Maximum payload size (64 KiB, enforced by u16 length field).
pub const MAX_PAYLOAD_SIZE: usize = u16::MAX as usize;

/// Errors from attestation wire format operations.
#[derive(Debug, thiserror::Error)]
pub enum AttestationError {
    /// Message is too short to contain a valid header + HMAC.
    #[error("message too short: need at least {HEADER_SIZE} + {HMAC_SIZE} bytes, got {got}")]
    TooShort { got: usize },

    /// Magic bytes do not match `RVAT`.
    #[error("invalid magic: expected RVAT")]
    InvalidMagic,

    /// Unsupported wire format version.
    #[error("unsupported version: expected {VERSION}, got {got}")]
    UnsupportedVersion { got: u8 },

    /// Unknown message type byte.
    #[error("unknown message type: 0x{0:02x}")]
    UnknownType(u8),

    /// Payload length in header does not match actual data.
    #[error("payload length mismatch: header says {expected}, message contains {actual}")]
    PayloadLengthMismatch { expected: usize, actual: usize },

    /// Payload size is wrong for the declared message type.
    #[error("invalid payload size for {msg_type}: expected {expected}, got {got}")]
    InvalidPayloadSize {
        msg_type: &'static str,
        expected: usize,
        got: usize,
    },

    /// HMAC verification failed (message tampered or wrong key).
    #[error("HMAC verification failed")]
    HmacVerifyFailed,

    /// Payload exceeds maximum allowed size.
    #[error("payload too large: {size} bytes exceeds max {MAX_PAYLOAD_SIZE}")]
    PayloadTooLarge { size: usize },
}

/// Message type discriminator byte.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum MessageType {
    /// CSI eigenstructure: top-K eigenvalues as f64 LE array.
    CsiEigenstructure = 0x01,
    /// Vital signs: breathing_rate(f32) + heart_rate(f32) + micro_movement\[8\](f32).
    VitalSigns = 0x02,
    /// Anomaly event: deviation(f64) + timestamp_ms(u64).
    AnomalyEvent = 0x03,
    /// Topology update: node_count(u16) + edge_count(u16) + node_ids + edges.
    TopologyUpdate = 0x04,
}

impl MessageType {
    /// Parse a type byte into a `MessageType`.
    pub fn from_byte(b: u8) -> Result<Self, AttestationError> {
        match b {
            0x01 => Ok(Self::CsiEigenstructure),
            0x02 => Ok(Self::VitalSigns),
            0x03 => Ok(Self::AnomalyEvent),
            0x04 => Ok(Self::TopologyUpdate),
            other => Err(AttestationError::UnknownType(other)),
        }
    }

    /// Return the type byte value.
    pub fn as_byte(self) -> u8 {
        self as u8
    }
}

/// Typed payload carried inside an attestation message.
#[derive(Debug, Clone)]
pub enum AttestationPayload {
    /// Top-K eigenvalues from CSI eigenstructure analysis.
    CsiEigenstructure(Vec<f64>),

    /// Biometric vital signs from RuView CSI sensing.
    VitalSigns {
        /// Breathing rate in breaths per minute.
        breathing_rate: f32,
        /// Heart rate in BPM.
        heart_rate: f32,
        /// Micro-movement signature (8 channels).
        micro_movement: [f32; 8],
    },

    /// Anomaly detection event.
    AnomalyEvent {
        /// Statistical deviation that triggered the anomaly.
        deviation: f64,
        /// Unix timestamp in milliseconds when the anomaly was detected.
        timestamp_ms: u64,
    },

    /// Mesh topology update.
    TopologyUpdate {
        /// Node identifiers in the mesh.
        node_ids: Vec<NodeId>,
        /// Edges as (source, destination) pairs referencing node_ids by index.
        edges: Vec<(NodeId, NodeId)>,
    },
}

impl AttestationPayload {
    /// Return the `MessageType` for this payload variant.
    pub fn message_type(&self) -> MessageType {
        match self {
            Self::CsiEigenstructure(_) => MessageType::CsiEigenstructure,
            Self::VitalSigns { .. } => MessageType::VitalSigns,
            Self::AnomalyEvent { .. } => MessageType::AnomalyEvent,
            Self::TopologyUpdate { .. } => MessageType::TopologyUpdate,
        }
    }

    /// Serialize the payload to bytes.
    fn to_bytes(&self) -> Vec<u8> {
        match self {
            Self::CsiEigenstructure(eigenvalues) => {
                let mut buf = Vec::with_capacity(eigenvalues.len() * 8);
                for &v in eigenvalues {
                    buf.extend_from_slice(&v.to_le_bytes());
                }
                buf
            }
            Self::VitalSigns {
                breathing_rate,
                heart_rate,
                micro_movement,
            } => {
                let mut buf = Vec::with_capacity(40);
                buf.extend_from_slice(&breathing_rate.to_le_bytes());
                buf.extend_from_slice(&heart_rate.to_le_bytes());
                for &m in micro_movement {
                    buf.extend_from_slice(&m.to_le_bytes());
                }
                buf
            }
            Self::AnomalyEvent {
                deviation,
                timestamp_ms,
            } => {
                let mut buf = Vec::with_capacity(16);
                buf.extend_from_slice(&deviation.to_le_bytes());
                buf.extend_from_slice(&timestamp_ms.to_le_bytes());
                buf
            }
            Self::TopologyUpdate { node_ids, edges } => {
                let node_count = node_ids.len() as u16;
                let edge_count = edges.len() as u16;
                let mut buf =
                    Vec::with_capacity(4 + node_ids.len() * 16 + edges.len() * 32);
                buf.extend_from_slice(&node_count.to_le_bytes());
                buf.extend_from_slice(&edge_count.to_le_bytes());
                for id in node_ids {
                    buf.extend_from_slice(id);
                }
                for (src, dst) in edges {
                    buf.extend_from_slice(src);
                    buf.extend_from_slice(dst);
                }
                buf
            }
        }
    }

    /// Deserialize a payload from bytes given the message type.
    fn from_bytes(
        msg_type: MessageType,
        data: &[u8],
    ) -> Result<Self, AttestationError> {
        match msg_type {
            MessageType::CsiEigenstructure => {
                if !data.len().is_multiple_of(8) || data.is_empty() {
                    return Err(AttestationError::InvalidPayloadSize {
                        msg_type: "CsiEigenstructure",
                        expected: 8,
                        got: data.len(),
                    });
                }
                let eigenvalues: Vec<f64> = data
                    .chunks_exact(8)
                    .map(|c| f64::from_le_bytes(c.try_into().unwrap()))
                    .collect();
                Ok(Self::CsiEigenstructure(eigenvalues))
            }
            MessageType::VitalSigns => {
                if data.len() != 40 {
                    return Err(AttestationError::InvalidPayloadSize {
                        msg_type: "VitalSigns",
                        expected: 40,
                        got: data.len(),
                    });
                }
                let breathing_rate = f32::from_le_bytes(data[0..4].try_into().unwrap());
                let heart_rate = f32::from_le_bytes(data[4..8].try_into().unwrap());
                let mut micro_movement = [0.0f32; 8];
                for (i, slot) in micro_movement.iter_mut().enumerate() {
                    let offset = 8 + i * 4;
                    *slot =
                        f32::from_le_bytes(data[offset..offset + 4].try_into().unwrap());
                }
                Ok(Self::VitalSigns {
                    breathing_rate,
                    heart_rate,
                    micro_movement,
                })
            }
            MessageType::AnomalyEvent => {
                if data.len() != 16 {
                    return Err(AttestationError::InvalidPayloadSize {
                        msg_type: "AnomalyEvent",
                        expected: 16,
                        got: data.len(),
                    });
                }
                let deviation = f64::from_le_bytes(data[0..8].try_into().unwrap());
                let timestamp_ms = u64::from_le_bytes(data[8..16].try_into().unwrap());
                Ok(Self::AnomalyEvent {
                    deviation,
                    timestamp_ms,
                })
            }
            MessageType::TopologyUpdate => {
                if data.len() < 4 {
                    return Err(AttestationError::InvalidPayloadSize {
                        msg_type: "TopologyUpdate",
                        expected: 4,
                        got: data.len(),
                    });
                }
                let node_count =
                    u16::from_le_bytes(data[0..2].try_into().unwrap()) as usize;
                let edge_count =
                    u16::from_le_bytes(data[2..4].try_into().unwrap()) as usize;
                let expected_len = 4 + node_count * 16 + edge_count * 32;
                if data.len() != expected_len {
                    return Err(AttestationError::InvalidPayloadSize {
                        msg_type: "TopologyUpdate",
                        expected: expected_len,
                        got: data.len(),
                    });
                }
                let mut node_ids = Vec::with_capacity(node_count);
                for i in 0..node_count {
                    let offset = 4 + i * 16;
                    let mut id = [0u8; 16];
                    id.copy_from_slice(&data[offset..offset + 16]);
                    node_ids.push(id);
                }
                let mut edges = Vec::with_capacity(edge_count);
                let edges_start = 4 + node_count * 16;
                for i in 0..edge_count {
                    let offset = edges_start + i * 32;
                    let mut src = [0u8; 16];
                    let mut dst = [0u8; 16];
                    src.copy_from_slice(&data[offset..offset + 16]);
                    dst.copy_from_slice(&data[offset + 16..offset + 32]);
                    edges.push((src, dst));
                }
                Ok(Self::TopologyUpdate { node_ids, edges })
            }
        }
    }
}

/// A complete RuView attestation message with header, payload, and HMAC.
#[derive(Debug, Clone)]
pub struct AttestationMessage {
    /// The typed payload.
    pub payload: AttestationPayload,
}

impl AttestationMessage {
    /// Create a new `AttestationMessageBuilder`.
    pub fn builder() -> AttestationMessageBuilder {
        AttestationMessageBuilder::new()
    }

    /// Serialize the message to wire format bytes, computing HMAC with the given key.
    pub fn serialize(&self, key: &MeshKey) -> Result<Vec<u8>, AttestationError> {
        let payload_bytes = self.payload.to_bytes();
        if payload_bytes.len() > MAX_PAYLOAD_SIZE {
            return Err(AttestationError::PayloadTooLarge {
                size: payload_bytes.len(),
            });
        }

        let payload_len = payload_bytes.len() as u16;
        let total_len = HEADER_SIZE + payload_bytes.len() + HMAC_SIZE;
        let mut buf = Vec::with_capacity(total_len);

        // Header
        buf.extend_from_slice(MAGIC);
        buf.push(VERSION);
        buf.push(self.payload.message_type().as_byte());
        buf.extend_from_slice(&payload_len.to_le_bytes());

        // Payload
        buf.extend_from_slice(&payload_bytes);

        // HMAC over header + payload
        let mac = compute_hmac(key, &buf);
        buf.extend_from_slice(&mac);

        Ok(buf)
    }

    /// Deserialize a message from wire format bytes, verifying HMAC with the given key.
    pub fn deserialize(data: &[u8], key: &MeshKey) -> Result<Self, AttestationError> {
        let min_size = HEADER_SIZE + HMAC_SIZE;
        if data.len() < min_size {
            return Err(AttestationError::TooShort { got: data.len() });
        }

        // Validate magic
        if &data[0..4] != MAGIC.as_slice() {
            return Err(AttestationError::InvalidMagic);
        }

        // Validate version
        let version = data[4];
        if version != VERSION {
            return Err(AttestationError::UnsupportedVersion { got: version });
        }

        // Parse type
        let msg_type = MessageType::from_byte(data[5])?;

        // Parse payload length
        let payload_len =
            u16::from_le_bytes(data[6..8].try_into().unwrap()) as usize;

        // Verify total message length
        let expected_total = HEADER_SIZE + payload_len + HMAC_SIZE;
        if data.len() != expected_total {
            return Err(AttestationError::PayloadLengthMismatch {
                expected: payload_len,
                actual: data.len().saturating_sub(HEADER_SIZE + HMAC_SIZE),
            });
        }

        // Verify HMAC (constant-time comparison)
        let authenticated_data = &data[..HEADER_SIZE + payload_len];
        let received_mac = &data[HEADER_SIZE + payload_len..];
        let computed_mac = compute_hmac(key, authenticated_data);

        if received_mac.ct_eq(&computed_mac).into() {
            // HMAC valid
        } else {
            return Err(AttestationError::HmacVerifyFailed);
        }

        // Parse payload
        let payload_data = &data[HEADER_SIZE..HEADER_SIZE + payload_len];
        let payload = AttestationPayload::from_bytes(msg_type, payload_data)?;

        Ok(Self { payload })
    }
}

/// Builder for constructing `AttestationMessage` instances.
#[derive(Debug)]
pub struct AttestationMessageBuilder {
    payload: Option<AttestationPayload>,
}

impl AttestationMessageBuilder {
    /// Create a new empty builder.
    pub fn new() -> Self {
        Self { payload: None }
    }

    /// Set the payload to a CSI eigenstructure message.
    pub fn csi_eigenstructure(mut self, eigenvalues: Vec<f64>) -> Self {
        self.payload = Some(AttestationPayload::CsiEigenstructure(eigenvalues));
        self
    }

    /// Set the payload to a vital signs message.
    pub fn vital_signs(
        mut self,
        breathing_rate: f32,
        heart_rate: f32,
        micro_movement: [f32; 8],
    ) -> Self {
        self.payload = Some(AttestationPayload::VitalSigns {
            breathing_rate,
            heart_rate,
            micro_movement,
        });
        self
    }

    /// Set the payload to an anomaly event message.
    pub fn anomaly_event(mut self, deviation: f64, timestamp_ms: u64) -> Self {
        self.payload = Some(AttestationPayload::AnomalyEvent {
            deviation,
            timestamp_ms,
        });
        self
    }

    /// Set the payload to a topology update message.
    pub fn topology_update(
        mut self,
        node_ids: Vec<NodeId>,
        edges: Vec<(NodeId, NodeId)>,
    ) -> Self {
        self.payload = Some(AttestationPayload::TopologyUpdate { node_ids, edges });
        self
    }

    /// Build the `AttestationMessage`, consuming the builder.
    ///
    /// # Panics
    ///
    /// Panics if no payload was set. Use one of the payload methods first.
    pub fn build(self) -> AttestationMessage {
        AttestationMessage {
            payload: self.payload.expect("payload must be set before building"),
        }
    }
}

impl Default for AttestationMessageBuilder {
    fn default() -> Self {
        Self::new()
    }
}

/// Compute HMAC-SHA256 over the given data using a `MeshKey`.
fn compute_hmac(key: &MeshKey, data: &[u8]) -> [u8; 32] {
    let mut mac =
        HmacSha256::new_from_slice(key.as_bytes()).expect("HMAC accepts any key size");
    mac.update(data);
    let result = mac.finalize();
    let mut out = [0u8; 32];
    out.copy_from_slice(&result.into_bytes());
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::mesh_key::MESH_PSK_SIZE;

    fn test_key() -> MeshKey {
        MeshKey::from_bytes(&[0xAB; MESH_PSK_SIZE]).unwrap()
    }

    fn other_key() -> MeshKey {
        MeshKey::from_bytes(&[0xCD; MESH_PSK_SIZE]).unwrap()
    }

    // --- Roundtrip tests for each message type ---

    #[test]
    fn roundtrip_csi_eigenstructure() {
        let eigenvalues = vec![1.5, 2.7, 0.003, 42.0, -1.0e-10];
        let msg = AttestationMessage::builder()
            .csi_eigenstructure(eigenvalues.clone())
            .build();

        let key = test_key();
        let wire = msg.serialize(&key).unwrap();
        let decoded = AttestationMessage::deserialize(&wire, &key).unwrap();

        match decoded.payload {
            AttestationPayload::CsiEigenstructure(vals) => {
                assert_eq!(vals, eigenvalues);
            }
            _ => panic!("wrong payload type"),
        }
    }

    #[test]
    fn roundtrip_vital_signs() {
        let br = 16.5f32;
        let hr = 72.0f32;
        let mm = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
        let msg = AttestationMessage::builder()
            .vital_signs(br, hr, mm)
            .build();

        let key = test_key();
        let wire = msg.serialize(&key).unwrap();
        let decoded = AttestationMessage::deserialize(&wire, &key).unwrap();

        match decoded.payload {
            AttestationPayload::VitalSigns {
                breathing_rate,
                heart_rate,
                micro_movement,
            } => {
                assert_eq!(breathing_rate, br);
                assert_eq!(heart_rate, hr);
                assert_eq!(micro_movement, mm);
            }
            _ => panic!("wrong payload type"),
        }
    }

    #[test]
    fn roundtrip_anomaly_event() {
        let dev = 3.14159;
        let ts = 1_710_000_000_000u64;
        let msg = AttestationMessage::builder()
            .anomaly_event(dev, ts)
            .build();

        let key = test_key();
        let wire = msg.serialize(&key).unwrap();
        let decoded = AttestationMessage::deserialize(&wire, &key).unwrap();

        match decoded.payload {
            AttestationPayload::AnomalyEvent {
                deviation,
                timestamp_ms,
            } => {
                assert_eq!(deviation, dev);
                assert_eq!(timestamp_ms, ts);
            }
            _ => panic!("wrong payload type"),
        }
    }

    #[test]
    fn roundtrip_topology_update() {
        let node_a = [1u8; 16];
        let node_b = [2u8; 16];
        let node_c = [3u8; 16];
        let nodes = vec![node_a, node_b, node_c];
        let edges = vec![(node_a, node_b), (node_b, node_c)];

        let msg = AttestationMessage::builder()
            .topology_update(nodes.clone(), edges.clone())
            .build();

        let key = test_key();
        let wire = msg.serialize(&key).unwrap();
        let decoded = AttestationMessage::deserialize(&wire, &key).unwrap();

        match decoded.payload {
            AttestationPayload::TopologyUpdate {
                node_ids,
                edges: decoded_edges,
            } => {
                assert_eq!(node_ids, nodes);
                assert_eq!(decoded_edges, edges);
            }
            _ => panic!("wrong payload type"),
        }
    }

    // --- HMAC verification tests ---

    #[test]
    fn hmac_valid_key_succeeds() {
        let msg = AttestationMessage::builder()
            .anomaly_event(1.0, 1000)
            .build();
        let key = test_key();
        let wire = msg.serialize(&key).unwrap();
        assert!(AttestationMessage::deserialize(&wire, &key).is_ok());
    }

    #[test]
    fn hmac_wrong_key_fails() {
        let msg = AttestationMessage::builder()
            .anomaly_event(1.0, 1000)
            .build();
        let key = test_key();
        let wire = msg.serialize(&key).unwrap();
        let wrong = other_key();
        let result = AttestationMessage::deserialize(&wire, &wrong);
        assert!(matches!(result, Err(AttestationError::HmacVerifyFailed)));
    }

    #[test]
    fn hmac_tampered_payload_fails() {
        let msg = AttestationMessage::builder()
            .anomaly_event(1.0, 1000)
            .build();
        let key = test_key();
        let mut wire = msg.serialize(&key).unwrap();
        // Flip a byte in the payload region
        wire[HEADER_SIZE] ^= 0xFF;
        let result = AttestationMessage::deserialize(&wire, &key);
        assert!(matches!(result, Err(AttestationError::HmacVerifyFailed)));
    }

    // --- Validation tests ---

    #[test]
    fn invalid_magic_rejected() {
        let msg = AttestationMessage::builder()
            .anomaly_event(1.0, 1000)
            .build();
        let key = test_key();
        let mut wire = msg.serialize(&key).unwrap();
        wire[0] = b'X';
        let result = AttestationMessage::deserialize(&wire, &key);
        assert!(matches!(result, Err(AttestationError::InvalidMagic)));
    }

    #[test]
    fn invalid_version_rejected() {
        let msg = AttestationMessage::builder()
            .anomaly_event(1.0, 1000)
            .build();
        let key = test_key();
        let mut wire = msg.serialize(&key).unwrap();
        // Version byte is at index 4; set to 99
        wire[4] = 99;
        let result = AttestationMessage::deserialize(&wire, &key);
        assert!(matches!(
            result,
            Err(AttestationError::UnsupportedVersion { got: 99 })
        ));
    }

    #[test]
    fn message_too_short_rejected() {
        let key = test_key();
        let short = vec![0u8; 10];
        let result = AttestationMessage::deserialize(&short, &key);
        assert!(matches!(result, Err(AttestationError::TooShort { .. })));
    }

    #[test]
    fn unknown_message_type_rejected() {
        let msg = AttestationMessage::builder()
            .anomaly_event(1.0, 1000)
            .build();
        let key = test_key();
        let mut wire = msg.serialize(&key).unwrap();
        // Type byte is at index 5; set to invalid value
        wire[5] = 0xFF;
        // This will fail at either type parsing or HMAC (since we changed the data).
        // The type check happens before HMAC, so it returns UnknownType.
        let result = AttestationMessage::deserialize(&wire, &key);
        assert!(matches!(result, Err(AttestationError::UnknownType(0xFF))));
    }

    #[test]
    fn vital_signs_wrong_payload_size_rejected() {
        // Manually construct a message with wrong payload size for VitalSigns
        let key = test_key();
        let payload = vec![0u8; 20]; // Should be 40
        let payload_len = payload.len() as u16;

        let mut buf = Vec::new();
        buf.extend_from_slice(MAGIC);
        buf.push(VERSION);
        buf.push(MessageType::VitalSigns.as_byte());
        buf.extend_from_slice(&payload_len.to_le_bytes());
        buf.extend_from_slice(&payload);
        let mac = compute_hmac(&key, &buf);
        buf.extend_from_slice(&mac);

        let result = AttestationMessage::deserialize(&buf, &key);
        assert!(matches!(
            result,
            Err(AttestationError::InvalidPayloadSize { .. })
        ));
    }

    #[test]
    fn payload_length_mismatch_rejected() {
        let key = test_key();
        let result = AttestationMessage::deserialize(
            &[
                b'R', b'V', b'A', b'T', // magic
                VERSION,                  // version
                0x03,                     // type: anomaly
                0x10, 0x00,               // payload_len = 16
                // Only 8 bytes of payload instead of 16, plus 32 HMAC
                0, 0, 0, 0, 0, 0, 0, 0,  // 8 bytes
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            ],
            &key,
        );
        assert!(matches!(
            result,
            Err(AttestationError::PayloadLengthMismatch { .. })
        ));
    }

    #[test]
    fn wire_format_structure_correct() {
        let msg = AttestationMessage::builder()
            .anomaly_event(1.0, 1000)
            .build();
        let key = test_key();
        let wire = msg.serialize(&key).unwrap();

        // Total: header(8) + payload(16) + hmac(32) = 56
        assert_eq!(wire.len(), 56);
        assert_eq!(&wire[0..4], b"RVAT");
        assert_eq!(wire[4], VERSION);
        assert_eq!(wire[5], 0x03); // AnomalyEvent
        let payload_len = u16::from_le_bytes([wire[6], wire[7]]);
        assert_eq!(payload_len, 16);
    }

    #[test]
    fn builder_default_works() {
        let builder = AttestationMessageBuilder::default();
        // Just verify it creates without panic
        let _ = builder.csi_eigenstructure(vec![1.0]).build();
    }

    #[test]
    fn single_eigenvalue_roundtrip() {
        let key = test_key();
        let msg = AttestationMessage::builder()
            .csi_eigenstructure(vec![99.99])
            .build();
        let wire = msg.serialize(&key).unwrap();
        // header(8) + payload(8) + hmac(32) = 48
        assert_eq!(wire.len(), 48);
        let decoded = AttestationMessage::deserialize(&wire, &key).unwrap();
        match decoded.payload {
            AttestationPayload::CsiEigenstructure(v) => assert_eq!(v, vec![99.99]),
            _ => panic!("wrong type"),
        }
    }

    #[test]
    fn topology_empty_nodes_and_edges() {
        let key = test_key();
        let msg = AttestationMessage::builder()
            .topology_update(vec![], vec![])
            .build();
        let wire = msg.serialize(&key).unwrap();
        let decoded = AttestationMessage::deserialize(&wire, &key).unwrap();
        match decoded.payload {
            AttestationPayload::TopologyUpdate { node_ids, edges } => {
                assert!(node_ids.is_empty());
                assert!(edges.is_empty());
            }
            _ => panic!("wrong type"),
        }
    }
}
