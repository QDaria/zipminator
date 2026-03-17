//! Polynomial operations for Kyber-768
//!
//! Implements operations on polynomials in R_q = Z_q[X]/(X^n + 1)

use crate::constants::*;
use crate::ntt::{ntt, invntt, basemul_ntt, montgomery_reduce, barrett_reduce};
use sha3::{Shake256, digest::{Update, ExtendableOutput, XofReader}};

/// Polynomial in R_q
#[derive(Clone, Copy)]
pub struct Poly {
    pub coeffs: [i16; KYBER_N],
}

impl Default for Poly {
    fn default() -> Self {
        Self::new()
    }
}

impl Poly {
    pub fn new() -> Self {
        Self {
            coeffs: [0; KYBER_N],
        }
    }

    /// Add two polynomials
    pub fn add(&mut self, other: &Poly) {
        for i in 0..KYBER_N {
            self.coeffs[i] = self.coeffs[i].wrapping_add(other.coeffs[i]);
        }
    }

    /// Subtract two polynomials
    pub fn sub(&mut self, other: &Poly) {
        for i in 0..KYBER_N {
            self.coeffs[i] = self.coeffs[i].wrapping_sub(other.coeffs[i]);
        }
    }

    /// Apply forward NTT
    pub fn ntt(&mut self) {
        ntt(&mut self.coeffs);
    }

    /// Apply inverse NTT
    pub fn invntt(&mut self) {
        invntt(&mut self.coeffs);
    }

    /// Pointwise multiply in NTT domain
    pub fn basemul(&mut self, a: &Poly, b: &Poly) {
        basemul_ntt(&mut self.coeffs, &a.coeffs, &b.coeffs);
    }

    /// Reduce all coefficients modulo q using Barrett reduction
    /// Matches reference pqcrystals/kyber: poly_reduce
    pub fn reduce(&mut self) {
        for i in 0..KYBER_N {
            self.coeffs[i] = barrett_reduce(self.coeffs[i]);
        }
    }

    /// Convert polynomial to Montgomery domain: multiply all coefficients by R mod q
    /// Matches reference pqcrystals/kyber: poly_tomont
    /// Used after basemul in keygen to compensate for Montgomery R^{-1} factor
    pub fn tomont(&mut self) {
        const F: i16 = 1353; // R^2 mod q = 2^32 mod 3329
        for i in 0..KYBER_N {
            self.coeffs[i] = montgomery_reduce(F as i32 * self.coeffs[i] as i32);
        }
    }

    /// Sample polynomial from centered binomial distribution
    /// Used for noise sampling
    pub fn cbd(eta: usize, seed: &[u8]) -> Self {
        let mut poly = Self::new();
        let mut buf = vec![0u8; eta * KYBER_N / 4];

        let mut hasher = Shake256::default();
        hasher.update(seed);
        let mut reader = hasher.finalize_xof();
        reader.read(&mut buf);

        let mut idx = 0;
        for i in 0..KYBER_N {
            let mut a = 0u16;
            let mut b = 0u16;

            for _ in 0..eta {
                let byte_idx = idx / 8;
                let bit_idx = idx % 8;
                a += ((buf[byte_idx] >> bit_idx) & 1) as u16;
                idx += 1;
            }

            for _ in 0..eta {
                let byte_idx = idx / 8;
                let bit_idx = idx % 8;
                b += ((buf[byte_idx] >> bit_idx) & 1) as u16;
                idx += 1;
            }

            poly.coeffs[i] = (a as i16).wrapping_sub(b as i16);
        }

        poly
    }

    /// Compress polynomial (lossy compression)
    pub fn compress(&self, d: usize) -> Vec<u8> {
        let mut out = vec![0u8; KYBER_N * d / 8];
        let mut idx = 0;

        for i in 0..KYBER_N {
            // Ensure coefficient is in [0, q) using u64 to prevent overflow
            let mut c = self.coeffs[i] as i32;
            c = ((c % KYBER_Q as i32) + KYBER_Q as i32) % KYBER_Q as i32;

            let t = ((c as u64) << d) + (KYBER_Q as u64 / 2);
            let t = (t / KYBER_Q as u64) as u32;
            let t = t & ((1u32 << d) - 1);

            for j in 0..d {
                let byte_idx = idx / 8;
                let bit_idx = idx % 8;
                out[byte_idx] |= ((t >> j) as u8 & 1) << bit_idx;
                idx += 1;
            }
        }

        out
    }

    /// Decompress polynomial
    ///
    /// Returns an error if `data` is too short for the given compression parameter `d`.
    pub fn decompress(data: &[u8], d: usize) -> Result<Self, &'static str> {
        let mut poly = Self::new();
        let mut idx = 0;
        let expected_bytes = KYBER_N * d / 8;

        if data.len() < expected_bytes {
            return Err("Insufficient data for polynomial decompression");
        }

