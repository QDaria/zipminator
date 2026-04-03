# Paper 3: CHE Framework + ARE — Iterative Writing Session

> **Launch**: `claude --effort max`
> Then paste everything below.

---

/effort max

## Pre-Read (MANDATORY)

Read these files before writing anything:
- `CLAUDE.md` (project rules)
- `.claude/rules/` (all rules, especially zero-hallucination and tdd-ralph)
- `src/zipminator/entropy/are.py` (ARE implementation, 507 lines)
- `src/zipminator/entropy/compositor.py` (XOR composition + health monitoring)
- `src/zipminator/entropy/provenance.py` (Merkle-tree certificates)
- `src/zipminator/entropy/certified.py` (CertifiedEntropyProvider)
- `src/zipminator/entropy/csi_pool_provider.py` (CSI pool, no OS fallback)
- `docs/ip/patent-3-che-are-provenance/provisional-patent-che-are-provenance.md` (full patent text)
- `docs/ip/patent-3-che-are-provenance/patentkrav.md` (claims for reference)
- `docs/guides/prompts/AESR_v5_improved_prompt.md` (prompt engineering framework)

Also read the peer reviewer skill:
- `/Users/mos/dev/qdaria/.claude/skills/quantum-peer-reviewer/SKILL.md`
- `/Users/mos/dev/qdaria/.claude/skills/quantum-peer-reviewer/references/`

## Task

Write Paper 3: "Certified Heterogeneous Entropy Composition with Algebraic Randomness Extraction" targeting IEEE S&P or USENIX Security 2027.

## Paper Structure (13 pages, IEEE S&P format)

1. **Abstract** (150 words)
2. **Introduction** (1.5 pages): The three gaps (single-source fragility, no algebraic extractors, no entropy provenance)
3. **Background and Related Work** (2 pages): Existing extractors (universal hashing, Trevisan, LHL), multi-source entropy (Intel RDRAND, /dev/urandom), NIST SP 800-90B health tests, DORA Art. 7
4. **ARE: Algebraic Randomness Extraction** (3 pages): 5 domains, 6 operations, SHAKE-256 program generation, extraction algorithm, counter-mode expansion, security analysis
5. **Certified Heterogeneous Composition** (2 pages): EntropySource protocol, XOR composition, health monitoring, graceful degradation
6. **Merkle-Tree Provenance** (1.5 pages): ProvenanceRecord serialization, tree construction, certificate verification, DORA compliance
7. **Implementation and Evaluation** (2 pages): Python + Rust implementations, test counts, performance benchmarks, entropy quality measurements
8. **Security Analysis** (1 page): Formal properties, comparison table vs known extractors
9. **Discussion and Limitations** (0.5 pages): ARE needs formal security reduction; SHA-256 compensates but pure proof would strengthen
10. **Conclusion** (0.5 pages)

## Key Novel Claims (verify each against code)

1. ARE is a new extractor family using algebraic programs over N/Z/Q/R/C (not hash-based)
2. Certified composition with Merkle-tree provenance (no prior system proves which sources contributed)
3. Graceful degradation with honest min-entropy bounds (no silent fallback)
4. DORA Art. 7 compliance via auditable provenance certificates

## Iteration Protocol

After each major section, run the peer reviewer:

```
/quantum-peer-reviewer  (review current draft)
/improve               (fix all issues found)
```

Repeat until reviewer gives MINOR REVISION or ACCEPT. Max 3 review cycles per section.

After the full paper is complete, run a final adversarial review with 3 hostile reviewers:
1. Cryptography reviewer: "Is ARE provably secure? Where's the security reduction?"
2. Systems reviewer: "What's the throughput? Latency? Does this scale?"
3. Privacy reviewer: "How does this compare to Intel's DRNG? Why not just use /dev/urandom?"

## Quality Gates

- [ ] Every claim has a code citation (file:line)
- [ ] Every citation DOI/arXiv verified via WebFetch
- [ ] Compiles with 0 errors, 0 undefined references
- [ ] All figures are vector PDF (300 DPI minimum)
- [ ] Data availability statement present
- [ ] Ethics statement present (entropy provenance has privacy implications)
- [ ] Reproducibility statement with exact software versions
- [ ] Submission readiness >= 0.80
- [ ] Content quality >= 0.90

## Output

- `docs/research/che-paper/main.tex`
- `docs/research/che-paper/references.bib`
- `docs/research/che-paper/figures/` (all PDF)

## Persistent Iteration

After completing each section, checkpoint via:
```
/improve @/Users/mos/dev/qdaria/.claude/skills/quantum-peer-reviewer/assets/
```

Use RALPH loop: Research -> Architecture -> Logic -> Polish -> Harden. Max 12 iterations total.
