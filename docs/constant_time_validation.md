# Constant-Time Validation Framework

## Overview

This document describes the constant-time validation framework for Kyber-768 implementations using differential uniformity detection (dudect).

**Security Principle**: Even ONE timing leak invalidates the entire implementation for cryptographic use.

## Framework Components

### 1. Test Harnesses

Located in `/tests/constant_time/`:

- **`dudect_cpp.c`**: Tests C++/AVX2 implementation
- **`dudect_rust.c`**: Tests Rust implementation with `subtle` crate
- **`dudect_mojo.c`**: Tests Mojo implementation (expected to FAIL)

### 2. Test Categories

#### Critical Tests (Must Pass)

1. **NTT with Secret Data** (30% of execution time)
   - Tests: Forward NTT, Inverse NTT
   - Risk: Highest - leaks secret polynomial coefficients
   - Input classes: Small coefficients vs. near-modulus values

2. **Decapsulation Comparison** (IND-CCA2 security)
   - Tests: Ciphertext validation in `crypto_kem_dec`
   - Risk: Critical - enables chosen-ciphertext attacks
   - Input classes: Valid vs. invalid ciphertexts

3. **Constant-Time Comparison** (Foundation)
   - Tests: Buffer equality checks
   - Risk: Critical - used throughout protocol
   - Input classes: Equal vs. unequal buffers

#### Secondary Tests

4. **Montgomery Reduction** (Arithmetic primitive)
   - Tests: Modular reduction operations
   - Risk: Medium - used in all computations
   - Input classes: Small vs. large values

5. **Rejection Sampling** (Matrix generation)
   - Tests: Uniform polynomial sampling
   - Risk: Medium - used in key generation
   - Input classes: Various rejection rates

## Test Methodology

### Statistical Confidence

- **Minimum samples**: 10,000,000 per test
- **Confidence level**: p < 0.001 (t-statistic > 3.29)
- **Verdict**: PASS, FAIL, or UNKNOWN

### Dudect Approach

Dudect uses a t-test to detect timing differences between two input classes:

1. **Prepare inputs**: Create two classes with different properties
2. **Execute**: Run implementation many times, measuring timing
3. **Analyze**: Statistical t-test to detect timing dependence on input class
4. **Verdict**:
   - PASS: No statistical evidence of timing leak (t < 3.29)
   - FAIL: Timing leak detected (t > 3.29)
   - UNKNOWN: Insufficient statistical power

## Running Tests

### Quick Start

```bash
cd /Users/mos/dev/qdaria-qrng/tests/constant_time

# Run all tests for all implementations
./run_dudect.sh all

# Run specific implementation
./run_dudect.sh cpp    # C++/AVX2
./run_dudect.sh rust   # Rust
./run_dudect.sh mojo   # Mojo (expected to fail)
```

### Individual Tests

```bash
# C++ tests
./build/kyber768_dudect ntt
./build/kyber768_dudect decaps
./build/kyber768_dudect montgomery

# Rust tests
cargo test --release --features constant-time-tests -- --nocapture

# Mojo tests (if available)
./build/mojo_dudect all
```

## Expected Results

### C++/AVX2 Implementation

**Expected**: PASS (with caveats)

- Manual constant-time coding required
- Compiler optimizations may introduce leaks
- AVX2 intrinsics should be constant-time if used correctly

**Critical areas**:
- Montgomery reduction: Use `__builtin_constant_p()` guards
- Comparison operations: Use bitwise operations, not branches
- Array indexing: Avoid secret-dependent indices

### Rust Implementation

**Expected**: PASS (high confidence)

- `subtle` crate provides constant-time primitives
- Memory safety prevents certain classes of timing leaks
- `ConstantTimeEq` trait for comparisons
- `ConditionallySelectable` for constant-time selection

**Advantages**:
- Compiler less likely to optimize away constant-time code
- Type system enforces usage of CT primitives
- Growing cryptographic ecosystem

### Mojo Implementation

**Expected**: FAIL (or UNKNOWN)

**Risk Assessment**:
- **No documented constant-time guarantees**
- **No cryptographic library ecosystem**
- **Compiler optimization behavior unknown**
- **SIMD operations may introduce timing variations**

**If PASS**: UNEXPECTED - requires deep investigation:
1. Manual assembly inspection
2. Test with different compiler flags
3. Verify on multiple architectures
4. Increase sample size to 100M+
5. Consult with Mojo language team

**If FAIL**: Expected result - use C++ or Rust for production

## Implementation Requirements

### Constant-Time Coding Rules

1. **No Secret-Dependent Branches**
   ```c
   // ❌ BAD: Timing depends on secret value
   if (secret_value > threshold) {
       do_operation_a();
   } else {
       do_operation_b();
   }

   // ✅ GOOD: Both paths always executed
   mask = ct_is_greater(secret_value, threshold);
   result = ct_select(mask, operation_a(), operation_b());
   ```

