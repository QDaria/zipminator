//! Platform-agnostic API for the Zipminator PQC super-app.
//!
//! This crate wraps `zipminator-core` with safe Rust types suitable for
//! automatic binding generation via `flutter_rust_bridge` v2.
//!
//! **Design rule**: Only `Vec<u8>`, `String`, `Result`, standard primitives,
//! and simple structs cross the public API. No raw pointers, no opaque handles.

pub mod crypto;
pub mod email;
pub mod pii;
pub mod ratchet;
pub mod srtp;

/// Library version string.
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version() {
        let v = version();
        assert!(!v.is_empty());
    }
}
