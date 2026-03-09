# 13 -- Quantum Skills Integration

> Extracted from Section 12 of the orchestration guide.
> See also: [05-skills-agents-ref.md](05-skills-agents-ref.md) for the full skills reference table.

---

## Quantum Skill Activation Patterns

These skills provide specialized system prompts. Activate them through the lead agent or directly.

### Entropy Pool Work

```
Activate /quantum-circuit-architect and /quantum-assurance-validator.
Review and optimize the QRNG harvester at scripts/qrng_harvester.py.
Verify the Hadamard circuit design produces genuinely random bitstrings.
Check the entropy pool integrity hash mechanism.
```

### Crypto Implementation Review

```
Activate /quantum-cryptanalysis-expert.
Audit crates/zipminator-core/src/kyber768.rs for:
- Constant-time violations (timing side-channels)
- NTT correctness (twiddle factors, butterfly operations)
- Implicit rejection in decapsulation
- CBD sampling correctness
```

### Cross-Session Memory Archival

```
Use /quantum-memory-archivist to persist:
- All architectural decisions made this session
- Build commands that worked
- Patterns that solved recurring issues
- Current phase completion status
```

---

## Hive-Mind Advanced Mode

The `/hive-mind-advanced` skill activates a queen-led coordination pattern where a supreme coordinator delegates to specialized workers:

```
Use /hive-mind-advanced for a full Phase 2+3 campaign.

The Queen should:
1. Read docs/guides/task.md for remaining work
2. Decompose into 4 domains (PQC, Bridge, WebRTC, VPN)
3. Assign domain agents with clear boundaries
4. Run consensus checks between domains (interfaces must agree)
5. Apply RALPH loop per domain
6. Final verification: cargo test + pytest + demo launch
```

See [09-ralph-loop.md](09-ralph-loop.md) for the RALPH loop, [06-recipes-core.md](06-recipes-core.md) Recipe E for a hive-mind campaign prompt.
