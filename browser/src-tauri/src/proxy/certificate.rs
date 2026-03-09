//! Local CA certificate generation and per-site certificate issuance.
//!
//! On first run the proxy generates a self-signed CA certificate and stores
//! it in the Tauri application data directory. For every upstream HTTPS host
//! the proxy visits, it dynamically issues a short-lived leaf certificate
//! signed by this CA. The browser trusts the CA so the leaf cert is accepted.

use std::path::{Path, PathBuf};
use std::sync::Arc;

use dashmap::DashMap;
use rcgen::{
    BasicConstraints, CertificateParams, DistinguishedName, DnType, ExtendedKeyUsagePurpose,
    IsCa, KeyPair, KeyUsagePurpose, SanType,
};
use rustls_pki_types::{CertificateDer, PrivateKeyDer, PrivatePkcs8KeyDer};
use thiserror::Error;

/// Leaf certificate validity period (24 hours).
const LEAF_CERT_VALIDITY_HOURS: i64 = 24;

/// CA certificate validity period (10 years).
const CA_CERT_VALIDITY_DAYS: i64 = 3650;

/// Maximum cached leaf certificates before eviction.
const MAX_CACHED_CERTS: usize = 512;

#[derive(Debug, Error)]
pub enum CertError {
    #[error("failed to generate key pair: {0}")]
    KeyGen(String),
    #[error("failed to generate certificate: {0}")]
    CertGen(String),
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
    #[error("PEM parse error: {0}")]
    PemParse(String),
}

/// Holds a DER-encoded certificate and its private key.
#[derive(Debug, Clone)]
pub struct CertKeyPair {
    pub cert_der: Vec<u8>,
    pub key_der: Vec<u8>,
}

/// Manages the local CA and per-site leaf certificate issuance.
///
/// The CA key pair and PEM are kept in memory so we can sign leaf certs
/// on the fly. The CA cert PEM is also written to disk for trust store
/// installation.
#[derive(Clone)]
pub struct CertificateAuthority {
    /// CA certificate PEM (for export / trust store).
    ca_cert_pem: String,
    /// CA certificate DER.
    ca_cert_der: Vec<u8>,
    /// CA key pair PEM (for re-constructing the KeyPair).
    ca_key_pem: String,
    /// Cache of issued leaf certificates keyed by domain.
    leaf_cache: Arc<DashMap<String, CertKeyPair>>,
}

impl std::fmt::Debug for CertificateAuthority {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("CertificateAuthority")
            .field("cached_leaves", &self.leaf_cache.len())
            .finish()
    }
}

