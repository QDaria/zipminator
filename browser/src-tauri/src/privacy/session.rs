//! QRNG-seeded session token generation.
//!
//! Session tokens are 256-bit quantum-random values encoded as base64url
//! (no padding). They are used exclusively for internal browser state
//! management and are never transmitted to visited websites.
//!
//! A new token is generated:
//!   - On each browser launch.
//!   - When the user explicitly clears their session (Cmd+Shift+Delete).
//!   - When `rotate()` is called programmatically.

use std::sync::{Arc, RwLock};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use zeroize::ZeroizeOnDrop;

use crate::privacy::entropy::QrngReader;

/// A 256-bit session token, base64url-encoded (no padding).
///
/// The inner `Vec<u8>` holds the raw 32 bytes; the string form is produced
/// lazily on demand.  The raw bytes are zeroed on drop.
#[derive(Debug, Clone, ZeroizeOnDrop)]
pub struct SessionToken {
    #[zeroize(skip)] // base64 string is derived; raw bytes are zeroed below
    encoded: String,
    raw: Vec<u8>,
}

impl SessionToken {
    fn from_raw(raw: Vec<u8>) -> Self {
        use base64::Engine as _;
        let encoded = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(&raw);
        Self { encoded, raw }
    }

    /// The base64url-encoded token string (43 characters, no padding).
    pub fn as_str(&self) -> &str {
        &self.encoded
    }

    /// The raw 32 bytes.
    pub fn raw_bytes(&self) -> &[u8] {
        &self.raw
    }
}

impl std::fmt::Display for SessionToken {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.encoded)
    }
}

// Do not implement Eq/PartialEq on SessionToken to avoid accidental
// non-constant-time comparisons.  If comparison is needed, use subtle::ConstantTimeEq.

/// Metadata about the current session.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionInfo {
    /// The session token (base64url).
    pub token: String,
    /// Unix timestamp (seconds) when the session started.
    pub started_at: u64,
    /// Number of times the token has been rotated this process lifetime.
    pub rotation_count: u64,
}

/// Thread-safe session token manager.
///
/// Hold one `Arc<SessionManager>` in Tauri's managed state.
#[derive(Debug)]
pub struct SessionManager {
    entropy: Arc<QrngReader>,
    current: RwLock<(SessionToken, u64 /* started_at */)>,
    rotation_count: std::sync::atomic::AtomicU64,
}

impl SessionManager {
    /// Create a new manager and generate the initial session token.
    pub fn new(entropy: Arc<QrngReader>) -> Self {
        let token = Self::generate_token(&entropy);
        let started_at = unix_now();

        Self {
            entropy,
            current: RwLock::new((token, started_at)),
            rotation_count: std::sync::atomic::AtomicU64::new(0),
        }
    }

    /// Return a clone of the current session token string.
    pub fn current_token(&self) -> String {
        self.current
            .read()
            .expect("session lock poisoned")
            .0
            .as_str()
            .to_string()
    }

    /// Return session metadata (token string, start time, rotation count).
    pub fn session_info(&self) -> SessionInfo {
        let guard = self.current.read().expect("session lock poisoned");
        SessionInfo {
            token: guard.0.as_str().to_string(),
            started_at: guard.1,
            rotation_count: self.rotation_count.load(std::sync::atomic::Ordering::Relaxed),
        }
    }

    /// Generate a new session token, replacing the current one.
    ///
    /// Call this when the user clears their session or on a scheduled rotation.
    pub fn rotate(&self) -> SessionInfo {
        let new_token = Self::generate_token(&self.entropy);
        let started_at = unix_now();

        {
            let mut guard = self.current.write().expect("session lock poisoned");
            *guard = (new_token, started_at);
        }

        self.rotation_count
            .fetch_add(1, std::sync::atomic::Ordering::Relaxed);

        tracing::info!("session token rotated");
        self.session_info()
    }

    // ── Private ────────────────────────────────────────────────────────────

    fn generate_token(entropy: &QrngReader) -> SessionToken {
        // 256 bits = 32 bytes of quantum randomness.
        let raw = entropy.read_bytes(32);
        SessionToken::from_raw(raw)
    }
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
    use std::io::Write;
    use tempfile::NamedTempFile;

    fn make_reader() -> Arc<QrngReader> {
        let mut f = NamedTempFile::new().unwrap();
        f.write_all(&vec![0xAB_u8; 4096]).unwrap();
        f.flush().unwrap();
        // Keep the file alive for the duration of the test.
        let path = f.path().to_path_buf();
        std::mem::forget(f); // Leak so the file survives.
        Arc::new(QrngReader::new(path))
    }

    #[test]
    fn token_is_43_chars() {
        let mgr = SessionManager::new(make_reader());
        let tok = mgr.current_token();
        // base64url of 32 bytes with no padding = 43 characters.
        assert_eq!(tok.len(), 43, "token should be 43 chars: {tok}");
    }

    #[test]
    fn token_is_base64url() {
        let mgr = SessionManager::new(make_reader());
        let tok = mgr.current_token();
        // Base64url alphabet: A-Z, a-z, 0-9, -, _
        assert!(
            tok.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_'),
            "invalid base64url chars in: {tok}"
        );
    }

    #[test]
    fn rotate_changes_token() {
        // Use OS fallback reader so we get different bytes each time.
        let reader = Arc::new(QrngReader::new("/nonexistent/pool.bin"));
        let mgr = SessionManager::new(reader);
        let before = mgr.current_token();
        mgr.rotate();
        let after = mgr.current_token();
        // With OS CSPRNG the tokens should differ (astronomically unlikely to match).
        assert_ne!(before, after);
    }

    #[test]
    fn rotation_count_increments() {
        let reader = Arc::new(QrngReader::new("/nonexistent/pool.bin"));
        let mgr = SessionManager::new(reader);
        assert_eq!(mgr.session_info().rotation_count, 0);
        mgr.rotate();
        assert_eq!(mgr.session_info().rotation_count, 1);
        mgr.rotate();
        assert_eq!(mgr.session_info().rotation_count, 2);
    }

    #[test]
    fn session_info_has_started_at() {
        let reader = Arc::new(QrngReader::new("/nonexistent/pool.bin"));
        let mgr = SessionManager::new(reader);
        let info = mgr.session_info();
        let now = unix_now();
        assert!(info.started_at <= now);
        assert!(info.started_at > now - 5);
    }
}
