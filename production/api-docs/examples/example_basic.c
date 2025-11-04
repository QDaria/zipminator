/**
 * Zipminator Basic Example
 * Demonstrates basic Kyber key exchange and Dilithium signatures
 *
 * Compile: gcc -o example_basic example_basic.c -lzipminator -O3
 * Run: ./example_basic
 */

#include <zipminator/kyber768.h>
#include <zipminator/dilithium3.h>
#include <zipminator/qrng.h>
#include <stdio.h>
#include <string.h>
#include <time.h>

// Helper: Print hex bytes
void print_hex(const char *label, const uint8_t *data, size_t len) {
    printf("%s: ", label);
    for (size_t i = 0; i < len && i < 32; i++) {  // Print first 32 bytes
        printf("%02x", data[i]);
    }
    if (len > 32) printf("...");
    printf(" (%zu bytes)\n", len);
}

// Helper: Timing
double measure_time_ms(struct timespec *start, struct timespec *end) {
    return (end->tv_sec - start->tv_sec) * 1000.0 +
           (end->tv_nsec - start->tv_nsec) / 1000000.0;
}

int kyber_example() {
    printf("\n=== Kyber-768 Key Exchange Example ===\n");

    struct timespec start, end;
    zipminator_error_t error;

    // Step 1: Alice generates key pair
    printf("\n[Alice] Generating Kyber-768 key pair...\n");
    uint8_t alice_pk[1184], alice_sk[2400];

    clock_gettime(CLOCK_MONOTONIC, &start);
    if (zipminator_kyber768_keygen(alice_pk, alice_sk, &error) != ZIPMINATOR_SUCCESS) {
        fprintf(stderr, "Alice KeyGen failed: %s\n", error.message);
        return 1;
    }
    clock_gettime(CLOCK_MONOTONIC, &end);
    printf("  KeyGen time: %.3f ms\n", measure_time_ms(&start, &end));

    print_hex("  Public key", alice_pk, 1184);
    print_hex("  Secret key", alice_sk, 2400);

    // Step 2: Bob encapsulates shared secret using Alice's public key
    printf("\n[Bob] Encapsulating shared secret with Alice's public key...\n");
    uint8_t ciphertext[1088], bob_shared_secret[32];

    clock_gettime(CLOCK_MONOTONIC, &start);
    if (zipminator_kyber768_encaps(alice_pk, ciphertext, bob_shared_secret, &error) != ZIPMINATOR_SUCCESS) {
        fprintf(stderr, "Bob Encaps failed: %s\n", error.message);
        return 1;
    }
    clock_gettime(CLOCK_MONOTONIC, &end);
    printf("  Encaps time: %.3f ms\n", measure_time_ms(&start, &end));

    print_hex("  Ciphertext", ciphertext, 1088);
    print_hex("  Bob's shared secret", bob_shared_secret, 32);

    // Step 3: Alice decapsulates to recover shared secret
    printf("\n[Alice] Decapsulating ciphertext with secret key...\n");
    uint8_t alice_shared_secret[32];

    clock_gettime(CLOCK_MONOTONIC, &start);
    if (zipminator_kyber768_decaps(ciphertext, alice_sk, alice_shared_secret, &error) != ZIPMINATOR_SUCCESS) {
        fprintf(stderr, "Alice Decaps failed: %s\n", error.message);
        return 1;
    }
    clock_gettime(CLOCK_MONOTONIC, &end);
    printf("  Decaps time: %.3f ms\n", measure_time_ms(&start, &end));

    print_hex("  Alice's shared secret", alice_shared_secret, 32);

    // Step 4: Verify both parties have same shared secret
    printf("\n[Verification] Comparing shared secrets...\n");
    if (memcmp(alice_shared_secret, bob_shared_secret, 32) == 0) {
        printf("  ✓ SUCCESS: Shared secrets match!\n");
        printf("  ✓ Alice and Bob can now use this for symmetric encryption (AES-256-GCM)\n");
        return 0;
    } else {
        printf("  ✗ FAILURE: Shared secrets DO NOT match!\n");
        return 1;
    }
}

