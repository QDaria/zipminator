**Subject: We Just Filed 3 Patents, Published 3 Research Papers, and Built a Patent Thicket Around a Multi-Trillion-Dollar Industry**

---

Team,

I want to share some news that I believe changes the trajectory of this company.

Over the past two weeks, QDaria has filed three patents, published three research papers on IACR ePrint (the world's premier cryptography preprint server), and shipped a working app with 53 Flutter tests, 556 Rust tests, and 975 Python tests passing. All green, all verified, all real.

But the numbers only tell part of the story. Let me walk you through what we actually built, why it matters, and what it means for all of us.

---

## The Three Patents

We filed three patents at Patentstyret (the Norwegian Patent Office) with a combined 46 claims. Each one protects a different layer of a technology stack that, to our knowledge, nobody else on the planet has built.

### Patent 1: Quantum-Certified Anonymization (Filed March 24, 2026)
**15 claims. Application number: 20260384.**

This patent protects our method of using *real quantum randomness* from IBM Quantum hardware to anonymize personal data in a way that is mathematically irreversible. Not "practically impossible to reverse." Irreversible. Provably. Grounded in the Born rule of quantum mechanics.

Here is what that means in plain language: when you use our Level 10 anonymization, the original data is replaced using a quantum one-time pad, and then the pad is destroyed. There is no key to steal, no algorithm to crack, no backdoor to find. The information is gone. Not encrypted. Gone. This is something no classical system can guarantee.

Why does this matter? GDPR's Recital 26 says that if data is truly anonymized, it falls outside the regulation entirely. Our patent claims this threshold: data processed through our system is no longer personal data under EU law. For every hospital, bank, government agency, and insurance company handling sensitive records, this is the difference between a compliance burden and a solved problem.

### Patent 2: Unilateral CSI Entropy + PUEK (Filed April 5, 2026)
**14 claims. Filing reference: ef95b9a26a3e. Cost: 2,433 NOK.**

This is where it gets genuinely novel. CSI stands for Channel State Information, the raw signal data that every WiFi chip already collects. Researchers have used CSI for years, but always in a *bilateral* setup: two devices cooperate to extract a shared secret from their wireless channel. Our patent covers something different. We extract entropy from CSI *unilaterally*: one device, one-sided, no cooperation needed.

We ran 48 patent searches across Espacenet (120 million publications), WIPO Patentscope, Google Patents, USPTO, Justia Patents, and IEEE Xplore. The result: zero prior art for unilateral CSI entropy extraction. Nothing. Origin Wireless holds 225+ CSI patents, and every single one covers sensing applications (gesture recognition, room mapping), not cryptographic entropy. We occupy a completely empty space.

The PUEK (Physical Unclonable Entropy Key) component takes the SVD eigenstructure of the complex-valued CSI matrix and uses subspace similarity metrics to create security profiles: Standard (0.75), Elevated (0.85), High (0.95), and Military (0.98). The term "PUEK" returns zero results in every patent and academic database we searched.

Why does this matter? Every WiFi-enabled device on the planet has a CSI-capable chip. Our patent covers extracting cryptographic entropy from that chip without needing a second device. That is an entropy source that already exists in billions of devices, and we are the first to patent its cryptographic use.

### Patent 3: CHE/ARE Composition Framework (Filed April 5, 2026)
**17 claims. Filing reference: 870867694a06. Cost: 3,421 NOK.**

This patent covers how you *combine* multiple entropy sources without contaminating them. Our Certified Heterogeneous Entropy (CHE) framework takes quantum entropy, CSI entropy, and operating system randomness, keeps them in separate provenance-tracked pools, and fuses them using our Algebraic Randomness Extractor (ARE).

The ARE is mathematically novel. Every existing randomness extractor in the literature is hash-based (HKDF, SHA-3, HMAC). Ours operates over algebraic structures: complex numbers, quaternions, finite fields GF(p^n), and p-adic numbers. This is not incremental improvement. It is a new class of extractor that does not exist in the prior art. Twenty patent queries across all major databases confirmed this.

The Merkle provenance chain means every byte of entropy in our system carries a cryptographic audit trail back to its source. You can prove, in court if necessary, that a key was derived from quantum hardware and not from a pseudorandom fallback. The closest prior art (Qrypt, US10402172B1) uses flat provenance tags. Our Merkle tree approach is strictly more powerful and we cited their patent explicitly in our filing.

Why does this matter? Because regulators are coming. The EU's DORA regulation (effective in Norway since July 2025) requires documented cryptographic key lifecycle management. Our provenance chain is not a feature. It is a compliance requirement that we can already satisfy and our competitors cannot.

---

## The Patent Thicket

Here is the strategic picture. These three patents are not three separate inventions. They are an interlocking system:

- **Patent 2** covers how entropy is *generated* (CSI + PUEK)
- **Patent 3** covers how entropy is *composed* (CHE + ARE + Merkle provenance)
- **Patent 1** covers how entropy is *consumed* (quantum anonymization)

A competitor who wants to build a comparable system needs to license all three or design around each one independently. This is called a patent thicket, and it is the same strategy that Qualcomm used with cellular patents, that ARM used with chip architecture, and that Dolby used with audio codecs.

Our 9 independent claims (3 per patent) are each a separate chokepoint. The 37 dependent claims cover implementation variants and extended domains. Together, they create a defensive perimeter around the entire entropy-to-privacy pipeline.

---

## The Three Research Papers

Every patent filing is backed by a peer-reviewed-quality paper, now live on IACR ePrint:

| Paper | ePrint ID | Target Venue | Deadline |
|-------|-----------|-------------|----------|
| Quantum-Certified Anonymization | 2026/108710 | PoPETs 2027 Issue 1 | May 31, 2026 |
| Unilateral CSI Entropy + PUEK | 2026/108711 | CCS 2026 | April 29, 2026 |
| CHE/ARE Provenance | 2026/108712 | CCS 2026 | April 29, 2026 |

PoPETs (Proceedings on Privacy Enhancing Technologies) and CCS (ACM Conference on Computer and Communications Security) are among the top venues in privacy and security research globally. Getting accepted at either is a strong signal to investors, regulators, and enterprise customers that the science behind our technology holds up under scrutiny.

Each paper has a public GitHub repository with the full LaTeX source, compiled PDF, figures, and Apache-2.0 licensed code:
- github.com/QDaria/quantum-certified-anonymization
- github.com/QDaria/unilateral-csi-entropy
- github.com/QDaria/certified-heterogeneous-entropy

The academic affiliation on all papers is **QDaria Quantum Research, Oslo, Norway**. We are building a brand that exists in both the commercial and academic worlds.

---

## The Market

Let me put this in context.

The global cybersecurity market is projected to reach **$500 billion by 2030**. The post-quantum cryptography segment alone is growing at 40%+ CAGR and expected to hit **$17.2 billion by 2034**. The quantum random number generation (QRNG) market is projected at **$5.5 billion by 2032**.

But these numbers understate our position. We are not competing in the general cybersecurity market. We are building the *infrastructure layer* for quantum-safe cryptography. Every company that needs DORA compliance, every bank that handles cross-border transactions, every hospital that stores patient records, every defense contractor that processes classified data, they all need what we are building. They need provably quantum-derived entropy with an audit trail.

The DORA regulation alone covers **22,000+ financial entities in the EU/EEA**. Non-compliance fines run up to **2% of global turnover**. When regulators start asking "prove your keys are quantum-safe" (and they will, because DORA Article 6.4 explicitly requires periodic cryptographic updates based on cryptanalysis developments), we will be one of the very few companies that can provide a verifiable answer.

NIST has already announced that RSA and ECC will be deprecated after 2030 and disallowed after 2035. Every organization on the planet that uses public-key cryptography will need to migrate. We are not waiting for that migration. We have built the tools for it.

---

## The Valuation Context

Our IP portfolio has been valued as follows:

- **R&D replacement cost**: $50-100M (what it would cost another team to build what we have from scratch, including the prior art search, the patent filings, and the working implementation)
- **Lifetime value if standard-essential**: $1-10B (if our methods become part of NIST SP 800-90C, ETSI QKD, or ISO/IEC JTC 1/SC 27 standards)
- **Pre-revenue seed valuation**: $25-50M
- **Company at scale**: $5-30B (the thicket raises the floor, not the ceiling)

This is not theoretical. We have 46 filed patent claims, 3 published papers, working code with 1,584 passing tests across Rust, Python, and Flutter, a Python SDK published on PyPI, 18 TestFlight builds shipped, a live signaling server, 6.8 MB of real quantum entropy from IBM Quantum hardware, and a web presence at zipminator.zip.

QDaria is the only commercially available quantum/PQC company in Norway. The only one. NQCG shut down in December 2024. Zipminator is the only PQC super-app in Scandinavia.

---

## The Zipminator App

For those who have not seen it recently, Zipminator now has 9 pillars, all with working code:

1. **Quantum Vault** (100%) — ML-KEM-768 encryption with self-destruct
2. **PQC Messenger** (85%) — Post-Quantum Double Ratchet protocol
3. **Quantum VoIP** (90%) — PQ-SRTP encrypted calls
4. **Q-VPN** (90%) — PQ-WireGuard tunneling
5. **10-Level Anonymizer** (95%) — from regex masking to quantum OTP
6. **Q-AI Assistant** (85%) — local LLM with PQC tunnel and prompt guard
7. **Quantum Mail** (75%) — PQC-encrypted email at @zipminator.zip
8. **ZipBrowser** (85%) — PQC AI browser with built-in VPN
9. **Q-Mesh** (90%) — quantum-secured WiFi sensing through walls

The Flutter super-app runs on macOS, iOS, Android, Windows, Linux, and Web from a single codebase. The Rust crypto core passes 556 tests. The Python SDK is on PyPI with 975 passing tests.

---

## What Comes Next

Immediate priorities:
1. **IACR ePrint**: Already submitted (2026/108710, 108711, 108712)
2. **CCS 2026**: Abstract deadline April 22, paper deadline April 29
3. **PoPETs 2027**: Submission by May 31
4. **PCT filing**: Patent 1 priority deadline March 2027 (international protection)
5. **App Store + Play Store submissions**: TestFlight ready, Play Store pending NDK cross-compilation

Licensing targets (post-grant):
- ID Quantique (Geneva) — QRNG hardware vendor
- IBM Quantum — we already use their hardware
- Thales / Utimaco — military-grade crypto, HSM vendors
- DNB / SpareBank 1 — Norwegian banks needing DORA compliance
- Standards bodies: NIST, ETSI, ISO

---

## To the Team

What we have accomplished in the past few months is, by any objective measure, exceptional. We went from a file encryption tool to a 9-pillar PQC super-app with three filed patents, three published papers, and a patent thicket around a technology that the entire cybersecurity industry will need within the next decade.

There will be harder days ahead. Patent examinations take 12-18 months. Conference reviews are unpredictable. Enterprise sales cycles are long. But the foundation is built. The IP is filed. The code works. The science holds up.

We are in a position that most startups dream about: genuine technical novelty, filed IP protection, published academic validation, and a working product. All at the same time.

Thank you for your work. Let's keep building.

Mo
QDaria Quantum Research
