# Session: Draft Patent Claims 2 + 3

> Paste this into a fresh Claude Code terminal. Self-contained.

/effort max

## Task

Draft two patent applications for filing at Patentstyret (Norwegian Industrial Property Office). Reuse the exact format and structure from the existing Patent 1 at `docs/ip/provisional-patent-quantum-anonymization.html`. The two new patents are completely independent inventions — draft them as separate documents.

## Context (READ THESE FILES FIRST)

1. `memory/project_csi_entropy_patent.md` — Full IP portfolio details, all claims, prior art search
2. `docs/ip/provisional-patent-quantum-anonymization.html` — Patent 1 format to reuse
3. `crates/zipminator-mesh/src/csi_entropy.rs` — CSI entropy implementation (Von Neumann debiaser, flush_to_file)
4. `crates/zipminator-mesh/src/puek.rs` — PUEK (Physical Unclonable Environment Key)
5. `crates/zipminator-mesh/src/entropy_bridge.rs` — HKDF-SHA256 key derivation
6. `src/zipminator/entropy/are.py` — ARE (Algebraic Randomness Extraction) extractor
7. `src/zipminator/entropy/compositor.py` — EntropyCompositor (XOR fusion, health monitoring)
8. `src/zipminator/entropy/provenance.py` — Merkle-tree provenance certificates
9. `src/zipminator/entropy/certified.py` — CertifiedEntropyProvider
10. `src/zipminator/entropy/csi_pool_provider.py` — CsiPoolProvider (separate pool, no OS fallback)

## Patent 2: CSI Entropy + PUEK

**Title**: "Method and System for Unilateral Entropy Harvesting from Wireless Channel State Information with Post-Quantum Key Derivation"

**Prior art searched and clear** (8 papers, 4 patents — all bilateral key agreement, none cover unilateral CSI entropy):
- Mathur et al. 2008 (MobiCom), Jana et al. 2009 (MobiCom), Liu et al. 2012 (IEEE TIFS), Avrahami et al. 2023
- WO2007124054A2, US20210345102A1, US10402172B1, US8015224B1

**3 Independent Claims**:
1. Unilateral CSI entropy: single-device extraction of phase LSBs from OFDM subcarriers, Von Neumann debiasing, general-purpose entropy output
2. PUEK: location-locked key derivation from CSI eigenstructure via HKDF, configurable similarity thresholds
3. Hybrid composition: XOR(CSI, QRNG) → HKDF-SHA256 → ML-KEM-768 mesh authentication

**9-12 Dependent Claims**: Von Neumann on phase quantization LSBs, 56-subcarrier 802.11n HT20, ESP32-S3 platform, defense-in-depth XOR lemma, 4-level security clearance (L1-L4), mesh beacon authentication, SipHash-2-4 frame integrity, continuous entropy rate monitoring, NIST SP 800-90B integration

## Patent 3: CHE Framework + ARE

**Title**: "Certified Heterogeneous Entropy Composition with Algebraic Randomness Extraction and Cryptographic Provenance"

**3 Independent Claims**:
1. ARE extractor: randomness extraction via algebraic programs over 5 number domains (N,Z,Q,R,C) with 6 operations, seeded by SHAKE-256
2. Certified composition: multi-source entropy composition via XOR with per-source NIST SP 800-90B health monitoring, Merkle-tree provenance certificates binding source identities and health to output
3. Graceful degradation: automatic exclusion of FAILED sources, inclusion of DEGRADED with warning, min-entropy bound adjustment

**Dependent Claims**: SHAKE-256 program generation, 16-byte step encoding, domain-specific arithmetic (rational, complex), ProvenanceRecord canonical serialization, SHA-256 Merkle tree construction, QuantumProviderAdapter bridging, online MinEntropyEstimator, HealthTestSuite failure rate thresholds

## Output

Create two files:
- `docs/ip/patent-2-csi-entropy-puek.html` — Patent 2 full application
- `docs/ip/patent-3-che-are-provenance.html` — Patent 3 full application

Each must include: title, applicant (Daniel Mo Houshmand), inventor, abstract, description, claims (numbered), drawings/diagrams (ASCII art acceptable), prior art discussion.

## Quality

Use /verification-quality after drafting. Zero-hallucination: every claim must be supported by actual code in the repo. Run grep to verify function names, struct names, and algorithms before citing them.

## Skills to load

Load: /quantum-deep-tech-ip-strategist, /research-paper-writer, /verification-quality
