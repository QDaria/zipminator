//! Fuzz target: MessageHeader::from_bytes
//!
//! This exercises the primary untrusted input parser. Network attackers
//! control the bytes that arrive as message headers, so this function
//! must never panic, never read out of bounds, and must return consistent
//! error variants for any malformed input.

#![no_main]

use libfuzzer_sys::fuzz_target;
use zipminator_core::ratchet::header::MessageHeader;

fuzz_target!(|data: &[u8]| {
    // The only requirement: from_bytes must not panic.
    // It should return Ok(_) or Err(_) for every possible byte slice.
    match MessageHeader::from_bytes(data) {
        Ok(header) => {
            // If parsing succeeded, verify round-trip consistency:
            // to_bytes() followed by from_bytes() must produce an equivalent header.
            let serialized = header.to_bytes();
            let reparsed = MessageHeader::from_bytes(&serialized)
                .expect("round-trip from_bytes must succeed on to_bytes output");

            // Verify structural equivalence.
            assert_eq!(reparsed.flags, header.flags);
            assert_eq!(reparsed.message_number, header.message_number);
            assert_eq!(reparsed.previous_chain_length, header.previous_chain_length);
            assert_eq!(reparsed.ephemeral_pk, header.ephemeral_pk);
            assert_eq!(reparsed.has_kem_ct(), header.has_kem_ct());

            match (&reparsed.kem_ciphertext, &header.kem_ciphertext) {
                (Some(a), Some(b)) => assert_eq!(a.as_slice(), b.as_slice()),
                (None, None) => {}
                _ => panic!("round-trip KEM ciphertext presence mismatch"),
            }
        }
        Err(_) => {
            // Errors are expected for most random inputs. No further checks needed.
        }
    }
});
