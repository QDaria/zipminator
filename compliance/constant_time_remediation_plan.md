# Constant-Time Validation Remediation Plan
## Execution Path for CRYSTALS-Kyber-768 Dudect Testing

**Date**: 2025-10-30
**Priority**: HIGH
**Status**: Ready for Execution (Pending Architecture Access)

---

## Quick Start: Immediate Execution Path

### For x86_64 Systems (RECOMMENDED)

If you have access to an x86_64 system with AVX2 support (Intel/AMD CPU from 2013+):

```bash
# 1. Verify AVX2 support
grep avx2 /proc/cpuinfo  # Linux
sysctl -a | grep avx2     # macOS

# 2. Navigate to test directory
cd /Users/mos/dev/qdaria-qrng/tests/constant_time

# 3. Build test executable
make clean
make dudect_cpp_test

# 4. Run quick smoke test (30 seconds)
make smoke_test

# 5. Run full validation (~60-90 minutes)
make test_cpp_all

# 6. Generate report
python3 generate_report.py results/
```

**Output**: Results in `/compliance/constant_time_results.md`

---

## Three Remediation Paths

### Path A: x86_64 Testing Environment ⭐ RECOMMENDED

**Priority**: HIGHEST
**Effort**: Setup time only
**Timeline**: Immediate (once hardware available)
**Confidence**: Tests actual production code

#### Requirements:
- Intel or AMD processor with AVX2 (2013 or newer)
- Linux (Ubuntu 20.04+) or macOS (x86_64, not ARM64)
- GCC 9+ or Clang 10+
- 4GB RAM, 10GB disk space
- Dedicated CPU time: 2-4 hours

#### Setup Options:

**Option A1: Cloud VM**
```bash
# AWS EC2 c5.large or c6i.large (AVX2 support)
# GCP c2-standard-4 (Cascade Lake, AVX2)
# Azure F4s_v2 (AVX2 support)

# Estimated cost: $0.50-1.00 for 4 hours
# Best for: Immediate one-time validation
```

**Option A2: Local x86_64 Machine**
```bash
# Any Intel/AMD desktop or laptop from 2013+
# Check: cat /proc/cpuinfo | grep avx2

# Best for: Iterative development and testing
```

**Option A3: GitHub Actions CI/CD**
```yaml
# .github/workflows/constant-time.yml
name: Constant-Time Validation
on: [push, pull_request]
jobs:
  dudect:
    runs-on: ubuntu-latest  # x86_64 with AVX2
    steps:
      - uses: actions/checkout@v3
      - name: Install Dependencies
        run: |
          git clone https://github.com/oreparaz/dudect.git /tmp/dudect
      - name: Build Tests
        run: |
          cd tests/constant_time
          make dudect_cpp_test
      - name: Run Validation
        run: |
          cd tests/constant_time
          timeout 2h make test_cpp_all
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: dudect-results
          path: tests/constant_time/results/
```

**Best for**: Continuous validation on every commit

---

### Path B: ARM64 NEON Port

**Priority**: MEDIUM (Long-term solution)
**Effort**: 40-60 hours development + 10 hours testing
**Timeline**: 1-2 weeks
**Risk**: MEDIUM (new code requires validation)

#### Implementation Plan:

**Phase 1: Create ARM64 SIMD Layer** (20 hours)

```cpp
// File: src/cpp/ntt_neon.cpp
#include <arm_neon.h>

namespace kyber768 {
namespace internal {

// Convert AVX2 operations to NEON
void poly_ntt_neon(Poly *r) {
    // Replace _mm256_* intrinsics with vld1q_*, vst1q_*, etc.
    // ARM NEON: 128-bit vectors (8x int16)
    // AVX2: 256-bit vectors (16x int16)
    // Need 2x NEON ops per AVX2 op

    for (size_t i = 0; i < KYBER_N; i += 8) {
        int16x8_t v = vld1q_s16(&r->coeffs[i]);
        // ... NTT butterfly operations ...
        vst1q_s16(&r->coeffs[i], v);
    }
}

} // namespace internal
} // namespace kyber768
```

**Phase 2: Conditional Compilation** (8 hours)

```cpp
// File: src/cpp/kyber768.h
#if defined(__AVX2__)
    #include "ntt_avx2.cpp"
    #include "poly_avx2.cpp"
#elif defined(__ARM_NEON)
    #include "ntt_neon.cpp"
    #include "poly_neon.cpp"
#else
    #include "ntt_portable.cpp"
    #include "poly_portable.cpp"
#endif
```

