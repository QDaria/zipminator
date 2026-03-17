//! MessageHeader serialization for the PQ Double Ratchet protocol.
//!
//! Wire format (big-endian):
//!   [1 byte]   flags
//!   [4 bytes]  message_number (u32)
//!   [4 bytes]  previous_chain_length (u32)
//!   [1184 bytes] ephemeral_pk (Kyber768 public key)
//!   (if flags & FLAG_HAS_KEM_CT != 0)
//!   [1088 bytes] kem_ciphertext
//!
//! Total without KEM CT: 1193 bytes
//! Total with    KEM CT: 2281 bytes

use pqcrypto_kyber::kyber768;
use pqcrypto_traits::kem::{Ciphertext as KemCiphertext, PublicKey as KemPublicKey};

/// Flag: this header carries a KEM ciphertext for a ratchet step.
pub const FLAG_HAS_KEM_CT: u8 = 0x01;

/// Kyber768 public key size in bytes.
pub const PK_BYTES: usize = 1184;
/// Kyber768 ciphertext size in bytes.
pub const CT_BYTES: usize = 1088;

/// Minimum header size (no KEM ciphertext).
pub const HEADER_MIN_SIZE: usize = 1 + 4 + 4 + PK_BYTES;
/// Full header size (with KEM ciphertext).
pub const HEADER_FULL_SIZE: usize = HEADER_MIN_SIZE + CT_BYTES;

/// A message header carrying ratchet metadata.
#[derive(Clone)]
pub struct MessageHeader {
    /// Bit flags: bit 0 = FLAG_HAS_KEM_CT
    pub flags: u8,
    /// Per-message counter within the current sending chain.
    pub message_number: u32,
    /// Number of messages sent in the *previous* sending chain
    /// (used to skip ahead skipped keys on the receiving side).
    pub previous_chain_length: u32,
    /// Sender's current ephemeral/ratchet public key (1184 bytes).
    pub ephemeral_pk: [u8; PK_BYTES],
    /// Optional KEM ciphertext for a ratchet step (1088 bytes).
    pub kem_ciphertext: Option<[u8; CT_BYTES]>,
}

impl MessageHeader {
    /// Create a header without a KEM ciphertext (mid-chain message).
    pub fn new_without_kem(
        message_number: u32,
        previous_chain_length: u32,
        ephemeral_pk: &kyber768::PublicKey,
    ) -> Self {
        let mut pk_bytes = [0u8; PK_BYTES];
        pk_bytes.copy_from_slice(ephemeral_pk.as_bytes());
        Self {
            flags: 0,
            message_number,
            previous_chain_length,
            ephemeral_pk: pk_bytes,
            kem_ciphertext: None,
        }
    }

    /// Create a header that includes a KEM ciphertext (ratchet step message).
    pub fn new_with_kem(
        message_number: u32,
        previous_chain_length: u32,
        ephemeral_pk: &kyber768::PublicKey,
        kem_ct: &kyber768::Ciphertext,
    ) -> Self {
        let mut pk_bytes = [0u8; PK_BYTES];
        pk_bytes.copy_from_slice(ephemeral_pk.as_bytes());

        let mut ct_bytes = [0u8; CT_BYTES];
        ct_bytes.copy_from_slice(kem_ct.as_bytes());

        Self {
            flags: FLAG_HAS_KEM_CT,
            message_number,
            previous_chain_length,
            ephemeral_pk: pk_bytes,
            kem_ciphertext: Some(ct_bytes),
        }
    }

    /// Whether this header carries a KEM ciphertext.
    pub fn has_kem_ct(&self) -> bool {
        self.flags & FLAG_HAS_KEM_CT != 0
    }

    /// Serialize to bytes.
    pub fn to_bytes(&self) -> Vec<u8> {
        let capacity = if self.has_kem_ct() {
            HEADER_FULL_SIZE
        } else {
            HEADER_MIN_SIZE
        };
        let mut buf = Vec::with_capacity(capacity);

        buf.push(self.flags);
        buf.extend_from_slice(&self.message_number.to_be_bytes());
        buf.extend_from_slice(&self.previous_chain_length.to_be_bytes());
        buf.extend_from_slice(&self.ephemeral_pk);

        if let Some(ct) = &self.kem_ciphertext {
            buf.extend_from_slice(ct);
        }
        buf
    }

    /// Deserialize from bytes.
    pub fn from_bytes(data: &[u8]) -> Result<Self, &'static str> {
        if data.len() < HEADER_MIN_SIZE {
            return Err("Header too short");
        }

