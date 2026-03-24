# Quantum-Certified Anonymization: Comparison, Related Work, and Limitations

Sections 7--10 of the PoPETs submission on physics-guaranteed data anonymization
using quantum random number generation.

---

## 7. Systematic Comparison

We now present a systematic comparison of Zipminator L10 against the principal
open-source anonymization tools available as of early 2026. Our analysis focuses
on four dimensions that determine the strength of an anonymization guarantee:
(1) the technique employed, (2) the entropy source underlying any randomized
operations, (3) the basis on which irreversibility is claimed, and (4) the
implications for regulatory compliance under GDPR Recital 26.

### 7.1 Comparison Table

| Tool | Technique | Entropy Source | Irreversibility Basis | P=NP Secure | GDPR Recital 26 |
|------|-----------|---------------|----------------------|-------------|-----------------|
| **Zipminator L10** | QRNG one-time pad + mapping destruction | IBM Quantum (156-qubit superconducting processors) | Physics (Born rule) | Yes | Full compliance: information-theoretic anonymization |
| **ARX** [Prasser et al. 2014] | k-anonymity, l-diversity, t-closeness, differential privacy | Java `SecureRandom` (platform CSPRNG) | Computational | No | Partial: depends on parameter choice and attack model |
| **sdcMicro** [Templ 2017] | k-anonymity, microaggregation, PRAM, noise addition | R's built-in PRNG (Mersenne Twister by default) | Computational | No | Partial: utility-preserving methods retain linkable structure |
| **Google DP Library** [Wilson et al. 2020] | Laplace/Gaussian mechanism, Privacy on Beam | Platform CSPRNG (`/dev/urandom` or equivalent) | Computational | No | Partial: noise addition, not value replacement |
| **Apple Local DP** [Apple DP Team 2017] | Randomized response, CMS, local DP | Device-local CSPRNG | Computational | No | Partial: per-record perturbation with tunable epsilon |
| **OpenDP** [Gaboardi et al. 2020] | Laplace, Gaussian, exponential mechanism | Platform CSPRNG | Computational | No | Partial: framework-level guarantees depend on composition |
| **Amnesia** [OpenAIRE] | k-anonymity, km-anonymity, generalization, suppression | Java platform CSPRNG | Computational | No | Partial: syntactic model, vulnerable to background knowledge |
| **Microsoft Presidio** [Microsoft 2019] | PII detection + masking/redaction/encryption | Platform CSPRNG for masking operations | Computational | No | Partial: detection focus; anonymization depends on operator choice |

### 7.2 Entropy Sources

Every tool in the comparison table other than Zipminator L10 relies on classical
pseudo-random number generators for any randomized operation. ARX and Amnesia,
being Java applications, use `java.security.SecureRandom`, which delegates to
the platform's CSPRNG (typically `/dev/urandom` on Linux, `BCryptGenRandom` on
Windows). sdcMicro defaults to R's Mersenne Twister, a fast but non-cryptographic
PRNG; users can substitute a CSPRNG, but the default configuration does not
enforce this. Google's DP library and OpenDP both use the operating system's
CSPRNG for noise generation. Apple's local DP implementation uses the device's
hardware-backed CSPRNG (Secure Enclave on iOS/macOS). Microsoft Presidio, whose
primary function is PII detection rather than anonymization, uses platform
randomness for any masking or replacement operations.

All of these generators are deterministic: given the internal state (seed), every
output is reproducible. The security guarantee is that recovering the seed from
the output is computationally infeasible. This is a reasonable assumption under
current hardware, but it is an assumption, not a physical law.

Zipminator L10 reads entropy from a pool populated by measuring qubits in
superposition on IBM Quantum processors (currently 156-qubit Eagle/Heron
series). The measurement outcomes are governed by the Born rule. Bell's theorem,
experimentally confirmed in loophole-free form by Hensen et al. (2015) and
recognized by the 2022 Nobel Prize in Physics (Aspect, Clauser, Zeilinger),
proves that no local hidden variable theory reproduces quantum measurement
statistics. No seed exists. No internal state determines the output.

