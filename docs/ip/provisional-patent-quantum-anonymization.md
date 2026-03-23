# PROVISIONAL PATENT APPLICATION

## United States Patent and Trademark Office

**Filing under 35 U.S.C. § 111(b)**

---

## TITLE OF THE INVENTION

**Method and System for Irreversible Data Anonymization Using Quantum Random Number Generation with Physics-Guaranteed Non-Reversibility**

---

## INVENTOR(S)

Daniel Mo Houshmand
Oslo, Norway

---

## ASSIGNEE

QDaria AS
Oslo, Norway

---

## CROSS-REFERENCE TO RELATED APPLICATIONS

None.

---

## FIELD OF THE INVENTION

The present invention relates to data privacy and anonymization technology. More specifically, the invention relates to a method and system for irreversibly anonymizing personally identifiable information (PII) in datasets using one-time pad (OTP) mappings derived from quantum random number generators (QRNG), wherein the irreversibility of the anonymization is guaranteed by the Born rule of quantum mechanics rather than by computational hardness assumptions.

---

## BACKGROUND OF THE INVENTION

### The Anonymization Problem

Organizations that process datasets containing personally identifiable information (PII) face regulatory requirements under frameworks including the European Union's General Data Protection Regulation (GDPR), the Digital Operational Resilience Act (DORA), the California Consumer Privacy Act (CCPA), and the Health Insurance Portability and Accountability Act (HIPAA).

GDPR Recital 26 provides a critical distinction: data that has been rendered truly anonymous — such that the data subject is "not or no longer identifiable" — falls entirely outside the scope of data protection regulation. However, data that is merely pseudonymized (where re-identification is possible using additional information) remains personal data subject to full regulatory requirements.

The ability to prove that data has been rendered truly anonymous, rather than merely pseudonymized, has significant economic and regulatory value.

### Limitations of Classical Anonymization

Existing anonymization techniques include:

- **k-Anonymity** (Sweeney, 2002): Generalizes quasi-identifiers so each record is indistinguishable from at least k-1 others. Vulnerable to homogeneity attacks and background knowledge attacks.

- **l-Diversity** (Machanavajjhala et al., 2007): Extends k-anonymity by requiring diversity in sensitive attributes within equivalence classes.

- **t-Closeness** (Li et al., 2007): Requires the distribution of sensitive attributes within equivalence classes to be close to the overall distribution.

- **Differential Privacy** (Dwork, 2006): Adds calibrated noise (typically Laplace or Gaussian) to query outputs, providing mathematical guarantees that the presence or absence of any individual's data has bounded influence on the output.

- **Tokenization**: Replaces PII with artificial identifiers using a reversible mapping stored in a secure vault.

- **One-Time Pad (OTP) Masking**: Replaces each value with a random substitute generated from a random number source.

All of the above techniques, when implemented in practice, derive their irreversibility (where applicable) from **computational hardness assumptions**. Specifically, the randomness used in noise injection (differential privacy), OTP generation, and hash salting comes from classical pseudo-random number generators (PRNGs) or cryptographically secure pseudo-random number generators (CSPRNGs).

### The PRNG Vulnerability

A classical PRNG, including CSPRNGs such as ChaCha20, AES-CTR-DRBG, and /dev/urandom, is deterministic: given the internal state (seed), every output can be reproduced exactly. The security of these generators rests on the computational infeasibility of recovering the seed from the output.

However, the seed exists physically — in RAM, in kernel data structures, in hardware state. An adversary who obtains the seed through any means (memory forensics, cold boot attack, side-channel attack such as Spectre or Meltdown, insider access to system memory, or state-level surveillance) can:

1. Reconstruct every "random" value the PRNG produced.
2. Subtract the noise added during anonymization.
3. Recover the original PII values.

This means classical anonymization provides **computational irreversibility** — secure under the assumption that the adversary lacks sufficient access or compute to recover the PRNG seed — but not **unconditional irreversibility**.

### Quantum Random Number Generation

Quantum Random Number Generators (QRNGs) produce random numbers by measuring quantum mechanical phenomena. When a qubit prepared in a superposition state |ψ⟩ = α|0⟩ + β|1⟩ is measured, the outcome is determined by the Born rule:

- P(|0⟩) = |α|²
- P(|1⟩) = |β|²

Bell's theorem (1964), experimentally verified by Aspect et al. (1982) and in loophole-free form by Hensen et al. (2015), proves that no local hidden variable theory can reproduce the statistics of quantum measurements. The measurement outcome is fundamentally non-deterministic: there is no underlying state, seed, or hidden variable that determines the result.

QRNG hardware is commercially available from multiple vendors (IBM Quantum, Rigetti Computing, ID Quantique, Quantinuum, QuintessenceLabs, and others) and produces random numbers that are certifiably random to within the precision of quantum mechanics itself.

### The Unoccupied Gap

Despite the availability of QRNG hardware and the well-understood limitations of classical PRNGs for anonymization, no prior system has combined QRNG-sourced randomness with data anonymization in a way that exploits the Born rule to provide physics-guaranteed irreversibility. All existing QRNG applications in the cybersecurity domain focus on cryptographic key generation — improving the quality of encryption keys — rather than on the anonymization transformation itself.

---

## SUMMARY OF THE INVENTION

The present invention provides a method and system for irreversible data anonymization wherein:

1. Each unique value in a dataset containing PII is mapped to a replacement identifier generated from a quantum random number source.

2. The quantum random numbers are produced by measuring qubits in superposition on quantum computing hardware, such that the randomness is governed by the Born rule and no deterministic seed exists.

3. A one-time pad (OTP) mapping table is constructed in volatile memory, mapping each original value to its quantum-random replacement.

4. All values in the dataset are replaced using the OTP mapping.

5. The OTP mapping table is securely destroyed using multi-pass overwrite (e.g., DoD 5220.22-M 3-pass: zeros, ones, random bytes), ensuring no copy persists in any storage medium.

Because the replacement identifiers are derived from quantum measurements with no underlying seed, and because the mapping table is destroyed, the anonymization is **information-theoretically irreversible**: no adversary, regardless of computational power (classical or quantum), can recover the original values.

This provides a stronger guarantee than any classical anonymization technique, which relies on computational hardness assumptions that may be defeated by advances in computing (including quantum computing).

---

## DETAILED DESCRIPTION OF THE INVENTION

### System Architecture

The system comprises the following components:

#### 1. Quantum Random Number Source

The quantum random number source is a quantum computing processor (e.g., IBM Quantum Eagle/Heron series with 100+ qubits, Rigetti Ankaa series, or equivalent) accessed via a cloud API (e.g., qBraid, IBM Qiskit Runtime, Amazon Braket).

The QRNG source:
- Prepares qubits in superposition states.
- Measures the qubits, producing random bit strings.
- Returns the bit strings as raw entropy bytes.

In the preferred embodiment, multiple QRNG providers are aggregated through a provider factory with automatic failover:

```
Priority chain: PoolProvider → qBraid → IBM Quantum → Rigetti → API → OS fallback
```

The OS fallback (e.g., /dev/urandom) is used only when no quantum hardware is available, and the system clearly marks such data as "classically anonymized" rather than "quantum-certified anonymous."

#### 2. Entropy Pool

Quantum random bytes are buffered in a thread-safe, append-only entropy pool stored as a binary file (e.g., `quantum_entropy_pool.bin`). The pool:

- Is populated by background daemon processes that periodically execute quantum circuits and harvest measurement outcomes.
- Supports concurrent reads with position tracking (each consumer reads from its own offset).
- Never reuses bytes — once consumed, a byte offset is advanced and the byte is not re-read.
- Monitors pool health and triggers refill when remaining bytes fall below a configurable threshold.

In the preferred embodiment, each harvesting cycle produces approximately 50 KB of quantum random bytes. A single anonymization operation on a typical dataset (10,000 rows × 10 columns) consumes approximately 1.6 MB of entropy (16 bytes per unique value × ~100,000 unique values).

#### 3. One-Time Pad Anonymization Engine

The anonymization engine implements the following algorithm:

```
ALGORITHM: Quantum OTP Anonymization (Level 10)

INPUT:
  D = dataset (pandas DataFrame or equivalent tabular structure)
  pool_path = path to quantum entropy pool file

OUTPUT:
  D' = anonymized dataset (same schema, all values replaced)

PROCEDURE:
  1. For each column C in D:
     a. Initialize empty mapping M_C = {}
     b. For each value v in C:
        i.   Let key = string(v)
        ii.  If key ∉ M_C:
             - Read 16 bytes from entropy pool at current offset
             - Advance pool offset by 16
             - Generate replacement string: r = hex(bytes) or base62(bytes)
             - Store: M_C[key] = r
        iii. Replace v with M_C[key] in D'
  2. After all columns are processed:
     a. Securely destroy all mapping tables M_C:
        - Overwrite mapping memory with zeros (pass 1)
        - Overwrite with ones (pass 2)
        - Overwrite with random bytes from pool (pass 3)
        - Release memory
     b. Clear any intermediate buffers
  3. Return D'
```

#### 4. Mapping Destruction Module

The mapping destruction module ensures no copy of the OTP mapping persists after anonymization. It implements:

- **DoD 5220.22-M 3-pass overwrite**: zeros, ones, random bytes applied sequentially to the memory region containing the mapping.
- **Python memory clearing**: Uses `ctypes.memset` to overwrite Python string objects before garbage collection.
- **Verification**: After destruction, the module verifies that the memory region contains no original mapping data by reading back the overwritten bytes.

In an alternative embodiment, the mapping table is constructed entirely in hardware-protected memory (e.g., Intel SGX enclave or ARM TrustZone) and destroyed by enclave teardown, providing additional protection against cold boot attacks.

### Security Analysis

#### Theorem: Information-Theoretic Irreversibility

**Claim**: Given the anonymized dataset D' and unlimited computational resources, no adversary can recover the original dataset D.

**Proof sketch**:

1. Each replacement identifier r_i was generated by reading bytes from the quantum entropy pool.
2. Those bytes were produced by measuring qubits in superposition, with outcomes governed by the Born rule.
3. By Bell's theorem, no local hidden variable theory can determine the measurement outcomes. The bytes are fundamentally non-deterministic.
4. The OTP mapping M (which maps original values to replacement identifiers) has been destroyed via multi-pass overwrite.
5. Without M, recovering the original values requires determining which quantum measurement outcomes produced each r_i.
6. Since quantum measurement outcomes are information-theoretically random (no hidden state determines them), this is equivalent to guessing a random string — which has success probability 2^{-128} per value (for 16-byte identifiers).
7. Therefore, the anonymization is information-theoretically irreversible. □

#### Comparison with Classical Approaches

| Property | Classical PRNG Anonymization | Quantum OTP Anonymization (This Invention) |
|----------|------------------------------|---------------------------------------------|
| Randomness source | CSPRNG (deterministic given seed) | QRNG (Born rule, no seed) |
| Seed exists? | Yes (in kernel memory) | No |
| Reversible if seed captured? | Yes | Not applicable |
| Adversary model | Computationally bounded | Unbounded |
| Irreversibility guarantee | Computational hardness | Quantum mechanics (Born rule) |
| Vulnerable to quantum computers? | Potentially (if seed recovery is improved) | No |
| GDPR Recital 26 compliance | Arguable (pseudonymization vs. anonymization) | Strong (information-theoretic anonymization) |

### Embodiments and Variations

#### Embodiment 1: Pure Quantum OTP (Level 10)

As described above. Every value is replaced with a QRNG-generated identifier. Mapping is destroyed.

#### Embodiment 2: Quantum OTP with Pre-Processing (Levels 5+10)

K-anonymity (k ≥ 5) is applied to the dataset first, generalizing quasi-identifiers. Then Level 10 quantum OTP is applied to all remaining values. This provides defense-in-depth: even if the OTP were somehow reversed (which is information-theoretically impossible), the underlying data has already been k-anonymized.

#### Embodiment 3: Quantum Differential Privacy (Levels 8+10)

