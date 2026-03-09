//! Telemetry and tracker blocking.
//!
//! Maintains a blocklist of tracking domains and URL patterns.  The blocker
//! operates at two levels:
//!   1. Domain-level — reject all traffic to a blocked domain.
//!   2. Pattern-level — reject requests matching known tracking URL patterns.
//!
//! Users can add custom block rules or allowlist specific domains.  The
//! blocklist can be updated without restarting the browser (hot reload).
//!
//! Integration with the PQC proxy: the proxy calls `should_block(url)` before
//! forwarding any request.

use std::collections::HashSet;
use std::sync::RwLock;
use std::sync::atomic::{AtomicU64, Ordering};

use serde::{Deserialize, Serialize};

// ── Built-in blocklist ────────────────────────────────────────────────────────

/// Default blocked tracking domains (curated subset of common lists).
const DEFAULT_BLOCKED_DOMAINS: &[&str] = &[
    // Google Analytics / Tag Manager
    "google-analytics.com",
    "www.google-analytics.com",
    "ssl.google-analytics.com",
    "analytics.google.com",
    "googletagmanager.com",
    "www.googletagmanager.com",
    "googletagservices.com",
    "googlesyndication.com",
    "google-syndication.com",
    // Facebook / Meta
    "connect.facebook.net",
    "facebook.com",
    "www.facebook.com",
    "pixel.facebook.com",
    "an.facebook.com",
    // Twitter / X
    "analytics.twitter.com",
    "t.co",
    "static.ads-twitter.com",
    // Amazon
    "fls-na.amazon.com",
    "adsystem.amazon.com",
    // Common ad networks
    "doubleclick.net",
    "googleadservices.com",
    "adnxs.com",
    "rubiconproject.com",
    "openx.net",
    "pubmatic.com",
    "indexexchange.com",
    "criteo.com",
    "criteo.net",
    "scorecardresearch.com",
    "quantserve.com",
    "addthis.com",
    "addthisedge.com",
    "hotjar.com",
    "mouseflow.com",
    "fullstory.com",
    "logrocket.com",
    "segment.com",
    "segment.io",
    "mixpanel.com",
    "amplitude.com",
    "heap.io",
    "heapanalytics.com",
    "intercom.io",
    "intercom.com",
    "hubspot.com",
    "hs-scripts.com",
    "marketo.com",
    "mktoresp.com",
    "newrelic.com",
    "nr-data.net",
    "datadog-browser-agent.com",
    // Browser telemetry
    "telemetry.mozilla.org",
    "safebrowsing.googleapis.com",
    "crash-reports.firefox.com",
];

/// Tracking URL path/query patterns (matched against full URL).
const DEFAULT_BLOCKED_PATTERNS: &[&str] = &[
    "/collect?v=",          // Google Analytics collect endpoint
    "/collect?tid=",
    "/r/collect",
    "facebook.com/tr/",     // Facebook Pixel
    "facebook.com/tr?",
    "/beacon.",             // Generic beacon endpoints
    "/pixel.",
    "/ping?",
    "/__utm.gif",
    "/ga.js",
    "/analytics.js",
    "/gtag/js",
];

// ── Types ─────────────────────────────────────────────────────────────────────

/// Reason a request was blocked.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum BlockReason {
    /// Domain is in the blocklist.
    BlockedDomain(String),
    /// URL matches a tracking pattern.
    TrackerPattern(String),
    /// User-defined custom rule.
    CustomRule(String),
}

impl std::fmt::Display for BlockReason {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            BlockReason::BlockedDomain(d) => write!(f, "blocked domain: {d}"),
            BlockReason::TrackerPattern(p) => write!(f, "tracker pattern: {p}"),
            BlockReason::CustomRule(r) => write!(f, "custom rule: {r}"),
        }
    }
}

/// A blocked request record (for display in the privacy badge).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockedRequest {
    /// The URL that was blocked.
    pub url: String,
    /// Reason for blocking.
    pub reason: BlockReason,
    /// Unix timestamp (ms) when blocked.
    pub timestamp_ms: u64,
}

// ── Blocker ───────────────────────────────────────────────────────────────────

/// Thread-safe telemetry and tracker blocker.
pub struct TelemetryBlocker {
    /// Full-domain blocklist (exact + subdomain match).
    blocked_domains: RwLock<HashSet<String>>,
    /// User-added custom domain rules.
    custom_blocked: RwLock<HashSet<String>>,
    /// Domains explicitly allowlisted by the user.
    allowlist: RwLock<HashSet<String>>,
    /// URL substring patterns to block.
    patterns: RwLock<Vec<String>>,
    /// Total requests blocked since startup.
    total_blocked: AtomicU64,
    /// Recent blocked requests (ring buffer, capped).
    recent: RwLock<Vec<BlockedRequest>>,
}

const RECENT_CAP: usize = 200;

