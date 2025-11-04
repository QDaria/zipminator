# NIST Known Answer Test (KAT) Suite for Kyber-768

## Overview

This directory contains comprehensive Known Answer Test (KAT) validation for both C++ and Rust implementations of CRYSTALS-Kyber-768, ensuring compliance with NIST FIPS 203 (ML-KEM) standards.

## Purpose

KAT validation is **REQUIRED** for:
- FIPS 203 certification
- Production deployment confidence
- Standards compliance verification
- Regression testing

## Directory Structure

```
compliance/nist-kat/
├── src/
│   ├── cpp/
│   │   ├── deterministic_rng.h      # Deterministic RNG for testing
│   │   ├── deterministic_rng.cpp
│   │   └── nist_kat_kyber768.cpp    # C++ KAT test suite
│   └── rust/
│       ├── deterministic_rng.rs     # Deterministic RNG for testing
│       ├── nist_kat.rs              # Rust KAT test suite
│       └── main.rs                  # Test runner
├── test_vectors/
│   └── (NIST official test vectors)
├── reports/
│   └── (Generated validation reports)
├── Cargo.toml                        # Rust project configuration
├── Makefile                          # Build system
└── README.md                         # This file
```

## Building

### Prerequisites

**C++ Requirements:**
- GCC 9+ or Clang 10+
- OpenSSL development libraries
- AVX2-capable CPU (for full performance)

```bash
# Ubuntu/Debian
sudo apt-get install build-essential libssl-dev

# macOS
brew install openssl
```

**Rust Requirements:**
- Rust 1.70+
- Cargo

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Build Commands

```bash
# Build everything
make all

# Build C++ only
make cpp

# Build Rust only
make rust
```

## Test Vectors

### Official NIST Vectors

Download official FIPS 203 test vectors:

1. **Source**: https://github.com/post-quantum-cryptography/KAT
2. **File**: `PQCkemKAT_Kyber768.rsp` (or similar)
3. **Location**: Place in `test_vectors/` directory

```bash
cd test_vectors/
wget https://github.com/post-quantum-cryptography/KAT/raw/main/CRYSTALS-Kyber/PQCkemKAT_3168.rsp
mv PQCkemKAT_3168.rsp kyber768.rsp
```

### Sample Vectors

If official vectors are unavailable, the test suite generates sample vectors using the implementation itself. These provide basic validation but **do not substitute for official NIST vectors** for certification purposes.

## Running Tests

### Quick Test (Sample Vectors)

```bash
# C++
make test-cpp

# Rust
make test-rust

# Both
make test
```

### Full NIST Validation

```bash
# Ensure test vectors are downloaded
ls test_vectors/kyber768.rsp

# Run full validation
make test

# Generate certification report
make report
```

## Test Coverage

The KAT suite validates:

1. **KeyGen**: Deterministic key generation
   - Seed → (Public Key, Secret Key)
   - Verify byte-for-byte match with expected values

2. **Encapsulation**: Shared secret generation
   - Public Key + Randomness → (Ciphertext, Shared Secret)
   - Verify ciphertext and shared secret match expected

3. **Decapsulation**: Secret recovery
   - Secret Key + Ciphertext → Shared Secret
   - Verify shared secret matches encapsulation output

4. **Round-trip**: Full operation cycle
   - KeyGen → Encaps → Decaps
   - Verify encapsulation and decapsulation produce identical secrets

5. **Edge Cases**: Boundary conditions
   - Maximum/minimum values
   - Special seeds
   - Error conditions

## Deterministic RNG

### Purpose

KAT testing requires **reproducible randomness** to validate against known test vectors. The deterministic RNG provides:

- Seeded PRNG (AES-256-CTR-DRBG)
- Byte-for-byte reproducibility
- NIST SP 800-90A compliance

### ⚠️ CRITICAL WARNING

**The deterministic RNG is FOR TESTING ONLY**. Never use it in production:

```cpp
// ❌ NEVER DO THIS IN PRODUCTION
kat::g_kat_rng = &my_drbg;  // TESTING ONLY!

// ✅ Production code uses secure RNG
randombytes(buffer, len);  // Uses OS entropy
```

