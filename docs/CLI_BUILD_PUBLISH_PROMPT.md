# Claude-Flow v2.7.0 Ultra-Sophisticated CLI Build & Publishing

**Working Directory:** `/Users/mos/dev/zipminator`
**Pattern:** Multi-Feature Project with Full v2.7.0 Stack
**Objective:** Complete, test, and publish installable CLI to PyPI

---

## CRITICAL CONTEXT

**CLI is PARTIALLY IMPLEMENTED:**
- ✅ Architecture designed (`docs/CLI_ARCHITECTURE.md` - 1,772 lines)
- ✅ Rust source created (`cli/src/` - 2,300+ lines)
- ✅ Package configs created (`config/` - 7 platforms)
- ❌ NOT YET TESTED (compilation errors in upstream kyber768-rust library)
- ❌ NOT YET PUBLISHED to PyPI

**THIS PROMPT COMPLETES:**
1. Fix compilation errors in Rust Kyber768 library
2. Build working CLI binary with PyO3 bindings
3. Test installation across all 7 platforms
4. Publish to test.pypi.org, then production PyPI
5. Create professional installation scripts
6. Industry best practices for distribution

---

## Mission: Production-Ready Installable CLI with PyPI Publishing

### Critical Constraints (NO VIOLATIONS)

- **NO emojis** in any output, documentation, or error messages
- **NO fake version numbers** (start with 0.1.0, increment properly)
- **REAL testing required** before PyPI publish
- **Professional error messages** (technical, helpful)
- **Industry best practices** for Rust/Python packaging
- **Security first** (no hardcoded secrets, proper key management)

---

## Phase 1: Ultra-Think Initialization (Cognitive Pattern Analysis)

### Step 1.1: Initialize Ultra-Think Swarm

```bash
npx claude-flow@alpha hooks pre-task --description "CLI build and PyPI publishing with ultra-think"
```

### Step 1.2: Spawn Cognitive Analysis Agents (4 agents)

**Agent 1: Convergent Thinker** (system-architect)
- **Task:** Analyze WHY compilation is failing
- **Focus:** Identify root cause in `src/rust/` codebase
- **Cognitive Pattern:** Convergent (narrow down to specific errors)
- **Output:** Store in AgentDB `cli/convergent-error-analysis`
- **Investigate:**
  - `src/rust/src/qrng/id_quantique.rs` - libusb lifetime issues
  - `src/rust/src/qrng/entropy_pool.rs` - HealthStatus Default trait
  - `src/rust/src/entropy_source.rs` - borrow checker issue
- **Source:** `cli/QUICK_START.md` (compilation errors documented)

**Agent 2: Divergent Thinker** (researcher)
- **Task:** Explore ALL possible packaging strategies
- **Focus:** Research industry best practices for Rust CLI distribution
- **Cognitive Pattern:** Divergent (explore multiple approaches)
- **Output:** Store in AgentDB `cli/divergent-packaging-strategies`
- **Research:**
  - PyO3 vs FFI vs pure Rust binary
  - maturin vs setuptools-rust
  - Wheel building for all platforms (manylinux, macosx, win_amd64)
  - Pre-built binaries vs compile-on-install
  - Homebrew tap creation
  - npm binary wrapper patterns
- **Sources:** Industry standards, successful Rust CLIs (ripgrep, bat, fd)

**Agent 3: Lateral Thinker** (planner)
- **Task:** Find unexpected installation pain points
- **Focus:** What breaks in real-world scenarios?
- **Cognitive Pattern:** Lateral (anticipate edge cases)
- **Output:** Store in AgentDB `cli/lateral-installation-risks`
- **Investigate:**
  - OpenSSL dependency issues (common on macOS)
  - Python version compatibility (3.8-3.12)
  - Apple Silicon vs Intel builds
  - Windows MSVC vs MinGW
  - Corporate proxies blocking PyPI
  - Offline installation scenarios

**Agent 4: Systems Thinker** (analyst)
- **Task:** Design end-to-end build & publish pipeline
- **Focus:** Integrate all insights into coherent workflow
- **Output:** Build & publish strategy document
- **Store:** AgentDB `cli/systems-build-strategy`
- **Pipeline:**
  1. Fix Rust compilation errors
  2. Local build & test (cargo build, maturin develop)
  3. Cross-platform builds (cargo cross, maturin build)
  4. PyPI test publish (test.pypi.org)
  5. Installation testing (7 platforms)
  6. Production PyPI publish
  7. Post-publish verification

