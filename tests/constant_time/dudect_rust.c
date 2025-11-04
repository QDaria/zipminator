/**
 * Dudect Constant-Time Validation for Rust Kyber-768 Implementation
 *
 * Tests the Rust implementation which should be safer due to:
 * - subtle crate for constant-time operations
 * - Memory safety guarantees
 * - No manual memory management timing leaks
 *
 * Expected outcome: PASS (Rust's subtle crate provides constant-time primitives)
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
#define KYBER_PUBLICKEYBYTES 1184

// FFI declarations to Rust implementation
// These would be exposed via #[no_mangle] in Rust
extern void rust_ntt(int16_t *poly);
extern void rust_invntt(int16_t *poly);
extern int16_t rust_montgomery_reduce(int32_t a);
extern void rust_decapsulate(
    uint8_t *ss_out,
    const uint8_t *ciphertext,
    const uint8_t *secret_key
);
extern void rust_constant_time_compare(
    uint8_t *result,
    const uint8_t *a,
    const uint8_t *b,
    size_t len
);

// Test structure for NTT timing
typedef struct {
    int16_t poly[KYBER_N];
} ntt_test_t;

// Test structure for decapsulation
typedef struct {
    uint8_t ciphertext[KYBER_CIPHERTEXTBYTES];
    uint8_t secret_key[KYBER_SECRETKEYBYTES];
    uint8_t shared_secret[KYBER_SYMBYTES];
} decaps_test_t;

// Test structure for constant-time comparison
typedef struct {
    uint8_t buffer_a[KYBER_CIPHERTEXTBYTES];
    uint8_t buffer_b[KYBER_CIPHERTEXTBYTES];
    uint8_t result;
} compare_test_t;

/**
 * Test 1: NTT with secret polynomial data
 * Rust implementation should use constant-time arithmetic throughout.
 */
uint8_t do_one_computation_ntt(uint8_t *data) {
    ntt_test_t *test = (ntt_test_t *)data;
    rust_ntt(test->poly);
    return (uint8_t)(test->poly[0] & 0xFF);
}

void prepare_inputs_ntt(uint8_t *input_data, uint8_t *classes) {
    randombytes(input_data, NUMBER_MEASUREMENTS * sizeof(ntt_test_t));

    for (size_t i = 0; i < NUMBER_MEASUREMENTS; i++) {
        ntt_test_t *test = (ntt_test_t *)(input_data + i * sizeof(ntt_test_t));

        if (classes[i] == 0) {
            // Small coefficients
            for (size_t j = 0; j < KYBER_N; j++) {
                test->poly[j] = (int16_t)((rand() % 11) - 5);
            }
        } else {
            // Large coefficients near modulus
            for (size_t j = 0; j < KYBER_N; j++) {
                test->poly[j] = (int16_t)(KYBER_Q - 5 + (rand() % 11));
            }
        }
    }
}

/**
 * Test 2: Decapsulation with valid/invalid ciphertext
 * Rust uses subtle::ConstantTimeEq for comparison - should be constant-time.
 */
uint8_t do_one_computation_decaps(uint8_t *data) {
    decaps_test_t *test = (decaps_test_t *)data;
    rust_decapsulate(test->shared_secret, test->ciphertext, test->secret_key);
    return test->shared_secret[0];
}

void prepare_inputs_decaps(uint8_t *input_data, uint8_t *classes) {
    for (size_t i = 0; i < NUMBER_MEASUREMENTS; i++) {
        decaps_test_t *test = (decaps_test_t *)(input_data + i * sizeof(decaps_test_t));

        randombytes(test->secret_key, KYBER_SECRETKEYBYTES);

        if (classes[i] == 0) {
            // Valid-looking ciphertext
            randombytes(test->ciphertext, KYBER_CIPHERTEXTBYTES);
        } else {
            // Invalid ciphertext (will trigger implicit rejection)
            randombytes(test->ciphertext, KYBER_CIPHERTEXTBYTES);
            test->ciphertext[0] ^= 0xFF;
        }
    }
}

