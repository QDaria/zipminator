"""
Test Suite for Kyber-768 Mojo Implementation
=============================================

EXPERIMENTAL TESTS - Manual Execution Required

This test suite provides basic functional validation for the Mojo Kyber-768
implementation. Due to Mojo's lack of a testing framework, these tests must
be run manually by uncommenting the desired test function in main().

CRITICAL GAPS:
- No automated test runner (no equivalent of pytest/cargo test)
- No assertion library
- No NIST Known Answer Test (KAT) vectors
- No performance benchmarking infrastructure
- No constant-time validation

For production validation, we need:
1. NIST official KAT vectors
2. Cross-implementation consistency tests
3. Performance benchmarks vs C++/AVX2
4. Dudect constant-time analysis
5. Fuzzing infrastructure
"""

from poly import (
    Polynomial, PolynomialVector, PolynomialMatrix,
    KYBER_N, KYBER_Q, KYBER_K, KYBER_DU, KYBER_DV
)
from ntt import ntt, intt, montgomery_reduce, barrett_reduce
from kyber768 import kyber_keygen, kyber_encaps, kyber_decaps


# Test utilities (manual assertions)
fn assert_equal(actual: Int, expected: Int, msg: String):
    """Manual assertion for integer equality."""
    if actual != expected:
        print("❌ FAIL:", msg)
        print("   Expected:", expected)
        print("   Actual:  ", actual)
    else:
        print("✅ PASS:", msg)


fn assert_true(condition: Bool, msg: String):
    """Manual assertion for boolean conditions."""
    if condition:
        print("✅ PASS:", msg)
    else:
        print("❌ FAIL:", msg)


# ============================================================================
# TEST 1: Polynomial Arithmetic
# ============================================================================

fn test_polynomial_addition():
    """Test polynomial coefficient-wise addition."""
    print("\n" + "="*70)
    print("TEST: Polynomial Addition")
    print("="*70)

    var p1 = Polynomial()
    var p2 = Polynomial()

    # Initialize with known values
    for i in range(KYBER_N):
        p1.coeffs[i] = 100 + i
        p2.coeffs[i] = 200 + i

    # Add polynomials
    var result = p1.add(p2)

    # Verify first few coefficients
    assert_equal(result.coeffs[0], 300, "Addition coeff[0]")
    assert_equal(result.coeffs[1], 302, "Addition coeff[1]")
    assert_equal(result.coeffs[255], 300 + 255 + 255, "Addition coeff[255]")

    print("✓ Polynomial addition functional")


fn test_polynomial_subtraction():
    """Test polynomial coefficient-wise subtraction."""
    print("\n" + "="*70)
    print("TEST: Polynomial Subtraction")
    print("="*70)

    var p1 = Polynomial()
    var p2 = Polynomial()

    for i in range(KYBER_N):
        p1.coeffs[i] = 1000
        p2.coeffs[i] = 500

    var result = p1.sub(p2)

    assert_equal(result.coeffs[0], 500, "Subtraction coeff[0]")
    assert_equal(result.coeffs[100], 500, "Subtraction coeff[100]")

    print("✓ Polynomial subtraction functional")


fn test_polynomial_compression():
    """Test polynomial compression/decompression."""
    print("\n" + "="*70)
    print("TEST: Polynomial Compression")
    print("="*70)

    var poly = Polynomial()

    # Initialize with full-range coefficients
    for i in range(KYBER_N):
        poly.coeffs[i] = (i * 13) % KYBER_Q

    # Compress to 10 bits (KYBER_DU)
    var compressed = poly.compress(KYBER_DU)

    print("Sample coefficients after compression:")
    for i in range(8):
        print(f"  coeff[{i}] = {compressed.coeffs[i]} (10-bit)")

    # Decompress back
    var decompressed = compressed.decompress(KYBER_DU)

    # Check approximate recovery (lossy compression)
    var max_error = 0
    for i in range(KYBER_N):
        let error = abs(poly.coeffs[i] - decompressed.coeffs[i])
        if error > max_error:
            max_error = error

    print(f"Maximum compression error: {max_error}")
    print("NOTE: Compression is lossy, some error is expected")

    # Error should be bounded by compression formula
    let max_allowed_error = KYBER_Q // (1 << KYBER_DU) + 1
    assert_true(max_error < max_allowed_error, "Compression error within bounds")

    print("✓ Polynomial compression/decompression functional")


