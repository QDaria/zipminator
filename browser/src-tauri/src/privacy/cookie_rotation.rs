//! Cookie rotation with QRNG seeds.
//!
//! Third-party cookies are automatically rotated on a configurable schedule
//! (default: every 30 minutes).  First-party cookies for trusted domains are
//! preserved.  Each browser tab gets an isolated cookie jar (via per-tab
//! prefixes).  Users can pin specific cookies to opt out of rotation.
//!
//! Architecture:
//!   - `CookieJar`   — an isolated jar for one tab.
//!   - `CookieRotator` — owns all jars; drives periodic rotation.
//!   - Rotation generates a fresh QRNG-seeded value for each cookie.

use std::collections::{HashMap, HashSet};
use std::sync::{Arc, RwLock};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};

use crate::privacy::entropy::QrngReader;

/// Default rotation interval: 30 minutes.
pub const DEFAULT_ROTATION_INTERVAL: Duration = Duration::from_secs(30 * 60);

/// Maximum cookie value length generated during rotation.
const GENERATED_VALUE_LEN: usize = 32;

/// A single cookie entry.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Cookie {
    pub name: String,
    pub value: String,
    /// Domain this cookie belongs to (e.g. "example.com").
    pub domain: String,
    /// Path scope.
    pub path: String,
    /// Whether this cookie is first-party (owned by the visited origin).
    pub first_party: bool,
    /// Whether the user has pinned this cookie (opt-out from rotation).
    pub pinned: bool,
    /// Unix timestamp (seconds) when the cookie was last rotated.
    pub last_rotated: u64,
}

impl Cookie {
    /// Create a new third-party cookie.
    pub fn third_party(name: impl Into<String>, value: impl Into<String>, domain: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            value: value.into(),
            domain: domain.into(),
            path: "/".to_string(),
            first_party: false,
            pinned: false,
            last_rotated: unix_now(),
        }
    }

    /// Create a first-party cookie that will not be rotated.
    pub fn first_party(name: impl Into<String>, value: impl Into<String>, domain: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            value: value.into(),
            domain: domain.into(),
            path: "/".to_string(),
            first_party: true,
            pinned: false,
            last_rotated: unix_now(),
        }
    }

    /// Whether this cookie should be rotated.
    pub fn should_rotate(&self) -> bool {
        !self.first_party && !self.pinned
    }
}

/// Isolated cookie jar for a single tab.
#[derive(Debug)]
pub struct CookieJar {
    pub tab_id: String,
    cookies: RwLock<HashMap<String, Cookie>>,
}

impl CookieJar {
    pub fn new(tab_id: impl Into<String>) -> Self {
        Self {
            tab_id: tab_id.into(),
            cookies: RwLock::new(HashMap::new()),
        }
    }

    /// Insert or update a cookie.
    pub fn set(&self, cookie: Cookie) {
        let key = Self::key(&cookie.domain, &cookie.name);
        self.cookies.write().expect("cookie jar lock poisoned").insert(key, cookie);
    }

    /// Retrieve a cookie by domain and name.
    pub fn get(&self, domain: &str, name: &str) -> Option<Cookie> {
        let key = Self::key(domain, name);
        self.cookies.read().expect("cookie jar lock poisoned").get(&key).cloned()
    }

    /// Remove a cookie.
    pub fn remove(&self, domain: &str, name: &str) {
        let key = Self::key(domain, name);
        self.cookies.write().expect("cookie jar lock poisoned").remove(&key);
    }

    /// Pin a cookie to prevent rotation.
    pub fn pin(&self, domain: &str, name: &str) {
        let key = Self::key(domain, name);
        let mut guard = self.cookies.write().expect("cookie jar lock poisoned");
        if let Some(c) = guard.get_mut(&key) {
            c.pinned = true;
        }
    }

    /// Unpin a cookie.
    pub fn unpin(&self, domain: &str, name: &str) {
        let key = Self::key(domain, name);
        let mut guard = self.cookies.write().expect("cookie jar lock poisoned");
        if let Some(c) = guard.get_mut(&key) {
            c.pinned = false;
        }
    }

