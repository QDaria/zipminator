QDARIA ZIPMINATOR PQC PLATFORM
VALIDATION

Strategic Technology Assessment | Classification: Technical Due Diligence
Version: 2.0 | Research Depth: Comprehensive | Timeline: 2022-Present

EXECUTIVE SUMMARY

1. Hypothesis Validation Verdict

This report presents a comprehensive technical due diligence assessment of QDaria's
Zipminator platform, validating its core three-pillar hypothesis. The analysis concludes that
the hypothesis is SUPPORTED WITH CAVEATS. The strategic selection of NIST-standardized
algorithms and the timing relative to powerful market drivers are strongly supported by
evidence. The integration of a Quantum Random Number Generator (QRNG) is validated as a
significant, high-assurance security enhancement. However, the reliance on the Mojo
programming language for performance differentiation is currently speculative due to a lack
of empirical evidence in cryptographic contexts and represents the most critical technical and
execution risk.

●  Pillar 1: QRNG Integration with NIST PQC Standards

○  Confidence Score: A (HIGH)
○  The value proposition of integrating a hardware QRNG is technically sound and
directly addresses a well-documented class of implementation vulnerabilities
related to randomness in cryptographic systems. Evidence from proof-of-concept
integrations confirms feasibility with negligible performance overhead, and the
commercial availability of certified QRNG hardware provides a clear path for
production and regulatory acceptance.
●  Pillar 2: High-Performance Implementation in Mojo

○  Confidence Score: D (SPECULATIVE)
○  This pillar is unsupported by direct evidence. No benchmarks or published
research exist demonstrating Mojo's suitability for high-performance,
constant-time cryptographic workloads. The claimed performance potential is an
extrapolation based on proxy analysis of other languages and Mojo's marketing
claims. The ability of the Mojo compiler to generate secure,
side-channel-resistant code for complex operations like the Number Theoretic
Transform (NTT) remains unproven and is a significant risk.

●  Pillar 3: Quantum Threat Landscape & Market Context

○  Confidence Score: A (HIGH)
○  The selection of CRYSTALS-Kyber (ML-KEM) and CRYSTALS-Dilithium (ML-DSA) is
unequivocally validated by their finalization as FIPS 203 and FIPS 204 by NIST and
their inclusion in the NSA's CNSA 2.0 suite. The market opportunity is driven not
by an imminent quantum threat but by powerful, time-sensitive regulatory and
compliance mandates that create a clear and urgent demand for solutions built
on these specific algorithms.

2. Strategic Implications

●  Primary Value Driver: QDaria's most immediate and defensible value proposition is its
perfect alignment with powerful regulatory tailwinds. The finalization of NIST PQC
standards and the aggressive migration timelines set by the NSA's CNSA 2.0 mandate
create a well-defined, compliance-driven market for which Zipminator's core algorithms
are an exact fit.

●  Critical Risk—The Mojo Dependency: The platform's reliance on the Mojo language

presents a double-edged sword. If successful, it could yield a significant and defensible
performance differentiator. However, the language's immaturity, the absence of a
secure cryptographic ecosystem, and the unproven ability of its compiler to generate
constant-time code represent a critical-path risk that could delay or derail the entire
product roadmap. Security, not just speed, is the paramount concern.

●  Quantifiable Differentiator—The QRNG: The integration of a hardware QRNG is a
tangible, certifiable security enhancement. It provides a concrete defense against a
known class of side-channel and fault-injection attacks that exploit weaknesses in
randomness. This feature offers a clear, marketable point of differentiation against pure
software-based PQC libraries, particularly in high-assurance markets.

●  Recommended Strategic Pivot: The technology roadmap must be de-risked. It is

strongly recommended that QDaria establish a parallel implementation track using a
mature, high-performance language with a proven cryptographic ecosystem (e.g., Rust
or C++ with AVX2 optimizations). This track would serve as a performance baseline, a
security reference, and a commercial fallback. The Mojo implementation should be
re-classified as a high-risk, high-reward research and development effort rather than
the sole pillar of the go-to-market strategy.

3. Key Metrics Dashboard

Metric
QRNG Security Advantage  Mitigates fault and

Finding

Confidence
A (HIGH)

side-channel attacks exploiting
weak randomness. PoC
integration shows negligible
latency overhead ($<10^{-5}$)
within a TLS handshake.1

Mojo Performance Potential  Extrapolated Projection: Aims

D (SPECULATIVE)

Quantum Threat Timeline

Competitive Gap

for parity with C++/AVX2,
potentially 5-7x faster than
reference C. Kyber-768 target:
$\approx 0.034$ ms total.2
Breaking Kyber-512 (NIST Level
1) requires quantum gate costs
estimated at $\approx
2^{147}$, far exceeding current
capabilities. Market driver is
compliance, not imminent
threat.3
No single commercial entity
currently offers an integrated
PQC (Kyber/Dilithium) +
Hardware QRNG +
High-Performance Language
platform.

A (HIGH)

B (MEDIUM)

SECTION 1: QRNG INTEGRATION VALUE
PROPOSITION

1.1 Entropy Requirements for NIST PQC Standards

The foundation of QDaria's first pillar rests on the specific requirements for randomness
within the newly standardized post-quantum algorithms. The National Institute of Standards
and Technology (NIST) finalized the standards for CRYSTALS-Kyber and CRYSTALS-Dilithium
in August 2024, designating them as FIPS 203 (ML-KEM) and FIPS 204 (ML-DSA),
respectively.4 These documents form the definitive specifications for quantum-resistant key
encapsulation and digital signatures for U.S. government use.
Both ML-KEM and ML-DSA rely fundamentally on the generation of random bytes for their
security. These random bytes are used during key generation to create secret key material,
during encapsulation to generate ephemeral secrets, and during signing to produce unique,

unpredictable nonces. For instance, the FIPS 204 standard for ML-DSA specifies a "hedged"
signing procedure which internally uses a 256-bit random string, rnd. The standard mandates
that this value "should be generated by an Approved Random Bit Generator (RBG)".6 This
requirement establishes a clear, compliance-driven need for a high-quality entropy source in
any FIPS-validated implementation.
However, the standards define this requirement functionally rather than qualitatively. They
mandate the use of an approved source, such as one compliant with NIST Special Publication
800-90, but do not explicitly differentiate between the statistical properties of a top-tier
classical True Random Number Generator (TRNG) and a Quantum Random Number Generator
(QRNG). Both types of devices can achieve the necessary certifications.7 This creates a subtle
but important distinction between baseline compliance and higher-assurance security. From a
strict compliance-auditing perspective, a certified classical TRNG is sufficient. Therefore, the
value proposition of a QRNG is not about meeting a standard that competitors cannot, but
about addressing a more sophisticated threat model that goes beyond the letter of the FIPS
documents. The argument for a QRNG hinges on providing a measurably higher quality of
randomness that hardens the implementation against attacks that exploit the physical and
statistical nature of the entropy source itself.

1.2 Security Advantages of QRNG vs. Classical Sources

