# Zipminator API Reference

## Overview

Zipminator is a high-performance, CNSA 2.0 compliant post-quantum cryptography (PQC) platform implementing:
- **CRYSTALS-Kyber (ML-KEM)** - FIPS 203 Key Encapsulation Mechanism
- **CRYSTALS-Dilithium (ML-DSA)** - FIPS 204 Digital Signature Algorithm
- **Hardware QRNG Integration** - True quantum randomness for maximum security

**Version:** 1.0.0
**NIST Compliance:** FIPS 203, FIPS 204
**Security Levels:** NIST Level 1, 3, 5 (equivalent to AES-128, AES-192, AES-256)

---

## C API Reference

### Core Data Types

```c
// Error handling
typedef enum {
    ZIPMINATOR_SUCCESS = 0,
    ZIPMINATOR_ERROR_INVALID_PARAM = -1,
    ZIPMINATOR_ERROR_QRNG_FAILURE = -2,
    ZIPMINATOR_ERROR_MEMORY = -3,
    ZIPMINATOR_ERROR_CRYPTO = -4,
    ZIPMINATOR_ERROR_NOT_INITIALIZED = -5
} zipminator_status_t;

typedef struct {
    zipminator_status_t code;
    char message[256];
    uint32_t line;
    const char* file;
} zipminator_error_t;

// Configuration
typedef enum {
    ZIPMINATOR_ENTROPY_QRNG,      // Hardware QRNG (default)
    ZIPMINATOR_ENTROPY_SYSTEM,    // System PRNG (fallback)
    ZIPMINATOR_ENTROPY_HYBRID     // QRNG + System XOR
} zipminator_entropy_source_t;

typedef struct {
    zipminator_entropy_source_t entropy_source;
    bool enable_side_channel_protection;
    bool enable_fault_protection;
    uint32_t qrng_health_check_interval_ms;
} zipminator_config_t;
```

---

## CRYSTALS-Kyber (ML-KEM) API

### Security Levels

| Algorithm | NIST Level | Public Key | Secret Key | Ciphertext | Shared Secret | Quantum Security |
|-----------|------------|------------|------------|------------|---------------|------------------|
| Kyber-512 | 1 | 800 bytes | 1632 bytes | 768 bytes | 32 bytes | ~128-bit |
| Kyber-768 | 3 | 1184 bytes | 2400 bytes | 1088 bytes | 32 bytes | ~192-bit |
| Kyber-1024 | 5 | 1568 bytes | 3168 bytes | 1568 bytes | 32 bytes | ~256-bit |

### Key Generation

```c
/**
 * Generate Kyber-768 (NIST Level 3) key pair
 *
 * @param public_key    [OUT] 1184-byte public key
 * @param secret_key    [OUT] 2400-byte secret key
 * @param error         [OUT] Optional error details (NULL allowed)
 * @return ZIPMINATOR_SUCCESS on success, error code otherwise
 *
 * Performance: ~0.011ms (AVX2 optimized)
 * Entropy: 64 bytes from QRNG
 */
int zipminator_kyber768_keygen(
    uint8_t *public_key,
    uint8_t *secret_key,
    zipminator_error_t *error
);

int zipminator_kyber512_keygen(
    uint8_t *public_key,    // 800 bytes
    uint8_t *secret_key,    // 1632 bytes
    zipminator_error_t *error
);

int zipminator_kyber1024_keygen(
    uint8_t *public_key,    // 1568 bytes
    uint8_t *secret_key,    // 3168 bytes
    zipminator_error_t *error
);
```

### Encapsulation

