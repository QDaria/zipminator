# Appendix: Glossary

## A

AEAD
: Authenticated Encryption with Associated Data. A class of symmetric encryption that provides both confidentiality and integrity (e.g., AES-256-GCM, ChaCha20-Poly1305).

## B

Barrett Reduction
: A method for computing modular reduction without division. Used in the NTT layer for efficient polynomial arithmetic. Zipminator uses Barrett reduction with `#[inline(always)]` for performance.

## C

CCA2 Security
: Chosen-Ciphertext Attack security (adaptive). The strongest standard notion of security for public-key encryption. ML-KEM achieves CCA2 via the Fujisaki-Okamoto transform.

Ciphertext
: The encrypted output of the encapsulation operation. In Kyber768, the ciphertext is 1,088 bytes. It is sent from the encapsulator (sender) to the decapsulator (receiver).

Constant-Time
: A property of code where execution time does not depend on secret values. Prevents timing side-channel attacks. Zipminator enforces this via the `subtle` crate.

CRYSTALS-Kyber
: The original name of the Kyber KEM algorithm submitted to the NIST post-quantum competition. Now standardized as ML-KEM in FIPS 203.

## D

DRBG
: Deterministic Random Bit Generator. Used in NIST KAT testing to produce reproducible randomness. Zipminator's KAT suite uses AES-256-CTR DRBG.

Decapsulation
: The process of recovering the shared secret from a ciphertext using the secret key. The inverse of encapsulation.

Differential Privacy
: A mathematical framework for measuring privacy loss. A mechanism satisfies epsilon-differential privacy if the output distribution changes by at most a factor of `e^epsilon` when any single record is added or removed. Used in Zipminator's Level 9 anonymization.

## E

Encapsulation
: The process of generating a shared secret and ciphertext using a public key. The sender encapsulates; the receiver decapsulates.

Entropy Pool
: A binary file (`quantum_entropy/quantum_entropy_pool.bin`) that stores harvested quantum entropy. Grows without limit as the scheduler appends new entropy from quantum backends.

## F

FIPS 203
: Federal Information Processing Standard 203. Published by NIST in 2024. Specifies ML-KEM (Module-Lattice-Based Key-Encapsulation Mechanism), the standardized version of CRYSTALS-Kyber.

FIPS 140-3
: Federal Information Processing Standard 140-3. Specifies security requirements for cryptographic modules. Validation requires CMVP lab testing ($80-150K+). Distinct from FIPS 203.

Fujisaki-Okamoto (FO) Transform
: A technique that converts a CPA-secure KEM into a CCA2-secure KEM by re-encapsulating during decapsulation and comparing the result. Provides implicit rejection (returns pseudorandom value on failure).

Fuzz Testing
: Automated testing that generates random or semi-random inputs to find crashes, hangs, or assertion failures. Zipminator uses `cargo-fuzz` with four targets covering keygen, encapsulation, decapsulation, and round-trip correctness.

## G

Generalization
: An anonymization technique that replaces precise values with broader categories. Numeric values are bucketed into ranges; text values are reduced to categories. Used in Zipminator's Level 4.

## H

Homomorphic Encryption
: An encryption scheme that allows computation on encrypted data. Paillier (used in Zipminator's Level 10) supports addition and scalar multiplication on ciphertexts.

## K

KAT (Known Answer Test)
: A validation method where the implementation is tested against pre-computed input/output pairs from the reference implementation. NIST provides official KAT vectors for FIPS 203.

KEM (Key Encapsulation Mechanism)
: A public-key primitive that produces a shared secret and a ciphertext. More efficient and secure than direct public-key encryption for establishing symmetric keys.

k-Anonymity
: A privacy property where every record in a dataset is indistinguishable from at least k-1 other records with respect to quasi-identifiers. Used in Zipminator's Level 8 (default k=5).

Kyber768
: The ML-KEM-768 parameter set of FIPS 203. Provides NIST Security Level 3 (equivalent to AES-192). The specific parameter set implemented by Zipminator.

## L

Laplace Mechanism
: A differential privacy mechanism that adds noise drawn from a Laplace distribution. The noise scale is `sensitivity / epsilon`. Used in Zipminator's Level 9 for numeric data.

## M

ML-KEM
: Module-Lattice-Based Key-Encapsulation Mechanism. The standardized name for CRYSTALS-Kyber in FIPS 203.

MLWE (Module Learning With Errors)
: The mathematical hard problem underlying ML-KEM. Given a matrix A and a vector t = As + e (where s and e are small), recovering s is computationally hard. Believed to resist both classical and quantum attacks.

Montgomery Reduction
: A method for efficient modular multiplication that avoids division. Used throughout Zipminator's NTT implementation with `#[inline(always)]` for performance.

## N

NTT (Number Theoretic Transform)
: A discrete Fourier transform over a finite field. Enables fast polynomial multiplication in O(n log n) instead of O(n^2). Central to Kyber's performance.

## P

PII (Personally Identifiable Information)
: Any data that can identify a specific individual. Examples: name, email, phone number, national ID number, credit card number. Zipminator's PII scanner detects 18+ types across 15 countries.

PQC (Post-Quantum Cryptography)
: Cryptographic algorithms that are believed to be secure against attacks by both classical and quantum computers. ML-KEM (Kyber) is the NIST standard for post-quantum key encapsulation.

PyO3
: A Rust library for creating native Python extension modules. Zipminator uses PyO3 to expose its Rust Kyber768 implementation as a Python package.

## Q

QRNG (Quantum Random Number Generator)
: A device or service that generates random numbers from quantum mechanical processes. Zipminator harvests entropy from IBM Quantum hardware (156-qubit Eagle r3 processors) via qBraid.

## R

Randomized Response
: A differential privacy technique for categorical data. Each respondent reports their true value with probability p and a random value with probability (1-p). Used in Zipminator's Level 9 for non-numeric columns (p=0.75).

## S

Shared Secret
: The 32-byte symmetric key produced by the KEM. Both the encapsulator and decapsulator derive the same shared secret. Typically used as a key for AES-256-GCM or similar AEAD cipher.

## T

Tokenization
: Replacing sensitive values with non-sensitive tokens. In Zipminator's Level 3, tokens are deterministic (same input always produces the same token) and the token map can optionally be retained for reversal.