The security advantage of integrating a QRNG is twofold, comprising a theoretical argument
based on the nature of quantum physics and a practical argument rooted in mitigating a
well-established class of implementation vulnerabilities.
Theoretically, QRNGs derive their randomness from intrinsically unpredictable quantum
phenomena, such as the behavior of photons.8 This provides an information-theoretic basis
for the unpredictability of the entropy source. In contrast, classical TRNGs rely on complex but
ultimately deterministic physical processes, while Pseudorandom Number Generators
(PRNGs) are entirely algorithmic. A QRNG offers "true randomness" that is fundamentally
non-reproducible and unbiased.1
The practical advantage is more direct and compelling. The history of cryptanalysis is replete
with examples where the mathematical security of an algorithm was undermined by
weaknesses in its implementation, particularly in the generation of random numbers. Research
has demonstrated that lattice-based attacks can successfully recover private keys from
Elliptic Curve Digital Signature Algorithm (ECDSA) implementations that used biased or
predictable nonces.9 These attacks, which have been used to compromise hundreds of
cryptocurrency wallets, establish a critical precedent: insufficient entropy is a proven,
practical attack vector against deployed public-key cryptography.
This threat directly translates to the PQC landscape. A significant body of research confirms
that new PQC schemes, while mathematically resistant to quantum attacks, remain vulnerable
to physical implementation attacks, such as side-channel analysis (SCA) and fault attacks.10
These attacks exploit physical leakages like power consumption, timing variations, or

electromagnetic emissions to deduce secret key material. A predictable or biased random
number generator can be a crucial enabler for such attacks. For example, research on
deterministic lattice signatures shows that a single, well-timed fault injection can induce a
nonce-reuse scenario, leading to full key recovery.13
By integrating a QRNG, the Zipminator platform aims to eliminate this entire class of
vulnerabilities at their source. A QRNG provides the highest possible quality of entropy,
making it significantly harder for an attacker to predict secret values or exploit statistical
weaknesses in the random numbers used for key generation, masking, or nonce creation. This
represents a form of defense-in-depth. In the nascent and rapidly evolving field of PQC
implementation security, where new side-channel vulnerabilities are continuously being
discovered 14, guaranteeing the integrity of the entropy source is a foundational architectural
principle. It serves as a strategic hedge, hardening the platform not only against known
randomness-based attacks but also against future, yet-to-be-discovered vulnerabilities that
might exploit subtle statistical deviations in classical RNGs.

1.3 Implementation Evidence & Case Studies

The viability of integrating a QRNG into a PQC software stack is supported by recent
experimental evidence. A proof-of-concept developed by researchers in the QSNP
consortium, in collaboration with Nestlé, successfully integrated a hardware QRNG into a
hybrid PQC protocol for Transport Layer Security (TLS).1 This experiment utilized standard
open-source cryptographic libraries, OpenSSL and the Open Quantum Safe (OQS) project's
liboqs, demonstrating a clear and feasible integration path with the existing software
ecosystem.
Crucially, this study also quantified the performance impact. The integration, which used an
Entropy-as-a-Service (EaaS) model, showed that the QRNG itself added a negligible latency
overhead of less than $10^{-5}$ to the TLS handshake. The total latency increase observed,
under 30%, was primarily attributed to the larger key and signature sizes inherent to the PQC
algorithms, not the process of sourcing entropy from the QRNG.1 This provides strong
evidence that integrating a QRNG is not a performance bottleneck and is practical for
real-world, latency-sensitive applications.
The feasibility of this pillar is further bolstered by a mature commercial market for QRNG
hardware. The table below summarizes the specifications for commercially available QRNGs
from a leading vendor, ID Quantique, demonstrating their readiness for integration into various
platforms.
Table 1: Commercial QRNG Hardware Specification Comparison
Product/Model  Form Factor
Vendor

Throughput

ID Quantique
ID Quantique

Quantis IDQ250C2 Chip
Quantis IDQ6MC1  Chip

250 Kbps
6 Mbps

Key
Certifications
NIST SP 800-90B
NIST SP 800-90B,
AEC-Q100

ID Quantique

ID Quantique

ID Quantique

Quantis
IDQ20MC1
Quantis QRNG
USB
Quantis QRNG
PCIe

Chip

20 Mbps

USB Device

4 Mbps

NIST SP 800-90B,
BSI AIS 31
METAS, CTL

PCIe Card

40 Mbps / 240
Mbps

METAS, CTL, BSI
AIS 31

Source: Synthesized from 7
As shown, QRNGs are available in a range of form factors, from miniaturized chips suitable for
IoT and edge devices to high-throughput PCIe cards for servers. Their throughput rates,
ranging from kilobits to hundreds of megabits per second, are more than sufficient to meet
the entropy demands of PQC key generation. Most importantly, these products have achieved
the stringent certifications required for use in cryptographic modules, including NIST SP
800-90B and the German BSI's AIS 31 standard, up to the highest PTG.3 level.7 This
pre-existing certification landscape significantly de-risks the regulatory and compliance
pathway for a product like Zipminator.

1.4 Risk Assessment

The primary risks associated with the QRNG pillar are commercial and logistical rather than
technical. The inclusion of a dedicated hardware component will invariably increase the bill of
materials (BOM) cost and introduce supply chain dependencies. For cost-sensitive markets,
this could be a disadvantage compared to pure software solutions. However, for QDaria's
likely target markets—high-assurance sectors such as government, defense, and critical
finance—the enhanced security posture and marketing value of "true quantum randomness"
may justify the additional cost.
The risk of hardware failure is mitigated by features built into certified commercial QRNGs.
Leading products include real-time health checks that continuously monitor the quantum
entropy source to detect failures or potential tampering, ensuring the integrity of the output.16
Therefore, with a robust supply chain strategy and a focus on appropriate market segments,
the risks associated with this pillar are manageable.

SECTION 2: MOJO PERFORMANCE POTENTIAL

2.1 Lattice-Based PQC Computational Bottlenecks

To assess the potential performance advantage of an implementation in Mojo, it is first

necessary to identify the precise computational bottlenecks within the target algorithms,
CRYSTALS-Kyber and CRYSTALS-Dilithium. Analysis and profiling studies of existing
implementations reveal that the performance of these schemes is dominated by a few key
operations centered around polynomial arithmetic over finite fields.
For CRYSTALS-Kyber (ML-KEM), the computational workload is heavily concentrated in
polynomial multiplication and the transformations required to perform it efficiently. Profiling
studies indicate the following approximate breakdown of execution time for core operations:

●  Polynomial Multiplication (Poly_Mul): $\approx 40\%$
●  Number Theoretic Transform (NTT): $\approx 30\%$
●

Inverse NTT (INTT): $\approx 30\%$ 17

The NTT is a variant of the Fast Fourier Transform (FFT) adapted for polynomial rings, which
reduces the complexity of polynomial multiplication from $O(n^2)$ to $O(n \log n)$.18
However, the NTT itself is a complex algorithm involving recursive "butterfly" operations with
intricate memory access patterns, making it a prime target for optimization.20 Additionally, the
process of sampling polynomial coefficients from a uniform or binomial distribution is a
significant bottleneck, particularly in resource-constrained environments. This sampling often
relies on rejection sampling from the output of a hash function like SHAKE-128, which can be
inefficient in terms of latency and the number of random bytes required.21
For CRYSTALS-Dilithium (ML-DSA), the bottlenecks are analogous. The core signing
operation involves matrix-vector multiplication of polynomials, which is heavily reliant on the
NTT for performance. The key bottlenecks are:

