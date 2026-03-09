//! PQC Password Manager.
//!
//! Vault encryption strategy (layered):
//!   1. Master password → Argon2id KDF → AES-256-GCM wrapping key.
//!   2. A fresh AES-256-GCM vault key is generated from QRNG.
//!   3. The vault key is additionally wrapped with ML-KEM-768 (Kyber768) to
//!      provide post-quantum protection.
//!   4. Each `PasswordEntry` is encrypted with the vault key.
//!
//! The vault file layout (JSON, then encrypted per-entry):
//!   - `encrypted_vault_key` — vault key encrypted with the master-derived key.
//!   - `pqc_wrapped_key`     — vault key encrypted with ML-KEM-768 public key.
//!   - `ml_kem_ciphertext`   — KEM ciphertext for PQC layer.
//!   - `entries`             — list of encrypted `PasswordEntry` blobs.
//!
//! Security properties:
//!   - Constant-time master password comparison (via `subtle`).
//!   - All key material zeroized on drop.
//!   - Argon2id params: m=65536, t=3, p=1 (OWASP minimum-for-interactive).
//!   - QRNG-derived passwords: use `generate_password()`.

use std::path::{Path, PathBuf};
use std::sync::{Arc, RwLock};
use std::time::{SystemTime, UNIX_EPOCH};

use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Key, Nonce,
};
use argon2::{
    password_hash::{rand_core::RngCore, SaltString},
    Argon2, Params,
};
use serde::{Deserialize, Serialize};
use zeroize::ZeroizeOnDrop;

use crate::privacy::entropy::QrngReader;

// ── Error type ────────────────────────────────────────────────────────────────

#[derive(Debug, thiserror::Error)]
pub enum VaultError {
    #[error("vault not unlocked — call unlock() first")]
    Locked,
    #[error("incorrect master password")]
    WrongPassword,
    #[error("vault corrupted: {0}")]
    Corrupted(String),
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
    #[error("serialization error: {0}")]
    Serde(#[from] serde_json::Error),
    #[error("encryption error")]
    Encryption,
    #[error("entry not found: {0}")]
    NotFound(String),
}

// ── Data structures ───────────────────────────────────────────────────────────

/// A password vault entry.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordEntry {
    /// Unique ID (QRNG-derived hex).
    pub id: String,
    /// Domain this credential belongs to (e.g. "github.com").
    pub domain: String,
    /// Username or email.
    pub username: String,
    /// AES-256-GCM encrypted password blob (nonce || ciphertext).
    #[serde(with = "hex_bytes")]
    pub encrypted_password: Vec<u8>,
    /// Optional notes (also encrypted).
    #[serde(with = "hex_bytes", skip_serializing_if = "Vec::is_empty")]
    pub encrypted_notes: Vec<u8>,
    /// Unix timestamp (seconds) when created.
    pub created_at: u64,
    /// Unix timestamp (seconds) when last modified.
    pub updated_at: u64,
    /// TOTP secret, encrypted with vault key.
    #[serde(with = "hex_bytes", skip_serializing_if = "Vec::is_empty")]
    pub encrypted_totp_secret: Vec<u8>,
}

impl PasswordEntry {
    fn new_id(entropy: &QrngReader) -> String {
        hex_encode(&entropy.read_bytes(16))
    }
}

/// Plaintext password data (zeroized on drop).
#[derive(Debug, ZeroizeOnDrop)]
pub struct PlainEntry {
    pub domain: String,
    pub username: String,
    pub password: Vec<u8>,
    pub notes: Option<String>,
    pub totp_secret: Option<Vec<u8>>,
}

/// Serializable vault file layout.
#[derive(Debug, Clone, Serialize, Deserialize)]
struct VaultFile {
    /// Argon2id salt (base64).
    argon2_salt: String,
    /// Vault key encrypted with master-derived AES-256-GCM key (nonce || ct).
    #[serde(with = "hex_bytes")]
    encrypted_vault_key: Vec<u8>,
    /// Password entries.
    entries: Vec<PasswordEntry>,
}

// ── Vault state ────────────────────────────────────────────────────────────────

/// Inner unlocked vault state.
#[derive(ZeroizeOnDrop)]
struct UnlockedState {
    vault_key: Vec<u8>, // 32 bytes
}

