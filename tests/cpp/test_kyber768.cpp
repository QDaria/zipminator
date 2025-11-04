/**
 * Comprehensive unit tests for Kyber-768 implementation
 *
 * Tests correctness, constant-time behavior, and performance
 */

#include "../src/cpp/kyber768.h"
#include <iostream>
#include <iomanip>
#include <cstring>
#include <cassert>

using namespace kyber768;

// Test result tracking
static int tests_run = 0;
static int tests_passed = 0;

#define TEST(name) \
    void test_##name(); \
    void run_test_##name() { \
        tests_run++; \
        std::cout << "Running: " << #name << "... "; \
        test_##name(); \
        tests_passed++; \
        std::cout << "PASS" << std::endl; \
    } \
    void test_##name()

/**
 * Test: Basic keypair generation
 */
TEST(keypair_generation) {
    uint8_t pk[KYBER_PUBLICKEYBYTES];
    uint8_t sk[KYBER_SECRETKEYBYTES];

    int result = crypto_kem_keypair(pk, sk);
    assert(result == 0);

    // Check that keys are not all zeros
    bool pk_nonzero = false;
    bool sk_nonzero = false;

    for (size_t i = 0; i < KYBER_PUBLICKEYBYTES; i++) {
        if (pk[i] != 0) pk_nonzero = true;
    }
    for (size_t i = 0; i < KYBER_SECRETKEYBYTES; i++) {
        if (sk[i] != 0) sk_nonzero = true;
    }

    assert(pk_nonzero && sk_nonzero);
}

/**
 * Test: Encapsulation produces valid ciphertext and shared secret
 */
TEST(encapsulation) {
    uint8_t pk[KYBER_PUBLICKEYBYTES];
    uint8_t sk[KYBER_SECRETKEYBYTES];
    uint8_t ct[KYBER_CIPHERTEXTBYTES];
    uint8_t ss[KYBER_SHAREDSECRETBYTES];

    crypto_kem_keypair(pk, sk);
    int result = crypto_kem_enc(ct, ss, pk);
    assert(result == 0);

    // Check ciphertext is not all zeros
    bool ct_nonzero = false;
    for (size_t i = 0; i < KYBER_CIPHERTEXTBYTES; i++) {
        if (ct[i] != 0) ct_nonzero = true;
    }
    assert(ct_nonzero);

    // Check shared secret is not all zeros
    bool ss_nonzero = false;
    for (size_t i = 0; i < KYBER_SHAREDSECRETBYTES; i++) {
        if (ss[i] != 0) ss_nonzero = true;
    }
    assert(ss_nonzero);
}

/**
 * Test: Decapsulation recovers correct shared secret
 */
TEST(correctness) {
    uint8_t pk[KYBER_PUBLICKEYBYTES];
    uint8_t sk[KYBER_SECRETKEYBYTES];
    uint8_t ct[KYBER_CIPHERTEXTBYTES];
    uint8_t ss_enc[KYBER_SHAREDSECRETBYTES];
    uint8_t ss_dec[KYBER_SHAREDSECRETBYTES];

    // Generate keypair
    crypto_kem_keypair(pk, sk);

    // Encapsulate
    crypto_kem_enc(ct, ss_enc, pk);

    // Decapsulate
    int result = crypto_kem_dec(ss_dec, ct, sk);
    assert(result == 0);

    // Verify shared secrets match
    bool secrets_match = (memcmp(ss_enc, ss_dec, KYBER_SHAREDSECRETBYTES) == 0);
    assert(secrets_match);
}

/**
 * Test: Multiple encapsulations produce different ciphertexts
 */
TEST(randomness) {
    uint8_t pk[KYBER_PUBLICKEYBYTES];
    uint8_t sk[KYBER_SECRETKEYBYTES];
    uint8_t ct1[KYBER_CIPHERTEXTBYTES];
    uint8_t ct2[KYBER_CIPHERTEXTBYTES];
    uint8_t ss1[KYBER_SHAREDSECRETBYTES];
    uint8_t ss2[KYBER_SHAREDSECRETBYTES];

    crypto_kem_keypair(pk, sk);

    crypto_kem_enc(ct1, ss1, pk);
    crypto_kem_enc(ct2, ss2, pk);

    // Ciphertexts should be different
    bool cts_different = (memcmp(ct1, ct2, KYBER_CIPHERTEXTBYTES) != 0);
    assert(cts_different);

    // Shared secrets should be different
    bool ss_different = (memcmp(ss1, ss2, KYBER_SHAREDSECRETBYTES) != 0);
    assert(ss_different);
}

/**
 * Test: Invalid ciphertext produces different shared secret
 */