●  Matrix-Vector Multiplication: This is the most expensive part of the signing process
and is accelerated using the NTT. However, it still requires numerous forward and
inverse NTTs, making the efficiency of the NTT implementation paramount.18

●  Polynomial Sampling: Similar to Kyber, Dilithium requires sampling large matrices and
vectors of polynomials from the output of SHAKE, which can be a latency bottleneck.18
●  Signature Rejection: The Fiat-Shamir with Aborts paradigm used in Dilithium means

that a signature attempt may be rejected if it falls outside certain statistical bounds, to
avoid leaking information about the secret key. The entire signing process must then be
repeated with a new nonce. Depending on the security level, this occurs on average 4 to
5 times per signature, directly multiplying the computational cost of the signing
operation.18

The nature of these bottlenecks indicates that performance is not merely a function of raw
floating-point operations. Instead, it is deeply tied to integer arithmetic, modular reductions,
and memory efficiency—specifically, the ability to manage cache hierarchies and memory
bandwidth during the complex data permutations of the NTT. Any high-performance
implementation must excel in these specific areas.

2.2 Performance Benchmarking Analysis

A critical finding of this assessment is the complete absence of direct, empirical evidence for

Mojo's performance in cryptographic contexts. Available literature on Mojo focuses on its
speed advantages over Python in general scientific computing (e.g., N-body simulations) or
its application in Large Language Model (LLM) frameworks.23 These benchmarks are irrelevant
to the specific challenges of constant-time, integer-based cryptographic computation.
Therefore, to establish a performance envelope for Zipminator, a proxy analysis based on
existing high-performance implementations in other languages is necessary. This analysis
sets a clear, quantitative target that any Mojo implementation must meet or exceed to validate
its claims of superiority.
Proxy 1: C++ with AVX2 Optimizations (The Performance Gold Standard)
Vectorized implementations using Advanced Vector Extensions (AVX2) on modern x86-64
CPUs represent the current state-of-the-art for high-performance PQC software. A
comprehensive benchmarking study provides the following concrete performance metrics,
which serve as the primary baseline for this assessment.
Table 2: Performance Benchmarks: Kyber & Dilithium (Reference C vs. AVX2 C++)
Algorithm
Kyber-512

Reference (ms)  AVX2 (ms)

Operation
Key Generation  0.035
0.040
Encapsulation
Decapsulation
0.052
Key Generation  0.058
0.063
Encapsulation
Decapsulation
0.080
Key Generation  0.089
Encapsulation
0.092
0.113
Decapsulation
Key Generation  0.094
Signing
0.445
0.104
Verification
Key Generation  0.167
0.665
Signing
0.160
Verification
Key Generation  0.253
0.840
Signing
0.267
Verification

Kyber-768

Kyber-1024

Dilithium-2

Dilithium-3

Dilithium-5

0.007
0.007
0.008
0.011
0.011
0.012
0.015
0.015
0.017
0.026
0.077
0.028
0.045
0.120
0.045
0.070
0.144
0.071

AVX2 Speedup
5.00x
5.71x
6.50x
5.27x
5.73x
6.67x
5.93x
6.13x
6.65x
3.62x
5.78x
3.71x
3.71x
5.54x
3.56x
3.61x
5.83x
3.76x

Source: 2
This data demonstrates that AVX2 optimizations yield a substantial 5-7x speedup for Kyber
and 4-6x speedup for Dilithium over their reference C implementations. For Kyber-768 (NIST
Level 3), the total time for a key exchange is reduced to just 0.034 ms. This is the concrete
performance target Zipminator must aim for.
Proxy 2: Rust
The Rust ecosystem has several PQC libraries supporting Kyber and Dilithium, and is

increasingly seen as a strong candidate for writing secure and performant systems code.25
Studies evaluating PQC in TLS have found that combinations like Dilithium2-Kyber512
implemented in Rust offer "rather good performance" in practice.27 Rust's key advantage is its
compile-time memory and thread safety guarantees, which can prevent entire classes of bugs
common in C/C++ cryptographic code.
Projected Mojo Performance Envelope
Based on Mojo's stated goals of combining Python's usability with C's performance and
providing direct access to hardware features like SIMD, it is plausible that a highly optimized
Mojo implementation could achieve performance comparable to the C++/AVX2 baseline.
However, this remains a purely speculative projection (Confidence D) until supported by
empirical benchmarks on cryptographic workloads.

2.3 Hardware Acceleration Feasibility

While QDaria's focus is on a software implementation, the potential for hardware acceleration
is relevant context. GPU-based implementations demonstrate massive throughput
improvements for batch processing, achieving speedups of over 100x compared to
single-threaded CPU execution.19 This is ideal for server-side applications handling many
concurrent connections. FPGAs also offer a path to acceleration, with vendors like Lattice
Semiconductor now offering "PQC-ready" devices with built-in crypto-agility to support
algorithm updates.29
Mojo claims to have features for GPU integration. If these claims are valid, Mojo could
potentially provide a more accessible path to GPU acceleration than low-level CUDA
programming. However, this again runs into the critical challenge of ensuring security.

2.4 Constant-Time Implementation Challenges

The single greatest risk to the Mojo pillar is not its performance, but its ability to guarantee
constant-time execution. This is a non-negotiable security requirement for cryptography.
Side-channel attacks exploit data-dependent variations in the execution time or memory
access patterns of an algorithm to leak secret information. To prevent this, cryptographic
code must be written such that its execution path and timing are independent of any secret
values it processes.
Achieving this is notoriously difficult, even in mature languages like C and Assembly, where
cryptographers have decades of experience. High-performance features are often the
primary source of timing leakages:

●  Compiler Optimizations: A compiler, in its attempt to generate the fastest possible
code, may introduce secret-dependent branches or look-up tables that create
side-channels.

●  Variable-Time Instructions: Certain CPU instructions, such as integer division (div),

can have execution times that vary based on the values of their operands. If these
operands are secret, they create a direct timing channel.15

●  Cache Timing: The time it takes to access memory depends on whether the data is in
the CPU cache. If memory access patterns depend on secret data, this creates a
cache-timing side-channel.

The Mojo language and its compiler are, from a security perspective, a black box. There is no
body of research or documentation confirming that the Mojo compiler can be reliably
instructed to produce constant-time machine code for complex algorithms like the NTT. The
language's goal of providing seamless interoperability with the vast Python ecosystem is, from
this perspective, a significant liability. Any call from a secure Mojo module into a standard
Python library (e.g., for arbitrary-precision arithmetic) would inherit that library's side-channel
vulnerabilities. To be secure, the entire cryptographic core of Zipminator would need to be
written in a "pure," verifiable subset of Mojo, effectively negating the ecosystem advantage
and requiring the development of a new, secure cryptographic library from scratch in an
unproven language.

2.5 Critical Gaps & Research Needs

The validation of the Mojo pillar is blocked by a critical evidence gap. There are no publicly
available benchmarks, security analyses, or case studies of Mojo being used for any
constant-time cryptographic application. The claims of high performance are generic and
have not been tested against the specific, complex bottlenecks of lattice cryptography. The
security properties of the code generated by the Mojo compiler are completely unknown. Until
QDaria can produce an implementation and subject it to rigorous, third-party performance
benchmarking and side-channel analysis against the C++/AVX2 baseline, this pillar of their
hypothesis must be considered speculative and high-risk.

