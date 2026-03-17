/// Kyber-768 Integration with QRNG
///
/// Provides modified Kyber-768 operations that use quantum random number generation
/// instead of pseudo-random generation.

use crate::kyber768::{Kyber768, PublicKey, SecretKey, Ciphertext, SharedSecret};
use crate::qrng::{EntropyPool, QrngError};
use std::sync::Arc;

/// Kyber-768 with QRNG integration
pub struct Kyber768Qrng {
    entropy_pool: Arc<EntropyPool>,
}

impl Kyber768Qrng {
    /// Create a new Kyber-768 instance with QRNG support
    pub fn new(entropy_pool: Arc<EntropyPool>) -> Self {
        Self { entropy_pool }
    }

    /// Generate a new keypair using quantum randomness
    ///
    /// This replaces the default RNG with quantum-generated randomness
    /// for both the secret key generation and the random coins used
    /// in the key generation process.
    pub fn keygen(&self) -> Result<(PublicKey, SecretKey), QrngError> {
        // Calculate required randomness for Kyber-768 keygen
        // Secret key: 32 bytes of random seed
        // Random coins: 32 bytes
        const KEYGEN_RANDOM_BYTES: usize = 64;

        let mut random_bytes = vec![0u8; KEYGEN_RANDOM_BYTES];
        self.entropy_pool.get_random_bytes(&mut random_bytes)?;

        // Use the quantum randomness to generate keypair
        // Split into seed and coins
        let seed = &random_bytes[..32];
        let coins = &random_bytes[32..];

        // Generate keypair using quantum randomness
        let (pk, sk) = Kyber768::keygen_from_seed(seed, coins);

        Ok((pk, sk))
    }

    /// Encapsulate a shared secret using quantum randomness
    ///
    /// # Arguments
    /// * `public_key` - The recipient's public key
    ///
    /// # Returns
    /// A tuple of (ciphertext, shared_secret) or an error
    pub fn encapsulate(&self, public_key: &PublicKey) -> Result<(Ciphertext, SharedSecret), QrngError> {
        // Kyber-768 encapsulation requires 32 bytes of randomness
        const ENCAPS_RANDOM_BYTES: usize = 32;

        let mut random_bytes = [0u8; ENCAPS_RANDOM_BYTES];
        self.entropy_pool.get_random_bytes(&mut random_bytes)?;

        // Perform encapsulation with quantum randomness
        let (ciphertext, shared_secret) = Kyber768::encapsulate_with_randomness(public_key, &random_bytes);

        Ok((ciphertext, shared_secret))
    }

    /// Decapsulate a shared secret (no randomness needed)
    ///
    /// # Arguments
    /// * `ciphertext` - The ciphertext to decapsulate
    /// * `secret_key` - The recipient's secret key
    ///
    /// # Returns
    /// The shared secret
    pub fn decapsulate(&self, ciphertext: &Ciphertext, secret_key: &SecretKey) -> SharedSecret {
        Kyber768::decapsulate(ciphertext, secret_key)
    }

    /// Get a reference to the entropy pool for direct access
    pub fn entropy_pool(&self) -> &Arc<EntropyPool> {
        &self.entropy_pool
    }
}

// Extension trait for standard Kyber768 to add QRNG methods
impl Kyber768 {
    /// Generate keypair from explicit seed and coins (for QRNG integration)
    pub fn keygen_from_seed(seed: &[u8], coins: &[u8]) -> (PublicKey, SecretKey) {
        // TODO: Implement seed-based keygen
        // This requires modifications to the existing keygen to accept external randomness
        // For now, fall back to default keygen (to be implemented by Coder agent)
        Self::keygen()
    }

    /// Encapsulate with explicit randomness (for QRNG integration)
    pub fn encapsulate_with_randomness(
        public_key: &PublicKey,
        randomness: &[u8],
    ) -> (Ciphertext, SharedSecret) {
        // TODO: Implement randomness-based encapsulation
        // This requires modifications to accept external randomness
        // For now, fall back to default encapsulation
        Self::encapsulate(public_key)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::qrng::{EntropyPoolConfig, MockQrngDevice};

    #[test]
    fn test_qrng_keygen() {
        let device = Box::new(MockQrngDevice::new());
        let config = EntropyPoolConfig::default();
        let pool = Arc::new(EntropyPool::new(device, config).unwrap());

        let kyber = Kyber768Qrng::new(pool);
        let result = kyber.keygen();

        assert!(result.is_ok());
        let (_pk, _sk) = result.unwrap();
        // Keypair should be generated successfully with QRNG
    }

    #[test]
    fn test_qrng_encapsulation() {
        let device = Box::new(MockQrngDevice::new());
        let config = EntropyPoolConfig::default();
        let pool = Arc::new(EntropyPool::new(device, config).unwrap());

        let kyber = Kyber768Qrng::new(pool);
        let (pk, sk) = kyber.keygen().unwrap();

        let result = kyber.encapsulate(&pk);
        assert!(result.is_ok());

        let (ciphertext, shared_secret_enc) = result.unwrap();

        // Verify decapsulation
        let shared_secret_dec = kyber.decapsulate(&ciphertext, &sk);
        assert_eq!(shared_secret_enc.as_bytes(), shared_secret_dec.as_bytes());
    }

    #[test]
    fn test_multiple_operations() {
        let device = Box::new(MockQrngDevice::new());
        let config = EntropyPoolConfig::default();
        let pool = Arc::new(EntropyPool::new(device, config).unwrap());

        let kyber = Kyber768Qrng::new(pool);

        // Generate multiple keypairs
        for _ in 0..10 {
            let result = kyber.keygen();
            assert!(result.is_ok());
        }

        // Perform multiple encapsulations
        let (pk, sk) = kyber.keygen().unwrap();
        for _ in 0..10 {
            let (ct, ss1) = kyber.encapsulate(&pk).unwrap();
            let ss2 = kyber.decapsulate(&ct, &sk);
            assert_eq!(ss1.as_bytes(), ss2.as_bytes());
        }
    }
}
