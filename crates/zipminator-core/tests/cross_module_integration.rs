//! Cross-module integration tests exercising new Zipminator modules together.
//!
//! Tests: anonymize, message_store, email_transport, voip_session in combined workflows.

use zipminator_core::anonymize::{anonymize_text, AnonymizationLevel};
use zipminator_core::email_transport::{SelfDestructTimer, WipeMethod};
use zipminator_core::message_store::{EncryptedMessage, InMemoryMessageStore, MessageStore};
use zipminator_core::ratchet::PqRatchetSession;
use zipminator_core::voip_session::{SessionState, VoipSessionManager};

// ── 1. Encrypt-anonymize-store pipeline ─────────────────────────────────────

#[test]
fn encrypt_anonymize_store_roundtrip() {
    let input = "Contact SSN: 123-45-6789 for details";

    // Step 1: Anonymize at level 4 (TypeReplace)
    let anon = anonymize_text(input, AnonymizationLevel::TypeReplace, &["us"]);
    assert!(
        anon.text.contains("[NATIONAL_ID]"),
        "SSN should be replaced with [NATIONAL_ID], got: {}",
        anon.text
    );
    assert!(!anon.text.contains("123-45-6789"), "Original SSN must be gone");

    // Step 2: Set up ratchet sessions (alice sends, bob receives)
    let (mut alice, alice_pk) = PqRatchetSession::init_alice();
    let (mut bob, kem_ct, bob_pk) = PqRatchetSession::init_bob(&alice_pk).unwrap();
    alice.alice_finish_handshake(&kem_ct, &bob_pk).unwrap();

    // Step 3: Encrypt anonymized text and store
    let mut store = InMemoryMessageStore::new();
    let msg_id = alice
        .encrypt_and_store(&mut store, "conv-1", "alice", anon.text.as_bytes(), 0)
        .unwrap();

    // Step 4: Retrieve and decrypt
    let plaintext = bob.retrieve_and_decrypt(&store, &msg_id).unwrap();
    let recovered = String::from_utf8(plaintext).unwrap();

    // Step 5: Verify anonymized text survives the encrypt/store/decrypt round-trip
    assert_eq!(recovered, anon.text);
    assert!(recovered.contains("[NATIONAL_ID]"));
    assert!(!recovered.contains("123-45-6789"));
}

// ── 2. Email envelope with self-destruct ────────────────────────────────────

#[test]
fn email_self_destruct_wipe() {
    let dir = std::env::temp_dir().join("zipminator_integ_destruct");
    std::fs::create_dir_all(&dir).ok();
    let path = dir.join("secret_email.bin");

    // Write fake encrypted email payload
    std::fs::write(&path, b"PQC encrypted email body here").unwrap();
    assert!(path.exists());

    // Create timer that expires at t=1000
    let timer = SelfDestructTimer::new("email-001".into(), 1000, WipeMethod::Overwrite3Pass);

    // Before expiry: not expired
    assert!(!timer.is_expired(999));

    // At expiry: expired
    assert!(timer.is_expired(1000));

    // Past expiry: execute DoD 3-pass wipe
    assert!(timer.is_expired(1001));
    timer.execute_wipe(&path).expect("wipe should succeed");

    // File must be gone
    assert!(!path.exists(), "File should be wiped after self-destruct");

    // Wipe on already-gone file is idempotent
    assert!(timer.execute_wipe(&path).is_ok());

    std::fs::remove_dir_all(&dir).ok();
}

// ── 3. VoIP full handshake ──────────────────────────────────────────────────

