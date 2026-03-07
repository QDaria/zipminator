//! PQC key exchange detection.
//!
//! After a TLS handshake completes, inspects the negotiated key exchange
//! algorithm and reports whether post-quantum cryptography was used.
//! Caches results per domain to avoid redundant probing.

use std::sync::Arc;
use std::time::{Duration, Instant};

use dashmap::DashMap;
use serde::{Deserialize, Serialize};

/// Result of PQC negotiation for a connection.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum PqcStatus {
    /// PQC key exchange was negotiated. Contains the algorithm name.
    Active(String),
    /// Classical key exchange was used. Contains the algorithm name.
    Classical(String),
    /// The connection or detection failed. Contains the reason.
    Failed(String),
}

impl PqcStatus {
    /// Returns true if PQC key exchange was negotiated.
    pub fn is_pqc(&self) -> bool {
        matches!(self, PqcStatus::Active(_))
    }

    /// Human-readable description.
    pub fn description(&self) -> String {
        match self {
            PqcStatus::Active(alg) => format!("PQC active: {alg}"),
            PqcStatus::Classical(alg) => format!("classical: {alg}"),
            PqcStatus::Failed(reason) => format!("failed: {reason}"),
        }
    }
}

/// Cached entry for a domain's PQC support.
#[derive(Debug, Clone)]
struct CachedPqcResult {
    status: PqcStatus,
    /// When this cache entry was created.
    cached_at: Instant,
}

/// Cache TTL for PQC detection results (1 hour).
const CACHE_TTL: Duration = Duration::from_secs(3600);

/// Known PQC-capable domains for optimistic detection.
const KNOWN_PQC_DOMAINS: &[&str] = &[
    "pq.cloudflareresearch.com",
    "blog.cloudflare.com",
    "cloudflare.com",
    "www.cloudflare.com",
    "google.com",
    "www.google.com",
    "mail.google.com",
    "chromium.org",
    "amazon.com",
    "aws.amazon.com",
];

/// Detects PQC key exchange status from TLS handshake results.
#[derive(Debug, Clone)]
pub struct PqcDetector {
    cache: Arc<DashMap<String, CachedPqcResult>>,
}

impl PqcDetector {
    /// Create a new detector with an empty cache.
    pub fn new() -> Self {
        Self {
            cache: Arc::new(DashMap::new()),
        }
    }

    /// Check whether a domain is known to support PQC.
    ///
    /// This is a hint only; the actual negotiation determines the final status.
    pub fn is_known_pqc_domain(domain: &str) -> bool {
        KNOWN_PQC_DOMAINS
            .iter()
            .any(|&known| domain == known || domain.ends_with(&format!(".{known}")))
    }

    /// Classify the negotiated key exchange algorithm.
    ///
    /// `negotiated_kx` should be the string representation of the TLS key
    /// exchange group, e.g. from `rustls::NamedGroup`.
    pub fn classify_key_exchange(negotiated_kx: &str) -> PqcStatus {
        let normalized = negotiated_kx.to_uppercase();

        // Post-quantum hybrid algorithms.
        if normalized.contains("MLKEM")
            || normalized.contains("ML_KEM")
            || normalized.contains("ML-KEM")
            || normalized.contains("KYBER")
            || normalized.contains("X25519MLKEM768")
            || normalized.contains("X25519_MLKEM768")
        {
            return PqcStatus::Active(negotiated_kx.to_string());
        }

        // Classical algorithms.
        if normalized.contains("X25519")
            || normalized.contains("P256")
            || normalized.contains("P384")
            || normalized.contains("SECP")
            || normalized.contains("ECDHE")
        {
            return PqcStatus::Classical(negotiated_kx.to_string());
        }

        // Unknown algorithm — classify as classical with a note.
        PqcStatus::Classical(format!("unknown({negotiated_kx})"))
    }

    /// Record the PQC status for a domain and cache it.
    pub fn record(&self, domain: &str, status: PqcStatus) {
        self.cache.insert(
            domain.to_string(),
            CachedPqcResult {
                status,
                cached_at: Instant::now(),
            },
        );
    }

    /// Look up cached PQC status for a domain.
    ///
    /// Returns `None` if the domain is not cached or the cache has expired.
    pub fn lookup(&self, domain: &str) -> Option<PqcStatus> {
        let entry = self.cache.get(domain)?;
        if entry.cached_at.elapsed() > CACHE_TTL {
            // Expired — remove and return None.
            drop(entry);
            self.cache.remove(domain);
            return None;
        }
        Some(entry.status.clone())
    }

    /// Clear all cached entries.
    pub fn clear_cache(&self) {
        self.cache.clear();
    }

    /// Number of cached domain entries.
    pub fn cache_size(&self) -> usize {
        self.cache.len()
    }

    /// Evict expired entries from the cache.
    pub fn evict_expired(&self) {
        self.cache.retain(|_, v| v.cached_at.elapsed() <= CACHE_TTL);
    }

    /// Actively probe a host for PQC support via TLS connection.
    /// Returns the detected PQC status. This is a placeholder for full
    /// tokio-rustls integration.
    pub fn probe_sync(&self, domain: &str) -> PqcStatus {
        // Check cache first
        if let Some(cached) = self.lookup(domain) {
            return cached;
        }

        // Heuristic: check known PQC domains
        let status = if Self::is_known_pqc_domain(domain) {
            PqcStatus::Active("X25519MLKEM768 (heuristic)".to_string())
        } else {
            PqcStatus::Classical("X25519 (assumed)".to_string())
        };

        self.record(domain, status.clone());
        status
    }
}

impl Default for PqcDetector {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn classify_mlkem_hybrid() {
        let status = PqcDetector::classify_key_exchange("X25519MLKEM768");
        assert!(status.is_pqc());
        assert_eq!(
            status,
            PqcStatus::Active("X25519MLKEM768".to_string())
        );
    }

    #[test]
    fn classify_kyber_hybrid() {
        let status = PqcDetector::classify_key_exchange("X25519Kyber768Draft00");
        assert!(status.is_pqc());
    }

    #[test]
    fn classify_classical_x25519() {
        let status = PqcDetector::classify_key_exchange("X25519");
        assert!(!status.is_pqc());
        assert_eq!(status, PqcStatus::Classical("X25519".to_string()));
    }

    #[test]
    fn classify_classical_p256() {
        let status = PqcDetector::classify_key_exchange("secp256r1");
        assert!(!status.is_pqc());
    }

    #[test]
    fn classify_unknown() {
        let status = PqcDetector::classify_key_exchange("FutureCurve99");
        assert!(!status.is_pqc());
        if let PqcStatus::Classical(alg) = &status {
            assert!(alg.contains("unknown"));
        } else {
            panic!("expected Classical");
        }
    }

    #[test]
    fn cache_hit_and_miss() {
        let det = PqcDetector::new();
        assert!(det.lookup("example.com").is_none());

        det.record(
            "example.com",
            PqcStatus::Active("X25519MLKEM768".to_string()),
        );
        let status = det.lookup("example.com").unwrap();
        assert!(status.is_pqc());
    }

    #[test]
    fn known_pqc_domains() {
        assert!(PqcDetector::is_known_pqc_domain("pq.cloudflareresearch.com"));
        assert!(!PqcDetector::is_known_pqc_domain("example.com"));
    }

    #[test]
    fn cache_eviction() {
        let det = PqcDetector::new();
        det.record("a.com", PqcStatus::Classical("X25519".to_string()));
        assert_eq!(det.cache_size(), 1);
        det.clear_cache();
        assert_eq!(det.cache_size(), 0);
    }
}
