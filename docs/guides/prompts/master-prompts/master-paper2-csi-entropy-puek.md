# Paper 2 Polish: Unilateral WiFi CSI Entropy — ACM WiSec 2026

/effort max

## LLM Routing (rotate per RALPH cycle)
- Primary: Claude Opus 4.6 /effort max (writing, figures, RALPH loop)
- Reviewer 1: GPT-5.4 via OpenRouter xhigh (adversarial, focus: sample size)
- Reviewer 2: Gemini 3.1 Pro Preview via OpenRouter high (structural, 1M ctx)
- Reviewer 3: Grok 4 via OpenRouter high (third opinion, cycles 3,6,9,12)
- Math checker: DeepSeek-R1 via OpenRouter max (PUEK security analysis)
- Literature: Qwen 3.6 + GLM-5.1 MYTHOS via OpenRouter (CSI/entropy up to April 2026)
- Figure quality: Opus 4.6 generates TikZ/pgfplots, verify via Playwright

## Target
docs/research/paper-2-csi-entropy-puek/main.tex
→ Composite score >= 0.995 (min of content, readiness)

## Pre-reads (MANDATORY)
- docs/research/paper-2-csi-entropy-puek/main.tex (847 lines)
- docs/research/paper-2-csi-entropy-puek/references.bib
- docs/ip/patent-2-csi-entropy-puek/ (13 claims — alignment check)
- src/zipminator/entropy/csi_pool_provider.py (11 tests)
- crates/zipminator-mesh/src/csi_entropy.rs (118 tests)
- .claude/rules/zero-hallucination.md + .claude/rules/02-security-pqc.md

## Skills (in order)
1. quantum-peer-reviewer — DUAL scoring baseline
2. research-paper-writer — ACM sigconf formatting
3. quantum-literature-synthesis-expert — CSI/entropy papers 2024-April 2026
4. quantum-cryptanalysis-expert — PUEK primitive audit
5. quantum-assurance-validator — entropy measurement claims
6. verification-quality — code-backed claims truth scoring
7. agentic-jujutsu — adversarial (sample size, correlation, static env)
8. hive-mind-advanced — Byzantine consensus final gate
9. reasoningbank-intelligence + agentdb-advanced — cross-session learning

## Phase 0: BLOCKING — Score Baseline + Figure Crisis
1. Invoke quantum-peer-reviewer DUAL scoring
2. Record baseline: Content=X, Readiness=Y
3. **CRITICAL**: figures/ directory is EMPTY. Paper is unsubmittable.
4. Template: must be acmart sigconf (WiSec format)
5. Page limit: 12pp (long paper) or 8pp (short paper) — decide now

## Phase 1: Generate ALL Figures (BLOCKING — do before any content work)
Create 9 figures as TikZ/pgfplots LaTeX code, compile to PDF:

1. **Fig 1**: CSI Phase Extraction Pipeline
   - 343 WiFi frames → 256 OFDM subcarriers → phase LSB extraction → Von Neumann debiasing → 2,690 bytes output
   - Style: horizontal flowchart with data annotations

2. **Fig 2**: PUEK Enrollment & Verification Protocol
   - Enrollment: N CSI snapshots → SVD decomposition → eigenstructure → threshold tau
   - Verification: new snapshot → SVD → distance metric → accept/reject
   - Style: two-panel protocol diagram

3. **Fig 3**: Min-Entropy Comparison Bar Chart
   - Three bars: CSI WiFi (5.50 bpb), IBM Quantum (6.35 bpb), os.urandom (6.36 bpb)
   - Y-axis: min-entropy (bits/byte), max=8.0
   - Horizontal dashed line at 8.0 = "perfect randomness"
   - Annotation: "NIST SP 800-90B MCV estimator, 99% confidence"

4. **Fig 4**: Cost-Benefit Tradeoff
   - Scatter/bubble: x=hardware cost, y=entropy throughput (MB/month), bubble size=min-entropy
   - Three points: ESP32-S3 ($5, 45-90 MB/mo, 5.50), IBM Quantum ($1.60/sec, cloud, 6.35), os.urandom ($0, unlimited, 6.36)

