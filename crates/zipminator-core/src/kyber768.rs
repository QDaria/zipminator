//! CRYSTALS-Kyber-768 core implementation
//!
//! Implements:
//! - KeyGen: Generate public/secret key pair
//! - Encaps: Encapsulate shared secret with public key
//! - Decaps: Decapsulate ciphertext with secret key

use crate::constants::*;
use crate::poly::{Poly, PolyVec};
use crate::utils::*;
use subtle::ConstantTimeEq;
use zeroize::Zeroize;

/// Public key structure
#[derive(Clone)]
pub struct PublicKey {
    pub data: Vec<u8>,
}

impl PublicKey {
    /// Create a PublicKey from bytes
    pub fn from_bytes(bytes: &[u8]) -> Result<Self, &'static str> {
        if bytes.len() != KYBER768_PUBLICKEYBYTES {
            return Err("Invalid public key size");
        }
        Ok(PublicKey {
            data: bytes.to_vec(),
        })
    }
}

/// Secret key structure
///
/// The internal data is private to prevent accidental exposure.
/// Use `as_bytes()` / `from_bytes()` for serialization.
/// The data is zeroized on drop to prevent secret key material from lingering in memory.
#[derive(Clone)]
pub struct SecretKey {
    data: Vec<u8>,
}

impl SecretKey {
    /// Create a SecretKey from bytes
    pub fn from_bytes(bytes: &[u8]) -> Result<Self, &'static str> {
        if bytes.len() != KYBER768_SECRETKEYBYTES {
            return Err("Invalid secret key size");
        }
        Ok(SecretKey {
            data: bytes.to_vec(),
        })
    }

    /// View the secret key as a byte slice
    pub fn as_bytes(&self) -> &[u8] {
        &self.data
    }

    /// Get the length of the secret key in bytes
    pub fn len(&self) -> usize {
        self.data.len()
    }
}

impl Drop for SecretKey {
    fn drop(&mut self) {
        self.data.zeroize();
    }
}

/// Ciphertext structure
#[derive(Clone)]
pub struct Ciphertext {
    pub data: Vec<u8>,
}

impl Ciphertext {
    /// Create a Ciphertext from bytes
    pub fn from_bytes(bytes: &[u8]) -> Result<Self, &'static str> {
        if bytes.len() != KYBER768_CIPHERTEXTBYTES {
            return Err("Invalid ciphertext size");
        }
        Ok(Ciphertext {
            data: bytes.to_vec(),
        })
    }
}

/// Shared secret structure
///
/// The data is zeroized on drop to prevent shared secret material from lingering in memory.
pub struct SharedSecret {
    pub data: [u8; KYBER768_SHAREDSECRETBYTES],
}

impl SharedSecret {
    /// Get shared secret as byte slice
    pub fn as_bytes(&self) -> &[u8] {
        &self.data
    }
}

impl Drop for SharedSecret {
    fn drop(&mut self) {
        self.data.zeroize();
    }
}

/// Main Kyber-768 implementation
pub struct Kyber768;

impl Kyber768 {
    /// Generate a keypair
    /// Returns (public_key, secret_key)
    pub fn keypair() -> (PublicKey, SecretKey) {
        let mut rng_seed = [0u8; KYBER_SYMBYTES];
        randombytes(&mut rng_seed);

        Self::keypair_from_seed(&rng_seed)
    }

    /// Generate a keypair from a seed (deterministic)
    pub fn keypair_from_seed(seed: &[u8; KYBER_SYMBYTES]) -> (PublicKey, SecretKey) {
        // Hash the seed
        let hash = sha3_512(seed);
        let mut publicseed = [0u8; KYBER_SYMBYTES];
        let mut noiseseed = [0u8; KYBER_SYMBYTES];
        publicseed.copy_from_slice(&hash[0..KYBER_SYMBYTES]);
        noiseseed.copy_from_slice(&hash[KYBER_SYMBYTES..]);

        // Generate matrix A in NTT domain
        let a = Self::gen_matrix(&publicseed, false);

        // Sample secret vector s (stack-allocated nonce buffer)
        let mut s = PolyVec::new();
        for i in 0..KYBER_K {
            let mut nonce_buf = [0u8; KYBER_SYMBYTES + 1];
            nonce_buf[..KYBER_SYMBYTES].copy_from_slice(&noiseseed);
            nonce_buf[KYBER_SYMBYTES] = i as u8;
            s.polys[i] = Poly::cbd(KYBER_ETA1, &nonce_buf);
        }
        s.ntt();
        s.reduce(); // Barrett reduce NTT coefficients to fit 12-bit encoding

        // Sample error vector e (stack-allocated nonce buffer)
        let mut e = PolyVec::new();
        for i in 0..KYBER_K {
            let mut nonce_buf = [0u8; KYBER_SYMBYTES + 1];
            nonce_buf[..KYBER_SYMBYTES].copy_from_slice(&noiseseed);
            nonce_buf[KYBER_SYMBYTES] = (i + KYBER_K) as u8;
            e.polys[i] = Poly::cbd(KYBER_ETA1, &nonce_buf);
        }
        e.ntt();
        e.reduce(); // Barrett reduce NTT coefficients

        // Compute t = A*s + e
        // tomont() compensates for Montgomery R^{-1} factor from basemul
        // (matches reference: polyvec_basemul_acc_montgomery + poly_tomont)
        let mut t = PolyVec::new();
        for i in 0..KYBER_K {
            t.polys[i] = a[i].pointwise_acc(&s);
            t.polys[i].tomont();
            t.polys[i].add(&e.polys[i]);
            t.polys[i].reduce();
        }

        // Pack public key
        let mut pk_data = t.to_bytes();
        pk_data.extend_from_slice(&publicseed);

        // Pack secret key
        let mut sk_data = s.to_bytes();
        sk_data.extend_from_slice(&pk_data);
        let pk_hash = sha3_256(&pk_data);
        sk_data.extend_from_slice(&pk_hash);
        sk_data.extend_from_slice(seed);

        (
            PublicKey { data: pk_data },
            SecretKey { data: sk_data },
        )
    }

