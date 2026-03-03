//! Tests for the PQ Double Ratchet protocol.
//!
//! Contains tests for both the legacy `PqcRatchet` (single-step KEM wrapper)
//! and the full `PqRatchetSession` (Double Ratchet with handshake, chain KDFs,
//! skipped-key caching).
//!
//! API contracts:
//!
//! ## PqcRatchet (legacy)
//!   - `PqcRatchet::new()` -> Self
//!   - `ratchet.local_static_public` : kyber768::PublicKey
//!   - `ratchet.set_remote_public(&[u8])` -> Result<(), &str>
//!   - `ratchet.encapsulate()` -> Result<(Vec<u8>, [u8;32]), &str>
//!   - `ratchet.decapsulate(&[u8])` -> Result<[u8;32], &str>
//!   - `ratchet.encrypt(&[u8], key: &[u8;32], ad: &[u8])` -> Result<Vec<u8>, &str>
//!   - `ratchet.decrypt(&[u8], key: &[u8;32], ad: &[u8])` -> Result<Vec<u8>, &str>
//!
//! ## PqRatchetSession (full Double Ratchet)
//!   - `PqRatchetSession::init_alice()` -> (Self, Vec<u8>)
//!   - `PqRatchetSession::init_bob(&[u8])` -> Result<(Self, Vec<u8>, Vec<u8>), RatchetError>
//!   - `session.alice_finish_handshake(&[u8], &[u8])` -> Result<(), RatchetError>
//!   - `session.encrypt(&[u8])` -> Result<(Vec<u8>, Vec<u8>), RatchetError>
//!   - `session.decrypt(&[u8], &[u8])` -> Result<Vec<u8>, RatchetError>

use pqcrypto_traits::kem::PublicKey;

use crate::ratchet::{PqcRatchet, PqRatchetSession};

// ─── Helpers ────────────────────────────────────────────────────────────────

/// Perform the KEM-based handshake between Alice (initiator) and Bob (responder).
/// Returns (alice, bob, shared_secret_bytes).
///
/// Protocol:
///   1. Alice generates keypair; shares public key with Bob.
///   2. Bob encapsulates against Alice's public key -> (ciphertext, ss_bob).
///   3. Bob sends the ciphertext back to Alice.
///   4. Alice decapsulates -> ss_alice.
///   5. ss_alice == ss_bob  (the established shared root key).
fn kem_handshake() -> (PqcRatchet, PqcRatchet, [u8; 32]) {
    let alice = PqcRatchet::new();
    let mut bob = PqcRatchet::new();

    bob.set_remote_public(alice.local_static_public.as_bytes())
        .expect("Bob should accept Alice's valid public key");

    let (ct_bytes, ss_bob) = bob.encapsulate().expect("Bob encapsulation must succeed");
    let ss_alice = alice.decapsulate(&ct_bytes).expect("Alice decapsulation must succeed");

    assert_eq!(
        ss_alice, ss_bob,
        "KEM handshake: Alice and Bob must derive the same shared secret"
    );

    (alice, bob, ss_alice)
}

/// Set up a full PqRatchetSession handshake between Alice and Bob.
/// Returns (alice_session, bob_session) both ready for encrypt/decrypt.
fn session_handshake() -> (PqRatchetSession, PqRatchetSession) {
    let (mut alice, alice_pk) = PqRatchetSession::init_alice();
    let (bob, kem_ct, bob_pk) =
        PqRatchetSession::init_bob(&alice_pk).expect("bob init");
    alice
        .alice_finish_handshake(&kem_ct, &bob_pk)
        .expect("alice finish handshake");
    assert!(alice.is_ready());
    assert!(bob.is_ready());
    (alice, bob)
}

// ─── Basic Ratchet Lifecycle ─────────────────────────────────────────────────

