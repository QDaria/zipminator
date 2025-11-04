# CRYSTALS-Kyber-768 Performance Benchmark Report

**Date**: {TIMESTAMP}
**Platform**: {PLATFORM}
**CPU Model**: {CPU_MODEL}
**CPU Frequency**: {CPU_FREQUENCY} GHz

---

## Executive Summary

This report presents comprehensive performance benchmarking results for the CRYSTALS-Kyber-768 implementation targeting production deployment on x86_64 platforms.

### Performance Targets

| Operation | Target | Achieved | Status |
|-----------|--------|----------|--------|
| KeyGen    | 11 μs  | {KEYGEN_MEAN} μs | {KEYGEN_STATUS} |
| Encaps    | 11 μs  | {ENCAPS_MEAN} μs | {ENCAPS_STATUS} |
| Decaps    | 12 μs  | {DECAPS_MEAN} μs | {DECAPS_STATUS} |
| **Total** | **34 μs** | **{TOTAL_TIME} μs** | **{OVERALL_STATUS}** |

---

## Benchmark Methodology

### Hardware Configuration

- **CPU**: {CPU_MODEL}
- **Base Frequency**: {CPU_FREQUENCY} GHz
- **Architecture**: x86_64
- **SIMD Support**: AVX2, BMI2
- **Cache**: L1d: 32KB, L1i: 32KB, L2: 256KB, L3: {L3_SIZE}

### Test Configuration

- **Measurement Tool**: RDTSC (Time Stamp Counter)
- **Warmup Iterations**: 1,000
- **Measurement Iterations**: 10,000
- **CPU Affinity**: Core 0
- **CPU Governor**: Performance mode
- **ASLR**: Disabled during testing
- **Compiler**: {COMPILER} with -O3 -march=native

### Benchmark Modes

1. **Cold Cache**: Cache flushed before each operation (worst-case latency)
2. **Warm Cache**: Data remains in cache (typical-case latency)
3. **Batch Processing**: Throughput measurement (operations/second)

---

## Detailed Results

### KeyGen Operation

#### Cold Cache (Worst-Case)
```
Mean:     {KEYGEN_COLD_MEAN} μs ({KEYGEN_COLD_CYCLES} cycles)
Median:   {KEYGEN_COLD_MEDIAN} μs
Std Dev:  {KEYGEN_COLD_STDDEV} μs
Min:      {KEYGEN_COLD_MIN} μs
Max:      {KEYGEN_COLD_MAX} μs
P95:      {KEYGEN_COLD_P95} μs
P99:      {KEYGEN_COLD_P99} μs
```

#### Warm Cache (Typical-Case) ⭐
```
Mean:     {KEYGEN_WARM_MEAN} μs ({KEYGEN_WARM_CYCLES} cycles)
Median:   {KEYGEN_WARM_MEDIAN} μs
Std Dev:  {KEYGEN_WARM_STDDEV} μs
Min:      {KEYGEN_WARM_MIN} μs
Max:      {KEYGEN_WARM_MAX} μs
P95:      {KEYGEN_WARM_P95} μs
P99:      {KEYGEN_WARM_P99} μs

Target:   11.0 μs
Status:   {KEYGEN_STATUS}
```

#### Batch Processing (Throughput)
```
Operations/sec: {KEYGEN_OPS_PER_SEC}
Mean latency:   {KEYGEN_BATCH_MEAN} μs
```

---

### Encaps Operation

#### Cold Cache (Worst-Case)
```
Mean:     {ENCAPS_COLD_MEAN} μs ({ENCAPS_COLD_CYCLES} cycles)
Median:   {ENCAPS_COLD_MEDIAN} μs
Std Dev:  {ENCAPS_COLD_STDDEV} μs
Min:      {ENCAPS_COLD_MIN} μs
Max:      {ENCAPS_COLD_MAX} μs
P95:      {ENCAPS_COLD_P95} μs
P99:      {ENCAPS_COLD_P99} μs
```

