//! C FFI interface for Zipminator PQ ratchet sessions.
//!
//! # Safety contract
//!
//! Every function in this module is `unsafe extern "C"`.  Callers MUST:
//!
//! - Pass only pointers returned by the corresponding `_new` / `init_*`
//!   functions; never fabricate or alias opaque pointers.
//! - Ensure pointed-to buffers are at least as large as indicated by the
//!   `*_len` / `*_cap` parameters.
//! - Call `_free` exactly once per allocated object.
//! - Treat all integer return values: 0 = success, negative = error.
//!
//! # Error return convention
//!
//! | Return value | Meaning                          |
//! |-------------|-----------------------------------|
//! | >= 0        | Success (bytes written / length)  |
//! | -1          | Null pointer or size error        |
//! | -2          | Crypto / handshake error          |
//! | -3          | Buffer too small                  |

use crate::ratchet::header::{CT_BYTES, PK_BYTES};
use crate::ratchet::{PqRatchetSession, PqcRatchet};
use libc::c_int;
use pqcrypto_traits::kem::PublicKey;
use std::panic::{catch_unwind, AssertUnwindSafe};
use std::ptr;
use std::slice;

// ── Error codes ───────────────────────────────────────────────────────────────

const ERR_NULL: c_int = -1;
const ERR_CRYPTO: c_int = -2;
const ERR_BUFFER: c_int = -3;

// ─────────────────────────────────────────────────────────────────────────────
// Legacy PqcRatchet FFI (backward-compatible — kept as-is)
// ─────────────────────────────────────────────────────────────────────────────

/// Allocate a new `PqcRatchet` and return an opaque pointer.
///
/// Caller must free it with [`zipminator_ratchet_free`].
#[no_mangle]
pub extern "C" fn zipminator_ratchet_new() -> *mut PqcRatchet {
    match catch_unwind(AssertUnwindSafe(|| {
        Box::into_raw(Box::new(PqcRatchet::new()))
    })) {
        Ok(result) => result,
        Err(_) => ptr::null_mut(),
    }
}

/// Free a `PqcRatchet` previously allocated by [`zipminator_ratchet_new`].
///
/// # Safety
/// `ptr` must be a valid pointer returned by `zipminator_ratchet_new`, or null.
#[no_mangle]
pub unsafe extern "C" fn zipminator_ratchet_free(ptr: *mut PqcRatchet) {
    let _ = catch_unwind(AssertUnwindSafe(|| {
        if ptr.is_null() {
            return;
        }
        drop(Box::from_raw(ptr));
    }));
}

