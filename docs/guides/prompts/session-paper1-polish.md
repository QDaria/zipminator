# Session: Paper 1 — PoPETs Polish (0.80 → 0.90+)

> Paste this into a fresh Claude Code terminal. Self-contained.

/effort max

## Task

Finish the three remaining items to bring the quantum-certified anonymization paper from 0.80 to 0.90+ quality. The paper is at `docs/research/paper/main.tex`.

## Context (READ THESE FILES FIRST)

1. `docs/research/paper/main.tex` — The paper (20 pages, 47 refs, IEEE format)
2. `docs/research/paper/peer-review-report.md` — Review that identified gaps
3. `memory/project_paper_polish.md` — Detailed status of all items (3 done, 3 pending)
4. `docs/research/paper/ibm_quantum_harvest.json` — IBM ibm_fez 156q job metadata
5. `docs/research/paper/ibm_quantum_entropy.bin` — 2 KB real quantum entropy
6. `quantum_entropy/quantum_entropy_pool.bin` — 2.7 MB real quantum entropy from ibm_kingston (34 jobs, Apr 1 2026)

## The Three Remaining Items

### Item 1: MI(D;D')=0 Formal Proof
Prove that mutual information between original dataset D and anonymized dataset D' is exactly zero when using QRNG-OTP with key destruction. This is the information-theoretic irreversibility guarantee. The proof should use the chain rule of mutual information and the fact that OTP with a truly random key makes the ciphertext independent of the plaintext.

### Item 2: Domain-Knowledge Attack Proposition
Write a formal proposition showing that domain knowledge (knowing the schema, value distributions, or business rules of the original data) does not help an adversary recover D from D' when the OTP key is destroyed. This should address the "what if the attacker knows it's a salary field between 0 and 1M?" concern.

### Item 3: Hardware TRNG Footnote
Add a footnote or remark discussing the relationship between QRNG and hardware TRNGs. The distinction: QRNG provides information-theoretic randomness (Born rule), while TRNGs provide computational randomness (thermal noise, etc.). Both are "real" randomness. The paper should acknowledge that the irreversibility guarantee strictly requires QRNG, but note that high-quality TRNGs (like CSI entropy at 5.50 bits/byte per NIST SP 800-90B) provide practical security even without the quantum guarantee.

**NEW DATA**: We now have 2.7 MB of real IBM quantum entropy from ibm_kingston (156 qubits, Sharareh's QDaria account, 34 jobs). The original paper only cited the 2 KB ibm_fez run. Update the empirical section to reference the larger dataset if it strengthens the paper.

## Output

Edit `docs/research/paper/main.tex` directly. Add the proof, proposition, and footnote. Do not change anything else. Run `pdflatex` to verify it compiles.

## Quality

After editing, run /verification-quality with threshold 0.90. Check all citations resolve. Verify the proof is mathematically correct. Use /quantum-assurance-validator for the physics claims.

## CRITICAL RULES

- NEVER add unverified citations. Verify every DOI/arXiv ID with WebFetch.
- NEVER claim "FIPS certified" or "FIPS compliant" (only "implements FIPS 203").
- The proof must be rigorous, not hand-wavy. Information theory, not intuition.

## Skills to load

Load: /quantum-scientific-writer, /quantum-assurance-validator, /verification-quality, /research-paper-writer
