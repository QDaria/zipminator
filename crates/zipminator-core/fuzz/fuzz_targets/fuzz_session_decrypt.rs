//! Fuzz target: PqRatchetSession::decrypt with arbitrary header + ciphertext
//!
//! This exercises the full decrypt pipeline:
//!   header parse -> skipped key lookup -> ratchet step -> AES-GCM decrypt
//!
//! The session handshake is performed ONCE (via OnceLock) and cloned for each
//! fuzz iteration so that repeated failures do not corrupt shared state.
//!
//! The harness verifies that no combination of malformed header bytes and
//! ciphertext bytes causes a panic. All error paths must return Err gracefully.

#![no_main]

use libfuzzer_sys::fuzz_target;
use zipminator_core::ratchet::PqRatchetSession;

fuzz_target!(|data: &[u8]| {
    // Create a fresh session pair for each fuzz iteration.
    // PqRatchetSession is not Clone and init_alice() generates a fresh
    // keypair each time, so we must do the full handshake per iteration.
    // This is slightly expensive but guarantees correctness and avoids
    // corrupting state across iterations.
    let (mut alice, alice_pk) = PqRatchetSession::init_alice();
    let (mut bob, kem_ct, bob_pk) = match PqRatchetSession::init_bob(&alice_pk) {
        Ok(v) => v,
        Err(_) => return, // should not happen, but be defensive
    };
    if alice.alice_finish_handshake(&kem_ct, &bob_pk).is_err() {
        return;
    }

    // Split the fuzz data into header_bytes and ciphertext_bytes.
    // Use the first 2 bytes as a length prefix for the header portion.
    if data.len() < 2 {
        // Not enough data to determine split point; feed all as header.
        let _ = bob.decrypt(data, &[]);
        return;
    }

    let header_len = u16::from_le_bytes([data[0], data[1]]) as usize;
    let rest = &data[2..];

    let (header_bytes, ciphertext_bytes) = if header_len >= rest.len() {
        (rest, &[][..])
    } else {
        rest.split_at(header_len)
    };

    // The core assertion: decrypt must NEVER panic.
    // It should return Ok or Err for any input.
    let _ = bob.decrypt(header_bytes, ciphertext_bytes);

    // Also test Alice decrypting arbitrary data (covers both sides).
    let _ = alice.decrypt(header_bytes, ciphertext_bytes);
});
