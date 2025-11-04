# QDaria QRNG Build Guide

Complete guide for building installers from source.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Build](#quick-build)
3. [Platform-Specific Builds](#platform-specific-builds)
4. [Architecture Overview](#architecture-overview)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### All Platforms

**Required:**
- Git 2.0+
- Rust 1.70+ (`rustup`)
- Python 3.8+
- Node.js 18+
- cargo-bundle: `cargo install cargo-bundle`

**Python Packages:**
```bash
pip3 install --upgrade pip wheel setuptools
pip3 install pyinstaller
pip3 install -r requirements_ibm_harvester.txt
```

### macOS

**Additional Requirements:**
```bash
# Xcode Command Line Tools
xcode-select --install

# create-dmg for DMG creation
npm install -g create-dmg

# Optional: Developer ID certificate for code signing
# Obtain from https://developer.apple.com/
```

**Check Prerequisites:**
```bash
which cargo rustc python3 node npm
cargo --version
python3 --version
node --version
```

### Windows

**Additional Requirements:**
- Visual Studio 2019+ Build Tools
- WiX Toolset 3.11+ (for MSI)
- NSIS 3.0+ (fallback installer)

```powershell
# Install Rust
winget install Rustlang.Rustup

# Install Node.js
winget install OpenJS.NodeJS

# Install WiX Toolset
winget install WiXToolset.WiX

# Install Visual Studio Build Tools
winget install Microsoft.VisualStudio.2022.BuildTools

# Install NSIS
winget install NSIS.NSIS

# Install Python
winget install Python.Python.3.11
```

### Linux

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y \
    build-essential \
    pkg-config \
    libssl-dev \
    libusb-1.0-0-dev \
    python3-dev \
    python3-pip \
    nodejs \
    npm \
    dpkg-dev \
    rpm \
    fakeroot \
    wget

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install AppImage tools
wget https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage
chmod +x appimagetool-x86_64.AppImage
sudo mv appimagetool-x86_64.AppImage /usr/local/bin/appimagetool
```

**Fedora/RHEL:**
```bash
sudo dnf groupinstall "Development Tools"
sudo dnf install -y \
    openssl-devel \
    libusb-devel \
    python3-devel \
    nodejs \
    npm \
    rpm-build

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

---

## Quick Build

### Clone and Build All Platforms

```bash
# 1. Clone repository
git clone https://github.com/QDaria/qrng.git
cd qrng

# 2. Install cargo-bundle
cargo install cargo-bundle

# 3. Install Python dependencies
python3 -m pip install --upgrade pip wheel setuptools pyinstaller
pip3 install -r requirements_ibm_harvester.txt

# 4. Build all installers
chmod +x scripts/build_installers.sh
./scripts/build_installers.sh all

# 5. Check output
ls -lh dist/
```

**Expected Output:**
```
dist/
├── QDaria-QRNG-0.1.0-macOS.dmg          # macOS installer
├── QDaria-QRNG-0.1.0-Windows.msi        # Windows installer
├── QDaria-QRNG-0.1.0-x86_64.AppImage    # Linux universal
├── qdaria-qrng_0.1.0_amd64.deb          # Debian/Ubuntu
└── QDaria-QRNG-0.1.0-1.x86_64.rpm       # RedHat/Fedora
```

---

## Platform-Specific Builds

### macOS DMG Installer

**Requirements:**
- macOS 10.13+
- Xcode Command Line Tools
- create-dmg (optional, improves DMG appearance)

**Build Process:**
```bash
# 1. Build Rust components
cd src/rust
cargo build --release --features "async,config"
cd ../..

# 2. Build Python components
python3 -m venv build/venv
source build/venv/bin/activate
pip install -r requirements_ibm_harvester.txt
pip install pyinstaller

pyinstaller --onefile \
    --name "qrng-harvester" \
    --add-data "config:config" \
    --hidden-import qiskit \
    src/python/ibm_qrng_harvester.py

deactivate

# 3. Create app bundle
mkdir -p build/QDaria-QRNG.app/Contents/{MacOS,Resources}

# Copy binaries
cp src/rust/target/release/kyber768 build/QDaria-QRNG.app/Contents/MacOS/
cp dist/qrng-harvester build/QDaria-QRNG.app/Contents/MacOS/

# Copy icon (if exists)
cp docs/icons/icon.icns build/QDaria-QRNG.app/Contents/Resources/

# Create Info.plist
cat > build/QDaria-QRNG.app/Contents/Info.plist <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>qrng-harvester</string>
    <key>CFBundleIdentifier</key>
    <string>com.qdaria.qrng</string>
    <key>CFBundleName</key>
    <string>QDaria-QRNG</string>
    <key>CFBundleVersion</key>
    <string>0.1.0</string>
</dict>
</plist>
EOF

# 4. Code sign (optional)
if security find-identity -v -p codesigning | grep -q "Developer ID"; then
    IDENTITY=$(security find-identity -v -p codesigning | grep "Developer ID Application" | head -1 | awk '{print $2}')
    codesign --force --sign "${IDENTITY}" --deep --timestamp \
        --options runtime build/QDaria-QRNG.app
fi

# 5. Create DMG
mkdir -p build/dmg-temp
cp -r build/QDaria-QRNG.app build/dmg-temp/
ln -s /Applications build/dmg-temp/Applications

if command -v create-dmg >/dev/null; then
    create-dmg \
        --volname "QDaria QRNG" \
        --window-pos 200 120 \
        --window-size 800 400 \
        --icon-size 100 \
        --app-drop-link 600 185 \
        dist/QDaria-QRNG-0.1.0-macOS.dmg \
        build/dmg-temp
else
    hdiutil create -volname "QDaria QRNG" \
        -srcfolder build/dmg-temp \
        -ov -format UDZO \
        dist/QDaria-QRNG-0.1.0-macOS.dmg
fi
```

**Code Signing (Optional but Recommended):**
```bash
# Check for signing identity
security find-identity -v -p codesigning

# Sign the app
codesign --force --sign "Developer ID Application: Your Name (TEAM_ID)" \
    --deep --timestamp --options runtime \
    build/QDaria-QRNG.app

# Verify signature
codesign -dvv build/QDaria-QRNG.app
spctl -a -vvv build/QDaria-QRNG.app

# Sign the DMG
codesign --force --sign "Developer ID Application: Your Name (TEAM_ID)" \
    dist/QDaria-QRNG-0.1.0-macOS.dmg

# Notarize (requires Apple Developer account)
xcrun notarytool submit dist/QDaria-QRNG-0.1.0-macOS.dmg \
    --apple-id "your@email.com" \
    --team-id "TEAM_ID" \
    --password "app-specific-password" \
    --wait

# Staple notarization ticket
xcrun stapler staple dist/QDaria-QRNG-0.1.0-macOS.dmg
```

---

### Windows MSI Installer

**Requirements:**
- Windows 10/11
- WiX Toolset 3.11+
- Visual Studio Build Tools

**Build Process:**

```powershell
# 1. Build Rust components
cd src\rust
cargo build --release --features "async,config"
cd ..\..

# 2. Build Python components
python -m venv build\venv
.\build\venv\Scripts\Activate.ps1
pip install -r requirements_ibm_harvester.txt
pip install pyinstaller

pyinstaller --onefile `
    --name "qrng-harvester" `
    --add-data "config;config" `
    --hidden-import qiskit `
    src\python\ibm_qrng_harvester.py

deactivate

# 3. Create WiX source file
New-Item -ItemType Directory -Force -Path build
@"
<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
  <Product Id="*" Name="QDaria QRNG" Language="1033" Version="0.1.0"
           Manufacturer="QDaria" UpgradeCode="12345678-1234-1234-1234-123456789012">
    <Package InstallerVersion="200" Compressed="yes" InstallScope="perMachine" />
    <MajorUpgrade DowngradeErrorMessage="A newer version is already installed." />
    <MediaTemplate EmbedCab="yes" />

    <Feature Id="ProductFeature" Title="QDaria QRNG" Level="1">
      <ComponentGroupRef Id="ProductComponents" />
    </Feature>

    <Directory Id="TARGETDIR" Name="SourceDir">
      <Directory Id="ProgramFilesFolder">
        <Directory Id="INSTALLFOLDER" Name="QDaria-QRNG" />
      </Directory>
    </Directory>

    <ComponentGroup Id="ProductComponents" Directory="INSTALLFOLDER">
      <Component Id="MainExecutable" Guid="*">
        <File Source="dist\qrng-harvester.exe" KeyPath="yes" />
      </Component>
      <Component Id="Kyber768" Guid="*">
        <File Source="src\rust\target\release\kyber768.exe" />
      </Component>
    </ComponentGroup>
  </Product>
</Wix>
"@ | Out-File -Encoding UTF8 build\installer.wxs

# 4. Build MSI
wix build build\installer.wxs -o dist\QDaria-QRNG-0.1.0-Windows.msi
```

**Digital Signing (Optional):**
```powershell
# Sign with code signing certificate
signtool sign /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 `
    /f "path\to\certificate.pfx" /p "password" `
    dist\QDaria-QRNG-0.1.0-Windows.msi

# Verify signature
signtool verify /pa dist\QDaria-QRNG-0.1.0-Windows.msi
```

---

### Linux AppImage

**Requirements:**
- Linux (any distribution)
- appimagetool

**Build Process:**
```bash
# 1. Build Rust components
cd src/rust
cargo build --release --features "async,config"
cd ../..

# 2. Build Python components
python3 -m venv build/venv
source build/venv/bin/activate
pip install -r requirements_ibm_harvester.txt
pip install pyinstaller

pyinstaller --onefile \
    --name "qrng-harvester" \
    --add-data "config:config" \
    --hidden-import qiskit \
    src/python/ibm_qrng_harvester.py

deactivate

# 3. Create AppDir structure
mkdir -p build/AppDir/usr/{bin,lib,share/applications,share/icons/hicolor/256x256/apps}

# Copy binaries
cp src/rust/target/release/kyber768 build/AppDir/usr/bin/
cp dist/qrng-harvester build/AppDir/usr/bin/

# Create desktop entry
cat > build/AppDir/usr/share/applications/qdaria-qrng.desktop <<'EOF'
[Desktop Entry]
Type=Application
Name=QDaria QRNG
Exec=qrng-harvester
Icon=qdaria-qrng
Categories=Science;Utility;
Terminal=false
EOF

# Copy icon
cp docs/icons/icon.png build/AppDir/usr/share/icons/hicolor/256x256/apps/qdaria-qrng.png

# Create AppRun
cat > build/AppDir/AppRun <<'EOF'
#!/bin/bash
SELF=$(readlink -f "$0")
HERE=${SELF%/*}
export PATH="${HERE}/usr/bin:${PATH}"
export LD_LIBRARY_PATH="${HERE}/usr/lib:${LD_LIBRARY_PATH}"
exec "${HERE}/usr/bin/qrng-harvester" "$@"
EOF
chmod +x build/AppDir/AppRun

# 4. Build AppImage
ARCH=x86_64 appimagetool build/AppDir dist/QDaria-QRNG-0.1.0-x86_64.AppImage
```

---

### Linux DEB Package

**Requirements:**
- dpkg-deb
- Ubuntu/Debian system (or container)

**Build Process:**
```bash
# 1. Build components (same as AppImage steps 1-2)

# 2. Create package structure
mkdir -p build/deb/qdaria-qrng_0.1.0_amd64/{DEBIAN,usr/bin,usr/share/applications,usr/share/doc/qdaria-qrng}

# Copy binaries
cp src/rust/target/release/kyber768 build/deb/qdaria-qrng_0.1.0_amd64/usr/bin/
cp dist/qrng-harvester build/deb/qdaria-qrng_0.1.0_amd64/usr/bin/

# Create control file
cat > build/deb/qdaria-qrng_0.1.0_amd64/DEBIAN/control <<'EOF'
Package: qdaria-qrng
Version: 0.1.0
Section: science
Priority: optional
Architecture: amd64
Depends: libssl3, libusb-1.0-0, python3 (>= 3.8)
Maintainer: QDaria <support@qdaria.com>
Description: Quantum Random Number Generator
 Enterprise-grade quantum random number generation with post-quantum cryptography.
EOF

# Create postinst script
cp scripts/postinstall.sh build/deb/qdaria-qrng_0.1.0_amd64/DEBIAN/postinst
chmod +x build/deb/qdaria-qrng_0.1.0_amd64/DEBIAN/postinst

# 3. Build package
dpkg-deb --build build/deb/qdaria-qrng_0.1.0_amd64 dist/qdaria-qrng_0.1.0_amd64.deb

# 4. Verify package
dpkg-deb -I dist/qdaria-qrng_0.1.0_amd64.deb
dpkg-deb -c dist/qdaria-qrng_0.1.0_amd64.deb
```

---

### Linux RPM Package

**Requirements:**
- rpmbuild
- Fedora/RHEL system (or container)

**Build Process:**
```bash
# 1. Build components (same as DEB)

# 2. Create RPM build structure
mkdir -p build/rpmbuild/{BUILD,RPMS,SOURCES,SPECS,SRPMS}

# Create spec file
cat > build/rpmbuild/SPECS/qdaria-qrng.spec <<'EOF'
Name:           qdaria-qrng
Version:        0.1.0
Release:        1%{?dist}
Summary:        Quantum Random Number Generator
License:        MIT
URL:            https://github.com/QDaria/qrng
Requires:       openssl-libs libusb python3 >= 3.8

%description
Enterprise-grade quantum random number generation with post-quantum cryptography.

%prep
# No prep needed

%build
# Pre-built binaries

%install
mkdir -p %{buildroot}/usr/bin
cp %{_sourcedir}/kyber768 %{buildroot}/usr/bin/
cp %{_sourcedir}/qrng-harvester %{buildroot}/usr/bin/

%files
/usr/bin/kyber768
/usr/bin/qrng-harvester

%changelog
* $(date +"%a %b %d %Y") QDaria <support@qdaria.com> - 0.1.0-1
- Initial release
EOF

# Copy binaries to SOURCES
cp src/rust/target/release/kyber768 build/rpmbuild/SOURCES/
cp dist/qrng-harvester build/rpmbuild/SOURCES/

# 3. Build RPM
rpmbuild --define "_topdir $(pwd)/build/rpmbuild" \
         -bb build/rpmbuild/SPECS/qdaria-qrng.spec

# 4. Copy to dist
cp build/rpmbuild/RPMS/x86_64/*.rpm dist/
```

---

## Architecture Overview

### Build System Components

```
scripts/
├── build_installers.sh      # Main orchestration script
├── macos_bundle.sh          # macOS-specific bundling
├── create_icons.sh          # Icon generation
├── postinstall.sh           # Post-installation setup
├── preuninstall.sh          # Pre-uninstall cleanup
├── electron-builder.json    # Electron Builder config
├── linux-desktop.template   # Linux desktop entry
└── windows-installer.nsh    # NSIS custom script

src/rust/
├── Cargo.toml              # Rust package manifest
└── Cargo-bundle.toml       # Bundling configuration

build/                       # Temporary build artifacts
└── [generated files]

dist/                        # Final installers
└── [platform installers]
```

### Build Flow

```
1. Dependency Check
   ├── Rust toolchain
   ├── Python 3.8+
   ├── Node.js
   └── Platform tools

2. Component Build
   ├── Rust (Kyber-768)
   ├── Python (QRNG Harvester)
   └── Zipminator package

3. Platform Bundling
   ├── macOS: .app + .dmg
   ├── Windows: .msi / .exe
   └── Linux: AppImage + .deb + .rpm

4. Signing & Verification
   ├── Code signing
   ├── Notarization (macOS)
   └── Package validation
```

---

## Troubleshooting

### Common Build Errors

**Error: `cargo: command not found`**
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

**Error: `pyinstaller: command not found`**
```bash
pip3 install --upgrade pyinstaller
```

**Error: `error: linking with cc failed`**
```bash
# macOS: Install Xcode Command Line Tools
xcode-select --install

# Linux: Install build-essential
sudo apt install build-essential  # Debian/Ubuntu
sudo dnf groupinstall "Development Tools"  # Fedora
```

**Error: `Could not find libssl`**
```bash
# macOS
brew install openssl@3

# Linux
sudo apt install libssl-dev  # Debian/Ubuntu
sudo dnf install openssl-devel  # Fedora
```

**Error: DMG creation fails**
```bash
# Install create-dmg
npm install -g create-dmg

# Or use hdiutil fallback (built into macOS)
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build Installers

on:
  push:
    tags:
      - 'v*'

jobs:
  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - run: cargo install cargo-bundle
      - run: pip3 install -r requirements_ibm_harvester.txt
      - run: ./scripts/build_installers.sh macos
      - uses: actions/upload-artifact@v3
        with:
          name: macos-installer
          path: dist/*.dmg

  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - run: pip install -r requirements_ibm_harvester.txt
      - run: ./scripts/build_installers.sh windows
      - uses: actions/upload-artifact@v3
        with:
          name: windows-installer
          path: dist/*.msi

  build-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: sudo apt-get update && sudo apt-get install -y build-essential libssl-dev libusb-1.0-0-dev
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - run: cargo install cargo-bundle
      - run: pip3 install -r requirements_ibm_harvester.txt
      - run: ./scripts/build_installers.sh linux
      - uses: actions/upload-artifact@v3
        with:
          name: linux-installers
          path: dist/*
```

---

## Support

For build issues:
- GitHub Issues: https://github.com/QDaria/qrng/issues
- Documentation: https://docs.qdaria.com/qrng/building
- Email: support@qdaria.com
