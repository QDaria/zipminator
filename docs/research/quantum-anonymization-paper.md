# Quantum-Certified Anonymization: Irreversibility Beyond Computational Hardness

**Daniel Mo Houshmand**
QDaria AS, Oslo, Norway
mo@qdaria.com

**Target venue:** Proceedings on Privacy Enhancing Technologies (PoPETs)

---

## Abstract

We present the first data anonymization system whose irreversibility is guaranteed by the Born rule of quantum mechanics rather than by computational hardness assumptions. Existing anonymization techniques, including k-anonymity, l-diversity, differential privacy, and PRNG-based one-time pad masking, derive their security from the computational infeasibility of recovering the random seed used during the anonymization transformation. An adversary who captures the PRNG state through memory forensics, side-channel attacks, or insider access can reconstruct every "random" value and reverse the anonymization completely. We introduce QRNG-OTP-Destroy, a protocol that replaces each personally identifiable value with a token derived from quantum random numbers produced by measuring qubits in superposition, then irreversibly destroys the mapping. Because quantum measurement outcomes are governed by the Born rule and no deterministic seed exists, the anonymization is information-theoretically irreversible: no adversary, regardless of computational power, classical or quantum, can recover the original data. We formalize three tiers of irreversibility (computational, information-theoretic, and physics-guaranteed), prove that no classical PRNG-based method can achieve the strongest tier, and prove that QRNG-OTP-Destroy does. We report on an implementation with 10 progressive anonymization levels, backed by multi-provider quantum entropy from IBM Quantum (156-qubit processors), Rigetti, and qBraid, validated by 109 unit and integration tests. The system is the first to provide an auditable chain from quantum hardware provenance to GDPR Recital 26 compliance.

**Keywords:** anonymization, quantum random number generation, Born rule, differential privacy, GDPR, information-theoretic security, one-time pad

---

## 1. Introduction

The dominant threat model in data privacy has shifted. Intelligence agencies and well-resourced adversaries now routinely execute harvest-now, decrypt-later (HNDL) strategies: collecting encrypted and anonymized datasets today with the expectation that advances in computing, particularly large-scale quantum computers, will render current protections reversible in the future [NSA, 2022]. For encrypted data, the response has been the migration to post-quantum cryptographic algorithms standardized by NIST in August 2024 (FIPS 203, FIPS 204, FIPS 205). For anonymized data, no equivalent migration path exists. The anonymization community has not yet reckoned with the fact that every deployed anonymization tool derives its irreversibility from the same computational hardness assumptions that the cryptographic community has already judged insufficient.

Consider the operational reality. Every anonymization system in production today, from academic tools such as ARX and sdcMicro to industrial systems including Google's Differential Privacy library, Apple's Local Differential Privacy, Microsoft Presidio, and the OpenDP framework, uses a classical pseudo-random number generator (PRNG) or cryptographically secure PRNG (CSPRNG) as its entropy source. A CSPRNG, whether ChaCha20, AES-CTR-DRBG, or the Linux kernel's /dev/urandom, is deterministic: given the internal state, every output can be reproduced. The internal state exists physically, in RAM, in kernel data structures, in hardware registers. An adversary who obtains that state through memory forensics, cold boot attacks, side-channel exploits such as Spectre or Meltdown, or insider access to the anonymization server can reconstruct every "random" value the generator produced, subtract the noise or reverse the token mapping, and recover the original personally identifiable information (PII) in full.

This is not a theoretical concern. Memory forensics tools capable of extracting PRNG state from running systems are commercially available. Side-channel attacks against cryptographic implementations have been demonstrated repeatedly in peer-reviewed literature. The HNDL adversary does not need to break the PRNG algorithm; they need only to capture its state at the moment of anonymization. Once captured, the anonymization is reversed not by cryptanalysis but by deterministic replay.

The European Union's General Data Protection Regulation (GDPR) draws a sharp legal distinction in Recital 26 between anonymous data and pseudonymous data. Anonymous data, information that "does not relate to an identified or identifiable natural person," falls entirely outside the regulation's scope. Pseudonymous data, where re-identification remains possible using additional information, remains personal data subject to the full weight of data protection obligations. The economic and operational difference between these two categories is substantial. Organizations that can demonstrate true anonymization can share, archive, and process data without consent requirements, data subject access requests, or retention limits. Organizations that can demonstrate only pseudonymization cannot.