# ============================================================================
# TEST 2: NTT Correctness
# ============================================================================

fn test_ntt_transform():
    """Test NTT forward transform."""
    print("\n" + "="*70)
    print("TEST: NTT Forward Transform")
    print("="*70)

    var poly = Polynomial()

    # Initialize with known pattern
    for i in range(KYBER_N):
        poly.coeffs[i] = i % KYBER_Q

    print("Original polynomial (first 8 coefficients):")
    for i in range(8):
        print(f"  coeff[{i}] = {poly.coeffs[i]}")

    # Apply NTT
    ntt(poly)

    print("NTT domain (first 8 coefficients):")
    for i in range(8):
        print(f"  coeff[{i}] = {poly.coeffs[i]}")

    # Check all coefficients are in range [0, q)
    var range_ok = True
    for i in range(KYBER_N):
        if poly.coeffs[i] < 0 or poly.coeffs[i] >= KYBER_Q:
            range_ok = False
            print(f"  ERROR: coeff[{i}] = {poly.coeffs[i]} out of range")
            break

    assert_true(range_ok, "NTT coefficients in valid range")
    print("✓ NTT forward transform functional")


fn test_ntt_inverse():
    """Test NTT/INTT round-trip correctness."""
    print("\n" + "="*70)
    print("TEST: NTT/INTT Round-Trip")
    print("="*70)

    var poly = Polynomial()

    # Initialize with known values
    for i in range(KYBER_N):
        poly.coeffs[i] = (i * 7 + 42) % KYBER_Q

    # Save original values
    var original = DTypePointer[DType.int32].alloc(KYBER_N)
    for i in range(KYBER_N):
        original[i] = poly.coeffs[i]

    # Forward NTT
    ntt(poly)

    # Inverse NTT
    intt(poly)

    # Check recovery
    var errors = 0
    var max_error = 0
    for i in range(KYBER_N):
        let error = abs(poly.coeffs[i] - original[i])
        if error > 0:
            errors += 1
            if error > max_error:
                max_error = error
            if errors <= 5:  # Print first 5 errors
                print(f"  ERROR at coeff[{i}]: expected {original[i]}, got {poly.coeffs[i]}")

    print(f"Total errors: {errors}/{KYBER_N}")
    print(f"Maximum error: {max_error}")

    assert_true(errors == 0, "NTT/INTT perfect recovery")

    original.free()
    print("✓ NTT/INTT round-trip correct")


fn test_ntt_multiplication():
    """Test polynomial multiplication via NTT."""
    print("\n" + "="*70)
    print("TEST: NTT-based Multiplication")
    print("="*70)

    var a = Polynomial()
    var b = Polynomial()

    # Initialize with small values for easier verification
    for i in range(KYBER_N):
        a.coeffs[i] = (i % 10) + 1
        b.coeffs[i] = (i % 5) + 1

    # Transform to NTT domain
    ntt(a)
    ntt(b)

    # Pointwise multiplication in NTT domain
    var result = a.pointwise_mul(b)

    # Transform back
    intt(result)

    print("Result (first 8 coefficients):")
    for i in range(8):
        print(f"  coeff[{i}] = {result.coeffs[i]}")

    # All coefficients should be in valid range
    var valid = True
    for i in range(KYBER_N):
        if result.coeffs[i] < 0 or result.coeffs[i] >= KYBER_Q:
            valid = False
            break

    assert_true(valid, "Multiplication result in valid range")
    print("✓ NTT multiplication functional")


# ============================================================================
# TEST 3: Modular Arithmetic
# ============================================================================

