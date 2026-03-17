# Zipminator Package Configurations

Complete installation package configurations for Zipminator - Quantum-safe cryptography CLI with NIST Kyber768 and IBM QRNG.

## Overview

This directory contains all package definitions and configurations needed to distribute Zipminator across multiple platforms and package managers.

```
Zipminator is available via:
┌─────────────────────────────────────────────────────────┐
│ pip install zipminator-pqc                 (Python)     │
│ cargo install zipminator                   (Rust)       │
│ brew install zipminator                    (macOS)      │
│ npm install -g @qdaria/zipminator          (Node.js)    │
│ docker pull qdaria/zipminator              (Container)  │
│ bash scripts/install.sh                    (Direct)     │
└─────────────────────────────────────────────────────────┘
```

---

## Package Configurations

### PyPI (Python Package Index)

**File:** `pyproject.toml`

Modern Python package definition using PEP 517 with Maturin for Rust extension support.

```bash
# Installation
pip install zipminator-pqc

# With optional development dependencies
pip install zipminator-pqc[dev]

# With documentation dependencies
pip install zipminator-pqc[docs]
```

**Configuration highlights:**
- Python 3.8+ support
- Maturin build backend for Rust integration
- Multiple classifiers for package discovery
- Optional dependencies for development and documentation
- CLI entry point configuration

**Dependencies:**
```
cryptography>=41.0.0
click>=8.0.0
```

---

### Cargo (Rust Package Manager)

**File:** `Cargo-cli.toml`

Rust CLI application manifest for crates.io.

```bash
# Installation
cargo install zipminator

# Development
cargo build --release
./target/release/zipminator --help
```

**Configuration highlights:**
- Edition 2021 (latest Rust features)
- CLI framework: clap with full features
- Cryptography: SHA3, subtle, getrandom
- Async support: tokio with full features
- Release profile with LTO and stripping

**Key dependencies:**
```
clap = { version = "4.4", features = ["derive", "cargo", "env"] }
tokio = { version = "1.40", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
```

---

### Homebrew (macOS Package Manager)

**File:** `zipminator.rb`

Homebrew formula for native macOS installation.

```bash
# Setup tap
brew tap qdaria/zipminator https://github.com/qdaria/homebrew-zipminator

# Install
brew install zipminator

# Update
brew upgrade zipminator

# Uninstall
brew uninstall zipminator
```

**Configuration highlights:**
- Source compilation from releases
- Rust build dependency
- sha256 checksum verification
- Automated test suite
- Support for both Intel and Apple Silicon

**Tap setup:**
```bash
# Create tap repository
bash scripts/setup-brew-tap.sh

# Publish to GitHub
cd homebrew-zipminator
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/qdaria/homebrew-zipminator
git push -u origin main
```

---

### NPM (Node.js Package Manager)

**File:** `npm-package.json`

JavaScript package wrapper for Rust binary distribution.

```bash
# Installation
npm install -g @qdaria/zipminator

# Verify
zipminator --version

# Update
npm update -g @qdaria/zipminator
```

**Configuration highlights:**
- Cross-platform binary distribution
- Platform-specific subpackages for auto-selection
- Post-install script auto-downloads binary
- Node.js 16+ support
- Supports: macOS, Linux, Windows (x64, ARM64)

**Platform support matrix:**
```
macOS:  x86_64-apple-darwin, aarch64-apple-darwin
Linux:  x86_64-unknown-linux-gnu, aarch64-unknown-linux-gnu
Windows: x86_64-pc-windows-msvc
```

---

### Docker

**Files:** `Dockerfile`, `docker-compose.yml`, `.dockerignore`

Container images for isolated deployment.

#### Using Docker

```bash
# Pull official image
docker pull qdaria/zipminator:latest

# Run with help
docker run qdaria/zipminator --help

# Run with volume
docker run -v $(pwd):/app/data qdaria/zipminator:latest

# Build locally
docker build -f config/Dockerfile -t zipminator:local .
```

#### Using Docker Compose

```bash
# Start service
docker-compose -f config/docker-compose.yml up -d

# View logs
docker-compose -f config/docker-compose.yml logs -f

# Stop service
docker-compose -f config/docker-compose.yml down
```

