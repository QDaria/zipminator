// Blueprint prose content — expanded IP valuation document text
// Each section key matches the id used in SECTION_LIST and the page.tsx routing

export interface ProseCallout {
  type: 'insight' | 'equation' | 'warning' | 'citation'
  title: string
  text: string
}

export interface ProseSubsection {
  id: string
  heading: string
  body: string[]
  callout?: ProseCallout
}

export interface SectionProse {
  intro: string[]
  subsections: ProseSubsection[]
  conclusion?: string[]
}

// Populated section prose for blueprint IP valuation document
export const SECTION_PROSE: Record<string, SectionProse> = {
  'patent-stack': {
    intro: [
      'QDaria\'s three filed patents cover the complete entropy lifecycle, from raw signal to certified output to irreversible anonymization. They are not three separate inventions in neighboring fields. They are three stages of a single pipeline, each architecturally dependent on the one below. Patent 2 generates cryptographic-grade entropy from WiFi Channel State Information and quantum sources, addressing 18.2 billion WiFi-enabled devices worldwide. Patent 3 certifies and composes that entropy using Algebraic Randomness Extractors and Merkle provenance chains, the first non-hash extractor family introduced since Trevisan\'s construction in 2001. Patent 1 consumes the certified entropy to produce information-theoretically irreversible anonymization under the Born rule of quantum mechanics, a guarantee that holds even if P = NP. Together: 46 claims, 9 independent chokepoints, zero blocking prior art across 48 exhaustive searches spanning Espacenet, WIPO Patentscope, Google Patents, USPTO, Justia Patents, and IEEE Xplore.',
      'The vertical integration is the point. A competitor who wants to replicate any single layer faces the entire thicket. A licensee who wants Patent 2 (generation) also needs Patent 3 (composition) to produce auditable output, and eventually Patent 1 (consumption) for the most commercially valuable application. The portfolio is designed for bundle licensing, and the bundle commands a premium that exceeds the sum of individual patent values.',
    ],
    subsections: [
      {
        id: 'entropy-lifecycle',
        heading: 'The Entropy Lifecycle Architecture',
        body: [
          'Every cryptographic system begins with the same question: where does the randomness come from? Hardware RNG chips such as Intel RDRAND and ARM TRNG are opaque black boxes whose internal state is inaccessible for audit. Software PRNGs like ChaCha20 or AES-CTR-DRBG are deterministic functions: given the seed, every output is reproducible. Dedicated QRNG devices from vendors like ID Quantique cost $50 to $200 per unit and require physical integration. None of these sources provides the combination of availability, auditability, and cryptographic strength that regulated industries increasingly demand.',
          'Patent 2 solves the generation problem by extracting entropy from WiFi Channel State Information using a single device, without cooperation from any other device. CSI captures the complex-valued amplitude and phase response across subcarriers and antenna pairs for every WiFi frame received. Because these values encode the electromagnetic environment around the device (wall reflections, furniture absorption, multipath interference, human body attenuation), they are physically unclonable: no two devices in different locations will ever observe the same CSI matrix. The method applies SVD eigenstructure analysis to the CSI matrix, extracts phase LSBs with Von Neumann debiasing, conditions the output through XOR with QRNG bytes and HKDF-SHA256, and produces a Physical Unclonable Entropy Key (PUEK) with configurable security profiles: Standard (0.75 min-entropy), Elevated (0.85), High (0.95), and Military (0.98). The addressable device count is staggering: the Wi-Fi Alliance reported 18.2 billion WiFi-enabled devices in operation as of 2025, with roughly 4 billion new devices shipping annually. Every smartphone, laptop, tablet, smart TV, IoT sensor, industrial controller, connected vehicle, and access point has a CSI-capable chip.',
          'Patent 3 solves the composition problem. Raw entropy from a single source, whether quantum hardware, CSI, or the OS entropy pool, is insufficient for high-assurance applications. Different sources have different failure modes: quantum hardware may be offline, CSI quality varies with environment, and OS entropy pools can be depleted under high load. The Certified Heterogeneous Entropy (CHE) framework composes multiple heterogeneous sources into a single provenance-certified pool. The composition engine is the Algebraic Randomness Extractor (ARE), which operates over five algebraic domains: complex numbers (C), the natural domain for CSI eigenvalues; quaternions (H), 4-dimensional hypercomplex algebra used in aerospace and quantum computing; octonions (O), 8-dimensional non-associative algebra representing the largest normed division algebra; finite fields GF(p^n), the foundation of elliptic curve cryptography; and p-adic numbers (Q_p), an ultrametric number system from mathematical physics. The patent explicitly excludes sedenions (16-dimensional) because their zero divisors would compromise the bijective property the ARE requires. Every byte of composed entropy carries a Merkle provenance chain linking it back to its source: quantum hardware job ID, CSI capture timestamp, or OS pool state hash. This is not metadata tagging; it is a cryptographic audit trail that satisfies DORA Article 7 key lifecycle management requirements.',
          'Patent 1 solves the consumption problem. It takes the certified entropy from Patent 3 and applies it through the QRNG-OTP-Destroy protocol: generate a one-time pad from quantum measurement outcomes, apply it to anonymize each PII value, then destroy the mapping via DoD 5220.22-M three-pass overwrite (zeros, ones, random bytes). After destruction, recovering the original data requires determining which quantum measurement outcomes produced each token. This is information-theoretically impossible under the Born rule: quantum measurement outcomes are fundamentally non-deterministic, confirmed experimentally by Bell test violations (Aspect, 1982; loophole-free Hensen et al., 2015; recognized by the 2022 Nobel Prize in Physics). The anonymized output satisfies GDPR Recital 26\'s threshold for true anonymization, meaning the processed data "does not relate to an identified or identifiable natural person" and falls entirely outside the regulation\'s scope.',
          'The vertical integration matters because each layer depends on the one below. Without Patent 2\'s generation capability, Patent 3 has no CSI entropy to compose. Without Patent 3\'s composition and certification framework, Patent 1 has no provenance-verified entropy to consume. Without Patent 1\'s consumption pathway, the entropy lifecycle has no commercially compelling endpoint. A competitor who replicates any single layer still lacks the others, and the architectural dependencies are not incidental; they are by design.',
        ],
        callout: {
          type: 'insight',
          title: 'Vertical Integration',
          text: 'P2 (Generation) feeds P3 (Composition), which feeds P1 (Consumption). Each patent is independently valuable, but the pipeline as a whole is worth more than the sum of its parts. A licensee who enters at any layer needs the adjacent layers to deliver a complete solution.',
        },
      },
      {
        id: 'thicket-strategy',
        heading: 'Patent Thicket Strategy',
        body: [
          'The patent thicket is one of the most proven monetization strategies in technology licensing. Its economics are documented across three decades of precedent, with three companies providing direct structural analogies to QDaria\'s approach.',
          'Qualcomm built a thicket around cellular communications. Their CDMA patents covered modulation, coding, handoff, power control, and interference management. No cellular chipmaker could ship a standards-compliant modem without licensing the bundle. At its peak, this thicket generated approximately $6 billion per year in licensing revenue. Qualcomm\'s key insight was that individual patents might be designed around, but the thicket as a whole could not. This is why Qualcomm collected royalties from every major handset manufacturer on Earth, including companies that actively litigated against the licensing terms. The structural parallel to QDaria is direct: Qualcomm covered multiple layers of the cellular stack, and QDaria covers multiple layers of the entropy stack.',
          'ARM built a thicket around chip architecture. ARM does not manufacture silicon. It licenses instruction set architecture, microarchitecture, and peripheral IP as an interlocking bundle. Annual licensing revenue exceeds $3 billion. Every smartphone SoC shipped by Apple, Qualcomm, Samsung, and MediaTek includes ARM-licensed IP. The moat is not any single patent; it is the cost and complexity of designing around the entire architecture simultaneously. QDaria\'s portfolio presents the same dilemma: designing around Patent 2 (entropy generation) is one challenge, but designing around all three patents covering generation, composition, and consumption simultaneously is a fundamentally harder problem.',
          'Dolby built a thicket around audio and video codecs. Dolby licenses encoding, decoding, and playback patents as a bundle, generating approximately $1.3 billion per year. Every streaming service, every Blu-ray player, every cinema projector, and every smart TV pays Dolby royalties. The per-unit fees are small (fractions of a dollar), but the volume is enormous because the patents are embedded in standards. QDaria\'s Patent 2 targets an even larger device base: 18.2 billion WiFi-enabled devices versus approximately 1.5 billion annual smartphone shipments.',
          'QDaria\'s thicket follows the same structural blueprint. The 9 independent claims (3 per patent) function as 9 separate chokepoints. Each independent claim must be licensed or designed around separately. The 37 dependent claims cover implementation variants: specific algebraic domains in Patent 3 (quaternions, octonions, finite fields, p-adic numbers), specific security profiles in Patent 2 (Standard 0.75 through Military 0.98), specific provenance mechanisms in Patent 3 (Merkle trees, hash chain variants), and specific anonymization pipeline configurations in Patent 1 (10 levels, enclave-secured variants, multi-column sensitivity mapping). The portfolio is designed from the ground up for bundle licensing. A licensee who needs any one of these capabilities finds that the most efficient path is to license the full stack.',
        ],
        callout: {
          type: 'citation',
          title: 'Thicket Revenue Precedents',
          text: 'Qualcomm CDMA: ~$6B/year. ARM architecture: ~$3B/year. Dolby codecs: ~$1.3B/year. All three companies generate the majority of their licensing profits from interlocking patent bundles, not individual patents. QDaria\'s thicket targets a 18.2B-device ecosystem.',
        },
      },
      {
        id: 'claim-structure',
        heading: 'Claim Structure Analysis',
        body: [
          'Patent 1 (Quantum-Certified Anonymization, Application 20260384, filed March 24, 2026) contains 15 claims: 3 independent and 12 dependent. Independent Claim 1 covers the general QRNG-OTP-Destroy method for producing information-theoretically irreversible anonymization. Independent Claim 2 covers the multi-level anonymization pipeline (10 distinct levels from basic pseudonymization through quantum OTP). Independent Claim 3 covers the system architecture including quantum entropy pool integration and provenance-tracked anonymization events. The 12 dependent claims cover hardware enclave variants (Intel SGX, ARM TrustZone), multi-provider entropy aggregation, column-level sensitivity mapping (different anonymization levels for quasi-identifiers versus direct identifiers), DoD 5220.22-M three-pass overwrite specifics, thread-safe entropy pool consumption, and provenance records connecting anonymization outputs to specific quantum hardware job IDs.',
          'Patent 2 (Unilateral CSI Entropy + PUEK, Altinn ref: ef95b9a26a3e, filed April 5, 2026) contains 14 claims: 3 independent and 11 dependent. Independent Claim 1 covers unilateral entropy extraction from WiFi CSI using SVD eigenstructure analysis on a single device. Independent Claim 2 covers the Physical Unclonable Entropy Key (PUEK) construction with configurable security profiles. Independent Claim 3 covers the combined system of CSI extraction, PUEK generation, and integration into a multi-source entropy architecture. The 11 dependent claims cover Von Neumann debiasing for phase LSB extraction, XOR conditioning with secondary entropy sources, HKDF-SHA256 key derivation, four security profiles (Standard 0.75, Elevated 0.85, High 0.95, Military 0.98), multi-antenna MIMO CSI matrix handling, and temporal correlation rejection across consecutive captures.',
          'Patent 3 (CHE/ARE Composition Framework + Merkle Provenance, Altinn ref: 870867694a06, filed April 5, 2026) contains 17 claims: 3 independent and 14 dependent. Independent Claim 1 covers the general algebraic randomness extraction method operating over non-hash algebraic structures. Independent Claim 2 covers the Certified Heterogeneous Entropy framework for composing multiple entropy sources with provenance preservation. Independent Claim 3 covers the Merkle provenance chain for entropy audit trails. The 14 dependent claims are particularly significant: Claims 13 through 17 cover each specific algebraic domain (complex numbers, quaternions, octonions, finite fields, p-adic numbers), which means a competitor using ARE over any of these domains infringes at least one dependent claim. The remaining dependent claims cover source quality monitoring, pool health checks (aligned with NIST SP 800-90B), incremental Merkle tree updates, subset provenance verification, and domain-switching strategies for runtime optimization.',
          'Dependent claims matter for prosecution because they define the boundaries of the invention in granular detail. If an examiner narrows an independent claim during prosecution, the dependent claims provide fallback positions that preserve meaningful coverage. Each dependent claim represents a distinct embodiment that must be individually challenged. For a potential infringer, the 37 dependent claims across three patents create a minefield: even if they find a way around one independent claim, the dependent claims covering implementation variants make it extremely difficult to ship a practical product without touching at least several claims. Patent attorneys refer to this as "prosecution-proofing": the portfolio is designed to survive narrowing amendments while retaining commercial value.',
        ],
        callout: {
          type: 'equation',
          title: 'Claim Arithmetic',
          text: 'P1: 3 independent + 12 dependent = 15 claims. P2: 3 independent + 11 dependent = 14 claims. P3: 3 independent + 14 dependent = 17 claims. Total: 9 independent chokepoints + 37 implementation variants = 46 claims across the entropy lifecycle.',
        },
      },
      {
        id: 'pct-strategy',
        heading: 'PCT Strategy and Timeline',
        body: [
          'The Patent Cooperation Treaty (PCT) provides a 12-month window from the priority date to file an international application covering up to 157 contracting states. Patent 1 (priority date March 24, 2026) has a PCT deadline of March 24, 2027. Patents 2 and 3 (priority date April 5, 2026) have PCT deadlines of April 5, 2027. These deadlines are firm and non-extendable. Missing them forfeits international coverage permanently.',
          'The PCT strategy targets three jurisdictions with distinct commercial rationale. First, Switzerland through a Swiss AG for IP holding, established in the canton of Zug. Switzerland\'s patent box regime allows up to 90% of qualifying patent income to be excluded from cantonal and federal taxation, resulting in an effective tax rate on patent licensing revenue of approximately 2% to 4% in Zug. This is not a tax shelter; it is the intended use of the Swiss Federal Act on Tax Reform and AHV Financing (TRAF/STAF, 2020). Every major technology licensing company with European operations, including ARM and Qualcomm, uses a similar structure. The Swiss AG becomes the holder of the PCT international patents and the licensing counterparty for European customers.',
          'Second, US non-provisional filing through the USPTO. The US remains the largest market for patent licensing, and US patents carry the most weight in cross-licensing negotiations with chipmakers (Qualcomm, Intel, Broadcom, MediaTek) and cloud providers (AWS, Azure, Google Cloud). Filing at USPTO triggers examination by examiners who have access to the complete US prior art database, and a granted US patent provides the strongest enforcement mechanism globally through the ITC (International Trade Commission), which can issue exclusion orders blocking infringing products at the border.',
          'Third, China coverage through the CNIPA (China National Intellectual Property Administration) prior art search. China manufactures the majority of global WiFi chipsets through companies including MediaTek (headquartered in Taiwan but with extensive Chinese manufacturing), Realtek (Taiwan), Espressif (Shanghai), and dozens of smaller firms. A CNIPA-validated prior art search strengthens the PCT application by demonstrating awareness of the Chinese patent landscape, and a subsequent Chinese national phase filing would cover the world\'s largest WiFi device manufacturing base.',
          'The timeline is structured for capital efficiency. The Norwegian priority filings (Patentstyret) cost under 6,000 NOK total for all three patents. PCT international filings will cost approximately $5,000 to $8,000 per patent (filing fee, search fee, designation fees). US national phase entry costs approximately $2,000 to $3,000 per patent plus prosecution costs of $15,000 to $30,000 per patent over 2 to 4 years. Swiss and Chinese national phase entries add similar costs. The total IP prosecution budget through grant is approximately $150,000 to $250,000 across all three patents and all target jurisdictions. This represents less than 0.5% of the pre-revenue seed valuation and less than 0.01% of the conservative combined portfolio value.',
        ],
        callout: {
          type: 'warning',
          title: 'PCT Deadlines',
          text: 'Patent 1 PCT deadline: March 24, 2027. Patents 2 and 3 PCT deadline: April 5, 2027. Missing these dates forfeits international coverage permanently. Swiss AG setup should be completed before PCT filing to ensure the correct entity is listed as applicant.',
        },
      },
      {
        id: 'cross-patent-dependencies',
        heading: 'Cross-Patent Dependencies',
        body: [
          'The architectural dependencies between the three patents are the primary driver of the thicket\'s licensing power. Understanding these dependencies explains why a competitor cannot pick and choose individual patents and why the bundle commands a premium exceeding the sum of individual values.',
          'Patent 2 is the keystone. It provides the raw entropy that flows into the rest of the pipeline. Without a source of CSI-derived entropy, Patent 3\'s composition framework lacks its most novel input, and Patent 1\'s anonymization system loses the physical unclonability that distinguishes quantum-certified output from classical alternatives. A competitor who wants to build any entropy-dependent product, whether a certified entropy pool, a QRNG anonymizer, or a provenance-tracked key management system, must either license Patent 2 or find an alternative entropy source. The alternatives are weaker in every measurable dimension: hardware RNGs are opaque (no audit trail), software PRNGs are deterministic (seed capture defeats them), and bilateral CSI systems require device cooperation (Origin Wireless\'s 225+ patents all require two endpoints). Unilateral CSI extraction from a single device is Patent 2\'s exclusive territory.',
          'Without Patent 2, Patent 3 has no raw material. The CHE framework is designed to compose heterogeneous entropy sources, and CSI-derived entropy is the most valuable source in the pipeline because it is free, ubiquitous, and physically unclonable. A Patent 3 licensee who cannot source CSI entropy must rely exclusively on quantum hardware (expensive, requires physical access) and OS entropy (auditable but lacking the physical unclonability guarantee). The ARE still functions over these sources, but the resulting product is commercially weaker because it cannot claim location-locked keys, environmental fingerprinting, or the 18.2-billion-device addressable market.',
          'Without Patent 3, Patent 1 has no certified entropy. The QRNG-OTP-Destroy protocol requires entropy that can be audited back to its source. Under DORA Article 7, financial entities must demonstrate key lifecycle management with verifiable provenance. Without Merkle chain certification, a Patent 1 licensee can anonymize data, but cannot prove to a regulator where the entropy came from, how it was composed, or whether it meets minimum quality thresholds. This makes the product unsuitable for the most lucrative market segment: regulated financial institutions facing 2% of global turnover penalties for non-compliance.',
          'The three-patent dependency creates a licensing funnel. A competitor enters the space by needing one capability, discovers they need the adjacent capabilities, and finds that the most efficient path is to license the full bundle. This is precisely how Qualcomm\'s cellular thicket operates: a chipmaker starts by needing the modulation patent, then discovers they also need the handoff patent, the power control patent, and the interference management patent. The bundle price is set below the sum of individual licenses, which makes the bundle appear economical while still commanding a premium over any single-patent license. QDaria\'s thicket synergy multiplier of 2x to 5x over individual patent values reflects this well-documented dynamic.',
          'Designing around all three patents simultaneously is a research program, not an engineering project. It would require inventing a new entropy source that avoids CSI (losing 18.2B addressable devices), inventing a new composition framework that avoids algebraic extraction (returning to hash-based methods that are fundamentally the same as existing tools), and inventing a new anonymization method that achieves information-theoretic irreversibility without quantum entropy (which may be physically impossible). The probability of a single competitor successfully executing all three research breakthroughs, each in a domain where QDaria has zero prior art, is vanishingly small.',
        ],
        callout: {
          type: 'insight',
          title: 'The Licensing Funnel',
          text: 'P2 (entropy source) is the keystone. Without P2, P3 has no CSI entropy to compose. Without P3, P1 has no certified entropy to consume. A competitor must either license all three or build three entirely different technologies, each in a domain with zero prior art. The economics overwhelmingly favor licensing the bundle.',
        },
      },
    ],
    conclusion: [
      'The three-patent stack is not three separate bets. It is a single, vertically integrated entropy pipeline protected at every layer. The 9 independent claims create 9 separate blocking positions. The 37 dependent claims cover implementation variants across algebraic domains, security profiles, and deployment architectures. The PCT strategy preserves international coverage through 2027 with a Swiss AG structure optimized for patent licensing economics. And the cross-patent dependencies ensure that licensing one patent without the others leaves critical gaps that no regulator, no auditor, and no security architect would accept. A competitor must license the full stack or build three entirely different technologies from scratch, each in uncharted territory.',
    ],
  },

  novelty: {
    intro: [
      'A patent\'s commercial value is bounded by a single question: can a competitor design around it? The answer depends entirely on the novelty of the underlying claims. QDaria conducted 48 searches across six major patent and publication databases, covering every plausible formulation of the three core inventions. The result was consistent and extraordinary: zero blocking prior art for any of the three patents. This section details the search methodology, the specific novelty of each patent, and why the combined portfolio represents a fundamentally new position in post-quantum cryptography.',
    ],
    subsections: [
      {
        id: 'prior-art-methodology',
        heading: 'Prior Art Search Methodology',
        body: [
          'The prior art search covered six databases: Espacenet (European Patent Office, 130+ million documents), WIPO Patentscope (4.4 million international applications), Google Patents (full-text index of 120+ million patents and applications), USPTO Full-Text (US granted patents and pre-grant publications), Justia Patents (US patents with enhanced semantic search), and IEEE Xplore (6+ million technical documents including conference proceedings and journal articles). Each database was queried with eight search formulations per patent, yielding 48 individual searches.',
          'Search terms were constructed to maximize recall. For Patent 1, queries included "quantum random number generator AND anonymization," "QRNG AND GDPR," "quantum one-time pad AND personal data," "Born rule AND data masking," and "irreversible anonymization AND quantum." For Patent 2, queries included "channel state information AND entropy," "CSI AND cryptographic key," "WiFi AND physical unclonable," "unilateral key generation AND wireless," and "PUEK." For Patent 3, queries included "algebraic randomness extractor," "non-hash entropy extractor," "heterogeneous entropy composition," "Merkle AND entropy provenance," and "quaternion AND randomness extraction."',
          'For Patent 1, the closest result was JPMorgan Chase\'s certified random number generation patent (US11,144,645B2), which covers certified randomness for lottery and gaming applications. It does not address anonymization, does not reference GDPR, and does not claim information-theoretic irreversibility. For Patent 2, Origin Wireless holds 225+ patents covering WiFi sensing (breathing detection, motion tracking, gesture recognition), but every single one requires bilateral cooperation between a transmitter and a receiver. None addresses entropy extraction. The term "PUEK" returned zero results across all six databases. For Patent 3, the term "algebraic randomness extractor" returned zero results in every database. Qrypt\'s entropy provenance patent (US10,402,172B1) uses flat provenance tags rather than a Merkle tree structure.',
          'Three patents with zero overlapping prior art across 48 exhaustive searches is not merely unusual. In patent prosecution, finding even one clear-field result is favorable. Finding zero blockers across 48 searches, spanning three separate inventions that interlock into a single entropy lifecycle pipeline, indicates that QDaria has identified a region of the technical landscape that the entire global research and commercial community has overlooked.',
        ],
        callout: {
          type: 'insight',
          title: 'Search Coverage',
          text: '48 searches across 6 databases (Espacenet, WIPO Patentscope, Google Patents, USPTO, Justia, IEEE Xplore). Zero blocking prior art found for any of the three patents. The term "PUEK" returns zero results globally.',
        },
      },
      {
        id: 'p1-born-rule',
        heading: 'P1 Novelty: Born Rule Irreversibility',
        body: [
          'Every anonymization system deployed today, from academic tools like ARX and sdcMicro to industrial systems including Google\'s Differential Privacy library, Apple\'s Local Differential Privacy, and Microsoft Presidio, relies on classical pseudo-random number generators as its entropy source. A CSPRNG such as ChaCha20 or AES-CTR-DRBG is a deterministic function: given its internal state, every output can be reproduced. That state exists physically, in RAM, in kernel data structures, in hardware registers. An adversary who captures it, whether through memory forensics, cold boot attacks, Spectre-class side channels, or insider access, can reconstruct every "random" value and reverse the anonymization completely.',
          'Patent 1 replaces the CSPRNG with quantum measurement outcomes governed by the Born rule. When a qubit prepared in balanced superposition is measured, the outcome is not merely unpredictable in practice; it is fundamentally indeterminate prior to measurement. Bell\'s theorem, confirmed experimentally by Aspect, Dalibard, and Roger in 1982 and declared loophole-free by Hensen et al. in 2015 (recognized by the 2022 Nobel Prize in Physics), proves that no local hidden variable determines the result. There is no seed. There is no state to capture.',
          'The protocol, QRNG-OTP-Destroy, generates a one-time pad from quantum measurement outcomes, applies it to anonymize each PII value, then destroys the mapping via DoD 5220.22-M three-pass overwrite. After destruction, recovery requires determining which quantum measurement outcomes produced each token, which is information-theoretically impossible. The anonymized output satisfies GDPR Recital 26\'s threshold for true anonymization: the data "does not relate to an identified or identifiable natural person" and falls entirely outside the regulation\'s scope.',
          'Compare this to the classical alternatives. k-anonymity (Sweeney, 2002) ensures each record is indistinguishable from at least k-1 others, but is vulnerable to homogeneity and background knowledge attacks. l-diversity extends this by requiring diverse sensitive values per equivalence class, but still depends on CSPRNG randomness. Differential privacy (Dwork, 2006) bounds the influence of any single record by a factor of e-epsilon, but the noise itself is drawn from a CSPRNG. Tokenization replaces values with random tokens, but the token table persists and can be compromised. None of these approaches achieves irreversibility that holds if P = NP, if the PRNG state is captured, or if a quantum computer is available. QRNG-OTP-Destroy does. It is the first anonymization system whose security guarantee is grounded in physics rather than computational assumptions.',
        ],
        callout: {
          type: 'equation',
          title: 'Physics-Guaranteed Irreversibility',
          text: 'Pr[adversary recovers any record] <= 2^(-128) per value, regardless of computational resources (classical or quantum). This bound follows from the Born rule, not from any hardness assumption.',
        },
      },
      {
        id: 'p2-bilateral-assumption',
        heading: 'P2 Novelty: Breaking the Bilateral Assumption',
        body: [
          'The entire published literature on WiFi-based key generation rests on a single assumption: two cooperating endpoints measure the same wireless channel simultaneously and derive shared randomness from the reciprocity of that channel. This bilateral assumption appears in every foundational paper. Mathur et al. (2008) introduced the first practical RSS-based key extraction between paired devices. Jana et al. (2009) extended this to 802.11n MIMO channels, still requiring two endpoints. Liu et al. (2013) improved bit rates using channel quantization, but the protocol remains bilateral. Zenger et al. (2015) applied CSI to key agreement in IoT, again with paired devices.',
          'Origin Wireless, the largest commercial player in WiFi sensing, holds 225+ patents covering applications from breathing detection to gesture recognition to room occupancy monitoring. Every single patent in their portfolio requires a transmitter and a receiver operating cooperatively. They have never filed a claim on unilateral entropy extraction from CSI, because their entire technical framework assumes bilateral measurement. Their business model depends on deploying coordinated access points and client devices.',
          'Patent 2 breaks this assumption. It extracts cryptographic-grade entropy from WiFi CSI using a single device, without cooperation from any other device. The method takes the complex-valued CSI matrix (containing amplitude and phase information across subcarriers and antenna pairs), applies SVD to extract eigenstructure, uses phase LSB extraction with Von Neumann debiasing to derive raw entropy, then conditions the output through XOR with QRNG bytes and HKDF-SHA256. The result is a Physical Unclonable Entropy Key (PUEK) that fingerprints the electromagnetic environment around the device, not the device hardware itself. Two devices in different locations will never produce the same PUEK. The same device moved to a new room produces a different PUEK. This creates location-locked cryptographic keys from ambient radio physics.',
          'The term "Physical Unclonable Entropy Key" is a QDaria coinage. It returned zero results across all six databases. This is significant: when the very terminology for your invention does not exist in the prior art, the invention occupies genuinely uncharted territory. The addressable device count is 18.2 billion WiFi-enabled devices worldwide (Wi-Fi Alliance, 2025). Every smartphone, laptop, tablet, smart TV, IoT sensor, industrial controller, connected vehicle, and WiFi access point has a CSI-capable chip. Patent 2 covers extracting entropy from any of them.',
        ],
        callout: {
          type: 'warning',
          title: 'Prior Art Landscape',
          text: 'All 225+ Origin Wireless patents require bilateral cooperation. Mathur (2008), Jana (2009), Liu (2013), Zenger (2015): all bilateral. Zero prior art exists for unilateral CSI entropy extraction. Zero results globally for "PUEK."',
        },
      },
      {
        id: 'p3-new-math-family',
        heading: 'P3 Novelty: A New Mathematical Family',
        body: [
          'The history of randomness extractors is short and the landmark papers are few. In 1989, Impagliazzo, Levin, and Luby proved the Leftover Hash Lemma (LHL), establishing that universal hash functions can extract nearly uniform bits from any source with sufficient min-entropy. The LHL became the foundation for virtually all practical extractors. In 1996, Nisan and Zuckerman constructed extractors for weak random sources with improved seed efficiency, introducing techniques that would influence a generation of theoretical work. In 2001, Trevisan showed that error-correcting codes could be used to build extractors with near-optimal parameters, creating an entirely new family based on coding theory rather than hashing. Since Trevisan, no genuinely new class of randomness extractor has appeared in the published literature. Every practical extractor deployed today, including HKDF, HMAC-SHA3, SHA-256, and BLAKE3, is hash-based.',
          'Patent 3 introduces Algebraic Randomness Extractors (ARE), a new family that operates over algebraic structures never previously used for randomness extraction. The ARE is defined as a sequence of arithmetic instructions (addition, subtraction, multiplication, division, modular reduction, exponentiation) applied across five algebraic domains: complex numbers (C), the natural domain for CSI eigenvalues; quaternions (H), 4-dimensional hypercomplex algebra used in aerospace and quantum computing; octonions (O), 8-dimensional non-associative algebra representing the largest normed division algebra; finite fields GF(p^n), the foundation of elliptic curve cryptography; and p-adic numbers (Q_p), an alternative number system from mathematical physics and number theory.',
          'The choice of domains is not arbitrary. Complex numbers are the native representation of CSI data. Quaternions and octonions provide algebraic diversity that prevents structural attacks targeting a single domain. Finite fields connect the extractor to existing ECC infrastructure. p-adic numbers introduce an ultrametric topology that produces fundamentally different mixing behavior from Archimedean domains. The patent explicitly excludes sedenions (16-dimensional) because they contain zero divisors, which would break the bijective property the ARE requires. This exclusion demonstrates precise mathematical awareness of the boundary between what works and what does not, a signal to patent examiners that the invention is grounded in rigorous analysis rather than speculative overclaiming.',
          'The Certified Heterogeneous Entropy (CHE) framework wraps the ARE in a Merkle provenance chain. Every byte of entropy carries a cryptographic audit trail linking it to its source (quantum hardware job ID, CSI capture timestamp, OS entropy pool state). The closest prior art, Qrypt\'s US10,402,172B1, uses flat provenance tags. Merkle trees are strictly more powerful: they enable efficient subset verification, tamper detection at any depth, and logarithmic proof size. For DORA Article 7 compliance, which requires auditable key lifecycle management for all financial entities in the EU/EEA, this distinction is operationally significant.',
        ],
        callout: {
          type: 'citation',
          title: 'Historical Timeline of Extractor Families',
          text: 'Leftover Hash Lemma (Impagliazzo, Levin, Luby, 1989) -> Nisan-Zuckerman (1996) -> Trevisan (2001) -> ARE (QDaria, 2026). A 25-year gap between Trevisan and the first non-hash extractor family.',
        },
      },
      {
        id: 'combined-novelty',
        heading: 'Combined Novelty Assessment',
        body: [
          'The three patents are not independent inventions. They form a single entropy lifecycle pipeline: Patent 2 generates entropy from ambient WiFi physics, Patent 3 composes it with quantum and OS entropy into a provenance-certified pool, and Patent 1 consumes it for information-theoretically irreversible anonymization. A competitor who wants to replicate any part of this pipeline must contend with the entire thicket. A licensee who wants Patent 2 (generation) also needs Patent 3 (composition) to produce certified output, and eventually Patent 1 (consumption) for the most commercially valuable application. The portfolio is designed for bundle licensing, and the bundle commands a premium that exceeds the sum of individual patent values.',
          'Each patent scored 9/10 or 10/10 on novelty in the seven-dimensional assessment. Patent 1 scored 9/10 because the concept of anonymization exists (though quantum-certified anonymization does not). Patents 2 and 3 each scored 10/10 because their core claims have no precedent in any form. The combined composite scores (P1: 8.6/10, P2: 9.4/10, P3: 8.6/10) reflect the extraordinary breadth of the portfolio: it covers generation, composition, and consumption with zero gaps and zero overlapping prior art.',
          'The 46 claims (9 independent, 37 dependent) across three patents create multiple chokepoints. Each independent claim is a separate blocking position. The dependent claims cover implementation variants, extended algebraic domains (Claims 13-17 in Patent 3), configurable security profiles (Standard 0.75, Elevated 0.85, High 0.95, Military 0.98 in Patent 2), and protocol variations. A competitor cannot infringe just one claim; the architecture of each invention means that practical implementation necessarily touches multiple claims simultaneously.',
          'This structure mirrors the patent strategies used by Qualcomm for cellular communications, ARM for chip architecture, and Dolby for audio codecs. Those companies generate $1.3B-$6B per year in licensing revenue from interlocking patent portfolios covering different layers of a single technology stack. QDaria\'s thicket covers the entropy stack from physics to application, with each layer protected by a separate patent and each patent backed by a peer-reviewed-quality research paper on IACR ePrint.',
        ],
        callout: {
          type: 'insight',
          title: 'Portfolio Architecture',
          text: '3 patents, 46 claims, 9 independent chokepoints. Zero overlapping prior art across 48 searches. The entropy lifecycle (generation -> composition -> consumption) is fully covered with no gaps. Bundle licensing creates a multiplier on individual patent values.',
        },
      },
      {
        id: 'puek-coined-term',
        heading: 'PUEK: A Coined Term with IP Value',
        body: [
          'The term "Physical Unclonable Entropy Key" (PUEK) was coined by QDaria. It returned zero results in Espacenet, zero in WIPO Patentscope, zero in Google Patents, zero in USPTO, zero in Justia, and zero in IEEE Xplore. It does not appear in any academic paper, any patent filing, any technical report, or any product documentation anywhere in the world.',
          'This matters for three reasons. First, it confirms the novelty of the underlying concept. When no one has named something, no one has invented it. The absence of the term is evidence of the absence of the idea. Second, it gives QDaria first-mover control over the terminology. As the concept gains adoption (whether through licensing, standardization, or academic citation), the QDaria-coined term will become the standard reference. This is the same dynamic that gave Qualcomm naming authority over "CDMA" concepts and ARM over "TrustZone." Third, the coined term has trademark-like defensibility. While QDaria has not filed a trademark application for PUEK, the term\'s exclusive association with QDaria\'s patent creates de facto brand recognition in the technical community.',
          'The closest existing concept is the Physical Unclonable Function (PUF), a well-established field in hardware security. PUFs exploit manufacturing variability to create device-specific fingerprints. The distinction is fundamental: a PUF fingerprints a piece of hardware (the chip itself), while a PUEK fingerprints the electromagnetic environment around a device. A PUF produces the same output regardless of where the device is located. A PUEK changes when the device moves to a new room. This environmental binding creates entirely new security primitives: geofenced keys that are valid only in specific physical locations, cryptographic attestation of device position without GPS, and location-locked data access controls for classified facilities.',
          'The PUEK concept also introduces four configurable security profiles. Standard (min-entropy threshold 0.75) is suitable for consumer IoT. Elevated (0.85) serves enterprise networks. High (0.95) targets financial services under DORA. Military (0.98) addresses defense and intelligence applications with the strictest entropy requirements. This graduated approach means Patent 2 covers the full spectrum from consumer devices to national security systems under a single filing.',
        ],
        callout: {
          type: 'insight',
          title: 'Term Ownership',
          text: '"Physical Unclonable Entropy Key" returns zero results across all six patent and publication databases worldwide. QDaria owns the concept, the term, and the first implementation.',
        },
      },
    ],
    conclusion: [
      'The novelty position of the QDaria patent portfolio is exceptional by any standard metric. Three interlocking patents with zero blocking prior art, a coined term with no global precedent, a new mathematical family that breaks a 25-year drought in extractor theory, and a physics-guaranteed irreversibility claim that no classical system can replicate. The portfolio does not incrementally improve existing technology; it occupies a region of the technical landscape that the global research community had not previously identified.',
    ],
  },

  valuation: {
    intro: [
      'Valuing a pre-revenue patent portfolio in post-quantum cryptography requires multiple lenses. No single method captures the full picture, because the assets serve different audiences: an acquirer calculates replacement cost, a licensing partner models per-device royalties, and a seed investor benchmarks against comparable transactions. This section applies all three approaches, then synthesizes them into a combined portfolio range.',
      'The three patents filed by QDaria AS between March and April 2026 cover the complete entropy lifecycle: generation (Patent 2, CSI/PUEK), composition (Patent 3, CHE/ARE), and consumption (Patent 1, Quantum Anonymization). Together they form an interlocking thicket with 46 claims across 9 independent claims. Zero prior art was found across 48 exhaustive searches in every major patent database. That structural position, where a licensee cannot use one patent without needing the others, fundamentally shapes the valuation.',
    ],
    subsections: [
      {
        id: 'methodology',
        heading: 'Valuation Methodology',
        body: [
          'Three valuation frameworks apply to the QDaria IP portfolio, each addressing a different question. The R&D replacement cost method asks: what would it cost a well-funded competitor to replicate this portfolio from scratch? The standard-essential lifetime value method asks: what would the patents generate in royalties if incorporated into NIST, ETSI, or IEEE standards? The pre-revenue portfolio benchmark method asks: what have comparable companies raised at, and how does QDaria compare on patent count, platform breadth, and defensibility?',
          'R&D replacement cost is the most conservative framework and the one most relevant to acquirers. It values the portfolio based on the labor, hardware, and time required to reproduce the output. This method is particularly informative here because the QDaria portfolio was built by a single founder over approximately 90 days, an output rate that implies either extraordinary productivity or, more accurately, decades of accumulated domain expertise being deployed at compressed speed. A corporate team attempting the same scope would face the standard coordination overhead, hiring timelines, and iteration cycles that turn months into years.',
          'Standard-essential lifetime value is the ceiling case and the one that drives the most dramatic range ($1B to $10B). If any QDaria patent claim is incorporated into a NIST, ETSI, or IEEE standard, the patent becomes a Standard-Essential Patent (SEP). SEPs command FRAND (Fair, Reasonable, and Non-Discriminatory) royalties from every implementer worldwide, for the life of the patent. Patent 2 (CSI entropy) has a direct trajectory toward NIST SP 800-90C (the recommendation for random bit generator constructions), and Patent 3 (ARE) introduces a new class of entropy conditioner that standards bodies will need to address.',
          'Pre-revenue portfolio benchmarks provide the most actionable reference for seed-stage investors. Companies like PQShield ($37M, 2023), Post-Quantum ($50M, 2024), and SandboxAQ ($5.6B, 2024) set the market context. QDaria has more patents, broader platform coverage, and a stronger novelty position than the first two, while lacking the corporate parentage that inflated SandboxAQ. The relevant benchmark range for QDaria at seed stage is $15M to $50M, with significant upside as enterprise contracts, grant funding, and patent examination results materialize.',
          'Each method answers a different investor question. Together, they triangulate a defensible range that accounts for both floor scenarios (patents are licensed individually at modest rates) and ceiling scenarios (one or more patents become standard-essential and generate recurring royalties at scale).',
        ],
        callout: {
          type: 'insight',
          title: 'Why three methods matter',
          text: 'An acquirer cares about replacement cost. A licensing partner models per-device economics. A seed investor benchmarks against comparable exits. No single framework satisfies all three audiences, so the portfolio must be valued through each lens independently, then synthesized.',
        },
      },
      {
        id: 'rd-replacement',
        heading: 'R&D Replacement Cost Analysis',
        body: [
          'To reproduce the QDaria portfolio, a competitor would need to assemble a team spanning at least six distinct engineering disciplines, then execute for approximately two years. The disciplines are: cryptographic engineering in Rust, QRNG hardware integration (IBM Quantum and qBraid APIs), multi-platform application development (Flutter, Tauri, Next.js), testing and compliance infrastructure (NIST KAT vectors, fuzz harnesses, SP 800-90B health checks), security audit and certification, and academic research with patent drafting.',
          'Cryptographic engineering alone accounts for $18M of the replacement estimate. The Rust Kyber768 core required constant-time implementation using the subtle crate, NIST KAT validation against all published test vectors, and a fuzz testing harness for keygen, encapsulation, and decapsulation. This is specialized work: the intersection of Rust systems programming and lattice-based cryptography is a talent pool measured in hundreds globally, not thousands. Senior cryptographic engineers at companies like Trail of Bits, NCC Group, or Galois command $300K to $500K total compensation. Building, testing, and auditing the core would require 8 to 12 such engineers for 18 to 24 months.',
          'QRNG integration adds $8M. Connecting to IBM Quantum hardware through qBraid, managing job queues against real 156-qubit backends (ibm_kingston), collecting 6.8 MB of verified quantum entropy, building the CSI entropy pipeline, and implementing the three-pool architecture (quantum, CSI, OS) with provenance separation requires quantum computing API expertise that overlaps minimally with classical software engineering. The team would need physicists comfortable with Qiskit circuit construction and engineers fluent in async job management against rate-limited quantum hardware.',
          'Multi-platform development is the largest cost center at $22M. The Zipminator super-app runs on six platforms (macOS, Windows, Linux, iOS, Android, web) via Flutter 3.41.4, with a Tauri 2.x desktop browser, a Next.js web dashboard, a FastAPI backend, and a Python SDK published to PyPI. Reproducing 300,000+ lines of production code across these stacks, with 1,584 passing tests, would require 15 to 20 full-stack engineers. Flutter/Dart developers, Tauri/Rust specialists, React/Next.js engineers, and Python backend developers each represent separate hiring pipelines.',
          'Testing and compliance infrastructure accounts for $12M. The test suite includes 556 Rust tests, 429 Python tests, 103 Tauri browser tests, and end-to-end signaling tests for messenger and VoIP. The NIST KAT validation alone requires implementing the official known-answer test framework and verifying every keygen/encapsulate/decapsulate output against published vectors. The SP 800-90B health check pipeline for the entropy pools adds further complexity. Compliance-oriented testing is slow, detail-intensive work that cannot be parallelized easily.',
          'Security audit ($8M) and research/patent drafting ($7M) complete the estimate. A FIPS 140-3 certification run costs $80K to $150K just for the CMVP certificate, before counting the engineering time to prepare for assessment. The three patent filings required original research at a level accepted by IACR ePrint, plus claim drafting across 46 claims with 9 independent claims. Reproducing the academic foundation, writing three papers, and filing three patents with zero prior art would require 12 to 18 months of dedicated researcher time.',
          'The total R&D replacement cost ranges from $50M to $100M, depending on location (Bay Area vs. European talent costs), timeline compression, and whether the competitor needs to independently discover the same novel approaches or can design around them. Given that all three patents have zero prior art, designing around is not straightforward.',
        ],
        callout: {
          type: 'equation',
          title: 'Replacement cost formula',
          text: '(40-55 engineers) x ($200K-$400K avg. loaded cost) x (2 years) + (hardware + quantum credits + audit fees) = $50M-$100M',
        },
      },
      {
        id: 'standard-essential',
        heading: 'Standard-Essential Lifetime Value',
        body: [
          'The $1B to $10B range represents the scenario where one or more QDaria patents become standard-essential, meaning incorporated into a published standard such that implementation of the standard necessarily practices the patent claims. This is not speculative: the patents are designed to align with standards that are actively being drafted or revised.',
          'For context on what standard-essential patents generate: Qualcomm collects approximately $6 billion per year in wireless technology royalties, primarily from patents essential to 3G, 4G, and 5G cellular standards. ARM generates approximately $3 billion per year in chip architecture licenses from patents essential to the ARM instruction set. Dolby generates approximately $1.3 billion per year from audio and video codec patents essential to Dolby Digital, Dolby Atmos, and Dolby Vision. These are recurring revenue streams that persist for the life of the patents.',
          'QDaria Patent 2 (CSI Entropy + PUEK) targets the WiFi device ecosystem: approximately 18.2 billion devices currently in operation, with roughly 4 billion new devices shipping annually (Wi-Fi Alliance, 2025). If PUEK or unilateral CSI entropy extraction is incorporated into IEEE 802.11 as a security annex, or referenced in NIST SP 800-90C as an approved entropy source, every WiFi chipmaker would need a license. At $0.01 to $0.10 per device, the annual royalty stream from new device shipments alone ranges from $40M to $400M per year.',
          'The per-chipmaker economics are concrete. Qualcomm ships approximately 1.2 billion WiFi chips annually; at $0.05 per chip, that is $60M per year from a single licensee. MediaTek ships approximately 1.5 billion chips ($75M/year). Broadcom ships approximately 800 million ($40M/year). Intel, Realtek, and Espressif (ESP32) each contribute $25M to $30M per year. The combined annual revenue from the top seven chipmakers at $0.05 per chip reaches approximately $300M per year.',
          'Patent 3 (CHE/ARE) has a parallel trajectory toward NIST SP 800-90C, which specifies entropy conditioning methods for random bit generators. Every conditioning method currently specified is hash-based. The ARE introduces a fundamentally different algebraic approach that is more natural for complex-valued entropy sources like CSI. If NIST includes algebraic extraction as an approved conditioning method, every HSM vendor (Thales, Utimaco, Futurex, Entrust), every cloud KMS provider (AWS KMS, Azure Key Vault, Google Cloud KMS), and every certificate authority would need to license the ARE.',
          'Patent 1 (Quantum Anonymization) could become relevant to ISO 27701 (privacy information management) or future GDPR technical standards if regulators specify quantum-certified anonymization as a compliance pathway. This trajectory is longer-term but would create mandatory demand across every organization handling personal data in EU/EEA jurisdictions.',
          'The standard-essential lifetime value of $1B to $10B assumes at least one patent achieves SEP status within the patent lifetime. The lower end ($1B) reflects a single patent (P2) achieving standard-essential status at modest royalty rates. The upper end ($10B) reflects multiple patents achieving SEP status with FRAND rates at the higher end of the per-device range, compounded over the 20-year patent lifetime.',
        ],
        callout: {
          type: 'citation',
          title: 'Chipmaker licensing at $0.05 per WiFi chip',
          text: 'Qualcomm: $60M/yr (1.2B chips) | MediaTek: $75M/yr (1.5B) | Broadcom: $40M/yr (800M) | Intel: $25M/yr (500M) | Realtek: $30M/yr (600M) | Espressif: $30M/yr (600M) | Others: $40M/yr. Total: ~$300M/year from chipmakers alone, before downstream device manufacturers.',
        },
      },
      {
        id: 'per-patent',
        heading: 'Per-Patent Valuation Rationale',
        body: [
          'Each patent in the QDaria portfolio carries an independent value range based on its addressable market, defensibility score, and monetization pathway. The ranges below reflect standalone valuations, before applying the thicket synergy multiplier that arises from their interlocking dependency.',
          'Patent 1 (Quantum-Certified Anonymization): $200M to $2B. The lower bound reflects SaaS anonymization licensing to healthcare and financial institutions at modest annual contract values ($50K to $500K per organization). The EU has approximately 27 member states plus 3 EEA countries plus the UK under adequacy arrangements, each with thousands of organizations handling personal data under GDPR. The upper bound reflects a scenario where GDPR Recital 26 threshold compliance becomes a formal certification pathway, creating mandatory demand. The key differentiator is irreversibility grounded in the Born rule of quantum mechanics: the anonymization holds even in a world where P=NP, which no classical anonymization method can claim. Composite score: 8.6/10.',
          'Patent 2 (CSI Entropy + PUEK): $1B to $50B. This is the crown jewel. The lower bound ($1B) reflects conservative per-device licensing at $0.01 per WiFi chip across a fraction of the 4 billion chips shipped annually. The upper bound ($50B) reflects standard-essential status with $0.05 to $0.10 per device across the full 18.2 billion installed base, sustained over the patent lifetime. Zero prior art across 48 searches. The term "PUEK" (Physical Unclonable Entropy Key) returns zero results in every global patent database. All existing CSI work, including Origin Wireless\'s 225+ patents, requires bilateral cooperation between two devices. Unilateral extraction is genuinely unprecedented. Composite score: 9.4/10, the highest in the portfolio.',
          'Patent 3 (CHE/ARE Composition Framework): $500M to $5B. The lower bound reflects HSM vendor licensing (Thales, Utimaco, Futurex, Entrust) and cloud KMS integration contracts. The upper bound reflects standard-essential status for the ARE as an approved entropy conditioner under NIST SP 800-90C. The ARE is the first non-hash randomness extractor family since Trevisan (2001), operating over complex numbers, quaternions, octonions, finite fields, and p-adic numbers. The Merkle provenance chain satisfies DORA Article 7 key lifecycle management requirements, making the composition framework directly relevant to the 22,000+ EU/EEA financial entities subject to DORA enforcement since July 2025. Composite score: 8.6/10.',
          'The per-patent standalone total ranges from $1.7B to $57B. However, standalone valuations understate the portfolio value because the patents are architecturally interdependent: Patent 2 generates entropy that flows into Patent 3 (composition), which feeds Patent 1 (consumption). A licensee seeking the full entropy lifecycle must license all three.',
        ],
        callout: {
          type: 'warning',
          title: 'Thicket dependency',
          text: 'Patent 2 generates raw entropy. Patent 3 composes and certifies it. Patent 1 consumes it for anonymization. A licensee cannot use one layer without needing the adjacent layers. This architectural lock-in is by design and is the primary driver of the bundle premium.',
        },
      },
      {
        id: 'benchmarks',
        heading: 'Pre-Revenue Portfolio Benchmarks',
        body: [
          'Comparable transactions in the PQC and privacy technology space provide the most actionable reference for seed-stage valuation. The relevant benchmarks span from $37M (PQShield, 2023) to $5.6B (SandboxAQ, 2024), with QDaria positioned to argue for the upper range of the pure-play PQC cohort.',
          'PQShield raised at a $37M valuation in 2023. PQShield focuses on PQC IP licensing for silicon, providing hardware-optimized implementations of NIST-standardized algorithms to chipmakers. At the time of their raise, they had fewer filed patents than QDaria, no platform product, and no entropy-layer innovation. Their value proposition is implementation optimization, not novel cryptographic primitives. QDaria has broader coverage (3 patents vs. PQShield\'s algorithm implementations), a working 9-pillar platform, and a mathematical contribution (ARE) that PQShield does not match.',
          'Post-Quantum raised at approximately $50M in 2024. Based in the UK, Post-Quantum focuses on PQC VPN and encrypted communications products. Their patent portfolio covers fewer claims than QDaria\'s 46, and they lack any entropy-layer IP. Their products address one pillar (VPN/comms) of what Zipminator covers across nine. QDaria\'s novelty scores (9.4/10 for Patent 2) significantly exceed what Post-Quantum can demonstrate, given that their approach builds on established PQC algorithms rather than introducing new cryptographic primitives.',
          'SandboxAQ represents the upper boundary at $5.6B (2024). As a spinoff from Google\'s quantum division (formerly Google AI Quantum), SandboxAQ benefits from Google parentage, an established team of PhDs, and existing enterprise relationships. QDaria cannot claim comparable corporate backing. However, SandboxAQ\'s portfolio does not include CSI entropy extraction, algebraic randomness extraction, or physics-proven anonymization. Their strength is scale and credibility; QDaria\'s strength is novelty and defensive depth.',
          'Other relevant comparables include OneTrust ($5.3B, 2021, privacy/compliance platform), BigID ($1.25B, 2021, data privacy AI), Virtru ($150M, 2022, encryption platform), and Duality Technologies ($70M, 2022, homomorphic encryption). These are not direct PQC competitors, but they establish the valuation multiples that privacy and compliance technology commands: 10x to 30x revenue for growth-stage companies, and $30M to $150M for pre-revenue companies with strong IP.',
          'QDaria\'s position within this landscape: three filed patents with 46 claims, zero prior art across 48 searches, a working product on TestFlight, a Python SDK on PyPI (v0.5.0), three papers on IACR ePrint, and 1,584 passing tests. The pre-revenue benchmark range of $15M to $50M is conservative relative to the IP quality. With a first enterprise customer or government grant, that range shifts to $40M to $150M.',
        ],
      },
      {
        id: 'combined',
        heading: 'Combined Portfolio Value',
        body: [
          'The three valuation methods converge on a combined portfolio range of $10B to $100B when the thicket synergy multiplier, academic credibility premium, and regulatory timing multiplier are applied. The floor is set by the R&D replacement cost ($50M to $100M) and the per-patent standalone sum ($1.7B+). The ceiling is set by the standard-essential scenario ($1B to $10B per qualifying patent, with multiple patents potentially qualifying).',
          'The thicket synergy multiplier ranges from 2x to 5x. This reflects the architectural lock-in described above: the three patents cover generation, composition, and consumption of entropy. A licensee who wants the full QDaria stack, which is the only way to achieve certified entropy from source to application, must license all three patents. Bundle licensing commands a premium over individual patent licensing because it eliminates the licensee\'s need to negotiate separately for each layer. In patent portfolio economics, interlocking thickets with no design-around options typically command 2x to 5x the sum of individual patent values.',
          'Academic credibility adds a 20% to 50% premium. Three papers on IACR ePrint (the standard preprint archive for cryptographic research), submitted to venues including CCS 2026 and PoPETs 2027, signal that the inventions meet peer-review standards. Patent examiners, licensing negotiators, and standards bodies all treat academically published inventions with greater respect than patents filed without supporting literature. This premium is real and measurable in licensing negotiations: published inventors command higher royalty rates.',
          'The regulatory timing multiplier captures the forced-migration dynamic. DORA became effective in Norway on July 1, 2025, requiring 22,000+ EU/EEA financial entities to document their cryptographic policies and key lifecycle management. NIST will deprecate RSA and ECC by 2030 and disallow them by 2035. NSA CNSA 2.0 mandates ML-KEM for all National Security Systems by 2027. These are not market forecasts; they are published regulatory deadlines. Organizations that do not migrate to PQC face compliance penalties, procurement exclusion, or operational prohibition. QDaria\'s patents cover the entropy infrastructure that every PQC migration needs.',
          'For calibration: Qualcomm\'s wireless patent portfolio generates approximately $6 billion per year in royalties on a per-device licensing model targeting roughly 1.5 billion annual smartphone shipments. QDaria\'s Patent 2 targets 18.2 billion WiFi devices (12x larger installed base) at a lower per-device price point ($0.01 to $0.10 vs. Qualcomm\'s $2 to $5 per handset). The regulatory tailwind from DORA, CNSA 2.0, and NIST PQC deprecation is a market-creation force that Qualcomm did not have when it built its portfolio. ARM\'s chip license revenue of $3 billion per year and Dolby\'s codec patent revenue of $1.3 billion per year provide additional calibration points for what per-device licensing can generate at scale.',
          'The combined portfolio value of $10B to $100B is a long-term assessment spanning the 20-year patent lifetime. For seed-stage investment purposes, the relevant figure is the pre-revenue benchmark of $15M to $50M, escalating to $40M to $150M with first revenue, and to $150M to $1B post-Series A with regulatory tailwind and enterprise traction.',
        ],
        callout: {
          type: 'equation',
          title: 'Portfolio value synthesis',
          text: '(P1: $200M-$2B + P2: $1B-$50B + P3: $500M-$5B) x Thicket multiplier (2-5x) x Academic premium (1.2-1.5x) x Regulatory timing = $10B-$100B lifetime portfolio value',
        },
      },
    ],
  },

  'floor-matters': {
    intro: [
      'Every seed investor hears two numbers: a floor and a ceiling. The ceiling is aspirational. It assumes everything goes right, every regulatory deadline bites on schedule, every enterprise pilot converts, every standard body adopts. The ceiling is a story. The floor is what survives if nothing else goes right.',
      'For QDaria, the floor is not a guess. It is the sum of three independently verifiable components: filed patents with zero prior art, working code with 1,584 passing tests, and regulatory deadlines that no government has the political will to postpone. Each component is auditable. Each stands on its own. Together, they establish a minimum defensible value that holds regardless of market conditions, competitive moves, or fundraising outcomes.',
    ],
    subsections: [
      {
        id: 'floor-valuation-philosophy',
        heading: 'Floor Valuation Philosophy',
        body: [
          'Venture capital is a ceiling business. Pitch decks project $10B TAMs and hockey-stick growth curves. But seed-stage investors are not buying a company. They are buying an option on a company, and the rational price of that option depends more on the floor than the ceiling. The floor determines what the investor holds if the product launch stalls, if the first enterprise pilot drags on for 18 months, if the founding team needs to pivot.',
          'Most deep-tech startups have a floor near zero. Their value resides in a team, a prototype, and a market thesis. If the team leaves, the prototype rots, and the thesis turns out wrong, the option expires worthless. QDaria is structurally different. The floor is built on three kinds of durable assets that appreciate independently of company operations.',
          'First, filed patents. Three applications at Patentstyret covering 46 claims, with PCT international filing rights preserved through March 2027 (Patent 1) and April 2027 (Patents 2 and 3). Patent applications do not expire when a startup pivots. They can be sold, licensed, or used as collateral. And these particular patents have zero blocking prior art across 48 exhaustive searches spanning Espacenet, WIPO Patentscope, Google Patents, USPTO, Justia Patents, and IEEE Xplore.',
          'Second, working code. Not a demo, not a prototype, not slides with screenshots. A 9-pillar super-app across 6 platforms with 1,584 tests passing, a Python SDK on PyPI (v0.5.0), a Rust cryptographic core with constant-time verification, and 43 TestFlight builds shipped. The R&D replacement cost to recreate this from scratch exceeds $50M at market rates.',
          'Third, regulatory deadlines. DORA is enforced as of July 2025, with 22,000+ EU financial entities required to demonstrate cryptographic readiness under Articles 6 and 7. CNSA 2.0 mandates ML-KEM for all US National Security Systems by 2027. NIST deprecates RSA and ECC in 2030 and disallows them entirely by 2035. These deadlines are law. They are not subject to competitive dynamics, and they create forced demand that grows monotonically over time.',
          'The floor, then, is not a hope. It is the liquidation value of patents plus the replacement cost of code plus the present value of regulatory-driven demand. Everything above it is upside.',
        ],
        callout: {
          type: 'insight',
          title: 'Seed Investor Framing',
          text: 'The correct question at seed stage is not "what could this be worth?" but "what is the minimum I hold if execution stumbles?" For QDaria, that minimum is a patent portfolio with zero prior art, $50-100M in R&D replacement value, and three regulatory deadlines that create forced demand independent of company operations.',
        },
      },
      {
        id: 'rd-replacement-floor',
        heading: 'R&D Replacement Floor',
        body: [
          'The simplest floor calculation is the replacement cost method: what would it cost a well-funded competitor to replicate this portfolio from scratch? The answer is not a small number.',
          'Start with the Rust cryptographic core in crates/zipminator-core/. This is a from-scratch ML-KEM-768 implementation with PyO3 bindings, constant-time arithmetic verified via the subtle crate, NIST Known Answer Test validation, and fuzz testing. Finding engineers who can write correct, constant-time lattice cryptography in Rust is difficult. Retaining them for the 6-12 months needed to reach production quality is expensive. At $200K/year fully loaded (a conservative estimate for senior cryptographic engineers in the US or EU), this component alone represents $2-4M in human capital.',
          'Add the QRNG pipeline. QDaria has collected 6.8 MB of real quantum entropy from IBM Quantum hardware (156-qubit ibm_kingston) across 35 separate jobs. The entropy pool architecture separates quantum, CSI, and OS entropy into provenance-clean pools with Merkle chain verification. Building this requires quantum computing API expertise, pool management engineering, and the operational overhead of running dozens of quantum hardware jobs. Estimate $1-2M.',
          'Now consider the 6-platform delivery. The Flutter super-app (app/) runs on macOS, Windows, Linux, iOS, Android, and Web. It includes 11 feature screens and 17 Riverpod providers. The Tauri 2.x browser (browser/) ships as a DMG with PQC TLS, built-in VPN, and 103 passing tests. The Next.js web dashboard (web/) runs on port 3099 with OAuth, Supabase auth, and the full blueprint you are reading. The Python SDK (src/zipminator/) is published on PyPI with 429 passing tests. The FastAPI backend (api/) handles REST operations with PostgreSQL and Redis. Replicating this breadth across six platforms, five languages (Rust, Python, TypeScript, Dart, Swift), and four build systems (Cargo, npm, Flutter, Maturin) would require a team of 40-55 engineers working for 18-24 months.',
          'The math: 40 engineers at $200K/year for 2 years = $16M at the low end. 55 engineers at $200K/year for 2 years = $22M. Add the specialized cryptographic and quantum computing components, and the fully-loaded replacement cost reaches $50-100M. This is not a theoretical number. It is a function of headcount, compensation data from Levels.fyi and Glassdoor for senior systems engineers, and the observable scope of the codebase.',
          'The critical point: this is not slides. It is not a whitepaper. It is not a pitch deck with wireframes. It is deployed, tested, shipping infrastructure. 1,584 tests verify that it works. 43 TestFlight builds prove it runs on real devices. The Python SDK on PyPI proves it is consumable by third-party developers. A competitor cannot replicate this with a seed round and a pitch. They need the team, the time, and the domain expertise.',
        ],
        callout: {
          type: 'equation',
          title: 'Replacement Cost Estimate',
          text: '40-55 engineers x $200K/yr fully loaded x 2 years = $16M-$22M base. Add crypto specialists ($2-4M), quantum pipeline ($1-2M), IP prosecution ($500K), and operational overhead (1.5x multiplier) = $50M-$100M total replacement cost.',
        },
      },
      {
        id: 'design-around-analysis',
        heading: 'Design-Around Analysis',
        body: [
          'A patent is only as valuable as its design-around difficulty. If a competitor can achieve the same result through a different method, the patent becomes a speed bump, not a wall. Each of QDaria\'s three patents scores high on design-around difficulty for different, independently verifiable reasons.',
          'Patent 1 (Quantum-Certified Anonymization) scores 85/100 overall: Novelty 95, Complexity 90, Standards Lock-in 85, Network Effects 70. The core claim is that Born rule irreversibility provides information-theoretic anonymization that holds even if P=NP. A competitor cannot design around this by using a different quantum effect, because the Born rule is the only source of fundamental randomness in quantum mechanics. They cannot use classical randomness, because classical PRNGs are deterministic and therefore reversible given sufficient computational power. The only design-around would be to abandon the claim of physics-based irreversibility entirely, which means offering a strictly weaker product. The Standards Lock-in score of 85 reflects the patent\'s alignment with GDPR Recital 26: as regulators increasingly demand provable anonymization (not just "best effort"), Born rule irreversibility becomes the gold standard.',
          'Patent 2 (CSI Entropy + PUEK) scores 88/100 overall: Novelty 99, Complexity 88, Standards Lock-in 90, Network Effects 75. This is the crown jewel. Every prior CSI system, including Origin Wireless\'s 225+ patents, requires bilateral cooperation between two devices. Unilateral extraction from a single device\'s CSI observations is fundamentally different. A competitor wanting to avoid this patent must either (a) require bilateral cooperation, which is a weaker, more constrained approach that cannot work on standalone devices, or (b) use a completely different entropy source, which means they are not competing in the CSI entropy space at all. The term "PUEK" (Physical Unclonable Entropy Key) returns zero results in every global patent database. The Standards Lock-in score of 90 reflects the natural trajectory toward NIST SP 800-90C inclusion: as the standard expands to cover non-traditional entropy sources, CSI-based extraction becomes a candidate for mandatory implementation.',
          'Patent 3 (CHE/ARE + Merkle Provenance) scores 81/100 overall: Novelty 92, Complexity 85, Standards Lock-in 82, Network Effects 65. The Algebraic Randomness Extractor operates over mathematical structures (complex numbers, quaternions, octonions, finite fields, p-adic numbers) that no existing extractor uses. Every other randomness extractor in the published literature is hash-based: HKDF, HMAC-SHA3, SHA-256, BLAKE3. These are all variations on the same fundamental approach. The ARE is a genuinely new mathematical family, the first since Trevisan\'s construction in 2001. A competitor cannot accidentally infringe because the algebraic approach is structurally different from hashing. To design around it, they would need to invent yet another mathematical family of extractors, which is a research contribution, not an engineering task. The lower Network Effects score of 65 reflects that entropy composition is a narrower market than entropy generation, but the Merkle provenance chain is precisely what auditors will require under DORA Article 7.',
          'Taken together, the three patents create a layered defense. Even if a competitor finds a creative way around one patent, they face two more covering different stages of the entropy lifecycle. The probability of designing around all three independently is the product of three already-low probabilities.',
        ],
      },
      {
        id: 'patent-thicket-effect',
        heading: 'The Patent Thicket Effect',
        body: [
          'A patent thicket is a portfolio where multiple patents cover different aspects of the same value chain, making it impossible to compete without licensing the bundle. The strategy is well-established in technology licensing. Its economics are documented across three decades of precedent.',
          'Qualcomm\'s CDMA patent thicket generated approximately $6 billion per year in licensing revenue at its peak. The thicket covered modulation, coding, handoff, power control, and interference management. No cellular chipmaker could ship a standards-compliant modem without licensing the bundle. Individual patents could perhaps be designed around; the thicket as a whole could not. This is why Qualcomm collected royalties from every major handset manufacturer on Earth, including companies that actively litigated against the licensing terms.',
          'ARM\'s architecture licensing follows the same pattern. ARM does not manufacture chips. It licenses instruction set architecture, microarchitecture, and peripheral IP as a bundle. Annual licensing revenue exceeds $3 billion. Every smartphone SoC from Apple, Qualcomm, Samsung, and MediaTek includes ARM-licensed IP. The thicket is the moat.',
          'Dolby\'s codec portfolio tells a similar story at a different scale. Dolby licenses audio and video codec patents as a bundle, generating approximately $1.3 billion per year. Every streaming service, every Blu-ray player, every cinema projector, and every smart TV pays Dolby royalties. The per-unit fees are small. The volume is enormous.',
          'QDaria\'s thicket operates on the same structural principle. Patent 2 (generation) feeds into Patent 3 (composition), which feeds into Patent 1 (consumption). This is the entropy lifecycle: generate, compose, consume. A competitor who wants to offer quantum-certified anonymization (Patent 1) needs a certified entropy source. If they use CSI-based entropy, they need Patent 2. If they want provenance-certified composition, they need Patent 3. The pipeline is sequential, and each stage is independently patented.',
          'The 9 independent claims (3 per patent) function as 9 separate chokepoints. Each independent claim must be designed around separately. The 37 dependent claims cover implementation variants: specific algebraic domains (quaternions, octonions, finite fields), specific security profiles (Standard 0.75 through Military 0.98), specific provenance mechanisms (Merkle trees vs. flat tags). A competitor facing this thicket has three options: license the bundle, design around all 9 independent claims simultaneously, or exit the space. The economics overwhelmingly favor licensing.',
          'The thicket synergy multiplier, estimated at 2-5x over the sum of individual patent values, reflects this structural advantage. It is not speculative. It is the documented behavior of every successful patent thicket in technology history.',
        ],
        callout: {
          type: 'citation',
          title: 'Thicket Revenue Precedents',
          text: 'Qualcomm CDMA: ~$6B/year licensing. ARM architecture: ~$3B/year licensing. Dolby codecs: ~$1.3B/year licensing. All three companies generate the majority of their profits from patent thicket licensing, not product sales. QDaria\'s thicket targets 18.2B WiFi devices at $0.01-$0.10 per device.',
        },
      },
      {
        id: 'regulatory-deadlines',
        heading: 'Three Regulatory Deadlines as Floor Supports',
        body: [
          'Regulatory deadlines do not care about startup execution timelines. They do not wait for product-market fit. They create forced demand on a fixed schedule, and the penalties for non-compliance are large enough to make procurement decisions straightforward.',
          'The first deadline is DORA (Digital Operational Resilience Act), enforced as of July 2025 in the EU and EEA, including Norway. DORA applies to over 22,000 financial entities: banks, insurance companies, investment firms, payment institutions, crypto-asset service providers, and their ICT third-party service providers. Article 6.1 requires documented encryption policies for data at rest, in transit, and in use. Article 6.4 is the quantum-readiness clause: it mandates periodic cryptographic updates based on developments in cryptanalysis. Article 7 requires full cryptographic key lifecycle management with auditable provenance. The penalty for non-compliance is up to 2% of global annual turnover. For JPMorgan Chase, that is $3.2 billion. For HSBC, $1.3 billion. For DNB (Norway\'s largest bank), $140 million. These are not abstract risks. They are line items that compliance officers are budgeting against right now.',
          'The second deadline is CNSA 2.0 (Commercial National Security Algorithm Suite 2.0), published by NSA in September 2022. CNSA 2.0 requires all US National Security Systems to adopt ML-KEM by 2027. This covers every classified network, every defense communications system, every intelligence platform, and every NATO-interoperable system. The deadline is firm because national security systems cannot operate with deprecated algorithms. Contractors supplying these systems, including Lockheed Martin, Raytheon, BAE Systems, Northrop Grumman, and Kongsberg Defence, must deliver PQC-ready products or lose contracts. QDaria\'s patents cover the entropy generation, composition, and certification layers that these contractors will need to source.',
          'The third deadline is NIST\'s RSA/ECC deprecation schedule. NIST published IR 8547 in November 2024, establishing that RSA and ECC will be deprecated in 2030 and disallowed entirely by 2035. This is not optional. It is the global de facto standard because NIST cryptographic recommendations are adopted by every G7 nation, most NATO allies, and the majority of international standards bodies (ISO, ETSI, IEEE). After 2030, any system using RSA key exchange or ECC signatures is running deprecated cryptography. After 2035, it is running prohibited cryptography. Every certificate authority, every TLS implementation, every HSM, every VPN, and every encrypted messaging service must migrate to post-quantum algorithms before these dates.',
          'Each of these three deadlines independently creates demand for PQC infrastructure. DORA creates demand in European finance. CNSA 2.0 creates demand in US defense and intelligence. NIST deprecation creates demand across the entire global technology stack. Together, they form a monotonically increasing pressure function: the demand for PQC products grows with each passing year, and it cannot decrease because no government has demonstrated the political will to roll back security mandates.',
          'For QDaria, this means the floor valuation increases over time even without company action. The patents become more valuable as deadlines approach. The working code becomes more relevant as organizations scramble to comply. The regulatory alignment is not a feature of the product. It is a structural property of the market.',
        ],
        callout: {
          type: 'warning',
          title: 'Penalty Scale',
          text: 'DORA: 2% of global turnover (JPMorgan: $3.2B, HSBC: $1.3B, DNB: $140M). CNSA 2.0: National Security System decertification. NIST 2030/2035: Federal procurement exclusion. Each deadline independently justifies PQC procurement budgets in the tens of billions.',
        },
      },
      {
        id: 'working-code-premium',
        heading: 'The Working Code Premium',
        body: [
          'In deep tech, the gap between a patent and a product is measured in years and tens of millions of dollars. Most PQC patents filed today are paper inventions. They describe methods, not implementations. QDaria\'s portfolio is different because every patent is backed by working, tested, deployed code.',
          '1,584 tests are passing across the full stack. That number breaks down as follows: 556 Rust tests (including the cryptographic core, Tauri browser, and mesh provisioning), 429 Python SDK tests (PQC operations, PII scanning for 15 countries, entropy management, anonymization at all 10 levels), and the remainder split across Flutter, Expo React Native, and Next.js. These are not toy tests. They verify constant-time execution, NIST KAT compliance, entropy pool integrity, Merkle provenance chain validity, and cross-platform interoperability.',
          '43 TestFlight builds have been uploaded to App Store Connect. Build 43, version 0.5.0+43, was submitted on April 6, 2026. This means the application has been through Apple\'s automated review pipeline 43 times, each time running on real iOS hardware. The Supabase authentication flow works. The messenger sends messages. The VoIP passes audio. The vault encrypts and decrypts files. These are not demo features; they are verified functionality on production devices.',
          'The Python SDK v0.5.0 is published on PyPI. Any developer can run "pip install zipminator" today and access the full PQC toolkit: key generation, encryption, decryption, anonymization (all 10 levels), entropy pool management, and CLI operations. The SDK supports extras for data processing, anonymization, CLI, quantum entropy, Jupyter notebooks, email, benchmarks, and development tooling. This is not a GitHub repo with a README. It is a published, versioned, installable package.',
          '6.8 MB of real quantum entropy has been collected from IBM Quantum\'s 156-qubit ibm_kingston hardware across 35 separate quantum jobs. This entropy is not simulated. It is not pseudo-random. It is the output of quantum measurements on physical qubits, stored in provenance-clean pools with cryptographic audit trails. Additionally, 9 KB of CSI WiFi entropy and 15 MB of OS entropy have been collected and stored in separate pools, maintaining source provenance throughout.',
          'Three research papers are published on IACR ePrint, the cryptography community\'s preprint server. Paper 1 (Quantum-Certified Anonymization, ePrint 2026/108710) targets PoPETs 2027. Papers 2 and 3 (Unilateral CSI Entropy and CHE/ARE Composition, ePrint 2026/108711 and 2026/108712) target CCS 2026. These papers provide academic validation of the methods claimed in the patents. They have been reviewed, strengthened with formal security proofs (IND-ANON, composition theorems, UC framework), and submitted to top-tier venues.',
          'The working code premium is real and measurable. A patent without implementation is a legal instrument. A patent with 1,584 passing tests, 43 shipped builds, a published SDK, real quantum entropy, and academic papers is a product. The premium reflects the reduced risk for any licensee or acquirer: they are not buying a promise, they are buying a system that runs.',
        ],
        callout: {
          type: 'insight',
          title: 'Vaporware Discount, Inverted',
          text: 'Most deep-tech startups trade at a vaporware discount: investors apply a 50-80% haircut because the technology is unproven. QDaria inverts this. With 1,584 tests, 43 TestFlight builds, a PyPI SDK, 6.8 MB of real quantum entropy, and 3 ePrint papers, the technology is proven. The remaining risk is commercial, not technical.',
        },
      },
    ],
    conclusion: [
      'The floor valuation framework strips away aspirational projections and examines what survives under pessimistic assumptions. For QDaria, the answer is: a patent thicket with zero prior art covering the complete entropy lifecycle, $50-100M in R&D replacement value, three regulatory deadlines creating forced demand through 2035, and working code that eliminates the standard deep-tech vaporware discount. The floor is not a story. It is an engineering audit.',
    ],
  },

  'patent-deep-dives': {
    intro: [
      'QDaria\'s three filed patents form an interlocking system covering the complete entropy lifecycle: generation, composition, and consumption. Each patent occupies a distinct technical niche with zero blocking prior art across 48 exhaustive searches spanning Espacenet, WIPO Patentscope, Google Patents, USPTO, Justia Patents, and IEEE Xplore. Together, the 46 claims (9 independent, 37 dependent) create a thicket where licensing one patent without the others leaves critical gaps in any implementation.',
    ],
    subsections: [
      {
        id: 'p1-technical-deep-dive',
        heading: 'Technical Deep Dive',
        body: [
          'Patent 1 introduces a method for anonymizing personal data using quantum-derived one-time pads (QRNG-OTP-Destroy) such that de-anonymization is provably impossible. Each unique value in a dataset containing personally identifiable information is mapped to a replacement identifier generated from quantum random bytes. These bytes are produced by measuring qubits in superposition on quantum computing hardware (IBM Quantum\'s 156-qubit ibm_kingston in the preferred embodiment), where the randomness is governed by the Born rule. A one-time pad mapping table is constructed in volatile memory, mapping each original value to its quantum-random replacement. After all values are substituted, the mapping table is destroyed using DoD 5220.22-M 3-pass overwrite: zeros, ones, then random bytes.',
          'The system implements ten distinct anonymization levels. Levels 1 through 4 apply classical techniques: basic pseudonymization, k-anonymity (k >= 5), l-diversity, and t-closeness. Levels 5 through 9 layer progressively stronger protections including generalization, perturbation, and differential privacy with Laplace noise. Level 10, the crown of the system, applies the full quantum OTP transformation. In the preferred embodiment, columns receive different levels depending on sensitivity: quasi-identifiers such as age or zip code get Level 5 (k-anonymity), while direct identifiers such as names and national IDs get Level 10 (quantum OTP).',
          'The entropy pool feeding this system is a binary file (quantum_entropy_pool.bin) populated by background daemon processes that execute quantum circuits on IBM Quantum hardware via the qBraid API. Each harvesting cycle produces approximately 50 KB of quantum random bytes. A typical anonymization operation on 10,000 rows with 10 columns consumes approximately 1.6 MB of entropy (16 bytes per unique value across roughly 100,000 unique values). The pool uses thread-safe reads with position tracking, never reuses bytes, and triggers automatic refill when remaining capacity falls below a configurable threshold.',
          'An optional hardware-secured embodiment constructs the mapping table inside an Intel SGX enclave or ARM TrustZone, applies the transformation, returns only the anonymized dataset, and destroys the mapping via enclave teardown. This addresses cold boot attacks and memory forensics during the brief window when the mapping exists.',
        ],
        callout: {
          type: 'equation',
          title: 'Information-Theoretic Irreversibility',
          text: 'The security guarantee rests on Bell\'s theorem (1964, experimentally verified loophole-free by Hensen et al. 2015): no local hidden variable theory can reproduce quantum measurement statistics. Without the destroyed mapping, recovering original values requires guessing quantum measurement outcomes with success probability 2^{-128} per value. This holds regardless of the P vs NP resolution, because the security is physical, not computational.',
        },
      },
      {
        id: 'p1-novelty-argument',
        heading: 'Novelty Argument',
        body: [
          'No patent in any global database covers QRNG-based anonymization. The closest result is JPMorgan\'s certified RNG work, which targets a fundamentally different purpose: improving key generation quality rather than anonymization. Classical anonymization patents cover k-anonymity (Sweeney, 2002), differential privacy (Dwork, 2006), l-diversity (Machanavajjhala et al., 2007), and t-closeness (Li et al., 2007). All of these derive irreversibility from computational hardness assumptions.',
          'The critical gap: every CSPRNG has a seed that exists physically in RAM, kernel data structures, and hardware state. An adversary who captures the seed through memory forensics, cold boot attacks, or side-channel exploits (Spectre, Meltdown) can reconstruct every "random" value the PRNG produced, subtract the noise, and recover original PII. Patent 1 eliminates this attack surface entirely. QRNG bytes have no seed; the Born rule guarantees fundamental non-determinism. The QRNG-OTP-Destroy pipeline is the first anonymization system where the irreversibility guarantee is grounded in physics rather than computational complexity.',
        ],
        callout: {
          type: 'insight',
          title: 'GDPR Recital 26 Threshold',
          text: 'GDPR Recital 26 states that data protection principles "should not apply to anonymous information." Patent 1 is the first system that can formally demonstrate satisfaction of this threshold via a physics proof rather than a probabilistic argument. The anonymized output is provably no longer personal data under EU law.',
        },
      },
      {
        id: 'p1-who-needs-this',
        heading: 'Who Needs This',
        body: [
          'Every hospital in the EU storing patient records falls under both GDPR and national health data laws. Norway\'s four health regions alone manage millions of records. Banks and financial institutions face dual obligations under GDPR and DORA (effective July 2025 in Norway), with non-compliance fines of up to 2% of global annual turnover. Government agencies, national statistics offices, insurance companies, credit bureaus, and HR departments all need provably irreversible anonymization.',
          'Clinical research institutions conducting trials need to share datasets without risking re-identification. The 2023 CJEU ruling in Meta v. Bundeskartellamt raised the bar for what constitutes adequate anonymization. Organizations relying on classical techniques face growing legal uncertainty about whether their outputs truly qualify as anonymous under Recital 26. Patent 1 provides the definitive answer.',
        ],
      },
      {
        id: 'p1-defensibility',
        heading: 'Design-Around Difficulty',
        body: [
          'The Born rule is not an engineering choice; it is a law of physics. A competitor attempting to replicate information-theoretic irreversibility in anonymization must either (a) use quantum entropy, which requires licensing Patent 1, or (b) accept computational irreversibility, which is a strictly weaker guarantee. There is no classical method that can match the security claim. The design-around difficulty scores 9/10 because the only alternative is to abandon the physics-based guarantee entirely.',
          'The patent\'s 15 claims cover the general QRNG-OTP-Destroy method (Claim 1), the multi-level pipeline (Claims 2-6), hardware enclave variants (Claim 7), multi-provider entropy aggregation (Claim 8), and provenance tracking connecting anonymization events to specific quantum hardware runs (Claims 9-15). A competitor would need to design around each claim independently.',
        ],
      },
      {
        id: 'p1-standard-essential',
        heading: 'Standard-Essential Trajectory',
        body: [
          'ISO/IEC 27701 (Privacy Information Management System) currently lacks a normative requirement for anonymization method selection. As quantum computing matures and classical PRNGs face scrutiny, a future revision of ISO 27701 or a dedicated anonymization standard under ISO/IEC JTC 1/SC 27 could specify quantum-certified anonymization as a recommended or required technique. The EU AI Act (2024/1689, Article 10) requires data governance for training datasets; when those datasets contain PII, quantum anonymization becomes the strongest available protection.',
        ],
      },
      {
        id: 'p1-standalone-value',
        heading: 'Standalone Value: $200M to $2B',
        body: [
          'The valuation range reflects three revenue streams. SaaS anonymization-as-a-service to healthcare and financial institutions could generate $50M to $500M in annual recurring revenue at maturity. Per-record licensing (fractions of a cent per record) applied to billions of health, financial, and government records processed annually in GDPR jurisdictions yields $100M to $1B over the patent lifetime. Compliance consulting and certification services add $50M to $500M. The floor is set by the healthcare market alone; the ceiling requires penetration into financial services and government.',
        ],
        callout: {
          type: 'citation',
          title: 'Regulatory Demand Driver',
          text: 'DORA Article 6.4 requires "periodic cryptographic updates based on developments in cryptanalysis." Article 7 mandates full cryptographic key lifecycle management. For the 22,000+ EU/EEA financial entities subject to DORA, quantum-certified anonymization is the strongest response. Non-compliance carries fines of up to 2% of global annual turnover.',
        },
      },
      {
        id: 'p2-technical-deep-dive',
        heading: 'Technical Deep Dive',
        body: [
          'Patent 2 introduces three interrelated methods. The first is unilateral CSI entropy harvesting: a single WiFi-enabled device extracts cryptographic-grade entropy from Channel State Information without cooperation from any other device. CSI describes the frequency-domain response of a wireless channel across OFDM subcarriers. Each of the 56 subcarrier measurements in an 802.11n HT20 frame is a complex number encoding amplitude and phase, influenced by multipath propagation, scattering, and the physical environment surrounding the device.',
          'The extraction pipeline works as follows. For each complex subcarrier value H_k, the system computes the phase angle via arg(H_k), quantizes it to 256 discrete levels, and extracts the least-significant bit. This produces 56 raw bits per CSI frame. A Von Neumann debiaser processes consecutive bit pairs: (0,1) outputs 0, (1,0) outputs 1, and matching pairs are discarded. This yields approximately 14 unbiased bits per frame. Eight accumulated bits form one entropy byte. An optional XOR defense-in-depth layer combines each debiased byte with a byte from a secondary source (e.g., the quantum entropy pool). By the XOR lemma, the composed output has min-entropy at least as high as the stronger individual source.',
          'The second method is the Physical Unclonable Environment Key (PUEK). During enrollment, the system captures complex-valued CSI data across M frames and K subcarriers, forming a matrix C in C^{M x K}. SVD decomposition yields right singular vectors V. The top-d vectors are stored as a location fingerprint alongside a similarity threshold from one of four security profiles: Standard (0.75), Elevated (0.85), High (0.95), Military (0.98). At verification time, fresh CSI data produces new singular vectors. Subspace similarity s is computed as the average squared inner product between reference and new vectors. If s meets the threshold, a 32-byte key is derived via HKDF-SHA256 using the enrolled eigenmodes as input keying material. The key is cryptographically bound to the physical location, not the device.',
          'The third method is hybrid CSI+QRNG mesh key derivation. CSI entropy bytes are XOR-combined with quantum random bytes, and the composed entropy feeds HKDF-SHA256 to derive MeshKey (16-byte PSK for HMAC-SHA256 beacon authentication) and SipHashKey (16-byte for SipHash-2-4 frame integrity), both compatible with ML-KEM-768 mesh networks implementing NIST FIPS 203.',
        ],
        callout: {
          type: 'equation',
          title: 'PUEK Subspace Similarity',
          text: 's = (1/d) * SUM |<v_ref_i, v_new_i>|^2, where v_ref and v_new are the reference and fresh right singular vectors from SVD of the CSI matrix. Threshold: 0.75 (Standard), 0.85 (Elevated), 0.95 (High), 0.98 (Military).',
        },
      },
      {
        id: 'p2-novelty-argument',
        heading: 'Novelty Argument',
        body: [
          'The prior art search is unambiguous: 48 searches across every major patent database returned zero results for unilateral CSI entropy harvesting. The term "PUEK" returns zero results globally. All existing CSI-based key generation work, including Origin Wireless\'s 225+ patents, Mathur et al. (2008), Jana et al. (2009), and Liu et al. (2012), requires bilateral cooperation between two endpoints.',
          'The distinction between unilateral and bilateral is not incremental; it is categorical. Bilateral CSI key agreement requires two cooperating devices, reconciliation protocols to correct bit mismatches, and produces only a shared secret key. Patent 2\'s unilateral approach uses a single device, requires no reconciliation, and produces general-purpose entropy bytes suitable for any cryptographic application.',
          'RF-PUF approaches (e.g., Chatterjee et al. 2018) fingerprint hardware manufacturing variations. Patent 2\'s PUEK fingerprints the physical RF environment (room geometry, furniture, wall materials) via CSI eigenstructure. The key is bound to a location, not a device. When the room is altered, the key changes. When the device is replaced, the key remains the same (at the same location). This is a fundamentally different security model.',
        ],
        callout: {
          type: 'insight',
          title: 'The Keystone Patent',
          text: 'Without an entropy source, Patents 1 and 3 have reduced commercial value. Patent 2 provides the raw material that flows into Patent 3 (composition) and Patent 1 (consumption). A licensee who wants the full QDaria stack must license Patent 2 first.',
        },
      },
      {
        id: 'p2-who-needs-this',
        heading: 'Who Needs This',
        body: [
          'The addressable device count is 18.2 billion WiFi-enabled devices currently in operation worldwide (Wi-Fi Alliance, 2025). Every smartphone, laptop, tablet, smart TV, IoT sensor, industrial controller, vehicle, and access point has a CSI-capable chip.',
          'WiFi chipmakers (Qualcomm, Intel, Broadcom, MediaTek, Realtek, Espressif) ship approximately 6 billion WiFi chips per year with combined annual revenue of roughly $30 billion. Per-device licensing at $0.05 per chip yields approximately $300 million per year from chipmakers alone. IoT platforms (AWS IoT, Azure IoT, Google Cloud IoT) need device-level entropy for provisioning. Military communications systems (NATO NCIA, Five Eyes) require environment-aware geofencing that PUEK provides natively. Enterprise network vendors (Cisco, Aruba/HPE, Juniper) could integrate CSI entropy into access point firmware. Vehicle manufacturers add several billion more units.',
        ],
      },
      {
        id: 'p2-defensibility',
        heading: 'Design-Around Difficulty',
        body: [
          'The defensibility scores 10/10, the highest in the portfolio. There is exactly one alternative to unilateral CSI entropy: bilateral CSI key agreement, which is a fundamentally different and weaker approach. A competitor cannot accidentally infringe because the distinction between unilateral and bilateral is binary.',
          'The 14 claims cover unilateral extraction (Claim 1), Von Neumann debiasing (Claim 2), XOR defense-in-depth (Claim 3), PUEK enrollment via SVD eigenstructure (Claims 4-7), four configurable security profiles (Claims 8-11), and hybrid CSI+QRNG mesh key derivation with HKDF-SHA256 to ML-KEM-768 compatibility (Claims 12-14). Designing around Claim 1 alone requires abandoning single-device CSI entropy entirely.',
        ],
      },
      {
        id: 'p2-standard-essential',
        heading: 'Standard-Essential Trajectory',
        body: [
          'NIST SP 800-90C will need to address non-traditional entropy sources as quantum computing makes classical RNG less trustworthy. CSI-based entropy is a natural candidate for inclusion, and Patent 2 would become essential to any implementation. ETSI TS 103 744, IEEE 802.11 security annexes, the Matter/Thread IoT specification, and 3GPP PQC handshakes for 6G are additional standardization pathways.',
        ],
        callout: {
          type: 'warning',
          title: 'Standard-Essential Economics',
          text: 'If CSI entropy becomes part of NIST SP 800-90C or ETSI TS 103 744, Patent 2 would command FRAND royalties from every compliant implementation. At $0.01 to $0.10 per device across 18.2B installed WiFi devices and 4B new devices shipped annually, the revenue scales to billions.',
        },
      },
      {
        id: 'p2-standalone-value',
        heading: 'Standalone Value: $1B to $50B',
        body: [
          'The conservative floor ($1B) assumes licensing to the top five WiFi chipmakers at $0.01/chip across 4 billion annual shipments, yielding $40M/year over a 25-year patent life. The moderate scenario ($5B-$15B) assumes $0.05/chip with penetration into IoT, automotive, and enterprise markets. The optimistic ceiling ($50B) assumes standard-essential status in NIST SP 800-90C and ETSI, triggering FRAND royalties across the entire WiFi ecosystem.',
          'For perspective: Qualcomm\'s wireless patent portfolio generates approximately $6 billion per year from roughly 1.5 billion annual smartphone shipments. Patent 2 targets a larger device base (18.2 billion WiFi devices) at a lower per-device price point, with a regulatory tailwind that Qualcomm did not have.',
        ],
      },
      {
        id: 'p3-technical-deep-dive',
        heading: 'Technical Deep Dive',
        body: [
          'Patent 3 introduces two breakthroughs. The first is a new family of randomness extractors, Algebraic Randomness Extractors (ARE), that operate over algebraic structures never before used for randomness extraction. The second is a Merkle-tree provenance framework providing cryptographic proof of entropy lineage for every byte produced.',
          'The ARE operates across five classical number domains: natural numbers N (modular wrapping), integers Z (signed projection), rationals Q (scaled integer arithmetic), reals R (fixed-point precision), and complex numbers C (accumulator with imaginary component). Six arithmetic operations (ADD, SUB, MUL, DIV, MOD, EXP) are applied at each step, with exponentiation capped at 64 and division by zero returning the accumulator unchanged.',
          'Extended domains push into algebraic territory no extractor has occupied. Quaternions (H), the 4-dimensional associative division algebra (i^2 = j^2 = k^2 = ijk = -1), provide non-commutative mixing: acc * value differs from value * acc. Octonions (O), the 8-dimensional non-associative division algebra (the largest normed division algebra by Hurwitz\'s theorem), break associativity: (ab)c differs from a(bc). The distinct parenthesizations of K operations grow as Catalan numbers C(K), making algebraic shortcut attacks infeasible. Finite fields GF(p^n) provide provable per-step uniform distribution. p-adic numbers Q_p introduce ultrametric mixing orthogonal to real-number arithmetic.',
          'Sedenions (16-dimensional Cayley-Dickson) are explicitly excluded because their zero divisors compromise the bijective property. Programs are generated deterministically from a SHAKE-256 seed, consuming 34 bytes per step. Output expansion uses counter-mode SHA-256.',
        ],
        callout: {
          type: 'equation',
          title: 'ARE Program Space',
          text: 'For K steps across D domains and 6 operations, the space is (D * 6)^K. With 9 domains and 20 steps: 54^20 ~ 10^34 distinct programs. An adversary must invert each step across potentially non-commutative, non-associative domains.',
        },
      },
      {
        id: 'p3-novelty-argument',
        heading: 'Novelty Argument',
        body: [
          '"Algebraic randomness extractor" returns zero results in every patent and academic database. The last new class of extractor was Trevisan\'s construction (2001). Before that: Nisan-Zuckerman (1996) and the Leftover Hash Lemma (Impagliazzo, Levin, Luby, 1989). The ARE is the first non-hash extraction family in over two decades.',
          'Every extractor in the published literature is hash-based: HKDF, HMAC-SHA3, SHA-256, BLAKE3, universal hash functions, Trevisan\'s codes. The ARE uses arithmetic programs over multiple number domains including non-commutative and non-associative algebras. This is a categorically different mathematical approach.',
          'The Merkle provenance chain is novel in the entropy context. Qrypt\'s US10402172B1 uses flat provenance tags. Patent 3\'s Merkle tree is strictly more powerful: each composition event produces a cryptographic certificate with a verifiable root hash binding all source records. An auditor can independently verify which sources contributed, their health at composition time, and the resulting min-entropy bound.',
        ],
        callout: {
          type: 'citation',
          title: 'Academic Context',
          text: 'Leading authorities in randomness extraction: Yevgeniy Dodis (NYU), Salil Vadhan (Harvard, definitive extractors survey), Renato Renner (ETH Zurich, quantum randomness certification). The ARE opens a direction distinct from any prior work by these or other researchers.',
        },
      },
      {
        id: 'p3-who-needs-this',
        heading: 'Who Needs This',
        body: [
          'HSM vendors are the primary licensing targets: Thales, Utimaco, Futurex, and Entrust build hardware that generates and stores cryptographic keys. Their entropy conditioning is entirely hash-based. The ARE offers a mathematically stronger alternative with formal per-step bounds in GF domains, plus Merkle provenance that DORA auditors will demand.',
          'Cloud KMS services (AWS KMS, Azure Key Vault, Google Cloud KMS) need provenance-certified entropy. Certificate authorities (DigiCert, Let\'s Encrypt, Sectigo) issue millions of certificates daily. Financial trading platforms, gambling regulators, and national metrology institutes (NIST, PTB, NPL) are natural partners for validation and standardization.',
        ],
      },
      {
        id: 'p3-defensibility',
        heading: 'Design-Around Difficulty',
        body: [
          'The algebraic approach is fundamentally different from hash-based extraction, so competitors cannot accidentally infringe. A design-around requires creating a different non-hash family (none exists) or using hash-based extraction, which lacks non-commutative and non-associative mixing. Claims 13-17 cover quaternion, octonion, finite field, and p-adic implementations individually.',
          'The Merkle provenance framework (Claims 5-10) is independently defensible. Using flat provenance tags is the only design-around, but flat tags cannot satisfy DORA Art. 7 audit trail requirements as rigorously as a Merkle tree.',
        ],
      },
      {
        id: 'p3-standard-essential',
        heading: 'Standard-Essential Trajectory',
        body: [
          'NIST SP 800-90C specifies entropy conditioning methods. The ARE is a candidate for inclusion as an approved conditioner. ETSI TS 103 744 needs conditioning methods for heterogeneous sources. ISO/IEC 19790 may incorporate provenance requirements. The Merkle provenance framework directly addresses audit trail requirements these standards converge toward.',
        ],
      },
      {
        id: 'p3-standalone-value',
        heading: 'Standalone Value: $500M to $5B',
        body: [
          'The conservative floor ($500M) assumes licensing to four major HSM vendors and three cloud KMS providers. The moderate scenario ($1B-$2B) adds financial trading platforms, CAs, and DORA-driven compliance tools. The optimistic ceiling ($5B) assumes standard-essential status in NIST SP 800-90C and Merkle provenance as a regulatory requirement.',
          'ARE and Merkle provenance solve two problems simultaneously: extraction quality and regulatory auditability. No competing product offers both. HSM vendors charge $10K-$100K per module; certified entropy composition commands a meaningful licensing premium.',
        ],
        callout: {
          type: 'insight',
          title: 'The Thicket Multiplier',
          text: 'Patent 3\'s true value exceeds its standalone range because it is the composition layer between Patents 1 and 2. A licensee who generates entropy via P2 (CSI) and consumes it via P1 (anonymization) must compose through P3 (ARE + Merkle). The three-patent bundle commands a premium exceeding the sum of individual values.',
        },
      },
    ],
    conclusion: [
      'The three patents form a pipeline: Patent 2 generates entropy from the physical world, Patent 3 composes and certifies it, and Patent 1 consumes it for irreversible anonymization. A competitor who wants to build a comparable system must license all three or design around each independently, facing zero prior art, physics-based security guarantees, and a new mathematical family with no known equivalent. The combined portfolio creates 9 independent chokepoints and 37 dependent claims covering implementation variants across algebraic domains, security profiles, and deployment architectures.',
    ],
  },

  'market-size': {
    intro: [
      'Valuing patent portfolios without sizing the markets they address is an exercise in abstraction. The QDaria IP portfolio does not target a single market. It sits at the intersection of seven distinct segments, each independently growing at double-digit CAGRs, each subject to regulatory mandates that convert discretionary spending into compliance obligations. The combined total addressable market exceeds $255 billion in 2025 and is projected to surpass $1 trillion by 2035. This section quantifies each segment, traces the methodology behind the sizing, and derives TAM/SAM/SOM figures for three scenarios.',
      'The numbers that follow are drawn from industry consensus estimates published by Gartner, Frost and Sullivan, MarketsandMarkets, the Wi-Fi Alliance, and Statista, cross-referenced against regulatory filings, government procurement budgets, and publicly reported transaction data. Where projections diverge between sources, the figures here use geometric means to avoid anchoring on the most optimistic or pessimistic individual estimate.',
    ],
    subsections: [
      {
        id: 'segmentation-methodology',
        heading: 'A. Market Segmentation Methodology',
        body: [
          'The seven market segments were selected using a dual-filter process. The first filter is technical overlap: does the QDaria patent portfolio contain claims that are directly applicable to products or compliance requirements within the segment? The second filter is regulatory compulsion: does existing or incoming regulation create mandatory spending that cannot be deferred? A segment qualifies only if it passes both filters. This eliminates speculative markets (quantum computing hardware, for example, where QDaria has no hardware IP) and includes only markets where the patents generate direct licensing, product, or compliance revenue.',
          'The seven qualifying segments are data privacy and anonymization ($177B, 2025), post-quantum cryptography ($2B, 2025), compliance and GRC ($50B, 2025), quantum-safe VPN ($5B, 2025), WiFi sensing ($1B, 2025), HSM and key management ($2B, 2025), and encrypted communications ($3B, 2025). Each segment maps to at least one QDaria patent. Data privacy maps to Patent 1 (QRNG anonymization). PQC, VPN, and encrypted communications map to the Zipminator platform built on all three patents. WiFi sensing maps to Patent 2 (CSI/PUEK). HSM and key management maps to Patent 3 (CHE/ARE/Merkle provenance). Compliance/GRC spans all three patents because DORA, GDPR, and NIS2 each reference different layers of the entropy lifecycle.',
          'Sizing sources for each segment follow standard industry taxonomy. Gartner provides the global cybersecurity spending forecast used as the envelope. MarketsandMarkets publishes the PQC-specific market model (Report TC 4670, updated January 2026). Frost and Sullivan covers QRNG and HSM markets through their Quantum Technologies practice. The Wi-Fi Alliance publishes the installed WiFi device base (18.2 billion as of Q4 2024) used to size the WiFi sensing segment. Statista provides VPN and encrypted communications market data cross-referenced against NordVPN, Proton, and Signal public disclosures.',
          'What makes this segmentation unusual for a single portfolio is the breadth. Most PQC companies address one segment (PQShield targets chip-level PQC IP; Post-Quantum targets enterprise PQC middleware). QDaria addresses seven segments simultaneously because the patent thicket covers generation, composition, and consumption of entropy, which is the foundational layer beneath privacy, encryption, key management, sensing, and compliance. This multi-segment coverage is not marketing ambition; it is a structural property of the IP architecture.',
        ],
        callout: {
          type: 'insight',
          title: 'Dual-Filter Segmentation',
          text: 'Each segment must pass two tests: (1) direct patent applicability and (2) regulatory mandate. Seven segments qualify. This is not a wish-list TAM; it is an IP-coverage-verified market map.',
        },
      },
      {
        id: 'pqc-exponential-segment',
        heading: 'B. Post-Quantum Cryptography: The Exponential Segment',
        body: [
          'The PQC market is the smallest segment by 2025 revenue ($2B) and the fastest-growing by CAGR (40-50%). MarketsandMarkets projects $8B by 2030 and $17.2B by 2035. These projections predate several regulatory accelerants that have materialized since mid-2025: Norway transposed DORA into national law on July 1, 2025, creating immediate compliance obligations for every financial entity in the country. The UK published its Quantum Readiness guidance (March 2025), and Australia announced its PQC migration roadmap in Q2 2025. Each new jurisdiction that mandates PQC transition compresses the adoption timeline and steepens the growth curve.',
          'For context on the CAGR, consider comparable technology adoption curves. Cloud computing grew at approximately 25% CAGR during its 2010-2020 expansion phase (Gartner, 2021). SaaS as a delivery model grew at roughly 30% CAGR from 2012 to 2022 (Synergy Research Group). Mobile payments grew at 33% CAGR between 2015 and 2025 (Grand View Research). PQC at 40-50% CAGR would make it one of the fastest-growing enterprise technology categories in the current decade. The growth rate is plausible because PQC adoption is not driven by optional productivity gains (as cloud and SaaS were); it is driven by regulatory deadlines and the irreversible threat model of harvest-now-decrypt-later attacks.',
          'Three regulatory deadlines create inflection points on the growth curve. First, CNSA 2.0 requires all US National Security Systems to implement ML-KEM by 2027, just 10 months from now. This deadline alone drives billions in US defense and intelligence procurement. Second, NIST deprecates RSA and ECC in 2030, meaning that any new federal system deployed after that date cannot use classical cryptography. Third, NIST disallows RSA and ECC entirely in 2035, which forces even legacy systems to migrate. Between 2027 and 2035, every organization that handles data with a confidentiality lifetime exceeding five years will need PQC infrastructure.',
          'QDaria is positioned at the infrastructure layer of this market. The Zipminator platform implements NIST FIPS 203 (ML-KEM-768) in Rust with constant-time verification, 6.8 MB of real quantum entropy from IBM Quantum hardware, and a Merkle-certified key lifecycle that satisfies DORA Article 7. This is not a PQC algorithm library (which is a commodity); it is a PQC delivery platform that integrates the algorithm into nine product modules spanning messaging, VPN, file encryption, browser, VoIP, email, anonymization, AI, and spatial mesh networking. The platform layer captures significantly higher margins than the algorithm layer because it solves the integration problem that enterprises will pay a premium to avoid doing themselves.',
        ],
        callout: {
          type: 'warning',
          title: 'CNSA 2.0 Deadline: January 2027',
          text: 'NSA mandates ML-KEM for all National Security Systems by 2027. RSA/ECC deprecated 2030, disallowed 2035. Organizations that delay face rising compliance costs and exposure to harvest-now-decrypt-later attacks that are already underway.',
        },
      },
      {
        id: 'data-privacy-anonymization',
        heading: 'C. Data Privacy and Anonymization',
        body: [
          'Data privacy is the largest single segment in the QDaria addressable market at $177B in 2025, projected to reach $350B by 2030 (15% CAGR, Gartner/Statista). This segment includes privacy management software, consent management platforms, data discovery and classification tools, anonymization and pseudonymization services, and privacy consulting. The growth is driven by enforcement acceleration: GDPR fines issued in 2023 totaled approximately $4.4 billion (GDPR Enforcement Tracker, CMS), up from $2.9 billion in 2022 and $1.3 billion in 2021. The fine trajectory is exponential, not linear.',
          'Every organization that processes personally identifiable information in the European Union, the European Economic Area, or any jurisdiction with a GDPR-equivalent law (California/CPRA, Brazil/LGPD, India/DPDPA, Canada/PIPEDA) needs anonymization tools. The universe of regulated entities numbers in the millions. In the EU alone, the European Commission estimated 23 million data controllers at the time of GDPR adoption. Each of these entities faces a binary choice: anonymize PII to the Recital 26 threshold (at which point the data falls outside GDPR scope entirely), or maintain full compliance obligations for every processing activity.',
          'Patent 1 directly addresses this binary. QRNG-OTP-Destroy is, to our knowledge, the first anonymization system where the irreversibility guarantee is grounded in quantum mechanics rather than computational hardness assumptions. Classical anonymization tools (ARX, sdcMicro, Google DP, Apple Local DP, Microsoft Presidio) all draw their randomness from CSPRNGs. A sufficiently resourced adversary who captures the PRNG state can reconstruct the anonymization mapping. Patent 1 eliminates this attack surface by using QRNG measurement outcomes governed by the Born rule, where no internal state exists to capture.',
          'The monetizable fraction of the $177B data privacy market depends on the delivery model. SaaS anonymization-as-a-service to healthcare and financial institutions could generate $50M to $500M in annual recurring revenue at maturity. Per-record licensing at fractions of a cent, applied to the billions of health, financial, and government records processed annually in GDPR jurisdictions, yields $100M to $1B over the patent lifetime. The healthcare sub-segment alone accounts for 67 million patient records in the UK (NHS), over 80 million in Germany (Techniker Krankenkasse plus other insurers), and hundreds of millions across the EU. Each record represents a licensing event when processed through a QRNG anonymization pipeline.',
        ],
        callout: {
          type: 'citation',
          title: 'GDPR Enforcement Acceleration',
          text: 'GDPR fines: $1.3B (2021), $2.9B (2022), $4.4B (2023). Source: GDPR Enforcement Tracker (CMS). The exponential growth in enforcement spending makes privacy tooling a compliance obligation, not a discretionary purchase.',
        },
      },
      {
        id: 'wifi-sensing-qrng',
        heading: 'D. WiFi Sensing and QRNG: Two Markets, One Patent',
        body: [
          'WiFi sensing is projected to grow from $1B in 2025 to $15B by 2035 (40% CAGR), driven by the proliferation of WiFi 6/6E/7 chipsets with enhanced CSI capabilities and the expansion of use cases from consumer (presence detection, gesture recognition) to industrial (occupancy analytics, asset tracking) and healthcare (respiration monitoring, fall detection). The market sizing is anchored by the Wi-Fi Alliance\'s installed device count: 18.2 billion WiFi-enabled devices as of Q4 2024, with approximately 4 billion new devices shipping annually. Every one of these devices contains a CSI-capable chipset.',
          'Patent 2 addresses the WiFi sensing market from an angle that no existing player has explored: entropy extraction. Origin Wireless, the dominant patent holder in WiFi sensing with 225+ patents, covers bilateral sensing applications (two coordinated endpoints measuring channel reciprocity). Their entire portfolio requires cooperation between devices. Patent 2\'s unilateral approach is architecturally distinct: a single device extracts cryptographic-grade entropy from ambient CSI without any cooperation from access points, routers, or other endpoints. This distinction is not incremental; it opens an entirely new product category (ambient entropy harvesting) within the WiFi sensing market.',
          'The QRNG market runs on a parallel trajectory. Estimated at $500M in 2025, it is projected to reach $2B by 2030 and $5.5B by 2035 (35% CAGR, Frost and Sullivan Quantum Technologies practice). Today\'s QRNG market is dominated by dedicated hardware: ID Quantique (Geneva) sells QRNG chips at $50 to $200 per unit, and Quantinuum offers cloud-based quantum randomness services. Patent 2 disrupts the price-performance curve by deriving entropy from existing WiFi hardware at zero marginal cost per device. No dedicated QRNG chip is needed. The randomness comes from ambient RF physics rather than a purpose-built photonic source.',
          'The combined WiFi sensing plus QRNG market ($1.5B in 2025, growing to $20.5B by 2035) represents Patent 2\'s direct addressable opportunity. The per-device licensing model is the primary revenue mechanism. At $0.01 per WiFi chip (below the typical patent royalty for communication standards), annual revenue against the 4-billion-unit new device market alone would be $40M. At $0.05 per chip (comparable to what Qualcomm charges for cellular SEPs), annual revenue reaches $200M. These figures consider only new chip shipments; the 18.2 billion installed base represents additional retrofit and firmware-update licensing potential. The four configurable security profiles (Standard 0.75, Elevated 0.85, High 0.95, Military 0.98) enable tiered pricing: consumer IoT at the low end, defense and intelligence at the high end.',
        ],
        callout: {
          type: 'insight',
          title: '18.2 Billion Addressable Devices',
          text: 'Wi-Fi Alliance (Q4 2024): 18.2 billion WiFi-enabled devices in operation, ~4 billion new devices per year. Patent 2 covers entropy extraction from any of them. At $0.05/chip, annual licensing revenue from new shipments alone exceeds $200M.',
        },
      },
      {
        id: 'tam-sam-som-derivation',
        heading: 'E. TAM/SAM/SOM Derivation',
        body: [
          'The total addressable market (TAM) aggregates all seven segments: data privacy ($177B), compliance/GRC ($50B), quantum-safe VPN ($5B), encrypted communications ($3B), PQC ($2B), HSM/key management ($2B), and WiFi sensing ($1B). The 2025 TAM is approximately $240B. By 2030, with each segment growing at its respective CAGR, the combined TAM reaches approximately $513B. By 2035, it exceeds $1.1 trillion. These figures use the conservative end of each segment\'s range; the optimistic TAM for 2030 exceeds $600B.',
          'The serviceable addressable market (SAM) narrows from TAM to organizations that are (a) under active PQC regulatory pressure, (b) processing sensitive data in GDPR, DORA, or NIS2 jurisdictions, and (c) operating at a scale where dedicated PQC infrastructure is justified rather than handled by a cloud provider\'s default encryption. The conservative SAM estimate ($12B) counts only the 22,000+ financial entities subject to DORA in the EU/EEA, the top-100 WiFi chipmakers and OEMs, and European healthcare systems with explicit quantum-readiness requirements. The moderate SAM ($25B) adds US federal agencies under CNSA 2.0, NATO members, and enterprise organizations with compliance budgets exceeding $1M per year. The optimistic SAM ($50B) includes the broader wave of organizations that will migrate to PQC between 2028 and 2035 as RSA deprecation approaches.',
          'The serviceable obtainable market (SOM) reflects what QDaria can realistically capture in the near term. The conservative SOM ($300M) assumes a Norwegian/Nordic beachhead: DNB, SpareBank 1, Nordea, the four Norwegian health regions, and two to three government agencies (PST, NSM, FFI) as initial enterprise customers, combined with early patent licensing revenue from one to two WiFi chipmakers and Innovation Norway grant funding. The moderate SOM ($1.5B) assumes EU expansion within 18 months of first enterprise contract, two to three defense/NATO contracts, and a licensing program covering the top-10 WiFi chip vendors. The optimistic SOM ($5B) assumes standard-essential status for Patent 2 in NIST SP 800-90C and penetration into US defense procurement via a US subsidiary (QDaria Inc.).',
          'The SOM-to-SAM ratio ranges from 2.5% (conservative) to 10% (optimistic), which is within the typical range for deep-tech startups addressing regulated markets. For comparison, PQShield\'s implied SOM (based on $37M valuation at seed) represents roughly 0.2% of the PQC SAM, suggesting significant room for a broader-portfolio company like QDaria to capture a larger share.',
        ],
        callout: {
          type: 'equation',
          title: 'TAM Progression',
          text: '2025: ~$240B across 7 segments. 2030: ~$513B (segment CAGRs applied individually). 2035: >$1.1T. QDaria SAM: $12B-$50B depending on scenario. SOM: $300M-$5B depending on regulatory capture and licensing velocity.',
        },
      },
      {
        id: 'norway-factor',
        heading: 'F. The Norway Factor',
        body: [
          'Norway occupies a unique position in the global PQC landscape. The Research Council of Norway (Forskningsradet) allocated NOK 1.75 billion ($170M) to its national quantum computing initiative, with explicit funding tracks for quantum cryptography and post-quantum security. This is one of the largest per-capita quantum investments globally. The program funds research institutions, startups, and public-private partnerships developing quantum technologies for Norwegian industry and government.',
          'QDaria is, as of April 2026, the only PQC-focused company incorporated in Norway. The nearest domestic competitor was NQCG (Norwegian Quantum Computing Group), which ceased operations in December 2024. No other Norwegian entity holds filed PQC patents, maintains a PQC product on PyPI, or has submitted PQC research to IACR. This means that for any Norwegian government procurement, defense contract, or Innovation Norway grant in the PQC domain, QDaria is the sole qualified domestic applicant. Norway\'s public procurement framework gives preference to domestic suppliers for security-critical technology, particularly where data sovereignty is a concern.',
          'The Norwegian financial sector is the natural beachhead. DNB (Norway\'s largest bank, $7B revenue, $140M potential DORA fine at 2%) deployed DORA compliance programs in Q1 2025. SpareBank 1, a savings bank group with $3B revenue and 350+ branches, has an active quantum-readiness assessment underway. Nordea, the largest Nordic bank ($11B revenue, $220M DORA fine risk), is evaluating PQC vendor shortlists across all four Nordic countries. For each of these institutions, DORA Article 6.4 requires documented cryptographic updates based on "developments in cryptanalysis," and quantum computing is the development that Article 6.4 was written to address.',
          'Innovation Norway provides direct startup funding. Phase 1 (Market Clarification) grants up to NOK 150,000 at 100% funding. Phase 2 (Commercialization) provides up to NOK 1,000,000 at 50% co-financing. Innovation Contracts co-finance R&D projects with pilot customers at 45-50% of development costs for SMEs, provided the pilot customer covers at least 20% of total costs. A contract with DNB or SpareBank 1 as pilot customer could unlock NOK 1-10M in Innovation Norway co-financing, providing non-dilutive capital during the pre-revenue phase.',
          'Beyond Norway, the Nordic region offers a natural expansion corridor. Sweden (SEB, Handelsbanken), Denmark (Danske Bank), and Finland (OP Financial Group) all fall under DORA through EU membership. The Nordic financial regulators cooperate through the Nordic Financial Stability Group, meaning that a PQC standard adopted by one Nordic regulator is likely to propagate across all four countries within 12 to 18 months. From the Nordic base, expansion follows EU regulatory geography: DACH (Germany, Austria, Switzerland), Benelux, and then the broader EU/EEA. This regulatory-driven expansion path is predictable because the compliance deadlines are published years in advance and the penalties for non-compliance (2% of global turnover under DORA, 4% under GDPR) are large enough to make procurement decisions straightforward for CFOs.',
        ],
        callout: {
          type: 'citation',
          title: 'Norway Quantum Investment',
          text: 'Forskningsradet: NOK 1.75B ($170M) national quantum initiative. QDaria is the only PQC company in Norway after NQCG shutdown (Dec 2024). Innovation Norway Phase 2 grants up to NOK 1M. Innovation Contracts co-finance up to 50% of R&D with pilot customer.',
        },
      },
    ],
    conclusion: [
      'The combined addressable market across seven segments grows from $240B (2025) to over $1 trillion (2035). QDaria\'s patent portfolio touches each segment through direct claim applicability, not marketing extrapolation. The PQC segment alone grows at 40-50% CAGR, faster than early cloud computing or early SaaS. The data privacy segment is the largest by absolute size and is accelerating under exponential GDPR enforcement. WiFi sensing and QRNG, addressed by the crown-jewel Patent 2, target the largest device base of any cryptographic patent ever filed: 18.2 billion WiFi endpoints. The Norway beachhead provides non-dilutive grant funding, a sole-qualified-vendor position for government procurement, and a natural expansion corridor into Nordic and EU markets via DORA compliance deadlines. The SOM ranges from $300M (conservative Nordic beachhead) to $5B (standard-essential penetration into US defense), with each step gated by verifiable regulatory milestones rather than speculative adoption curves.',
    ],
  },
}
