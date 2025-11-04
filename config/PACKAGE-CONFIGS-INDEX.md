# Zipminator Package Configurations Index

**Status:** Complete
**Version:** 0.1.0
**Date Created:** November 4, 2025
**Location:** `/Users/mos/dev/zipminator/`

---

## Quick Reference

### All Configuration Files

#### Core Package Configurations

| File | Purpose | Platform | Command |
|------|---------|----------|---------|
| `config/pyproject.toml` | PyPI package definition | Python 3.8+ | `pip install zipminator-pqc` |
| `config/Cargo-cli.toml` | Rust CLI package manifest | Cargo/Rust | `cargo install zipminator` |
| `config/zipminator.rb` | Homebrew formula | macOS | `brew install zipminator` |
| `config/npm-package.json` | NPM package wrapper | Node.js | `npm install -g @qdaria/zipminator` |
| `config/Dockerfile` | Docker image definition | Container | `docker pull qdaria/zipminator` |
| `config/docker-compose.yml` | Docker Compose orchestration | Container | `docker-compose up` |

#### Supporting Configuration Files

| File | Purpose | Type |
|------|---------|------|
| `config/setup.cfg` | Legacy Python setuptools config | Python build |
| `config/MANIFEST.in` | Python package file inclusion rules | Python build |
| `config/.dockerignore` | Docker build context exclusions | Docker build |
| `config/.github-workflows-release.yml` | GitHub Actions CI/CD pipeline | Automation |
| `config/installation-guide.md` | Comprehensive installation documentation | Documentation |
| `config/package-configurations-summary.md` | Detailed configuration reference | Documentation |
| `config/setup-brew-tap.sh` | Homebrew tap repository setup script | Tooling |

#### Installation Scripts

| File | Purpose | Platform |
|------|---------|----------|
| `scripts/install.sh` | Universal POSIX installer | Linux, macOS |
| `scripts/install.ps1` | Windows PowerShell installer | Windows |
| `config/npm-install-binary.js` | NPM post-install binary downloader | All |

---

## Installation Methods at a Glance

### Python Users
```bash
pip install zipminator-pqc
```
**Files:** `config/pyproject.toml`, `config/setup.cfg`, `config/MANIFEST.in`

### Rust Developers
```bash
cargo install zipminator
```
**Files:** `config/Cargo-cli.toml`

### macOS Users
```bash
brew tap qdaria/zipminator https://github.com/qdaria/homebrew-zipminator
brew install zipminator
```
**Files:** `config/zipminator.rb`, `config/setup-brew-tap.sh`

### Node.js Users
```bash
npm install -g @qdaria/zipminator
```
**Files:** `config/npm-package.json`, `config/npm-install-binary.js`

### Docker Users
```bash
docker pull qdaria/zipminator
docker run qdaria/zipminator --help
```
**Files:** `config/Dockerfile`, `config/docker-compose.yml`, `config/.dockerignore`

### Direct Installation (macOS/Linux)
```bash
bash scripts/install.sh
```
**Files:** `scripts/install.sh`

### Direct Installation (Windows)
```powershell
powershell -ExecutionPolicy Bypass -File scripts/install.ps1
```
**Files:** `scripts/install.ps1`

---

## File Details

### PyPI Configuration (`config/pyproject.toml`)
- **Build System:** Maturin (Rust + Python)
- **Python Version:** 3.8+
- **Key Dependencies:** cryptography, click
- **Entry Point:** zipminator CLI command
- **Features:** PEP 517 compliant, optional dev/docs extras

### Cargo Configuration (`config/Cargo-cli.toml`)
- **Package Name:** zipminator
- **Edition:** 2021
- **Binary Optimization:** LTO + stripping
- **Key Dependencies:** clap, tokio, serde, reqwest
- **Profile:** Release build optimized for size/speed

### Homebrew Formula (`config/zipminator.rb`)
- **Base:** Ruby DSL formula
- **Build Method:** Cargo from source
- **Dependencies:** Rust (build), pkg-config
- **Test Method:** Version check and help command
- **Taps:** qdaria/zipminator

### NPM Package (`config/npm-package.json`)
- **Scope:** @qdaria/zipminator
- **Binary Wrapper:** Platform-specific subpackages
- **Post-Install:** Auto-downloads binary for current platform
- **Supported Platforms:** macOS (x64, ARM64), Linux (x64, ARM64), Windows (x64)

### Docker Image (`config/Dockerfile`)
- **Base Image:** Alpine Linux (minimal)
- **Build Strategy:** Multi-stage (builder + runtime)
- **User:** Non-root (zipminator)
- **Health Check:** Binary version check
- **Volume Mount:** /app/data for input/output