**Dockerfile features:**
- Multi-stage build (builder + runtime)
- Alpine Linux base (minimal size)
- Non-root user for security
- Health checks
- Volume support
- Resource limits
- Comprehensive metadata labels

**Docker Compose features:**
- Service definition
- Resource constraints (2 CPU, 2GB memory)
- Volume mounts
- Network configuration
- Logging with rotation
- Environment variables
- Restart policy

---

## Supporting Files

### Python Build Configuration

**setup.cfg**
- Legacy setuptools configuration
- Entry points definition
- Metadata specifications
- Optional dependency groups

**MANIFEST.in**
- Python package file inclusion rules
- Excludes temporary and build files
- Includes documentation and examples

### Installation Scripts

**scripts/install.sh** (POSIX - Linux/macOS)
```bash
# Simple installation
bash scripts/install.sh

# Installation to custom path
bash scripts/install.sh --prefix ~/.local/bin
```

Features:
- Automatic platform detection
- Binary download and verification
- PATH configuration
- User-friendly colored output

**scripts/install.ps1** (PowerShell - Windows)
```powershell
# Simple installation
powershell -ExecutionPolicy Bypass -File scripts/install.ps1

# Installation for current user
powershell -ExecutionPolicy Bypass -File scripts/install.ps1 -CurrentUser

# Custom installation prefix
powershell -ExecutionPolicy Bypass -File scripts/install.ps1 -Prefix "C:\Tools"
```

Features:
- Automatic architecture detection
- Binary download
- PATH configuration (system or user)
- Administrator detection

### npm Post-Install Script

**npm-install-binary.js**
- Automatically downloads correct binary for platform
- Verifies checksums
- Makes binary executable
- Handles platform-specific naming

### GitHub Actions Workflow

**config/.github-workflows-release.yml**

Automated CI/CD pipeline for releasing:
- Multi-platform binary compilation (Linux x64/ARM64, macOS x64/ARM64, Windows x64)
- GitHub Releases with asset uploads
- Docker image publishing
- PyPI package publishing
- npm package publishing

---

## Installation Guide

Refer to `installation-guide.md` for:
- Quick start by platform
- Platform-specific detailed instructions
- Language-specific installation methods
- Verification procedures
- Troubleshooting
- Security verification
- Updating and uninstalling

---

## Version Management

### Current Release
- **Version:** 0.1.0 (Beta)
- **Repository:** https://github.com/qdaria/zipminator

### Update Workflow

1. **Update version in all files:**
   ```bash
   # Edit these files with new version:
   config/pyproject.toml
   config/Cargo-cli.toml
   config/npm-package.json
   config/zipminator.rb
   config/Dockerfile (via ARG VERSION)
   ```

2. **Create git tag:**
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

3. **GitHub Actions automatically:**
   - Builds binaries for all platforms
   - Creates GitHub Release
   - Uploads release assets
   - Publishes to PyPI
   - Publishes to crates.io
   - Pushes to Docker Hub
   - Publishes to npm

---

## Package Repositories

### Public Package Locations

| Platform | URL | Command |
|----------|-----|---------|
| **PyPI** | https://pypi.org/project/zipminator-pqc/ | `pip install zipminator-pqc` |
| **crates.io** | https://crates.io/crates/zipminator | `cargo install zipminator` |
| **Homebrew** | qdaria/zipminator | `brew tap qdaria/zipminator` |
| **npm** | https://www.npmjs.com/package/@qdaria/zipminator | `npm install -g @qdaria/zipminator` |
| **Docker Hub** | qdaria/zipminator | `docker pull qdaria/zipminator` |
| **GitHub Releases** | https://github.com/qdaria/zipminator/releases | Direct binary download |

---

## Security Considerations

### Build Security
- All binaries built in GitHub Actions (transparent CI)
- Source code publicly available
- Build logs accessible
- Reproducible builds

### Package Security
- Checksum verification available
- Optional GPG signing
- Dependency pinning
- Vulnerability scanning

### Runtime Security
- Non-root Docker user
- No hardcoded secrets
- No network access (by default)
- Optional sandboxing available

---

## File Organization

