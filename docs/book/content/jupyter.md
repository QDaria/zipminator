# Jupyter Integration

Zipminator provides JupyterLab magics and interactive widgets for exploring post-quantum cryptography in notebooks.

## Installation

```bash
pip install zipminator[jupyter]
```

This installs JupyterLab, ipywidgets, and plotly as additional dependencies.

## Loading the Extension

In a Jupyter notebook cell:

```python
%load_ext zipminator.jupyter
```

## Magic Commands

### `%keygen`

Generate a Kyber768 keypair and store it in notebook variables.

```python
%keygen
```

This creates two variables in the notebook namespace:

- `pk` -- the public key (1,184 bytes)
- `sk` -- the secret key (2,400 bytes)

```python
%keygen
print(f"Public key: {len(pk.to_bytes())} bytes")
print(f"Secret key: {len(sk.to_bytes())} bytes")
```

### `%encrypt`

Encapsulate a shared secret using a public key.

```python
%encrypt pk
```

Creates:

- `ct` -- the ciphertext (1,088 bytes)
- `shared_secret` -- the 32-byte shared secret

### `%decrypt`

Decapsulate and recover the shared secret.

```python
%decrypt ct sk
```

Creates:

- `recovered` -- the recovered 32-byte shared secret

### Full Round-Trip Example

```python
%load_ext zipminator.jupyter

# Generate keypair
%keygen
print(f"PK: {len(pk.to_bytes())} bytes, SK: {len(sk.to_bytes())} bytes")

# Encrypt (encapsulate)
%encrypt pk
print(f"CT: {len(ct.to_bytes())} bytes")
print(f"Shared secret: {shared_secret.hex()[:32]}...")

# Decrypt (decapsulate)
%decrypt ct sk
assert shared_secret == recovered
print("Round-trip verified.")
```

## Interactive Widgets

### Key Size Comparison Widget

Visualize key sizes across different PQC algorithms:

```python
from zipminator.jupyter.widgets import key_size_comparison
key_size_comparison()
```

This displays an interactive Plotly bar chart comparing Kyber768 key sizes against RSA-2048, RSA-4096, and other PQC candidates.

### Entropy Pool Monitor

Display the current state of the quantum entropy pool:

```python
from zipminator.jupyter.widgets import entropy_monitor
entropy_monitor()
```

Shows:

- Pool file size
- Last harvest timestamp
- Provider status
- Monthly quota usage

### Anonymization Demo

Interactive widget to try different anonymization levels on sample data:

```python
from zipminator.jupyter.widgets import anonymization_demo
anonymization_demo()
```

Provides a dropdown to select levels 1-10 and see the transformation applied to a sample DataFrame in real time.

## Kernel Registration

If JupyterLab does not automatically detect the extension, register the kernel manually:

```bash
python -m ipykernel install --user --name zipminator --display-name "Zipminator PQC"
```

Then select "Zipminator PQC" from the kernel picker in JupyterLab.

## Notebook Tips

### Timing Operations

Use the `%%timeit` magic to benchmark cryptographic operations:

```python
from zipminator import keypair, encapsulate, decapsulate

pk, sk = keypair()
```

```python
%%timeit
ct, ss = encapsulate(pk)
decapsulate(ct, sk)
```

### Displaying Key Bytes

```python
from zipminator import keypair

pk, sk = keypair()
pk_bytes = pk.to_bytes()

# Display first 64 bytes in a formatted hex view
for i in range(0, min(64, len(pk_bytes)), 16):
    hex_part = ' '.join(f'{b:02x}' for b in pk_bytes[i:i+16])
    print(f"{i:04x}: {hex_part}")
```
