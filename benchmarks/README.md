# Kyber-768 Performance Benchmarks

This directory contains production-ready performance benchmarking tools for the CRYSTALS-Kyber-768 implementation.

## Quick Start

```bash
# Run complete benchmark suite
./scripts/run_benchmarks.sh

# Run with custom options
./scripts/run_benchmarks.sh --output-dir ./results --iterations 20000
```

## Files

- `production_benchmark.cpp` - Comprehensive C++ benchmark harness
- `benchmark_report_template.md` - Human-readable report template
- `benchmark_report_*.json` - JSON results (timestamped)
- `benchmark_report_*.txt` - Text reports (timestamped)

## Performance Targets

| Operation | Target Latency |
|-----------|----------------|
| KeyGen    | 11 μs          |
| Encaps    | 11 μs          |
| Decaps    | 12 μs          |
| **Total** | **34 μs**      |

## Benchmark Features

### Measurement Framework
- **RDTSC**: Cycle-accurate timing with CPU frequency detection
- **Warmup**: 1,000 iterations to stabilize CPU frequency
- **Samples**: 10,000 measurements per operation
- **Serialization**: LFENCE for accurate RDTSC measurements

### Statistical Analysis
- Mean, median, standard deviation
- Min, max values
- 95th percentile (P95)
- 99th percentile (P99)
- Coefficient of variation

### Benchmark Modes
1. **Cold Cache**: Flush cache before each operation (worst-case)
2. **Warm Cache**: Keep data in cache (typical-case)
3. **Batch Processing**: Throughput measurement

### System Configuration
- CPU governor set to "performance"
- ASLR disabled during testing
- CPU affinity pinned to core 0
- Automatic restoration of settings

## Output

### Console Output
Real-time progress with color-coded pass/fail indicators.

### JSON Report
Structured data for automated analysis:
```json
{
  "cpu_model": "Intel(R) Xeon(R) CPU @ 3.00GHz",
  "cpu_frequency_ghz": 3.0,
  "target_total_us": 34.0,
  "total_time_us": 32.5,
  "all_passed": true,
  "results": [...]
}
```

### Text Report
Human-readable formatted output with:
- CPU configuration
- Detailed statistics per operation
- Pass/fail status
- Overall performance summary

## Building Manually

```bash
# Compile benchmark
g++ -std=c++17 -O3 -march=native -mavx2 \
    -I./src/cpp \
    benches/production_benchmark.cpp \
    -o benches/production_benchmark \
    -lpthread

# Run
./benches/production_benchmark
```

## Requirements

- **CPU**: x86_64 with RDTSC support
- **SIMD**: AVX2 recommended for optimal performance
- **Compiler**: g++ or clang++ with C++17 support
- **OS**: Linux (for /proc/cpuinfo CPU frequency detection)

## Interpreting Results

### Pass Criteria
- Each operation must meet target latency (with 10% tolerance)
- Total latency ≤ 37.4 μs (34 μs + 10%)
- Coefficient of variation < 10% (stable measurements)

### Key Metrics
- **Mean**: Average latency (primary validation metric)
- **Median**: Middle value (less affected by outliers)
- **P95/P99**: Tail latency (important for production SLAs)
- **Std Dev**: Measurement consistency

### Cache Impact
- Cold cache: 2-5x slower (represents first access)
- Warm cache: Target performance (represents typical workload)
- Batch: Maximum throughput

## Troubleshooting

### High Variance (>10% CV)
- CPU frequency scaling enabled (check governor)
- Thermal throttling (check CPU temperature)
- Other processes competing for CPU
- ASLR enabled (increases measurement noise)

### Targets Not Met
- Compiler optimization not enabled (-O3)
- AVX2 not available (check CPU flags)
- Reference implementation not yet optimized
- Running in VM with performance overhead

### Build Errors
- Missing Kyber-768 implementation files
- Compiler version too old (need C++17)
- Missing AVX2 intrinsics

## Production Validation

For production certification, run benchmarks on target hardware:

```bash
# AWS c5.2xlarge (Intel Xeon Platinum 8124M)
./scripts/run_benchmarks.sh --iterations 50000

# Verify all operations pass
# Check P99 latency is within acceptable bounds
# Validate consistency (CV < 5%)
```

## Next Steps

1. Run benchmarks on production hardware (AWS c5.2xlarge)
2. Integrate QRNG for entropy source validation
3. Perform extended burn-in tests (1M+ iterations)
4. Profile memory usage and cache behavior
5. Load test with realistic traffic patterns
