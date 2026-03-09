# 14 -- Ruflo v3.5 MCP Setup (formerly Claude-Flow)

> Ruflo (formerly claude-flow) is the **always-on** orchestration layer for Zipminator.
> Both `ruflo` and `claude-flow` resolve to the same package (v3.5.14+).
> Ruflo provides 215 MCP tools, 60+ agent types, IPFS plugin marketplace, and self-learning hooks.
> See also: [04-orchestration-tiers.md](04-orchestration-tiers.md) for tier selection guidance.

---

## Installation

```bash
# Add ruflo as MCP server (both names work, ruflo is canonical)
claude mcp add ruflo -- npx ruflo@latest mcp start

# Optional: enhanced coordination
claude mcp add ruv-swarm -- npx ruv-swarm mcp start
```

## Daily Auto-Update

```bash
# Run on session start (or via /go command)
npx ruflo@latest update check && npx ruflo@latest update apply
```

---

## Verified Commands (ruflo v3.5)

```bash
# Project initialization
ruflo init

# Swarm orchestration
ruflo swarm init [--v3-mode]
ruflo swarm start -o "task description" -s development
ruflo swarm coordinate --agents 15

# Hive-mind coordination
ruflo hive-mind init [-t hierarchical-mesh]
ruflo hive-mind spawn [-n 5] [--claude -o "task"]
ruflo hive-mind status
ruflo hive-mind consensus
ruflo hive-mind stop

# Agent management
ruflo agent spawn -t coder
ruflo agent list

# Self-learning hooks
ruflo hooks pretrain                    # Bootstrap from repo
ruflo hooks route "implement feature"   # Route to optimal agent
ruflo hooks model-route "task"          # Pick optimal Claude model
ruflo hooks token-optimize              # 30-50% token savings
ruflo hooks metrics                     # View learning dashboard

# Memory and coordination
ruflo memory search -q "auth patterns"  # Semantic search
ruflo neural train                      # Train on repo patterns

# Plugin marketplace
ruflo plugins list                      # 20 official plugins via IPFS

# Performance and analysis
ruflo performance [subcommands]
ruflo analyze [subcommands]

# Diagnostics
ruflo doctor
```

---

## MCP Tool Categories

| Category | Tools |
|----------|-------|
| Coordination | `swarm_init`, `agent_spawn`, `task_orchestrate` |
| Monitoring | `swarm_status`, `agent_list`, `agent_metrics`, `task_status` |
| Memory | `memory_usage`, `neural_status`, `neural_train` |
| GitHub | `github_swarm`, `repo_analyze`, `pr_enhance`, `issue_triage` |

---

## When to Use Ruflo vs Native Agent Teams

| Scenario | Use |
|----------|-----|
| 3-5 parallel teammates | Native agent teams |
| Single focused task | Subagents |
| 10+ agents, complex topology | Ruflo swarm |
| Neural training, pattern learning | Ruflo neural |
| Cross-repo orchestration | Ruflo GitHub tools |
| Token optimization | Ruflo Agent Booster |
| Model selection by complexity | Ruflo model-route |
| Coverage-based routing | Ruflo coverage-route |

## Ruflo v3.5 Changelog Highlights (from v3.0)

- 215 MCP tools via FastMCP 3.x (up from ~50 in v3.0)
- AgentDB with HNSW indexing (150x-12,500x faster)
- Flash Attention (2.49x-7.47x speedup)
- ContinueGate safety mechanism for agent decisions
- Rust WASM policy kernel with SIMD128 acceleration
- IPFS plugin marketplace (20 official plugins)
- Agent Booster token optimization (30-50% savings)
- Model routing: auto-select haiku/sonnet/opus by task complexity
- Coverage-based agent routing via RuVector
- Hive-Mind consensus: Byzantine, Raft, Gossip, CRDT, Quorum
- Self-learning hooks with 4-step pretrain pipeline
- Background daemon with 12 analysis/optimization workers
- Zero production vulnerabilities (confirmed npm audit)
