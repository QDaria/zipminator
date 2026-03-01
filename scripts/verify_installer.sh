#!/usr/bin/env bash
#
# Installer Verification Script for Zipminator-PQC
# Tests installer integrity, signatures, and installation
#
# Usage:
#   ./verify_installer.sh <installer-file>
#

set -euo pipefail

INSTALLER_FILE="${1:-}"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $*"
}

log_warn() {
    echo -e "${YELLOW}[⚠]${NC} $*"
}

log_error() {
    echo -e "${RED}[✗]${NC} $*"
}

log_test() {
    echo -e "${BLUE}[TEST]${NC} $*"
}

# Check if file exists
if [ -z "$INSTALLER_FILE" ] || [ ! -f "$INSTALLER_FILE" ]; then
    log_error "Usage: $0 <installer-file>"
    log_error "Example: $0 dist/Zipminator-PQC-0.1.0-macOS.pkg"
    exit 1
fi

# Detect installer type
detect_type() {
    case "$INSTALLER_FILE" in
        *.pkg)
            echo "macos-pkg"
            ;;
        *.dmg)
            echo "macos-dmg"
            ;;
        *.msi)
            echo "windows-msi"
            ;;
        *.exe)
            echo "windows-exe"
            ;;
        *.deb)
            echo "linux-deb"
            ;;
        *.rpm)
            echo "linux-rpm"
            ;;
        *.AppImage)
            echo "linux-appimage"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

INSTALLER_TYPE=$(detect_type)

log_info "Verifying installer: $INSTALLER_FILE"
log_info "Type: $INSTALLER_TYPE"
echo ""

# Verification tests
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