---

## Phase 2: Skill Creation (Custom Claude Code Skills)

### Step 2.1: Create Rust Debugging Skill

**Agent 5: Skill Generator** (base-template-generator)
- **Task:** Create `.claude/skills/rust-debugging.md` skill
- **Content:**
  - Common Rust compilation error patterns
  - Lifetime annotation fixes
  - Trait implementation debugging
  - Borrow checker resolution strategies
  - cargo clippy integration
- **Output:** `/Users/mos/dev/zipminator/.claude/skills/rust-debugging.md`

### Step 2.2: Create PyPI Publishing Skill

**Agent 6: Skill Generator** (base-template-generator)
- **Task:** Create `.claude/skills/pypi-publishing.md` skill
- **Content:**
  - maturin workflow (develop, build, publish)
  - test.pypi.org vs production PyPI
  - Version management (semantic versioning)
  - Wheel building for all platforms
  - PyPI API token security
- **Output:** `/Users/mos/dev/zipminator/.claude/skills/pypi-publishing.md`

### Step 2.3: Create Installation Testing Skill

**Agent 7: Skill Generator** (base-template-generator)
- **Task:** Create `.claude/skills/installation-testing.md` skill
- **Content:**
  - Testing matrix (OS × Python version)
  - Virtual environment creation
  - Installation verification steps
  - Smoke tests (basic CLI commands)
  - Uninstallation testing
- **Output:** `/Users/mos/dev/zipminator/.claude/skills/installation-testing.md`

---

## Phase 3: AgentDB v1.3.9 + ReasoningBank Setup

### Step 3.1: Initialize AgentDB Memory

```bash
npx claude-flow@alpha hooks session-restore --session-id "zipminator-cli-build"
```

### Step 3.2: Store Build Configuration in Vector Database

**Agent 8: Memory Coordinator** (memory-coordinator)
- **Task:** Store all build configurations in AgentDB
- **Data to Store:**
  - Rust toolchain version: 1.70+ (minimum)
  - Python versions: 3.8, 3.9, 3.10, 3.11, 3.12
  - Platform targets: x86_64-unknown-linux-gnu, x86_64-apple-darwin, aarch64-apple-darwin, x86_64-pc-windows-msvc
  - maturin version: 1.0+
  - PyO3 version: 0.20+
  - Dependency versions: sha3, subtle, clap, serde
  - Build flags: --release, --strip, lto=fat
  - Test commands: cargo test, maturin develop, pip install
- **Namespace:** AgentDB `cli/build-config`

### Step 3.3: ReasoningBank Trajectory Tracking

**Agent 9: ReasoningBank Specialist** (planner)
- **Task:** Track decision-making patterns during build process
- **Trajectories to Monitor:**
  - Which compilation errors most time-consuming
  - Which platform builds fail most often
  - Which Python versions cause issues
  - Which installation methods users prefer (pip vs cargo vs brew)
- **Store:** ReasoningBank `cli/build-decisions`

---

## Phase 4: Hooks Automation (Pre/Post/Session)

### Step 4.1: Pre-Build Hooks

```bash
npx claude-flow@alpha hooks pre-task --description "Validate build environment before compilation"
```

**Validation Rules:**
- Rust toolchain installed (rustc --version)
- Python 3.8+ available (python3 --version)
- maturin installed (maturin --version)
- cargo cross installed for cross-platform builds
- OpenSSL headers available (pkg-config --libs openssl)

### Step 4.2: Post-Build Hooks

**After EVERY successful build:**
```bash
npx claude-flow@alpha hooks post-edit --file "target/release/zipminator" --memory-key "cli/builds/<platform>"
```

**Auto-verification:**
- Binary exists and is executable
- File size reasonable (<10MB)
- Strip symbols for release
- Code signing (macOS)
- Virus scan (Windows Defender)

### Step 4.3: Post-Publish Hooks

```bash
npx claude-flow@alpha hooks post-task --task-id "pypi-publish"
```

**Verification:**
- Package appears on PyPI within 5 minutes
- pip install zipminator-pqc works
- CLI runs: zipminator --version
- Uninstall works: pip uninstall zipminator-pqc

---

## Phase 5: BatchTools - Parallel Agent Execution (25 Agents)

### SPAWN ALL 25 AGENTS IN SINGLE MESSAGE (Claude Code Task Tool)