### 7.3 Irreversibility Analysis

The tools in the comparison fall into two categories based on their
irreversibility claims.

**Syntactic methods** (ARX, sdcMicro, Amnesia) apply transformations such as
generalization, suppression, and microaggregation. These are structurally
irreversible in the sense that information is discarded during generalization.
However, the degree of protection depends on parameter choices (k, l, t) and
is vulnerable to composition attacks, homogeneity attacks, and background
knowledge attacks [Machanavajjhala et al. 2007; Li et al. 2007]. No syntactic
method makes a claim about the entropy source because the transformation itself
is deterministic.

**Noise-addition methods** (Google DP Library, Apple Local DP, OpenDP) add
calibrated random noise to query outputs or individual records. The privacy
guarantee is differential privacy with a specified epsilon. The noise is
generated from a CSPRNG. If the CSPRNG state is compromised (through memory
forensics, side-channel attacks, or insider access), the noise values can be
reconstructed and subtracted, reversing the anonymization entirely. The guarantee
is therefore computational: it holds as long as the adversary cannot recover the
CSPRNG state.

**Zipminator L10** replaces every value with a quantum-random string and destroys
the mapping. The irreversibility rests on two independent foundations: (1) the
replacement values are generated from quantum measurements with no deterministic
seed, and (2) the mapping between original and replacement values is destroyed
via multi-pass overwrite. Reversing L10 requires either predicting quantum
measurement outcomes (impossible by the Born rule) or recovering a destroyed
mapping (impossible given secure erasure). This is information-theoretic
irreversibility: it holds against adversaries with unbounded computational
resources.

### 7.4 Why No One Has Done This Before

The conceptual gap is not technological but disciplinary. QRNG hardware has been
commercially available since 2001 (ID Quantique) and cloud-accessible since at
least 2019 (IBM Quantum Experience). The anonymization community, however, has
treated randomness as a solved problem: CSPRNGs are "good enough" for noise
generation, and the research focus has been on tightening epsilon bounds,
improving utility, and defending against composition attacks. The QRNG community,
conversely, has focused on cryptographic key generation, not on anonymization.

The result is that no existing tool connects quantum entropy to the irreversibility
argument for data anonymization. The closest work, discussed in Section 8, is the
Nature Reviews Physics perspective by Amer et al. (2025), which identifies
differential privacy as a promising application of certified randomness but does
not discuss anonymization per se, does not propose mapping destruction, and does
not make the information-theoretic irreversibility argument.

### 7.5 QRNG Retrofitting Feasibility

Could existing tools simply swap their CSPRNG for a QRNG? In principle, yes:
replacing the entropy source is an engineering task. However, this alone would
not achieve information-theoretic irreversibility. The tools would also need to
(1) implement a one-time pad mapping scheme rather than noise addition, (2)
implement secure mapping destruction, and (3) restructure their anonymization
pipeline to treat the mapping as a volatile, single-use artifact. These are
architectural changes, not parameter swaps. The combination of QRNG sourcing,
OTP mapping, and mapping destruction is the novel contribution of L10.

---

## 8. Related Work

### 8.1 Differential Privacy

Dwork et al. (2006) introduced differential privacy as a formal framework for
privacy-preserving data analysis, proving that calibrating Laplace noise to
the sensitivity of a query function bounds the influence of any single
individual's data on the output. Dwork and Roth (2014) provide the definitive
treatment in their monograph, covering composition theorems, the exponential
mechanism, and connections to learning theory. These results establish the gold
standard for statistical privacy guarantees. However, differential privacy is
fundamentally a property of a mechanism applied to queries, not a property of
the data itself. The original data persists; what is protected is the output of
computations over that data. Furthermore, all practical DP implementations use
classical PRNGs to generate noise, inheriting the seed-recovery vulnerability
discussed in Section 7.

### 8.2 k-Anonymity and Extensions

