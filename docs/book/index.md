# Zipminator

**Post-quantum cryptography toolkit with real quantum entropy.**

[![Tests](https://img.shields.io/badge/tests-575_passing-00d4aa?style=flat-square)](https://github.com/QDaria/zipminator)
[![FIPS 203](https://img.shields.io/badge/NIST_FIPS_203-verified-00d4aa?style=flat-square)](https://github.com/QDaria/zipminator)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue?style=flat-square)](https://github.com/QDaria/zipminator/blob/main/LICENSE)

Zipminator is an open-source post-quantum cryptography toolkit built on a from-scratch CRYSTALS-Kyber-768 (ML-KEM) implementation in Rust, exposed as a Python SDK via PyO3. It provides 10-level data anonymization, PII scanning across 15+ country jurisdictions, and quantum-seeded key generation from IBM Quantum hardware (156-qubit Eagle r3 processors).

## The 9 Pillars

::::{grid} 3
:gutter: 3

:::{grid-item-card} Vault
:text-align: center
Kyber768 file encryption with QRNG-seeded keys and 10-level anonymization.
:::

:::{grid-item-card} Messenger
:text-align: center
PQ Double Ratchet chat protocol with forward secrecy.
:::

:::{grid-item-card} VoIP
:text-align: center
PQ-SRTP key derivation for quantum-safe voice/video.
:::

:::{grid-item-card} VPN
:text-align: center
PQ-WireGuard state machine with kill switch.
:::

:::{grid-item-card} Anonymizer
:text-align: center
10-level system from SHA-256 hashing to Paillier homomorphic encryption.
:::

:::{grid-item-card} Q-AI
:text-align: center
AI assistant with PII scanning before LLM queries.
:::

:::{grid-item-card} Email
:text-align: center
ML-KEM-768 envelope encryption for quantum-safe email.
:::

:::{grid-item-card} Browser
:text-align: center
PQC proxy, fingerprint spoofing, and encrypted password vault.
:::

:::{grid-item-card} Q-Mesh
:text-align: center
QRNG-seeded mesh keys for WiFi sensing (RuView integration).
:::
::::

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

::::{grid} 2
:gutter: 3

:::{grid-item-card} New to Zipminator?
:link: content/getting_started
:link-type: doc

Three minutes to your first post-quantum key exchange.
:::

:::{grid-item-card} Installation Options
:link: content/installation
:link-type: doc

PyPI, source build, Docker, or conda/micromamba.
:::
::::

## Links

- **Platform**: [zipminator.zip](https://www.zipminator.zip)
- **Repository**: [github.com/QDaria/zipminator](https://github.com/QDaria/zipminator)
- **Issues**: [github.com/QDaria/zipminator/issues](https://github.com/QDaria/zipminator/issues)
- **Contact**: [mo@qdaria.com](mailto:mo@qdaria.com)

---

Built by [QDaria](https://qdaria.com) in Oslo, Norway.