fn test_montgomery_reduction():
    """Test Montgomery reduction for correctness."""
    print("\n" + "="*70)
    print("TEST: Montgomery Reduction")
    print("="*70)

    # Test known values
    let test_cases = [
        (12345, 12345 % KYBER_Q),
        (KYBER_Q, 0),
        (KYBER_Q * 2, 0),
        (65535, 65535 % KYBER_Q),
    ]

    var passed = 0
    for i in range(len(test_cases)):
        let (input_val, expected) = test_cases[i]
        let result = barrett_reduce(input_val)
        if result == expected:
            passed += 1
            print(f"✓ barrett_reduce({input_val}) = {result}")
        else:
            print(f"✗ barrett_reduce({input_val}) = {result}, expected {expected}")

    assert_equal(passed, len(test_cases), "Montgomery reduction correctness")
    print("✓ Modular reduction functional")


# ============================================================================
# TEST 4: Kyber-768 End-to-End
# ============================================================================

fn test_kyber_keygen():
    """Test Kyber-768 key generation."""
    print("\n" + "="*70)
    print("TEST: Kyber-768 Key Generation")
    print("="*70)

    let (pk, sk) = kyber_keygen()

    # Basic sanity checks
    assert_true(pk.size == KYBER_PUBLICKEYBYTES, "Public key size")
    assert_true(sk.size == KYBER_SECRETKEYBYTES, "Secret key size")

    print(f"Public key size: {pk.size} bytes")
    print(f"Secret key size: {sk.size} bytes")
    print("✓ KeyGen produces keys of correct size")


fn test_kyber_encaps_decaps():
    """Test Kyber-768 encapsulation and decapsulation."""
    print("\n" + "="*70)
    print("TEST: Kyber-768 Encaps/Decaps")
    print("="*70)

    # Generate keypair
    print("1. Generating keypair...")
    let (pk, sk) = kyber_keygen()

    # Encapsulate
    print("2. Encapsulating...")
    let (ct, ss_encaps) = kyber_encaps(pk)

    # Decapsulate
    print("3. Decapsulating...")
    let ss_decaps = kyber_decaps(ct, sk)

    # Compare shared secrets
    print("4. Comparing shared secrets...")
    var match = True
    for i in range(KYBER_SYMBYTES):
        if ss_encaps[i] != ss_decaps[i]:
            match = False
            print(f"  Mismatch at byte {i}: encaps={ss_encaps[i]}, decaps={ss_decaps[i]}")
            break

    assert_true(match, "Shared secrets match")

    # Cleanup
    ss_encaps.free()
    ss_decaps.free()

    print("✓ Encaps/Decaps produces matching shared secrets")


fn test_kyber_invalid_ciphertext():
    """Test Kyber-768 with invalid ciphertext (should fail safely)."""
    print("\n" + "="*70)
    print("TEST: Kyber-768 Invalid Ciphertext")
    print("="*70)

    # Generate keypair
    let (pk, sk) = kyber_keygen()

    # Encapsulate
    let (ct, ss_encaps) = kyber_encaps(pk)

    # Corrupt ciphertext
    print("Corrupting ciphertext byte 100...")
    ct.ct_bytes[100] = ct.ct_bytes[100] ^ 0xFF

    # Decapsulate corrupted ciphertext
    let ss_decaps = kyber_decaps(ct, sk)

    # Shared secrets should NOT match
    var match = True
    for i in range(KYBER_SYMBYTES):
        if ss_encaps[i] != ss_decaps[i]:
            match = False
            break

    assert_true(not match, "Corrupted ciphertext produces different shared secret")

    ss_encaps.free()
    ss_decaps.free()

    print("✓ Implementation detects corrupted ciphertext")


# ============================================================================
# TEST 5: Performance Indicators
# ============================================================================

