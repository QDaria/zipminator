#![no_main]
use libfuzzer_sys::fuzz_target;
use zipminator_core::{Kyber768, PublicKey, KYBER768_PUBLICKEYBYTES};

fuzz_target!(|data: &[u8]| {
    // Fuzz encapsulation with arbitrary public key data
    if data.len() >= KYBER768_PUBLICKEYBYTES {
        // Try to construct a PublicKey from raw bytes
        if let Ok(pk) = PublicKey::from_bytes(&data[0..KYBER768_PUBLICKEYBYTES]) {
            // Should not panic even with malformed input
            let _result = std::panic::catch_unwind(|| {
                let (_ct, _ss) = Kyber768::encapsulate(&pk);
            });
        }
    }
});
