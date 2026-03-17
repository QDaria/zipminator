#![no_main]
use libfuzzer_sys::fuzz_target;
use zipminator_core::Kyber768;

fuzz_target!(|data: &[u8]| {
    // Fuzz key generation from seed
    if data.len() >= 32 {
        let seed: [u8; 32] = data[0..32].try_into().unwrap();
        let (_pk, _sk) = Kyber768::keypair_from_seed(&seed);
    }

    // Fuzz random key generation (should always succeed)
    let (_pk, _sk) = Kyber768::keypair();
});