```
/Users/mos/dev/zipminator/
├── config/
│   ├── README.md (this file)
│   ├── PACKAGE-CONFIGS-INDEX.md
│   ├── package-configurations-summary.md
│   │
│   ├── pyproject.toml
│   ├── setup.cfg
│   ├── MANIFEST.in
│   │
│   ├── Cargo-cli.toml
│   ├── zipminator.rb
│   ├── setup-brew-tap.sh
│   │
│   ├── npm-package.json
│   ├── npm-install-binary.js
│   │
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── .dockerignore
│   │
│   ├── .github-workflows-release.yml
│   ├── installation-guide.md
│   │
│   └── (other existing config files)
│
├── scripts/
│   ├── install.sh (POSIX installer)
│   ├── install.ps1 (PowerShell installer)
│   └── (other scripts)
│
├── src/
│   ├── rust/
│   │   └── Cargo.toml
│   ├── python/
│   └── cpp/
│
└── (other project directories)
```

---

## Quick Start Examples

### Install via pip (Python)
```bash
pip install zipminator-pqc
zipminator --version
```

### Install via Homebrew (macOS)
```bash
brew tap qdaria/zipminator https://github.com/qdaria/homebrew-zipminator
brew install zipminator
zipminator --version
```

### Install via Cargo (Rust)
```bash
cargo install zipminator
zipminator --version
```

### Install via npm (Node.js)
```bash
npm install -g @qdaria/zipminator
zipminator --version
```

### Run via Docker
```bash
docker run qdaria/zipminator --version
```

### Direct installation (Linux/macOS)
```bash
bash scripts/install.sh
zipminator --version
```

---

## Configuration Details

### Environment Variables

**PyPI/pip:**
```bash
RUST_BACKTRACE=1 pip install zipminator-pqc
```

**Cargo:**
```bash
RUST_LOG=debug cargo install zipminator
```

**Docker:**
```bash
docker run -e RUST_LOG=info qdaria/zipminator --help
```

### Build Features

**Cargo features:**
```toml
default = ["vendored"]
vendored = []     # Vendored dependencies
async = []        # Async support
```

**Python extras:**
```bash
pip install zipminator-pqc[dev]   # Development tools
pip install zipminator-pqc[docs]  # Documentation tools
```

---

## Maintenance

### Update Checklist

- [ ] Update version numbers in all config files
- [ ] Update checksums in Homebrew formula
- [ ] Test installation via each method
- [ ] Create git tag
- [ ] Push tag to trigger CI/CD
- [ ] Verify releases on all repositories
- [ ] Update documentation
- [ ] Announce release

### Testing Before Release

```bash
# Test PyPI
pip install --index-url https://test.pypi.org/simple/ zipminator-pqc

# Test Cargo
cargo install zipminator --git https://github.com/qdaria/zipminator

# Test Homebrew
brew install --head qdaria/zipminator/zipminator

# Test Docker
docker build -f config/Dockerfile -t zipminator:test .
docker run zipminator:test --version
```

---

## Troubleshooting

### Installation fails with "command not found"
- Verify installation path is in $PATH
- Check installation logs for errors
- Try manual installation from GitHub Releases

### Build fails with Rust error
```bash
# Update Rust
rustup update

# Clean and rebuild
cargo clean
cargo build --release
```

### Docker build fails
```bash
# Update Docker
docker pull alpine:latest
docker build --no-cache -f config/Dockerfile -t zipminator:local .
```

### See full troubleshooting guide in `installation-guide.md`

---

## Support

- **Documentation:** https://docs.qdaria.com/zipminator
- **Issues:** https://github.com/qdaria/zipminator/issues
- **Security:** security@qdaria.com
- **Email:** hello@qdaria.com

---

## License

All configurations are licensed under the MIT License, matching the Zipminator project.

See [LICENSE](../../LICENSE) for details.

---

## Summary

This directory provides complete package configurations enabling Zipminator installation across:
- 7 different installation methods
- 5+ platforms and architectures
- Multiple programming language ecosystems
- Both container and native execution

**Total files:** 20+ configuration files
**Installation methods:** 7
**Supported platforms:** Linux, macOS, Windows
**Container support:** Docker, Docker Compose

---

**Last Updated:** November 4, 2025
**Maintainer:** QDaria
**Status:** Production Ready