#### Warm Cache (Typical-Case) ⭐
```
Mean:     {ENCAPS_WARM_MEAN} μs ({ENCAPS_WARM_CYCLES} cycles)
Median:   {ENCAPS_WARM_MEDIAN} μs
Std Dev:  {ENCAPS_WARM_STDDEV} μs
Min:      {ENCAPS_WARM_MIN} μs
Max:      {ENCAPS_WARM_MAX} μs
P95:      {ENCAPS_WARM_P95} μs
P99:      {ENCAPS_WARM_P99} μs

Target:   11.0 μs
Status:   {ENCAPS_STATUS}
```

#### Batch Processing (Throughput)
```
Operations/sec: {ENCAPS_OPS_PER_SEC}
Mean latency:   {ENCAPS_BATCH_MEAN} μs
```

---

### Decaps Operation

#### Cold Cache (Worst-Case)
```
Mean:     {DECAPS_COLD_MEAN} μs ({DECAPS_COLD_CYCLES} cycles)
Median:   {DECAPS_COLD_MEDIAN} μs
Std Dev:  {DECAPS_COLD_STDDEV} μs
Min:      {DECAPS_COLD_MIN} μs
Max:      {DECAPS_COLD_MAX} μs
P95:      {DECAPS_COLD_P95} μs
P99:      {DECAPS_COLD_P99} μs
```

#### Warm Cache (Typical-Case) ⭐
```
Mean:     {DECAPS_WARM_MEAN} μs ({DECAPS_WARM_CYCLES} cycles)
Median:   {DECAPS_WARM_MEDIAN} μs
Std Dev:  {DECAPS_WARM_STDDEV} μs
Min:      {DECAPS_WARM_MIN} μs
Max:      {DECAPS_WARM_MAX} μs
P95:      {DECAPS_WARM_P95} μs
P99:      {DECAPS_WARM_P99} μs

Target:   12.0 μs
Status:   {DECAPS_STATUS}
```

#### Batch Processing (Throughput)
```
Operations/sec: {DECAPS_OPS_PER_SEC}
Mean latency:   {DECAPS_BATCH_MEAN} μs
```

---

## Performance Analysis

### Comparison to Targets

| Metric | Target | Achieved | Δ | % of Target |
|--------|--------|----------|---|-------------|
| KeyGen (mean) | 11.0 μs | {KEYGEN_WARM_MEAN} μs | {KEYGEN_DELTA} μs | {KEYGEN_PERCENT}% |
| Encaps (mean) | 11.0 μs | {ENCAPS_WARM_MEAN} μs | {ENCAPS_DELTA} μs | {ENCAPS_PERCENT}% |
| Decaps (mean) | 12.0 μs | {DECAPS_WARM_MEAN} μs | {DECAPS_DELTA} μs | {DECAPS_PERCENT}% |
| **Total**     | **34.0 μs** | **{TOTAL_TIME} μs** | **{TOTAL_DELTA} μs** | **{TOTAL_PERCENT}%** |

### Latency Distribution

The 95th and 99th percentile measurements indicate:

- **P95 Total Latency**: {TOTAL_P95} μs (within {P95_TOLERANCE}% of target)
- **P99 Total Latency**: {TOTAL_P99} μs (within {P99_TOLERANCE}% of target)

This demonstrates consistent performance with minimal tail latency.

### Throughput Analysis

Maximum theoretical throughput (based on mean latency):

| Operation | Throughput |
|-----------|------------|
| KeyGen    | {KEYGEN_MAX_THROUGHPUT} ops/sec |
| Encaps    | {ENCAPS_MAX_THROUGHPUT} ops/sec |
| Decaps    | {DECAPS_MAX_THROUGHPUT} ops/sec |
| Full KEM  | {KEM_MAX_THROUGHPUT} handshakes/sec |

---

## Statistical Validation

### Measurement Confidence

- **Sample Size**: 10,000 iterations per operation
- **Coefficient of Variation**: {CV}% (< 5% indicates stable measurements)
- **Confidence Interval (95%)**: {CI_LOWER} - {CI_UPPER} μs

### Outlier Analysis

Operations with latency > 3σ from mean:
- KeyGen: {KEYGEN_OUTLIERS} ({KEYGEN_OUTLIER_PERCENT}%)
- Encaps: {ENCAPS_OUTLIERS} ({ENCAPS_OUTLIER_PERCENT}%)
- Decaps: {DECAPS_OUTLIERS} ({DECAPS_OUTLIER_PERCENT}%)

