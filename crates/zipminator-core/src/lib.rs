//! CRYSTALS-Kyber-768 Post-Quantum Key Encapsulation Mechanism
//!
//! This implementation prioritizes:
//! 1. Memory safety (Rust guarantees)
//! 2. Constant-time execution (using `subtle` crate)
//! 3. Performance optimization (NTT, SIMD where applicable)
//!
//! Target: Match or exceed C++/AVX2 baseline of ~0.034ms for full Kyber-768 operation

#![allow(dead_code)]

pub mod constants;
pub mod email_crypto;
pub mod entropy_source;
pub mod errors;
pub mod ffi;
pub mod kyber768;
pub mod ntt;
pub mod openpgp_keys;
pub mod pii;
pub mod poly;
pub mod qrng;
pub mod quantum_entropy_pool;
pub mod ratchet;
pub mod srtp;
pub mod utils;

// Python bindings module - this is the entry point for Python
#[cfg(feature = "pyo3")]
pub mod python_bindings;

pub use kyber768::{Ciphertext, Kyber768, PublicKey, SecretKey, SharedSecret};

// Re-export key types
pub use constants::*;

// Re-export QRNG types
pub use qrng::{
    entropy_pool::{EntropyPool, EntropyPoolConfig},
    mock::MockQrngDevice,
    HealthStatus, QrngDevice, QrngError,
};

#[cfg(feature = "qrng-usb")]
pub use qrng::id_quantique::IdQuantiqueDevice;

/// Initialize logging for the library
pub fn init_logging() {
    let _ = env_logger::Builder::from_default_env()
        .filter_level(log::LevelFilter::Info)
        .try_init();
}

#[cfg(test)]
mod tests;
