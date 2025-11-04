#!/usr/bin/env bash
#
# Multi-Platform Installer Build Script
# Builds installers for macOS (.dmg), Windows (.msi), and Linux (AppImage, .deb, .rpm)
#
# Usage:
#   ./build_installers.sh [platform]
#   platform: macos | windows | linux | all (default: all)
#
# Requirements:
#   - Rust toolchain (cargo, cargo-bundle)
#   - Python 3.8+
#   - Node.js 18+ (for electron-builder)
#   - Platform-specific tools (see docs/INSTALLATION_GUIDE.md)

set -euo pipefail

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BUILD_DIR="${PROJECT_ROOT}/build"
DIST_DIR="${PROJECT_ROOT}/dist"

# Version information
VERSION="$(grep '^version' "${PROJECT_ROOT}/src/rust/Cargo.toml" | sed 's/.*"\(.*\)".*/\1/')"
APP_NAME="QDaria-QRNG"
BUNDLE_ID="com.qdaria.qrng"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*"
}

# Platform detection
detect_platform() {
    case "$(uname -s)" in
        Darwin*)    echo "macos";;
        Linux*)     echo "linux";;
        MINGW*|MSYS*|CYGWIN*) echo "windows";;
        *)          echo "unknown";;
    esac
}

# Check dependencies
check_dependencies() {
    local platform=$1
    log_info "Checking dependencies for ${platform}..."

    # Common dependencies
    command -v cargo >/dev/null 2>&1 || {
        log_error "cargo not found. Install Rust from https://rustup.rs/"
        exit 1
    }

    command -v python3 >/dev/null 2>&1 || {
        log_error "python3 not found. Install Python 3.8+ from https://python.org/"
        exit 1
    }

    command -v node >/dev/null 2>&1 || {
        log_error "node not found. Install Node.js 18+ from https://nodejs.org/"
        exit 1
    }

    # Check cargo-bundle
    if ! cargo bundle --version >/dev/null 2>&1; then
        log_warn "cargo-bundle not found. Installing..."
        cargo install cargo-bundle
    fi

    # Platform-specific checks
    case "${platform}" in
        macos)
            check_macos_deps
            ;;
        windows)
            check_windows_deps
            ;;
        linux)
            check_linux_deps
            ;;
    esac

    log_success "All dependencies satisfied"
}

check_macos_deps() {
    command -v create-dmg >/dev/null 2>&1 || {
        log_warn "create-dmg not found. Installing via npm..."
        npm install -g create-dmg
    }

    # Check for code signing identity
    if ! security find-identity -v -p codesigning 2>/dev/null | grep -q "Developer ID Application"; then
        log_warn "No code signing identity found. Installers will not be signed."
        log_warn "To sign installers, obtain a Developer ID from https://developer.apple.com/"
    fi
}

check_windows_deps() {
    command -v makensis >/dev/null 2>&1 || {
        log_error "NSIS not found. Install from https://nsis.sourceforge.io/"
        exit 1
    }

    command -v wix >/dev/null 2>&1 || {
        log_warn "WiX Toolset not found. Install from https://wixtoolset.org/"
        log_warn "Falling back to NSIS installer..."
    }
}

check_linux_deps() {
    # Check for AppImage tools
    command -v appimagetool >/dev/null 2>&1 || {
        log_warn "appimagetool not found. Downloading..."
        wget -q "https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage" \
            -O "${BUILD_DIR}/appimagetool"
        chmod +x "${BUILD_DIR}/appimagetool"
    }

    # Check for package builders
    if [[ "$(detect_platform)" == "linux" ]]; then
        command -v dpkg-deb >/dev/null 2>&1 || log_warn "dpkg-deb not found. .deb packages will not be built."
        command -v rpmbuild >/dev/null 2>&1 || log_warn "rpmbuild not found. .rpm packages will not be built."
    fi
}

# Build Rust components
build_rust() {
    log_info "Building Rust components..."
    cd "${PROJECT_ROOT}/src/rust"

    # Build release binary
    cargo build --release --features "async,config"

    # Copy binary to build directory
    mkdir -p "${BUILD_DIR}/bin"
    cp "target/release/kyber768" "${BUILD_DIR}/bin/" || cp "target/release/kyber768.exe" "${BUILD_DIR}/bin/" 2>/dev/null || true

    log_success "Rust components built"
}