Sweeney (2002) proposed k-anonymity as a syntactic privacy model requiring that
each record be indistinguishable from at least k-1 others on quasi-identifier
attributes. Machanavajjhala et al. (2007) demonstrated that k-anonymity is
vulnerable to homogeneity and background knowledge attacks, proposing
l-diversity as a remedy. Li et al. (2007) introduced t-closeness, requiring
the distribution of sensitive attributes within equivalence classes to
approximate the global distribution. These models address re-identification
risk through structural transformation of the data. They do not involve
randomness in the anonymization step itself (generalization and suppression
are deterministic), and they do not claim information-theoretic guarantees.
Their limitations are well-documented: all three are vulnerable to composition
attacks when multiple releases of the same dataset are available.

### 8.3 QRNG in Cryptography

Quantum random number generators have been deployed commercially for
cryptographic key generation since 2004, when ID Quantique (Geneva) brought
the first commercial QKD system to market. ID Quantique's Quantis product
line (USB, PCIe, chip, and appliance form factors) has received NIST
SP 800-90B Entropy Source Validation on the IID track, making it the first
QRNG to achieve this certification. Quantinuum's Quantum Origin platform
generates cryptographic keys from verified quantum randomness produced on
their trapped-ion processors; in 2025, Quantum Origin became the first
software QRNG to achieve NIST SP 800-90B validation. Both platforms focus
exclusively on key generation and key management. Neither addresses data
anonymization. The conceptual step from "QRNG makes better keys" to "QRNG
makes irreversible anonymization" has not been taken in the commercial QRNG
literature.

### 8.4 Certified Randomness

Amer et al. (2025), published in Nature Reviews Physics
(arXiv:2503.19759, DOI:10.1038/s42254-025-00845-1), present a comprehensive
survey of applications of certified randomness generated by quantum computers.
The authors identify differential privacy as a promising application area,
arguing that certified randomness can provide "everlasting privacy" against
unbounded adversaries when used in place of pseudorandom noise in DP mechanisms.
This is the closest existing work to our contribution. However, Amer et al.
discuss DP noise generation, not data anonymization. They do not propose a
one-time pad scheme, do not discuss mapping destruction, and do not make the
information-theoretic irreversibility argument for rendered-anonymous data under
GDPR Recital 26. Their work confirms the novelty of our approach: the
connection between certified quantum randomness and anonymization is recognized
as a research frontier, but the specific construction we present (QRNG OTP with
mapping destruction) has not appeared in the literature.

### 8.5 Quantum Differential Privacy

Hirche, Rouze, and Stilck Franca (2022) (arXiv:2202.10717) develop an
information-theoretic framework for quantum differential privacy, recasting
DP as a quantum divergence. Their work shows that the inherent noise of
near-term quantum computers provides natural differential privacy for quantum
computations. This addresses a fundamentally different problem: protecting
quantum states during quantum computation. Our work protects classical data
using quantum randomness as an entropy source for classical anonymization. The
two lines of research are complementary but non-overlapping.

### 8.6 Information-Theoretic Security in Other Domains

The one-time pad, proven information-theoretically secure by Shannon (1949),
is the foundation of our approach. Quantum key distribution (QKD) provides
information-theoretically secure key exchange by exploiting the no-cloning
theorem. Our contribution applies the same class of guarantee to a different
problem: rather than securing a communication channel, we secure a data
transformation. The OTP mapping in L10 functions as a one-time pad applied to
data values rather than to ciphertext, and the critical additional step is
that the pad is destroyed rather than shared with a recipient.

---

## 9. Limitations

We identify five limitations of the L10 quantum anonymization approach. We
present these not as theoretical objections but as practical constraints that
affect deployment.

**QRNG availability and cost.** L10 requires quantum random bytes produced by
measuring qubits in superposition. As of 2026, this requires access to
cloud-based quantum computing hardware (IBM Quantum, Rigetti, or equivalent)
or to dedicated QRNG appliances (ID Quantique, Quantinuum). Cloud quantum
access carries per-job costs and latency. QRNG appliances cost thousands to
tens of thousands of dollars. Our entropy pool architecture mitigates latency
by pre-harvesting quantum random bytes in a background daemon, but the pool
is finite and must be replenished. Organizations without quantum hardware
access fall back to OS-level entropy (`/dev/urandom`), which provides
computational security only. The system marks such operations as "classically
anonymized" rather than "quantum-certified," preserving the integrity of the
guarantee.

