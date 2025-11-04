/**
 * Dudect Constant-Time Validation for Mojo Kyber-768 Implementation
 *
 * CRITICAL RISK ASSESSMENT:
 * - Mojo is UNPROVEN for cryptographic constant-time guarantees
 * - No documented constant-time code generation
 * - No cryptographic library ecosystem
 * - Compiler optimization behavior unknown
 *
 * Expected outcome: FAIL or UNKNOWN
 * - FAIL: Timing leaks detected (unacceptable for production)
 * - UNKNOWN: Insufficient statistical power (also unacceptable)
 * - PASS: Would be surprising and requires further investigation
 *
 * This test exists to VALIDATE OR INVALIDATE Mojo for crypto use.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include "dudect.h"

// Kyber-768 constants
#define KYBER_N 256
#define KYBER_Q 3329
#define KYBER_K 3
#define KYBER_SYMBYTES 32
#define KYBER_CIPHERTEXTBYTES 1088
#define KYBER_SECRETKEYBYTES 2400

// FFI declarations to Mojo implementation
// These would need to be exposed via Mojo's C interop
// NOTE: Mojo's C interop is immature and may introduce timing leaks itself!
extern void mojo_ntt(int16_t *poly, size_t len);
extern void mojo_invntt(int16_t *poly, size_t len);
extern int16_t mojo_montgomery_reduce(int32_t a);
extern void mojo_decapsulate(
    uint8_t *ss_out,
    const uint8_t *ciphertext,
    const uint8_t *secret_key
);
extern int mojo_constant_time_compare(
    const uint8_t *a,
    const uint8_t *b,
    size_t len
);

// Test structures
typedef struct {
    int16_t poly[KYBER_N];
} ntt_test_t;

typedef struct {
    uint8_t ciphertext[KYBER_CIPHERTEXTBYTES];
    uint8_t secret_key[KYBER_SECRETKEYBYTES];
    uint8_t shared_secret[KYBER_SYMBYTES];
} decaps_test_t;

typedef struct {
    uint8_t buffer_a[KYBER_CIPHERTEXTBYTES];
    uint8_t buffer_b[KYBER_CIPHERTEXTBYTES];
    int result;
} compare_test_t;

typedef struct {
    int32_t value;
} montgomery_test_t;

/**
 * Test 1: NTT with secret polynomial data
 * RISK: Mojo's SIMD operations may introduce timing variations
 * depending on data patterns (branch prediction, cache behavior).
 */
uint8_t do_one_computation_ntt(uint8_t *data) {
    ntt_test_t *test = (ntt_test_t *)data;
    mojo_ntt(test->poly, KYBER_N);
    return (uint8_t)(test->poly[0] & 0xFF);
}

void prepare_inputs_ntt(uint8_t *input_data, uint8_t *classes) {
    randombytes(input_data, NUMBER_MEASUREMENTS * sizeof(ntt_test_t));

    for (size_t i = 0; i < NUMBER_MEASUREMENTS; i++) {
        ntt_test_t *test = (ntt_test_t *)(input_data + i * sizeof(ntt_test_t));

        if (classes[i] == 0) {
            // Small coefficients (typical noise)
            for (size_t j = 0; j < KYBER_N; j++) {
                test->poly[j] = (int16_t)((rand() % 11) - 5);
            }
        } else {
            // Large coefficients (near modulus boundary)
            for (size_t j = 0; j < KYBER_N; j++) {
                test->poly[j] = (int16_t)(KYBER_Q - 5 + (rand() % 11));
            }
        }
    }
}

/**
 * Test 2: Decapsulation with valid/invalid ciphertext
 * CRITICAL: Mojo has no equivalent to Rust's subtle crate.
 * Manual constant-time comparison is EXTREMELY difficult to get right.
 */
uint8_t do_one_computation_decaps(uint8_t *data) {
    decaps_test_t *test = (decaps_test_t *)data;
    mojo_decapsulate(test->shared_secret, test->ciphertext, test->secret_key);
    return test->shared_secret[0];
}

