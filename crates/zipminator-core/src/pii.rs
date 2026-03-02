//! PII (Personally Identifiable Information) scanning module.
//!
//! Provides regex-based pattern matching for detecting PII in freetext across
//! multiple countries (US, UK, UAE). Patterns are loaded from the embedded JSON
//! file generated from the Python pattern definitions.
//!
//! # Targets
//!
//! This module compiles for both native and WASM targets. No OS-specific
//! dependencies are used.
//!
//! # Usage
//!
//! ```rust,ignore
//! use zipminator_core::pii::{scan_text, PiiMatch};
//!
//! let matches = scan_text("Call me at 555-123-4567", &["us"]);
//! assert!(!matches.is_empty());
//! ```

use std::sync::OnceLock;

// ── Pattern JSON embedded at compile time ────────────────────────────────────

const PATTERNS_JSON: &str = include_str!(
    "../../../src/zipminator/crypto/patterns/patterns.json"
);

// ── Types ────────────────────────────────────────────────────────────────────

/// A single PII match found in scanned text.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PiiMatch {
    /// Pattern identifier (e.g. "us_ssn", "uk_credit_card")
    pub pattern_id: String,
    /// Human-readable pattern name
    pub pattern_name: String,
    /// PII category (e.g. "national_id", "financial", "contact")
    pub category: String,
    /// The matched text substring
    pub matched_text: String,
    /// Byte offset of match start in the input
    pub start: usize,
    /// Byte offset of match end in the input
    pub end: usize,
    /// Sensitivity level (1-5, 5 = most sensitive)
    pub sensitivity: u8,
    /// ISO country code (e.g. "us", "uk", "ae")
    pub country_code: String,
}

/// Deserialized pattern definition from the embedded JSON.
#[derive(Debug, Clone)]
struct PatternDef {
    id: String,
    name: String,
    category: String,
    country_code: String,
    compiled: regex::Regex,
    sensitivity: u8,
    has_validator: bool,
    validator_type: Option<String>,
}

// ── Pattern registry (singleton) ─────────────────────────────────────────────

/// Thread-safe singleton of compiled patterns.
fn pattern_registry() -> &'static Vec<PatternDef> {
    static REGISTRY: OnceLock<Vec<PatternDef>> = OnceLock::new();
    REGISTRY.get_or_init(|| parse_patterns_json(PATTERNS_JSON))
}

/// Parse the embedded JSON into compiled pattern definitions.
///
/// Uses a minimal hand-rolled JSON parser to avoid requiring serde as a
/// non-optional dependency. The JSON structure is simple and well-known.
fn parse_patterns_json(json: &str) -> Vec<PatternDef> {
    // We parse the JSON manually to keep serde optional.
    // The format is: { "patterns": [ { fields... }, ... ] }
    let mut defs = Vec::new();

    // Find the "patterns" array
    let patterns_start = match json.find("\"patterns\"") {
        Some(pos) => pos,
        None => return defs,
    };

    // Find the opening bracket of the array
    let arr_start = match json[patterns_start..].find('[') {
        Some(pos) => patterns_start + pos,
        None => return defs,
    };

    // Extract individual pattern objects by tracking brace depth
    let bytes = json.as_bytes();
    let mut i = arr_start + 1;
    while i < bytes.len() {
        // Skip whitespace
        while i < bytes.len() && (bytes[i] == b' ' || bytes[i] == b'\n' || bytes[i] == b'\r' || bytes[i] == b'\t' || bytes[i] == b',') {
            i += 1;
        }
        if i >= bytes.len() || bytes[i] == b']' {
            break;
        }
        if bytes[i] == b'{' {
            let obj_start = i;
            let mut depth = 1;
            i += 1;
            while i < bytes.len() && depth > 0 {
                match bytes[i] {
                    b'{' => depth += 1,
                    b'}' => depth -= 1,
                    b'"' => {
                        // Skip string contents (handle escapes)
                        i += 1;
                        while i < bytes.len() && bytes[i] != b'"' {
                            if bytes[i] == b'\\' { i += 1; }
                            i += 1;
                        }
                    }
                    _ => {}
                }
                i += 1;
            }
            let obj_str = &json[obj_start..i];
            if let Some(def) = parse_single_pattern(obj_str) {
                defs.push(def);
            }
        } else {
            i += 1;
        }
    }

    defs
}

