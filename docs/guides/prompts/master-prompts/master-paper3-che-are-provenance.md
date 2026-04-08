# Paper 3 Write: Certified Heterogeneous Entropy with Algebraic Randomness Extraction

/effort max

## LLM Routing (rotate per RALPH cycle)
- Primary: Claude Opus 4.6 /effort max (writing, proofs, RALPH loop)
- Proof verification: DeepSeek-R1 via OpenRouter max (ARE security reduction)
- Reviewer 1: GPT-5.4 via OpenRouter xhigh (adversarial, "ARE is just XOR")
- Reviewer 2: Gemini 3.1 Pro Preview via OpenRouter high (1M-ctx structural)
- Reviewer 3: Grok 4 via OpenRouter high (novelty assessment, cycles 3,6,9,12)
- Literature: Qwen 3.6 + GLM-5.1 MYTHOS via OpenRouter (extractors up to April 2026)
- Figure generation: Opus 4.6 (TikZ/pgfplots) + verify via Playwright

## Target
docs/research/paper-3-che-are-provenance/main.tex (CREATE NEW)
→ First draft: composite >= 0.90. Iterate to 0.995.

## Venue Decision: SCAFFOLD BOTH, DECIDE LATER
Create two template directories:
- `docs/research/paper-3-che-are-provenance/ieee-sp/` (IEEEtran, 13pp)
- `docs/research/paper-3-che-are-provenance/usenix-sec/` (usenix-sec, 13pp)
Write content in a venue-neutral `main-draft.tex`, then port to chosen template.
Check IEEE S&P 2027 and USENIX Security 2027 deadlines before final decision.

