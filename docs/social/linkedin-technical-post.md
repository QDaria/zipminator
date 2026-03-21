# LinkedIn Technical Post

**Post as: Mo Houshmand, CEO & Co-founder, QDaria AS**
**Target audience: Rust, cryptography, and quantum computing engineers**

---

We open-sourced our ML-KEM-768 implementation in Rust. Here is what is inside.

Zipminator's crypto core implements NIST FIPS 203 (the final ML-KEM standard from August 2024). The implementation uses constant-time operations throughout, NTT-based polynomial multiplication, and passes all NIST Known Answer Test vectors.

The numbers: 441 Rust tests across the workspace, including dedicated fuzz targets for keygen, encapsulate, and decapsulate. Key sizes are 1184 bytes (public), 2400 bytes (secret), 1088 bytes (ciphertext), producing 32-byte shared secrets.

Entropy architecture: We harvest true quantum randomness from IBM Quantum 156-qubit processors via a multi-provider pool. The factory chain is PoolProvider, QBraid, IBM, Rigetti, API, then OS fallback. The pool provider is thread-safe with position persistence. No seed reuse.

The Python SDK wraps the Rust core via PyO3 bindings (abi3 wheel, 894KB). 429 Python tests cover PII scanning for 15 countries, entropy quotas, subscription gating, and the full KEM roundtrip.

We also ship a Tauri 2.x privacy browser with 7 subsystems and 157 tests, a Q-Mesh module using WiFi DensePose for spatial awareness, and a 10-level anonymizer with country-specific PII pattern matching.

The L10 anonymization level is, to our knowledge, the world's first quantum-certified anonymization. Each value is mapped to a QRNG one-time pad generated from IBM Quantum 156-qubit hardware. The irreversibility guarantee comes from the Born rule, not computational hardness. Classical anonymization tools (ARX, sdcMicro, Google DP, Apple local DP, Presidio) all rely on PRNG-derived entropy whose security rests on mathematical assumptions. L10's security rests on quantum physics. No adversary, classical or quantum, can reverse a Born rule measurement outcome.

Everything described here is verifiable in the repo: github.com/QDaria/zipminator (Apache-2.0)

We are looking for contributors with experience in lattice-based cryptography, Rust FFI, or quantum entropy systems. Open issues tagged "good first issue" are a starting point.

Built in Oslo. PRs welcome.

#Rust #Cryptography #PostQuantumCryptography #OpenSource #QuantumComputing #NIST #MLKEM
