/**
 * C++/AVX2 Kyber-768 Benchmark Implementation
 * ============================================
 *
 * Cycle-accurate benchmarking of the C++/AVX2 Kyber-768 implementation.
 * This serves as the BASELINE for comparison with Rust and Mojo.
 *
 * Expected Performance (@ 3.3 GHz):
 * - KeyGen:  ~36,000 cycles (0.011ms)
 * - Encaps:  ~36,000 cycles (0.011ms)
 * - Decaps:  ~40,000 cycles (0.012ms)
 * - TOTAL:   ~112,000 cycles (0.034ms)
 */

#include "../../src/cpp/kyber768.h"
#include <x86intrin.h>
#include <cstdint>
#include <cstring>
#include <vector>
#include <algorithm>
#include <cmath>
#include <iostream>
#include <fstream>
#include <chrono>
#include <iomanip>

using namespace kyber768;

/**
 * Read CPU Time-Stamp Counter with serialization
 */
inline uint64_t read_tsc() {
    _mm_mfence();
    uint64_t tsc = __rdtsc();
    _mm_mfence();
    return tsc;
}

/**
 * Benchmark statistics
 */
struct BenchmarkStats {
    uint64_t median;
    double mean;
    uint64_t min;
    uint64_t max;
    double stddev;
    uint64_t percentile_95;
    uint64_t percentile_99;
};

/**
 * Compute statistics with outlier removal
 */
BenchmarkStats compute_stats(std::vector<uint64_t>& data) {
    std::sort(data.begin(), data.end());

    BenchmarkStats stats;
    size_t n = data.size();

    // Remove outliers (beyond 3 stddev)
    double sum = 0;
    for (uint64_t x : data) sum += x;
    double mean = sum / n;

    double var_sum = 0;
    for (uint64_t x : data) {
        double diff = x - mean;
        var_sum += diff * diff;
    }
    double stddev = std::sqrt(var_sum / n);

    std::vector<uint64_t> filtered;
    for (uint64_t x : data) {
        if (std::abs((double)x - mean) <= 3.0 * stddev) {
            filtered.push_back(x);
        }
    }

    if (!filtered.empty()) {
        data = filtered;
        std::sort(data.begin(), data.end());
        n = data.size();
    }

    // Compute final statistics
    stats.min = data[0];
    stats.max = data[n - 1];
    stats.median = data[n / 2];

    sum = 0;
    for (uint64_t x : data) sum += x;
    stats.mean = sum / n;

    var_sum = 0;
    for (uint64_t x : data) {
        double diff = x - stats.mean;
        var_sum += diff * diff;
    }
    stats.stddev = std::sqrt(var_sum / n);

    stats.percentile_95 = data[static_cast<size_t>(n * 0.95)];
    stats.percentile_99 = data[static_cast<size_t>(n * 0.99)];

    return stats;
}

/**
 * Print statistics
 */
void print_stats(const char* op, const BenchmarkStats& s, double ghz = 3.3) {
    double median_us = (s.median / ghz) / 1000.0;
    double mean_us = (s.mean / ghz) / 1000.0;

    std::cout << op << ":\n";
    std::cout << "  Median:  " << std::setw(8) << s.median << " cycles ("
              << std::fixed << std::setprecision(3) << median_us << " μs)\n";
    std::cout << "  Mean:    " << std::setw(8) << (uint64_t)s.mean << " cycles ("
              << std::fixed << std::setprecision(3) << mean_us << " μs)\n";
    std::cout << "  Min:     " << std::setw(8) << s.min << " cycles\n";
    std::cout << "  Max:     " << std::setw(8) << s.max << " cycles\n";
    std::cout << "  StdDev:  " << std::setw(8) << (uint64_t)s.stddev << " cycles\n";
    std::cout << "\n";
}

/**
 * Main benchmark entry point
 */
