//! ML-KEM-768 (Kyber768) post-quantum handshake over an established WireGuard tunnel.
//!
//! ## Protocol
//!
//! After WireGuard completes its Noise handshake (Curve25519 key agreement), this
//! module performs an additional Kyber768 key exchange *inside* the encrypted
//! WireGuard tunnel:
//!
//! ```text
//! Client                                Server
//! ──────                                ──────
//! kyber_keypair() → (pk, sk)
//! send TLV(0x01, pk) ─────────────────→ recv pk
//!                                        encapsulate(pk) → (ss_s, ct)
//!                   ←──────────────── send TLV(0x02, ct)
//! decapsulate(ct, sk) → ss_c
//! assert ss_c == ss_s  (guaranteed by KEM correctness)
//!
//! hybrid_key = HKDF-SHA256(wg_key ‖ ss_c, info="zipminator-pq-wireguard")
//! ```
//!
//! The resulting 32-byte `hybrid_key` replaces the WireGuard session key for
//! all subsequent application-layer traffic, binding both a classical and a
//! post-quantum layer.
//!
//! ## Wire format
//!
//! Messages use a 3-byte TLV (type–length–value) header:
//!
//! ```text
//! ┌────────┬─────────────────┬───────────────────┐
//! │ type   │ length (BE u16) │ value             │
//! │ 1 byte │ 2 bytes         │ `length` bytes    │
//! └────────┴─────────────────┴───────────────────┘
//! ```
//!
//! | Type | Meaning               | Value                         |
//! |------|-----------------------|-------------------------------|
//! | 0x01 | Client public key     | 1184 bytes (Kyber768 pk)      |
//! | 0x02 | Server KEM ciphertext | 1088 bytes (Kyber768 ct)      |

use hkdf::Hkdf;
use pqcrypto_kyber::kyber768;
use pqcrypto_traits::kem::{Ciphertext as _, PublicKey as _, SecretKey as _, SharedSecret as _};
use sha2::Sha256;
use thiserror::Error;
use tokio::io::{AsyncRead, AsyncReadExt, AsyncWrite, AsyncWriteExt};
use tracing::{debug, info};
use zeroize::{Zeroize, ZeroizeOnDrop};

// ── Constants ──────────────────────────────────────────────────────────────

/// TLV message type: client sends its Kyber768 public key.
pub const TLV_TYPE_PK: u8 = 0x01;
/// TLV message type: server sends the KEM ciphertext.
pub const TLV_TYPE_CT: u8 = 0x02;

/// Kyber768 public key size in bytes.
pub const KYBER_PK_BYTES: usize = 1184;
/// Kyber768 ciphertext size in bytes.
pub const KYBER_CT_BYTES: usize = 1088;
/// Kyber768 shared secret size in bytes.
pub const KYBER_SS_BYTES: usize = 32;

/// HKDF info string for hybrid key derivation.
/// Matches the mobile implementation (`PQWireGuard.swift` / `PQWireGuard.kt`).
const HKDF_INFO: &[u8] = b"zipminator-pq-wireguard";

/// Maximum TLV payload we accept (sanity limit to avoid OOM on malformed input).
const MAX_TLV_PAYLOAD: u16 = 4096;

// ── Errors ─────────────────────────────────────────────────────────────────

