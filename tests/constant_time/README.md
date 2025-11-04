# Constant-Time Validation Tests

This directory contains the constant-time validation framework for Kyber-768 implementations using differential uniformity detection (dudect).

## Quick Start

```bash
# Run all tests for all implementations
./run_dudect.sh all

# Run tests for specific implementation
./run_dudect.sh cpp    # C++/AVX2
./run_dudect.sh rust   # Rust
./run_dudect.sh mojo   # Mojo
```

## Files

- **`dudect_cpp.c`**: Test harness for C++/AVX2 implementation
- **`dudect_rust.c`**: Test harness for Rust implementation
- **`dudect_mojo.c`**: Test harness for Mojo implementation
- **`run_dudect.sh`**: Automated test execution script
- **`generate_report.py`**: Report generation from test results
- **`results/`**: Test results (created on first run)

## Prerequisites

### 1. Install Dudect

```bash
# Clone dudect library
git clone https://github.com/oreparaz/dudect.git /tmp/dudect

# Copy header to include path or add to build
cp /tmp/dudect/src/dudect.h /usr/local/include/
```

### 2. Build Implementations with Test Support

#### C++/AVX2
```bash
cd ../../src/cpp
g++ -O3 -march=native -mavx2 \
    -I../../tests/constant_time \
    -o build/kyber768_dudect \
    *.cpp ../../tests/constant_time/dudect_cpp.c \
    -L/path/to/dudect -ldudect
```

#### Rust
```bash
cd ../../src/rust
cargo build --release --features=constant-time-tests
```

#### Mojo
```bash
cd ../../src/mojo
# Requires C FFI bindings (see dudect_mojo.c)
mojo build kyber768_dudect.mojo
```

## Test Configuration

- **Samples**: 10,000,000 minimum
- **Confidence**: p < 0.001 (t-statistic > 3.29)
- **CPU**: Isolated core recommended (see below)

## Optimal Test Environment

For best results, isolate CPU core and fix frequency:

```bash
# Disable CPU frequency scaling
sudo cpupower frequency-set --governor performance

# Isolate CPU core 0
sudo cset shield -c 0 -k on

# Run tests on isolated core
sudo cset shield -e ./run_dudect.sh all
```

## Understanding Results

### PASS ✅
- No statistical evidence of timing leak
- Safe for production use (subject to audit)
- Meets FIPS 203 / CNSA 2.0 requirements

### FAIL ❌
- Timing leak detected
- **DO NOT USE IN PRODUCTION**
- Violates IND-CCA2 security

### UNKNOWN ⚠️
- Insufficient statistical power
- Increase sample size or check implementation

## Expected Outcomes

### C++/AVX2
**Expected**: PASS (with proper constant-time coding)
**Risk**: Compiler optimizations may introduce leaks

### Rust
**Expected**: PASS (high confidence)
**Reason**: `subtle` crate provides constant-time primitives

### Mojo
**Expected**: FAIL or UNKNOWN
**Reason**: No documented constant-time guarantees

## Results

Test results are saved to:
- Raw output: `results/*_YYYYMMDD_HHMMSS.txt`
- JSON summary: `results/*_YYYYMMDD_HHMMSS.json`
- Comprehensive report: `../../docs/constant_time_results.md`

## Interpreting the Report

The generated report includes:
1. Executive summary with pass/fail status
2. Detailed test results
3. Security assessment
4. Production recommendations
5. CNSA 2.0 compliance implications

## Integration with Swarm

Test results are automatically stored in swarm memory:
- Framework status: `swarm/validation/framework-status`
- C++ results: `swarm/validation/constant-time-cpp`
- Rust results: `swarm/validation/constant-time-rust`
- Mojo results: `swarm/validation/constant-time-mojo`
- Summary: `swarm/validation/security-results`

## Troubleshooting

### Tests Won't Compile
- Check that dudect is installed
- Verify include paths
- Ensure implementations are built with test support

### UNKNOWN Results
- Increase sample size in source files
- Check for implementation bugs
- Verify CPU isolation

### Unexpected FAIL
- Review assembly output: `objdump -d binary > assembly.txt`
- Check compiler flags
- Look for secret-dependent branches or memory access

## Security Notice

**CRITICAL**: Even ONE timing leak invalidates the entire implementation.

A FAIL result is not a failure of the test—it's a critical security finding that prevents production deployment.

## References

- [Dudect Paper](https://eprint.iacr.org/2016/1123)
- [NIST FIPS 203](https://csrc.nist.gov/pubs/fips/203/final)
- [Framework Documentation](../../docs/constant_time_validation.md)
- [Security Summary](../../docs/security_validation_summary.md)

## Support

For questions or issues:
1. Review `../../docs/constant_time_validation.md`
2. Check test output in `results/`
3. Coordinate with swarm via memory keys
