<p align="center">
  <img src="https://img.shields.io/badge/zipminator-PQC-00d4aa?style=for-the-badge&labelColor=0a0a1a" alt="Zipminator">
</p>

<h1 align="center">Zipminator</h1>

<p align="center">
  <strong>Post-quantum cryptography toolkit with real quantum entropy</strong><br>
  CRYSTALS-Kyber-768 (ML-KEM) in Rust, exposed as a Python SDK with 10-level data anonymization,<br>
  PII scanning, and quantum-seeded key generation from IBM Quantum hardware.
</p>

<p align="center">
  <a href="https://github.com/QDaria/zipminator/actions"><img src="https://img.shields.io/github/actions/workflow/status/QDaria/zipminator/ci.yml?style=flat-square&label=CI&logo=github" alt="CI"></a>
  <a href="#security"><img src="https://img.shields.io/badge/NIST_FIPS_203-verified-00d4aa?style=flat-square" alt="FIPS 203"></a>
  <a href="#test-coverage"><img src="https://img.shields.io/badge/tests-842_passing-00d4aa?style=flat-square" alt="Tests"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue?style=flat-square" alt="License"></a>
  <a href="https://www.python.org/"><img src="https://img.shields.io/badge/python-3.9%2B-3776ab?style=flat-square&logo=python&logoColor=white" alt="Python"></a>
  <a href="https://www.rust-lang.org/"><img src="https://img.shields.io/badge/rust-2021_edition-dea584?style=flat-square&logo=rust&logoColor=white" alt="Rust"></a>
</p>

---

## What This Is

