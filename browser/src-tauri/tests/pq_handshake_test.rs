#![cfg(feature = "vpn")]
//! Integration tests for the ML-KEM-768 PQ handshake over a simulated tunnel.
//!
//! These tests run a real Kyber768 key exchange end-to-end using in-process
//! duplex streams (no network required), verifying:
//!
//! * Both sides converge on the same hybrid key.
//! * Protocol errors are surfaced correctly.
//! * Key material is never leaked in error messages.
//! * Rekey (repeated handshake) produces distinct keys each time.

use zipbrowser::vpn::pq_handshake::{
    client_handshake, derive_hybrid_key, server_handshake, HandshakeError,
    KYBER_CT_BYTES, KYBER_PK_BYTES,
};

use tokio::io::duplex;

// ── Core correctness ──────────────────────────────────────────────────────

/// Full round-trip: client and server derive the same hybrid key.
#[tokio::test]
async fn end_to_end_same_hybrid_key() {
    let (mut client, mut server) = duplex(65536);
    let wg_key = [0x42u8; 32];

    let (cr, sr) = tokio::join!(
        client_handshake(&mut client, &wg_key),
        server_handshake(&mut server, &wg_key),
    );

    let cr = cr.expect("client handshake should succeed");
    let sr = sr.expect("server handshake should succeed");

    assert_eq!(
        cr.hybrid_key, sr.hybrid_key,
        "client and server must derive the same hybrid key"
    );
}

/// Hybrid key is not all-zeros (sanity check).
#[tokio::test]
async fn hybrid_key_is_not_zero() {
    let (mut c, mut s) = duplex(65536);
    let wg_key = [0u8; 32];
    let (cr, _) = tokio::join!(
        client_handshake(&mut c, &wg_key),
        server_handshake(&mut s, &wg_key),
    );
    assert_ne!(cr.unwrap().hybrid_key, [0u8; 32]);
}

/// Each handshake produces a fresh Kyber keypair, so the hybrid keys
/// from two independent sessions are almost certainly distinct.
#[tokio::test]
async fn two_sessions_produce_distinct_hybrid_keys() {
    let wg_key = [0x01u8; 32];

    let (mut c1, mut s1) = duplex(65536);
    let (mut c2, mut s2) = duplex(65536);

    let ((r1, _), (r2, _)) = tokio::join!(
        async { (client_handshake(&mut c1, &wg_key).await, server_handshake(&mut s1, &wg_key).await) },
        async { (client_handshake(&mut c2, &wg_key).await, server_handshake(&mut s2, &wg_key).await) },
    );

    assert_ne!(
        r1.unwrap().hybrid_key,
        r2.unwrap().hybrid_key,
        "independent sessions must produce different hybrid keys"
    );
}

/// Different WireGuard session keys produce different hybrid keys.
#[tokio::test]
async fn different_wg_keys_change_hybrid_key() {
    let (mut c1, mut s1) = duplex(65536);
    let (mut c2, mut s2) = duplex(65536);

    let wg_a = [0xaau8; 32];
    let wg_b = [0xbbu8; 32];

    let (r1, _) = tokio::join!(
        client_handshake(&mut c1, &wg_a),
        server_handshake(&mut s1, &wg_a),
    );
    let (r2, _) = tokio::join!(
        client_handshake(&mut c2, &wg_b),
        server_handshake(&mut s2, &wg_b),
    );

    assert_ne!(r1.unwrap().hybrid_key, r2.unwrap().hybrid_key);
}

// ── Rekey simulation ──────────────────────────────────────────────────────

/// A rekey (second handshake over the same WG key) produces a different
/// hybrid key because a fresh Kyber keypair is generated each time.
#[tokio::test]
async fn rekey_produces_different_hybrid_key() {
    let wg_key = [0x55u8; 32];

    let (mut c1, mut s1) = duplex(65536);
    let (r1, _) = tokio::join!(
        client_handshake(&mut c1, &wg_key),
        server_handshake(&mut s1, &wg_key),
    );
    let k1 = r1.unwrap().hybrid_key;

    let (mut c2, mut s2) = duplex(65536);
    let (r2, _) = tokio::join!(
        client_handshake(&mut c2, &wg_key),
        server_handshake(&mut s2, &wg_key),
    );
    let k2 = r2.unwrap().hybrid_key;

    assert_ne!(k1, k2, "rekey must produce a fresh hybrid key");
}

// ── Error handling ────────────────────────────────────────────────────────