```c
/**
 * Encapsulate shared secret with Kyber-768 public key
 *
 * @param public_key    [IN]  1184-byte public key
 * @param ciphertext    [OUT] 1088-byte ciphertext
 * @param shared_secret [OUT] 32-byte shared secret
 * @param error         [OUT] Optional error details
 * @return ZIPMINATOR_SUCCESS on success
 *
 * Performance: ~0.011ms (AVX2 optimized)
 * Entropy: 32 bytes from QRNG
 */
int zipminator_kyber768_encaps(
    const uint8_t *public_key,
    uint8_t *ciphertext,
    uint8_t *shared_secret,
    zipminator_error_t *error
);

int zipminator_kyber512_encaps(
    const uint8_t *public_key,   // 800 bytes
    uint8_t *ciphertext,         // 768 bytes
    uint8_t *shared_secret,      // 32 bytes
    zipminator_error_t *error
);

int zipminator_kyber1024_encaps(
    const uint8_t *public_key,   // 1568 bytes
    uint8_t *ciphertext,         // 1568 bytes
    uint8_t *shared_secret,      // 32 bytes
    zipminator_error_t *error
);
```

### Decapsulation

```c
/**
 * Decapsulate shared secret with Kyber-768 secret key
 *
 * @param ciphertext    [IN]  1088-byte ciphertext
 * @param secret_key    [IN]  2400-byte secret key
 * @param shared_secret [OUT] 32-byte shared secret
 * @param error         [OUT] Optional error details
 * @return ZIPMINATOR_SUCCESS on success
 *
 * Performance: ~0.012ms (AVX2 optimized)
 * Constant-time: YES (side-channel protected)
 */
int zipminator_kyber768_decaps(
    const uint8_t *ciphertext,
    const uint8_t *secret_key,
    uint8_t *shared_secret,
    zipminator_error_t *error
);

int zipminator_kyber512_decaps(
    const uint8_t *ciphertext,   // 768 bytes
    const uint8_t *secret_key,   // 1632 bytes
    uint8_t *shared_secret,      // 32 bytes
    zipminator_error_t *error
);

int zipminator_kyber1024_decaps(
    const uint8_t *ciphertext,   // 1568 bytes
    const uint8_t *secret_key,   // 3168 bytes
    uint8_t *shared_secret,      // 32 bytes
    zipminator_error_t *error
);
```

---

## CRYSTALS-Dilithium (ML-DSA) API

### Security Levels

| Algorithm | NIST Level | Public Key | Secret Key | Signature | Quantum Security |
|-----------|------------|------------|------------|-----------|------------------|
| Dilithium-2 | 2 | 1312 bytes | 2528 bytes | 2420 bytes | ~128-bit |
| Dilithium-3 | 3 | 1952 bytes | 4000 bytes | 3293 bytes | ~192-bit |
| Dilithium-5 | 5 | 2592 bytes | 4864 bytes | 4595 bytes | ~256-bit |

### Key Generation

```c
/**
 * Generate Dilithium-3 (NIST Level 3) signing key pair
 *
 * @param public_key [OUT] 1952-byte public verification key
 * @param secret_key [OUT] 4000-byte secret signing key
 * @param error      [OUT] Optional error details
 * @return ZIPMINATOR_SUCCESS on success
 *
 * Performance: ~0.045ms (AVX2 optimized)
 * Entropy: 32 bytes from QRNG
 */
int zipminator_dilithium3_keygen(
    uint8_t *public_key,
    uint8_t *secret_key,
    zipminator_error_t *error
);

int zipminator_dilithium2_keygen(
    uint8_t *public_key,    // 1312 bytes
    uint8_t *secret_key,    // 2528 bytes
    zipminator_error_t *error
);

int zipminator_dilithium5_keygen(
    uint8_t *public_key,    // 2592 bytes
    uint8_t *secret_key,    // 4864 bytes
    zipminator_error_t *error
);
```

### Signing