    /// Encapsulate: generate shared secret and ciphertext
    pub fn encapsulate(pk: &PublicKey) -> (Ciphertext, SharedSecret) {
        let mut coins = [0u8; KYBER_SYMBYTES];
        randombytes(&mut coins);

        Self::encapsulate_with_coins(pk, &coins)
    }

    /// Encapsulate with provided randomness (for testing)
    pub fn encapsulate_with_coins(
        pk: &PublicKey,
        coins: &[u8; KYBER_SYMBYTES],
    ) -> (Ciphertext, SharedSecret) {
        // Hash public key
        let pk_hash = sha3_256(&pk.data);
        // Derive keys: (K, r) = G(m || H(pk)) per FIPS 203
        // Stack-allocated G-function input: coins || H(pk)
        let mut g_input = [0u8; 2 * KYBER_SYMBYTES];
        g_input[..KYBER_SYMBYTES].copy_from_slice(coins);
        g_input[KYBER_SYMBYTES..].copy_from_slice(&pk_hash);
        let kr = sha3_512(&g_input);

        let mut shared_key = [0u8; KYBER_SYMBYTES];
        let mut randomness = [0u8; KYBER_SYMBYTES];
        shared_key.copy_from_slice(&kr[0..KYBER_SYMBYTES]);      // K (shared secret seed)
        randomness.copy_from_slice(&kr[KYBER_SYMBYTES..]);       // r (randomness for sampling)

        // Unpack public key
        let t = PolyVec::from_bytes(&pk.data[..KYBER_POLYVECBYTES])
            .expect("Public key contains valid PolyVec data");
        let mut publicseed = [0u8; KYBER_SYMBYTES];
        publicseed.copy_from_slice(&pk.data[KYBER_POLYVECBYTES..]);

        // Generate matrix A^T
        let at = Self::gen_matrix(&publicseed, true);

        // Sample r, e1, e2 using randomness (NOT shared_key!)
        // Stack-allocated nonce buffer
        let mut r = PolyVec::new();
        for i in 0..KYBER_K {
            let mut nonce_buf = [0u8; KYBER_SYMBYTES + 1];
            nonce_buf[..KYBER_SYMBYTES].copy_from_slice(&randomness);
            nonce_buf[KYBER_SYMBYTES] = i as u8;
            r.polys[i] = Poly::cbd(KYBER_ETA1, &nonce_buf);
        }
        r.ntt();
        r.reduce(); // Barrett reduce NTT coefficients

        let mut e1 = PolyVec::new();
        for i in 0..KYBER_K {
            let mut nonce_buf = [0u8; KYBER_SYMBYTES + 1];
            nonce_buf[..KYBER_SYMBYTES].copy_from_slice(&randomness);
            nonce_buf[KYBER_SYMBYTES] = (i + KYBER_K) as u8;
            e1.polys[i] = Poly::cbd(KYBER_ETA2, &nonce_buf);
        }

        {
            let mut nonce_buf = [0u8; KYBER_SYMBYTES + 1];
            nonce_buf[..KYBER_SYMBYTES].copy_from_slice(&randomness);
            nonce_buf[KYBER_SYMBYTES] = (2 * KYBER_K) as u8;
            // e2 used below
            let e2 = Poly::cbd(KYBER_ETA2, &nonce_buf);

            // Compute u = A^T * r + e1
            let mut u = PolyVec::new();
            for i in 0..KYBER_K {
                u.polys[i] = at[i].pointwise_acc(&r);
                u.polys[i].invntt();
                u.polys[i].add(&e1.polys[i]);
                u.polys[i].reduce();
            }

            // Compute v = t^T * r + e2 + Encode(m)
            let mut v = t.pointwise_acc(&r);
            v.invntt();
            v.add(&e2);

            // Encode message m (coins) into polynomial
            // Reference: poly_frommsg uses (KYBER_Q+1)/2 = 1665 (NOT KYBER_Q/2 = 1664)
            for i in 0..KYBER_N {
                let byte_idx = i / 8;
                let bit_idx = i % 8;
                let bit = (coins[byte_idx] >> bit_idx) & 1;
                v.coeffs[i] = v.coeffs[i].wrapping_add((bit as i16) * ((KYBER_Q + 1) / 2));
            }
            v.reduce();

            // Compress and pack ciphertext
            let mut ct_data = Vec::new();
            for i in 0..KYBER_K {
                ct_data.extend_from_slice(&u.polys[i].compress(10));
            }
            ct_data.extend_from_slice(&v.compress(4));

            // Derive final shared secret: K_bar = H(K || H(c)) per FIPS 203
            // Stack-allocated shared secret input: K || H(c)
            let ct_hash = sha3_256(&ct_data);
            let mut ss_input = [0u8; 2 * KYBER_SYMBYTES];
            ss_input[..KYBER_SYMBYTES].copy_from_slice(&shared_key);
            ss_input[KYBER_SYMBYTES..].copy_from_slice(&ct_hash);
            let ss = sha3_256(&ss_input);

            (
                Ciphertext { data: ct_data },
                SharedSecret { data: ss },
            )
        }
    }