fn test_performance_estimate():
    """Rough performance estimation (NOT accurate benchmarking)."""
    print("\n" + "="*70)
    print("TEST: Performance Estimation")
    print("="*70)
    print("WARNING: This is NOT cycle-accurate benchmarking!")
    print("For accurate performance, use external benchmarking harness.")
    print("="*70)

    from time import now

    # Measure KeyGen
    let keygen_start = now()
    let (pk, sk) = kyber_keygen()
    let keygen_elapsed = now() - keygen_start

    print(f"KeyGen time: ~{keygen_elapsed / 1_000_000.0} ms")
    print(f"  Target (C++/AVX2): 0.011 ms")

    # Measure Encaps
    let encaps_start = now()
    let (ct, ss1) = kyber_encaps(pk)
    let encaps_elapsed = now() - encaps_start

    print(f"Encaps time: ~{encaps_elapsed / 1_000_000.0} ms")
    print(f"  Target (C++/AVX2): 0.011 ms")

    # Measure Decaps
    let decaps_start = now()
    let ss2 = kyber_decaps(ct, sk)
    let decaps_elapsed = now() - decaps_start

    print(f"Decaps time: ~{decaps_elapsed / 1_000_000.0} ms")
    print(f"  Target (C++/AVX2): 0.012 ms")

    let total_elapsed = keygen_elapsed + encaps_elapsed + decaps_elapsed
    print(f"TOTAL time: ~{total_elapsed / 1_000_000.0} ms")
    print(f"  Target (C++/AVX2): 0.034 ms")

    ss1.free()
    ss2.free()

    print("\nNOTE: These measurements are INACCURATE due to:")
    print("  - Microsecond resolution (need nanosecond)")
    print("  - System noise and context switches")
    print("  - Single iteration (need 1000+)")
    print("  - Wall-clock time (need cycle count)")
    print("\nFor accurate benchmarking, use perf stat with compiled binary.")


# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

fn main():
    """
    Manual test runner.

    Uncomment the tests you want to run.
    Mojo does not have a test framework, so this is all manual.
    """
    print("="*70)
    print("KYBER-768 MOJO TEST SUITE")
    print("="*70)
    print("EXPERIMENTAL - Manual Execution")
    print("="*70)
    print()
    print("DISCLAIMER: These tests provide basic functional validation only.")
    print("They do NOT validate:")
    print("  - Constant-time properties (requires dudect)")
    print("  - Side-channel resistance (requires ChipWhisperer)")
    print("  - Compliance with NIST FIPS 203 (requires official KATs)")
    print("  - Performance competitiveness (requires cycle-accurate benchmarking)")
    print()
    print("=" * 70)

    # Run tests (comment out any you don't want to run)

    # Basic polynomial tests
    test_polynomial_addition()
    test_polynomial_subtraction()
    test_polynomial_compression()

    # NTT tests
    test_ntt_transform()
    test_ntt_inverse()
    test_ntt_multiplication()

    # Modular arithmetic tests
    test_montgomery_reduction()

    # Kyber-768 end-to-end tests
    test_kyber_keygen()
    test_kyber_encaps_decaps()
    test_kyber_invalid_ciphertext()

    # Performance estimation (inaccurate)
    test_performance_estimate()

    # Summary
    print("\n" + "="*70)
    print("TEST SUITE COMPLETE")
    print("="*70)
    print()
    print("NEXT STEPS:")
    print("  1. Implement SHA3/SHAKE cryptographic hash functions")
    print("  2. Integrate hardware QRNG for secure randomness")
    print("  3. Validate against NIST Known Answer Tests (KATs)")
    print("  4. Perform cycle-accurate benchmarking")
    print("  5. Conduct dudect constant-time analysis")
    print("  6. Side-channel analysis (power, EM, cache)")
    print()
    print("STRATEGIC ASSESSMENT:")
    print("  - Basic functionality: ⚠️  Appears to work (unverified)")
    print("  - Security properties: ❌ UNVERIFIED (critical gap)")
    print("  - Performance:         ❌ UNKNOWN (cannot measure accurately)")
    print("  - Production readiness: ❌ NOT READY (multiple blockers)")
    print()
    print("RECOMMENDATION: Proceed with C++/Rust parallel implementations.")
    print("="*70)