Laplace-mechanism differential privacy noise is generated from QRNG bytes (rather than classical PRNG), then Level 10 quantum OTP is applied. The epsilon parameter controls the noise magnitude. This provides both differential privacy guarantees and information-theoretic irreversibility.

#### Embodiment 4: Quantum OTP with Column-Selective Application

Different columns receive different anonymization levels. For example:
- Quasi-identifiers (age, zip code): Level 5 (k-anonymity)
- Sensitive attributes (diagnosis, salary): Level 10 (quantum OTP)
- Direct identifiers (name, SSN, email): Level 10 (quantum OTP)

This preserves analytical utility of quasi-identifiers while providing maximum protection for sensitive and direct identifiers.

#### Embodiment 5: Multi-Provider Entropy with Provenance Tracking

The system tracks which quantum hardware provider produced each entropy byte, maintaining a provenance log:

```
{
  "timestamp": "2026-03-23T14:30:00Z",
  "provider": "ibm_quantum",
  "processor": "ibm_fez",
  "qubits": 156,
  "circuit_type": "random_measurement",
  "bytes_harvested": 4096,
  "pool_offset_start": 1048576,
  "pool_offset_end": 1052672,
  "certification": "born_rule"
}
```

This provenance log can be presented to auditors and data protection authorities as evidence that the entropy used for anonymization is quantum-certified, not classical.

#### Embodiment 6: Hardware-Secured Mapping Destruction

The OTP mapping table is constructed within a hardware security enclave (Intel SGX, ARM TrustZone, or similar). The enclave:
- Receives the dataset and entropy pool bytes.
- Constructs the mapping and applies the OTP transformation.
- Returns only the anonymized dataset.
- Destroys the mapping by enclave teardown.

This provides additional protection against memory forensics, cold boot attacks, and side-channel attacks during the brief period when the mapping exists.

### Implementation

The preferred embodiment is implemented in the following technology stack:

- **QRNG Harvester**: Python service (`src/zipminator/entropy/`) that executes quantum circuits on IBM Quantum (156-qubit Fez/Marrakesh processors) via qBraid API and writes measurement outcomes to the entropy pool.

- **Entropy Pool**: Binary file (`quantum_entropy_pool.bin`) with thread-safe reader (`src/zipminator/entropy/pool_provider.py`) using file locking, position persistence, and automatic refill triggers.

- **Anonymization Engine**: Python class `LevelAnonymizer` (`src/zipminator/anonymizer.py`) with method `apply(dataframe, level=10)` that implements the quantum OTP algorithm.

- **Cryptographic Core**: Rust implementation of ML-KEM-768 (NIST FIPS 203) in `crates/zipminator-core/` with PyO3 bindings, providing the underlying PQC infrastructure.

- **Multi-Platform Delivery**: Python SDK (PyPI package), REST API (FastAPI), CLI tool, Flutter mobile/desktop app, and Tauri browser.

The system has been tested with:
- 64 unit tests covering all 10 anonymization levels
- 45 integration tests
- Verification that the anonymized output differs from input at every level
- Verification that Level 10 OTP mapping is consistent within a single run but non-reproducible across runs
- Verification that QRNG fallback to OS entropy functions correctly when quantum hardware is unavailable

---

## CLAIMS

### Independent Claims

**Claim 1.** A computer-implemented method for irreversible data anonymization, comprising:

(a) receiving a dataset comprising one or more records containing personally identifiable information (PII);

(b) for each unique value in the dataset, generating a replacement identifier by reading a sequence of bytes from a quantum random number source, wherein the quantum random number source produces random numbers by measuring quantum states in superposition such that the measurement outcomes are governed by the Born rule of quantum mechanics and no deterministic seed exists for said random numbers;

(c) constructing a one-time pad (OTP) mapping in volatile memory, the mapping associating each unique value with its corresponding replacement identifier;

(d) replacing each value in the dataset with its corresponding replacement identifier from the OTP mapping to produce an anonymized dataset;

(e) securely destroying the OTP mapping by overwriting the memory region containing the mapping with at least one pass of non-original data; and

(f) outputting the anonymized dataset;

