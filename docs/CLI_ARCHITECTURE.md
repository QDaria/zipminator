# Zipminator Universal CLI Architecture
**Version:** 1.0.0
**Date:** 2025-01-04
**Status:** Architecture Design Document

---

## Executive Summary

This document defines the architecture for **Zipminator CLI** - a universal, cross-platform command-line interface for quantum-resistant cryptography combining:
- **Quantum Entropy Harvesting** (IBM, IonQ, Rigetti, AWS Braket, OQC)
- **Post-Quantum Cryptography** (CRYSTALS-Kyber-768)
- **Multi-Industry Applications** (Gaming, Finance, Defense, Healthcare, Infrastructure, Crypto)

### Key Design Principles
1. **Universal Installation** - Install via `pip`, `cargo`, `brew`, or `npm`
2. **Industry-Specific Workflows** - Specialized commands for each target sector
3. **Plugin Architecture** - Extensible entropy sources and cryptographic primitives
4. **Cross-Platform** - macOS, Linux, Windows support
5. **Performance-First** - Rust core with language bindings

---

## 1. Package Structure

### 1.1 Core Architecture (Rust)

```
zipminator/
├── src/
│   ├── rust/                    # Core Rust implementation
│   │   ├── src/
│   │   │   ├── lib.rs          # Main library entry point
│   │   │   ├── kyber768.rs     # Kyber-768 implementation
│   │   │   ├── cli/
│   │   │   │   ├── mod.rs      # CLI module
│   │   │   │   ├── commands/   # Command implementations
│   │   │   │   │   ├── rng.rs          # QRNG commands
│   │   │   │   │   ├── encrypt.rs      # Encryption commands
│   │   │   │   │   ├── keygen.rs       # Key generation
│   │   │   │   │   ├── channel.rs      # Secure channels
│   │   │   │   │   ├── casino.rs       # Casino-specific
│   │   │   │   │   ├── finance.rs      # Banking-specific
│   │   │   │   │   └── plugin.rs       # Plugin management
│   │   │   │   └── config.rs   # Configuration management
│   │   │   ├── qrng/
│   │   │   │   ├── mod.rs
│   │   │   │   ├── entropy_pool.rs
│   │   │   │   ├── providers/
│   │   │   │   │   ├── ibm.rs
│   │   │   │   │   ├── ionq.rs
│   │   │   │   │   ├── rigetti.rs
│   │   │   │   │   ├── aws_braket.rs
│   │   │   │   │   └── plugin_trait.rs
│   │   │   │   └── multi_provider.rs
│   │   │   └── entropy_source.rs
│   │   ├── Cargo.toml
│   │   └── build.rs            # Build script for PyO3
│   │
│   ├── python/                  # Python bindings (PyO3)
│   │   ├── zipminator/
│   │   │   ├── __init__.py
│   │   │   ├── _native.pyi     # Type stubs for Rust bindings
│   │   │   ├── cli.py          # Python CLI wrapper
│   │   │   ├── providers/      # Python QRNG providers
│   │   │   └── utils.py
│   │   ├── pyproject.toml
│   │   └── setup.py
│   │
│   └── node/                    # Node.js wrapper (optional)
│       ├── src/
│       │   ├── index.ts
│       │   └── bindings.ts     # FFI to Rust binary
│       ├── package.json
│       └── tsconfig.json
│
├── plugins/                     # Plugin system
│   ├── examples/
│   │   ├── custom_entropy.rs
│   │   └── custom_cipher.rs
│   └── README.md
│
├── config/
│   ├── .zipminator.toml.example
│   └── profiles/               # Industry-specific configs
│       ├── casino.toml
│       ├── finance.toml
│       ├── defense.toml
│       ├── healthcare.toml
│       └── crypto.toml
│
└── docs/
    ├── CLI_ARCHITECTURE.md     # This document
    ├── PLUGIN_DEVELOPMENT.md
    └── INDUSTRY_GUIDES/
        ├── casino.md
        ├── finance.md
        └── defense.md
```

### 1.2 Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Core Library** | Rust | Memory safety, performance, constant-time guarantees |
| **Python Bindings** | PyO3 + maturin | Native performance, seamless Python integration |
| **CLI Framework** | clap v4 | Industry-standard, derives, completions |
| **QRNG Integration** | Existing Python (qiskit) + Rust wrappers | Leverage existing code |
| **Configuration** | TOML (serde) | Human-readable, Rust-native |
| **Crypto** | sha3, subtle, rand_core | FIPS-validated primitives |
| **Node Bindings** | napi-rs (optional) | For JavaScript ecosystems |

---

## 2. Installation Strategies

### 2.1 Python (pip)

**Primary distribution method for data scientists and Python developers.**

```bash
# Install from PyPI
pip install zipminator-pqc

# Install with specific providers
pip install zipminator-pqc[ibm,aws,ionq]

# Developer install from source
git clone https://github.com/qdaria/zipminator.git
cd zipminator
pip install -e .
```

**Implementation:**
- Use **maturin** to build Rust extension module
- PyO3 provides Python bindings to Rust core
- Python wrapper provides high-level API

**pyproject.toml:**
```toml
[project]
name = "zipminator-pqc"
version = "1.0.0"
description = "Quantum-resistant cryptography CLI with QRNG and Kyber-768"
dependencies = [
    "qiskit>=1.0.0",
    "qiskit-ibm-runtime>=0.20.0",
    "click>=8.1.0",
    "toml>=0.10.0"
]

[project.optional-dependencies]
ibm = ["qiskit-ibm-runtime>=0.20.0"]
aws = ["boto3>=1.34.0", "amazon-braket-sdk>=1.70.0"]
ionq = ["qiskit-ionq>=0.5.0"]
all = ["zipminator-pqc[ibm,aws,ionq]"]

[build-system]
requires = ["maturin>=1.4,<2.0"]
build-backend = "maturin"

[tool.maturin]
python-source = "src/python"
module-name = "zipminator._native"
```

### 2.2 Rust (cargo)

**For Rust developers and maximum performance.**

```bash
# Install binary from crates.io
cargo install zipminator

# Install from source
cargo install --git https://github.com/qdaria/zipminator.git

# Use as library dependency
# Cargo.toml:
# [dependencies]
# zipminator = "1.0"
```