/// Extract a JSON string value for the given key from a JSON object string.
fn extract_json_string<'a>(obj: &'a str, key: &str) -> Option<&'a str> {
    let search = format!("\"{}\"", key);
    let key_pos = obj.find(&search)?;
    let after_key = &obj[key_pos + search.len()..];
    // Skip ':'  and whitespace
    let colon_pos = after_key.find(':')?;
    let after_colon = after_key[colon_pos + 1..].trim_start();

    if after_colon.starts_with("null") {
        return None;
    }
    if !after_colon.starts_with('"') {
        return None;
    }

    let val_start = 1; // skip opening quote
    let rest = &after_colon[val_start..];

    // Find closing quote, respecting escapes
    let mut end = 0;
    let rest_bytes = rest.as_bytes();
    while end < rest_bytes.len() {
        if rest_bytes[end] == b'\\' {
            end += 2;
            continue;
        }
        if rest_bytes[end] == b'"' {
            break;
        }
        end += 1;
    }

    Some(&rest[..end])
}

/// Extract a JSON integer value for the given key.
fn extract_json_int(obj: &str, key: &str) -> Option<u8> {
    let search = format!("\"{}\"", key);
    let key_pos = obj.find(&search)?;
    let after_key = &obj[key_pos + search.len()..];
    let colon_pos = after_key.find(':')?;
    let after_colon = after_key[colon_pos + 1..].trim_start();

    // Read digits
    let digits: String = after_colon.chars().take_while(|c| c.is_ascii_digit()).collect();
    digits.parse().ok()
}

/// Extract a JSON boolean value for the given key.
fn extract_json_bool(obj: &str, key: &str) -> Option<bool> {
    let search = format!("\"{}\"", key);
    let key_pos = obj.find(&search)?;
    let after_key = &obj[key_pos + search.len()..];
    let colon_pos = after_key.find(':')?;
    let after_colon = after_key[colon_pos + 1..].trim_start();

    if after_colon.starts_with("true") {
        Some(true)
    } else if after_colon.starts_with("false") {
        Some(false)
    } else {
        None
    }
}

/// Parse a single JSON object into a PatternDef.
fn parse_single_pattern(obj: &str) -> Option<PatternDef> {
    let id = extract_json_string(obj, "id")?;
    let name = extract_json_string(obj, "name")?;
    let category = extract_json_string(obj, "category")?;
    let country_code = extract_json_string(obj, "country_code")?;
    let regex_str = extract_json_string(obj, "regex")?;
    let sensitivity = extract_json_int(obj, "sensitivity").unwrap_or(3);
    let has_validator = extract_json_bool(obj, "has_validator").unwrap_or(false);
    let validator_type = extract_json_string(obj, "validator_type").map(|s| s.to_string());

    // Unescape JSON regex escapes: the JSON has \\b which needs to become \b
    let unescaped = unescape_json_regex(regex_str);

    let compiled = regex::Regex::new(&unescaped).ok()?;

    Some(PatternDef {
        id: id.to_string(),
        name: name.to_string(),
        category: category.to_string(),
        country_code: country_code.to_string(),
        compiled,
        sensitivity,
        has_validator,
        validator_type,
    })
}

/// Unescape JSON string escapes in a regex pattern.
/// Converts \\b -> \b, \\d -> \d, \\s -> \s, \\\\ -> \\, etc.
fn unescape_json_regex(s: &str) -> String {
    let mut result = String::with_capacity(s.len());
    let mut chars = s.chars();
    while let Some(c) = chars.next() {
        if c == '\\' {
            if let Some(next) = chars.next() {
                match next {
                    '\\' => result.push('\\'),
                    _ => {
                        result.push('\\');
                        result.push(next);
                    }
                }
            }
        } else {
            result.push(c);
        }
    }
    result
}

// ── Validators ───────────────────────────────────────────────────────────────