#[test]
fn voip_full_handshake_matching_keys() {
    let mut mgr = VoipSessionManager::new();

    // Offerer creates offer
    let (mut offerer, offer) = mgr.create_offer();
    assert_eq!(offerer.state, SessionState::Offering);

    // Answerer accepts offer
    let (answerer, answer) = mgr.accept_offer(&offer).unwrap();
    assert_eq!(answerer.state, SessionState::Connected);

    // Offerer completes handshake
    VoipSessionManager::complete_handshake(&mut offerer, &answer).unwrap();
    assert_eq!(offerer.state, SessionState::Connected);

    // Both sides Connected
    assert_eq!(offerer.state, SessionState::Connected);
    assert_eq!(answerer.state, SessionState::Connected);

    // SRTP keys match cross-wise: offerer.local == answerer.remote, and vice versa
    assert_eq!(
        offerer.local_keys,
        *answerer.remote_keys.as_ref().unwrap(),
        "Offerer local keys must match answerer's view of offerer keys"
    );
    assert_eq!(
        answerer.local_keys,
        *offerer.remote_keys.as_ref().unwrap(),
        "Answerer local keys must match offerer's view of answerer keys"
    );

    // Sender and receiver keys must differ (asymmetric labels)
    assert_ne!(offerer.local_keys, answerer.local_keys);
}

// ── 4. Anonymization level progression ──────────────────────────────────────

#[test]
fn anonymization_all_levels_differ() {
    let input = "SSN: 123-45-6789";
    let mut outputs = Vec::new();

    for v in 1..=10u8 {
        let level = AnonymizationLevel::from_u8(v).unwrap();
        let result = anonymize_text(input, level, &["us"]);
        outputs.push(result.text.clone());
    }

    // Level 1 (Highlight) returns original unchanged
    assert_eq!(outputs[0], input);

    // Level 10 (FullRedaction) must contain only [REDACTED] tokens (no SSN digits)
    assert!(
        outputs[9].contains("[REDACTED]"),
        "Level 10 must contain [REDACTED], got: {}",
        outputs[9]
    );
    assert!(
        !outputs[9].contains("123"),
        "Level 10 must not retain SSN digits"
    );

    // Each level (2-10) must differ from the original input
    for (i, out) in outputs.iter().enumerate().skip(1) {
        assert_ne!(
            out, &input,
            "Level {} output should differ from raw input",
            i + 1
        );
    }

    // Levels 2-10 should not all be identical (different strategies produce different output)
    let unique_count = outputs[1..].iter().collect::<std::collections::HashSet<_>>().len();
    assert!(
        unique_count >= 3,
        "Expected at least 3 distinct outputs across levels 2-10, got {}",
        unique_count
    );
}

// ── 5. Message store conversation flow ──────────────────────────────────────

#[test]
fn message_store_conversation_lifecycle() {
    let mut store = InMemoryMessageStore::new();
    let conv_id = "conv-lifecycle";

    // Store 5 messages
    for seq in 0..5u32 {
        let msg = EncryptedMessage {
            id: format!("msg-{seq}"),
            conversation_id: conv_id.into(),
            sender: "alice".into(),
            ciphertext: vec![0xAA; 48],
            nonce: vec![0xBB; 12],
            timestamp: 1710000000 + seq as u64,
            sequence: seq,
        };
        store.store_message(msg).unwrap();
    }

    // Retrieve conversation: verify count and order
    let msgs = store.get_conversation(conv_id).unwrap();
    assert_eq!(msgs.len(), 5);
    for (i, m) in msgs.iter().enumerate() {
        assert_eq!(m.sequence, i as u32, "Messages must be in sequence order");
    }

    // Delete one message
    assert!(store.delete_message("msg-2").unwrap());
    let msgs = store.get_conversation(conv_id).unwrap();
    assert_eq!(msgs.len(), 4, "Should have 4 after deleting one");
    assert!(
        msgs.iter().all(|m| m.id != "msg-2"),
        "Deleted message must not appear"
    );

    // Delete entire conversation
    let deleted = store.delete_conversation(conv_id).unwrap();
    assert_eq!(deleted, 4);
    let msgs = store.get_conversation(conv_id).unwrap();
    assert!(msgs.is_empty(), "Conversation must be empty after deletion");
}