**Phase 3: Verification & Testing** (12 hours)
- Unit tests for NEON implementation
- Correctness tests (compare with AVX2 results)
- Performance benchmarking
- Dudect constant-time validation

**Phase 4: Code Review & Integration** (10 hours)
- Assembly inspection
- Security review
- Documentation
- CI/CD integration

#### Effort Breakdown:
| Task | Hours | Owner |
|------|-------|-------|
| NEON NTT implementation | 12 | Backend Dev |
| NEON polynomial ops | 8 | Backend Dev |
| Conditional compilation | 4 | Backend Dev |
| Unit tests | 6 | QA Specialist |
| Dudect validation | 4 | Security Team |
| Assembly review | 4 | Security Team |
| Documentation | 4 | Tech Writer |
| CI/CD integration | 4 | DevOps |
| **TOTAL** | **46 hours** | Multi-team |

---

### Path C: Rust FFI Testing (ARM64 Compatible)

**Priority**: MEDIUM (Quick validation option)
**Effort**: 8-12 hours
**Timeline**: 1-2 days
**Benefit**: Tests on ARM64 immediately

#### Implementation Steps:

**Step 1: Add FFI Exports to Rust** (4 hours)

```rust
// File: src/rust/src/lib.rs

use crate::ntt::ntt_forward;
use crate::poly::Poly;
use subtle::ConstantTimeEq;

/// Export NTT for dudect testing
#[no_mangle]
pub extern "C" fn rust_ntt(poly: *mut i16) {
    if poly.is_null() {
        return;
    }

    unsafe {
        let mut p = Poly::from_raw_parts(poly, 256);
        ntt_forward(&mut p);
    }
}

/// Export decapsulation for dudect testing
#[no_mangle]
pub extern "C" fn rust_decapsulate(
    ss_out: *mut u8,
    ciphertext: *const u8,
    secret_key: *const u8,
) -> i32 {
    if ss_out.is_null() || ciphertext.is_null() || secret_key.is_null() {
        return -1;
    }

    unsafe {
        let ct = std::slice::from_raw_parts(ciphertext, CIPHERTEXT_BYTES);
        let sk = std::slice::from_raw_parts(secret_key, SECRET_KEY_BYTES);
        let mut ss = std::slice::from_raw_parts_mut(ss_out, 32);

        match kem_decapsulate(ct, sk) {
            Ok(shared_secret) => {
                ss.copy_from_slice(&shared_secret);
                0
            }
            Err(_) => -1,
        }
    }
}

/// Export constant-time comparison for dudect testing
#[no_mangle]
pub extern "C" fn rust_constant_time_compare(
    result: *mut u8,
    a: *const u8,
    b: *const u8,
    len: usize,
) {
    if result.is_null() || a.is_null() || b.is_null() {
        return;
    }

    unsafe {
        let slice_a = std::slice::from_raw_parts(a, len);
        let slice_b = std::slice::from_raw_parts(b, len);

        // Use subtle crate for constant-time comparison
        let eq = slice_a.ct_eq(slice_b);
        *result = if bool::from(eq) { 1 } else { 0 };
    }
}
```

**Step 2: Update Cargo.toml** (30 minutes)

```toml
[lib]
name = "kyber768"
crate-type = ["lib", "cdylib"]  # Add cdylib for C FFI

[features]
dudect-ffi = []  # Feature flag for FFI exports
```

**Step 3: Build Rust Library** (1 hour)

```bash
cd src/rust
cargo build --release --features=dudect-ffi

# Verify symbols are exported
nm -D target/release/libkyber768.so | grep rust_ntt
# Should show: rust_ntt, rust_decapsulate, rust_constant_time_compare
```

**Step 4: Build Dudect Tests** (1 hour)

```bash
cd tests/constant_time
make rust_ffi  # Calls cargo build
make dudect_rust_test
```

**Step 5: Execute Tests** (2 hours)

```bash
make test_rust_all  # ~60-90 minutes
python3 generate_report.py results/
```

**Step 6: Analysis & Documentation** (3 hours)

---

## Code Fixes Required (All Paths)

### Fix 1: Rejection Sampling Ternary Operator

**Location**: `src/cpp/kyber768.cpp:116-119`

**Current Code (UNSAFE)**:
```cpp
uint16_t good = (val < KYBER_Q) ? 0xFFFF : 0x0000;  // ❌ May branch
a[i].vec[j].coeffs[ctr] = val & good | a[i].vec[j].coeffs[ctr] & ~good;
ctr += (good & 1);
```