impl CertificateAuthority {
    /// Load or generate the CA. If `ca_dir` contains existing CA files, load
    /// them; otherwise generate a new CA and persist to `ca_dir`.
    pub fn load_or_generate(ca_dir: &Path) -> Result<Self, CertError> {
        let cert_path = ca_dir.join("zipminator-ca.pem");
        let key_path = ca_dir.join("zipminator-ca-key.pem");

        if cert_path.exists() && key_path.exists() {
            tracing::info!(?cert_path, "loading existing CA certificate");
            return Self::load_from_files(&cert_path, &key_path);
        }

        tracing::info!(?ca_dir, "generating new CA certificate");
        std::fs::create_dir_all(ca_dir)?;
        let ca = Self::generate_ca()?;

        std::fs::write(&cert_path, &ca.ca_cert_pem)?;
        std::fs::write(&key_path, &ca.ca_key_pem)?;

        // Restrict key file permissions on Unix.
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&key_path, std::fs::Permissions::from_mode(0o600))?;
        }

        tracing::info!(?cert_path, "CA certificate written");
        Ok(ca)
    }

    /// Generate a fresh CA certificate and key pair.
    fn generate_ca() -> Result<Self, CertError> {
        let key_pair = KeyPair::generate().map_err(|e| CertError::KeyGen(e.to_string()))?;

        let mut params = CertificateParams::new(Vec::<String>::new())
            .map_err(|e| CertError::CertGen(e.to_string()))?;

        let mut dn = DistinguishedName::new();
        dn.push(DnType::CommonName, "ZipBrowser PQC Proxy CA");
        dn.push(DnType::OrganizationName, "Qdaria Inc.");
        params.distinguished_name = dn;

        params.is_ca = IsCa::Ca(BasicConstraints::Unconstrained);
        params.key_usages = vec![
            KeyUsagePurpose::KeyCertSign,
            KeyUsagePurpose::CrlSign,
            KeyUsagePurpose::DigitalSignature,
        ];

        let not_before = time::OffsetDateTime::now_utc();
        let not_after = not_before + time::Duration::days(CA_CERT_VALIDITY_DAYS);
        params.not_before = not_before;
        params.not_after = not_after;

        let cert = params
            .self_signed(&key_pair)
            .map_err(|e| CertError::CertGen(e.to_string()))?;

        let cert_pem = cert.pem();
        let cert_der = cert.der().to_vec();
        let key_pem = key_pair.serialize_pem();

        Ok(Self {
            ca_cert_pem: cert_pem,
            ca_cert_der: cert_der,
            ca_key_pem: key_pem,
            leaf_cache: Arc::new(DashMap::new()),
        })
    }

    /// Load a CA from PEM files on disk.
    fn load_from_files(cert_path: &Path, key_path: &Path) -> Result<Self, CertError> {
        let cert_pem = std::fs::read_to_string(cert_path)?;
        let key_pem = std::fs::read_to_string(key_path)?;

        // Parse DER from PEM for the cert.
        let cert_der = pem_to_der(&cert_pem, "CERTIFICATE")?;

        Ok(Self {
            ca_cert_pem: cert_pem,
            ca_cert_der: cert_der,
            ca_key_pem: key_pem,
            leaf_cache: Arc::new(DashMap::new()),
        })
    }

    /// Issue a short-lived leaf certificate for the given domain.
    ///
    /// Returns a cached certificate if one exists.
    pub fn issue_leaf_cert(&self, domain: &str) -> Result<CertKeyPair, CertError> {
        if let Some(cached) = self.leaf_cache.get(domain) {
            return Ok(cached.value().clone());
        }

        // Evict if cache is too large.
        if self.leaf_cache.len() >= MAX_CACHED_CERTS {
            tracing::debug!("evicting leaf certificate cache");
            self.leaf_cache.clear();
        }

        let pair = self.generate_leaf(domain)?;
        self.leaf_cache.insert(domain.to_string(), pair.clone());
        Ok(pair)
    }

    /// Generate a new leaf certificate for `domain`, signed by our CA.
    fn generate_leaf(&self, domain: &str) -> Result<CertKeyPair, CertError> {
        // Re-create the CA key pair from PEM.
        let ca_key = KeyPair::from_pem(&self.ca_key_pem)
            .map_err(|e| CertError::KeyGen(e.to_string()))?;

        // Re-create the CA cert by self-signing with the same params.
        // This is needed because rcgen::Certificate is not serializable;
        // we reconstruct it from the stored key and cert parameters.
        let ca_cert = self.reconstruct_ca_cert(&ca_key)?;

        // Generate the leaf key pair.
        let leaf_key = KeyPair::generate().map_err(|e| CertError::KeyGen(e.to_string()))?;

        let san = if domain.parse::<std::net::IpAddr>().is_ok() {
            SanType::IpAddress(domain.parse().unwrap())
        } else {
            SanType::DnsName(
                domain
                    .try_into()
                    .map_err(|e: rcgen::Error| CertError::CertGen(e.to_string()))?,
            )
        };

        let mut params = CertificateParams::new(Vec::<String>::new())
            .map_err(|e| CertError::CertGen(e.to_string()))?;

        let mut dn = DistinguishedName::new();
        dn.push(DnType::CommonName, domain);
        params.distinguished_name = dn;
        params.subject_alt_names = vec![san];
        params.extended_key_usages = vec![ExtendedKeyUsagePurpose::ServerAuth];
        params.key_usages = vec![
            KeyUsagePurpose::DigitalSignature,
            KeyUsagePurpose::KeyEncipherment,
        ];

        let not_before = time::OffsetDateTime::now_utc();
        let not_after = not_before + time::Duration::hours(LEAF_CERT_VALIDITY_HOURS);
        params.not_before = not_before;
        params.not_after = not_after;

        let leaf_cert = params
            .signed_by(&leaf_key, &ca_cert, &ca_key)
            .map_err(|e| CertError::CertGen(e.to_string()))?;

        Ok(CertKeyPair {
            cert_der: leaf_cert.der().to_vec(),
            key_der: leaf_key.serialize_der(),
        })
    }

    /// Reconstruct the CA `Certificate` from the stored key.
    ///
    /// We rebuild the same CA params and self-sign again. The output cert
    /// will have different serial/dates but that is fine because we only
    /// need the issuer identity (DN + public key) for signing leaves.
    fn reconstruct_ca_cert(
        &self,
        ca_key: &KeyPair,
    ) -> Result<rcgen::Certificate, CertError> {
        let mut params = CertificateParams::new(Vec::<String>::new())
            .map_err(|e| CertError::CertGen(e.to_string()))?;

        let mut dn = DistinguishedName::new();
        dn.push(DnType::CommonName, "ZipBrowser PQC Proxy CA");
        dn.push(DnType::OrganizationName, "Qdaria Inc.");
        params.distinguished_name = dn;

        params.is_ca = IsCa::Ca(BasicConstraints::Unconstrained);
        params.key_usages = vec![
            KeyUsagePurpose::KeyCertSign,
            KeyUsagePurpose::CrlSign,
            KeyUsagePurpose::DigitalSignature,
        ];

        let not_before = time::OffsetDateTime::now_utc();
        let not_after = not_before + time::Duration::days(CA_CERT_VALIDITY_DAYS);
        params.not_before = not_before;
        params.not_after = not_after;

        params
            .self_signed(ca_key)
            .map_err(|e| CertError::CertGen(e.to_string()))
    }

    /// Get the CA certificate in PEM format (for trust store installation).
    pub fn ca_cert_pem(&self) -> &str {
        &self.ca_cert_pem
    }

    /// Get the CA certificate in DER format.
    pub fn ca_cert_der(&self) -> &[u8] {
        &self.ca_cert_der
    }

    /// Get the path where the CA certificate would be written.
    pub fn ca_cert_path(ca_dir: &Path) -> PathBuf {
        ca_dir.join("zipminator-ca.pem")
    }

    /// Build a `rustls::ServerConfig` for the client-facing side of the proxy,
    /// using the leaf certificate issued for `domain`.
    pub fn server_config_for_domain(
        &self,
        domain: &str,
    ) -> Result<Arc<rustls::ServerConfig>, CertError> {
        let pair = self.issue_leaf_cert(domain)?;

        let cert = CertificateDer::from(pair.cert_der);
        let key = PrivateKeyDer::from(PrivatePkcs8KeyDer::from(pair.key_der));

        let config = rustls::ServerConfig::builder()
            .with_no_client_auth()
            .with_single_cert(vec![cert], key)
            .map_err(|e| CertError::CertGen(e.to_string()))?;

        Ok(Arc::new(config))
    }

    /// Number of cached leaf certificates.
    pub fn cached_leaf_count(&self) -> usize {
        self.leaf_cache.len()
    }
}

