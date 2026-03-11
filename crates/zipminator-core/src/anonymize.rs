//! 10-Level PII anonymization module.
//!
//! Provides increasingly aggressive anonymization strategies for text containing
//! PII, building on the detection from [`crate::pii::scan_text`].
//!
//! Levels 1-6 are fully functional. Levels 7-10 provide basic implementations
//! and are marked as requiring QRNG entropy or dataset context for production use.

use crate::pii::{scan_text, PiiMatch};
use sha2::{Digest, Sha256};

/// Anonymization aggressiveness level (1 = lightest, 10 = heaviest).
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
#[repr(u8)]
pub enum AnonymizationLevel {
    /// Return match positions only; text is unchanged.
    Highlight = 1,
    /// Replace middle characters with asterisks: `John` → `J***`.
    PartialMask = 2,
    /// Replace entire match with asterisks: `John` → `****`.
    FullMask = 3,
    /// Replace with type label: `John` → `[NAME]`.
    TypeReplace = 4,
    /// Deterministic hash pseudonym: `John` → `PII_a3f2b8`.
    HashPseudonymize = 5,
    /// Random token pseudonym: `John` → `PII_x7k9m2`.
    RandomPseudonymize = 6,
    /// Add Gaussian noise to numeric PII before masking.
    /// NOTE: production use should feed QRNG entropy.
    QuantumJitter = 7,
    /// Apply epsilon-delta noise to numeric fields.
    /// NOTE: production use requires tuned epsilon parameter.
    DifferentialPrivacy = 8,
    /// Generalize quasi-identifiers (zip → region, age → range).
    /// NOTE: production use requires a generalization hierarchy dataset.
    KAnonymity = 9,
    /// Remove PII entirely, leaving `[REDACTED]`.
    FullRedaction = 10,
}

impl AnonymizationLevel {
    /// Create from a u8 value (1-10). Returns `None` for out-of-range values.
    pub fn from_u8(v: u8) -> Option<Self> {
        match v {
            1 => Some(Self::Highlight),
            2 => Some(Self::PartialMask),
            3 => Some(Self::FullMask),
            4 => Some(Self::TypeReplace),
            5 => Some(Self::HashPseudonymize),
            6 => Some(Self::RandomPseudonymize),
            7 => Some(Self::QuantumJitter),
            8 => Some(Self::DifferentialPrivacy),
            9 => Some(Self::KAnonymity),
            10 => Some(Self::FullRedaction),
            _ => None,
        }
    }
}

/// Result of anonymization at level 1 (Highlight).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HighlightSpan {
    pub start: usize,
    pub end: usize,
    pub category: String,
    pub pattern_id: String,
}

/// Output of [`anonymize_text`].
#[derive(Debug, Clone)]
pub struct AnonymizeResult {
    /// The transformed text (unchanged for level 1).
    pub text: String,
    /// Match positions (populated for all levels).
    pub spans: Vec<HighlightSpan>,
    /// The level that was applied.
    pub level: AnonymizationLevel,
}

/// Anonymize PII in `text` at the given `level`, scanning for the specified
/// `countries` (empty slice = all countries).
///
/// The existing [`scan_text`] function is used for detection; this function
/// layers anonymization transforms on top of those matches.
pub fn anonymize_text(
    text: &str,
    level: AnonymizationLevel,
    countries: &[&str],
) -> AnonymizeResult {
    let matches = scan_text(text, countries);

    let spans: Vec<HighlightSpan> = matches
        .iter()
        .map(|m| HighlightSpan {
            start: m.start,
            end: m.end,
            category: m.category.clone(),
            pattern_id: m.pattern_id.clone(),
        })
        .collect();

    if level == AnonymizationLevel::Highlight {
        return AnonymizeResult {
            text: text.to_string(),
            spans,
            level,
        };
    }

    // Sort matches by start position descending so replacements don't shift offsets.
    let mut sorted: Vec<&PiiMatch> = matches.iter().collect();
    sorted.sort_by(|a, b| b.start.cmp(&a.start));

    let mut result = text.to_string();
    for m in &sorted {
        let replacement = apply_level(&result, m, level);
        result.replace_range(m.start..m.end, &replacement);
    }

    AnonymizeResult {
        text: result,
        spans,
        level,
    }
}

// ── Per-level transform logic ───────────────────────────────────────────────