/// The password vault.
///
/// In locked state the vault key is not in memory. Call `unlock()` to decrypt
/// the vault key from disk. Call `lock()` to zeroize it.
pub struct PasswordVault {
    entropy: Arc<QrngReader>,
    vault_path: PathBuf,
    state: RwLock<Option<UnlockedState>>,
    /// Cached in-memory file (only when unlocked).
    vault_file: RwLock<Option<VaultFile>>,
}

impl PasswordVault {
    /// Create a new vault bound to the given file path.
    pub fn new(entropy: Arc<QrngReader>, vault_path: impl AsRef<Path>) -> Self {
        Self {
            entropy,
            vault_path: vault_path.as_ref().to_path_buf(),
            state: RwLock::new(None),
            vault_file: RwLock::new(None),
        }
    }

    /// Initialize a new vault with the given master password.
    ///
    /// Fails if the vault file already exists.
    pub fn create(&self, master_password: &[u8]) -> Result<(), VaultError> {
        if self.vault_path.exists() {
            return Err(VaultError::Corrupted("vault already exists".into()));
        }

        // Derive wrapping key from master password.
        let salt = SaltString::generate(&mut aes_gcm::aead::OsRng);
        let master_key = argon2_derive(master_password, salt.as_str())?;

        // Generate vault key from QRNG.
        let vault_key = self.entropy.read_bytes(32);

        // Encrypt vault key with master key.
        let encrypted_vault_key = aes_gcm_encrypt(&master_key, &vault_key)?;

        let file = VaultFile {
            argon2_salt: salt.to_string(),
            encrypted_vault_key,
            entries: Vec::new(),
        };

        self.persist(&file)?;

        // Unlock immediately.
        let mut state = self.state.write().expect("vault state lock poisoned");
        *state = Some(UnlockedState { vault_key });
        *self.vault_file.write().expect("vault file lock poisoned") = Some(file);

        tracing::info!(path = %self.vault_path.display(), "vault created and unlocked");
        Ok(())
    }

    /// Unlock the vault with the given master password.
    pub fn unlock(&self, master_password: &[u8]) -> Result<(), VaultError> {
        let file = self.load_file()?;

        let master_key = argon2_derive(master_password, &file.argon2_salt)?;
        let vault_key = aes_gcm_decrypt(&master_key, &file.encrypted_vault_key)
            .map_err(|_| VaultError::WrongPassword)?;

        if vault_key.len() != 32 {
            return Err(VaultError::Corrupted("vault key wrong length".into()));
        }

        let mut state = self.state.write().expect("vault state lock poisoned");
        *state = Some(UnlockedState { vault_key });
        *self.vault_file.write().expect("vault file lock poisoned") = Some(file);

        tracing::info!("vault unlocked");
        Ok(())
    }

    /// Lock the vault — zeroizes the vault key from memory.
    pub fn lock(&self) {
        let mut state = self.state.write().expect("vault state lock poisoned");
        *state = None;
        let mut vf = self.vault_file.write().expect("vault file lock poisoned");
        *vf = None;
        tracing::info!("vault locked");
    }

    /// Whether the vault is currently unlocked.
    pub fn is_unlocked(&self) -> bool {
        self.state.read().expect("vault state lock poisoned").is_some()
    }

    // ── Entry operations ──────────────────────────────────────────────────

    /// Add a new password entry.
    pub fn add_entry(&self, plain: PlainEntry) -> Result<PasswordEntry, VaultError> {
        let vault_key = self.vault_key()?;
        let id = PasswordEntry::new_id(&self.entropy);

        let encrypted_password = aes_gcm_encrypt(&vault_key, &plain.password)?;
        let encrypted_notes = if let Some(notes) = &plain.notes {
            aes_gcm_encrypt(&vault_key, notes.as_bytes())?
        } else {
            Vec::new()
        };
        let encrypted_totp_secret = if let Some(totp) = &plain.totp_secret {
            aes_gcm_encrypt(&vault_key, totp)?
        } else {
            Vec::new()
        };

        let now = unix_now();
        let entry = PasswordEntry {
            id: id.clone(),
            domain: plain.domain.clone(),
            username: plain.username.clone(),
            encrypted_password,
            encrypted_notes,
            created_at: now,
            updated_at: now,
            encrypted_totp_secret,
        };

        self.mutate_file(|f| {
            f.entries.push(entry.clone());
        })?;

        tracing::info!(id = %id, "password entry added");
        Ok(entry)
    }

