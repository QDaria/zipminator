# Constant-Time Validation Guide for Rust Kyber-768

## Overview

This document describes how to validate the constant-time properties of the Rust Kyber-768 implementation using dudect (DUal Differential Execution CoefficienT test).

## Why Constant-Time Matters

Timing side-channels are a critical vulnerability in cryptographic implementations:

- **Attack Vector**: Measuring execution time reveals secret key bits
- **Real-World Impact**: Remote timing attacks over networks
- **Regulatory Requirement**: High-assurance systems mandate constant-time crypto

## Critical Operations to Validate

### 1. NTT Butterfly Operations (~30% of runtime)

```rust
// File: src/ntt.rs
for j in start..start + len {
    let t = montgomery_reduce(zeta as i32 * poly[j + len] as i32);
    poly[j + len] = poly[j] - t;  // Must be constant-time
    poly[j] = poly[j] + t;        // Must be constant-time
}
```

**Risk**: Secret polynomial coefficients must not leak via timing

### 2. Montgomery Reduction

```rust
fn montgomery_reduce(a: i32) -> i16 {
    let t = (a as i64 * QINV as i64) & 0xFFFF;
    let t = (a as i64 - t * KYBER_Q as i64) >> 16;
    t as i16
}
```

**Risk**: Reduction of secret values must take constant time

### 3. Ciphertext Comparison (Decapsulation)

```rust
// File: src/kyber768.rs, decapsulate()
let ct_match = ct.data.ct_eq(&ct_prime.data);  // Uses subtle crate
```

**Risk**: Timing leak reveals ciphertext validity

## Validation Tools

### Option 1: dudect-bencher (Rust Native)

**Installation:**
```bash
cargo install dudect-bencher
```

**Create test file:** `/Users/mos/dev/qdaria-qrng/tests/rust/dudect_test.rs`

```rust
use dudect_bencher::{BenchRng, Class, ctbench_main, CtRunner};
use kyber768::*;

fn kyber_decaps_constant_time(runner: &mut CtRunner, _rng: &mut BenchRng) {
    let (pk, sk) = Kyber768::keypair();
    let (ct_valid, _) = Kyber768::encapsulate(&pk);

    // Create invalid ciphertext by tampering
    let mut ct_invalid = ct_valid.clone();
    ct_invalid.data[0] ^= 1;

    runner.run_one(Class::Left, || {
        // Measure decapsulation of VALID ciphertext
        let _ = Kyber768::decapsulate(&ct_valid, &sk);
    });

    runner.run_one(Class::Right, || {
        // Measure decapsulation of INVALID ciphertext
        let _ = Kyber768::decapsulate(&ct_invalid, &sk);
    });
}

ctbench_main!(kyber_decaps_constant_time);
```

**Run test:**
```bash
cargo test --test dudect_test -- --nocapture
```

**Interpretation:**
- **t-statistic < 10**: Likely constant-time ✅
- **t-statistic > 10**: Timing leak detected ❌

### Option 2: Manual Timing Analysis

**Create test:** `/Users/mos/dev/qdaria-qrng/tests/rust/timing_test.rs`

```rust
use std::time::Instant;
use kyber768::*;

#[test]
fn test_decaps_timing_uniformity() {
    const ITERATIONS: usize = 10000;
    let (pk, sk) = Kyber768::keypair();
    let (ct_valid, _) = Kyber768::encapsulate(&pk);

    let mut ct_invalid = ct_valid.clone();
    ct_invalid.data[0] ^= 1;

    // Measure valid ciphertext
    let mut valid_times = Vec::new();
    for _ in 0..ITERATIONS {
        let start = Instant::now();
        let _ = Kyber768::decapsulate(&ct_valid, &sk);
        valid_times.push(start.elapsed().as_nanos());
    }

    // Measure invalid ciphertext
    let mut invalid_times = Vec::new();
    for _ in 0..ITERATIONS {
        let start = Instant::now();
        let _ = Kyber768::decapsulate(&ct_invalid, &sk);
        invalid_times.push(start.elapsed().as_nanos());
    }

    // Statistical analysis
    let valid_mean: f64 = valid_times.iter().sum::<u128>() as f64 / ITERATIONS as f64;
    let invalid_mean: f64 = invalid_times.iter().sum::<u128>() as f64 / ITERATIONS as f64;

    let diff_percent = ((valid_mean - invalid_mean).abs() / valid_mean) * 100.0;

    println!("Valid ciphertext mean: {:.2} ns", valid_mean);
    println!("Invalid ciphertext mean: {:.2} ns", invalid_mean);
    println!("Difference: {:.2}%", diff_percent);

    // Assert < 1% timing difference (adjust threshold based on requirements)
    assert!(diff_percent < 1.0, "Timing leak detected: {:.2}% difference", diff_percent);
}
```