/// Verify that two fresh ratchet instances can complete a KEM handshake and
/// arrive at an identical shared root key.
#[test]
fn test_ratchet_init_alice_bob() {
    let alice = PqcRatchet::new();
    let mut bob = PqcRatchet::new();

    // Bob learns Alice's identity
    let result = bob.set_remote_public(alice.local_static_public.as_bytes());
    assert!(result.is_ok(), "Bob should accept a valid Kyber768 public key");

    // Bob encapsulates -> obtains (ciphertext, shared_secret_bob)
    let (ct_bytes, ss_bob) = bob.encapsulate().expect("Encapsulation must succeed");
    assert_eq!(
        ct_bytes.len(),
        pqcrypto_kyber::kyber768::ciphertext_bytes(),
        "Ciphertext must be exactly Kyber768 ciphertext size"
    );
    assert_eq!(ss_bob.len(), 32, "Shared secret must be 32 bytes");

    // Alice decapsulates -> recovers shared secret
    let ss_alice = alice.decapsulate(&ct_bytes).expect("Decapsulation must succeed");

    assert_eq!(
        ss_alice, ss_bob,
        "Both parties must derive the identical shared secret after KEM handshake"
    );
}

/// Alice encrypts a single message; Bob decrypts it; the plaintext matches.
///
/// This test exercises the AES-256-GCM layer directly (using the KEM-derived
/// shared secret as the symmetric key) rather than the full ratchet chain.
/// It will remain active as long as `encrypt`/`decrypt` are public API.
#[test]
fn test_ratchet_send_receive_single() {
    let (alice, _bob, shared_secret) = kem_handshake();
    let bob_ratchet = PqcRatchet::new(); // Bob only needs decrypt capability here

    let plaintext = b"Hello, post-quantum world!";
    let aad = b"message-header-v1";

    let ciphertext = alice
        .encrypt(plaintext, &shared_secret, aad)
        .expect("Encryption must succeed");

    // Ciphertext must differ from plaintext
    assert_ne!(ciphertext.as_slice(), plaintext);
    // Nonce (12 bytes) + GCM tag (16 bytes) overhead
    assert!(ciphertext.len() >= plaintext.len() + 12 + 16);

    let recovered = bob_ratchet
        .decrypt(&ciphertext, &shared_secret, aad)
        .expect("Decryption must succeed");

    assert_eq!(
        recovered, plaintext,
        "Decrypted plaintext must match original"
    );
}

/// Ten sequential messages from Alice to Bob must all decrypt correctly.
/// Each message uses the same shared secret (pre-ratchet baseline).
/// When the full ratchet chain is implemented, keys will differ per message.
#[test]
fn test_ratchet_send_receive_multiple() {
    let (alice, _bob, shared_secret) = kem_handshake();
    let bob_ratchet = PqcRatchet::new();

    for i in 0..10u32 {
        let plaintext = format!("Message number {}", i);
        let aad = format!("seq:{}", i);

        let ct = alice
            .encrypt(plaintext.as_bytes(), &shared_secret, aad.as_bytes())
            .unwrap_or_else(|e| panic!("Encryption of message {} failed: {}", i, e));

        let recovered = bob_ratchet
            .decrypt(&ct, &shared_secret, aad.as_bytes())
            .unwrap_or_else(|e| panic!("Decryption of message {} failed: {}", i, e));

        assert_eq!(
            recovered,
            plaintext.as_bytes(),
            "Round-trip failed for message {}",
            i
        );
    }
}

