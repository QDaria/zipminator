//! Safe wrappers for PQ-SRTP key derivation.

/// SRTP key material derived from a Kyber shared secret.
pub struct SrtpKeys {
    /// AES-128-CM master key (16 bytes)
    pub master_key: Vec<u8>,
    /// SRTP master salt (14 bytes)
    pub master_salt: Vec<u8>,
}

/// Derive SRTP key material from a 32-byte Kyber shared secret.
///
/// Returns the master key (16 bytes) and master salt (14 bytes).
pub fn derive_srtp_keys(shared_secret: Vec<u8>) -> Result<SrtpKeys, String> {
    if shared_secret.len() != 32 {
        return Err(format!(
            "shared secret must be 32 bytes, got {}",
            shared_secret.len()
        ));
    }
    let ss: [u8; 32] = shared_secret.try_into().unwrap();
    let material = zipminator_core::srtp::derive_srtp_keys(&ss);
    Ok(SrtpKeys {
        master_key: material.master_key.to_vec(),
        master_salt: material.master_salt.to_vec(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_srtp_key_derivation() {
        let ss = vec![0xABu8; 32];
        let keys = derive_srtp_keys(ss).expect("derive");
        assert_eq!(keys.master_key.len(), 16);
        assert_eq!(keys.master_salt.len(), 14);
    }

    #[test]
    fn test_srtp_deterministic() {
        let ss = vec![0x42u8; 32];
        let k1 = derive_srtp_keys(ss.clone()).unwrap();
        let k2 = derive_srtp_keys(ss).unwrap();
        assert_eq!(k1.master_key, k2.master_key);
        assert_eq!(k1.master_salt, k2.master_salt);
    }

    #[test]
    fn test_srtp_wrong_size_rejected() {
        assert!(derive_srtp_keys(vec![0u8; 16]).is_err());
    }
}
