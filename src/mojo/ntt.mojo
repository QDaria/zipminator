"""
Number Theoretic Transform (NTT) Module for Kyber-768
======================================================

EXPERIMENTAL IMPLEMENTATION - Research Quality Only

This module implements the NTT and inverse NTT operations which are critical
for efficient polynomial multiplication in Kyber-768.

The NTT accounts for approximately 30% of Kyber's execution time, making it
the primary target for optimization.

CRITICAL SECURITY CONCERNS:
1. NTT must be constant-time to prevent timing side-channels
2. Memory access patterns must not depend on secret data
3. Mojo compiler behavior for these properties is UNKNOWN
4. SIMD operations may introduce timing variations

PERFORMANCE TARGET (from C++/AVX2 baseline):
- NTT: ~0.003ms per polynomial (approximately 30% of 0.011ms KeyGen)
- Must achieve similar performance to be viable
"""

from memory import memcpy
from algorithm import vectorize
from math import mod
from poly import Polynomial, KYBER_N, KYBER_Q


# Precomputed constants for NTT
# These are the powers of the primitive root omega in bit-reversed order
alias ZETAS: StaticTuple[Int, 128] = StaticTuple[Int, 128](
    -1044, -758, -359, -1517, 1493, 1422, 287, 202,
    -171, 622, 1577, 182, 962, -1202, -1474, 1468,
    573, -1325, 264, 383, -829, 1458, -1602, -130,
    -681, 1017, 732, 608, -1542, 411, -205, -1571,
    1223, 652, -552, 1015, -1293, 1491, -282, -1544,
    516, -8, -320, -666, -1618, -1162, 126, 1469,
    -853, -90, -271, 830, 107, -1421, -247, -951,
    -398, 961, -1508, -725, 448, -1065, 677, -1275,
    -1103, 430, 555, 843, -1251, 871, 1550, 105,
    422, 587, 177, -235, -291, -460, 1574, 1653,
    -246, 778, 1159, -147, -777, 1483, -602, 1119,
    -1590, 644, -872, 349, 418, 329, -156, -75,
    817, 1097, 603, 610, 1322, -1285, -1465, 384,
    -1215, -136, 1218, -1335, -874, 220, -1187, -1659,
    -1185, -1530, -1278, 794, -1510, -854, -870, 478,
    -108, -308, 996, 991, 958, -1460, 1522, 1628
)

# Inverse NTT constants
alias ZETAS_INV: StaticTuple[Int, 128] = StaticTuple[Int, 128](
    -1517, -359, -758, -1044, 202, 287, 1422, 1493,
    -1474, -1202, 962, 182, 1577, 622, -171, 202,
    1468, 573, -1325, 264, 383, -829, 1458, -1602,
    -130, -681, 1017, 732, 608, -1542, 411, -205,
    -1571, 1223, 652, -552, 1015, -1293, 1491, -282,
    -1544, 516, -8, -320, -666, -1618, -1162, 126,
    1469, -853, -90, -271, 830, 107, -1421, -247,
    -951, -398, 961, -1508, -725, 448, -1065, 677,
    -1275, -1103, 430, 555, 843, -1251, 871, 1550,
    105, 422, 587, 177, -235, -291, -460, 1574,
    1653, -246, 778, 1159, -147, -777, 1483, -602,
    1119, -1590, 644, -872, 349, 418, 329, -156,
    -75, 817, 1097, 603, 610, 1322, -1285, -1465,
    384, -1215, -136, 1218, -1335, -874, 220, -1187,
    -1659, -1185, -1530, -1278, 794, -1510, -854, -870,
    478, -108, -308, 996, 991, 958, -1460, 1522, 1628
)

# Montgomery reduction constant: R^2 mod q where R = 2^16
alias MONT_R: Int = 2285  # 2^16 mod 3329
alias MONT_R_INV: Int = 169  # Inverse of 2^16 mod 3329
alias Q_INV: Int = 62209  # -q^-1 mod 2^16


