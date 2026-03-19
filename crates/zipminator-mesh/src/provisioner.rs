//! MeshProvisioner: derives a complete key set for ESP32 mesh provisioning.
//!
//! Takes an entropy pool path and mesh network ID, derives beacon PSK + frame
//! SipHash key, and serializes to JSON or NVS-compatible binary for flashing
//! onto ESP32-S3 nodes.

use std::path::Path;

use serde::Serialize;
use sha2::{Digest, Sha256};

use crate::entropy_bridge::{EntropyBridge, EntropyBridgeError, FilePoolSource};
use crate::mesh_key::MeshKey;
use crate::siphash_key::SipHashKey;

/// Magic bytes identifying a Zipminator NVS mesh binary blob.
pub const NVS_MAGIC: &[u8; 6] = b"ZMESH\x01";

/// Size of the SHA-256 checksum appended to the NVS binary.
const NVS_CHECKSUM_SIZE: usize = 32;

/// A complete key set for one mesh provisioning epoch.
#[derive(Debug, Serialize)]
pub struct MeshKeySet {
    /// 16-byte PSK for HMAC-SHA256 beacon authentication (hex-encoded in JSON).
    pub beacon_psk: String,
    /// 16-byte key for SipHash-2-4 frame integrity (hex-encoded in JSON).
    pub frame_key: String,
    /// Rotation epoch counter. Incremented on each key rotation.
    pub rotation_epoch: u64,
    /// Network identifier used as HKDF salt for domain separation.
    pub network_id: String,
}

/// Derives and manages mesh key sets from the quantum entropy pool.
///
/// Each provisioner is bound to an entropy pool file and a network ID.
/// Keys are derived deterministically: same pool content + same network ID +
/// same epoch = same keys. Key rotation increments the epoch, which changes
/// the HKDF salt and produces fresh keys.
pub struct MeshProvisioner {
    pool_path: std::path::PathBuf,
    network_id: String,
    epoch: u64,
}

impl MeshProvisioner {
    /// Create a new provisioner for the given entropy pool and network.
    ///
    /// Validates that the pool file exists. Does not read entropy until
    /// `provision()` or `rotate_keys()` is called.
    pub fn new(
        pool_path: impl AsRef<Path>,
        network_id: impl Into<String>,
    ) -> Result<Self, EntropyBridgeError> {
        let pool_path = pool_path.as_ref().to_path_buf();
        if !pool_path.exists() {
            return Err(EntropyBridgeError::PoolNotAccessible(format!(
                "file not found: {}",
                pool_path.display()
            )));
        }
        Ok(Self {
            pool_path,
            network_id: network_id.into(),
            epoch: 0,
        })
    }

    /// Current rotation epoch.
    pub fn epoch(&self) -> u64 {
        self.epoch
    }

    /// Derive a complete key set for the current epoch.
    ///
    /// The HKDF salt is `"{network_id}:epoch:{epoch}"`, providing domain
    /// separation between networks and rotation epochs.
    pub fn provision(&self) -> Result<MeshKeySet, EntropyBridgeError> {
        let (mesh_key, siphash_key) = self.derive_pair()?;
        Ok(MeshKeySet {
            beacon_psk: hex::encode(mesh_key.as_bytes()),
            frame_key: hex::encode(siphash_key.as_bytes()),
            rotation_epoch: self.epoch,
            network_id: self.network_id.clone(),
        })
    }

    /// Serialize the current key set to JSON for ESP32 provisioning.
    pub fn provision_json(&self) -> Result<String, EntropyBridgeError> {
        let key_set = self.provision()?;
        serde_json::to_string_pretty(&key_set).map_err(|e| {
            EntropyBridgeError::PoolNotAccessible(format!("JSON serialization failed: {e}"))
        })
    }

    /// Produce an NVS-compatible binary blob for ESP32-S3 flash provisioning.
    ///
    /// The binary layout is:
    /// ```text
    /// [0..6]       "ZMESH\x01"         magic header
    /// [6..8]       mesh_id.len() as u16 LE
    /// [8..8+N]     mesh_id UTF-8 bytes
    /// [8+N..8+N+16]   16-byte PSK (beacon auth)
    /// [8+N+16..8+N+32] 16-byte SipHash key (frame integrity)
    /// [8+N+32..8+N+64] SHA-256 checksum of all preceding bytes
    /// ```
    ///
    /// The `mesh_id` parameter is the network identifier used as HKDF salt
    /// for domain separation. It must be non-empty and at most 65535 bytes.
    pub fn provision_nvs_binary(
        &mut self,
        mesh_id: &str,
    ) -> Result<Vec<u8>, EntropyBridgeError> {
        if mesh_id.is_empty() {
            return Err(EntropyBridgeError::PoolNotAccessible(
                "mesh_id must not be empty".into(),
            ));
        }
        let id_bytes = mesh_id.as_bytes();
        if id_bytes.len() > u16::MAX as usize {
            return Err(EntropyBridgeError::PoolNotAccessible(
                "mesh_id exceeds maximum length (65535 bytes)".into(),
            ));
        }

        // Derive keys using mesh_id as salt for domain separation
        let salt = format!("{}:epoch:{}", mesh_id, self.epoch).into_bytes();
        let source = FilePoolSource::new(&self.pool_path)?;
        let mut bridge = EntropyBridge::new(source);
        let (mesh_key, siphash_key) = bridge.derive_mesh_key_pair(Some(&salt))?;

        // Build the binary blob (without checksum first)
        let payload_len = NVS_MAGIC.len() + 2 + id_bytes.len() + 16 + 16;
        let mut buf = Vec::with_capacity(payload_len + NVS_CHECKSUM_SIZE);

        // Magic header
        buf.extend_from_slice(NVS_MAGIC);
        // Mesh ID length (u16 LE)
        buf.extend_from_slice(&(id_bytes.len() as u16).to_le_bytes());
        // Mesh ID bytes
        buf.extend_from_slice(id_bytes);
        // PSK (16 bytes)
        buf.extend_from_slice(mesh_key.as_bytes());
        // SipHash key (16 bytes)
        buf.extend_from_slice(siphash_key.as_bytes());

        // SHA-256 checksum over everything so far
        let checksum = Sha256::digest(&buf);
        buf.extend_from_slice(&checksum);

        Ok(buf)
    }

