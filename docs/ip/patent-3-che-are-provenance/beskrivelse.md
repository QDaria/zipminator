# PATENT APPLICATION

## Patentstyret (Norwegian Industrial Property Office)

**Filing under Norwegian Patents Act (Patentloven) § 8**

---

## TITLE OF THE INVENTION

**Certified Heterogeneous Entropy Composition with Algebraic Randomness Extraction and Cryptographic Provenance**

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

Related to Norwegian Patent Application No. 20260384 (filed 2026-03-24), "Method and System for Irreversible Data Anonymization Using Quantum Random Number Generation," which uses the entropy pool infrastructure described herein. Also related to a co-pending application for "Unilateral CSI Entropy Harvesting," which provides one of the entropy sources consumed by this framework.

---

## FIELD OF THE INVENTION

The present invention relates to cryptographic entropy management. More specifically, the invention relates to: (1) a new family of randomness extractors based on algebraic programs over five number domains; (2) a method for composing entropy from multiple heterogeneous sources with per-source health monitoring and Merkle-tree provenance certificates; and (3) a graceful degradation protocol that maintains certified entropy production when individual sources fail.

---

## BACKGROUND OF THE INVENTION

### Single-Source Entropy Systems

Existing entropy systems typically rely on a single source: hardware random number generators (Intel RDRAND), quantum random number generators (QRNG from IBM Quantum, ID Quantique), or operating system entropy pools (/dev/urandom). Single-source designs create a single point of failure: if the source is compromised, degraded, or unavailable, the system either fails entirely or silently falls back to a weaker source without informing downstream consumers.

### Known Randomness Extractors

All known families of randomness extractors are hash-based:

- **Universal hash functions** (Carter & Wegman, 1979): Extract randomness via linear hash families. Widely used but limited to linear operations.
- **Trevisan's extractor** (Trevisan, 2001): Uses error-correcting codes and one-bit extractors. Theoretically optimal seed length but impractical for high-throughput applications.
- **Leftover Hash Lemma** (Hastad et al., 1999): Proves that universal hash functions extract nearly uniform bits from high-min-entropy sources. The standard theoretical foundation for all hash-based extractors.

No prior extractor family uses **algebraic programs** (sequences of arithmetic operations across multiple number domains) as the extraction mechanism.

### Lack of Provenance Certification

No existing entropy system provides cryptographic proof of which sources contributed to a given entropy output. Auditors and regulators (particularly under DORA Article 7, which mandates full cryptographic key lifecycle management) cannot verify the lineage of entropy used in key generation.

### No Graceful Degradation Standard

Existing multi-source entropy systems either require all sources to be available or silently substitute weaker sources without adjusting entropy estimates. No prior system provides automatically adjusted min-entropy bounds when sources degrade or fail.

---

## SUMMARY OF THE INVENTION

The present invention provides three interrelated methods:

1. **Algebraic Randomness Extraction (ARE)**: A new family of randomness extractors parameterized by algebraic programs over five number domains (N, Z, Q, R, C) with six arithmetic operations (ADD, SUB, MUL, DIV, MOD, EXP). Programs are generated deterministically from a seed via SHAKE-256. This is distinct from all known hash-based extractor families.
2. **Certified heterogeneous entropy composition**: Multiple independent entropy sources (quantum, classical physical, operating system) are XOR-fused with per-source NIST SP 800-90B health monitoring. Each composition produces a Merkle-tree provenance certificate with canonically serialized source records as leaves, providing cryptographic proof of entropy lineage.
3. **Graceful degradation**: Failed sources are automatically excluded from composition. Degraded sources trigger warnings but continue to contribute. The reported min-entropy bound is adjusted to reflect only the sources that actually contributed. A configurable minimum source count prevents composition below a safety threshold.

---

## DETAILED DESCRIPTION OF THE INVENTION

### 1. Algebraic Randomness Extraction (ARE)

#### 1.1 Number Domains

The ARE extractor operates across five classical number domains, each with bounded computation (`Domain` enum, `are.py:25-33`):

