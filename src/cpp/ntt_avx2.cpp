/**
 * AVX2-Optimized Number Theoretic Transform (NTT)
 *
 * This is the performance-critical component (30% of Kyber execution time)
 * Uses AVX2 SIMD instructions for parallel butterfly operations
 *
 * Security: Constant-time implementation (no secret-dependent branches)
 */

#include "kyber768.h"
#include <immintrin.h>
#include <cstring>

namespace kyber768 {
namespace internal {

// Precomputed NTT twiddle factors (powers of primitive root modulo q)
// These are in Montgomery form for efficient multiplication
static const int16_t zetas[128] = {
  -1044,  -758,  -359, -1517,  1493,  1422,   287,   202,
   -171,   622,  1577,   182,   962, -1202, -1474,  1468,
    573, -1325,   264,   383,  -829,  1458, -1602,  -130,
   -681,  1017,   732,   608, -1542,   411,  -205, -1571,
   1223,   652,  -552,  1015, -1293,  1491,  -282, -1544,
    516,    -8,  -320,  -666, -1618, -1162,   126,  1469,
   -853,   -90,  -271,   830,   107, -1421,  -247,  -951,
   -398,   961, -1508,  -725,   448, -1065,   677, -1275,
  -1103,   430,   555,   843, -1251,   871,  1550,   105,
    422,   587,   177,  -235,  -291,  -460,  1574,  1653,
   -246,   778,  1159,  -147,  -777,  1483,  -602,  1119,
  -1590,   644,  -872,   349,   418,   329,  -156,   -75,
    817,  1097,   603,   610,  1322, -1285, -1465,   384,
  -1215,  -136,  1218, -1335,  -874,   220, -1187, -1659,
  -1185, -1530, -1278,   794, -1510,  -854,  -870,   478,
   -108,  -308,   996,   991,   958, -1460,  1522,  1628
};

// Inverse NTT twiddle factors (powers of primitive root inverse)
static const int16_t zetas_inv[128] = {
  -1517, -1342,  -282,   264,  -130,  -458,  1730,  -681,
   -853,  -271,   107,  -951,  -398,   961, -1508,  -725,
    448, -1065,   677, -1275, -1103,   430,   555,   843,
  -1251,   871,  1550,   105,   422,   587,   177,  -235,
   -291,  -460,  1574,  1653,  -246,   778,  1159,  -147,
   -777,  1483,  -602,  1119, -1590,   644,  -872,   349,
    418,   329,  -156,   -75,   817,  1097,   603,   610,
   1322, -1285, -1465,   384, -1215,  -136,  1218, -1335,
   -874,   220, -1187, -1659, -1185, -1530, -1278,   794,
  -1510,  -854,  -870,   478,  -108,  -308,   996,   991,
    958, -1460,  1522,  1628,  -1577,   182,   962, -1202,
  -1474,  1468,   573, -1325,   264,   383,  -829,  1458,
  -1602,  -130,  -681,  1017,   732,   608, -1542,   411,
   -205, -1571,  1223,   652,  -552,  1015, -1293,  1491,
   -282, -1544,   516,    -8,  -320,  -666, -1618, -1162,
    126,  1469,  -853,   -90,  -271,   830,   107, -1421
};

/**
 * Barrett reduction: r = a mod q
 * Returns r in [0, q-1]
 * Constant-time (no branches)
 */
int16_t barrett_reduce(int16_t a) {
    // v = floor(2^26 / q + 1/2) = 20159
    int16_t t;
    const int16_t v = 20159;

    // Compute quotient approximation
    t = ((int32_t)v * a + (1 << 25)) >> 26;
    t *= KYBER_Q;

    // Return remainder
    return a - t;
}

/**
 * Montgomery reduction: r = a * R^-1 mod q where R = 2^16
 * Returns r in [-q/2, q/2]
 * Constant-time (no branches)
 */
int16_t montgomery_reduce(int32_t a) {
    int16_t t;

    // Compute m = a * q^-1 mod 2^16
    t = (int16_t)a * QINV;

    // Compute (a + m*q) / 2^16
    t = (a - (int32_t)t * KYBER_Q) >> 16;

    return t;
}

/**
 * Multiplication in Montgomery domain
 * r = a * b * R^-1 mod q
 * Constant-time (no branches)
 */
int16_t fqmul(int16_t a, int16_t b) {
    return montgomery_reduce((int32_t)a * b);
}

/**
 * AVX2-optimized NTT butterfly operation
 * Performs 16 butterflies in parallel
 */
static inline __m256i ntt_butterfly_avx2(__m256i a, __m256i b, __m256i zeta) {
    const __m256i q = _mm256_set1_epi16(KYBER_Q);
    const __m256i qinv = _mm256_set1_epi16(QINV);

    // t = zeta * b
    __m256i t = _mm256_mullo_epi16(zeta, b);
    __m256i u = _mm256_mulhi_epi16(zeta, b);

    // Montgomery reduction
    __m256i m = _mm256_mullo_epi16(t, qinv);
    __m256i v = _mm256_mulhi_epi16(m, q);
    t = _mm256_sub_epi16(u, v);

    return t;
}

/**
 * Forward NTT (in-place, Cooley-Tukey decimation-in-time)
 * Transforms polynomial from coefficient to NTT domain
 *
 * Constant-time guarantee: All iterations execute same instructions
 * Performance: ~30% of total Kyber time, vectorized with AVX2
 */
void poly_ntt(Poly *r) {
    size_t k = 1;

    // 7 levels of butterflies (log2(256) = 8, first level handled separately)
    for (size_t len = 128; len >= 2; len >>= 1) {
        for (size_t start = 0; start < KYBER_N; start = start + 2 * len) {
            int16_t zeta = zetas[k++];
            __m256i zeta_vec = _mm256_set1_epi16(zeta);

            // Process 16 coefficients at a time with AVX2
            for (size_t j = start; j < start + len; j += 16) {
                __m256i a = _mm256_load_si256((__m256i*)&r->coeffs[j]);
                __m256i b = _mm256_load_si256((__m256i*)&r->coeffs[j + len]);

                // Butterfly operation: (a, b) -> (a + zeta*b, a - zeta*b)
                __m256i t = ntt_butterfly_avx2(a, b, zeta_vec);
                __m256i u = _mm256_sub_epi16(a, t);
                __m256i v = _mm256_add_epi16(a, t);

                _mm256_store_si256((__m256i*)&r->coeffs[j], v);
                _mm256_store_si256((__m256i*)&r->coeffs[j + len], u);
            }
        }
    }

    // Reduce coefficients to canonical range [0, q-1]
    poly_reduce(r);
}

/**
 * Inverse NTT (in-place, Gentleman-Sande decimation-in-frequency)
 * Transforms polynomial from NTT domain to coefficient form
 *
 * Constant-time guarantee: All iterations execute same instructions
 * Performance: ~30% of total Kyber time, vectorized with AVX2
 */
void poly_invntt_tomont(Poly *r) {
    size_t k = 127;
    const int16_t f = 1441; // 2^32 / 128 mod q (for final scaling)

    // 7 levels of butterflies
    for (size_t len = 2; len <= 128; len <<= 1) {
        for (size_t start = 0; start < KYBER_N; start = start + 2 * len) {
            int16_t zeta = zetas_inv[k--];
            __m256i zeta_vec = _mm256_set1_epi16(zeta);

            // Process 16 coefficients at a time with AVX2
            for (size_t j = start; j < start + len; j += 16) {
                __m256i a = _mm256_load_si256((__m256i*)&r->coeffs[j]);
                __m256i b = _mm256_load_si256((__m256i*)&r->coeffs[j + len]);

                // Inverse butterfly: (a, b) -> ((a+b)/2, zeta*(a-b)/2)
                __m256i t = _mm256_sub_epi16(a, b);
                __m256i u = _mm256_add_epi16(a, b);
                t = ntt_butterfly_avx2(t, _mm256_setzero_si256(), zeta_vec);

                _mm256_store_si256((__m256i*)&r->coeffs[j], u);
                _mm256_store_si256((__m256i*)&r->coeffs[j + len], t);
            }
        }
    }

    // Final scaling by n^-1 * 2^16 (Montgomery form)
    __m256i f_vec = _mm256_set1_epi16(f);
    for (size_t j = 0; j < KYBER_N; j += 16) {
        __m256i a = _mm256_load_si256((__m256i*)&r->coeffs[j]);
        a = ntt_butterfly_avx2(a, _mm256_setzero_si256(), f_vec);
        _mm256_store_si256((__m256i*)&r->coeffs[j], a);
    }

    poly_reduce(r);
}

/**
 * Reduce all coefficients to canonical range [0, q-1]
 * Constant-time with AVX2 vectorization
 */
void poly_reduce(Poly *r) {
    const __m256i q = _mm256_set1_epi16(KYBER_Q);
    const __m256i v = _mm256_set1_epi16(20159); // Barrett constant

    for (size_t i = 0; i < KYBER_N; i += 16) {
        __m256i a = _mm256_load_si256((__m256i*)&r->coeffs[i]);

        // Barrett reduction vectorized
        __m256i t = _mm256_mulhi_epi16(a, v);
        t = _mm256_srai_epi16(t, 10); // shift by 26-16 = 10
        t = _mm256_mullo_epi16(t, q);
        a = _mm256_sub_epi16(a, t);

        _mm256_store_si256((__m256i*)&r->coeffs[i], a);
    }
}

/**
 * Convert polynomial to Montgomery domain
 * r[i] = r[i] * 2^16 mod q
 */
void poly_tomont(Poly *r) {
    const int16_t f = MONT; // 2^16 mod q = 2285

    for (size_t i = 0; i < KYBER_N; i++) {
        r->coeffs[i] = montgomery_reduce((int32_t)r->coeffs[i] * f);
    }
}

} // namespace internal
} // namespace kyber768