fn apply_level(full_text: &str, m: &PiiMatch, level: AnonymizationLevel) -> String {
    match level {
        AnonymizationLevel::Highlight => m.matched_text.clone(),
        AnonymizationLevel::PartialMask => partial_mask(&m.matched_text),
        AnonymizationLevel::FullMask => "*".repeat(m.matched_text.len()),
        AnonymizationLevel::TypeReplace => category_label(&m.category),
        AnonymizationLevel::HashPseudonymize => hash_pseudonym(&m.matched_text),
        AnonymizationLevel::RandomPseudonymize => random_pseudonym(),
        AnonymizationLevel::QuantumJitter => quantum_jitter(full_text, m),
        AnonymizationLevel::DifferentialPrivacy => differential_privacy(full_text, m),
        AnonymizationLevel::KAnonymity => k_anonymity(&m.matched_text, &m.category),
        AnonymizationLevel::FullRedaction => "[REDACTED]".to_string(),
    }
}

/// Level 2: mask middle characters, preserving first and last of each word.
fn partial_mask(s: &str) -> String {
    s.split_whitespace()
        .map(|word| {
            let chars: Vec<char> = word.chars().collect();
            if chars.len() <= 2 {
                "*".repeat(chars.len())
            } else {
                let mut masked = String::with_capacity(word.len());
                masked.push(chars[0]);
                for _ in 1..chars.len() - 1 {
                    masked.push('*');
                }
                masked.push(*chars.last().unwrap());
                masked
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

/// Level 4: map category to human-readable label.
fn category_label(category: &str) -> String {
    match category {
        "national_id" => "[NATIONAL_ID]",
        "financial" => "[FINANCIAL]",
        "contact" => "[CONTACT]",
        "health" => "[HEALTH]",
        "biometric" => "[BIOMETRIC]",
        "address" => "[ADDRESS]",
        "government" => "[GOVERNMENT]",
        _ => "[PII]",
    }
    .to_string()
}

/// Level 5: deterministic SHA-256-based pseudonym (first 6 hex chars).
fn hash_pseudonym(matched: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(matched.as_bytes());
    let hash = hasher.finalize();
    format!("PII_{:02x}{:02x}{:02x}", hash[0], hash[1], hash[2])
}

/// Level 6: random 6-char hex pseudonym.
fn random_pseudonym() -> String {
    let mut buf = [0u8; 3];
    getrandom::getrandom(&mut buf).expect("getrandom failed");
    format!("PII_{:02x}{:02x}{:02x}", buf[0], buf[1], buf[2])
}

/// Level 7: add jitter to numeric PII; non-numeric falls back to full mask.
fn quantum_jitter(_full_text: &str, m: &PiiMatch) -> String {
    // Extract numeric value if present
    let digits: String = m.matched_text.chars().filter(|c| c.is_ascii_digit()).collect();
    if digits.is_empty() || digits.len() > 18 {
        return "*".repeat(m.matched_text.len()); // fallback
    }
    if let Ok(val) = digits.parse::<i64>() {
        // Gaussian-ish noise via Box-Muller with OS randomness.
        // Production: replace getrandom with QRNG entropy.
        let mut buf = [0u8; 8];
        getrandom::getrandom(&mut buf).expect("getrandom failed");
        let u1 = (u32::from_le_bytes([buf[0], buf[1], buf[2], buf[3]]) as f64) / u32::MAX as f64;
        let u2 = (u32::from_le_bytes([buf[4], buf[5], buf[6], buf[7]]) as f64) / u32::MAX as f64;
        let u1 = u1.max(1e-10); // avoid log(0)
        let z = (-2.0 * u1.ln()).sqrt() * (2.0 * std::f64::consts::PI * u2).cos();
        // Scale noise proportional to magnitude (10% stddev)
        let sigma = (val as f64 * 0.1).max(1.0);
        let noisy = val as f64 + z * sigma;
        format!("{}", noisy.round() as i64)
    } else {
        "*".repeat(m.matched_text.len())
    }
}

/// Level 8: epsilon-delta differential privacy noise on numeric PII.
fn differential_privacy(_full_text: &str, m: &PiiMatch) -> String {
    let digits: String = m.matched_text.chars().filter(|c| c.is_ascii_digit()).collect();
    if digits.is_empty() || digits.len() > 18 {
        return "[DP_REDACTED]".to_string();
    }
    if let Ok(val) = digits.parse::<i64>() {
        // Laplace noise with epsilon=1.0 (production: tune per use-case)
        let epsilon = 1.0_f64;
        let sensitivity = (val as f64 * 0.1).max(1.0);
        let scale = sensitivity / epsilon;
        let mut buf = [0u8; 4];
        getrandom::getrandom(&mut buf).expect("getrandom failed");
        let u = (u32::from_le_bytes(buf) as f64 / u32::MAX as f64) - 0.5;
        let noise = -scale * u.abs().max(1e-10).ln() * u.signum();
        format!("{}", (val as f64 + noise).round() as i64)
    } else {
        "[DP_REDACTED]".to_string()
    }
}

/// Level 9: generalize quasi-identifiers.
fn k_anonymity(matched: &str, category: &str) -> String {
    match category {
        // Zip/postal codes → first 3 digits + "**"
        "address" => {
            let digits: String = matched.chars().filter(|c| c.is_ascii_digit()).collect();
            if digits.len() >= 3 {
                format!("{}**", &digits[..3])
            } else {
                "[REGION]".to_string()
            }
        }
        // Ages/dates → decade range
        "national_id" | "government" => "[GENERALIZED_ID]".to_string(),
        // Financial → order of magnitude
        "financial" => "[FINANCIAL_RANGE]".to_string(),
        _ => "[GENERALIZED]".to_string(),
    }
}

// ── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    // Helper: text with known PII that scan_text reliably detects
    const TEXT_SSN: &str = "SSN: 123-45-6789";
    const TEXT_EMAIL: &str = "mail: test@example.com";
    const TEXT_PHONE: &str = "call 555-123-4567";

    // ── Level 1: Highlight ──────────────────────────────────────────────────

    #[test]
    fn level1_highlight_returns_unmodified_text() {
        let r = anonymize_text(TEXT_SSN, AnonymizationLevel::Highlight, &["us"]);
        assert_eq!(r.text, TEXT_SSN, "Highlight must not modify text");
        assert!(!r.spans.is_empty(), "Should report match spans");
    }

    // ── Level 2: Partial Mask ───────────────────────────────────────────────

    #[test]
    fn level2_partial_mask_preserves_edges() {
        let masked = partial_mask("John");
        assert_eq!(masked, "J**n");
    }

    #[test]
    fn level2_partial_mask_short_word() {
        assert_eq!(partial_mask("AB"), "**");
    }

    #[test]
    fn level2_partial_mask_multi_word() {
        let masked = partial_mask("John Smith");
        assert_eq!(masked, "J**n S***h");
    }

    #[test]
    fn level2_applied_to_ssn() {
        let r = anonymize_text(TEXT_SSN, AnonymizationLevel::PartialMask, &["us"]);
        // SSN "123-45-6789" is one token (no spaces) → first and last preserved
        assert!(r.text.contains("1"), "First char preserved");
        assert!(!r.text.contains("123-45-6789"), "Original SSN must be gone");
    }

    // ── Level 3: Full Mask ──────────────────────────────────────────────────

    #[test]
    fn level3_full_mask() {
        let r = anonymize_text(TEXT_SSN, AnonymizationLevel::FullMask, &["us"]);
        assert!(!r.text.contains("123"), "SSN digits must be masked");
        assert!(r.text.contains("***"), "Should contain asterisks");
    }

    // ── Level 4: Type Replace ───────────────────────────────────────────────

    #[test]
    fn level4_type_replace_ssn() {
        let r = anonymize_text(TEXT_SSN, AnonymizationLevel::TypeReplace, &["us"]);
        assert!(
            r.text.contains("[NATIONAL_ID]"),
            "SSN should become [NATIONAL_ID], got: {}",
            r.text
        );
    }

    #[test]
    fn level4_type_replace_email() {
        let r = anonymize_text(TEXT_EMAIL, AnonymizationLevel::TypeReplace, &["us"]);
        assert!(
            r.text.contains("[CONTACT]"),
            "Email should become [CONTACT], got: {}",
            r.text
        );
    }

    // ── Level 5: Hash Pseudonymize ──────────────────────────────────────────

    #[test]
    fn level5_hash_is_deterministic() {
        let a = hash_pseudonym("123-45-6789");
        let b = hash_pseudonym("123-45-6789");
        assert_eq!(a, b, "Same input must produce same hash");
        assert!(a.starts_with("PII_"), "Must start with PII_ prefix");
        assert_eq!(a.len(), 10, "PII_ + 6 hex chars = 10");
    }

    #[test]
    fn level5_different_inputs_differ() {
        let a = hash_pseudonym("123-45-6789");
        let b = hash_pseudonym("987-65-4321");
        assert_ne!(a, b);
    }

    #[test]
    fn level5_applied_to_text() {
        let r = anonymize_text(TEXT_SSN, AnonymizationLevel::HashPseudonymize, &["us"]);
        assert!(r.text.contains("PII_"), "Should contain PII_ pseudonym");
        assert!(!r.text.contains("123-45-6789"), "Original SSN must be gone");
    }

    // ── Level 6: Random Pseudonymize ────────────────────────────────────────

    #[test]
    fn level6_random_pseudonym_format() {
        let p = random_pseudonym();
        assert!(p.starts_with("PII_"), "Must start with PII_");
        assert_eq!(p.len(), 10, "PII_ + 6 hex chars = 10");
    }

    #[test]
    fn level6_applied_to_text() {
        let r = anonymize_text(TEXT_SSN, AnonymizationLevel::RandomPseudonymize, &["us"]);
        assert!(r.text.contains("PII_"), "Should contain PII_ pseudonym");
        assert!(!r.text.contains("123-45-6789"), "Original SSN must be gone");
    }

    // ── Level 7: Quantum Jitter ─────────────────────────────────────────────

    #[test]
    fn level7_jitter_produces_different_number() {
        // Run multiple times; at least one should differ from original
        let original = "123456789";
        let mut found_different = false;
        for _ in 0..20 {
            let m = PiiMatch {
                pattern_id: "test".into(),
                pattern_name: "test".into(),
                category: "national_id".into(),
                matched_text: original.into(),
                start: 0,
                end: original.len(),
                sensitivity: 5,
                country_code: "us".into(),
            };
            let result = quantum_jitter("", &m);
            if result != original {
                found_different = true;
                break;
            }
        }
        assert!(found_different, "Jitter should produce a different number");
    }

    // ── Level 8: Differential Privacy ───────────────────────────────────────

    #[test]
    fn level8_dp_produces_number() {
        let m = PiiMatch {
            pattern_id: "test".into(),
            pattern_name: "test".into(),
            category: "financial".into(),
            matched_text: "50000".into(),
            start: 0,
            end: 5,
            sensitivity: 3,
            country_code: "us".into(),
        };
        let result = differential_privacy("", &m);
        // Should be parseable as a number
        assert!(
            result.parse::<i64>().is_ok(),
            "DP result should be numeric, got: {}",
            result
        );
    }

    // ── Level 9: k-Anonymity ────────────────────────────────────────────────

    #[test]
    fn level9_generalizes_address() {
        let result = k_anonymity("90210", "address");
        assert_eq!(result, "902**");
    }

    #[test]
    fn level9_generalizes_financial() {
        let result = k_anonymity("4532015112830366", "financial");
        assert_eq!(result, "[FINANCIAL_RANGE]");
    }

    // ── Level 10: Full Redaction ────────────────────────────────────────────

    #[test]
    fn level10_full_redaction() {
        let r = anonymize_text(TEXT_SSN, AnonymizationLevel::FullRedaction, &["us"]);
        assert!(
            r.text.contains("[REDACTED]"),
            "Should contain [REDACTED], got: {}",
            r.text
        );
        assert!(!r.text.contains("123"), "No SSN digits should remain");
    }

    // ── Level enum ──────────────────────────────────────────────────────────

    #[test]
    fn level_from_u8_valid() {
        for v in 1..=10u8 {
            assert!(AnonymizationLevel::from_u8(v).is_some(), "Level {} must parse", v);
        }
    }

    #[test]
    fn level_from_u8_invalid() {
        assert!(AnonymizationLevel::from_u8(0).is_none());
        assert!(AnonymizationLevel::from_u8(11).is_none());
    }

    #[test]
    fn level_ordering() {
        assert!(AnonymizationLevel::Highlight < AnonymizationLevel::FullRedaction);
        assert!(AnonymizationLevel::PartialMask < AnonymizationLevel::FullMask);
    }

    // ── Integration: all levels produce non-empty output ────────────────────

    #[test]
    fn all_levels_produce_output() {
        for v in 1..=10u8 {
            let level = AnonymizationLevel::from_u8(v).unwrap();
            let r = anonymize_text(TEXT_SSN, level, &["us"]);
            assert!(!r.text.is_empty(), "Level {} produced empty output", v);
        }
    }
}
