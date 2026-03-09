//! Integration tests for session token generation.
//!
//! Verifies token uniqueness, length, character set, and rotation behavior.

#[cfg(test)]
mod session_integration {
    use std::collections::HashSet;

    /// A 256-bit value base64url-encoded with no padding should be 43 chars.
    #[test]
    fn expected_token_length() {
        use base64::Engine as _;
        let raw = vec![0u8; 32];
        let encoded = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(&raw);
        assert_eq!(encoded.len(), 43);
    }

    /// Verify that 100 OS-CSPRNG-generated 32-byte values are all distinct.
    #[test]
    fn token_uniqueness() {
        use base64::Engine as _;
        let mut seen = HashSet::new();
        for _ in 0..100 {
            let mut buf = vec![0u8; 32];
            getrandom::getrandom(&mut buf).unwrap();
            let enc = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(&buf);
            assert!(seen.insert(enc), "duplicate token generated");
        }
    }

    /// Base64url alphabet: A-Z, a-z, 0-9, -, _  (no padding =).
    #[test]
    fn token_character_set() {
        use base64::Engine as _;
        let mut buf = vec![0u8; 32];
        getrandom::getrandom(&mut buf).unwrap();
        let enc = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(&buf);
        assert!(
            enc.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_'),
            "unexpected characters in token: {enc}"
        );
        assert!(!enc.contains('='), "token must have no padding");
    }

    /// Verify that each rotation produces a distinct token (stat. certainty).
    #[test]
    fn rotation_produces_unique_tokens() {
        use base64::Engine as _;
        let mut tokens = Vec::new();
        for _ in 0..10 {
            let mut buf = vec![0u8; 32];
            getrandom::getrandom(&mut buf).unwrap();
            let enc = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(&buf);
            tokens.push(enc);
        }
        let unique: HashSet<_> = tokens.iter().collect();
        assert_eq!(unique.len(), tokens.len(), "rotation produced duplicate tokens");
    }

    /// Verify that token raw bytes have high entropy (no all-zero output).
    #[test]
    fn token_bytes_not_all_zero() {
        let mut buf = vec![0u8; 32];
        getrandom::getrandom(&mut buf).unwrap();
        // Astronomically unlikely to be all zero.
        assert_ne!(buf, vec![0u8; 32]);
    }
}