SECTION 3: QUANTUM THREAT & MARKET TIMING

3.1 Quantum Attack Resource Requirements

The strategic context for PQC adoption is framed by the long-term threat of a
Cryptographically Relevant Quantum Computer (CRQC). However, a sober analysis of the
resources required to break the specific algorithms chosen by QDaria indicates that this
threat is not imminent, and the primary market driver is regulatory action in anticipation of this
future threat.
CRYSTALS-Kyber (ML-KEM):
NIST's own security analysis, current as of December 2023, provides the most authoritative

estimates for breaking Kyber. For Kyber-512, which corresponds to NIST Security Level 1
(equivalent to AES-128), the best-known classical attacks are considered more relevant than
quantum attacks. The estimated quantum gate cost for a known attack on Kyber-512 is
approximately $2^{147}$.3 This is significantly higher than the $2^{128}$ operations required
to break AES-256 via Grover's algorithm, and well above the $2^{64}$ operations needed for
AES-128.31 This indicates that even the lowest security level of Kyber is robust against known
quantum algorithms. Higher security levels (Kyber-768 and Kyber-1024) offer even greater
security margins. While research into quantum circuits for Kyber's components, like the NTT, is
ongoing, it is in a preliminary stage focused on resource estimation rather than demonstrating
a practical attack.32
CRYSTALS-Dilithium (ML-DSA):
The security of Dilithium is based on the Module Learning With Errors (MLWE) and Module
Short Integer Solution (MSIS) problems.33 These are well-studied lattice problems for which
no efficient quantum solution is known. While specific qubit and gate count estimates for
Dilithium are less detailed in the available literature, its security is categorized by NIST into the
same levels as Kyber (Levels 2, 3, and 5, corresponding to ~128-bit, ~192-bit, and ~256-bit
quantum security), implying a similar level of resilience.34
The analysis of these resource requirements leads to a crucial strategic conclusion: the
market for PQC is not being driven by an immediate technical reality where existing encryption
is actively being broken. Instead, the "quantum threat" serves as the narrative that underpins
a powerful, compliance-driven market. Government agencies and standards bodies are not
waiting for a CRQC to exist; they are acting now to mitigate a future risk. This creates a market
dynamic where the opportunity is decoupled from the technical timeline of quantum hardware
development. QDaria's success, therefore, depends on its ability to meet the immediate,
tangible demand for PQC-compliant products generated by these regulatory actions, not on
the actual arrival of a CRQC.

3.2 Quantum Computing Progress Indicators

Current state-of-the-art quantum computers have demonstrated logical qubit counts in the
dozens, with IBM reporting a 48-logical-qubit device.35 While this represents significant
scientific progress, it remains orders of magnitude below the millions of physical qubits
estimated to be required to break algorithms like RSA-2048.36 Roadmaps from major players
like IBM and Google project continued progress, but estimates for the arrival of a CRQC still
vary widely, often placing it in the 2030s or beyond. This long-term horizon reinforces the
conclusion that near-term market demand for PQC is a matter of policy and risk management,
not immediate operational necessity.

3.3 QRNG Hardware Capabilities

As established in Section 1.3, the hardware required for the QRNG pillar of Zipminator's
platform is mature, commercially available, and certified. A robust ecosystem of vendors, led
by companies like ID Quantique, provides QRNGs in various form factors with sufficient
throughput and the necessary regulatory approvals (e.g., NIST SP 800-90B, BSI AIS 31) to be
integrated into cryptographic products.7 The existence of this ecosystem de-risks the
hardware component of QDaria's strategy, confirming its feasibility.

3.4 Regulatory & Market Drivers

The most powerful force shaping the PQC market is a set of concrete regulatory mandates
and timelines from the U.S. government. These actions have transformed the PQC transition
from a theoretical exercise into a time-sensitive business imperative for a large ecosystem of
organizations.
NIST PQC Standardization and Migration Roadmap:
NIST's multi-year PQC standardization process culminated in the August 2024 publication of
the first three final standards: FIPS 203 (ML-KEM/Kyber), FIPS 204 (ML-DSA/Dilithium), and
FIPS 205 (SLH-DSA/SPHINCS+).37 This event serves as the official starting signal for the
migration. Following the mandate in National Security Memorandum 10 (NSM-10), NIST is now
developing official transition guidelines and timelines for the deprecation of vulnerable
public-key algorithms.37 While the full transition across all industries is expected to take a
decade or more, the publication of the standards creates immediate demand for compliant
products and libraries.38
CNSA 2.0: The "Kingmaker" Mandate:
The Commercial National Security Algorithm Suite 2.0, published by the National Security
Agency (NSA), is the single most significant market driver for QDaria's chosen technology
stack. CNSA 2.0 explicitly specifies the algorithms required to protect U.S. National Security
Systems (NSS). The suite includes:

●  Key Establishment: ML-KEM-1024 (CRYSTALS-Kyber)
●  Digital Signatures: ML-DSA-87 (CRYSTALS-Dilithium)
●  Symmetric Encryption: AES-256
●  Hashing: SHA-384/512 39

This selection effectively acts as a "kingmaker," creating a massive, well-funded, and
non-negotiable market for products implementing Kyber and Dilithium. The entire ecosystem
of government agencies, the defense industrial base, and critical infrastructure providers that
interact with NSS will be required to adopt these specific algorithms. The NSA has published a
clear and aggressive migration timeline, as summarized in the table below.
Table 3: CNSA 2.0 Migration Timeline
Date
Now

NSA Mandate / Milestone
Early deployment of CNSA 2.0 algorithms is
encouraged as validated products become
available.

Dec 31, 2025

Jan 1, 2027

Dec 31, 2030

Dec 31, 2031

By 2035

No enforcement of CNSA 2.0 transition before
this date.
All new acquisitions for National Security
Systems must be CNSA 2.0 compliant.
All fielded equipment and services that
cannot support CNSA 2.0 must be phased out.
Full enforcement: All cryptographic
implementations in NSS must use CNSA 2.0
algorithms.
All National Security Systems must be fully
quantum-resistant per NSM-10.

Source: Synthesized from 39
This timeline creates a powerful, predictable wave of demand. Furthermore, the NSA's
guidance for NSS explicitly discourages the use of non-standardized or hybrid solutions for
security purposes, preferring pure implementations of the CNSA 2.0 suite.40 This gives a
platform like Zipminator, which is built on the core CNSA 2.0 algorithms, a distinct advantage
over hybrid approaches in this target market. QDaria's choice of algorithms is therefore not
merely technically sound, but commercially astute, granting them a direct product-market fit
with one of the most valuable and urgent early-adopter segments for post-quantum
cryptography.

SECTION 4: COMPETITIVE POSITIONING & STRATEGIC
RECOMMENDATIONS

4.1 Competitive Landscape Map

The competitive landscape for the Zipminator platform is fragmented, with no single
commercial entity currently offering a directly comparable, fully integrated solution. The
competition consists primarily of component providers and open-source projects, which
potential customers would need to assemble themselves. This fragmentation represents
QDaria's primary market opportunity.
Category A: PQC Implementation Platforms
This category is dominated by open-source libraries that provide implementations of the NIST
PQC algorithms.

