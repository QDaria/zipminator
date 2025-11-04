/**
 * Deterministic Random Number Generator for NIST KAT Testing
 *
 * WARNING: FOR TESTING ONLY - NOT FOR PRODUCTION USE
 *
 * This DRBG implementation provides reproducible randomness from a seed
 * to enable Known Answer Test (KAT) validation against NIST test vectors.
 */

#ifndef DETERMINISTIC_RNG_H
#define DETERMINISTIC_RNG_H

#include <cstdint>
#include <cstring>
#include <array>
#include <openssl/evp.h>
#include <openssl/sha.h>

namespace kat {

/**
 * AES-256-CTR-DRBG for deterministic KAT testing
 * Implements NIST SP 800-90A (simplified for testing)
 */
class DeterministicRNG {
private:
    std::array<uint8_t, 32> key;
    std::array<uint8_t, 16> v;
    bool initialized;

    void update(const uint8_t* provided_data = nullptr) {
        uint8_t temp[48] = {0};

        // Generate temp using AES-CTR
        EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
        EVP_EncryptInit_ex(ctx, EVP_aes_256_ctr(), nullptr, key.data(), v.data());

        int len;
        EVP_EncryptUpdate(ctx, temp, &len, temp, 48);
        EVP_CIPHER_CTX_free(ctx);

        // Mix in provided data if present
        if (provided_data) {
            for (size_t i = 0; i < 48; i++) {
                temp[i] ^= provided_data[i];
            }
        }

        // Update key and V
        std::memcpy(key.data(), temp, 32);
        std::memcpy(v.data(), temp + 32, 16);
    }

public:
    DeterministicRNG() : initialized(false) {
        key.fill(0);
        v.fill(0);
    }

    /**
     * Initialize DRBG with 48-byte seed
     * @param seed Entropy input (must be 48 bytes)
     */
    void seed(const uint8_t* seed) {
        // Initial key and V are zero
        key.fill(0);
        v.fill(0);

        // Update with seed material
        update(seed);
        initialized = true;
    }

    /**
     * Generate random bytes
     * @param out Output buffer
     * @param outlen Number of bytes to generate
     */
    void generate(uint8_t* out, size_t outlen) {
        if (!initialized) {
            throw std::runtime_error("DRBG not initialized");
        }

        // Generate in 16-byte blocks using AES-CTR
        EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
        EVP_EncryptInit_ex(ctx, EVP_aes_256_ctr(), nullptr, key.data(), v.data());

        int len;
        EVP_EncryptUpdate(ctx, out, &len, out, outlen);
        EVP_CIPHER_CTX_free(ctx);

        // Update state
        update();
    }

    /**
     * Create DRBG from hex seed string
     * @param hex_seed Hex-encoded 48-byte seed
     */
    static DeterministicRNG from_hex(const char* hex_seed) {
        DeterministicRNG rng;
        uint8_t seed[48];

        for (size_t i = 0; i < 48; i++) {
            sscanf(hex_seed + 2*i, "%2hhx", &seed[i]);
        }

        rng.seed(seed);
        return rng;
    }
};

/**
 * Global DRBG instance for KAT testing
 * Set this before running tests to make all crypto operations deterministic
 */
extern DeterministicRNG* g_kat_rng;

/**
 * RAII wrapper to temporarily set KAT RNG
 */
class ScopedKATRNG {
private:
    DeterministicRNG* old_rng;
    DeterministicRNG local_rng;

public:
    ScopedKATRNG(const uint8_t* seed) : old_rng(g_kat_rng) {
        local_rng.seed(seed);
        g_kat_rng = &local_rng;
    }

    ~ScopedKATRNG() {
        g_kat_rng = old_rng;
    }
};

} // namespace kat

#endif // DETERMINISTIC_RNG_H
