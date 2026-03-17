//! Persistent message storage for the PQC Messenger pillar.
//!
//! Provides a [`MessageStore`] trait with two implementations:
//! - [`InMemoryMessageStore`] -- HashMap-backed, for testing and ephemeral use.
//! - [`FileMessageStore`] -- JSON file encrypted with AES-256-GCM (requires `config` feature).

use std::collections::HashMap;
use crate::ratchet::RatchetError;

/// A stored encrypted message.
#[derive(Debug, Clone)]
#[cfg_attr(feature = "config", derive(serde::Serialize, serde::Deserialize))]
pub struct EncryptedMessage {
    pub id: String,
    pub conversation_id: String,
    pub sender: String,
    pub ciphertext: Vec<u8>,
    pub nonce: Vec<u8>,
    pub timestamp: u64,
    pub sequence: u32,
}

/// Persistence layer for encrypted messages.
pub trait MessageStore {
    fn store_message(&mut self, msg: EncryptedMessage) -> Result<String, RatchetError>;
    fn get_message(&self, message_id: &str) -> Result<Option<EncryptedMessage>, RatchetError>;
    fn get_conversation(&self, conversation_id: &str) -> Result<Vec<EncryptedMessage>, RatchetError>;
    fn delete_message(&mut self, message_id: &str) -> Result<bool, RatchetError>;
    fn delete_conversation(&mut self, conversation_id: &str) -> Result<usize, RatchetError>;
}

/// HashMap-backed message store (no persistence, suitable for tests).
#[derive(Debug, Default)]
pub struct InMemoryMessageStore {
    messages: HashMap<String, EncryptedMessage>,
}

impl InMemoryMessageStore {
    pub fn new() -> Self { Self::default() }
}

impl MessageStore for InMemoryMessageStore {
    fn store_message(&mut self, msg: EncryptedMessage) -> Result<String, RatchetError> {
        let id = msg.id.clone();
        self.messages.insert(id.clone(), msg);
        Ok(id)
    }
    fn get_message(&self, message_id: &str) -> Result<Option<EncryptedMessage>, RatchetError> {
        Ok(self.messages.get(message_id).cloned())
    }
    fn get_conversation(&self, conversation_id: &str) -> Result<Vec<EncryptedMessage>, RatchetError> {
        let mut msgs: Vec<_> = self.messages.values()
            .filter(|m| m.conversation_id == conversation_id)
            .cloned().collect();
        msgs.sort_by_key(|m| m.sequence);
        Ok(msgs)
    }
    fn delete_message(&mut self, message_id: &str) -> Result<bool, RatchetError> {
        Ok(self.messages.remove(message_id).is_some())
    }
    fn delete_conversation(&mut self, conversation_id: &str) -> Result<usize, RatchetError> {
        let ids: Vec<String> = self.messages.values()
            .filter(|m| m.conversation_id == conversation_id)
            .map(|m| m.id.clone()).collect();
        let count = ids.len();
        for id in ids { self.messages.remove(&id); }
        Ok(count)
    }
}

// ── FileMessageStore (requires `config` feature for serde) ──────────────────

#[cfg(feature = "config")]
mod file_store {
    use super::*;
    use aes_gcm::aead::{Aead, KeyInit};
    use aes_gcm::{Aes256Gcm, Key, Nonce};
    use getrandom::getrandom;
    use std::path::PathBuf;

    /// File-backed message store encrypted with AES-256-GCM.
    pub struct FileMessageStore {
        path: PathBuf,
        storage_key: [u8; 32],
        inner: InMemoryMessageStore,
    }

    impl FileMessageStore {
        /// Open or create an encrypted store file.
        pub fn open(path: PathBuf, storage_key: [u8; 32]) -> Result<Self, RatchetError> {
            let inner = if path.exists() {
                let encrypted = std::fs::read(&path)
                    .map_err(|_| RatchetError::Other("failed to read store file"))?;
                let plaintext = Self::decrypt_blob(&storage_key, &encrypted)?;
                let messages: HashMap<String, EncryptedMessage> =
                    serde_json::from_slice(&plaintext)
                        .map_err(|_| RatchetError::Other("corrupt store JSON"))?;
                InMemoryMessageStore { messages }
            } else {
                InMemoryMessageStore::new()
            };
            Ok(Self { path, storage_key, inner })
        }

        /// Encrypt and write the store to disk.
        pub fn flush(&self) -> Result<(), RatchetError> {
            let json = serde_json::to_vec(&self.inner.messages)
                .map_err(|_| RatchetError::Other("JSON serialization failed"))?;
            let encrypted = Self::encrypt_blob(&self.storage_key, &json)?;
            std::fs::write(&self.path, &encrypted)
                .map_err(|_| RatchetError::Other("failed to write store file"))?;
            Ok(())
        }

        fn encrypt_blob(key: &[u8; 32], plaintext: &[u8]) -> Result<Vec<u8>, RatchetError> {
            let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
            let mut nonce_bytes = [0u8; 12];
            getrandom(&mut nonce_bytes)
                .map_err(|_| RatchetError::CryptoError("nonce generation failed"))?;
            let ct = cipher.encrypt(Nonce::from_slice(&nonce_bytes), plaintext.as_ref())
                .map_err(|_| RatchetError::CryptoError("store encryption failed"))?;
            let mut out = Vec::with_capacity(12 + ct.len());
            out.extend_from_slice(&nonce_bytes);
            out.extend_from_slice(&ct);
            Ok(out)
        }