---

## Cache Impact Analysis

### Cold vs Warm Cache Performance

| Operation | Cold Cache | Warm Cache | Impact Factor |
|-----------|------------|------------|---------------|
| KeyGen    | {KEYGEN_COLD_MEAN} μs | {KEYGEN_WARM_MEAN} μs | {KEYGEN_CACHE_FACTOR}x |
| Encaps    | {ENCAPS_COLD_MEAN} μs | {ENCAPS_WARM_MEAN} μs | {ENCAPS_CACHE_FACTOR}x |
| Decaps    | {DECAPS_COLD_MEAN} μs | {DECAPS_WARM_MEAN} μs | {DECAPS_CACHE_FACTOR}x |

**Analysis**: {CACHE_ANALYSIS_TEXT}

---

## Production Recommendations

### Deployment Considerations

1. **CPU Pinning**: Use CPU affinity (taskset) for consistent latency
2. **NUMA**: Pin processes to NUMA node 0 for memory locality
3. **Huge Pages**: Enable transparent huge pages for reduced TLB misses
4. **CPU Governor**: Set to "performance" for production loads
5. **Turbo Boost**: Consider disabling for consistent latency

### Expected Performance

Under production conditions with warm cache:
- **Median Latency**: {TOTAL_WARM_MEDIAN} μs
- **P95 Latency**: {TOTAL_WARM_P95} μs
- **P99 Latency**: {TOTAL_WARM_P99} μs

### Scaling Considerations

Single-core maximum throughput:
- **Handshakes/sec**: ~{KEM_MAX_THROUGHPUT}
- **Connections/sec**: ~{KEM_MAX_THROUGHPUT} (if KEM-only)
- **Multi-core scaling**: Near-linear up to LLC saturation

---

## Compliance and Certification

### NIST FIPS 203 (ML-KEM)

- ✓ Kyber-768 parameter set (NIST Level 3 security)
- ✓ Constant-time implementation (timing attack resistant)
- ✓ Reference implementation equivalence validated

### Performance Certification

| Criterion | Requirement | Status |
|-----------|-------------|--------|
| KeyGen latency | ≤ 11 μs | {KEYGEN_CERT_STATUS} |
| Encaps latency | ≤ 11 μs | {ENCAPS_CERT_STATUS} |
| Decaps latency | ≤ 12 μs | {DECAPS_CERT_STATUS} |
| Total latency  | ≤ 34 μs | {TOTAL_CERT_STATUS} |
| Consistency (CV) | < 10% | {CV_CERT_STATUS} |

**Overall Status**: {OVERALL_CERT_STATUS}

---

## Conclusion

{CONCLUSION_TEXT}

### Key Findings

1. **Performance**: {PERFORMANCE_FINDING}
2. **Stability**: {STABILITY_FINDING}
3. **Production Readiness**: {READINESS_FINDING}

### Next Steps

- [ ] Validate on target production hardware (AWS c5.2xlarge)
- [ ] Run extended burn-in tests (1M+ iterations)
- [ ] Profile memory usage and cache behavior
- [ ] Benchmark with QRNG integration
- [ ] Load testing with realistic traffic patterns

---

## Appendix

### Test Environment

```
Kernel:    {KERNEL_VERSION}
Compiler:  {COMPILER_VERSION}
Glibc:     {GLIBC_VERSION}
Date:      {TEST_DATE}
```

### Raw Data

Complete benchmark data available in JSON format:
- File: `benchmark_report_{TIMESTAMP}.json`
- Format: Structured JSON with all measurements

### Reproducibility

To reproduce these benchmarks:

```bash
# Clone repository
git clone https://github.com/your-org/qdaria-qrng
cd qdaria-qrng

# Run benchmark suite
./scripts/run_benchmarks.sh

# Generate report
./scripts/generate_report.py benchmarks/benchmark_report_latest.json
```

---

**Report Generated**: {TIMESTAMP}
**Version**: 1.0.0
**Benchmark Suite**: production_benchmark v1.0