int main() {
    std::cout << "=================================================================\n";
    std::cout << "C++/AVX2 Kyber-768 Benchmark\n";
    std::cout << "Baseline Implementation for Cross-Language Comparison\n";
    std::cout << "=================================================================\n\n";

    const size_t WARMUP = 100;
    const size_t ITERATIONS = 1000;

    std::vector<uint64_t> keygen_cycles;
    std::vector<uint64_t> encaps_cycles;
    std::vector<uint64_t> decaps_cycles;
    std::vector<uint64_t> total_cycles;

    keygen_cycles.reserve(ITERATIONS);
    encaps_cycles.reserve(ITERATIONS);
    decaps_cycles.reserve(ITERATIONS);
    total_cycles.reserve(ITERATIONS);

    // Allocate buffers
    uint8_t pk[KYBER_PUBLICKEYBYTES];
    uint8_t sk[KYBER_SECRETKEYBYTES];
    uint8_t ct[KYBER_CIPHERTEXTBYTES];
    uint8_t ss_enc[KYBER_SHAREDSECRETBYTES];
    uint8_t ss_dec[KYBER_SHAREDSECRETBYTES];

    std::cout << "Warmup: " << WARMUP << " iterations...\n";
    for (size_t i = 0; i < WARMUP; i++) {
        crypto_kem_keypair(pk, sk);
        crypto_kem_enc(ct, ss_enc, pk);
        crypto_kem_dec(ss_dec, ct, sk);
    }

    std::cout << "Measurement: " << ITERATIONS << " iterations...\n";
    for (size_t i = 0; i < ITERATIONS; i++) {
        uint64_t start_total = read_tsc();

        // KeyGen
        uint64_t start_kg = read_tsc();
        crypto_kem_keypair(pk, sk);
        uint64_t end_kg = read_tsc();

        // Encaps
        uint64_t start_enc = read_tsc();
        crypto_kem_enc(ct, ss_enc, pk);
        uint64_t end_enc = read_tsc();

        // Decaps
        uint64_t start_dec = read_tsc();
        crypto_kem_dec(ss_dec, ct, sk);
        uint64_t end_dec = read_tsc();

        uint64_t end_total = read_tsc();

        keygen_cycles.push_back(end_kg - start_kg);
        encaps_cycles.push_back(end_enc - start_enc);
        decaps_cycles.push_back(end_dec - start_dec);
        total_cycles.push_back(end_total - start_total);

        if ((i + 1) % 100 == 0) {
            std::cout << "  Progress: " << (i + 1) << "/" << ITERATIONS << "\n";
        }
    }

    std::cout << "\nComputing statistics...\n\n";

    BenchmarkStats kg_stats = compute_stats(keygen_cycles);
    BenchmarkStats enc_stats = compute_stats(encaps_cycles);
    BenchmarkStats dec_stats = compute_stats(decaps_cycles);
    BenchmarkStats total_stats = compute_stats(total_cycles);

    print_stats("KeyGen", kg_stats);
    print_stats("Encaps", enc_stats);
    print_stats("Decaps", dec_stats);
    print_stats("Total", total_stats);

    // Verify correctness
    bool correct = (memcmp(ss_enc, ss_dec, KYBER_SHAREDSECRETBYTES) == 0);
    std::cout << "Correctness Check: " << (correct ? "PASS" : "FAIL") << "\n\n";

    // Write JSON output
    auto now = std::chrono::system_clock::now();
    auto timestamp = std::chrono::duration_cast<std::chrono::seconds>(now.time_since_epoch()).count();
    std::string filename = "../results/cpp_avx2_" + std::to_string(timestamp) + ".json";

    std::ofstream ofs(filename);
    ofs << "{\n";
    ofs << "  \"implementation\": \"C++/AVX2\",\n";
    ofs << "  \"timestamp\": " << timestamp << ",\n";
    ofs << "  \"iterations\": " << ITERATIONS << ",\n";
    ofs << "  \"keygen\": {\n";
    ofs << "    \"median_cycles\": " << kg_stats.median << ",\n";
    ofs << "    \"mean_cycles\": " << (uint64_t)kg_stats.mean << ",\n";
    ofs << "    \"stddev_cycles\": " << (uint64_t)kg_stats.stddev << "\n";
    ofs << "  },\n";
    ofs << "  \"encaps\": {\n";
    ofs << "    \"median_cycles\": " << enc_stats.median << ",\n";
    ofs << "    \"mean_cycles\": " << (uint64_t)enc_stats.mean << ",\n";
    ofs << "    \"stddev_cycles\": " << (uint64_t)enc_stats.stddev << "\n";
    ofs << "  },\n";
    ofs << "  \"decaps\": {\n";
    ofs << "    \"median_cycles\": " << dec_stats.median << ",\n";
    ofs << "    \"mean_cycles\": " << (uint64_t)dec_stats.mean << ",\n";
    ofs << "    \"stddev_cycles\": " << (uint64_t)dec_stats.stddev << "\n";
    ofs << "  },\n";
    ofs << "  \"total\": {\n";
    ofs << "    \"median_cycles\": " << total_stats.median << ",\n";
    ofs << "    \"mean_cycles\": " << (uint64_t)total_stats.mean << ",\n";
    ofs << "    \"stddev_cycles\": " << (uint64_t)total_stats.stddev << "\n";
    ofs << "  }\n";
    ofs << "}\n";

    std::cout << "Results written to: " << filename << "\n";
    std::cout << "=================================================================\n";

    return 0;
}