    /// Decapsulate: recover shared secret from ciphertext
    pub fn decapsulate(ct: &Ciphertext, sk: &SecretKey) -> SharedSecret {
        let sk_bytes = sk.as_bytes();

        // Unpack secret key components (format: s || pk || H(pk) || z)
        let s = PolyVec::from_bytes(&sk_bytes[..KYBER_POLYVECBYTES])
            .expect("Secret key contains valid PolyVec data");

        let pk_offset = KYBER_POLYVECBYTES;
        let pk_len = KYBER768_PUBLICKEYBYTES;
        let pk_data = &sk_bytes[pk_offset..pk_offset + pk_len];

        let pk_hash_offset = pk_offset + pk_len;
        let mut pk_hash = [0u8; KYBER_SYMBYTES];
        pk_hash.copy_from_slice(&sk_bytes[pk_hash_offset..pk_hash_offset + KYBER_SYMBYTES]);

        let z_offset = pk_hash_offset + KYBER_SYMBYTES;
        let implicit_rejection = &sk_bytes[z_offset..z_offset + KYBER_SYMBYTES];

        // Unpack ciphertext
        let mut u = PolyVec::new();
        let mut offset = 0;
        for i in 0..KYBER_K {
            let compressed_len = KYBER_N * 10 / 8;
            u.polys[i] = Poly::decompress(&ct.data[offset..offset + compressed_len], 10)
                .expect("Ciphertext contains valid compressed polynomial");
            offset += compressed_len;
        }
        let v = Poly::decompress(&ct.data[offset..], 4)
            .expect("Ciphertext contains valid compressed polynomial");

        // Compute m' = Decode(v - s^T * u)
        u.ntt();
        u.reduce(); // Barrett reduce NTT coefficients
        let mut mp = s.pointwise_acc(&u);
        mp.invntt();
        mp.reduce(); // Ensure coefficients are in [0, Q)

        let mut msg = [0u8; KYBER_SYMBYTES];
        for i in 0..KYBER_N {
            // Compute v - mp modulo Q
            let diff = (v.coeffs[i] as i32 - mp.coeffs[i] as i32 + 5 * KYBER_Q as i32) % KYBER_Q as i32;

            // Decode: check if coefficient is closer to 0 or Q/2
            // Using the formula from FIPS 203: bit = floor((2*diff + Q/2) / Q) mod 2
            let t = ((2 * diff + KYBER_Q as i32 / 2) / KYBER_Q as i32) & 1;
            msg[i / 8] |= (t as u8) << (i % 8);
        }

        // Re-derive: (K', r') = G(m' || H(pk)) and re-encapsulate
        let (ct_prime, _ss_prime) = Self::encapsulate_with_coins(
            &PublicKey { data: pk_data.to_vec() },
            &msg,
        );

        // Derive (K', r') manually to get K' for shared secret computation
        // Stack-allocated G-function input: m' || H(pk)
        let mut g_input = [0u8; 2 * KYBER_SYMBYTES];
        g_input[..KYBER_SYMBYTES].copy_from_slice(&msg);
        g_input[KYBER_SYMBYTES..].copy_from_slice(&pk_hash);
        let kr_prime = sha3_512(&g_input);
        let mut k_prime = [0u8; KYBER_SYMBYTES];
        k_prime.copy_from_slice(&kr_prime[0..KYBER_SYMBYTES]);

        // Constant-time comparison of ciphertexts
        let ct_match = ct.data.ct_eq(&ct_prime.data);

        // Compute final shared secrets for both cases
        let ct_hash = sha3_256(&ct.data);

        // Valid case: K_bar = H(K' || H(c))
        // Stack-allocated input buffer
        let mut valid_ss_input = [0u8; 2 * KYBER_SYMBYTES];
        valid_ss_input[..KYBER_SYMBYTES].copy_from_slice(&k_prime);
        valid_ss_input[KYBER_SYMBYTES..].copy_from_slice(&ct_hash);
        let valid_ss = sha3_256(&valid_ss_input);

        // Invalid case (implicit rejection): K_bar = H(z || H(c))
        // Stack-allocated input buffer
        let mut invalid_ss_input = [0u8; 2 * KYBER_SYMBYTES];
        invalid_ss_input[..KYBER_SYMBYTES].copy_from_slice(implicit_rejection);
        invalid_ss_input[KYBER_SYMBYTES..].copy_from_slice(&ct_hash);
        let invalid_ss = sha3_256(&invalid_ss_input);

        // Constant-time select between valid and invalid shared secret
        let mut ss = SharedSecret { data: [0u8; KYBER_SYMBYTES] };
        for i in 0..KYBER_SYMBYTES {
            ss.data[i] = subtle::ConditionallySelectable::conditional_select(
                &invalid_ss[i],
                &valid_ss[i],
                ct_match
            );
        }

        ss
    }