- **Natural (N_n)**: {0, 1, ..., n-1}. Arithmetic wraps modulo n. (`_execute_natural()`, `are.py:128-150`)
- **Integer (Z_n)**: {-(n-1), ..., n-1}. Results projected via `_project_to_integer()` (`are.py:119-125`).
- **Rational (Q_n)**: Accumulator embedded as acc/1, step value as num/den. Scaled integer arithmetic avoids floating-point. (`_execute_rational()`, `are.py:186-229`)
- **Real (R_n)**: Fixed-point with n-bit precision; implemented as integer arithmetic. (`_execute_real()`, `are.py:232-241`)
- **Complex (C_n)**: Accumulator is (acc + 0i), step value is (re + im*i). Real part of result is projected back to integer range. (`_execute_complex()`, `are.py:244-288`)

#### 1.2 Operations

Six arithmetic operations (`Operation` enum, `are.py:36-43`): ADD, SUB, MUL, DIV, MOD, EXP. Exponentiation is capped at exponent 64 to prevent computational explosion (`are.py:149`). Division by zero returns the accumulator unchanged.

#### 1.3 Program Generation from Seed

The `AreExtractor.from_seed()` method (`are.py:328-396`) generates an ARE program deterministically from a cryptographic seed:

1. SHAKE-256 expands the seed into a byte stream.
2. Each step consumes 34 bytes: 1 byte domain (mod 5), 16 bytes signed-128-bit value, 16 bytes signed-128-bit imaginary component, 1 byte operation (mod 6).
3. Values are bounded to the domain range (mod domain_bound).

#### 1.4 Extraction

The `extract()` method (`are.py:422-450`) applies the program sequentially to an input value. Each step updates the accumulator via `domain_execute()` (`are.py:67-112`). The final value is reduced: `abs(acc) % modulus`.

#### 1.5 Counter-Mode Output Expansion

The `extract_bytes()` method (`are.py:452-506`) processes input in 16-byte blocks through the ARE program, collects extracted values into a SHA-256 digest to form a 32-byte seed, then expands via counter-mode SHA-256 (`are.py:496-506`):

```
result = []
counter = 0
while len(result) < output_len:
    block = SHA-256(are_seed || counter.to_bytes(4))
    result.extend(block)
    counter += 1
return result[:output_len]
```

### 2. Certified Heterogeneous Entropy Composition

#### 2.1 Source Protocol

Any entropy source satisfying the `EntropySource` protocol (`compositor.py:37-61`) can participate: a `name` property, a `read(n)` method returning n bytes, an `estimated_min_entropy` property (bits per byte, 0.0 to 8.0), and a `status` property returning one of HEALTHY, DEGRADED, or FAILED (`SourceStatus` enum, `compositor.py:29-33`).

#### 2.2 XOR Composition

The `EntropyCompositor.compose()` method (`compositor.py:110-171`):

1. Filters sources: excludes those with status FAILED (`compositor.py:122-124`).
2. Verifies at least `min_sources` are available (`compositor.py:126-130`).
3. Reads the requested bytes from each active source.
4. XOR-combines all source bytes into a single output buffer (`compositor.py:149-150`).
5. Records per-source provenance metadata (`compositor.py:155-161`).
6. Reports conservative min-entropy as the maximum across contributing sources.

#### 2.3 Legacy Provider Adapter

The `QuantumProviderAdapter` (`compositor.py:174-215`) bridges legacy `QuantumProvider` implementations to the `EntropySource` protocol. It runs NIST SP 800-90B health tests via `HealthTestSuite` and min-entropy estimation via `MinEntropyEstimator` on every byte read (`compositor.py:206-208`). A failure rate exceeding 1% (0.01) classifies the source as FAILED (`compositor.py:211-214`).

### 3. Merkle-Tree Provenance Certificates

#### 3.1 Provenance Records

Each source contribution is recorded as a `ProvenanceRecord` (`provenance.py:22-75`) with fields: source_name, min_entropy, health_status, bytes_contributed, timestamp, sha256_hash.

Canonical serialization uses pipe ('|') separators (`to_leaf_bytes()`, `provenance.py:42-54`):

```
"source_name|min_entropy(6dp)|health_status|bytes_contributed|timestamp(6dp)|sha256_hash"
```

#### 3.2 Merkle Tree Construction

The `_merkle_root()` function (`provenance.py:78-113`):

1. Each leaf is the SHA-256 hash of a serialized provenance record.
2. Pairs of hashes are concatenated and hashed recursively.
3. Odd number of nodes: the last node is duplicated (`provenance.py:108`).
4. Single leaf: root = SHA-256(leaf).