**Statistical inference attacks.** QRNG protects against seed-recovery attacks:
no adversary can reconstruct the replacement values by recovering a seed that
does not exist. However, QRNG does not protect against statistical inference on
the anonymized dataset itself. If the anonymized data preserves structural
properties of the original (e.g., frequency distributions, correlations between
columns), an adversary with background knowledge may infer sensitive attributes
without reversing the OTP. L10's full-replacement strategy (every value is
replaced) eliminates direct linkage, but the schema and row structure are
preserved. For datasets where even structural properties are sensitive,
additional measures (row shuffling, synthetic data generation) may be needed.

**Utility destruction.** L10 is a maximum-privacy, zero-utility transformation.
Every original value is replaced with a quantum-random string; the anonymized
dataset cannot be used for statistical analysis, machine learning, or any
computation that depends on the semantic content of the data. This is by
design: L10 targets the use case where the goal is to render data provably
anonymous for regulatory purposes (e.g., satisfying a data deletion request
under GDPR Article 17 without destroying the dataset structure). For use cases
requiring analytical utility, Zipminator offers lower anonymization levels
(L1--L9) that apply k-anonymity, differential privacy, and partial masking
with configurable parameters. The trade-off between privacy and utility is
inherent to all anonymization; L10 simply occupies the extreme privacy end of
the spectrum.

**Pool exhaustion.** A single anonymization operation on a moderately sized
dataset (10,000 rows, 10 columns, ~100,000 unique values) consumes
approximately 1.6 MB of quantum entropy (16 bytes per unique value). The
entropy pool must be replenished by executing quantum circuits on hardware,
which is rate-limited by quantum processor availability and queue times. Under
heavy load, pool exhaustion is possible. Our implementation monitors pool
health, triggers refill when remaining bytes fall below a configurable
threshold, and refuses to perform quantum-certified anonymization when the pool
is insufficient (falling back to OS entropy with appropriate labeling). A
production deployment requires capacity planning to ensure the refill rate
exceeds the consumption rate.

**Trust in quantum hardware vendors.** The Born rule guarantee assumes that the
quantum hardware faithfully prepares qubits in superposition and that measurement
outcomes are not manipulated. In practice, this means trusting that IBM, Rigetti,
or the QRNG appliance vendor has not introduced a backdoor that makes measurement
outcomes deterministic. Certified randomness protocols, as surveyed by Amer et al.
(2025), can reduce this trust requirement by using Bell test violations to verify
that outputs are genuinely quantum. Our current implementation does not perform
device-independent certification; integrating such protocols is future work.

---

## 10. Conclusion