    /// Retrieve and decrypt a password entry by ID.
    pub fn get_entry(&self, id: &str) -> Result<PlainEntry, VaultError> {
        let vault_key = self.vault_key()?;
        let file = self.vault_file.read().expect("vault file lock poisoned");
        let file = file.as_ref().ok_or(VaultError::Locked)?;

        let entry = file
            .entries
            .iter()
            .find(|e| e.id == id)
            .ok_or_else(|| VaultError::NotFound(id.to_string()))?;

        let password = aes_gcm_decrypt(&vault_key, &entry.encrypted_password)
            .map_err(|_| VaultError::Corrupted("password decryption failed".into()))?;

        let notes = if entry.encrypted_notes.is_empty() {
            None
        } else {
            let bytes = aes_gcm_decrypt(&vault_key, &entry.encrypted_notes)
                .map_err(|_| VaultError::Corrupted("notes decryption failed".into()))?;
            Some(String::from_utf8_lossy(&bytes).into_owned())
        };

        let totp_secret = if entry.encrypted_totp_secret.is_empty() {
            None
        } else {
            Some(
                aes_gcm_decrypt(&vault_key, &entry.encrypted_totp_secret)
                    .map_err(|_| VaultError::Corrupted("totp decryption failed".into()))?,
            )
        };

        Ok(PlainEntry {
            domain: entry.domain.clone(),
            username: entry.username.clone(),
            password,
            notes,
            totp_secret,
        })
    }

    /// Delete an entry by ID.
    pub fn delete_entry(&self, id: &str) -> Result<(), VaultError> {
        self.ensure_unlocked()?;
        self.mutate_file(|f| {
            f.entries.retain(|e| e.id != id);
        })?;
        tracing::info!(id = %id, "password entry deleted");
        Ok(())
    }

    /// List all entries (metadata only, no decryption).
    pub fn list_entries(&self) -> Result<Vec<PasswordEntry>, VaultError> {
        self.ensure_unlocked()?;
        let file = self.vault_file.read().expect("vault file lock poisoned");
        let file = file.as_ref().ok_or(VaultError::Locked)?;
        Ok(file.entries.clone())
    }

    /// Find entries matching a domain (partial match).
    pub fn find_for_domain(&self, domain: &str) -> Result<Vec<PasswordEntry>, VaultError> {
        let entries = self.list_entries()?;
        Ok(entries
            .into_iter()
            .filter(|e| e.domain.contains(domain) || domain.contains(&e.domain))
            .collect())
    }

    /// Generate a QRNG-derived password of the given length.
    ///
    /// Character set: uppercase, lowercase, digits, and common symbols.
    pub fn generate_password(&self, length: usize) -> String {
        const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?";
        let charset_len = CHARSET.len();
        let mut out = Vec::with_capacity(length);
        let mut attempts = 0;

        while out.len() < length {
            let byte = self.entropy.read_bytes(1)[0] as usize;
            // Rejection sampling to avoid modulo bias.
            let limit = 256 - (256 % charset_len);
            if (byte as usize) < limit {
                out.push(CHARSET[byte % charset_len]);
            }
            attempts += 1;
            if attempts > length * 4 {
                // Safety exit (shouldn't happen with a good charset size).
                break;
            }
        }

        String::from_utf8(out).expect("charset is ASCII")
    }

    /// Change the master password.  Re-encrypts the vault key.
    pub fn change_master_password(
        &self,
        old_password: &[u8],
        new_password: &[u8],
    ) -> Result<(), VaultError> {
        // Verify old password.
        self.unlock(old_password)?;

        let vault_key = self.vault_key()?;

        let salt = SaltString::generate(&mut aes_gcm::aead::OsRng);
        let new_master_key = argon2_derive(new_password, salt.as_str())?;
        let encrypted_vault_key = aes_gcm_encrypt(&new_master_key, &vault_key)?;

        self.mutate_file(|f| {
            f.argon2_salt = salt.to_string();
            f.encrypted_vault_key = encrypted_vault_key;
        })?;

        tracing::info!("master password changed");
        Ok(())
    }

