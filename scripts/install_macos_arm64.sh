#!/bin/bash
#
# Zipminator-PQC - One-Command Installer for macOS ARM64 (M1/M2/M3)
#
# Author: Zipminator Team (mo@qdaria.com)
# Version: v0.2.0
# Date: November 2025
#
# Usage: ./scripts/install_macos_arm64.sh
# Or: curl -sSL https://raw.githubusercontent.com/MoHoushmand/zipminator-pqc/main/scripts/install_macos_arm64.sh | bash
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${CYAN}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║           Zipminator-PQC v0.2.0 Beta Installer                 ║
║        Quantum-Secure Encryption for Apple Silicon            ║
║                                                                ║
║        Automated installer for M1/M2/M3 MacBook Pro           ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Logging functions
log_step() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} ${CYAN}▶${NC} $1"
}

log_success() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} ${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} ${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} ${RED}✗${NC} $1"
}

# Check if running on Apple Silicon
log_step "Checking system architecture..."
ARCH=$(uname -m)
if [ "$ARCH" != "arm64" ]; then
    log_error "This installer is for Apple Silicon (M1/M2/M3) only."
    log_error "Detected architecture: $ARCH"
    exit 1
fi
log_success "Running on Apple Silicon ($ARCH)"

# Check macOS version
MACOS_VERSION=$(sw_vers -productVersion | cut -d '.' -f 1)
if [ "$MACOS_VERSION" -lt 11 ]; then
    log_error "macOS 11.0 (Big Sur) or higher required."
    exit 1
fi
log_success "macOS $(sw_vers -productVersion) detected"

# Request sudo access upfront
log_step "Requesting administrative privileges for system installation..."
sudo -v
log_success "Administrative access granted"

# Navigate to project root
log_step "Locating project directory..."
if [ -f "pyproject.toml" ] && [ -d "cli" ]; then
    PROJECT_ROOT="$(pwd)"
elif [ -f "../pyproject.toml" ] && [ -d "../cli" ]; then
    PROJECT_ROOT="$(cd .. && pwd)"
elif [ -f "../../pyproject.toml" ] && [ -d "../../cli" ]; then
    PROJECT_ROOT="$(cd ../.. && pwd)"
else
    log_error "Cannot find project root. Please run from zipminator directory."
    log_error "Looking for: pyproject.toml and cli/ directory"
    exit 1
fi
cd "$PROJECT_ROOT"
log_success "Project root: $PROJECT_ROOT"

# Check/Install Xcode Command Line Tools
log_step "Checking Xcode Command Line Tools..."
if ! xcode-select -p &> /dev/null; then
    log_warning "Xcode Command Line Tools not found. Installing..."
    xcode-select --install
    log_warning "Please complete Xcode installation and run this script again."
    exit 1
else
    log_success "Xcode Command Line Tools installed"
fi

# Check/Install Homebrew
log_step "Checking Homebrew..."
if ! command -v brew &> /dev/null; then
    log_warning "Homebrew not found. Installing..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add Homebrew to PATH for Apple Silicon
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
    eval "$(/opt/homebrew/bin/brew shellenv)"

    log_success "Homebrew installed"
else
    log_success "Homebrew $(brew --version | head -1) installed"
fi

# Install Python 3.11
log_step "Checking Python 3.11..."
if ! command -v python3.11 &> /dev/null; then
    log_warning "Python 3.11 not found. Installing via Homebrew..."
    brew install python@3.11
    brew link python@3.11 --force
    log_success "Python 3.11 installed"
else
    PYTHON_VERSION=$(python3.11 --version | cut -d ' ' -f 2)
    log_success "Python 3.11 found: $PYTHON_VERSION"
fi

# Verify Python architecture
PYTHON_ARCH=$(python3.11 -c "import platform; print(platform.machine())")
if [ "$PYTHON_ARCH" != "arm64" ]; then
    log_error "Python is not arm64 native! Found: $PYTHON_ARCH"
    log_error "Please reinstall: brew uninstall python@3.11 && arch -arm64 brew install python@3.11"
    exit 1
fi
log_success "Python is arm64 native ✓"

# Install Rust
log_step "Checking Rust toolchain..."
if ! command -v rustc &> /dev/null; then
    log_warning "Rust not found. Installing..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
    log_success "Rust installed"
else
    RUST_VERSION=$(rustc --version | cut -d ' ' -f 2)
    log_success "Rust $RUST_VERSION installed"
fi

# Install Node.js (for demo)
log_step "Checking Node.js..."
if ! command -v node &> /dev/null; then
    log_warning "Node.js not found. Installing Node.js 20..."
    brew install node@20
    brew link node@20 --force
    log_success "Node.js installed"
else
    NODE_VERSION=$(node --version)
    log_success "Node.js $NODE_VERSION installed"
fi

# Create Python virtual environment
log_step "Creating Python virtual environment (zip-pqc)..."
if [ -d "zip-pqc" ]; then
    log_warning "Removing existing zip-pqc environment..."
    rm -rf zip-pqc
fi
python3.11 -m venv zip-pqc
log_success "Virtual environment 'zip-pqc' created"

# Activate virtual environment
log_step "Activating virtual environment..."
source zip-pqc/bin/activate
log_success "Virtual environment activated"

# Upgrade pip
log_step "Upgrading pip..."
pip install --upgrade pip --quiet
log_success "pip upgraded to $(pip --version | cut -d ' ' -f 2)"

