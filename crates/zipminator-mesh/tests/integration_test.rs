//! Integration tests for the Q-Mesh entropy bridge and provisioner.

use zipminator_mesh::entropy_bridge::{EntropyBridgeError, FilePoolSource};
use zipminator_mesh::{EntropyBridge, MeshProvisioner};

use std::fs;
use tempfile::tempdir;

/// Helper: create a temp pool file with deterministic pseudo-entropy.
fn create_test_pool(size: usize) -> (tempfile::TempDir, std::path::PathBuf) {
    let dir = tempdir().unwrap();
    let path = dir.path().join("pool.bin");
    let data: Vec<u8> = (0..size).map(|i| ((i * 7 + 13) % 256) as u8).collect();
    fs::write(&path, &data).unwrap();
    (dir, path)
}

// ── Entropy Bridge tests ────────────────────────────────────────────

#[test]
fn test_end_to_end_mesh_key_from_file() {
    let (_dir, pool_path) = create_test_pool(1024);
    let source = FilePoolSource::new(&pool_path).unwrap();
    let mut bridge = EntropyBridge::new(source);

    let mesh_key = bridge.derive_mesh_key(Some(b"integration-test")).unwrap();
    assert_eq!(mesh_key.as_bytes().len(), 16);
    assert!(!mesh_key.is_zero());
}

#[test]
fn test_end_to_end_siphash_key_from_file() {
    let (_dir, pool_path) = create_test_pool(1024);
    let source = FilePoolSource::new(&pool_path).unwrap();
    let mut bridge = EntropyBridge::new(source);

    let sip_key = bridge.derive_siphash_key(Some(b"integration-test")).unwrap();
    assert_eq!(sip_key.as_bytes().len(), 16);
    assert!(!sip_key.is_zero());
    let _ = sip_key.k0();
    let _ = sip_key.k1();
}

#[test]
fn test_end_to_end_key_pair() {
    let (_dir, pool_path) = create_test_pool(1024);
    let source = FilePoolSource::new(&pool_path).unwrap();
    let mut bridge = EntropyBridge::new(source);

    let (mesh, siphash) = bridge.derive_mesh_key_pair(Some(b"pair-test")).unwrap();
    assert!(!mesh.is_zero());
    assert!(!siphash.is_zero());
    assert_ne!(mesh.as_bytes()[..], siphash.as_bytes()[..]);
}

#[test]
fn test_small_pool_fails() {
    let dir = tempdir().unwrap();
    let path = dir.path().join("tiny.bin");
    fs::write(&path, &[0u8; 16]).unwrap();

    let source = FilePoolSource::new(&path).unwrap();
    let mut bridge = EntropyBridge::new(source);

    let err = bridge.derive_mesh_key(None).unwrap_err();
    match err {
        EntropyBridgeError::InsufficientEntropy { needed, available } => {
            assert_eq!(needed, 32);
            assert_eq!(available, 16);
        }
        other => panic!("expected InsufficientEntropy, got: {:?}", other),
    }
}

#[test]
fn test_empty_pool_file() {
    let dir = tempdir().unwrap();
    let path = dir.path().join("empty.bin");
    fs::write(&path, &[]).unwrap();

    let source = FilePoolSource::new(&path).unwrap();
    let mut bridge = EntropyBridge::new(source);

    let err = bridge.derive_mesh_key(None).unwrap_err();
    match err {
        EntropyBridgeError::InsufficientEntropy { needed, available } => {
            assert_eq!(needed, 32);
            assert_eq!(available, 0);
        }
        other => panic!("expected InsufficientEntropy, got: {:?}", other),
    }
}

#[test]
fn test_missing_pool_file() {
    let result = FilePoolSource::new("/does/not/exist/pool.bin");
    assert!(result.is_err());
}

#[test]
fn test_reproducibility_same_pool_same_salt() {
    let (_dir, pool_path) = create_test_pool(1024);

    let source1 = FilePoolSource::new(&pool_path).unwrap();
    let source2 = FilePoolSource::new(&pool_path).unwrap();

    let mut bridge1 = EntropyBridge::new(source1);
    let mut bridge2 = EntropyBridge::new(source2);

    let key1 = bridge1.derive_mesh_key(Some(b"repro")).unwrap();
    let key2 = bridge2.derive_mesh_key(Some(b"repro")).unwrap();
    assert_eq!(key1, key2, "same entropy + same salt must produce same key");
}

#[test]
fn test_different_salts_produce_different_keys() {
    let (_dir, pool_path) = create_test_pool(1024);

    let source1 = FilePoolSource::new(&pool_path).unwrap();
    let source2 = FilePoolSource::new(&pool_path).unwrap();

    let mut bridge1 = EntropyBridge::new(source1);
    let mut bridge2 = EntropyBridge::new(source2);

    let key_a = bridge1.derive_mesh_key(Some(b"network-alpha")).unwrap();
    let key_b = bridge2.derive_mesh_key(Some(b"network-beta")).unwrap();
    assert_ne!(key_a, key_b, "different salts must produce different keys");
}