5. **Fig 5**: Bilateral vs Unilateral CSI (KEY NOVELTY VISUALIZATION)
   - Left panel: "Prior Work — Bilateral" (Alice <-> Bob, channel reciprocity, key agreement)
   - Right panel: "This Work — Unilateral" (single device, passive measurement, no partner)
   - Bold annotation: "No Cooperation Required"

6. **Fig 6**: XOR Composition Defense-in-Depth
   - Architecture: CSI → X1, Quantum → X2, os.urandom → X3, all XOR'd
   - Health monitor watching each source independently
   - Graceful degradation on source failure

7. **Fig 7**: Static Environment Degradation (Threat Model)
   - Timeline: stable environment → entropy quality high → environment changes → degradation
   - CSI eigenstructure drift visualization

8. **Fig 8**: Adjacent-Subcarrier Correlation Heatmap
   - 256x256 matrix showing pairwise correlation between OFDM subcarriers
   - Highlight: near-diagonal bands = correlated (this is the known limitation)

9. **Fig 9**: Extraction Ratio Sensitivity
   - X-axis: number of frames (100-1000)
   - Y-axis: extraction ratio (%) and min-entropy (bpb)
   - Two lines showing how quality scales with sample size

**Also add 3 tables:**
- Notation table (all symbols)
- Full NIST SP 800-90B test battery results
- Comparison vs existing CSI key agreement systems

## Phase 2: Submission Readiness → 0.90+
- W1: ACM WiSec 2026 formatting (sigconf, correct copyright/CCS codes)
- W2: Data availability (Gi-z/CSI-Data corpus is public — cite properly)
- W3: Reproducibility (extraction pipeline open-source — repo URL)
- W4: Ethics (passive monitoring, no human subjects, IRB not required)
- W5: ORCID — replace 0000-0000-0000-0000 with real ID
- W6: Integrate all 9 figures into text with proper references

## Phase 3: Content Quality → 0.95+
- W7: quantum-literature-synthesis-expert — CSI/entropy/PUF papers 2024-April 2026
- W8: Sample size caveat: 2,690 bytes vs NIST 1M (honest discussion, mitigation plan)
- W9: Adjacent-subcarrier correlation: add mitigation in code AND paper
- W10: Wire UCI Adult benchmark (referenced but not connected)
- W11: Statistical tests: chi-squared, Kolmogorov-Smirnov on extraction output
- W12: quantum-cryptanalysis-expert on PUEK (formal game-based proof or explicit caveat)
- W13: Send PUEK section to DeepSeek-R1 for proof verification

## Phase 4: Adversarial Hardening → 0.995
- agentic-jujutsu: focus attacks — "sample too small", "subcarrier correlation", "static env fails"
- Run `scripts/ralph-multi-review.sh` with current cycle number
- GPT-5.4 via OpenRouter: independent full-paper review
- Gemini 3.1 Pro Preview: structural and novelty assessment
- Grok 4: third opinion (every 3rd cycle)
- hive-mind-advanced: Byzantine 2/3 consensus
- Playwright: verify all 9 figures render correctly in compiled PDF
- Compile: pdflatex + bibtex clean

## Quality Gates
- [ ] quantum-peer-reviewer composite >= 0.995
- [ ] 9 figures + 10 tables, all referenced in text
- [ ] All citations verified (DOI/arXiv)
- [ ] Page limit respected
- [ ] Patent-2 alignment verified
- [ ] No unverifiable claims about NIST compliance
- [ ] Multi-provider consensus: Opus 4.6 + GPT-5.4 + Gemini 3.1 Pro + Grok 4 >= 0.95

## Rules
- Core novelty: UNILATERAL vs BILATERAL (single device, no cooperating partner)
- NEVER inflate: CSI entropy = 5.50 bpb (measured). IBM = 6.35. os.urandom = 6.36.
- File Patent 2 BEFORE submitting paper
- Literature: up to April 2026
- Max 12 RALPH iterations per phase
