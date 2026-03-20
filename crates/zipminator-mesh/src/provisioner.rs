//! MeshProvisioner: derives a complete key set for ESP32 mesh provisioning.
//!
//! Takes an entropy pool path and mesh network ID, derives beacon PSK + frame
//! SipHash key, and serializes to JSON or NVS-compatible binary for flashing
//! onto ESP32-S3 nodes.

use std::path::Path;

use serde::Serialize;
use sha2::{Digest, Sha256};

use crate::em_canary::EmCanaryPolicy;
use crate::entropy_bridge::{EntropyBridge, EntropyBridgeError, FilePoolSource};
use crate::mesh_key::MeshKey;
use crate::puek::PuekEnrollment;
use crate::siphash_key::SipHashKey;

/// Magic bytes identifying a Zipminator NVS mesh binary blob (v1).
pub const NVS_MAGIC: &[u8; 6] = b"ZMESH\x01";

/// Magic bytes identifying a Zipminator NVS mesh binary blob (v2, with PUEK + EM Canary).
pub const NVS_MAGIC_V2: &[u8; 6] = b"ZMESH\x02";

/// Size of the SHA-256 checksum appended to the NVS binary.
const NVS_CHECKSUM_SIZE: usize = 32;

/// A complete key set for one mesh provisioning epoch.
#[derive(Debug, Clone, Serialize)]
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

/// A complete key set for one mesh provisioning epoch, with optional PUEK and EM Canary config.
#[derive(Debug, Clone)]
pub struct MeshKeySetV2 {
    /// Base key set (PSK, frame key, epoch, network ID).
    pub base: MeshKeySet,
    /// Optional PUEK enrollment data for environment-bound keys.
    pub puek_enrollment: Option<PuekEnrollmentData>,
    /// Optional EM Canary policy for anomaly-driven session control.
    pub canary_policy: Option<CanaryPolicyData>,
}

/// Parsed result of a V2 NVS binary blob.
#[derive(Debug, Clone)]
pub struct ParsedNvsV2 {
    /// Mesh network identifier.
    pub mesh_id: String,
    /// 16-byte PSK for beacon auth.
    pub psk: [u8; 16],
    /// 16-byte SipHash key for frame integrity.
    pub siphash: [u8; 16],
    /// Optional PUEK enrollment data.
    pub puek: Option<PuekEnrollmentData>,
    /// Optional EM Canary policy.
    pub canary: Option<CanaryPolicyData>,
}

/// Serializable subset of PUEK enrollment for NVS binary embedding.
#[derive(Debug, Clone)]
pub struct PuekEnrollmentData {
    /// SVD-derived eigenmodes (f64 LE each).
    pub eigenmodes: Vec<f64>,
    /// Similarity threshold for verification.
    pub threshold: f64,
}

impl PuekEnrollmentData {
    /// Build from a `PuekEnrollment`.
    pub fn from_enrollment(enrollment: &PuekEnrollment) -> Self {
        // Access fields through public API
        let eigenmode_count = enrollment.eigenmode_count();
        let threshold = enrollment.threshold();
        // We cannot directly access eigenmodes from PuekEnrollment (private field).
        // This constructor is for callers who already have the data.
        // Use `new` instead.
        Self {
            eigenmodes: Vec::with_capacity(eigenmode_count),
            threshold,
        }
    }

    /// Create directly from eigenmode data.
    pub fn new(eigenmodes: Vec<f64>, threshold: f64) -> Self {
        Self {
            eigenmodes,
            threshold,
        }
    }
}

/// Serializable subset of EM Canary policy for NVS binary embedding.
#[derive(Debug, Clone)]
pub struct CanaryPolicyData {
    /// Eigenstructure deviation threshold for Elevated.
    pub elevated_threshold: f64,
    /// Eigenstructure deviation threshold for High.
    pub high_threshold: f64,
    /// Eigenstructure deviation threshold for Critical.
    pub critical_threshold: f64,
    /// Maximum consecutive anomaly events before forced escalation.
    pub max_consecutive_anomalies: u32,
    /// Whether to automatically rekey on Elevated threat.
    pub rekey_on_elevated: bool,
    /// Whether to terminate session on Critical threat.
    pub terminate_on_critical: bool,
}