#### GROUP A: Rust Compilation Fixes (4 agents)

**Agent 10: Fix libusb Lifetime Issues** (coder)
- **File:** `src/rust/src/qrng/id_quantique.rs`
- **Error:** Lifetime annotation issues in USB device handling
- **Fix Strategy:**
  - Add explicit lifetime parameters to structs
  - Use `'static` lifetime for device references
  - Refactor to owned types instead of borrowed references
- **Test:** `cargo build --release`
- **Source:** CLI error logs in `cli/QUICK_START.md`

**Agent 11: Implement Default Trait** (coder)
- **File:** `src/rust/src/qrng/entropy_pool.rs`
- **Error:** HealthStatus missing Default trait implementation
- **Fix:**
  ```rust
  #[derive(Debug, Clone, Default)]
  pub struct HealthStatus {
      // fields...
  }
  ```
- **Test:** `cargo test --lib`

**Agent 12: Fix Borrow Checker** (coder)
- **File:** `src/rust/src/entropy_source.rs`
- **Error:** Mutable/immutable borrow conflict
- **Fix Strategy:**
  - Use interior mutability (RefCell, Mutex)
  - Restructure to avoid simultaneous borrows
  - Clone data if necessary
- **Test:** `cargo clippy -- -D warnings`

**Agent 13: Integration Testing** (tester)
- **Task:** Verify all Rust code compiles cleanly
- **Tests:**
  ```bash
  cargo clean
  cargo build --release
  cargo test --all-features
  cargo clippy -- -D warnings
  cargo fmt -- --check
  ```
- **Output:** Clean compilation report

#### GROUP B: PyO3 Bindings & Python Package (5 agents)

**Agent 14: PyO3 Module Implementation** (backend-dev)
- **File:** `cli/src/python_bindings.rs`
- **Task:** Complete Python bindings for all Rust functions
- **Implementation:**
  ```rust
  #[pymodule]
  fn zipminator_pqc(_py: Python, m: &PyModule) -> PyResult<()> {
      m.add_class::<Kyber768>()?;
      m.add_class::<QuantumEntropy>()?;
      m.add_function(wrap_pyfunction!(generate_entropy, m)?)?;
      m.add_function(wrap_pyfunction!(encrypt_file, m)?)?;
      Ok(())
  }
  ```
- **Test:** `maturin develop && python -c "import zipminator_pqc; print(dir(zipminator_pqc))"`

**Agent 15: Maturin Configuration** (cicd-engineer)
- **File:** `cli/pyproject.toml`
- **Task:** Configure maturin for all platforms
- **Configuration:**
  ```toml
  [build-system]
  requires = ["maturin>=1.0,<2.0"]
  build-backend = "maturin"

  [project]
  name = "zipminator-pqc"
  version = "0.1.0"
  description = "Post-quantum cryptography with NIST Kyber768 and IBM QRNG"
  requires-python = ">=3.8"

  [tool.maturin]
  python-source = "python"
  module-name = "zipminator_pqc._native"
  ```
- **Test:** `maturin build --release`

**Agent 16: Python Package Structure** (coder)
- **Task:** Create Python package wrapper
- **Files:**
  - `cli/python/zipminator/__init__.py` - Package entry point
  - `cli/python/zipminator/cli.py` - CLI wrapper
  - `cli/python/zipminator/utils.py` - Helper functions
  - `cli/python/zipminator/_native.pyi` - Type stubs
- **Content:** Professional Python code, PEP 8 compliant, type hints
- **Test:** `python -m zipminator --version`

**Agent 17: Cross-Platform Wheel Building** (cicd-engineer)
- **Task:** Build wheels for all platforms
- **Platforms:**
  - manylinux_2_28_x86_64 (Linux Intel)
  - manylinux_2_28_aarch64 (Linux ARM)
  - macosx_10_12_x86_64 (macOS Intel)
  - macosx_11_0_arm64 (macOS Apple Silicon)
  - win_amd64 (Windows 64-bit)
- **Commands:**
  ```bash
  # Use maturin with zig for cross-compilation
  maturin build --release --target x86_64-unknown-linux-gnu
  maturin build --release --target x86_64-apple-darwin
  maturin build --release --target aarch64-apple-darwin
  maturin build --release --target x86_64-pc-windows-msvc
  ```
- **Output:** Wheels in `target/wheels/`