**Cargo.toml:**
```toml
[package]
name = "zipminator"
version = "1.0.0"
edition = "2021"
description = "Quantum-resistant cryptography with QRNG and Kyber-768"

[[bin]]
name = "zipminator"
path = "src/rust/src/cli/main.rs"

[lib]
name = "zipminator"
path = "src/rust/src/lib.rs"
crate-type = ["cdylib", "rlib"]  # cdylib for PyO3, rlib for Rust

[dependencies]
clap = { version = "4.5", features = ["derive", "env", "cargo"] }
serde = { version = "1.0", features = ["derive"] }
toml = "0.8"
sha3 = "0.10"
subtle = "2.5"
rand_core = "0.6"
```

### 2.3 Homebrew (macOS/Linux)

**For system administrators and DevOps.**

```bash
brew install zipminator
```

**Implementation:**
- Create Homebrew formula in tap repository
- Build universal binaries (x86_64 + arm64 for macOS)
- Install completions for zsh/bash/fish

**Formula (zipminator.rb):**
```ruby
class Zipminator < Formula
  desc "Quantum-resistant cryptography CLI with QRNG and Kyber-768"
  homepage "https://github.com/qdaria/zipminator"
  url "https://github.com/qdaria/zipminator/archive/v1.0.0.tar.gz"
  sha256 "..."
  license "Apache-2.0"

  depends_on "rust" => :build
  depends_on "python@3.11"

  def install
    system "cargo", "install", *std_cargo_args

    # Install shell completions
    generate_completions_from_executable(bin/"zipminator", "completions")
  end

  test do
    system "#{bin}/zipminator", "--version"
  end
end
```

### 2.4 npm (Node.js ecosystem)

**For JavaScript/TypeScript developers (optional).**

```bash
npm install -g @qdaria/zipminator
# or
yarn global add @qdaria/zipminator
```

**Implementation:**
- Use napi-rs to create Node.js native addon
- Or shell out to Rust binary for CLI usage
- Publish to npm registry

**package.json:**
```json
{
  "name": "@qdaria/zipminator",
  "version": "1.0.0",
  "description": "Quantum-resistant cryptography CLI",
  "bin": {
    "zipminator": "./bin/zipminator"
  },
  "dependencies": {
    "napi-rs": "^2.16.0"
  },
  "scripts": {
    "build": "cargo build --release && napi build"
  }
}
```

---

## 3. Command Taxonomy

### 3.1 Command Structure

```
zipminator [GLOBAL_OPTIONS] <COMMAND> [SUBCOMMAND] [OPTIONS] [ARGS]
```

**Global Options:**
```
  -c, --config <FILE>    Configuration file [default: ~/.zipminator.toml]
  -v, --verbose          Verbose output
  -q, --quiet            Suppress output
  --log-level <LEVEL>    Log level [trace, debug, info, warn, error]
  -h, --help            Print help
  -V, --version         Print version
```

### 3.2 Core Commands

#### 3.2.1 QRNG Commands (`rng`)

```bash
# Generate quantum random bytes
zipminator rng generate [OPTIONS]
  --bytes <N>                Number of bytes to generate
  --output <FILE>            Output file (default: stdout as hex)
  --format <hex|base64|bin>  Output format
  --provider <PROVIDER>      Quantum provider (ibm, ionq, rigetti, aws, oqc)
  --proof                    Include proof-of-randomness certificate
  --entropy-pool             Use local entropy pool (cached)
  --quality-check            Perform NIST randomness tests

# Manage entropy pool
zipminator rng pool [SUBCOMMAND]
  status                     Show pool status
  refill                     Refill from quantum source
  export <FILE>              Export pool to file
  import <FILE>              Import pool from file
  stats                      Show entropy statistics

# List available quantum backends
zipminator rng backends
  --provider <PROVIDER>      Filter by provider
  --available-only           Only show operational backends
  --json                     Output as JSON

# Test QRNG connection
zipminator rng test
  --provider <PROVIDER>      Test specific provider
  --bytes <N>                Test with N bytes [default: 1024]
```

**Casino Use Case:**
```bash
# Generate provably fair random numbers for lottery
zipminator rng generate \
  --bytes 256 \
  --proof \
  --output lottery_draw.bin \
  --format hex \
  --provider ibm \
  --quality-check

# Verify randomness proof
zipminator rng verify-proof \
  --input lottery_draw.bin \
  --proof lottery_proof.json
```

#### 3.2.2 Key Management Commands (`keygen`)

```bash
# Generate Kyber-768 keypair
zipminator keygen [OPTIONS]
  --output-dir <DIR>         Output directory [default: ./keys]
  --public-key <FILE>        Public key file [default: public.key]
  --secret-key <FILE>        Secret key file [default: secret.key]
  --entropy-source <qrng|system>  Entropy source
  --format <pem|der|raw>     Key format
  --password                 Encrypt secret key with password

# Import existing key
zipminator keygen import \
  --input <FILE> \
  --format <pem|der> \
  --type <public|secret>

# Export public key
zipminator keygen export \
  --input secret.key \
  --output public.key \
  --format pem
```

**Cryptocurrency Use Case:**
```bash
# Generate quantum-resistant wallet keys
zipminator keygen \
  --output-dir ~/.crypto/wallets/quantum \
  --entropy-source qrng \
  --provider ibm \
  --password \
  --format pem

# Backup keys with additional entropy
zipminator keygen backup \
  --secret-key ~/.crypto/wallets/quantum/secret.key \
  --output backup.encrypted \
  --shard-count 5 \
  --threshold 3
```

#### 3.2.3 Encryption Commands (`encrypt`)

```bash
# Encrypt file with Kyber-768
zipminator encrypt [OPTIONS] <FILE>
  --output <FILE>            Output file
  --public-key <FILE>        Recipient's public key
  --kyber768                 Use Kyber-768 (default)
  --hybrid-mode              Hybrid Kyber + AES-256-GCM
  --armor                    ASCII armor output

# Decrypt file
zipminator decrypt [OPTIONS] <FILE>
  --output <FILE>            Output file
  --secret-key <FILE>        Recipient's secret key
  --password                 Password for encrypted key

# Hybrid encryption (Kyber + AES)
zipminator encrypt-hybrid <FILE>
  --public-key <FILE>
  --output <FILE>
  --chunk-size <SIZE>        Process in chunks (for large files)
```