    /// Snapshot of all cookies in this jar.
    pub fn all(&self) -> Vec<Cookie> {
        self.cookies.read().expect("cookie jar lock poisoned").values().cloned().collect()
    }

    /// Rotate all eligible cookies using QRNG-derived values.
    ///
    /// Returns the number of cookies rotated.
    pub fn rotate_all(&self, entropy: &QrngReader) -> usize {
        let mut guard = self.cookies.write().expect("cookie jar lock poisoned");
        let mut count = 0;

        for cookie in guard.values_mut() {
            if cookie.should_rotate() {
                cookie.value = generate_cookie_value(entropy);
                cookie.last_rotated = unix_now();
                count += 1;
            }
        }

        count
    }

    fn key(domain: &str, name: &str) -> String {
        format!("{}:{}", domain, name)
    }
}

/// Global cookie rotator — manages all tab jars and drives rotation.
pub struct CookieRotator {
    entropy: Arc<QrngReader>,
    jars: RwLock<HashMap<String, Arc<CookieJar>>>,
    /// Rotation interval.
    interval: Duration,
    /// Domains whose first-party cookies are fully protected.
    trusted_domains: RwLock<HashSet<String>>,
    /// Total rotations performed since startup.
    total_rotations: std::sync::atomic::AtomicU64,
}

impl CookieRotator {
    pub fn new(entropy: Arc<QrngReader>, interval: Duration) -> Self {
        Self {
            entropy,
            jars: RwLock::new(HashMap::new()),
            interval,
            trusted_domains: RwLock::new(HashSet::new()),
            total_rotations: std::sync::atomic::AtomicU64::new(0),
        }
    }

    pub fn with_default_interval(entropy: Arc<QrngReader>) -> Self {
        Self::new(entropy, DEFAULT_ROTATION_INTERVAL)
    }

    /// Create or retrieve the cookie jar for a tab.
    pub fn jar_for_tab(&self, tab_id: &str) -> Arc<CookieJar> {
        let mut guard = self.jars.write().expect("rotator lock poisoned");
        guard
            .entry(tab_id.to_string())
            .or_insert_with(|| Arc::new(CookieJar::new(tab_id)))
            .clone()
    }

    /// Remove the jar for a closed tab.
    pub fn remove_tab(&self, tab_id: &str) {
        self.jars.write().expect("rotator lock poisoned").remove(tab_id);
    }

    /// Mark a domain as trusted (its first-party cookies won't be rotated).
    pub fn trust_domain(&self, domain: impl Into<String>) {
        self.trusted_domains.write().expect("trusted_domains lock poisoned").insert(domain.into());
    }

    /// Rotate third-party cookies in all jars.
    ///
    /// Should be called by a background timer on `self.interval`.
    pub fn rotate_all_jars(&self) -> RotationReport {
        let jars: Vec<Arc<CookieJar>> = {
            let guard = self.jars.read().expect("rotator lock poisoned");
            guard.values().cloned().collect()
        };

        let mut total_rotated = 0u64;
        let mut tabs_rotated = 0u64;

        for jar in &jars {
            let count = jar.rotate_all(&self.entropy);
            if count > 0 {
                tabs_rotated += 1;
                total_rotated += count as u64;
            }
        }

        self.total_rotations
            .fetch_add(total_rotated, std::sync::atomic::Ordering::Relaxed);

        let report = RotationReport {
            timestamp: unix_now(),
            tabs_rotated,
            cookies_rotated: total_rotated,
            cumulative_rotations: self.total_rotations.load(std::sync::atomic::Ordering::Relaxed),
        };

        tracing::info!(
            tabs = tabs_rotated,
            cookies = total_rotated,
            "cookie rotation complete"
        );

        report
    }

    /// Total number of cookie rotations since startup.
    pub fn total_rotations(&self) -> u64 {
        self.total_rotations.load(std::sync::atomic::Ordering::Relaxed)
    }

    /// Number of active tab jars.
    pub fn active_tabs(&self) -> usize {
        self.jars.read().expect("rotator lock poisoned").len()
    }
}

