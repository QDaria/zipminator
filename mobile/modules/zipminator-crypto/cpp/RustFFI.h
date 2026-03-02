#pragma once
/**
 * RustFFI.h — C header mirroring zipminator-core/src/ffi.rs
 *
 * This is the shared contract used by:
 *   - iOS bridging header  (ZipminatorCryptoHeader.h)
 *   - Android JNI shim     (zipminator_jni.cpp)
 *
 * All sizes are Kyber768 (NIST PQC standard):
 *   PK  = 1184 bytes
 *   SK  = 2400 bytes
 *   CT  = 1088 bytes
 *   SS  =   32 bytes
 *
 * Return-value convention:
 *   >= 0   success (bytes written / 0 for void-like success)
 *   -1     null pointer or size error
 *   -2     crypto / handshake error
 *   -3     buffer too small
 */

#include <stdint.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/* ── Opaque types ────────────────────────────────────────────────────────── */
typedef struct PqcRatchet       PqcRatchet;
typedef struct PqRatchetSession PqRatchetSession;

/* ── Kyber768 size constants ─────────────────────────────────────────────── */
#define ZIPMINATOR_PK_BYTES  1184
#define ZIPMINATOR_SK_BYTES  2400
#define ZIPMINATOR_CT_BYTES  1088
#define ZIPMINATOR_SS_BYTES    32

/* ── Error codes ─────────────────────────────────────────────────────────── */
#define ZIPMINATOR_ERR_NULL    (-1)
#define ZIPMINATOR_ERR_CRYPTO  (-2)
#define ZIPMINATOR_ERR_BUFFER  (-3)

/* ── Header sizes (for ratchet messages) ─────────────────────────────────── */
/* Minimum header: 1 flag + 4 msg_no + 4 prev_chain_len + 1184 pk = 1193 bytes */
#define ZIPMINATOR_HEADER_MIN_BYTES  1193
/* Full header with KEM ciphertext: 1193 + 1088 = 2281 bytes */
#define ZIPMINATOR_HEADER_MAX_BYTES  2281

/* ── Legacy KEM (PqcRatchet — stateless, backward-compatible) ─────────────── */

/**
 * Allocate a new PqcRatchet. Generates a Kyber768 keypair on construction.
 * Caller MUST free with zipminator_ratchet_free().
 */
PqcRatchet* zipminator_ratchet_new(void);

/**
 * Free a PqcRatchet. Safe to call with NULL.
 */
void zipminator_ratchet_free(PqcRatchet* ptr);

/**
 * Copy the public key of a PqcRatchet into out (must be >= 1184 bytes).
 * Returns bytes written (1184) on success, -1 on error.
 */
int zipminator_ratchet_get_public_key(PqcRatchet* ptr, uint8_t* out);

/* ── Session API (PqRatchetSession — stateful PQ Double Ratchet) ─────────── */

/**
 * Initialise an Alice-side ratchet session.
 *
 * Writes Alice's ephemeral public key (1184 bytes) into out_pk.
 * pk_cap must be >= ZIPMINATOR_PK_BYTES.
 *
 * Returns a new session pointer, or NULL on error.
 * Caller MUST free with zipminator_ratchet_session_free().
 */
PqRatchetSession* zipminator_ratchet_session_new_alice(
    uint8_t* out_pk,
    int      pk_cap
);

/**
 * Initialise a Bob-side ratchet session given Alice's ephemeral public key.
 *
 * On success writes:
 *   - KEM ciphertext (1088 bytes) into out_ct   (cap ct_cap)
 *   - Bob's ratchet public key (1184 bytes) into out_bob_pk (cap bob_pk_cap)
 *
 * Returns a new session pointer, or NULL on error.
 * Caller MUST free with zipminator_ratchet_session_free().
 */
PqRatchetSession* zipminator_ratchet_session_new_bob(
    const uint8_t* alice_pk,
    int            pk_len,
    uint8_t*       out_ct,
    int            ct_cap,
    uint8_t*       out_bob_pk,
    int            bob_pk_cap
);

/**
 * Alice completes the handshake.
 *
 * ct     must be Bob's KEM ciphertext (1088 bytes).
 * bob_pk must be Bob's ratchet public key (1184 bytes).
 *
 * Returns 0 on success, negative on error.
 */
int zipminator_ratchet_session_alice_finish(
    PqRatchetSession* ptr,
    const uint8_t*    ct,
    int               ct_len,
    const uint8_t*    bob_pk,
    int               pk_len
);

/**
 * Encrypt plaintext using the ratchet session.
 *
 * On success:
 *   - Writes header bytes into out_header; sets *out_header_written.
 *   - Writes ciphertext bytes into out_ct;  sets *out_ct_written.
 *   - Returns 0.
 *
 * Recommended buffer sizes:
 *   header_cap >= ZIPMINATOR_HEADER_MAX_BYTES (2281)
 *   ct_cap     >= plaintext length + 64 (overhead)
 */
int zipminator_ratchet_session_encrypt(
    PqRatchetSession* ptr,
    const uint8_t*    plaintext,
    int               pt_len,
    uint8_t*          out_header,
    int               header_cap,
    int*              out_header_written,
    uint8_t*          out_ct,
    int               ct_cap,
    int*              out_ct_written
);

/**
 * Decrypt a (header, ciphertext) pair using the ratchet session.
 *
 * Writes plaintext into out_buf.
 * Returns bytes written (>= 0) on success, negative on error.
 *
 * out_cap should be at least ct_len (plaintext cannot be longer than ciphertext).
 */
int zipminator_ratchet_session_decrypt(
    PqRatchetSession* ptr,
    const uint8_t*    header,
    int               header_len,
    const uint8_t*    ct,
    int               ct_len,
    uint8_t*          out_buf,
    int               out_cap
);

/**
 * Free a PqRatchetSession. Safe to call with NULL.
 * MUST be called exactly once per session.
 */
void zipminator_ratchet_session_free(PqRatchetSession* ptr);

/**
 * Copy the session's current ratchet public key into out.
 * out must be >= ZIPMINATOR_PK_BYTES (1184) bytes.
 *
 * Returns bytes written (1184) on success, -1 on error.
 */
int zipminator_ratchet_session_get_public_key(
    const PqRatchetSession* ptr,
    uint8_t*                out,
    int                     len
);

#ifdef __cplusplus
}
#endif
