# 03 -- Claude Code Superpowers

> Extracted from Section 4 of the orchestration guide.
> These are native Claude Code features (no MCP required). Use them directly from the terminal.
> See also: [04-orchestration-tiers.md](04-orchestration-tiers.md) for when to use which tier.

---

## 4.1 Agent Teams (Experimental, v2.1.47+)

Multiple Claude Code instances working together with shared task lists and direct inter-agent messaging. One session acts as team lead, others are teammates.

**Enable once (add to settings.json or shell):**
```bash
# In ~/.claude/settings.json:
# { "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" } }

# Or per-session:
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

**Key capabilities:**
- Shared task list with dependency tracking
- Teammates communicate directly (not just report to lead)
- `Shift+Down` to cycle through teammates in-process mode
- Split-pane mode via tmux or iTerm2 for visual monitoring
- Plan approval gates: teammates must get lead approval before implementing
- `TeammateIdle` and `TaskCompleted` hooks for quality enforcement

**When to use agent teams vs subagents:**

| | Subagents | Agent Teams |
|---|---|---|
| Context | Own window, results return to caller | Own window, fully independent |
| Communication | Report back to main only | Message each other directly |
| Best for | Focused tasks, research, verification | Complex work needing collaboration |
| Token cost | Lower (summarized results) | Higher (separate instances) |

## 4.2 Parallel Subagents with Worktree Isolation (v2.1.49+)

Each subagent gets its own git worktree -- safe parallel file editing without conflicts.

```
# Claude Code spawns agents with isolation: "worktree"
# Each gets a branch in .claude/worktrees/<name>
# Changes auto-merge or return as branch for review
```

## 4.3 Auto-Memory (v2.1.59+)

Claude automatically persists useful context to `~/.claude/projects/<path>/memory/MEMORY.md`. Survives session restarts. Use `/memory` to manage.

## 4.4 Hooks System (v2.1.50+)

```
SessionStart, SessionEnd      # Session lifecycle
PreToolUse, PostToolUse        # Tool execution gates
ConfigChange                   # Settings file changes
WorktreeCreate, WorktreeRemove # Worktree lifecycle
TeammateIdle                   # Agent team quality gate
TaskCompleted                  # Task completion gate
```

HTTP hooks supported: POST JSON to URL, receive JSON response.

## 4.5 1M Context Window (v2.1.49+)

Opus 4.6 on Max plan supports 1M token context. Disable with `CLAUDE_CODE_DISABLE_1M_CONTEXT`.

## 4.6 Skills & Slash Commands

80+ project skills available. Key ones for Zipminator:
- `/pair-programming` -- Navigator/Driver TDD mode
- `/hive-mind-advanced` -- Queen-led multi-agent coordination
- `/sparc-methodology` -- SPARC TDD (Red-Green-Refactor)
- `/verification-quality` -- Truth scoring with automatic rollback
- `/simplify` -- Code review for reuse, quality, efficiency

See [05-skills-agents-ref.md](05-skills-agents-ref.md) for the full reference.

## 4.7 Key Changelog Highlights (v2.1.4 -> v2.1.70)

| Version Range | Feature |
|--------------|---------|
| v2.1.47+ | Agent teams stable, memory optimized |
| v2.1.49+ | Subagent worktree isolation, 1M context, ConfigChange hooks |
| v2.1.50+ | WorktreeCreate/Remove hooks, memory leak fixes |
| v2.1.51+ | HTTP hooks, `last_assistant_message` in Stop hooks |
| v2.1.53 | UI flicker fix; graceful shutdown for agent bulk kill |
| v2.1.59+ | Auto-memory system (`/memory`), `/copy` interactive picker |
| v2.1.63 | `/simplify` + `/batch` commands, HTTP hooks, worktree config sharing, plugin skills |
| v2.1.66 | Reduced spurious error logging |
| v2.1.68 | Opus 4.6 defaults to medium effort; "ultrathink" keyword forces high reasoning |
| v2.1.70 | Latest stable; improved agent coordination, enhanced hook system |

**Current version: v2.1.70.** Notable: Opus 4.6 defaults to medium reasoning. Use "ultrathink" in prompts for deep crypto reasoning, or set `CLAUDE_REASONING_EFFORT=high`.

## 4.8 Ruflo v3.5 Integration (Always-On)

Ruflo (formerly claude-flow) provides 215 MCP tools beyond Claude Code native features:
- Self-learning hooks with pretrain pipeline
- Agent Booster token optimization (30-50% savings)
- Model routing: auto-select haiku/sonnet/opus by task complexity
- Coverage-based agent routing
- IPFS plugin marketplace (20 official plugins)
- AgentDB with HNSW indexing (150x-12,500x faster)

See [14-claude-flow-mcp.md](14-claude-flow-mcp.md) for setup and commands.
