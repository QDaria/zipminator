//! CRYSTALS-Kyber-768 Post-Quantum Key Encapsulation Mechanism
//!
//! This implementation prioritizes:
//! 1. Memory safety (Rust guarantees)
//! 2. Constant-time execution (using `subtle` crate)
//! 3. Performance optimization (NTT, SIMD where applicable)
//!
//! Target: Match or exceed C++/AVX2 baseline of ~0.034ms for full Kyber-768 operation

#![allow(dead_code)]
#![cfg_attr(target_arch = "x86_64", feature(stdarch_x86_avx512))]

pub mod constants;
pub mod ntt;
pub mod poly;
pub mod kyber768;
pub mod utils;
pub mod qrng;
pub mod entropy_source;

pub use kyber768::{Kyber768, PublicKey, SecretKey, Ciphertext, SharedSecret};

// Re-export key types
pub use constants::*;

// Re-export QRNG types
pub use qrng::{
    entropy_pool::{EntropyPool, EntropyPoolConfig},
    id_quantique::IdQuantiqueDevice,
    mock::MockQrngDevice,
    HealthStatus, QrngDevice, QrngError,
};

/// Initialize logging for the library
pub fn init_logging() {
    let _ = env_logger::Builder::from_default_env()
        .filter_level(log::LevelFilter::Info)
        .try_init();
}

#[cfg(test)]
mod tests;