        fn decrypt_blob(key: &[u8; 32], data: &[u8]) -> Result<Vec<u8>, RatchetError> {
            if data.len() < 12 {
                return Err(RatchetError::CryptoError("store file too short"));
            }
            let (nonce_bytes, ct) = data.split_at(12);
            let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
            cipher.decrypt(Nonce::from_slice(nonce_bytes), ct)
                .map_err(|_| RatchetError::CryptoError("store decryption failed"))
        }
    }

    impl MessageStore for FileMessageStore {
        fn store_message(&mut self, msg: EncryptedMessage) -> Result<String, RatchetError> {
            let id = self.inner.store_message(msg)?;
            self.flush()?;
            Ok(id)
        }
        fn get_message(&self, id: &str) -> Result<Option<EncryptedMessage>, RatchetError> {
            self.inner.get_message(id)
        }
        fn get_conversation(&self, cid: &str) -> Result<Vec<EncryptedMessage>, RatchetError> {
            self.inner.get_conversation(cid)
        }
        fn delete_message(&mut self, id: &str) -> Result<bool, RatchetError> {
            let d = self.inner.delete_message(id)?;
            if d { self.flush()?; }
            Ok(d)
        }
        fn delete_conversation(&mut self, cid: &str) -> Result<usize, RatchetError> {
            let n = self.inner.delete_conversation(cid)?;
            if n > 0 { self.flush()?; }
            Ok(n)
        }
    }
}

#[cfg(feature = "config")]
pub use file_store::FileMessageStore;

// ── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    fn msg(id: &str, conv: &str, seq: u32) -> EncryptedMessage {
        EncryptedMessage {
            id: id.into(), conversation_id: conv.into(), sender: "alice".into(),
            ciphertext: vec![0xAA; 48], nonce: vec![0xBB; 12],
            timestamp: 1710000000 + seq as u64, sequence: seq,
        }
    }

    #[test]
    fn store_and_retrieve_message() {
        let mut s = InMemoryMessageStore::new();
        let m = msg("m1", "c", 0);
        s.store_message(m.clone()).unwrap();
        let r = s.get_message("m1").unwrap().unwrap();
        assert_eq!(r.id, "m1");
        assert_eq!(r.ciphertext, m.ciphertext);
    }

    #[test]
    fn list_conversation_ordered() {
        let mut s = InMemoryMessageStore::new();
        s.store_message(msg("m3", "c", 2)).unwrap();
        s.store_message(msg("m1", "c", 0)).unwrap();
        s.store_message(msg("m2", "c", 1)).unwrap();
        s.store_message(msg("x", "other", 0)).unwrap();
        let v = s.get_conversation("c").unwrap();
        assert_eq!(v.len(), 3);
        assert_eq!((v[0].sequence, v[1].sequence, v[2].sequence), (0, 1, 2));
    }

    #[test]
    fn delete_single_message() {
        let mut s = InMemoryMessageStore::new();
        s.store_message(msg("m1", "c", 0)).unwrap();
        assert!(s.delete_message("m1").unwrap());
        assert!(!s.delete_message("m1").unwrap());
        assert!(s.get_message("m1").unwrap().is_none());
    }

    #[test]
    fn delete_conversation() {
        let mut s = InMemoryMessageStore::new();
        s.store_message(msg("m1", "c", 0)).unwrap();
        s.store_message(msg("m2", "c", 1)).unwrap();
        s.store_message(msg("m3", "other", 0)).unwrap();
        assert_eq!(s.delete_conversation("c").unwrap(), 2);
        assert!(s.get_conversation("c").unwrap().is_empty());
        assert_eq!(s.get_conversation("other").unwrap().len(), 1);
    }

    #[test]
    fn get_nonexistent_message_returns_none() {
        let s = InMemoryMessageStore::new();
        assert!(s.get_message("x").unwrap().is_none());
    }

    #[test]
    fn empty_conversation_returns_empty_vec() {
        let s = InMemoryMessageStore::new();
        assert!(s.get_conversation("x").unwrap().is_empty());
    }
}

#[cfg(all(test, feature = "config"))]
mod file_tests {
    use super::*;

    fn msg(id: &str, conv: &str, seq: u32) -> EncryptedMessage {
        EncryptedMessage {
            id: id.into(), conversation_id: conv.into(), sender: "bob".into(),
            ciphertext: vec![0xCC; 32], nonce: vec![0xDD; 12],
            timestamp: 1710000000 + seq as u64, sequence: seq,
        }
    }

    #[test]
    fn file_store_write_and_read_back() {
        let dir = std::env::temp_dir().join("zipminator_test_store");
        let _ = std::fs::create_dir_all(&dir);
        let path = dir.join("test_store.enc");
        let _ = std::fs::remove_file(&path);
        let key = [0x42u8; 32];
        {
            let mut s = FileMessageStore::open(path.clone(), key).unwrap();
            s.store_message(msg("f1", "cx", 0)).unwrap();
            s.store_message(msg("f2", "cx", 1)).unwrap();
        }
        {
            let s = FileMessageStore::open(path.clone(), key).unwrap();
            let v = s.get_conversation("cx").unwrap();
            assert_eq!(v.len(), 2);
            assert_eq!(v[0].id, "f1");
            assert_eq!(v[1].id, "f2");
        }
        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn file_store_wrong_key_fails() {
        let dir = std::env::temp_dir().join("zipminator_test_store");
        let _ = std::fs::create_dir_all(&dir);
        let path = dir.join("test_wrongkey.enc");
        let _ = std::fs::remove_file(&path);
        {
            let mut s = FileMessageStore::open(path.clone(), [0x01; 32]).unwrap();
            s.store_message(msg("f1", "cx", 0)).unwrap();
        }
        assert!(FileMessageStore::open(path.clone(), [0x02; 32]).is_err());
        let _ = std::fs::remove_file(&path);
    }
}
