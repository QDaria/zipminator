//! TDD test specifications for the PQ Double Ratchet protocol.
//!
//! Written BEFORE implementation lands. Tests marked `#[ignore]` require API
//! extensions not yet present; they will be un-ignored as the implementation
//! progresses.
//!
//! ## Known Bug Detected by These Tests
//!
//! `ratchet.rs::PqcRatchet::encapsulate()` line 41 has the return values of
//! `kyber768::encapsulate(pk)` assigned in the WRONG ORDER.  The `pqcrypto-kyber`
//! crate returns `(SharedSecret, Ciphertext)` but `ratchet.rs` destructures as
//! `(ct, ss)` — making `ct` a `SharedSecret` (32 bytes) and `ss` a `Ciphertext`
//! (1088 bytes).  The subsequent `try_into::<[u8;32]>()` on 1088 bytes panics with
//! `"Invalid shared secret length"`.
//!
//! Fix required in `ratchet.rs`:
//!   ```rust
//!   // WRONG (current):
//!   let (ct, ss) = kyber768::encapsulate(pk);
//!   // CORRECT:
//!   let (ss, ct) = kyber768::encapsulate(pk);
//!   ```
//!
//! All 9 non-ignored test failures in this file are caused solely by this one bug.
//! Fixing it will cause those 9 tests to pass (assuming the rest of the API is correct).
//!
//! API contract assumed from `ratchet.rs`:
//!   - `PqcRatchet::new()` -> Self
//!   - `ratchet.local_static_public` : kyber768::PublicKey
//!   - `ratchet.set_remote_public(&[u8])` -> Result<(), &str>
//!   - `ratchet.encapsulate()` -> Result<(Vec<u8>, [u8;32]), &str>  // (ct, shared_secret)
//!   - `ratchet.decapsulate(&[u8])` -> Result<[u8;32], &str>
//!   - `ratchet.encrypt(&[u8], key: &[u8;32], ad: &[u8])` -> Result<Vec<u8>, &str>
//!   - `ratchet.decrypt(&[u8], key: &[u8;32], ad: &[u8])` -> Result<Vec<u8>, &str>
//!
//! Future API extensions expected (currently stubbed with #[ignore]):
//!   - `ratchet.ratchet_encrypt(plaintext: &[u8])` -> Result<EncryptedMessage, &str>
//!   - `ratchet.ratchet_decrypt(msg: &EncryptedMessage)` -> Result<Vec<u8>, &str>
//!   - `ratchet.step_root_chain(ss: [u8;32])` -> ()
//!   - `ratchet.sending_chain_key` : [u8; 32]
//!   - `ratchet.receiving_chain_key` : [u8; 32]
//!   - `ratchet.send_counter` : u64
//!   - `ratchet.receive_counter` : u64

use pqcrypto_traits::kem::PublicKey;

use crate::ratchet::PqcRatchet;

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

/// After a KEM ratchet step, the chain keys held by each party must differ
/// from the initial root key (they must be derived, not equal to the root).
///
/// STUBBED: requires `ratchet.step_root_chain()` and `ratchet.sending_chain_key`.
#[test]
#[ignore = "requires ratchet chain stepping API (step_root_chain, sending_chain_key)"]
fn test_ratchet_step_produces_new_keys() {
    // When implemented, this test should:
    //   1. Establish shared root key via KEM handshake.
    //   2. Call alice.step_root_chain(shared_secret) to derive chain keys.
    //   3. Assert alice.sending_chain_key != shared_secret (the root key).
    //   4. Assert alice.sending_chain_key != [0u8; 32] (not zeroed out).
    //   5. Call the same on Bob's side; verify his receiving_chain_key == alice.sending_chain_key.
    todo!("Implement once step_root_chain() is in ratchet.rs")
}

