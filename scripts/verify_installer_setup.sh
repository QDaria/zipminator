#!/usr/bin/env bash
#
# Installer Setup Verification Script
# Checks that all required files and dependencies are present
#
# Usage: ./verify_installer_setup.sh

set -euo pipefail

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

pass_count=0
fail_count=0
warn_count=0

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((pass_count++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((fail_count++))
}

check_warn() {
    echo -e "${YELLOW}!${NC} $1"
    ((warn_count++))
}

echo -e "${BLUE}QDaria QRNG Installer Setup Verification${NC}"
echo "=========================================="
echo ""

# Check required scripts
echo -e "${BLUE}Checking required scripts...${NC}"

required_scripts=(
    "build_installers.sh"
    "macos_bundle.sh"
    "create_icons.sh"
    "postinstall.sh"
    "preuninstall.sh"
)

for script in "${required_scripts[@]}"; do
    if [[ -f "${SCRIPT_DIR}/${script}" ]]; then
        if [[ -x "${SCRIPT_DIR}/${script}" ]]; then
            check_pass "${script} (executable)"
        else
            check_warn "${script} exists but not executable (run: chmod +x scripts/${script})"
        fi
    else
        check_fail "${script} not found"
    fi
done

# Check configuration files
echo ""
echo -e "${BLUE}Checking configuration files...${NC}"

config_files=(
    "scripts/electron-builder.json"
    "scripts/linux-desktop.template"
    "scripts/windows-installer.nsh"
    "src/rust/Cargo-bundle.toml"
)

for file in "${config_files[@]}"; do
    if [[ -f "${PROJECT_ROOT}/${file}" ]]; then
        check_pass "${file}"
    else
        check_fail "${file} not found"
    fi
done

# Check documentation
echo ""
echo -e "${BLUE}Checking documentation...${NC}"

doc_files=(
    "scripts/BUILD_GUIDE.md"
    "scripts/README.md"
    "docs/INSTALLATION_GUIDE.md"
)

for file in "${doc_files[@]}"; do
    if [[ -f "${PROJECT_ROOT}/${file}" ]]; then
        check_pass "${file}"
    else
        check_fail "${file} not found"
    fi
done

# Check build dependencies
echo ""
echo -e "${BLUE}Checking build dependencies...${NC}"

# Rust
if command -v cargo >/dev/null 2>&1; then
    version=$(cargo --version)
    check_pass "Rust/Cargo: ${version}"
else
    check_fail "Rust/Cargo not found (install from https://rustup.rs/)"
fi

# cargo-bundle
if cargo bundle --version >/dev/null 2>&1; then
    check_pass "cargo-bundle installed"
else
    check_warn "cargo-bundle not found (run: cargo install cargo-bundle)"
fi

# Python
if command -v python3 >/dev/null 2>&1; then
    version=$(python3 --version)
    check_pass "Python: ${version}"
else
    check_fail "Python 3 not found (install from https://python.org/)"
fi

# PyInstaller
if python3 -c "import PyInstaller" 2>/dev/null; then
    check_pass "PyInstaller installed"
else
    check_warn "PyInstaller not found (run: pip3 install pyinstaller)"
fi

# Node.js
if command -v node >/dev/null 2>&1; then
    version=$(node --version)
    check_pass "Node.js: ${version}"
else
    check_fail "Node.js not found (install from https://nodejs.org/)"
fi

# Platform-specific tools
echo ""
echo -e "${BLUE}Checking platform-specific tools...${NC}"

case "$(uname -s)" in
    Darwin*)
        echo "Platform: macOS"

        if command -v xcode-select >/dev/null 2>&1; then
            if xcode-select -p >/dev/null 2>&1; then
                check_pass "Xcode Command Line Tools installed"
            else
                check_warn "Xcode Command Line Tools not installed (run: xcode-select --install)"
            fi
        fi

        if command -v create-dmg >/dev/null 2>&1; then
            check_pass "create-dmg installed"
        else
            check_warn "create-dmg not found (optional: npm install -g create-dmg)"
        fi

        if security find-identity -v -p codesigning 2>/dev/null | grep -q "Developer ID"; then
            check_pass "Code signing identity found"
        else
            check_warn "No code signing identity (optional for development)"
        fi
        ;;

    Linux*)
        echo "Platform: Linux"

        if command -v dpkg-deb >/dev/null 2>&1; then
            check_pass "dpkg-deb installed (for .deb packages)"
        else
            check_warn "dpkg-deb not found (install: sudo apt install dpkg-dev)"
        fi

        if command -v rpmbuild >/dev/null 2>&1; then
            check_pass "rpmbuild installed (for .rpm packages)"
        else
            check_warn "rpmbuild not found (install: sudo dnf install rpm-build)"
        fi

        if command -v appimagetool >/dev/null 2>&1; then
            check_pass "appimagetool installed"
        else
            check_warn "appimagetool not found (will auto-download if needed)"
        fi
        ;;

    MINGW*|MSYS*|CYGWIN*)
        echo "Platform: Windows"

        if command -v wix >/dev/null 2>&1; then
            check_pass "WiX Toolset installed"
        else
            check_warn "WiX not found (install from https://wixtoolset.org/)"
        fi

        if command -v makensis >/dev/null 2>&1; then
            check_pass "NSIS installed"
        else
            check_warn "NSIS not found (install from https://nsis.sourceforge.io/)"
        fi
        ;;
esac

# Check source files
echo ""
echo -e "${BLUE}Checking source files...${NC}"

if [[ -f "${PROJECT_ROOT}/src/rust/Cargo.toml" ]]; then
    check_pass "Rust source (src/rust/Cargo.toml)"
else
    check_fail "Rust source not found"
fi

if [[ -f "${PROJECT_ROOT}/requirements_ibm_harvester.txt" ]]; then
    check_pass "Python requirements (requirements_ibm_harvester.txt)"
else
    check_fail "Python requirements not found"
fi

if [[ -d "${PROJECT_ROOT}/zipminator" ]]; then
    check_pass "Zipminator directory exists"
else
    check_warn "Zipminator not found (check path)"
fi

# Summary
echo ""
echo "=========================================="
echo -e "${BLUE}Verification Summary${NC}"
echo "=========================================="
echo -e "${GREEN}Passed:  ${pass_count}${NC}"
echo -e "${YELLOW}Warnings: ${warn_count}${NC}"
echo -e "${RED}Failed:  ${fail_count}${NC}"
echo ""

if [[ $fail_count -eq 0 ]]; then
    echo -e "${GREEN}✓ Setup verification complete!${NC}"
    echo ""
    echo "Ready to build installers. Run:"
    echo "  cd scripts"
    echo "  ./build_installers.sh all"

    if [[ $warn_count -gt 0 ]]; then
        echo ""
        echo -e "${YELLOW}Note: Warnings indicate optional dependencies that may improve the build process.${NC}"
    fi
    exit 0
else
    echo -e "${RED}✗ Setup incomplete. Please address the failed checks above.${NC}"
    exit 1
fi