**Healthcare Use Case (GDPR Compliance):**
```bash
# Encrypt patient data with quantum-resistant crypto
zipminator encrypt \
  patient_records.csv \
  --public-key hospital_public.key \
  --output patient_records.encrypted \
  --kyber768 \
  --armor \
  --audit-log compliance.log

# Decrypt for authorized access
zipminator decrypt \
  patient_records.encrypted \
  --secret-key doctor_secret.key \
  --password \
  --output patient_records.csv \
  --audit-log compliance.log
```

#### 3.2.4 Secure Channel Commands (`channel`)

```bash
# Create secure channel (key establishment)
zipminator channel create [OPTIONS]
  --public-key <FILE>        Recipient's public key
  --output <FILE>            Channel configuration file
  --role <initiator|responder>

# Encrypt message over channel
zipminator channel send \
  --channel <FILE> \
  --message <TEXT|FILE> \
  --output <FILE>

# Decrypt message from channel
zipminator channel receive \
  --channel <FILE> \
  --input <FILE> \
  --output <FILE>

# Close channel (forward secrecy)
zipminator channel close \
  --channel <FILE> \
  --wipe-keys
```

**Defense/NATO Use Case:**
```bash
# Establish quantum-secure communication channel
zipminator channel create \
  --public-key nato_command_public.key \
  --output secure_channel.conf \
  --role initiator \
  --entropy-source qrng

# Send classified message
zipminator channel send \
  --channel secure_channel.conf \
  --message "CLASSIFIED: Operation Phoenix" \
  --output transmission.enc

# Close channel with forward secrecy
zipminator channel close \
  --channel secure_channel.conf \
  --wipe-keys \
  --shred-passes 7
```

### 3.3 Industry-Specific Commands

#### 3.3.1 Casino Commands (`casino`)

```bash
# Generate lottery draw with proof
zipminator casino lottery \
  --numbers <COUNT> \
  --range <MIN-MAX> \
  --proof-output lottery_proof.json

# Generate provably fair seed
zipminator casino seed \
  --output server_seed.bin \
  --proof \
  --client-seed <OPTIONAL>

# Verify fairness proof
zipminator casino verify \
  --proof lottery_proof.json \
  --public

# Generate slot machine outcomes
zipminator casino slots \
  --spins <COUNT> \
  --rtp 96.5 \
  --output outcomes.csv
```

**Norsk Tipping Integration:**
```bash
# Weekly lottery draw (7 numbers from 1-34)
zipminator casino lottery \
  --numbers 7 \
  --range 1-34 \
  --proof-output lotto_$(date +%Y%m%d).json \
  --provider ibm \
  --backend ibm_oslo \
  --public-audit

# Generate hash chain for provable fairness
zipminator casino hash-chain \
  --length 1000000 \
  --output fairness_chain.bin \
  --entropy-source qrng
```

#### 3.3.2 Finance Commands (`finance`)

```bash
# Generate transaction IDs
zipminator finance transaction-id \
  --count <N> \
  --output txids.csv

# Encrypt financial data
zipminator finance encrypt-transaction \
  --input transaction.json \
  --output encrypted.bin \
  --recipient-key bank_public.key \
  --compliance psd2

# Generate secure session tokens
zipminator finance session-token \
  --duration 3600 \
  --entropy-source qrng \
  --format jwt

# SWIFT message encryption
zipminator finance swift-encrypt \
  --message <FILE> \
  --recipient-bic DNBANOKKXXX \
  --output encrypted_swift.msg
```

**DNB Bank Use Case:**
```bash
# Encrypt wire transfer instructions
zipminator finance encrypt-transaction \
  --input wire_transfer.json \
  --recipient-key dnb_receiving_bank.key \
  --output encrypted_transfer.bin \
  --compliance psd2 \
  --audit-trail /var/log/banking/

# Generate quantum-resistant customer tokens
zipminator finance session-token \
  --customer-id 123456789 \
  --duration 1800 \
  --entropy-source qrng \
  --provider ibm \
  --output customer_token.jwt
```

#### 3.3.3 Healthcare Commands (`healthcare`)

```bash
# Encrypt patient records (GDPR/HIPAA)
zipminator healthcare encrypt-ehr \
  --input patient_data.hl7 \
  --output encrypted_ehr.bin \
  --recipient-key hospital_public.key \
  --gdpr-compliant \
  --audit-log gdpr_audit.log

# Generate anonymization tokens
zipminator healthcare anonymize \
  --input patient_identifiers.csv \
  --output tokens.db \
  --irreversible

# Secure data sharing
zipminator healthcare share \
  --data patient_scan.dcm \
  --recipient researcher_public.key \
  --consent-token <TOKEN> \
  --purpose research \
  --expiry 30d
```

#### 3.3.4 Infrastructure Commands (`infra`)

```bash
# Encrypt SCADA commands
zipminator infra scada-encrypt \
  --command <HEX> \
  --controller-key plc_public.key \
  --output encrypted_command.bin

# Generate OT network keys
zipminator infra ot-keygen \
  --network-id <ID> \
  --device-count <N> \
  --output-dir keys/

# Secure firmware updates
zipminator infra firmware-sign \
  --firmware update.bin \
  --sign-key device_secret.key \
  --output update.signed \
  --kyber768
```

### 3.4 Configuration Commands (`config`)

```bash
# Initialize configuration
zipminator config init \
  --output ~/.zipminator.toml \
  --profile <casino|finance|defense|healthcare|crypto>

# Set provider credentials
zipminator config set-provider \
  --provider ibm \
  --token <TOKEN> \
  --instance <INSTANCE>

# Show current configuration
zipminator config show

# Validate configuration
zipminator config validate

# Import industry profile
zipminator config import-profile \
  --profile defense \
  --merge
```

### 3.5 Plugin Commands (`plugin`)

```bash
# List installed plugins
zipminator plugin list

# Install plugin
zipminator plugin install \
  --path ./custom_entropy.so \
  --name custom-provider

# Remove plugin
zipminator plugin remove custom-provider

# Test plugin
zipminator plugin test custom-provider \
  --verbose

# Create plugin template
zipminator plugin init \
  --name my-provider \
  --type entropy-source \
  --output plugins/my-provider/
```