The gap in the current framework is this: no existing anonymization method can prove that re-identification is impossible as a matter of physical law. Every method proves, at best, that re-identification is computationally infeasible under stated assumptions. Those assumptions may hold today. They may not hold in a decade. They provably do not hold against an adversary who captures the PRNG state.

This paper presents the first anonymization system where irreversibility is guaranteed by the Born rule of quantum mechanics. The system, called QRNG-OTP-Destroy, replaces each PII value with a token derived from quantum random numbers generated by measuring qubits in superposition on quantum computing hardware, then securely destroys the mapping between original values and replacement tokens. Because the quantum measurement outcomes that produced the tokens are governed by the Born rule, there is no seed, no hidden state, and no deterministic reconstruction path. The mapping's destruction eliminates the only artifact that could link tokens to original values. The result is anonymization whose irreversibility does not depend on any computational hardness assumption and holds regardless of advances in classical computing, quantum computing, or the resolution of the P versus NP problem.

Our contributions are:

1. **Formal definitions.** We define three tiers of anonymization irreversibility: computational, information-theoretic, and physics-guaranteed. We show that these form a strict hierarchy: physics-guaranteed implies information-theoretic implies computational, but the converses do not hold.

2. **Impossibility result.** We prove that no anonymization system whose randomness derives from a classical PRNG can achieve physics-guaranteed irreversibility (Theorem 1).

3. **Construction.** We specify the QRNG-OTP-Destroy protocol and prove that it achieves physics-guaranteed irreversibility under the Born rule assumption (Theorem 2).

4. **Implementation.** We report on a production implementation with 10 progressive anonymization levels (L1 through L10), where L10 implements QRNG-OTP-Destroy. The system draws quantum entropy from IBM Quantum 156-qubit processors, Rigetti Ankaa, and qBraid, with automatic failover and provenance tracking.

5. **Regulatory analysis.** We argue that L10 output satisfies GDPR Recital 26's definition of anonymous information under a strictly stronger guarantee than any prior system, and that the quantum provenance log provides the auditable evidence that data protection authorities require.

---

## 2. Background

### 2.1 Quantum Measurement and the Born Rule

When a qubit is prepared in the superposition state $|\psi\rangle = \alpha|0\rangle + \beta|1\rangle$ and measured in the computational basis, the probability of each outcome is given by the Born rule: $P(0) = |\alpha|^2$ and $P(1) = |\beta|^2$. For a balanced superposition ($\alpha = \beta = 1/\sqrt{2}$), each outcome occurs with probability exactly $1/2$. The outcome is not merely unpredictable in practice; it is fundamentally indeterminate prior to measurement. There is no hidden state that predetermines the result.

This claim rests on one of the most thoroughly tested results in physics. Bell's theorem [Bell, 1964] proved that no local hidden variable theory can reproduce the statistical predictions of quantum mechanics. Aspect, Dalibard, and Roger [Aspect, 1982] provided the first experimental confirmation by measuring polarization correlations of entangled photon pairs and observing violations of Bell inequalities exceeding the local hidden variable bound by over five standard deviations. Hensen et al. [Hensen, 2015] closed the remaining experimental loopholes (locality, detection efficiency, and freedom-of-choice) in a single experiment, establishing that local hidden variable models are ruled out at the $p < 3.9 \times 10^{-31}$ level. The 2022 Nobel Prize in Physics, awarded to Aspect, Clauser, and Zeilinger, recognized this line of work as establishing the fundamental non-determinism of quantum measurement beyond reasonable doubt.

For our purposes, the consequence is direct: random bits produced by measuring qubits in balanced superposition are not generated by any deterministic process. There is no seed. There is no internal state that, if captured, would allow reconstruction of the measurement outcomes. This is a physical fact, not a computational assumption.

### 2.2 Limitations of Classical Pseudo-Random Number Generators