impl CanaryPolicyData {
    /// Build from an `EmCanaryPolicy`.
    pub fn from_policy(policy: &EmCanaryPolicy) -> Self {
        Self {
            elevated_threshold: policy.elevated_threshold,
            high_threshold: policy.high_threshold,
            critical_threshold: policy.critical_threshold,
            max_consecutive_anomalies: policy.max_consecutive_anomalies,
            rekey_on_elevated: policy.rekey_on_elevated,
            terminate_on_critical: policy.terminate_on_critical,
        }
    }
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

    /// Produce a V2 NVS-compatible binary blob with optional PUEK enrollment and EM Canary policy.
    ///
    /// Binary layout:
    /// ```text
    /// [magic: 6B "ZMESH\x02"]
    /// [mesh_id_len: 2B LE] [mesh_id: N bytes]
    /// [psk: 16B] [siphash: 16B]
    /// [has_puek: 1B] [puek_data: variable if has_puek=1]
    ///   - puek_eigenmode_count: 2B LE
    ///   - puek_eigenmodes: eigenmode_count * 8B (f64 LE each)
    ///   - puek_threshold: 8B (f64 LE)
    /// [has_canary: 1B] [canary_data: variable if has_canary=1]
    ///   - elevated_threshold: 8B (f64 LE)
    ///   - high_threshold: 8B (f64 LE)
    ///   - critical_threshold: 8B (f64 LE)
    ///   - max_consecutive: 4B (u32 LE)
    ///   - flags: 1B (bit 0 = rekey_on_elevated, bit 1 = terminate_on_critical)
    /// [sha256_checksum: 32B]
    /// ```
    pub fn provision_nvs_v2_binary(
        &mut self,
        mesh_id: &str,
        puek: Option<&PuekEnrollmentData>,
        canary: Option<&CanaryPolicyData>,
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

        // Derive keys
        let salt = format!("{}:epoch:{}", mesh_id, self.epoch).into_bytes();
        let source = FilePoolSource::new(&self.pool_path)?;
        let mut bridge = EntropyBridge::new(source);
        let (mesh_key, siphash_key) = bridge.derive_mesh_key_pair(Some(&salt))?;

        let mut buf = Vec::with_capacity(256);

        // Magic header (v2)
        buf.extend_from_slice(NVS_MAGIC_V2);
        // Mesh ID length (u16 LE)
        buf.extend_from_slice(&(id_bytes.len() as u16).to_le_bytes());
        // Mesh ID bytes
        buf.extend_from_slice(id_bytes);
        // PSK (16 bytes)
        buf.extend_from_slice(mesh_key.as_bytes());
        // SipHash key (16 bytes)
        buf.extend_from_slice(siphash_key.as_bytes());

        // PUEK section
        match puek {
            Some(p) => {
                buf.push(1); // has_puek = 1
                let count = p.eigenmodes.len() as u16;
                buf.extend_from_slice(&count.to_le_bytes());
                for eigenmode in &p.eigenmodes {
                    buf.extend_from_slice(&eigenmode.to_le_bytes());
                }
                buf.extend_from_slice(&p.threshold.to_le_bytes());
            }
            None => {
                buf.push(0); // has_puek = 0
            }
        }

        // Canary section
        match canary {
            Some(c) => {
                buf.push(1); // has_canary = 1
                buf.extend_from_slice(&c.elevated_threshold.to_le_bytes());
                buf.extend_from_slice(&c.high_threshold.to_le_bytes());
                buf.extend_from_slice(&c.critical_threshold.to_le_bytes());
                buf.extend_from_slice(&c.max_consecutive_anomalies.to_le_bytes());
                let mut flags: u8 = 0;
                if c.rekey_on_elevated {
                    flags |= 0x01;
                }
                if c.terminate_on_critical {
                    flags |= 0x02;
                }
                buf.push(flags);
            }
            None => {
                buf.push(0); // has_canary = 0
            }
        }

        // SHA-256 checksum over everything so far
        let checksum = Sha256::digest(&buf);
        buf.extend_from_slice(&checksum);

        Ok(buf)
    }