---

## 4. Configuration File Format

### 4.1 Default Configuration (.zipminator.toml)

```toml
# Zipminator Configuration
version = "1.0.0"

[general]
log_level = "info"
default_provider = "ibm"
entropy_pool_size = 1048576  # 1 MB
default_key_format = "pem"

[entropy]
# Entropy pool configuration
pool_enabled = true
pool_path = "~/.zipminator/entropy_pool.bin"
auto_refill = true
refill_threshold = 102400  # Refill when < 100 KB
quality_check = true  # Run NIST tests on harvested entropy

[providers.ibm]
enabled = true
token_env = "IBM_QUANTUM_TOKEN"
instance_env = "IBM_QUANTUM_INSTANCE"
preferred_backends = ["ibm_brisbane", "ibm_kyoto", "ibm_osaka"]
max_qubits = 127
rate_limit_per_minute = 10

[providers.ionq]
enabled = false
api_key_env = "IONQ_API_KEY"
backend = "ionq_harmony"
max_qubits = 11

[providers.rigetti]
enabled = false
api_key_env = "RIGETTI_API_KEY"
backend = "Aspen-M-3"

[providers.aws_braket]
enabled = false
access_key_env = "AWS_ACCESS_KEY_ID"
secret_key_env = "AWS_SECRET_ACCESS_KEY"
region = "us-east-1"
device_arn = "arn:aws:braket:us-east-1::device/qpu/ionq/Harmony"

[providers.oqc]
enabled = false
api_key_env = "OQC_API_KEY"

[kyber]
# Kyber-768 configuration
variant = "kyber768"
constant_time = true
use_qrng_entropy = true
fallback_to_system = true

[encryption]
default_mode = "kyber768"
hybrid_enabled = true
hybrid_symmetric = "aes-256-gcm"
chunk_size = 1048576  # 1 MB chunks for large files

[audit]
enabled = false
log_path = "/var/log/zipminator/audit.log"
include_commands = true
include_entropy_usage = true
gdpr_compliant = false

[cache]
enabled = true
cache_dir = "~/.zipminator/cache"
provider_info_ttl = 3600  # 1 hour
backend_status_ttl = 300   # 5 minutes

[plugins]
plugin_dir = "~/.zipminator/plugins"
auto_load = []
```

### 4.2 Industry-Specific Profiles

#### Casino Profile (profiles/casino.toml)
```toml
[general]
default_provider = "ibm"
log_level = "info"

[entropy]
pool_enabled = true
quality_check = true  # CRITICAL for gaming compliance
nist_tests = ["frequency", "runs", "fft", "cumulative_sums"]

[audit]
enabled = true
log_path = "/var/log/gambling/zipminator_audit.log"
include_entropy_usage = true
public_audit = true
proof_of_randomness = true

[gaming]
# Gaming-specific settings
fairness_proofs = true
hash_chain_enabled = true
rng_certification = "iTech_Labs_ISO_17025"
```

#### Finance Profile (profiles/finance.toml)
```toml
[general]
default_provider = "ibm"
log_level = "warn"

[encryption]
default_mode = "hybrid"
require_key_password = true
key_derivation = "argon2id"

[audit]
enabled = true
log_path = "/var/log/finance/crypto_audit.log"
include_commands = true
gdpr_compliant = true
psd2_compliant = true

[finance]
# Finance-specific settings
transaction_encryption = "kyber768"
swift_integration = true
regulatory_compliance = ["PSD2", "GDPR", "PCI-DSS"]
```

#### Defense Profile (profiles/defense.toml)
```toml
[general]
default_provider = "aws_braket"  # Gov cloud
log_level = "error"  # Minimal logging

[encryption]
default_mode = "kyber768"
forward_secrecy = true
key_rotation_interval = 86400  # 24 hours

[security]
# Defense-grade security
require_hardware_security_module = true
tamper_detection = true
secure_deletion_passes = 7
constant_time_operations = true

[audit]
enabled = true
log_path = "/classified/crypto_audit.log"
classification_level = "SECRET"
```

---

## 5. Plugin System Design

### 5.1 Plugin Architecture

**Plugins extend Zipminator's functionality through a stable ABI.**

#### Plugin Types:
1. **Entropy Source Plugins** - Custom QRNG hardware/services
2. **Cryptographic Primitive Plugins** - Additional PQC algorithms
3. **Output Format Plugins** - Custom serialization
4. **Compliance Plugins** - Industry-specific validators

### 5.2 Plugin Interface (Rust Trait)

```rust
// src/rust/src/plugins/traits.rs

use std::error::Error;
use serde::{Serialize, Deserialize};

/// Trait for custom entropy sources
pub trait EntropySourcePlugin: Send + Sync {
    /// Plugin metadata
    fn metadata(&self) -> PluginMetadata;

    /// Initialize plugin with configuration
    fn init(&mut self, config: &PluginConfig) -> Result<(), Box<dyn Error>>;

    /// Check if entropy source is available
    fn is_available(&self) -> bool;

    /// Get health status
    fn health_check(&self) -> HealthStatus;

    /// Generate random bytes
    fn generate_bytes(&self, num_bytes: usize) -> Result<Vec<u8>, Box<dyn Error>>;

    /// Get entropy quality metrics
    fn quality_metrics(&self) -> EntropyQualityMetrics;

    /// Shutdown plugin gracefully
    fn shutdown(&mut self);
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginMetadata {
    pub name: String,
    pub version: String,
    pub author: String,
    pub description: String,
    pub capabilities: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginConfig {
    pub settings: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum HealthStatus {
    Healthy,
    Degraded(String),
    Unhealthy(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntropyQualityMetrics {
    pub min_entropy: f64,
    pub statistical_distance: f64,
    pub nist_compliant: bool,
}
```

### 5.3 Example Plugin Implementation

