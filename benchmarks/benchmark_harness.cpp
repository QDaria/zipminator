/**
 * Kyber-768 Cross-Implementation Benchmark Harness
 * =================================================
 *
 * Cycle-accurate performance measurement using RDTSC instruction.
 * Provides hardware-independent comparison across C++/AVX2, Rust, and Mojo.
 *
 * MEASUREMENT METHOD:
 * - Uses RDTSC (Read Time-Stamp Counter) for CPU cycle counting
 * - Not wall-clock time - provides hardware-independent metrics
 * - Multiple iterations for statistical significance
 * - Outlier removal for stable measurements
 *
 * BASELINE TARGET (C++/AVX2):
 * - KeyGen:  ~36,000 cycles (0.011ms @ 3.3GHz)
 * - Encaps:  ~36,000 cycles (0.011ms @ 3.3GHz)
 * - Decaps:  ~40,000 cycles (0.012ms @ 3.3GHz)
 * - TOTAL:   ~112,000 cycles (0.034ms @ 3.3GHz)
 *
 * Author: Benchmark Harness Team
 * Date: 2025-10-30
 */

#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <vector>
#include <algorithm>
#include <cmath>
#include <iostream>
#include <fstream>
#include <chrono>
#include <iomanip>
#include <x86intrin.h>

// JSON output helpers
namespace json {
    void write_key_value(std::ostream& os, const char* key, uint64_t value, bool comma = true) {
        os << "\"" << key << "\": " << value << (comma ? "," : "") << "\n";
    }

    void write_key_value(std::ostream& os, const char* key, double value, bool comma = true) {
        os << "\"" << key << "\": " << std::fixed << std::setprecision(2) << value << (comma ? "," : "") << "\n";
    }

    void write_key_string(std::ostream& os, const char* key, const char* value, bool comma = true) {
        os << "\"" << key << "\": \"" << value << "\"" << (comma ? "," : "") << "\n";
    }
}

/**
 * Read CPU Time-Stamp Counter
 *
 * Uses RDTSC instruction to count CPU cycles.
 * Provides serialization to prevent instruction reordering.
 */
inline uint64_t read_tsc() {
    _mm_mfence();  // Memory fence
    uint64_t tsc = __rdtsc();
    _mm_mfence();  // Memory fence
    return tsc;
}

/**
 * Benchmark statistics structure
 */
struct BenchmarkStats {
    uint64_t median;
    double mean;
    uint64_t min;
    uint64_t max;
    double stddev;
    uint64_t percentile_95;
    uint64_t percentile_99;

    BenchmarkStats() : median(0), mean(0), min(0), max(0), stddev(0), percentile_95(0), percentile_99(0) {}
};

/**
 * Compute statistics from cycle measurements
 *
 * @param cycles Vector of cycle counts
 * @param remove_outliers Remove measurements beyond 3 standard deviations
 * @return Statistical summary
 */
BenchmarkStats compute_statistics(std::vector<uint64_t>& cycles, bool remove_outliers = true) {
    BenchmarkStats stats;

    if (cycles.empty()) {
        return stats;
    }

    // Sort for percentile calculation
    std::sort(cycles.begin(), cycles.end());

    // Remove outliers if requested
    if (remove_outliers && cycles.size() > 100) {
        // First pass: compute mean and stddev
        double sum = 0;
        for (uint64_t c : cycles) {
            sum += c;
        }
        double mean = sum / cycles.size();

        double var_sum = 0;
        for (uint64_t c : cycles) {
            double diff = c - mean;
            var_sum += diff * diff;
        }
        double stddev = std::sqrt(var_sum / cycles.size());

        // Second pass: remove outliers beyond 3 stddev
        std::vector<uint64_t> filtered;
        for (uint64_t c : cycles) {
            if (std::abs((double)c - mean) <= 3.0 * stddev) {
                filtered.push_back(c);
            }
        }

        if (!filtered.empty()) {
            cycles = filtered;
            std::sort(cycles.begin(), cycles.end());
        }
    }

    // Compute statistics
    size_t n = cycles.size();
    stats.min = cycles[0];
    stats.max = cycles[n - 1];
    stats.median = cycles[n / 2];

    double sum = 0;
    for (uint64_t c : cycles) {
        sum += c;
    }
    stats.mean = sum / n;

    double var_sum = 0;
    for (uint64_t c : cycles) {
        double diff = c - stats.mean;
        var_sum += diff * diff;
    }
    stats.stddev = std::sqrt(var_sum / n);

    stats.percentile_95 = cycles[static_cast<size_t>(n * 0.95)];
    stats.percentile_99 = cycles[static_cast<size_t>(n * 0.99)];

    return stats;
}

/**
 * Print statistics in human-readable format
 */