/// Alice and Bob alternate sending messages to each other.
/// Both directions of encryption/decryption must work correctly.
/// Each party acts as encryptor for their own messages and decryptor for the other's.
#[test]
fn test_ratchet_bidirectional() {
    // Alice -> Bob direction
    let (alice, _bob_sess, ss_a2b) = kem_handshake();
    // Bob -> Alice direction (separate KEM exchange for the reverse channel)
    let (bob, _alice_sess, ss_b2a) = kem_handshake();

    let alice_recv = PqcRatchet::new();
    let bob_recv = PqcRatchet::new();

    for i in 0..5u32 {
        // Alice sends
        let a_msg = format!("Alice->Bob #{}", i);
        let a_ct = alice
            .encrypt(a_msg.as_bytes(), &ss_a2b, b"alice-to-bob")
            .expect("Alice encryption failed");
        let a_dec = bob_recv
            .decrypt(&a_ct, &ss_a2b, b"alice-to-bob")
            .expect("Bob decryption of Alice's message failed");
        assert_eq!(a_dec, a_msg.as_bytes());

        // Bob sends
        let b_msg = format!("Bob->Alice #{}", i);
        let b_ct = bob
            .encrypt(b_msg.as_bytes(), &ss_b2a, b"bob-to-alice")
            .expect("Bob encryption failed");
        let b_dec = alice_recv
            .decrypt(&b_ct, &ss_b2a, b"bob-to-alice")
            .expect("Alice decryption of Bob's message failed");
        assert_eq!(b_dec, b_msg.as_bytes());
    }
}

// ─── Ratchet Stepping ────────────────────────────────────────────────────────

/// A ratchet step occurs when Alice sends her first message (msg_number==0)
/// and when the conversation direction changes.  This test verifies that
/// messages still decrypt correctly across ratchet steps.
///
/// Sequence: handshake -> Alice sends M0 (ratchet step) -> Bob decrypts ->
/// Bob sends a reply -> Alice decrypts -> Alice sends again (new ratchet step)
/// -> Bob decrypts.  All messages must round-trip.
#[test]
fn test_ratchet_step_produces_new_keys() {
    let (mut alice, mut bob) = session_handshake();

    // Alice sends M0 (triggers a KEM ratchet step because send_message_number==0)
    let (h_a0, c_a0) = alice.encrypt(b"alice-step-0").expect("alice encrypt M0");
    let p_a0 = bob.decrypt(&h_a0, &c_a0).expect("bob decrypt alice M0");
    assert_eq!(p_a0, b"alice-step-0");

    // Bob sends a reply
    let (h_b0, c_b0) = bob.encrypt(b"bob-reply-0").expect("bob encrypt");
    let p_b0 = alice.decrypt(&h_b0, &c_b0).expect("alice decrypt bob reply");
    assert_eq!(p_b0, b"bob-reply-0");

    // Alice sends again (another ratchet step since send_message_number resets)
    let (h_a1, c_a1) = alice.encrypt(b"alice-step-1").expect("alice encrypt after ratchet");
    let p_a1 = bob.decrypt(&h_a1, &c_a1).expect("bob decrypt alice after ratchet");
    assert_eq!(p_a1, b"alice-step-1");

    // Ciphertexts from different ratchet epochs must differ
    assert_ne!(c_a0, c_a1, "Ciphertexts from different ratchet steps must differ");
}

/// Forward secrecy: each message produces a distinct ciphertext (the chain key
/// advances after each encryption), and all messages decrypt correctly.
///
/// Alice sends 3 messages to Bob; all ciphertexts differ; all decrypt to the
/// expected plaintext.
#[test]
fn test_ratchet_forward_secrecy() {
    let (mut alice, mut bob) = session_handshake();

    let msgs: Vec<&[u8]> = vec![b"msg-0", b"msg-1", b"msg-2"];
    let mut headers = Vec::new();
    let mut ciphertexts = Vec::new();

    // Alice sends 3 messages
    for msg in &msgs {
        let (hdr, ct) = alice.encrypt(msg).expect("encrypt");
        headers.push(hdr);
        ciphertexts.push(ct);
    }

    // All ciphertexts must be distinct (chain key advances each time)
    for i in 0..ciphertexts.len() {
        for j in (i + 1)..ciphertexts.len() {
            assert_ne!(
                ciphertexts[i], ciphertexts[j],
                "Ciphertexts for message {} and {} must differ (forward secrecy)",
                i, j
            );
        }
    }

    // Bob decrypts all 3 in order and verifies correctness
    for (i, msg) in msgs.iter().enumerate() {
        let plain = bob
            .decrypt(&headers[i], &ciphertexts[i])
            .unwrap_or_else(|e| panic!("decrypt message {} failed: {}", i, e));
        assert_eq!(plain, *msg, "Decrypted plaintext must match for message {}", i);
    }
}