●  Open Quantum Safe (OQS) Project: As the leading open-source C library for PQC,

liboqs is a foundational project in the ecosystem.41 It provides a wide array of

algorithms, including Kyber and Dilithium, and is used extensively for research and
prototyping.41 However, the OQS project explicitly warns against using its software in
production environments, as it has not undergone the rigorous auditing required for
high-assurance systems.42 It functions more as a community enabler and a source of
reference code than a direct competitor to a hardened commercial product.

●  Bouncy Castle: A mature and widely used cryptographic library for Java and C#. It has
integrated support for the NIST-standardized PQC algorithms, including Kyber and
Dilithium.43 For organizations operating within the Java/C# ecosystem, Bouncy Castle
represents a strong and credible competitor for the software algorithm pillar.

Category B: QRNG Vendors with Cryptographic Integration

●

ID Quantique (IDQ): As the market leader in QRNG hardware, IDQ is a key player.16
They offer a range of certified hardware and promote quantum-safe solutions, but their
focus appears to be on providing the entropy source as a component and on Quantum
Key Distribution (QKD) systems, rather than offering an integrated PQC software
platform like Zipminator.16 IDQ is best viewed as a potential component supplier and
strategic partner, but also a potential future competitor should they decide to move up
the software stack.

Category C: High-Performance Cryptography Languages/Frameworks
This category is not composed of commercial competitors but represents the performance
benchmarks Zipminator must surpass. It includes highly optimized C/C++ libraries utilizing
AVX2/AVX-512 vector instructions (often the official NIST submission packages) and the
burgeoning Rust cryptography ecosystem, which prioritizes both performance and memory
safety.2
The following matrix summarizes the competitive positioning.
Table 4: Competitive Feature Matrix: Zipminator vs. Alternatives
Feature / Pillar  QDaria

Bouncy Castle

Open Quantum
Safe (liboqs)
Yes, broad
support

Yes, in Java/C#

"DIY" (liboqs +
IDQ)
Yes, via liboqs

System PRNG /
Pluggable

System PRNG

Hardware QRNG
(manual
integration)
C

Mojo (unproven)  C (reference)

Java / C#

PQC Algorithm
Support

Entropy Source

Zipminator
Kyber (FIPS 203),
Dilithium (FIPS
204)
Integrated
Hardware QRNG

Implementation
Language
Performance
Target
Constant-Time
Guarantees
Commercial
Support
Integration Level Fully integrated

Exceeds AVX2
C++
Unknown /
High-Risk
Yes (planned)

Standard Java/C#  Reference C

Best-effort

User responsibility

Research/Prototyp
ing
Best-effort, not
audited
Community

Yes

Library

Library

None (component
support only)
Component-level

platform

This analysis reveals a clear "white space" in the market. No competitor offers a single,
commercially supported, high-assurance platform that integrates certified hardware
randomness with a high-performance PQC software stack. Customers seeking this level of
security and performance today would be forced into a complex and risky do-it-yourself (DIY)
integration project. This is QDaria's "integration moat" and its most powerful value
proposition.

4.2 Differentiation Assessment

Unique Value Proposition: The unique value of Zipminator lies in the promised synergy of its
three pillars. It is not just selling quantum-resistant algorithms; it is selling a holistic,
high-assurance implementation of those algorithms. The platform's promise is to deliver
NIST-standardized cryptography, seeded with the highest possible quality of entropy, and
executed with best-in-class performance.
Defensibility: The platform's defensibility varies by pillar. The choice of algorithms is not
defensible, as they are public standards. The reliance on Mojo is currently a weak point; until
proven, it is more of a liability than a moat. The integration of a QRNG provides a more durable
differentiator, as it requires hardware and systems engineering expertise. The strongest
defensibility will ultimately come from the accumulated engineering effort in performance
tuning, security hardening, and achieving formal certifications (like FIPS 140-3) for the entire
integrated platform.
Market Positioning: Based on the analysis of market drivers and competitive gaps, the ideal
initial market for Zipminator is the high-assurance sector. This includes:

●  U.S. National Security Systems (NSS) and the surrounding defense industrial base,

driven by the CNSA 2.0 mandate.

●  Critical infrastructure operators (energy, finance, telecommunications).
●  Other government agencies with long-term data confidentiality requirements.

These customers are most likely to value the enhanced security promise of the hardware
QRNG, are less sensitive to the added BOM cost, and are driven by urgent compliance
deadlines.

4.3 Strategic Recommendations (Prioritized)

Based on the evidence and analysis presented, the following strategic actions are
recommended to maximize the probability of QDaria's success and mitigate critical risks.

●  HIGH PRIORITY: De-risk the Mojo Pillar. The dependency on an unproven language

for the core product is the single greatest threat to the venture. QDaria should
immediately resource a parallel development track using a mature, performant language

with a robust cryptographic ecosystem, such as Rust or C++ with AVX2. This track will
serve multiple critical functions:

1.  It provides a reliable, low-risk path to a Minimum Viable Product (MVP).
2.  It creates an internal performance and security baseline against which the Mojo

implementation can be objectively measured.

3.  It serves as a commercial fallback should the Mojo implementation fail to meet its

performance or security targets in a timely manner.

●  HIGH PRIORITY: Focus Go-to-Market Strategy on CNSA 2.0. The CNSA 2.0 mandate
has created a time-sensitive, well-defined, and well-funded market for products based
on Kyber and Dilithium. All product development, marketing, and sales efforts should be
laser-focused on meeting the specific requirements of this market. This includes
pursuing FIPS 140-3 validation and engaging with early adopters in the U.S. defense and
intelligence communities.

●  HIGH PRIORITY: Conduct Rigorous Internal Benchmarking. The core performance

hypothesis for Mojo must be validated or invalidated as quickly as possible. QDaria must
conduct internal, apples-to-apples benchmarks of its Mojo implementation of Kyber
and Dilithium against the AVX2-optimized C++ reference implementations. These tests
must measure performance in cycles-per-operation and, critically, must be
accompanied by side-channel analysis (e.g., using tools like dudect) to test for
constant-time properties.

●  MEDIUM PRIORITY: Formalize Security Audits and Partnerships. Once a stable

prototype exists, QDaria should engage a reputable third-party security firm to conduct
a formal audit of the implementation, with a specific focus on side-channel
vulnerabilities in the Mojo-generated code. Concurrently, the company should solidify
its supply chain by formalizing a partnership with a leading QRNG vendor, such as ID
Quantique, to ensure supply and explore co-marketing opportunities.

●  LOW PRIORITY/WATCH: Defer Broader Commercial Push. Efforts to penetrate

broader, more price-sensitive commercial markets should be deferred until the core
technology is proven and a strong foothold has been established in the high-assurance
sector. The unique value proposition of the integrated QRNG is strongest in markets
where security assurance outweighs cost considerations.

4.4 Risk Mitigation

●  Technical Risks: The primary technical risk is the failure of the Mojo implementation to

deliver on its performance and security promises. The recommended parallel
development track is the primary mitigation for this risk.

●  Market Timing Risks: The market is driven by regulatory timelines. Delays in product
development could cause QDaria to miss the critical procurement window opening in
the 2025-2027 timeframe. The parallel development track also helps mitigate this by
providing a faster path to an MVP.

