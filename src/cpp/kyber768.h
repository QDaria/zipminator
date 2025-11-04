/**
 * CRYSTALS-Kyber-768 Implementation (NIST Level 3 Security)
 *
 * This is the GOLD STANDARD implementation for performance benchmarking.
 * Target performance: 0.034ms total (KeyGen: 0.011ms, Encaps: 0.011ms, Decaps: 0.012ms)
 *
 * Security: Constant-time implementation with AVX2 optimization
 * Standard: NIST FIPS 203 (ML-KEM)
 */

#ifndef KYBER768_H
#define KYBER768_H

#include <cstdint>
#include <cstddef>

namespace kyber768 {

// Kyber-768 parameters (NIST Level 3)
constexpr size_t KYBER_K = 3;              // Matrix dimension
constexpr size_t KYBER_N = 256;            // Polynomial degree
constexpr size_t KYBER_Q = 3329;           // Prime modulus
constexpr size_t KYBER_SYMBYTES = 32;      // Symmetric key bytes

// Polynomial coefficients (q = 3329)
constexpr size_t KYBER_ETA1 = 2;           // Noise distribution parameter
constexpr size_t KYBER_ETA2 = 2;           // Noise distribution parameter
constexpr size_t KYBER_POLYBYTES = 384;    // Bytes per polynomial
constexpr size_t KYBER_POLYVECBYTES = KYBER_K * KYBER_POLYBYTES;

// Derived sizes
constexpr size_t KYBER_INDCPA_PUBLICKEYBYTES = KYBER_POLYVECBYTES + KYBER_SYMBYTES;
constexpr size_t KYBER_INDCPA_SECRETKEYBYTES = KYBER_POLYVECBYTES;
constexpr size_t KYBER_INDCPA_BYTES = KYBER_POLYVECBYTES + KYBER_POLYBYTES;

constexpr size_t KYBER_PUBLICKEYBYTES = KYBER_INDCPA_PUBLICKEYBYTES;
constexpr size_t KYBER_SECRETKEYBYTES = KYBER_INDCPA_SECRETKEYBYTES + KYBER_INDCPA_PUBLICKEYBYTES + 2*KYBER_SYMBYTES;
constexpr size_t KYBER_CIPHERTEXTBYTES = KYBER_INDCPA_BYTES;
constexpr size_t KYBER_SHAREDSECRETBYTES = 32;

// NTT constants
constexpr int16_t MONT = 2285;             // Montgomery factor 2^16 mod q
constexpr int16_t QINV = 62209;            // q^-1 mod 2^16

/**
 * Polynomial representation
 * Coefficients in [-q/2, q/2] range for constant-time operations
 */
struct alignas(32) Poly {
    int16_t coeffs[KYBER_N];

    Poly() : coeffs{0} {}
};

/**
 * Polynomial vector (dimension K)
 */
struct alignas(32) PolyVec {
    Poly vec[KYBER_K];

    PolyVec() : vec{} {}
};

/**
 * Performance measurement result
 */
struct PerfResult {
    uint64_t keygen_cycles;
    uint64_t encaps_cycles;
    uint64_t decaps_cycles;
    double keygen_ms;
    double encaps_ms;
    double decaps_ms;
};

/**
 * Generate a Kyber-768 keypair
 *
 * @param pk Public key output (KYBER_PUBLICKEYBYTES bytes)
 * @param sk Secret key output (KYBER_SECRETKEYBYTES bytes)
 * @return 0 on success, -1 on failure
 *
 * Constant-time guarantee: Execution time independent of random coins
 * Performance target: 0.011ms (AVX2 baseline)
 */
int crypto_kem_keypair(uint8_t *pk, uint8_t *sk);

/**
 * Generate shared secret and ciphertext (encapsulation)
 *
 * @param ct Ciphertext output (KYBER_CIPHERTEXTBYTES bytes)
 * @param ss Shared secret output (KYBER_SHAREDSECRETBYTES bytes)
 * @param pk Public key input (KYBER_PUBLICKEYBYTES bytes)
 * @return 0 on success, -1 on failure
 *
 * Constant-time guarantee: Execution time independent of public key and random coins
 * Performance target: 0.011ms (AVX2 baseline)
 */
int crypto_kem_enc(uint8_t *ct, uint8_t *ss, const uint8_t *pk);

/**
 * Recover shared secret from ciphertext (decapsulation)
 *
 * @param ss Shared secret output (KYBER_SHAREDSECRETBYTES bytes)
 * @param ct Ciphertext input (KYBER_CIPHERTEXTBYTES bytes)
 * @param sk Secret key input (KYBER_SECRETKEYBYTES bytes)
 * @return 0 on success, -1 on failure
 *
 * Constant-time guarantee: Execution time independent of secret key and ciphertext
 * Performance target: 0.012ms (AVX2 baseline)
 */
int crypto_kem_dec(uint8_t *ss, const uint8_t *ct, const uint8_t *sk);

/**
 * Run performance benchmark
 * Measures clock cycles for KeyGen, Encaps, Decaps operations
 *
 * @param iterations Number of iterations to average over
 * @return Performance results structure
 */
PerfResult benchmark(size_t iterations = 10000);

// Internal API (exposed for testing)
namespace internal {
    void poly_add(Poly *r, const Poly *a, const Poly *b);
    void poly_sub(Poly *r, const Poly *a, const Poly *b);
    void poly_ntt(Poly *r);
    void poly_invntt_tomont(Poly *r);
    void poly_basemul_montgomery(Poly *r, const Poly *a, const Poly *b);
    void poly_tomont(Poly *r);
    void poly_reduce(Poly *r);

    void polyvec_ntt(PolyVec *r);
    void polyvec_invntt_tomont(PolyVec *r);
    void polyvec_add(PolyVec *r, const PolyVec *a, const PolyVec *b);
    void polyvec_pointwise_acc_montgomery(Poly *r, const PolyVec *a, const PolyVec *b);

    // Constant-time utilities
    int16_t barrett_reduce(int16_t a);
    int16_t montgomery_reduce(int32_t a);
    int16_t fqmul(int16_t a, int16_t b);

    // SHAKE-128 and SHAKE-256 for Kyber
    void shake128_absorb(const uint8_t *in, size_t inlen);
    void shake256_absorb(const uint8_t *in, size_t inlen);
    void shake128_squeezeblocks(uint8_t *out, size_t nblocks);
    void shake256_squeezeblocks(uint8_t *out, size_t nblocks);

    // CBD (Centered Binomial Distribution) sampling
    void cbd_eta1(Poly *r, const uint8_t *buf);
    void cbd_eta2(Poly *r, const uint8_t *buf);

    // Serialization
    void poly_tobytes(uint8_t *r, const Poly *a);
    void poly_frombytes(Poly *r, const uint8_t *a);
    void polyvec_tobytes(uint8_t *r, const PolyVec *a);
    void polyvec_frombytes(PolyVec *r, const uint8_t *a);
}

} // namespace kyber768

#endif // KYBER768_H
