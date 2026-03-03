//! Fuzz target: PqcRatchet::decrypt (legacy AES-GCM path)
//!
//! Creates a PqcRatchet pair, performs an encapsulation to derive a shared
//! secret / encryption key, then fuzzes the decrypt method with arbitrary
//! ciphertext bytes.
//!
//! Verifies that no combination of malformed encrypted data causes a panic.
//! The decrypt method should gracefully return Err for:
//!   - data shorter than 12 bytes (no nonce)
//!   - corrupted nonce
//!   - corrupted AES-GCM ciphertext
//!   - wrong associated data
//!   - truncated ciphertext

#![no_main]

use libfuzzer_sys::fuzz_target;
use pqcrypto_traits::kem::PublicKey as KemPublicKey;
use std::sync::OnceLock;
use zipminator_core::ratchet::PqcRatchet;

/// Cached shared secret from a successful KEM exchange.
/// The key is deterministic given the keypair, so we cache it once.
struct LegacySetup {
    key: [u8; 32],
}

static SETUP: OnceLock<LegacySetup> = OnceLock::new();

fn get_setup() -> &'static LegacySetup {
    SETUP.get_or_init(|| {
        let mut alice = PqcRatchet::new();
        let bob = PqcRatchet::new();

        let bob_pk = bob.local_static_public.as_bytes().to_vec();
        alice
            .set_remote_public(&bob_pk)
            .expect("set_remote_public must succeed");

        let (_ct_bytes, shared_secret) = alice.encapsulate().expect("encapsulate must succeed");
        LegacySetup {
            key: shared_secret,
        }
    })
}

fuzz_target!(|data: &[u8]| {
    let setup = get_setup();
    let ratchet = PqcRatchet::new();

    // Fuzz 1: decrypt with the correct key but arbitrary ciphertext.
    // Must not panic; should return Err for any malformed input.
    let _ = ratchet.decrypt(data, &setup.key, b"");

    // Fuzz 2: decrypt with arbitrary associated data.
    // Split data to get both ciphertext and AD.
    if data.len() >= 2 {
        let split = (data[0] as usize) % data.len().max(1);
        let (ct_part, ad_part) = data.split_at(split.min(data.len()));
        let _ = ratchet.decrypt(ct_part, &setup.key, ad_part);
    }

    // Fuzz 3: decrypt with a fuzzed key (first 32 bytes of data if available).
    if data.len() >= 32 {
        let mut fuzzed_key = [0u8; 32];
        fuzzed_key.copy_from_slice(&data[..32]);
        let _ = ratchet.decrypt(&data[32..], &fuzzed_key, b"associated-data");
    }
});