void print_statistics(const char* operation, const BenchmarkStats& stats, double cpu_ghz = 3.3) {
    double median_us = (stats.median / cpu_ghz) / 1000.0;
    double mean_us = (stats.mean / cpu_ghz) / 1000.0;

    std::cout << operation << " Statistics:\n";
    std::cout << "  Median:  " << std::setw(10) << stats.median << " cycles (" << std::fixed << std::setprecision(3) << median_us << " μs)\n";
    std::cout << "  Mean:    " << std::setw(10) << static_cast<uint64_t>(stats.mean) << " cycles (" << std::fixed << std::setprecision(3) << mean_us << " μs)\n";
    std::cout << "  Min:     " << std::setw(10) << stats.min << " cycles\n";
    std::cout << "  Max:     " << std::setw(10) << stats.max << " cycles\n";
    std::cout << "  StdDev:  " << std::setw(10) << static_cast<uint64_t>(stats.stddev) << " cycles\n";
    std::cout << "  95th:    " << std::setw(10) << stats.percentile_95 << " cycles\n";
    std::cout << "  99th:    " << std::setw(10) << stats.percentile_99 << " cycles\n";
    std::cout << "\n";
}

/**
 * Write statistics to JSON
 */
void write_statistics_json(std::ostream& os, const BenchmarkStats& stats, const char* indent = "    ") {
    os << indent << "{\n";
    os << indent << "  "; json::write_key_value(os, "median_cycles", stats.median);
    os << indent << "  "; json::write_key_value(os, "mean_cycles", stats.mean);
    os << indent << "  "; json::write_key_value(os, "min_cycles", stats.min);
    os << indent << "  "; json::write_key_value(os, "max_cycles", stats.max);
    os << indent << "  "; json::write_key_value(os, "stddev_cycles", stats.stddev);
    os << indent << "  "; json::write_key_value(os, "percentile_95_cycles", stats.percentile_95);
    os << indent << "  "; json::write_key_value(os, "percentile_99_cycles", stats.percentile_99, false);
    os << indent << "}";
}

/**
 * Benchmark result structure for a single implementation
 */
struct ImplementationResult {
    std::string name;
    BenchmarkStats keygen;
    BenchmarkStats encaps;
    BenchmarkStats decaps;
    BenchmarkStats total;
    bool success;
    std::string error_message;

    ImplementationResult(const std::string& n) : name(n), success(false) {}
};

/**
 * Get CPU frequency estimation
 */
double estimate_cpu_frequency() {
    auto start = std::chrono::high_resolution_clock::now();
    uint64_t cycles_start = read_tsc();

    // Sleep for 100ms
    std::this_thread::sleep_for(std::chrono::milliseconds(100));

    auto end = std::chrono::high_resolution_clock::now();
    uint64_t cycles_end = read_tsc();

    double elapsed_ns = std::chrono::duration<double, std::nano>(end - start).count();
    uint64_t cycles = cycles_end - cycles_start;

    return (cycles / elapsed_ns) * 1e9 / 1e9;  // Convert to GHz
}

/**
 * Benchmark harness interface
 *
 * Implementations must provide these functions:
 * - impl_keygen(pk, sk) -> cycles
 * - impl_encaps(ct, ss, pk) -> cycles
 * - impl_decaps(ss, ct, sk) -> cycles
 */
template<typename KeyGenFunc, typename EncapsFunc, typename DecapsFunc>
ImplementationResult benchmark_implementation(
    const std::string& name,
    KeyGenFunc keygen_func,
    EncapsFunc encaps_func,
    DecapsFunc decaps_func,
    size_t warmup_iterations = 100,
    size_t measurement_iterations = 1000
) {
    ImplementationResult result(name);

    std::cout << "Benchmarking: " << name << "\n";
    std::cout << "  Warmup iterations: " << warmup_iterations << "\n";
    std::cout << "  Measurement iterations: " << measurement_iterations << "\n";
    std::cout << "\n";

    try {
        std::vector<uint64_t> keygen_cycles;
        std::vector<uint64_t> encaps_cycles;
        std::vector<uint64_t> decaps_cycles;
        std::vector<uint64_t> total_cycles;

        keygen_cycles.reserve(measurement_iterations);
        encaps_cycles.reserve(measurement_iterations);
        decaps_cycles.reserve(measurement_iterations);
        total_cycles.reserve(measurement_iterations);

        // Warmup phase
        std::cout << "  Running warmup...\n";
        for (size_t i = 0; i < warmup_iterations; i++) {
            keygen_func();
        }

        // Measurement phase
        std::cout << "  Running measurements...\n";
        for (size_t i = 0; i < measurement_iterations; i++) {
            // Full operation benchmark
            uint64_t start_total = read_tsc();
            uint64_t cycles_kg = keygen_func();
            uint64_t cycles_enc = encaps_func();
            uint64_t cycles_dec = decaps_func();
            uint64_t end_total = read_tsc();

            keygen_cycles.push_back(cycles_kg);
            encaps_cycles.push_back(cycles_enc);
            decaps_cycles.push_back(cycles_dec);
            total_cycles.push_back(end_total - start_total);

            if ((i + 1) % 100 == 0) {
                std::cout << "    Progress: " << (i + 1) << "/" << measurement_iterations << "\n";
            }
        }

        // Compute statistics
        std::cout << "  Computing statistics...\n";
        result.keygen = compute_statistics(keygen_cycles);
        result.encaps = compute_statistics(encaps_cycles);
        result.decaps = compute_statistics(decaps_cycles);
        result.total = compute_statistics(total_cycles);

        result.success = true;

        // Print results
        std::cout << "\n";
        print_statistics("KeyGen", result.keygen);
        print_statistics("Encaps", result.encaps);
        print_statistics("Decaps", result.decaps);
        print_statistics("Total", result.total);

    } catch (const std::exception& e) {
        result.success = false;
        result.error_message = e.what();
        std::cerr << "  ERROR: " << e.what() << "\n\n";
    }

    return result;
}