        for i in 0..KYBER_N {
            let mut t = 0u32;

            for j in 0..d {
                let byte_idx = idx / 8;
                let bit_idx = idx % 8;
                t |= ((data[byte_idx] >> bit_idx) as u32 & 1) << j;
                idx += 1;
            }

            poly.coeffs[i] = ((t * KYBER_Q as u32 + (1u32 << (d - 1))) >> d) as i16;
        }

        Ok(poly)
    }

    /// Serialize polynomial to bytes
    /// Matches reference pqcrystals/kyber: poly_tobytes
    /// Normalizes negative coefficients to [0, q) before packing
    pub fn to_bytes(&self) -> [u8; KYBER_POLYBYTES] {
        let mut out = [0u8; KYBER_POLYBYTES];

        for i in 0..KYBER_N / 2 {
            // Normalize to [0, q) by adding q if negative (matches reference)
            let mut c0 = self.coeffs[2 * i];
            c0 = c0.wrapping_add((c0 >> 15) & KYBER_Q);
            let t0 = c0 as u16;

            let mut c1 = self.coeffs[2 * i + 1];
            c1 = c1.wrapping_add((c1 >> 15) & KYBER_Q);
            let t1 = c1 as u16;

            out[3 * i] = t0 as u8;
            out[3 * i + 1] = ((t0 >> 8) | (t1 << 4)) as u8;
            out[3 * i + 2] = (t1 >> 4) as u8;
        }

        out
    }

    /// Deserialize polynomial from bytes
    pub fn from_bytes(data: &[u8]) -> Self {
        let mut poly = Self::new();

        for i in 0..KYBER_N / 2 {
            poly.coeffs[2 * i] =
                ((data[3 * i] as i16) | ((data[3 * i + 1] as i16 & 0x0F) << 8)) & 0x0FFF;
            poly.coeffs[2 * i + 1] =
                (((data[3 * i + 1] as i16) >> 4) | ((data[3 * i + 2] as i16) << 4)) & 0x0FFF;
        }

        poly
    }
}

/// Vector of k polynomials
#[derive(Clone)]
pub struct PolyVec {
    pub polys: [Poly; KYBER_K],
}

impl Default for PolyVec {
    fn default() -> Self {
        Self::new()
    }
}

impl PolyVec {
    pub fn new() -> Self {
        Self {
            polys: [Poly::new(); KYBER_K],
        }
    }

    /// Apply NTT to all polynomials
    pub fn ntt(&mut self) {
        for i in 0..KYBER_K {
            self.polys[i].ntt();
        }
    }

    /// Reduce all polynomials
    pub fn reduce(&mut self) {
        for i in 0..KYBER_K {
            self.polys[i].reduce();
        }
    }

    /// Apply inverse NTT to all polynomials
    pub fn invntt(&mut self) {
        for i in 0..KYBER_K {
            self.polys[i].invntt();
        }
    }

    /// Pointwise multiply and accumulate
    pub fn pointwise_acc(&self, other: &PolyVec) -> Poly {
        let mut acc = Poly::new();
        for i in 0..KYBER_K {
            let mut tmp = Poly::new();
            tmp.basemul(&self.polys[i], &other.polys[i]);
            acc.add(&tmp);
        }
        acc
    }

    /// Serialize to bytes
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut out = Vec::with_capacity(KYBER_POLYVECBYTES);
        for i in 0..KYBER_K {
            out.extend_from_slice(&self.polys[i].to_bytes());
        }
        out
    }

    /// Deserialize from bytes
    ///
    /// Returns an error if `data` is shorter than `KYBER_K * KYBER_POLYBYTES`.
    pub fn from_bytes(data: &[u8]) -> Result<Self, &'static str> {
        if data.len() < KYBER_K * KYBER_POLYBYTES {
            return Err("Insufficient data for PolyVec deserialization");
        }
        let mut vec = Self::new();
        for i in 0..KYBER_K {
            let start = i * KYBER_POLYBYTES;
            let end = start + KYBER_POLYBYTES;
            vec.polys[i] = Poly::from_bytes(&data[start..end]);
        }
        Ok(vec)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_poly_add_sub() {
        let mut a = Poly::new();
        let mut b = Poly::new();
        a.coeffs[0] = 100;
        b.coeffs[0] = 50;

        a.add(&b);
        assert_eq!(a.coeffs[0], 150);

        a.sub(&b);
        assert_eq!(a.coeffs[0], 100);
    }

    #[test]
    fn test_poly_serialize() {
        let mut poly = Poly::new();
        for i in 0..KYBER_N {
            poly.coeffs[i] = (i as i16) % KYBER_Q;
        }

        let bytes = poly.to_bytes();
        let poly2 = Poly::from_bytes(&bytes);

        for i in 0..KYBER_N {
            assert_eq!(poly.coeffs[i], poly2.coeffs[i]);
        }
    }
}