/// Extract DER bytes from a single-section PEM string.
fn pem_to_der(pem: &str, expected_label: &str) -> Result<Vec<u8>, CertError> {
    let begin_marker = format!("-----BEGIN {}-----", expected_label);
    let end_marker = format!("-----END {}-----", expected_label);

    let start = pem
        .find(&begin_marker)
        .ok_or_else(|| CertError::PemParse(format!("missing {begin_marker}")))?;
    let end = pem
        .find(&end_marker)
        .ok_or_else(|| CertError::PemParse(format!("missing {end_marker}")))?;

    let b64_content = &pem[start + begin_marker.len()..end];
    let cleaned: String = b64_content.chars().filter(|c| !c.is_whitespace()).collect();

    use base64::Engine;
    base64::engine::general_purpose::STANDARD
        .decode(&cleaned)
        .map_err(|e| CertError::PemParse(e.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn generate_ca_and_leaf() {
        let ca = CertificateAuthority::generate_ca().expect("CA generation failed");
        assert!(!ca.ca_cert_pem().is_empty());
        assert!(!ca.ca_cert_der().is_empty());

        let leaf = ca.issue_leaf_cert("example.com").expect("leaf cert failed");
        assert!(!leaf.cert_der.is_empty());
        assert!(!leaf.key_der.is_empty());
    }

    #[test]
    fn leaf_caching() {
        let ca = CertificateAuthority::generate_ca().expect("CA generation failed");
        let _ = ca.issue_leaf_cert("a.com").unwrap();
        let _ = ca.issue_leaf_cert("b.com").unwrap();
        assert_eq!(ca.cached_leaf_count(), 2);

        let _ = ca.issue_leaf_cert("a.com").unwrap();
        assert_eq!(ca.cached_leaf_count(), 2);
    }

    #[test]
    fn persist_and_reload() {
        let dir = TempDir::new().unwrap();
        let ca1 = CertificateAuthority::load_or_generate(dir.path()).unwrap();
        let pem1 = ca1.ca_cert_pem().to_string();

        let ca2 = CertificateAuthority::load_or_generate(dir.path()).unwrap();
        assert_eq!(ca2.ca_cert_pem(), pem1);
    }

    #[test]
    fn server_config_builds() {
        let _ = rustls::crypto::aws_lc_rs::default_provider().install_default();
        let ca = CertificateAuthority::generate_ca().unwrap();
        let _config = ca
            .server_config_for_domain("test.example.com")
            .expect("server config failed");
    }
}
