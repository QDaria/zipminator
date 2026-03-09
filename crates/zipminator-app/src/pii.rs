//! Safe wrappers for PII (Personally Identifiable Information) scanning.

use serde::Serialize;

/// A PII detection result.
#[derive(Debug, Clone, Serialize)]
pub struct PiiResult {
    pub pattern_id: String,
    pub pattern_name: String,
    pub category: String,
    pub matched_text: String,
    pub start: usize,
    pub end: usize,
    pub sensitivity: u8,
    pub country_code: String,
}

/// Scan text for PII patterns.
///
/// - `text`: the text to scan
/// - `country_codes`: comma-separated country codes (e.g. "us,uk,ae"), or empty for all
///
/// Returns a list of PII matches.
pub fn scan_text(text: String, country_codes: String) -> Vec<PiiResult> {
    let codes: Vec<&str> = if country_codes.is_empty() {
        Vec::new()
    } else {
        country_codes
            .split(',')
            .map(|c| c.trim())
            .filter(|c| !c.is_empty())
            .collect()
    };

    let matches = zipminator_core::pii::scan_text(&text, &codes);

    matches
        .into_iter()
        .map(|m| PiiResult {
            pattern_id: m.pattern_id,
            pattern_name: m.pattern_name,
            category: m.category,
            matched_text: m.matched_text,
            start: m.start,
            end: m.end,
            sensitivity: m.sensitivity,
            country_code: m.country_code,
        })
        .collect()
}

/// Scan text and return results as JSON string.
pub fn scan_text_json(text: String, country_codes: String) -> String {
    let results = scan_text(text, country_codes);
    serde_json::to_string(&results).unwrap_or_else(|_| "[]".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_scan_detects_email() {
        let results = scan_text(
            "Contact me at test@example.com please".to_string(),
            "us".to_string(),
        );
        assert!(
            results.iter().any(|r| r.category == "contact"),
            "Should detect email as contact PII: {:?}",
            results
        );
    }

    #[test]
    fn test_scan_empty_text() {
        let results = scan_text(String::new(), String::new());
        assert!(results.is_empty());
    }

    #[test]
    fn test_scan_json_format() {
        let json = scan_text_json("SSN: 123-45-6789".to_string(), "us".to_string());
        assert!(json.starts_with('['));
    }
}