```c
/**
 * Sign message with Dilithium-3 secret key
 *
 * @param message    [IN]  Message to sign
 * @param msg_len    [IN]  Message length in bytes
 * @param secret_key [IN]  4000-byte secret key
 * @param signature  [OUT] 3293-byte signature
 * @param sig_len    [OUT] Actual signature length
 * @param error      [OUT] Optional error details
 * @return ZIPMINATOR_SUCCESS on success
 *
 * Performance: ~0.120ms (AVX2 optimized)
 * Entropy: 32 bytes from QRNG per attempt (hedged signing)
 * Note: Average 4-5 signature rejections per successful signature
 */
int zipminator_dilithium3_sign(
    const uint8_t *message,
    size_t msg_len,
    const uint8_t *secret_key,
    uint8_t *signature,
    size_t *sig_len,
    zipminator_error_t *error
);

int zipminator_dilithium2_sign(
    const uint8_t *message,
    size_t msg_len,
    const uint8_t *secret_key,
    uint8_t *signature,        // 2420 bytes
    size_t *sig_len,
    zipminator_error_t *error
);

int zipminator_dilithium5_sign(
    const uint8_t *message,
    size_t msg_len,
    const uint8_t *secret_key,
    uint8_t *signature,        // 4595 bytes
    size_t *sig_len,
    zipminator_error_t *error
);
```

### Verification

```c
/**
 * Verify Dilithium-3 signature
 *
 * @param message    [IN] Message that was signed
 * @param msg_len    [IN] Message length
 * @param signature  [IN] 3293-byte signature
 * @param sig_len    [IN] Signature length
 * @param public_key [IN] 1952-byte public key
 * @param error      [OUT] Optional error details
 * @return ZIPMINATOR_SUCCESS if valid, error code if invalid
 *
 * Performance: ~0.045ms (AVX2 optimized)
 */
int zipminator_dilithium3_verify(
    const uint8_t *message,
    size_t msg_len,
    const uint8_t *signature,
    size_t sig_len,
    const uint8_t *public_key,
    zipminator_error_t *error
);

int zipminator_dilithium2_verify(
    const uint8_t *message,
    size_t msg_len,
    const uint8_t *signature,
    size_t sig_len,
    const uint8_t *public_key,   // 1312 bytes
    zipminator_error_t *error
);

int zipminator_dilithium5_verify(
    const uint8_t *message,
    size_t msg_len,
    const uint8_t *signature,
    size_t sig_len,
    const uint8_t *public_key,   // 2592 bytes
    zipminator_error_t *error
);
```

---

## QRNG Management API

```c
/**
 * Initialize QRNG subsystem
 *
 * @param config QRNG configuration
 * @param error  Optional error details
 * @return ZIPMINATOR_SUCCESS on success
 */
int zipminator_qrng_init(
    const zipminator_config_t *config,
    zipminator_error_t *error
);

/**
 * Get QRNG health status
 *
 * @param health [OUT] Health status structure
 * @param error  [OUT] Optional error details
 * @return ZIPMINATOR_SUCCESS on success
 */
typedef struct {
    bool is_healthy;
    uint64_t entropy_bits_generated;
    uint32_t health_check_failures;
    double throughput_mbps;
    char device_model[64];
} zipminator_qrng_health_t;

int zipminator_qrng_get_health(
    zipminator_qrng_health_t *health,
    zipminator_error_t *error
);

/**
 * Manually generate random bytes (for testing)
 *
 * @param buffer [OUT] Random bytes buffer
 * @param length [IN]  Number of bytes requested
 * @param error  [OUT] Optional error details
 * @return ZIPMINATOR_SUCCESS on success
 */
int zipminator_qrng_get_bytes(
    uint8_t *buffer,
    size_t length,
    zipminator_error_t *error
);

/**
 * Shutdown QRNG subsystem
 */
void zipminator_qrng_cleanup(void);
```

---

## Initialization and Cleanup

