# Command-Line Interface

Zipminator provides a CLI for key generation and entropy operations. The CLI requires the `cli` extra.

## Installation

```bash
pip install zipminator[cli]
```

This installs `typer` and `rich` as additional dependencies.

## Commands

### `zipminator keygen`

Generate a CRYSTALS-Kyber-768 keypair.

```bash
zipminator keygen
```

**Options:**

| Flag | Default | Description |
|------|---------|-------------|
| `--output-dir` | `.` (current directory) | Directory to save `public_key.bin` and `secret_key.bin` |
| `--entropy-file` | Auto-detected | Path to a quantum entropy file (32 bytes minimum) |

**Examples:**

```bash
# Generate keys in the current directory
zipminator keygen

# Generate keys in a specific directory
zipminator keygen --output-dir ./keys

# Use a specific quantum entropy file
zipminator keygen --entropy-file quantum_entropy/quantum_entropy_pool.bin
```

**Entropy source priority:**

1. `--entropy-file` (if provided and readable)
2. `quantum_entropy/quantum_entropy_pool.bin` (auto-detected)
3. `quantum_entropy/entropy_pool.bin` (auto-detected)
4. System randomness (fallback)

**Output files:**

| File | Size | Contents |
|------|-----:|---------|
| `public_key.bin` | 1,184 bytes | Kyber768 public key |
| `secret_key.bin` | 2,400 bytes | Kyber768 secret key |

### `zipminator entropy`

Generate quantum entropy bytes.

```bash
zipminator entropy
```

**Options:**

| Flag | Default | Description |
|------|---------|-------------|
| `--bits` | 256 | Number of random bits to generate |
| `--provider` | Auto-detected | Force a specific provider (`ibm`, `rigetti`, `qbraid`, `api`) |

**Examples:**

```bash
# Generate 256 bits (32 bytes) of entropy
zipminator entropy

# Generate 1024 bits (128 bytes)
zipminator entropy --bits 1024

# Force a specific provider
zipminator entropy --provider ibm
```

**Output:**

The command prints the entropy as a hex string:

```
Quantum Entropy
a3f7e2b1c4d8f0e9a1b3c5d7e9f0a2b4c6d8e0f1a3b5c7d9e1f3a5b7c9d0e2f4
```

## Usage in Scripts

The CLI commands return standard exit codes:

- `0`: Success
- `1`: Error (entropy generation failed, file I/O error, etc.)

```bash
# Generate keys and check success
if zipminator keygen --output-dir /tmp/keys; then
    echo "Keys generated at /tmp/keys/"
    ls -la /tmp/keys/public_key.bin /tmp/keys/secret_key.bin
else
    echo "Key generation failed"
fi
```

## Programmatic Alternative

For scripting that needs more control, use the Python API directly:

```python
from zipminator import keypair

pk, sk = keypair()
with open("public_key.bin", "wb") as f:
    f.write(pk.to_bytes())
with open("secret_key.bin", "wb") as f:
    f.write(sk.to_bytes())
```