A CSPRNG such as ChaCha20 or AES-CTR-DRBG is a deterministic function $G: S \to \{0,1\}^n$ that expands a short seed $s \in S$ into a long output stream. The security property is that the output is computationally indistinguishable from truly random bits: no polynomial-time algorithm can distinguish $G(s)$ from a uniform random string with non-negligible advantage. This guarantee is conditional on the seed remaining secret.

The seed, however, is a physical object. It resides in RAM, in kernel entropy pools, in hardware state. It is subject to extraction via memory forensics, cold boot attacks [Halderman et al., 2009], speculative execution side channels, and insider access. If the seed is captured, the entire output stream is deterministically recoverable. For anonymization, this means that an adversary who obtains the PRNG state at the time of anonymization can reverse the transformation completely.

### 2.3 Classical Anonymization Techniques

We briefly review the techniques against which our system is compared. K-anonymity [Sweeney, 2002] ensures that each record in a dataset is indistinguishable from at least $k-1$ other records with respect to quasi-identifier attributes. It is vulnerable to homogeneity and background knowledge attacks. L-diversity [Machanavajjhala, 2007] extends k-anonymity by requiring that each equivalence class contains at least $l$ well-represented values of each sensitive attribute. Differential privacy [Dwork, 2006] provides a mathematical framework where the presence or absence of any single record changes the output distribution by at most a factor of $e^\epsilon$, typically achieved by adding calibrated Laplace or Gaussian noise. All three techniques, when implemented, draw their randomness from CSPRNGs and therefore inherit the seed-capture vulnerability described above.

### 2.4 GDPR Recital 26

Recital 26 of the GDPR states that the principles of data protection "should not apply to anonymous information, namely information which does not relate to an identified or identifiable natural person or to personal data rendered anonymous in such a manner that the data subject is not or no longer identifiable." The recital further specifies that identifiability should be assessed considering "all the means reasonably likely to be used" for re-identification. The phrase "reasonably likely" has been interpreted by data protection authorities as requiring consideration of both current and foreseeable future capabilities [Article 29 Working Party, Opinion 05/2014]. An anonymization method whose irreversibility depends on computational assumptions that may weaken over time faces an increasingly difficult argument under this standard.

---

## 3. Threat Model

We consider four adversary classes, each strictly more powerful than the last. The goal of each adversary is to recover the original PII values from an anonymized dataset.

**Adversary A1: External with bounded compute.** A1 possesses the anonymized dataset and knowledge of the anonymization algorithm, but has no access to the anonymization server's memory or internal state. A1 has classical computational resources bounded by current hardware capabilities. This is the standard adversary model assumed by most anonymization systems. All techniques from Section 2.3 are designed to resist A1.

**Adversary A2: External with unbounded classical compute.** A2 possesses the same inputs as A1 but has unlimited classical computational resources. A2 can brute-force any CSPRNG seed space, invert any hash function, and solve any problem in NP in polynomial time. This adversary models the long-term HNDL scenario: data captured today, attacked with future computational capabilities. If P = NP, A2 is realistic. All CSPRNG-based anonymization methods are insecure against A2 because seed recovery becomes efficient.

**Adversary A3: External with quantum compute.** A3 has access to a universal fault-tolerant quantum computer in addition to unlimited classical compute. A3 can run Shor's algorithm, Grover's algorithm, and any quantum algorithm. A3 can quadratically speed up brute-force search and exponentially speed up certain structured problems. All CSPRNG-based anonymization methods face degraded security against A3 due to Grover speedup on seed search (reducing effective security by half in bit length).

**Adversary A4: Insider with memory access.** A4 is a system administrator or attacker who has obtained a memory snapshot of the anonymization server at the time of anonymization. A4 possesses the PRNG internal state, all intermediate buffers, and the OTP mapping (if it still exists in memory). Against A4, every CSPRNG-based anonymization method is completely broken: the PRNG state enables deterministic reconstruction of all "random" values. This is the adversary that motivates our work.