    /// Generate matrix A (or A^T)
    fn gen_matrix(seed: &[u8; KYBER_SYMBYTES], transposed: bool) -> Vec<PolyVec> {
        let mut matrix = vec![PolyVec::new(); KYBER_K];

        for i in 0..KYBER_K {
            for j in 0..KYBER_K {
                // Stack-allocated XOF seed: seed || row || col
                let mut xof_seed = [0u8; KYBER_SYMBYTES + 2];
                xof_seed[..KYBER_SYMBYTES].copy_from_slice(seed);
                if transposed {
                    xof_seed[KYBER_SYMBYTES] = i as u8;
                    xof_seed[KYBER_SYMBYTES + 1] = j as u8;
                } else {
                    xof_seed[KYBER_SYMBYTES] = j as u8;
                    xof_seed[KYBER_SYMBYTES + 1] = i as u8;
                }

                let xof_output = shake128(&xof_seed, KYBER_N * 3);
                let poly = Self::sample_poly_uniform(&xof_output);
                matrix[i].polys[j] = poly;
            }
        }

        matrix
    }

    /// Sample polynomial uniformly from XOF output
    fn sample_poly_uniform(xof_output: &[u8]) -> Poly {
        let mut poly = Poly::new();
        let mut idx = 0;
        let mut pos = 0;

        while idx < KYBER_N && pos + 3 <= xof_output.len() {
            let d1 = (xof_output[pos] as u16) | ((xof_output[pos + 1] as u16 & 0x0F) << 8);
            let d2 = ((xof_output[pos + 1] as u16) >> 4) | ((xof_output[pos + 2] as u16) << 4);

            if d1 < KYBER_Q as u16 && idx < KYBER_N {
                poly.coeffs[idx] = d1 as i16;
                idx += 1;
            }
            if d2 < KYBER_Q as u16 && idx < KYBER_N {
                poly.coeffs[idx] = d2 as i16;
                idx += 1;
            }

            pos += 3;
        }

        poly
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_keypair_generation() {
        let (pk, sk) = Kyber768::keypair();
        assert_eq!(pk.data.len(), KYBER768_PUBLICKEYBYTES);
        assert_eq!(sk.len(), KYBER768_SECRETKEYBYTES);
    }

    #[test]
    fn test_encaps_decaps() {
        let (pk, sk) = Kyber768::keypair();
        let (ct, ss1) = Kyber768::encapsulate(&pk);
        let ss2 = Kyber768::decapsulate(&ct, &sk);

        assert_eq!(ss1.data, ss2.data, "Shared secrets must match");
    }

    #[test]
    fn test_deterministic_keygen() {
        let seed = [42u8; KYBER_SYMBYTES];
        let (pk1, sk1) = Kyber768::keypair_from_seed(&seed);
        let (pk2, sk2) = Kyber768::keypair_from_seed(&seed);

        assert_eq!(pk1.data, pk2.data, "Public keys must match");
        assert_eq!(sk1.as_bytes(), sk2.as_bytes(), "Secret keys must match");
    }
}