## Pre-reads (MANDATORY — load full context before writing a single line)
- docs/ip/patent-3-che-are-provenance/ (12 claims — paper must cover ALL)
- src/zipminator/entropy/ARE.py (~507 lines — the novel algebraic extractor)
- src/zipminator/entropy/compositor.py (XOR-fusion with health monitoring)
- src/zipminator/entropy/provenance.py (Merkle-tree certificates)
- src/zipminator/entropy/certified.py (certified composition protocol)
- src/zipminator/entropy/csi_pool_provider.py (CSI source, 11 tests)
- src/zipminator/entropy/factory.py (provider orchestration)
- docs/research/paper-1-quantum-anonymization/ (cite, don't overlap)
- docs/research/paper-2-csi-entropy-puek/ (cite, don't repeat)
- .claude/rules/zero-hallucination.md + .claude/rules/02-security-pqc.md

## Skills (in order)
1. research-paper-writer — scaffold, LaTeX structure, venue formatting
2. quantum-literature-synthesis-expert — extractor literature 2024-April 2026
   (Trevisan, GUV, Dodis et al., NIST SP 800-90B, BSI AIS 31)
3. quantum-peer-reviewer — DUAL scoring after each draft
4. quantum-cryptanalysis-expert — ARE security reduction, formal proof structure
5. quantum-assurance-validator — entropy measurement claims
6. quantum-key-distribution-engineer — key derivation from composed entropy
7. verification-quality — truth scoring on all code-backed claims
8. agentic-jujutsu — adversarial ("ARE is just XOR", "Merkle overhead", "DORA is marketing")
9. hive-mind-advanced — Byzantine 2/3 consensus final gate
10. reasoningbank-intelligence + agentdb-advanced — learn and persist patterns
11. stream-chain — multi-stage processing pipeline coordination
12. pair-programming — navigator/driver TDD for benchmark code

## Four Novel Claims (verify code implements each BEFORE claiming)
1. **ARE**: New algebraic extractor family over 5 domains (N, Z, Q, R, C) with 6 operations
   - Code: ARE.py. Verify it's distinct from Trevisan/GUV/Dodis.
2. **Certified composition**: Merkle-tree provenance proving per-source contribution
   - Code: compositor.py + certified.py + provenance.py
3. **Graceful degradation**: Honest min-entropy bounds when sources fail
   - Code: compositor health monitoring. Test with source removal.
4. **DORA Art. 7 compliance**: Provenance certificates as audit trail
   - Code: provenance.py certificate generation

## Phase 0: Scaffold (Day 1)
1. Choose venue + template (IEEEtran or usenix-sec)
2. Create: main.tex, references.bib, figures/, Makefile
3. Outline 10 sections with target page counts:
   - Abstract (0.5pp), Introduction (1.5pp), Related Work (2pp)
   - Preliminaries (1pp), ARE Construction (2.5pp), Certified Composition (1.5pp)
   - Merkle Provenance (1pp), Evaluation (2pp), Security Analysis (1pp), Conclusion (0.5pp)
4. Write abstract (250 words max)
5. Invoke quantum-peer-reviewer on outline for early feedback

## Phase 1: Draft Body (Content → 0.80)
- W1: quantum-literature-synthesis-expert — survey randomness extractors (2024-April 2026)
  Search: Trevisan extractors, GUV, universal hashing, NIST 800-90B, BSI AIS 31,
  heterogeneous entropy, multi-source composition
- W2: ARE formal definition + construction (from ARE.py, with mathematical notation)
  - Definition: domain, operations, program generation via SHAKE-256
  - Theorem: extraction guarantee (state clearly whether proven or conjectured)
- W3: Certified composition protocol (from compositor.py + certified.py)
  - Protocol description with Alice/system notation
  - XOR composition with per-source health monitoring
- W4: Merkle provenance (from provenance.py)
  - Tree structure, certificate format, verification algorithm
- W5: Evaluation benchmarks (run real code, NOT mock data):
  - ARE extraction on 2.7 MB IBM quantum entropy
  - ARE extraction on CSI WiFi entropy
  - ARE extraction on os.urandom
  - Composition throughput (Python vs Rust)
  - Provenance overhead (certificate generation + verification)
- W6: DORA compliance mapping (Art. 6.1, 6.4, 7, 50)

## Phase 2: Create ALL Figures (10 total)
Generate as TikZ/pgfplots LaTeX, compile to PDF, verify via Playwright:

1. **Fig 1**: System Architecture
   - 3 entropy sources → ARE extraction → XOR composition → Merkle provenance → output
   - Full pipeline, annotated with components from code

2. **Fig 2**: ARE Algebraic Construction
   - 5 domains (N, Z, Q, R, C) x 6 operations matrix
   - Example: how a specific (domain, operation) pair generates an extraction function

3. **Fig 3**: SHAKE-256 Program Generation
   - Input: entropy seed + domain selector + operation selector
   - SHAKE-256 XOF → extraction program
   - Output: deterministic extraction function

4. **Fig 4**: Merkle-Tree Provenance Certificate
   - Root hash = global composition certificate
   - Intermediate nodes = per-source contribution proofs
   - Leaf nodes = individual entropy chunks with timestamps
   - Labels with hash values

5. **Fig 5**: Health Monitoring State Machine
   - States: ALL_HEALTHY → DEGRADED_1 → DEGRADED_2 → CRITICAL
   - Transitions: source failure events, recovery events
   - Annotations: min-entropy bounds at each state

6. **Fig 6**: Graceful Degradation Curves
   - X-axis: number of failed sources (0, 1, 2, ..., N)
   - Y-axis: min-entropy guarantee (bpb)
   - Two curves: ARE (graceful slope) vs naive XOR (cliff drop at N-1)
   - Shaded region: "unsafe zone" below cryptographic threshold

7. **Fig 7**: ARE vs Known Extractors
   - Radar chart or grouped bar chart
   - Dimensions: extraction rate, seed length, computational cost, provenance, composability
   - Entries: ARE, Trevisan, GUV, LHL, Universal Hashing

8. **Fig 8**: Python vs Rust Benchmark
   - Grouped bar chart: throughput (MB/s) and latency (us/op)
   - Two groups per operation: Python (baseline), Rust (optimized)
   - Operations: extract, compose, certify, verify

9. **Fig 9**: DORA Art. 7 Audit Trail
   - Timeline: key generation → entropy certification → provenance → audit query → response
   - Show how provenance certificates answer regulatory queries

10. **Fig 10**: Security Game Diagram
    - Challenger <-> Adversary interaction
    - Game hops for ARE security reduction
    - Annotate: where the proof holds, where it needs ARE assumption

## Create ALL Tables (8 total)
1. Notation and symbols (mandatory for crypto paper)
2. ARE domain definitions (N, Z, Q, R, C with representative operations)
3. Extractor comparison matrix (ARE vs Trevisan vs GUV vs LHL vs Universal Hash)
4. Entropy source health metrics (CSI, Quantum, OS: throughput, min-entropy, failure modes)
5. Benchmark results (ARE extraction: throughput, latency, output quality per source)
6. Graceful degradation bounds (min-entropy per failure scenario)
7. DORA compliance mapping (Article → Zipminator feature → Evidence type)
8. Security properties (indistinguishability, composability, provenance, verifiability)

## Phase 3: Rigor (Content → 0.95)
- W7: quantum-cryptanalysis-expert — formal security proof or explicit "proof sketch" label
- W8: Send ARE proof to DeepSeek-R1 via OpenRouter for independent verification
- W9: Academic contacts for proof validation:
  Dodis (NYU), Vadhan (Harvard), Renner (ETH Zurich) — note as future work if not validated
- W10: NIST SP 800-90B on ARE output (run actual tests, report results)
- W11: Statistical validation: chi-squared, autocorrelation, birthday spacing
- W12: Invoke quantum-assurance-validator on all physics/entropy claims

## Phase 4: Submission Readiness → 0.90+
- W13: Venue formatting (exact template, page limits, anonymization)
- W14: Data availability, reproducibility, ethics statements
- W15: Artifact appendix (code, data references, build instructions)
- W16: All 10 figures + 8 tables integrated and referenced
- W17: Invoke research-paper-writer for final formatting pass

## Phase 5: Adversarial Hardening → 0.995
- agentic-jujutsu: 3 hostile reviewers:
  - Reviewer A: "ARE is just XOR with extra steps"
  - Reviewer B: "Merkle overhead makes this impractical"
  - Reviewer C: "DORA compliance is marketing, not science"
- Run `scripts/ralph-multi-review.sh` with current cycle number
- GPT-5.4 via OpenRouter: independent full review
- Gemini 3.1 Pro Preview: 1M-context structural + novelty assessment
- Grok 4: third opinion on novelty
- DeepSeek-R1: mathematical proof verification
- hive-mind-advanced: Byzantine 2/3 consensus
- Playwright: verify all 10 figures render correctly
- Compile: pdflatex + bibtex clean

## Quality Gates
- [ ] quantum-peer-reviewer composite >= 0.995
- [ ] 10 figures + 8 tables, all referenced in text
- [ ] All citations verified (DOI/arXiv)
- [ ] Page count within venue limit (13pp body)
- [ ] Patent-3 alignment: all 12 claims covered
- [ ] ARE novelty verified: no prior work uses this algebraic construction
- [ ] Multi-provider consensus >= 0.95
- [ ] All benchmarks from REAL entropy pools (no mock data)

## Rules
- File Patent 3 BEFORE submitting this paper
- ARE novelty: verify via literature search that no prior algebraic extractor matches
- NEVER claim "provably secure" without complete proof (use "proof sketch" if incomplete)
- All entropy measurements from REAL pools (2.7 MB quantum, CSI, OS)
- Cite Papers 1 and 2 (same author, build on each other)
- Literature: up to April 2026
- Max 12 RALPH iterations per phase, then escalate
- Use stream-chain for multi-stage pipeline coordination
