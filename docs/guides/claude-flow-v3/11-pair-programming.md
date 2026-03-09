# 11 -- Pair Programming Mode

> Extracted from Section 10 of the orchestration guide.
> See also: [06-recipes-core.md](06-recipes-core.md) Recipe C for a pair programming recipe.

---

The `/pair-programming` skill activates a Navigator/Driver TDD mode. You make design decisions (Navigator), Claude implements and tests (Driver).

## Starting a Pair Session

```
Use /pair-programming mode.

File: crates/zipminator-core/src/ratchet.rs
Goal: Complete PQC Double Ratchet with ML-KEM-768 key rotation

I'll navigate (design decisions, trade-offs).
You drive (write tests, implement, refactor).

Cycle: Red (failing test) -> Green (make it pass) -> Refactor -> repeat
```

## Pair Programming with Agent Teams

You can combine pair programming with agent teams. The lead pairs with you on the critical path while teammates handle independent work:

```
Create an agent team. I'll pair-program with the lead on ratchet.rs
using /pair-programming.

Meanwhile, spawn 2 teammates:
1. "bridge-builder": Build the C++ JSI bridge (independent, worktree)
2. "test-writer": Write integration tests for the messenger flow (independent)

I'll focus on navigating the Double Ratchet design with the lead.
```

See [10-agent-teams.md](10-agent-teams.md) for agent team controls.
