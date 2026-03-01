#!/usr/bin/env bash
# ============================================================================
#  Zipminator -- Post-Quantum Cryptography Platform
#  Installation Script for Evaluation and Demonstration
#
#  Target: Norwegian Government / Digitaliseringsdirektoratet
#  Standard: NIST FIPS 203 (ML-KEM / CRYSTALS-Kyber-768)
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()    { echo -e "${GREEN}[OK]${NC} $1"; }
warn()   { echo -e "${YELLOW}[!]${NC} $1"; }
fail()   { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }
header() { echo -e "\n${CYAN}${BOLD}=== $1 ===${NC}\n"; }

echo ""
echo -e "${BOLD}================================================================${NC}"
echo -e "${BOLD}  Zipminator Post-Quantum Cryptography Platform${NC}"
echo -e "${BOLD}  Installation for Government Evaluation${NC}"
echo -e "${BOLD}================================================================${NC}"
echo ""
echo "  Algorithm  : CRYSTALS-Kyber-768 (ML-KEM)"
echo "  Standard   : NIST FIPS 203"
echo "  Security   : Level 3 (AES-192 equivalent)"
echo "  Language   : Rust core + Python SDK"
echo ""

# -------------------------------------------------------------------
# Step 1: Check prerequisites
# -------------------------------------------------------------------
header "Step 1/5: Checking Prerequisites"

# Check Rust
if command -v cargo &>/dev/null; then
    RUST_VER=$(rustc --version | cut -d' ' -f2)
    log "Rust toolchain: $RUST_VER"
else
    fail "Rust not found. Install from https://rustup.rs/"
fi

# Check Python
if command -v python3 &>/dev/null; then
    PY_VER=$(python3 --version | cut -d' ' -f2)
    log "Python: $PY_VER"
else
    fail "Python 3 not found. Install from https://www.python.org/"
fi

# Check pip
if python3 -m pip --version &>/dev/null 2>&1; then
    log "pip available"
else
    warn "pip not found. Will attempt to install."
fi

# -------------------------------------------------------------------
# Step 2: Create virtual environment
# -------------------------------------------------------------------
header "Step 2/5: Setting Up Python Environment"

# Look for existing venv (parent project or local)
if [ -d "$PROJECT_ROOT/.venv" ]; then
    VENV_DIR="$PROJECT_ROOT/.venv"
elif [ -d "$PROJECT_ROOT/../.venv" ]; then
    VENV_DIR="$(cd "$PROJECT_ROOT/../.venv" && pwd)"
else
    VENV_DIR="$PROJECT_ROOT/.venv"
fi

if [ ! -d "$VENV_DIR" ]; then
    echo "  Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
    log "Virtual environment created at $VENV_DIR"
else
    log "Virtual environment exists at $VENV_DIR"
fi

# Activate
source "$VENV_DIR/bin/activate"
log "Activated virtual environment"

# -------------------------------------------------------------------
# Step 3: Build Rust crypto core
# -------------------------------------------------------------------
header "Step 3/5: Building Rust Cryptographic Core"

cd "$PROJECT_ROOT"

echo "  Compiling CRYSTALS-Kyber-768 implementation..."
cargo build --release --workspace 2>&1 | tail -3
log "Rust workspace built (release mode)"

echo "  Running cryptographic test suite..."
TEST_OUTPUT=$(cargo test --workspace 2>&1)
PASS_COUNT=$(echo "$TEST_OUTPUT" | grep -oE '[0-9]+ passed' | head -1 || echo "0 passed")
FAIL_COUNT=$(echo "$TEST_OUTPUT" | grep -oE '[0-9]+ failed' | head -1 || echo "0 failed")

if echo "$TEST_OUTPUT" | grep -q "test result: ok"; then
    log "All Rust tests passed ($PASS_COUNT)"
else
    fail "Rust tests failed: $FAIL_COUNT"
fi

# -------------------------------------------------------------------
# Step 4: Build Python bindings
# -------------------------------------------------------------------
header "Step 4/5: Building Python Bindings (PyO3/Maturin)"

pip install --quiet maturin 2>&1 | tail -1
log "Maturin installed"

echo "  Compiling Rust -> Python bindings..."
maturin develop --features pyo3 2>&1 | tail -3
log "Python bindings compiled and installed"

# Verify bindings work
python3 -c "
from zipminator._core import keypair, encapsulate, decapsulate
pk, sk = keypair()
ct, ss1 = encapsulate(pk)
ss2 = decapsulate(ct, sk)
assert ss1 == ss2, 'Crypto verification failed!'
print('  Kyber768 round-trip verification: PASSED')
" || fail "Python binding verification failed"
log "Python bindings verified"

# -------------------------------------------------------------------
# Step 5: Generate quantum entropy seed
# -------------------------------------------------------------------
header "Step 5/5: Generating Entropy Seed"

ENTROPY_DIR="$PROJECT_ROOT/quantum_entropy"
ENTROPY_FILE="$ENTROPY_DIR/quantum_entropy_pool.bin"
mkdir -p "$ENTROPY_DIR"

if [ ! -f "$ENTROPY_FILE" ] || [ ! -s "$ENTROPY_FILE" ]; then
    # Generate 4096-byte bootstrap seed from /dev/urandom
    # In production, run scripts/qrng_harvester.py to append real quantum entropy
    dd if=/dev/urandom of="$ENTROPY_FILE" bs=4096 count=1 2>/dev/null
    log "Generated 4096-byte bootstrap entropy seed (system CSPRNG)"
    warn "Run 'python scripts/qrng_harvester.py' to harvest real quantum entropy"
else
    FSIZE=$(stat -f%z "$ENTROPY_FILE" 2>/dev/null || stat -c%s "$ENTROPY_FILE" 2>/dev/null)
    log "Entropy pool exists ($FSIZE bytes)"
fi

# -------------------------------------------------------------------
# Summary
# -------------------------------------------------------------------
echo ""
echo -e "${BOLD}================================================================${NC}"
echo -e "${GREEN}${BOLD}  Installation Complete${NC}"
echo -e "${BOLD}================================================================${NC}"
echo ""
echo "  To run the interactive demo:"
echo ""
echo -e "    ${CYAN}cd $(basename "$PROJECT_ROOT")/demo/gov-demo${NC}"
echo -e "    ${CYAN}./run_demo.sh${NC}"
echo ""
echo "  To run the Python tutorial:"
echo ""
echo -e "    ${CYAN}source $VENV_DIR/bin/activate${NC}"
echo -e "    ${CYAN}python3 demo/gov-demo/tutorial.py${NC}"
echo ""
echo "  To start the web demo (optional):"
echo ""
echo -e "    ${CYAN}cd demo && ./run.sh${NC}"
echo ""
