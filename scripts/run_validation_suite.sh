#!/bin/bash

################################################################################
# run_validation_suite.sh
#
# Comprehensive validation suite for QRNG Kyber768 implementation
# Runs: dudect constant-time validation, performance benchmarks, memory checks
#
# Usage:
#   ./run_validation_suite.sh [OPTIONS]
#   ./run_validation_suite.sh --quick        # Fast validation (1M samples)
#   ./run_validation_suite.sh --full         # Full validation (50M samples)
#   ./run_validation_suite.sh --stress       # 8-hour stress test
################################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
MODE="standard"  # quick, standard, full, stress
DUDECT_SAMPLES=10000000  # 10M for standard
BENCHMARK_ITERATIONS=100000
STRESS_DURATION=28800  # 8 hours
PARALLEL_THREADS=$(nproc)
OUTPUT_DIR="$HOME/qdaria-qrng/results"
BUILD_DIR="$HOME/qdaria-qrng/build"

# Timestamps
START_TIME=$(date +%s)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

################################################################################
# Helper Functions
################################################################################

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

print_header() {
    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_progress() {
    local current=$1
    local total=$2
    local task=$3
    local percent=$((current * 100 / total))
    printf "\r${BLUE}[%3d%%]${NC} %s" "$percent" "$task"
}

show_help() {
    cat << EOF
Usage: $0 [OPTIONS]

Run comprehensive validation suite for QRNG Kyber768 implementation

OPTIONS:
    --quick         Fast validation (1M dudect samples, 10K benchmarks)
    --standard      Standard validation (10M dudect samples, 100K benchmarks) [default]
    --full          Full validation (50M dudect samples, 1M benchmarks)
    --stress        Stress test (8-hour endurance test)
    --samples N     Custom dudect sample count
    --iterations N  Custom benchmark iteration count
    --threads N     Parallel thread count (default: $(nproc))
    --help          Show this help message

VALIDATION PHASES:
    1. System Information Collection
    2. dudect Constant-Time Validation
    3. Performance Benchmarks (KeyGen, Encaps, Decaps)
    4. Memory Safety (Valgrind)
    5. Stress Testing (optional)
    6. Results Aggregation

EXAMPLES:
    # Standard validation (3 hours)
    $0

    # Quick validation for CI/CD (30 minutes)
    $0 --quick

    # Full production validation (12 hours)
    $0 --full

    # Custom sample count
    $0 --samples 25000000

EOF
    exit 0
}

collect_system_info() {
    print_header "Phase 1: System Information Collection"

    mkdir -p "$OUTPUT_DIR"

    print_info "Collecting CPU information..."
    {
        echo "═══════════════════════════════════════════════════════"
        echo "  System Information"
        echo "═══════════════════════════════════════════════════════"
        echo ""
        echo "Timestamp: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
        echo "Hostname: $(hostname)"
        echo ""
        echo "--- CPU Information ---"
        lscpu | grep -E "Model name|Architecture|CPU\(s\)|Thread|Core|MHz|Cache|Flags"
        echo ""
        echo "--- AVX2 Support ---"
        if grep -q avx2 /proc/cpuinfo; then
            echo "✓ AVX2 instructions supported"
        else
            echo "✗ AVX2 instructions NOT supported"
        fi
        echo ""
        echo "--- Memory Information ---"
        free -h
        echo ""
        echo "--- Storage Information ---"
        df -h "$HOME"
        echo ""
        echo "--- Compiler Information ---"
        g++ --version | head -n 1
        cmake --version | head -n 1
        echo ""
        echo "--- Git Commit ---"
        cd "$HOME/qdaria-qrng"
        git log -1 --pretty=format:"Commit: %H%nAuthor: %an <%ae>%nDate: %ad%nMessage: %s%n"
    } > "$OUTPUT_DIR/system_info.txt"

    print_success "System information saved: $OUTPUT_DIR/system_info.txt"
}

run_dudect_validation() {
    print_header "Phase 2: dudect Constant-Time Validation"

    print_info "Validating constant-time implementation..."
    print_info "Samples: $(numfmt --grouping $DUDECT_SAMPLES)"
    print_info "Confidence threshold: 99.9%"
    print_info "t-statistic threshold: [-4.5, 4.5]"
    echo ""

    # Check if dudect binary exists
    if [ ! -f "$BUILD_DIR/dudect_kyber768" ]; then
        print_error "dudect binary not found. Build project first."
    fi

    # Run dudect with progress monitoring
    print_info "Running dudect (this may take 20-30 minutes)..."

    local dudect_log="$OUTPUT_DIR/dudect_${TIMESTAMP}.log"
    local dudect_json="$OUTPUT_DIR/dudect_${TIMESTAMP}.json"

    (
        cd "$BUILD_DIR"
        ./dudect_kyber768 \
            --samples "$DUDECT_SAMPLES" \
            --confidence 0.999 \
            --output "$dudect_json" 2>&1 | tee "$dudect_log"
    ) &

    local dudect_pid=$!

    # Monitor progress
    while kill -0 $dudect_pid 2>/dev/null; do
        if [ -f "$dudect_log" ]; then
            local processed=$(grep -c "sample" "$dudect_log" 2>/dev/null || echo "0")
            print_progress "$processed" "$DUDECT_SAMPLES" "Processing dudect samples..."
        fi
        sleep 5
    done
    echo ""

    wait $dudect_pid

    # Parse results
    if [ -f "$dudect_json" ]; then
        local t_stat=$(jq -r '.t_statistic' "$dudect_json")
        local result=$(jq -r '.result' "$dudect_json")

        echo ""
        print_info "dudect Results:"
        echo "  t-statistic: $t_stat"
        echo "  Result: $result"

        if [ "$result" == "PASS" ]; then
            print_success "✓ Constant-time validation PASSED"
        else
            print_error "✗ Constant-time validation FAILED (timing leakage detected)"
        fi
    else
        print_error "dudect output not generated"
    fi
}

run_performance_benchmarks() {
    print_header "Phase 3: Performance Benchmarks"

    print_info "Running performance benchmarks..."
    print_info "Iterations: $(numfmt --grouping $BENCHMARK_ITERATIONS)"
    print_info "Measuring: KeyGen, Encaps, Decaps operations"
    echo ""

    local benchmark_json="$OUTPUT_DIR/benchmark_${TIMESTAMP}.json"
    local benchmark_log="$OUTPUT_DIR/benchmark_${TIMESTAMP}.log"

    if [ ! -f "$BUILD_DIR/benchmark_kyber768" ]; then
        print_error "Benchmark binary not found. Build project first."
    fi

    (
        cd "$BUILD_DIR"
        ./benchmark_kyber768 \
            --iterations "$BENCHMARK_ITERATIONS" \
            --format json \
            --output "$benchmark_json" 2>&1 | tee "$benchmark_log"
    )

    # Parse and display results
    if [ -f "$benchmark_json" ]; then
        echo ""
        print_info "Performance Results:"

        local keygen_avg=$(jq -r '.operations.keygen.average_us' "$benchmark_json")
        local encaps_avg=$(jq -r '.operations.encaps.average_us' "$benchmark_json")
        local decaps_avg=$(jq -r '.operations.decaps.average_us' "$benchmark_json")
        local full_cycle_avg=$(jq -r '.operations.full_cycle.average_us' "$benchmark_json")

        printf "  KeyGen:     %6.2f μs " "$keygen_avg"
        if (( $(echo "$keygen_avg < 30" | bc -l) )); then
            echo -e "${GREEN}✓ (target: <30μs)${NC}"
        else
            echo -e "${YELLOW}⚠ (target: <30μs)${NC}"
        fi

        printf "  Encaps:     %6.2f μs " "$encaps_avg"
        if (( $(echo "$encaps_avg < 40" | bc -l) )); then
            echo -e "${GREEN}✓ (target: <40μs)${NC}"
        else
            echo -e "${YELLOW}⚠ (target: <40μs)${NC}"
        fi

        printf "  Decaps:     %6.2f μs " "$decaps_avg"
        if (( $(echo "$decaps_avg < 45" | bc -l) )); then
            echo -e "${GREEN}✓ (target: <45μs)${NC}"
        else
            echo -e "${YELLOW}⚠ (target: <45μs)${NC}"
        fi

        printf "  Full Cycle: %6.2f μs " "$full_cycle_avg"
        if (( $(echo "$full_cycle_avg < 110" | bc -l) )); then
            echo -e "${GREEN}✓ (target: <110μs)${NC}"
        else
            echo -e "${YELLOW}⚠ (target: <110μs)${NC}"
        fi

        print_success "Benchmark results saved: $benchmark_json"
    else
        print_error "Benchmark output not generated"
    fi
}

run_memory_validation() {
    print_header "Phase 4: Memory Safety Validation"

    print_info "Running Valgrind memcheck (this may take 10-15 minutes)..."

    local valgrind_log="$OUTPUT_DIR/valgrind_${TIMESTAMP}.txt"

    valgrind \
        --leak-check=full \
        --show-leak-kinds=all \
        --track-origins=yes \
        --verbose \
        --log-file="$valgrind_log" \
        "$BUILD_DIR/benchmark_kyber768" --iterations 1000

    # Parse results
    local errors=$(grep "ERROR SUMMARY" "$valgrind_log" | awk '{print $4}')
    local leaked=$(grep "definitely lost" "$valgrind_log" | awk '{print $4}' | tr -d ',')

    echo ""
    print_info "Memory Validation Results:"
    echo "  Errors: $errors"
    echo "  Memory leaked: ${leaked:-0} bytes"

    if [ "${errors:-0}" -eq 0 ] && [ "${leaked:-0}" -eq 0 ]; then
        print_success "✓ No memory leaks or errors detected"
    else
        print_warning "⚠ Memory issues detected. Review: $valgrind_log"
    fi
}

run_stress_test() {
    print_header "Phase 5: Stress Testing"

    print_info "Running extended stress test..."
    print_info "Duration: $STRESS_DURATION seconds ($(($STRESS_DURATION / 3600)) hours)"
    print_info "Threads: $PARALLEL_THREADS"
    echo ""

    local stress_log="$OUTPUT_DIR/stress_test_${TIMESTAMP}.log"

    if [ ! -f "$BUILD_DIR/stress_test_kyber768" ]; then
        print_warning "Stress test binary not found. Skipping stress test."
        return
    fi

    (
        cd "$BUILD_DIR"
        ./stress_test_kyber768 \
            --duration "$STRESS_DURATION" \
            --threads "$PARALLEL_THREADS" \
            --log "$stress_log"
    ) &

    local stress_pid=$!

    # Monitor progress
    local elapsed=0
    while kill -0 $stress_pid 2>/dev/null; do
        sleep 60
        elapsed=$((elapsed + 60))
        local percent=$((elapsed * 100 / STRESS_DURATION))
        local hours=$((elapsed / 3600))
        local mins=$(((elapsed % 3600) / 60))
        printf "\r${BLUE}[%3d%%]${NC} Stress test running: %dh %02dm elapsed" "$percent" "$hours" "$mins"
    done
    echo ""

    wait $stress_pid

    # Check for failures
    local failures=$(grep -c "FAILURE" "$stress_log" 2>/dev/null || echo "0")

    if [ "$failures" -eq 0 ]; then
        print_success "✓ Stress test completed with zero failures"
    else
        print_error "✗ Stress test detected $failures failures. Review: $stress_log"
    fi
}

generate_summary_report() {
    print_header "Phase 6: Results Summary"

    local summary_file="$OUTPUT_DIR/validation_summary_${TIMESTAMP}.txt"

    {
        echo "═══════════════════════════════════════════════════════"
        echo "  QRNG Kyber768 Validation Summary"
        echo "═══════════════════════════════════════════════════════"
        echo ""
        echo "Date: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
        echo "Mode: $MODE"
        echo "Duration: $(($(date +%s) - START_TIME)) seconds"
        echo ""

        echo "--- Constant-Time Validation (dudect) ---"
        if [ -f "$OUTPUT_DIR/dudect_${TIMESTAMP}.json" ]; then
            jq -r '. | "t-statistic: \(.t_statistic)\nResult: \(.result)\nSamples: \(.samples)\nConfidence: \(.confidence)"' \
                "$OUTPUT_DIR/dudect_${TIMESTAMP}.json"
        else
            echo "No dudect results available"
        fi
        echo ""

        echo "--- Performance Benchmarks ---"
        if [ -f "$OUTPUT_DIR/benchmark_${TIMESTAMP}.json" ]; then
            jq -r '.operations | to_entries[] | "\(.key): \(.value.average_us) μs (±\(.value.stddev_us) μs)"' \
                "$OUTPUT_DIR/benchmark_${TIMESTAMP}.json"
        else
            echo "No benchmark results available"
        fi
        echo ""

        echo "--- Memory Validation ---"
        if [ -f "$OUTPUT_DIR/valgrind_${TIMESTAMP}.txt" ]; then
            grep "ERROR SUMMARY" "$OUTPUT_DIR/valgrind_${TIMESTAMP}.txt"
            grep "definitely lost" "$OUTPUT_DIR/valgrind_${TIMESTAMP}.txt" | head -n 1
        else
            echo "No memory validation results available"
        fi
        echo ""

        echo "--- Files Generated ---"
        ls -lh "$OUTPUT_DIR" | tail -n +2 | awk '{print $9, "(" $5 ")"}'
        echo ""

    } | tee "$summary_file"

    print_success "Summary report saved: $summary_file"
}

################################################################################
# Main Execution
################################################################################

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --quick)
            MODE="quick"
            DUDECT_SAMPLES=1000000
            BENCHMARK_ITERATIONS=10000
            shift
            ;;
        --standard)
            MODE="standard"
            shift
            ;;
        --full)
            MODE="full"
            DUDECT_SAMPLES=50000000
            BENCHMARK_ITERATIONS=1000000
            shift
            ;;
        --stress)
            MODE="stress"
            shift
            ;;
        --samples)
            DUDECT_SAMPLES="$2"
            shift 2
            ;;
        --iterations)
            BENCHMARK_ITERATIONS="$2"
            shift 2
            ;;
        --threads)
            PARALLEL_THREADS="$2"
            shift 2
            ;;
        --help)
            show_help
            ;;
        *)
            print_error "Unknown option: $1. Use --help for usage."
            ;;
    esac
done

# Main execution
print_header "QRNG Kyber768 Validation Suite"

echo -e "${CYAN}Configuration:${NC}"
echo "  Mode: $MODE"
echo "  dudect samples: $(numfmt --grouping $DUDECT_SAMPLES)"
echo "  Benchmark iterations: $(numfmt --grouping $BENCHMARK_ITERATIONS)"
echo "  Parallel threads: $PARALLEL_THREADS"
echo "  Output directory: $OUTPUT_DIR"
echo ""

# Verify build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    print_error "Build directory not found: $BUILD_DIR. Run cmake and make first."
fi

# Run validation phases
collect_system_info
run_dudect_validation
run_performance_benchmarks
run_memory_validation

if [ "$MODE" == "stress" ]; then
    run_stress_test
fi

generate_summary_report

# Calculate total duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
HOURS=$((DURATION / 3600))
MINUTES=$(((DURATION % 3600) / 60))
SECONDS=$((DURATION % 60))

print_success "Validation suite completed in ${HOURS}h ${MINUTES}m ${SECONDS}s"
print_info "All results saved to: $OUTPUT_DIR"
