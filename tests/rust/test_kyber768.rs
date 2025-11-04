//! Comprehensive tests for Kyber-768 Rust implementation
//!
//! Tests:
//! - Functional correctness
//! - Performance benchmarking
//! - Constant-time validation preparation

#[cfg(test)]
mod kyber768_tests {
    use kyber768::*;
    use std::time::Instant;

    #[test]
    fn test_correctness_basic() {
        let (pk, sk) = Kyber768::keypair();
        let (ct, ss1) = Kyber768::encapsulate(&pk);
        let ss2 = Kyber768::decapsulate(&ct, &sk);
        assert_eq!(ss1.data, ss2.data);
    }

    #[test]
    fn test_performance_keygen() {
        let iterations = 1000;
        let start = Instant::now();

        for _ in 0..iterations {
            let _ = Kyber768::keypair();
        }

        let duration = start.elapsed();
        let avg_micros = duration.as_micros() / iterations;

        println!("KeyGen average: {} µs", avg_micros);
        println!("Target: 11 µs (C++/AVX2 baseline)");
    }

    #[test]
    fn test_performance_encaps() {
        let (pk, _) = Kyber768::keypair();
        let iterations = 1000;
        let start = Instant::now();

        for _ in 0..iterations {
            let _ = Kyber768::encapsulate(&pk);
        }

        let duration = start.elapsed();
        let avg_micros = duration.as_micros() / iterations;

        println!("Encaps average: {} µs", avg_micros);
        println!("Target: 11 µs (C++/AVX2 baseline)");
    }

    #[test]
    fn test_performance_decaps() {
        let (pk, sk) = Kyber768::keypair();
        let (ct, _) = Kyber768::encapsulate(&pk);
        let iterations = 1000;
        let start = Instant::now();

        for _ in 0..iterations {
            let _ = Kyber768::decapsulate(&ct, &sk);
        }

        let duration = start.elapsed();
        let avg_micros = duration.as_micros() / iterations;

        println!("Decaps average: {} µs", avg_micros);
        println!("Target: 12 µs (C++/AVX2 baseline)");
    }

    #[test]
    fn test_full_operation_performance() {
        let iterations = 1000;
        let start = Instant::now();

        for _ in 0..iterations {
            let (pk, sk) = Kyber768::keypair();
            let (ct, _) = Kyber768::encapsulate(&pk);
            let _ = Kyber768::decapsulate(&ct, &sk);
        }

        let duration = start.elapsed();
        let avg_micros = duration.as_micros() / iterations;

        println!("Full operation average: {} µs", avg_micros);
        println!("Target: 34 µs (C++/AVX2 baseline)");

        // Performance assertion (relaxed for initial implementation)
        assert!(avg_micros < 200, "Performance target not met: {} µs > 200 µs", avg_micros);
    }

    #[test]
    fn test_implicit_rejection() {
        let (pk, sk) = Kyber768::keypair();
        let (mut ct, ss1) = Kyber768::encapsulate(&pk);

        // Tamper with ciphertext
        ct.data[10] ^= 0xFF;

        let ss2 = Kyber768::decapsulate(&ct, &sk);

        // Should get different shared secret (implicit rejection)
        assert_ne!(ss1.data, ss2.data);
    }

    #[test]
    fn test_determinism() {
        let seed = [0x42u8; 32];
        let (pk1, sk1) = Kyber768::keypair_from_seed(&seed);
        let (pk2, sk2) = Kyber768::keypair_from_seed(&seed);

        assert_eq!(pk1.data, pk2.data);
        assert_eq!(sk1.data, sk2.data);
    }

    #[test]
    fn test_different_keys_different_secrets() {
        let (pk1, _) = Kyber768::keypair();
        let (pk2, _) = Kyber768::keypair();

        let (_, ss1) = Kyber768::encapsulate(&pk1);
        let (_, ss2) = Kyber768::encapsulate(&pk2);

        assert_ne!(ss1.data, ss2.data);
    }
}