### Option 3: Professional Audit Tool

For production deployment, use commercial tools:

- **Valgrind + memcheck**: Memory access pattern analysis
- **Intel VTune**: Microarchitecture-level timing analysis
- **Side-Channel Analysis Lab**: Professional testing facility

## Rust's Built-In Protections

### Subtle Crate (`subtle::ConstantTimeEq`)

```rust
use subtle::ConstantTimeEq;

// Constant-time comparison
let match = a.ct_eq(&b);  // Returns Choice (0 or 1), no branching

// Constant-time conditional selection
let result = Choice::from(condition).select(value_if_true, value_if_false);
```

**Compiler Output Analysis:**
```bash
cargo rustc --release -- --emit asm
# Inspect assembly for timing leaks
```

## Common Pitfalls & Mitigations

### 1. Early Return on Invalid Input

❌ **Vulnerable:**
```rust
if invalid_ciphertext {
    return error;  // Early return = timing leak!
}
```

✅ **Secure:**
```rust
let is_valid = check_ciphertext();  // Compute in constant time
let result = Choice::from(is_valid).select(
    compute_valid_result(),
    compute_dummy_result()  // Always compute both paths
);
```

### 2. Secret-Dependent Indexing

❌ **Vulnerable:**
```rust
let value = table[secret_index];  // Cache timing leak
```

✅ **Secure:**
```rust
// Access all indices, select result in constant time
let mut result = 0;
for i in 0..table.len() {
    let mask = subtle::Choice::from(((i == secret_index) as u8));
    result = mask.select(table[i], result);
}
```

### 3. Compiler Optimizations

**Risk**: Compiler may introduce timing leaks during optimization

**Mitigation:**
```rust
use core::sync::atomic::{compiler_fence, Ordering};

fn constant_time_operation(secret: i16) -> i16 {
    compiler_fence(Ordering::SeqCst);  // Prevent reordering
    let result = expensive_operation(secret);
    compiler_fence(Ordering::SeqCst);
    result
}
```

## Validation Checklist

- [ ] Run dudect-bencher on decapsulation
- [ ] Verify NTT operations are branchless
- [ ] Check Montgomery reduction has no conditional branches
- [ ] Validate ciphertext comparison uses `subtle::ct_eq`
- [ ] Analyze compiler assembly output
- [ ] Test under different CPU loads (to detect cache timing)
- [ ] Verify no early returns on secret-dependent conditions

## Integration with CI/CD

**GitHub Actions Example:**

```yaml
name: Constant-Time Validation

on: [push, pull_request]

jobs:
  dudect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - name: Install dudect-bencher
        run: cargo install dudect-bencher
      - name: Run constant-time tests
        run: cargo test --test dudect_test -- --nocapture
      - name: Fail if timing leak detected
        run: |
          if grep "t-statistic.*[0-9][0-9]\." dudect_output.txt; then
            echo "Timing leak detected!"
            exit 1
          fi
```

## Reporting Results

### Format for Benchmark Report

```markdown
## Constant-Time Validation Results

### Methodology
- Tool: dudect-bencher v0.5.0
- Test: Decapsulation of valid vs invalid ciphertexts
- Iterations: 1,000,000
- Platform: Intel i7-9700K @ 3.6GHz

### Results
| Operation | t-statistic | Status |
|-----------|-------------|--------|
| Decaps (valid vs invalid) | 2.3 | ✅ PASS |
| NTT butterfly | 1.8 | ✅ PASS |
| Montgomery reduction | 0.9 | ✅ PASS |

### Interpretation
All critical operations show t-statistics < 10, indicating no detectable timing leaks.

### Confidence Level
- **High**: 1M+ measurements per operation
- **Threat Model**: Remote network attacker
- **Recommendation**: APPROVED for deployment
```

## Next Steps

1. **Immediate**: Run manual timing tests to establish baseline
2. **Short-term**: Integrate dudect-bencher into test suite
3. **Long-term**: Professional side-channel analysis lab testing

## References

- [Dudect Paper](https://ia.cr/2016/1123): "Dude, is my code constant time?"
- [Subtle Crate Docs](https://docs.rs/subtle/): Rust constant-time primitives
- [NIST SP 800-56C Rev. 2](https://csrc.nist.gov/publications/detail/sp/800-56c/rev-2/final): Side-channel resistance requirements

---

**Author**: Zipminator Rust Agent
**Date**: 2025-10-30
**Status**: Ready for Validation
