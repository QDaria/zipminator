# Getting Started

## Installation

### One-Click Install (Recommended)

The simplest way to set up the complete environment:

```bash
bash scripts/install-jupyter-env.sh
```

This script creates the `zip-pqc` micromamba environment with Python 3.11, all scientific dependencies, and the Rust toolchain.

### Manual Installation

#### 1. Create the environment

```bash
micromamba create -n zip-pqc python=3.11 -c conda-forge -y
micromamba activate zip-pqc
```

#### 2. Install Python dependencies

```bash
uv pip install numpy pandas matplotlib cryptography
uv pip install jupyter jupyterlab jupyter-book
```

#### 3. Build Rust bindings

```bash
uv pip install maturin
maturin develop
```

This compiles the Rust Kyber768 engine and installs the `zipminator._core` native extension.

#### 4. Verify installation

```python
from zipminator._core import keypair, encapsulate, decapsulate

pk, sk = keypair()
print(f"Public key size:  {len(pk.to_bytes())} bytes")   # 1184
print(f"Secret key size:  {len(sk.to_bytes())} bytes")    # 2400
```

## Package Structure

```
src/zipminator/
    __init__.py
    cli.py                  # Command-line interface
    anonymizer.py           # AdvancedAnonymizer (10 levels)
    scanner.py              # QuantumReadinessScanner (PII detection)
    hndl_risk.py            # HNDL risk calculator
    crypto/
        __init__.py
        quantum_random.py   # QuantumRandom (QRNG interface)
        subscription.py     # SubscriptionManager (tier enforcement)
        key_management.py   # Key generation and storage
    entropy/
        __init__.py
        pool.py             # Entropy pool reader
        harvester.py        # QRNG harvester (IBM/Rigetti/Fez)
    jupyter/
        __init__.py
        magics.py           # IPython magics (%zipminate, %qrng)
        widgets.py          # Interactive Jupyter widgets
        display.py          # Rich output formatters
        bridge.py           # Notebook-to-API bridge
```

## Quick Start

### Key Generation and Encryption

```python
from zipminator._core import keypair, encapsulate, decapsulate

# Generate a Kyber768 keypair
pk, sk = keypair()

# Encapsulate: sender creates ciphertext + shared secret
ct, shared_secret_sender = encapsulate(pk)

# Decapsulate: receiver recovers the same shared secret
shared_secret_receiver = decapsulate(ct, sk)

assert shared_secret_sender == shared_secret_receiver
print(f"Shared secret: {shared_secret_sender.hex()[:32]}...")
```

### Encrypting a Message

```python
from hashlib import sha3_256
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os

# Derive a 256-bit AES key from the shared secret
aes_key = sha3_256(shared_secret_sender).digest()

# Encrypt with AES-256-GCM
aesgcm = AESGCM(aes_key)
nonce = os.urandom(12)
message = b"Quantum-safe message"
ciphertext = aesgcm.encrypt(nonce, message, None)

# Decrypt
plaintext = aesgcm.decrypt(nonce, ciphertext, None)
assert plaintext == message
print(f"Decrypted: {plaintext.decode()}")
```

### DataFrame Anonymization

```python
import pandas as pd
from zipminator.anonymizer import AdvancedAnonymizer

anonymizer = AdvancedAnonymizer()

df = pd.DataFrame({
    "name": ["Alice Johnson", "Bob Smith"],
    "email": ["alice@example.com", "bob@example.com"],
    "salary": [85000, 92000],
})

# Apply Level 1 anonymization (minimal masking)
result = anonymizer.anonymize(df, level=1)
print(result)
```

### PII Scanning

```python
from zipminator.scanner import QuantumReadinessScanner

scanner = QuantumReadinessScanner()

data = {
    "notes": "Contact alice@example.com or call 555-0123",
    "ssn": "123-45-6789",
}

findings = scanner.scan(data)
for finding in findings:
    print(f"  {finding.field}: {finding.pii_type} (confidence: {finding.confidence:.0%})")
```

## Building the Documentation

To build this Jupyter Book locally:

```bash
micromamba activate zip-pqc
uv pip install jupyter-book sphinx-book-theme myst-nb sphinx-design
jupyter-book build docs/book/
```

The built HTML will be in `docs/book/_build/html/`.
