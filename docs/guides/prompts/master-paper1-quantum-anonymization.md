# Paper 1 Polish: Quantum-Certified Anonymization — PoPETs 2026

/effort max

## LLM Routing (rotate per RALPH cycle)
- Primary: Claude Opus 4.6 /effort max (writing, RALPH loop)
- Reviewer 1: GPT-5.4 via OpenRouter xhigh (adversarial, odd cycles)
- Reviewer 2: Gemini 3.1 Pro Preview via OpenRouter high (structural, even cycles)
- Reviewer 3: Grok 4 via OpenRouter high (third opinion, cycles 3,6,9,12)
- Math checker: DeepSeek-R1 via OpenRouter max (proof verification)
- Literature: Qwen 3.6 + GLM-5.1 MYTHOS via OpenRouter (papers up to April 2026)

## Target
docs/research/paper-1-quantum-anonymization/main-popets.tex
→ Composite score >= 0.995 (min of content quality, submission readiness)

## Pre-reads (MANDATORY before any edit)
- docs/research/paper-1-quantum-anonymization/main-popets.tex
- docs/research/paper-1-quantum-anonymization/figures/ (8 existing PDFs)
- docs/ip/patent-1-quantum-anonymization/ (patent-paper alignment)
- docs/guides/FEATURES.md (Pillar 1: Encryption Core incl. QRNG, Pillar 7: Quantum Mail, Pillar 9: Q-Mesh)
- src/zipminator/crypto/ + src/zipminator/entropy/
- .claude/rules/zero-hallucination.md + .claude/rules/02-security-pqc.md

## Skills to Invoke (in order)
1. quantum-peer-reviewer — DUAL scoring baseline (content + readiness)
2. quantum-literature-synthesis-expert — find 2024-April 2026 papers
3. quantum-cryptanalysis-expert — audit crypto sections (constant-time, FIPS 203)
4. quantum-assurance-validator — physics claims (Born rule, entropy)
5. research-paper-writer — formatting, LaTeX quality, venue compliance
6. verification-quality — truth scoring on every code-backed claim
7. agentic-jujutsu — 3 hostile Reviewer 2 personas
8. hive-mind-advanced — Byzantine 2/3 consensus final gate
9. reasoningbank-intelligence — store/retrieve learned patterns across iterations
10. agentdb-advanced — persistent memory for multi-session improvement

## Phase 0: BLOCKING — Score Baseline
1. Invoke quantum-peer-reviewer with DUAL scoring
2. Record: Content=X, Readiness=Y, Composite=min(X,Y)
3. If wrong template (must be acmart/popets): convert FIRST
4. If over 18pp body: compress FIRST (proofs to appendix)
5. If missing: data availability, ethics, reproducibility → add stubs

## Phase 1: Submission Readiness → 0.90+
- W1: PoPETs 2026 formatting (acmart, anonymous mode, correct copyright block)
- W2: Page budget (18pp body + unlimited appendix)
- W3: Required sections: data availability, reproducibility, ethics, acknowledgments
- W4: Artifact appendix (benchmark commands, requirements.txt, anonymous repo)
- W5: ORCID — replace placeholder or remove
- W6: 8 figure PDFs exist but only 6 referenced in text (fig3_protocol + fig7_comparison orphaned). Add missing \includegraphics + captions for fig3, fig7
- W7: Add 4 new figures (bringing total from 8 to 12):
  - Fig 9: Protocol state machine (L1-L10 → anonymization → destruction)
  - Fig 10: HNDL threat model timeline
  - Fig 11: Comparison chart vs Google DP, ARX, Apple DP
  - Fig 12: Security game diagram (formal proof structure)
- W8: Paper already has 9 tables. Verify all 9 are correctly captioned and referenced. If comparison matrix (Zipminator L10 vs DP/ARX/Apple) and GDPR/DORA compliance checklist are NOT among them, add them (target: 9-11 tables total)

## Phase 2: Content Quality → 0.95+
- W9: Invoke quantum-literature-synthesis-expert — papers published 2024 through April 2026
- W10: Mutual-information proof completion (formal, not sketch)
- W11: Domain-knowledge attack analysis (informed adversaries section)
- W12: Hardware TRNG footnote (2.7 MB IBM Quantum ibm_kingston 156q)
- W13: Statistical rigor: all benchmarks with confidence intervals, p-values
- W14: Invoke quantum-cryptanalysis-expert on all crypto code paths
- W15: Send crypto sections to DeepSeek-R1 via OpenRouter for proof verification

## Phase 3: Adversarial Hardening → 0.995
- Invoke agentic-jujutsu (3 hostile personas, focus: "just OTP", "QRNG is overkill")
- Run `scripts/ralph-multi-review.sh` with current RALPH cycle number
- GPT-5.4 via OpenRouter: independent adversarial review
- Gemini 3.1 Pro Preview: 1M-context structural review
- Grok 4: third opinion on novelty claims
- Invoke hive-mind-advanced with Byzantine 2/3 consensus
- Visual figure inspection (Playwright) — all 12 figures readable, professional
- Compile: pdflatex + bibtex clean (zero warnings)
- Store learnings via reasoningbank-intelligence + agentdb-advanced

## Quality Gates (ALL must pass)
- [ ] quantum-peer-reviewer composite >= 0.995
- [ ] pdflatex compiles with zero errors/warnings
- [ ] All citations verified (DOI/arXiv resolves via WebFetch)
- [ ] Page count within PoPETs limits (18pp body)
- [ ] No "FIPS certified" language (.claude/rules/02-security-pqc.md)
- [ ] Patent-paper alignment: no claim contradicts patent-1
- [ ] 12 figures + 9-11 tables, all referenced in text
- [ ] Multi-provider consensus: Opus 4.6 + GPT-5.4 + Gemini 3.1 Pro + Grok 4 agree >= 0.95

## Rules
- NEVER add citations without verifying DOI resolves
- NEVER claim "FIPS certified" — say "implements FIPS 203"
- Preserve QRNG-OTP-Destroy as core novelty
- All numbers verifiable or marked [unverified]
- Max 12 RALPH iterations per phase, then escalate
- File Patent 1 BEFORE submitting (ALREADY FILED: 20260384)
- Use /improve between iterations
- Literature search: up to April 2026 (NOT "2024-25")
