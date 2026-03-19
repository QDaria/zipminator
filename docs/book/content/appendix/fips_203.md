# Appendix: NIST FIPS 203 (ML-KEM)

This appendix provides background on the NIST post-quantum cryptography standard that Zipminator implements.

## What is FIPS 203?

FIPS 203 is a Federal Information Processing Standard published by the National Institute of Standards and Technology (NIST). It specifies **ML-KEM** (Module-Lattice-Based Key-Encapsulation Mechanism), which is the standardized version of the CRYSTALS-Kyber algorithm.

ML-KEM is the primary post-quantum key encapsulation mechanism selected by NIST after an 8-year evaluation process (2016-2024) that considered 82 initial submissions and narrowed them to 4 finalists.

## ML-KEM Parameter Sets

FIPS 203 defines three parameter sets:

| Parameter Set | Security Level | NIST Category | Equivalent Classical |
|--------------|:--------------:|:-------------:|:--------------------:|
| ML-KEM-512 | 1 | Category 1 | AES-128 |
| ML-KEM-768 | 3 | Category 3 | AES-192 |
| ML-KEM-1024 | 5 | Category 5 | AES-256 |

Zipminator implements **ML-KEM-768** (Security Level 3), which provides a balance between security margin and performance.

## Key Sizes (ML-KEM-768)

| Object | Size (bytes) |
|--------|-------------:|
| Public key | 1,184 |
| Secret key | 2,400 |
| Ciphertext | 1,088 |
| Shared secret | 32 |

For comparison, RSA-2048 public keys are 256 bytes and ciphertexts are 256 bytes, but RSA provides no post-quantum security.

## How ML-KEM Works

ML-KEM is based on the Module Learning With Errors (MLWE) problem, which is believed to be hard for both classical and quantum computers.

### Key Generation

1. Generate a random seed
2. Expand the seed into a matrix **A** over a polynomial ring
3. Sample secret vectors **s** and **e** from a centered binomial distribution
4. Compute the public key: **t = As + e**
5. The public key is **(A, t)**; the secret key is **s**

### Encapsulation

1. Sample fresh randomness **r**, **e1**, **e2**
2. Compute **u = A^T r + e1** and **v = t^T r + e2 + encode(message)**
3. The ciphertext is **(u, v)**; the shared secret is derived from the message via SHA-256

### Decapsulation

1. Compute **v - s^T u** to recover the encoded message
2. Re-encapsulate to verify correctness (Fujisaki-Okamoto transform)
3. If verification succeeds, output the shared secret; otherwise, output a pseudorandom value (implicit rejection)

The Fujisaki-Okamoto transform provides CCA2 security (chosen-ciphertext attack resistance).

## Why Constant-Time Matters

The decapsulation step includes a comparison between the re-encapsulated ciphertext and the received ciphertext. If this comparison leaks timing information, an attacker can mount an adaptive chosen-ciphertext attack.

Zipminator uses the `subtle` crate for all secret-dependent operations:

- `ConstantTimeEq`: Compares two byte sequences in constant time
- `ConditionallySelectable`: Selects between two values without branching
- `csubq()`: Conditional subtraction using arithmetic masking

These primitives ensure that the execution time of decapsulation does not depend on whether the ciphertext is valid or invalid.

## FIPS 203 vs FIPS 140-3

These are two different standards that are often confused:

| | FIPS 203 | FIPS 140-3 |
|---|---------|-----------|
| **What** | Algorithm specification for ML-KEM | Cryptographic module validation program |
| **Scope** | Defines the math and encoding | Defines physical security, key management, self-tests |
| **Cost** | Free (public standard) | $80,000 - $150,000+ (CMVP lab testing) |
| **Timeline** | Published 2024 | 6-18 months for testing and validation |
| **Claim** | "Implements FIPS 203" | "FIPS 140-3 Level N validated" |
| **Certificate** | Not applicable | CMVP certificate number issued |

### What Zipminator Can Claim

**Safe statements:**
- "Implements NIST FIPS 203 (ML-KEM-768)"
- "Verified against NIST Known Answer Test vectors"
- "Uses constant-time operations for side-channel resistance"

**Statements that must NOT be made:**
- "FIPS 140-3 certified" (requires CMVP certificate)
- "FIPS compliant" (ambiguous; may imply FIPS 140-3 validation)
- "FIPS validated" (requires CMVP certificate)

## The NIST Post-Quantum Timeline

| Date | Event |
|------|-------|
| Dec 2016 | NIST issues call for post-quantum proposals (82 submissions) |
| Jan 2019 | Round 2: 26 candidates |
| Jul 2020 | Round 3: 7 finalists + 8 alternates |
| Jul 2022 | NIST selects CRYSTALS-Kyber as the primary KEM |
| Aug 2024 | FIPS 203 (ML-KEM) published as final standard |
| 2025+ | Federal agencies begin migration to PQC |

## Further Reading

- [NIST FIPS 203 specification (PDF)](https://csrc.nist.gov/pubs/fips/203/final)
- [NIST Post-Quantum Cryptography project page](https://csrc.nist.gov/projects/post-quantum-cryptography)
- [CRYSTALS-Kyber reference implementation](https://github.com/pq-crystals/kyber)