```rust
// plugins/examples/id_quantique_plugin.rs

use zipminator::plugins::{EntropySourcePlugin, PluginMetadata, HealthStatus};

pub struct IdQuantiquePlugin {
    device_path: String,
    device: Option<IdQuantiqueDevice>,
}

impl EntropySourcePlugin for IdQuantiquePlugin {
    fn metadata(&self) -> PluginMetadata {
        PluginMetadata {
            name: "ID Quantique QRNG".to_string(),
            version: "1.0.0".to_string(),
            author: "Zipminator Team".to_string(),
            description: "ID Quantique Quantis QRNG USB device".to_string(),
            capabilities: vec!["hardware_rng".to_string(), "high_throughput".to_string()],
        }
    }

    fn init(&mut self, config: &PluginConfig) -> Result<(), Box<dyn Error>> {
        self.device_path = config.settings["device_path"]
            .as_str()
            .ok_or("Missing device_path")?
            .to_string();

        self.device = Some(IdQuantiqueDevice::open(&self.device_path)?);
        Ok(())
    }

    fn is_available(&self) -> bool {
        self.device.is_some()
    }

    fn generate_bytes(&self, num_bytes: usize) -> Result<Vec<u8>, Box<dyn Error>> {
        let device = self.device.as_ref().ok_or("Device not initialized")?;
        device.read_bytes(num_bytes)
    }

    // ... other methods
}

// Export plugin entry point
#[no_mangle]
pub extern "C" fn create_plugin() -> Box<dyn EntropySourcePlugin> {
    Box::new(IdQuantiquePlugin::default())
}
```

### 5.4 Plugin Discovery and Loading

```rust
// src/rust/src/plugins/loader.rs

use libloading::{Library, Symbol};
use std::path::Path;

pub struct PluginLoader {
    plugins: Vec<Box<dyn EntropySourcePlugin>>,
    libraries: Vec<Library>,
}

impl PluginLoader {
    pub fn load_plugin<P: AsRef<Path>>(&mut self, path: P) -> Result<(), Box<dyn Error>> {
        unsafe {
            let lib = Library::new(path.as_ref())?;

            let create_plugin: Symbol<fn() -> Box<dyn EntropySourcePlugin>> =
                lib.get(b"create_plugin")?;

            let plugin = create_plugin();

            self.plugins.push(plugin);
            self.libraries.push(lib);
        }

        Ok(())
    }

    pub fn get_plugin(&self, name: &str) -> Option<&dyn EntropySourcePlugin> {
        self.plugins.iter()
            .find(|p| p.metadata().name == name)
            .map(|p| p.as_ref())
    }
}
```

### 5.5 Plugin Configuration

```toml
# .zipminator.toml
[plugins]
plugin_dir = "~/.zipminator/plugins"
auto_load = ["id_quantique", "custom_hsm"]

[plugins.id_quantique]
enabled = true
device_path = "/dev/qrng0"
buffer_size = 16384

[plugins.custom_hsm]
enabled = true
host = "hsm.internal.company.com"
port = 8443
cert_path = "/etc/zipminator/hsm.crt"
```

---

## 6. PyO3 Bindings Design

### 6.1 Rust Side (src/rust/src/python_bindings.rs)

```rust
use pyo3::prelude::*;
use pyo3::exceptions::PyValueError;

/// Python wrapper for Kyber768
#[pyclass(name = "Kyber768")]
pub struct PyKyber768 {
    inner: crate::kyber768::Kyber768,
}

#[pymethods]
impl PyKyber768 {
    #[new]
    fn new() -> Self {
        Self {
            inner: crate::kyber768::Kyber768::new(),
        }
    }

    /// Generate keypair
    fn keypair(&self, py: Python) -> PyResult<(Vec<u8>, Vec<u8>)> {
        py.allow_threads(|| {
            let (pk, sk) = self.inner.keypair()
                .map_err(|e| PyValueError::new_err(e.to_string()))?;
            Ok((pk.to_bytes(), sk.to_bytes()))
        })
    }

    /// Encapsulate shared secret
    fn encapsulate(&self, public_key: &[u8], py: Python) -> PyResult<(Vec<u8>, Vec<u8>)> {
        py.allow_threads(|| {
            let pk = PublicKey::from_bytes(public_key)
                .map_err(|e| PyValueError::new_err(e.to_string()))?;

            let (ciphertext, shared_secret) = self.inner.encapsulate(&pk)
                .map_err(|e| PyValueError::new_err(e.to_string()))?;

            Ok((ciphertext.to_bytes(), shared_secret.to_bytes()))
        })
    }

    /// Decapsulate shared secret
    fn decapsulate(&self, secret_key: &[u8], ciphertext: &[u8], py: Python) -> PyResult<Vec<u8>> {
        py.allow_threads(|| {
            let sk = SecretKey::from_bytes(secret_key)
                .map_err(|e| PyValueError::new_err(e.to_string()))?;
            let ct = Ciphertext::from_bytes(ciphertext)
                .map_err(|e| PyValueError::new_err(e.to_string()))?;

            let shared_secret = self.inner.decapsulate(&sk, &ct)
                .map_err(|e| PyValueError::new_err(e.to_string()))?;

            Ok(shared_secret.to_bytes())
        })
    }
}

/// Python wrapper for QRNG
#[pyclass(name = "QuantumRNG")]
pub struct PyQuantumRNG {
    // Wrapper for multi-provider harvester
}

#[pymethods]
impl PyQuantumRNG {
    #[new]
    fn new() -> Self {
        // Initialize with Python QRNG code
        Self {}
    }

    /// Generate quantum random bytes
    fn generate_bytes(&self, num_bytes: usize, provider: Option<&str>) -> PyResult<Vec<u8>> {
        // Call into Python multi_provider_harvester.py
        Python::with_gil(|py| {
            let harvester = py.import("zipminator.multi_provider_harvester")?;
            let result = harvester.call_method1("harvest_quantum_entropy", (num_bytes, provider))?;
            result.extract()
        })
    }
}

/// Module entry point
#[pymodule]
fn _native(_py: Python, m: &PyModule) -> PyResult<()> {
    m.add_class::<PyKyber768>()?;
    m.add_class::<PyQuantumRNG>()?;
    Ok(())
}
```

### 6.2 Python Side (src/python/zipminator/__init__.py)

```python
"""
Zipminator - Quantum-Resistant Cryptography CLI
"""

from ._native import Kyber768, QuantumRNG
from .cli import cli
from .multi_provider_harvester import MultiProviderHarvester

__version__ = "1.0.0"
__all__ = ["Kyber768", "QuantumRNG", "cli", "MultiProviderHarvester"]

# Convenience functions
def generate_keypair():
    """Generate Kyber-768 keypair"""
    kyber = Kyber768()
    return kyber.keypair()

def generate_random_bytes(num_bytes: int, provider: str = "ibm") -> bytes:
    """Generate quantum random bytes"""
    qrng = QuantumRNG()
    return bytes(qrng.generate_bytes(num_bytes, provider))
```