/**
 * Write all results to JSON file
 */
void write_results_json(
    const std::vector<ImplementationResult>& results,
    const std::string& filename,
    double cpu_ghz
) {
    std::ofstream ofs(filename);
    if (!ofs) {
        std::cerr << "Failed to open output file: " << filename << "\n";
        return;
    }

    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);

    ofs << "{\n";
    ofs << "  "; json::write_key_string(ofs, "benchmark_name", "Kyber-768 Cross-Implementation Comparison");
    ofs << "  "; json::write_key_string(ofs, "timestamp", std::ctime(&time_t));
    ofs << "  "; json::write_key_value(ofs, "cpu_frequency_ghz", cpu_ghz);
    ofs << "  \"baseline\": {\n";
    ofs << "    "; json::write_key_string(ofs, "implementation", "C++/AVX2");
    ofs << "    "; json::write_key_value(ofs, "keygen_target_cycles", 36000);
    ofs << "    "; json::write_key_value(ofs, "encaps_target_cycles", 36000);
    ofs << "    "; json::write_key_value(ofs, "decaps_target_cycles", 40000);
    ofs << "    "; json::write_key_value(ofs, "total_target_cycles", 112000, false);
    ofs << "  },\n";

    ofs << "  \"results\": {\n";
    for (size_t i = 0; i < results.size(); i++) {
        const auto& r = results[i];
        ofs << "    \"" << r.name << "\": {\n";
        ofs << "      "; json::write_key_string(ofs, "success", r.success ? "true" : "false");

        if (r.success) {
            ofs << "      \"keygen\": "; write_statistics_json(ofs, r.keygen, "      "); ofs << ",\n";
            ofs << "      \"encaps\": "; write_statistics_json(ofs, r.encaps, "      "); ofs << ",\n";
            ofs << "      \"decaps\": "; write_statistics_json(ofs, r.decaps, "      "); ofs << ",\n";
            ofs << "      \"total\": "; write_statistics_json(ofs, r.total, "      "); ofs << "\n";
        } else {
            ofs << "      "; json::write_key_string(ofs, "error", r.error_message.c_str(), false);
        }

        ofs << "    }" << (i + 1 < results.size() ? "," : "") << "\n";
    }
    ofs << "  }\n";
    ofs << "}\n";

    std::cout << "Results written to: " << filename << "\n";
}

/**
 * Main benchmark harness
 *
 * This is a template - actual implementations will be linked separately
 */
int main() {
    std::cout << "=================================================================\n";
    std::cout << "Kyber-768 Cross-Implementation Benchmark Harness\n";
    std::cout << "Cycle-Accurate Performance Measurement using RDTSC\n";
    std::cout << "=================================================================\n\n";

    // Estimate CPU frequency
    std::cout << "Estimating CPU frequency...\n";
    double cpu_ghz = estimate_cpu_frequency();
    std::cout << "Detected CPU frequency: " << std::fixed << std::setprecision(2) << cpu_ghz << " GHz\n\n";

    std::cout << "Baseline Target (C++/AVX2 @ 3.3 GHz):\n";
    std::cout << "  KeyGen:  ~36,000 cycles (0.011ms)\n";
    std::cout << "  Encaps:  ~36,000 cycles (0.011ms)\n";
    std::cout << "  Decaps:  ~40,000 cycles (0.012ms)\n";
    std::cout << "  TOTAL:   ~112,000 cycles (0.034ms)\n";
    std::cout << "\n";
    std::cout << "=================================================================\n\n";

    std::vector<ImplementationResult> results;

    // NOTE: Actual benchmark implementations will be added here
    // Each implementation provides:
    //   - keygen_func() -> uint64_t cycles
    //   - encaps_func() -> uint64_t cycles
    //   - decaps_func() -> uint64_t cycles

    std::cout << "This is the benchmark harness template.\n";
    std::cout << "Link with specific implementation benchmarks:\n";
    std::cout << "  - benchmark_cpp_avx2.cpp\n";
    std::cout << "  - benchmark_rust.cpp (FFI wrapper)\n";
    std::cout << "  - benchmark_mojo.cpp (FFI wrapper)\n";
    std::cout << "\n";

    // Write results
    auto now = std::chrono::system_clock::now();
    auto timestamp = std::chrono::duration_cast<std::chrono::seconds>(now.time_since_epoch()).count();
    std::string filename = "results/benchmark_results_" + std::to_string(timestamp) + ".json";

    write_results_json(results, filename, cpu_ghz);

    std::cout << "=================================================================\n";
    std::cout << "Benchmark Complete\n";
    std::cout << "=================================================================\n";

    return 0;
}
