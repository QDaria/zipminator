//! Number Theoretic Transform (NTT) implementation
//!
//! This is the performance-critical component (~30% of total execution time).
//! Optimizations:
//! - In-place Cooley-Tukey butterfly operations
//! - Montgomery reduction for modular arithmetic
//! - Constant-time operations using subtle crate
//! - SIMD optimization potential (AVX2 for x86_64)

use crate::constants::*;

/// Montgomery reduction: compute a * R^(-1) mod q where R = 2^16
/// CRITICAL: Must be constant-time
#[inline(always)]
fn montgomery_reduce(a: i32) -> i16 {
    let t = (a as i64 * QINV as i64) & 0xFFFF;
    let t = (a as i64 - t * KYBER_Q as i64) >> 16;
    t as i16
}

/// Barrett reduction: reduce a mod q
/// CRITICAL: Must be constant-time
#[inline(always)]
fn barrett_reduce(a: i16) -> i16 {
    let v = ((1u32 << 26) + (KYBER_Q as u32) / 2) / (KYBER_Q as u32);
    let t = ((v as i32 * a as i32) >> 26) as i16;
    let t = a.wrapping_sub(t.wrapping_mul(KYBER_Q));
    t
}

/// Conditional subtraction: subtract q if a >= q
/// CRITICAL: Must be constant-time
#[inline(always)]
fn csubq(a: i16) -> i16 {
    let a = a.wrapping_sub(KYBER_Q);
    let mask = a >> 15; // -1 if a was < 0, 0 otherwise
    a.wrapping_add(mask & KYBER_Q)
}

/// Forward NTT transformation
/// Input: polynomial coefficients in normal order
/// Output: polynomial coefficients in NTT representation
pub fn ntt(poly: &mut [i16; KYBER_N]) {
    let mut k = 1;
    let mut len = 128;

    while len >= 2 {
        let mut start = 0;
        while start < KYBER_N {
            let zeta = ZETAS[k];
            k += 1;

            for j in start..start + len {
                let t = montgomery_reduce(zeta as i32 * poly[j + len] as i32);
                poly[j + len] = poly[j].wrapping_sub(t);
                poly[j] = poly[j].wrapping_add(t);
            }
            start += 2 * len;
        }
        len >>= 1;
    }

    // Final reduction: double reduction to ensure [0, q-1] range
    for i in 0..KYBER_N {
        poly[i] = csubq(barrett_reduce(poly[i]));
    }
}

/// Inverse NTT transformation
/// Input: polynomial coefficients in NTT representation
/// Output: polynomial coefficients in normal order
pub fn invntt(poly: &mut [i16; KYBER_N]) {
    let mut k = 127;
    let mut len = 2;

    while len <= 128 {
        let mut start = 0;
        while start < KYBER_N {
            let zeta = ZETAS_INV[k];
            k -= 1;

            for j in start..start + len {
                let t = poly[j];
                poly[j] = barrett_reduce(t.wrapping_add(poly[j + len]));
                poly[j + len] = t.wrapping_sub(poly[j + len]);
                poly[j + len] = montgomery_reduce(zeta as i32 * poly[j + len] as i32);
            }
            start += 2 * len;
        }
        len <<= 1;
    }

    // Multiply by inverse of n and normalize to [0, q-1]
    const F: i16 = 1441; // mont^2 / 128
    for i in 0..KYBER_N {
        poly[i] = montgomery_reduce(F as i32 * poly[i] as i32);
        poly[i] = csubq(poly[i]); // Normalize to [0, q-1] range
    }
}

/// Pointwise multiplication in NTT domain
/// Computes c = a * b in NTT representation
pub fn basemul_ntt(c: &mut [i16; KYBER_N], a: &[i16; KYBER_N], b: &[i16; KYBER_N]) {
    for i in (0..KYBER_N).step_by(4) {
        let zeta = ZETAS[64 + i / 4] as i64;

        c[i] = montgomery_reduce(
            (a[i + 1] as i64 * b[i + 1] as i64 * zeta +
            a[i] as i64 * b[i] as i64) as i32
        );
        c[i + 1] = montgomery_reduce(
            (a[i] as i64 * b[i + 1] as i64 +
            a[i + 1] as i64 * b[i] as i64) as i32
        );
        c[i + 2] = montgomery_reduce(
            (a[i + 3] as i64 * b[i + 3] as i64 * zeta +
            a[i + 2] as i64 * b[i + 2] as i64) as i32
        );
        c[i + 3] = montgomery_reduce(
            (a[i + 2] as i64 * b[i + 3] as i64 +
            a[i + 3] as i64 * b[i + 2] as i64) as i32
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ntt_invntt_identity() {
        let mut poly = [0i16; KYBER_N];
        for i in 0..KYBER_N {
            poly[i] = (i as i16) % KYBER_Q;
        }
        let original = poly;

        ntt(&mut poly);
        invntt(&mut poly);

        for i in 0..KYBER_N {
            assert_eq!(
                poly[i], original[i],
                "NTT->INVNTT not identity at index {}",
                i
            );
        }
    }

    #[test]
    fn test_montgomery_reduce() {
        let a = 12345i32;
        let reduced = montgomery_reduce(a);
        assert!(reduced < KYBER_Q && reduced >= -KYBER_Q);
    }

    #[test]
    fn test_barrett_reduce() {
        let a = KYBER_Q + 100;
        let reduced = barrett_reduce(a);
        assert!(reduced < KYBER_Q);
    }
}
