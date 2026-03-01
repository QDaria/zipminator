#!/bin/bash
#
# Zipminator M1 Mac Installation Test Suite
# Tests all components on Apple Silicon (arm64) architecture
#
# Usage: ./scripts/test_m1_installation.sh
#

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# Test output directory
TEST_DIR="/tmp/zipminator-test-$$"
mkdir -p "$TEST_DIR"

# Cleanup on exit
cleanup() {
    rm -rf "$TEST_DIR"
}
trap cleanup EXIT

# Helper functions
print_header() {
    echo ""
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${BLUE}$1${NC}"
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_test() {
    echo -e "\n${BOLD}🧪 Test: $1${NC}"
    ((TOTAL_TESTS++))
}

print_pass() {
    echo -e "${GREEN}✅ PASS:${NC} $1"
    ((PASSED_TESTS++))
}

print_fail() {
    echo -e "${RED}❌ FAIL:${NC} $1"
    ((FAILED_TESTS++))
}

print_warn() {
    echo -e "${YELLOW}⚠️  WARN:${NC} $1"
    ((WARNINGS++))
}

print_info() {
    echo -e "${BLUE}ℹ️  INFO:${NC} $1"
}

print_fix() {
    echo -e "${YELLOW}💡 FIX:${NC} $1"
}

# Start testing
echo -e "${BOLD}${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        🔐 ZIPMINATOR M1 INSTALLATION TEST SUITE          ║
║                                                           ║
║     Quantum-Secure Encryption Platform Verification      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo -e "${BLUE}Project Root:${NC} $PROJECT_ROOT"
echo -e "${BLUE}Test Directory:${NC} $TEST_DIR"
cd "$PROJECT_ROOT"

# ============================================================================
# SECTION 1: SYSTEM REQUIREMENTS
# ============================================================================
print_header "1. SYSTEM REQUIREMENTS"

print_test "Architecture Check"
ARCH=$(uname -m)
OS=$(uname -s)
if [ "$ARCH" == "arm64" ]; then
    print_pass "Apple Silicon detected: $ARCH"
    MACOS_VERSION=$(sw_vers -productVersion)
    print_info "macOS Version: $MACOS_VERSION"
else
    print_fail "Not Apple Silicon: $ARCH (Expected: arm64)"
    print_fix "This script is designed for M1/M2/M3 Macs"
    exit 1
fi

print_test "Operating System"
if [ "$OS" == "Darwin" ]; then
    print_pass "macOS detected: $OS"
else
    print_fail "Not macOS: $OS"
    exit 1
fi

# ============================================================================
# SECTION 2: REQUIRED TOOLS
# ============================================================================
print_header "2. REQUIRED TOOLS"

print_test "Rust Toolchain"
if command -v rustc &> /dev/null; then
    RUST_VERSION=$(rustc --version)
    print_pass "Rust installed: $RUST_VERSION"

    CARGO_VERSION=$(cargo --version)
    print_info "Cargo: $CARGO_VERSION"

    # Check for arm64 target
    if rustup target list --installed | grep -q "aarch64-apple-darwin"; then
        print_pass "arm64 target (aarch64-apple-darwin) installed"
    else
        print_warn "arm64 target not installed"
        print_fix "Run: rustup target add aarch64-apple-darwin"
    fi
else
    print_fail "Rust not found"
    print_fix "Install Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

print_test "Python"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_pass "Python installed: $PYTHON_VERSION"

    # Check Python version
    PY_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
    if [ "$(echo "$PY_VERSION >= 3.8" | bc)" -eq 1 ] 2>/dev/null || python3 -c "import sys; sys.exit(0 if sys.version_info >= (3,8) else 1)"; then
        print_pass "Python version >= 3.8"
    else
        print_fail "Python version < 3.8 (found: $PY_VERSION)"
        print_fix "Install Python 3.8+: brew install python@3.10"
    fi

    # Check pip
    if command -v pip3 &> /dev/null; then
        PIP_VERSION=$(pip3 --version)
        print_pass "pip installed: $PIP_VERSION"
    else
        print_warn "pip3 not found"
        print_fix "Install pip: python3 -m ensurepip --upgrade"
    fi
else
    print_fail "Python3 not found"
    print_fix "Install Python: brew install python@3.10"
    exit 1
fi

print_test "Maturin (Python-Rust bridge)"
if command -v maturin &> /dev/null; then
    MATURIN_VERSION=$(maturin --version)
    print_pass "Maturin installed: $MATURIN_VERSION"
elif pip3 show maturin &> /dev/null; then
    print_pass "Maturin installed via pip"
else
    print_warn "Maturin not found"
    print_fix "Install: pip3 install maturin"
fi

print_test "Node.js & npm (for demo)"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    print_pass "Node.js installed: $NODE_VERSION"
    print_info "npm: $NPM_VERSION"
else
    print_warn "Node.js not found (needed for demo)"
    print_fix "Install: brew install node"
fi

# ============================================================================
# SECTION 3: RUST BUILD TEST
# ============================================================================
print_header "3. RUST BUILD TEST"

print_test "Build Rust CLI"
if cd src/rust && cargo build --release --target aarch64-apple-darwin 2>&1 | tee "$TEST_DIR/rust_build.log"; then
    print_pass "Rust CLI built successfully"
    CLI_PATH="$PROJECT_ROOT/src/rust/target/aarch64-apple-darwin/release/zipminator"

    if [ -f "$CLI_PATH" ]; then
        print_pass "CLI binary exists: $CLI_PATH"

        # Check binary architecture
        BINARY_ARCH=$(file "$CLI_PATH" | grep -o "arm64\|x86_64")
        if [ "$BINARY_ARCH" == "arm64" ]; then
            print_pass "Binary is arm64 native"
        else
            print_warn "Binary is not arm64: $BINARY_ARCH"
        fi

        # Test CLI execution
        print_test "CLI Execution Test"
        if "$CLI_PATH" --version &> /dev/null; then
            CLI_VERSION=$("$CLI_PATH" --version)
            print_pass "CLI executes: $CLI_VERSION"
        else
            print_fail "CLI does not execute"
            print_fix "Check build logs in: $TEST_DIR/rust_build.log"
        fi
    else
        print_fail "CLI binary not found at expected path"
    fi

    cd "$PROJECT_ROOT"
else
    print_fail "Rust build failed"
    print_fix "Check build logs in: $TEST_DIR/rust_build.log"
    cd "$PROJECT_ROOT"
fi

print_test "Run Rust Tests"
if cd src/rust && cargo test --target aarch64-apple-darwin 2>&1 | tee "$TEST_DIR/rust_test.log"; then
    print_pass "Rust tests passed"
    cd "$PROJECT_ROOT"
else
    print_fail "Rust tests failed"
    print_fix "Check test logs in: $TEST_DIR/rust_test.log"
    cd "$PROJECT_ROOT"
fi

# ============================================================================
# SECTION 4: PYTHON WHEEL BUILD
# ============================================================================
print_header "4. PYTHON WHEEL BUILD"

print_test "Build Python Wheel with Maturin"
if command -v maturin &> /dev/null || pip3 show maturin &> /dev/null; then
    cd "$PROJECT_ROOT"

    # Use maturin from pip if not in PATH
    MATURIN_CMD="maturin"
    if ! command -v maturin &> /dev/null; then
        MATURIN_CMD="python3 -m maturin"
    fi

    if $MATURIN_CMD build --release --target aarch64-apple-darwin 2>&1 | tee "$TEST_DIR/wheel_build.log"; then
        print_pass "Python wheel built successfully"

        # Find the wheel file
        WHEEL_FILE=$(find target/wheels -name "*.whl" -type f | head -1)
        if [ -n "$WHEEL_FILE" ]; then
            print_pass "Wheel file created: $(basename "$WHEEL_FILE")"

            # Check wheel architecture
            if echo "$WHEEL_FILE" | grep -q "arm64\|aarch64"; then
                print_pass "Wheel is arm64 native"
            else
                print_warn "Wheel may not be arm64 optimized"
            fi

            # Test wheel installation
            print_test "Test Wheel Installation"
            VENV_DIR="$TEST_DIR/venv"
            python3 -m venv "$VENV_DIR"
            source "$VENV_DIR/bin/activate"

            if pip install "$WHEEL_FILE" &> "$TEST_DIR/wheel_install.log"; then
                print_pass "Wheel installed successfully"

                # Test import
                print_test "Test Python Import"
                if python3 -c "import zipminator; print(zipminator.__version__)" &> "$TEST_DIR/import_test.log"; then
                    VERSION=$(python3 -c "import zipminator; print(zipminator.__version__)")
                    print_pass "Python module imports: version $VERSION"
                else
                    print_fail "Python module import failed"
                    print_fix "Check logs in: $TEST_DIR/import_test.log"
                fi
            else
                print_fail "Wheel installation failed"
                print_fix "Check logs in: $TEST_DIR/wheel_install.log"
            fi

            deactivate
        else
            print_fail "No wheel file found"
            print_fix "Check build logs in: $TEST_DIR/wheel_build.log"
        fi
    else
        print_fail "Wheel build failed"
        print_fix "Check build logs in: $TEST_DIR/wheel_build.log"
    fi
else
    print_warn "Maturin not installed, skipping wheel build"
    print_fix "Install: pip3 install maturin"
fi

# ============================================================================
# SECTION 5: FUNCTIONALITY TESTS
# ============================================================================
print_header "5. FUNCTIONALITY TESTS"

if [ -f "$CLI_PATH" ]; then
    print_test "Kyber768 Key Generation"
    if "$CLI_PATH" keygen --public-key "$TEST_DIR/public.key" --secret-key "$TEST_DIR/secret.key" &> "$TEST_DIR/keygen.log"; then
        print_pass "Keypair generated successfully"

        if [ -f "$TEST_DIR/public.key" ] && [ -f "$TEST_DIR/secret.key" ]; then
            PUB_SIZE=$(wc -c < "$TEST_DIR/public.key" | tr -d ' ')
            SEC_SIZE=$(wc -c < "$TEST_DIR/secret.key" | tr -d ' ')
            print_info "Public key size: $PUB_SIZE bytes"
            print_info "Secret key size: $SEC_SIZE bytes"

            # Kyber768 expected sizes
            if [ "$PUB_SIZE" -eq 1184 ]; then
                print_pass "Public key size correct (1184 bytes)"
            else
                print_warn "Public key size unexpected (expected 1184, got $PUB_SIZE)"
            fi

            if [ "$SEC_SIZE" -eq 2400 ]; then
                print_pass "Secret key size correct (2400 bytes)"
            else
                print_warn "Secret key size unexpected (expected 2400, got $SEC_SIZE)"
            fi
        else
            print_fail "Key files not created"
        fi
    else
        print_fail "Key generation failed"
        print_fix "Check logs in: $TEST_DIR/keygen.log"
    fi

    print_test "Encrypt/Decrypt Test"
    # Create test file
    echo "This is a test message for Zipminator M1 verification." > "$TEST_DIR/test.txt"

    if "$CLI_PATH" encrypt --public-key "$TEST_DIR/public.key" --input "$TEST_DIR/test.txt" --output "$TEST_DIR/test.enc" &> "$TEST_DIR/encrypt.log"; then
        print_pass "File encrypted successfully"

        if [ -f "$TEST_DIR/test.enc" ]; then
            ENC_SIZE=$(wc -c < "$TEST_DIR/test.enc" | tr -d ' ')
            print_info "Encrypted file size: $ENC_SIZE bytes"

            # Decrypt
            if "$CLI_PATH" decrypt --secret-key "$TEST_DIR/secret.key" --input "$TEST_DIR/test.enc" --output "$TEST_DIR/test.dec" &> "$TEST_DIR/decrypt.log"; then
                print_pass "File decrypted successfully"

                # Verify content
                if diff "$TEST_DIR/test.txt" "$TEST_DIR/test.dec" &> /dev/null; then
                    print_pass "Decrypted content matches original"
                else
                    print_fail "Decrypted content does not match original"
                fi
            else
                print_fail "Decryption failed"
                print_fix "Check logs in: $TEST_DIR/decrypt.log"
            fi
        else
            print_fail "Encrypted file not created"
        fi
    else
        print_fail "Encryption failed"
        print_fix "Check logs in: $TEST_DIR/encrypt.log"
    fi
else
    print_warn "CLI not available, skipping functionality tests"
fi

# ============================================================================
# SECTION 6: PII SCANNER TEST
# ============================================================================
print_header "6. PII SCANNER TEST"

if [ -f "$CLI_PATH" ]; then
    print_test "PII Scanner Detection"

    # Create test file with PII
    cat > "$TEST_DIR/pii_test.txt" << 'EOF'
John Doe's email is john.doe@example.com
His SSN is 123-45-6789
Credit card: 4532-1234-5678-9010
Phone: (555) 123-4567
EOF

    if "$CLI_PATH" scan-pii --input "$TEST_DIR/pii_test.txt" &> "$TEST_DIR/pii_scan.log"; then
        SCAN_OUTPUT=$(cat "$TEST_DIR/pii_scan.log")

        # Check if PII was detected
        if echo "$SCAN_OUTPUT" | grep -q -i "email\|ssn\|credit\|phone"; then
            print_pass "PII scanner detected sensitive data"

            # Count detections
            EMAIL_COUNT=$(echo "$SCAN_OUTPUT" | grep -c -i "email" || true)
            SSN_COUNT=$(echo "$SCAN_OUTPUT" | grep -c -i "ssn" || true)
            CARD_COUNT=$(echo "$SCAN_OUTPUT" | grep -c -i "credit\|card" || true)
            PHONE_COUNT=$(echo "$SCAN_OUTPUT" | grep -c -i "phone" || true)

            print_info "Detections - Email: $EMAIL_COUNT, SSN: $SSN_COUNT, Card: $CARD_COUNT, Phone: $PHONE_COUNT"
        else
            print_warn "PII scanner may not be detecting all patterns"
        fi
    else
        print_fail "PII scanner failed to run"
        print_fix "Check logs in: $TEST_DIR/pii_scan.log"
    fi
else
    print_warn "CLI not available, skipping PII scanner test"
fi

# ============================================================================
# SECTION 7: DEMO TEST
# ============================================================================
print_header "7. DEMO TEST"

if [ -d "$PROJECT_ROOT/demo" ]; then
    print_test "Demo Dependencies"

    if [ -f "$PROJECT_ROOT/demo/package.json" ]; then
        cd "$PROJECT_ROOT/demo"

        if command -v npm &> /dev/null; then
            # Check if node_modules exists
            if [ ! -d "node_modules" ]; then
                print_info "Installing demo dependencies..."
                if npm install &> "$TEST_DIR/npm_install.log"; then
                    print_pass "Demo dependencies installed"
                else
                    print_fail "npm install failed"
                    print_fix "Check logs in: $TEST_DIR/npm_install.log"
                fi
            else
                print_pass "Demo dependencies already installed"
            fi

            # Check Python backend dependencies
            if [ -f "backend/requirements.txt" ]; then
                print_test "Demo Backend Dependencies"
                DEMO_VENV="$TEST_DIR/demo_venv"
                python3 -m venv "$DEMO_VENV"
                source "$DEMO_VENV/bin/activate"

                if pip install -r backend/requirements.txt &> "$TEST_DIR/demo_backend_install.log"; then
                    print_pass "Backend dependencies installed"
                else
                    print_warn "Backend dependencies installation had issues"
                    print_fix "Check logs in: $TEST_DIR/demo_backend_install.log"
                fi

                deactivate
            fi
        else
            print_warn "npm not found, cannot install demo dependencies"
            print_fix "Install Node.js: brew install node"
        fi

        cd "$PROJECT_ROOT"
    else
        print_warn "Demo package.json not found"
    fi
else
    print_warn "Demo directory not found"
fi

# ============================================================================
# SECTION 8: BENCHMARK TEST (Optional)
# ============================================================================
print_header "8. PERFORMANCE BENCHMARK"

if [ -f "$CLI_PATH" ]; then
    print_test "Kyber768 Performance Benchmark"

    # Run a simple benchmark
    BENCH_ITERATIONS=10
    print_info "Running $BENCH_ITERATIONS key generation iterations..."

    START_TIME=$(date +%s%N)
    for i in $(seq 1 $BENCH_ITERATIONS); do
        "$CLI_PATH" keygen --public-key "$TEST_DIR/bench_pub_$i.key" --secret-key "$TEST_DIR/bench_sec_$i.key" &> /dev/null
    done
    END_TIME=$(date +%s%N)

    ELAPSED_NS=$((END_TIME - START_TIME))
    ELAPSED_MS=$((ELAPSED_NS / 1000000))
    AVG_MS=$((ELAPSED_MS / BENCH_ITERATIONS))

    print_pass "Benchmark completed: ${BENCH_ITERATIONS} iterations in ${ELAPSED_MS}ms"
    print_info "Average time per keygen: ${AVG_MS}ms"

    if [ $AVG_MS -lt 100 ]; then
        print_pass "Performance: Excellent (< 100ms per operation)"
    elif [ $AVG_MS -lt 500 ]; then
        print_pass "Performance: Good (< 500ms per operation)"
    else
        print_warn "Performance: Consider optimization (> 500ms per operation)"
    fi
else
    print_warn "CLI not available, skipping benchmark"
fi

# ============================================================================
# FINAL REPORT
# ============================================================================
print_header "TEST SUMMARY"

echo ""
echo -e "${BOLD}Total Tests:${NC} $TOTAL_TESTS"
echo -e "${GREEN}${BOLD}Passed:${NC} $PASSED_TESTS"
echo -e "${RED}${BOLD}Failed:${NC} $FAILED_TESTS"
echo -e "${YELLOW}${BOLD}Warnings:${NC} $WARNINGS"
echo ""

# Calculate success rate
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
    echo -e "${BOLD}Success Rate:${NC} ${SUCCESS_RATE}%"
    echo ""
fi

# Overall status
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✅ ALL TESTS PASSED!${NC}"
    echo ""
    echo -e "${GREEN}Your Zipminator installation is ready for M1 Mac!${NC}"
    echo ""
    echo -e "${BOLD}Next Steps:${NC}"
    echo "  1. Run the CLI: ./src/rust/target/aarch64-apple-darwin/release/zipminator --help"
    echo "  2. Try the demo: cd demo && npm start"
    echo "  3. Read the docs: docs/QUICK_START_CI_CD.md"
elif [ $FAILED_TESTS -le 2 ] && [ $WARNINGS -le 3 ]; then
    echo -e "${YELLOW}${BOLD}⚠️  MOSTLY WORKING${NC}"
    echo ""
    echo -e "${YELLOW}Some tests failed, but core functionality appears intact.${NC}"
    echo -e "Review the failures above and apply suggested fixes."
else
    echo -e "${RED}${BOLD}❌ INSTALLATION ISSUES DETECTED${NC}"
    echo ""
    echo -e "${RED}Multiple tests failed. Please review the output above.${NC}"
    echo ""
    echo -e "${BOLD}Common Issues:${NC}"
    echo "  • Rust not installed: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    echo "  • Python < 3.8: brew install python@3.10"
    echo "  • Maturin missing: pip3 install maturin"
    echo "  • Build failures: Check logs in $TEST_DIR/"
fi

echo ""
echo -e "${BLUE}Test logs saved in:${NC} $TEST_DIR"
echo -e "${BLUE}Keep logs with:${NC} cp -r $TEST_DIR ~/zipminator-test-logs"
echo ""

# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
    exit 0
else
    exit 1
fi