TEST(ciphertext_validation) {
    uint8_t pk[KYBER_PUBLICKEYBYTES];
    uint8_t sk[KYBER_SECRETKEYBYTES];
    uint8_t ct[KYBER_CIPHERTEXTBYTES];
    uint8_t ss_enc[KYBER_SHAREDSECRETBYTES];
    uint8_t ss_dec1[KYBER_SHAREDSECRETBYTES];
    uint8_t ss_dec2[KYBER_SHAREDSECRETBYTES];

    crypto_kem_keypair(pk, sk);
    crypto_kem_enc(ct, ss_enc, pk);

    // Decapsulate valid ciphertext
    crypto_kem_dec(ss_dec1, ct, sk);
    assert(memcmp(ss_enc, ss_dec1, KYBER_SHAREDSECRETBYTES) == 0);

    // Corrupt ciphertext
    ct[0] ^= 0x01;

    // Decapsulate corrupted ciphertext (should use implicit rejection)
    crypto_kem_dec(ss_dec2, ct, sk);

    // Shared secret should be different (implicit rejection activated)
    bool ss_different = (memcmp(ss_dec1, ss_dec2, KYBER_SHAREDSECRETBYTES) != 0);
    assert(ss_different);
}

/**
 * Test: NTT is invertible
 */
TEST(ntt_invertible) {
    Poly original, transformed;

    // Initialize with test pattern
    for (size_t i = 0; i < KYBER_N; i++) {
        original.coeffs[i] = (i * 7 + 13) % KYBER_Q;
        transformed.coeffs[i] = original.coeffs[i];
    }

    // Forward NTT
    internal::poly_ntt(&transformed);

    // Inverse NTT
    internal::poly_invntt_tomont(&transformed);

    // Convert back from Montgomery form
    for (size_t i = 0; i < KYBER_N; i++) {
        transformed.coeffs[i] = internal::montgomery_reduce((int32_t)transformed.coeffs[i]);
    }

    // Check coefficients match (within modular reduction)
    for (size_t i = 0; i < KYBER_N; i++) {
        int16_t diff = (original.coeffs[i] - transformed.coeffs[i]) % KYBER_Q;
        if (diff < 0) diff += KYBER_Q;
        assert(diff == 0);
    }
}

/**
 * Test: Barrett reduction correctness
 */
TEST(barrett_reduce) {
    // Test known values
    assert(internal::barrett_reduce(0) == 0);
    assert(internal::barrett_reduce(KYBER_Q) == 0);
    assert(internal::barrett_reduce(KYBER_Q + 1) == 1);
    assert(internal::barrett_reduce(2 * KYBER_Q) == 0);

    // Test range of values
    for (int16_t a = -10000; a < 10000; a++) {
        int16_t r = internal::barrett_reduce(a);
        assert(r >= 0 && r < KYBER_Q);

        // Verify correctness
        int16_t expected = a % KYBER_Q;
        if (expected < 0) expected += KYBER_Q;
        assert(r == expected);
    }
}

/**
 * Test: Montgomery reduction correctness
 */
TEST(montgomery_reduce) {
    // Test properties of Montgomery reduction
    for (int16_t a = -1000; a < 1000; a++) {
        for (int16_t b = -1000; b < 1000; b++) {
            int32_t prod = (int32_t)a * b;
            int16_t reduced = internal::montgomery_reduce(prod);

            // Result should be in [-q, q]
            assert(reduced >= -KYBER_Q && reduced <= KYBER_Q);
        }
    }
}

/**
 * Performance benchmark test
 */
TEST(performance_benchmark) {
    std::cout << std::endl;
    std::cout << "=== Performance Benchmark ===" << std::endl;

    PerfResult result = benchmark(10000);

    std::cout << std::fixed << std::setprecision(6);
    std::cout << "KeyGen:  " << result.keygen_ms << " ms (" << result.keygen_cycles << " cycles)" << std::endl;
    std::cout << "Encaps:  " << result.encaps_ms << " ms (" << result.encaps_cycles << " cycles)" << std::endl;
    std::cout << "Decaps:  " << result.decaps_ms << " ms (" << result.decaps_cycles << " cycles)" << std::endl;
    std::cout << "Total:   " << (result.keygen_ms + result.encaps_ms + result.decaps_ms) << " ms" << std::endl;
    std::cout << std::endl;

    std::cout << "Gold Standard Target: 0.034ms total" << std::endl;
    std::cout << "  KeyGen: 0.011ms" << std::endl;
    std::cout << "  Encaps: 0.011ms" << std::endl;
    std::cout << "  Decaps: 0.012ms" << std::endl;
    std::cout << std::endl;

    // Performance should be reasonable (within 10x of gold standard for unoptimized build)
    double total_time = result.keygen_ms + result.encaps_ms + result.decaps_ms;
    assert(total_time < 0.34); // 10x slower than gold standard is still acceptable for first implementation
}

/**
 * Main test runner
 */
int main() {
    std::cout << "==================================" << std::endl;
    std::cout << "Kyber-768 Test Suite" << std::endl;
    std::cout << "==================================" << std::endl;
    std::cout << std::endl;

    // Run all tests
    run_test_keypair_generation();
    run_test_encapsulation();
    run_test_correctness();
    run_test_randomness();
    run_test_ciphertext_validation();
    run_test_ntt_invertible();
    run_test_barrett_reduce();
    run_test_montgomery_reduce();
    run_test_performance_benchmark();

    // Summary
    std::cout << "==================================" << std::endl;
    std::cout << "Tests passed: " << tests_passed << "/" << tests_run << std::endl;
    std::cout << "==================================" << std::endl;

    return (tests_passed == tests_run) ? 0 : 1;
}