run_test() {
    local test_name="$1"
    shift
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    log_test "$test_name"

    if "$@" >/dev/null 2>&1; then
        log_success "$test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        log_error "$test_name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# File integrity tests
test_file_exists() {
    [ -f "$INSTALLER_FILE" ]
}

test_file_size() {
    local size=$(stat -f%z "$INSTALLER_FILE" 2>/dev/null || stat -c%s "$INSTALLER_FILE" 2>/dev/null)
    [ "$size" -gt 10000 ]  # At least 10KB
}

test_file_readable() {
    [ -r "$INSTALLER_FILE" ]
}

# macOS PKG tests
test_macos_pkg_structure() {
    pkgutil --check-signature "$INSTALLER_FILE" >/dev/null 2>&1
}

test_macos_pkg_signature() {
    pkgutil --check-signature "$INSTALLER_FILE" | grep -q "Status: signed"
}

test_macos_pkg_contents() {
    pkgutil --payload-files "$INSTALLER_FILE" | grep -q "zipminator"
}

# macOS DMG tests
test_macos_dmg_integrity() {
    hdiutil verify "$INSTALLER_FILE"
}

test_macos_dmg_signature() {
    codesign -v "$INSTALLER_FILE"
}

test_macos_dmg_mountable() {
    local mount_point=$(hdiutil attach -nobrowse -readonly "$INSTALLER_FILE" | grep Volumes | awk '{print $3}')
    [ -n "$mount_point" ]
    hdiutil detach "$mount_point" -quiet
}

# Linux DEB tests
test_linux_deb_structure() {
    dpkg-deb --info "$INSTALLER_FILE" | grep -q "Package:"
}

test_linux_deb_contents() {
    dpkg-deb --contents "$INSTALLER_FILE" | grep -q "zipminator"
}

test_linux_deb_control() {
    dpkg-deb --info "$INSTALLER_FILE" | grep -q "Version:"
}

test_linux_deb_scripts() {
    dpkg-deb --info "$INSTALLER_FILE" | grep -q "postinst"
}

# Linux RPM tests
test_linux_rpm_structure() {
    rpm -qip "$INSTALLER_FILE" | grep -q "Name"
}

test_linux_rpm_contents() {
    rpm -qlp "$INSTALLER_FILE" | grep -q "zipminator"
}

test_linux_rpm_signature() {
    rpm -K "$INSTALLER_FILE" | grep -q "OK" || rpm -K "$INSTALLER_FILE" | grep -q "NOKEY"
}

# Linux AppImage tests
test_linux_appimage_executable() {
    [ -x "$INSTALLER_FILE" ]
}

test_linux_appimage_format() {
    file "$INSTALLER_FILE" | grep -q "ELF"
}

test_linux_appimage_runs() {
    timeout 5 "$INSTALLER_FILE" --help
}

# Windows MSI tests
test_windows_msi_structure() {
    command -v msiinfo >/dev/null 2>&1 && msiinfo "$INSTALLER_FILE"
}

# Checksum verification
test_checksum() {
    local checksum_file="${INSTALLER_FILE%/*}/checksums.sha256"
    if [ -f "$checksum_file" ]; then
        local basename=$(basename "$INSTALLER_FILE")
        grep "$basename" "$checksum_file" | (cd "$(dirname "$INSTALLER_FILE")" && shasum -c >/dev/null 2>&1)
    else
        log_warn "Checksum file not found: $checksum_file"
        return 1
    fi
}

# Run tests based on installer type
case "$INSTALLER_TYPE" in
    macos-pkg)
        run_test "File exists" test_file_exists
        run_test "File size check" test_file_size
        run_test "File readable" test_file_readable
        run_test "PKG structure valid" test_macos_pkg_structure
        run_test "PKG signature check" test_macos_pkg_signature || log_warn "Not signed (OK for development)"
        run_test "PKG contains zipminator" test_macos_pkg_contents
        run_test "Checksum verification" test_checksum
        ;;

    macos-dmg)
        run_test "File exists" test_file_exists
        run_test "File size check" test_file_size
        run_test "File readable" test_file_readable
        run_test "DMG integrity check" test_macos_dmg_integrity
        run_test "DMG signature check" test_macos_dmg_signature || log_warn "Not signed (OK for development)"
        run_test "DMG mountable" test_macos_dmg_mountable
        run_test "Checksum verification" test_checksum
        ;;

    linux-deb)
        run_test "File exists" test_file_exists
        run_test "File size check" test_file_size
        run_test "File readable" test_file_readable
        run_test "DEB structure valid" test_linux_deb_structure
        run_test "DEB contains zipminator" test_linux_deb_contents
        run_test "DEB control file valid" test_linux_deb_control
        run_test "DEB has postinst" test_linux_deb_scripts
        run_test "Checksum verification" test_checksum
        ;;

    linux-rpm)
        run_test "File exists" test_file_exists
        run_test "File size check" test_file_size
        run_test "File readable" test_file_readable
        run_test "RPM structure valid" test_linux_rpm_structure
        run_test "RPM contains zipminator" test_linux_rpm_contents
        run_test "RPM signature check" test_linux_rpm_signature
        run_test "Checksum verification" test_checksum
        ;;

    linux-appimage)
        run_test "File exists" test_file_exists
        run_test "File size check" test_file_size
        run_test "File executable" test_linux_appimage_executable
        run_test "AppImage format valid" test_linux_appimage_format
        run_test "AppImage runs" test_linux_appimage_runs
        run_test "Checksum verification" test_checksum
        ;;

    windows-msi)
        run_test "File exists" test_file_exists
        run_test "File size check" test_file_size
        run_test "File readable" test_file_readable
        run_test "MSI structure valid" test_windows_msi_structure || log_warn "msiinfo not available"
        run_test "Checksum verification" test_checksum
        ;;

    windows-exe)
        run_test "File exists" test_file_exists
        run_test "File size check" test_file_size
        run_test "File readable" test_file_readable
        run_test "Checksum verification" test_checksum
        ;;

    *)
        log_error "Unknown installer type: $INSTALLER_TYPE"
        exit 1
        ;;
esac

# Print summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Verification Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Installer: $(basename "$INSTALLER_FILE")"
echo "Type:      $INSTALLER_TYPE"
echo ""
echo "Total tests:  $TOTAL_TESTS"
echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    log_success "All tests passed!"
    echo ""
    log_info "Installer is ready for distribution"
    exit 0
else
    log_error "Some tests failed"
    echo ""
    log_warn "Review failures before distribution"
    exit 1
fi