/// Errors that can occur during the PQ handshake.
#[derive(Debug, Error)]
pub enum HandshakeError {
    #[error("I/O error during handshake: {0}")]
    Io(#[from] std::io::Error),

    #[error("unexpected TLV type: expected {expected:#04x}, got {got:#04x}")]
    UnexpectedTlvType { expected: u8, got: u8 },

    #[error("TLV payload length {length} exceeds maximum {MAX_TLV_PAYLOAD}")]
    TlvPayloadTooLarge { length: u16 },

    #[error("Kyber768 public key has wrong length: expected {KYBER_PK_BYTES}, got {0}")]
    InvalidPublicKeyLength(usize),

    #[error("Kyber768 ciphertext has wrong length: expected {KYBER_CT_BYTES}, got {0}")]
    InvalidCiphertextLength(usize),

    #[error("failed to parse Kyber768 public key from bytes")]
    MalformedPublicKey,

    #[error("failed to parse Kyber768 ciphertext from bytes")]
    MalformedCiphertext,

    #[error("HKDF expansion failed")]
    HkdfError,
}

// ── Zeroizing key material ─────────────────────────────────────────────────

/// Kyber768 secret key bytes that zeroize on drop.
#[derive(Zeroize, ZeroizeOnDrop)]
struct SecretKeyBytes([u8; 2400]);

/// 32-byte shared secret that zeroizes on drop.
#[derive(Zeroize, ZeroizeOnDrop)]
pub struct SharedSecretBytes(pub [u8; KYBER_SS_BYTES]);

/// The result of a completed PQ handshake.
#[derive(Zeroize, ZeroizeOnDrop)]
pub struct HandshakeResult {
    /// 32-byte hybrid key: `HKDF-SHA256(wg_session_key ‖ kyber_ss)`.
    pub hybrid_key: [u8; 32],
    /// Number of bytes exchanged during the handshake (for metrics).
    #[zeroize(skip)]
    pub bytes_exchanged: usize,
}

// ── TLV wire protocol ──────────────────────────────────────────────────────

/// Write a TLV frame to `writer`.
///
/// Frame: `[type (1)] [length BE u16 (2)] [payload (length bytes)]`
async fn write_tlv<W: AsyncWrite + Unpin>(
    writer: &mut W,
    tlv_type: u8,
    payload: &[u8],
) -> Result<usize, HandshakeError> {
    let len = payload.len() as u16;
    let mut frame = Vec::with_capacity(3 + payload.len());
    frame.push(tlv_type);
    frame.extend_from_slice(&len.to_be_bytes());
    frame.extend_from_slice(payload);
    writer.write_all(&frame).await?;
    writer.flush().await?;
    Ok(frame.len())
}

/// Read a TLV frame from `reader`, returning `(type, payload)`.
///
/// Returns [`HandshakeError::TlvPayloadTooLarge`] if the declared length
/// exceeds `MAX_TLV_PAYLOAD`.
async fn read_tlv<R: AsyncRead + Unpin>(
    reader: &mut R,
) -> Result<(u8, Vec<u8>), HandshakeError> {
    let mut header = [0u8; 3];
    reader.read_exact(&mut header).await?;

    let tlv_type = header[0];
    let length = u16::from_be_bytes([header[1], header[2]]);

    if length > MAX_TLV_PAYLOAD {
        return Err(HandshakeError::TlvPayloadTooLarge { length });
    }

    let mut payload = vec![0u8; length as usize];
    reader.read_exact(&mut payload).await?;

    Ok((tlv_type, payload))
}

// ── HKDF hybrid key derivation ─────────────────────────────────────────────

/// Derive the 32-byte hybrid key from the WireGuard session key and the
/// Kyber768 shared secret.
///
/// `hybrid_key = HKDF-SHA256(IKM = wg_key ‖ kyber_ss, salt = none, info = HKDF_INFO)`
///
/// Concatenating both secrets before extraction binds the classical and
/// post-quantum components: an adversary must break *both* to recover the key.
pub fn derive_hybrid_key(
    wg_session_key: &[u8; 32],
    kyber_shared_secret: &[u8; KYBER_SS_BYTES],
) -> Result<[u8; 32], HandshakeError> {
    let mut ikm = Vec::with_capacity(64);
    ikm.extend_from_slice(wg_session_key);
    ikm.extend_from_slice(kyber_shared_secret);

    let hkdf = Hkdf::<Sha256>::new(None, &ikm);
    let mut hybrid_key = [0u8; 32];
    hkdf.expand(HKDF_INFO, &mut hybrid_key)
        .map_err(|_| HandshakeError::HkdfError)?;

    // Zeroize the combined IKM immediately.
    ikm.zeroize();

    Ok(hybrid_key)
}

// ── Client-side handshake ──────────────────────────────────────────────────

/// Perform the client side of the PQ handshake.
///
/// `stream` must be a stream to the server already protected by the WireGuard
/// tunnel.  `wg_session_key` is the WireGuard Noise session key (obtained from
/// `boringtun` after the handshake).
///
/// Returns a [`HandshakeResult`] containing the 32-byte hybrid key.
///
/// # Security
/// The Kyber768 secret key is held in a [`SecretKeyBytes`] struct that zeroizes
/// on drop.  The Kyber shared secret is likewise zeroized.
pub async fn client_handshake<S>(
    stream: &mut S,
    wg_session_key: &[u8; 32],
) -> Result<HandshakeResult, HandshakeError>
where
    S: AsyncRead + AsyncWrite + Unpin,
{
    info!("PQ handshake: client starting");
    let mut bytes_exchanged = 0usize;

    // 1. Generate ephemeral Kyber768 keypair.
    let (pk, sk) = kyber768::keypair();
    let pk_bytes = pk.as_bytes();
    let mut sk_bytes = SecretKeyBytes(
        sk.as_bytes()
            .try_into()
            .expect("Kyber768 secret key is always 2400 bytes"),
    );

    // 2. Send public key to server: TLV(0x01, pk).
    debug!(pk_len = pk_bytes.len(), "PQ handshake: sending client public key");
    bytes_exchanged += write_tlv(stream, TLV_TYPE_PK, pk_bytes).await?;

    // 3. Receive KEM ciphertext from server: TLV(0x02, ct).
    let (tlv_type, ct_payload) = read_tlv(stream).await?;
    if tlv_type != TLV_TYPE_CT {
        return Err(HandshakeError::UnexpectedTlvType {
            expected: TLV_TYPE_CT,
            got: tlv_type,
        });
    }
    bytes_exchanged += 3 + ct_payload.len();
    debug!(ct_len = ct_payload.len(), "PQ handshake: received KEM ciphertext");

    if ct_payload.len() != KYBER_CT_BYTES {
        return Err(HandshakeError::InvalidCiphertextLength(ct_payload.len()));
    }

    // 4. Decapsulate to obtain the shared secret.
    let sk_parsed = kyber768::SecretKey::from_bytes(&sk_bytes.0)
        .map_err(|_| HandshakeError::MalformedPublicKey)?;
    let ct = kyber768::Ciphertext::from_bytes(&ct_payload)
        .map_err(|_| HandshakeError::MalformedCiphertext)?;

    let mut kyber_ss = SharedSecretBytes(
        kyber768::decapsulate(&ct, &sk_parsed)
            .as_bytes()
            .try_into()
            .expect("Kyber768 shared secret is always 32 bytes"),
    );
    sk_bytes.0.zeroize();

    // 5. Derive hybrid key.
    let hybrid_key = derive_hybrid_key(wg_session_key, &kyber_ss.0)?;
    kyber_ss.0.zeroize();

    info!(bytes_exchanged, "PQ handshake: client complete");
    Ok(HandshakeResult {
        hybrid_key,
        bytes_exchanged,
    })
}

// ── Server-side handshake ──────────────────────────────────────────────────

/// Perform the server side of the PQ handshake.
///
/// Symmetric counterpart of [`client_handshake`].  Used in tests and in the
/// server-side Tauri command (if running a local VPN relay for development).
pub async fn server_handshake<S>(
    stream: &mut S,
    wg_session_key: &[u8; 32],
) -> Result<HandshakeResult, HandshakeError>
where
    S: AsyncRead + AsyncWrite + Unpin,
{
    info!("PQ handshake: server starting");
    let mut bytes_exchanged = 0usize;

    // 1. Receive client public key: TLV(0x01, pk).
    let (tlv_type, pk_payload) = read_tlv(stream).await?;
    if tlv_type != TLV_TYPE_PK {
        return Err(HandshakeError::UnexpectedTlvType {
            expected: TLV_TYPE_PK,
            got: tlv_type,
        });
    }
    bytes_exchanged += 3 + pk_payload.len();
    debug!(pk_len = pk_payload.len(), "PQ handshake: received client public key");

    if pk_payload.len() != KYBER_PK_BYTES {
        return Err(HandshakeError::InvalidPublicKeyLength(pk_payload.len()));
    }

    let client_pk = kyber768::PublicKey::from_bytes(&pk_payload)
        .map_err(|_| HandshakeError::MalformedPublicKey)?;

    // 2. Encapsulate to the client's public key.
    let (mut kyber_ss, ct) = {
        let (ss, ct) = kyber768::encapsulate(&client_pk);
        (
            SharedSecretBytes(
                ss.as_bytes()
                    .try_into()
                    .expect("Kyber768 shared secret is always 32 bytes"),
            ),
            ct,
        )
    };

    // 3. Send KEM ciphertext: TLV(0x02, ct).
    let ct_bytes = ct.as_bytes();
    debug!(ct_len = ct_bytes.len(), "PQ handshake: sending KEM ciphertext");
    bytes_exchanged += write_tlv(stream, TLV_TYPE_CT, ct_bytes).await?;

    // 4. Derive hybrid key.
    let hybrid_key = derive_hybrid_key(wg_session_key, &kyber_ss.0)?;
    kyber_ss.0.zeroize();

    info!(bytes_exchanged, "PQ handshake: server complete");
    Ok(HandshakeResult {
        hybrid_key,
        bytes_exchanged,
    })
}

// ── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::io::duplex;