**Agent 18: Python Integration Tests** (tester)
- **Task:** Comprehensive Python API testing
- **Tests:**
  ```python
  # test_cli.py
  import zipminator_pqc as zpm

  def test_kyber768_keygen():
      kyber = zpm.Kyber768()
      public_key, secret_key = kyber.keypair()
      assert len(public_key) > 0
      assert len(secret_key) > 0

  def test_quantum_entropy():
      entropy = zpm.generate_entropy(256)
      assert len(entropy) == 256

  def test_cli_help():
      # Test CLI commands work
      import subprocess
      result = subprocess.run(['zipminator', '--help'], capture_output=True)
      assert result.returncode == 0
  ```
- **Run:** `pytest cli/tests/`

#### GROUP C: Installation Scripts (6 agents)

**Agent 19: Pip Installation Script** (cicd-engineer)
- **File:** `scripts/install-pip.sh`
- **Content:**
  ```bash
  #!/usr/bin/env bash
  set -e

  echo "Installing Zipminator via pip..."

  # Check Python version
  python_version=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
  if [[ "$python_version" < "3.8" ]]; then
      echo "Error: Python 3.8+ required"
      exit 1
  fi

  # Install
  pip3 install --upgrade zipminator-pqc

  # Verify
  zipminator --version
  echo "Installation successful"
  ```
- **Test:** Run in fresh environment

**Agent 20: Cargo Installation Script** (cicd-engineer)
- **File:** `scripts/install-cargo.sh`
- **Content:**
  ```bash
  #!/usr/bin/env bash
  set -e

  echo "Installing Zipminator via Cargo..."

  # Check Rust toolchain
  if ! command -v cargo &> /dev/null; then
      echo "Installing Rust toolchain..."
      curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
      source $HOME/.cargo/env
  fi

  # Install
  cargo install zipminator --locked

  # Verify
  zipminator --version
  echo "Installation successful"
  ```
- **Test:** Run in Docker container

**Agent 21: Homebrew Formula** (cicd-engineer)
- **File:** `Formula/zipminator.rb`
- **Content:**
  ```ruby
  class Zipminator < Formula
    desc "Post-quantum cryptography with NIST Kyber768 and IBM QRNG"
    homepage "https://qdaria.com/technology/products/zipminator"
    url "https://github.com/qdaria/zipminator/archive/v0.1.0.tar.gz"
    sha256 "SHA256_CHECKSUM_HERE"
    license "MIT"

    depends_on "rust" => :build
    depends_on "python@3.11" => :optional

    def install
      # Build Rust binary
      system "cargo", "install", *std_cargo_args(path: "cli")

      # Optional: Install Python bindings
      if build.with? "python@3.11"
        system "pip3", "install", "."
      end
    end

    test do
      system "#{bin}/zipminator", "--version"
    end
  end
  ```
- **Publish:** Create GitHub repo `qdaria/homebrew-tap`

**Agent 22: NPM Binary Wrapper** (backend-dev)
- **File:** `package.json`
- **Content:**
  ```json
  {
    "name": "@qdaria/zipminator",
    "version": "0.1.0",
    "description": "Post-quantum cryptography CLI (Rust binary wrapper)",
    "bin": {
      "zipminator": "./bin/zipminator"
    },
    "scripts": {
      "postinstall": "node scripts/install-binary.js"
    },
    "os": ["darwin", "linux", "win32"],
    "cpu": ["x64", "arm64"]
  }
  ```
- **File:** `scripts/install-binary.js`
- **Content:** Download pre-built binary for current platform

**Agent 23: Docker Installation** (cicd-engineer)
- **File:** `Dockerfile`
- **Content:**
  ```dockerfile
  FROM rust:1.75-alpine as builder
  RUN apk add --no-cache musl-dev openssl-dev
  WORKDIR /build
  COPY . .
  RUN cargo build --release --manifest-path cli/Cargo.toml

  FROM alpine:latest
  RUN apk add --no-cache libgcc
  COPY --from=builder /build/target/release/zipminator /usr/local/bin/
  ENTRYPOINT ["zipminator"]
  CMD ["--help"]
  ```
- **Test:** `docker build -t qdaria/zipminator . && docker run qdaria/zipminator --version`