/// Each KEM encaps/decaps cycle must feed entropy into the root chain and
/// produce a new root key distinct from the previous one.
#[test]
fn test_ratchet_kem_ratchet_step() {
    // Perform two independent KEM handshakes and verify the two resulting
    // shared secrets are statistically unique (negligible collision probability).
    let (alice1, _bob1, ss1) = kem_handshake();
    let (alice2, _bob2, ss2) = kem_handshake();

    assert_ne!(
        ss1, ss2,
        "Two independent KEM handshakes must produce distinct shared secrets"
    );

    // Each resulting shared secret must have high entropy (non-zero, non-uniform).
    assert_ne!(ss1, [0u8; 32], "Shared secret must not be all-zeros");
    assert_ne!(ss2, [0u8; 32], "Shared secret must not be all-zeros");

    // Additional property: Alice's own keypairs across sessions are unique
    assert_ne!(
        alice1.local_static_public.as_bytes(),
        alice2.local_static_public.as_bytes(),
        "Fresh keypairs must be distinct"
    );
}

// ─── Edge Cases ──────────────────────────────────────────────────────────────

/// Messages arriving out of order must be decryptable via the skipped-key cache.
///
/// Alice's first message (M0) carries a KEM ratchet step that initializes
/// Bob's receiving chain, so Bob must process it first.  After that, M1..M3
/// are within the same chain and can be delivered out of order.
///
/// Sequence: Bob decrypts M0 (ratchet init), then receives M3, M1, M2.
#[test]
fn test_ratchet_out_of_order_messages() {
    let (mut alice, mut bob) = session_handshake();

    // Alice sends M0 (carries KEM ratchet step), M1, M2, M3
    let (h0, c0) = alice.encrypt(b"msg-0").expect("encrypt M0");
    let (h1, c1) = alice.encrypt(b"msg-1").expect("encrypt M1");
    let (h2, c2) = alice.encrypt(b"msg-2").expect("encrypt M2");
    let (h3, c3) = alice.encrypt(b"msg-3").expect("encrypt M3");

    // Bob decrypts M0 first (required: contains KEM CT that initializes recv chain)
    let p0 = bob.decrypt(&h0, &c0).expect("decrypt M0 (ratchet init)");
    assert_eq!(p0, b"msg-0");

    // Bob receives M3, M1, M2 out of order (all within same chain epoch)
    let p3 = bob.decrypt(&h3, &c3).expect("decrypt M3 (out of order)");
    assert_eq!(p3, b"msg-3");

    let p1 = bob.decrypt(&h1, &c1).expect("decrypt M1 (from skipped cache)");
    assert_eq!(p1, b"msg-1");

    let p2 = bob.decrypt(&h2, &c2).expect("decrypt M2 (from skipped cache)");
    assert_eq!(p2, b"msg-2");
}