/// Copy the public key of a `PqcRatchet` into a caller-supplied buffer.
///
/// # Safety
/// `ptr` must be a valid pointer to a `PqcRatchet`.
/// `out_ptr` must point to a buffer of at least 1184 bytes (Kyber768 public key size).
///
/// Returns the number of bytes written, or -1 on error.
#[no_mangle]
pub unsafe extern "C" fn zipminator_ratchet_get_public_key(
    ptr: *mut PqcRatchet,
    out_ptr: *mut u8,
) -> c_int {
    match catch_unwind(AssertUnwindSafe(|| {
        if ptr.is_null() || out_ptr.is_null() {
            return ERR_NULL;
        }
        let ratchet = &*ptr;
        let pk_bytes = ratchet.local_static_public.as_bytes();
        ptr::copy_nonoverlapping(pk_bytes.as_ptr(), out_ptr, pk_bytes.len());
        pk_bytes.len() as c_int
    })) {
        Ok(result) => result,
        Err(_) => ERR_CRYPTO,
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PqRatchetSession FFI
// ─────────────────────────────────────────────────────────────────────────────

/// Initialise the Alice side of a ratchet session.
///
/// Writes Alice's ephemeral public key (1184 bytes) into `out_pk`.
/// `pk_cap` must be >= 1184.
///
/// Returns a pointer to the new session (call [`zipminator_ratchet_session_free`]
/// to release), or NULL on error.
///
/// # Safety
/// `out_pk` must point to a writable buffer of at least `pk_cap` bytes.
#[no_mangle]
pub unsafe extern "C" fn zipminator_ratchet_session_new_alice(
    out_pk: *mut u8,
    pk_cap: usize,
) -> *mut PqRatchetSession {
    match catch_unwind(AssertUnwindSafe(|| {
        if out_pk.is_null() {
            return ptr::null_mut();
        }
        if pk_cap < PK_BYTES {
            return ptr::null_mut();
        }

        let (session, pk_bytes) = PqRatchetSession::init_alice();

        ptr::copy_nonoverlapping(pk_bytes.as_ptr(), out_pk, pk_bytes.len());

        Box::into_raw(Box::new(session))
    })) {
        Ok(result) => result,
        Err(_) => ptr::null_mut(),
    }
}

/// Initialise the Bob side of a ratchet session given Alice's ephemeral public key.
///
/// On success:
/// - Writes the KEM ciphertext (1088 bytes) into `out_ct`   (cap: `ct_cap`)
/// - Writes Bob's ratchet public key (1184 bytes) into `out_bob_pk` (cap: `bob_pk_cap`)
/// - Returns a pointer to the new session.
///
/// Returns NULL on error.
///
/// # Safety
/// All pointer parameters must be non-null and point to buffers of the indicated
/// capacity.  `alice_pk` must point to exactly `pk_len` readable bytes.
#[no_mangle]
pub unsafe extern "C" fn zipminator_ratchet_session_new_bob(
    alice_pk: *const u8,
    pk_len: usize,
    out_ct: *mut u8,
    ct_cap: usize,
    out_bob_pk: *mut u8,
    bob_pk_cap: usize,
) -> *mut PqRatchetSession {
    match catch_unwind(AssertUnwindSafe(|| {
        if alice_pk.is_null() || out_ct.is_null() || out_bob_pk.is_null() {
            return ptr::null_mut();
        }
        if pk_len != PK_BYTES || ct_cap < CT_BYTES || bob_pk_cap < PK_BYTES {
            return ptr::null_mut();
        }

        let alice_pk_slice = slice::from_raw_parts(alice_pk, pk_len);

        let result = PqRatchetSession::init_bob(alice_pk_slice);
        match result {
            Err(_) => ptr::null_mut(),
            Ok((session, kem_ct, bob_pk)) => {
                ptr::copy_nonoverlapping(kem_ct.as_ptr(), out_ct, kem_ct.len());
                ptr::copy_nonoverlapping(bob_pk.as_ptr(), out_bob_pk, bob_pk.len());
                Box::into_raw(Box::new(session))
            }
        }
    })) {
        Ok(result) => result,
        Err(_) => ptr::null_mut(),
    }
}

/// Alice completes the handshake.
///
/// `ct` must be Bob's KEM ciphertext (1088 bytes).
/// `bob_pk` must be Bob's ratchet public key (1184 bytes).
///
/// Returns 0 on success, -1 on null pointer / size error, -2 on crypto error.
///
/// # Safety
/// `ptr` must be a valid session pointer.  `ct` and `bob_pk` must point to
/// readable buffers of the indicated lengths.
#[no_mangle]
pub unsafe extern "C" fn zipminator_ratchet_session_alice_finish(
    ptr: *mut PqRatchetSession,
    ct: *const u8,
    ct_len: usize,
    bob_pk: *const u8,
    pk_len: usize,
) -> c_int {
    match catch_unwind(AssertUnwindSafe(|| {
        if ptr.is_null() || ct.is_null() || bob_pk.is_null() {
            return ERR_NULL;
        }
        if ct_len != CT_BYTES || pk_len != PK_BYTES {
            return ERR_NULL;
        }

        let session = &mut *ptr;
        let ct_slice = slice::from_raw_parts(ct, ct_len);
        let pk_slice = slice::from_raw_parts(bob_pk, pk_len);

        match session.alice_finish_handshake(ct_slice, pk_slice) {
            Ok(()) => 0,
            Err(_) => ERR_CRYPTO,
        }
    })) {
        Ok(result) => result,
        Err(_) => ERR_CRYPTO,
    }
}

/// Encrypt a plaintext message and write header + ciphertext to caller buffers.
///
/// On success:
/// - `*out_header_written` is set to the number of bytes written into `out_header`.
/// - `*out_ct_written` is set to the number of bytes written into `out_ct`.
/// - Returns 0.
///
/// On error returns a negative error code and does not modify the output buffers.
///
/// # Safety
/// All pointers must be non-null.  Buffers must be at least the indicated capacity.
#[no_mangle]
pub unsafe extern "C" fn zipminator_ratchet_session_encrypt(
    ptr: *mut PqRatchetSession,
    plaintext: *const u8,
    pt_len: usize,
    out_header: *mut u8,
    header_cap: usize,
    out_header_written: *mut usize,
    out_ct: *mut u8,
    ct_cap: usize,
    out_ct_written: *mut usize,
) -> c_int {
    match catch_unwind(AssertUnwindSafe(|| {
        if ptr.is_null()
            || plaintext.is_null()
            || out_header.is_null()
            || out_header_written.is_null()
            || out_ct.is_null()
            || out_ct_written.is_null()
        {
            return ERR_NULL;
        }

        let session = &mut *ptr;
        let pt_slice = if pt_len == 0 {
            &[]
        } else {
            slice::from_raw_parts(plaintext, pt_len)
        };

        match session.encrypt(pt_slice) {
            Err(_) => ERR_CRYPTO,
            Ok((header_bytes, ct_bytes)) => {
                if header_bytes.len() > header_cap || ct_bytes.len() > ct_cap {
                    return ERR_BUFFER;
                }
                ptr::copy_nonoverlapping(
                    header_bytes.as_ptr(),
                    out_header,
                    header_bytes.len(),
                );
                *out_header_written = header_bytes.len();

                ptr::copy_nonoverlapping(ct_bytes.as_ptr(), out_ct, ct_bytes.len());
                *out_ct_written = ct_bytes.len();

                0
            }
        }
    })) {
        Ok(result) => result,
        Err(_) => ERR_CRYPTO,
    }
}

/// Decrypt a ciphertext + header and write the plaintext to a caller buffer.
///
/// On success writes plaintext into `out_buf` and returns the number of bytes
/// written (>= 0).  Returns a negative error code on failure.
///
/// # Safety
/// All pointers must be non-null.  Buffers must be at least the indicated capacity.
#[no_mangle]
pub unsafe extern "C" fn zipminator_ratchet_session_decrypt(
    ptr: *mut PqRatchetSession,
    header: *const u8,
    header_len: usize,
    ct: *const u8,
    ct_len: usize,
    out_buf: *mut u8,
    out_cap: usize,
) -> c_int {
    match catch_unwind(AssertUnwindSafe(|| {
        if ptr.is_null() || header.is_null() || ct.is_null() || out_buf.is_null() {
            return ERR_NULL;
        }
        if header_len == 0 || ct_len == 0 {
            return ERR_NULL;
        }

        let session = &mut *ptr;
        let header_slice = slice::from_raw_parts(header, header_len);
        let ct_slice = slice::from_raw_parts(ct, ct_len);

        match session.decrypt(header_slice, ct_slice) {
            Err(_) => ERR_CRYPTO,
            Ok(plaintext) => {
                if plaintext.len() > out_cap {
                    return ERR_BUFFER;
                }
                if !plaintext.is_empty() {
                    ptr::copy_nonoverlapping(
                        plaintext.as_ptr(),
                        out_buf,
                        plaintext.len(),
                    );
                }
                plaintext.len() as c_int
            }
        }
    })) {
        Ok(result) => result,
        Err(_) => ERR_CRYPTO,
    }
}

/// Free a `PqRatchetSession` previously allocated by an `init_*` function.
///
/// # Safety
/// `ptr` must be a valid pointer returned by one of the `session_new_*`
/// functions, or null.  Calling this twice is undefined behaviour.
#[no_mangle]
pub unsafe extern "C" fn zipminator_ratchet_session_free(ptr: *mut PqRatchetSession) {
    let _ = catch_unwind(AssertUnwindSafe(|| {
        if ptr.is_null() {
            return;
        }
        drop(Box::from_raw(ptr));
    }));
}

/// Copy the session's current ratchet public key into a caller buffer.
///
/// `out` must point to a buffer of at least `len` bytes.
/// `len` must be >= 1184.
///
/// Returns the number of bytes written on success, -1 on null/size error.
///
/// # Safety
/// `ptr` must be a valid session pointer.  `out` must be writable for `len` bytes.
#[no_mangle]
pub unsafe extern "C" fn zipminator_ratchet_session_get_public_key(
    ptr: *const PqRatchetSession,
    out: *mut u8,
    len: usize,
) -> c_int {
    match catch_unwind(AssertUnwindSafe(|| {
        if ptr.is_null() || out.is_null() {
            return ERR_NULL;
        }
        if len < PK_BYTES {
            return ERR_NULL;
        }

        let session = &*ptr;
        let pk = session.public_key_bytes();
        ptr::copy_nonoverlapping(pk.as_ptr(), out, pk.len());
        pk.len() as c_int
    })) {
        Ok(result) => result,
        Err(_) => ERR_CRYPTO,
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PII scanning FFI
// ─────────────────────────────────────────────────────────────────────────────

/// Scan text for PII patterns and write JSON results into a caller buffer.
///
/// # Arguments
///
/// * `text_ptr` / `text_len` — UTF-8 encoded text to scan.
/// * `countries_ptr` / `countries_len` — UTF-8 encoded comma-separated country
///   codes (e.g. `"us,uk,ae"`). Pass null + 0 to scan all countries.
/// * `results_buf` / `results_cap` — caller-supplied buffer for the JSON output.
///
/// # Returns
///
/// * `>= 0` — number of bytes written into `results_buf` (the JSON string length).
/// * `-1` — null pointer or invalid UTF-8.
/// * `-3` — `results_buf` is too small to hold the JSON output.
///
/// # Safety
///
/// All pointer parameters must point to valid readable/writable memory of the
/// indicated length/capacity.  `text_ptr` and `countries_ptr` must be valid
/// UTF-8 (or null for `countries_ptr`).
#[no_mangle]
pub unsafe extern "C" fn zipminator_pii_scan(
    text_ptr: *const u8,
    text_len: usize,
    countries_ptr: *const u8,
    countries_len: usize,
    results_buf: *mut u8,
    results_cap: usize,
) -> c_int {
    match catch_unwind(AssertUnwindSafe(|| {
        if text_ptr.is_null() || results_buf.is_null() {
            return ERR_NULL;
        }

        // Reconstruct the text slice
        let text_slice = slice::from_raw_parts(text_ptr, text_len);
        let text = match std::str::from_utf8(text_slice) {
            Ok(s) => s,
            Err(_) => return ERR_NULL,
        };

        // Parse country codes (comma-separated) or empty for all
        let countries: Vec<&str> = if countries_ptr.is_null() || countries_len == 0 {
            Vec::new()
        } else {
            let countries_slice = slice::from_raw_parts(countries_ptr, countries_len);
            match std::str::from_utf8(countries_slice) {
                Ok(s) => s
                    .split(',')
                    .map(|c| c.trim())
                    .filter(|c| !c.is_empty())
                    .collect(),
                Err(_) => return ERR_NULL,
            }
        };

        // Run the PII scan
        let matches = crate::pii::scan_text(text, &countries);
        let json = crate::pii::matches_to_json(&matches);
        let json_bytes = json.as_bytes();

        if json_bytes.len() > results_cap {
            return ERR_BUFFER;
        }

        ptr::copy_nonoverlapping(json_bytes.as_ptr(), results_buf, json_bytes.len());
        json_bytes.len() as c_int
    })) {
        Ok(result) => result,
        Err(_) => ERR_CRYPTO,
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Email encryption FFI
// ─────────────────────────────────────────────────────────────────────────────

/// Encrypt an email body for a recipient's ML-KEM-768 public key.
///
/// On success writes the serialized [`EmailEnvelope`] into `out_ptr` and returns
/// the number of bytes written (>= 0).
///
/// # Arguments
///
/// * `pk_ptr` / `pk_len` -- Recipient's ML-KEM-768 public key (1184 bytes).
/// * `plaintext_ptr` / `plaintext_len` -- Email body to encrypt.
/// * `aad_ptr` / `aad_len` -- Additional authenticated data (e.g. email headers).
/// * `out_ptr` / `out_cap` -- Caller buffer for the serialized envelope.
///
/// # Returns
///
/// * `>= 0` -- Number of bytes written.
/// * `-1` -- Null pointer or invalid input.
/// * `-2` -- Crypto error.
/// * `-3` -- Buffer too small.
///
/// # Safety
///
/// All pointers must be non-null and point to valid memory of the indicated size.
#[no_mangle]
pub unsafe extern "C" fn zipminator_email_encrypt(
    pk_ptr: *const u8,
    pk_len: usize,
    plaintext_ptr: *const u8,
    plaintext_len: usize,
    aad_ptr: *const u8,
    aad_len: usize,
    out_ptr: *mut u8,
    out_cap: usize,
) -> c_int {
    match catch_unwind(AssertUnwindSafe(|| {
        if pk_ptr.is_null() || out_ptr.is_null() {
            return ERR_NULL;
        }
        // plaintext and aad may be empty but not null
        if plaintext_len > 0 && plaintext_ptr.is_null() {
            return ERR_NULL;
        }
        if aad_len > 0 && aad_ptr.is_null() {
            return ERR_NULL;
        }

        let pk_slice = slice::from_raw_parts(pk_ptr, pk_len);
        let plaintext_slice = if plaintext_len > 0 {
            slice::from_raw_parts(plaintext_ptr, plaintext_len)
        } else {
            &[]
        };
        let aad_slice = if aad_len > 0 {
            slice::from_raw_parts(aad_ptr, aad_len)
        } else {
            &[]
        };

        match crate::email_crypto::EmailCrypto::encrypt(pk_slice, plaintext_slice, aad_slice) {
            Err(_) => ERR_CRYPTO,
            Ok(envelope) => {
                let serialized = envelope.to_bytes();
                if serialized.len() > out_cap {
                    return ERR_BUFFER;
                }
                ptr::copy_nonoverlapping(serialized.as_ptr(), out_ptr, serialized.len());
                serialized.len() as c_int
            }
        }
    })) {
        Ok(result) => result,
        Err(_) => ERR_CRYPTO,
    }
}

/// Decrypt a serialized email envelope using a recipient's ML-KEM-768 secret key.
///
/// On success writes the plaintext into `out_ptr` and returns the number of bytes
/// written (>= 0).
///
/// # Arguments
///
/// * `sk_ptr` / `sk_len` -- Recipient's ML-KEM-768 secret key (2400 bytes).
/// * `envelope_ptr` / `envelope_len` -- Serialized [`EmailEnvelope`] bytes.
/// * `aad_ptr` / `aad_len` -- Additional authenticated data (must match encrypt AAD).
/// * `out_ptr` / `out_cap` -- Caller buffer for the decrypted plaintext.
///
/// # Returns
///
/// * `>= 0` -- Number of bytes written.
/// * `-1` -- Null pointer or invalid input.
/// * `-2` -- Crypto error (wrong key, tampered data, etc.).
/// * `-3` -- Buffer too small.
///
/// # Safety
///
/// All pointers must be non-null and point to valid memory of the indicated size.
#[no_mangle]
pub unsafe extern "C" fn zipminator_email_decrypt(
    sk_ptr: *const u8,
    sk_len: usize,
    envelope_ptr: *const u8,
    envelope_len: usize,
    aad_ptr: *const u8,
    aad_len: usize,
    out_ptr: *mut u8,
    out_cap: usize,
) -> c_int {
    match catch_unwind(AssertUnwindSafe(|| {
        if sk_ptr.is_null() || envelope_ptr.is_null() || out_ptr.is_null() {
            return ERR_NULL;
        }
        if aad_len > 0 && aad_ptr.is_null() {
            return ERR_NULL;
        }

        let sk_slice = slice::from_raw_parts(sk_ptr, sk_len);
        let envelope_slice = slice::from_raw_parts(envelope_ptr, envelope_len);
        let aad_slice = if aad_len > 0 {
            slice::from_raw_parts(aad_ptr, aad_len)
        } else {
            &[]
        };

        let envelope = match crate::email_crypto::EmailEnvelope::from_bytes(envelope_slice) {
            Err(_) => return ERR_CRYPTO,
            Ok(e) => e,
        };

        match crate::email_crypto::EmailCrypto::decrypt(sk_slice, &envelope, aad_slice) {
            Err(_) => ERR_CRYPTO,
            Ok(plaintext) => {
                if plaintext.len() > out_cap {
                    return ERR_BUFFER;
                }
                if !plaintext.is_empty() {
                    ptr::copy_nonoverlapping(plaintext.as_ptr(), out_ptr, plaintext.len());
                }
                plaintext.len() as c_int
            }
        }
    })) {
        Ok(result) => result,
        Err(_) => ERR_CRYPTO,
    }
}

/// Generate a composite encryption keypair (ML-KEM-768 + X25519).
///
/// Writes the serialized composite public key into `pk_out` and the full
/// keypair material into `sk_out`.
///
/// # Public key format
/// `[mlkem_pk (1184)] [x25519_pk (32)]` = 1216 bytes total.
///
/// # Secret key format
/// `[mlkem_sk (2400)] [x25519_sk (32)]` = 2432 bytes total.
///
/// # Returns
///
/// * `0` -- Success.
/// * `-1` -- Null pointer or buffer too small.
/// * `-2` -- Key generation failed.
///
/// # Safety
///
/// `pk_out` must point to at least `pk_cap` writable bytes (need >= 1216).
/// `sk_out` must point to at least `sk_cap` writable bytes (need >= 2432).
#[no_mangle]
pub unsafe extern "C" fn zipminator_composite_keygen(
    pk_out: *mut u8,
    pk_cap: usize,
    sk_out: *mut u8,
    sk_cap: usize,
) -> c_int {
    match catch_unwind(AssertUnwindSafe(|| {
        if pk_out.is_null() || sk_out.is_null() {
            return ERR_NULL;
        }

        const COMPOSITE_PK_SIZE: usize = 1184 + 32; // mlkem_pk + x25519_pk
        const COMPOSITE_SK_SIZE: usize = 2400 + 32; // mlkem_sk + x25519_sk

        if pk_cap < COMPOSITE_PK_SIZE || sk_cap < COMPOSITE_SK_SIZE {
            return ERR_NULL;
        }

        let kp = crate::openpgp_keys::CompositeEncryptionKeypair::generate();
        let pub_key = kp.export_public();
        let pk_bytes = pub_key.to_bytes();

        ptr::copy_nonoverlapping(pk_bytes.as_ptr(), pk_out, pk_bytes.len());

        // Write SK: mlkem_sk || x25519_sk
        ptr::copy_nonoverlapping(kp.mlkem_sk().as_ptr(), sk_out, 2400);
        ptr::copy_nonoverlapping(kp.x25519_sk().as_ptr(), sk_out.add(2400), 32);

        0
    })) {
        Ok(result) => result,
        Err(_) => ERR_CRYPTO,
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// FFI tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ffi_session_full_handshake_and_roundtrip() {
        unsafe {
            // Alice init
            let mut alice_pk = vec![0u8; PK_BYTES];
            let alice_ptr = zipminator_ratchet_session_new_alice(
                alice_pk.as_mut_ptr(),
                alice_pk.len(),
            );
            assert!(!alice_ptr.is_null());

            // Bob init
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
            assert!(!bob_ptr.is_null());

            // Alice finish
            let rc = zipminator_ratchet_session_alice_finish(
                alice_ptr,
                kem_ct.as_ptr(),
                kem_ct.len(),
                bob_pk.as_ptr(),
                bob_pk.len(),
            );
            assert_eq!(rc, 0);

            // Alice encrypts
            let plaintext = b"FFI roundtrip test";
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
            assert_eq!(rc, 0, "encrypt failed");
            assert!(header_written > 0);
            assert!(ct_written > 0);

            // Bob decrypts
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
            assert!(bytes_written >= 0, "decrypt failed: {}", bytes_written);
            let decrypted = &out_buf[..bytes_written as usize];
            assert_eq!(decrypted, plaintext);

            // Cleanup
            zipminator_ratchet_session_free(alice_ptr);
            zipminator_ratchet_session_free(bob_ptr);
        }
    }

    #[test]
    fn test_ffi_null_ptr_handling() {
        unsafe {
            // All functions should handle null gracefully without crashing.
            zipminator_ratchet_session_free(ptr::null_mut());
            zipminator_ratchet_free(ptr::null_mut());

            let rc = zipminator_ratchet_session_alice_finish(
                ptr::null_mut(),
                ptr::null(),
                0,
                ptr::null(),
                0,
            );
            assert_eq!(rc, ERR_NULL);

            let rc = zipminator_ratchet_session_encrypt(
                ptr::null_mut(),
                ptr::null(),
                0,
                ptr::null_mut(),
                0,
                ptr::null_mut(),
                ptr::null_mut(),
                0,
                ptr::null_mut(),
            );
            assert_eq!(rc, ERR_NULL);

            let rc = zipminator_ratchet_session_decrypt(
                ptr::null_mut(),
                ptr::null(),
                0,
                ptr::null(),
                0,
                ptr::null_mut(),
                0,
            );
            assert_eq!(rc, ERR_NULL);

            let rc = zipminator_ratchet_session_get_public_key(
                ptr::null(),
                ptr::null_mut(),
                0,
            );
            assert_eq!(rc, ERR_NULL);
        }
    }

    #[test]
    fn test_ffi_pii_scan_basic() {
        unsafe {
            let text = b"Call me at 555-123-4567 or email test@example.com";
            let countries = b"us";
            let mut results = vec![0u8; 4096];

            let bytes_written = zipminator_pii_scan(
                text.as_ptr(),
                text.len(),
                countries.as_ptr(),
                countries.len(),
                results.as_mut_ptr(),
                results.len(),
            );

            assert!(bytes_written > 0, "PII scan should produce results");
            let json_str = std::str::from_utf8(&results[..bytes_written as usize]).unwrap();
            assert!(json_str.starts_with('['), "Result should be a JSON array");
            assert!(
                json_str.contains("phone") || json_str.contains("contact"),
                "Should detect phone or contact info in: {}",
                json_str
            );
        }
    }

    #[test]
    fn test_ffi_pii_scan_null_pointers() {
        unsafe {
            let mut results = vec![0u8; 1024];

            // Null text pointer
            let rc = zipminator_pii_scan(
                ptr::null(),
                0,
                ptr::null(),
                0,
                results.as_mut_ptr(),
                results.len(),
            );
            assert_eq!(rc, ERR_NULL);

            // Null results buffer
            let text = b"test";
            let rc = zipminator_pii_scan(
                text.as_ptr(),
                text.len(),
                ptr::null(),
                0,
                ptr::null_mut(),
                0,
            );
            assert_eq!(rc, ERR_NULL);
        }
    }

    #[test]
    fn test_ffi_pii_scan_buffer_too_small() {
        unsafe {
            let text = b"SSN: 123-45-6789 email: test@example.com";
            let mut results = vec![0u8; 2]; // Intentionally tiny buffer

            let rc = zipminator_pii_scan(
                text.as_ptr(),
                text.len(),
                ptr::null(),
                0,
                results.as_mut_ptr(),
                results.len(),
            );

            assert_eq!(rc, ERR_BUFFER, "Should return ERR_BUFFER for tiny buffer");
        }
    }

    #[test]
    fn test_ffi_pii_scan_all_countries() {
        unsafe {
            let text = b"test@example.com";
            let mut results = vec![0u8; 8192];

            // Pass null countries to scan all
            let bytes_written = zipminator_pii_scan(
                text.as_ptr(),
                text.len(),
                ptr::null(),
                0,
                results.as_mut_ptr(),
                results.len(),
            );

            assert!(bytes_written > 2, "Should find email across all countries");
            let json_str = std::str::from_utf8(&results[..bytes_written as usize]).unwrap();
            // Email pattern exists in US, UK, and UAE
            assert!(
                json_str.contains("contact"),
                "Should detect email: {}",
                json_str
            );
        }
    }

    #[test]
    fn test_ffi_get_public_key() {
        unsafe {
            let mut pk_buf = vec![0u8; PK_BYTES];
            let ptr = zipminator_ratchet_session_new_alice(pk_buf.as_mut_ptr(), pk_buf.len());
            assert!(!ptr.is_null());

            let mut out = vec![0u8; PK_BYTES];
            let rc = zipminator_ratchet_session_get_public_key(ptr, out.as_mut_ptr(), out.len());
            assert_eq!(rc, PK_BYTES as c_int);
            // Key from init and from getter must match.
            assert_eq!(pk_buf, out);

            zipminator_ratchet_session_free(ptr);
        }
    }

    // ── Email encryption FFI tests ──────────────────────────────────────────

    #[test]
    fn test_ffi_email_encrypt_decrypt_roundtrip() {
        use pqcrypto_kyber::kyber768;
        use pqcrypto_traits::kem::{PublicKey as KemPk, SecretKey as KemSk};

        let (pk, sk) = kyber768::keypair();
        let pk_bytes = pk.as_bytes();
        let sk_bytes = sk.as_bytes();

        let plaintext = b"FFI email roundtrip test message";
        let aad = b"From: test@qdaria.com";

        unsafe {
            // Encrypt
            let mut envelope_buf = vec![0u8; 8192];
            let env_len = zipminator_email_encrypt(
                pk_bytes.as_ptr(),
                pk_bytes.len(),
                plaintext.as_ptr(),
                plaintext.len(),
                aad.as_ptr(),
                aad.len(),
                envelope_buf.as_mut_ptr(),
                envelope_buf.len(),
            );
            assert!(env_len > 0, "email encrypt failed: {}", env_len);

            // Decrypt
            let mut out_buf = vec![0u8; 4096];
            let pt_len = zipminator_email_decrypt(
                sk_bytes.as_ptr(),
                sk_bytes.len(),
                envelope_buf.as_ptr(),
                env_len as usize,
                aad.as_ptr(),
                aad.len(),
                out_buf.as_mut_ptr(),
                out_buf.len(),
            );
            assert!(pt_len >= 0, "email decrypt failed: {}", pt_len);
            assert_eq!(&out_buf[..pt_len as usize], plaintext);
        }
    }

    #[test]
    fn test_ffi_email_encrypt_null_pointers() {
        unsafe {
            let mut out = vec![0u8; 4096];
            let rc = zipminator_email_encrypt(
                ptr::null(),
                0,
                ptr::null(),
                0,
                ptr::null(),
                0,
                out.as_mut_ptr(),
                out.len(),
            );
            assert_eq!(rc, ERR_NULL);

            let pk = [0u8; 1184];
            let rc = zipminator_email_encrypt(
                pk.as_ptr(),
                pk.len(),
                ptr::null(),
                0,
                ptr::null(),
                0,
                ptr::null_mut(),
                0,
            );
            assert_eq!(rc, ERR_NULL);
        }
    }

    #[test]
    fn test_ffi_email_decrypt_null_pointers() {
        unsafe {
            let mut out = vec![0u8; 4096];
            let rc = zipminator_email_decrypt(
                ptr::null(),
                0,
                ptr::null(),
                0,
                ptr::null(),
                0,
                out.as_mut_ptr(),
                out.len(),
            );
            assert_eq!(rc, ERR_NULL);
        }
    }

    #[test]
    fn test_ffi_email_encrypt_buffer_too_small() {
        use pqcrypto_kyber::kyber768;
        use pqcrypto_traits::kem::PublicKey as KemPk;

        let (pk, _sk) = kyber768::keypair();
        let pk_bytes = pk.as_bytes();
        let plaintext = b"test";

        unsafe {
            let mut tiny_buf = vec![0u8; 8]; // way too small
            let rc = zipminator_email_encrypt(
                pk_bytes.as_ptr(),
                pk_bytes.len(),
                plaintext.as_ptr(),
                plaintext.len(),
                ptr::null(),
                0,
                tiny_buf.as_mut_ptr(),
                tiny_buf.len(),
            );
            assert_eq!(rc, ERR_BUFFER);
        }
    }

    #[test]
    fn test_ffi_composite_keygen() {
        unsafe {
            let mut pk_buf = vec![0u8; 1216];
            let mut sk_buf = vec![0u8; 2432];

            let rc = zipminator_composite_keygen(
                pk_buf.as_mut_ptr(),
                pk_buf.len(),
                sk_buf.as_mut_ptr(),
                sk_buf.len(),
            );
            assert_eq!(rc, 0, "composite keygen failed");

            // Verify pk is non-zero
            assert!(
                pk_buf.iter().any(|&b| b != 0),
                "public key must not be all-zero"
            );
            // Verify sk is non-zero
            assert!(
                sk_buf.iter().any(|&b| b != 0),
                "secret key must not be all-zero"
            );
        }
    }

    #[test]
    fn test_ffi_composite_keygen_null_pointers() {
        unsafe {
            let mut pk = vec![0u8; 1216];
            let rc = zipminator_composite_keygen(pk.as_mut_ptr(), pk.len(), ptr::null_mut(), 0);
            assert_eq!(rc, ERR_NULL);

            let mut sk = vec![0u8; 2432];
            let rc = zipminator_composite_keygen(ptr::null_mut(), 0, sk.as_mut_ptr(), sk.len());
            assert_eq!(rc, ERR_NULL);
        }
    }

    #[test]
    fn test_ffi_composite_keygen_buffer_too_small() {
        unsafe {
            let mut pk = vec![0u8; 100]; // too small
            let mut sk = vec![0u8; 2432];
            let rc = zipminator_composite_keygen(
                pk.as_mut_ptr(),
                pk.len(),
                sk.as_mut_ptr(),
                sk.len(),
            );
            assert_eq!(rc, ERR_NULL);
        }
    }
}
