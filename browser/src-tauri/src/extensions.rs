//! Extension/Plugin API scaffold for ZipBrowser.
//!
//! This module defines the manifest format, permission system, and lifecycle
//! hooks for browser extensions. It follows a Chrome Manifest V3-inspired
//! design, adapted for Tauri's security model.
//!
//! Cross-domain integration point: extension authors will use this API
//! to build PQC-aware browser extensions.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ---------------------------------------------------------------------------
// Extension Manifest
// ---------------------------------------------------------------------------

/// The version of the manifest schema.
pub const MANIFEST_VERSION: u32 = 1;

/// Permissions that an extension can request.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "camelCase")]
pub enum Permission {
    /// Access the active tab's URL and title.
    ActiveTab,
    /// Read browsing history.
    History,
    /// Read and modify bookmarks.
    Bookmarks,
    /// Store data persistently.
    Storage,
    /// Access PQC status information.
    PqcStatus,
    /// Access VPN controls.
    VpnControl,
    /// Access QRNG entropy.
    QrngEntropy,
    /// Make network requests to specified origins.
    Network(Vec<String>),
    /// Inject content scripts into pages matching specified patterns.
    ContentScripts(Vec<String>),
    /// Notifications.
    Notifications,
    /// Context menu items.
    ContextMenus,
}

/// A content script declaration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentScript {
    /// URL match patterns (e.g. "https://*.example.com/*").
    pub matches: Vec<String>,
    /// JavaScript files to inject.
    pub js: Vec<String>,
    /// CSS files to inject.
    pub css: Vec<String>,
    /// When to inject: "document_start", "document_end", "document_idle".
    #[serde(default = "default_run_at")]
    pub run_at: String,
}

fn default_run_at() -> String {
    "document_idle".to_string()
}

/// A background script configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackgroundConfig {
    /// Path to the service worker script (relative to extension root).
    pub service_worker: String,
    /// Whether the service worker is an ES module.
    #[serde(default)]
    pub module: bool,
}

/// The extension manifest (JSON format).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionManifest {
    pub manifest_version: u32,
    pub name: String,
    pub version: String,
    pub description: Option<String>,
    pub author: Option<String>,
    pub homepage_url: Option<String>,
    pub permissions: Vec<Permission>,
    pub content_scripts: Vec<ContentScript>,
    pub background: Option<BackgroundConfig>,
    /// Path to the popup HTML (relative to extension root).
    pub popup: Option<String>,
    /// Path to the options page HTML.
    pub options_page: Option<String>,
    /// Icon paths keyed by size (e.g. "16", "48", "128").
    #[serde(default)]
    pub icons: HashMap<String, String>,
}

// ---------------------------------------------------------------------------
// Extension Runtime
// ---------------------------------------------------------------------------

/// Runtime state for a loaded extension.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionInfo {
    pub id: String,
    pub manifest: ExtensionManifest,
    pub enabled: bool,
    pub install_path: String,
}

/// The extension registry manages all installed extensions.
#[derive(Debug, Default)]
pub struct ExtensionRegistry {
    extensions: HashMap<String, ExtensionInfo>,
}

impl ExtensionRegistry {
    pub fn new() -> Self {
        Self {
            extensions: HashMap::new(),
        }
    }

    /// Register an extension from its manifest. Returns the assigned extension ID.
    pub fn register(&mut self, manifest: ExtensionManifest, install_path: &str) -> String {
        let id = format!(
            "ext_{}",
            &uuid::Uuid::new_v4().to_string().replace('-', "")[..12]
        );
        let info = ExtensionInfo {
            id: id.clone(),
            manifest,
            enabled: true,
            install_path: install_path.to_string(),
        };
        self.extensions.insert(id.clone(), info);
        id
    }

    /// Enable or disable an extension.
    pub fn set_enabled(&mut self, ext_id: &str, enabled: bool) -> bool {
        if let Some(ext) = self.extensions.get_mut(ext_id) {
            ext.enabled = enabled;
            true
        } else {
            false
        }
    }

    /// Remove an extension.
    pub fn unregister(&mut self, ext_id: &str) -> bool {
        self.extensions.remove(ext_id).is_some()
    }

    /// List all registered extensions.
    pub fn list(&self) -> Vec<&ExtensionInfo> {
        self.extensions.values().collect()
    }

    /// Get a specific extension.
    pub fn get(&self, ext_id: &str) -> Option<&ExtensionInfo> {
        self.extensions.get(ext_id)
    }

    /// Get content scripts that should be injected for a given URL.
    pub fn get_content_scripts_for_url(&self, url: &str) -> Vec<(&ExtensionInfo, &ContentScript)> {
        let mut result = Vec::new();
        for ext in self.extensions.values() {
            if !ext.enabled {
                continue;
            }
            for cs in &ext.manifest.content_scripts {
                if matches_any_pattern(url, &cs.matches) {
                    result.push((ext, cs));
                }
            }
        }
        result
    }