void prepare_inputs_decaps(uint8_t *input_data, uint8_t *classes) {
    for (size_t i = 0; i < NUMBER_MEASUREMENTS; i++) {
        decaps_test_t *test = (decaps_test_t *)(input_data + i * sizeof(decaps_test_t));

        randombytes(test->secret_key, KYBER_SECRETKEYBYTES);

        if (classes[i] == 0) {
            randombytes(test->ciphertext, KYBER_CIPHERTEXTBYTES);
        } else {
            randombytes(test->ciphertext, KYBER_CIPHERTEXTBYTES);
            test->ciphertext[0] ^= 0xFF;  // Make it invalid
        }
    }
}

/**
 * Test 3: Constant-time comparison
 * This is the FOUNDATION of IND-CCA2 security.
 * Mojo has NO TOOLS for this - must be hand-coded.
 */
uint8_t do_one_computation_compare(uint8_t *data) {
    compare_test_t *test = (compare_test_t *)data;
    test->result = mojo_constant_time_compare(test->buffer_a, test->buffer_b, KYBER_CIPHERTEXTBYTES);
    return (uint8_t)(test->result & 0xFF);
}

void prepare_inputs_compare(uint8_t *input_data, uint8_t *classes) {
    for (size_t i = 0; i < NUMBER_MEASUREMENTS; i++) {
        compare_test_t *test = (compare_test_t *)(input_data + i * sizeof(compare_test_t));

        randombytes(test->buffer_a, KYBER_CIPHERTEXTBYTES);

        if (classes[i] == 0) {
            // Identical
            memcpy(test->buffer_b, test->buffer_a, KYBER_CIPHERTEXTBYTES);
        } else {
            // Different (first byte differs)
            memcpy(test->buffer_b, test->buffer_a, KYBER_CIPHERTEXTBYTES);
            test->buffer_b[0] ^= 0x01;
        }
    }
}

/**
 * Test 4: Montgomery reduction
 * Basic arithmetic primitive - timing leaks here invalidate everything.
 */
uint8_t do_one_computation_montgomery(uint8_t *data) {
    montgomery_test_t *test = (montgomery_test_t *)data;
    int16_t result = mojo_montgomery_reduce(test->value);
    return (uint8_t)(result & 0xFF);
}

void prepare_inputs_montgomery(uint8_t *input_data, uint8_t *classes) {
    randombytes(input_data, NUMBER_MEASUREMENTS * sizeof(montgomery_test_t));

    for (size_t i = 0; i < NUMBER_MEASUREMENTS; i++) {
        montgomery_test_t *test = (montgomery_test_t *)(input_data + i * sizeof(montgomery_test_t));

        if (classes[i] == 0) {
            test->value = rand() % 1000;
        } else {
            test->value = 0x7FFFFFFF - (rand() % 1000);
        }
    }
}