/// Report from a rotation cycle.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RotationReport {
    pub timestamp: u64,
    pub tabs_rotated: u64,
    pub cookies_rotated: u64,
    pub cumulative_rotations: u64,
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/// Generate a QRNG-derived cookie value (hex-encoded, `GENERATED_VALUE_LEN * 2` chars).
fn generate_cookie_value(entropy: &QrngReader) -> String {
    let bytes = entropy.read_bytes(GENERATED_VALUE_LEN);
    hex_encode(&bytes)
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

    fn make_entropy() -> Arc<QrngReader> {
        Arc::new(QrngReader::new("/nonexistent/pool.bin"))
    }

    #[test]
    fn jar_set_and_get() {
        let jar = CookieJar::new("tab-1");
        let c = Cookie::third_party("_ga", "GA1.2.xxx", "google.com");
        jar.set(c);
        let got = jar.get("google.com", "_ga").unwrap();
        assert_eq!(got.value, "GA1.2.xxx");
    }

    #[test]
    fn first_party_cookie_not_rotated() {
        let entropy = make_entropy();
        let jar = CookieJar::new("tab-1");
        let c = Cookie::first_party("session_id", "abc123", "mysite.com");
        jar.set(c);
        let rotated = jar.rotate_all(&entropy);
        assert_eq!(rotated, 0);
        // Value preserved.
        assert_eq!(jar.get("mysite.com", "session_id").unwrap().value, "abc123");
    }

    #[test]
    fn third_party_cookie_rotated() {
        let entropy = make_entropy();
        let jar = CookieJar::new("tab-1");
        let c = Cookie::third_party("_fbp", "fb.1.xxx", "facebook.com");
        jar.set(c);
        let rotated = jar.rotate_all(&entropy);
        assert_eq!(rotated, 1);
        let new_val = jar.get("facebook.com", "_fbp").unwrap().value;
        assert_ne!(new_val, "fb.1.xxx");
        assert_eq!(new_val.len(), GENERATED_VALUE_LEN * 2); // Hex-encoded.
    }

    #[test]
    fn pinned_cookie_not_rotated() {
        let entropy = make_entropy();
        let jar = CookieJar::new("tab-1");
        let c = Cookie::third_party("pinned_cookie", "keep-me", "ads.com");
        jar.set(c);
        jar.pin("ads.com", "pinned_cookie");
        let rotated = jar.rotate_all(&entropy);
        assert_eq!(rotated, 0);
        assert_eq!(jar.get("ads.com", "pinned_cookie").unwrap().value, "keep-me");
    }

    #[test]
    fn unpin_allows_rotation() {
        let entropy = make_entropy();
        let jar = CookieJar::new("tab-1");
        let c = Cookie::third_party("c1", "val1", "tracker.io");
        jar.set(c);
        jar.pin("tracker.io", "c1");
        jar.unpin("tracker.io", "c1");
        let rotated = jar.rotate_all(&entropy);
        assert_eq!(rotated, 1);
    }

    #[test]
    fn rotator_creates_jars_per_tab() {
        let entropy = make_entropy();
        let rotator = CookieRotator::with_default_interval(entropy);
        let jar1 = rotator.jar_for_tab("tab-1");
        let jar2 = rotator.jar_for_tab("tab-2");
        assert_eq!(rotator.active_tabs(), 2);
        assert_ne!(jar1.tab_id, jar2.tab_id);
    }

    #[test]
    fn rotator_rotate_all_jars() {
        let entropy = make_entropy();
        let rotator = CookieRotator::with_default_interval(entropy.clone());
        let jar = rotator.jar_for_tab("tab-1");
        jar.set(Cookie::third_party("_ga", "val", "google.com"));
        let report = rotator.rotate_all_jars();
        assert_eq!(report.cookies_rotated, 1);
    }

    #[test]
    fn remove_tab_clears_jar() {
        let entropy = make_entropy();
        let rotator = CookieRotator::with_default_interval(entropy);
        rotator.jar_for_tab("tab-x");
        assert_eq!(rotator.active_tabs(), 1);
        rotator.remove_tab("tab-x");
        assert_eq!(rotator.active_tabs(), 0);
    }
}