#### 3.3 Certificate

The `ProvenanceCertificate` (`provenance.py:117-201`) binds records to a Merkle root. The `verify()` method recomputes the root from records and checks it matches the stored root. `build_certificate()` (`provenance.py:204-237`) constructs certificates from `CompositionResult` objects.

### 4. Certified Entropy Provider

The `CertifiedEntropyProvider` (`certified.py:47-120`) orchestrates the full pipeline: compose entropy via `EntropyCompositor`, build a `ProvenanceCertificate`, compute conservative min-entropy bound. Returns a `CertifiedEntropyResult` (`certified.py:31-44`) containing: `data` (bytes), `certificate` (ProvenanceCertificate), `min_entropy_bits` (float), `sources` (list of names).

### 5. DORA Article 7 Compliance

The Digital Operational Resilience Act (DORA), effective in Norway from 1 July 2025, requires under Article 7 full cryptographic key lifecycle management. The provenance certificates produced by this invention provide auditable proof of entropy source identity, health status, and composition methodology for every key derivation event, directly satisfying the DORA Art. 7 audit trail requirement.

---

## SECURITY ANALYSIS

### ARE vs. Known Extractors

| Property | Universal Hashing | Trevisan | ARE (This Invention) |
|---|---|---|---|
| Mechanism | Linear hash families | Error-correcting codes | Algebraic programs over 5 domains |
| Operations | Multiply-add (GF(2)) | Bit extraction | ADD, SUB, MUL, DIV, MOD, EXP |
| Domains | Binary fields | Binary | N, Z, Q, R, C |
| Program generation | Random matrix | Seed + code | SHAKE-256 expansion |
| Output expansion | Not built-in | Not built-in | Counter-mode SHA-256 |

### ARE Entropy Contribution Independent of Output Expansion

The algebraic program contributes entropy to the extraction pipeline through three mechanisms that operate independently of the SHA-256 counter-mode output expansion:

1. **Input diffusion**: Each algebraic step mixes the accumulator with a pseudorandom value drawn from SHAKE-256 expansion. Because the program traverses five distinct number domains with different arithmetic semantics (modular wrapping in N, signed projection in Z, scaled rational arithmetic in Q, fixed-point computation in R, and complex plane operations in C), the accumulator undergoes non-linear transformations that cannot be replicated by any single-domain hash function.

2. **Domain-crossing non-linearity**: Consecutive steps may execute in different domains (e.g., NATURAL followed by COMPLEX followed by RATIONAL). Each domain transition introduces a projection operation that is not invertible in the general case. An adversary who observes the output cannot reconstruct the intermediate accumulator states without knowing both the seed and the exact domain sequence.

3. **Algebraic mixing with bounded exponentiation**: The EXP operation (capped at exponent 64) introduces polynomial non-linearity within each domain. Combined with the six available operations across five domains, the program space is combinatorially large: for an N-step program, there are (5 * 6)^N = 30^N possible program structures, each producing distinct accumulator trajectories.

The SHA-256 counter-mode expansion serves as a final uniformity guarantee, ensuring the output distribution is computationally indistinguishable from uniform. However, even if SHA-256 were replaced with any other PRF, the algebraic program would still provide min-entropy reduction from the input, because the domain-crossing non-linearities are properties of the algebraic execution, not the output hash.

Empirical validation: the ARE extractor passes NIST SP 800-22 Statistical Test Suite checks for frequency, runs, block frequency, and longest run of ones, with p-values consistently above 0.01 across multiple seeds (verified in `tests/python/test_entropy_are_nist.py`).

### Health Test Specification

The NIST SP 800-90B health monitoring implements the following tests:

- **Repetition Count Test**: Detects a single value repeated more than the expected maximum consecutive count for the source's estimated min-entropy.
- **Adaptive Proportion Test**: Monitors the frequency of the most common value within a sliding window, flagging if it exceeds the expected proportion for the declared entropy rate.
- **Min-Entropy Estimation**: Computes a conservative lower bound on bits-per-byte using the most common value estimator from SP 800-90B Section 6.3.1.

A source is classified as FAILED when more than 1% of byte reads trigger a health test failure. DEGRADED status is assigned when anomalies are detected but remain below the 1% threshold.