### 6.3 Type Stubs (src/python/zipminator/_native.pyi)

```python
"""Type stubs for Rust native module"""

class Kyber768:
    """CRYSTALS-Kyber-768 post-quantum KEM"""

    def __init__(self) -> None: ...

    def keypair(self) -> tuple[bytes, bytes]:
        """Generate keypair (public_key, secret_key)"""
        ...

    def encapsulate(self, public_key: bytes) -> tuple[bytes, bytes]:
        """Encapsulate shared secret (ciphertext, shared_secret)"""
        ...

    def decapsulate(self, secret_key: bytes, ciphertext: bytes) -> bytes:
        """Decapsulate shared secret"""
        ...

class QuantumRNG:
    """Quantum Random Number Generator"""

    def __init__(self) -> None: ...

    def generate_bytes(self, num_bytes: int, provider: str | None = None) -> list[int]:
        """Generate quantum random bytes"""
        ...
```

---

## 7. Cross-Platform Considerations

### 7.1 Platform Support Matrix

| Platform | Rust Binary | Python Wheel | Homebrew | npm |
|----------|------------|--------------|----------|-----|
| **macOS x86_64** | ✅ | ✅ | ✅ | ✅ |
| **macOS ARM64** | ✅ | ✅ | ✅ | ✅ |
| **Linux x86_64** | ✅ | ✅ | ⚠️ Linuxbrew | ✅ |
| **Linux ARM64** | ✅ | ✅ | ⚠️ Linuxbrew | ✅ |
| **Windows x86_64** | ✅ | ✅ | ❌ | ✅ |

### 7.2 Build Matrix (GitHub Actions)

```yaml
# .github/workflows/build.yml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-rust:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        arch: [x86_64, aarch64]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - name: Build binary
        run: cargo build --release
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: zipminator-${{ matrix.os }}-${{ matrix.arch }}
          path: target/release/zipminator

  build-python:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        python-version: ['3.9', '3.10', '3.11', '3.12']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
      - name: Build wheel
        run: |
          pip install maturin
          maturin build --release --out dist
      - name: Upload wheel
        uses: actions/upload-artifact@v4
        with:
          name: wheel-${{ matrix.os }}-py${{ matrix.python-version }}
          path: dist/*.whl
```

### 7.3 Platform-Specific Features

#### macOS
- Universal binaries (x86_64 + arm64)
- Code signing with Apple Developer ID
- Notarization for Gatekeeper
- Keychain integration for secure key storage

