---
title: "Inside Zipminator's Cryptographic Core: ML-KEM-768, Quantum Entropy, and Constant-Time Rust"
date: 2026-03-10
author: QDaria AS
tags: [pqc, ml-kem, kyber768, rust, cryptography, quantum-entropy, technical]
slug: pqc-technical-deep-dive
description: "A technical walkthrough of Zipminator's Rust cryptographic engine: ML-KEM-768 implementation, quantum entropy harvesting, constant-time guarantees, and NIST KAT verification."
---

# Inside Zipminator's Cryptographic Core: ML-KEM-768, Quantum Entropy, and Constant-Time Rust

This post covers the engineering decisions behind Zipminator's cryptographic engine. It is written for developers and security engineers evaluating post-quantum implementations.

## Why ML-KEM-768

NIST published FIPS 203 in August 2024, standardizing the Module-Lattice-Based Key-Encapsulation Mechanism (ML-KEM) derived from CRYSTALS-Kyber. Zipminator implements the ML-KEM-768 parameter set, which offers NIST Security Level 3 (equivalent to AES-192).

The choice of ML-KEM-768 over ML-KEM-512 or ML-KEM-1024 reflects a deliberate trade-off:

- **ML-KEM-512** (Security Level 1): Smaller keys, but provides only AES-128 equivalent security. Insufficient for data with long secrecy requirements.
- **ML-KEM-768** (Security Level 3): 1184-byte public keys, 2400-byte secret keys, 1088-byte ciphertexts. Provides strong security margins with acceptable overhead.
- **ML-KEM-1024** (Security Level 5): Larger keys and ciphertexts with diminishing security returns for most use cases.

For a platform that encrypts voice calls, file storage, and messaging simultaneously, ML-KEM-768 hits the right balance between security margin and performance.

## The Rust Core

The entire cryptographic engine lives in `crates/zipminator-core/`, written in Rust with zero `unsafe` blocks. The module structure:

```
crates/zipminator-core/src/
    kyber768.rs          # KeyGen, Encaps, Decaps
    ntt.rs               # Number Theoretic Transform (q=3329)
    poly.rs              # Polynomial and PolyVec operations
    constants.rs         # Kyber-768 parameters (n=256, k=3, q=3329)
    entropy_source.rs    # Multi-source entropy manager
    utils.rs             # SHA3-256, SHA3-512, SHAKE-128/256
    ratchet/             # Post-quantum Double Ratchet protocol
    srtp.rs              # PQ-SRTP key derivation
    qrng/                # Quantum random number generators
```

Rust was chosen for three reasons:

**Memory safety without garbage collection.** Cryptographic code that manages secret key material cannot afford use-after-free or buffer overflow vulnerabilities. Rust's ownership model prevents these classes of bugs at compile time.

**Constant-time guarantees.** Secret-dependent branching and memory access patterns leak information through timing side channels. Rust's type system, combined with careful coding discipline, enables constant-time implementations that resist these attacks. The test suite includes dudect-based statistical tests to verify constant-time behavior.

**Cross-platform compilation.** The same Rust crate compiles to native code for x86-64 and ARM64, to WebAssembly for browser targets, and exposes bindings via PyO3 (Python) and `flutter_rust_bridge` (Dart/Flutter). One implementation, verified once, deployed everywhere.

## Number Theoretic Transform

The NTT is the computational backbone of lattice-based cryptography. Zipminator's NTT operates over the polynomial ring Z_q[X]/(X^256 + 1) with q = 3329, the Kyber prime.

Polynomial multiplication via NTT reduces complexity from O(n^2) to O(n log n). For n = 256, this matters: every key generation, encapsulation, and decapsulation involves multiple polynomial multiplications.

The implementation uses precomputed roots of unity (zetas) and performs all arithmetic modulo 3329 using Barrett reduction. No floating-point operations. No division instructions. Every arithmetic path executes in constant time regardless of input values.

## Quantum Entropy Harvesting

Classical pseudorandom number generators (PRNGs) are deterministic. Given the seed, the output is fully predictable. For key generation in a post-quantum context, relying solely on OS entropy (/dev/urandom) creates an ironic weakness: quantum-resistant keys seeded by classically predictable randomness.

Zipminator's entropy pool aggregates randomness from multiple quantum sources:

