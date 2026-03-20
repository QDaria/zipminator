# Core Cryptography: Kyber768 KEM

Zipminator's cryptographic core is a from-scratch implementation of CRYSTALS-Kyber-768 (ML-KEM) in Rust, following the NIST FIPS 203 specification.

```{admonition} What is a KEM?
:class: note

A **Key Encapsulation Mechanism** (KEM) is a way for two parties to agree on a shared secret over an insecure channel. Unlike RSA key exchange, lattice-based KEMs like Kyber are resistant to attacks by quantum computers.
```

## How Kyber768 Works

A KEM operates in three steps:

1. **KeyGen** -- Generate a public/secret keypair
2. **Encapsulate** -- Using the public key, produce a ciphertext and a shared secret
3. **Decapsulate** -- Using the secret key and ciphertext, recover the shared secret

Both parties end up with the same 32-byte shared secret, which can then be used as a symmetric key for AES-256-GCM, ChaCha20-Poly1305, or any other AEAD cipher.

### The Math (Simplified)

Kyber is built on the **Module Learning With Errors (MLWE)** problem. The core idea:

$$\mathbf{A} \cdot \mathbf{s} + \mathbf{e} = \mathbf{t} \pmod{q}$$

Where:
- $\mathbf{A}$ is a public random matrix
- $\mathbf{s}$ is the secret key (a vector of small polynomials)
- $\mathbf{e}$ is a small error vector (the "noise")
- $\mathbf{t}$ is the public key
- $q = 3329$ is the modulus

The security comes from the fact that recovering $\mathbf{s}$ from $\mathbf{t}$ and $\mathbf{A}$ is computationally hard, even for quantum computers. The "768" in Kyber768 means the lattice dimension is $k=3$ with each polynomial having $n=256$ coefficients, giving Security Level 3 (equivalent to AES-192).

### NTT: The Speed Secret

Polynomial multiplication is the bottleneck in lattice cryptography. Zipminator uses the **Number Theoretic Transform** (NTT), which is the finite-field equivalent of the Fast Fourier Transform:

$$\text{NTT}(a) \cdot \text{NTT}(b) \xrightarrow{\text{NTT}^{-1}} a \cdot b \pmod{x^{256} + 1}$$

This reduces multiplication from $O(n^2)$ to $O(n \log n)$. All NTT operations use Montgomery multiplication for constant-time arithmetic.

## Key and Ciphertext Sizes

| Object | Size (bytes) | What it is |
|--------|-------------:|-----------|
| Public Key (pk) | 1,184 | Share with anyone; used to encapsulate secrets |
| Secret Key (sk) | 2,400 | Keep private; used to decapsulate received ciphertexts |
| Ciphertext (ct) | 1,088 | Encrypted shared secret; sent alongside encrypted data |
| Shared Secret (ss) | 32 | The agreed-upon key; use for AES-256 or ChaCha20 |

```{admonition} Size Comparison with RSA
:class: tip

RSA-2048 public keys are 256 bytes but are vulnerable to quantum attacks. Kyber768 public keys are 1,184 bytes but are quantum-resistant. The 4.6x size increase is the cost of post-quantum security.
```

## Python API

### Basic Key Exchange

```python
from zipminator import keypair, encapsulate, decapsulate

# Alice generates a keypair
pk, sk = keypair()
print(f"Public key:  {len(pk.to_bytes())} bytes")   # 1184
print(f"Secret key:  {len(sk.to_bytes())} bytes")   # 2400

# Bob encapsulates a shared secret using Alice's public key
ct, shared_secret = encapsulate(pk)
print(f"Ciphertext:  {len(ct.to_bytes())} bytes")   # 1088
print(f"Shared secret: {shared_secret.hex()[:32]}...")  # 32 bytes

# Alice decapsulates using her secret key
recovered = decapsulate(ct, sk)
assert shared_secret == recovered
print("Key exchange successful!")
```

### Serializing Keys

Keys can be serialized to bytes for storage or transmission:

```python
from zipminator import keypair, encapsulate, decapsulate
from zipminator._core import PublicKey, SecretKey

pk, sk = keypair()

# Serialize to bytes
pk_bytes = pk.to_bytes()   # 1184 bytes
sk_bytes = sk.to_bytes()   # 2400 bytes

# Save to files
with open("alice.pub", "wb") as f:
    f.write(pk_bytes)
with open("alice.key", "wb") as f:
    f.write(sk_bytes)

# Load from files
pk2 = PublicKey.from_bytes(open("alice.pub", "rb").read())
sk2 = SecretKey.from_bytes(open("alice.key", "rb").read())

# Use loaded keys
ct, ss = encapsulate(pk2)
assert ss == decapsulate(ct, sk2)
```

