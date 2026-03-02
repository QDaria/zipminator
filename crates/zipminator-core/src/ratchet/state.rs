//! Ratchet state structs with automatic secret zeroization on drop.
//!
//! `RatchetState` holds all mutable cryptographic material for one side
//! of a PQ Double Ratchet session.  Secret byte arrays are wrapped in
//! `zeroize`-derived types; Kyber keypairs are stored as raw bytes so
//! that `Zeroize` can clear them uniformly.

use std::collections::HashMap;
use zeroize::{Zeroize, ZeroizeOnDrop};

use crate::ratchet::header::{CT_BYTES, PK_BYTES};

/// Maximum number of skipped message keys we are willing to cache.
/// This bounds memory usage during out-of-order delivery.
pub const MAX_SKIP: u32 = 1000;

/// A 32-byte secret that zeroes itself when dropped.
#[derive(Clone, Zeroize, ZeroizeOnDrop)]
pub struct SecretKey32(pub [u8; 32]);

impl Default for SecretKey32 {
    fn default() -> Self {
        Self([0u8; 32])
    }
}

/// Holds the raw bytes of a Kyber768 keypair so we can zeroize them.
#[derive(Zeroize, ZeroizeOnDrop)]
pub struct KyberKeypair {
    /// 1184-byte public key
    pub pk: [u8; PK_BYTES],
    /// 2400-byte secret key
    pub sk: [u8; 2400],
}

impl KyberKeypair {
    pub fn zeroed() -> Self {
        Self {
            pk: [0u8; PK_BYTES],
            sk: [0u8; 2400],
        }
    }
}

impl Clone for KyberKeypair {
    fn clone(&self) -> Self {
        Self {
            pk: self.pk,
            sk: self.sk,
        }
    }
}

/// The side of the ratchet (determines who initiates the first KEM step).
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Side {
    Alice,
    Bob,
}

/// Key used to index skipped message keys: (ephemeral_pk_prefix_8_bytes, message_number).
///
/// We use the first 8 bytes of the sender's ephemeral public key as a
/// chain identifier, accepting the (extremely unlikely) collision risk.
#[derive(Clone, PartialEq, Eq, Hash, Debug)]
pub struct SkipKey(pub [u8; 8], pub u32);

impl SkipKey {
    pub fn new(ephemeral_pk: &[u8; PK_BYTES], msg_number: u32) -> Self {
        let mut prefix = [0u8; 8];
        prefix.copy_from_slice(&ephemeral_pk[..8]);
        Self(prefix, msg_number)
    }
}

/// All ratchet state for one session participant.
///
/// Fields that contain secret material implement `Zeroize`.  The
/// `skipped_keys` map is marked `#[zeroize(skip)]` because `HashMap`
/// does not implement `Zeroize`; we provide manual cleanup via `Drop`.
pub struct RatchetState {
    /// Which side of the handshake we are.
    pub side: Side,

    /// Root key — mixed with each KEM shared secret to derive chain keys.
    pub root_key: SecretKey32,

    /// Sending chain key.
    pub send_chain_key: SecretKey32,
    /// Receiving chain key.
    pub recv_chain_key: SecretKey32,

    /// Number of messages sent in the current sending chain.
    pub send_message_number: u32,
    /// Number of messages received in the current receiving chain.
    pub recv_message_number: u32,
    /// Number of messages sent in the *previous* sending chain
    /// (sent in ratchet-step headers so the other side can skip ahead).
    pub previous_send_chain_length: u32,

    /// Our current ratchet keypair (ephemeral).
    pub our_ratchet_keypair: KyberKeypair,

    /// Their current ratchet public key.
    pub their_ratchet_pk: [u8; PK_BYTES],

    /// Ciphertext from the last KEM encapsulation we sent
    /// (needed so Bob can include it in his first message header).
    pub pending_kem_ct: Option<[u8; CT_BYTES]>,

    /// Skipped message keys cached for out-of-order delivery.
    /// Key = (ephemeral_pk_prefix, message_number), Value = 32-byte message key.
    ///
    /// NOTE: this is NOT auto-zeroized; the `Drop` impl clears it manually.
    pub skipped_keys: HashMap<SkipKey, [u8; 32]>,
}

impl Drop for RatchetState {
    fn drop(&mut self) {
        // Manually zeroize all cached message keys before the map is freed.
        for v in self.skipped_keys.values_mut() {
            v.zeroize();
        }
        self.skipped_keys.clear();
        // Zeroize remaining secret fields.
        self.root_key.zeroize();
        self.send_chain_key.zeroize();
        self.recv_chain_key.zeroize();
        self.our_ratchet_keypair.zeroize();
    }
}

impl RatchetState {
    /// Create an empty, zeroed state for the given side.
    pub fn new(side: Side) -> Self {
        Self {
            side,
            root_key: SecretKey32::default(),
            send_chain_key: SecretKey32::default(),
            recv_chain_key: SecretKey32::default(),
            send_message_number: 0,
            recv_message_number: 0,
            previous_send_chain_length: 0,
            our_ratchet_keypair: KyberKeypair::zeroed(),
            their_ratchet_pk: [0u8; PK_BYTES],
            pending_kem_ct: None,
            skipped_keys: HashMap::new(),
        }
    }

    /// Store a skipped message key.  Returns an error if the cache is full.
    pub fn store_skipped_key(
        &mut self,
        skip_key: SkipKey,
        msg_key: [u8; 32],
    ) -> Result<(), &'static str> {
        if self.skipped_keys.len() >= MAX_SKIP as usize {
            return Err("Too many skipped message keys");
        }
        self.skipped_keys.insert(skip_key, msg_key);
        Ok(())
    }

    /// Retrieve and remove a skipped message key.
    pub fn take_skipped_key(&mut self, skip_key: &SkipKey) -> Option<[u8; 32]> {
        self.skipped_keys.remove(skip_key)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ratchet_state_creation() {
        let state = RatchetState::new(Side::Alice);
        assert_eq!(state.side, Side::Alice);
        assert_eq!(state.send_message_number, 0);
        assert_eq!(state.recv_message_number, 0);
        assert!(state.skipped_keys.is_empty());
    }

    #[test]
    fn test_skipped_key_store_take() {
        let mut state = RatchetState::new(Side::Bob);
        let pk = [0u8; PK_BYTES];
        let key = SkipKey::new(&pk, 5);
        let msg_key = [42u8; 32];

        state.store_skipped_key(key.clone(), msg_key).expect("store");
        let retrieved = state.take_skipped_key(&key).expect("take");
        assert_eq!(retrieved, msg_key);
        // Second take should return None
        assert!(state.take_skipped_key(&key).is_none());
    }

    #[test]
    fn test_secret_key32_zeroize() {
        let mut sk = SecretKey32([0xff; 32]);
        sk.zeroize();
        assert_eq!(sk.0, [0u8; 32]);
    }
}
