//! Deterministic Random Number Generator for NIST KAT Testing
//!
//! WARNING: FOR TESTING ONLY - NOT FOR PRODUCTION USE
//!
//! This DRBG implementation provides reproducible randomness from a seed
//! to enable Known Answer Test (KAT) validation against NIST test vectors.

use aes::Aes256;
use aes::cipher::{KeyIvInit, StreamCipher};
use aes::cipher::generic_array::GenericArray;

type Aes256Ctr = ctr::Ctr64BE<Aes256>;

/// AES-256-CTR-DRBG for deterministic KAT testing
/// Implements NIST SP 800-90A (simplified for testing)
pub struct DeterministicRNG {
    key: [u8; 32],
    v: [u8; 16],
    initialized: bool,
}

impl DeterministicRNG {
    /// Create new uninitialized DRBG
    pub fn new() -> Self {
        Self {
            key: [0u8; 32],
            v: [0u8; 16],
            initialized: false,
        }
    }

    /// Initialize DRBG with 48-byte seed
    pub fn seed(&mut self, seed: &[u8; 48]) {
        // Initial key and V are zero
        self.key = [0u8; 32];
        self.v = [0u8; 16];

        // Update with seed material
        self.update(Some(seed));
        self.initialized = true;
    }

    /// Update internal state
    fn update(&mut self, provided_data: Option<&[u8; 48]>) {
        let mut temp = [0u8; 48];

        // Generate temp using AES-CTR
        let key = GenericArray::from_slice(&self.key);
        let nonce = GenericArray::from_slice(&self.v);
        let mut cipher = Aes256Ctr::new(key, nonce);
        cipher.apply_keystream(&mut temp);

        // Mix in provided data if present
        if let Some(data) = provided_data {
            for i in 0..48 {
                temp[i] ^= data[i];
            }
        }

        // Update key and V
        self.key.copy_from_slice(&temp[0..32]);
        self.v.copy_from_slice(&temp[32..48]);
    }

    /// Generate random bytes
    pub fn generate(&mut self, out: &mut [u8]) {
        assert!(self.initialized, "DRBG not initialized");

        // Generate using AES-CTR
        let key = GenericArray::from_slice(&self.key);
        let nonce = GenericArray::from_slice(&self.v);
        let mut cipher = Aes256Ctr::new(key, nonce);
        cipher.apply_keystream(out);

        // Update state
        self.update(None);
    }

    /// Create DRBG from hex seed string
    pub fn from_hex(hex_seed: &str) -> Result<Self, String> {
        if hex_seed.len() != 96 {
            return Err(format!("Hex seed must be 96 characters (48 bytes), got {}", hex_seed.len()));
        }

        let mut seed = [0u8; 48];
        for i in 0..48 {
            let byte_str = &hex_seed[i*2..i*2+2];
            seed[i] = u8::from_str_radix(byte_str, 16)
                .map_err(|e| format!("Invalid hex at position {}: {}", i, e))?;
        }

        let mut rng = Self::new();
        rng.seed(&seed);
        Ok(rng)
    }
}

impl Default for DeterministicRNG {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_deterministic_generation() {
        let seed = [42u8; 48];

        let mut rng1 = DeterministicRNG::new();
        rng1.seed(&seed);
        let mut out1 = [0u8; 32];
        rng1.generate(&mut out1);

        let mut rng2 = DeterministicRNG::new();
        rng2.seed(&seed);
        let mut out2 = [0u8; 32];
        rng2.generate(&mut out2);

        assert_eq!(out1, out2, "Deterministic RNG must produce identical output");
    }

    #[test]
    fn test_from_hex() {
        let hex = "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f30";
        let mut rng = DeterministicRNG::from_hex(hex).unwrap();

        let mut output = [0u8; 16];
        rng.generate(&mut output);

        // Should produce deterministic output
        assert_ne!(output, [0u8; 16], "RNG should produce non-zero output");
    }

    #[test]
    fn test_state_update() {
        let seed = [1u8; 48];
        let mut rng = DeterministicRNG::new();
        rng.seed(&seed);

        let mut out1 = [0u8; 32];
        rng.generate(&mut out1);

        let mut out2 = [0u8; 32];
        rng.generate(&mut out2);

        // Different calls should produce different output
        assert_ne!(out1, out2, "RNG state should update between calls");
    }
}
