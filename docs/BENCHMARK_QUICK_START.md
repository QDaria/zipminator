# Kyber-768 Benchmark Quick Start Guide

## One-Command Execution

```bash
# Run complete benchmark suite with default settings
./scripts/run_benchmarks.sh
```

That's it! The script handles everything automatically.

## What Happens

1. **Pre-flight Checks** (5 seconds)
   - Validates x86_64 architecture
   - Detects AVX2 support
   - Checks for C++ compiler

2. **Compilation** (10 seconds)
   - Builds optimized benchmark binary
   - Flags: -O3 -march=native -mavx2

3. **System Configuration** (requires sudo)
   - Sets CPU governor to "performance"
   - Disables ASLR temporarily
   - Pins execution to CPU core 0

4. **Benchmark Execution** (2-3 minutes)
   - Warmup: 1,000 iterations
   - Measurements: 10,000 per operation
   - Three modes: cold cache, warm cache, batch

5. **Report Generation** (instant)
   - Console output with color-coded status
   - JSON report: `benchmarks/benchmark_report_TIMESTAMP.json`
   - Text report: `benchmarks/benchmark_report_TIMESTAMP.txt`

6. **Cleanup** (automatic)
   - Restores CPU governor
   - Re-enables ASLR

## Expected Output

```
=== CPU Configuration ===
Model: Intel(R) Xeon(R) CPU @ 3.00GHz
Frequency: 3.00 GHz

Running warmup phase (1000 iterations)...
Warmup complete.

=== Benchmarking: Cold Cache ===
  KeyGen... 45.123 μs
  Encaps... 43.876 μs
  Decaps... 48.234 μs

=== Benchmarking: Warm Cache ===
  KeyGen... 10.542 μs
  Encaps... 10.873 μs
  Decaps... 11.234 μs

=== Benchmarking: Batch Processing ===
  KeyGen... 10.521 μs
  Encaps... 10.832 μs
  Decaps... 11.198 μs

================================================================================
Overall Results:
  Total Time (Warm Cache): 32.649 μs
  Target: 34.000 μs
  Status: ✓ PASS
================================================================================

[SUCCESS] ALL BENCHMARKS PASSED ✓
```

## Performance Targets

| What            | Target    | Must Beat |
|-----------------|-----------|-----------|
| KeyGen latency  | ≤ 11 μs   | 12.1 μs   |
| Encaps latency  | ≤ 11 μs   | 12.1 μs   |
| Decaps latency  | ≤ 12 μs   | 13.2 μs   |
| **Total**       | **≤ 34 μs** | **37.4 μs** |

*Tolerance: 10% for production validation*

## Interpreting Results

### ✓ PASS
All operations meet targets. Implementation is production-ready.

### ✗ FAIL
One or more operations exceed targets. Optimization needed.

### Key Metrics
- **Mean**: Average latency (primary metric)
- **P95**: 95th percentile (tail latency)
- **Std Dev**: Consistency measure

## Custom Options

```bash
# Change output directory
./scripts/run_benchmarks.sh --output-dir ./my-results

# More iterations (higher accuracy, longer runtime)
./scripts/run_benchmarks.sh --iterations 50000

# JSON only (no console output)
./scripts/run_benchmarks.sh --json-only
```

## Troubleshooting

### "Build failed"
Check that g++ or clang++ is installed:
```bash
g++ --version  # or clang++ --version
```

### "Benchmarks failed"
- Running in VM? Performance may be degraded
- CPU throttling? Check temperature
- Try on bare metal hardware

### High variance (>10%)
- Other processes consuming CPU
- CPU frequency scaling enabled
- Thermal throttling

## Manual Compilation

If the script fails, compile manually:

```bash
g++ -std=c++17 -O3 -march=native -mavx2 \
    -I./src/cpp \
    benches/production_benchmark.cpp \
    -o benches/production_benchmark \
    -lpthread

./benches/production_benchmark
```

## File Locations

```
benchmarks/
├── benchmark_report_20251030_140500.json  # Structured data
├── benchmark_report_20251030_140500.txt   # Human-readable
└── README.md                               # Full documentation

benches/
└── production_benchmark                    # Compiled binary

scripts/
└── run_benchmarks.sh                       # Automation script
```

## Next Steps

1. **Passed?** Deploy to production hardware for final validation
2. **Failed?** Review implementation and optimize hot paths
3. **Need more data?** Run extended tests with `--iterations 100000`

## Production Validation

For AWS c5.2xlarge certification:

```bash
# SSH to instance
ssh user@aws-instance

# Clone repo and run
git clone <repo-url>
cd qdaria-qrng
./scripts/run_benchmarks.sh --iterations 50000

# Check exit code
echo $?  # 0 = pass, 1 = fail
```

## Questions?

- Full docs: `/benchmarks/README.md`
- Implementation: `/benches/production_benchmark.cpp`
- Report template: `/benchmarks/benchmark_report_template.md`

---

**Zipminator Week 1 Target**: 0.034ms (34 μs) total latency
