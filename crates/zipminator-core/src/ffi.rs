use crate::ratchet::PqcRatchet;
use libc::c_int;
use pqcrypto_traits::kem::PublicKey;
use std::ptr;

#[no_mangle]
pub extern "C" fn zipminator_ratchet_new() -> *mut PqcRatchet {
    Box::into_raw(Box::new(PqcRatchet::new()))
}

/// # Safety
/// `ptr` must be a valid pointer returned by `zipminator_ratchet_new`, or null.
#[no_mangle]
pub unsafe extern "C" fn zipminator_ratchet_free(ptr: *mut PqcRatchet) {
    if ptr.is_null() {
        return;
    }
    drop(Box::from_raw(ptr));
}

/// # Safety
/// `ptr` must be a valid pointer to a `PqcRatchet`.
/// `out_ptr` must point to a buffer of at least 1184 bytes (Kyber768 public key size).
#[no_mangle]
pub unsafe extern "C" fn zipminator_ratchet_get_public_key(
    ptr: *mut PqcRatchet,
    out_ptr: *mut u8,
) -> c_int {
    if ptr.is_null() || out_ptr.is_null() {
        return -1;
    }
    let ratchet = &*ptr;
    let pk_bytes = ratchet.local_static_public.as_bytes();
    ptr::copy_nonoverlapping(pk_bytes.as_ptr(), out_ptr, pk_bytes.len());
    pk_bytes.len() as c_int
}