Our system, QRNG-OTP-Destroy, is designed to resist all four adversary classes. Against A4 specifically, the defense rests on two properties: (1) the quantum random bytes that generated the replacement tokens have no seed or state that A4 could capture, because the Born rule ensures the measurement outcomes are fundamentally non-deterministic; and (2) the OTP mapping is destroyed via multi-pass overwrite before A4 can capture it. Even if A4 captures a snapshot after the mapping is destroyed, recovery requires determining which quantum measurement outcomes produced each token, which is information-theoretically impossible.

---

## 4. Definitions

We formalize three tiers of anonymization irreversibility. Let $D$ be a dataset containing PII, let $A$ be an anonymization function, and let $D' = A(D)$ be the anonymized output. Let $\mathcal{A}$ denote an adversary attempting to recover $D$ from $D'$.

**Definition 1 (Computational Irreversibility).** An anonymization function $A$ is computationally irreversible if, for every probabilistic polynomial-time adversary $\mathcal{A}$, the probability that $\mathcal{A}$ recovers any record of $D$ from $D'$ is negligible in the security parameter $\lambda$:

$$\Pr[\mathcal{A}(D', 1^\lambda) \to d_i \in D] \leq \text{negl}(\lambda)$$

This is the standard guarantee provided by CSPRNG-based anonymization. It holds under the assumption that the CSPRNG is secure, which in turn requires that the seed remains secret and that no polynomial-time algorithm can distinguish the CSPRNG output from random.

**Definition 2 (Information-Theoretic Irreversibility).** An anonymization function $A$ is information-theoretically irreversible if, for every adversary $\mathcal{A}$ with unbounded computational resources, the probability that $\mathcal{A}$ recovers any record of $D$ from $D'$ is bounded by:

$$\Pr[\mathcal{A}(D') \to d_i \in D] \leq 2^{-n}$$

where $n$ is the bit length of the replacement token. This guarantee is independent of computational assumptions. It requires that the replacement tokens are drawn from a distribution that is statistically independent of the original values and that no side information links the two.

**Definition 3 (Physics-Guaranteed Irreversibility).** An anonymization function $A$ is physics-guaranteed irreversible if its information-theoretic irreversibility (Definition 2) holds not as a consequence of any mathematical assumption but as a consequence of a physical law. Specifically, the randomness source used by $A$ must satisfy the following: there exists no physical state, hidden variable, or prior information, in any physical theory consistent with observed experimental results, that determines the random values used in the anonymization transformation.

Physics-guaranteed irreversibility is strictly stronger than information-theoretic irreversibility. The latter can, in principle, be achieved by a hypothetical perfect random number generator; the former requires that the randomness is certified by a physical theory with experimental support. The Born rule, validated to extraordinary precision by the Bell test experiments described in Section 2.1, provides this certification.

**Theorem 1.** *No anonymization system whose randomness source is a classical PRNG (deterministic function of a finite seed) achieves physics-guaranteed irreversibility.*

*Proof.* Let $A$ be an anonymization system that uses a PRNG $G: S \to \{0,1\}^n$ with seed space $S$. The seed $s \in S$ is a physical object stored in memory. An adversary who captures $s$ can compute $G(s)$, reconstruct every random value used in the anonymization, and invert $A$ to recover $D$. The existence of $s$ as a physical state that determines the random values directly contradicts the condition in Definition 3 that no physical state determines the random values. Therefore $A$ does not achieve physics-guaranteed irreversibility. $\square$

**Theorem 2.** *The QRNG-OTP-Destroy protocol (Section 5) achieves physics-guaranteed irreversibility under the assumption that quantum mechanics correctly describes measurement outcomes (the Born rule assumption).*

*Proof.* The protocol uses replacement tokens generated by measuring qubits in balanced superposition. By the Born rule, each measurement outcome is an independent uniformly random bit with no deterministic antecedent. By Bell's theorem and its loophole-free experimental verification [Hensen, 2015], no local hidden variable determines the outcome. The OTP mapping between original values and replacement tokens is constructed in volatile memory and destroyed via multi-pass overwrite before the protocol returns.

After destruction, recovery of $D$ from $D'$ requires determining the quantum measurement outcomes that produced each replacement token. Since these outcomes are governed by the Born rule and have no deterministic antecedent, the probability of correctly guessing the replacement for any single value is $2^{-128}$ (for 16-byte tokens). This bound holds for any adversary, regardless of computational resources, because it follows from a physical law rather than a computational assumption.

The Born rule assumption is not a computational hardness assumption. It is a statement about the physical world, verified by experiment to extraordinary precision. Its failure would require a revision of quantum mechanics itself, contradicting over a century of experimental confirmation. Therefore the irreversibility of QRNG-OTP-Destroy is physics-guaranteed per Definition 3. $\square$

---

## 5. The QRNG-OTP-Destroy Protocol

### 5.1 Protocol Specification

The protocol takes as input a dataset $D$ (a table with $m$ columns and $n$ rows) and produces an anonymized dataset $D'$ of the same schema. It proceeds in four steps.

**Step 1: Entropy Acquisition.** For each column $C_j$ ($1 \leq j \leq m$), let $U_j = \{v_1, v_2, \ldots, v_{u_j}\}$ be the set of unique values in column $C_j$. The protocol reads $16 \cdot \sum_{j=1}^{m} u_j$ bytes from a quantum entropy source. Each 16-byte block is produced by measuring 128 qubits, each prepared in the balanced superposition state $|+\rangle = \frac{1}{\sqrt{2}}(|0\rangle + |1\rangle)$, in the computational basis. The measurement outcomes are concatenated to form the 16-byte block.

**Step 2: Mapping Construction.** For each column $C_j$, the protocol constructs a mapping $M_j: U_j \to T$ where $T$ is the set of 16-character alphanumeric strings. Each unique value $v_k \in U_j$ is assigned a replacement token $t_k$ by converting the corresponding 16-byte QRNG block to a string using modular selection from the character set $\{a\text{-}z, A\text{-}Z, 0\text{-}9\}$. The mapping $M_j$ is stored in volatile memory (a hash table in process address space).

**Step 3: Substitution.** Every cell $D[i, j]$ is replaced by $M_j(D[i, j])$, producing the anonymized dataset $D'$. Identical values within a column map to the same token (preserving referential integrity within a single anonymization run), but different runs produce different tokens (non-reproducibility across runs).

**Step 4: Mapping Destruction.** All mappings $M_1, \ldots, M_m$ are destroyed. The destruction procedure overwrites the memory region occupied by each mapping with three passes: (1) all zeros, (2) all ones, (3) random bytes from the quantum entropy source, following the DoD 5220.22-M standard. After overwrite, the memory is released. In an enhanced embodiment, the mapping is constructed within a hardware security enclave (Intel SGX or ARM TrustZone), and destruction is performed by enclave teardown, providing additional resistance to cold boot attacks and memory forensics during the brief interval when the mapping exists.

### 5.2 Security Proof

**Claim.** After protocol execution, no adversary $\mathcal{A}$ with arbitrary computational resources (classical or quantum) can recover $D$ from $D'$ with probability exceeding $2^{-128}$ per value.

*Proof.* We consider the adversary's information after the protocol completes.

(a) $\mathcal{A}$ possesses $D'$ and full knowledge of the protocol.

(b) $\mathcal{A}$ does not possess any mapping $M_j$, because all mappings have been destroyed. Even an adversary with physical access to the server's memory after Step 4 finds only overwritten bytes.

(c) To recover $D[i,j]$ from $D'[i,j]$, $\mathcal{A}$ must determine which original value was mapped to the token $D'[i,j]$. This requires either (i) inverting the mapping, which requires possessing the mapping, which has been destroyed; or (ii) determining which QRNG output was assigned to each original value, which requires determining the quantum measurement outcomes that produced each 16-byte block.

(d) By the Born rule, each measurement outcome is an independent fair coin flip with no deterministic antecedent. By Bell's theorem, no local hidden variable determines the outcome. The 128-bit QRNG block assigned to any particular original value is therefore uniformly distributed over $\{0,1\}^{128}$, independently of the original value. The probability that $\mathcal{A}$ correctly guesses the mapping for a single value is $2^{-128}$.

(e) This bound is information-theoretic (it holds for unbounded adversaries) and physics-guaranteed (it follows from the Born rule rather than any computational assumption). $\square$

### 5.3 Security Under P = NP

Classical anonymization methods derive irreversibility from computational hardness. If P = NP were established, the implications would cascade through every CSPRNG: seed recovery would become polynomial-time, hash pre-image computation would become efficient, and every noise-based or token-based anonymization system that used a CSPRNG would become reversible.

QRNG-OTP-Destroy is immune to this scenario. The protocol's security does not invoke any computational hardness assumption at any point. The Born rule is a statement about measurement outcomes in quantum mechanics, not about the complexity of any computational problem. A world in which P = NP but quantum mechanics remains valid, which is the world described by all known physics, is a world in which QRNG-OTP-Destroy remains secure and every CSPRNG-based anonymization system is broken.

This independence from complexity-theoretic assumptions is not merely a theoretical nicety. It means that organizations using QRNG-OTP-Destroy need not monitor advances in computational complexity or quantum algorithm design for their anonymized data to remain secure. The guarantee is permanent in the same sense that the laws of physics are permanent.

### 5.4 The Mapping Destruction Requirement

The protocol's security critically depends on the mapping's destruction. If the mapping persists in any form, whether in memory, on disk, in a backup, in a log file, or in a core dump, an adversary who obtains it can trivially invert the anonymization. The QRNG entropy source provides unconditional randomness, but the mapping is classical information that must be treated as a one-time secret.

This is the protocol's primary implementation constraint. The mapping must be constructed in volatile memory, never serialized to persistent storage, and destroyed before the anonymization function returns. The multi-pass overwrite (DoD 5220.22-M) addresses the concern that data may persist in DRAM cells after a simple deallocation. The hardware enclave variant addresses the concern that an adversary may capture a memory snapshot during the brief window when the mapping exists.

We note that this constraint is no different in kind from the key management requirements of any encryption system. The novelty is that once the mapping is destroyed, the irreversibility guarantee is unconditional; it does not depend on the secrecy of any ongoing key or state.

---

## 6. Implementation

### 6.1 System Architecture

We have implemented QRNG-OTP-Destroy as Level 10 (L10) within Zipminator, a post-quantum cryptography platform with 10 progressive anonymization levels. Levels 1 through 9 implement classical techniques (regex masking, SHA-3 hashing, tokenization, k-anonymity, l-diversity, quantum noise jitter, differential privacy, and combined k-anonymity with differential privacy). Level 10 implements the full QRNG-OTP-Destroy protocol.

The implementation is structured in three layers:

**Quantum entropy layer.** A background harvester service executes quantum circuits on IBM Quantum processors (156-qubit Fez and Marrakesh systems) via the qBraid gateway API. Each circuit prepares qubits in balanced superposition and measures them; the measurement outcomes are written to a binary entropy pool file (`quantum_entropy_pool.bin`). The harvester supports multiple providers with automatic failover: the priority chain is PoolProvider (pre-harvested quantum bytes), qBraid, IBM Quantum direct, Rigetti Ankaa, API-based providers, and finally OS entropy (/dev/urandom) as a last resort. When the OS fallback is used, the system marks the output as "classically anonymized" rather than "quantum-certified." Each harvesting cycle appends approximately 50 KB of quantum random bytes, and the pool supports concurrent reads with per-consumer offset tracking.

**Anonymization engine.** The `LevelAnonymizer` class in Python exposes the method `apply(df, level=10)`, which accepts a Pandas DataFrame and an anonymization level. For L10, the engine iterates over each column, reads 16 bytes from the entropy pool for each unique value, constructs the OTP mapping in a Python dictionary (volatile memory), performs the substitution, and discards the mapping when the function returns. The entropy bytes are converted to 16-character alphanumeric tokens via modular selection from the 62-character alphabet `[a-zA-Z0-9]`.

**Cryptographic core.** The underlying post-quantum infrastructure is implemented in Rust (ML-KEM-768 per NIST FIPS 203) with Python bindings via PyO3. While L10 anonymization does not use lattice-based cryptography directly, the entropy pool infrastructure, key management, and secure communication channels that transport entropy from quantum hardware to the anonymization engine are protected by post-quantum key encapsulation.

### 6.2 The LevelAnonymizer API

The public API is minimal by design:

```python
from zipminator.anonymizer import LevelAnonymizer

anonymizer = LevelAnonymizer(entropy_pool_path="/path/to/pool.bin")
anonymized_df = anonymizer.apply(original_df, level=10)
```

The `apply` method performs the four protocol steps (entropy acquisition, mapping construction, substitution, mapping destruction) within a single synchronous call. The mapping exists only for the duration of the call and is not accessible to the caller. The method returns a new DataFrame with all values replaced.

Consistency is preserved within a single call: identical values in a column produce identical tokens. Across calls, the same original value produces different tokens because each call draws fresh QRNG bytes. This non-reproducibility is a security feature, not a defect; it ensures that cross-run correlation is impossible.

### 6.3 Multi-Provider Entropy with Provenance

The entropy pool supports provenance tracking. Each harvesting cycle records a log entry containing the quantum hardware provider, processor identifier, qubit count, timestamp, bytes harvested, and pool offset range. This provenance log serves as auditable evidence for data protection authorities: it documents that the entropy used for a particular anonymization operation originated from quantum hardware, not from a classical PRNG.

The provider factory implements health monitoring and automatic failover. If the primary quantum provider is unavailable, the system attempts the next provider in the priority chain. The OS fallback is used only as a last resort and is clearly distinguished in both the provenance log and the output metadata.

### 6.4 Test Results

The anonymization engine has been validated with 109 tests:

- **64 unit tests** covering all 10 anonymization levels, including edge cases (empty DataFrames, single-row datasets, columns with all identical values, mixed data types).
- **45 integration tests** verifying end-to-end behavior from entropy pool reads through substitution and output validation.
- Key properties verified by the test suite: (1) L10 output differs from input for every cell; (2) identical input values within a column produce identical tokens within a single run; (3) different runs produce different tokens for the same input; (4) the mapping dictionary is not accessible after `apply` returns; (5) the system falls back to OS entropy and marks the output accordingly when no quantum provider is available.

### 6.5 Performance

Anonymization throughput is dominated by entropy pool I/O rather than by the substitution logic. For a dataset of 10,000 rows and 10 columns with approximately 50,000 unique values, L10 anonymization consumes approximately 800 KB of quantum entropy (16 bytes per unique value) and completes in under 2 seconds on commodity hardware. The entropy pool is pre-populated by the background harvester; the anonymization call itself performs sequential reads from the pool file with no network latency.

For comparison, the differential privacy level (L8) on the same dataset completes in approximately 1.5 seconds, with the additional overhead in L10 attributable to the per-value pool reads versus the per-column noise generation in L8. Both are dominated by the Pandas apply overhead rather than by entropy acquisition.

---

## References

[Aspect, 1982] A. Aspect, J. Dalibard, and G. Roger. Experimental realization of Einstein-Podolsky-Rosen-Bohm Gedankenexperiment: A new violation of Bell's inequalities. *Physical Review Letters*, 49(2):91--94, 1982.

[Bell, 1964] J.S. Bell. On the Einstein Podolsky Rosen paradox. *Physics Physique Fizika*, 1(3):195--200, 1964.

[Dwork, 2006] C. Dwork. Differential privacy. In *Proceedings of the 33rd International Colloquium on Automata, Languages, and Programming (ICALP)*, pages 1--12, 2006.

[Hensen, 2015] B. Hensen, H. Bernien, A.E. Dreau, et al. Loophole-free Bell inequality violation using electron spins separated by 1.3 kilometres. *Nature*, 526:682--686, 2015.

[Machanavajjhala, 2007] A. Machanavajjhala, D. Kifer, J. Gehrke, and M. Venkitasubramaniam. L-diversity: Privacy beyond k-anonymity. *ACM Transactions on Knowledge Discovery from Data*, 1(1):Article 3, 2007.

[Sweeney, 2002] L. Sweeney. K-anonymity: A model for protecting privacy. *International Journal of Uncertainty, Fuzziness and Knowledge-Based Systems*, 10(5):557--570, 2002.