**Agent 24: Universal Install Script** (cicd-engineer)
- **File:** `scripts/install.sh` (detect platform and use appropriate method)
- **Content:**
  ```bash
  #!/usr/bin/env bash
  set -e

  # Detect OS and architecture
  OS=$(uname -s | tr '[:upper:]' '[:lower:]')
  ARCH=$(uname -m)

  echo "Detected: $OS $ARCH"

  # Choose installation method
  if command -v pip3 &> /dev/null; then
      echo "Installing via pip..."
      pip3 install zipminator-pqc
  elif command -v cargo &> /dev/null; then
      echo "Installing via cargo..."
      cargo install zipminator
  elif command -v brew &> /dev/null && [[ "$OS" == "darwin" ]]; then
      echo "Installing via Homebrew..."
      brew tap qdaria/tap
      brew install zipminator
  else
      echo "No supported package manager found"
      echo "Please install Python 3.8+, Rust, or Homebrew"
      exit 1
  fi

  # Verify
  zipminator --version
  ```
- **URL:** Host at https://install.zipminator.zip

#### GROUP D: PyPI Publishing (4 agents)

**Agent 25: Test PyPI Publish** (cicd-engineer)
- **Task:** Publish to test.pypi.org first
- **Steps:**
  1. Create test PyPI account
  2. Generate API token
  3. Configure `~/.pypirc`:
     ```ini
     [testpypi]
     repository = https://test.pypi.org/legacy/
     username = __token__
     password = pypi-TEST_TOKEN_HERE
     ```
  4. Publish:
     ```bash
     maturin publish --repository testpypi
     ```
  5. Test installation:
     ```bash
     pip install --index-url https://test.pypi.org/simple/ zipminator-pqc
     ```
- **Verify:** CLI works, all commands functional

**Agent 26: Production PyPI Publish** (cicd-engineer)
- **Task:** Publish to production PyPI
- **Prerequisites:**
  - Test PyPI version working
  - All tests passing
  - Documentation complete
  - Version number incremented
- **Steps:**
  1. Create production PyPI account
  2. Generate production API token
  3. Configure `~/.pypirc`:
     ```ini
     [pypi]
     username = __token__
     password = pypi-PRODUCTION_TOKEN_HERE
     ```
  4. Publish:
     ```bash
     maturin publish
     ```
  5. Verify on PyPI.org: https://pypi.org/project/zipminator-pqc/
- **Post-Publish:**
  ```bash
  # Test in fresh environment
  python3 -m venv /tmp/test-env
  source /tmp/test-env/bin/activate
  pip install zipminator-pqc
  zipminator --version
  deactivate
  ```

**Agent 27: PyPI Package Page** (coder)
- **Task:** Create professional PyPI package page
- **File:** `cli/README.md` (displayed on PyPI)
- **Content:**
  - Professional description (no emojis)
  - Installation instructions (pip install zipminator-pqc)
  - Quick start examples
  - CLI command reference
  - Link to full documentation
  - License information
  - Security contact
- **Format:** Markdown, rendered on PyPI package page

**Agent 28: Version Management** (planner)
- **Task:** Set up semantic versioning workflow
- **Strategy:**
  - 0.1.0 - Initial PyPI release
  - 0.1.x - Bug fixes
  - 0.2.0 - New features (backwards compatible)
  - 1.0.0 - Production ready, API stable
- **Files to Update:**
  - `cli/Cargo.toml` - version = "0.1.0"
  - `cli/pyproject.toml` - version = "0.1.0"
  - `config/npm-package.json` - version = "0.1.0"
  - `Formula/zipminator.rb` - version "0.1.0"
- **Automation:** Script to bump versions consistently

#### GROUP E: Documentation & Testing (6 agents)

**Agent 29: Quick Start Guide** (coder)
- **File:** `docs/QUICK_START.md`
- **Content:**
  - Installation (all 7 methods)
  - First command: `zipminator --version`
  - Generate quantum entropy: `zipminator rng generate --bytes 256`
  - Generate Kyber768 keypair: `zipminator keygen`
  - Encrypt file: `zipminator encrypt --file data.json`
  - Decrypt file: `zipminator decrypt --file data.enc`
  - Get help: `zipminator --help`
- **Format:** Professional, code examples, no emojis

**Agent 30: API Documentation** (coder)
- **File:** `docs/API_REFERENCE.md`
- **Content:**
  - Python API reference
  - CLI command reference
  - Configuration options
  - Error codes and troubleshooting
  - Performance tuning
- **Format:** Technical, comprehensive

