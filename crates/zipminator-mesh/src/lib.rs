//! # Zipminator Q-Mesh Entropy Bridge
//!
//! Provides quantum-entropy-derived cryptographic keys for RuView mesh security.
//!
//! ## Architecture
//!
//! The bridge reads raw entropy from Zipminator's quantum entropy pool
//! (`quantum_entropy/quantum_entropy_pool.bin`) and uses HKDF-SHA256 to derive
//! mesh-specific keys:
//!
//! - **MeshKey**: 16-byte PSK for HMAC-SHA256 beacon authentication (ADR-032)
//! - **SipHashKey**: 16-byte key (two u64 halves) for SipHash-2-4 frame integrity
//!
//! All crypto operations use constant-time comparisons via the `subtle` crate.
//! All key material is zeroized on drop.

pub mod entropy_bridge;
pub mod mesh_key;
pub mod provisioner;
pub mod siphash_key;

// Wave 1: Physical Cryptography primitives
pub mod csi_entropy;
pub mod em_canary;
pub mod puek;
pub mod spatiotemporal;
pub mod topology_auth;
pub mod vital_auth;

// Wave 2: RuView attestation wire format
pub mod attestation;

pub use entropy_bridge::{EntropyBridge, EntropyBridgeError, PoolEntropySource};
pub use mesh_key::MeshKey;
pub use provisioner::{MeshProvisioner, NVS_MAGIC};
pub use siphash_key::SipHashKey;
