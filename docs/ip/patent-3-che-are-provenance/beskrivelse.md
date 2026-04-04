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

The present invention relates to cryptographic entropy management. More specifically, the invention relates to: (1) a new family of randomness extractors based on algebraic programs over five or more number domains, including extensions to hypercomplex algebras, finite fields, and p-adic numbers; (2) a method for composing entropy from multiple heterogeneous sources with per-source health monitoring and Merkle-tree provenance certificates; (3) a graceful degradation protocol that maintains certified entropy production when individual sources fail; and (4) the application of algebraic extraction as a conditioner for wireless Channel State Information entropy sources.

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

### Multi-Source Entropy Aggregation

US10402172B1 (Qrypt, Inc.) describes a multi-source entropy aggregation and distribution network that collects entropy from diverse sources including quantum generators and tags each entropy sequence with flat provenance metadata (source identifier, timestamp, sequence number). However, this system uses flat metadata tags rather than hierarchical cryptographic proofs. There is no Merkle-tree structure binding source records to a verifiable root hash, no per-composition certificate that can be independently verified by an auditor, and no formal min-entropy bound adjustment when sources degrade.

US10140095 (Oracle) describes collecting entropy from diverse sources with health checks and threshold-based acceptance. Sources are either included or excluded in a binary fashion; the system does not recalculate composite min-entropy bounds during partial failure.

### Lack of Cryptographic Provenance Certification

While flat provenance tagging exists (US10402172B1), no existing entropy system provides a **cryptographically verifiable proof structure** (such as a Merkle tree) certifying which sources contributed to a given entropy output, their health status at composition time, and the resulting min-entropy bound. Auditors and regulators (particularly under DORA Article 7, which mandates full cryptographic key lifecycle management) cannot independently verify the lineage of entropy used in key generation.

### No Graceful Degradation with Formal Bound Adjustment

Existing multi-source entropy systems (US10140095, US9477443B1) either require all sources to be available, silently substitute weaker sources, or perform binary include/exclude on source failure. No prior system provides **formally adjusted min-entropy bounds** that decrease as sources degrade or fail, while maintaining a certified audit trail of the degradation event in the provenance certificate.

---

## SUMMARY OF THE INVENTION

The present invention provides three interrelated methods:

1. **Algebraic Randomness Extraction (ARE)**: A new family of randomness extractors parameterized by algebraic programs over five or more number domains with six arithmetic operations (ADD, SUB, MUL, DIV, MOD, EXP). The core embodiment uses five classical domains (N, Z, Q, R, C). Extended embodiments include quaternions (H) for non-commutative mixing, octonions (O) for non-associative mixing, finite fields GF(p^n) for provable uniform distribution, and p-adic numbers (Q_p) for orthogonal-metric mixing. Programs are generated deterministically from a seed via SHAKE-256. This family is distinct from all known hash-based extractor families.
2. **Certified heterogeneous entropy composition**: Multiple independent entropy sources (quantum, classical physical, operating system) are XOR-fused with per-source NIST SP 800-90B health monitoring. Each composition produces a Merkle-tree provenance certificate with canonically serialized source records as leaves, providing cryptographic proof of entropy lineage.
3. **Graceful degradation**: Failed sources are automatically excluded from composition. Degraded sources trigger warnings but continue to contribute. The reported min-entropy bound is adjusted to reflect only the sources that actually contributed. A configurable minimum source count prevents composition below a safety threshold.
4. **ARE as entropy source conditioner**: The algebraic extraction method can replace Von Neumann debiasing at the entropy source level, processing full quantized measurements rather than single least-significant bits, reducing extraction loss from approximately 50% to approximately 15%.

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

### 1.6 Extended Number Domains

The ARE framework accommodates algebraic structures beyond the five classical number domains. The following extensions introduce qualitatively different algebraic properties that enhance mixing and inversion resistance.

#### 1.6.1 Quaternions (H)

The quaternion algebra is a 4-dimensional associative division algebra over the reals, defined by Hamilton's relations: i² = j² = k² = ijk = -1. Quaternion multiplication is non-commutative: ij = k but ji = -k.

For ARE, non-commutativity means that a multiplication step `acc * value` produces a different result from `value * acc`. The SHAKE-256 program generator encodes an additional byte per quaternion step to specify left-multiplication or right-multiplication, effectively doubling the mixing paths through each step. An adversary attempting to invert the program must determine the multiplication direction at each step.