1. **IBM Quantum** (156-qubit processors): Executes Hadamard gate circuits to produce true quantum random bits. Each qubit measurement is fundamentally unpredictable per quantum mechanics.
2. **Rigetti** (via qBraid): Alternative quantum backend providing independent entropy streams.
3. **OS fallback**: /dev/urandom serves as the deterministic backstop when quantum backends are unreachable.

The entropy harvester (`scripts/qrng_harvester.py`) runs periodic collection cycles, appending approximately 50KB of quantum entropy per cycle to `quantum_entropy/quantum_entropy_pool.bin`. The pool grows dynamically; all consumers read the file size at runtime rather than assuming a fixed pool size.

Key generation reads 32-byte seeds from this pool. For ML-KEM-768, those 32 bytes of quantum entropy seed the deterministic key generation process specified in FIPS 203. The result: keys whose initial randomness is rooted in quantum mechanical uncertainty.

## NIST KAT Verification

The implementation is verified against NIST's Known Answer Test vectors for ML-KEM-768. KAT verification works as follows:

1. NIST publishes deterministic test vectors: given specific seed values, the expected public key, secret key, ciphertext, and shared secret are defined.
2. The implementation processes these seeds through KeyGen, Encaps, and Decaps.
3. Outputs are compared byte-for-byte against the expected values.

Any deviation, even a single bit, indicates an implementation error. Zipminator's KAT tests pass for all published vectors.

## Fuzz Testing

Beyond deterministic tests, the cryptographic core undergoes continuous fuzz testing via `cargo fuzz`:

- **fuzz_keygen**: Feeds random seeds to key generation, verifying that the output always produces valid key pairs.
- **fuzz_encapsulate**: Tests encapsulation with random public keys and checks that decapsulation recovers the correct shared secret.
- **fuzz_decapsulate**: Feeds malformed ciphertexts to decapsulation, verifying graceful failure without panics or memory violations.

The fuzz corpus grows over time, building coverage of edge cases that hand-written tests might miss.

## Bindings Architecture

The Rust core exposes three binding interfaces:

**PyO3 (Python):** The `python_bindings.rs` module wraps `keypair()`, `encapsulate()`, and `decapsulate()` as Python-callable functions. The compiled shared library (`_core.abi3.so`) loads into the Python SDK, FastAPI backend, and Jupyter notebooks.

**flutter_rust_bridge (Dart/Flutter):** The `crates/zipminator-app/` crate provides safe Rust types that `flutter_rust_bridge` v2.11.1 translates to Dart classes. This powers the Flutter super-app across all 6 target platforms (macOS, Windows, Linux, iOS, Android, web). The bridge crate has 15 dedicated tests and 16 annotated functions.

**C FFI:** A thin `ffi.rs` layer enables integration with C-compatible foreign function interfaces, used by the Tauri desktop browser.

All three bindings call the same Rust functions. There is no reimplementation of cryptographic logic in Python, Dart, or C.

## Test Coverage

The numbers, verified in CI:

| Component | Tests |
|-----------|-------|
| Rust core (crates/ workspace) | 166 |
| Rust browser (Tauri) | 103 |
| Rust bridge (FRB) | 15 |
| Rust FRB glue | 18 |
| **Total Rust** | **302** |
| Flutter | 23 |
| Web (vitest) | 15 |
| Mobile (Expo) | 267 |

The Rust workspace compiles with `cargo clippy -- -D warnings` producing zero diagnostics. Flutter runs with `flutter analyze` reporting zero issues.

## What This Means in Practice

When a Zipminator user sends an encrypted message, the following chain executes:

1. The sender's device reads 32 bytes from the quantum entropy pool.
2. ML-KEM-768 KeyGen produces an ephemeral key pair.
3. The sender encapsulates against the recipient's public key, producing a 1088-byte ciphertext and a 32-byte shared secret.
4. AES-256-GCM encrypts the message payload using the shared secret.
5. The ciphertext and encrypted payload travel over the network.
6. The recipient decapsulates using their secret key, recovers the shared secret, and decrypts the message.

Every step runs in the same constant-time Rust implementation, regardless of platform. The cryptographic properties are identical whether the user runs the Flutter app on an Android phone, the Tauri browser on a Mac, or the Python SDK in a Jupyter notebook.

---

*Zipminator implements NIST FIPS 203 (ML-KEM-768) and is verified against NIST KAT test vectors. The Rust source and test suite are available for audit. For technical questions, contact QDaria AS at [zipminator.zip](https://www.zipminator.zip).*
