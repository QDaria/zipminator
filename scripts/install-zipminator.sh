#!/bin/bash
#
# Zipminator-PQC Universal Installer (macOS + Linux)
#
# The world's first PQC super-app installer.
# Installs micromamba, creates zip-pqc environment, and installs Zipminator
# with optional data science stack and Rust native bindings.
#
# Author:  Zipminator Team (mo@qdaria.com)
# Repo:    https://github.com/QDaria/zipminator
# Version: v1.0.0
# Date:    March 2026
#
# Usage:
#   ./scripts/install-zipminator.sh
#   ./scripts/install-zipminator.sh --dry-run
#   ./scripts/install-zipminator.sh --no-datascience
#   curl -sSL https://raw.githubusercontent.com/QDaria/zipminator/main/scripts/install-zipminator.sh | bash
#

set -euo pipefail

# ──────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────

VERSION="1.0.0"
ENV_NAME="zip-pqc"
PYTHON_VERSION="3.12"
MIN_PYTHON_MAJOR=3
MIN_PYTHON_MINOR=9

DRY_RUN=false
INSTALL_DATASCIENCE=true

# ──────────────────────────────────────────────────────────────
# Colors
# ──────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

# ──────────────────────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────────────────────

log_step() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} ${CYAN}>${NC} $1"
}

log_success() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} ${GREEN}ok${NC} $1"
}

log_warning() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} ${YELLOW}!!${NC} $1"
}

log_error() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} ${RED}ERR${NC} $1"
}

log_dry() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} ${MAGENTA}DRY${NC} $1"
}

run_cmd() {
    if [ "$DRY_RUN" = true ]; then
        log_dry "Would run: $*"
    else
        "$@"
    fi
}

# ──────────────────────────────────────────────────────────────
# Parse arguments
# ──────────────────────────────────────────────────────────────

show_help() {
    cat << HELPEOF
Zipminator-PQC Universal Installer v${VERSION}

Usage: $0 [OPTIONS]

Options:
  --help            Show this help message and exit
  --dry-run         Print what would be done without executing
  --no-datascience  Skip the optional data science stack (numpy, pandas, etc.)

Examples:
  $0                        Full install with data science
  $0 --no-datascience       Install without data science stack
  $0 --dry-run              Preview all steps without changes

Documentation:  https://github.com/QDaria/zipminator
Support:        mo@qdaria.com
HELPEOF
    exit 0
}

for arg in "$@"; do
    case "$arg" in
        --help|-h)
            show_help
            ;;
        --dry-run)
            DRY_RUN=true
            ;;
        --no-datascience)
            INSTALL_DATASCIENCE=false
            ;;
        *)
            log_error "Unknown option: $arg"
            echo "Run $0 --help for usage information."
            exit 1
            ;;
    esac
done

# ──────────────────────────────────────────────────────────────
# Banner
# ──────────────────────────────────────────────────────────────

echo -e "${CYAN}"
cat << "BANNER"
 _____ _             _             _
|__  /(_)_ __  _ __ (_)_ __   __ _| |_ ___  _ __
  / / | | '_ \| '_ \| | '_ \ / _` | __/ _ \| '__|
 / /_ | | |_) | | | | | | | | (_| | || (_) | |
/____|_| .__/|_| |_|_|_| |_|\__,_|\__\___/|_|
       |_|
BANNER
echo -e "${NC}"
echo -e "${BOLD}  Universal Installer v${VERSION} -- Post-Quantum Cryptography${NC}"
echo -e "  ${CYAN}https://github.com/QDaria/zipminator${NC}"
echo ""

if [ "$DRY_RUN" = true ]; then
    echo -e "  ${MAGENTA}${BOLD}DRY RUN MODE -- no changes will be made${NC}"
    echo ""
fi

# ──────────────────────────────────────────────────────────────
# Step 1: Detect platform
# ──────────────────────────────────────────────────────────────

log_step "Detecting platform..."

OS_NAME="$(uname -s)"
ARCH="$(uname -m)"

case "$OS_NAME" in
    Darwin)
        PLATFORM="macos"
        PKG_MANAGER="brew"
        if ! command -v brew &> /dev/null; then
            PKG_MANAGER="none"
        fi
        ;;
    Linux)
        PLATFORM="linux"
        if command -v apt-get &> /dev/null; then
            PKG_MANAGER="apt"
        elif command -v dnf &> /dev/null; then
            PKG_MANAGER="dnf"
        elif command -v pacman &> /dev/null; then
            PKG_MANAGER="pacman"
        elif command -v zypper &> /dev/null; then
            PKG_MANAGER="zypper"
        else
            PKG_MANAGER="none"
        fi
        ;;
    *)
        log_error "Unsupported OS: $OS_NAME"
        log_error "This installer supports macOS and Linux. For Windows, use install-zipminator.ps1."
        exit 1
        ;;