---

## DRAWINGS

### Figure 1: CHE Composition Pipeline

```
+--------------+  +--------------+  +--------------+
| QRNG Source  |  | CSI Source   |  | OS Source    |
| (IBM/qBraid) |  | (ESP32-S3)  |  | (/dev/urand) |
| min-ent: 8.0 |  | min-ent: 6.5|  | min-ent: 8.0|
+------+-------+  +------+-------+  +------+-------+
       |                 |                 |
       v                 v                 v
+--------------------------------------------------+
|         HEALTH MONITORING (SP 800-90B)            |
|  +----------+ +----------+ +----------+          |
|  | HEALTHY  | | DEGRADED | |  FAILED  |          |
|  | (pass)   | | (warn)   | | (exclude)|          |
|  +----+-----+ +----+-----+ +----------+          |
|       |            |                              |
+-------+------------+-----------------------------+
        |            |
        v            v
+--------------------------------------+
|        XOR COMPOSITION               |
|  result[i] ^= source_a[i]           |
|  result[i] ^= source_b[i]           |
|  min_entropy = max(individual)       |
+------------------+-------------------+
                   |
                   v
+--------------------------------------+
|   MERKLE PROVENANCE CERTIFICATE      |
|                                      |
|  Leaf: SHA-256(canonical_record)     |
|  "src|min_ent|status|bytes|ts|hash"  |
|                                      |
|  Tree:  [H(L0+L1)]  [H(L2+L2)]    |
|              +-------+               |
|              merkle_root             |
+------------------+-------------------+
                   |
                   v
+--------------------------------------+
|      CertifiedEntropyResult          |
|  .data: bytes                        |
|  .certificate: ProvenanceCertificate |
|  .min_entropy_bits: float            |
|  .sources: ["QRNG", "CSI"]          |
+--------------------------------------+
```

### Figure 2: ARE Extractor Architecture

```
Seed (any length)
  |
  v
+----------------------------------+
|  SHAKE-256 Expansion             |
|  -> 34 bytes per step:           |
|    [1B domain][16B value]        |
|    [16B imag][1B operation]      |
+----------------+-----------------+
                 |
                 v
+----------------------------------+
|  ARE Program (N steps)           |
|  Step 1: NATURAL, ADD, val=42   |
|  Step 2: COMPLEX, MUL, 7+3i    |
|  Step 3: INTEGER, EXP, val=5    |
+----------------+-----------------+
                 |
  Input data     |
  (16B blocks)   |
       |         |
       v         v
+----------------------------------+
|  Sequential Execution            |
|  acc = input_val                 |
|  for step in program:            |
|    acc = domain_execute(...)     |
|  output = abs(acc) % modulus     |
+----------------+-----------------+
                 |
                 v
+----------------------------------+
|  Counter-mode SHA-256 Expansion  |
|  seed = SHA-256(extracted_vals)  |
|  for ctr in 0,1,2,...:           |
|    block = SHA-256(seed || ctr)  |
|  return first output_len bytes   |
+----------------------------------+
```

### Figure 3: Graceful Degradation Over Time

```
Time -------------------------------------------------->

State 1: All sources healthy
  [QRNG: HEALTHY] [CSI: HEALTHY] [OS: HEALTHY]
  Entropy: max(8.0, 6.5, 8.0) = 8.0 bits/byte

     --- CSI failure rate exceeds 1% ---

State 2: CSI excluded
  [QRNG: HEALTHY] [CSI: FAILED]  [OS: HEALTHY]
  Entropy: max(8.0, 8.0) = 8.0 bits/byte
  Certificate: records CSI as FAILED, excluded

     --- QRNG anomalies detected ---

State 3: QRNG degraded
  [QRNG: DEGRADED] [CSI: FAILED] [OS: HEALTHY]
  Entropy: max(7.2, 8.0) = 8.0 bits/byte
  Certificate: records QRNG as DEGRADED, included with warning

     --- QRNG fails, only OS remains ---

State 4: Single source (if min_sources = 1)
  [QRNG: FAILED] [CSI: FAILED]  [OS: HEALTHY]
  Entropy: 8.0 bits/byte (OS only)
  Certificate: records only OS contribution

State 4b: Error (if min_sources > 1)
  RuntimeError: Only 1 healthy source, need 2
```