**Agent 31: Industry Use Cases** (coder)
- **File:** `docs/USE_CASES.md`
- **Content:**
  - 6 industry examples (banking, defense, gaming, healthcare, infrastructure, crypto)
  - Real CLI commands for each use case
  - Integration patterns
  - Best practices
- **Source:** `/Users/mos/dev/zipminator/docs/industries/*.md`

**Agent 32: Cross-Platform Testing** (tester)
- **Task:** Test installation on all platforms
- **Testing Matrix:**
  | OS | Python | Method | Status |
  |---|---|---|---|
  | Ubuntu 22.04 | 3.8 | pip | ✓ |
  | Ubuntu 22.04 | 3.11 | pip | ✓ |
  | macOS 13 Intel | 3.10 | pip | ✓ |
  | macOS 14 M1 | 3.11 | brew | ✓ |
  | Windows 11 | 3.11 | pip | ✓ |
  | Debian 12 | 3.9 | cargo | ✓ |
- **Run:** Automated via GitHub Actions or manual testing

**Agent 33: Smoke Testing** (tester)
- **Task:** Verify basic CLI functionality
- **Tests:**
  ```bash
  # Version check
  zipminator --version

  # Help text
  zipminator --help
  zipminator rng --help

  # Generate entropy
  zipminator rng generate --bytes 32 --output test.bin
  test -f test.bin && echo "OK"

  # Generate keypair
  zipminator keygen --public pub.key --secret sec.key
  test -f pub.key && test -f sec.key && echo "OK"

  # Cleanup
  rm -f test.bin pub.key sec.key
  ```
- **Run:** After every installation method

**Agent 34: Performance Benchmarking** (analyst)
- **Task:** Verify performance matches specifications
- **Benchmarks:**
  ```bash
  zipminator benchmark --iterations 1000 --json
  ```
- **Verify:**
  - Kyber768 KeyGen: 50-100 microseconds
  - Kyber768 Encaps: 50-100 microseconds
  - Kyber768 Decaps: 50-100 microseconds
- **Output:** JSON report with statistics

---

## Phase 6: Memory Coordination & ReasoningBank Integration

### Step 6.1: Cross-Agent Memory Sharing

**All agents store work in AgentDB under:**
- `cli/compilation-fixes/{file}` - Rust fixes
- `cli/bindings/{language}` - PyO3, FFI bindings
- `cli/installation/{platform}` - Installation scripts
- `cli/publishing/{stage}` - PyPI publish status
- `cli/testing/{platform}` - Test results
- `cli/documentation/{doc}` - Documentation files

### Step 6.2: ReasoningBank Pattern Learning

**Track patterns for future optimization:**
- Which compilation errors most common (help future developers)
- Which platforms have installation issues
- Which Python versions most popular (prioritize testing)
- Which installation method users prefer (emphasize in docs)

### Step 6.3: Session Export

```bash
npx claude-flow@alpha hooks session-end --export-metrics true
```

**Generate report:**
- Agents spawned: 34
- Files modified: ~50
- Compilation: Success/Failure
- PyPI publish: test.pypi.org + production
- Installation test matrix: Complete
- Documentation: Complete

---

## Technical Specifications

### Rust Compilation Requirements
- **Toolchain:** Rust 1.70+ (stable)
- **Dependencies:** sha3, subtle, clap, pyo3, serde
- **Build flags:** `--release`, `lto=fat`, `codegen-units=1`
- **Target platforms:** Linux (x86_64, ARM64), macOS (Intel, Apple Silicon), Windows (x86_64)

### Python Package Requirements
- **Python:** 3.8, 3.9, 3.10, 3.11, 3.12
- **Build system:** maturin 1.0+
- **Bindings:** PyO3 0.20+
- **Wheel types:** manylinux, macosx, win_amd64
- **Distribution:** PyPI (production), test.pypi.org (staging)

### Installation Methods
1. **pip:** `pip install zipminator-pqc`
2. **cargo:** `cargo install zipminator`
3. **brew:** `brew install qdaria/tap/zipminator`
4. **npm:** `npm install -g @qdaria/zipminator`
5. **docker:** `docker pull qdaria/zipminator`
6. **curl:** `curl -sSf https://install.zipminator.zip | sh`
7. **powershell:** `iwr https://install.zipminator.zip/win | iex`

### Testing Requirements
- **Unit tests:** All Rust code (cargo test)
- **Integration tests:** Python API (pytest)
- **Smoke tests:** Basic CLI commands
- **Cross-platform:** 6 OS/Python combinations minimum
- **Performance:** Benchmark against specifications

