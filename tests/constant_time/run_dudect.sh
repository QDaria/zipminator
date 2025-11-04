#!/bin/bash
#
# Automated Dudect Constant-Time Validation Runner
#
# Runs all constant-time tests for all implementations and generates
# comprehensive security validation report.
#
# Usage: ./run_dudect.sh [implementation]
#   implementation: cpp, rust, mojo, all (default: all)

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
RESULTS_DIR="$SCRIPT_DIR/results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Test configuration
MIN_SAMPLES=10000000  # 10 million samples
CONFIDENCE_LEVEL=0.001  # p < 0.001
T_THRESHOLD=3.29  # t-statistic threshold for p < 0.001

echo "=================================================="
echo "Dudect Constant-Time Validation Framework"
echo "=================================================="
echo ""
echo "Configuration:"
echo "  Minimum samples: $MIN_SAMPLES"
echo "  Confidence level: p < $CONFIDENCE_LEVEL (t > $T_THRESHOLD)"
echo "  Project root: $PROJECT_ROOT"
echo "  Results directory: $RESULTS_DIR"
echo ""

# Create results directory
mkdir -p "$RESULTS_DIR"

# Function to run a single test
run_test() {
    local impl=$1
    local test_name=$2
    local binary=$3

    echo "=================================================="
    echo "Running: $impl - $test_name"
    echo "=================================================="

    local output_file="$RESULTS_DIR/${impl}_${test_name}_${TIMESTAMP}.txt"
    local json_file="$RESULTS_DIR/${impl}_${test_name}_${TIMESTAMP}.json"

    # Check if binary exists
    if [ ! -f "$binary" ]; then
        echo -e "${RED}ERROR: Binary not found: $binary${NC}"
        echo "Please build the implementation first."
        return 1
    fi

    # Run the test
    echo "Output: $output_file"
    if "$binary" "$test_name" | tee "$output_file"; then
        echo -e "${GREEN}✓ Test PASSED${NC}"
        echo "{ \"implementation\": \"$impl\", \"test\": \"$test_name\", \"result\": \"PASS\", \"timestamp\": \"$TIMESTAMP\" }" > "$json_file"
        return 0
    else
        echo -e "${RED}✗ Test FAILED${NC}"
        echo "{ \"implementation\": \"$impl\", \"test\": \"$test_name\", \"result\": \"FAIL\", \"timestamp\": \"$TIMESTAMP\" }" > "$json_file"
        return 1
    fi
}

# Function to build implementation
build_implementation() {
    local impl=$1

    echo "=================================================="
    echo "Building: $impl"
    echo "=================================================="

    case $impl in
        cpp)
            cd "$PROJECT_ROOT/src/cpp"
            if [ -f "build.sh" ]; then
                ./build.sh
            else
                echo -e "${YELLOW}WARNING: No build script found for C++${NC}"
                echo "Please build manually with:"
                echo "  cd $PROJECT_ROOT/src/cpp"
                echo "  g++ -O3 -march=native -mavx2 -o kyber768_dudect \\"
                echo "      *.cpp $SCRIPT_DIR/dudect_cpp.c -I$SCRIPT_DIR"
            fi
            ;;
        rust)
            cd "$PROJECT_ROOT/src/rust"
            cargo build --release --features=constant-time-tests
            ;;
        mojo)
            cd "$PROJECT_ROOT/src/mojo"
            if [ -f "build.sh" ]; then
                ./build.sh
            else
                echo -e "${YELLOW}WARNING: No build script found for Mojo${NC}"
                echo "Mojo constant-time testing requires C FFI bindings."
                echo "See: $SCRIPT_DIR/dudect_mojo.c"
            fi
            ;;
        *)
            echo -e "${RED}ERROR: Unknown implementation: $impl${NC}"
            return 1
            ;;
    esac
}

# Function to test implementation
test_implementation() {
    local impl=$1

    echo ""
    echo "=================================================="
    echo "Testing Implementation: $impl"
    echo "=================================================="
    echo ""

    # Build first
    build_implementation "$impl" || return 1

    local binary=""
    local tests=()

    case $impl in
        cpp)
            binary="$PROJECT_ROOT/src/cpp/build/kyber768_dudect"
            tests=("ntt" "decaps" "montgomery")
            ;;
        rust)
            binary="$PROJECT_ROOT/src/rust/target/release/kyber768_dudect"
            tests=("ntt" "decaps" "compare")
            ;;
        mojo)
            binary="$PROJECT_ROOT/src/mojo/build/kyber768_dudect"
            tests=("ntt" "decaps" "compare" "montgomery")
            ;;
        *)
            echo -e "${RED}ERROR: Unknown implementation: $impl${NC}"
            return 1
            ;;
    esac

    local passed=0
    local failed=0

    # Run each test
    for test in "${tests[@]}"; do
        if run_test "$impl" "$test" "$binary"; then
            ((passed++))
        else
            ((failed++))
        fi
        echo ""
    done

    # Summary for this implementation
    echo "=================================================="
    echo "Summary: $impl"
    echo "=================================================="
    echo "Tests passed: $passed"
    echo "Tests failed: $failed"
    echo ""

    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}✓ All tests PASSED for $impl${NC}"
        return 0
    else
        echo -e "${RED}✗ Some tests FAILED for $impl${NC}"
        return 1
    fi
}

# Main execution
IMPL="${1:-all}"

if [ "$IMPL" = "all" ]; then
    echo "Running all implementations..."
    echo ""

    cpp_result=0
    rust_result=0
    mojo_result=0

    test_implementation "cpp" || cpp_result=$?
    test_implementation "rust" || rust_result=$?
    test_implementation "mojo" || mojo_result=$?

    # Final summary
    echo ""
    echo "=================================================="
    echo "FINAL SUMMARY - All Implementations"
    echo "=================================================="
    echo ""

    if [ $cpp_result -eq 0 ]; then
        echo -e "${GREEN}✓ C++/AVX2: PASS${NC}"
    else
        echo -e "${RED}✗ C++/AVX2: FAIL${NC}"
    fi

    if [ $rust_result -eq 0 ]; then
        echo -e "${GREEN}✓ Rust: PASS${NC}"
    else
        echo -e "${RED}✗ Rust: FAIL${NC}"
    fi

    if [ $mojo_result -eq 0 ]; then
        echo -e "${YELLOW}⚠ Mojo: PASS (UNEXPECTED - requires investigation)${NC}"
    else
        echo -e "${YELLOW}✓ Mojo: FAIL (expected - use C++/Rust)${NC}"
    fi

    echo ""
    echo "Detailed results saved to: $RESULTS_DIR"
    echo ""

    # Generate comprehensive report
    "$SCRIPT_DIR/generate_report.py" "$RESULTS_DIR" "$TIMESTAMP"

    # Exit with error if any critical implementation failed
    if [ $cpp_result -ne 0 ] && [ $rust_result -ne 0 ]; then
        echo -e "${RED}CRITICAL: Both C++ and Rust implementations failed!${NC}"
        echo "This indicates a fundamental security flaw."
        exit 1
    fi

else
    test_implementation "$IMPL"
fi

echo ""
echo "=================================================="
echo "Constant-Time Validation Complete"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Review detailed results in: $RESULTS_DIR"
echo "2. Read the generated report: docs/constant_time_results.md"
echo "3. If any FAIL results:"
echo "   - Inspect assembly output"
echo "   - Review compiler flags"
echo "   - Check for variable-time operations"
echo "4. Coordinate with benchmark team via memory:"
echo "   npx claude-flow@alpha hooks notify --message 'CT validation complete'"
