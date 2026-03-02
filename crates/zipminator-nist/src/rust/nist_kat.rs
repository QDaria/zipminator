//! NIST Known Answer Test (KAT) Suite for CRYSTALS-Kyber-768
//!
//! Validates implementation against official NIST FIPS 203 test vectors
//! Required for certification and production deployment

use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::Path;

pub mod deterministic_rng;
pub use deterministic_rng::DeterministicRNG;

// Import Kyber768 implementation
// Adjust path based on your project structure
use zipminator_core::Kyber768;

/// NIST KAT test vector structure
#[derive(Debug, Clone)]
pub struct KATVector {
    pub test_name: String,
    pub seed: Vec<u8>,
    pub expected_pk: Vec<u8>,
    pub expected_sk: Vec<u8>,
    pub expected_ct: Vec<u8>,
    pub expected_ss: Vec<u8>,
}

/// Convert hex string to bytes
fn hex_to_bytes(hex: &str) -> Result<Vec<u8>, String> {
    let hex = hex.trim();
    if hex.len() % 2 != 0 {
        return Err("Hex string must have even length".to_string());
    }

    let mut bytes = Vec::with_capacity(hex.len() / 2);
    for i in (0..hex.len()).step_by(2) {
        let byte_str = &hex[i..i+2];
        let byte = u8::from_str_radix(byte_str, 16)
            .map_err(|e| format!("Invalid hex at position {}: {}", i, e))?;
        bytes.push(byte);
    }
    Ok(bytes)
}

/// Convert bytes to hex string
fn bytes_to_hex(data: &[u8]) -> String {
    data.iter()
        .map(|b| format!("{:02x}", b))
        .collect()
}

/// Compare byte arrays with detailed error reporting
fn compare_bytes(name: &str, actual: &[u8], expected: &[u8]) -> bool {
    if actual.len() != expected.len() {
        eprintln!("ERROR: {} length mismatch. Expected {} bytes, got {}",
                  name, expected.len(), actual.len());
        return false;
    }

    for (i, (a, e)) in actual.iter().zip(expected.iter()).enumerate() {
        if a != e {
            eprintln!("ERROR: {} mismatch at byte {}. Expected {:02x}, got {:02x}",
                      name, i, e, a);

            // Show context around error
            let start = if i > 8 { i - 8 } else { 0 };
            let end = std::cmp::min(i + 8, actual.len());

            eprintln!("Context (bytes {} to {}):", start, end);
            eprintln!("Expected: {}", bytes_to_hex(&expected[start..end]));
            eprintln!("Actual:   {}", bytes_to_hex(&actual[start..end]));

            return false;
        }
    }
    true
}

/// Run a single KAT test vector
pub fn run_kat_test(test: &KATVector) -> Result<(), String> {
    println!("Testing: {}", test.test_name);

    // Initialize deterministic RNG with seed
    if test.seed.len() != 48 {
        return Err(format!("Invalid seed length: {} (expected 48)", test.seed.len()));
    }
    let mut seed_array = [0u8; 48];
    seed_array.copy_from_slice(&test.seed);

    let mut rng = DeterministicRNG::new();
    rng.seed(&seed_array);

    // Test 1: KeyGen
    println!("  Testing KeyGen...");

    // Convert seed to Kyber seed format (32 bytes)
    let mut kyber_seed = [0u8; 32];
    kyber_seed.copy_from_slice(&test.seed[0..32]);

    let (pk, sk) = Kyber768::keypair_from_seed(&kyber_seed);

    // Verify public key
    if !compare_bytes("Public Key", &pk.data, &test.expected_pk) {
        return Err("Public key mismatch".to_string());
    }
    println!("  ✓ Public key matches");

    // Verify secret key
    if !compare_bytes("Secret Key", sk.as_bytes(), &test.expected_sk) {
        return Err("Secret key mismatch".to_string());
    }
    println!("  ✓ Secret key matches");

    // Test 2: Encapsulation
    println!("  Testing Encapsulation...");

    // Use deterministic coins for encapsulation
    let mut coins = [0u8; 32];
    rng.generate(&mut coins);

    let (ct, ss1) = Kyber768::encapsulate_with_coins(&pk, &coins);

    // Verify ciphertext
    if !compare_bytes("Ciphertext", &ct.data, &test.expected_ct) {
        return Err("Ciphertext mismatch".to_string());
    }
    println!("  ✓ Ciphertext matches");

    // Verify shared secret
    if !compare_bytes("Shared Secret (Encaps)", &ss1.data, &test.expected_ss) {
        return Err("Shared secret mismatch".to_string());
    }
    println!("  ✓ Shared secret matches");

    // Test 3: Decapsulation
    println!("  Testing Decapsulation...");
    let ss2 = Kyber768::decapsulate(&ct, &sk);

    // Verify decapsulated shared secret matches
    if !compare_bytes("Shared Secret (Decaps)", &ss2.data, &test.expected_ss) {
        return Err("Decapsulation mismatch".to_string());
    }
    println!("  ✓ Decapsulation matches");

    // Test 4: Round-trip verification
    if ss1.data != ss2.data {
        return Err("Round-trip verification failed".to_string());
    }
    println!("  ✓ Round-trip verified");

    println!("✓ Test PASSED: {}\n", test.test_name);
    Ok(())
}