### Quantum-Seeded Key Generation

For maximum security, seed key generation with quantum entropy:

```python
from zipminator.crypto.pqc import PQC

pqc = PQC(level=768)

# Without quantum seed (uses OS entropy)
pk, sk = pqc.generate_keypair()

# With quantum seed from the entropy pool
seed = open("quantum_entropy/quantum_entropy_pool.bin", "rb").read(32)
pk, sk = pqc.generate_keypair(seed=seed)
```

## Benchmarks

Measured via the Python SDK (PyO3 bindings) on Apple M1 Max, release build:

| Operation | ops/sec | Latency | Notes |
|-----------|--------:|--------:|-------|
| KeyGen | 3,115 | 321 μs | Generate pk + sk |
| Encapsulate | 1,649 | 607 μs | pk → (ct, ss) |
| Decapsulate | 1,612 | 620 μs | (ct, sk) → ss |
| Full Round Trip | 900 | 1.1 ms | KeyGen + Encap + Decap |

```{admonition} These include Python overhead
:class: note

The numbers above include the PyO3 FFI bridge overhead. Native Rust performance is ~2x faster. For latency-critical applications, use the Rust crate directly.
```

### Running Benchmarks

````{tab-set}
```{tab-item} Rust (native)
    cd crates/zipminator-core && cargo bench
```

```{tab-item} Python
    python -c "
    from zipminator._core import keypair, encapsulate, decapsulate
    import time
    pk, sk = keypair()
    start = time.perf_counter()
    for _ in range(1000):
        ct, ss = encapsulate(pk)
        decapsulate(ct, sk)
    elapsed = time.perf_counter() - start
    print(f'{1000/elapsed:.0f} round-trips/sec ({elapsed/1000*1e6:.0f} μs/trip)')
    "
```
````

## Constant-Time Operations

```{admonition} Why constant-time matters
:class: warning

If a cryptographic operation takes different amounts of time depending on the secret key's value, an attacker can measure those timing differences to extract the key. This is called a **timing side-channel attack**.
```

All secret-dependent operations in Zipminator use constant-time primitives:

- `subtle::ConstantTimeEq` for key comparison
- `subtle::ConditionallySelectable` for branch-free secret selection
- `csubq()` with arithmetic masking (no conditional branches)
- Montgomery and Barrett reductions as `#[inline(always)]`

The NTT layer uses Montgomery multiplication throughout, avoiding any data-dependent branching.

## NIST KAT Validation

The implementation is validated against NIST's official Known Answer Test (KAT) vectors:

```bash
cd crates/zipminator-nist
cargo test
# Runs 35 tests against official KAT vectors
```

These vectors use a deterministic DRBG (AES-256-CTR) so that the output is reproducible across implementations. If any test fails, the implementation does not match the NIST specification.

## Fuzz Testing

Four `cargo-fuzz` targets cover the attack surface:

| Target | Input | What it tests |
|--------|-------|--------------|
| `fuzz_keygen` | Arbitrary seed bytes | KeyGen robustness against malformed seeds |
| `fuzz_encapsulate` | Malformed public keys | Encapsulation doesn't crash or leak |
| `fuzz_decapsulate` | Malformed ciphertext/key pairs | Decapsulation error handling |
| `fuzz_round_trip` | Random keypairs | End-to-end correctness |

```bash
cd crates/zipminator-fuzz
cargo fuzz run fuzz_keygen -- -max_total_time=300
```

## Security Considerations

```{admonition} Important
:class: important

1. **This library implements NIST FIPS 203 (ML-KEM-768).** It has not undergone FIPS 140-3 module validation (which requires CMVP certification at $80-150K+). Do not represent it as "FIPS certified" or "FIPS validated."

2. **Side-channel resistance** is enforced at the code level through constant-time primitives. Hardware-level side channels (power analysis, electromagnetic emanation) require additional mitigations beyond software.

3. **Key storage** is the caller's responsibility. The SDK generates and returns keys; it does not persist them. Use secure storage (HSM, OS keychain, encrypted files) for production deployments.

4. **Entropy quality** affects key strength. For maximum security, seed key generation with quantum entropy from the harvester. The OS fallback (`getrandom` / `os.urandom`) is cryptographically secure but classical.
```