    /// Validate that an extension's permissions are acceptable.
    pub fn validate_permissions(manifest: &ExtensionManifest) -> Result<(), Vec<String>> {
        let mut errors = Vec::new();
        if manifest.manifest_version != MANIFEST_VERSION {
            errors.push(format!(
                "Unsupported manifest version: {}. Expected {}.",
                manifest.manifest_version, MANIFEST_VERSION
            ));
        }
        if manifest.name.is_empty() {
            errors.push("Extension name must not be empty.".to_string());
        }
        if manifest.version.is_empty() {
            errors.push("Extension version must not be empty.".to_string());
        }
        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }
}

/// Simple glob-style URL pattern matching.
///
/// Supports patterns like:
/// - `https://*.example.com/*`
/// - `*://example.com/*`
/// - `<all_urls>`
fn matches_any_pattern(url: &str, patterns: &[String]) -> bool {
    for pattern in patterns {
        if pattern == "<all_urls>" {
            return true;
        }
        if match_pattern(url, pattern) {
            return true;
        }
    }
    false
}

fn match_pattern(url: &str, pattern: &str) -> bool {
    // Convert the simple glob pattern into a check.
    // Split pattern into scheme and rest.
    let parts: Vec<&str> = pattern.splitn(2, "://").collect();
    if parts.len() != 2 {
        return false;
    }
    let (pattern_scheme, pattern_rest) = (parts[0], parts[1]);

    let url_parts: Vec<&str> = url.splitn(2, "://").collect();
    if url_parts.len() != 2 {
        return false;
    }
    let (url_scheme, url_rest) = (url_parts[0], url_parts[1]);

    // Check scheme.
    if pattern_scheme != "*" && pattern_scheme != url_scheme {
        return false;
    }

    // Check the host+path with simple wildcard matching.
    simple_glob_match(url_rest, pattern_rest)
}

fn simple_glob_match(text: &str, pattern: &str) -> bool {
    let mut t_idx = 0;
    let mut p_idx = 0;
    let t_bytes = text.as_bytes();
    let p_bytes = pattern.as_bytes();
    let mut star_p: Option<usize> = None;
    let mut star_t: usize = 0;

    while t_idx < t_bytes.len() {
        if p_idx < p_bytes.len() && (p_bytes[p_idx] == b'?' || p_bytes[p_idx] == t_bytes[t_idx]) {
            t_idx += 1;
            p_idx += 1;
        } else if p_idx < p_bytes.len() && p_bytes[p_idx] == b'*' {
            star_p = Some(p_idx);
            star_t = t_idx;
            p_idx += 1;
        } else if let Some(sp) = star_p {
            p_idx = sp + 1;
            star_t += 1;
            t_idx = star_t;
        } else {
            return false;
        }
    }

    while p_idx < p_bytes.len() && p_bytes[p_idx] == b'*' {
        p_idx += 1;
    }

    p_idx == p_bytes.len()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pattern_matching() {
        assert!(match_pattern("https://example.com/page", "https://example.com/*"));
        assert!(match_pattern("https://sub.example.com/page", "https://*.example.com/*"));
        assert!(match_pattern("http://example.com/page", "*://example.com/*"));
        assert!(!match_pattern("http://other.com/page", "https://example.com/*"));
    }

    #[test]
    fn test_all_urls_pattern() {
        assert!(matches_any_pattern("https://any.com/page", &["<all_urls>".to_string()]));
    }

    #[test]
    fn test_validate_manifest() {
        let valid = ExtensionManifest {
            manifest_version: 1,
            name: "Test".to_string(),
            version: "1.0.0".to_string(),
            description: None,
            author: None,
            homepage_url: None,
            permissions: vec![],
            content_scripts: vec![],
            background: None,
            popup: None,
            options_page: None,
            icons: HashMap::new(),
        };
        assert!(ExtensionRegistry::validate_permissions(&valid).is_ok());

        let invalid = ExtensionManifest {
            manifest_version: 99,
            name: "".to_string(),
            version: "".to_string(),
            ..valid
        };
        let errs = ExtensionRegistry::validate_permissions(&invalid).unwrap_err();
        assert_eq!(errs.len(), 3);
    }

    #[test]
    fn test_registry_lifecycle() {
        let mut reg = ExtensionRegistry::new();
        let manifest = ExtensionManifest {
            manifest_version: 1,
            name: "Test Extension".to_string(),
            version: "0.1.0".to_string(),
            description: Some("A test".to_string()),
            author: None,
            homepage_url: None,
            permissions: vec![Permission::ActiveTab],
            content_scripts: vec![],
            background: None,
            popup: None,
            options_page: None,
            icons: HashMap::new(),
        };

        let id = reg.register(manifest, "/tmp/ext");
        assert_eq!(reg.list().len(), 1);
        assert!(reg.get(&id).unwrap().enabled);

        reg.set_enabled(&id, false);
        assert!(!reg.get(&id).unwrap().enabled);

        reg.unregister(&id);
        assert!(reg.list().is_empty());
    }
}