## Validation Report

The validation report documents:

1. **Test Results**: Pass/fail for each vector
2. **Coverage**: Number of vectors tested
3. **Deviations**: Any differences from expected values
4. **Certification Readiness**: Assessment for FIPS submission

Generate report:

```bash
make report
# Output: reports/validation_report_YYYYMMDD_HHMMSS.md
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: NIST KAT Validation

on: [push, pull_request]

jobs:
  kat-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y build-essential libssl-dev
          curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

      - name: Download test vectors
        run: |
          cd compliance/nist-kat/test_vectors
          wget https://github.com/post-quantum-cryptography/KAT/raw/main/CRYSTALS-Kyber/PQCkemKAT_3168.rsp

      - name: Build and test
        run: |
          cd compliance/nist-kat
          make all
          make test

      - name: Generate report
        run: |
          cd compliance/nist-kat
          make report

      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: kat-validation-report
          path: compliance/nist-kat/reports/
```

## Expected Output

### Successful Test

```
==================================================
NIST Known Answer Test (KAT) for Kyber-768
FIPS 203 (ML-KEM) Compliance Validation
==================================================

Running 100 test vectors...

Testing: KAT_Vector_0
  Testing KeyGen...
  ✓ Public key matches
  ✓ Secret key matches
  Testing Encapsulation...
  ✓ Ciphertext matches
  ✓ Shared secret matches
  Testing Decapsulation...
  ✓ Decapsulation matches
  ✓ Round-trip verified
✓ Test PASSED: KAT_Vector_0

[... more tests ...]

==================================================
NIST KAT Test Results
==================================================
Total Tests:  100
Passed:       100 ✓
Failed:       0
Success Rate: 100.0%
==================================================
```

### Failed Test (Example)

```
Testing: KAT_Vector_42
  Testing KeyGen...
  ERROR: Public Key mismatch at byte 156
  Expected: 3a4f92e1...
  Actual:   3a4f92e2...
✗ Test FAILED: KAT_Vector_42
```

## Troubleshooting

### Build Errors

**OpenSSL not found (C++):**
```bash
# Ubuntu/Debian
sudo apt-get install libssl-dev

# macOS
export LDFLAGS="-L/usr/local/opt/openssl/lib"
export CPPFLAGS="-I/usr/local/opt/openssl/include"
```

**Rust dependencies:**
```bash
cargo clean
cargo update
cargo build --release
```

### Test Failures

1. **Vector format mismatch**: Ensure test vectors match NIST format
2. **Implementation bugs**: Compare with reference implementation
3. **Endianness issues**: Verify byte ordering on your platform
4. **Timing issues**: KAT should be deterministic; investigate RNG

## Performance

KAT tests are **not** performance benchmarks. They run with deterministic RNG which may be slower than production RNG. For performance testing, see `benchmarks/` directory.

## Certification

For FIPS 203 certification submission, you must:

1. ✅ Pass **all** official NIST test vectors
2. ✅ Document any deviations (with justification)
3. ✅ Include validation report
4. ✅ Demonstrate constant-time implementation
5. ✅ Provide security analysis

This KAT suite addresses requirement #1. See other compliance documentation for remaining requirements.

## References

- [NIST FIPS 203](https://csrc.nist.gov/pubs/fips/203/final) - ML-KEM Standard
- [CRYSTALS-Kyber](https://pq-crystals.org/kyber/) - Official website
- [NIST PQC Project](https://csrc.nist.gov/projects/post-quantum-cryptography) - Post-quantum cryptography
- [NIST SP 800-90A](https://csrc.nist.gov/publications/detail/sp/800-90a/rev-1/final) - DRBG specification

## License

This KAT suite follows the same license as the main project. Test vectors are from NIST (public domain).

## Support

For questions about:
- **KAT failures**: Check implementation against reference
- **Test vectors**: Contact NIST PQC team
- **Certification**: Consult CMVP (NIST/CSE)
