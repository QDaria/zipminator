# Zipminator PQC Documentation

**Post-quantum cryptography toolkit with real quantum entropy.**

[![Tests](https://img.shields.io/badge/tests-575_passing-00d4aa?style=flat-square)](https://github.com/QDaria/zipminator)
[![FIPS 203](https://img.shields.io/badge/NIST_FIPS_203-verified-00d4aa?style=flat-square)](https://github.com/QDaria/zipminator)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue?style=flat-square)](https://github.com/QDaria/zipminator/blob/main/LICENSE)

Zipminator is an open-source post-quantum cryptography toolkit built on a from-scratch CRYSTALS-Kyber-768 (ML-KEM) implementation in Rust, exposed as a Python SDK via PyO3. It provides 10-level data anonymization, PII scanning across 15+ country jurisdictions, and quantum-seeded key generation from IBM Quantum hardware (156-qubit Eagle r3 processors).

## Feature Highlights

- **Rust Kyber768 core** -- Constant-time arithmetic, NIST KAT validation, fuzz testing, 413 Rust tests
- **10-level anonymization** -- From SHA-256 hashing (L1) to Paillier homomorphic encryption (L10)
- **PII scanning** -- Automatic detection of 18+ PII types across Norwegian, US, and European jurisdictions
- **Quantum entropy** -- Continuous harvesting from IBM Quantum via qBraid, with quota management
- **Subscription gating** -- Freemium L1-3, API-key-gated L4-10 with four subscription tiers
- **CLI and Jupyter** -- Command-line tools and JupyterLab magics for interactive use

## Quick Example

```python
from zipminator import keypair, encapsulate, decapsulate

# Generate a Kyber768 keypair (NIST FIPS 203, Security Level 3)
pk, sk = keypair()

# Encapsulate: sender creates shared secret + ciphertext
ct, shared_secret = encapsulate(pk)

# Decapsulate: receiver recovers the same shared secret
recovered = decapsulate(ct, sk)

assert shared_secret == recovered  # 32-byte shared secret
print(f"Shared secret: {shared_secret.hex()[:32]}...")
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

## Where to Start

If you are new to Zipminator, begin with the {doc}`content/getting_started` guide. For installation options (PyPI, source, Docker), see {doc}`content/installation`.

## Links

- **Platform**: [zipminator.zip](https://www.zipminator.zip)
- **Repository**: [github.com/QDaria/zipminator](https://github.com/QDaria/zipminator)
- **Issues**: [github.com/QDaria/zipminator/issues](https://github.com/QDaria/zipminator/issues)
- **Contact**: [mo@qdaria.com](mailto:mo@qdaria.com)

---

Built by [QDaria](https://qdaria.com) in Oslo, Norway.
