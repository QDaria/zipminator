# QDaria QRNG Installation Guide

Complete guide for installing QDaria QRNG on macOS, Windows, and Linux platforms.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Quick Install](#quick-install)
3. [Platform-Specific Installation](#platform-specific-installation)
4. [Building from Source](#building-from-source)
5. [Configuration](#configuration)
6. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements

- **CPU**: 64-bit processor (x86_64 or ARM64)
- **RAM**: 4 GB (8 GB recommended)
- **Storage**: 500 MB free space
- **OS**:
  - macOS 10.13+ (High Sierra or later)
  - Windows 10/11 (64-bit)
  - Linux kernel 4.4+ (Ubuntu 18.04+, Fedora 28+, Debian 10+)

### Software Dependencies

- Python 3.8 or later
- OpenSSL 1.1+ or 3.0+
- libusb 1.0 (for USB QRNG devices)

### Optional Requirements

- IBM Quantum account (for IBM provider)
- QBraid account (for QBraid provider)
- Azure Quantum subscription (for Azure provider)

---

## Quick Install

### macOS

```bash
# Download and install DMG
curl -LO https://github.com/QDaria/qrng/releases/latest/download/QDaria-QRNG-macOS.dmg
open QDaria-QRNG-macOS.dmg

# Or use Homebrew
brew install qdaria/tap/qrng
```

### Windows

```powershell
# Download and run MSI installer
Invoke-WebRequest -Uri https://github.com/QDaria/qrng/releases/latest/download/QDaria-QRNG-Windows.msi -OutFile qrng-installer.msi
Start-Process msiexec.exe -Wait -ArgumentList '/i qrng-installer.msi /quiet'

# Or use Chocolatey
choco install qdaria-qrng
```

### Linux

```bash
# Ubuntu/Debian - .deb package
wget https://github.com/QDaria/qrng/releases/latest/download/qdaria-qrng_amd64.deb
sudo dpkg -i qdaria-qrng_amd64.deb
sudo apt-get install -f  # Install dependencies

# Fedora/RHEL - .rpm package
wget https://github.com/QDaria/qrng/releases/latest/download/QDaria-QRNG-x86_64.rpm
sudo dnf install QDaria-QRNG-x86_64.rpm

# Universal - AppImage (no installation required)
wget https://github.com/QDaria/qrng/releases/latest/download/QDaria-QRNG-x86_64.AppImage
chmod +x QDaria-QRNG-x86_64.AppImage
./QDaria-QRNG-x86_64.AppImage
```

---

## Platform-Specific Installation

### macOS Detailed Installation

#### Option 1: DMG Installer (Recommended)

1. **Download the DMG**:
   ```bash
   curl -LO https://github.com/QDaria/qrng/releases/latest/download/QDaria-QRNG-macOS.dmg
   ```

2. **Mount and Install**:
   - Double-click the DMG file
   - Drag "QDaria-QRNG.app" to the Applications folder
   - Eject the DMG

3. **First Launch**:
   ```bash
   # If you see "App cannot be opened" security warning:
   xattr -cr /Applications/QDaria-QRNG.app

   # Then open from Applications or:
   open /Applications/QDaria-QRNG.app
   ```

4. **Add to PATH** (optional):
   ```bash
   echo 'export PATH="/Applications/QDaria-QRNG.app/Contents/MacOS:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

#### Option 2: Homebrew

```bash
# Add QDaria tap
brew tap qdaria/tap

# Install
brew install qrng

# Verify installation
qrng-harvester --version
```

#### Code Signing Notes

The macOS application is code-signed for security. If you see Gatekeeper warnings:

```bash
# Allow the application
sudo spctl --add /Applications/QDaria-QRNG.app

# Or disable Gatekeeper for this app (less secure)
sudo xattr -rd com.apple.quarantine /Applications/QDaria-QRNG.app
```

---

### Windows Detailed Installation

#### Option 1: MSI Installer (Recommended)

1. **Download the MSI**:
   - Visit: https://github.com/QDaria/qrng/releases/latest
   - Download: `QDaria-QRNG-Windows.msi`

2. **Run Installer**:
   - Double-click the MSI file
   - Follow the installation wizard
   - Choose installation directory (default: `C:\Program Files\QDaria-QRNG`)
   - Select Start Menu shortcuts

3. **Verify Installation**:
   ```powershell
   # Open PowerShell and run:
   qrng-harvester --version
   ```

4. **Add to PATH** (if not automatic):
   ```powershell
   # Add to system PATH
   [Environment]::SetEnvironmentVariable(
       "Path",
       [Environment]::GetEnvironmentVariable("Path", "Machine") + ";C:\Program Files\QDaria-QRNG\bin",
       "Machine"
   )
   ```

#### Option 2: Portable Version

```powershell
# Download portable ZIP
Invoke-WebRequest -Uri https://github.com/QDaria/qrng/releases/latest/download/QDaria-QRNG-Windows-Portable.zip -OutFile qrng-portable.zip

# Extract
Expand-Archive -Path qrng-portable.zip -DestinationPath C:\Tools\QDaria-QRNG

# Run without installation
C:\Tools\QDaria-QRNG\qrng-harvester.exe --version
```

#### Option 3: Chocolatey

```powershell
# Install Chocolatey (if not installed)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

# Install QDaria QRNG
choco install qdaria-qrng
```

#### Windows Defender Notes

If Windows Defender blocks the installer:

1. Right-click the file → Properties → Unblock
2. Or temporarily disable real-time protection during installation

---

### Linux Detailed Installation

#### Ubuntu/Debian (.deb)

```bash
# Download .deb package
wget https://github.com/QDaria/qrng/releases/latest/download/qdaria-qrng_amd64.deb

# Install with dependencies
sudo apt update
sudo apt install ./qdaria-qrng_amd64.deb

# Verify installation
qrng-harvester --version

# Optional: Install Python dependencies globally
sudo apt install python3-pip python3-venv
pip3 install qiskit qiskit-ibm-runtime
```

#### Fedora/RHEL (.rpm)

```bash
# Download .rpm package
wget https://github.com/QDaria/qrng/releases/latest/download/QDaria-QRNG-x86_64.rpm

# Install with dependencies (Fedora)
sudo dnf install QDaria-QRNG-x86_64.rpm

# Install with dependencies (RHEL/CentOS)
sudo yum install QDaria-QRNG-x86_64.rpm

# Verify installation
qrng-harvester --version
```

#### Universal AppImage

```bash
# Download AppImage
wget https://github.com/QDaria/qrng/releases/latest/download/QDaria-QRNG-x86_64.AppImage

# Make executable
chmod +x QDaria-QRNG-x86_64.AppImage

# Run (no installation needed)
./QDaria-QRNG-x86_64.AppImage --help

# Optional: Integrate with system
./QDaria-QRNG-x86_64.AppImage --appimage-integrate

# Optional: Create symlink
sudo ln -s "$(pwd)/QDaria-QRNG-x86_64.AppImage" /usr/local/bin/qrng-harvester
```

#### Arch Linux (AUR)

```bash
# Using yay
yay -S qdaria-qrng

# Or using makepkg
git clone https://aur.archlinux.org/qdaria-qrng.git
cd qdaria-qrng
makepkg -si
```

---

## Building from Source

### Prerequisites

Install the required tools:

**macOS:**
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Node.js
brew install node

# Install create-dmg
npm install -g create-dmg
```

**Windows:**
```powershell
# Install Rust
Invoke-WebRequest -Uri https://win.rustup.rs -OutFile rustup-init.exe
.\rustup-init.exe

# Install Node.js
winget install OpenJS.NodeJS

# Install WiX Toolset
winget install WiXToolset.WiX

# Install Visual Studio Build Tools
winget install Microsoft.VisualStudio.2022.BuildTools
```

**Linux:**
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Ubuntu/Debian
sudo apt update
sudo apt install build-essential pkg-config libssl-dev libusb-1.0-0-dev \
                 python3-dev python3-pip nodejs npm \
                 dpkg-dev rpm fakeroot

# Fedora
sudo dnf groupinstall "Development Tools"
sudo dnf install openssl-devel libusb-devel python3-devel nodejs npm rpm-build

# Install AppImage tools
wget https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage
chmod +x appimagetool-x86_64.AppImage
sudo mv appimagetool-x86_64.AppImage /usr/local/bin/appimagetool
```

### Build All Installers

```bash
# Clone repository
git clone https://github.com/QDaria/qrng.git
cd qrng

# Install cargo-bundle
cargo install cargo-bundle

# Install Python dependencies
pip3 install -r requirements_ibm_harvester.txt
pip3 install pyinstaller

# Build all installers
chmod +x scripts/build_installers.sh
./scripts/build_installers.sh all

# Installers will be in: dist/
```

### Build Platform-Specific

```bash
# macOS only
./scripts/build_installers.sh macos

# Windows only (requires Windows or cross-compilation)
./scripts/build_installers.sh windows

# Linux only
./scripts/build_installers.sh linux

# Clean build artifacts
./scripts/build_installers.sh clean
```

---

## Configuration

### Initial Setup

After installation, configure your quantum providers:

```bash
# Create configuration directory
mkdir -p ~/.qdaria/qrng

# Edit configuration
nano ~/.qdaria/qrng/config.yaml
```

### Configuration File

```yaml
# ~/.qdaria/qrng/config.yaml

providers:
  ibm:
    enabled: true
    token: "YOUR_IBM_QUANTUM_TOKEN"
    backend: "ibm_brisbane"

  qbraid:
    enabled: false
    api_key: "YOUR_QBRAID_API_KEY"

  azure:
    enabled: false
    subscription_id: "YOUR_SUBSCRIPTION_ID"
    resource_group: "YOUR_RESOURCE_GROUP"
    workspace: "YOUR_WORKSPACE"

harvesting:
  auto_optimize: true
  batch_size: 1000
  max_retries: 3
  save_entropy: true
  output_dir: "~/.qdaria/qrng/entropy"

security:
  use_kyber768: true
  entropy_pool_size: 10000
  auto_backup: true

logging:
  level: INFO
  file: ~/.qdaria/qrng/qrng.log
  max_size: 10M
  backup_count: 5
```

### Environment Variables

Alternative to config file:

```bash
# IBM Quantum
export IBM_QUANTUM_TOKEN="your_token_here"

# QBraid
export QBRAID_API_KEY="your_api_key_here"

# Azure Quantum
export AZURE_QUANTUM_SUBSCRIPTION_ID="your_subscription_id"
export AZURE_QUANTUM_RESOURCE_GROUP="your_resource_group"
export AZURE_QUANTUM_WORKSPACE="your_workspace"
```

### Verify Configuration

```bash
# Test connection to IBM Quantum
qrng-harvester test --provider ibm

# Harvest 100 random numbers
qrng-harvester harvest --count 100 --provider ibm

# Check entropy pool status
qrng-harvester status
```

---

## Troubleshooting

### macOS Issues

**Issue: "App is damaged and can't be opened"**
```bash
# Solution: Remove quarantine attribute
xattr -cr /Applications/QDaria-QRNG.app
```

**Issue: "Command not found: qrng-harvester"**
```bash
# Solution: Add to PATH
export PATH="/Applications/QDaria-QRNG.app/Contents/MacOS:$PATH"
```

### Windows Issues

**Issue: "Windows protected your PC"**
```
Solution: Click "More info" → "Run anyway"
Or: Right-click installer → Properties → Unblock → OK
```

**Issue: Python not found**
```powershell
# Solution: Install Python
winget install Python.Python.3.11

# Add to PATH
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Python311\Scripts", "User")
```

### Linux Issues

**Issue: AppImage won't run**
```bash
# Solution: Install FUSE
sudo apt install fuse libfuse2  # Ubuntu/Debian
sudo dnf install fuse fuse-libs  # Fedora
```

**Issue: Missing dependencies**
```bash
# Ubuntu/Debian
sudo apt install libssl3 libusb-1.0-0 python3

# Fedora
sudo dnf install openssl-libs libusb python3
```

**Issue: Permission denied**
```bash
# Solution: Fix permissions
chmod +x /path/to/QDaria-QRNG-x86_64.AppImage
```

### Common Issues

**Issue: IBM Quantum authentication fails**
```bash
# Verify token
qrng-harvester test --provider ibm --verbose

# Check token format (should be ~200 characters)
echo $IBM_QUANTUM_TOKEN | wc -c
```

**Issue: Low entropy quality**
```bash
# Check backend status
qrng-harvester backends --provider ibm

# Use different backend
qrng-harvester harvest --backend ibm_kyiv
```

**Issue: Rate limiting**
```bash
# Enable auto-optimization
qrng-harvester harvest --auto-optimize

# Or manually set delay
qrng-harvester harvest --delay 5
```

---

## Next Steps

1. **Test Installation**:
   ```bash
   qrng-harvester --version
   qrng-harvester test --provider ibm
   ```

2. **Read Documentation**:
   - User Guide: `docs/USER_GUIDE.md`
   - API Reference: `docs/API_REFERENCE.md`
   - Examples: `examples/`

3. **Join Community**:
   - GitHub Discussions: https://github.com/QDaria/qrng/discussions
   - Issue Tracker: https://github.com/QDaria/qrng/issues

---

## Uninstallation

### macOS
```bash
# Remove application
rm -rf /Applications/QDaria-QRNG.app

# Remove configuration (optional)
rm -rf ~/.qdaria/qrng

# Homebrew
brew uninstall qrng
```

### Windows
```powershell
# Use Windows Settings → Apps → QDaria QRNG → Uninstall
# Or use command line:
msiexec /x {PRODUCT_CODE} /quiet

# Remove configuration (optional)
Remove-Item -Recurse -Force "$env:USERPROFILE\.qdaria\qrng"

# Chocolatey
choco uninstall qdaria-qrng
```

### Linux
```bash
# Ubuntu/Debian
sudo apt remove qdaria-qrng

# Fedora/RHEL
sudo dnf remove qdaria-qrng

# AppImage
rm /usr/local/bin/qrng-harvester
rm QDaria-QRNG-x86_64.AppImage

# Remove configuration (optional)
rm -rf ~/.qdaria/qrng
```

---

## Support

For installation support:
- Email: support@qdaria.com
- Documentation: https://docs.qdaria.com/qrng
- GitHub Issues: https://github.com/QDaria/qrng/issues