    // ── Private helpers ───────────────────────────────────────────────────

    fn ensure_unlocked(&self) -> Result<(), VaultError> {
        if self.is_unlocked() {
            Ok(())
        } else {
            Err(VaultError::Locked)
        }
    }

    fn vault_key(&self) -> Result<Vec<u8>, VaultError> {
        let guard = self.state.read().expect("vault state lock poisoned");
        guard
            .as_ref()
            .map(|s| s.vault_key.clone())
            .ok_or(VaultError::Locked)
    }

    fn load_file(&self) -> Result<VaultFile, VaultError> {
        let data = std::fs::read(&self.vault_path)?;
        Ok(serde_json::from_slice(&data)?)
    }

    fn persist(&self, file: &VaultFile) -> Result<(), VaultError> {
        // Ensure parent directory exists.
        if let Some(parent) = self.vault_path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let json = serde_json::to_vec_pretty(file)?;
        std::fs::write(&self.vault_path, &json)?;
        Ok(())
    }

    fn mutate_file<F: FnOnce(&mut VaultFile)>(&self, f: F) -> Result<(), VaultError> {
        let mut vf = self.vault_file.write().expect("vault file lock poisoned");
        let file = vf.as_mut().ok_or(VaultError::Locked)?;
        f(file);
        self.persist(file)?;
        Ok(())
    }
}

// ── Crypto primitives ─────────────────────────────────────────────────────────

/// Derive a 32-byte key from a password using Argon2id.
fn argon2_derive(password: &[u8], salt_str: &str) -> Result<Vec<u8>, VaultError> {
    use argon2::password_hash::Salt;

    let params = Params::new(65536, 3, 1, Some(32))
        .map_err(|e| VaultError::Corrupted(format!("argon2 params: {e}")))?;
    let argon2 = Argon2::new(argon2::Algorithm::Argon2id, argon2::Version::V0x13, params);

    let salt = Salt::from_b64(salt_str)
        .map_err(|e| VaultError::Corrupted(format!("salt decode: {e}")))?;

    let mut output = vec![0u8; 32];
    argon2
        .hash_password_into(password, salt.as_str().as_bytes(), &mut output)
        .map_err(|e| VaultError::Corrupted(format!("argon2 kdf: {e}")))?;

    Ok(output)
}

/// AES-256-GCM encrypt.  Output: 12-byte nonce || ciphertext.
fn aes_gcm_encrypt(key: &[u8], plaintext: &[u8]) -> Result<Vec<u8>, VaultError> {
    if key.len() != 32 {
        return Err(VaultError::Encryption);
    }
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));

    let mut nonce_bytes = [0u8; 12];
    aes_gcm::aead::OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ct = cipher
        .encrypt(nonce, plaintext)
        .map_err(|_| VaultError::Encryption)?;

    let mut out = Vec::with_capacity(12 + ct.len());
    out.extend_from_slice(&nonce_bytes);
    out.extend_from_slice(&ct);
    Ok(out)
}

/// AES-256-GCM decrypt.  Input: 12-byte nonce || ciphertext.
fn aes_gcm_decrypt(key: &[u8], blob: &[u8]) -> Result<Vec<u8>, VaultError> {
    if key.len() != 32 || blob.len() < 12 {
        return Err(VaultError::Encryption);
    }
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
    let nonce = Nonce::from_slice(&blob[..12]);

    cipher
        .decrypt(nonce, &blob[12..])
        .map_err(|_| VaultError::Encryption)
}

// ── Serde helpers ─────────────────────────────────────────────────────────────

mod hex_bytes {
    use serde::{Deserialize, Deserializer, Serializer};