impl TelemetryBlocker {
    /// Create a new blocker pre-populated with the built-in lists.
    pub fn new() -> Self {
        let blocked_domains: HashSet<String> = DEFAULT_BLOCKED_DOMAINS
            .iter()
            .map(|&d| d.to_string())
            .collect();

        let patterns: Vec<String> = DEFAULT_BLOCKED_PATTERNS
            .iter()
            .map(|&p| p.to_string())
            .collect();

        Self {
            blocked_domains: RwLock::new(blocked_domains),
            custom_blocked: RwLock::new(HashSet::new()),
            allowlist: RwLock::new(HashSet::new()),
            patterns: RwLock::new(patterns),
            total_blocked: AtomicU64::new(0),
            recent: RwLock::new(Vec::new()),
        }
    }

    // ── Policy queries ────────────────────────────────────────────────────

    /// Determine whether a request to `url` should be blocked.
    ///
    /// Returns `Some(reason)` if the request should be dropped, `None` if it
    /// should be allowed through.
    pub fn should_block(&self, url: &str) -> Option<BlockReason> {
        let host = extract_host(url);

        // Allowlist takes highest priority.
        if self.is_allowlisted(&host) {
            return None;
        }

        // Check custom user-defined blocked domains.
        {
            let custom = self.custom_blocked.read().expect("custom_blocked lock poisoned");
            if domain_matches(&host, &custom) {
                return Some(BlockReason::CustomRule(host.clone()));
            }
        }

        // Check built-in blocked domains.
        {
            let blocked = self.blocked_domains.read().expect("blocked_domains lock poisoned");
            if domain_matches(&host, &blocked) {
                return Some(BlockReason::BlockedDomain(host.clone()));
            }
        }

        // Check URL patterns.
        {
            let patterns = self.patterns.read().expect("patterns lock poisoned");
            for pat in patterns.iter() {
                if url.contains(pat.as_str()) {
                    return Some(BlockReason::TrackerPattern(pat.clone()));
                }
            }
        }

        None
    }

    /// Record that a request was blocked (updates counters and recent list).
    pub fn record_blocked(&self, url: &str, reason: BlockReason) {
        self.total_blocked.fetch_add(1, Ordering::Relaxed);

        let record = BlockedRequest {
            url: url.to_string(),
            reason,
            timestamp_ms: unix_ms(),
        };

        let mut recent = self.recent.write().expect("recent lock poisoned");
        if recent.len() >= RECENT_CAP {
            recent.remove(0);
        }
        recent.push(record);
    }

    // ── List management ───────────────────────────────────────────────────

    /// Add a domain to the user's custom blocklist.
    pub fn block_domain(&self, domain: impl Into<String>) {
        self.custom_blocked
            .write()
            .expect("custom_blocked lock poisoned")
            .insert(domain.into());
    }

    /// Remove a domain from all blocklists (user custom only; built-in preserved).
    pub fn unblock_domain(&self, domain: &str) {
        self.custom_blocked
            .write()
            .expect("custom_blocked lock poisoned")
            .remove(domain);
    }

    /// Allowlist a domain (user trusts this site).
    pub fn allowlist_domain(&self, domain: impl Into<String>) {
        self.allowlist
            .write()
            .expect("allowlist lock poisoned")
            .insert(domain.into());
    }

    /// Remove a domain from the allowlist.
    pub fn remove_allowlist(&self, domain: &str) {
        self.allowlist
            .write()
            .expect("allowlist lock poisoned")
            .remove(domain);
    }

    /// Add a custom URL pattern rule.
    pub fn add_pattern(&self, pattern: impl Into<String>) {
        self.patterns
            .write()
            .expect("patterns lock poisoned")
            .push(pattern.into());
    }

    // ── Statistics ────────────────────────────────────────────────────────

    /// Total requests blocked since startup.
    pub fn total_blocked(&self) -> u64 {
        self.total_blocked.load(Ordering::Relaxed)
    }

    /// Recent blocked requests (newest last, capped at `RECENT_CAP`).
    pub fn recent_blocked(&self) -> Vec<BlockedRequest> {
        self.recent.read().expect("recent lock poisoned").clone()
    }

    /// Number of blocked requests in the recent window for a given domain.
    pub fn blocked_count_for_domain(&self, domain: &str) -> u64 {
        let recent = self.recent.read().expect("recent lock poisoned");
        recent
            .iter()
            .filter(|r| r.url.contains(domain))
            .count() as u64
    }

    /// Snapshot of blocker statistics.
    pub fn stats(&self) -> BlockerStats {
        BlockerStats {
            total_blocked: self.total_blocked(),
            blocked_domains_count: self.blocked_domains.read().expect("lock poisoned").len() as u64,
            custom_rules_count: self.custom_blocked.read().expect("lock poisoned").len() as u64,
            allowlist_count: self.allowlist.read().expect("lock poisoned").len() as u64,
            pattern_count: self.patterns.read().expect("lock poisoned").len() as u64,
        }
    }