2. **No Secret-Dependent Memory Access**
   ```c
   // ❌ BAD: Array index depends on secret
   value = table[secret_index];

   // ✅ GOOD: Constant-time table lookup
   value = ct_lookup(table, table_size, secret_index);
   ```

3. **Use Constant-Time Primitives**
   ```rust
   // ✅ GOOD: Rust with subtle crate
   use subtle::{ConstantTimeEq, ConditionallySelectable};

   let equal = a.ct_eq(&b);  // Returns Choice (CT boolean)
   let selected = u8::conditional_select(&a, &b, equal);
   ```

4. **Avoid Variable-Time CPU Instructions**
   - Division: `div` has variable timing
   - Modulo: `mod` has variable timing
   - Use Barrett or Montgomery reduction instead

## Integration with Swarm

### Pre-Task Hook

```bash
npx claude-flow@alpha hooks pre-task --description "Constant-time validation with dudect"
```

### Post-Edit Hook

```bash
npx claude-flow@alpha hooks post-edit \
  --file "tests/constant_time/dudect_cpp.c" \
  --memory-key "swarm/validation/constant-time"
```

### Post-Task Hook

```bash
npx claude-flow@alpha hooks post-task --task-id "constant-time-validation"
```

### Memory Coordination

Store validation results:
```bash
npx claude-flow@alpha memory store \
  --key "swarm/validation/security-results" \
  --value '{"cpp": "PASS", "rust": "PASS", "mojo": "FAIL"}' \
  --namespace "coordination"
```

Retrieve results:
```bash
npx claude-flow@alpha memory retrieve \
  --key "swarm/validation/security-results" \
  --namespace "coordination"
```

## Interpreting Results

### PASS Result

- ✅ No statistical evidence of timing leak
- ✅ Safe for production use (subject to audit)
- ✅ Meets FIPS 203 / CNSA 2.0 requirements

**Next steps**:
1. Document in security assessment
2. Proceed with deployment planning
3. Periodic re-testing with new compiler versions

### FAIL Result

- ❌ Timing leak detected
- ❌ **DO NOT USE IN PRODUCTION**
- ❌ Violates IND-CCA2 security requirement

**Required actions**:
1. Identify source of timing leak (assembly inspection)
2. Review compiler optimization flags
3. Audit all secret-dependent operations
4. Re-implement with constant-time primitives
5. Re-test until PASS

### UNKNOWN Result

- ⚠️ Insufficient statistical power
- ⚠️ Cannot determine with confidence

**Required actions**:
1. Increase sample size (10x minimum)
2. Check for implementation bugs
3. Verify test harness correctness
4. Consider alternative testing approaches

## Security Recommendations

### For Production Deployment

1. **Primary**: Use implementation that PASSes validation
2. **Verify**: Re-test after any code changes
3. **Audit**: Professional cryptographic audit before deployment
4. **Monitor**: Continuous security monitoring in production

### If All Implementations FAIL

**This is a CRITICAL security issue:**

1. 🔴 **STOP**: Do not deploy to production
2. 🔴 **Audit**: Comprehensive security review required
3. 🔴 **Consult**: Engage cryptography experts
4. 🔴 **Re-implement**: Use proven constant-time libraries

## References

### Dudect

- **Paper**: "dudect: Dude, is my code constant time?" (Reparaz et al.)
- **Repository**: https://github.com/oreparaz/dudect
- **Methodology**: Differential timing analysis with t-test

### NIST Standards

- **FIPS 203**: ML-KEM (Kyber) standard
- **SP 800-56C**: Key derivation methods
- **SP 800-185**: SHA-3 derived functions

### Constant-Time Resources

- **BearSSL**: Constant-time implementation guide
- **libsodium**: Example constant-time library
- **Rust subtle crate**: https://docs.rs/subtle/
- **ct-verif**: Formal verification tool

## Appendix: Test Configuration

### Dudect Parameters

```c
#define NUMBER_MEASUREMENTS 10000000  // 10M samples
#define T_THRESHOLD 3.29              // p < 0.001
#define PERCENTILE 0.10               // Use 10th percentile of timings
```

### CPU Configuration

- **Disable turbo boost**: Reduces timing noise
- **Fix CPU frequency**: Improves measurement precision
- **Disable hyper-threading**: Reduces cache contention
- **Isolate core**: Use taskset to bind to single core

### Example Setup

```bash
# Disable CPU frequency scaling
sudo cpupower frequency-set --governor performance

# Isolate CPU core 0
sudo cset shield -c 0 -k on

# Run test on isolated core
sudo cset shield -e ./kyber768_dudect -- all
```

---

**Remember**: Security is non-negotiable. A FAIL result is as valuable as a PASS—it tells us what NOT to use in production.