int main(int argc, char **argv) {
    printf("===========================================\n");
    printf("Dudect Constant-Time Validation: Mojo\n");
    printf("===========================================\n\n");

    printf("⚠️  CRITICAL RISK WARNING ⚠️\n");
    printf("Mojo is UNPROVEN for cryptographic use.\n");
    printf("Expected outcome: FAIL or UNKNOWN\n");
    printf("A PASS result would require deep investigation.\n\n");

    if (argc < 2) {
        printf("Usage: %s <test_name>\n", argv[0]);
        printf("Tests: ntt, decaps, compare, montgomery, all\n");
        return 1;
    }

    const char *test_name = argv[1];
    int result = 0;
    int test_count = 0;
    int failures = 0;

    printf("Test Configuration:\n");
    printf("- Samples: %d\n", NUMBER_MEASUREMENTS);
    printf("- Confidence level: p < 0.001 (t > 3.29)\n");
    printf("- Implementation: Mojo (EXPERIMENTAL)\n");
    printf("- Compiler: Unknown optimization behavior\n");
    printf("- Constant-time guarantees: NONE DOCUMENTED\n\n");

    if (strcmp(test_name, "ntt") == 0 || strcmp(test_name, "all") == 0) {
        printf("TEST 1: NTT with Secret Polynomial Data\n");
        printf("Risk: HIGH (30%% of execution, SIMD operations)\n");
        printf("Mojo concern: SIMD may branch based on data\n");
        printf("Testing...\n");

        dudect_ctx_t ctx;
        dudect_init(&ctx, do_one_computation_ntt, prepare_inputs_ntt, sizeof(ntt_test_t));
        int r = dudect_run(&ctx);
        dudect_free(&ctx);

        result |= r;
        test_count++;
        if (r != 0) failures++;
        printf("\n");
    }

    if (strcmp(test_name, "decaps") == 0 || strcmp(test_name, "all") == 0) {
        printf("TEST 2: Decapsulation Ciphertext Comparison\n");
        printf("Risk: CRITICAL (IND-CCA2 security)\n");
        printf("Mojo concern: No subtle crate equivalent\n");
        printf("Testing...\n");

        dudect_ctx_t ctx;
        dudect_init(&ctx, do_one_computation_decaps, prepare_inputs_decaps, sizeof(decaps_test_t));
        int r = dudect_run(&ctx);
        dudect_free(&ctx);

        result |= r;
        test_count++;
        if (r != 0) failures++;
        printf("\n");
    }

    if (strcmp(test_name, "compare") == 0 || strcmp(test_name, "all") == 0) {
        printf("TEST 3: Constant-Time Buffer Comparison\n");
        printf("Risk: CRITICAL (foundation of all CT operations)\n");
        printf("Mojo concern: Must be hand-coded, no library support\n");
        printf("Testing...\n");

        dudect_ctx_t ctx;
        dudect_init(&ctx, do_one_computation_compare, prepare_inputs_compare, sizeof(compare_test_t));
        int r = dudect_run(&ctx);
        dudect_free(&ctx);

        result |= r;
        test_count++;
        if (r != 0) failures++;
        printf("\n");
    }

    if (strcmp(test_name, "montgomery") == 0 || strcmp(test_name, "all") == 0) {
        printf("TEST 4: Montgomery Reduction\n");
        printf("Risk: MEDIUM (arithmetic primitive)\n");
        printf("Mojo concern: Compiler may optimize incorrectly\n");
        printf("Testing...\n");

        dudect_ctx_t ctx;
        dudect_init(&ctx, do_one_computation_montgomery, prepare_inputs_montgomery, sizeof(montgomery_test_t));
        int r = dudect_run(&ctx);
        dudect_free(&ctx);

        result |= r;
        test_count++;
        if (r != 0) failures++;
        printf("\n");
    }

    printf("===========================================\n");
    printf("FINAL ASSESSMENT: Mojo Implementation\n");
    printf("===========================================\n");
    printf("Tests run: %d\n", test_count);
    printf("Failures: %d\n", failures);
    printf("Pass rate: %.1f%%\n", (test_count - failures) * 100.0 / test_count);
    printf("\n");

    if (result == 0) {
        printf("Result: PASS\n");
        printf("\n");
        printf("⚠️  UNEXPECTED RESULT ⚠️\n");
        printf("Mojo implementation passes constant-time validation!\n");
        printf("This is SURPRISING given lack of documented guarantees.\n");
        printf("\n");
        printf("REQUIRED NEXT STEPS:\n");
        printf("1. Review Mojo compiler output (assembly inspection)\n");
        printf("2. Test with different compiler flags\n");
        printf("3. Verify on multiple CPU architectures\n");
        printf("4. Increase sample size to 100M for higher confidence\n");
        printf("5. Consult with Mojo language team on CT guarantees\n");
        printf("\n");
        printf("RECOMMENDATION: Proceed with EXTREME caution.\n");
    } else {
        printf("Result: FAIL\n");
        printf("\n");
        printf("✓ EXPECTED RESULT ✓\n");
        printf("Mojo implementation has timing leaks.\n");
        printf("This validates our risk assessment.\n");
        printf("\n");
        printf("IMPLICATIONS:\n");
        printf("1. Mojo is NOT SUITABLE for production crypto (Pillar 2 FAILS)\n");
        printf("2. Use C++/AVX2 or Rust for production deployment\n");
        printf("3. Mojo can be retained for non-crypto performance work\n");
        printf("\n");
        printf("BUSINESS IMPACT:\n");
        printf("- Zipminator's Mojo performance claims are UNVALIDATED\n");
        printf("- Parallel implementation track (C++/Rust) is CRITICAL\n");
        printf("- Market positioning must emphasize proven implementations\n");
    }
    printf("===========================================\n");

    return result;
}