esac

# Normalize architecture names
case "$ARCH" in
    x86_64|amd64)  ARCH_NORM="x86_64" ;;
    arm64|aarch64)  ARCH_NORM="aarch64" ;;
    *)
        log_error "Unsupported architecture: $ARCH"
        exit 1
        ;;
esac

log_success "Platform: ${PLATFORM} / ${ARCH_NORM} (package manager: ${PKG_MANAGER})"

# ──────────────────────────────────────────────────────────────
# Step 2: Check for Python 3.9+
# ──────────────────────────────────────────────────────────────

log_step "Checking for Python ${MIN_PYTHON_MAJOR}.${MIN_PYTHON_MINOR}+..."

SYSTEM_PYTHON=""
for candidate in python3 python python3.12 python3.11 python3.10 python3.9; do
    if command -v "$candidate" &> /dev/null; then
        PY_VER=$("$candidate" --version 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        PY_MAJOR=$(echo "$PY_VER" | cut -d. -f1)
        PY_MINOR=$(echo "$PY_VER" | cut -d. -f2)
        if [ "$PY_MAJOR" -ge "$MIN_PYTHON_MAJOR" ] && [ "$PY_MINOR" -ge "$MIN_PYTHON_MINOR" ]; then
            SYSTEM_PYTHON="$candidate"
            break
        fi
    fi
done

if [ -n "$SYSTEM_PYTHON" ]; then
    log_success "Found $SYSTEM_PYTHON ($PY_VER)"
else
    log_warning "Python ${MIN_PYTHON_MAJOR}.${MIN_PYTHON_MINOR}+ not found on system PATH."
    case "$PKG_MANAGER" in
        brew)   log_warning "Install with: brew install python@3.12" ;;
        apt)    log_warning "Install with: sudo apt-get install python3.12 python3.12-venv" ;;
        dnf)    log_warning "Install with: sudo dnf install python3.12" ;;
        pacman) log_warning "Install with: sudo pacman -S python" ;;
        *)      log_warning "Please install Python 3.9+ from https://python.org" ;;
    esac
    log_warning "Micromamba will provide its own Python, so installation can continue."
fi

# ──────────────────────────────────────────────────────────────
# Step 3: Check for / install micromamba
# ──────────────────────────────────────────────────────────────

log_step "Checking for micromamba..."

MAMBA_CMD=""
if command -v micromamba &> /dev/null; then
    MAMBA_CMD="micromamba"
    MAMBA_VER=$($MAMBA_CMD --version 2>/dev/null || echo "unknown")
    log_success "micromamba $MAMBA_VER already installed"
elif [ -f "$HOME/.local/bin/micromamba" ]; then
    MAMBA_CMD="$HOME/.local/bin/micromamba"
    log_success "micromamba found at $MAMBA_CMD"
else
    log_step "Installing micromamba..."
    if [ "$DRY_RUN" = true ]; then
        log_dry "Would install micromamba from https://micro.mamba.pm/install.sh"
        MAMBA_CMD="micromamba"
    else
        # Install micromamba using the official installer
        "${SHELL}" <(curl -L micro.mamba.pm/install.sh) <<< $'y\n\n'

        # Try to find the installed binary
        if command -v micromamba &> /dev/null; then
            MAMBA_CMD="micromamba"
        elif [ -f "$HOME/.local/bin/micromamba" ]; then
            MAMBA_CMD="$HOME/.local/bin/micromamba"
            export PATH="$HOME/.local/bin:$PATH"
        elif [ -f "$HOME/bin/micromamba" ]; then
            MAMBA_CMD="$HOME/bin/micromamba"
            export PATH="$HOME/bin:$PATH"
        else
            log_error "micromamba installation completed but binary not found."
            log_error "Please restart your shell and run this installer again."
            exit 1
        fi
        log_success "micromamba installed at $($MAMBA_CMD --version 2>/dev/null || echo "$MAMBA_CMD")"
    fi
