# QDaria QRNG Installer Architecture

## System Design Document

**Version**: 1.0.0
**Date**: 2025-10-31
**Status**: Production Ready

---

## Executive Summary

The QDaria QRNG installer system provides comprehensive multi-platform distribution packages for macOS, Windows, and Linux. The system automates the building, bundling, signing, and distribution of quantum random number generation software with post-quantum cryptography capabilities.

### Key Features

- **Multi-platform support**: macOS (.dmg), Windows (.msi), Linux (AppImage, .deb, .rpm)
- **Automated build orchestration**: Single-command builds for all platforms
- **Code signing integration**: Support for macOS Developer ID and Windows Authenticode
- **Quantum entropy bundling**: Includes quantum entropy pool and multi-provider support
- **Post-quantum cryptography**: Integrated CRYSTALS-Kyber-768 implementation
- **Zipminator integration**: Secure data compression and encryption

---

## Architecture Overview

### Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│              Build Orchestrator (build_installers.sh)        │
│                    Platform Detection & Management           │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
        ┌───────▼────────┐          ┌──────▼───────┐
        │  Rust Builder  │          │ Python Builder│
        │   (Cargo)      │          │  (PyInstaller)│
        └───────┬────────┘          └──────┬────────┘
                │                           │
                └─────────────┬─────────────┘
                              │
        ┌─────────────────────▼─────────────────────┐
        │         Platform-Specific Bundlers        │
        │  ┌─────────┬──────────┬──────────────┐   │
        │  │  macOS  │ Windows  │    Linux     │   │
        │  │  .dmg   │   .msi   │ AppImage/deb │   │
        │  └─────────┴──────────┴──────────────┘   │
        └───────────────────────────────────────────┘
                              │
                ┌─────────────┴──────────────┐
                │                            │
        ┌───────▼────────┐          ┌────────▼──────┐
        │  Code Signing  │          │ Post-Install  │
        │  & Notarization│          │  Automation   │
        └────────────────┘          └───────────────┘
```

### Data Flow

```
Source Code (Rust + Python)
        │
        ▼
Dependency Resolution
        │
        ├─► Rust: cargo build --release
        │       └─► kyber768 binary
        │
        └─► Python: pyinstaller
                └─► qrng-harvester executable
        │
        ▼
Platform Bundling
        │
        ├─► macOS: .app bundle → .dmg
        │       └─► Code signing → Notarization
        │
        ├─► Windows: .exe files → .msi
        │       └─► Digital signing
        │
        └─► Linux: binaries → packages
                ├─► AppImage (universal)
                ├─► .deb (Debian/Ubuntu)
                └─► .rpm (RedHat/Fedora)
        │
        ▼
Distribution Packages (dist/)
```

---

## File Structure

### Project Layout

```
qdaria-qrng/
├── scripts/                          # Build automation scripts
│   ├── build_installers.sh           # Main orchestrator (656 lines)
│   ├── macos_bundle.sh              # macOS app bundle config
│   ├── create_icons.sh              # Icon generation utility
│   ├── postinstall.sh               # Post-install configuration
│   ├── preuninstall.sh              # Pre-uninstall cleanup
│   ├── verify_installer_setup.sh    # Setup verification
│   ├── electron-builder.json        # Electron Builder config
│   ├── linux-desktop.template       # Linux desktop entry
│   ├── windows-installer.nsh        # NSIS custom script
│   ├── BUILD_GUIDE.md               # Build instructions (695 lines)
│   └── README.md                    # Quick reference
│
├── src/
│   ├── rust/
│   │   ├── Cargo.toml               # Rust package manifest
│   │   ├── Cargo-bundle.toml        # Bundle configuration
│   │   └── src/                     # Kyber-768 implementation
│   │
│   └── python/
│       ├── ibm_qrng_harvester.py    # Main harvester
│       ├── quantum_entropy_pool.py  # Entropy management
│       └── multi_provider_harvester.py  # Multi-provider support
│
├── docs/
│   ├── INSTALLATION_GUIDE.md        # User installation guide (617 lines)
│   └── INSTALLER_ARCHITECTURE.md    # This document
│
├── config/                           # Default configurations
├── build/                            # Temporary build artifacts (generated)
└── dist/                             # Final installers (generated)
```

### Build Artifacts

```
build/
├── bin/                              # Compiled binaries
│   ├── kyber768                     # Rust binary
│   └── qrng-harvester               # Python executable
│
├── packages/                         # Bundled packages
│   └── zipminator-*.whl             # Zipminator wheel
│
├── venv/                            # Python virtual environment
│
└── [platform-specific]/             # Platform build directories
    ├── QDaria-QRNG.app/             # macOS (if building on macOS)
    ├── AppDir/                      # Linux AppImage structure
    └── rpmbuild/                    # RPM build directory