---

## Execution Sequence

**MESSAGE 1:** TodoWrite (12-15 todos covering all phases)

**MESSAGE 2:** Initialize Ultra-Think (Agents 1-4)

**MESSAGE 3:** Create Skills (Agents 5-7: Rust debugging, PyPI publishing, installation testing)

**MESSAGE 4:** AgentDB + ReasoningBank Setup (Agents 8-9)

**MESSAGE 5:** Hooks Configuration (pre-build, post-build, post-publish)

**MESSAGE 6:** SPAWN ALL 25 AGENTS IN SINGLE MESSAGE (Agents 10-34)
- Group A: Rust fixes (4 agents)
- Group B: PyO3 bindings (5 agents)
- Group C: Installation scripts (6 agents)
- Group D: PyPI publishing (4 agents)
- Group E: Documentation & testing (6 agents)

**MESSAGE 7:** Monitor AgentDB memory coordination

**MESSAGE 8:** ReasoningBank pattern analysis

**MESSAGE 9:** Session export with metrics

**MESSAGE 10:** Final verification (pip install zipminator-pqc works globally)

---

## Success Criteria

### Compilation
- Zero warnings: `cargo clippy -- -D warnings`
- Zero errors: `cargo build --release`
- All tests passing: `cargo test --all-features`
- Code formatted: `cargo fmt -- --check`

### Python Package
- maturin builds successfully for all platforms
- Wheels available for Python 3.8-3.12
- Import works: `import zipminator_pqc`
- CLI works: `zipminator --version`

### PyPI Publishing
- Package appears on test.pypi.org
- Package appears on PyPI.org (production)
- Installation works: `pip install zipminator-pqc`
- Uninstallation works: `pip uninstall zipminator-pqc`

### Documentation
- Quick start guide complete (no emojis)
- API reference complete
- Installation instructions for all 7 methods
- Professional tone throughout

### Testing
- Cross-platform testing matrix complete
- Smoke tests passing on all platforms
- Performance benchmarks meet specifications
- No security vulnerabilities (cargo audit)

---

## Post-Publish Checklist

### Immediate (within 1 hour)
- [ ] Verify package on PyPI.org
- [ ] Test installation in fresh environment
- [ ] Update website with installation instructions
- [ ] Announce on social media (professional, no emojis)

### Short-term (within 1 week)
- [ ] Monitor GitHub issues for installation problems
- [ ] Publish to crates.io (Rust package registry)
- [ ] Submit Homebrew formula to qdaria/homebrew-tap
- [ ] Publish npm package to npmjs.com
- [ ] Push Docker image to Docker Hub

### Medium-term (within 1 month)
- [ ] Create video tutorial (installation + basic usage)
- [ ] Write blog post (technical deep-dive)
- [ ] Submit to package manager repos (apt, yum, chocolatey)
- [ ] Apply for security audit (if budget allows)
- [ ] Request FIPS 140-3 validation quote

---

## Industry Best Practices Implemented

### Security
- No hardcoded secrets (all via environment variables)
- Code signing for macOS and Windows binaries
- Checksum verification for downloads
- Dependency pinning (Cargo.lock committed)
- Regular security audits (cargo audit)

### Distribution
- Pre-built binaries for all major platforms
- Multiple installation methods (7 total)
- Universal install script with auto-detection
- Offline installation support (vendored dependencies)
- Corporate proxy compatibility

### Documentation
- Professional tone (no emojis)
- Clear installation instructions
- Comprehensive API reference
- Industry-specific use cases
- Troubleshooting guide

### Testing
- Comprehensive test matrix (OS × Python version)
- Automated CI/CD (GitHub Actions)
- Smoke tests for every release
- Performance benchmarks
- Security scanning

---

## START EXECUTION

**Use Claude-Flow v2.7.0 Full Stack:**
- AgentDB v1.3.9 (96x-164x faster semantic search)
- ReasoningBank (build decision tracking)
- Ultra-Think (convergent/divergent/lateral/systems)
- Hooks automation (pre-build, post-build, post-publish)
- BatchTools (34 agents in parallel)
- Skills creation (Rust debugging, PyPI publishing, installation testing)

**Remember:** The CLI is partially built - this prompt completes implementation, tests thoroughly, and publishes to PyPI following industry best practices.