fi

# ──────────────────────────────────────────────────────────────
# Step 4: Create zip-pqc environment
# ──────────────────────────────────────────────────────────────

log_step "Setting up '${ENV_NAME}' environment with Python ${PYTHON_VERSION}..."

ENV_EXISTS=false
if $MAMBA_CMD env list 2>/dev/null | grep -q "$ENV_NAME"; then
    ENV_EXISTS=true
fi

if [ "$ENV_EXISTS" = true ]; then
    log_warning "Environment '${ENV_NAME}' already exists."
    if [ "$DRY_RUN" = false ]; then
        echo -en "  ${YELLOW}Recreate it? [y/N]:${NC} "
        read -r RECREATE
        if [[ "$RECREATE" =~ ^[Yy]$ ]]; then
            log_step "Removing existing environment..."
            $MAMBA_CMD env remove -n "$ENV_NAME" -y
        else
            log_success "Keeping existing environment."
        fi
    else
        log_dry "Would ask whether to recreate existing environment."
    fi
fi

if [ "$ENV_EXISTS" = false ] || [[ "${RECREATE:-N}" =~ ^[Yy]$ ]]; then
    run_cmd $MAMBA_CMD create -n "$ENV_NAME" "python=${PYTHON_VERSION}" -c conda-forge -y
    log_success "Environment '${ENV_NAME}' created with Python ${PYTHON_VERSION}"
fi

# ──────────────────────────────────────────────────────────────
# Step 5: Install uv
# ──────────────────────────────────────────────────────────────

log_step "Installing uv (fast pip replacement)..."
run_cmd $MAMBA_CMD run -n "$ENV_NAME" pip install uv
log_success "uv installed"

# ──────────────────────────────────────────────────────────────
# Step 6: Install zipminator
# ──────────────────────────────────────────────────────────────

log_step "Installing zipminator[all]..."
run_cmd $MAMBA_CMD run -n "$ENV_NAME" uv pip install "zipminator[all]"
log_success "zipminator installed"

# ──────────────────────────────────────────────────────────────
# Step 7: Offer Rust native bindings (if Rust toolchain present)
# ──────────────────────────────────────────────────────────────

if command -v rustc &> /dev/null; then
    RUST_VER=$(rustc --version | cut -d' ' -f2)
    log_success "Rust toolchain detected ($RUST_VER)"

    BUILD_NATIVE=false
    if [ "$DRY_RUN" = false ]; then
        echo -en "  ${YELLOW}Build native Rust bindings with maturin? (faster crypto) [y/N]:${NC} "
        read -r BUILD_NATIVE_INPUT
        if [[ "$BUILD_NATIVE_INPUT" =~ ^[Yy]$ ]]; then
            BUILD_NATIVE=true
        fi
    else
        log_dry "Would offer to build native Rust bindings via maturin."
    fi

    if [ "$BUILD_NATIVE" = true ]; then
        log_step "Installing maturin..."
        $MAMBA_CMD run -n "$ENV_NAME" uv pip install maturin

        log_step "Building Rust native bindings (this may take 2-5 minutes)..."
        if [ -f "pyproject.toml" ]; then
            $MAMBA_CMD run -n "$ENV_NAME" maturin develop --release --strip
            log_success "Native Rust bindings built and installed"
        elif [ -f "crates/zipminator-core/Cargo.toml" ]; then
            log_warning "Run 'maturin develop --release --strip' from the project root to build bindings."
        else
            log_warning "Could not locate pyproject.toml for maturin build. Skipping."
        fi
    fi
else
    log_warning "Rust toolchain not detected. Skipping native binding build."
    log_warning "Install Rust from https://rustup.rs for native PQC performance."
fi

# ──────────────────────────────────────────────────────────────
# Step 8: Optional data science stack
# ──────────────────────────────────────────────────────────────