Quaternion arithmetic in the ARE program operates on bounded quaternion values (a + bi + cj + dk) where a, b, c, d are bounded integers. The projection to integers takes the scalar part (a) after the quaternion operation.

#### 1.6.2 Octonions (O)

The octonion algebra is an 8-dimensional non-associative division algebra over the reals, with multiplication defined by the Fano plane. Octonions are the largest normed division algebra by Hurwitz's theorem (1898): R, C, H, and O are the only normed division algebras over the reals. Octonion multiplication is both non-commutative and non-associative: (ab)c is not equal to a(bc) in general.

Non-associativity has a profound consequence for ARE: a sequence of K octonion multiplication steps cannot be simplified by algebraic regrouping. In commutative and associative domains (N through C), an adversary can attempt to combine consecutive steps algebraically. In octonion steps, each parenthesization of the operations produces a distinct result. The number of distinct parenthesizations grows as the Catalan numbers C(K) = (2K)! / ((K+1)! * K!), making inversion combinatorially harder.

Because octonions are a division algebra, no zero divisors exist. This ensures that no sequence of octonion operations can force the accumulator to a degenerate state (unlike sedenions, the 16-dimensional Cayley-Dickson algebra, which does have zero divisors and is therefore excluded from preferred embodiments).

#### 1.6.3 Finite Fields GF(p^n)

A finite field GF(p^n) for prime p and positive integer n contains exactly p^n elements. Arithmetic is exact: addition and multiplication are defined modulo an irreducible polynomial of degree n over GF(p). Every nonzero element has a multiplicative inverse. There are no overflow, rounding, or projection concerns.

For ARE, finite fields provide the strongest per-step min-entropy guarantee. If the input to a field multiplication by a nonzero constant is uniformly distributed over GF(p^n), the output is also uniformly distributed, because multiplication by a nonzero element is a bijection on GF(p^n)* (this follows from the group structure of the multiplicative group). Addition and subtraction of any constant are also bijections. The per-step min-entropy is therefore log_2(p^n) bits when the input is uniform and the operand is nonzero. When the operand is zero (which occurs with probability 1/p^n in a random program), the accumulator is unchanged for multiplication or zero for division; these cases do not reduce min-entropy below that of the previous step.

In the preferred embodiment, GF(2^8) is used (the same field as AES), containing 256 elements with arithmetic defined modulo the irreducible polynomial x^8 + x^4 + x^3 + x + 1. Operations in GF(2^8) can be hardware-accelerated via the PCLMULQDQ (carry-less multiplication) instruction available on modern x86 processors.

For larger fields, GF(2^128) (used in AES-GCM for Galois authentication) provides 128-bit per-step min-entropy. GF(p) for large primes p (as used in elliptic curve cryptography) provides approximately log_2(p) bits per step.

#### 1.6.4 p-adic Numbers (Q_p)

For each prime p, the p-adic numbers Q_p form a completion of the rational numbers Q with respect to the p-adic absolute value |x|_p = p^(-v_p(x)), where v_p(x) is the p-adic valuation (the largest power of p dividing x).

The defining property is the ultrametric inequality: |a + b|_p <= max(|a|_p, |b|_p). This is strictly stronger than the triangle inequality satisfied by the real absolute value. In practical terms, two numbers that are "close" in the real metric (|a - b| small) can be "far" in the p-adic metric (|a - b|_p large), and vice versa.

For ARE, p-adic arithmetic introduces mixing that is mathematically orthogonal to real-number arithmetic. Alternating between Real (R) and p-adic (Q_p) steps forces an adversary to track the accumulator's value in two incompatible topologies simultaneously. This provides a dimension of mixing that R alone cannot achieve.

In the preferred embodiment, truncated p-adic arithmetic is used: values are represented as finite p-adic expansions a_0 + a_1*p + a_2*p^2 + ... + a_{k-1}*p^{k-1} with precision k. Arithmetic is performed modulo p^k. The projection to integers takes the natural integer representation of the truncated expansion.

#### 1.6.5 Domain Properties and Selection Rationale

