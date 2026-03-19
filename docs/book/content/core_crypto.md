# Core Cryptography: Kyber768 KEM

Zipminator's cryptographic core is a from-scratch implementation of CRYSTALS-Kyber-768 (ML-KEM) in Rust, following the NIST FIPS 203 specification. This page covers the algorithm, API, key sizes, performance, and security properties.

## What is Kyber768?

Kyber is a key encapsulation mechanism (KEM) based on the Module Learning With Errors (MLWE) problem. NIST selected it as the primary post-quantum KEM standard under FIPS 203 (ML-KEM). The "768" refers to the lattice dimension parameter, which provides Security Level 3 (equivalent to AES-192).

A KEM works in three steps:

1. **KeyGen** -- Generate a public/secret keypair
2. **Encapsulate** -- Using the public key, produce a ciphertext and a shared secret
3. **Decapsulate** -- Using the secret key and ciphertext, recover the shared secret

Both parties end up with the same 32-byte shared secret, which can then be used as a symmetric key for AES-256-GCM, ChaCha20-Poly1305, or any other AEAD cipher.

## Key and Ciphertext Sizes

| Object | Size (bytes) |
|--------|-------------:|
| Public Key (pk) | 1,184 |
| Secret Key (sk) | 2,400 |
| Ciphertext (ct) | 1,088 |
| Shared Secret (ss) | 32 |

These sizes are fixed by the FIPS 203 specification for the ML-KEM-768 parameter set.

## Python API

### Basic Usage

```python
from zipminator import keypair, encapsulate, decapsulate

# Generate keypair
pk, sk = keypair()

# Encapsulate (sender side)
ct, shared_secret = encapsulate(pk)

# Decapsulate (receiver side)
recovered = decapsulate(ct, sk)

assert shared_secret == recovered
```

### Byte Conversion

The `pk`, `sk`, and `ct` objects have `.to_bytes()` and `.from_bytes()` methods for serialization:

```python
from zipminator import keypair, encapsulate, decapsulate

pk, sk = keypair()

# Serialize
pk_bytes = pk.to_bytes()   # 1184 bytes
sk_bytes = sk.to_bytes()   # 2400 bytes

# Deserialize (import the types)
from zipminator._core import PublicKey, SecretKey
pk2 = PublicKey.from_bytes(pk_bytes)
sk2 = SecretKey.from_bytes(sk_bytes)

# Use deserialized keys
ct, ss = encapsulate(pk2)
recovered = decapsulate(ct, sk2)
assert ss == recovered
```

### PQC Wrapper (Higher-Level API)

The `PQC` class provides a higher-level interface with optional quantum entropy seeding:

```python
from zipminator.crypto.pqc import PQC

pqc = PQC(level=768)

# Generate keypair (optionally seeded with quantum entropy)
pk, sk = pqc.generate_keypair()

# With quantum seed
seed = open("quantum_entropy/quantum_entropy_pool.bin", "rb").read(32)
pk, sk = pqc.generate_keypair(seed=seed)
```

## Benchmarks

Measured via the Python SDK (PyO3 bindings) on Apple M1 Max, release build. Native Rust performance is higher; these numbers include the Python-Rust bridge overhead.

| Operation | ops/sec | Latency |
|-----------|--------:|--------:|
| KeyGen | 3,115 | 321 us |
| Encapsulate | 1,649 | 607 us |
| Decapsulate | 1,612 | 620 us |
| Full Round Trip | 900 | 1.1 ms |

### Running Benchmarks Locally

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

## Constant-Time Operations

All secret-dependent operations use constant-time primitives to prevent timing side-channel attacks:

- `subtle::ConstantTimeEq` for key comparison
- `subtle::ConditionallySelectable` for branch-free secret selection
- `csubq()` with arithmetic masking (no conditional branches)
- Montgomery and Barrett reductions as `#[inline(always)]`

The NTT (Number Theoretic Transform) layer uses Montgomery multiplication throughout, avoiding any data-dependent branching.

## NIST KAT Validation

The implementation is validated against NIST's official Known Answer Test (KAT) vectors using a deterministic DRBG (AES-256-CTR):

```bash
cd crates/zipminator-nist
cargo test
# Runs 35 tests against official KAT vectors
```

## Fuzz Testing

Four `cargo-fuzz` targets cover the attack surface:

| Target | Input | What it Tests |
|--------|-------|---------------|
| `fuzz_keygen` | Arbitrary seed bytes | KeyGen robustness |
| `fuzz_encapsulate` | Malformed public keys | Encapsulation error handling |
| `fuzz_decapsulate` | Malformed ciphertext/key pairs | Decapsulation error handling |
| `fuzz_round_trip` | Random keypairs | End-to-end correctness |

```bash
cd crates/zipminator-fuzz
cargo fuzz run fuzz_keygen -- -max_total_time=300
```

## Security Considerations

1. **This library implements NIST FIPS 203 (ML-KEM-768).** It has not undergone FIPS 140-3 module validation (which requires CMVP certification at $80-150K+). Do not represent it as "FIPS certified" or "FIPS validated."

2. **Side-channel resistance** is enforced at the code level through constant-time primitives. Hardware-level side channels (power analysis, electromagnetic emanation) require additional mitigations beyond software.

3. **Key storage** is the caller's responsibility. The SDK generates and returns keys; it does not persist them. Use secure storage (HSM, OS keychain, encrypted files) for production deployments.

4. **Entropy quality** affects key strength. For maximum security, seed key generation with quantum entropy from the harvester. The OS fallback (`getrandom` / `os.urandom`) is cryptographically secure but classical.
