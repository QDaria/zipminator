//! CRYSTALS-Kyber-768 core implementation
//!
//! Implements:
//! - KeyGen: Generate public/secret key pair
//! - Encaps: Encapsulate shared secret with public key
//! - Decaps: Decapsulate ciphertext with secret key

use crate::constants::*;
use crate::poly::{Poly, PolyVec};
use crate::utils::*;
use subtle::{ConstantTimeEq, ConditionallySelectable};

/// Public key structure
#[derive(Clone)]
pub struct PublicKey {
    pub data: Vec<u8>,
}

/// Secret key structure
#[derive(Clone)]
pub struct SecretKey {
    pub data: Vec<u8>,
}

/// Ciphertext structure
#[derive(Clone)]
pub struct Ciphertext {
    pub data: Vec<u8>,
}

/// Shared secret structure
pub struct SharedSecret {
    pub data: [u8; KYBER768_SHAREDSECRETBYTES],
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

        // Sample secret vector s
        let mut s = PolyVec::new();
        for i in 0..KYBER_K {
            let mut nonce = noiseseed.to_vec();
            nonce.push(i as u8);
            s.polys[i] = Poly::cbd(KYBER_ETA1, &nonce);
        }
        s.ntt();

        // Sample error vector e
        let mut e = PolyVec::new();
        for i in 0..KYBER_K {
            let mut nonce = noiseseed.to_vec();
            nonce.push((i + KYBER_K) as u8);
            e.polys[i] = Poly::cbd(KYBER_ETA1, &nonce);
        }
        e.ntt();

        // Compute t = A*s + e
        let mut t = PolyVec::new();
        for i in 0..KYBER_K {
            t.polys[i] = a[i].pointwise_acc(&s);
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
        let _pk_hash = sha3_256(&pk.data);

        // Derive keys
        let kr = sha3_512(coins);
        let mut k = [0u8; KYBER_SYMBYTES];
        k.copy_from_slice(&kr[0..KYBER_SYMBYTES]);

        // Unpack public key
        let t = PolyVec::from_bytes(&pk.data[..KYBER_POLYVECBYTES]);
        let mut publicseed = [0u8; KYBER_SYMBYTES];
        publicseed.copy_from_slice(&pk.data[KYBER_POLYVECBYTES..]);

        // Generate matrix A
        let at = Self::gen_matrix(&publicseed, true);

        // Sample r, e1, e2
        let mut r = PolyVec::new();
        for i in 0..KYBER_K {
            let mut nonce = k.to_vec();
            nonce.push(i as u8);
            r.polys[i] = Poly::cbd(KYBER_ETA1, &nonce);
        }
        r.ntt();

        let mut e1 = PolyVec::new();
        for i in 0..KYBER_K {
            let mut nonce = k.to_vec();
            nonce.push((i + KYBER_K) as u8);
            e1.polys[i] = Poly::cbd(KYBER_ETA2, &nonce);
        }

        let mut nonce = k.to_vec();
        nonce.push((2 * KYBER_K) as u8);
        let e2 = Poly::cbd(KYBER_ETA2, &nonce);

        // Compute u = A^T * r + e1
        let mut u = PolyVec::new();
        for i in 0..KYBER_K {
            u.polys[i] = at[i].pointwise_acc(&r);
            u.polys[i].invntt();
            u.polys[i].add(&e1.polys[i]);
            u.polys[i].reduce();
        }

        // Compute v = t^T * r + e2 + m
        let mut v = t.pointwise_acc(&r);
        v.invntt();
        v.add(&e2);

        // Add message (encoded from coins)
        for i in 0..KYBER_N {
            let byte_idx = i / 8;
            let bit_idx = i % 8;
            let bit = (coins[byte_idx] >> bit_idx) & 1;
            v.coeffs[i] = v.coeffs[i].wrapping_add((bit as i16) * (KYBER_Q / 2));
        }
        v.reduce();

        // Compress and pack ciphertext
        let mut ct_data = Vec::new();
        for i in 0..KYBER_K {
            ct_data.extend_from_slice(&u.polys[i].compress(10));
        }
        ct_data.extend_from_slice(&v.compress(4));

        // Derive shared secret
        let mut ss_input = Vec::new();
        ss_input.extend_from_slice(&k);
        ss_input.extend_from_slice(&sha3_256(&ct_data));
        let ss = sha3_256(&ss_input);

        (
            Ciphertext { data: ct_data },
            SharedSecret { data: ss },
        )
    }

    /// Decapsulate: recover shared secret from ciphertext
    pub fn decapsulate(ct: &Ciphertext, sk: &SecretKey) -> SharedSecret {
        // Unpack secret key
        let s = PolyVec::from_bytes(&sk.data[..KYBER_POLYVECBYTES]);
        let pk_offset = KYBER_POLYVECBYTES;
        let pk_len = KYBER768_PUBLICKEYBYTES;
        let pk_data = &sk.data[pk_offset..pk_offset + pk_len];

        // Unpack ciphertext
        let mut u = PolyVec::new();
        let mut offset = 0;
        for i in 0..KYBER_K {
            let compressed_len = KYBER_N * 10 / 8;
            u.polys[i] = Poly::decompress(&ct.data[offset..offset + compressed_len], 10);
            offset += compressed_len;
        }
        let v = Poly::decompress(&ct.data[offset..], 4);

        // Compute m' = v - s^T * u
        u.ntt();
        let mut mp = s.pointwise_acc(&u);
        mp.invntt();

        let mut msg = [0u8; KYBER_SYMBYTES];
        for i in 0..KYBER_N {
            let t = v.coeffs[i] - mp.coeffs[i];
            let t = ((t as i32 * 2) + KYBER_Q as i32 / 2) / KYBER_Q as i32;
            let bit = t & 1;
            msg[i / 8] |= (bit as u8) << (i % 8);
        }

        // Re-encapsulate to verify
        let (ct_prime, ss_prime) = Self::encapsulate_with_coins(
            &PublicKey { data: pk_data.to_vec() },
            &msg,
        );

        // Constant-time comparison
        let ct_match = ct.data.ct_eq(&ct_prime.data);

        // Return shared secret (or pseudo-random value on failure)
        let mut ss = SharedSecret { data: [0u8; KYBER_SYMBYTES] };

        // If ciphertext matches, use derived secret
        // If not, use pseudo-random value from secret key
        let implicit_rejection = &sk.data[sk.data.len() - KYBER_SYMBYTES..];
        for i in 0..KYBER_SYMBYTES {
            // Constant-time select: if ct_match, use ss_prime, else use implicit_rejection
            let valid = ss_prime.data[i];
            let invalid = implicit_rejection[i];
            ss.data[i] = subtle::ConditionallySelectable::conditional_select(
                &invalid,
                &valid,
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
                let mut xof_seed = seed.to_vec();
                if transposed {
                    xof_seed.push(i as u8);
                    xof_seed.push(j as u8);
                } else {
                    xof_seed.push(j as u8);
                    xof_seed.push(i as u8);
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
        assert_eq!(sk.data.len(), KYBER768_SECRETKEYBYTES);
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
        assert_eq!(sk1.data, sk2.data, "Secret keys must match");
    }
}