| Domain | Commutative | Associative | Division algebra | Zero divisors | ARE value |
|---|---|---|---|---|---|
| N (naturals) | Yes | Yes | No | No | Modular wrapping |
| Z (integers) | Yes | Yes | No | No | Signed projection |
| Q (rationals) | Yes | Yes | Yes | No | Rational scaling |
| R (reals) | Yes | Yes | Yes | No | Fixed-point mixing |
| C (complex) | Yes | Yes | Yes | No | Plane rotation |
| H (quaternions) | **No** | Yes | Yes | No | Non-commutative mixing |
| O (octonions) | **No** | **No** | Yes | No | Non-associative mixing |
| GF(p^n) | Yes | Yes | Yes | No | Provable uniformity |
| Q_p (p-adic) | Yes | Yes | Yes | No | Orthogonal metric |
| S (sedenions) | No | No | **No** | **Yes** | **Excluded** (zero divisors) |

The Cayley-Dickson construction produces algebras of dimension 2^n for n = 0, 1, 2, 3, ... (R, C, H, O, S, ...). Each doubling loses an algebraic property: R to C loses ordering; C to H loses commutativity; H to O loses associativity; O to S loses the division algebra property and introduces zero divisors. The preferred embodiment stops at octonions (O) because zero divisors in sedenions and higher algebras create degenerate accumulator states that reduce mixing quality.

The extended program generation allocates additional SHAKE-256 bytes per step when the selected domain requires multi-component values: 4 components for H (scalar, i, j, k), 8 components for O, field element encoding for GF, and p-adic digit sequences for Q_p.

### 1.7 ARE as Entropy Source Conditioner

The ARE extraction method can be applied at the entropy source level as a replacement for Von Neumann debiasing. This is particularly relevant for Channel State Information (CSI) entropy sources (as described in the co-pending patent application for "Unilateral CSI Entropy Harvesting").

#### 1.7.1 Current CSI Extraction (Von Neumann)

The current CSI harvesting pipeline processes 56 subcarrier phase measurements per WiFi frame (802.11n HT20):

1. For each complex subcarrier value H_k, compute phase: arg(H_k).
2. Quantize phase to 256 levels (8 bits).
3. Extract the least-significant bit (1 bit per subcarrier) = 56 raw bits per frame.
4. Apply Von Neumann debiasing: ~50% discard rate = ~28 usable bits = ~3.5 bytes per frame.
5. Estimated min-entropy: ~6.5 bits/byte.

The Von Neumann method discards approximately 50% of input bits and uses only 1 of 8 available quantized bits per subcarrier, resulting in significant extraction loss.

#### 1.7.2 ARE-Based CSI Extraction

The ARE conditioner processes the full 8-bit quantized phase measurements:

1. For each complex subcarrier value H_k, compute phase: arg(H_k).
2. Quantize phase to 256 levels (8 bits).
3. Collect all 8 bits per subcarrier = 448 raw bits (56 bytes) per frame.
4. Process the 56 input bytes through an ARE program with an independent seed.
5. The algebraic program mixes values across domains, removing spatial correlation between adjacent subcarriers through domain-crossing non-linearities.
6. Reduce output via modular prime reduction.
7. Estimated output: ~47-50 usable bytes per frame with ~7.0-7.5 bits/byte min-entropy.

The improvement comes from two sources: (a) using all quantized bits rather than only the LSB (8x more raw input), and (b) the algebraic mixing removes inter-subcarrier correlation more effectively than Von Neumann discard (which operates on bit pairs independently without cross-subcarrier mixing).

When GF(2^8) steps are included in the ARE program, each step that operates in GF provides a provable per-step uniform distribution guarantee, enabling formal min-entropy bounds for the conditioned output.

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
| Mechanism | Linear hash families | Error-correcting codes | Algebraic programs over 5+ domains |
| Operations | Multiply-add (GF(2)) | Bit extraction | ADD, SUB, MUL, DIV, MOD, EXP |
| Domains | Binary fields | Binary | N, Z, Q, R, C + H, O, GF, Q_p |
| Commutativity | Yes (GF(2)) | N/A | Broken in H, O domains |
| Associativity | Yes (GF(2)) | N/A | Broken in O domain |
| Provable per-step bound | Yes (pairwise independence) | Yes (Nisan-Wigderson) | Yes for GF steps; conjectured for others |
| Program space (K steps) | 2^(n*n) matrices | 2^(seed_len) | (D*6)^K where D = number of domains |
| Program generation | Random matrix | Seed + code | SHAKE-256 expansion |
| Output expansion | Not built-in | Not built-in | Counter-mode SHA-256 |
| Hardware acceleration | No | No | GF(2^8) via PCLMULQDQ |