/// Luhn checksum validation for credit card numbers.
///
/// Returns `true` if the digit string passes the Luhn algorithm.
pub fn luhn_validate(number: &str) -> bool {
    let digits: Vec<u8> = number
        .chars()
        .filter(|c| c.is_ascii_digit())
        .map(|c| c as u8 - b'0')
        .collect();

    if digits.len() < 2 {
        return false;
    }

    let mut sum: u32 = 0;
    let mut double = false;

    for &d in digits.iter().rev() {
        let mut val = d as u32;
        if double {
            val *= 2;
            if val > 9 {
                val -= 9;
            }
        }
        sum += val;
        double = !double;
    }

    sum % 10 == 0
}

/// Basic US SSN format validator.
///
/// Checks area (001-899 excl. 666), group (01-99), serial (0001-9999).
fn validate_us_ssn(raw: &str) -> bool {
    let digits: String = raw.chars().filter(|c| c.is_ascii_digit()).collect();
    if digits.len() != 9 {
        return false;
    }

    let area: u16 = digits[0..3].parse().unwrap_or(0);
    let group: u16 = digits[3..5].parse().unwrap_or(0);
    let serial: u16 = digits[5..9].parse().unwrap_or(0);

    area >= 1 && area != 666 && area < 900 && group >= 1 && serial >= 1
}

/// Basic US phone number format validator.
///
/// Ensures 10 digits are present after stripping formatting.
fn validate_us_phone(raw: &str) -> bool {
    let digits: String = raw.chars().filter(|c| c.is_ascii_digit()).collect();
    // With +1 prefix: 11 digits; without: 10 digits
    digits.len() == 10 || digits.len() == 11
}

/// Apply the appropriate validator for a match based on validator_type.
fn apply_validator(validator_type: &Option<String>, matched: &str) -> bool {
    match validator_type.as_deref() {
        Some("luhn") => luhn_validate(matched),
        Some("us_ssn") => validate_us_ssn(matched),
        // Validators that are format-checked by regex alone
        Some("us_ein") | Some("uk_ni") | Some("nhs_mod11") => true,
        _ => true,
    }
}

// ── Public API ───────────────────────────────────────────────────────────────

/// Scan text for PII patterns, optionally filtering by country codes.
///
/// # Arguments
///
/// * `text` - The text to scan for PII
/// * `countries` - Country codes to filter by (e.g. `["us", "uk"]`).
///                 An empty slice means scan all registered countries.
///
/// # Returns
///
/// A vector of `PiiMatch` instances for all detected PII.
pub fn scan_text(text: &str, countries: &[&str]) -> Vec<PiiMatch> {
    let registry = pattern_registry();
    let mut matches = Vec::new();

    for pattern in registry.iter() {
        // Filter by country if specified
        if !countries.is_empty() && !countries.contains(&pattern.country_code.as_str()) {
            continue;
        }

        for m in pattern.compiled.find_iter(text) {
            let matched_text = m.as_str();

            // Apply validator if the pattern has one
            if pattern.has_validator && !apply_validator(&pattern.validator_type, matched_text) {
                continue;
            }

            matches.push(PiiMatch {
                pattern_id: pattern.id.clone(),
                pattern_name: pattern.name.clone(),
                category: pattern.category.clone(),
                matched_text: matched_text.to_string(),
                start: m.start(),
                end: m.end(),
                sensitivity: pattern.sensitivity,
                country_code: pattern.country_code.clone(),
            });
        }
    }

    matches
}

/// Serialize PII scan results as a JSON string.
///
/// Produces a JSON array where each element has the fields of `PiiMatch`.
/// This is used by the FFI layer to return results to callers.
pub fn matches_to_json(matches: &[PiiMatch]) -> String {
    let mut json = String::from("[");
    for (i, m) in matches.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push('{');
        json.push_str(&format!(
            "\"pattern_id\":\"{}\",\
             \"pattern_name\":\"{}\",\
             \"category\":\"{}\",\
             \"matched_text\":\"{}\",\
             \"start\":{},\
             \"end\":{},\
             \"sensitivity\":{},\
             \"country_code\":\"{}\"",
            escape_json_string(&m.pattern_id),
            escape_json_string(&m.pattern_name),
            escape_json_string(&m.category),
            escape_json_string(&m.matched_text),
            m.start,
            m.end,
            m.sensitivity,
            escape_json_string(&m.country_code),
        ));
        json.push('}');
    }
    json.push(']');
    json
}