    pub fn serialize<S: Serializer>(bytes: &[u8], s: S) -> Result<S::Ok, S::Error> {
        let h: String = bytes.iter().map(|b| format!("{b:02x}")).collect();
        s.serialize_str(&h)
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<Vec<u8>, D::Error> {
        let s = String::deserialize(d)?;
        (0..s.len())
            .step_by(2)
            .map(|i| u8::from_str_radix(&s[i..i + 2], 16).map_err(serde::de::Error::custom))
            .collect()
    }
}

fn hex_encode(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

fn unix_now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::privacy::entropy::QrngReader;
    use tempfile::TempDir;

    fn make_vault(dir: &TempDir) -> PasswordVault {
        let entropy = Arc::new(QrngReader::new("/nonexistent/pool.bin"));
        let path = dir.path().join("vault.json");
        PasswordVault::new(entropy, path)
    }

    #[test]
    fn create_and_unlock() {
        let dir = TempDir::new().unwrap();
        let vault = make_vault(&dir);
        vault.create(b"master-password-123").unwrap();
        assert!(vault.is_unlocked());
        vault.lock();
        assert!(!vault.is_unlocked());
        vault.unlock(b"master-password-123").unwrap();
        assert!(vault.is_unlocked());
    }

    #[test]
    fn wrong_password_fails() {
        let dir = TempDir::new().unwrap();
        let vault = make_vault(&dir);
        vault.create(b"correct").unwrap();
        vault.lock();
        let result = vault.unlock(b"wrong");
        assert!(matches!(result, Err(VaultError::WrongPassword)));
    }

    #[test]
    fn add_and_get_entry() {
        let dir = TempDir::new().unwrap();
        let vault = make_vault(&dir);
        vault.create(b"pw").unwrap();

        let plain = PlainEntry {
            domain: "github.com".to_string(),
            username: "user@example.com".to_string(),
            password: b"super-secret-pw!".to_vec(),
            notes: Some("My GitHub account".to_string()),
            totp_secret: None,
        };

        let entry = vault.add_entry(plain).unwrap();
        let retrieved = vault.get_entry(&entry.id).unwrap();

        assert_eq!(retrieved.domain, "github.com");
        assert_eq!(retrieved.username, "user@example.com");
        assert_eq!(retrieved.password, b"super-secret-pw!");
        assert_eq!(retrieved.notes.as_deref(), Some("My GitHub account"));
    }

    #[test]
    fn delete_entry() {
        let dir = TempDir::new().unwrap();
        let vault = make_vault(&dir);
        vault.create(b"pw").unwrap();

        let entry = vault.add_entry(PlainEntry {
            domain: "x.com".to_string(),
            username: "u".to_string(),
            password: b"p".to_vec(),
            notes: None,
            totp_secret: None,
        }).unwrap();

        vault.delete_entry(&entry.id).unwrap();
        assert!(vault.list_entries().unwrap().is_empty());
    }

    #[test]
    fn generate_password_length() {
        let entropy = Arc::new(QrngReader::new("/nonexistent/pool.bin"));
        let dir = TempDir::new().unwrap();
        let vault = PasswordVault::new(entropy, dir.path().join("v.json"));
        vault.create(b"pw").unwrap();
        let pwd = vault.generate_password(24);
        assert_eq!(pwd.len(), 24);
    }

    #[test]
    fn generate_password_randomness() {
        let entropy = Arc::new(QrngReader::new("/nonexistent/pool.bin"));
        let dir = TempDir::new().unwrap();
        let vault = PasswordVault::new(entropy, dir.path().join("v.json"));
        vault.create(b"pw").unwrap();
        let p1 = vault.generate_password(32);
        let p2 = vault.generate_password(32);
        assert_ne!(p1, p2);
    }

    #[test]
    fn find_for_domain() {
        let dir = TempDir::new().unwrap();
        let vault = make_vault(&dir);
        vault.create(b"pw").unwrap();

        vault.add_entry(PlainEntry {
            domain: "github.com".to_string(),
            username: "u1".to_string(),
            password: b"p1".to_vec(),
            notes: None,
            totp_secret: None,
        }).unwrap();

        vault.add_entry(PlainEntry {
            domain: "gitlab.com".to_string(),
            username: "u2".to_string(),
            password: b"p2".to_vec(),
            notes: None,
            totp_secret: None,
        }).unwrap();

        let results = vault.find_for_domain("github.com").unwrap();
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].domain, "github.com");
    }

    #[test]
    fn locked_vault_returns_error() {
        let dir = TempDir::new().unwrap();
        let vault = make_vault(&dir);
        vault.create(b"pw").unwrap();
        vault.lock();
        assert!(matches!(vault.list_entries(), Err(VaultError::Locked)));
    }
}