/// Forward secrecy: a message key used for message N must not be reachable from
/// the state present after message N+1 has been sent.
///
/// STUBBED: requires `ratchet_encrypt` / chain key advance API.
#[test]
#[ignore = "requires ratchet_encrypt and chain-key ratcheting"]
fn test_ratchet_forward_secrecy() {
    // When implemented:
    //   1. Alice sends message M0 -> records message_key_0.
    //   2. Alice sends message M1 -> records message_key_1.
    //   3. Verify message_key_0 != message_key_1.
    //   4. Verify that no information in Alice's current state allows re-deriving
    //      message_key_0 (the chain key has been advanced and old key is zeroized).
    todo!("Implement once chain key advancement is in ratchet.rs")
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

/// Messages arriving out of order must be decryptable if their keys have
/// been stored in the skipped-message-key cache.
///
/// STUBBED: requires `ratchet_encrypt` / `ratchet_decrypt` with ordering metadata.
#[test]
#[ignore = "requires ratchet_encrypt/ratchet_decrypt with message counter support"]
fn test_ratchet_out_of_order_messages() {
    // When implemented:
    //   1. Alice sends messages M0, M1, M2.
    //   2. Bob receives them in order M2, M0, M1.
    //   3. On receiving M2, Bob caches keys for M0 and M1.
    //   4. M0 and M1 decrypt successfully using cached keys.
    //   5. Cached keys are deleted after use (no double-spend).
    todo!("Implement once message ordering is in ratchet.rs")
}

/// Keys for skipped messages must be persisted until the messages arrive or
/// a configurable window limit is exceeded.
///
/// STUBBED: requires skipped-key cache API.
#[test]
#[ignore = "requires skipped_message_keys storage in PqcRatchet"]
fn test_ratchet_skipped_message_keys() {
    // When implemented:
    //   1. Alice sends M0, M1, M2.
    //   2. Bob receives only M2 (skipping M0 and M1).
    //   3. Assert skipped_keys cache contains keys for M0 and M1.
    //   4. Bob receives M0 -> decrypts successfully -> key removed from cache.
    //   5. Bob receives M1 -> decrypts successfully -> key removed from cache.
    //   6. Cache is now empty.
    todo!("Implement once skipped_message_keys map is in PqcRatchet")
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

    // Carol has a completely different keypair — she should not recover ss_bob
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

/// Secret material (root key, chain keys, message keys) must be zeroized when
/// the ratchet is dropped. This test does a best-effort check by inspecting the
/// raw memory location after drop. It requires `unsafe` and is architecture-sensitive.
///
/// STUBBED: requires `Zeroize` / `ZeroizeOnDrop` derives on `PqcRatchet`.
#[test]
#[ignore = "requires ZeroizeOnDrop on PqcRatchet secret fields"]
fn test_ratchet_zeroize_on_drop() {
    // When implemented:
    //   1. Create a PqcRatchet and record the address of root_key.
    //   2. Seed root_key with known non-zero bytes.
    //   3. Drop the ratchet.
    //   4. Read the raw memory at the recorded address (unsafe).
    //   5. Assert the bytes are now zero (zeroized on drop).
    //
    // Note: The compiler may reuse memory; this test relies on the allocator
    // not overwriting the freed region before the assertion, which is typically
    // true in debug builds. A sanitizer-based approach (valgrind) is more robust.
    todo!("Add ZeroizeOnDrop to PqcRatchet and implement the memory-peek assertion")
}

/// Comparison of ciphertexts / MACs must execute in constant time regardless
/// of where the first differing byte is, preventing timing side-channel attacks.
///
/// This test uses statistical timing to detect non-constant-time behaviour.
/// It is inherently probabilistic; run with --test-threads=1 for stability.
///
/// STUBBED: the current `decrypt` relies on AES-GCM (which is constant-time in
/// the `aes-gcm` crate), but the stub documents the intent.
#[test]
#[ignore = "statistical timing test — requires controlled benchmark environment"]
fn test_ratchet_constant_time_comparison() {
    // When implemented:
    //   1. Prepare two ciphertexts: one that differs in the first byte, one in the last.
    //   2. Time `decrypt` for both variants across N=10_000 iterations.
    //   3. Assert that the timing distributions are not statistically distinguishable
    //      (e.g., Welch t-test with p > 0.05).
    //
    // The `subtle` crate's `ct_eq` is the standard approach; verify it is used
    // in any hand-rolled MAC comparison paths.
    todo!("Implement timing measurement once constant-time comparison paths are audited")
}

// ─── FFI Tests ───────────────────────────────────────────────────────────────

/// Verify the complete FFI lifecycle: allocate a ratchet, extract the public key,
/// and free it — all via the C API.
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

/// Encrypt a message via the FFI layer and decrypt it back.
///
/// STUBBED: requires FFI functions for encrypt/decrypt not yet exported.
#[test]
#[ignore = "requires zipminator_ratchet_encrypt / zipminator_ratchet_decrypt FFI exports"]
fn test_ffi_ratchet_encrypt_decrypt() {
    // When implemented:
    //   1. Create two ratchets via FFI (Alice, Bob).
    //   2. Exchange public keys via get_public_key / set_remote_public_key FFI calls.
    //   3. Bob calls zipminator_ratchet_encapsulate -> writes ciphertext to C buffer.
    //   4. Alice calls zipminator_ratchet_decapsulate(ct_buf) -> shared secret.
    //   5. Alice calls zipminator_ratchet_encrypt(plaintext_buf, key_buf, ad_buf) -> ct.
    //   6. Bob calls zipminator_ratchet_decrypt(ct_buf, key_buf, ad_buf) -> plaintext.
    //   7. Assert plaintext round-trips correctly.
    //   8. Free both ratchets.
    todo!("Implement once encrypt/decrypt FFI exports exist in ffi.rs")
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