/// Escape special characters for JSON string values.
fn escape_json_string(s: &str) -> String {
    let mut escaped = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '"' => escaped.push_str("\\\""),
            '\\' => escaped.push_str("\\\\"),
            '\n' => escaped.push_str("\\n"),
            '\r' => escaped.push_str("\\r"),
            '\t' => escaped.push_str("\\t"),
            c if (c as u32) < 0x20 => {
                escaped.push_str(&format!("\\u{:04x}", c as u32));
            }
            _ => escaped.push(c),
        }
    }
    escaped
}

// ── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    // ── Pattern loading ──────────────────────────────────────────────────────

    #[test]
    fn test_patterns_load_successfully() {
        let registry = pattern_registry();
        assert!(
            registry.len() >= 30,
            "Expected at least 30 patterns, got {}",
            registry.len()
        );
    }

    #[test]
    fn test_patterns_cover_all_countries() {
        let registry = pattern_registry();
        let countries: Vec<&str> = registry.iter().map(|p| p.country_code.as_str()).collect();
        assert!(countries.contains(&"us"), "Must have US patterns");
        assert!(countries.contains(&"uk"), "Must have UK patterns");
        assert!(countries.contains(&"ae"), "Must have UAE patterns");
    }

    // ── Credit card detection with Luhn ──────────────────────────────────────

    #[test]
    fn test_credit_card_valid_luhn() {
        // Visa test number that passes Luhn
        let text = "My card is 4532015112830366 thanks";
        let matches = scan_text(text, &["us"]);
        let cc_matches: Vec<_> = matches
            .iter()
            .filter(|m| m.category == "financial" && m.pattern_id == "us_credit_card")
            .collect();
        assert!(
            !cc_matches.is_empty(),
            "Should detect valid credit card number"
        );
    }

    #[test]
    fn test_credit_card_invalid_luhn() {
        // Number that fails Luhn (last digit changed)
        let text = "Bad card 4532015112830361";
        let matches = scan_text(text, &["us"]);
        let cc_matches: Vec<_> = matches
            .iter()
            .filter(|m| m.pattern_id == "us_credit_card")
            .collect();
        assert!(
            cc_matches.is_empty(),
            "Should reject credit card failing Luhn: {:?}",
            cc_matches
        );
    }

    #[test]
    fn test_credit_card_with_spaces() {
        let text = "Card: 4532 0151 1283 0366";
        let matches = scan_text(text, &["us"]);
        let cc_matches: Vec<_> = matches
            .iter()
            .filter(|m| m.pattern_id == "us_credit_card")
            .collect();
        assert!(!cc_matches.is_empty(), "Should detect card with spaces");
    }

    #[test]
    fn test_credit_card_with_dashes() {
        let text = "Card: 4532-0151-1283-0366";
        let matches = scan_text(text, &["us"]);
        let cc_matches: Vec<_> = matches
            .iter()
            .filter(|m| m.pattern_id == "us_credit_card")
            .collect();
        assert!(!cc_matches.is_empty(), "Should detect card with dashes");
    }

    // ── SSN format detection ─────────────────────────────────────────────────

    #[test]
    fn test_ssn_valid_format() {
        let text = "SSN: 123-45-6789";
        let matches = scan_text(text, &["us"]);
        let ssn_matches: Vec<_> = matches
            .iter()
            .filter(|m| m.pattern_id == "us_ssn")
            .collect();
        assert!(!ssn_matches.is_empty(), "Should detect valid SSN");
        assert_eq!(ssn_matches[0].sensitivity, 5);
    }

    #[test]
    fn test_ssn_invalid_area_zero() {
        let text = "SSN: 000-12-3456";
        let matches = scan_text(text, &["us"]);
        let ssn_matches: Vec<_> = matches
            .iter()
            .filter(|m| m.pattern_id == "us_ssn")
            .collect();
        assert!(
            ssn_matches.is_empty(),
            "Should reject SSN with area 000"
        );
    }

    #[test]
    fn test_ssn_invalid_area_666() {
        let text = "SSN: 666-12-3456";
        let matches = scan_text(text, &["us"]);
        let ssn_matches: Vec<_> = matches
            .iter()
            .filter(|m| m.pattern_id == "us_ssn")
            .collect();
        assert!(
            ssn_matches.is_empty(),
            "Should reject SSN with area 666"
        );
    }

    #[test]
    fn test_ssn_without_dashes() {
        let text = "SSN 123456789 here";
        let matches = scan_text(text, &["us"]);
        let ssn_matches: Vec<_> = matches
            .iter()
            .filter(|m| m.pattern_id == "us_ssn")
            .collect();
        assert!(!ssn_matches.is_empty(), "Should detect SSN without dashes");
    }

    // ── Phone number patterns ────────────────────────────────────────────────

    #[test]
    fn test_us_phone_standard() {
        let text = "Call me at 555-123-4567";
        let matches = scan_text(text, &["us"]);
        let phone_matches: Vec<_> = matches
            .iter()
            .filter(|m| m.pattern_id == "us_phone")
            .collect();
        assert!(!phone_matches.is_empty(), "Should detect US phone number");
    }

    #[test]
    fn test_us_phone_compact() {
        // Compact 10-digit format: word boundary works with digit start/end
        let text = "Number: 5551234567 here";
        let matches = scan_text(text, &["us"]);
        let phone_matches: Vec<_> = matches
            .iter()
            .filter(|m| m.pattern_id == "us_phone")
            .collect();
        assert!(!phone_matches.is_empty(), "Should detect US phone (10 digits)");
    }

    #[test]
    fn test_uk_phone() {
        // UK phone with leading 0 (word boundary works with digits)
        let text = "Ring me on 020 1234 5678";
        let matches = scan_text(text, &["uk"]);
        let phone_matches: Vec<_> = matches
            .iter()
            .filter(|m| m.pattern_id == "uk_phone")
            .collect();
        assert!(!phone_matches.is_empty(), "Should detect UK phone number");
    }

    // ── Multi-country scanning ───────────────────────────────────────────────

    #[test]
    fn test_multi_country_scan() {
        let text = "My email is test@example.com and SSN 123-45-6789";
        let matches = scan_text(text, &["us", "uk"]);
        assert!(
            matches.len() >= 2,
            "Should find matches across multiple countries, got {}",
            matches.len()
        );
    }

    #[test]
    fn test_country_filter() {
        let text = "Email: user@example.com SSN: 123-45-6789";
        let us_only = scan_text(text, &["us"]);
        let uk_only = scan_text(text, &["uk"]);

        let us_ssn: Vec<_> = us_only.iter().filter(|m| m.pattern_id == "us_ssn").collect();
        let uk_ssn: Vec<_> = uk_only.iter().filter(|m| m.pattern_id == "us_ssn").collect();

        assert!(!us_ssn.is_empty(), "US scan should find SSN");
        assert!(uk_ssn.is_empty(), "UK scan should not find US SSN");
    }

    #[test]
    fn test_all_countries_when_empty_filter() {
        let text = "Email: user@example.com";
        let matches = scan_text(text, &[]);
        // Email patterns exist in US, UK, and UAE
        let email_matches: Vec<_> = matches
            .iter()
            .filter(|m| m.category == "contact")
            .collect();
        assert!(
            email_matches.len() >= 3,
            "Empty filter should scan all countries, found {} email matches",
            email_matches.len()
        );
    }

    // ── Empty / no-match cases ───────────────────────────────────────────────

    #[test]
    fn test_empty_text() {
        let matches = scan_text("", &["us"]);
        assert!(matches.is_empty(), "Empty text should produce no matches");
    }

    #[test]
    fn test_no_pii_text() {
        let text = "The quick brown fox jumps over the lazy dog.";
        let matches = scan_text(text, &["us"]);
        // Some generic patterns (like bank_account matching any 8-17 digits) may
        // match incidentally; filter for high-sensitivity only
        let high_sens: Vec<_> = matches.iter().filter(|m| m.sensitivity >= 4).collect();
        assert!(
            high_sens.is_empty(),
            "Innocuous text should not trigger high-sensitivity PII"
        );
    }

    // ── Match position tracking ──────────────────────────────────────────────

    #[test]
    fn test_match_positions() {
        let text = "prefix 123-45-6789 suffix";
        let matches = scan_text(text, &["us"]);
        let ssn = matches.iter().find(|m| m.pattern_id == "us_ssn");
        assert!(ssn.is_some(), "Should find SSN");
        let ssn = ssn.unwrap();
        assert_eq!(&text[ssn.start..ssn.end], "123-45-6789");
    }

    // ── UAE patterns ─────────────────────────────────────────────────────────

    #[test]
    fn test_uae_iban() {
        let text = "Transfer to AE070331234567890123456";
        let matches = scan_text(text, &["ae"]);
        let iban_matches: Vec<_> = matches
            .iter()
            .filter(|m| m.pattern_id == "ae_iban")
            .collect();
        assert!(!iban_matches.is_empty(), "Should detect UAE IBAN");
    }

    #[test]
    fn test_uae_po_box() {
        let text = "Send to P.O. Box 12345";
        let matches = scan_text(text, &["ae"]);
        let po_matches: Vec<_> = matches
            .iter()
            .filter(|m| m.pattern_id == "ae_po_box")
            .collect();
        assert!(!po_matches.is_empty(), "Should detect UAE P.O. Box");
    }

    // ── Luhn validator unit tests ────────────────────────────────────────────

    #[test]
    fn test_luhn_valid_numbers() {
        assert!(luhn_validate("4532015112830366")); // Visa
        assert!(luhn_validate("5425233430109903")); // Mastercard
        assert!(luhn_validate("79927398713"));       // Standard test
    }

    #[test]
    fn test_luhn_invalid_numbers() {
        assert!(!luhn_validate("4532015112830361")); // Bad check digit
        assert!(!luhn_validate("1234567890123456")); // Random
        assert!(!luhn_validate("0"));                 // Too short
        assert!(!luhn_validate(""));                  // Empty
    }

    // ── JSON serialization ───────────────────────────────────────────────────

    #[test]
    fn test_matches_to_json_empty() {
        let json = matches_to_json(&[]);
        assert_eq!(json, "[]");
    }

    #[test]
    fn test_matches_to_json_single() {
        let m = PiiMatch {
            pattern_id: "us_ssn".to_string(),
            pattern_name: "US SSN".to_string(),
            category: "national_id".to_string(),
            matched_text: "123-45-6789".to_string(),
            start: 0,
            end: 11,
            sensitivity: 5,
            country_code: "us".to_string(),
        };
        let json = matches_to_json(&[m]);
        assert!(json.contains("\"pattern_id\":\"us_ssn\""));
        assert!(json.contains("\"start\":0"));
        assert!(json.contains("\"sensitivity\":5"));
    }

    // ── SSN validator unit tests ─────────────────────────────────────────────

    #[test]
    fn test_validate_ssn_valid() {
        assert!(validate_us_ssn("123-45-6789"));
        assert!(validate_us_ssn("123456789"));
    }

    #[test]
    fn test_validate_ssn_invalid() {
        assert!(!validate_us_ssn("000-12-3456")); // area 000
        assert!(!validate_us_ssn("666-12-3456")); // area 666
        assert!(!validate_us_ssn("900-12-3456")); // area >= 900
        assert!(!validate_us_ssn("123-00-3456")); // group 00
        assert!(!validate_us_ssn("123-45-0000")); // serial 0000
    }

    // ── Phone validator unit tests ───────────────────────────────────────────

    #[test]
    fn test_validate_us_phone() {
        assert!(validate_us_phone("5551234567"));
        assert!(validate_us_phone("+1 555-123-4567"));
        assert!(validate_us_phone("(555) 123-4567"));
        assert!(!validate_us_phone("123")); // too short
    }
}