#### Linux
- AppImage for universal distribution
- Integration with systemd for service mode
- Support for hardware security modules (PKCS#11)

#### Windows
- MSI installer with WiX
- Windows Credential Manager integration
- Windows Defender SmartScreen signing

---

## 8. Performance Optimization

### 8.1 Kyber-768 Performance Targets

| Operation | Target (Rust) | Current C++ Baseline | Status |
|-----------|--------------|---------------------|--------|
| **Keypair Generation** | < 0.015 ms | 0.034 ms | 🎯 Target |
| **Encapsulation** | < 0.012 ms | 0.034 ms | 🎯 Target |
| **Decapsulation** | < 0.015 ms | 0.034 ms | 🎯 Target |
| **Full Cycle** | < 0.034 ms | 0.034 ms | ✅ At parity |

### 8.2 Optimization Strategies

1. **SIMD Acceleration**
   - AVX2 for x86_64
   - NEON for ARM64
   - Portable SIMD fallback

2. **Constant-Time Operations**
   - Use `subtle` crate for CT operations
   - Prevent timing side-channels
   - Cache-timing resistant

3. **Memory Pool**
   - Pre-allocate polynomial buffers
   - Reduce heap allocations
   - Zero-copy where possible

4. **Entropy Caching**
   - Local entropy pool (1 MB default)
   - Background refill
   - Quality-checked QRNG bytes

### 8.3 Benchmarking

```rust
// benches/cli_bench.rs
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn benchmark_full_workflow(c: &mut Criterion) {
    c.bench_function("cli: keygen + encrypt + decrypt", |b| {
        b.iter(|| {
            // Benchmark full CLI workflow
            let (pk, sk) = kyber.keypair().unwrap();
            let plaintext = black_box(b"Secret message");
            let (ct, ss1) = kyber.encapsulate(&pk).unwrap();
            let ss2 = kyber.decapsulate(&sk, &ct).unwrap();
            assert_eq!(ss1, ss2);
        });
    });
}

criterion_group!(benches, benchmark_full_workflow);
criterion_main!(benches);
```

---

## 9. Security Considerations

### 9.1 Threat Model

**Adversary Capabilities:**
- Quantum computer with Shor's algorithm (breaks RSA/ECC)
- Side-channel attacks (timing, cache, power)
- Supply chain compromise
- Nation-state level resources

**Security Goals:**
1. **Post-Quantum Security** - Resist quantum attacks via Kyber-768
2. **Side-Channel Resistance** - Constant-time operations
3. **Forward Secrecy** - Ephemeral keys with secure deletion
4. **Entropy Quality** - True quantum randomness, NIST-validated

### 9.2 Secure Key Storage

```rust
// Secure key storage with memory protection
use zeroize::{Zeroize, ZeroizeOnDrop};
use mlock::LockGuard;

#[derive(Zeroize, ZeroizeOnDrop)]
pub struct SecureKey {
    #[zeroize(skip)]
    _lock: LockGuard,
    key_material: Vec<u8>,
}

impl SecureKey {
    pub fn new(key: Vec<u8>) -> Result<Self, Error> {
        let lock = LockGuard::new(&key)?;  // mlock() to prevent swapping
        Ok(Self {
            _lock: lock,
            key_material: key,
        })
    }
}
// key_material is zeroized on drop
```

### 9.3 Secure Deletion

```rust
// Secure file deletion (7-pass DoD 5220.22-M)
pub fn secure_delete_file(path: &Path) -> Result<(), Error> {
    use std::fs::OpenOptions;
    use std::io::{Seek, Write};

    let mut file = OpenOptions::new().write(true).open(path)?;
    let file_size = file.metadata()?.len();

    for pass in 0..7 {
        file.seek(SeekFrom::Start(0))?;

        let pattern = match pass {
            0 => 0x00,  // All zeros
            1 => 0xFF,  // All ones
            _ => rand::random::<u8>(),  // Random
        };

        let buffer = vec![pattern; 4096];
        for _ in 0..(file_size / 4096) {
            file.write_all(&buffer)?;
        }
        file.sync_all()?;
    }

    std::fs::remove_file(path)?;
    Ok(())
}
```

### 9.4 Audit Logging

```rust
// GDPR-compliant audit logging
pub struct AuditLogger {
    log_file: File,
    gdpr_mode: bool,
}

impl AuditLogger {
    pub fn log_operation(&mut self, op: &str, metadata: &AuditMetadata) {
        let entry = AuditEntry {
            timestamp: Utc::now(),
            operation: op.to_string(),
            user: if self.gdpr_mode {
                hash_user_id(&metadata.user)  // Pseudonymize
            } else {
                metadata.user.clone()
            },
            entropy_bytes: metadata.entropy_bytes,
            provider: metadata.provider.clone(),
            success: metadata.success,
        };

        writeln!(self.log_file, "{}", serde_json::to_string(&entry).unwrap());
    }
}
```

---

## 10. Testing Strategy

### 10.1 Test Categories

1. **Unit Tests** - Individual functions and modules
2. **Integration Tests** - Multi-component workflows
3. **NIST KAT Tests** - Known Answer Tests for Kyber-768
4. **Randomness Tests** - NIST SP 800-22 statistical tests
5. **Constant-Time Tests** - Side-channel resistance validation
6. **CLI Tests** - End-to-end command testing

### 10.2 NIST Randomness Testing

```rust
// tests/randomness_tests.rs
use zipminator::qrng::MultiProviderHarvester;
use nist_test_suite::{frequency_test, runs_test, fft_test};

#[test]
fn test_qrng_randomness_quality() {
    let harvester = MultiProviderHarvester::new(None).unwrap();
    let entropy = harvester.harvest_quantum_entropy(1_000_000, None, 8).unwrap();

    // NIST SP 800-22 tests
    assert!(frequency_test(&entropy) > 0.01, "Frequency test failed");
    assert!(runs_test(&entropy) > 0.01, "Runs test failed");
    assert!(fft_test(&entropy) > 0.01, "FFT test failed");
}
```

### 10.3 CLI Integration Tests

```rust
// tests/cli_integration.rs
use assert_cmd::Command;

#[test]
fn test_keygen_command() {
    let temp_dir = tempdir().unwrap();

    let mut cmd = Command::cargo_bin("zipminator").unwrap();
    cmd.args(&[
        "keygen",
        "--output-dir", temp_dir.path().to_str().unwrap(),
        "--entropy-source", "system",  // Use system for CI
    ]);

    cmd.assert().success();

    // Verify keys were created
    assert!(temp_dir.path().join("public.key").exists());
    assert!(temp_dir.path().join("secret.key").exists());
}

#[test]
fn test_encrypt_decrypt_roundtrip() {
    let temp_dir = tempdir().unwrap();

    // Generate keys
    Command::cargo_bin("zipminator").unwrap()
        .args(&["keygen", "--output-dir", temp_dir.path().to_str().unwrap()])
        .assert().success();

    // Encrypt file
    let plaintext = b"Secret quantum message";
    let input_file = temp_dir.path().join("plaintext.txt");
    std::fs::write(&input_file, plaintext).unwrap();

    Command::cargo_bin("zipminator").unwrap()
        .args(&[
            "encrypt",
            input_file.to_str().unwrap(),
            "--public-key", temp_dir.path().join("public.key").to_str().unwrap(),
            "--output", temp_dir.path().join("encrypted.bin").to_str().unwrap(),
        ])
        .assert().success();

    // Decrypt file
    Command::cargo_bin("zipminator").unwrap()
        .args(&[
            "decrypt",
            temp_dir.path().join("encrypted.bin").to_str().unwrap(),
            "--secret-key", temp_dir.path().join("secret.key").to_str().unwrap(),
            "--output", temp_dir.path().join("decrypted.txt").to_str().unwrap(),
        ])
        .assert().success();

    // Verify roundtrip
    let decrypted = std::fs::read(temp_dir.path().join("decrypted.txt")).unwrap();
    assert_eq!(plaintext, decrypted.as_slice());
}
```

---

## 11. Documentation Strategy

### 11.1 Documentation Types

1. **API Documentation** - Rust docs (docs.rs)
2. **User Guide** - Markdown in `/docs`
3. **Industry Guides** - Sector-specific tutorials
4. **Plugin Development** - Plugin API guide
5. **Security Whitepaper** - Cryptographic analysis

### 11.2 Documentation Structure

```
docs/
├── CLI_ARCHITECTURE.md          # This document
├── USER_GUIDE.md                # Getting started, installation
├── API_REFERENCE.md             # Rust API docs
├── PLUGIN_DEVELOPMENT.md        # Plugin creation guide
├── SECURITY_WHITEPAPER.md       # Cryptographic security analysis
│
├── INDUSTRY_GUIDES/
│   ├── casino.md                # Norsk Tipping use case
│   ├── finance.md               # DNB Bank use case
│   ├── defense.md               # NATO/defense use case
│   ├── healthcare.md            # GDPR/HIPAA compliance
│   ├── infrastructure.md        # SCADA/ICS security
│   └── cryptocurrency.md        # Wallet key generation
│
├── TUTORIALS/
│   ├── quickstart.md
│   ├── provably_fair_gaming.md
│   ├── secure_file_encryption.md
│   └── building_plugins.md
│
└── COMPLIANCE/
    ├── NIST_VALIDATION.md
    ├── FIPS_COMPLIANCE.md
    └── GDPR_COMPLIANCE.md
```

### 11.3 Man Pages

Generate man pages from CLI structure:

```bash
# Generate man pages
zipminator man --output /usr/local/share/man/man1/

# View man page
man zipminator
man zipminator-rng
man zipminator-encrypt
```

---

## 12. Deployment and Distribution

### 12.1 Release Checklist

- [ ] Run full test suite (unit, integration, NIST KAT)
- [ ] Update version in all Cargo.toml and pyproject.toml files
- [ ] Update CHANGELOG.md
- [ ] Build binaries for all platforms
- [ ] Build Python wheels for all platforms
- [ ] Sign binaries (macOS, Windows)
- [ ] Create GitHub release with binaries
- [ ] Publish to crates.io
- [ ] Publish to PyPI
- [ ] Update Homebrew formula
- [ ] Publish to npm (if applicable)
- [ ] Update documentation

### 12.2 Versioning Strategy

Follow **Semantic Versioning 2.0.0**:
- `MAJOR.MINOR.PATCH`
- Breaking changes: increment MAJOR
- New features: increment MINOR
- Bug fixes: increment PATCH

**Version Synchronization:**
- Keep Rust, Python, and npm packages in sync
- Use same version number across all distributions

### 12.3 Distribution Channels

| Channel | Target Audience | Update Frequency |
|---------|----------------|------------------|
| **crates.io** | Rust developers | On release |
| **PyPI** | Python developers | On release |
| **Homebrew** | macOS/Linux users | On release |
| **npm** | Node.js developers | On release |
| **GitHub Releases** | All users | On release |
| **Docker Hub** | Containerized environments | On release |

---

## 13. Future Roadmap

### 13.1 Phase 1: Core CLI (v1.0.0)
- ✅ Rust Kyber-768 implementation
- ✅ Multi-provider QRNG harvester
- ⏳ Python bindings (PyO3)
- ⏳ CLI command structure
- ⏳ Configuration system
- ⏳ Basic plugin system

### 13.2 Phase 2: Industry Features (v1.1.0)
- ⏳ Casino-specific commands
- ⏳ Finance-specific commands
- ⏳ Healthcare GDPR compliance
- ⏳ Defense-grade secure channels
- ⏳ Infrastructure SCADA encryption

### 13.3 Phase 3: Advanced Features (v1.2.0)
- ⏳ Hardware security module (HSM) integration
- ⏳ Threshold cryptography (Shamir secret sharing)
- ⏳ Multi-signature support
- ⏳ Forward-secure encryption
- ⏳ Quantum-secure VPN mode

### 13.4 Phase 4: Ecosystem (v2.0.0)
- ⏳ GUI application
- ⏳ Web service API
- ⏳ Mobile SDK (iOS/Android)
- ⏳ Cloud service integration
- ⏳ Enterprise features (SSO, RBAC)

---

## 14. Architectural Decisions

### ADR-001: Rust Core with Language Bindings
**Decision:** Implement core functionality in Rust with PyO3 bindings for Python.

**Rationale:**
- Memory safety guarantees prevent common vulnerabilities
- Constant-time operations prevent side-channel attacks
- Performance meets or exceeds C++ baseline
- Single codebase maintains across all platforms

**Alternatives Considered:**
- Pure Python: Too slow for cryptographic operations
- C/C++: Memory safety concerns, harder to maintain

### ADR-002: Multi-Provider QRNG Architecture
**Decision:** Support multiple quantum providers with automatic failover.

**Rationale:**
- No single point of failure
- Geographic diversity (IBM US/EU, IonQ, Rigetti)
- Cost optimization (use cheapest available)
- Provider competition drives quality

**Alternatives Considered:**
- Single provider: Vendor lock-in risk
- Classical PRNG: Not quantum-resistant

### ADR-003: Plugin System for Extensibility
**Decision:** Dynamic plugin loading via shared libraries.

**Rationale:**
- Custom entropy sources (ID Quantique hardware, etc.)
- Industry-specific cryptographic primitives
- Third-party integrations without forking
- Stable ABI for plugin compatibility

**Alternatives Considered:**
- Statically linked: Requires recompilation
- Script-based: Performance overhead

### ADR-004: TOML Configuration Format
**Decision:** Use TOML for configuration files.

**Rationale:**
- Human-readable and editable
- Native Rust support (serde)
- Industry-standard for CLI tools
- Comments for documentation

**Alternatives Considered:**
- JSON: No comments, less readable
- YAML: Indentation-sensitive, parsing complexity

### ADR-005: Industry-Specific Command Namespaces
**Decision:** Create dedicated command namespaces for each industry.

**Rationale:**
- Tailored workflows (casino lottery vs. bank transactions)
- Industry-specific defaults and compliance
- Easier onboarding for domain experts
- Marketing differentiation

**Alternatives Considered:**
- Generic commands only: Harder to discover features
- Separate binaries per industry: Maintenance burden

---

## 15. Success Metrics

### 15.1 Performance Metrics
- [ ] Kyber-768 operations < 0.034 ms (at parity with C++)
- [ ] CLI startup time < 50 ms (cold start)
- [ ] Entropy harvesting > 1 KB/s from QRNG
- [ ] Memory usage < 50 MB for typical operations

### 15.2 Adoption Metrics
- [ ] 1,000+ downloads in first month
- [ ] 5+ industry deployments in first year
- [ ] 10+ community plugins
- [ ] 100+ GitHub stars

### 15.3 Quality Metrics
- [ ] 90%+ code coverage
- [ ] Zero critical security vulnerabilities
- [ ] NIST KAT tests: 100% pass rate
- [ ] Constant-time validation: 100% pass rate

---

## 16. Conclusion

This architecture defines a **universal, industry-grade CLI** for quantum-resistant cryptography that:

1. **Serves Multiple Industries** - Gaming, finance, defense, healthcare, infrastructure, cryptocurrency
2. **Provides True Quantum Randomness** - Multi-provider QRNG with automatic failover
3. **Implements Post-Quantum Cryptography** - CRYSTALS-Kyber-768 with constant-time guarantees
4. **Offers Universal Installation** - pip, cargo, brew, npm support
5. **Enables Extensibility** - Plugin system for custom entropy sources and primitives

**Next Steps:**
1. Implement PyO3 bindings for Rust Kyber-768
2. Create CLI command structure with clap
3. Integrate existing Python QRNG harvester
4. Develop plugin system and example plugins
5. Write comprehensive tests and documentation
6. Build and distribute across all platforms

---

**Document Version:** 1.0.0
**Last Updated:** 2025-01-04
**Authors:** Zipminator Architecture Team
**Status:** Approved for Implementation
