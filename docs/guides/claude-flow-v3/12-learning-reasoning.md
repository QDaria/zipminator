# 12 -- Continuous Learning & Reasoning

> Extracted from Section 11 of the orchestration guide.
> See also: [03-superpowers.md](03-superpowers.md) for auto-memory feature details,
> [13-quantum-skills.md](13-quantum-skills.md) for quantum reasoning skills.

---

## Auto-Memory for Cross-Session Context

Claude Code v2.1.59+ automatically persists useful patterns to memory. For Zipminator:

```
# Check current memory
/memory

# Memory lives at:
# ~/.claude/projects/-Users-mos-dev-qdaria-zipminator/memory/MEMORY.md

# Claude auto-saves:
# - Rust binding API signatures (keypair, encapsulate, decapsulate)
# - Build commands (maturin develop, cargo test)
# - Common issues (ESLint version, --legacy-peer-deps)
# - Architecture decisions (entropy pool design, PQC wrapper pattern)
```

---

## Reinforcement Pattern: Learn from Failures

When a RALPH iteration fails, Claude should:

1. **Log the failure** to memory (what went wrong, which test, which file)
2. **Adjust strategy** (change approach, not just retry)
3. **Persist the lesson** so future sessions avoid the same mistake

Prompt pattern:
```
When a test fails or a build breaks, before retrying:
1. Diagnose the root cause (don't just re-run)
2. Save the lesson to auto-memory if it's a pattern
3. Adjust your approach, then retry with the fix
Maximum 12 retry cycles before escalating to me.
```

---

## Reasoning Depth Control (Ultrathink)

Claude Code v2.1.68 defaults Opus 4.6 to medium reasoning effort. For crypto-critical work, force maximum reasoning:

```
# In prompts for crypto work:
"ultrathink: This is security-critical code where correctness matters more than speed.
Use maximum reasoning depth for this task."

# For boilerplate/config:
"This is straightforward setup work. Move quickly."
```

**Note:** As of v2.1.68, the keyword "ultrathink" in your prompt forces high reasoning effort. Without it, Opus 4.6 uses medium effort by default.

---

## Quantum Skills for Specialized Reasoning

| Skill | Reasoning Domain | When |
|-------|-----------------|------|
| `/quantum-cryptanalysis-expert` | PQC algorithm correctness, side-channel analysis | Reviewing crypto code |
| `/quantum-assurance-validator` | Physics fact-checking for entropy claims | Verifying QRNG claims |
| `/quantum-circuit-architect` | Hadamard circuit design for entropy harvesting | Modifying harvester |
| `/agentic-jujutsu` | Adaptive self-learning, strategy adjustment | When stuck in RALPH loop |

See [13-quantum-skills.md](13-quantum-skills.md) for activation patterns.