    /// Rotate keys by incrementing the epoch and re-deriving.
    ///
    /// Returns the new key set. The epoch counter advances by 1, which
    /// changes the HKDF salt and produces a completely new key pair.
    pub fn rotate_keys(&mut self) -> Result<MeshKeySet, EntropyBridgeError> {
        self.epoch += 1;
        self.provision()
    }

    /// Build the epoch-specific salt for HKDF.
    fn epoch_salt(&self) -> Vec<u8> {
        format!("{}:epoch:{}", self.network_id, self.epoch).into_bytes()
    }

    /// Derive both keys using the current epoch salt.
    fn derive_pair(&self) -> Result<(MeshKey, SipHashKey), EntropyBridgeError> {
        let source = FilePoolSource::new(&self.pool_path)?;
        let mut bridge = EntropyBridge::new(source);
        let salt = self.epoch_salt();
        bridge.derive_mesh_key_pair(Some(&salt))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    fn create_test_pool(size: usize) -> (tempfile::TempDir, std::path::PathBuf) {
        let dir = tempdir().unwrap();
        let path = dir.path().join("pool.bin");
        let data: Vec<u8> = (0..size).map(|i| ((i * 7 + 13) % 256) as u8).collect();
        fs::write(&path, &data).unwrap();
        (dir, path)
    }

    #[test]
    fn test_provision_key_set() {
        let (_dir, pool_path) = create_test_pool(1024);
        let prov = MeshProvisioner::new(&pool_path, "test-net-42").unwrap();
        let ks = prov.provision().unwrap();
        // Hex-encoded 16 bytes = 32 hex chars
        assert_eq!(ks.beacon_psk.len(), 32);
        assert_eq!(ks.frame_key.len(), 32);
        assert_eq!(ks.rotation_epoch, 0);
        assert_eq!(ks.network_id, "test-net-42");
        // PSK and frame key should differ
        assert_ne!(ks.beacon_psk, ks.frame_key);
    }

    #[test]
    fn test_provision_json_structure() {
        let (_dir, pool_path) = create_test_pool(1024);
        let prov = MeshProvisioner::new(&pool_path, "json-net").unwrap();
        let json = prov.provision_json().unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert!(parsed["beacon_psk"].is_string());
        assert!(parsed["frame_key"].is_string());
        assert_eq!(parsed["rotation_epoch"], 0);
        assert_eq!(parsed["network_id"], "json-net");
    }

    #[test]
    fn test_rotate_keys_change() {
        let (_dir, pool_path) = create_test_pool(1024);
        let mut prov = MeshProvisioner::new(&pool_path, "rotate-net").unwrap();
        let ks0 = prov.provision().unwrap();
        assert_eq!(prov.epoch(), 0);

        let ks1 = prov.rotate_keys().unwrap();
        assert_eq!(prov.epoch(), 1);
        assert_eq!(ks1.rotation_epoch, 1);

        // Rotated keys must differ from original
        assert_ne!(ks0.beacon_psk, ks1.beacon_psk);
        assert_ne!(ks0.frame_key, ks1.frame_key);
    }

    #[test]
    fn test_deterministic_provisioning() {
        let (_dir, pool_path) = create_test_pool(1024);
        let prov1 = MeshProvisioner::new(&pool_path, "det-net").unwrap();
        let prov2 = MeshProvisioner::new(&pool_path, "det-net").unwrap();
        let ks1 = prov1.provision().unwrap();
        let ks2 = prov2.provision().unwrap();
        assert_eq!(ks1.beacon_psk, ks2.beacon_psk);
        assert_eq!(ks1.frame_key, ks2.frame_key);
    }

    #[test]
    fn test_missing_pool_file() {
        let result = MeshProvisioner::new("/nonexistent/pool.bin", "net");
        assert!(result.is_err());
    }
}
