# Zipminator Installation Guide

Zipminator is available for installation across multiple platforms and package managers.

## Quick Start

### macOS (Homebrew)
```bash
brew tap qdaria/zipminator https://github.com/qdaria/homebrew-zipminator
brew install zipminator
```

### Linux (Cargo)
```bash
cargo install zipminator --git https://github.com/qdaria/zipminator
```

### npm/Node.js
```bash
npm install -g @qdaria/zipminator
```

### Python (pip)
```bash
pip install zipminator-pqc
```

### Docker
```bash
docker pull qdaria/zipminator
docker run qdaria/zipminator --help
```

---

## Platform-Specific Instructions

### macOS

#### Homebrew (Recommended)
```bash
# Add the tap
brew tap qdaria/zipminator https://github.com/qdaria/homebrew-zipminator

# Install
brew install zipminator

# Update
brew upgrade zipminator

# Uninstall
brew uninstall zipminator
```

#### From Source
```bash
# Prerequisites: Rust 1.75+, pkg-config
brew install rust pkg-config

# Clone and build
git clone https://github.com/qdaria/zipminator
cd zipminator/src/rust
cargo install --path .

# Verify
zipminator --version
```

### Linux

#### Cargo (Rust Package Manager)
```bash
# Prerequisites: Rust 1.75+
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install
cargo install zipminator --git https://github.com/qdaria/zipminator

# Verify
zipminator --version
```

#### Debian/Ubuntu
```bash
# From GitHub releases
wget https://github.com/qdaria/zipminator/releases/download/v0.1.0/zipminator-x86_64-unknown-linux-gnu
chmod +x zipminator-x86_64-unknown-linux-gnu
sudo mv zipminator-x86_64-unknown-linux-gnu /usr/local/bin/zipminator

# Verify
zipminator --version
```

#### Red Hat/CentOS
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install from source
git clone https://github.com/qdaria/zipminator
cd zipminator/src/rust
cargo install --path .
```

### Windows

#### From GitHub Releases
```bash
# Download the latest release
# https://github.com/qdaria/zipminator/releases/download/v0.1.0/zipminator-x86_64-pc-windows-msvc.exe

# Add to PATH or use the full path
zipminator --version
```

#### Using Cargo
```powershell
# Install Rust
# Download from https://rustup.rs/

# Install Zipminator
cargo install zipminator --git https://github.com/qdaria/zipminator
```

### Docker

#### Pull and Run
```bash
# Pull the image
docker pull qdaria/zipminator:latest

# Run with help
docker run qdaria/zipminator --help

# Run with volume mount
docker run -v $(pwd):/app/data qdaria/zipminator:latest --help

# Using docker-compose
docker-compose -f config/docker-compose.yml up -d
```

#### Build Locally
```bash
# Clone repository
git clone https://github.com/qdaria/zipminator
cd zipminator

# Build image
docker build -f config/Dockerfile -t zipminator:local .

# Run
docker run zipminator:local --help
```

---

## Language-Specific Installation

### Python

#### Using pip
```bash
pip install zipminator-pqc
```

#### Using poetry
```bash
poetry add zipminator-pqc
```

#### From Source
```bash
git clone https://github.com/qdaria/zipminator
cd zipminator
pip install -e .
```

### Node.js / npm

#### Using npm
```bash
npm install -g @qdaria/zipminator
zipminator --help
```

#### Using yarn
```bash
yarn global add @qdaria/zipminator
zipminator --help
```

#### Using pnpm
```bash
pnpm add -g @qdaria/zipminator
zipminator --help
```

### Rust / Cargo

#### Latest from crates.io
```bash
cargo install zipminator
```

#### From GitHub
```bash
cargo install zipminator --git https://github.com/qdaria/zipminator
```

#### Development
```bash
git clone https://github.com/qdaria/zipminator
cd zipminator/src/rust
cargo build --release
./target/release/zipminator --help
```

---

## Verification After Installation

After installing, verify the installation:

```bash
# Check version
zipminator --version

# Display help
zipminator --help

# Run a test
zipminator generate-keypair

# Check IBM QRNG connection
zipminator test-qrng
```

---

## Troubleshooting

### Command not found
- **macOS/Linux**: Ensure installation path is in `$PATH`
  ```bash
  echo $PATH
  which zipminator
  ```
- **Windows**: Verify Cargo/Rust bin directory is in PATH
  ```powershell
  $env:PATH
  ```

### Permission denied
```bash
# Fix on Linux/macOS
chmod +x $(which zipminator)
# or
sudo chown root:root $(which zipminator)
```

### SSL/Certificate errors
```bash
# Verify certificates (Linux)
sudo update-ca-certificates

# Python specific
pip install --upgrade certifi
```

### Build from source fails
```bash
# Update Rust
rustup update

# Update dependencies
cargo update

# Clean build
cargo clean
cargo build --release
```

### Docker image pull fails
```bash
# Check Docker daemon
docker ps

# Verify internet connection
docker pull alpine  # test basic pull

# Use explicit registry
docker pull docker.io/qdaria/zipminator:latest
```

---

## Security Verification

### Verify Release Signatures (if available)
```bash
# Download signature
wget https://github.com/qdaria/zipminator/releases/download/v0.1.0/zipminator-x86_64-unknown-linux-gnu.sig

# Verify with GPG
gpg --verify zipminator-x86_64-unknown-linux-gnu.sig zipminator-x86_64-unknown-linux-gnu
```

### Check Binary Hash
```bash
# Download SHA256 checksums
wget https://github.com/qdaria/zipminator/releases/download/v0.1.0/SHA256SUMS

# Verify
sha256sum -c SHA256SUMS
```

---

## Updating Zipminator

### macOS (Homebrew)
```bash
brew upgrade zipminator
```

### Linux (Cargo)
```bash
cargo install --force zipminator
```

### npm
```bash
npm update -g @qdaria/zipminator
```

### Python
```bash
pip install --upgrade zipminator-pqc
```

### Docker
```bash
docker pull qdaria/zipminator:latest
```

---

## Uninstalling

### macOS (Homebrew)
```bash
brew uninstall zipminator
```

### Linux (Cargo)
```bash
cargo uninstall zipminator
```

### npm
```bash
npm uninstall -g @qdaria/zipminator
```

### Python
```bash
pip uninstall zipminator-pqc
```

### Docker
```bash
docker rmi qdaria/zipminator
```

---

## Support

- Documentation: https://docs.zipminator.zip
- GitHub Issues: https://github.com/qdaria/zipminator/issues
- Security Issues: security@qdaria.com

---

## License

Zipminator is licensed under the MIT License. See LICENSE for details.