    // ── Private ───────────────────────────────────────────────────────────

    fn is_allowlisted(&self, host: &str) -> bool {
        let al = self.allowlist.read().expect("allowlist lock poisoned");
        domain_matches(host, &al)
    }
}

impl Default for TelemetryBlocker {
    fn default() -> Self {
        Self::new()
    }
}

/// Statistics snapshot.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockerStats {
    pub total_blocked: u64,
    pub blocked_domains_count: u64,
    pub custom_rules_count: u64,
    pub allowlist_count: u64,
    pub pattern_count: u64,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/// Extract the hostname from a URL string.
fn extract_host(url: &str) -> String {
    // Strip scheme.
    let s = url
        .strip_prefix("https://")
        .or_else(|| url.strip_prefix("http://"))
        .unwrap_or(url);

    // Take up to the first '/' or end.
    let host = s.split('/').next().unwrap_or(s);

    // Strip port.
    if let Some(no_port) = host.rsplit_once(':') {
        if no_port.1.parse::<u16>().is_ok() {
            return no_port.0.to_lowercase();
        }
    }

    host.to_lowercase()
}

/// Check whether `host` (or any of its parent domains) is in `set`.
fn domain_matches(host: &str, set: &HashSet<String>) -> bool {
    if set.contains(host) {
        return true;
    }

    // Check parent domains: for "sub.example.com" also check "example.com".
    // Split on '.' and progressively drop the leftmost label.
    let parts: Vec<&str> = host.split('.').collect();
    for i in 1..parts.len() {
        let parent = parts[i..].join(".");
        if set.contains(&parent) {
            return true;
        }
    }

    false
}

fn unix_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn blocks_google_analytics() {
        let blocker = TelemetryBlocker::new();
        let reason = blocker.should_block("https://google-analytics.com/collect?v=1&t=pageview");
        assert!(reason.is_some());
        assert!(matches!(reason.unwrap(), BlockReason::BlockedDomain(_)));
    }

    #[test]
    fn blocks_facebook_pixel_url() {
        let blocker = TelemetryBlocker::new();
        let reason = blocker.should_block("https://www.facebook.com/tr?id=123&ev=PageView");
        assert!(reason.is_some());
    }

    #[test]
    fn blocks_subdomain_of_blocked_domain() {
        let blocker = TelemetryBlocker::new();
        let reason = blocker.should_block("https://sub.google-analytics.com/collect");
        assert!(reason.is_some());
    }

    #[test]
    fn allows_normal_site() {
        let blocker = TelemetryBlocker::new();
        let reason = blocker.should_block("https://example.com/index.html");
        assert!(reason.is_none());
    }

    #[test]
    fn custom_block_rule() {
        let blocker = TelemetryBlocker::new();
        blocker.block_domain("evil-tracker.io");
        let reason = blocker.should_block("https://evil-tracker.io/script.js");
        assert!(reason.is_some());
        assert!(matches!(reason.unwrap(), BlockReason::CustomRule(_)));
    }

    #[test]
    fn allowlist_overrides_block() {
        let blocker = TelemetryBlocker::new();
        blocker.allowlist_domain("google-analytics.com");
        let reason = blocker.should_block("https://google-analytics.com/collect");
        assert!(reason.is_none());
    }

    #[test]
    fn pattern_block() {
        let blocker = TelemetryBlocker::new();
        let reason = blocker.should_block("https://mysite.com/collect?v=1&tid=UA-xxx");
        assert!(reason.is_some());
    }

    #[test]
    fn custom_pattern_added() {
        let blocker = TelemetryBlocker::new();
        blocker.add_pattern("/my-custom-track.gif");
        let reason = blocker.should_block("https://ads.com/my-custom-track.gif?x=1");
        assert!(reason.is_some());
    }

    #[test]
    fn total_blocked_counter() {
        let blocker = TelemetryBlocker::new();
        blocker.record_blocked("https://google-analytics.com/x", BlockReason::BlockedDomain("google-analytics.com".to_string()));
        blocker.record_blocked("https://doubleclick.net/x", BlockReason::BlockedDomain("doubleclick.net".to_string()));
        assert_eq!(blocker.total_blocked(), 2);
    }

    #[test]
    fn recent_blocked_ring_buffer() {
        let blocker = TelemetryBlocker::new();
        for i in 0..(RECENT_CAP + 10) {
            blocker.record_blocked(
                &format!("https://tracker{i}.com/x"),
                BlockReason::CustomRule(format!("tracker{i}.com")),
            );
        }
        assert_eq!(blocker.recent_blocked().len(), RECENT_CAP);
    }

    #[test]
    fn extract_host_strips_scheme_and_path() {
        assert_eq!(extract_host("https://google-analytics.com/collect?v=1"), "google-analytics.com");
        assert_eq!(extract_host("http://sub.example.com/path/page"), "sub.example.com");
        assert_eq!(extract_host("https://host.com:443/path"), "host.com");
    }
}