●  Competitive Response: A potential competitive risk is that a larger player (e.g., a major

cloud provider or a hardware security module vendor) could partner with a QRNG
company to offer a similar integrated solution. QDaria's mitigation is speed and
focus—by targeting the CNSA 2.0 market now, it can establish itself as the incumbent
specialist before larger, slower-moving competitors can react.

SECTION 5: RESEARCH GAPS & FUTURE
INVESTIGATION

5.1 Unanswered Questions

This investigation has revealed several critical areas where evidence is lacking, requiring
further internal research and validation by QDaria.

●  Mojo's Constant-Time Guarantees: This remains the most significant unknown. Does
the Mojo language and its compiler toolchain provide the necessary low-level control
and primitives to reliably generate constant-time machine code? Can it prevent the
introduction of secret-dependent branches, variable-time instructions, or insecure
memory access patterns during optimization? Without a positive answer, Mojo cannot
be considered a secure language for cryptography.

●  Quantifiable Security Gain of QRNG: While the theoretical and qualitative benefits of
a QRNG are clear, there is a gap in research providing a hard, quantitative measure of its
security improvement over a state-of-the-art classical TRNG (e.g., one compliant with
NIST SP 800-90B) in the context of PQC. Quantifying the reduction in attack success
rate or the increase in the number of traces required for a successful side-channel
attack would provide a powerful metric.

●  Real-World Performance in Diverse Protocols: The proof-of-concept showing low
overhead for QRNG integration in TLS is promising.1 However, performance data is
needed for the full Zipminator platform across a wider range of protocols, such as
IPSec, SSH, and secure boot processes, each of which has different latency and
throughput characteristics.

5.2 Recommended Experimental Validation

To address these gaps and de-risk the technical roadmap, QDaria should prioritize the
following internal experimental validation efforts:

●  Head-to-Head Performance and Security Benchmark:

1.  Implement CRYSTALS-Kyber (specifically Kyber-768) in three languages: Mojo,

C++ with AVX2 intrinsics, and Rust.

2.  Execute all three implementations on the same, consistent hardware platform.
3.  Measure performance in clock cycles per operation for KeyGen, Encaps, and

Decaps. This provides a direct, hardware-independent comparison.

4.  Perform non-profiled timing side-channel analysis on the core computational
loops (especially the NTT) of the Mojo implementation using established tools
(e.g., dudect) to test for constant-time properties. The results should be
compared against the C++/AVX2 and Rust implementations, which have
well-understood constant-time characteristics.

●

Integrated System Prototype Testbed:

1.  Build an end-to-end prototype that integrates the selected commercial QRNG

hardware with the software stack.

2.  Deploy this prototype in a realistic application scenario (e.g., as a TLS provider for

a web server).

3.  Measure end-to-end performance metrics, including handshake latency,

throughput, and CPU utilization under load.

4.  Conduct reliability and failure-mode testing on the QRNG hardware interface and

its health-check mechanisms.

5.3 Ongoing Monitoring Strategy

The PQC landscape is dynamic. QDaria should establish a continuous monitoring strategy
focused on the following areas:

●  Key Conferences and Journals: Track proceedings from major cryptographic

conferences (CRYPTO, EUROCRYPT, ASIACRYPT, PQCrypto, ACM CCS) and the IACR
Transactions on Cryptographic Hardware and Embedded Systems (TCHES) for new
research on lattice-based cryptanalysis and side-channel attacks.

●  Competitor Developments: Monitor the activities of players in the PQC software space

(Open Quantum Safe, Bouncy Castle) and QRNG hardware space (ID Quantique,
Quintessence Labs) for new product releases or strategic shifts toward integrated
solutions.

●  Regulatory Changes: Closely follow updates from NIST regarding PQC migration

guidance and from the NSA regarding CNSA 2.0 implementation details and timelines.
Monitor similar activities from other national cybersecurity agencies like BSI (Germany)
and ANSSI (France).

●  Mojo Language Evolution: Track the development of the Mojo language and its

compiler, specifically looking for the introduction of features or libraries relevant to
low-level systems programming and security.

APPENDIX A: KEY RESEARCH PAPERS (Annotated
Bibliography)

QRNG + PQC Integration

1.  Title: Quantum Randomness Reinforces Post-Quantum Cryptography to Safeguard

Large Enterprises in the Quantum-Safe Era

○  Citation: QSNP, 2024. 1
○  Tier: 2
○  Relevance: This is the most critical paper supporting the feasibility of Pillar 1. It
documents a proof-of-concept integrating a QRNG with PQC (using libOQS and
OpenSSL) for TLS, finding negligible performance overhead from the QRNG itself.

○  Confidence: A (HIGH)

2.  Title: Biased Nonce Sense: Lattice Attacks Against Weak ECDSA Signatures in

Cryptocurrencies

○  Citation: De Santis et al., 2019. 9
○  Tier: 1
○  Relevance: Establishes the critical precedent that weak randomness is a

practical, exploitable vulnerability in public-key cryptography. While focused on
ECDSA, its findings on lattice-based attacks to solve the hidden number problem
directly motivate the need for high-quality entropy in all cryptographic systems,
including PQC.

○  Confidence: A (HIGH)

3.  Title: Quantis QRNG Product Certifications
○  Citation: ID Quantique, 2024. 7
○  Tier: 3
○  Relevance: Provides definitive evidence of the commercial maturity and

regulatory compliance of QRNG hardware. Documents key certifications including
NIST SP 800-90B and BSI AIS 31, de-risking the hardware component of the
Zipminator platform.
○  Confidence: A (HIGH)

4.  Title: Differential Fault Attacks on Deterministic Lattice Signatures

○  Citation: Espitau et al., TCHES 2018. 13
○  Tier: 1
○  Relevance: Directly demonstrates how fault attacks can create nonce-reuse
scenarios in lattice-based signature schemes like Dilithium, leading to key
recovery. This paper provides a concrete threat model that a high-quality entropy
source like a QRNG helps to mitigate.

○  Confidence: A (HIGH)

PQC Performance & Optimization

5.  Title: Performance Analysis and Industry Deployment of Post-Quantum Cryptography

Algorithms

○  Citation: ResearchGate Preprint, 2025. 2
○  Tier: 2
○  Relevance: This paper provides the most crucial quantitative data for Pillar 2. It

contains detailed millisecond-level benchmarks for reference C vs.
AVX2-optimized C++ implementations of all security levels of Kyber and Dilithium,
establishing the "gold standard" performance target.

○  Confidence: A (HIGH)

6.  Title: High-Performance Hardware Implementation of Lattice-Based Cryptography

○  Citation: Beckwith, NIST PQC Conference, 2022. 18
○  Tier: 1
○  Relevance: Clearly identifies the primary computational bottlenecks in Dilithium:
NTT-based matrix multiplication, polynomial sampling, and signature rejection.
This analysis is essential for understanding where performance optimizations
must be focused.
○  Confidence: A (HIGH)

7.  Title: Performance analysis of the Kyber algorithm for post-quantum cryptography in

HPC environments

○  Citation: CEUR Workshop Proceedings, 2025. 17
○  Tier: 2
○  Relevance: Provides a percentage breakdown of execution time for Kyber's main
operations (NTT, INTT, Poly_Mul), confirming that polynomial arithmetic accounts
for nearly 100% of the computational cost and is the key area for optimization.

