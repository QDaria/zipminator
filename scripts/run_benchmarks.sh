#!/bin/bash

###############################################################################
# CRYSTALS-Kyber-768 Automated Benchmark Execution Script
#
# Usage: ./scripts/run_benchmarks.sh [options]
#
# Options:
#   --output-dir DIR    Output directory for reports (default: ./benchmarks)
#   --iterations N      Number of iterations (default: 10000)
#   --json-only        Only generate JSON report
#   --help             Show this help message
#
# Requirements:
#   - C++17 compiler (g++ or clang++)
#   - x86_64 CPU with RDTSC support
#   - AVX2 support recommended for optimal performance
#
# Exit Codes:
#   0 - All benchmarks passed
#   1 - One or more benchmarks failed
#   2 - Build error
#   3 - Invalid arguments
###############################################################################

set -euo pipefail

# Default configuration
OUTPUT_DIR="./benchmarks"
ITERATIONS=10000
JSON_ONLY=false
BENCH_BINARY="./benches/production_benchmark"
SOURCE_FILE="./benches/production_benchmark.cpp"
KYBER_IMPL_DIR="./src/cpp"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    sed -n '3,19p' "$0" | sed 's/^# //'
    exit 0
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --output-dir)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --iterations)
            ITERATIONS="$2"
            shift 2
            ;;
        --json-only)
            JSON_ONLY=true
            shift
            ;;
        --help)
            show_help
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 3
            ;;
    esac
done

###############################################################################
# Pre-flight checks
###############################################################################

log_info "Running pre-flight checks..."

# Check CPU architecture
ARCH=$(uname -m)
if [[ "$ARCH" != "x86_64" && "$ARCH" != "amd64" ]]; then
    log_error "Unsupported architecture: $ARCH (x86_64 required)"
    exit 3
fi
log_success "CPU architecture: $ARCH"

# Check for RDTSC support
if ! grep -q "constant_tsc" /proc/cpuinfo 2>/dev/null; then
    log_warning "Constant TSC not detected - results may be less accurate"
fi

# Check for AVX2 support
if grep -q "avx2" /proc/cpuinfo 2>/dev/null; then
    log_success "AVX2 support detected"
    AVX2_FLAGS="-mavx2 -mbmi2"
else
    log_warning "AVX2 not detected - performance may be suboptimal"
    AVX2_FLAGS=""
fi

# Check compiler
if command -v g++ &> /dev/null; then
    COMPILER="g++"
elif command -v clang++ &> /dev/null; then
    COMPILER="clang++"
else
    log_error "No C++ compiler found (g++ or clang++ required)"
    exit 2
fi
log_success "Compiler: $COMPILER"

# Create output directory
mkdir -p "$OUTPUT_DIR"
log_success "Output directory: $OUTPUT_DIR"

###############################################################################
# Build benchmark binary
###############################################################################

log_info "Building benchmark binary..."

# Compilation flags
CXXFLAGS=(
    -std=c++17
    -O3
    -march=native
    $AVX2_FLAGS
    -Wall
    -Wextra
    -I"$KYBER_IMPL_DIR"
    -DBENCHMARK_ITERATIONS=$ITERATIONS
)

# Link flags
LDFLAGS=(
    -lpthread
)

# Build command
BUILD_CMD="$COMPILER ${CXXFLAGS[*]} $SOURCE_FILE -o $BENCH_BINARY ${LDFLAGS[*]}"

log_info "Compile command: $BUILD_CMD"

if eval "$BUILD_CMD"; then
    log_success "Build successful: $BENCH_BINARY"
else
    log_error "Build failed"
    exit 2
fi

###############################################################################
# System configuration for accurate benchmarking
###############################################################################

log_info "Configuring system for benchmarking..."

# Disable CPU frequency scaling (requires root)
if [ -w /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor ]; then
    log_info "Setting CPU governor to performance mode..."
    for cpu in /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor; do
        echo performance | sudo tee "$cpu" > /dev/null 2>&1 || true
    done
    log_success "CPU governor set to performance"
else
    log_warning "Cannot set CPU governor (not running as root) - results may vary"
fi

# Disable address space layout randomization (requires root)
if [ -w /proc/sys/kernel/randomize_va_space ]; then
    PREV_ASLR=$(cat /proc/sys/kernel/randomize_va_space)
    echo 0 | sudo tee /proc/sys/kernel/randomize_va_space > /dev/null 2>&1 || true
    log_success "ASLR disabled temporarily"
else
    log_warning "Cannot disable ASLR - may increase measurement variance"
    PREV_ASLR=""
fi

# Set CPU affinity to core 0
log_info "Setting CPU affinity to core 0..."

###############################################################################
# Run benchmarks
###############################################################################

log_info "Starting benchmark execution..."
echo ""
echo "=================================================================================="
echo " BENCHMARK EXECUTION"
echo "=================================================================================="
echo ""

# Run with taskset to pin to CPU 0
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$OUTPUT_DIR/benchmark_report_${TIMESTAMP}.txt"
JSON_FILE="$OUTPUT_DIR/benchmark_report_${TIMESTAMP}.json"

if command -v taskset &> /dev/null; then
    BENCHMARK_EXIT_CODE=0
    taskset -c 0 "$BENCH_BINARY" 2>&1 | tee "$REPORT_FILE" || BENCHMARK_EXIT_CODE=$?
else
    BENCHMARK_EXIT_CODE=0
    "$BENCH_BINARY" 2>&1 | tee "$REPORT_FILE" || BENCHMARK_EXIT_CODE=$?
fi

# Move JSON to timestamped location
if [ -f "$OUTPUT_DIR/benchmark_report.json" ]; then
    mv "$OUTPUT_DIR/benchmark_report.json" "$JSON_FILE"
fi

###############################################################################
# Cleanup and restore system settings
###############################################################################

log_info "Restoring system settings..."

# Restore ASLR
if [ -n "$PREV_ASLR" ] && [ -w /proc/sys/kernel/randomize_va_space ]; then
    echo "$PREV_ASLR" | sudo tee /proc/sys/kernel/randomize_va_space > /dev/null 2>&1 || true
    log_success "ASLR restored"
fi

# Restore CPU governor
if [ -w /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor ]; then
    for cpu in /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor; do
        echo ondemand | sudo tee "$cpu" > /dev/null 2>&1 || true
    done
    log_success "CPU governor restored to ondemand"
fi

###############################################################################
# Summary
###############################################################################

echo ""
echo "=================================================================================="
echo " BENCHMARK SUMMARY"
echo "=================================================================================="
echo ""

log_info "Reports generated:"
echo "  - Text report: $REPORT_FILE"
echo "  - JSON report: $JSON_FILE"
echo ""

# Check exit code and print status
if [ $BENCHMARK_EXIT_CODE -eq 0 ]; then
    log_success "ALL BENCHMARKS PASSED ✓"
    log_success "Performance targets met: KeyGen ≤ 11μs, Encaps ≤ 11μs, Decaps ≤ 12μs, Total ≤ 34μs"
    exit 0
else
    log_error "BENCHMARKS FAILED ✗"
    log_error "Performance targets NOT met - see report for details"
    exit 1
fi
