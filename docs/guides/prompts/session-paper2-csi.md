# Paper 2 — CSI Entropy (ACM WiSec)

> Launch: `claude --dangerously-skip-permissions --effort max`
> Then paste everything below.

---

/effort max

Read these files before doing anything:
- `CLAUDE.md` and `.claude/rules/` (all rules)
- `memory/project_csi_entropy_patent.md` (prior art, novelty, IP portfolio)
- `scripts/csi_entropy_pipeline.py` (working pipeline with results)
- `docs/guides/prompts/AESR_v5_improved_prompt.md`
- `docs/book/content/qmesh.md` (clearance levels L1-L4)

Then load ALL of these skills:
/quantum-scientific-writer
/research-paper-writer
/verification-quality
/quantum-assurance-validator
/quantum-statistical-validator
/quantum-cryptanalysis-expert
/agentic-jujutsu
/hive-mind-advanced
/pair-programming
/reasoningbank-intelligence
/agentdb-memory-patterns

## Task

Write the first academic paper demonstrating WiFi CSI as a unilateral entropy source with NIST SP 800-90B validation. Target: ACM WiSec. This paper has NEVER been written by anyone.

## Orchestration

```
ruflo hive-mind init -t hierarchical-mesh --name "paper2-csi-entropy"
```

Use /hive-mind-advanced with 7 workstreams:

**W1: Theory (opus)** — Security model for unilateral CSI entropy. Distinguish from bilateral. Prove thermal noise provides genuine randomness. Von Neumann debiasing correctness.

**W2: Experimental (sonnet)** — Run the pipeline (`python scripts/csi_entropy_pipeline.py`). Produce all tables. Measure extraction ratios. Compare min-entropy across sources.

**W3: Literature (sonnet)** — Write the related work section. Cite ALL bilateral prior art (Mathur 2008, Jana 2009, Liu 2012, Avrahami 2023). Cite RF-PUF (Chatterjee 2018). Cite NIST SP 800-90B. Verify every DOI with WebFetch.

**W4: Economics (sonnet)** — Cost analysis table. IBM Quantum ($1.60/s, 10 min/mo free) vs ESP32-S3 ($5, 45-90 MB/mo) vs os.urandom (free, CSPRNG). Cost per MB of entropy.

**W5: PUEK (opus)** — Physical Unclonable Environment Key section. SVD eigenstructure. Enrollment/verification. HKDF derivation. Security thresholds (0.75-0.98). Distinguish from RF-PUF.

**W6: Adversarial Review (opus)** — Simulate 3 hostile WiSec reviewers: wireless security expert, entropy/crypto expert, systems person. Attack every claim.

**W7: Formatter (haiku)** — ACM sigconf format. BibTeX. Compile check. Page count.

## Key Results (ALREADY MEASURED — April 1 2026)

### NIST SP 800-90B Assessment (ea_non_iid -a <file> 8)

| Source | Min-Entropy (bits/byte) | H_bitstring | Final |
|--------|------------------------|-------------|-------|
| WiFi CSI (Nexmon/Broadcom, walk) | 6.36 | 0.687 | **5.50** |
| IBM Quantum (ibm_kingston, 156q) | 6.94 | 0.794 | **6.35** |
| os.urandom (CSPRNG) | 7.59 | 0.795 | **6.36** |

### Extraction Statistics

| Metric | Value |
|--------|-------|
| Frames analyzed (Nexmon walk) | 343 |
| Raw bits extracted | 87,808 |
| After Von Neumann debiasing | 2,690 bytes |
| Extraction ratio | 24.5% |
| Subcarriers per frame | 256 (Nexmon 20 MHz) |

### Evidence Files

- `quantum_entropy/csi_entropy_pool.bin` — 3,007 bytes real CSI entropy
- `quantum_entropy/quantum_entropy_pool.bin` — 2,722,816 bytes real IBM quantum entropy
- `scripts/csi_entropy_pipeline.py` — Full pipeline source
- `crates/zipminator-mesh/src/csi_entropy.rs` — Rust implementation (118 tests)
- `src/zipminator/entropy/csi_pool_provider.py` — Python pool provider (11 tests)

### Prior Art (VERIFIED — zero blocking)