○  Confidence: B (MEDIUM)

8.  Title: A Compact and High-Performance Hardware Architecture for CRYSTALS-Dilithium

○  Citation: Zhao et al., TCHES 2022. 46
○  Tier: 1
○  Relevance: Details hardware optimization techniques for Dilithium, emphasizing
the complexity of the operations and the need for specialized modules for NTT
and sampling. This reinforces the difficulty of achieving high performance and the
specific nature of the computational bottlenecks.

○  Confidence: A (HIGH)

Quantum Threat & Market Context

9.  Title: Announcing the Commercial National Security Algorithm Suite 2.0

○  Citation: National Security Agency (NSA), 2022. 47
○  Tier: 1
○  Relevance: The foundational document for the primary market driver. It officially

announces CNSA 2.0 and names the PQC algorithms (Kyber, Dilithium) required
for protecting U.S. National Security Systems.

○  Confidence: A (HIGH)

10. Title: CNSA 2.0 Compliance Requirements, Algorithms & Timelines

○  Citation: SafeLogic, 2025. 39
○  Tier: 3
○  Relevance: Provides a clear, consolidated table of the NSA's migration timeline
for CNSA 2.0, outlining key dates for compliance and phase-out of legacy
systems. This is critical for understanding the market window of opportunity.

○  Confidence: A (HIGH)

11. Title: FAQ for Kyber-512

○  Citation: NIST, 2023. 3
○  Tier: 1
○  Relevance: Authoritative analysis from NIST on the quantum security of Kyber. It
provides the key finding that breaking even the lowest security level of Kyber is
likely harder for a quantum computer than classical attacks, contextualizing the
quantum threat as a future, not immediate, problem.

○  Confidence: A (HIGH)

12. Title: NIST FIPS 203 & FIPS 204 Final Standards

○  Citation: NIST, 2024. 6
○  Tier: 1
○  Relevance: These are the official standard documents for ML-KEM (Kyber) and
ML-DSA (Dilithium). They are the ultimate source of truth for the algorithms'
specifications and the basis for all compliant implementations.

○  Confidence: A (HIGH)

APPENDIX B: BENCHMARK DATA TABLES

(Included within the main body of the report as Tables 1, 2, 3, and 4)

APPENDIX C: METHODOLOGY NOTES

●  Search Queries Used: "CRYSTALS-Kyber" AND "performance", "CRYSTALS-Dilithium"

AND "bottleneck", "QRNG" AND "PQC" AND "integration", "Mojo language" AND
"cryptography", "CNSA 2.0" AND "timeline", "quantum attack" AND "resource
estimation" AND "Kyber".

●  Databases and Sources Consulted: IACR ePrint Archive, NIST CSRC Publications, ACM

Digital Library, IEEE Xplore, arXiv, Google Scholar, and targeted searches of vendor and
open-source project websites.

●  Date of Research: Research activities were concluded in the fourth quarter of 2025.

●  Limitations and Scope: This report is based solely on publicly available information

and the provided research materials. It does not include analysis of QDaria's proprietary
source code, internal benchmarks, or financial data. The assessment of the Mojo
programming language is limited by the profound lack of relevant public documentation
and research concerning its use in secure, constant-time applications. All findings
related to Mojo's performance and security potential should be treated as speculative
until validated by empirical testing.

Works cited

1.  Quantum Randomness Reinforces Post-Quantum Cryptography to ..., accessed

October 27, 2025,
https://qsnp.eu/quantum-randomness-reinforces-post-quantum-cryptography-t
o-safeguard-large-enterprises-in-the-quantum-safe-era/

2.  (PDF) Performance Analysis and Industry Deployment of Post ..., accessed

October 27, 2025,
https://www.researchgate.net/publication/389917968_Performance_Analysis_and
_Industry_Deployment_of_Post-Quantum_Cryptography_Algorithms

3.  FAQ on Kyber512 - NIST Computer Security Resource Center, accessed October

27, 2025,
https://csrc.nist.gov/csrc/media/Projects/post-quantum-cryptography/documents
/faq/Kyber-512-FAQ.pdf

4.  Post-Quantum Cryptography FIPS Approved | CSRC - NIST Computer Security
Resource Center - National Institute of Standards and Technology, accessed
October 27, 2025,
https://csrc.nist.gov/news/2024/postquantum-cryptography-fips-approved

5.  NIST FIPS 203, 204, 205 Finalized | PQC Algorithms | CSA - Cloud Security

Alliance, accessed October 27, 2025,
https://cloudsecurityalliance.org/blog/2024/08/15/nist-fips-203-204-and-205-fin
alized-an-important-step-towards-a-quantum-safe-future

6.  FIPS 204, Module-Lattice-Based Digital Signature Standard | CSRC, accessed

October 27, 2025, https://csrc.nist.gov/pubs/fips/204/final

7.  Quantis QRNG Product Certifications - ID Quantique, accessed October 27,

2025, https://www.idquantique.com/random-number-generation/certifications/
8.  What is a Quantum Random Number Generator (QRNG)? - Palo Alto Networks,

accessed October 27, 2025,
https://www.paloaltonetworks.com/cyberpedia/what-is-a-quantum-random-num
ber-generator-qrng

9.  Biased Nonce Sense: Lattice Attacks Against Weak ECDSA ..., accessed October

27, 2025,
https://www.researchgate.net/publication/336437771_Biased_Nonce_Sense_Latti
ce_Attacks_Against_Weak_ECDSA_Signatures_in_Cryptocurrencies

10. A Look at Side Channel Attacks on Post-quantum Cryptography - SciELO México,

accessed October 27, 2025,
https://www.scielo.org.mx/scielo.php?script=sci_arttext&pid=S1405-5546202400

0401879

11. Side-Channel Resistance of Lattice-based Cryptographic Schemes - Aaltodoc,

accessed October 27, 2025,
https://aaltodoc.aalto.fi/bitstreams/260ab815-a338-47b6-ab4b-dbd5f22434d4/d
ownload

12. Side-Channel Attacks on Post-Quantum PKE/KEMs and Digital Signatures - DiVA,

accessed October 27, 2025,
https://kth.diva-portal.org/smash/get/diva2:2007310/FULLTEXT01.pdf

13. (PDF) Differential Fault Attacks on Deterministic Lattice Signatures -

ResearchGate, accessed October 27, 2025,
https://www.researchgate.net/publication/346707210_Differential_Fault_Attacks_
on_Deterministic_Lattice_Signatures

14. Non-Profiled Higher-Order Side-Channel Attacks against Lattice-Based

Post-Quantum Cryptography - ResearchGate, accessed October 27, 2025,
https://www.researchgate.net/publication/396261106_Non-Profiled_Higher-Order
_Side-Channel_Attacks_against_Lattice-Based_Post-Quantum_Cryptography
15. Divide and Surrender: Exploiting Variable Division Instruction Timing in HQC Key

Recovery Attacks - USENIX, accessed October 27, 2025,
https://www.usenix.org/system/files/usenixsecurity24-schroder.pdf

16. Quantum Random Number Generation (QRNG) - ID Quantique, accessed

October 27, 2025,
https://www.idquantique.com/random-number-generation/overview/

17. Performance Evaluation and Profiling of Kyber for ... - CEUR-WS.org, accessed