### Docker Compose (`config/docker-compose.yml`)
- **Service:** Single zipminator service
- **Resource Limits:** 2 CPU, 2GB memory
- **Network:** Dedicated zipminator-net
- **Logging:** JSON file driver with rotation

---

## Installation Paths by Platform

### macOS
- **Homebrew:** `/usr/local/bin/zipminator`
- **Cargo:** `~/.cargo/bin/zipminator`
- **NPM:** `/usr/local/bin/zipminator`
- **Script:** `/usr/local/bin/zipminator` (default)

### Linux
- **Cargo:** `~/.cargo/bin/zipminator`
- **NPM:** `/usr/local/bin/zipminator` or `~/.npm/_npx/`
- **Direct:** `/usr/local/bin/zipminator`
- **Docker:** Container image only

### Windows
- **Cargo:** `%APPDATA%\cargo\bin\zipminator.exe`
- **NPM:** `%APPDATA%\npm\zipminator.exe`
- **Script:** `C:\Program Files\Zipminator\zipminator.exe` (default)
- **Docker:** Requires Docker Desktop

---

## Configuration Dependencies

```
Installation Methods
├── PyPI (pip)
│   ├── pyproject.toml
│   ├── setup.cfg
│   └── MANIFEST.in
│
├── Cargo
│   └── Cargo-cli.toml
│
├── Homebrew
│   ├── zipminator.rb
│   └── setup-brew-tap.sh
│
├── NPM
│   ├── npm-package.json
│   └── npm-install-binary.js
│
├── Docker
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .dockerignore
│
├── POSIX Shell (install.sh)
│   └── scripts/install.sh
│
└── PowerShell (install.ps1)
    └── scripts/install.ps1

CI/CD & Automation
├── .github-workflows-release.yml (GitHub Actions)
└── Publishes to: PyPI, crates.io, Docker Hub, npm
```

---

## Version Management

### Current Version
- **Release:** 0.1.0 (Beta)
- **Repository:** https://github.com/qdaria/zipminator

### Version Update Workflow
1. Update version in all config files
2. Create git tag: `git tag v0.1.0`
3. Push tag: `git push origin v0.1.0`
4. GitHub Actions automatically:
   - Builds binaries for all platforms
   - Creates GitHub Release
   - Publishes to PyPI
   - Publishes to crates.io
   - Pushes to Docker Hub
   - Publishes to npm

---

## Security Features

### Build Security
- Multi-stage Docker builds (minimal attack surface)
- Builds executed in GitHub Actions (public CI)
- Dependency pinning for reproducibility
- Checksum verification for all releases

### Runtime Security
- Non-root Docker user
- No hardcoded secrets
- Optional GPG signing for releases
- Dependency scanning for vulnerabilities

### Supply Chain
- Transparent build process
- Public release artifacts
- Checksum verification available
- GitHub signed commits

---

## Memory Store Reference

Package metadata stored in memory at: `zipminator/package-configs`

**Stored Data:**
- Package names and versions
- Platform support matrices
- Installation command syntax
- Dependency information
- Release artifact locations
- Build configuration details

---

## Next Steps

### For Release
1. Set up GitHub organization/repository
2. Create Homebrew tap repository
3. Register on crates.io
4. Register on PyPI
5. Set up Docker Hub repository
6. Register on npm (optional)
7. Configure GitHub Actions secrets for publishing

### For Users
1. Refer to `config/installation-guide.md` for detailed instructions
2. Choose installation method based on preferred package manager
3. Follow verification steps to confirm installation
4. Report issues on GitHub Issues

---

## Documentation Files

| File | Content |
|------|---------|
| `config/installation-guide.md` | Complete user installation guide |
| `config/package-configurations-summary.md` | Detailed configuration reference |
| `config/PACKAGE-CONFIGS-INDEX.md` | This index (quick reference) |

---

## Troubleshooting

### Installation Issues
See `config/installation-guide.md` section: "Troubleshooting"

### Build Issues
- Check Rust version: `rustc --version`
- Check Python version: `python --version`
- Update dependencies: `cargo update` or `pip install --upgrade`

### Platform-Specific Issues
- **macOS ARM64:** Ensure using Apple Silicon binary
- **Linux ARM64:** May require cross-compilation
- **Windows:** PowerShell execution policy may need adjustment

---

## Support

- **Issues:** https://github.com/qdaria/zipminator/issues
- **Documentation:** https://docs.qdaria.com/zipminator
- **Security:** security@qdaria.com

---

## Summary Statistics

- **Total Configuration Files:** 13
- **Installation Methods:** 7
- **Supported Platforms:** Linux, macOS, Windows
- **Language Support:** Python, Rust, JavaScript, Shell, PowerShell
- **Package Managers:** PyPI, Cargo, Homebrew, npm, Docker, Direct

---

**Last Updated:** November 4, 2025
**Maintainer:** QDaria
**License:** MIT