@always_inline
fn montgomery_reduce(a: Int) -> Int:
    """
    Montgomery reduction: computes a * R^-1 mod q.

    CRITICAL TIMING CONCERN: This function MUST be constant-time!
    The conditional branches here MAY introduce timing side-channels.

    The Mojo compiler's handling of this code is UNDOCUMENTED.
    """
    # Standard Montgomery reduction algorithm
    let t = (a * Q_INV) & 0xFFFF
    let u = (a + t * KYBER_Q) >> 16

    var result = u
    # TIMING RISK: Conditional reduction may not be constant-time
    if result >= KYBER_Q:
        result -= KYBER_Q

    return result


@always_inline
fn barrett_reduce(a: Int) -> Int:
    """
    Barrett reduction: fast modular reduction.

    TIMING CONCERN: Similar to Montgomery reduction, this may not be constant-time.
    """
    # Barrett reduction constant: floor(2^26 / q)
    let v = ((1 << 26) + KYBER_Q // 2) // KYBER_Q
    let t = (v * a + (1 << 25)) >> 26

    var result = a - t * KYBER_Q

    # TIMING RISK: Conditional branches
    while result >= KYBER_Q:
        result -= KYBER_Q
    while result < 0:
        result += KYBER_Q

    return result


fn ntt(inout poly: Polynomial):
    """
    Forward Number Theoretic Transform (in-place).

    This is the MOST CRITICAL function for Kyber performance.

    PERFORMANCE TARGET: ~3 microseconds (30% of 11 microsecond KeyGen)

    ALGORITHM: Cooley-Tukey radix-2 decimation-in-time FFT
    - 7 layers of butterfly operations
    - 128 butterflies per layer
    - Total: 896 butterflies (log2(256) * 256/2)

    SECURITY: Memory access pattern is data-independent (good!)
    But modular reductions may have timing variations (bad!)
    """
    var k = 1
    var len = 128

    # 7 layers of NTT
    for layer in range(7):  # log2(256) = 7 layers
        var start = 0

        while start < KYBER_N:
            let zeta = ZETAS[k]
            k += 1

            # Process butterfly operations
            # ATTEMPT: Use SIMD for parallel butterfly operations
            # SUCCESS UNCERTAIN: Mojo's SIMD for complex patterns is unproven

            for j in range(start, start + len):
                let idx1 = j
                let idx2 = j + len

                # Butterfly operation
                let t = montgomery_reduce(zeta * poly.coeffs[idx2])
                poly.coeffs[idx2] = poly.coeffs[idx1] - t
                poly.coeffs[idx1] = poly.coeffs[idx1] + t

                # Barrett reduction to keep values in range
                poly.coeffs[idx1] = barrett_reduce(poly.coeffs[idx1])
                poly.coeffs[idx2] = barrett_reduce(poly.coeffs[idx2])

            start += 2 * len

        len = len >> 1


fn intt(inout poly: Polynomial):
    """
    Inverse Number Theoretic Transform (in-place).

    PERFORMANCE TARGET: ~3 microseconds (30% of 12 microsecond Decaps)

    Similar to forward NTT but with different constants and final scaling.
    """
    var k = 127
    var len = 2

    # 7 layers of inverse NTT
    for layer in range(7):
        var start = 0

        while start < KYBER_N:
            let zeta = ZETAS_INV[k]
            k -= 1

            for j in range(start, start + len):
                let idx1 = j
                let idx2 = j + len

                # Inverse butterfly operation
                let t = poly.coeffs[idx1]
                poly.coeffs[idx1] = barrett_reduce(t + poly.coeffs[idx2])
                poly.coeffs[idx2] = montgomery_reduce(zeta * (poly.coeffs[idx2] - t))

            start += 2 * len

        len = len << 1

    # Final scaling by n^-1 = 128^-1 mod q
    # For q=3329, n=256: n^-1 mod q = 3303
    let n_inv = 3303

    for i in range(KYBER_N):
        poly.coeffs[i] = montgomery_reduce(poly.coeffs[i] * n_inv)


fn ntt_vector(inout polys: DTypePointer[Polynomial], k: Int):
    """
    Apply NTT to a vector of polynomials.

    OPTIMIZATION OPPORTUNITY: These k transforms are independent and
    could be parallelized. However, Mojo's parallel primitives for
    complex operations are untested.
    """
    for i in range(k):
        ntt(polys[i])


fn intt_vector(inout polys: DTypePointer[Polynomial], k: Int):
    """Apply inverse NTT to a vector of polynomials."""
    for i in range(k):
        intt(polys[i])


fn basemul_montgomery(a0: Int, a1: Int, b0: Int, b1: Int, zeta: Int) -> (Int, Int):
    """
    Multiplication of two polynomials in NTT domain (base case).

    This implements multiplication in the base ring Z_q[x]/(x^2 - zeta).
    Used for pointwise multiplication in NTT domain.

    PERFORMANCE: Uses Montgomery arithmetic for efficiency.
    SECURITY: Should be constant-time if Montgomery reduction is.
    """
    let r0 = montgomery_reduce(a1 * b1)
    let r0_zeta = montgomery_reduce(r0 * zeta)
    let c0 = montgomery_reduce(a0 * b0) + r0_zeta

    let c1 = montgomery_reduce(a0 * b1) + montgomery_reduce(a1 * b0)

    return (c0, c1)


fn poly_basemul_montgomery(inout result: Polynomial, a: Polynomial, b: Polynomial):
    """
    Multiply two polynomials in NTT domain.

    This is the actual polynomial multiplication used after NTT transform.
    Critical for performance - accounts for ~40% of execution time.
    """
    var k = 0

    for i in range(0, KYBER_N, 4):
        let zeta = ZETAS[64 + k]
        k += 1

        let (c0, c1) = basemul_montgomery(
            a.coeffs[i], a.coeffs[i + 1],
            b.coeffs[i], b.coeffs[i + 1],
            zeta
        )
        result.coeffs[i] = c0
        result.coeffs[i + 1] = c1

        let (c2, c3) = basemul_montgomery(
            a.coeffs[i + 2], a.coeffs[i + 3],
            b.coeffs[i + 2], b.coeffs[i + 3],
            -zeta
        )
        result.coeffs[i + 2] = c2
        result.coeffs[i + 3] = c3


fn main():
    """Test NTT operations and benchmark if possible."""
    print("Kyber-768 NTT Module")
    print("=" * 60)
    print("EXPERIMENTAL - Constant-time properties UNVERIFIED")
    print("=" * 60)

    # Create test polynomial
    var poly = Polynomial()
    for i in range(KYBER_N):
        poly.coeffs[i] = i % KYBER_Q

    print("\nOriginal polynomial first 8 coefficients:")
    for i in range(8):
        print("  coeff[" + str(i) + "] = " + str(poly.coeffs[i]))

    # Test forward NTT
    print("\nApplying forward NTT...")
    ntt(poly)
    print("✓ Forward NTT complete")

    print("\nNTT domain first 8 coefficients:")
    for i in range(8):
        print("  coeff[" + str(i) + "] = " + str(poly.coeffs[i]))

    # Test inverse NTT
    print("\nApplying inverse NTT...")
    intt(poly)
    print("✓ Inverse NTT complete")

    print("\nRecovered polynomial first 8 coefficients:")
    for i in range(8):
        print("  coeff[" + str(i) + "] = " + str(poly.coeffs[i]))

    # Check if we recovered original values
    var errors = 0
    for i in range(KYBER_N):
        let expected = i % KYBER_Q
        if poly.coeffs[i] != expected:
            errors += 1
            if errors <= 3:
                print("  ERROR at coeff[" + str(i) + "]: expected " +
                      str(expected) + ", got " + str(poly.coeffs[i]))

    print("\n" + "=" * 60)
    if errors == 0:
        print("✓ NTT/INTT correctness test PASSED")
    else:
        print("✗ NTT/INTT correctness test FAILED (" + str(errors) + " errors)")
    print("=" * 60)

    print("\nNOTE: Performance benchmarking requires:")
    print("  - Cycle counter access")
    print("  - Multiple iterations for statistical significance")
    print("  - Comparison against C++/AVX2 baseline (target: ~3µs)")
    print("\nCRITICAL: Timing side-channel testing required!")
    print("  Tool: dudect (differential uniformity detector)")
    print("  Focus: Montgomery/Barrett reduction operations")