#[test]
fn test_different_entropy_produces_different_keys() {
    let dir = tempdir().unwrap();
    let path_a = dir.path().join("pool_a.bin");
    let path_b = dir.path().join("pool_b.bin");
    let data_a: Vec<u8> = (0..256).map(|i| i as u8).collect();
    let data_b: Vec<u8> = (0..256).map(|i| 255 - i as u8).collect();
    fs::write(&path_a, &data_a).unwrap();
    fs::write(&path_b, &data_b).unwrap();

    let mut bridge_a = EntropyBridge::new(FilePoolSource::new(&path_a).unwrap());
    let mut bridge_b = EntropyBridge::new(FilePoolSource::new(&path_b).unwrap());

    let key_a = bridge_a.derive_mesh_key(Some(b"same-salt")).unwrap();
    let key_b = bridge_b.derive_mesh_key(Some(b"same-salt")).unwrap();
    assert_ne!(key_a, key_b, "different entropy must produce different keys");
}

#[test]
fn test_key_rotation_via_sequence_number() {
    let (_dir, pool_path) = create_test_pool(1024);
    let mut keys = Vec::new();
    for seq in 0u32..5 {
        let salt = format!("net-42:seq:{seq}");
        let source = FilePoolSource::new(&pool_path).unwrap();
        let mut bridge = EntropyBridge::new(source);
        let key = bridge.derive_mesh_key(Some(salt.as_bytes())).unwrap();
        keys.push(key);
    }
    // All 5 keys should be unique
    for i in 0..keys.len() {
        for j in (i + 1)..keys.len() {
            assert_ne!(
                keys[i], keys[j],
                "sequence {i} and {j} must produce different keys"
            );
        }
    }
}

// ── MeshProvisioner tests ───────────────────────────────────────────

#[test]
fn test_provisioner_key_set() {
    let (_dir, pool_path) = create_test_pool(1024);
    let prov = MeshProvisioner::new(&pool_path, "integ-net").unwrap();
    let ks = prov.provision().unwrap();

    assert_eq!(ks.beacon_psk.len(), 32, "hex-encoded 16 bytes = 32 chars");
    assert_eq!(ks.frame_key.len(), 32);
    assert_eq!(ks.rotation_epoch, 0);
    assert_eq!(ks.network_id, "integ-net");
    assert_ne!(ks.beacon_psk, ks.frame_key);
}

#[test]
fn test_provisioner_json_output() {
    let (_dir, pool_path) = create_test_pool(1024);
    let prov = MeshProvisioner::new(&pool_path, "json-integ").unwrap();
    let json = prov.provision_json().unwrap();

    let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
    assert!(parsed["beacon_psk"].is_string());
    assert!(parsed["frame_key"].is_string());
    assert_eq!(parsed["rotation_epoch"], 0);
    assert_eq!(parsed["network_id"], "json-integ");
    // Verify hex strings are valid hex
    hex::decode(parsed["beacon_psk"].as_str().unwrap()).expect("beacon_psk must be valid hex");
    hex::decode(parsed["frame_key"].as_str().unwrap()).expect("frame_key must be valid hex");
}

#[test]
fn test_provisioner_rotate_keys() {
    let (_dir, pool_path) = create_test_pool(1024);
    let mut prov = MeshProvisioner::new(&pool_path, "rotate-integ").unwrap();

    let ks0 = prov.provision().unwrap();
    assert_eq!(prov.epoch(), 0);

    let ks1 = prov.rotate_keys().unwrap();
    assert_eq!(prov.epoch(), 1);
    assert_eq!(ks1.rotation_epoch, 1);
    assert_ne!(ks0.beacon_psk, ks1.beacon_psk);
    assert_ne!(ks0.frame_key, ks1.frame_key);

    let ks2 = prov.rotate_keys().unwrap();
    assert_eq!(prov.epoch(), 2);
    assert_ne!(ks1.beacon_psk, ks2.beacon_psk);
    // All three epochs produce distinct keys
    assert_ne!(ks0.beacon_psk, ks2.beacon_psk);
}

#[test]
fn test_provisioner_deterministic() {
    let (_dir, pool_path) = create_test_pool(1024);

    let prov1 = MeshProvisioner::new(&pool_path, "det-integ").unwrap();
    let prov2 = MeshProvisioner::new(&pool_path, "det-integ").unwrap();

    let ks1 = prov1.provision().unwrap();
    let ks2 = prov2.provision().unwrap();
    assert_eq!(ks1.beacon_psk, ks2.beacon_psk);
    assert_eq!(ks1.frame_key, ks2.frame_key);
}

#[test]
fn test_provisioner_different_networks() {
    let (_dir, pool_path) = create_test_pool(1024);

    let prov_a = MeshProvisioner::new(&pool_path, "network-alpha").unwrap();
    let prov_b = MeshProvisioner::new(&pool_path, "network-beta").unwrap();

    let ks_a = prov_a.provision().unwrap();
    let ks_b = prov_b.provision().unwrap();
    assert_ne!(ks_a.beacon_psk, ks_b.beacon_psk);
    assert_ne!(ks_a.frame_key, ks_b.frame_key);
}

#[test]
fn test_provisioner_missing_pool() {
    let result = MeshProvisioner::new("/nonexistent/pool.bin", "net");
    assert!(result.is_err());
}