dist/
├── QDaria-QRNG-{version}-macOS.dmg
├── QDaria-QRNG-{version}-Windows.msi
├── QDaria-QRNG-{version}-x86_64.AppImage
├── qdaria-qrng_{version}_amd64.deb
└── QDaria-QRNG-{version}-1.x86_64.rpm
```

---

## Platform-Specific Details

### macOS (.dmg)

**Architecture**:
```
QDaria-QRNG.dmg
└── QDaria-QRNG.app/
    ├── Contents/
    │   ├── Info.plist              # App metadata
    │   ├── MacOS/                  # Executables
    │   │   ├── qrng-harvester
    │   │   └── kyber768
    │   ├── Resources/              # Icons, assets
    │   │   └── icon.icns
    │   └── Frameworks/             # Dependencies (if needed)
    └── Applications/               # Symlink for drag-install
```

**Build Process**:
1. Build Rust and Python components
2. Create .app bundle structure
3. Copy binaries to Contents/MacOS/
4. Generate Info.plist with bundle metadata
5. Code sign with Developer ID (if available)
6. Create DMG with drag-to-Applications layout
7. Sign DMG (if certificate available)
8. Notarize with Apple (optional, for distribution)

**Security Features**:
- Hardened runtime enabled
- Entitlements for USB and network access
- Gatekeeper compatible
- Notarization support for distribution

**Installation Flow**:
```
User downloads .dmg
    │
    ▼
Mount DMG
    │
    ▼
Drag app to /Applications/
    │
    ▼
First launch: Gatekeeper check
    │
    ▼
Post-install script creates ~/.qdaria/qrng/
```

---

### Windows (.msi)

**Architecture**:
```
QDaria-QRNG.msi (Windows Installer Package)
├── Program Files/QDaria-QRNG/
│   ├── bin/
│   │   ├── qrng-harvester.exe
│   │   └── kyber768.exe
│   ├── config/
│   ├── LICENSE
│   └── README.md
│
├── Start Menu/QDaria QRNG/
│   └── QDaria QRNG.lnk
│
└── Registry Keys:
    ├── HKLM\Software\...\App Paths\qrng-harvester.exe
    └── HKLM\Software\...\Uninstall\QDaria QRNG
```

**Build Process**:
1. Build Rust and Python components (.exe files)
2. Create WiX source file (.wxs)
3. Define installation components
4. Configure registry keys and shortcuts
5. Build MSI with WiX Toolset
6. Sign with Authenticode certificate (if available)
7. Fallback to NSIS if WiX unavailable

**Installation Flow**:
```
User runs .msi installer
    │
    ▼
Windows Installer launches
    │
    ▼
User selects install location
    │
    ▼
Files copied to Program Files/
    │
    ▼
Registry keys created
    │
    ▼
Start Menu shortcuts created
    │
    ▼
PATH updated (optional)
    │
    ▼
Post-install script runs
```

---

### Linux Packages

#### AppImage (Universal)

**Architecture**:
```
QDaria-QRNG-x86_64.AppImage
├── AppRun (launcher script)
├── usr/
│   ├── bin/
│   │   ├── qrng-harvester
│   │   └── kyber768
│   ├── lib/                        # Bundled dependencies
│   └── share/
│       ├── applications/
│       │   └── qdaria-qrng.desktop
│       └── icons/
│           └── qdaria-qrng.png
└── .DirIcon
```

**Features**:
- No installation required
- No dependencies (fully self-contained)
- Runs on any Linux distribution
- Desktop integration available

**Usage**:
```bash
chmod +x QDaria-QRNG-x86_64.AppImage
./QDaria-QRNG-x86_64.AppImage
```

#### .deb (Debian/Ubuntu)

**Architecture**:
```
qdaria-qrng_{version}_amd64.deb
├── DEBIAN/
│   ├── control                     # Package metadata
│   ├── postinst                    # Post-install script
│   └── prerm                       # Pre-removal script
├── usr/
│   ├── bin/
│   │   ├── qrng-harvester
│   │   └── kyber768
│   ├── share/
│   │   ├── applications/
│   │   │   └── qdaria-qrng.desktop
│   │   └── doc/qdaria-qrng/
│   │       └── copyright
└── var/
    └── lib/dpkg/