    /// Parse a V2 NVS binary blob back into its components.
    ///
    /// Returns the mesh_id, PSK bytes, SipHash bytes, optional PUEK data, and optional canary data.
    /// Validates the SHA-256 checksum.
    pub fn parse_nvs_v2_binary(
        blob: &[u8],
    ) -> Result<ParsedNvsV2, EntropyBridgeError> {
        if blob.len() < NVS_MAGIC_V2.len() + 2 + NVS_CHECKSUM_SIZE {
            return Err(EntropyBridgeError::PoolNotAccessible(
                "blob too short for V2 format".into(),
            ));
        }

        // Verify magic
        if &blob[..6] != NVS_MAGIC_V2 {
            return Err(EntropyBridgeError::PoolNotAccessible(
                "invalid V2 magic bytes".into(),
            ));
        }

        // Verify checksum
        let (payload, stored_checksum) = blob.split_at(blob.len() - NVS_CHECKSUM_SIZE);
        let computed = Sha256::digest(payload);
        if computed.as_slice() != stored_checksum {
            return Err(EntropyBridgeError::PoolNotAccessible(
                "V2 checksum mismatch".into(),
            ));
        }

        let mut pos = 6;

        // Mesh ID
        if pos + 2 > payload.len() {
            return Err(EntropyBridgeError::PoolNotAccessible("truncated mesh_id length".into()));
        }
        let id_len = u16::from_le_bytes([payload[pos], payload[pos + 1]]) as usize;
        pos += 2;
        if pos + id_len > payload.len() {
            return Err(EntropyBridgeError::PoolNotAccessible("truncated mesh_id".into()));
        }
        let mesh_id = String::from_utf8(payload[pos..pos + id_len].to_vec())
            .map_err(|e| EntropyBridgeError::PoolNotAccessible(format!("invalid mesh_id UTF-8: {e}")))?;
        pos += id_len;

        // PSK (16 bytes)
        if pos + 16 > payload.len() {
            return Err(EntropyBridgeError::PoolNotAccessible("truncated PSK".into()));
        }
        let mut psk = [0u8; 16];
        psk.copy_from_slice(&payload[pos..pos + 16]);
        pos += 16;

        // SipHash key (16 bytes)
        if pos + 16 > payload.len() {
            return Err(EntropyBridgeError::PoolNotAccessible("truncated SipHash key".into()));
        }
        let mut sip = [0u8; 16];
        sip.copy_from_slice(&payload[pos..pos + 16]);
        pos += 16;

        // PUEK section
        if pos + 1 > payload.len() {
            return Err(EntropyBridgeError::PoolNotAccessible("truncated has_puek".into()));
        }
        let has_puek = payload[pos];
        pos += 1;
        let puek_data = if has_puek == 1 {
            if pos + 2 > payload.len() {
                return Err(EntropyBridgeError::PoolNotAccessible("truncated puek eigenmode count".into()));
            }
            let eigenmode_count = u16::from_le_bytes([payload[pos], payload[pos + 1]]) as usize;
            pos += 2;
            let eigenmodes_bytes = eigenmode_count * 8;
            if pos + eigenmodes_bytes + 8 > payload.len() {
                return Err(EntropyBridgeError::PoolNotAccessible("truncated puek data".into()));
            }
            let mut eigenmodes = Vec::with_capacity(eigenmode_count);
            for _ in 0..eigenmode_count {
                let val = f64::from_le_bytes(payload[pos..pos + 8].try_into().unwrap());
                eigenmodes.push(val);
                pos += 8;
            }
            let threshold = f64::from_le_bytes(payload[pos..pos + 8].try_into().unwrap());
            pos += 8;
            Some(PuekEnrollmentData::new(eigenmodes, threshold))
        } else {
            None
        };

        // Canary section
        if pos + 1 > payload.len() {
            return Err(EntropyBridgeError::PoolNotAccessible("truncated has_canary".into()));
        }
        let has_canary = payload[pos];
        pos += 1;
        let canary_data = if has_canary == 1 {
            // 3 * f64 (24) + u32 (4) + flags (1) = 29 bytes
            if pos + 29 > payload.len() {
                return Err(EntropyBridgeError::PoolNotAccessible("truncated canary data".into()));
            }
            let elevated = f64::from_le_bytes(payload[pos..pos + 8].try_into().unwrap());
            pos += 8;
            let high = f64::from_le_bytes(payload[pos..pos + 8].try_into().unwrap());
            pos += 8;
            let critical = f64::from_le_bytes(payload[pos..pos + 8].try_into().unwrap());
            pos += 8;
            let max_consecutive = u32::from_le_bytes(payload[pos..pos + 4].try_into().unwrap());
            pos += 4;
            let flags = payload[pos];
            // pos += 1; // not needed, end of data

            Some(CanaryPolicyData {
                elevated_threshold: elevated,
                high_threshold: high,
                critical_threshold: critical,
                max_consecutive_anomalies: max_consecutive,
                rekey_on_elevated: flags & 0x01 != 0,
                terminate_on_critical: flags & 0x02 != 0,
            })
        } else {
            None
        };

        Ok(ParsedNvsV2 {
            mesh_id,
            psk,
            siphash: sip,
            puek: puek_data,
            canary: canary_data,
        })
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

    // --- NVS binary tests ---

    #[test]
    fn test_nvs_binary_magic_bytes() {
        let (_dir, pool_path) = create_test_pool(1024);
        let mut prov = MeshProvisioner::new(&pool_path, "nvs-net").unwrap();
        let blob = prov.provision_nvs_binary("nvs-net").unwrap();
        assert_eq!(&blob[..6], b"ZMESH\x01", "binary must start with magic bytes");
    }

    #[test]
    fn test_nvs_binary_key_offsets() {
        let (_dir, pool_path) = create_test_pool(1024);
        let mut prov = MeshProvisioner::new(&pool_path, "offset-net").unwrap();
        let mesh_id = "offset-net";
        let blob = prov.provision_nvs_binary(mesh_id).unwrap();

        let id_len = u16::from_le_bytes([blob[6], blob[7]]) as usize;
        assert_eq!(id_len, mesh_id.len());

        // Verify mesh_id bytes
        let id_start = 8;
        let id_end = id_start + id_len;
        assert_eq!(&blob[id_start..id_end], mesh_id.as_bytes());

        // PSK starts right after mesh_id, 16 bytes
        let psk_start = id_end;
        let psk_end = psk_start + 16;
        let psk = &blob[psk_start..psk_end];
        assert_eq!(psk.len(), 16);
        // PSK should not be all zeros
        assert!(psk.iter().any(|&b| b != 0), "PSK must not be all zeros");

        // SipHash key follows PSK, 16 bytes
        let sip_start = psk_end;
        let sip_end = sip_start + 16;
        let sip = &blob[sip_start..sip_end];
        assert_eq!(sip.len(), 16);
        assert!(sip.iter().any(|&b| b != 0), "SipHash key must not be all zeros");

        // PSK and SipHash key must differ
        assert_ne!(psk, sip, "PSK and SipHash key must differ");

        // Checksum is the final 32 bytes
        let checksum_start = sip_end;
        assert_eq!(blob.len(), checksum_start + 32);
    }

    #[test]
    fn test_nvs_binary_checksum_validates() {
        use sha2::{Digest, Sha256};

        let (_dir, pool_path) = create_test_pool(1024);
        let mut prov = MeshProvisioner::new(&pool_path, "cksum-net").unwrap();
        let blob = prov.provision_nvs_binary("cksum-net").unwrap();

        // Split payload and checksum
        let (payload, stored_checksum) = blob.split_at(blob.len() - 32);
        let computed = Sha256::digest(payload);
        assert_eq!(
            computed.as_slice(),
            stored_checksum,
            "SHA-256 checksum must match payload"
        );
    }

    #[test]
    fn test_nvs_binary_different_mesh_ids_differ() {
        let (_dir, pool_path) = create_test_pool(1024);
        let mut prov1 = MeshProvisioner::new(&pool_path, "net-alpha").unwrap();
        let mut prov2 = MeshProvisioner::new(&pool_path, "net-beta").unwrap();

        let blob1 = prov1.provision_nvs_binary("net-alpha").unwrap();
        let blob2 = prov2.provision_nvs_binary("net-beta").unwrap();

        // Different lengths (different mesh_id strings) or different key material
        assert_ne!(blob1, blob2, "different mesh_ids must produce different binaries");

        // Also verify different key material specifically: extract PSK from each
        let psk_offset_1 = 8 + "net-alpha".len();
        let psk_offset_2 = 8 + "net-beta".len();
        let psk1 = &blob1[psk_offset_1..psk_offset_1 + 16];
        let psk2 = &blob2[psk_offset_2..psk_offset_2 + 16];
        assert_ne!(psk1, psk2, "different mesh_ids must derive different PSKs");
    }

    #[test]
    fn test_nvs_binary_empty_mesh_id_rejected() {
        let (_dir, pool_path) = create_test_pool(1024);
        let mut prov = MeshProvisioner::new(&pool_path, "some-net").unwrap();
        let result = prov.provision_nvs_binary("");
        assert!(result.is_err(), "empty mesh_id must be rejected");
    }

    #[test]
    fn test_nvs_binary_deterministic() {
        let (_dir, pool_path) = create_test_pool(1024);
        let mut prov1 = MeshProvisioner::new(&pool_path, "det-nvs").unwrap();
        let mut prov2 = MeshProvisioner::new(&pool_path, "det-nvs").unwrap();

        let blob1 = prov1.provision_nvs_binary("det-nvs").unwrap();
        let blob2 = prov2.provision_nvs_binary("det-nvs").unwrap();
        assert_eq!(blob1, blob2, "same inputs must produce identical binaries");
    }

    // --- NVS V2 binary tests ---

    fn make_test_puek() -> PuekEnrollmentData {
        PuekEnrollmentData::new(vec![100.5, 42.3, 17.8, 5.1], 0.85)
    }

    fn make_test_canary() -> CanaryPolicyData {
        CanaryPolicyData {
            elevated_threshold: 0.10,
            high_threshold: 0.25,
            critical_threshold: 0.50,
            max_consecutive_anomalies: 5,
            rekey_on_elevated: true,
            terminate_on_critical: true,
        }
    }

    #[test]
    fn test_nvs_v2_binary_with_puek() {
        let (_dir, pool_path) = create_test_pool(1024);
        let mut prov = MeshProvisioner::new(&pool_path, "v2-puek").unwrap();
        let puek = make_test_puek();
        let blob = prov
            .provision_nvs_v2_binary("v2-puek", Some(&puek), None)
            .unwrap();

        let parsed = MeshProvisioner::parse_nvs_v2_binary(&blob).unwrap();

        assert_eq!(parsed.mesh_id, "v2-puek");
        assert!(parsed.psk.iter().any(|&b| b != 0), "PSK must not be all zeros");
        assert!(parsed.siphash.iter().any(|&b| b != 0), "SipHash must not be all zeros");
        assert_ne!(parsed.psk, parsed.siphash);

        let p = parsed.puek.expect("PUEK data should be present");
        assert_eq!(p.eigenmodes.len(), 4);
        assert!((p.eigenmodes[0] - 100.5).abs() < 1e-10);
        assert!((p.eigenmodes[3] - 5.1).abs() < 1e-10);
        assert!((p.threshold - 0.85).abs() < 1e-10);

        assert!(parsed.canary.is_none(), "canary should be absent");
    }

    #[test]
    fn test_nvs_v2_binary_with_canary() {
        let (_dir, pool_path) = create_test_pool(1024);
        let mut prov = MeshProvisioner::new(&pool_path, "v2-canary").unwrap();
        let canary = make_test_canary();
        let blob = prov
            .provision_nvs_v2_binary("v2-canary", None, Some(&canary))
            .unwrap();

        let parsed = MeshProvisioner::parse_nvs_v2_binary(&blob).unwrap();

        assert_eq!(parsed.mesh_id, "v2-canary");
        assert!(parsed.puek.is_none(), "PUEK should be absent");

        let c = parsed.canary.expect("canary data should be present");
        assert!((c.elevated_threshold - 0.10).abs() < 1e-10);
        assert!((c.high_threshold - 0.25).abs() < 1e-10);
        assert!((c.critical_threshold - 0.50).abs() < 1e-10);
        assert_eq!(c.max_consecutive_anomalies, 5);
        assert!(c.rekey_on_elevated);
        assert!(c.terminate_on_critical);
    }

    #[test]
    fn test_nvs_v2_binary_with_both() {
        let (_dir, pool_path) = create_test_pool(1024);
        let mut prov = MeshProvisioner::new(&pool_path, "v2-both").unwrap();
        let puek = make_test_puek();
        let canary = make_test_canary();
        let blob = prov
            .provision_nvs_v2_binary("v2-both", Some(&puek), Some(&canary))
            .unwrap();

        let parsed = MeshProvisioner::parse_nvs_v2_binary(&blob).unwrap();

        assert_eq!(parsed.mesh_id, "v2-both");
        assert!(parsed.puek.is_some(), "PUEK should be present");
        assert!(parsed.canary.is_some(), "canary should be present");
    }

    #[test]
    fn test_nvs_v2_binary_with_neither() {
        let (_dir, pool_path) = create_test_pool(1024);
        let mut prov = MeshProvisioner::new(&pool_path, "v2-none").unwrap();
        let blob = prov
            .provision_nvs_v2_binary("v2-none", None, None)
            .unwrap();

        let parsed = MeshProvisioner::parse_nvs_v2_binary(&blob).unwrap();

        assert_eq!(parsed.mesh_id, "v2-none");
        assert!(parsed.psk.iter().any(|&b| b != 0));
        assert!(parsed.siphash.iter().any(|&b| b != 0));
        assert!(parsed.puek.is_none());
        assert!(parsed.canary.is_none());
    }

    #[test]
    fn test_nvs_v2_magic_bytes_correct() {
        let (_dir, pool_path) = create_test_pool(1024);
        let mut prov = MeshProvisioner::new(&pool_path, "v2-magic").unwrap();
        let blob = prov
            .provision_nvs_v2_binary("v2-magic", None, None)
            .unwrap();

        assert_eq!(&blob[..6], b"ZMESH\x02", "V2 binary must start with ZMESH\\x02");
        // Confirm it differs from V1 magic
        assert_ne!(&blob[..6], b"ZMESH\x01");
    }

    #[test]
    fn test_nvs_v2_checksum_validates() {
        let (_dir, pool_path) = create_test_pool(1024);
        let mut prov = MeshProvisioner::new(&pool_path, "v2-cksum").unwrap();
        let puek = make_test_puek();
        let canary = make_test_canary();
        let blob = prov
            .provision_nvs_v2_binary("v2-cksum", Some(&puek), Some(&canary))
            .unwrap();

        // Split payload and checksum, verify manually
        let (payload, stored_checksum) = blob.split_at(blob.len() - 32);
        let computed = Sha256::digest(payload);
        assert_eq!(
            computed.as_slice(),
            stored_checksum,
            "SHA-256 checksum must match payload"
        );

        // Also verify that a corrupted blob fails parsing
        let mut corrupted = blob.clone();
        corrupted[10] ^= 0xFF;
        let result = MeshProvisioner::parse_nvs_v2_binary(&corrupted);
        assert!(result.is_err(), "corrupted blob must fail checksum validation");
    }

    #[test]
    fn test_nvs_v2_roundtrip() {
        let (_dir, pool_path) = create_test_pool(1024);
        let mut prov = MeshProvisioner::new(&pool_path, "v2-rt").unwrap();
        let puek = PuekEnrollmentData::new(vec![1.0, 2.0, 3.0], 0.75);
        let canary = CanaryPolicyData {
            elevated_threshold: 0.05,
            high_threshold: 0.20,
            critical_threshold: 0.40,
            max_consecutive_anomalies: 3,
            rekey_on_elevated: false,
            terminate_on_critical: true,
        };

        let blob = prov
            .provision_nvs_v2_binary("v2-rt", Some(&puek), Some(&canary))
            .unwrap();
        let parsed = MeshProvisioner::parse_nvs_v2_binary(&blob).unwrap();

        assert_eq!(parsed.mesh_id, "v2-rt");

        // Verify PUEK roundtrip
        let p = parsed.puek.unwrap();
        assert_eq!(p.eigenmodes, vec![1.0, 2.0, 3.0]);
        assert!((p.threshold - 0.75).abs() < 1e-10);

        // Verify canary roundtrip
        let c = parsed.canary.unwrap();
        assert!((c.elevated_threshold - 0.05).abs() < 1e-10);
        assert!((c.high_threshold - 0.20).abs() < 1e-10);
        assert!((c.critical_threshold - 0.40).abs() < 1e-10);
        assert_eq!(c.max_consecutive_anomalies, 3);
        assert!(!c.rekey_on_elevated);
        assert!(c.terminate_on_critical);

        // Verify the keys are real (same as V1 derivation for same mesh_id)
        let mut prov_v1 = MeshProvisioner::new(&pool_path, "v2-rt").unwrap();
        let blob_v1 = prov_v1.provision_nvs_binary("v2-rt").unwrap();
        let id_len = u16::from_le_bytes([blob_v1[6], blob_v1[7]]) as usize;
        let psk_v1 = &blob_v1[8 + id_len..8 + id_len + 16];
        let sip_v1 = &blob_v1[8 + id_len + 16..8 + id_len + 32];
        assert_eq!(&parsed.psk, psk_v1, "V2 PSK must match V1 derivation");
        assert_eq!(&parsed.siphash, sip_v1, "V2 SipHash must match V1 derivation");
    }

    #[test]
    fn test_nvs_v2_different_configs_different_blobs() {
        let (_dir, pool_path) = create_test_pool(1024);

        let mut prov1 = MeshProvisioner::new(&pool_path, "v2-diff").unwrap();
        let mut prov2 = MeshProvisioner::new(&pool_path, "v2-diff").unwrap();
        let mut prov3 = MeshProvisioner::new(&pool_path, "v2-diff").unwrap();
        let mut prov4 = MeshProvisioner::new(&pool_path, "v2-diff").unwrap();

        let puek = make_test_puek();
        let canary = make_test_canary();

        let blob_none = prov1
            .provision_nvs_v2_binary("v2-diff", None, None)
            .unwrap();
        let blob_puek = prov2
            .provision_nvs_v2_binary("v2-diff", Some(&puek), None)
            .unwrap();
        let blob_canary = prov3
            .provision_nvs_v2_binary("v2-diff", None, Some(&canary))
            .unwrap();
        let blob_both = prov4
            .provision_nvs_v2_binary("v2-diff", Some(&puek), Some(&canary))
            .unwrap();

        // All four must differ (different payload = different checksum too)
        assert_ne!(blob_none, blob_puek, "none vs puek must differ");
        assert_ne!(blob_none, blob_canary, "none vs canary must differ");
        assert_ne!(blob_none, blob_both, "none vs both must differ");
        assert_ne!(blob_puek, blob_canary, "puek vs canary must differ");
        assert_ne!(blob_puek, blob_both, "puek vs both must differ");
        assert_ne!(blob_canary, blob_both, "canary vs both must differ");
    }
}