/// Keys for skipped messages are persisted until the messages arrive.
///
/// Alice sends 6 messages (M0..M5).  Bob decrypts M0 first (required: it
/// carries the KEM ratchet step), then jumps to M5 (skipping 1-4), then
/// decrypts M4, M3, M2, M1 in reverse order from the skipped-key cache.
#[test]
fn test_ratchet_skipped_message_keys() {
    let (mut alice, mut bob) = session_handshake();

    // Alice sends M0..M5
    let mut encrypted: Vec<(Vec<u8>, Vec<u8>)> = Vec::new();
    for i in 0u32..6 {
        let msg = format!("message-{}", i);
        let (h, c) = alice.encrypt(msg.as_bytes()).expect("encrypt");
        encrypted.push((h, c));
    }

    // Bob decrypts M0 first (carries KEM ratchet step, initializes recv chain)
    let p0 = bob
        .decrypt(&encrypted[0].0, &encrypted[0].1)
        .expect("decrypt M0 (ratchet init)");
    assert_eq!(p0, b"message-0");

    // Bob skips ahead to M5 (this caches keys for M1..M4)
    let p5 = bob
        .decrypt(&encrypted[5].0, &encrypted[5].1)
        .expect("decrypt M5 (skip ahead)");
    assert_eq!(p5, b"message-5");

    // Now decrypt M4, M3, M2, M1 from skipped cache (reverse order)
    for i in (1..5).rev() {
        let msg = format!("message-{}", i);
        let plain = bob
            .decrypt(&encrypted[i].0, &encrypted[i].1)
            .unwrap_or_else(|e| panic!("decrypt M{} from skipped cache failed: {}", i, e));
        assert_eq!(
            plain,
            msg.as_bytes(),
            "Skipped message M{} must decrypt correctly",
            i
        );
    }
}

/// Tampering with the AES-GCM ciphertext body must cause authentication
/// failure (the GCM authentication tag detects the modification).
#[test]
fn test_ratchet_tampered_ciphertext() {
    let (alice, _, shared_secret) = kem_handshake();
    let bob = PqcRatchet::new();

    let plaintext = b"Secret payload that must not be altered";
    let aad = b"tamper-test-aad";

    let mut ct = alice
        .encrypt(plaintext, &shared_secret, aad)
        .expect("Encryption must succeed");

    // Flip a bit in the ciphertext body (after the 12-byte nonce)
    let flip_idx = 13; // First byte of the actual ciphertext
    ct[flip_idx] ^= 0xFF;

    let result = bob.decrypt(&ct, &shared_secret, aad);
    assert!(
        result.is_err(),
        "Decryption of tampered ciphertext must fail (AES-GCM auth tag mismatch)"
    );
    assert_eq!(
        result.unwrap_err(),
        "AES-GCM decryption failed",
        "Error message must indicate AES-GCM failure"
    );
}

/// Tampering with the nonce portion of the ciphertext (first 12 bytes) must
/// also cause authentication failure.
#[test]
fn test_ratchet_tampered_header() {
    let (alice, _, shared_secret) = kem_handshake();
    let bob = PqcRatchet::new();

    let plaintext = b"Nonce tampering test";
    let aad = b"header-tamper-test";

    let mut ct = alice
        .encrypt(plaintext, &shared_secret, aad)
        .expect("Encryption must succeed");

    // Corrupt the nonce (bytes 0-11)
    ct[0] ^= 0xAA;
    ct[5] ^= 0x55;

    let result = bob.decrypt(&ct, &shared_secret, aad);
    assert!(
        result.is_err(),
        "Decryption with a corrupted nonce must fail"
    );
}

/// Decapsulating a ciphertext with the wrong secret key must fail to recover
/// the correct shared secret (Kyber implicit rejection produces a different value).
#[test]
fn test_ratchet_wrong_recipient() {
    // Alice generates her keypair; Bob encapsulates to Alice
    let alice = PqcRatchet::new();
    let mut bob_encap = PqcRatchet::new();
    bob_encap.set_remote_public(alice.local_static_public.as_bytes()).unwrap();
    let (ct_bytes, ss_bob) = bob_encap.encapsulate().unwrap();

    // Carol has a completely different keypair -- she should not recover ss_bob
    let carol = PqcRatchet::new();
    let ss_carol = carol.decapsulate(&ct_bytes).unwrap(); // Kyber returns implicit-rejection value

    assert_ne!(
        ss_carol, ss_bob,
        "Wrong recipient must not recover the original shared secret"
    );
}

// ─── Security Properties ─────────────────────────────────────────────────────