# Build Python components
build_python() {
    log_info "Building Python components..."
    cd "${PROJECT_ROOT}"

    # Create virtual environment
    python3 -m venv "${BUILD_DIR}/venv"
    source "${BUILD_DIR}/venv/bin/activate" || source "${BUILD_DIR}/venv/Scripts/activate"

    # Install dependencies
    pip install --upgrade pip wheel setuptools
    pip install -r requirements_ibm_harvester.txt
    pip install pyinstaller

    # Build standalone executables
    pyinstaller --onefile \
        --name "qrng-harvester" \
        --add-data "config:config" \
        --hidden-import qiskit \
        --hidden-import qiskit_ibm_runtime \
        "${PROJECT_ROOT}/src/python/ibm_qrng_harvester.py"

    # Copy to build directory
    mkdir -p "${BUILD_DIR}/bin"
    cp dist/qrng-harvester* "${BUILD_DIR}/bin/"

    deactivate
    log_success "Python components built"
}

# Bundle zipminator
bundle_zipminator() {
    log_info "Bundling zipminator..."
    cd "${PROJECT_ROOT}/zipminator"

    # Build Python package
    python3 -m pip install --upgrade build
    python3 -m build

    # Copy wheel to build directory
    mkdir -p "${BUILD_DIR}/packages"
    cp dist/*.whl "${BUILD_DIR}/packages/"

    log_success "Zipminator bundled"
}

# Build macOS .dmg installer
build_macos_dmg() {
    log_info "Building macOS .dmg installer..."

    local app_name="${APP_NAME}.app"
    local app_dir="${BUILD_DIR}/${app_name}"

    # Create app bundle structure
    mkdir -p "${app_dir}/Contents/"{MacOS,Resources,Frameworks}

    # Copy binaries
    cp -r "${BUILD_DIR}/bin/"* "${app_dir}/Contents/MacOS/"

    # Create Info.plist
    cat > "${app_dir}/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>qrng-harvester</string>
    <key>CFBundleIdentifier</key>
    <string>${BUNDLE_ID}</string>
    <key>CFBundleName</key>
    <string>${APP_NAME}</string>
    <key>CFBundleVersion</key>
    <string>${VERSION}</string>
    <key>CFBundleShortVersionString</key>
    <string>${VERSION}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSMinimumSystemVersion</key>
    <string>10.13</string>
</dict>
</plist>
EOF

    # Copy icon if exists
    if [[ -f "${PROJECT_ROOT}/docs/icon.icns" ]]; then
        cp "${PROJECT_ROOT}/docs/icon.icns" "${app_dir}/Contents/Resources/icon.icns"
    fi

    # Code sign if possible
    if security find-identity -v -p codesigning 2>/dev/null | grep -q "Developer ID Application"; then
        log_info "Code signing application..."
        IDENTITY=$(security find-identity -v -p codesigning | grep "Developer ID Application" | head -1 | awk '{print $2}')
        codesign --force --sign "${IDENTITY}" --deep --timestamp --options runtime "${app_dir}"
        log_success "Application signed"
    else
        log_warn "Skipping code signing (no identity found)"
    fi

    # Create DMG
    mkdir -p "${DIST_DIR}"
    local dmg_name="${APP_NAME}-${VERSION}-macOS.dmg"

    # Create temporary directory for DMG contents
    local dmg_temp="${BUILD_DIR}/dmg-temp"
    mkdir -p "${dmg_temp}"
    cp -r "${app_dir}" "${dmg_temp}/"
    ln -s /Applications "${dmg_temp}/Applications"

    # Create DMG
    if command -v create-dmg >/dev/null 2>&1; then
        create-dmg \
            --volname "${APP_NAME}" \
            --volicon "${PROJECT_ROOT}/docs/icon.icns" \
            --window-pos 200 120 \
            --window-size 800 400 \
            --icon-size 100 \
            --icon "${app_name}" 200 190 \
            --hide-extension "${app_name}" \
            --app-drop-link 600 185 \
            "${DIST_DIR}/${dmg_name}" \
            "${dmg_temp}" || true
    else
        # Fallback to hdiutil
        hdiutil create -volname "${APP_NAME}" \
            -srcfolder "${dmg_temp}" \
            -ov -format UDZO \
            "${DIST_DIR}/${dmg_name}"
    fi

    # Sign DMG if possible
    if security find-identity -v -p codesigning 2>/dev/null | grep -q "Developer ID Application"; then
        IDENTITY=$(security find-identity -v -p codesigning | grep "Developer ID Application" | head -1 | awk '{print $2}')
        codesign --force --sign "${IDENTITY}" "${DIST_DIR}/${dmg_name}"
    fi

    log_success "macOS DMG created: ${DIST_DIR}/${dmg_name}"
}

# Build Windows .msi installer
build_windows_msi() {
    log_info "Building Windows .msi installer..."

    local installer_name="${APP_NAME}-${VERSION}-Windows.msi"

    # Create WiX source file
    cat > "${BUILD_DIR}/installer.wxs" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
  <Product Id="*" Name="${APP_NAME}" Language="1033" Version="${VERSION}"
           Manufacturer="QDaria" UpgradeCode="12345678-1234-1234-1234-123456789012">
    <Package InstallerVersion="200" Compressed="yes" InstallScope="perMachine" />

    <MajorUpgrade DowngradeErrorMessage="A newer version is already installed." />
    <MediaTemplate EmbedCab="yes" />

    <Feature Id="ProductFeature" Title="${APP_NAME}" Level="1">
      <ComponentGroupRef Id="ProductComponents" />
    </Feature>

    <Directory Id="TARGETDIR" Name="SourceDir">
      <Directory Id="ProgramFilesFolder">
        <Directory Id="INSTALLFOLDER" Name="${APP_NAME}" />
      </Directory>
      <Directory Id="ProgramMenuFolder">
        <Directory Id="ApplicationProgramsFolder" Name="${APP_NAME}"/>
      </Directory>
    </Directory>

    <ComponentGroup Id="ProductComponents" Directory="INSTALLFOLDER">
      <Component Id="MainExecutable" Guid="*">
        <File Id="QRNGHarvester" Source="${BUILD_DIR}/bin/qrng-harvester.exe" KeyPath="yes">
          <Shortcut Id="StartMenuShortcut" Directory="ApplicationProgramsFolder"
                    Name="${APP_NAME}" WorkingDirectory="INSTALLFOLDER"
                    Icon="AppIcon.exe" IconIndex="0" Advertise="yes" />
        </File>
      </Component>
      <Component Id="Kyber768" Guid="*">
        <File Source="${BUILD_DIR}/bin/kyber768.exe" />
      </Component>
    </ComponentGroup>

    <Icon Id="AppIcon.exe" SourceFile="${BUILD_DIR}/bin/qrng-harvester.exe"/>
  </Product>
</Wix>
EOF

    # Build MSI
    mkdir -p "${DIST_DIR}"
    if command -v wix >/dev/null 2>&1; then
        wix build "${BUILD_DIR}/installer.wxs" -o "${DIST_DIR}/${installer_name}"
        log_success "Windows MSI created: ${DIST_DIR}/${installer_name}"
    else
        log_warn "WiX not available, creating NSIS installer instead..."
        build_windows_nsis
    fi
}

# Build Windows NSIS installer (fallback)
build_windows_nsis() {
    log_info "Building Windows NSIS installer..."

    local installer_name="${APP_NAME}-${VERSION}-Windows-Setup.exe"

    cat > "${BUILD_DIR}/installer.nsi" <<'EOF'
!include "MUI2.nsh"

Name "${APP_NAME}"
OutFile "${DIST_DIR}/${installer_name}"
InstallDir "$PROGRAMFILES\${APP_NAME}"
RequestExecutionLevel admin

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

Section "Install"
  SetOutPath "$INSTDIR"
  File /r "${BUILD_DIR}\bin\*"

  CreateDirectory "$SMPROGRAMS\${APP_NAME}"
  CreateShortCut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\qrng-harvester.exe"
  CreateShortCut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\qrng-harvester.exe"

  WriteUninstaller "$INSTDIR\Uninstall.exe"
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\*"
  Delete "$SMPROGRAMS\${APP_NAME}\*"
  Delete "$DESKTOP\${APP_NAME}.lnk"
  RMDir "$SMPROGRAMS\${APP_NAME}"
  RMDir "$INSTDIR"
SectionEnd
EOF

    makensis "${BUILD_DIR}/installer.nsi"
    log_success "Windows NSIS installer created: ${DIST_DIR}/${installer_name}"
}

# Build Linux AppImage
build_linux_appimage() {
    log_info "Building Linux AppImage..."

    local app_dir="${BUILD_DIR}/AppDir"
    local appimage_name="${APP_NAME}-${VERSION}-x86_64.AppImage"

    # Create AppDir structure
    mkdir -p "${app_dir}/usr/"{bin,lib,share/applications,share/icons/hicolor/256x256/apps}

    # Copy binaries
    cp -r "${BUILD_DIR}/bin/"* "${app_dir}/usr/bin/"

    # Create desktop entry
    cat > "${app_dir}/usr/share/applications/${APP_NAME}.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=${APP_NAME}
Exec=qrng-harvester
Icon=${APP_NAME}
Categories=Utility;Science;
Terminal=false
EOF

    # Copy icon if exists
    if [[ -f "${PROJECT_ROOT}/docs/icon.png" ]]; then
        cp "${PROJECT_ROOT}/docs/icon.png" "${app_dir}/usr/share/icons/hicolor/256x256/apps/${APP_NAME}.png"
    fi

    # Create AppRun script
    cat > "${app_dir}/AppRun" <<'EOF'
#!/bin/bash
SELF=$(readlink -f "$0")
HERE=${SELF%/*}
export PATH="${HERE}/usr/bin:${PATH}"
export LD_LIBRARY_PATH="${HERE}/usr/lib:${LD_LIBRARY_PATH}"
exec "${HERE}/usr/bin/qrng-harvester" "$@"
EOF
    chmod +x "${app_dir}/AppRun"

    # Build AppImage
    mkdir -p "${DIST_DIR}"
    if command -v appimagetool >/dev/null 2>&1; then
        ARCH=x86_64 appimagetool "${app_dir}" "${DIST_DIR}/${appimage_name}"
    else
        "${BUILD_DIR}/appimagetool" "${app_dir}" "${DIST_DIR}/${appimage_name}"
    fi

    log_success "Linux AppImage created: ${DIST_DIR}/${appimage_name}"
}

# Build Debian .deb package
build_linux_deb() {
    log_info "Building Debian .deb package..."

    local deb_name="${APP_NAME,,}_${VERSION}_amd64"
    local deb_dir="${BUILD_DIR}/${deb_name}"

    # Create package structure
    mkdir -p "${deb_dir}/DEBIAN"
    mkdir -p "${deb_dir}/usr/"{bin,lib,share/applications,share/doc/${APP_NAME}}

    # Copy binaries
    cp -r "${BUILD_DIR}/bin/"* "${deb_dir}/usr/bin/"

    # Create control file
    cat > "${deb_dir}/DEBIAN/control" <<EOF
Package: ${APP_NAME,,}
Version: ${VERSION}
Section: science
Priority: optional
Architecture: amd64
Depends: libssl3, libusb-1.0-0, python3 (>= 3.8)
Maintainer: QDaria <support@qdaria.com>
Description: Quantum Random Number Generator
 QDaria QRNG provides enterprise-grade quantum random number generation
 using IBM Quantum, QBraid, and Azure Quantum providers.
 Includes Kyber-768 post-quantum cryptography and zipminator integration.
EOF

    # Create desktop entry
    cat > "${deb_dir}/usr/share/applications/${APP_NAME}.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=${APP_NAME}
Exec=/usr/bin/qrng-harvester
Icon=${APP_NAME}
Categories=Utility;Science;
Terminal=false
EOF

    # Create copyright
    cat > "${deb_dir}/usr/share/doc/${APP_NAME}/copyright" <<EOF
Format: https://www.debian.org/doc/packaging-manuals/copyright-format/1.0/
Upstream-Name: ${APP_NAME}
Source: https://github.com/QDaria/qrng

Files: *
Copyright: $(date +%Y) QDaria
License: MIT
EOF

    # Build package
    mkdir -p "${DIST_DIR}"
    dpkg-deb --build "${deb_dir}" "${DIST_DIR}/${deb_name}.deb"

    log_success "Debian package created: ${DIST_DIR}/${deb_name}.deb"
}

# Build RedHat .rpm package
build_linux_rpm() {
    log_info "Building RedHat .rpm package..."

    local rpm_name="${APP_NAME}-${VERSION}-1.x86_64"
    local rpmbuild_dir="${BUILD_DIR}/rpmbuild"

    # Create RPM build structure
    mkdir -p "${rpmbuild_dir}/"{BUILD,RPMS,SOURCES,SPECS,SRPMS}

    # Create spec file
    cat > "${rpmbuild_dir}/SPECS/${APP_NAME}.spec" <<EOF
Name:           ${APP_NAME,,}
Version:        ${VERSION}
Release:        1%{?dist}
Summary:        Quantum Random Number Generator

License:        MIT
URL:            https://github.com/QDaria/qrng
Source0:        %{name}-%{version}.tar.gz

Requires:       openssl-libs libusb python3 >= 3.8

%description
QDaria QRNG provides enterprise-grade quantum random number generation
using IBM Quantum, QBraid, and Azure Quantum providers.
Includes Kyber-768 post-quantum cryptography and zipminator integration.

%prep
%setup -q

%build
# Pre-built binaries

%install
mkdir -p %{buildroot}/usr/bin
cp -r bin/* %{buildroot}/usr/bin/

%files
/usr/bin/*

%changelog
* $(date +"%a %b %d %Y") QDaria <support@qdaria.com> - ${VERSION}-1
- Initial package release
EOF

    # Create source tarball
    tar czf "${rpmbuild_dir}/SOURCES/${APP_NAME}-${VERSION}.tar.gz" \
        -C "${BUILD_DIR}" bin

    # Build RPM
    mkdir -p "${DIST_DIR}"
    rpmbuild --define "_topdir ${rpmbuild_dir}" \
             -bb "${rpmbuild_dir}/SPECS/${APP_NAME}.spec"

    cp "${rpmbuild_dir}/RPMS/x86_64/"*.rpm "${DIST_DIR}/"

    log_success "RPM package created: ${DIST_DIR}/${rpm_name}.rpm"
}

# Clean build artifacts
clean() {
    log_info "Cleaning build artifacts..."
    rm -rf "${BUILD_DIR}"
    log_success "Build directory cleaned"
}

# Main build orchestration
main() {
    local platform="${1:-all}"
    local current_platform=$(detect_platform)

    log_info "Starting installer build for platform: ${platform}"
    log_info "Current platform: ${current_platform}"
    log_info "Version: ${VERSION}"

    # Create build directories
    mkdir -p "${BUILD_DIR}" "${DIST_DIR}"

    # Build components
    build_rust
    build_python
    bundle_zipminator

    # Build platform-specific installers
    case "${platform}" in
        macos)
            if [[ "${current_platform}" != "macos" ]]; then
                log_error "macOS installers can only be built on macOS"
                exit 1
            fi
            check_dependencies macos
            build_macos_dmg
            ;;
        windows)
            check_dependencies windows
            build_windows_msi
            ;;
        linux)
            check_dependencies linux
            build_linux_appimage
            if command -v dpkg-deb >/dev/null 2>&1; then
                build_linux_deb
            fi
            if command -v rpmbuild >/dev/null 2>&1; then
                build_linux_rpm
            fi
            ;;
        all)
            if [[ "${current_platform}" == "macos" ]]; then
                check_dependencies macos
                build_macos_dmg
            fi
            check_dependencies linux
            build_linux_appimage
            if command -v dpkg-deb >/dev/null 2>&1; then
                build_linux_deb
            fi
            if command -v rpmbuild >/dev/null 2>&1; then
                build_linux_rpm
            fi
            log_warn "Windows installers require Windows platform or cross-compilation"
            ;;
        clean)
            clean
            exit 0
            ;;
        *)
            log_error "Unknown platform: ${platform}"
            echo "Usage: $0 [macos|windows|linux|all|clean]"
            exit 1
            ;;
    esac

    log_success "Build complete! Installers available in: ${DIST_DIR}"
    ls -lh "${DIST_DIR}"
}

# Run main
main "$@"
