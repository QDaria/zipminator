//! Integration tests for the Q-Mesh entropy bridge.

use zipminator_mesh::EntropyBridge;
use zipminator_mesh::entropy_bridge::{EntropyBridgeError, FilePoolSource};

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
    // Verify k0/k1 accessors work
    let _ = sip_key.k0();
    let _ = sip_key.k1();
}

#[test]
fn test_end_to_end_key_pair() {
    let (_dir, pool_path) = create_test_pool(1024);
    let source = FilePoolSource::new(&pool_path).unwrap();
    let mut bridge = EntropyBridge::new(source);

    let (mesh, siphash) = bridge
        .derive_mesh_key_pair(Some(b"pair-test"))
        .unwrap();

    assert!(!mesh.is_zero());
    assert!(!siphash.is_zero());
    // Keys derived with different info strings should differ
    assert_ne!(mesh.as_bytes()[..], siphash.as_bytes()[..]);
}

#[test]
fn test_small_pool_fails() {
    let dir = tempdir().unwrap();
    let path = dir.path().join("tiny.bin");
    fs::write(&path, &[0u8; 16]).unwrap(); // only 16 bytes, need 32

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
    assert_eq!(key1, key2, "same entropy + same salt should produce same key");
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
    assert_ne!(key_a, key_b, "different salts should produce different keys");
}
