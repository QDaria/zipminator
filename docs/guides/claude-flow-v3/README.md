# Zipminator x Claude Code v2.1.70 + Ruflo v3.5: Multi-Agent Orchestration Guide

> **Purpose:** Master reference for developing the Zipminator PQC Super-App using Claude Code's native agent teams, parallel subagents, hive-mind skills, RALPH iteration loops, pair programming, and continuous learning patterns. Ruflo (formerly claude-flow) provides 215 MCP tools, self-learning hooks, and IPFS plugin marketplace.
>
> **Claude Code Version:** v2.1.70 (current)
> **Ruflo Version:** v3.5.14 (always-on, daily auto-update)
> **Last Updated:** 2026-03-06

---

## Quick Activation

```bash
# Export env vars, enable agent teams + ultrathink, update ruflo
source docs/guides/claude-flow-v3/scripts/activate-all.sh

# Start Claude Code
cd ~/dev/qdaria/zipminator && claude
```

---

## Guide Index

| # | File | Topics |
|---|------|--------|
| 01 | [01-project-state.md](01-project-state.md) | Current project state, remaining work, phase dependency graph |
| 02 | [02-architecture.md](02-architecture.md) | Architecture and file map |
| 03 | [03-superpowers.md](03-superpowers.md) | Claude Code superpowers: agent teams, subagents, hooks, memory, changelog |
| 04 | [04-orchestration-tiers.md](04-orchestration-tiers.md) | Three orchestration tiers (single session, agent teams, hive-mind) |
| 05 | [05-skills-agents-ref.md](05-skills-agents-ref.md) | Skills and agents reference tables |
| 06 | [06-recipes-core.md](06-recipes-core.md) | Terminal recipes A-F: messenger, VoIP, pair, research, hive, review |
| 07 | [07-recipes-browser-email.md](07-recipes-browser-email.md) | Terminal recipes G-I: Phase 7+8 browser and email campaigns |
| 08 | [08-recipes-uiux.md](08-recipes-uiux.md) | Terminal recipes J-L + UI/UX polish toolkit (Section 18) |
| 09 | [09-ralph-loop.md](09-ralph-loop.md) | RALPH iteration loop with ASCII diagram |
| 10 | [10-agent-teams.md](10-agent-teams.md) | Agent team workflows, topology, controls, hooks |
| 11 | [11-pair-programming.md](11-pair-programming.md) | Pair programming mode (Navigator/Driver TDD) |
| 12 | [12-learning-reasoning.md](12-learning-reasoning.md) | Continuous learning, auto-memory, failure learning, ultrathink |
| 13 | [13-quantum-skills.md](13-quantum-skills.md) | Quantum skills integration patterns |
| 14 | [14-claude-flow-mcp.md](14-claude-flow-mcp.md) | Claude-Flow MCP setup, commands, native vs MCP comparison |
| 15 | [15-entropy-pool.md](15-entropy-pool.md) | Quantum entropy pool operation and consumers |
| 16 | [16-cleanup-verification.md](16-cleanup-verification.md) | Project cleanup, verification checklist, companion files |
| 17 | [17-installer-roadmap.md](17-installer-roadmap.md) | One-click installer: Tauri 2.x desktop, auto-update, CI/CD, code signing |

### Shell Scripts

| Script | Purpose |
|--------|---------|
| [scripts/activate-all.sh](scripts/activate-all.sh) | Export env vars, enable agent teams + ultrathink |
| [scripts/ralph-loop.sh](scripts/ralph-loop.sh) | cargo test + pytest gate, iteration counter, exit on pass |
| [scripts/phase-sprint.sh](scripts/phase-sprint.sh) | Launch claude with agent teams for a given phase |

---

## Session Progress Tracker

Use this checklist to track your current development session:

- [ ] Phase 1: Foundation (Rust core, Python SDK, demo, CI/CD) -- DONE
- [ ] Phase 2: Quantum Secure Messenger (Double Ratchet, JSI bridge, native crypto)
- [ ] Phase 3: VoIP, Video, Q-VPN (WebRTC, PQ-SRTP, PQ-WireGuard)
- [ ] Phase 4: 10-Level Anonymizer -- DONE
- [ ] Phase 5: MCP Server -- DONE
- [ ] Phase 6: Agentic Skills -- DONE
- [ ] Phase 7: Quantum-Secure Email (PQC SMTP/IMAP, webmail, self-destruct)
- [ ] Phase 8: ZipBrowser (PQC TLS, Q-VPN, AI sidebar, zero telemetry)

### Per-Session Checklist

- [ ] Read context files (task.md, architecture.md, FEATURES.md)
- [ ] Choose orchestration tier (see [04-orchestration-tiers.md](04-orchestration-tiers.md))
- [ ] Pick a recipe from [06](06-recipes-core.md)/[07](07-recipes-browser-email.md)/[08](08-recipes-uiux.md)
- [ ] Run RALPH loop (see [09-ralph-loop.md](09-ralph-loop.md))
- [ ] Verify with checklist (see [16-cleanup-verification.md](16-cleanup-verification.md))

---

## Activation Shortcut

```bash
# One-liner to activate everything and start Claude Code
source docs/guides/claude-flow-v3/scripts/activate-all.sh && cd ~/dev/qdaria/zipminator && claude
```

---

## Migration Note

This guide was split from the monolithic `claude-flow-orchestration.md` into 16 focused files for easier navigation. All content is preserved. The original file remains as a reference.