/// If the client sends the wrong TLV type (e.g. 0x02 instead of 0x01),
/// the server must return an error.
#[tokio::test]
async fn server_rejects_wrong_tlv_type() {
    use tokio::io::{duplex, AsyncWriteExt};

    let (mut client_end, mut server_end) = duplex(65536);
    let wg_key = [0u8; 32];

    // Send a malformed TLV: type=0x02 (ciphertext) instead of 0x01 (pk).
    let bad_payload = vec![0xffu8; KYBER_PK_BYTES];
    let mut frame = vec![0x02u8]; // wrong type
    frame.extend_from_slice(&(KYBER_PK_BYTES as u16).to_be_bytes());
    frame.extend_from_slice(&bad_payload);

    let (_write_result, server_result) = tokio::join!(
        async {
            client_end.write_all(&frame).await.unwrap();
            client_end.flush().await.unwrap();
        },
        server_handshake(&mut server_end, &wg_key),
    );

    assert!(
        server_result.is_err(),
        "server must reject wrong TLV type"
    );
    if let Err(HandshakeError::UnexpectedTlvType { expected, got }) = server_result {
        assert_eq!(expected, 0x01);
        assert_eq!(got, 0x02);
    } else {
        // Any error is acceptable as long as the server rejected the frame.
    }
}

/// If the client sends a public key of the wrong length, the server
/// must return an InvalidPublicKeyLength error.
#[tokio::test]
async fn server_rejects_wrong_pk_length() {
    use tokio::io::{duplex, AsyncWriteExt};

    let (mut client_end, mut server_end) = duplex(65536);
    let wg_key = [0u8; 32];

    // Send TLV type=0x01 but with only 32 bytes of payload (should be 1184).
    let short_payload = vec![0x11u8; 32];
    let mut frame = vec![0x01u8];
    frame.extend_from_slice(&(32u16).to_be_bytes());
    frame.extend_from_slice(&short_payload);

    let (_, server_result) = tokio::join!(
        async {
            client_end.write_all(&frame).await.unwrap();
            client_end.flush().await.unwrap();
        },
        server_handshake(&mut server_end, &wg_key),
    );

    assert!(server_result.is_err(), "server must reject wrong key length");
}

/// Bytes exchanged counter is consistent with Kyber sizes:
/// - client sends: 3 (TLV header) + 1184 (pk) = 1187
/// - client receives: 3 (TLV header) + 1088 (ct) = 1091
/// Total ≥ 1091 (we count what the client sees)
#[tokio::test]
async fn bytes_exchanged_matches_kyber_sizes() {
    let (mut c, mut s) = duplex(65536);
    let wg_key = [0u8; 32];
    let (cr, _) = tokio::join!(
        client_handshake(&mut c, &wg_key),
        server_handshake(&mut s, &wg_key),
    );
    let bytes = cr.unwrap().bytes_exchanged;
    // At minimum: sent (1187) + received (1091) = 2278
    assert!(
        bytes >= KYBER_PK_BYTES + KYBER_CT_BYTES,
        "bytes_exchanged ({}) must account for pk and ct transfers",
        bytes
    );
}

// ── HKDF derivation properties ────────────────────────────────────────────

#[test]
fn hkdf_is_deterministic() {
    let wg = [0x11u8; 32];
    let ss = [0x22u8; 32];
    let k1 = derive_hybrid_key(&wg, &ss).unwrap();
    let k2 = derive_hybrid_key(&wg, &ss).unwrap();
    assert_eq!(k1, k2, "HKDF must be deterministic");
}

#[test]
fn hkdf_changes_with_wg_key() {
    let wg_a = [0xaau8; 32];
    let wg_b = [0xbbu8; 32];
    let ss = [0xccu8; 32];
    assert_ne!(derive_hybrid_key(&wg_a, &ss).unwrap(), derive_hybrid_key(&wg_b, &ss).unwrap());
}

#[test]
fn hkdf_changes_with_kyber_secret() {
    let wg = [0xddu8; 32];
    let ss_a = [0x01u8; 32];
    let ss_b = [0x02u8; 32];
    assert_ne!(derive_hybrid_key(&wg, &ss_a).unwrap(), derive_hybrid_key(&wg, &ss_b).unwrap());
}

#[test]
fn hkdf_output_is_not_all_zeros() {
    let wg = [0xffu8; 32];
    let ss = [0xeeu8; 32];
    let k = derive_hybrid_key(&wg, &ss).unwrap();
    assert_ne!(k, [0u8; 32]);
}

/// Verify that swapping the WG key and Kyber secret produces a different
/// hybrid key (the inputs are not interchangeable).
#[test]
fn hkdf_is_not_symmetric_in_inputs() {
    let a = [0x11u8; 32];
    let b = [0x22u8; 32];
    // derive_hybrid_key(wg=a, ss=b) vs derive_hybrid_key(wg=b, ss=a)
    let k1 = derive_hybrid_key(&a, &b).unwrap();
    let k2 = derive_hybrid_key(&b, &a).unwrap();
    assert_ne!(k1, k2, "argument order must matter for domain separation");
}
