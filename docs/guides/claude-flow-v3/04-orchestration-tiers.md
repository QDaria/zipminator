# 04 -- Three Orchestration Tiers

> Extracted from Section 5 of the orchestration guide.
> Choose based on task complexity. You can combine tiers.
> See also: [10-agent-teams.md](10-agent-teams.md) for team workflow details.

---

## Tier 1: Single Session + Subagents (Simplest)

For focused work on 1-2 files. Claude spawns background subagents for research/verification while you work.

```
Terminal: claude
Prompt: "Complete ratchet.rs with PQC Double Ratchet. Use /pair-programming mode.
         Spawn a researcher subagent to check Signal's X3DH spec while we implement."
```

## Tier 2: Agent Teams (Parallel Development)

For multi-file, multi-domain work. 3-5 teammates with shared task list.

```
Terminal: export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 && claude
Prompt: "Create an agent team for Zipminator Phase 2. Spawn 4 teammates:
         - Rust crypto: ratchet.rs + ffi.rs (worktree isolation)
         - JSI bridge: C++ bridge + Swift/Kotlin modules (worktree isolation)
         - Mobile integration: PqcMessengerService.ts + SecureMessenger.tsx
         - TDD: write tests BEFORE each implementation lands
         Require plan approval for the Rust crypto teammate."
```

## Tier 3: Hive-Mind + Claude-Flow MCP (Maximum Orchestration)

For full-project campaigns across all phases. Queen coordinator + Claude-Flow swarm.

```
Terminal: claude
Prompt: "Initialize hive-mind orchestration for Zipminator Phases 2-3.
         Use /hive-mind-advanced skill.
         Read docs/guides/task.md for remaining work.
         Read docs/guides/architecture.md for system design constraints.
         RALPH loop: iterate until cargo test + pytest both pass."
```

See [14-claude-flow-mcp.md](14-claude-flow-mcp.md) for Claude-Flow MCP setup details.