**Fixed Code (SAFE)**:
```cpp
// Compute mask without branching
uint16_t diff = val - KYBER_Q;  // Negative if val < KYBER_Q
uint16_t good = (uint16_t)((int16_t)diff >> 15);  // 0xFFFF if negative, 0x0000 if positive

// Constant-time conditional assignment
a[i].vec[j].coeffs[ctr] = (val & good) | (a[i].vec[j].coeffs[ctr] & ~good);

// Constant-time counter increment
ctr += (good & 1);
```

**Assembly Verification**:
```bash
gcc -S -O3 -march=native kyber768.cpp -o kyber768.s
grep -A5 -B5 "rejection_sampling_label" kyber768.s

# Should see:
# - CMOV or conditional moves
# - No JNE, JE, or other conditional jumps
```

---

## Timeline Summary

| Path | Setup | Development | Testing | Total |
|------|-------|-------------|---------|-------|
| **A: x86_64** | 1-2 hours | 0 hours | 2-4 hours | **3-6 hours** ⭐ |
| **B: ARM64 Port** | 0 hours | 40-50 hours | 10-15 hours | **50-65 hours** |
| **C: Rust FFI** | 2 hours | 5-6 hours | 3-4 hours | **10-12 hours** |

---

## Success Criteria

### For All Paths:

✅ **All tests PASS** (|t| < 3.29)
- NTT transformation
- Montgomery reduction
- Decapsulation (with implicit rejection)
- Constant-time comparison

✅ **Assembly verification** confirms no branches in critical sections

✅ **Documentation** complete with test results and security analysis

✅ **Compliance report** ready for FIPS 203 / CNSA 2.0 review

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Tests fail due to timing leaks | MEDIUM | HIGH | Fix code and retest |
| Compiler introduces branches | LOW | HIGH | Verify assembly output |
| Hardware timing noise | LOW | MEDIUM | Increase sample size |
| Emulation invalidates results | HIGH | HIGH | Use real hardware (Path A) |

---

## Resource Requirements

### Path A: x86_64 Environment

**Hardware**:
- CPU: Intel Core i5-8xxx or newer, AMD Ryzen 3xxx or newer
- RAM: 4GB minimum
- Disk: 10GB for builds and results

**Software**:
- OS: Ubuntu 20.04+ or macOS (x86_64)
- Compiler: GCC 9+ or Clang 10+
- Tools: make, git, python3

**Time**:
- Setup: 1-2 hours
- Execution: 2-4 hours (can run unattended)
- Analysis: 2-3 hours

**Cost**:
- Cloud VM: $0.50-1.00 (AWS c5.large for 4 hours)
- Local: $0 (use existing hardware)

---

## Deliverables

Upon completion of any path:

1. **Test Execution Logs**
   - `/tests/constant_time/results/cpp_*.txt`
   - `/tests/constant_time/results/rust_*.txt`

2. **Statistical Analysis**
   - t-statistics for each operation
   - Distribution plots
   - PASS/FAIL verdicts

3. **Security Report**
   - `/compliance/constant_time_results.md`
   - Executive summary
   - Technical details
   - Compliance assessment

4. **Assembly Verification**
   - Annotated assembly listings
   - Branch analysis
   - Timing analysis

5. **Remediation Plan** (if failures)
   - Root cause analysis
   - Code fixes
   - Re-test results

---

## Next Steps: Decision Matrix

| If you have... | Then choose... | ETA |
|----------------|----------------|-----|
| Access to x86_64 machine | **Path A** | 3-6 hours |
| Only ARM64 Mac, need quick results | **Path C** (Rust FFI) | 1-2 days |
| Long-term production needs | **Path B** (ARM64 port) | 1-2 weeks |
| CI/CD pipeline | **Path A** (GitHub Actions) | 1 day setup, then continuous |

---

## Contact & Coordination

**Prepared by**: Constant-Time Validation Execution Specialist
**Date**: 2025-10-30
**Status**: READY FOR EXECUTION

**Memory Keys**:
- `zipminator-production/constant-time-status`
- `zipminator-production/constant-time-results`
- `swarm/constant-time/remediation-plan`

**Coordinate with**:
- Performance/Benchmark Team: x86_64 hardware access
- Backend Development: ARM64 NEON port (if needed)
- Rust Team: FFI exports for Rust testing
- Security Team: Assembly verification and sign-off

**Estimated Completion** (Path A):
- Setup: 2025-10-30 (today)
- Execution: 2025-10-31 (next day, 4-hour run)
- Report: 2025-10-31 (same day, 3 hours)
- **Total**: 2 days

---

**All frameworks, test harnesses, and build infrastructure are READY.**
**Awaiting architecture-compatible execution environment.**