    /// Run a full in-process client/server handshake and verify both sides
    /// derive identical hybrid keys.
    #[tokio::test]
    async fn client_server_derive_same_hybrid_key() {
        let (mut client_stream, mut server_stream) = duplex(8192);
        let wg_key = [0xabu8; 32];

        let client_fut = client_handshake(&mut client_stream, &wg_key);
        let server_fut = server_handshake(&mut server_stream, &wg_key);

        let (client_result, server_result) = tokio::join!(client_fut, server_fut);
        let client_result = client_result.expect("client handshake should succeed");
        let server_result = server_result.expect("server handshake should succeed");

        assert_eq!(
            client_result.hybrid_key, server_result.hybrid_key,
            "both sides must derive the same hybrid key"
        );
    }

    /// Different WireGuard session keys produce different hybrid keys.
    #[tokio::test]
    async fn different_wg_keys_produce_different_hybrid_keys() {
        let (mut c1, mut s1) = duplex(8192);
        let (mut c2, mut s2) = duplex(8192);

        let wg_key_a = [0x01u8; 32];
        let wg_key_b = [0x02u8; 32];

        let (r1, _) = tokio::join!(
            client_handshake(&mut c1, &wg_key_a),
            server_handshake(&mut s1, &wg_key_a),
        );
        let (r2, _) = tokio::join!(
            client_handshake(&mut c2, &wg_key_b),
            server_handshake(&mut s2, &wg_key_b),
        );

        assert_ne!(
            r1.unwrap().hybrid_key,
            r2.unwrap().hybrid_key,
            "different WG session keys must produce different hybrid keys"
        );
    }