        let flags = data[0];
        let has_kem = flags & FLAG_HAS_KEM_CT != 0;

        let expected_len = if has_kem {
            HEADER_FULL_SIZE
        } else {
            HEADER_MIN_SIZE
        };

        if data.len() < expected_len {
            return Err("Header missing KEM ciphertext field");
        }

        let message_number = u32::from_be_bytes(
            data[1..5].try_into().map_err(|_| "Header parse error: message_number")?,
        );
        let previous_chain_length = u32::from_be_bytes(
            data[5..9].try_into().map_err(|_| "Header parse error: previous_chain_length")?,
        );

        let mut ephemeral_pk = [0u8; PK_BYTES];
        ephemeral_pk.copy_from_slice(&data[9..9 + PK_BYTES]);

        let kem_ciphertext = if has_kem {
            let offset = 9 + PK_BYTES;
            let mut ct = [0u8; CT_BYTES];
            ct.copy_from_slice(&data[offset..offset + CT_BYTES]);
            Some(ct)
        } else {
            None
        };

        // Validate that the ephemeral PK parses as a real Kyber768 key.
        kyber768::PublicKey::from_bytes(&ephemeral_pk)
            .map_err(|_| "Header contains invalid ephemeral public key")?;

        // Validate KEM CT if present.
        if let Some(ct_bytes) = &kem_ciphertext {
            kyber768::Ciphertext::from_bytes(ct_bytes)
                .map_err(|_| "Header contains invalid KEM ciphertext")?;
        }

        Ok(Self {
            flags,
            message_number,
            previous_chain_length,
            ephemeral_pk,
            kem_ciphertext,
        })
    }

    /// Parse the ephemeral public key into a Kyber768 type.
    pub fn ephemeral_pk_typed(&self) -> Result<kyber768::PublicKey, &'static str> {
        kyber768::PublicKey::from_bytes(&self.ephemeral_pk)
            .map_err(|_| "Failed to parse ephemeral public key")
    }

    /// Parse the KEM ciphertext into a Kyber768 type, if present.
    pub fn kem_ciphertext_typed(&self) -> Result<Option<kyber768::Ciphertext>, &'static str> {
        match &self.kem_ciphertext {
            None => Ok(None),
            Some(ct_bytes) => {
                let ct = kyber768::Ciphertext::from_bytes(ct_bytes)
                    .map_err(|_| "Failed to parse KEM ciphertext")?;
                Ok(Some(ct))
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_pk() -> kyber768::PublicKey {
        let (pk, _sk) = kyber768::keypair();
        pk
    }

    fn make_pk_ct() -> (kyber768::PublicKey, kyber768::Ciphertext) {
        let (pk, _sk) = kyber768::keypair();
        let (ss, ct) = kyber768::encapsulate(&pk);
        let _ = ss;
        (pk, ct)
    }

    #[test]
    fn test_header_roundtrip_without_kem() {
        let pk = make_pk();
        let hdr = MessageHeader::new_without_kem(7, 3, &pk);
        let bytes = hdr.to_bytes();
        assert_eq!(bytes.len(), HEADER_MIN_SIZE);

        let decoded = MessageHeader::from_bytes(&bytes).expect("decode");
        assert_eq!(decoded.message_number, 7);
        assert_eq!(decoded.previous_chain_length, 3);
        assert!(!decoded.has_kem_ct());
        assert_eq!(decoded.flags, 0);
    }

    #[test]
    fn test_header_roundtrip_with_kem() {
        let (pk, ct) = make_pk_ct();
        let hdr = MessageHeader::new_with_kem(1, 0, &pk, &ct);
        let bytes = hdr.to_bytes();
        assert_eq!(bytes.len(), HEADER_FULL_SIZE);

        let decoded = MessageHeader::from_bytes(&bytes).expect("decode");
        assert_eq!(decoded.message_number, 1);
        assert_eq!(decoded.previous_chain_length, 0);
        assert!(decoded.has_kem_ct());
        assert!(decoded.kem_ciphertext.is_some());
    }

    #[test]
    fn test_header_too_short_rejected() {
        assert!(MessageHeader::from_bytes(&[0u8; 5]).is_err());
    }

    #[test]
    fn test_header_missing_ct_rejected() {
        let pk = make_pk();
        let mut hdr = MessageHeader::new_without_kem(0, 0, &pk);
        hdr.flags = FLAG_HAS_KEM_CT; // claim KEM CT is present, but it's not
        let bytes = hdr.to_bytes(); // serializes without CT (no field set)
        assert!(MessageHeader::from_bytes(&bytes).is_err());
    }
}