```

**Installation**:
```bash
sudo dpkg -i qdaria-qrng_0.1.0_amd64.deb
sudo apt-get install -f  # Resolve dependencies
```

#### .rpm (RedHat/Fedora)

**Architecture**:
```
QDaria-QRNG-{version}-1.x86_64.rpm
├── /usr/bin/
│   ├── qrng-harvester
│   └── kyber768
├── /usr/share/applications/
│   └── qdaria-qrng.desktop
└── RPM metadata (stored in RPM database)
```

**Installation**:
```bash
sudo dnf install QDaria-QRNG-0.1.0-1.x86_64.rpm
# or
sudo rpm -i QDaria-QRNG-0.1.0-1.x86_64.rpm
```

---

## Build Dependencies

### Core Requirements (All Platforms)

| Tool | Version | Purpose |
|------|---------|---------|
| Rust | 1.70+ | Kyber-768 compilation |
| cargo-bundle | latest | Platform-specific bundling |
| Python | 3.8+ | QRNG harvester |
| PyInstaller | 5.0+ | Python binary creation |
| Node.js | 18+ | Electron Builder (optional) |

### Platform-Specific Requirements

#### macOS
| Tool | Purpose | Required |
|------|---------|----------|
| Xcode Command Line Tools | C compiler | Yes |
| create-dmg | DMG creation | Optional |
| Developer ID Certificate | Code signing | Optional |
| notarytool | App notarization | Optional |

#### Windows
| Tool | Purpose | Required |
|------|---------|----------|
| Visual Studio Build Tools | C compiler | Yes |
| WiX Toolset 3.11+ | MSI creation | Recommended |
| NSIS 3.0+ | Fallback installer | Optional |
| Authenticode Certificate | Code signing | Optional |

#### Linux
| Tool | Purpose | Required |
|------|---------|----------|
| build-essential | C compiler | Yes |
| libssl-dev | Crypto libraries | Yes |
| libusb-1.0-0-dev | USB support | Yes |
| dpkg-deb | .deb creation | Optional |
| rpmbuild | .rpm creation | Optional |
| appimagetool | AppImage creation | Auto-downloaded |

---

## Build Process

### High-Level Workflow

```
1. Dependency Check
   ├─► Verify Rust toolchain
   ├─► Verify Python 3.8+
   ├─► Verify Node.js
   └─► Check platform-specific tools

2. Component Build
   ├─► Rust: cargo build --release
   │         └─► kyber768 binary (1.2MB)
   │
   └─► Python: pyinstaller --onefile
             └─► qrng-harvester (~20MB with dependencies)

3. Zipminator Bundle
   └─► Build Python wheel (~500KB)

4. Platform Bundling
   ├─► macOS: .app + .dmg (~30MB)
   ├─► Windows: .msi (~25MB)
   └─► Linux: AppImage (~25MB), .deb (~8MB), .rpm (~8MB)

5. Code Signing (Optional)
   ├─► macOS: codesign + notarytool
   └─► Windows: signtool

6. Verification
   └─► Test installation on target platform
```

### Command Execution

```bash
# Build all platforms
./scripts/build_installers.sh all

# Execution flow:
build_installers.sh
  │
  ├─► detect_platform()
  ├─► check_dependencies(platform)
  │
  ├─► build_rust()
  │     └─► cd src/rust && cargo build --release
  │
  ├─► build_python()
  │     └─► pyinstaller --onefile src/python/ibm_qrng_harvester.py
  │
  ├─► bundle_zipminator()
  │     └─► cd zipminator && python -m build
  │
  └─► Platform-specific builds:
        ├─► build_macos_dmg()
        ├─► build_windows_msi()
        ├─► build_linux_appimage()
        ├─► build_linux_deb()
        └─► build_linux_rpm()
```

---

## Code Signing

### macOS Code Signing

**Requirements**:
- Apple Developer ID Application certificate
- Private key in Keychain
- App-specific password for notarization

**Process**:
```bash
# 1. Sign app bundle
codesign --force --sign "Developer ID Application: Company Name" \
    --deep --timestamp --options runtime \
    --entitlements build/entitlements.plist \
    build/QDaria-QRNG.app

# 2. Verify signature
codesign -dvv build/QDaria-QRNG.app
spctl -a -vvv build/QDaria-QRNG.app