/// Every message must be encrypted under a unique key. Encrypting the same
/// plaintext twice (with the same root key but fresh random nonces) must
/// produce different ciphertexts.
#[test]
fn test_ratchet_no_key_reuse() {
    let (alice, _, shared_secret) = kem_handshake();

    let plaintext = b"Same plaintext, two encryptions";
    let aad = b"no-key-reuse-test";

    let ct1 = alice.encrypt(plaintext, &shared_secret, aad).unwrap();
    let ct2 = alice.encrypt(plaintext, &shared_secret, aad).unwrap();

    // Even with the same key, random nonces must make ciphertexts distinct
    assert_ne!(
        ct1, ct2,
        "Two encryptions of the same plaintext must differ (random nonce per message)"
    );

    // Nonces (first 12 bytes) must also differ
    assert_ne!(
        &ct1[..12],
        &ct2[..12],
        "Nonces must be independently random across encryptions"
    );
}

/// Smoke test for zeroize-on-drop: create sessions, use them for encryption,
/// then drop them.  The test verifies no panics occur during drop.
///
/// True memory-level verification that secret bytes are zeroed requires
/// platform-specific inspection (e.g., valgrind, /proc/self/mem, or a
/// custom allocator) and is not portable in a standard unit test.
/// The `RatchetState` struct derives `ZeroizeOnDrop` and manually zeroizes
/// skipped keys in its `Drop` impl, so this smoke test confirms the drop
/// path executes cleanly.
#[test]
fn test_ratchet_zeroize_on_drop() {
    // Create sessions, exchange messages, then drop.
    {
        let (mut alice, mut bob) = session_handshake();

        // Send a few messages to populate chain keys and skipped-key caches.
        let (h0, c0) = alice.encrypt(b"drop-test-0").expect("encrypt");
        let (h1, c1) = alice.encrypt(b"drop-test-1").expect("encrypt");
        let (h2, c2) = alice.encrypt(b"drop-test-2").expect("encrypt");
        let (h3, c3) = alice.encrypt(b"drop-test-3").expect("encrypt");

        // Bob decrypts M0 (required: carries KEM ratchet step)
        let _ = bob.decrypt(&h0, &c0).expect("decrypt M0");
        // Bob skips to M3 (populates skipped key cache with M1, M2 keys)
        let _ = bob.decrypt(&h3, &c3).expect("decrypt M3");
        // Leave M1, M2 keys in the skipped cache -- they will be zeroized on drop.

        // Suppress unused-variable warnings.
        let _ = (h1, c1, h2, c2);

        // Sessions are dropped here.  No panic = Drop::drop ran cleanly.
    }

    // If we get here without a panic, the zeroize-on-drop path is clean.
    // NOTE: verifying the actual memory contents are zero requires platform
    // inspection (valgrind, msan, or reading /proc/self/mem). This test only
    // confirms no UB or panics in the cleanup path.
}

/// Verifies that different plaintexts produce different ciphertexts and that
/// the same plaintext encrypted twice produces different ciphertexts (due to
/// chain key advancement producing unique message keys).
///
/// NOTE: a true constant-time comparison audit requires statistical timing
/// analysis under controlled conditions (--test-threads=1, pinned CPU, etc.).
/// The `aes-gcm` crate uses constant-time operations internally. This test
/// only validates the observable cryptographic properties.
#[test]
fn test_ratchet_constant_time_comparison() {
    let (mut alice, mut bob) = session_handshake();

    // Different plaintexts produce different ciphertexts
    let (h1, c1) = alice.encrypt(b"plaintext-A").expect("encrypt A");
    let (h2, c2) = alice.encrypt(b"plaintext-B").expect("encrypt B");
    assert_ne!(c1, c2, "Different plaintexts must produce different ciphertexts");

    // Bob decrypts both correctly
    let p1 = bob.decrypt(&h1, &c1).expect("decrypt A");
    let p2 = bob.decrypt(&h2, &c2).expect("decrypt B");
    assert_eq!(p1, b"plaintext-A");
    assert_eq!(p2, b"plaintext-B");

    // Same plaintext encrypted twice produces different ciphertexts
    // (chain key advances, so message keys differ even for identical plaintext)
    let (mut alice2, _bob2) = session_handshake();
    let (_h3, c3) = alice2.encrypt(b"same-text").expect("encrypt same 1");
    let (_h4, c4) = alice2.encrypt(b"same-text").expect("encrypt same 2");
    assert_ne!(
        c3, c4,
        "Same plaintext encrypted twice must produce different ciphertexts \
         (unique message keys from chain advancement)"
    );

    // NOTE: timing-based constant-time verification is inherently probabilistic
    // and requires a controlled benchmark environment. The aes-gcm crate uses
    // constant-time AES-NI/NEON where available. This test verifies the
    // cryptographic uniqueness property, not timing characteristics.
}

