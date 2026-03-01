# Getting Started with Zipminator

This guide walks you through installing Zipminator from source, running your first post-quantum key exchange, and using the CLI and API.

---

## Prerequisites

| Requirement | Minimum Version | Purpose |
|---|---|---|
| Rust toolchain | 1.70+ | Compiles the Kyber-768 core |
| Python | 3.8+ | SDK, API server, CLI |
| maturin | 1.0+ | Builds Rust-to-Python bindings via PyO3 |
| Git | 2.x | Clone the repository |
| PostgreSQL | 15+ | API persistence (optional for SDK-only usage) |
| Redis | 7+ | Rate limiting and caching (optional for SDK-only usage) |

Install the Rust toolchain if you do not already have it:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

Install maturin globally:

```bash
pip install maturin>=1.0
```

---

## Clone and Build

### 1. Clone the repository

```bash
git clone https://github.com/qdaria/zipminator.git
cd zipminator
```

### 2. Build the Rust core with Python bindings

```bash
maturin develop --release
```

This compiles `zipminator-core` (the CRYSTALS-Kyber-768 implementation in Rust) and installs it as a native Python extension module (`zipminator._zipminator_pqc`). The `--release` flag enables optimizations that are critical for constant-time cryptographic operations.

### 3. Install Python dependencies

```bash
pip install -e ".[dev]"
```

For quantum provider support (IBM Quantum, Rigetti via qBraid):

```bash
pip install -e ".[quantum]"
```

### 4. Verify the installation

```bash
python -c "from zipminator.crypto.pqc import PQC; pqc = PQC(); pk, sk = pqc.generate_keypair(); print(f'Public key: {len(pk)} bytes, Secret key: {len(sk)} bytes')"
```

Expected output:

```
Public key: 1184 bytes, Secret key: 2400 bytes
```

---

## First Encryption / Decryption

### Python SDK

```python
from zipminator.crypto.pqc import PQC

# Initialize the PQC engine (uses Rust backend at Kyber-768 / NIST Level 3)
pqc = PQC(level=768)

# Step 1: Generate a keypair
public_key, secret_key = pqc.generate_keypair()
print(f"Public key:  {len(public_key)} bytes")
print(f"Secret key:  {len(secret_key)} bytes")

# Step 2: Encapsulate -- sender produces ciphertext + shared secret
ciphertext, shared_secret_sender = pqc.encapsulate(public_key)
print(f"Ciphertext:  {len(ciphertext)} bytes")
print(f"Shared secret (sender): {shared_secret_sender.hex()[:32]}...")

# Step 3: Decapsulate -- receiver recovers the same shared secret
shared_secret_receiver = pqc.decapsulate(secret_key, ciphertext)
print(f"Shared secret (receiver): {shared_secret_receiver.hex()[:32]}...")

# Step 4: Verify both sides derived the same 32-byte shared secret
assert shared_secret_sender == shared_secret_receiver
print("Key exchange successful -- shared secrets match.")
```

### With quantum entropy seeding

If you have a quantum entropy pool file (harvested from IBM Quantum or Rigetti):

```python
with open("quantum_entropy/entropy_pool.bin", "rb") as f:
    seed = f.read(32)

public_key, secret_key = pqc.generate_keypair(seed=seed)
```

---

## CLI Quickstart

The CLI provides a `typer`-based interface with Rich terminal output.

### Generate a keypair

```bash
python -m zipminator_pqc.cli keygen --output-dir ./keys
```

This writes `public_key.bin` (1184 bytes) and `secret_key.bin` (2400 bytes) to the specified directory.

### Generate a keypair with quantum entropy

```bash
python -m zipminator_pqc.cli keygen \
  --output-dir ./keys \
  --entropy-file quantum_entropy/entropy_pool.bin
```

### Generate quantum entropy

```bash
python -m zipminator_pqc.cli entropy --bits 256 --provider ibm
```

### Run a Monte Carlo demo

```bash
python -m zipminator_pqc.cli demo monte-carlo --days 30 --scenarios 1
```

---

## API Quickstart

The API is a FastAPI application that wraps the Rust CLI for HTTP access.

### Start the API server (development)

```bash
cd api
docker-compose up -d     # Starts PostgreSQL and Redis
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

The interactive API docs are available at `http://localhost:8000/docs`.

### Register and authenticate

```bash
# Register a new user
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "dev@example.com", "password": "securepassword123"}'

# Login to obtain a JWT token
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "dev@example.com", "password": "securepassword123"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

echo $TOKEN
```

### Create an API key

```bash
API_KEY=$(curl -s -X POST http://localhost:8000/v1/keys/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "dev-key", "rate_limit": 1000}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['key'])")

echo $API_KEY
```

### Generate a keypair via the API

```bash
curl -X POST http://localhost:8000/v1/keygen \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"use_quantum": false}'
```

### Encrypt data

```bash
# Base64-encode your plaintext
PLAINTEXT=$(echo -n "Hello, post-quantum world!" | base64)

curl -X POST http://localhost:8000/v1/encrypt \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"public_key\": \"<base64-public-key>\", \"plaintext\": \"$PLAINTEXT\"}"
```

### Health check

```bash
curl http://localhost:8000/health
```

---

## Troubleshooting

### `maturin develop` fails with "Cargo.toml not found"

Ensure you are running the command from the repository root (`zipminator/`). The `pyproject.toml` expects the Rust manifest at `src/rust/Cargo.toml`.

### `ImportError: No module named 'zipminator._zipminator_pqc'`

The Rust extension was not compiled. Run `maturin develop --release` again. If you are using a virtual environment, make sure it is activated before running the build.

### `ImportError: No PQC backend found`

Neither the Rust bindings (`zipminator_pqc`) nor the pure-Python fallback (`kyber-py`) are installed. Run `maturin develop` for Rust, or `pip install kyber-py` for the pure-Python fallback.

### PostgreSQL connection errors when starting the API

Make sure PostgreSQL is running and accessible. For local development, use the provided Docker Compose file:

```bash
cd api && docker-compose up -d postgres redis
```

### Shared secrets do not match after encapsulate/decapsulate

This indicates a correctness issue in the Kyber round-trip. Run the test suite to confirm:

```bash
cd crates/zipminator-core
cargo test test_encaps_decaps -- --nocapture
```

### Slow key generation performance

Ensure you compiled with `--release`. Debug builds are orders of magnitude slower for cryptographic operations. Target performance for a full Kyber-768 keygen + encaps + decaps cycle is under 0.1ms on modern hardware.

---

## Next Steps

- [Architecture Guide](architecture.md) -- understand the system internals
- [API Reference](api-reference.md) -- full endpoint documentation
- [Deployment Guide](deployment.md) -- production deployment instructions
