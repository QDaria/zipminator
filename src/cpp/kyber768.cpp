/**
 * CRYSTALS-Kyber-768 Core Implementation
 *
 * This implements the three main KEM operations:
 * - crypto_kem_keypair: Generate public/secret keypair
 * - crypto_kem_enc: Encapsulate shared secret (encryption)
 * - crypto_kem_dec: Decapsulate shared secret (decryption)
 *
 * All operations are constant-time for security
 * Performance targets: KeyGen=0.011ms, Encaps=0.011ms, Decaps=0.012ms
 */

#include "kyber768.h"
#include <cstring>
#include <cstdlib>
#include <x86intrin.h>

// For SHAKE (we'll use a minimal implementation or link to OpenSSL/libsodium)
// For this reference implementation, we'll provide stubs with notes
extern "C" {
    // These would typically come from a crypto library like libsodium or OpenSSL
    void shake128(uint8_t *out, size_t outlen, const uint8_t *in, size_t inlen);
    void shake256(uint8_t *out, size_t outlen, const uint8_t *in, size_t inlen);
}

namespace kyber768 {
namespace internal {

// Forward declarations for internal functions
static void gen_matrix(PolyVec *a, const uint8_t *seed, bool transposed);
static void prf(uint8_t *out, size_t outlen, const uint8_t *key, uint8_t nonce);
static void kdf(uint8_t *out, const uint8_t *in, size_t inlen);

/**
 * Centered Binomial Distribution sampling (η=2 for Kyber-768)
 * Samples polynomial with coefficients from {-2, -1, 0, 1, 2}
 * Constant-time implementation
 */
void cbd_eta2(Poly *r, const uint8_t *buf) {
    uint32_t t, d;
    int16_t a, b;

    for (size_t i = 0; i < KYBER_N / 4; i++) {
        // Load 4 bytes (for 4 coefficients with η=2)
        t = buf[2*i + 0] | ((uint32_t)buf[2*i + 1] << 8);

        d = t & 0x55555555;
        d += (t >> 1) & 0x55555555;

        for (size_t j = 0; j < 4; j++) {
            a = (d >> (8*j + 0)) & 0x3;
            b = (d >> (8*j + 4)) & 0x3;
            r->coeffs[4*i + j] = a - b;
        }
    }
}

// Alias for η=1 case (not used in Kyber-768 but included for completeness)
void cbd_eta1(Poly *r, const uint8_t *buf) {
    cbd_eta2(r, buf); // Kyber-768 uses η=2 for both
}

/**
 * Pseudo-random function (PRF) for noise generation
 * Uses SHAKE-256 as a PRF with key and nonce
 */
static void prf(uint8_t *out, size_t outlen, const uint8_t *key, uint8_t nonce) {
    uint8_t extkey[KYBER_SYMBYTES + 1];

    memcpy(extkey, key, KYBER_SYMBYTES);
    extkey[KYBER_SYMBYTES] = nonce;

    shake256(out, outlen, extkey, sizeof(extkey));
}

/**
 * Key derivation function (KDF)
 * Uses SHAKE-256 for final shared secret derivation
 */
static void kdf(uint8_t *out, const uint8_t *in, size_t inlen) {
    shake256(out, KYBER_SHAREDSECRETBYTES, in, inlen);
}

/**
 * Generate matrix A from seed using SHAKE-128
 * Matrix is K x K polynomial vectors
 * Constant-time: Rejection sampling uses constant-time comparisons
 */
static void gen_matrix(PolyVec *a, const uint8_t *seed, bool transposed) {
    uint8_t buf[3];
    memcpy(buf, seed, KYBER_SYMBYTES);

    for (size_t i = 0; i < KYBER_K; i++) {
        for (size_t j = 0; j < KYBER_K; j++) {
            // XOF domain separator
            if (transposed) {
                buf[KYBER_SYMBYTES + 0] = i;
                buf[KYBER_SYMBYTES + 1] = j;
            } else {
                buf[KYBER_SYMBYTES + 0] = j;
                buf[KYBER_SYMBYTES + 1] = i;
            }

            // Rejection sampling to generate uniform polynomial
            uint8_t xof_buf[SHAKE128_RATE * 3];
            shake128(xof_buf, sizeof(xof_buf), buf, sizeof(buf));

            size_t ctr = 0;
            size_t pos = 0;

            while (ctr < KYBER_N && pos + 2 <= sizeof(xof_buf)) {
                uint16_t val = xof_buf[pos] | ((uint16_t)xof_buf[pos + 1] << 8);
                val &= 0x1FFF; // 13 bits

                // Constant-time rejection
                uint16_t good = (val < KYBER_Q) ? 0xFFFF : 0x0000;
                a[i].vec[j].coeffs[ctr] = val & good | a[i].vec[j].coeffs[ctr] & ~good;
                ctr += (good & 1);

                pos += 2;
            }
        }
    }
}

} // namespace internal

/**
 * IND-CPA-secure Key Generation
 * Generates public key pk and secret key sk
 */
static int indcpa_keypair(uint8_t *pk, uint8_t *sk) {
    PolyVec a[KYBER_K], e, pkpv, skpv;
    uint8_t buf[2 * KYBER_SYMBYTES];
    uint8_t *publicseed = buf;
    uint8_t *noiseseed = buf + KYBER_SYMBYTES;
    uint8_t nonce = 0;

    // Generate random seed (in production, use hardware QRNG)
    // For now, using system randomness
    for (size_t i = 0; i < sizeof(buf); i++) {
        buf[i] = rand() & 0xFF; // FIXME: Replace with QRNG
    }

    shake256(buf, sizeof(buf), buf, KYBER_SYMBYTES);

    // Generate matrix A
    internal::gen_matrix(a, publicseed, false);

    // Generate secret vector s
    for (size_t i = 0; i < KYBER_K; i++) {
        uint8_t noise_buf[KYBER_ETA2 * KYBER_N / 4];
        internal::prf(noise_buf, sizeof(noise_buf), noiseseed, nonce++);
        internal::cbd_eta2(&skpv.vec[i], noise_buf);
    }

    // Generate error vector e
    for (size_t i = 0; i < KYBER_K; i++) {
        uint8_t noise_buf[KYBER_ETA2 * KYBER_N / 4];
        internal::prf(noise_buf, sizeof(noise_buf), noiseseed, nonce++);
        internal::cbd_eta2(&e.vec[i], noise_buf);
    }

    // Transform to NTT domain
    internal::polyvec_ntt(&skpv);
    internal::polyvec_ntt(&e);

    // Compute public key: pk = A*s + e
    for (size_t i = 0; i < KYBER_K; i++) {
        internal::polyvec_pointwise_acc_montgomery(&pkpv.vec[i], &a[i], &skpv);
        internal::poly_tomont(&pkpv.vec[i]);
    }

    internal::polyvec_add(&pkpv, &pkpv, &e);
    internal::polyvec_reduce(&pkpv);

    // Pack keys
    internal::polyvec_tobytes(sk, &skpv);
    internal::polyvec_tobytes(pk, &pkpv);
    memcpy(pk + KYBER_POLYVECBYTES, publicseed, KYBER_SYMBYTES);

    return 0;
}

/**
 * IND-CPA-secure Encryption
 * Encrypts message m under public key pk to produce ciphertext ct
 */
static int indcpa_enc(uint8_t *ct, const uint8_t *m, const uint8_t *pk, const uint8_t *coins) {
    PolyVec sp, pkpv, ep, at[KYBER_K], b;
    Poly v, k, epp;
    uint8_t seed[KYBER_SYMBYTES];
    uint8_t nonce = 0;

    // Unpack public key
    internal::polyvec_frombytes(&pkpv, pk);
    memcpy(seed, pk + KYBER_POLYVECBYTES, KYBER_SYMBYTES);

    // Unpack message into polynomial
    internal::poly_frommsg(&k, m);

    // Generate matrix A^T
    internal::gen_matrix(at, seed, true);

    // Generate ephemeral secret sp
    for (size_t i = 0; i < KYBER_K; i++) {
        uint8_t noise_buf[KYBER_ETA1 * KYBER_N / 4];
        internal::prf(noise_buf, sizeof(noise_buf), coins, nonce++);
        internal::cbd_eta1(&sp.vec[i], noise_buf);
    }

    // Generate error ep
    for (size_t i = 0; i < KYBER_K; i++) {
        uint8_t noise_buf[KYBER_ETA2 * KYBER_N / 4];
        internal::prf(noise_buf, sizeof(noise_buf), coins, nonce++);
        internal::cbd_eta2(&ep.vec[i], noise_buf);
    }

    // Generate error epp
    uint8_t noise_buf[KYBER_ETA2 * KYBER_N / 4];
    internal::prf(noise_buf, sizeof(noise_buf), coins, nonce++);
    internal::cbd_eta2(&epp, noise_buf);

    // Transform to NTT domain
    internal::polyvec_ntt(&sp);

    // Compute b = A^T * sp + ep
    for (size_t i = 0; i < KYBER_K; i++) {
        internal::polyvec_pointwise_acc_montgomery(&b.vec[i], &at[i], &sp);
    }

    internal::polyvec_invntt_tomont(&b);
    internal::polyvec_add(&b, &b, &ep);
    internal::polyvec_reduce(&b);

    // Compute v = pk^T * sp + epp + m
    internal::polyvec_pointwise_acc_montgomery(&v, &pkpv, &sp);
    internal::poly_invntt_tomont(&v);
    internal::poly_add(&v, &v, &epp);
    internal::poly_add(&v, &v, &k);
    internal::poly_reduce(&v);

    // Pack ciphertext
    internal::polyvec_compress(ct, &b);
    internal::poly_compress(ct + KYBER_POLYVECCOMPRESSEDBYTES, &v);

    return 0;
}

/**
 * IND-CPA-secure Decryption
 * Decrypts ciphertext ct under secret key sk to recover message m
 */
static int indcpa_dec(uint8_t *m, const uint8_t *ct, const uint8_t *sk) {
    PolyVec b, skpv;
    Poly v, mp;

    // Unpack ciphertext
    internal::polyvec_decompress(&b, ct);
    internal::poly_decompress(&v, ct + KYBER_POLYVECCOMPRESSEDBYTES);

    // Unpack secret key
    internal::polyvec_frombytes(&skpv, sk);

    // Transform b to NTT domain
    internal::polyvec_ntt(&b);

    // Compute mp = v - s^T * b
    internal::polyvec_pointwise_acc_montgomery(&mp, &skpv, &b);
    internal::poly_invntt_tomont(&mp);

    internal::poly_sub(&mp, &v, &mp);
    internal::poly_reduce(&mp);

    // Recover message
    internal::poly_tomsg(m, &mp);

    return 0;
}

/**
 * Generate Kyber-768 keypair (IND-CCA2 secure)
 */
int crypto_kem_keypair(uint8_t *pk, uint8_t *sk) {
    indcpa_keypair(pk, sk);

    // Copy public key into secret key for FO transform
    memcpy(sk + KYBER_INDCPA_SECRETKEYBYTES, pk, KYBER_PUBLICKEYBYTES);

    // Hash of public key
    uint8_t h[32];
    shake256(h, 32, pk, KYBER_PUBLICKEYBYTES);
    memcpy(sk + KYBER_SECRETKEYBYTES - 2*KYBER_SYMBYTES, h, KYBER_SYMBYTES);

    // Random value z for implicit rejection
    for (size_t i = 0; i < KYBER_SYMBYTES; i++) {
        sk[KYBER_SECRETKEYBYTES - KYBER_SYMBYTES + i] = rand() & 0xFF; // FIXME: Use QRNG
    }

    return 0;
}

/**
 * Encapsulation (IND-CCA2 secure via Fujisaki-Okamoto transform)
 */
int crypto_kem_enc(uint8_t *ct, uint8_t *ss, const uint8_t *pk) {
    uint8_t buf[2 * KYBER_SYMBYTES];
    uint8_t kr[2 * KYBER_SYMBYTES];

    // Random message m
    for (size_t i = 0; i < KYBER_SYMBYTES; i++) {
        buf[i] = rand() & 0xFF; // FIXME: Use QRNG
    }

    // Hash of public key
    shake256(buf + KYBER_SYMBYTES, KYBER_SYMBYTES, pk, KYBER_PUBLICKEYBYTES);

    // Derive key and randomness
    shake256(kr, 2 * KYBER_SYMBYTES, buf, 2 * KYBER_SYMBYTES);

    // Encrypt
    indcpa_enc(ct, buf, pk, kr + KYBER_SYMBYTES);

    // Hash ciphertext for shared secret
    shake256(kr + KYBER_SYMBYTES, KYBER_SYMBYTES, ct, KYBER_CIPHERTEXTBYTES);

    // Final shared secret
    kdf(ss, kr, 2 * KYBER_SYMBYTES);

    return 0;
}

/**
 * Decapsulation (IND-CCA2 secure)
 */
int crypto_kem_dec(uint8_t *ss, const uint8_t *ct, const uint8_t *sk) {
    uint8_t buf[2 * KYBER_SYMBYTES];
    uint8_t kr[2 * KYBER_SYMBYTES];
    uint8_t cmp[KYBER_CIPHERTEXTBYTES];
    const uint8_t *pk = sk + KYBER_INDCPA_SECRETKEYBYTES;

    // Decrypt
    indcpa_dec(buf, ct, sk);

    // Reconstruct coins
    memcpy(buf + KYBER_SYMBYTES, sk + KYBER_SECRETKEYBYTES - 2*KYBER_SYMBYTES, KYBER_SYMBYTES);
    shake256(kr, 2 * KYBER_SYMBYTES, buf, 2 * KYBER_SYMBYTES);

    // Re-encrypt for ciphertext validation
    indcpa_enc(cmp, buf, pk, kr + KYBER_SYMBYTES);

    // Constant-time comparison
    int fail = 0;
    for (size_t i = 0; i < KYBER_CIPHERTEXTBYTES; i++) {
        fail |= ct[i] ^ cmp[i];
    }
    fail = (-fail) >> 31; // 0 if equal, -1 if not

    // Hash ciphertext
    shake256(kr + KYBER_SYMBYTES, KYBER_SYMBYTES, ct, KYBER_CIPHERTEXTBYTES);

    // Constant-time select: Use kr if valid, else use z
    for (size_t i = 0; i < KYBER_SYMBYTES; i++) {
        kr[i] ^= fail & (kr[i] ^ sk[KYBER_SECRETKEYBYTES - KYBER_SYMBYTES + i]);
    }

    // Final shared secret
    kdf(ss, kr, 2 * KYBER_SYMBYTES);

    return 0;
}

/**
 * Performance benchmark with clock cycle measurement
 */
PerfResult benchmark(size_t iterations) {
    uint8_t pk[KYBER_PUBLICKEYBYTES];
    uint8_t sk[KYBER_SECRETKEYBYTES];
    uint8_t ct[KYBER_CIPHERTEXTBYTES];
    uint8_t ss_enc[KYBER_SHAREDSECRETBYTES];
    uint8_t ss_dec[KYBER_SHAREDSECRETBYTES];

    PerfResult result = {0};

    // Warm-up
    for (size_t i = 0; i < 100; i++) {
        crypto_kem_keypair(pk, sk);
    }

    // Benchmark KeyGen
    uint64_t start = __rdtsc();
    for (size_t i = 0; i < iterations; i++) {
        crypto_kem_keypair(pk, sk);
    }
    uint64_t end = __rdtsc();
    result.keygen_cycles = (end - start) / iterations;

    // Benchmark Encaps
    start = __rdtsc();
    for (size_t i = 0; i < iterations; i++) {
        crypto_kem_enc(ct, ss_enc, pk);
    }
    end = __rdtsc();
    result.encaps_cycles = (end - start) / iterations;

    // Benchmark Decaps
    start = __rdtsc();
    for (size_t i = 0; i < iterations; i++) {
        crypto_kem_dec(ss_dec, ct, sk);
    }
    end = __rdtsc();
    result.decaps_cycles = (end - start) / iterations;

    // Convert to milliseconds (assuming 3GHz CPU)
    const double CPU_FREQ = 3.0e9; // Adjust based on actual CPU
    result.keygen_ms = (result.keygen_cycles / CPU_FREQ) * 1000.0;
    result.encaps_ms = (result.encaps_cycles / CPU_FREQ) * 1000.0;
    result.decaps_ms = (result.decaps_cycles / CPU_FREQ) * 1000.0;

    return result;
}

} // namespace kyber768