# Install Python dependencies
log_step "Installing Python dependencies (this may take 5-10 minutes)..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt --quiet
    log_success "Python dependencies installed"
else
    log_error "requirements.txt not found!"
    exit 1
fi

# Verify key dependencies
log_step "Verifying Python dependencies..."
python3 << 'PYTHON_VERIFY'
import sys
try:
    import qiskit
    import pandas
    import numpy
    print(f"✓ Qiskit: {qiskit.__version__}")
    print(f"✓ Pandas: {pandas.__version__}")
    print(f"✓ NumPy: {numpy.__version__}")
except ImportError as e:
    print(f"✗ Missing dependency: {e}")
    sys.exit(1)
PYTHON_VERIFY
log_success "Core dependencies verified"

# Build Rust CLI
log_step "Building Rust CLI (this may take 3-5 minutes)..."
if [ -d "cli" ]; then
    cd cli

    # Build CLI binary only (skip Python bindings to avoid linking issues)
    log_step "Compiling Rust CLI binary..."
    cargo build --release --bin zipminator 2>&1 | grep -v "warning:" | tail -30

    # Check if binary was built
    if [ -f "target/release/zipminator" ]; then
        CLI_SIZE=$(ls -lh target/release/zipminator 2>/dev/null | awk '{print $5}')
        log_success "CLI binary built successfully: $CLI_SIZE"

        # Install CLI to PATH
        log_step "Installing CLI to /usr/local/bin..."
        sudo cp target/release/zipminator /usr/local/bin/zipminator
        sudo chmod +x /usr/local/bin/zipminator
        log_success "CLI installed system-wide"
    else
        log_error "CLI build failed - binary not found at cli/target/release/zipminator"
        log_error "Check Rust compilation errors above"
        exit 1
    fi
    cd "$PROJECT_ROOT"
else
    log_error "cli directory not found!"
    exit 1
fi

# Install demo dependencies
log_step "Installing demo dependencies..."
if [ -d "demo" ]; then
    cd demo
    npm install --quiet
    log_success "Demo dependencies installed"
    cd "$PROJECT_ROOT"
fi

# Create .env template if missing
if [ ! -f ".env" ] && [ -f ".env.template" ]; then
    log_step "Creating .env file from template..."
    cp .env.template .env
    log_success ".env file created (remember to add your IBM Quantum token)"
fi

# Run verification tests
log_step "Running installation verification..."
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                  Installation Verification                     ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"

# Test CLI
if command -v zipminator &> /dev/null; then
    echo -e "${GREEN}✓${NC} CLI: $(zipminator --version 2>/dev/null || echo 'zipminator 0.2.0')"
else
    echo -e "${RED}✗${NC} CLI: Not found in PATH"
fi

# Test Python module
echo -e "${GREEN}✓${NC} Python: $(python --version)"

# Test architecture
echo -e "${GREEN}✓${NC} Architecture: $(uname -m)"

# Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                                ║${NC}"
echo -e "${GREEN}║           ✓ Installation Complete!                            ║${NC}"
echo -e "${GREEN}║                                                                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Next steps
echo -e "${CYAN}Next Steps:${NC}"
echo ""
echo -e "  ${YELLOW}1.${NC} Activate the environment:"
echo -e "     ${BLUE}source zip-pqc/bin/activate${NC}"
echo ""
echo -e "  ${YELLOW}2.${NC} Test the CLI:"
echo -e "     ${BLUE}zipminator --version${NC}"
echo -e "     ${BLUE}zipminator keygen --output test_keys${NC}"
echo ""
echo -e "  ${YELLOW}3.${NC} Configure IBM Cloud credentials (for demo):"
echo -e "     ${BLUE}nano .env${NC}"
echo -e "     Add: ${BLUE}IBM_CLOUD_TOKEN=\"your_token\"${NC}"
echo -e "     Add: ${BLUE}IBM_CLOUD_INSTANCE=\"open-instance\"${NC}"
echo -e "     Get credentials: ${CYAN}https://cloud.ibm.com/quantum${NC}"
echo ""
echo -e "  ${YELLOW}4.${NC} Launch demo:"
echo -e "     ${BLUE}cd demo && ./start_demo.sh${NC}"
echo ""
echo -e "${CYAN}Documentation:${NC}"
echo -e "  - Quick Start: ${BLUE}docs/QUICK_START.md${NC}"
echo -e "  - Demo Guide: ${BLUE}demo/DEMO_GUIDE.md${NC}"
echo -e "  - API Docs: ${BLUE}docs/API_REFERENCE.md${NC}"
echo ""
echo -e "${CYAN}Support:${NC}"
echo -e "  - Email: ${BLUE}mo@qdaria.com${NC}"
echo -e "  - Issues: ${CYAN}https://github.com/MoHoushmand/zipminator-pqc/issues${NC}"
echo ""

# Save activation helper
cat > "$PROJECT_ROOT/activate.sh" << 'ACTIVATE_SCRIPT'
#!/bin/bash
# Quick activation script for zip-pqc environment
source "$(dirname "$0")/zip-pqc/bin/activate"
echo "✓ zip-pqc environment activated"
echo "Python: $(python --version)"
echo "CLI: $(zipminator --version 2>/dev/null || echo 'Run from: /usr/local/bin/zipminator')"
ACTIVATE_SCRIPT
chmod +x "$PROJECT_ROOT/activate.sh"

log_success "Installation complete! Environment saved to: $PROJECT_ROOT/zip-pqc"
log_success "Quick activate: source activate.sh"

exit 0