October 27, 2025, https://ceur-ws.org/Vol-4055/icaiw_waai_9.pdf

18. High-Performance Hardware Implementation of CRYSTALS-Dilithium, accessed

October 27, 2025,
https://csrc.nist.gov/csrc/media/Presentations/2022/high-performance-hardware-
implementation-of-lattic/images-media/session-4-beckwith-high-performance-
hardware-pqc2022.pdf

19. arXiv:2211.12265v2 [cs.CR] 22 Apr 2023, accessed October 27, 2025,

https://arxiv.org/pdf/2211.12265

20. High-Speed NTT-based Polynomial Multiplication Accelerator for Post-Quantum

Cryptography | NSF Public Access Repository, accessed October 27, 2025,
https://par.nsf.gov/biblio/10337501-high-speed-ntt-based-polynomial-multiplicati
on-accelerator-post-quantum-cryptography

21. arxiv.org, accessed October 27, 2025, https://arxiv.org/html/2505.01782v1
22. Efficient unified architecture for post-quantum cryptography: combining

Dilithium and Kyber, accessed October 27, 2025,
https://peerj.com/articles/cs-2746/

23. MojoBench: Language Modeling and Benchmarks for Mojo - ACL Anthology,

accessed October 27, 2025, https://aclanthology.org/2025.findings-naacl.230/
24. Mojo is Fast. But is it the Future of Python or Just a Flicker in the Dark? - Medium,

accessed October 27, 2025,
https://medium.com/@tfmv/mojo-is-fast-but-is-it-the-future-of-python-or-just-
a-flicker-in-the-dark-3fe99ac83f5e

25. lib-Q — Rust crypto library // Lib.rs, accessed October 27, 2025,

https://lib.rs/crates/lib-q

26. Framework for Prototyping And In-Hardware Evaluation of Post-Quantum

Cryptography HW Accelerators (TU Darmstadt) - Semiconductor Engineering,
accessed October 27, 2025,
https://semiengineering.com/framework-for-prototyping-and-in-hardware-evalu
ation-of-post-quantum-cryptography-hw-accelerators-tu-darmstadt/

27. Future Proofing TLS1.3: Integration and Evaluation of Post-Quantum ..., accessed

October 27, 2025,
https://repository.tugraz.at/publications/marc21/0d0ft-bjs46/files/77392.pdf?dow
nload=1

28. cuML-DSA: Optimized Signing Procedure and Server-Oriented GPU Design for

ML-DSA, accessed October 27, 2025,
https://www.computer.org/csdl/journal/tq/2025/03/10748358/21HRyiBmEsU

29. [Blog] Setting the Standard: Industry First PQC-Ready FPGA - Lattice

Semiconductor, accessed October 27, 2025,
https://www.latticesemi.com/en/Blog/2025/10/09/14/54/Setting-the-Standard-Ind
ustry-First-PQC-Ready-FPGA

30. Quantum Shield for AI: Lattice Semiconductor Unveils Post-Quantum Secure

FPGAs | User | chroniclejournal.com, accessed October 27, 2025,
https://markets.chroniclejournal.com/chroniclejournal/article/tokenring-2025-10-1
4-quantum-shield-for-ai-lattice-semiconductor-unveils-post-quantum-secure-f
pgas

31. European Payments Council's Guidelines on cryptographic algorithms usage and

key management - EPC Document, accessed October 27, 2025,
https://www.europeanpaymentscouncil.eu/sites/default/files/kb/file/2024-03/EPC
342-08%20v13.0%20Guidelines%20on%20Cryptographic%20Algorithms%20Us
age%20and%20Key%20Management.pdf

32. NTT and Inverse NTT Quantum Circuits in CRYSTALS-Kyber for Post-Quantum

Security Evaluation - ResearchGate, accessed October 27, 2025,
https://www.researchgate.net/publication/373996716_NTT_and_Inverse_NTT_Qua
ntum_Circuits_in_CRYSTALS-Kyber_for_Post-Quantum_Security_Evaluation
33. Evaluating the security of CRYSTALS-Dilithium in the quantum random oracle

model - National Institute of Standards and Technology, accessed October 27,
2025, https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=956883
34. Decrypting the NIST-Approved Algorithms for Enterprises | Encryption

Consulting, accessed October 27, 2025,
https://www.encryptionconsulting.com/decrypting-the-nist-approved-algorithms
-for-enterprises/

35. Performance and Storage Analysis of CRYSTALS-Kyber (ML-KEM) as a

Post-Quantum Replacement for RSA and ECC - arXiv, accessed October 27,
2025, https://arxiv.org/html/2508.01694v4

36. Cryptographic Agility for Real-Time Payment Systems: A Post- Quantum
Architecture and Performance Evaluation, accessed October 27, 2025,
https://jisem-journal.com/index.php/journal/article/download/13171/6155/22225

37. Session VII – NIST 6 th PQC Standardization Conference NIST ..., accessed

October 27, 2025,
https://csrc.nist.gov/csrc/media/presentations/2025/nist-pqc-migration-project-a
nd-crypto-agility-proj/nist_pqc_migration_project-newhouse_2.10.pdf

38. Preparing for Post-Quantum Critical Infrastructure: Assessments of Quantum

Computing Vulnerabilities of National Critical Functi - RAND, accessed October
27, 2025,
https://www.rand.org/content/dam/rand/pubs/research_reports/RRA1300/RRA136
7-6/RAND_RRA1367-6.pdf

39. CNSA 2.0 Compliance Requirements, Algorithms & Timelines ..., accessed

October 27, 2025, https://www.safelogic.com/compliance/cnsa-2

40. The Commercial National Security Algorithm Suite 2.0 and ... - DoD, accessed

October 27, 2025,
https://media.defense.gov/2022/Sep/07/2003071836/-1/-1/0/CSI_CNSA_2.0_FAQ_.
PDF

41. Open Quantum Safe: Home, accessed October 27, 2025,

https://openquantumsafe.org/

42. About our project | Open Quantum Safe, accessed October 27, 2025,

https://openquantumsafe.org/about/

43. Demo using Bouncy Castle Post Quantum Cryptography Library in Android Kotlin

Project (NTRU and AES-128) - GitHub, accessed October 27, 2025,
https://github.com/snowfluke/bouncy-castle-pqc-android-kotlin-demo
44. EJBCA and post quantum preparedness | KvantPhone, accessed October 27,
2025, https://kvantphone.com/en/ejbca-and-post-quantum-preparedness/

45. Support - ID Quantique, accessed October 27, 2025,

https://www.idquantique.com/support/

46. A Compact and High-Performance Hardware Architecture for

CRYSTALS-Dilithium, accessed October 27, 2025,
https://www.researchgate.net/publication/356399524_A_Compact_and_High-Perf
ormance_Hardware_Architecture_for_CRYSTALS-Dilithium

47. Announcing the Commercial National Security Algorithm Suite 2.0, accessed

October 27, 2025,
https://media.defense.gov/2025/May/30/2003728741/-1/-1/0/CSA_CNSA_2.0_ALG
ORITHMS.PDF

48. FIPS 203, Module-Lattice-Based Key-Encapsulation Mechanism ..., accessed

October 27, 2025, https://csrc.nist.gov/pubs/fips/203/final


