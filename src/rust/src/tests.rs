//! Integration tests for Kyber-768 implementation

use crate::*;

#[test]
fn test_full_kyber768_cycle() {
    // Generate keypair
    let (pk, sk) = Kyber768::keypair();

    // Encapsulate
    let (ct, ss_enc) = Kyber768::encapsulate(&pk);

    // Decapsulate
    let ss_dec = Kyber768::decapsulate(&ct, &sk);

    // Verify shared secrets match
    assert_eq!(
        ss_enc.data, ss_dec.data,
        "Encapsulation and decapsulation shared secrets must match"
    );
}

#[test]
fn test_multiple_iterations() {
    for _ in 0..10 {
        let (pk, sk) = Kyber768::keypair();
        let (ct, ss1) = Kyber768::encapsulate(&pk);
        let ss2 = Kyber768::decapsulate(&ct, &sk);
        assert_eq!(ss1.data, ss2.data);
    }
}

#[test]
fn test_ciphertext_tampering() {
    let (pk, sk) = Kyber768::keypair();
    let (mut ct, ss1) = Kyber768::encapsulate(&pk);

    // Tamper with ciphertext
    ct.data[0] ^= 1;

    // Decapsulation should still succeed but produce different shared secret
    let ss2 = Kyber768::decapsulate(&ct, &sk);

    // Due to implicit rejection, we should get a different shared secret
    assert_ne!(ss1.data, ss2.data, "Tampered ciphertext should produce different shared secret");
}

#[test]
fn test_key_sizes() {
    let (pk, sk) = Kyber768::keypair();
    assert_eq!(pk.data.len(), KYBER768_PUBLICKEYBYTES);
    assert_eq!(sk.data.len(), KYBER768_SECRETKEYBYTES);
}

#[test]
fn test_ciphertext_size() {
    let (pk, _) = Kyber768::keypair();
    let (ct, _) = Kyber768::encapsulate(&pk);
    assert_eq!(ct.data.len(), KYBER768_CIPHERTEXTBYTES);
}

#[test]
fn test_shared_secret_size() {
    let (pk, _) = Kyber768::keypair();
    let (_, ss) = Kyber768::encapsulate(&pk);
    assert_eq!(ss.data.len(), KYBER768_SHAREDSECRETBYTES);
}