    /// Hybrid key derivation is deterministic for the same inputs.
    #[test]
    fn hybrid_key_derivation_is_deterministic() {
        let wg_key = [0x11u8; 32];
        let kyber_ss = [0x22u8; 32];
        let k1 = derive_hybrid_key(&wg_key, &kyber_ss).unwrap();
        let k2 = derive_hybrid_key(&wg_key, &kyber_ss).unwrap();
        assert_eq!(k1, k2);
    }

    /// Distinct WireGuard and Kyber secrets produce distinct hybrid keys.
    #[test]
    fn hybrid_key_differs_for_different_inputs() {
        let wg_a = [0xaau8; 32];
        let wg_b = [0xbbu8; 32];
        let ss = [0xccu8; 32];
        assert_ne!(
            derive_hybrid_key(&wg_a, &ss).unwrap(),
            derive_hybrid_key(&wg_b, &ss).unwrap()
        );
    }

    /// Verifies the TLV framing round-trips correctly for the public key type.
    #[tokio::test]
    async fn tlv_roundtrip_public_key() {
        use tokio::io::duplex;
        let (mut writer, mut reader) = duplex(4096);
        let payload = vec![0x42u8; KYBER_PK_BYTES];
        write_tlv(&mut writer, TLV_TYPE_PK, &payload).await.unwrap();
        let (t, p) = read_tlv(&mut reader).await.unwrap();
        assert_eq!(t, TLV_TYPE_PK);
        assert_eq!(p, payload);
    }

    /// Verifies the TLV framing round-trips correctly for the ciphertext type.
    #[tokio::test]
    async fn tlv_roundtrip_ciphertext() {
        use tokio::io::duplex;
        let (mut writer, mut reader) = duplex(4096);
        let payload = vec![0x55u8; KYBER_CT_BYTES];
        write_tlv(&mut writer, TLV_TYPE_CT, &payload).await.unwrap();
        let (t, p) = read_tlv(&mut reader).await.unwrap();
        assert_eq!(t, TLV_TYPE_CT);
        assert_eq!(p, payload);
    }

    /// bytes_exchanged is non-zero after a successful handshake.
    #[tokio::test]
    async fn bytes_exchanged_is_nonzero() {
        let (mut c, mut s) = duplex(8192);
        let key = [0u8; 32];
        let (cr, _) = tokio::join!(
            client_handshake(&mut c, &key),
            server_handshake(&mut s, &key)
        );
        assert!(cr.unwrap().bytes_exchanged > 0);
    }
}