if [ "$INSTALL_DATASCIENCE" = true ]; then
    log_step "Installing data science stack (numpy, pandas, scipy, scikit-learn, matplotlib, seaborn, jupyterlab)..."
    run_cmd $MAMBA_CMD install -n "$ENV_NAME" -c conda-forge \
        numpy pandas scipy scikit-learn matplotlib seaborn jupyterlab sqlite ipykernel -y
    log_success "Data science stack installed"

    # Step 9: Register JupyterLab kernel
    log_step "Registering JupyterLab kernel '${ENV_NAME}'..."
    run_cmd $MAMBA_CMD run -n "$ENV_NAME" python -m ipykernel install \
        --user --name "$ENV_NAME" --display-name "Zipminator PQC"
    log_success "Jupyter kernel 'Zipminator PQC' registered"
else
    log_warning "Skipping data science stack (--no-datascience)."
fi

# ──────────────────────────────────────────────────────────────
# Step 10: Verify installation
# ──────────────────────────────────────────────────────────────

log_step "Verifying installation..."

if [ "$DRY_RUN" = true ]; then
    log_dry "Would verify: from zipminator import keypair; keypair()"
else
    VERIFY_OUTPUT=$($MAMBA_CMD run -n "$ENV_NAME" python -c "
from zipminator import keypair
pk, sk = keypair()
pk_bytes = pk.to_bytes()
sk_bytes = sk.to_bytes()
print(f'Kyber768 keypair generated: PK={len(pk_bytes)}B, SK={len(sk_bytes)}B')
" 2>&1) || true

    if echo "$VERIFY_OUTPUT" | grep -q "Kyber768 keypair generated"; then
        log_success "$VERIFY_OUTPUT"
    else
        log_warning "Native Rust keypair not available (expected if installed from PyPI without maturin build)."
        log_warning "The pure-Python fallback will be used."
        # Try a simpler import check
        SIMPLE_CHECK=$($MAMBA_CMD run -n "$ENV_NAME" python -c "import zipminator; print(f'zipminator {zipminator.__version__}')" 2>&1) || true
        if [ -n "$SIMPLE_CHECK" ]; then
            log_success "Package importable: $SIMPLE_CHECK"
        else
            log_error "zipminator package could not be imported. Check installation logs above."
        fi
    fi
fi

# ──────────────────────────────────────────────────────────────
# Success banner
# ──────────────────────────────────────────────────────────────

echo ""
echo -e "${GREEN}${BOLD}"
cat << "DONE_BANNER"
  ____                        _
 |  _ \  ___  _ __   ___     | |
 | | | |/ _ \| '_ \ / _ \    | |
 | |_| | (_) | | | |  __/ _  |_|
 |____/ \___/|_| |_|\___| (_) (_)

DONE_BANNER
echo -e "${NC}"
echo -e "  ${GREEN}${BOLD}Installation complete!${NC}"
echo ""

echo -e "${CYAN}${BOLD}Next Steps:${NC}"
echo ""
echo -e "  ${YELLOW}1.${NC} Activate the environment:"
echo -e "     ${BLUE}micromamba activate ${ENV_NAME}${NC}"
echo ""
echo -e "  ${YELLOW}2.${NC} Verify the installation:"
echo -e "     ${BLUE}python -c \"from zipminator import keypair; print(keypair())\"${NC}"
echo ""
echo -e "  ${YELLOW}3.${NC} Generate a keypair via CLI:"
echo -e "     ${BLUE}zipminator keygen${NC}"
echo ""
echo -e "  ${YELLOW}4.${NC} Check quantum entropy:"
echo -e "     ${BLUE}zipminator entropy${NC}"
echo ""

if [ "$INSTALL_DATASCIENCE" = true ]; then
    echo -e "  ${YELLOW}5.${NC} Launch JupyterLab:"
    echo -e "     ${BLUE}jupyter lab${NC}"
    echo ""
fi

echo -e "${CYAN}Documentation:${NC}"
echo -e "  Repo:     ${BLUE}https://github.com/QDaria/zipminator${NC}"
echo -e "  Issues:   ${BLUE}https://github.com/QDaria/zipminator/issues${NC}"
echo -e "  Support:  ${BLUE}mo@qdaria.com${NC}"
echo ""

exit 0