| Work | Year | Bilateral? | Blocks us? |
|------|------|-----------|------------|
| Mathur et al. "Radio-Telepathy" | 2008 | Yes | No |
| Jana et al. (MobiCom) | 2009 | Yes | No |
| Liu et al. (IEEE TIFS) | 2012 | Yes | No |
| Avrahami et al. | 2023 | Yes | No |
| Chatterjee RF-PUF | 2018 | N/A (hardware PUF) | No |
| WO2007124054A2 | 2007 | Yes (JRNSO) | No |
| US20210345102A1 | — | Yes (OFDM keygen) | No |
| US10402172B1 | — | No CSI | No |
| esp_csirand (GitHub) | — | PoC only, no paper | No |

## Paper Structure (~12-15 pages, ACM sigconf)

1. **Abstract** (250 words): First NIST SP 800-90B assessment of WiFi CSI as unilateral entropy source. 5.50 bits/byte min-entropy. $5 vs $1.60/s. Code: open-source.

2. **Introduction**: IoT entropy problem. QRNG is expensive and cloud-dependent. CSI is free and local. Gap: nobody measured CSI min-entropy with SP 800-90B. Contributions: (1) unilateral paradigm shift, (2) first SP 800-90B validation, (3) PUEK, (4) open-source implementation.

3. **Background**: 802.11 OFDM (subcarriers, channel estimation). Von Neumann debiasing (1951). NIST SP 800-90B methodology. Bilateral key agreement (prior art survey).

4. **Unilateral CSI Entropy**: Why it's different from bilateral. Phase LSB extraction. Von Neumann implementation. Pool architecture (separate files, provenance). CsiPoolProvider design.

5. **PUEK**: CSI eigenstructure → SVD → enrollment → HKDF → location-locked keys. Security profiles (L1-L4). Comparison to RF-PUF.

6. **Evaluation**: SP 800-90B results table. Extraction ratio. Throughput. Shannon vs min-entropy. Source comparison.

7. **Economics**: Cost per MB table. IBM pricing. ESP32 pricing. Break-even analysis.

8. **Security Analysis**: Thermal noise fundamentals. Adversary model. Static environment degradation. XOR composition guarantee.

9. **Related Work**: Bilateral key agreement history. PUF literature. Entropy source comparison.

10. **Conclusion**: First SP 800-90B validation. 5.50 bits/byte. Novel paradigm. Open source.

## Output

Create: `docs/research/paper-2-csi-entropy-puek/main.tex` (ACM sigconf)
Create: `docs/research/paper-2-csi-entropy-puek/references.bib`
Create: `docs/research/paper-2-csi-entropy-puek/figures/` (any diagrams)

## Quality Gates (ALL must pass)

1. `/verification-quality` threshold 0.995
2. `/agentic-jujutsu` — 3 hostile WiSec reviewers pass
3. `pdflatex` compiles clean
4. All citations verified via WebFetch
5. All code references verified via grep
6. All numbers match pipeline output exactly
7. Byzantine consensus 3/3 via /hive-mind-advanced
8. No mock data, no unverified claims, no "FIPS certified"

## Persistent Iteration

```
/ralph-loop "Write Paper 2 CSI entropy to 0.995" \
  --completion-promise "QUALITY_TARGET_MET" \
  --max-iterations 20
```

Session continuity:
```
ruflo hooks post-task --task-id "paper2-csi"
ruflo hooks session-end --export-metrics true
/compact "Paper 2 CSI entropy, RALPH iteration N, current section: X, quality: Y"
```

## CRITICAL RULES

- CSI data is from PUBLIC DATASET (Gi-z/CSI-Data, TU Darmstadt captures). CITE IT.
- CSI entropy is CLASSICAL PHYSICAL entropy, NOT quantum. Never conflate.
- NEVER claim "FIPS certified" — only "implements FIPS 203 (ML-KEM-768)".
- 5.50 bits/byte is from NIST ea_non_iid MCV estimator, 99% confidence.
- Min-entropy (conservative, security-relevant) ≠ Shannon entropy (theoretical bound).
- Every claim must be verifiable from code or measured data. Zero hallucination.
- Verify every citation DOI/arXiv with WebFetch BEFORE adding it to the paper.