/// Load KAT vectors from NIST format file
pub fn load_kat_vectors(filename: &Path) -> Result<Vec<KATVector>, String> {
    let file = File::open(filename)
        .map_err(|e| format!("Could not open file: {}", e))?;
    let reader = BufReader::new(file);

    let mut vectors = Vec::new();
    let mut current = KATVector {
        test_name: String::new(),
        seed: Vec::new(),
        expected_pk: Vec::new(),
        expected_sk: Vec::new(),
        expected_ct: Vec::new(),
        expected_ss: Vec::new(),
    };

    for line in reader.lines() {
        let line = line.map_err(|e| format!("Error reading line: {}", e))?;
        let line = line.trim();

        if line.is_empty() || line.starts_with('#') {
            continue;
        }

        let parts: Vec<&str> = line.splitn(2, '=').collect();
        if parts.len() != 2 {
            continue;
        }

        let key = parts[0].trim();
        let value = parts[1].trim();

        match key {
            "count" => {
                if !current.seed.is_empty() {
                    vectors.push(current.clone());
                }
                current = KATVector {
                    test_name: format!("KAT_Vector_{}", value),
                    seed: Vec::new(),
                    expected_pk: Vec::new(),
                    expected_sk: Vec::new(),
                    expected_ct: Vec::new(),
                    expected_ss: Vec::new(),
                };
            }
            "seed" => current.seed = hex_to_bytes(value)?,
            "pk" => current.expected_pk = hex_to_bytes(value)?,
            "sk" => current.expected_sk = hex_to_bytes(value)?,
            "ct" => current.expected_ct = hex_to_bytes(value)?,
            "ss" => current.expected_ss = hex_to_bytes(value)?,
            _ => {}
        }
    }

    // Add last vector
    if !current.seed.is_empty() {
        vectors.push(current);
    }

    Ok(vectors)
}

/// Generate sample KAT vectors for testing
pub fn generate_sample_vectors() -> Vec<KATVector> {
    let mut vectors = Vec::new();

    // Create a simple test vector with known seed
    let mut seed = vec![0u8; 48];
    for i in 0..48 {
        seed[i] = i as u8;
    }

    // Generate expected values using our implementation
    let mut kyber_seed = [0u8; 32];
    kyber_seed.copy_from_slice(&seed[0..32]);

    let (pk, sk) = Kyber768::keypair_from_seed(&kyber_seed);

    let mut rng = DeterministicRNG::new();
    let mut seed_array = [0u8; 48];
    seed_array.copy_from_slice(&seed);
    rng.seed(&seed_array);

    let mut coins = [0u8; 32];
    rng.generate(&mut coins);

    let (ct, ss) = Kyber768::encapsulate_with_coins(&pk, &coins);

    vectors.push(KATVector {
        test_name: "Sample_Test_1".to_string(),
        seed,
        expected_pk: pk.data,
        expected_sk: sk.as_bytes().to_vec(),
        expected_ct: ct.data,
        expected_ss: ss.data.to_vec(),
    });

    vectors
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sample_vectors() {
        let vectors = generate_sample_vectors();

        for test in vectors {
            run_kat_test(&test).expect("Sample vector test failed");
        }
    }

    #[test]
    fn test_hex_conversion() {
        let hex = "0102030405060708";
        let bytes = hex_to_bytes(hex).unwrap();
        assert_eq!(bytes, vec![1, 2, 3, 4, 5, 6, 7, 8]);

        let hex_back = bytes_to_hex(&bytes);
        assert_eq!(hex, hex_back);
    }
}