Zipminator is the open-source cryptographic core of the [Zipminator PQC Platform](https://www.zipminator.zip). It provides:

- **Rust Kyber768 engine** with constant-time arithmetic, NIST KAT validation, and fuzz testing
- **Python SDK** (v0.5.0b1) with PyO3 bindings, 10-level anonymization, PII scanning, and CLI
- **Quantum entropy harvester** that continuously collects real entropy from IBM Quantum (Fez, Marrakesh) via qBraid
- **Subscription-gated access** with freemium L1-3 and API-key-gated L4-10

The commercial platform (Flutter super-app, Tauri browser, web dashboard) is built on top of this core but is not included in this repository.

## Quick Start

```bash
pip install zipminator
```

```python
from zipminator import keypair, encapsulate, decapsulate

# Generate a Kyber768 keypair (NIST FIPS 203, Security Level 3)
pk, sk = keypair()

# Encapsulate: sender creates shared secret + ciphertext
ct, shared_secret = encapsulate(pk)

# Decapsulate: receiver recovers the same shared secret
recovered = decapsulate(ct, sk)

assert shared_secret == recovered  # 32-byte shared secret
```

With quantum entropy seeding:

```python
from zipminator.crypto.pqc import PQC

seed = open("quantum_entropy/quantum_entropy_pool.bin", "rb").read(32)
pqc = PQC(level=768)
pk, sk = pqc.generate_keypair(seed=seed)  # Seeded from IBM Quantum hardware
```

## Features

### Rust Kyber768 Core

From-scratch CRYSTALS-Kyber-768 in Rust. All secret-dependent operations use constant-time arithmetic via the `subtle` crate. Montgomery and Barrett reductions in the NTT layer. Compiles to both a native library and a Python extension module via PyO3/maturin.

**Key sizes**: PK = 1,184 bytes, SK = 2,400 bytes, CT = 1,088 bytes, SS = 32 bytes.

### 10-Level Data Anonymization

Progressive anonymization from basic masking to homomorphic encryption:

| Level | Technique | Tier |
|-------|-----------|------|
| L1 | SHA-256 hashing | Free |
| L2 | Quantum-random replacement | Free |
| L3 | Deterministic tokenization | Free |
| L4 | Generalization (numeric ranges, categories) | Developer |
| L5 | Suppression (NULL replacement) | Developer |
| L6 | Quantum noise injection | Pro |
| L7 | Synthetic data generation (Faker) | Pro |
| L8 | k-Anonymity grouping | Enterprise |
| L9 | Differential privacy (Laplace noise) | Enterprise |
| L10 | Paillier homomorphic encryption | Enterprise |

### PII Scanner

Automatic detection of 50+ PII types across 15 countries (US, UK, UAE, Norway, Sweden, Denmark, Finland, EU, Germany, France, India, Brazil, Japan, Canada, Australia). Each match gets a confidence score and risk level (low / medium / high / critical).

```python
from zipminator.crypto.pii_scanner import PIIScanner
import pandas as pd

scanner = PIIScanner()
results = scanner.scan_dataframe(pd.read_csv("data.csv"))
print(results["summary"])
# PII Scan Results:
#   - 3 column(s) contain PII
#   - Risk Level: HIGH
#   - Recommended Anonymization Level: 7/10
```

Detected types include: Norwegian FNR, Swedish personnummer, Danish CPR, Finnish henkilotunnus, German Steuer-ID, French NIR, Indian Aadhaar/PAN, Brazilian CPF/CNPJ, Japanese My Number, Canadian SIN, Australian TFN, US SSN, UK NI number, UAE Emirates ID, IBAN, credit cards, email, phone, and more.

### Quantum Entropy Harvester

Continuously collects real quantum entropy from IBM Quantum hardware (156-qubit Eagle r3 processors) via qBraid. The pool file grows without limit; consumers read from it dynamically.

```bash
# Daemon mode (runs forever, harvests every hour)
python -m zipminator.entropy.scheduler --daemon --interval 3600

# One-shot (for cron jobs)
python -m zipminator.entropy.scheduler --once

# Check pool status
python -m zipminator.entropy.scheduler --stats
```

Entropy quotas are managed per subscription tier:

| Tier | Monthly Entropy | Overage |
|------|----------------|---------|
| Free | 1 MB | $0.01/KB |
| Developer | 10 MB | $0.01/KB |
| Pro | 100 MB | $0.01/KB |
| Enterprise | Unlimited | - |

### Quantum Random Module

Drop-in replacement for Python's `random` module, backed by quantum entropy when available:

```python
from zipminator.crypto.quantum_random import QuantumRandom

qr = QuantumRandom()
qr.random()              # float in [0.0, 1.0)
qr.randint(1, 100)       # inclusive range
qr.randbytes(32)         # cryptographic bytes
qr.choice(["a", "b"])    # random selection
qr.shuffle(my_list)      # Fisher-Yates shuffle
```

### Self-Destruct

DoD 5220.22-M 3-pass overwrite (zeros, ones, random) with timer-based auto-destruct and audit logging.

### CLI

```bash
pip install zipminator[cli]

zipminator keygen --output-dir ./keys
zipminator keygen --entropy-file quantum_entropy/quantum_entropy_pool.bin
zipminator entropy --bits 256
```

## Architecture

```
                    +-----------------+
                    |   Python SDK    |  zipminator v0.5.0b1
                    |  CLI / Jupyter  |
                    +--------+--------+
                             |  PyO3
                    +--------+--------+
                    |   Rust Core     |  crates/zipminator-core
                    |  Kyber768 KEM   |
                    |  NTT / Poly     |
                    |  Entropy Pool   |
                    +--------+--------+
                             |
              +--------------+--------------+
              |              |              |
        +-----+----+  +-----+----+  +------+-----+
        | IBM Fez   |  | IBM      |  | OS Entropy |
        | (qBraid)  |  | Marrakesh|  | (fallback) |
        +-----------+  +----------+  +------------+
```

### Repository Structure

```
zipminator/
+-- crates/
|   +-- zipminator-core/          Kyber768 KEM, NTT, poly, entropy pool, PyO3 bindings
|   +-- zipminator-fuzz/          cargo-fuzz targets (keygen, encaps, decaps, round-trip)
|   +-- zipminator-nist/          NIST FIPS 203 Known Answer Test runner
|   +-- zipminator-mesh/          Q-Mesh security (HMAC-SHA256 beacon auth)
|   +-- zipminator-app/           Flutter Rust Bridge (FRB) safe wrappers
+-- src/zipminator/               Python SDK
|   +-- crypto/                   PQC wrapper, PII scanner, anonymization, self-destruct
|   +-- entropy/                  Provider adapters, scheduler daemon, quota manager
|   +-- jupyter/                  JupyterLab magics and widgets
+-- tests/
|   +-- python/                   429+ tests (core, PQC, PII x15 countries, entropy, installer)
+-- scripts/
|   +-- install-zipminator.sh     Universal installer (macOS + Linux)
|   +-- install-zipminator.ps1    Universal installer (Windows)
|   +-- qrng_harvester.py         Standalone entropy harvester
+-- docs/book/                     Jupyter Book documentation (20+ pages)
+-- quantum_entropy/              Entropy pool (gitignored .bin files)
+-- config/                       Provider YAML configs
```

## Installation

### From PyPI

```bash
pip install zipminator                          # Core (894KB wheel, Rust crypto included)
pip install zipminator[cli]                     # + CLI (typer, rich)
pip install zipminator[data]                    # + numpy, pandas, pyzipper
pip install zipminator[anonymization]           # + faker, numpy, pandas
pip install zipminator[jupyter]                 # + JupyterLab, ipywidgets, plotly
pip install zipminator[all]                     # Everything
```

### From Source

Requirements: Rust 1.70+, Python 3.9+.

```bash
git clone https://github.com/QDaria/zipminator.git
cd zipminator

# Build Rust core + Python bindings
pip install maturin
maturin develop --release --strip

# Install with dev dependencies
pip install -e ".[dev,data,anonymization,cli]"

# Run tests
cargo test --workspace                          # 413 Rust tests
pytest tests/python/ -v                         # 162 Python tests
```

## Security

### NIST FIPS 203 (ML-KEM)

The Kyber768 implementation follows the NIST FIPS 203 specification. Validation is performed against the official Known Answer Test vectors via a deterministic DRBG.

```bash
cd crates/zipminator-nist
cargo test
```

**Note**: This library implements FIPS 203 (the algorithm specification). It has **not** undergone FIPS 140-3 module validation (which requires CMVP certification). Do not represent this as "FIPS certified" or "FIPS validated."

### Constant-Time Operations

All secret-dependent operations use:
- `subtle::ConstantTimeEq` for key comparison
- `subtle::ConditionallySelectable` for branch-free secret selection
- `csubq()` with arithmetic masking (no conditional branches)
- Montgomery and Barrett reductions as `#[inline(always)]`

### Fuzz Testing

Four `cargo-fuzz` targets cover the attack surface:

| Target | Input |
|--------|-------|
| `fuzz_keygen` | Arbitrary seed bytes |
| `fuzz_encapsulate` | Malformed public keys |
| `fuzz_decapsulate` | Malformed ciphertext/key pairs |
| `fuzz_round_trip` | End-to-end correctness |

```bash
cd crates/zipminator-fuzz
cargo fuzz run fuzz_keygen -- -max_total_time=300
```

## Test Coverage

| Layer | Tests | Status |
|-------|------:|--------|
| Rust core (Kyber768, anonymize, ratchet, SRTP, email) | 200 | Passing |
| Rust browser (Tauri, prompt guard) | 125 | Passing |
| Rust NIST KAT | 35 | Passing |
| Rust mesh (HMAC-SHA256 beacon auth) | 28 | Passing |
| Rust bridge (FRB) | 25 | Passing |
| **Total Rust** | **413** | **Passing** |
| Python core (Kyber bindings, PQC wrapper) | 73 | Passing |
| Python PII scanner (15 countries) | 224 | Passing |
| Python subscription (tiers, API key gating) | 35 | Passing |
| Python entropy (pool provider, quota, scheduler) | 54 | Passing |
| Python quantum random | 18 | Passing |
| Python installer utilities | 19 | Passing |
| Python multi-provider | 16 | Skipped (needs external deps) |
| **Total Python** | **429** | **Passing** |
| **Grand Total** | **842** | |

## Benchmarks

Measured via the Python SDK (PyO3 bindings) on Apple M1 Max, release build. Native Rust performance is higher; these numbers include Python-Rust bridge overhead.

| Operation | ops/sec | Latency |
|-----------|--------:|--------:|
| KeyGen | 3,115 | 321 us |
| Encapsulate | 1,649 | 607 us |
| Decapsulate | 1,612 | 620 us |
| Full Round Trip | 900 | 1.1 ms |

Run benchmarks locally:

```bash
# Rust-native benchmarks (Criterion)
cd crates/zipminator-core && cargo bench

# Python SDK benchmarks
python -c "
from zipminator._core import keypair, encapsulate, decapsulate
import time
pk, sk = keypair()
start = time.perf_counter()
for _ in range(1000):
    ct, ss = encapsulate(pk)
    decapsulate(ct, sk)
print(f'{1000/(time.perf_counter()-start):.0f} round-trips/sec')
"
```

## Quantum Entropy Providers

| Provider | Backend | Status |
|----------|---------|--------|
| qBraid | IBM Fez / Marrakesh (156-qubit Eagle r3) | Production |
| IBM Quantum | Qiskit Runtime | Available |
| Rigetti | QCS (pyQuil) | Available |
| OS Fallback | `getrandom` / `os.urandom` | Always available |

```bash
# .env
QBRAID_API_KEY=your_key
IBM_QUANTUM_TOKEN=your_token
RIGETTI_API_KEY=your_key
```

The harvester daemon continuously pulls entropy into an ever-growing pool:

```bash
# Crontab: harvest every 6 hours
0 */6 * * * /path/to/python -m zipminator.entropy.scheduler --once
```

## Subscription Tiers

The open-source SDK includes all 10 anonymization levels. Levels 1-3 are always available. Levels 4-10 require an API key or activation code.

| Tier | Price | Levels | Entropy | QRNG |
|------|------:|:------:|--------:|:----:|
| Free | $0 | 1-3 | 1 MB/mo | No |
| Developer | $9/mo | 1-5 | 10 MB/mo | No |
| Pro | $29/mo | 1-7 | 100 MB/mo | No |
| Enterprise | Custom | 1-10 | Unlimited | Yes |

```python
from zipminator.crypto.subscription import APIKeyValidator

# L1-3: always works
allowed, msg, method = APIKeyValidator.authorize_level(3)
assert allowed  # True, free_tier

# L4+: needs API key or activation code
import os
os.environ["ZIPMINATOR_API_KEY"] = "your-key"
allowed, msg, method = APIKeyValidator.authorize_level(7)
```

## Open Source vs Enterprise

| Component | This Repo | Enterprise |
|-----------|:---------:|:----------:|
| Rust Kyber768 core | Yes | Yes |
| Python SDK + CLI | Yes | Yes |
| 10-level anonymization | Yes | Yes |
| PII scanner | Yes | Yes |
| Quantum entropy harvester | Yes | Yes |
| Entropy quotas + billing | Yes | Yes |
| NIST KAT + fuzz testing | Yes | Yes |
| Flutter super-app (iOS/Android/macOS/Windows/Linux) | - | Yes |
| Tauri PQC browser (ZipBrowser) | - | Yes |
| Web dashboard + pitch deck | - | Yes |
| PQC Messenger + VoIP | - | Yes |
| Q-VPN (PQ-WireGuard) | - | Yes |
| Quantum Mail (@zipminator.zip) | - | Yes |
| HSM integration | - | Yes |
| FIPS 140-3 validated module | - | Yes |
| SSO / RBAC | - | Yes |
| 24/7 support + SLA | - | Yes |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Run the quality gates:
   ```bash
   cargo test --workspace
   cargo clippy --all-targets -- -D warnings
   pytest tests/python/
   ruff check src/
   ```
4. Submit a pull request

All PRs must pass CI: clippy clean, ruff clean, tests green.

## License

```
Copyright 2025-2026 QDaria AS

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

Enterprise features (Flutter apps, browser, VPN, mail, HSM, SSO) require a separate commercial license. Contact [mo@qdaria.com](mailto:mo@qdaria.com).

## Links

- **Platform**: [zipminator.zip](https://www.zipminator.zip)
- **QDaria**: [qdaria.com](https://qdaria.com)
- **Repository**: [github.com/QDaria/zipminator](https://github.com/QDaria/zipminator)
- **Issues**: [github.com/QDaria/zipminator/issues](https://github.com/QDaria/zipminator/issues)

---

Built by [QDaria](https://qdaria.com) in Oslo, Norway.