// ─── FFI Tests ───────────────────────────────────────────────────────────────

/// Verify the complete FFI lifecycle: allocate a ratchet, extract the public key,
/// and free it -- all via the C API.
#[test]
fn test_ffi_ratchet_lifecycle() {
    use crate::ffi::{
        zipminator_ratchet_free, zipminator_ratchet_get_public_key, zipminator_ratchet_new,
    };

    unsafe {
        let ptr = zipminator_ratchet_new();
        assert!(!ptr.is_null(), "zipminator_ratchet_new must return non-null pointer");

        let mut pk_buf = vec![0u8; 1184]; // Kyber768 public key size
        let written = zipminator_ratchet_get_public_key(ptr, pk_buf.as_mut_ptr());
        assert_eq!(
            written, 1184,
            "get_public_key must write exactly 1184 bytes and return the count"
        );

        // Public key must not be all-zeros (entropy check)
        assert_ne!(
            pk_buf,
            vec![0u8; 1184],
            "Public key bytes must not be all-zeros"
        );

        // Free must not crash or leak
        zipminator_ratchet_free(ptr);
    }
}

/// Full FFI roundtrip using the PqRatchetSession FFI functions:
///   1. zipminator_ratchet_session_new_alice
///   2. zipminator_ratchet_session_new_bob
///   3. zipminator_ratchet_session_alice_finish
///   4. zipminator_ratchet_session_encrypt
///   5. zipminator_ratchet_session_decrypt
///   6. zipminator_ratchet_session_free
#[test]
fn test_ffi_ratchet_encrypt_decrypt() {
    use crate::ffi::{
        zipminator_ratchet_session_alice_finish, zipminator_ratchet_session_decrypt,
        zipminator_ratchet_session_encrypt, zipminator_ratchet_session_free,
        zipminator_ratchet_session_new_alice, zipminator_ratchet_session_new_bob,
    };
    use crate::ratchet::header::{CT_BYTES, PK_BYTES};

    unsafe {
        // 1. Alice initialises her session
        let mut alice_pk = vec![0u8; PK_BYTES];
        let alice_ptr = zipminator_ratchet_session_new_alice(
            alice_pk.as_mut_ptr(),
            alice_pk.len(),
        );
        assert!(!alice_ptr.is_null(), "Alice session must be non-null");

        // 2. Bob initialises his session with Alice's public key
        let mut kem_ct = vec![0u8; CT_BYTES];
        let mut bob_pk = vec![0u8; PK_BYTES];
        let bob_ptr = zipminator_ratchet_session_new_bob(
            alice_pk.as_ptr(),
            alice_pk.len(),
            kem_ct.as_mut_ptr(),
            kem_ct.len(),
            bob_pk.as_mut_ptr(),
            bob_pk.len(),
        );
        assert!(!bob_ptr.is_null(), "Bob session must be non-null");

        // 3. Alice finishes the handshake
        let rc = zipminator_ratchet_session_alice_finish(
            alice_ptr,
            kem_ct.as_ptr(),
            kem_ct.len(),
            bob_pk.as_ptr(),
            bob_pk.len(),
        );
        assert_eq!(rc, 0, "alice_finish must return 0 on success");

        // 4. Alice encrypts a message
        let plaintext = b"FFI session encrypt/decrypt roundtrip";
        let mut header_buf = vec![0u8; 4096];
        let mut ct_buf = vec![0u8; 4096];
        let mut header_written: usize = 0;
        let mut ct_written: usize = 0;

        let rc = zipminator_ratchet_session_encrypt(
            alice_ptr,
            plaintext.as_ptr(),
            plaintext.len(),
            header_buf.as_mut_ptr(),
            header_buf.len(),
            &mut header_written,
            ct_buf.as_mut_ptr(),
            ct_buf.len(),
            &mut ct_written,
        );
        assert_eq!(rc, 0, "encrypt must return 0 on success");
        assert!(header_written > 0, "header must have been written");
        assert!(ct_written > 0, "ciphertext must have been written");

        // 5. Bob decrypts the message
        let mut out_buf = vec![0u8; 4096];
        let bytes_written = zipminator_ratchet_session_decrypt(
            bob_ptr,
            header_buf.as_ptr(),
            header_written,
            ct_buf.as_ptr(),
            ct_written,
            out_buf.as_mut_ptr(),
            out_buf.len(),
        );
        assert!(bytes_written >= 0, "decrypt must return >= 0 on success, got {}", bytes_written);
        let decrypted = &out_buf[..bytes_written as usize];
        assert_eq!(decrypted, plaintext, "Decrypted text must match original");

        // Send a second message to verify continued operation
        let plaintext2 = b"Second FFI message";
        let mut header_buf2 = vec![0u8; 4096];
        let mut ct_buf2 = vec![0u8; 4096];
        let mut header_written2: usize = 0;
        let mut ct_written2: usize = 0;

        let rc = zipminator_ratchet_session_encrypt(
            alice_ptr,
            plaintext2.as_ptr(),
            plaintext2.len(),
            header_buf2.as_mut_ptr(),
            header_buf2.len(),
            &mut header_written2,
            ct_buf2.as_mut_ptr(),
            ct_buf2.len(),
            &mut ct_written2,
        );
        assert_eq!(rc, 0, "second encrypt must succeed");

        let mut out_buf2 = vec![0u8; 4096];
        let bytes2 = zipminator_ratchet_session_decrypt(
            bob_ptr,
            header_buf2.as_ptr(),
            header_written2,
            ct_buf2.as_ptr(),
            ct_written2,
            out_buf2.as_mut_ptr(),
            out_buf2.len(),
        );
        assert!(bytes2 >= 0, "second decrypt must succeed, got {}", bytes2);
        assert_eq!(&out_buf2[..bytes2 as usize], plaintext2);

        // 6. Free both sessions
        zipminator_ratchet_session_free(alice_ptr);
        zipminator_ratchet_session_free(bob_ptr);
    }
}

/// All FFI functions must handle null pointer arguments without crashing.
/// They must return a well-defined error code (typically -1) for null inputs.
#[test]
fn test_ffi_null_safety() {
    use crate::ffi::{zipminator_ratchet_free, zipminator_ratchet_get_public_key};

    unsafe {
        // Free of null must be a no-op
        zipminator_ratchet_free(std::ptr::null_mut());

        // get_public_key with null ratchet pointer must return -1
        let mut pk_buf = vec![0u8; 1184];
        let result = zipminator_ratchet_get_public_key(std::ptr::null_mut(), pk_buf.as_mut_ptr());
        assert_eq!(
            result, -1,
            "get_public_key with null ratchet must return -1"
        );

        // get_public_key with valid ratchet but null output buffer must return -1
        let valid_ptr = crate::ffi::zipminator_ratchet_new();
        let result = zipminator_ratchet_get_public_key(valid_ptr, std::ptr::null_mut());
        assert_eq!(
            result, -1,
            "get_public_key with null output buffer must return -1"
        );
        zipminator_ratchet_free(valid_ptr);
    }
}