# 3. Create DMG
# ... (DMG creation)

# 4. Sign DMG
codesign --force --sign "Developer ID Application: Company Name" \
    dist/QDaria-QRNG-0.1.0-macOS.dmg

# 5. Notarize
xcrun notarytool submit dist/QDaria-QRNG-0.1.0-macOS.dmg \
    --apple-id "developer@example.com" \
    --team-id "TEAM_ID" \
    --password "app-specific-password" \
    --wait

# 6. Staple notarization ticket
xcrun stapler staple dist/QDaria-QRNG-0.1.0-macOS.dmg
```

**Entitlements** (`build/entitlements.plist`):
```xml
<key>com.apple.security.app-sandbox</key>
<true/>
<key>com.apple.security.network.client</key>
<true/>
<key>com.apple.security.device.usb</key>
<true/>
```

### Windows Code Signing

**Requirements**:
- Code signing certificate (.pfx file)
- Certificate password
- signtool (Windows SDK)

**Process**:
```powershell
# Sign MSI
signtool sign /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 `
    /f "path\to\certificate.pfx" /p "password" `
    dist\QDaria-QRNG-0.1.0-Windows.msi

# Verify signature
signtool verify /pa dist\QDaria-QRNG-0.1.0-Windows.msi
```

---

## Post-Installation

### Configuration Setup

The `postinstall.sh` script (executed after installation) performs:

1. **Create configuration directory**:
   ```bash
   mkdir -p ~/.qdaria/qrng
   chmod 700 ~/.qdaria/qrng
   ```

2. **Generate default config**:
   ```yaml
   # ~/.qdaria/qrng/config.yaml
   providers:
     ibm:
       enabled: false
     qbraid:
       enabled: false
     azure:
       enabled: false
   ```

3. **Set permissions**:
   ```bash
   chmod 600 ~/.qdaria/qrng/config.yaml
   ```

4. **Create log directory**:
   ```bash
   mkdir -p ~/.qdaria/qrng/logs
   ```

### User Configuration Required

After installation, users must:

1. Edit `~/.qdaria/qrng/config.yaml`
2. Add quantum provider credentials
3. Enable desired providers
4. Run `qrng-harvester test` to verify

---

## Distribution

### Release Process

1. **Build all platforms**:
   ```bash
   ./scripts/build_installers.sh all
   ```

2. **Verify installers**:
   - Test on target platforms
   - Verify signatures
   - Check functionality

3. **Create GitHub Release**:
   ```bash
   gh release create v0.1.0 \
       dist/QDaria-QRNG-0.1.0-macOS.dmg \
       dist/QDaria-QRNG-0.1.0-Windows.msi \
       dist/QDaria-QRNG-0.1.0-x86_64.AppImage \
       dist/qdaria-qrng_0.1.0_amd64.deb \
       dist/QDaria-QRNG-0.1.0-1.x86_64.rpm
   ```

4. **Package repositories**:
   - Homebrew (macOS): Create formula
   - Chocolatey (Windows): Submit package
   - AUR (Arch Linux): Publish PKGBUILD

### Distribution Channels

| Platform | Channel | Command |
|----------|---------|---------|
| macOS | Direct Download | Download .dmg |
| macOS | Homebrew | `brew install qdaria/tap/qrng` |
| Windows | Direct Download | Download .msi |
| Windows | Chocolatey | `choco install qdaria-qrng` |
| Linux | Direct Download | Download AppImage/.deb/.rpm |
| Linux | APT (Ubuntu/Debian) | `sudo apt install qdaria-qrng` |
| Linux | DNF (Fedora) | `sudo dnf install qdaria-qrng` |
| Linux | AUR (Arch) | `yay -S qdaria-qrng` |

---

## Quality Attributes

### Non-Functional Requirements

| Attribute | Target | Implementation |
|-----------|--------|---------------|
| **Portability** | Run on macOS 10.13+, Windows 10+, Linux (kernel 4.4+) | Platform-specific installers |
| **Security** | Code signing, secure defaults | Developer ID, Authenticode |
| **Usability** | One-click installation | GUI installers, post-install config |
| **Maintainability** | Modular build scripts | Separation of concerns |
| **Performance** | <5 minute build time | Parallel builds, cached deps |
| **Reliability** | 99% build success rate | Dependency verification |

### Security Considerations

1. **Code Signing**: All binaries signed with trusted certificates
2. **Sandboxing**: macOS app sandbox enabled
3. **Permissions**: Minimal required permissions (USB, network)
4. **Dependencies**: Vendored or verified from official sources
5. **Configuration**: Secure defaults, sensitive data in user config
6. **Updates**: Support for signed updates

---

## Testing

### Pre-Release Checklist

- [ ] Build succeeds on all platforms
- [ ] Installers launch without errors
- [ ] Code signatures verify correctly
- [ ] Post-install script succeeds
- [ ] Configuration file created
- [ ] Binaries execute successfully
- [ ] Quantum providers connect
- [ ] Uninstallation removes all files
- [ ] No sensitive data in installers
- [ ] Documentation accurate and complete

### Platform Testing

#### macOS
```bash
# Install from DMG
open dist/QDaria-QRNG-0.1.0-macOS.dmg
# Drag to Applications
/Applications/QDaria-QRNG.app/Contents/MacOS/qrng-harvester --version