int dilithium_example() {
    printf("\n\n=== Dilithium-3 Digital Signature Example ===\n");

    struct timespec start, end;
    zipminator_error_t error;

    // Step 1: Generate signing key pair
    printf("\n[Signer] Generating Dilithium-3 key pair...\n");
    uint8_t public_key[1952], secret_key[4000];

    clock_gettime(CLOCK_MONOTONIC, &start);
    if (zipminator_dilithium3_keygen(public_key, secret_key, &error) != ZIPMINATOR_SUCCESS) {
        fprintf(stderr, "KeyGen failed: %s\n", error.message);
        return 1;
    }
    clock_gettime(CLOCK_MONOTONIC, &end);
    printf("  KeyGen time: %.3f ms\n", measure_time_ms(&start, &end));

    print_hex("  Public key", public_key, 1952);
    print_hex("  Secret key", secret_key, 4000);

    // Step 2: Sign a message
    const char *message = "CNSA 2.0 compliant post-quantum signature - Zipminator by QDaria";
    printf("\n[Signer] Signing message: \"%s\"\n", message);

    uint8_t signature[3293];
    size_t sig_len;

    clock_gettime(CLOCK_MONOTONIC, &start);
    if (zipminator_dilithium3_sign(
            (const uint8_t*)message, strlen(message),
            secret_key, signature, &sig_len, &error) != ZIPMINATOR_SUCCESS) {
        fprintf(stderr, "Sign failed: %s\n", error.message);
        return 1;
    }
    clock_gettime(CLOCK_MONOTONIC, &end);
    printf("  Sign time: %.3f ms\n", measure_time_ms(&start, &end));

    print_hex("  Signature", signature, sig_len);

    // Step 3: Verify signature
    printf("\n[Verifier] Verifying signature...\n");

    clock_gettime(CLOCK_MONOTONIC, &start);
    int verify_result = zipminator_dilithium3_verify(
        (const uint8_t*)message, strlen(message),
        signature, sig_len, public_key, &error
    );
    clock_gettime(CLOCK_MONOTONIC, &end);
    printf("  Verify time: %.3f ms\n", measure_time_ms(&start, &end));

    if (verify_result == ZIPMINATOR_SUCCESS) {
        printf("  ✓ SUCCESS: Signature is VALID\n");
    } else {
        printf("  ✗ FAILURE: Signature is INVALID\n");
        return 1;
    }

    // Step 4: Test tampering detection
    printf("\n[Verifier] Testing tampering detection...\n");
    const char *tampered_message = "Tampered message - should fail verification";

    verify_result = zipminator_dilithium3_verify(
        (const uint8_t*)tampered_message, strlen(tampered_message),
        signature, sig_len, public_key, &error
    );

    if (verify_result != ZIPMINATOR_SUCCESS) {
        printf("  ✓ SUCCESS: Tampered message correctly REJECTED\n");
        return 0;
    } else {
        printf("  ✗ FAILURE: Tampered message was ACCEPTED (security failure!)\n");
        return 1;
    }
}

int qrng_example() {
    printf("\n\n=== QRNG Health Monitoring Example ===\n");

    zipminator_qrng_health_t health;
    zipminator_error_t error;

    if (zipminator_qrng_get_health(&health, &error) != ZIPMINATOR_SUCCESS) {
        fprintf(stderr, "QRNG health check failed: %s\n", error.message);
        return 1;
    }

    printf("\nQRNG Status:\n");
    printf("  Health: %s\n", health.is_healthy ? "HEALTHY ✓" : "UNHEALTHY ✗");
    printf("  Device: %s\n", health.device_model);
    printf("  Entropy generated: %lu bits\n", health.entropy_bits_generated);
    printf("  Throughput: %.2f Mbps\n", health.throughput_mbps);
    printf("  Health check failures: %u\n", health.health_check_failures);

    if (health.health_check_failures > 0) {
        printf("  ⚠ WARNING: QRNG has experienced health check failures!\n");
    }

    // Generate random bytes
    printf("\n[QRNG] Generating 32 random bytes...\n");
    uint8_t random_bytes[32];
    if (zipminator_qrng_get_bytes(random_bytes, 32, &error) == ZIPMINATOR_SUCCESS) {
        print_hex("  Random bytes", random_bytes, 32);
    }

    return 0;
}

int main() {
    printf("======================================\n");
    printf("Zipminator PQC Library - Basic Example\n");
    printf("======================================\n");

    // Initialize library
    zipminator_config_t config = zipminator_get_default_config();
    zipminator_error_t error;

    printf("\nInitializing Zipminator library...\n");
    printf("  Entropy source: %s\n",
           config.entropy_source == ZIPMINATOR_ENTROPY_QRNG ? "Hardware QRNG" : "System PRNG");
    printf("  Side-channel protection: %s\n",
           config.enable_side_channel_protection ? "Enabled" : "Disabled");

    if (zipminator_init(&config, &error) != ZIPMINATOR_SUCCESS) {
        fprintf(stderr, "Initialization failed: %s\n", error.message);
        fprintf(stderr, "Note: If QRNG device not available, library will use system PRNG\n");
        return 1;
    }

    // Get version info
    zipminator_version_t version;
    zipminator_get_version(&version);
    printf("  Version: %d.%d.%d (commit %s)\n",
           version.major, version.minor, version.patch, version.git_commit);
    printf("  FIPS mode: %s\n", version.fips_mode ? "Yes" : "No");
    printf("  QRNG available: %s\n", version.qrng_available ? "Yes" : "No");

    // Run examples
    int result = 0;
    result |= kyber_example();
    result |= dilithium_example();
    result |= qrng_example();

    // Cleanup
    printf("\n\nCleaning up...\n");
    zipminator_cleanup();

    if (result == 0) {
        printf("\n✓ All examples completed successfully!\n");
    } else {
        printf("\n✗ Some examples failed\n");
    }

    return result;
}
