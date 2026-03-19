# Getting Started

Three minutes to your first post-quantum key exchange.

## Prerequisites

```{admonition} Environment Setup
:class: tip

We recommend using micromamba (or conda) to isolate dependencies:

    micromamba create -n zip-pqc python=3.11
    micromamba activate zip-pqc
    pip install zipminator

For Jupyter notebook support, also install the kernel:

    pip install 'zipminator[jupyter]'
    python -m ipykernel install --user --name zip-pqc --display-name "Zipminator PQC"
```

## Install

````{tab-set}
```{tab-item} pip (PyPI)
    pip install zipminator

The wheel is ~894KB and includes the pre-compiled Rust Kyber768 engine. No Rust toolchain needed.
```

```{tab-item} micromamba
    micromamba create -n zip-pqc python=3.11
    micromamba activate zip-pqc
    pip install zipminator[all]
```

```{tab-item} From source
    git clone https://github.com/QDaria/zipminator.git
    cd zipminator
    pip install maturin
    maturin develop --release --strip
    pip install -e ".[dev,data,anonymization,cli]"
```
````

## Generate a Keypair and Exchange a Secret

```python
from zipminator import keypair, encapsulate, decapsulate

# Step 1: Generate a Kyber768 keypair
pk, sk = keypair()
print(f"Public key:  {len(pk.to_bytes())} bytes")   # 1184 bytes
print(f"Secret key:  {len(sk.to_bytes())} bytes")   # 2400 bytes

# Step 2: Sender encapsulates a shared secret using the public key
ct, shared_secret = encapsulate(pk)
print(f"Ciphertext:  {len(ct.to_bytes())} bytes")   # 1088 bytes
print(f"Shared secret: {shared_secret.hex()[:32]}...")  # 32 bytes

# Step 3: Receiver decapsulates using their secret key
recovered = decapsulate(ct, sk)

# Both parties now share the same 32-byte secret
assert shared_secret == recovered
print("Key exchange successful.")
```

## Scan Data for PII

```python
from zipminator.crypto.pii_scanner import PIIScanner
import pandas as pd

scanner = PIIScanner()
df = pd.DataFrame({
    "name": ["Ola Nordmann", "Jane Smith"],
    "email": ["ola@example.no", "jane@example.com"],
    "ssn": ["12345678901", "123-45-6789"],
})

results = scanner.scan_dataframe(df)
print(results["summary"])
# PII Scan Results:
#   - 3 column(s) contain PII
#   - Risk Level: HIGH
#   - Recommended Anonymization Level: 7/10
```

## Anonymize Sensitive Data

```python
from zipminator.crypto.anonymization import AnonymizationEngine
import pandas as pd

engine = AnonymizationEngine()
df = pd.DataFrame({
    "name": ["Alice", "Bob", "Charlie"],
    "salary": [50000, 60000, 70000],
})

# Level 1: SHA-256 hashing (free tier)
hashed = engine.apply_anonymization(df, columns=["name"], level=1)
print(hashed["name"][0])  # e.g., "2bd806c9..."

# Level 4: Generalization (requires Developer tier)
generalized = engine.apply_anonymization(df, columns=["salary"], level=4)
print(generalized["salary"][0])  # e.g., "50000-60000"
```

## Quantum-Seeded Key Generation

If you have a quantum entropy pool file (harvested from IBM Quantum hardware), you can seed key generation with true quantum randomness:

```python
from zipminator.crypto.pqc import PQC

seed = open("quantum_entropy/quantum_entropy_pool.bin", "rb").read(32)
pqc = PQC(level=768)
pk, sk = pqc.generate_keypair(seed=seed)
```

See {doc}`entropy` for details on harvesting and managing quantum entropy.

## Next Steps

- {doc}`installation` -- All installation methods (PyPI, source, Docker, conda)
- {doc}`core_crypto` -- Deep dive into the Kyber768 implementation
- {doc}`anonymization` -- Full 10-level anonymization reference
- {doc}`cli` -- Command-line interface