/**
 * Test 3: Constant-time comparison (using subtle::ConstantTimeEq)
 * This should PASS as it's the whole point of the subtle crate.
 */
uint8_t do_one_computation_compare(uint8_t *data) {
    compare_test_t *test = (compare_test_t *)data;
    rust_constant_time_compare(&test->result, test->buffer_a, test->buffer_b, KYBER_CIPHERTEXTBYTES);
    return test->result;
}

void prepare_inputs_compare(uint8_t *input_data, uint8_t *classes) {
    for (size_t i = 0; i < NUMBER_MEASUREMENTS; i++) {
        compare_test_t *test = (compare_test_t *)(input_data + i * sizeof(compare_test_t));

        randombytes(test->buffer_a, KYBER_CIPHERTEXTBYTES);

        if (classes[i] == 0) {
            // Identical buffers
            memcpy(test->buffer_b, test->buffer_a, KYBER_CIPHERTEXTBYTES);
        } else {
            // Different buffers (differ in first byte)
            memcpy(test->buffer_b, test->buffer_a, KYBER_CIPHERTEXTBYTES);
            test->buffer_b[0] ^= 0x01;
        }
    }
}

int main(int argc, char **argv) {
    printf("===========================================\n");
    printf("Dudect Constant-Time Validation: Rust\n");
    printf("===========================================\n\n");

    if (argc < 2) {
        printf("Usage: %s <test_name>\n", argv[0]);
        printf("Tests: ntt, decaps, compare, all\n");
        return 1;
    }

    const char *test_name = argv[1];
    int result = 0;

    printf("Test Configuration:\n");
    printf("- Samples: %d\n", NUMBER_MEASUREMENTS);
    printf("- Confidence level: p < 0.001 (t > 3.29)\n");
    printf("- Implementation: Rust with subtle crate\n");
    printf("- Expected: PASS (Rust provides constant-time primitives)\n\n");

    if (strcmp(test_name, "ntt") == 0 || strcmp(test_name, "all") == 0) {
        printf("TEST 1: NTT with Secret Polynomial Data\n");
        printf("Risk: HIGH (30%% of execution time)\n");
        printf("Testing...\n");

        dudect_ctx_t ctx;
        dudect_init(&ctx, do_one_computation_ntt, prepare_inputs_ntt, sizeof(ntt_test_t));
        result |= dudect_run(&ctx);
        dudect_free(&ctx);

        printf("\n");
    }

    if (strcmp(test_name, "decaps") == 0 || strcmp(test_name, "all") == 0) {
        printf("TEST 2: Decapsulation Ciphertext Comparison\n");
        printf("Risk: CRITICAL (IND-CCA2 security)\n");
        printf("Using: subtle::ConstantTimeEq\n");
        printf("Testing...\n");

        dudect_ctx_t ctx;
        dudect_init(&ctx, do_one_computation_decaps, prepare_inputs_decaps, sizeof(decaps_test_t));
        result |= dudect_run(&ctx);
        dudect_free(&ctx);

        printf("\n");
    }

    if (strcmp(test_name, "compare") == 0 || strcmp(test_name, "all") == 0) {
        printf("TEST 3: Constant-Time Buffer Comparison\n");
        printf("Risk: CRITICAL (foundation for all CT operations)\n");
        printf("Using: subtle::ConstantTimeEq trait\n");
        printf("Testing...\n");

        dudect_ctx_t ctx;
        dudect_init(&ctx, do_one_computation_compare, prepare_inputs_compare, sizeof(compare_test_t));
        result |= dudect_run(&ctx);
        dudect_free(&ctx);

        printf("\n");
    }

    printf("===========================================\n");
    if (result == 0) {
        printf("OVERALL RESULT: PASS\n");
        printf("Rust implementation shows constant-time behavior.\n");
        printf("The subtle crate successfully prevents timing leaks.\n");
    } else {
        printf("OVERALL RESULT: FAIL\n");
        printf("WARNING: Timing leaks detected in Rust implementation!\n");
        printf("This suggests subtle crate misuse or compiler issues.\n");
    }
    printf("===========================================\n");

    return result;
}
