# Paper 1 Polish — PoPETs 0.80 → 0.995

> Launch: `claude --dangerously-skip-permissions --effort max`
> Then paste everything below.

---

/effort max

Read these files before doing anything:
- `CLAUDE.md` and `.claude/rules/` (all rules, especially zero-hallucination.md and tdd-ralph.md)
- `docs/research/paper/main.tex` (the paper, 20 pages)
- `docs/research/paper/peer-review-report.md` (review gaps)
- `memory/project_paper_polish.md` (3 done, 3 pending items)
- `docs/guides/prompts/AESR_v5_improved_prompt.md`

Then load these skills:
/quantum-scientific-writer
/quantum-assurance-validator
/verification-quality
/research-paper-writer
/quantum-statistical-validator
/agentic-jujutsu
/pair-programming

## Task

Finish 3 remaining items to bring the quantum-certified anonymization paper from 0.80 to 0.995 quality. Edit `docs/research/paper/main.tex` directly.

## Orchestration

```
ruflo hive-mind init -t hierarchical-mesh --name "paper1-polish"
```

Use /hive-mind-advanced with 5 specialist workers:

**W1: Theorist (opus)** — Writes the MI(D;D')=0 proof and domain-knowledge attack proposition. Must be information-theoretically rigorous.

**W2: Physicist (opus)** — Validates quantum mechanics claims. Verifies Born rule arguments. Writes TRNG footnote distinguishing QRNG from classical TRNGs.

**W3: Adversarial Reviewer (opus)** — Simulates hostile PoPETs reviewer. Attacks every claim. Finds weaknesses. Reports to queen.

**W4: Literature Scanner (sonnet)** — Verifies all 47+ citations resolve. Checks for missing related work. Uses WebFetch to verify DOIs.

**W5: Formatter (haiku)** — Ensures IEEE/PoPETs format compliance. Checks BibTeX. Verifies pdflatex compiles.

### RALPH Loop per item (max 12 iterations, target 0.995)

## Item 1: MI(D;D')=0 Formal Proof

The core theorem: When dataset D is anonymized to D' using QRNG-OTP with key destruction, MI(D;D') = 0.

Proof sketch:
- D' = D ⊕ K where K is QRNG (independent of D by Born rule)
- Key K is destroyed (physically irreversible via QRNG measurement)
- MI(D;D') = H(D) - H(D|D') = H(D) - H(D|D⊕K)
- Since K is independent of D and uniformly random: D' is independent of D
- Therefore H(D|D') = H(D), so MI(D;D') = 0

Write this as a formal theorem with proof in the paper. Use standard information theory notation (Cover & Thomas). Not hand-wavy; axiom-level rigorous.

## Item 2: Domain-Knowledge Attack Proposition

Proposition: Let an adversary A know the schema S, value distributions P(D), and business rules R of the original dataset. Given D' = D ⊕ K where K is destroyed QRNG, A's advantage in recovering any element d_i of D is:

Adv(A) = |Pr[A(D', S, P, R) = d_i] - 1/|D_i|| = 0

where |D_i| is the domain size of the i-th attribute.

Proof: The OTP makes every value in the domain equally likely regardless of prior knowledge. Domain knowledge constrains P(D) but not P(D|D') when K is truly random and destroyed.

## Item 3: Hardware TRNG Footnote

Add a footnote after the first mention of QRNG that says:

"The irreversibility guarantee in Theorem X strictly requires quantum random number generation (QRNG), where randomness derives from the Born rule of quantum measurement. Hardware true random number generators (TRNGs) based on thermal noise, oscillator jitter, or WiFi channel state information provide computationally unpredictable randomness [cite NIST SP 800-90B] but not information-theoretic guarantees. In practice, high-quality TRNGs achieve 5.5-7.6 bits/byte of min-entropy per NIST SP 800-90B assessment, sufficient for most applications. The distinction matters only against adversaries with unbounded computational power."

The 5.5 figure is from our CSI entropy measurement (April 2026, Nexmon/Broadcom capture, NIST ea_non_iid). The 7.6 figure is from os.urandom.

## NEW DATA

We now have 2.7 MB of real IBM quantum entropy from ibm_kingston (156q, 34 jobs, Sharareh's QDaria account, April 1 2026). Update the empirical section if this strengthens the paper beyond the original 2 KB ibm_fez demo.

## Quality Gates

After ALL items are done:

1. `/verification-quality` — target 0.995
2. `/agentic-jujutsu` — simulate 3 hostile PoPETs reviewers (privacy expert, cryptographer, systems person)
3. `pdflatex main.tex && bibtex main && pdflatex main.tex && pdflatex main.tex` — must compile
4. All citations must resolve (WebFetch each DOI)
5. Byzantine consensus 3/3 on final quality

## Persistent Iteration

```
/ralph-loop "Polish Paper 1 three items to 0.995" \
  --completion-promise "QUALITY_TARGET_MET" \
  --max-iterations 20
```

## CRITICAL RULES

- NEVER add unverified citations. WebFetch every DOI before adding.
- NEVER claim "FIPS certified" — only "implements FIPS 203".
- The MI proof must use standard information theory (Cover & Thomas, Elements of Information Theory).
- Preserve existing content; only ADD the three items and update the empirical section.
- Run pdflatex after every edit to verify compilation.

```
ruflo hooks post-task --task-id "paper1-polish"
ruflo hooks session-end --export-metrics true
```
