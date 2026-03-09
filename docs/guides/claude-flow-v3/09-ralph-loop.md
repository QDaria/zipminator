# 09 -- RALPH Iteration Loop

> Extracted from Section 8 of the orchestration guide.
> RALPH (Research, Architecture, Logic, Polish, Harden) is the iterative refinement protocol.
> Each domain cycles through these phases until quality gates pass.
> See also: [10-agent-teams.md](10-agent-teams.md) for team workflows that use RALPH.

---

## ASCII Diagram

```
+---------------------------------------------+
|                RALPH LOOP                    |
|                                             |
|  +----------+    +--------------+           |
|  | Research  |--->| Architecture |           |
|  | (explore  |    | (design the  |           |
|  |  problem) |    |  solution)   |           |
|  +----------+    +------+-------+           |
|                         |                    |
|  +----------+    +------v-------+           |
|  | Harden   |<---+   Logic      |           |
|  | (security |    | (implement   |           |
|  |  + fuzz)  |    |  + test)     |           |
|  +----+-----+    +--------------+           |
|       |                                      |
|  +----v-----+                               |
|  |  Polish   |--> QUALITY GATE              |
|  | (refactor |    +- cargo test passes?     |
|  |  + docs)  |    +- pytest passes?         |
|  +----------+    +- no private key leaks?   |
|       |           +- constant-time verified? |
|       |                                      |
|       +-- PASS --> DONE (move to next task) |
|       +-- FAIL --> Back to Research          |
|                                             |
|  Max iterations: 12 (then escalate)         |
+---------------------------------------------+
```

---

## RALPH Phase Details

| Phase | What Happens | Skills Used |
|-------|-------------|-------------|
| **R**esearch | Read specs, existing code, and docs. Spawn researcher subagents. | `/quantum-cryptanalysis-expert`, subagent:researcher |
| **A**rchitecture | Design the solution, choose data structures, define interfaces. Write plan. | `/sparc-methodology` (Architecture phase) |
| **L**ogic | Write failing tests (Red), implement (Green), iterate. | `/pair-programming`, `/test-specialist` |
| **P**olish | Refactor, remove dead code, improve naming, add minimal docs. | `/simplify` |
| **H**arden | Security audit, fuzz testing, constant-time verification, CI run. | `/verification-quality`, `/quantum-assurance-validator` |

---

## Using RALPH in Prompts

Add to any prompt:
```
Run a RALPH loop on this task:
- R: Read the relevant source files and specs
- A: Design the approach (get my approval if non-trivial)
- L: TDD -- write tests first, then implement
- P: Simplify the code (/simplify)
- H: Security review + cargo test + pytest
- Iterate up to 12 times until quality gates pass.
```

---

## Automating RALPH

Use the shell script for automated test gating:

```bash
# Run the RALPH test gate loop
bash docs/guides/claude-flow-v3/scripts/ralph-loop.sh
```

See [scripts/ralph-loop.sh](scripts/ralph-loop.sh) for the implementation.