wherein the irreversibility of the anonymization is guaranteed by the physical properties of quantum measurement rather than by computational hardness assumptions, such that no adversary, regardless of computational resources, can recover the original values from the anonymized dataset.

**Claim 2.** A system for quantum-certified data anonymization, comprising:

(a) a quantum random number generator (QRNG) subsystem configured to produce random bytes by measuring qubits in superposition on quantum computing hardware;

(b) an entropy pool configured to buffer quantum random bytes in a thread-safe storage medium with position tracking;

(c) a processor configured to execute an anonymization algorithm that reads bytes from the entropy pool to generate replacement identifiers for PII values in a dataset;

(d) a mapping destruction module configured to securely erase the OTP mapping between original values and replacement identifiers after the anonymization is complete;

wherein the system produces anonymized data satisfying the requirements of GDPR Recital 26 for anonymous information, with irreversibility guaranteed by quantum mechanics.

**Claim 3.** A non-transitory computer-readable medium storing instructions that, when executed by a processor, cause the processor to perform the method of Claim 1.

### Dependent Claims

**Claim 4.** The method of Claim 1, wherein the quantum random number source comprises one or more quantum computing processors with at least 100 qubits.

**Claim 5.** The method of Claim 1, wherein step (e) comprises a multi-pass overwrite including: a first pass of zeros, a second pass of ones, and a third pass of random bytes conforming to DoD 5220.22-M.

**Claim 6.** The method of Claim 1, further comprising, prior to step (b), applying k-anonymity generalization to quasi-identifier columns of the dataset with k ≥ 5.

**Claim 7.** The method of Claim 1, further comprising, prior to step (b), applying differential privacy noise to numerical columns of the dataset using a Laplace mechanism with an epsilon parameter, wherein the Laplace noise is generated from the quantum random number source.

**Claim 8.** The method of Claim 1, wherein the OTP mapping is constructed within a hardware security enclave and destroyed by enclave teardown.

**Claim 9.** The method of Claim 1, further comprising maintaining a provenance log recording, for each quantum random byte consumed, the quantum hardware provider, processor identifier, qubit count, and timestamp.

**Claim 10.** The method of Claim 1, wherein the quantum random number source comprises multiple quantum hardware providers with automatic failover, arranged in a priority chain.

**Claim 11.** The method of Claim 1, wherein replacement identifiers for identical values within a single anonymization operation are identical (consistent mapping), but replacement identifiers for the same original value across separate anonymization operations are different (non-reproducible mapping).

**Claim 12.** The method of Claim 1, wherein the system detects the absence of available quantum random number sources and falls back to an operating system entropy source, and marks the resulting anonymized data as "classically anonymized" rather than "quantum-certified anonymous."

**Claim 13.** The system of Claim 2, wherein the entropy pool is an append-only binary file populated by background daemon processes that execute quantum circuits at configurable intervals.

**Claim 14.** The method of Claim 1, applied selectively to different columns of the dataset, wherein direct identifiers receive quantum OTP anonymization, quasi-identifiers receive k-anonymity generalization, and non-identifying columns are preserved unchanged.

**Claim 15.** The method of Claim 1, wherein the anonymized dataset is accompanied by a quantum anonymization certificate comprising: the timestamp of anonymization, the quantum hardware provider(s) used, the total quantum entropy bytes consumed, and a cryptographic hash of the anonymized dataset.

---

## ABSTRACT

A method and system for irreversible data anonymization using quantum random number generation (QRNG). Each personally identifiable information (PII) value in a dataset is mapped to a replacement identifier generated from quantum random bytes produced by measuring qubits in superposition. The randomness of the replacement identifiers is governed by the Born rule of quantum mechanics, ensuring no deterministic seed exists. After the anonymization transformation is applied, the one-time pad (OTP) mapping between original values and replacement identifiers is securely destroyed via multi-pass overwrite. The resulting anonymization is information-theoretically irreversible: no adversary, regardless of computational power, can recover the original values. This provides a stronger privacy guarantee than classical anonymization techniques, which rely on computational hardness assumptions that may be defeated by advances in computing, including quantum computing. The system supports multiple quantum hardware providers with automatic failover, thread-safe entropy pooling, provenance tracking, and integration with existing privacy frameworks including k-anonymity and differential privacy.