# Verify signature
codesign -dvv /Applications/QDaria-QRNG.app
spctl -a -vvv /Applications/QDaria-QRNG.app
```

#### Windows
```powershell
# Install MSI
msiexec /i dist\QDaria-QRNG-0.1.0-Windows.msi

# Test
& "C:\Program Files\QDaria-QRNG\bin\qrng-harvester.exe" --version

# Verify signature
Get-AuthenticodeSignature "C:\Program Files\QDaria-QRNG\bin\qrng-harvester.exe"
```

#### Linux
```bash
# Test AppImage
chmod +x dist/QDaria-QRNG-0.1.0-x86_64.AppImage
./dist/QDaria-QRNG-0.1.0-x86_64.AppImage --version

# Test .deb
sudo dpkg -i dist/qdaria-qrng_0.1.0_amd64.deb
qrng-harvester --version

# Test .rpm
sudo rpm -i dist/QDaria-QRNG-0.1.0-1.x86_64.rpm
qrng-harvester --version
```

---

## Troubleshooting

### Build Failures

| Error | Cause | Solution |
|-------|-------|----------|
| `cargo: command not found` | Rust not installed | Install from https://rustup.rs/ |
| `python3: command not found` | Python not installed | Install Python 3.8+ |
| `error: linking with cc failed` | Missing compiler | Install Xcode CLT (macOS) or build-essential (Linux) |
| `Could not find libssl` | Missing OpenSSL | Install libssl-dev (Linux) or openssl (macOS) |
| `WiX not found` | WiX not installed | Install WiX Toolset (Windows) |

### Runtime Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "App is damaged" (macOS) | Gatekeeper quarantine | `xattr -cr /Applications/QDaria-QRNG.app` |
| "Windows protected your PC" | Unsigned installer | Click "More info" → "Run anyway" |
| AppImage won't run (Linux) | Missing FUSE | Install fuse/libfuse2 |
| Permission denied | Not executable | `chmod +x [file]` |

---

## Future Enhancements

### Roadmap

1. **Auto-updates**: Implement in-app update mechanism
2. **GUI Installer**: Electron-based GUI for all platforms
3. **Cloud Distribution**: Hosted installers with automatic versioning
4. **CI/CD Integration**: Automated builds on tag/release
5. **Multi-architecture**: ARM64 support for all platforms
6. **Containerization**: Docker images for development
7. **Compliance**: FIPS 140-2 validated builds

### Known Limitations

- Windows builds require Windows platform (no cross-compilation)
- Code signing requires paid developer certificates
- Notarization requires Apple Developer Program membership
- RPM builds require rpmbuild tool (Fedora/RHEL)

---

## References

### Documentation
- [BUILD_GUIDE.md](../scripts/BUILD_GUIDE.md) - Detailed build instructions
- [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md) - End-user installation guide
- [README.md](../scripts/README.md) - Quick reference

### External Resources
- [cargo-bundle](https://github.com/burtonageo/cargo-bundle)
- [PyInstaller](https://pyinstaller.org/)
- [Electron Builder](https://www.electron.build/)
- [WiX Toolset](https://wixtoolset.org/)
- [AppImage](https://appimage.org/)
- [Apple Code Signing](https://developer.apple.com/support/code-signing/)

---

## Contact

- **Project**: QDaria QRNG
- **Repository**: https://github.com/QDaria/qrng
- **Issues**: https://github.com/QDaria/qrng/issues
- **Email**: support@qdaria.com
- **Documentation**: https://docs.qdaria.com/qrng

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-31
**Maintainer**: QDaria Development Team