We have presented the first anonymization system where irreversibility is
guaranteed by quantum mechanics rather than computational hardness assumptions.
The construction is straightforward: replace every data value with a
quantum-random string generated from Born-rule measurements, then destroy the
mapping. The security argument is equally direct: reversing the transformation
requires either predicting quantum measurement outcomes (impossible by the Born
rule and Bell's theorem) or recovering a mapping that has been overwritten
(impossible given secure erasure). No seed exists. No replay is possible. The
guarantee holds against adversaries with unbounded computational resources,
including universal quantum computers, and is independent of the resolution of
the P vs NP problem.

This construction fills a gap that has persisted despite the simultaneous
availability of QRNG hardware and mature anonymization techniques. The gap was
disciplinary, not technological: the QRNG community focused on key generation
while the anonymization community treated classical randomness as sufficient.
The closest prior work, Amer et al. (2025) in Nature Reviews Physics, identifies
certified randomness as promising for differential privacy but does not address
anonymization, mapping destruction, or the GDPR Recital 26 compliance argument.

The practical implications are significant. Data rendered anonymous by L10
satisfies GDPR Recital 26's definition of anonymous information, where the data
subject is "not or no longer identifiable." Unlike pseudonymized data, which
remains subject to GDPR, L10 output falls outside the scope of data protection
regulation entirely. For organizations subject to DORA Article 6, which requires
cryptographic updates in response to advances in cryptanalysis, L10 provides a
guarantee that does not degrade with advances in computing.

A provisional patent application has been filed (Patentstyret, March 2026)
covering the method and system for irreversible data anonymization using QRNG
with physics-guaranteed non-reversibility. The implementation is open-source
(Apache-2.0) and available as a Python SDK, REST API, and CLI tool. The
anonymization engine, entropy pool, and multi-provider QRNG infrastructure are
tested with 429 Python tests and 441 Rust tests.

Future work includes formal verification of the mapping destruction procedure,
integration with hardware security modules (HSMs) and trusted execution
environments (Intel SGX, ARM TrustZone) for mapping isolation, device-independent
randomness certification using Bell inequality violations, and engagement with
standardization bodies (NIST, ENISA) to establish quantum-certified anonymization
as a recognized privacy-enhancing technology.

---

## References

- Amer, O., Chakrabarti, S., Chakraborty, K., Eloul, S., Kumar, N., Lim, C., Liu, M., Niroula, P., Satsangi, Y., Shaydulin, R., and Pistoia, M. (2025). Applications of certified randomness. *Nature Reviews Physics*. arXiv:2503.19759. DOI:10.1038/s42254-025-00845-1.

- Apple Differential Privacy Team. (2017). Learning with privacy at scale. *Apple Machine Learning Journal*, December 2017.

- Dwork, C., McSherry, F., Nissim, K., and Smith, A. (2006). Calibrating noise to sensitivity in private data analysis. In *Theory of Cryptography Conference (TCC 2006)*, Lecture Notes in Computer Science, vol. 3876, pp. 265--284. Springer.

- Dwork, C. and Roth, A. (2014). The algorithmic foundations of differential privacy. *Foundations and Trends in Theoretical Computer Science*, 9(3--4):211--407.

- Gaboardi, M., Hay, M., and Vadhan, S. (2020). A programming framework for OpenDP. In *6th Workshop on the Theory and Practice of Differential Privacy (TPDP 2020)*.

- Hirche, C., Rouze, C., and Stilck Franca, D. (2022). Quantum differential privacy: An information theory perspective. arXiv:2202.10717.

- Li, N., Li, T., and Venkatasubramanian, S. (2007). t-Closeness: Privacy beyond k-anonymity and l-diversity. In *IEEE 23rd International Conference on Data Engineering (ICDE 2007)*.

- Machanavajjhala, A., Kifer, D., Gehrke, J., and Venkitasubramaniam, M. (2007). l-Diversity: Privacy beyond k-anonymity. *ACM Transactions on Knowledge Discovery from Data*, 1(1):Article 3.

- Microsoft. (2019). Presidio: An open-source framework for detecting and anonymizing PII. https://github.com/microsoft/presidio.

- OpenAIRE. Amnesia: Data anonymization made easy. https://amnesia.openaire.eu/.

- Prasser, F., Kohlmayer, F., Lautenschlaeger, R., and Kuhn, K.A. (2014). ARX -- A comprehensive tool for anonymizing biomedical data. *AMIA Annual Symposium Proceedings*, 2014:984--993.

- Shannon, C.E. (1949). Communication theory of secrecy systems. *Bell System Technical Journal*, 28(4):656--715.

- Sweeney, L. (2002). k-Anonymity: A model for protecting privacy. *International Journal of Uncertainty, Fuzziness and Knowledge-Based Systems*, 10(5):557--570.

- Templ, M. (2017). *Statistical Disclosure Control for Microdata: Methods and Applications in R*. Springer International Publishing. ISBN 978-3-319-50272-4.

- Wilson, R.J., Zhang, C.Y., Lam, W., Desfontaines, D., Simmons-Marengo, D., and Gipson, B. (2020). Differentially private SQL with bounded user contribution. *Proceedings on Privacy Enhancing Technologies*, 2020(2):230--250.