---

## DRAWINGS

### Figure 1: System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    QUANTUM LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ IBM Quantum  │  │   Rigetti   │  │   qBraid    │          │
│  │  156 qubits  │  │   Ankaa     │  │   Gateway   │          │
│  └──────┬───────┘  └──────┬──────┘  └──────┬──────┘          │
│         │                 │                 │                  │
│         └────────────┬────┘────────────────┘                  │
│                      ▼                                        │
│         ┌────────────────────────┐                            │
│         │   ENTROPY HARVESTER    │ Background daemon           │
│         │   (quantum circuits)   │ ~50KB/cycle                │
│         └───────────┬────────────┘                            │
└─────────────────────┼────────────────────────────────────────┘
                      ▼
┌──────────────────────────────────────────────────────────────┐
│                    ENTROPY POOL                               │
│  ┌────────────────────────────────────────────────────┐      │
│  │  quantum_entropy_pool.bin                          │      │
│  │  [QRNG bytes][QRNG bytes][QRNG bytes][...]        │      │
│  │  Thread-safe │ Position tracking │ Append-only     │      │
│  └───────────────────────┬────────────────────────────┘      │
└──────────────────────────┼───────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                 ANONYMIZATION ENGINE                          │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │  Read 16B    │───▶│ Build OTP    │───▶│ Replace all   │  │
│  │  from pool   │    │ mapping in   │    │ values using  │  │
│  │  per unique  │    │ volatile RAM │    │ OTP mapping   │  │
│  │  value       │    │              │    │               │  │
│  └──────────────┘    └──────┬───────┘    └───────┬───────┘  │
│                             │                     │          │
│                             ▼                     ▼          │
│                 ┌──────────────────┐   ┌──────────────────┐  │
│                 │ DESTROY MAPPING  │   │ OUTPUT ANONYMOUS │  │
│                 │ DoD 5220.22-M   │   │ DATASET          │  │
│                 │ 3-pass overwrite │   │ (no mapping      │  │
│                 │                  │   │  persists)       │  │
│                 └──────────────────┘   └──────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Figure 2: Comparison of Irreversibility Guarantees

```
CLASSICAL ANONYMIZATION              QUANTUM ANONYMIZATION (THIS INVENTION)
═══════════════════════              ═══════════════════════════════════════

Dataset ──▶ CSPRNG Noise ──▶ Anon    Dataset ──▶ QRNG OTP ──▶ Anon Dataset
               │                                    │
          Seed exists                          No seed exists
          in memory                            (Born rule)
               │                                    │
          Adversary captures                   No state to
          seed via side-channel                capture
               │                                    │
          Replays PRNG                         Information-
          output                               theoretically
               │                               impossible
          Subtracts noise                           │
               │                               Anonymization
          Recovers original                    is PERMANENT
          data                                      │
               │                               GDPR Recital 26:
          ANONYMIZATION                        TRUE anonymous
          BROKEN                               information
```

### Figure 3: Multi-Provider Entropy Architecture

```
┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│ IBM       │   │ Rigetti   │   │ Future    │   │ OS        │
│ Quantum   │   │ Computing │   │ Provider  │   │ Fallback  │
│ (156q)    │   │ (Ankaa)   │   │           │   │ /dev/     │
│           │   │           │   │           │   │ urandom   │
└─────┬─────┘   └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
      │               │               │               │
      ▼               ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                  PROVIDER FACTORY                             │
│  Priority: Pool ▶ qBraid ▶ IBM ▶ Rigetti ▶ API ▶ OS        │
│  Automatic failover │ Health monitoring │ Provenance log     │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
                  ┌───────────────────────┐
                  │   ENTROPY POOL        │
                  │   (quantum-certified  │
                  │    or OS-fallback     │
                  │    clearly marked)    │
                  └───────────────────────┘
```

---

## PRIORITY DATE

Filing date of this provisional application.

---

## CORRESPONDENCE ADDRESS

QDaria AS
Oslo, Norway
mo@qdaria.com

---

*END OF PROVISIONAL PATENT APPLICATION*
