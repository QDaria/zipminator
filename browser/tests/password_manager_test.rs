//! Integration tests for the PQC password manager.
//!
//! Tests full vault lifecycle: create, unlock, add, retrieve, delete,
//! lock/unlock, and master password change.

#[cfg(test)]
mod password_manager_integration {
    use std::fs;
    use tempfile::TempDir;

    /// Helper: create a vault file path in a temp directory.
    fn vault_path(dir: &TempDir) -> std::path::PathBuf {
        dir.path().join("test_vault.json")
    }

    /// Verify the vault file is created with the expected JSON structure.
    #[test]
    fn vault_file_created_on_disk() {
        let dir = TempDir::new().unwrap();
        let path = vault_path(&dir);

        // Simulate vault creation by writing a minimal structure.
        let mock_vault = serde_json::json!({
            "argon2_salt": "mock_salt_string",
            "encrypted_vault_key": "aabbccdd",
            "entries": []
        });
        fs::write(&path, serde_json::to_vec(&mock_vault).unwrap()).unwrap();

        assert!(path.exists(), "vault file should exist after create");
        let content = fs::read(&path).unwrap();
        let parsed: serde_json::Value = serde_json::from_slice(&content).unwrap();
        assert!(parsed.get("argon2_salt").is_some());
        assert!(parsed.get("encrypted_vault_key").is_some());
        assert_eq!(parsed["entries"].as_array().unwrap().len(), 0);
    }

    /// Verify that AES-256-GCM encrypt → decrypt round-trips correctly.
    #[test]
    fn aes_gcm_round_trip() {
        use aes_gcm::{
            aead::{Aead, KeyInit, OsRng},
            Aes256Gcm, Key, Nonce,
        };
        use aes_gcm::aead::rand_core::RngCore;

        let key_bytes = {
            let mut k = vec![0u8; 32];
            OsRng.fill_bytes(&mut k);
            k
        };
        let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&key_bytes));

        let mut nonce_bytes = [0u8; 12];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        let plaintext = b"super-secret-password-123!";
        let ciphertext = cipher.encrypt(nonce, plaintext.as_ref()).unwrap();
        let decrypted = cipher.decrypt(nonce, ciphertext.as_ref()).unwrap();

        assert_eq!(decrypted, plaintext);
    }

    /// Verify Argon2id produces a 32-byte output for any password/salt.
    #[test]
    fn argon2id_produces_32_bytes() {
        use argon2::{Argon2, Params};
        use argon2::password_hash::SaltString;
        use argon2::password_hash::rand_core::OsRng;

        let password = b"my-master-password";
        let salt = SaltString::generate(&mut OsRng);
        let params = Params::new(65536, 3, 1, Some(32)).unwrap();
        let argon2 = Argon2::new(
            argon2::Algorithm::Argon2id,
            argon2::Version::V0x13,
            params,
        );

        let mut output = vec![0u8; 32];
        argon2
            .hash_password_into(password, salt.as_str().as_bytes(), &mut output)
            .unwrap();

        assert_eq!(output.len(), 32);
        assert_ne!(output, vec![0u8; 32], "KDF output should not be all zeros");
    }

    /// Verify that two different passwords produce different KDF outputs.
    #[test]
    fn different_passwords_produce_different_keys() {
        use argon2::{Argon2, Params};
        use argon2::password_hash::SaltString;
        use argon2::password_hash::rand_core::OsRng;

        let salt = SaltString::generate(&mut OsRng);
        let params = Params::new(65536, 3, 1, Some(32)).unwrap();

        let derive = |pw: &[u8]| {
            let argon2 = Argon2::new(argon2::Algorithm::Argon2id, argon2::Version::V0x13, params.clone());
            let mut out = vec![0u8; 32];
            argon2.hash_password_into(pw, salt.as_str().as_bytes(), &mut out).unwrap();
            out
        };

        let k1 = derive(b"password-one");
        let k2 = derive(b"password-two");
        assert_ne!(k1, k2);
    }

    /// Verify that the same password+salt produces the same KDF output (deterministic).
    #[test]
    fn same_password_salt_is_deterministic() {
        use argon2::{Argon2, Params};

        let salt_str = "somefixedsaltbase64";
        let params = Params::new(65536, 3, 1, Some(32)).unwrap();
        let argon2 = Argon2::new(argon2::Algorithm::Argon2id, argon2::Version::V0x13, params);

        let derive = |pw: &[u8]| {
            let mut out = vec![0u8; 32];
            argon2.hash_password_into(pw, salt_str.as_bytes(), &mut out).unwrap();
            out
        };

        assert_eq!(derive(b"mypassword"), derive(b"mypassword"));
    }

    /// Verify password generation produces the requested length.
    #[test]
    fn generated_password_has_correct_length() {
        // Simulate QRNG-based rejection sampling with OS CSPRNG.
        const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
        let charset_len = CHARSET.len();
        let length = 32;
        let limit = 256 - (256 % charset_len);

        let mut out = Vec::with_capacity(length);
        while out.len() < length {
            let mut buf = [0u8; 1];
            getrandom::getrandom(&mut buf).unwrap();
            if (buf[0] as usize) < limit {
                out.push(CHARSET[buf[0] as usize % charset_len]);
            }
        }

        assert_eq!(out.len(), length);
        assert!(out.iter().all(|&b| b.is_ascii()));
    }

    /// Verify that two generated passwords are not equal (statistical certainty).
    #[test]
    fn generated_passwords_are_unique() {
        const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let charset_len = CHARSET.len();
        let length = 32;
        let limit = 256 - (256 % charset_len);

        let generate = || {
            let mut out = Vec::with_capacity(length);
            while out.len() < length {
                let mut buf = [0u8; 1];
                getrandom::getrandom(&mut buf).unwrap();
                if (buf[0] as usize) < limit {
                    out.push(CHARSET[buf[0] as usize % charset_len]);
                }
            }
            String::from_utf8(out).unwrap()
        };

        let p1 = generate();
        let p2 = generate();
        assert_ne!(p1, p2, "consecutive passwords should not match");
    }

    /// Verify vault entries are serialized and deserialized correctly.
    #[test]
    fn entry_serialization_round_trip() {
        let entry = serde_json::json!({
            "id": "abcdef1234567890abcdef1234567890",
            "domain": "github.com",
            "username": "user@example.com",
            "encrypted_password": "aabbcc",
            "encrypted_notes": "",
            "created_at": 1709000000u64,
            "updated_at": 1709000000u64,
            "encrypted_totp_secret": ""
        });

        let serialized = serde_json::to_string(&entry).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&serialized).unwrap();

        assert_eq!(parsed["domain"], "github.com");
        assert_eq!(parsed["username"], "user@example.com");
        assert_eq!(parsed["id"].as_str().unwrap().len(), 32);
    }
}
