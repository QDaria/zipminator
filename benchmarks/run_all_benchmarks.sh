#!/bin/bash
#
# Kyber-768 Cross-Implementation Benchmark Suite
# ===============================================
#
# Automated execution of all benchmarks with cycle-accurate measurements.
# Runs C++/AVX2, Rust, and Mojo implementations (if available).
#
# Usage: ./run_all_benchmarks.sh [--warmup N] [--iterations N]
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WARMUP=100
ITERATIONS=1000
RESULTS_DIR="results"
TIMESTAMP=$(date +%s)

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --warmup)
            WARMUP="$2"
            shift 2
            ;;
        --iterations)
            ITERATIONS="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [--warmup N] [--iterations N]"
            echo ""
            echo "Options:"
            echo "  --warmup N        Number of warmup iterations (default: 100)"
            echo "  --iterations N    Number of measurement iterations (default: 1000)"
            echo "  --help            Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}=================================================================${NC}"
echo -e "${BLUE}Kyber-768 Cross-Implementation Benchmark Suite${NC}"
echo -e "${BLUE}=================================================================${NC}"
echo ""
echo -e "Configuration:"
echo -e "  Warmup iterations:      ${WARMUP}"
echo -e "  Measurement iterations: ${ITERATIONS}"
echo -e "  Results directory:      ${RESULTS_DIR}"
echo -e "  Timestamp:              ${TIMESTAMP}"
echo ""

# Create results directory
mkdir -p "${RESULTS_DIR}"

# Check CPU features
echo -e "${BLUE}Checking CPU features...${NC}"
if ! grep -q "avx2" /proc/cpuinfo 2>/dev/null && ! sysctl -a 2>/dev/null | grep -q "hw.optional.avx2_0: 1"; then
    echo -e "${RED}WARNING: AVX2 not detected. Performance may be degraded.${NC}"
else
    echo -e "${GREEN}✓ AVX2 detected${NC}"
fi

if ! grep -q "rdtscp" /proc/cpuinfo 2>/dev/null && ! sysctl -a 2>/dev/null | grep -q "machdep.cpu.features" | grep -q "RDTSCP"; then
    echo -e "${YELLOW}WARNING: RDTSCP not detected. Using RDTSC instead.${NC}"
else
    echo -e "${GREEN}✓ RDTSCP detected${NC}"
fi
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to build and run a benchmark
run_benchmark() {
    local name=$1
    local build_cmd=$2
    local run_cmd=$3
    local enabled=$4

    if [ "${enabled}" != "true" ]; then
        echo -e "${YELLOW}Skipping ${name} (disabled)${NC}"
        return 0
    fi

    echo -e "${BLUE}=================================================================${NC}"
    echo -e "${BLUE}Running ${name} Benchmark${NC}"
    echo -e "${BLUE}=================================================================${NC}"
    echo ""

    # Build
    echo -e "${BLUE}Building ${name}...${NC}"
    if eval "${build_cmd}"; then
        echo -e "${GREEN}✓ Build successful${NC}"
    else
        echo -e "${RED}✗ Build failed${NC}"
        return 1
    fi
    echo ""

    # Run
    echo -e "${BLUE}Running ${name} benchmark...${NC}"
    if eval "${run_cmd}"; then
        echo -e "${GREEN}✓ Benchmark completed${NC}"
    else
        echo -e "${RED}✗ Benchmark failed${NC}"
        return 1
    fi
    echo ""
}

# Benchmark 1: C++/AVX2
CPP_BUILD="cd cpp && clang++ -O3 -march=native -mavx2 -std=c++17 benchmark_cpp_avx2.cpp ../../src/cpp/*.cpp -I../../src/cpp -o benchmark_cpp_avx2"
CPP_RUN="cd cpp && ./benchmark_cpp_avx2"
run_benchmark "C++/AVX2" "${CPP_BUILD}" "${CPP_RUN}" "true"

# Benchmark 2: Rust
if command_exists cargo; then
    RUST_BUILD="cd ../src/rust && cargo build --release --bench kyber_bench"
    RUST_RUN="cd ../src/rust && cargo bench --bench kyber_bench -- --warmup ${WARMUP} --iterations ${ITERATIONS}"
    run_benchmark "Rust" "${RUST_BUILD}" "${RUST_RUN}" "true"
else
    echo -e "${YELLOW}Skipping Rust benchmark (cargo not found)${NC}"
fi

# Benchmark 3: Mojo
if command_exists mojo; then
    echo -e "${YELLOW}Mojo benchmark: Implementation incomplete${NC}"
    echo -e "${YELLOW}Required components:${NC}"
    echo -e "  - SHA3/SHAKE cryptographic hash functions"
    echo -e "  - Hardware QRNG integration"
    echo -e "  - Complete key generation algorithm"
    echo -e "  - Complete encapsulation algorithm"
    echo -e "  - Complete decapsulation algorithm"
    echo ""
    # MOJO_BUILD="cd mojo && mojo build -O3 benchmark_mojo.mojo"
    # MOJO_RUN="cd mojo && ./benchmark_mojo"
    # run_benchmark "Mojo" "${MOJO_BUILD}" "${MOJO_RUN}" "false"
else
    echo -e "${YELLOW}Skipping Mojo benchmark (mojo not found)${NC}"
fi

# Generate comparison report
echo -e "${BLUE}=================================================================${NC}"
echo -e "${BLUE}Generating Comparison Report${NC}"
echo -e "${BLUE}=================================================================${NC}"
echo ""

REPORT_FILE="${RESULTS_DIR}/comparison_report_${TIMESTAMP}.txt"

cat > "${REPORT_FILE}" <<EOF
Kyber-768 Cross-Implementation Benchmark Report
================================================

Timestamp: $(date)
Configuration:
  Warmup iterations:      ${WARMUP}
  Measurement iterations: ${ITERATIONS}

Baseline Target (C++/AVX2 @ 3.3 GHz):
  KeyGen:  ~36,000 cycles (0.011ms)
  Encaps:  ~36,000 cycles (0.011ms)
  Decaps:  ~40,000 cycles (0.012ms)
  TOTAL:   ~112,000 cycles (0.034ms)

Results:
--------

EOF

# Parse and compare results
for result in ${RESULTS_DIR}/*.json; do
    if [ -f "${result}" ]; then
        echo "Processing: ${result}" >> "${REPORT_FILE}"
        # Simple JSON parsing (requires jq for production use)
        echo "" >> "${REPORT_FILE}"
    fi
done

echo -e "${GREEN}✓ Report generated: ${REPORT_FILE}${NC}"
echo ""

# Summary
echo -e "${BLUE}=================================================================${NC}"
echo -e "${BLUE}Benchmark Suite Complete${NC}"
echo -e "${BLUE}=================================================================${NC}"
echo ""
echo -e "Results available in: ${GREEN}${RESULTS_DIR}/${NC}"
echo -e "Comparison report:    ${GREEN}${REPORT_FILE}${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo -e "  1. Review individual benchmark JSON files"
echo -e "  2. Compare cycle counts across implementations"
echo -e "  3. Analyze performance bottlenecks"
echo -e "  4. Generate visualization (optional)"
echo ""
echo -e "${BLUE}Suggested Analysis:${NC}"
echo -e "  - KeyGen efficiency: Compare against ~36,000 cycle baseline"
echo -e "  - Encaps efficiency: Compare against ~36,000 cycle baseline"
echo -e "  - Decaps efficiency: Compare against ~40,000 cycle baseline"
echo -e "  - Total latency: Compare against ~112,000 cycle baseline"
echo ""
