# Patent Claims Drafting — Session Prompt

> Launch: `claude --dangerously-skip-permissions --effort max`
> Then paste everything below.

---

/effort max

Read these files before doing anything:
- `CLAUDE.md` (project instructions)
- `.claude/rules/` (all rules)
- `memory/project_csi_entropy_patent.md` (full IP portfolio, prior art, claims)
- `docs/ip/provisional-patent-quantum-anonymization.html` (Patent 1 format to reuse)
- `docs/guides/prompts/AESR_v5_improved_prompt.md` (prompt engineering framework)

Then load these skills:
/quantum-deep-tech-ip-strategist
/verification-quality
/research-paper-writer
/quantum-assurance-validator
/quantum-cryptanalysis-expert
/agentic-jujutsu

## Task

Draft Patent 2 (CSI Entropy + PUEK) and Patent 3 (CHE Framework + ARE) for filing at Patentstyret. Reuse Patent 1's exact format from `docs/ip/provisional-patent-quantum-anonymization.html`.

## Orchestration

Initialize ruflo and use RALPH loop with hive-mind consensus:

```
ruflo hive-mind init -t hierarchical-mesh --name "patent-drafting"
```

### RALPH Loop (max 12 iterations per patent, target 0.995)

**R — Research**: Read ALL evidence files:
- `crates/zipminator-mesh/src/csi_entropy.rs` (Von Neumann, flush_to_file)
- `crates/zipminator-mesh/src/puek.rs` (PUEK eigenstructure)
- `crates/zipminator-mesh/src/entropy_bridge.rs` (HKDF-SHA256)
- `src/zipminator/entropy/are.py` (ARE extractor, 5 domains, 6 ops)
- `src/zipminator/entropy/compositor.py` (XOR fusion, health monitoring)
- `src/zipminator/entropy/provenance.py` (Merkle-tree certificates)
- `src/zipminator/entropy/certified.py` (CertifiedEntropyProvider)
- `src/zipminator/entropy/csi_pool_provider.py` (separate pool, no OS fallback)

**A — Architecture**: Structure each patent with:
- Title, Applicant (Daniel Mo Houshmand), Inventor (same)
- Abstract (150 words max)
- Technical field, Background (prior art), Summary of invention
- Detailed description with code references
- Claims (3 independent + 9-12 dependent each)
- ASCII art diagrams

**L — Logic (TDD)**: For each claim, grep the codebase to verify the function/struct/method exists. If a claim references `VonNeumannExtractor`, verify it exists in csi_entropy.rs. If it references `AreExtractor`, verify it exists in are.py. Every claim must have a code citation.

**P — Polish**: Run /simplify on the claim language. Remove ambiguity. Patent claims must be precise, not flowery.

**H — Harden**: Run /agentic-jujutsu with attacker persona:
- Patent examiner tries to reject claims as "obvious combination of known elements"
- Competitor tries to design around the claims
- Prior art searcher tries to find blocking references
Fix any weaknesses found.

### Quality Gate: /verification-quality threshold 0.995

Run /verification-quality after each RALPH iteration. Continue until 0.995 or 12 iterations.

Use /hive-mind-advanced with Byzantine consensus (3/3 agreement required) for final approval of each patent.

## Patent 2: CSI Entropy + PUEK

**Title**: "Method and System for Unilateral Entropy Harvesting from Wireless Channel State Information with Post-Quantum Key Derivation"

**Prior art (CLEAR — all bilateral, none unilateral)**:
- Mathur et al. 2008 "Radio-Telepathy" (MobiCom)
- Jana et al. 2009 (MobiCom)
- Liu et al. 2012 (IEEE TIFS)
- Avrahami et al. 2023
- WO2007124054A2, US20210345102A1, US10402172B1, US8015224B1

**Independent Claims**:
1. Unilateral CSI entropy: single-device phase LSB extraction from OFDM subcarriers + Von Neumann debiasing → general-purpose entropy bytes
2. PUEK: location-locked keys from CSI covariance eigenstructure via HKDF + configurable similarity thresholds (0.75-0.98)
3. Hybrid composition: XOR(CSI_entropy, QRNG) → HKDF-SHA256 → ML-KEM-768 mesh keys

**Dependent Claims** (verify each against code):
- Von Neumann on phase quantization LSBs (csi_entropy.rs:96-108)
- 56-subcarrier 802.11n HT20 frame structure (csi_entropy.rs:22)
- ESP32-S3 as CSI capture platform
- XOR lemma defense-in-depth guarantee (csi_entropy.rs:143-149)
- 4-level security clearance L1-L4 (docs/book/content/qmesh.md)
- Mesh beacon authentication via MeshKey (entropy_bridge.rs:134-145)
- SipHash-2-4 frame integrity via SipHashKey (entropy_bridge.rs:152-161)
- Continuous entropy rate monitoring with fallback (csi_pool_provider.py)
- NIST SP 800-90B min-entropy estimation integration
- Pool file writer with append mode (csi_entropy.rs:flush_to_file)

## Patent 3: CHE Framework + ARE

**Title**: "Certified Heterogeneous Entropy Composition with Algebraic Randomness Extraction and Cryptographic Provenance"

**Independent Claims**:
1. ARE: randomness extraction via algebraic programs over 5 number domains (N,Z,Q,R,C) with 6 operations (ADD,SUB,MUL,DIV,MOD,EXP), program generated from seed via SHAKE-256 (are.py:328-396)
2. Certified composition: XOR fusion of multiple entropy sources with per-source SP 800-90B health monitoring + Merkle-tree provenance certificates (compositor.py + provenance.py)
3. Graceful degradation: auto-exclude FAILED sources, warn on DEGRADED, adjust min-entropy bound to reflect only contributing sources (compositor.py:122-131)

**Dependent Claims** (verify each against code):
- SHAKE-256 program generation with 34-byte step encoding (are.py:362-394)
- Domain-specific arithmetic: Natural, Integer, Rational, Real, Complex (are.py:100-288)
- ProvenanceRecord canonical serialization with pipe separators (provenance.py:50-54)
- SHA-256 Merkle tree with odd-node duplication (provenance.py:78-113)
- QuantumProviderAdapter bridging legacy API to compositor (compositor.py:174-215)
- Online MinEntropyEstimator feeding health status (compositor.py:206-208)
- HealthTestSuite with 1% failure rate threshold (compositor.py:211-214)
- CertifiedEntropyResult with certificate + min_entropy_bits + source list (certified.py:31-44)
- Counter-mode SHA-256 expansion in ARE extract_bytes (are.py:496-506)

## Output

- `docs/ip/patent-2-csi-entropy-puek.html`
- `docs/ip/patent-3-che-are-provenance.html`

## Persistent Iteration

```
/ralph-loop "Draft Patent 2 + 3 claims with code verification" \
  --completion-promise "QUALITY_TARGET_MET" \
  --max-iterations 12
```

Use ruflo memory to checkpoint progress:
```
ruflo hooks post-task --task-id "patent-drafting"
ruflo hooks session-end --export-metrics true
```
