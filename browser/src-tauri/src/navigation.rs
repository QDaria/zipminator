use crate::state::{AppState, SecurityLevel};
use serde::{Deserialize, Serialize};
use url::Url;

/// Result of a navigation action.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NavigationResult {
    pub tab_id: String,
    pub url: String,
    pub can_go_back: bool,
    pub can_go_forward: bool,
}

/// Normalizes a raw address bar input into a navigable URL.
///
/// Rules:
/// - If it looks like a URL (contains "." and no spaces), prepend "https://" if missing.
/// - Otherwise, treat it as a search query and build a DuckDuckGo search URL.
pub fn normalize_url(input: &str) -> String {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return "about:blank".to_string();
    }

    // Already has a scheme.
    if trimmed.starts_with("http://")
        || trimmed.starts_with("https://")
        || trimmed.starts_with("about:")
        || trimmed.starts_with("data:")
    {
        return trimmed.to_string();
    }

    // Looks like a domain (contains dot, no spaces).
    if trimmed.contains('.') && !trimmed.contains(' ') {
        let candidate = format!("https://{}", trimmed);
        if Url::parse(&candidate).is_ok() {
            return candidate;
        }
    }

    // Treat as search query. Using DuckDuckGo for privacy alignment.
    let encoded = urlencoding::encode(trimmed);
    format!("https://duckduckgo.com/?q={}", encoded)
}

/// Determine the security level of a URL.
///
/// The PQC proxy will call `update_tab_security` to override this
/// when it detects a PQC-protected connection. This function provides
/// the baseline classification.
pub fn classify_security(url: &str) -> SecurityLevel {
    if url.starts_with("https://") {
        SecurityLevel::Classical
    } else if url.starts_with("about:") || url.starts_with("data:") {
        SecurityLevel::None
    } else {
        SecurityLevel::None
    }
}

/// Navigate the active tab or a specific tab to a URL.
pub fn navigate_tab(state: &AppState, tab_id: &str, raw_input: &str) -> Result<NavigationResult, String> {
    let url = normalize_url(raw_input);
    let mut tabs = state
        .tabs
        .lock()
        .map_err(|e| format!("Lock tabs: {}", e))?;

    tabs.navigate(tab_id, &url);

    let security = classify_security(&url);
    tabs.update_tab_meta(tab_id, None, None, Some(security));

    let can_back = tabs.can_go_back(tab_id);
    let can_fwd = tabs.can_go_forward(tab_id);

    Ok(NavigationResult {
        tab_id: tab_id.to_string(),
        url,
        can_go_back: can_back,
        can_go_forward: can_fwd,
    })
}

/// Navigate back in the specified tab.
pub fn go_back(state: &AppState, tab_id: &str) -> Result<Option<NavigationResult>, String> {
    let mut tabs = state
        .tabs
        .lock()
        .map_err(|e| format!("Lock tabs: {}", e))?;

    if let Some(url) = tabs.go_back(tab_id) {
        let security = classify_security(&url);
        tabs.update_tab_meta(tab_id, None, None, Some(security));
        Ok(Some(NavigationResult {
            tab_id: tab_id.to_string(),
            url,
            can_go_back: tabs.can_go_back(tab_id),
            can_go_forward: tabs.can_go_forward(tab_id),
        }))
    } else {
        Ok(None)
    }
}

/// Navigate forward in the specified tab.
pub fn go_forward(state: &AppState, tab_id: &str) -> Result<Option<NavigationResult>, String> {
    let mut tabs = state
        .tabs
        .lock()
        .map_err(|e| format!("Lock tabs: {}", e))?;

    if let Some(url) = tabs.go_forward(tab_id) {
        let security = classify_security(&url);
        tabs.update_tab_meta(tab_id, None, None, Some(security));
        Ok(Some(NavigationResult {
            tab_id: tab_id.to_string(),
            url,
            can_go_back: tabs.can_go_back(tab_id),
            can_go_forward: tabs.can_go_forward(tab_id),
        }))
    } else {
        Ok(None)
    }
}

/// Reload the current page in a tab. Returns the URL to reload.
pub fn reload_tab(state: &AppState, tab_id: &str) -> Result<String, String> {
    let mut tabs = state
        .tabs
        .lock()
        .map_err(|e| format!("Lock tabs: {}", e))?;

    if let Some(found) = tabs.get_tabs().iter().find(|t| t.id == tab_id) {
        let url = found.url.clone();
        // Reset loading status.
        tabs.update_tab_meta(tab_id, None, None, None);
        Ok(url)
    } else {
        Err(format!("Tab not found: {}", tab_id))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normalize_url_with_scheme() {
        assert_eq!(normalize_url("https://example.com"), "https://example.com");
        assert_eq!(normalize_url("http://test.org"), "http://test.org");
    }

    #[test]
    fn test_normalize_url_without_scheme() {
        assert_eq!(normalize_url("example.com"), "https://example.com");
        assert_eq!(
            normalize_url("docs.rust-lang.org"),
            "https://docs.rust-lang.org"
        );
    }

    #[test]
    fn test_normalize_url_search() {
        let result = normalize_url("rust tutorial");
        assert!(result.starts_with("https://duckduckgo.com/?q="));
        assert!(result.contains("rust"));
    }

    #[test]
    fn test_normalize_url_empty() {
        assert_eq!(normalize_url(""), "about:blank");
        assert_eq!(normalize_url("  "), "about:blank");
    }

    #[test]
    fn test_classify_security() {
        assert_eq!(classify_security("https://example.com"), SecurityLevel::Classical);
        assert_eq!(classify_security("http://example.com"), SecurityLevel::None);
        assert_eq!(classify_security("about:blank"), SecurityLevel::None);
    }
}
