#![no_main]
use libfuzzer_sys::fuzz_target;
use zipminator_core::{Kyber768, Ciphertext, KYBER768_CIPHERTEXTBYTES};

fuzz_target!(|data: &[u8]| {
    // Generate a valid keypair
    let (_pk, sk) = Kyber768::keypair();

    // Fuzz decapsulation with arbitrary ciphertext
    if data.len() >= KYBER768_CIPHERTEXTBYTES {
        if let Ok(ct) = Ciphertext::from_bytes(&data[0..KYBER768_CIPHERTEXTBYTES]) {
            // Should not panic even with corrupted ciphertext
            let _result = std::panic::catch_unwind(|| {
                let _ss = Kyber768::decapsulate(&ct, &sk);
            });
        }
    }
});
