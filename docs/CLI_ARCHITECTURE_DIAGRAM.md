# Zipminator CLI Architecture - Visual Diagrams

**Date:** 2025-01-04
**Version:** 1.0.0

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ZIPMINATOR CLI ARCHITECTURE                       │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    INSTALLATION METHODS                             │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │ │
│  │  │   pip    │  │  cargo   │  │   brew   │  │   npm    │           │ │
│  │  │  install │  │  install │  │  install │  │ install  │           │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘           │ │
│  └───────┼─────────────┼─────────────┼─────────────┼──────────────────┘ │
│          │             │             │             │                     │
│  ┌───────▼─────────────▼─────────────▼─────────────▼──────────────────┐ │
│  │                      CLI LAYER (clap v4)                            │ │
│  │  ┌──────────────────────────────────────────────────────────────┐  │ │
│  │  │  Commands: rng | keygen | encrypt | decrypt | channel       │  │ │
│  │  │  Industry: casino | finance | healthcare | infra            │  │ │
│  │  │  System:   config | plugin                                  │  │ │
│  │  └──────────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────┬─────────────────────────────┘ │
│                                        │                                 │
│  ┌─────────────────────────────────────▼─────────────────────────────┐ │
│  │                 RUST CORE LIBRARY (kyber768)                      │ │
│  │  ┌──────────────────────┐  ┌──────────────────────┐              │ │
│  │  │   Kyber-768 KEM      │  │   QRNG Multi-Provider │             │ │
│  │  │  ┌────────────────┐  │  │  ┌────────────────┐  │              │ │
│  │  │  │ Keypair Gen    │  │  │  │ IBM Quantum    │  │              │ │
│  │  │  │ Encapsulate    │  │  │  │ IonQ           │  │              │ │
│  │  │  │ Decapsulate    │  │  │  │ Rigetti        │  │              │ │
│  │  │  │ Constant-time  │  │  │  │ AWS Braket     │  │              │ │
│  │  │  └────────────────┘  │  │  │ OQC            │  │              │ │
│  │  └──────────────────────┘  │  └────────────────┘  │              │ │
│  │                            │                       │              │ │
│  │  ┌──────────────────────┐  │  ┌────────────────┐  │              │ │
│  │  │  Entropy Pool        │  │  │ Plugin System  │  │              │ │
│  │  │  ┌────────────────┐  │  │  │ ┌────────────┐ │  │              │ │
│  │  │  │ Cache (1 MB)   │  │  │  │ │ libloading │ │  │              │ │
│  │  │  │ Auto-refill    │  │  │  │ │ Stable ABI │ │  │              │ │
│  │  │  │ Quality check  │  │  │  │ └────────────┘ │  │              │ │
│  │  │  └────────────────┘  │  │  └────────────────┘  │              │ │
│  │  └──────────────────────┘  └──────────────────────┘              │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    LANGUAGE BINDINGS                                │ │
│  │  ┌──────────────────────┐  ┌──────────────────────┐               │ │
│  │  │   Python (PyO3)      │  │   Node.js (napi-rs)  │               │ │
│  │  │  ┌────────────────┐  │  │  ┌────────────────┐  │               │ │
│  │  │  │ _native.so     │  │  │  │ bindings.node  │  │               │ │
│  │  │  │ Type stubs     │  │  │  │ TypeScript     │  │               │ │
│  │  │  └────────────────┘  │  │  └────────────────┘  │               │ │
│  │  └──────────────────────┘  └──────────────────────┘               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    EXTERNAL INTEGRATIONS                            │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │ │
│  │  │ Quantum  │  │   HSM    │  │  Cloud   │  │  Audit   │           │ │
│  │  │ Hardware │  │  PKCS#11 │  │ Services │  │  Logging │           │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Multi-Provider QRNG Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                  MULTI-PROVIDER QRNG HARVESTER                        │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    Provider Selection Layer                      │ │
│  │  ┌───────────────────────────────────────────────────────────┐  │ │
│  │  │  Auto-select best provider based on:                      │  │ │
│  │  │  • Availability (operational status)                      │  │ │
│  │  │  • Queue depth (shortest wait)                           │  │ │
│  │  │  • Qubit count (maximize efficiency)                     │  │ │
│  │  │  • Cost (credits per shot)                               │  │ │
│  │  │  • Geographic location (latency)                         │  │ │
│  │  └───────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                      Provider Backends                           │ │
│  │                                                                  │ │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐   │ │
│  │  │    IBM    │  │   IonQ    │  │  Rigetti  │  │    AWS    │   │ │
│  │  │  Quantum  │  │  Harmony  │  │   Aspen   │  │  Braket   │   │ │
│  │  │           │  │           │  │           │  │           │   │ │
│  │  │ Brisbane  │  │ 11 qubits │  │ 79 qubits │  │   IonQ    │   │ │
│  │  │ 127 qubits│  │ Trapped   │  │ Supercon- │  │  Rigetti  │   │ │
│  │  │ Supercon- │  │   Ions    │  │  ducting  │  │    OQC    │   │ │
│  │  │  ducting  │  │           │  │           │  │           │   │ │
│  │  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘   │ │
│  └────────┼──────────────┼──────────────┼──────────────┼─────────┘ │
│           │              │              │              │             │
│           └──────────────┴──────────────┴──────────────┘             │
│                             │                                         │
│  ┌──────────────────────────▼──────────────────────────────────────┐ │
│  │                   Entropy Optimization Layer                     │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  Calculate optimal strategy:                             │  │ │
│  │  │  • num_qubits = (max_qubits // 8) * 8  (byte-aligned)   │  │ │
│  │  │  • bytes_per_shot = num_qubits // 8                     │  │ │
│  │  │  • num_shots = ceil(target_bytes / bytes_per_shot)      │  │ │
│  │  │                                                          │  │ │
│  │  │  Example (IBM Brisbane, 127 qubits, 1000 bytes):        │  │ │
│  │  │  • 120 qubits × 67 shots = 1005 bytes (optimal!)        │  │ │
│  │  │  vs. 8 qubits × 1000 shots = 1000 bytes (inefficient)   │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                     Local Entropy Pool                           │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  Pool Size: 1 MB (default)                               │  │ │
│  │  │  Auto-refill: When < 100 KB remaining                    │  │ │
│  │  │  Quality Check: NIST SP 800-22 tests                     │  │ │
│  │  │  Cached: ~/.zipminator/entropy_pool.bin                  │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Plugin System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         PLUGIN SYSTEM                                 │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                      Plugin Loader                               │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  libloading - Dynamic library loading                    │  │ │
│  │  │  Stable ABI - Compatible across versions                 │  │ │
│  │  │  Auto-discovery - Load from ~/.zipminator/plugins        │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                      Plugin Types                                │ │
│  │                                                                  │ │
│  │  ┌───────────────────┐  ┌───────────────────┐                  │ │
│  │  │ Entropy Source    │  │ Crypto Primitive  │                  │ │
│  │  │ Plugins           │  │ Plugins           │                  │ │
│  │  │ ┌───────────────┐ │  │ ┌───────────────┐ │                  │ │
│  │  │ │ ID Quantique  │ │  │ │ Dilithium     │ │                  │ │
│  │  │ │ QRNG USB      │ │  │ │ Signature     │ │                  │ │
│  │  │ │               │ │  │ │               │ │                  │ │
│  │  │ │ Custom HSM    │ │  │ │ SPHINCS+      │ │                  │ │
│  │  │ │               │ │  │ │ Signature     │ │                  │ │
│  │  │ │ Comscire      │ │  │ │               │ │                  │ │
│  │  │ │ Hardware RNG  │ │  │ │ McEliece      │ │                  │ │
│  │  │ └───────────────┘ │  │ └───────────────┘ │                  │ │
│  │  └───────────────────┘  └───────────────────┘                  │ │
│  │                                                                  │ │
│  │  ┌───────────────────┐  ┌───────────────────┐                  │ │
│  │  │ Output Format     │  │ Compliance        │                  │ │
│  │  │ Plugins           │  │ Plugins           │                  │ │
│  │  │ ┌───────────────┐ │  │ ┌───────────────┐ │                  │ │
│  │  │ │ JSON export   │ │  │ │ Gaming        │ │                  │ │
│  │  │ │               │ │  │ │ Compliance    │ │                  │ │
│  │  │ │ YAML export   │ │  │ │               │ │                  │ │
│  │  │ │               │ │  │ │ FIPS 140-3    │ │                  │ │
│  │  │ │ Binary pack   │ │  │ │ Validator     │ │                  │ │
│  │  │ └───────────────┘ │  │ └───────────────┘ │                  │ │
│  │  └───────────────────┘  └───────────────────┘                  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    Plugin Interface (Rust Trait)                 │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  pub trait EntropySourcePlugin: Send + Sync {            │  │ │
│  │  │      fn metadata(&self) -> PluginMetadata;               │  │ │
│  │  │      fn init(&mut self, config: &PluginConfig) -> ...;   │  │ │
│  │  │      fn is_available(&self) -> bool;                     │  │ │
│  │  │      fn generate_bytes(&self, n: usize) -> ...;          │  │ │
│  │  │      fn quality_metrics(&self) -> ...;                   │  │ │
│  │  │  }                                                        │  │ │
│  │  │                                                          │  │ │
│  │  │  #[no_mangle]                                           │  │ │
│  │  │  pub extern "C" fn create_plugin() ->                  │  │ │
│  │  │      Box<dyn EntropySourcePlugin> { ... }             │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 4. Industry-Specific Command Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                    INDUSTRY COMMAND WORKFLOWS                         │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  CASINO (Norsk Tipping)                                          │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  zipminator casino lottery \                              │  │ │
│  │  │    --numbers 7 \                                          │  │ │
│  │  │    --range 1-34 \                                         │  │ │
│  │  │    --proof-output lotto_20250104.json \                   │  │ │
│  │  │    --provider ibm \                                       │  │ │
│  │  │    --public-audit                                         │  │ │
│  │  │                                                          │  │ │
│  │  │  Flow:                                                   │  │ │
│  │  │  1. Connect to IBM Quantum (ibm_brisbane)               │  │ │
│  │  │  2. Generate 7 quantum random numbers (1-34)            │  │ │
│  │  │  3. Create cryptographic proof of randomness            │  │ │
│  │  │  4. Save proof to JSON (public verification)            │  │ │
│  │  │  5. Return winning numbers                              │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  FINANCE (DNB Bank)                                              │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  zipminator finance encrypt-transaction \                 │  │ │
│  │  │    --input wire_transfer.json \                          │  │ │
│  │  │    --recipient-key dnb_receiving_bank.key \              │  │ │
│  │  │    --compliance psd2 \                                   │  │ │
│  │  │    --audit-trail /var/log/banking/                      │  │ │
│  │  │                                                          │  │ │
│  │  │  Flow:                                                   │  │ │
│  │  │  1. Load transaction data (JSON)                        │  │ │
│  │  │  2. Load recipient's Kyber-768 public key               │  │ │
│  │  │  3. Encapsulate shared secret (Kyber KEM)               │  │ │
│  │  │  4. Encrypt transaction with AES-256-GCM                │  │ │
│  │  │  5. Log to PSD2-compliant audit trail                   │  │ │
│  │  │  6. Return encrypted blob                               │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  DEFENSE (NATO)                                                  │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  zipminator channel create \                              │  │ │
│  │  │    --public-key nato_command_public.key \                │  │ │
│  │  │    --role initiator \                                    │  │ │
│  │  │    --entropy-source qrng                                 │  │ │
│  │  │                                                          │  │ │
│  │  │  Flow:                                                   │  │ │
│  │  │  1. Generate ephemeral Kyber-768 keypair (QRNG entropy) │  │ │
│  │  │  2. Encapsulate with recipient's static public key      │  │ │
│  │  │  3. Derive channel encryption key (KDF)                 │  │ │
│  │  │  4. Save channel config (forward secrecy ready)         │  │ │
│  │  │  5. Lock keys in memory (mlock)                         │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  HEALTHCARE (GDPR)                                               │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  zipminator healthcare encrypt-ehr \                      │  │ │
│  │  │    --input patient_data.hl7 \                            │  │ │
│  │  │    --recipient-key hospital_public.key \                 │  │ │
│  │  │    --gdpr-compliant \                                    │  │ │
│  │  │    --audit-log gdpr_audit.log                           │  │ │
│  │  │                                                          │  │ │
│  │  │  Flow:                                                   │  │ │
│  │  │  1. Parse HL7 patient data                              │  │ │
│  │  │  2. Encrypt with Kyber-768 (quantum-resistant)          │  │ │
│  │  │  3. Pseudonymize patient ID in audit log (GDPR)         │  │ │
│  │  │  4. Record data processing event                        │  │ │
│  │  │  5. Return encrypted EHR                                │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 5. Installation Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                      INSTALLATION FLOW                                │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Python Installation (pip)                                       │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  $ pip install zipminator-pqc                             │  │ │
│  │  │                                                          │  │ │
│  │  │  1. Download wheel from PyPI                            │  │ │
│  │  │  2. Extract Rust extension module (_native.so)          │  │ │
│  │  │  3. Install Python wrapper (zipminator/)                │  │ │
│  │  │  4. Install dependencies (qiskit, click, toml)          │  │ │
│  │  │  5. Create CLI entry point (zipminator command)         │  │ │
│  │  │  6. Install shell completions (optional)                │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Rust Installation (cargo)                                       │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  $ cargo install zipminator                               │  │ │
│  │  │                                                          │  │ │
│  │  │  1. Download source from crates.io                      │  │ │
│  │  │  2. Compile Rust binary (release mode)                  │  │ │
│  │  │  3. Install to ~/.cargo/bin/zipminator                  │  │ │
│  │  │  4. Generate shell completions (zsh/bash/fish)          │  │ │
│  │  │  5. No Python dependencies (pure Rust)                  │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Homebrew Installation (brew)                                    │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  $ brew install zipminator                                │  │ │
│  │  │                                                          │  │ │
│  │  │  1. Download pre-built universal binary (x86_64+ARM64)  │  │ │
│  │  │  2. Install to /usr/local/bin/zipminator                │  │ │
│  │  │  3. Install man pages to /usr/local/share/man/          │  │ │
│  │  │  4. Install shell completions to /usr/local/share/      │  │ │
│  │  │  5. Create config directory ~/.zipminator/              │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  npm Installation (Node.js)                                      │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  $ npm install -g @qdaria/zipminator                      │  │ │
│  │  │                                                          │  │ │
│  │  │  1. Download package from npm registry                  │  │ │
│  │  │  2. Extract native addon (bindings.node) OR            │  │ │
│  │  │     Shell wrapper to Rust binary                       │  │ │
│  │  │  3. Install to global node_modules                     │  │ │
│  │  │  4. Create symlink to bin/zipminator                   │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 6. Data Flow: QRNG to Encryption

```
┌──────────────────────────────────────────────────────────────────────┐
│             QUANTUM ENTROPY TO ENCRYPTED OUTPUT                       │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Step 1: Harvest Quantum Entropy                                 │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  User: zipminator rng generate --bytes 256 --provider ibm│  │ │
│  │  │                                                          │  │ │
│  │  │  → Connect to IBM Brisbane (127 qubits)                 │  │ │
│  │  │  → Create Hadamard circuit (120 qubits)                 │  │ │
│  │  │  → Submit job (17 shots × 15 bytes/shot = 255 bytes)    │  │ │
│  │  │  → Measure qubits (quantum collapse)                    │  │ │
│  │  │  → Collect bitstrings (true quantum randomness)         │  │ │
│  │  │  → Store in entropy pool (256 bytes)                    │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                               ↓                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Step 2: Generate Kyber-768 Keypair                             │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  User: zipminator keygen --entropy-source qrng           │  │ │
│  │  │                                                          │  │ │
│  │  │  → Read 64 bytes from entropy pool (seed)               │  │ │
│  │  │  → Generate polynomial coefficients (NTT domain)        │  │ │
│  │  │  → Create public key (pk = A·s + e)                     │  │ │
│  │  │  → Create secret key (sk = s)                           │  │ │
│  │  │  → Save keys (public.key, secret.key)                   │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                               ↓                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Step 3: Encrypt File                                            │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  User: zipminator encrypt secret.txt \                   │  │ │
│  │  │        --public-key public.key \                         │  │ │
│  │  │        --output encrypted.bin                            │  │ │
│  │  │                                                          │  │ │
│  │  │  → Load recipient's public key                          │  │ │
│  │  │  → Encapsulate (ct, ss) ← Kyber.Encap(pk)               │  │ │
│  │  │  → Derive AES key: kdf(shared_secret)                   │  │ │
│  │  │  → Encrypt file with AES-256-GCM                        │  │ │
│  │  │  → Package: [ciphertext || encrypted_file]             │  │ │
│  │  │  → Save to encrypted.bin                                │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                               ↓                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Step 4: Decrypt File                                            │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  User: zipminator decrypt encrypted.bin \                │  │ │
│  │  │        --secret-key secret.key \                         │  │ │
│  │  │        --output decrypted.txt                            │  │ │
│  │  │                                                          │  │ │
│  │  │  → Load secret key                                      │  │ │
│  │  │  → Extract ciphertext from package                     │  │ │
│  │  │  → Decapsulate: ss ← Kyber.Decap(sk, ct)                │  │ │
│  │  │  → Derive AES key: kdf(shared_secret)                   │  │ │
│  │  │  → Decrypt file with AES-256-GCM                        │  │ │
│  │  │  → Save to decrypted.txt                                │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

**Document Version:** 1.0.0
**Last Updated:** 2025-01-04
**Related:** `/Users/mos/dev/zipminator/docs/CLI_ARCHITECTURE.md`
