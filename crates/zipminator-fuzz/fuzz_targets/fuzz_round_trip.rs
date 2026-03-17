#![no_main]
use libfuzzer_sys::fuzz_target;
use zipminator_core::Kyber768;

fuzz_target!(|data: &[u8]| {
    // Fuzz complete round trip with seed
    if data.len() >= 32 {
        let seed: [u8; 32] = data[0..32].try_into().unwrap();
        let (pk, sk) = Kyber768::keypair_from_seed(&seed);

        // Perform encapsulation
        let (ct, ss_enc) = Kyber768::encapsulate(&pk);

        // Perform decapsulation
        let ss_dec = Kyber768::decapsulate(&ct, &sk);

        // Verify correctness
        assert_eq!(ss_enc.as_bytes(), ss_dec.as_bytes(), "Round trip failed");
    }
});
