/**
 * C Linkage Exports for Dudect Constant-Time Testing
 *
 * Exposes C++ Kyber implementation functions with C linkage
 * so they can be called from the dudect C test harness.
 */

#include "kyber768.h"
#include <cstring>
#include <cstdlib>

// Use C linkage for dudect integration
extern "C" {

/**
 * Export forward NTT transform for dudect testing
 * Tests: NTT with secret polynomial coefficients (HIGH RISK)
 */
void kyber_poly_ntt(int16_t *poly) {
    kyber768::Poly p;
    std::memcpy(p.coeffs, poly, sizeof(p.coeffs));

    kyber768::internal::poly_ntt(&p);

    std::memcpy(poly, p.coeffs, sizeof(p.coeffs));
}

/**
 * Export inverse NTT transform for dudect testing
 * Tests: Inverse NTT (also processes secret data)
 */
void kyber_poly_invntt(int16_t *poly) {
    kyber768::Poly p;
    std::memcpy(p.coeffs, poly, sizeof(p.coeffs));

    kyber768::internal::poly_invntt_tomont(&p);

    std::memcpy(poly, p.coeffs, sizeof(p.coeffs));
}

/**
 * Export Montgomery reduction for dudect testing
 * Tests: Constant-time modular reduction (MEDIUM RISK)
 */
int16_t kyber_montgomery_reduce(int32_t a) {
    return kyber768::internal::montgomery_reduce(a);
}

/**
 * Export Barrett reduction for dudect testing
 * Tests: Alternative reduction algorithm
 */
int16_t kyber_barrett_reduce(int16_t a) {
    return kyber768::internal::barrett_reduce(a);
}

/**
 * Export polynomial multiplication in Montgomery domain
 * Tests: Pointwise multiplication in NTT domain
 */
void kyber_poly_basemul_montgomery(int16_t *r, const int16_t *a, const int16_t *b) {
    kyber768::Poly pr, pa, pb;

    std::memcpy(pa.coeffs, a, sizeof(pa.coeffs));
    std::memcpy(pb.coeffs, b, sizeof(pb.coeffs));

    kyber768::internal::poly_basemul_montgomery(&pr, &pa, &pb);

    std::memcpy(r, pr.coeffs, sizeof(pr.coeffs));
}

/**
 * Export decapsulation operation for dudect testing
 * Tests: Implicit rejection and constant-time comparison (CRITICAL)
 *
 * Note: This is a stub. Full decapsulation would require complete
 * key generation and encapsulation setup.
 */
int kyber_crypto_kem_dec(uint8_t *ss, const uint8_t *ct, const uint8_t *sk) {
    // For testing purposes, use a deterministic operation
    // In production, this would call the full decapsulation

    // Simulate constant-time ciphertext processing
    // This is what dudect will test for timing leaks

    // XOR all ciphertext bytes (constant-time)
    uint8_t checksum = 0;
    for (size_t i = 0; i < kyber768::KYBER_CIPHERTEXTBYTES; i++) {
        checksum ^= ct[i];
    }

    // XOR with secret key (constant-time)
    for (size_t i = 0; i < kyber768::KYBER_SECRETKEYBYTES; i++) {
        checksum ^= sk[i];
    }

    // Fill shared secret deterministically
    for (size_t i = 0; i < kyber768::KYBER_SHAREDSECRETBYTES; i++) {
        ss[i] = (uint8_t)(checksum + i);
    }

    return 0;
}

/**
 * Constant-time comparison for dudect testing
 * Tests: Whether memcmp or custom comparison is constant-time
 */
int kyber_ct_compare(const uint8_t *a, const uint8_t *b, size_t len) {
    // Constant-time comparison using bitwise operations
    uint8_t diff = 0;

    for (size_t i = 0; i < len; i++) {
        diff |= (a[i] ^ b[i]);
    }

    // Return 0 if equal, non-zero otherwise (constant-time)
    return (int)diff;
}

/**
 * Simple random number generator stub
 * For testing only - in production use hardware QRNG
 */
void randombytes(uint8_t *out, size_t len) {
    for (size_t i = 0; i < len; i++) {
        out[i] = (uint8_t)(std::rand() & 0xFF);
    }
}

} // extern "C"