```c
/**
 * Initialize Zipminator library
 * MUST be called before any other API functions
 *
 * @param config Library configuration (NULL for defaults)
 * @param error  Optional error details
 * @return ZIPMINATOR_SUCCESS on success
 */
int zipminator_init(
    const zipminator_config_t *config,
    zipminator_error_t *error
);

/**
 * Get default configuration
 */
zipminator_config_t zipminator_get_default_config(void);

/**
 * Cleanup and shutdown Zipminator library
 * Should be called before program exit
 */
void zipminator_cleanup(void);

/**
 * Get library version information
 */
typedef struct {
    uint8_t major;
    uint8_t minor;
    uint8_t patch;
    char git_commit[8];
    bool fips_mode;
    bool qrng_available;
} zipminator_version_t;

void zipminator_get_version(zipminator_version_t *version);
```

---

## Error Handling

### Error Codes

```c
#define ZIPMINATOR_SUCCESS              0
#define ZIPMINATOR_ERROR_INVALID_PARAM  -1
#define ZIPMINATOR_ERROR_QRNG_FAILURE   -2
#define ZIPMINATOR_ERROR_MEMORY         -3
#define ZIPMINATOR_ERROR_CRYPTO         -4
#define ZIPMINATOR_ERROR_NOT_INITIALIZED -5
#define ZIPMINATOR_ERROR_SIGNATURE_INVALID -6
#define ZIPMINATOR_ERROR_BUFFER_TOO_SMALL -7
```

### Error Handling Example

```c
zipminator_error_t error;
uint8_t pk[1184], sk[2400];

int result = zipminator_kyber768_keygen(pk, sk, &error);
if (result != ZIPMINATOR_SUCCESS) {
    fprintf(stderr, "Error: %s (code %d)\n", error.message, error.code);
    fprintf(stderr, "Location: %s:%d\n", error.file, error.line);
    return -1;
}
```

---

## Performance Benchmarks

**Hardware:** Intel Xeon E5-2686 v4 (AVX2 support)
**Compiler:** GCC 11.4, -O3 -march=native

| Operation | Kyber-512 | Kyber-768 | Kyber-1024 | Dilithium-2 | Dilithium-3 | Dilithium-5 |
|-----------|-----------|-----------|------------|-------------|-------------|-------------|
| KeyGen | 0.007ms | 0.011ms | 0.015ms | 0.026ms | 0.045ms | 0.070ms |
| Encaps | 0.007ms | 0.011ms | 0.015ms | - | - | - |
| Decaps | 0.008ms | 0.012ms | 0.017ms | - | - | - |
| Sign | - | - | - | 0.077ms | 0.120ms | 0.144ms |
| Verify | - | - | - | 0.028ms | 0.045ms | 0.071ms |

**QRNG Overhead:** <0.01ms per operation (negligible)

---

## Thread Safety

All Zipminator API functions are **thread-safe** when:
1. Library initialized with `zipminator_init()` before spawning threads
2. Each thread uses separate key/buffer memory
3. QRNG hardware supports concurrent access (most do)

**Note:** Key generation operations internally synchronize QRNG access.

---

## CNSA 2.0 Compliance

Zipminator is **CNSA 2.0 compliant** per NSA guidelines:

| Requirement | Implementation |
|-------------|----------------|
| Key Establishment | ML-KEM-1024 (Kyber-1024) |
| Digital Signatures | ML-DSA-87 (Dilithium-5) |
| Entropy Source | NIST SP 800-90B certified QRNG |
| Symmetric Encryption | AES-256 (via standard libraries) |
| Hashing | SHA-384/512 (via standard libraries) |

**Recommended Configuration:**
```c
zipminator_config_t config = {
    .entropy_source = ZIPMINATOR_ENTROPY_QRNG,
    .enable_side_channel_protection = true,
    .enable_fault_protection = true,
    .qrng_health_check_interval_ms = 100
};
```

---

## Contact and Support

- **Documentation:** https://zipminator.qdaria.com/docs
- **GitHub:** https://github.com/qdaria/zipminator
- **Issues:** https://github.com/qdaria/zipminator/issues
- **Email:** support@qdaria.com

**FIPS 140-3 Validation:** In progress (Module Certificate #XXXXX)
**Common Criteria:** EAL4+ certification planned Q2 2026
