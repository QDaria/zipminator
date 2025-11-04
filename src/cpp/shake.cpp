/**
 * SHAKE-128 and SHAKE-256 (Keccak-based XOF)
 *
 * Minimal implementation for Kyber-768
 * In production, use optimized library (OpenSSL, libsodium, etc.)
 *
 * This is a reference implementation for completeness
 */

#include <cstdint>
#include <cstring>

#define SHAKE128_RATE 168
#define SHAKE256_RATE 136

namespace {

// Keccak-f[1600] round constants
static const uint64_t keccak_round_constants[24] = {
    0x0000000000000001ULL, 0x0000000000008082ULL,
    0x800000000000808aULL, 0x8000000080008000ULL,
    0x000000000000808bULL, 0x0000000080000001ULL,
    0x8000000080008081ULL, 0x8000000000008009ULL,
    0x000000000000008aULL, 0x0000000000000088ULL,
    0x0000000080008009ULL, 0x000000008000000aULL,
    0x000000008000808bULL, 0x800000000000008bULL,
    0x8000000000008089ULL, 0x8000000000008003ULL,
    0x8000000000008002ULL, 0x8000000000000080ULL,
    0x000000000000800aULL, 0x800000008000000aULL,
    0x8000000080008081ULL, 0x8000000000008080ULL,
    0x0000000080000001ULL, 0x8000000080008008ULL
};

static inline uint64_t ROL64(uint64_t x, int offset) {
    return (x << offset) | (x >> (64 - offset));
}

/**
 * Keccak-f[1600] permutation (24 rounds)
 * Constant-time implementation
 */
static void keccak_f1600(uint64_t state[25]) {
    uint64_t C[5], D[5], B[25];

    for (int round = 0; round < 24; round++) {
        // Theta step
        for (int i = 0; i < 5; i++) {
            C[i] = state[i] ^ state[i + 5] ^ state[i + 10] ^ state[i + 15] ^ state[i + 20];
        }
        for (int i = 0; i < 5; i++) {
            D[i] = C[(i + 4) % 5] ^ ROL64(C[(i + 1) % 5], 1);
        }
        for (int i = 0; i < 25; i++) {
            state[i] ^= D[i % 5];
        }

        // Rho and Pi steps
        B[0] = state[0];
        B[10] = ROL64(state[1], 1);
        B[20] = ROL64(state[2], 62);
        B[5] = ROL64(state[3], 28);
        B[15] = ROL64(state[4], 27);
        B[16] = ROL64(state[5], 36);
        B[1] = ROL64(state[6], 44);
        B[11] = ROL64(state[7], 6);
        B[21] = ROL64(state[8], 55);
        B[6] = ROL64(state[9], 20);
        B[7] = ROL64(state[10], 3);
        B[17] = ROL64(state[11], 10);
        B[2] = ROL64(state[12], 43);
        B[12] = ROL64(state[13], 25);
        B[22] = ROL64(state[14], 39);
        B[23] = ROL64(state[15], 41);
        B[8] = ROL64(state[16], 45);
        B[18] = ROL64(state[17], 15);
        B[3] = ROL64(state[18], 21);
        B[13] = ROL64(state[19], 8);
        B[14] = ROL64(state[20], 18);
        B[24] = ROL64(state[21], 2);
        B[9] = ROL64(state[22], 61);
        B[19] = ROL64(state[23], 56);
        B[4] = ROL64(state[24], 14);

        // Chi step
        for (int i = 0; i < 25; i += 5) {
            for (int j = 0; j < 5; j++) {
                state[i + j] = B[i + j] ^ ((~B[i + (j + 1) % 5]) & B[i + (j + 2) % 5]);
            }
        }

        // Iota step
        state[0] ^= keccak_round_constants[round];
    }
}

/**
 * Absorb data into Keccak sponge
 */
static void keccak_absorb(uint64_t state[25], const uint8_t *in, size_t inlen, size_t rate) {
    // Pad with 0x1F for SHAKE (domain separation)
    uint8_t temp[200] = {0};
    memcpy(temp, in, inlen);
    temp[inlen] = 0x1F;
    temp[rate - 1] |= 0x80;

    // XOR into state
    for (size_t i = 0; i < rate / 8; i++) {
        uint64_t word = 0;
        for (int j = 0; j < 8; j++) {
            word |= ((uint64_t)temp[8*i + j]) << (8*j);
        }
        state[i] ^= word;
    }

    keccak_f1600(state);
}

/**
 * Squeeze data from Keccak sponge
 */
static void keccak_squeeze(uint64_t state[25], uint8_t *out, size_t outlen, size_t rate) {
    size_t pos = 0;

    while (pos < outlen) {
        size_t blocksize = (outlen - pos < rate) ? (outlen - pos) : rate;

        // Extract from state
        for (size_t i = 0; i < blocksize; i++) {
            out[pos + i] = (state[i / 8] >> (8 * (i % 8))) & 0xFF;
        }

        pos += blocksize;

        if (pos < outlen) {
            keccak_f1600(state);
        }
    }
}

} // anonymous namespace

/**
 * SHAKE-128 (rate = 168 bytes)
 */
extern "C" void shake128(uint8_t *out, size_t outlen, const uint8_t *in, size_t inlen) {
    uint64_t state[25] = {0};
    keccak_absorb(state, in, inlen, SHAKE128_RATE);
    keccak_squeeze(state, out, outlen, SHAKE128_RATE);
}

/**
 * SHAKE-256 (rate = 136 bytes)
 */
extern "C" void shake256(uint8_t *out, size_t outlen, const uint8_t *in, size_t inlen) {
    uint64_t state[25] = {0};
    keccak_absorb(state, in, inlen, SHAKE256_RATE);
    keccak_squeeze(state, out, outlen, SHAKE256_RATE);
}