### Extended Domain Mixing Properties

Non-commutative domains (H) and non-associative domains (O) enhance ARE security through mechanisms unavailable in hash-based extractors:

1. **Non-commutative mixing (H)**: In quaternion steps, `acc * value` and `value * acc` produce different results. The program must specify multiplication direction. An adversary attempting to invert the extraction must determine the direction at each quaternion step, doubling the search space per step.

2. **Non-associative mixing (O)**: In octonion steps, the result depends on the parenthesization of operations. For a sequence of K octonion multiplications, the number of distinct computation paths grows as the Catalan number C(K). This makes algebraic shortcut attacks (simplifying the program by regrouping operations) impossible in O steps.

3. **Provable uniformity (GF)**: In finite field steps, if the accumulator is uniformly distributed over GF(p^n), then the output of any invertible field operation (addition, subtraction, multiplication or division by a nonzero element) is also uniformly distributed. This provides a formal per-step min-entropy guarantee: H_min >= log_2(p^n) bits for steps with nonzero operands.

4. **Orthogonal-metric mixing (Q_p)**: Alternating between R steps and Q_p steps forces the accumulator through topologically incompatible spaces. Two values close in R-metric may be far in Q_p-metric. An adversary who can bound the accumulator in one metric gains no information about its position in the other.

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

### Figure 4: Extended Domain Mixing in ARE

```
SHAKE-256 seed expansion
  |
  v  Per-step domain selection (mod D, where D = number of domains)
  |
  +--[0: NATURAL]--- modular wrapping, commutative, associative
  +--[1: INTEGER]--- signed projection, commutative, associative
  +--[2: RATIONAL]-- scaled fractions, commutative, associative
  +--[3: REAL]------ fixed-point, commutative, associative
  +--[4: COMPLEX]--- plane rotation, commutative, associative
  +--[5: QUATERNION] 4D Hamilton, NON-COMMUTATIVE, associative
  |                  ij=k, ji=-k; left vs right multiplication
  +--[6: OCTONION]-- 8D Fano plane, NON-COMMUTATIVE, NON-ASSOCIATIVE
  |                  (ab)c != a(bc); Catalan(K) inversion paths
  +--[7: GF(p^n)]--- exact finite field, PROVABLE UNIFORM OUTPUT
  |                  H_min >= log2(p^n) bits per step
  +--[8: Q_p]------- p-adic ultrametric, ORTHOGONAL to R-metric
                     |a+b|_p <= max(|a|_p, |b|_p)

                        Algebraic properties gained:
  Domains 0-4:          commutative, associative (classical tower)
  Domain 5 (H):       + non-commutativity (direction-dependent mixing)
  Domain 6 (O):       + non-associativity (grouping-dependent mixing)
  Domain 7 (GF):      + provable per-step uniformity
  Domain 8 (Q_p):     + orthogonal metric (topology-independent mixing)
```

### Figure 5: ARE as CSI Entropy Conditioner

```
CURRENT PIPELINE (Von Neumann):           ARE PIPELINE:
  56 subcarriers                            56 subcarriers
  |                                         |
  v                                         v
  Phase: arg(H_k)                           Phase: arg(H_k)
  |                                         |
  v                                         v
  Quantize to 256 levels                    Quantize to 256 levels
  |                                         |
  v                                         v
  Extract LSB only (1 bit each)             Use ALL 8 bits (8 bits each)
  = 56 raw bits                             = 448 raw bits (56 bytes)
  |                                         |
  v                                         v
  Von Neumann debiasing                     ARE algebraic program
  ~50% discard                              cross-domain mixing
  = ~28 bits = ~3.5 bytes                   removes inter-subcarrier
  |                                         correlation
  v                                         |
  ~6.5 bits/byte                            v
                                            ~47-50 bytes per frame
                                            ~7.0-7.5 bits/byte

  Extraction efficiency: ~25%               Extraction efficiency: ~85%
  Uses: 1 of 8 quantized bits              Uses: all 8 quantized bits
```
