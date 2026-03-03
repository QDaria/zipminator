# Zipminator × Claude Code v2.1.63: Advanced Multi-Agent Orchestration Guide

> **Purpose:** Master reference for developing the Zipminator PQC Super-App using Claude Code v2.1.63's native agent teams, parallel subagents, hive-mind skills, RALPH iteration loops, pair programming, and continuous learning patterns.
>
> **Claude Code Version:** v2.1.63 (verified)
> **Last Updated:** 2026-03-02

---

## Table of Contents

1. [Current Project State](#1-current-project-state)
2. [What Remains To Be Done](#2-what-remains-to-be-done)
3. [Architecture & File Map](#3-architecture--file-map)
4. [Claude Code v2.1.63 Superpowers](#4-claude-code-v2163-superpowers)
5. [Three Orchestration Tiers](#5-three-orchestration-tiers)
6. [Skills & Agents Reference](#6-skills--agents-reference)
7. [Terminal Prompt Recipes](#7-terminal-prompt-recipes) (A-L)
   - [Recipe J: Iterative UI/UX Polish](#recipe-j-iterative-uiux-polish-ralph--screenshot-verification)
   - [Recipe K: Design System Sprint](#recipe-k-design-system-sprint-agent-team--bmad-ux-designer)
   - [Recipe L: Quick Visual Fix](#recipe-l-quick-visual-fix-single-session--playwright)
8. [RALPH Iteration Loop](#8-ralph-iteration-loop)
9. [Agent Team Workflows](#9-agent-team-workflows)
10. [Pair Programming Mode](#10-pair-programming-mode)
11. [Continuous Learning & Reasoning](#11-continuous-learning--reasoning)
12. [Quantum Skills Integration](#12-quantum-skills-integration)
13. [Claude-Flow MCP Setup](#13-claude-flow-mcp-setup)
14. [Quantum Entropy Pool](#14-quantum-entropy-pool)
15. [Project Cleanup Strategy](#15-project-cleanup-strategy)
16. [Verification Checklist](#16-verification-checklist)
17. [Companion Files Reference](#17-companion-files-reference)
18. [UI/UX Polish Toolkit](#18-uiux-polish-toolkit) (frontend-enhancer, RALPH-Wiggum, BMAD, Playwright loop)

---

## 1. Current Project State

### Completed (Phases 1, 4, 5, 6)

| Component | Status | Key Deliverables |
|-----------|--------|-----------------|
| **Rust Kyber768 Core** | Done | `crates/zipminator-core/` with PyO3 bindings, keypair/encapsulate/decapsulate |
| **Python SDK** | Done | `src/zipminator/` imports `_core.abi3.so`, Robindra quantum RNG |
| **Demo App** | Done | Flask backend + CDN React frontend, Kyber round-trip, entropy viz |
| **Web Landing** | Done | Next.js 16 + Tailwind, dashboard, key generator component |
| **FastAPI Backend** | Done | `api/` with PostgreSQL + Redis (needs DB to start) |
| **QRNG Harvester** | Done | `scripts/qrng_harvester.py` appends to growing entropy pool |
| **Gov Demo** | Done | `demo/gov-demo/` with install script and tutorial |
| **CI/CD Workflows** | Done | `.github/workflows/` with CI, security, release, benchmarks |
| **10-Level Anonymizer** | Done | L1-L10 processing, QRNG Levels 7-10, AdvancedAnonymizer module |
| **OpenClaw AI** | Done | Chat UI, PQC tunnel mode, prompt injection defense |
| **MCP Server** | Done | Kyber/Dilithium tools, QRNG harvesting, PII scanning |
| **Agentic Skills** | Done | `/anonymize-vault`, `/pqc-shield`, `/quantum-status` commands |

### In-Progress (Phases 2, 3)

| Component | % | Remaining Work |
|-----------|---|---------------|
| **Secure Messenger** | 70% | Double Ratchet Rust impl, C++ JSI bridge, native PQC calls |
| **VoIP & Q-VPN** | 30% | WebRTC native, PQ-SRTP, PQ-WireGuard NetworkExtension/VpnService |

### Not Started (Phases 7, 8)

| Component | Description |
|-----------|-------------|
| **Quantum-Secure Email** | `@zipminator.zip` domain, PQC SMTP/IMAP, self-destruct, PII scan |
| **ZipBrowser** | PQC AI browser, OpenClaw sidebar, built-in Q-VPN, zero telemetry |

### Phase Dependency Graph

```
Phase 1 (Foundation) ✅
    │
Phase 2 (Messenger) 🟡 70%
    │  ratchet.rs, FFI bridge, native crypto
    │
    ├──→ Phase 3 (VoIP/VPN) 🟡 30%
    │       PQ-SRTP, PQ-WireGuard
    │       │
    │       ├──→ Phase 8 (ZipBrowser) 📋
    │       │       Needs: Q-VPN, OpenClaw, PQC TLS
    │       │       START RESEARCH NOW (Recipe G)
    │       │       BUILD after Phase 3 completes (Recipe H)
    │       │
    │       └──→ Phase 7 (Email) 📋
    │               Independent -- can run parallel to Phase 8
    │               Needs: PQC TLS, PII scanner (both done)
    │
Phase 4 (Anonymizer) ✅ ──→ Phase 8 (OpenClaw AI sidebar)
Phase 5 (MCP Server) ✅
Phase 6 (Agentic Skills) ✅
```

**Key insight:** Phase 8 research can start immediately (Recipe G). Phase 8 build requires Phase 3's Q-VPN. Phase 7 is independent and can run parallel to anything.

### Entropy Pool Model

The quantum entropy pool is **append-only and ever-growing**:
- Harvested via **qBraid** (not direct IBM) -> IBM Marrakesh / Fez 156q backends
- `scripts/qrng_harvester.py` appends ~50KB per cycle
- Pool at `quantum_entropy/quantum_entropy_pool.bin` is gitignored
- Consumers read sequentially and wrap around on exhaustion (reload from file)
- **Entropy is reusable** -- quantum random bytes are statistically independent
- No bytes are "consumed" or "destroyed" -- the file only grows
- Bootstrap: 4096-byte `secrets.token_bytes()` seed if no pool exists

---

## 2. What Remains To Be Done

### Phase 2: Quantum Secure Messenger (Critical Path)

| Task | Priority | Agent Type | Isolation |
|------|----------|-----------|-----------|
| Complete PQC Double Ratchet in `crates/zipminator-core/src/ratchet.rs` | Critical | `coder` | worktree |
| Build C++ JSI bridge for React Native | Critical | `coder` | worktree |
| Replace mock crypto in `PqcMessengerService.ts` with native calls | High | `coder` | worktree |
| Add PQC-encrypted file attachments in `SecureMessenger.tsx` | Medium | `coder` | -- |

### Phase 3: VoIP, Video & Q-VPN

| Task | Priority | Agent Type | Isolation |
|------|----------|-----------|-----------|
| Integrate `react-native-webrtc` in `VoipService.ts` | Critical | `coder` | worktree |
| Implement PQ-SRTP: seed SRTP keys from Kyber shared secret | Critical | `coder` | worktree |
| Build iOS `NetworkExtension` for PQ-WireGuard | Critical | `coder` | worktree |
| Build Android `VpnService` for PQ-WireGuard | Critical | `coder` | worktree |
| Connect `NetworkShield.tsx` to real tunnel telemetry | High | `coder` | -- |

### Phase 7: Quantum-Secure Email (Planned)

| Task | Priority | Agent Type |
|------|----------|-----------|
| Register `zipminator.zip` domain, configure DNS (MX, SPF, DKIM, DMARC) | Critical | manual |
| Deploy PQC-secured SMTP/IMAP (Postfix/Dovecot + ML-KEM-768 TLS) | Critical | `coder` |
| Build webmail UI with quantum-purple design | High | `coder` |
| Integrate PII scanner into compose flow | High | `coder` |
| Self-destructing emails (timer + read-receipt) | Medium | `coder` |
| Mobile `ZipMail.tsx` in Expo app | Medium | `coder` |

### Phase 8: ZipBrowser (Planned)

| Task | Priority | Agent Type |
|------|----------|-----------|
| Fork Chromium or build Tauri desktop shell | Critical | `researcher` + `coder` |
| Integrate PQC TLS (ML-KEM-768 for all HTTPS) | Critical | `coder` |
| Embed Q-VPN (PQ-WireGuard) as always-on tunnel | Critical | `coder` |
| OpenClaw AI sidebar | High | `coder` |
| QRNG-seeded sessions + fingerprint-resistant cookies | High | `coder` |
| PQC password manager extension | Medium | `coder` |

---

## 3. Architecture & File Map

```
zipminator/
├── crates/zipminator-core/       # Rust Kyber768 + PyO3 bindings
│   └── src/
│       ├── lib.rs                # Main lib
│       ├── python_bindings.rs    # PyO3 bridge
│       ├── ratchet.rs            # PQC Double Ratchet (in progress)
│       └── ffi.rs                # C/FFI bridge (in progress)
├── src/zipminator/               # Python SDK package
│   ├── __init__.py               # Imports _core.abi3.so
│   ├── cli.py                    # Typer CLI
│   ├── crypto/
│   │   ├── pqc.py                # PQC wrapper (Rust or fallback)
│   │   └── quantum_random.py     # Robindra quantum RNG module
│   └── messenger/
│       └── signaling.py          # FastAPI WebSocket signaling
├── api/                          # FastAPI REST backend
├── web/                          # Next.js 16 landing + dashboard
│   └── components/               # 15+ React components
├── demo/
│   ├── backend/server.py         # Flask demo backend (all API endpoints)
│   ├── src/app.js                # React SPA (CDN, no build)
│   ├── gov-demo/                 # Government evaluation installer
│   └── run.sh                    # Launches Flask + HTTP server
├── mobile/                       # React Native / Expo (in progress)
├── scripts/
│   └── qrng_harvester.py         # Quantum entropy harvester
├── quantum_entropy/              # Entropy pool directory
│   └── quantum_entropy_pool.bin  # Growing pool (gitignored)
├── tests/                        # Python, Rust, integration tests
├── docs/guides/                  # This directory (9 files)
└── .claude/
    ├── skills/                   # 80+ skill definitions
    ├── agents/                   # 85 agent definitions
    └── settings.json             # Claude Code local settings
```

---

## 4. Claude Code v2.1.63 Superpowers

These are native Claude Code features (no MCP required). Use them directly from the terminal.

### 4.1 Agent Teams (Experimental, v2.1.47+)

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

### 4.2 Parallel Subagents with Worktree Isolation (v2.1.49+)

Each subagent gets its own git worktree -- safe parallel file editing without conflicts.

```
# Claude Code spawns agents with isolation: "worktree"
# Each gets a branch in .claude/worktrees/<name>
# Changes auto-merge or return as branch for review
```

### 4.3 Auto-Memory (v2.1.59+)

Claude automatically persists useful context to `~/.claude/projects/<path>/memory/MEMORY.md`. Survives session restarts. Use `/memory` to manage.

### 4.4 Hooks System (v2.1.50+)

```
SessionStart, SessionEnd      # Session lifecycle
PreToolUse, PostToolUse        # Tool execution gates
ConfigChange                   # Settings file changes
WorktreeCreate, WorktreeRemove # Worktree lifecycle
TeammateIdle                   # Agent team quality gate
TaskCompleted                  # Task completion gate
```

HTTP hooks supported: POST JSON to URL, receive JSON response.

### 4.5 1M Context Window (v2.1.49+)

Opus 4.6 on Max plan supports 1M token context. Disable with `CLAUDE_CODE_DISABLE_1M_CONTEXT`.

### 4.6 Skills & Slash Commands

80+ project skills available. Key ones for Zipminator:
- `/pair-programming` -- Navigator/Driver TDD mode
- `/hive-mind-advanced` -- Queen-led multi-agent coordination
- `/sparc-methodology` -- SPARC TDD (Red-Green-Refactor)
- `/verification-quality` -- Truth scoring with automatic rollback
- `/simplify` -- Code review for reuse, quality, efficiency

### 4.7 Key Changelog Highlights (v2.1.4 → v2.1.63)

| Version Range | Feature |
|--------------|---------|
| v2.1.47+ | Agent teams stable, memory optimized |
| v2.1.49+ | Subagent worktree isolation, 1M context, ConfigChange hooks |
| v2.1.50+ | WorktreeCreate/Remove hooks, memory leak fixes |
| v2.1.51+ | HTTP hooks, `last_assistant_message` in Stop hooks |
| v2.1.59+ | Auto-memory system, `/copy` interactive picker |
| v2.1.63 | `/simplify` + `/batch` commands, HTTP hooks, plugin skills |

---

## 5. Three Orchestration Tiers

Choose based on task complexity. You can combine tiers.

### Tier 1: Single Session + Subagents (Simplest)

For focused work on 1-2 files. Claude spawns background subagents for research/verification while you work.

```
Terminal: claude
Prompt: "Complete ratchet.rs with PQC Double Ratchet. Use /pair-programming mode.
         Spawn a researcher subagent to check Signal's X3DH spec while we implement."
```

### Tier 2: Agent Teams (Parallel Development)

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

### Tier 3: Hive-Mind + Claude-Flow MCP (Maximum Orchestration)

For full-project campaigns across all phases. Queen coordinator + Claude-Flow swarm.

```
Terminal: claude
Prompt: "Initialize hive-mind orchestration for Zipminator Phases 2-3.
         Use /hive-mind-advanced skill.
         Read docs/guides/task.md for remaining work.
         Read docs/guides/architecture.md for system design constraints.
         RALPH loop: iterate until cargo test + pytest both pass."
```

---

## 6. Skills & Agents Reference

### Skills for Zipminator Development

| Skill | When to Use | Invoke |
|-------|-------------|--------|
| `hive-mind-advanced` | Multi-agent queen-led orchestration with consensus | `/hive-mind-advanced` |
| `pair-programming` | Navigator/Driver TDD, one writes tests the other implements | `/pair-programming` |
| `sparc-methodology` | SPARC TDD workflow (Specification → Architecture → Refinement) | `/sparc-methodology` |
| `verification-quality` | Truth scoring, 0.995 threshold, automatic rollback | `/verification-quality` |
| `quantum-hive-queen` | Supreme coordinator for multi-domain orchestration | `/quantum-hive-queen` |
| `quantum-chief-of-staff` | Strategic operations coordination, delegation | `/quantum-chief-of-staff` |
| `quantum-execution-manager` | Task orchestration, resource allocation, progress tracking | `/quantum-execution-manager` |
| `quantum-cryptanalysis-expert` | PQC algorithm auditing, side-channel review | Activated by lead |
| `quantum-memory-archivist` | Persistent memory and cross-session context | `/quantum-memory-archivist` |
| `performance-analysis` | Profiling, benchmarking, optimization | `/performance-analysis` |
| `agentic-jujutsu` | Self-learning patterns, adaptive strategies | `/agentic-jujutsu` |
| `quantum-circuit-architect` | Hardware-native circuit design for entropy | Activated by lead |
| `quantum-assurance-validator` | Physics fact-checking for entropy claims | Activated by lead |
| `hooks-automation` | Automated coordination, formatting, CI triggers | `/hooks-automation` |
| `swarm-advanced` | Advanced swarm topology patterns | `/swarm-advanced` |
| `test-specialist` | Comprehensive test suite generation | `/test-specialist` |
| `frontend-enhancer` | UI polish: components, color palettes, animations, accessibility | Skill (read SKILL.md) |
| `skill-artisan` | Meta-skill for RALPH-Wiggum checkpoint iteration loops | Artisan CLI |

### BMAD Workflows (`.claude/commands/bmad/bmm/`)

| Workflow | Purpose | Agent Persona |
|----------|---------|---------------|
| `create-ux-design.md` | Collaborative UX pattern planning, look-and-feel sessions | `ux-designer` |
| `create-excalidraw-wireframe.md` | UI wireframing with Excalidraw notation | `ux-designer` |
| `create-prd.md` | Product requirements document | `pm` / `analyst` |
| `create-story.md` | User story creation with acceptance criteria | `pm` |
| `code-review.md` | Structured code review workflow | `dev` / `tea` |
| `dev-story.md` | Story implementation with TDD gates | `dev` |

### Agent Definitions (`.claude/agents/`)

| Category | Agents | Use Case |
|----------|--------|----------|
| **hive-mind/** | queen-coordinator, collective-intelligence, scout-explorer, worker-specialist, swarm-memory-manager | Large campaigns |
| **core/** | coder, tester, reviewer, researcher, planner | Every task |
| **optimization/** | performance-monitor, benchmark-suite, load-balancer, topology-optimizer | Performance work |
| **consensus/** | byzantine-coordinator, raft-manager | Multi-agent agreement |
| **swarm/** | hierarchical, mesh, adaptive coordinators | Topology selection |
| **specialized/** | spec-mobile-react-native | React Native tasks |
| **github/** | pr-manager, code-review-swarm | PR workflows |
| **testing/** | tdd-london-swarm, production-validator | Quality gates |

Total: **85 agent definitions** across 15 categories.

---

## 7. Terminal Prompt Recipes

### Quick Reference: How to Start Claude Code

```bash
# Standard session
cd ~/dev/qdaria/zipminator && claude

# With agent teams enabled
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
cd ~/dev/qdaria/zipminator && claude

# Resume previous session
claude --resume

# With worktree isolation from start
claude --worktree

# Specific model (default is Opus 4.6)
claude  # uses opus by default on Max plan

# Split-pane agent teams (requires tmux)
claude --teammate-mode tmux
```

### Recipe A: Phase 2 Messenger Sprint (Agent Team)

```
Create an agent team to complete Zipminator Phase 2 (Quantum Secure Messenger).

Read these context files first:
- docs/guides/task.md (checklist of remaining work)
- docs/guides/architecture.md (Rust core design, NTT, entropy)
- crates/zipminator-core/src/ratchet.rs (current Double Ratchet state)
- crates/zipminator-core/src/ffi.rs (current FFI state)

Spawn 4 teammates:
1. "rust-crypto" (Sonnet): Complete ratchet.rs and ffi.rs, run cargo test
2. "native-bridge" (Sonnet): C++ JSI bridge, Swift/Kotlin modules
3. "mobile-integration" (Sonnet): PqcMessengerService.ts + SecureMessenger.tsx
4. "quality-gate" (Sonnet): Write tests BEFORE each piece lands, run full suite

Use worktree isolation for rust-crypto and native-bridge.
Require plan approval for rust-crypto before implementation.

RALPH loop: iterate until cargo test --workspace && pytest tests/ both pass.
Constraint: ML-KEM-768 for KEM, AES-256-GCM for symmetric, never log private keys.
```

### Recipe B: Phase 3 VoIP + Q-VPN Sprint (Agent Team)

```
Create an agent team to complete Zipminator Phase 3 (VoIP & Q-VPN).

Context files:
- docs/guides/task.md
- docs/guides/FEATURES.md (feature specs for VoIP, Q-VPN)

Spawn 4 teammates:
1. "webrtc" (Sonnet): react-native-webrtc integration, VoipService.ts
2. "pq-srtp" (Sonnet): PQ-SRTP implementation, Kyber shared secret -> SRTP keys
3. "vpn-ios" (Sonnet): iOS NetworkExtension with PQ-WireGuard
4. "vpn-android" (Sonnet): Android VpnService with PQ-WireGuard

All use worktree isolation. TDD required.
```

### Recipe C: Single-File Deep Work (Pair Programming)

```
Use /pair-programming mode to complete ratchet.rs.

I'll be the Navigator (design decisions), you be the Driver (implementation).

Context: Read docs/guides/architecture.md for Kyber-768 internals.
The Double Ratchet must use ML-KEM-768 for ratchet key rotation
and AES-256-GCM for message encryption.

Write failing tests first (Red), implement to pass (Green), refactor (Refactor).
Iterate until cargo test passes with all ratchet tests.
```

### Recipe D: Research-Then-Build (Subagent Pattern)

```
Phase 7 (Quantum-Secure Email) needs research before coding.

Spawn 3 researcher subagents in parallel:
1. Research PQC TLS for SMTP/IMAP (Postfix + ML-KEM-768 patches)
2. Research self-destructing email protocols (timer + read-receipt patterns)
3. Research PII scanning in email compose flow (real-time regex + NER)

After research completes, create an implementation plan in docs/guides/.
Do NOT write code yet -- research only.
```

### Recipe E: Hive-Mind Full Campaign

```
You are the Hive Queen Coordinator for Zipminator.
Use /hive-mind-advanced to orchestrate Phases 2 and 3 completion.

Read all context:
- docs/guides/task.md (remaining work checklist)
- docs/guides/FEATURES.md (feature specifications)
- docs/guides/architecture.md (system design)
- CLAUDE.md (project conventions)

Spawn domain agents:
- DOMAIN A (PQC Security): ratchet.rs, ffi.rs, Rust tests
- DOMAIN B (Native Bridge): C++ JSI, Swift, Kotlin modules
- DOMAIN C (WebRTC & VoIP): react-native-webrtc, PQ-SRTP
- DOMAIN D (Q-VPN): iOS NetworkExtension, Android VpnService

Run RALPH loop per domain:
  Research -> Architecture -> Logic -> Polish -> Harden

Quality gates via /verification-quality:
  cargo test --workspace must pass
  pytest tests/ must pass
  No private keys in logs

Use /quantum-memory-archivist for cross-session context persistence.
```

### Recipe F: Code Review Swarm

```
Run a parallel code review on the Phase 2 messenger implementation.

Create an agent team with 3 reviewers:
1. "security-reviewer": Focus on crypto correctness, constant-time ops, key handling
2. "performance-reviewer": Check for unnecessary allocations, NTT bottlenecks
3. "test-reviewer": Verify test coverage, edge cases, fuzz targets

Review files: crates/zipminator-core/src/ratchet.rs, ffi.rs, and mobile/ services.
Each reviewer reports findings. Lead synthesizes into actionable issues.
```

### Recipe G: Phase 8 Research Sprint (Start NOW -- Before Phase 3 Completes)

Phase 8 (ZipBrowser) is the most ambitious phase. The first question -- Chromium fork vs Tauri -- determines the entire architecture. Start research now while Phases 2-3 are in progress.

```
Phase 8 (ZipBrowser) needs deep research before any code.

Spawn 4 researcher subagents in parallel:

1. "chromium-feasibility": Research Chromium fork approach
   - How do Brave, Arc, Vivaldi fork Chromium?
   - What's required to integrate custom TLS (ML-KEM-768)?
   - Build time, binary size, update cadence, licensing
   - Effort: months? years?

2. "tauri-feasibility": Research Tauri desktop browser approach
   - Can Tauri's WebView act as a full browser?
   - How to intercept ALL HTTPS and inject PQC TLS?
   - Does system WebView support TLS extension points?
   - Integration with Rust core (already Rust -- natural fit)

3. "pqc-tls-state-of-art": Research PQC TLS implementations
   - OQS-OpenSSL / OQS-BoringSSL current status
   - ML-KEM-768 in TLS 1.3 -- which CAs support it?
   - Cloudflare/Google PQC TLS experiments
   - Can we proxy all traffic through a local PQC tunnel instead?

4. "ai-browser-landscape": Research competing AI browsers
   - OpenAI Atlas, Browser Company Dia, Perplexity Comet
   - What AI features do users actually want?
   - How do they handle privacy? (none use PQC -- our differentiator)
   - Extension API vs sidebar vs agent mode

After all research completes, synthesize into a decision document:
- Chromium vs Tauri recommendation with trade-offs
- PQC TLS integration strategy
- AI sidebar architecture
- Write findings to docs/guides/phase8-zipbrowser-research.md
Do NOT write code yet.
```

### Recipe H: Phase 8 Full Build (After Phase 3 Completes)

This is the hierarchical team-of-teams pattern: a Hive Queen coordinates domain team leads, each lead manages their own agent team.

```
You are the Hive Queen for Zipminator Phase 8 (ZipBrowser).
Use /hive-mind-advanced for supreme coordination.

PREREQUISITE CHECK:
- Phase 3 Q-VPN (PQ-WireGuard) must be complete (needed for embedded VPN)
- Phase 4 OpenClaw AI must be complete (needed for AI sidebar) -- ✅ already done
- Read docs/guides/phase8-zipbrowser-research.md for the Chromium vs Tauri decision

DEPENDENCY GRAPH:
  Phase 2 crypto core ──→ Phase 8 PQC TLS
  Phase 3 Q-VPN ────────→ Phase 8 embedded VPN
  Phase 4 OpenClaw ─────→ Phase 8 AI sidebar

HIERARCHICAL ORCHESTRATION:
Create an agent team with 5 domain leads. Each lead should further
delegate to subagents for their domain's subtasks.

DOMAIN LEAD 1: "browser-shell" (Opus)
  Owns: Browser engine setup (Chromium fork OR Tauri, per research decision)
  Subagents:
  - Build system + CI for browser compilation
  - Window management, tab system, navigation chrome
  - Extension/plugin API scaffold
  RALPH loop until: browser launches, loads pages, has tab management

DOMAIN LEAD 2: "pqc-tls" (Opus)
  Owns: All HTTPS connections use ML-KEM-768 key exchange
  Subagents:
  - OQS-BoringSSL integration OR local PQC proxy approach
  - Certificate handling, TLS 1.3 negotiation with PQC
  - Fallback to classical TLS for non-PQC servers
  RALPH loop until: browser connects to any website with PQC when available

DOMAIN LEAD 3: "embedded-vpn" (Sonnet)
  Owns: Q-VPN (PQ-WireGuard) always-on inside browser
  Subagents:
  - Reuse Phase 3's PQ-WireGuard implementation
  - Tunnel all browser traffic through VPN
  - Kill switch: no traffic if VPN drops
  RALPH loop until: all browser traffic routes through PQ-WireGuard

DOMAIN LEAD 4: "ai-sidebar" (Sonnet)
  Owns: OpenClaw AI integration in browser
  Subagents:
  - Sidebar UI (page summarization, agentic tasks, writing assist)
  - Local LLM mode (no data leaves device)
  - PQC tunnel mode for cloud LLM queries
  RALPH loop until: AI can summarize current page and answer questions

DOMAIN LEAD 5: "privacy-engine" (Sonnet)
  Owns: Zero telemetry, QRNG sessions, fingerprint resistance
  Subagents:
  - QRNG-seeded session tokens from quantum_entropy_pool.bin
  - Fingerprint-resistant cookie rotation
  - PQC password manager + form autofill
  - Audit: verify zero telemetry (no data exits without PQC tunnel)
  RALPH loop until: no outbound connections without PQC encryption

CROSS-DOMAIN INTERFACES (Queen enforces):
  browser-shell <-> pqc-tls: TLS hook point where PQC intercepts connections
  browser-shell <-> embedded-vpn: Network layer routing
  browser-shell <-> ai-sidebar: Extension/sidebar API
  privacy-engine <-> all: Entropy pool access, session management

QUALITY GATES:
  - Browser launches and renders pages
  - PQC TLS negotiation succeeds (test against pq.cloudflareresearch.com)
  - All traffic routes through PQ-WireGuard tunnel
  - AI sidebar summarizes a page
  - Zero telemetry audit passes
  - No private keys or entropy bytes in logs

ENTROPY NOTE:
  The quantum entropy pool at quantum_entropy/quantum_entropy_pool.bin is
  append-only and ever-growing. Harvested via qBraid -> IBM Marrakesh/Fez.
  Entropy is reusable (quantum randomness has no memory). The pool is NOT
  consumed -- readers wrap around and reload. The privacy-engine domain
  reads from this pool for session tokens and cookie rotation seeds.
```

### Recipe I: Phase 7+8 Parallel Campaign (Maximum Orchestration)

Phase 7 (Email) and Phase 8 (Browser) are independent. Run them simultaneously with two separate agent teams under one Hive Queen.

```
You are the Hive Queen for Zipminator Phases 7 and 8 simultaneously.
Use /hive-mind-advanced for supreme coordination.

These phases are INDEPENDENT -- they share no code dependencies.
Run them as two parallel agent teams.

TEAM ALPHA: Phase 7 (Quantum-Secure Email)
  Lead: "email-lead" (Sonnet)
  Teammates:
  - "mail-server": Postfix/Dovecot + ML-KEM-768 TLS config
  - "webmail-ui": React/Next.js webmail with quantum-purple design
  - "mail-security": PII scanner in compose, self-destruct, L1-L10 attachments
  - "mobile-mail": ZipMail.tsx in Expo app

TEAM BETA: Phase 8 (ZipBrowser)
  Lead: "browser-lead" (Opus)
  Teammates: [Use Recipe H structure above]

SHARED RESOURCES (both teams use):
  - quantum_entropy/quantum_entropy_pool.bin (read-only, ever-growing)
  - crates/zipminator-core/ (Kyber768, existing crypto)
  - src/zipminator/crypto/ (Python PQC wrapper)

Queen's job:
  - Ensure no file conflicts between teams
  - Run RALPH loop per team independently
  - Cross-pollinate: if email team discovers a PQC TLS pattern, share with browser team
  - Final integration verification after both teams complete
```

### Recipe J: Iterative UI/UX Polish (RALPH + Screenshot Verification)

The visual RALPH loop: design -> implement -> screenshot -> score -> fix -> repeat. Uses Playwright for screenshot-driven feedback instead of unit tests.

```
Polish the Zipminator web landing page (web/app/page.tsx) and demo UI
(demo/src/app.js) using an iterative visual refinement loop.

TOOLS TO USE:
- frontend-enhancer skill from .claude/skills/frontend-enhancer/
  (read SKILL.md, references/design_principles.md, references/color_palettes.md)
- Playwright MCP for screenshot verification after each change
- RALPH loop with visual quality gates

STEP 1 - ASSESS (Research):
  Take a screenshot of the current page via Playwright.
  Read .claude/skills/frontend-enhancer/references/design_principles.md
  Identify issues: spacing, color consistency, typography, responsive gaps,
  accessibility (contrast ratio, focus indicators, touch targets).
  Score the current state on a 0-1 scale across 5 axes:
    - Visual hierarchy (layout, spacing, typography)
    - Color consistency (palette adherence, contrast ratios)
    - Responsiveness (breakpoint behavior)
    - Animations (smoothness, purpose, reduced-motion support)
    - Accessibility (WCAG AA compliance)

STEP 2 - DESIGN (Architecture):
  Choose color palette from .claude/skills/frontend-enhancer/references/color_palettes.md
  (use "Vibrant Purple" for Zipminator's quantum brand, or "Dark Mode" for dashboard).
  Plan the changes needed to reach score >= 0.95 on all axes.
  Get my approval before implementing.

STEP 3 - IMPLEMENT (Logic):
  Apply changes one axis at a time (most impactful first).
  After each change:
    - Take a fresh Playwright screenshot
    - Score the axis you changed
    - If improved, move to next axis
    - If regressed, revert and try different approach

STEP 4 - POLISH:
  Add animations from .claude/skills/frontend-enhancer/assets/animations.css
  (fadeInUp for hero, stagger for feature grid, hover-lift for cards).
  Test with prefers-reduced-motion: reduce.

STEP 5 - HARDEN:
  Run accessibility check (contrast, keyboard nav, screen reader labels).
  Test at breakpoints: 320px, 640px, 768px, 1024px, 1280px.
  Take final comparison screenshots (before vs after).

RALPH ITERATION: Repeat steps 3-5 up to 12 times until all axes >= 0.95.
Save checkpoint every 3 iterations.

CONSTRAINT: Never break existing functionality. Keep quantum-* Tailwind tokens.
```

### Recipe K: Design System Sprint (Agent Team + BMAD UX Designer)

For establishing or refactoring a consistent design system across all Zipminator UI surfaces (web landing, demo, dashboard, mobile).

```
Create an agent team to build a unified Zipminator design system.

CONTEXT FILES:
- .claude/skills/frontend-enhancer/SKILL.md (component library reference)
- .claude/skills/frontend-enhancer/references/color_palettes.md
- .claude/skills/frontend-enhancer/references/design_principles.md
- .claude/skills/frontend-enhancer/assets/animations.css
- .claude/commands/bmad/bmm/agents/ux-designer.md (UX persona)
- web/tailwind.config.js (existing quantum-* tokens)
- web/app/globals.css (existing utility classes)

Spawn 3 teammates:

1. "ux-lead" (Opus): UX Designer persona from BMAD.
   Owns: Design tokens, component API contracts, spacing scale, color system.
   First task: audit all UI surfaces and produce a design token spec.
   Deliverable: web/lib/design-tokens.ts + updated tailwind.config.js

2. "component-builder" (Sonnet): Frontend Enhancer specialist.
   Owns: Shared component library using frontend-enhancer assets as base.
   First task: copy + adapt button, card, input variants to Zipminator brand.
   Deliverable: web/components/ui/ (Button, Card, Input, Layout components)

3. "polish-verifier" (Sonnet): Visual QA with Playwright screenshots.
   Owns: Screenshot regression testing, accessibility audits, responsive checks.
   First task: capture baseline screenshots of all pages at 5 breakpoints.
   Continuous: re-screenshot after every component-builder change, flag regressions.

RALPH LOOP per component:
  R: Review existing usage across web/, demo/, mobile/
  A: Design the component API (props, variants, states)
  L: Implement with TypeScript + Tailwind, write Storybook story
  P: Apply animations, hover/focus states, responsive behavior
  H: Playwright screenshot at 5 breakpoints, accessibility check

QUALITY GATES:
  - All components render without errors
  - WCAG AA contrast ratio on all text
  - Keyboard navigation works for all interactive elements
  - Screenshots match across breakpoints
  - No regressions in existing pages

CHECKPOINT: Save .checkpoint.json every 3 components completed.
```

### Recipe L: Quick Visual Fix (Single Session + Playwright)

For targeted fixes: "make this button look better", "fix the spacing on mobile", etc.

```
Fix [specific UI issue] in [file path].

Use this approach:
1. Screenshot the current state via Playwright
2. Read .claude/skills/frontend-enhancer/references/design_principles.md
   for the relevant principle (spacing, hierarchy, color, etc.)
3. Implement the fix
4. Screenshot again and compare
5. If not satisfied, iterate (max 5 cycles for a single fix)

Constraint: minimal change, don't refactor surrounding code.
```

---

## 8. RALPH Iteration Loop

RALPH (Research, Architecture, Logic, Polish, Harden) is the iterative refinement protocol. Each domain cycles through these phases until quality gates pass.

```
┌─────────────────────────────────────────────┐
│                RALPH LOOP                    │
│                                             │
│  ┌──────────┐    ┌──────────────┐           │
│  │ Research  │───→│ Architecture │           │
│  │ (explore  │    │ (design the  │           │
│  │  problem) │    │  solution)   │           │
│  └──────────┘    └──────┬───────┘           │
│                         │                    │
│  ┌──────────┐    ┌──────▼───────┐           │
│  │ Harden   │←───│   Logic      │           │
│  │ (security │    │ (implement   │           │
│  │  + fuzz)  │    │  + test)     │           │
│  └────┬─────┘    └──────────────┘           │
│       │                                      │
│  ┌────▼─────┐                               │
│  │  Polish   │──→ QUALITY GATE              │
│  │ (refactor │    ├─ cargo test passes?     │
│  │  + docs)  │    ├─ pytest passes?         │
│  └──────────┘    ├─ no private key leaks?   │
│       │           └─ constant-time verified? │
│       │                                      │
│       ├── PASS ──→ DONE (move to next task) │
│       └── FAIL ──→ Back to Research ↺       │
│                                             │
│  Max iterations: 12 (then escalate)         │
└─────────────────────────────────────────────┘
```

### RALPH Phase Details

| Phase | What Happens | Skills Used |
|-------|-------------|-------------|
| **R**esearch | Read specs, existing code, and docs. Spawn researcher subagents. | `/quantum-cryptanalysis-expert`, subagent:researcher |
| **A**rchitecture | Design the solution, choose data structures, define interfaces. Write plan. | `/sparc-methodology` (Architecture phase) |
| **L**ogic | Write failing tests (Red), implement (Green), iterate. | `/pair-programming`, `/test-specialist` |
| **P**olish | Refactor, remove dead code, improve naming, add minimal docs. | `/simplify` |
| **H**arden | Security audit, fuzz testing, constant-time verification, CI run. | `/verification-quality`, `/quantum-assurance-validator` |

### Using RALPH in Prompts

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

## 9. Agent Team Workflows

### Enabling Agent Teams

```json
// ~/.claude/settings.json or project .claude/settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "teammateMode": "in-process"  // or "tmux" for split panes
}
```

### Team Topology for Zipminator

```
                    ┌──────────────┐
                    │  You (Human) │
                    └──────┬───────┘
                           │ prompt
                    ┌──────▼───────┐
                    │  Team Lead   │ reads CLAUDE.md, docs/guides/
                    │  (Opus 4.6)  │ creates task list, assigns work
                    └──┬──┬──┬──┬──┘
                       │  │  │  │
          ┌────────────┘  │  │  └────────────┐
          │               │  │               │
  ┌───────▼──────┐ ┌─────▼──▼────┐ ┌────────▼──────┐
  │ Rust Crypto  │ │ Native Bridge│ │ Mobile Integ  │
  │ (Sonnet)     │ │ (Sonnet)     │ │ (Sonnet)      │
  │ worktree     │ │ worktree     │ │ worktree      │
  │ ratchet.rs   │ │ C++ JSI      │ │ TS services   │
  │ ffi.rs       │ │ Swift/Kotlin │ │ React Native  │
  └──────────────┘ └──────────────┘ └───────────────┘
          │               │               │
          └───────────────┼───────────────┘
                          │
                  ┌───────▼──────┐
                  │ Quality Gate │
                  │ (Sonnet)     │
                  │ TDD + review │
                  └──────────────┘
```

### Controlling the Team

| Action | How |
|--------|-----|
| Cycle between teammates | `Shift+Down` |
| View teammate's session | `Enter` on teammate |
| Interrupt teammate | `Escape` |
| Toggle task list | `Ctrl+T` |
| Message teammate directly | Type message after selecting |
| Shut down teammate | Tell lead: "Ask the X teammate to shut down" |
| Clean up team | Tell lead: "Clean up the team" |

### Quality Gates via Hooks

Configure in `.claude/settings.json`:

```json
{
  "hooks": {
    "TaskCompleted": [
      {
        "command": "cd /Users/mos/dev/qdaria/zipminator && cargo test --workspace 2>&1 | tail -5",
        "timeout": 120000
      }
    ],
    "TeammateIdle": [
      {
        "command": "echo 'Review your changes: git diff --stat'",
        "timeout": 5000
      }
    ]
  }
}
```

---

## 10. Pair Programming Mode

The `/pair-programming` skill activates a Navigator/Driver TDD mode. You make design decisions (Navigator), Claude implements and tests (Driver).

### Starting a Pair Session

```
Use /pair-programming mode.

File: crates/zipminator-core/src/ratchet.rs
Goal: Complete PQC Double Ratchet with ML-KEM-768 key rotation

I'll navigate (design decisions, trade-offs).
You drive (write tests, implement, refactor).

Cycle: Red (failing test) -> Green (make it pass) -> Refactor -> repeat
```

### Pair Programming with Agent Teams

You can combine pair programming with agent teams. The lead pairs with you on the critical path while teammates handle independent work:

```
Create an agent team. I'll pair-program with the lead on ratchet.rs
using /pair-programming.

Meanwhile, spawn 2 teammates:
1. "bridge-builder": Build the C++ JSI bridge (independent, worktree)
2. "test-writer": Write integration tests for the messenger flow (independent)

I'll focus on navigating the Double Ratchet design with the lead.
```

---

## 11. Continuous Learning & Reasoning

### Auto-Memory for Cross-Session Context

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

### Reinforcement Pattern: Learn from Failures

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

### Reasoning Depth Control

Claude Code supports effort levels. For crypto-critical work, use maximum reasoning:

```
# In prompts for crypto work:
"Use maximum reasoning depth for this task. This is security-critical code
where correctness matters more than speed."

# For boilerplate/config:
"This is straightforward setup work. Move quickly."
```

### Quantum Skills for Specialized Reasoning

| Skill | Reasoning Domain | When |
|-------|-----------------|------|
| `/quantum-cryptanalysis-expert` | PQC algorithm correctness, side-channel analysis | Reviewing crypto code |
| `/quantum-assurance-validator` | Physics fact-checking for entropy claims | Verifying QRNG claims |
| `/quantum-circuit-architect` | Hadamard circuit design for entropy harvesting | Modifying harvester |
| `/agentic-jujutsu` | Adaptive self-learning, strategy adjustment | When stuck in RALPH loop |

---

## 12. Quantum Skills Integration

### Quantum Skill Activation Patterns

These skills provide specialized system prompts. Activate them through the lead agent or directly:

#### Entropy Pool Work
```
Activate /quantum-circuit-architect and /quantum-assurance-validator.
Review and optimize the QRNG harvester at scripts/qrng_harvester.py.
Verify the Hadamard circuit design produces genuinely random bitstrings.
Check the entropy pool integrity hash mechanism.
```

#### Crypto Implementation Review
```
Activate /quantum-cryptanalysis-expert.
Audit crates/zipminator-core/src/kyber768.rs for:
- Constant-time violations (timing side-channels)
- NTT correctness (twiddle factors, butterfly operations)
- Implicit rejection in decapsulation
- CBD sampling correctness
```

#### Cross-Session Memory Archival
```
Use /quantum-memory-archivist to persist:
- All architectural decisions made this session
- Build commands that worked
- Patterns that solved recurring issues
- Current phase completion status
```

### Hive-Mind Advanced Mode

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

---

## 13. Claude-Flow MCP Setup

Claude-Flow provides additional MCP-based orchestration. This is **optional** -- Claude Code's native agent teams and subagents handle most workflows. Use Claude-Flow when you need swarm-level coordination across 10+ agents.

### Installation

```bash
# Install claude-flow (the actual package name -- NOT "ruflo")
npx claude-flow@alpha --version

# Add as MCP server to Claude Code
claude mcp add claude-flow -- npx claude-flow@alpha mcp start
```

### Verified Commands

```bash
# Project initialization
claude-flow init

# Swarm orchestration
claude-flow swarm init [--v3-mode]
claude-flow swarm start -o "task description" -s development
claude-flow swarm coordinate --agents 15

# Hive-mind coordination
claude-flow hive-mind init [-t hierarchical-mesh]
claude-flow hive-mind spawn [-n 5] [--claude -o "task"]
claude-flow hive-mind status
claude-flow hive-mind consensus
claude-flow hive-mind stop

# Agent management
claude-flow agent spawn -t coder
claude-flow agent list

# Memory and coordination
claude-flow memory [subcommands]
claude-flow hooks [subcommands]
claude-flow neural [subcommands]
claude-flow performance [subcommands]

# Diagnostics
claude-flow doctor
```

### MCP Tool Categories

| Category | Tools |
|----------|-------|
| Coordination | `swarm_init`, `agent_spawn`, `task_orchestrate` |
| Monitoring | `swarm_status`, `agent_list`, `agent_metrics`, `task_status` |
| Memory | `memory_usage`, `neural_status`, `neural_train` |
| GitHub | `github_swarm`, `repo_analyze`, `pr_enhance`, `issue_triage` |

### When to Use Claude-Flow vs Native Agent Teams

| Scenario | Use |
|----------|-----|
| 3-5 parallel teammates | Native agent teams |
| Single focused task | Subagents |
| 10+ agents, complex topology | Claude-Flow swarm |
| Neural training, pattern learning | Claude-Flow neural |
| Cross-repo orchestration | Claude-Flow GitHub tools |

---

## 14. Quantum Entropy Pool

### How It Works

The entropy pool is a single append-only binary file at `quantum_entropy/quantum_entropy_pool.bin`. It grows over time as harvesting jobs complete.

```
┌─────────────────────────────────────────────┐
│  IBM Quantum (Marrakesh 156q)               │
│  ──→ qBraid Provider ──→ Hadamard Circuit   │
│  ──→ Measure all qubits ──→ Raw bitstrings  │
│  ──→ Append to quantum_entropy_pool.bin     │
└─────────────────────────────────────────────┘
```

### Running the Harvester

```bash
# Requires QBRAID_API_KEY in .env
python scripts/qrng_harvester.py

# Output: 50 KB per harvest cycle, appended to pool
# Backends: Tries ibm_marrakesh first, falls back to ibm_fez
# Each cycle logs a SHA-256 integrity hash
```

### Bootstrap Seed

If no pool file exists, the demo backend auto-creates a 4096-byte seed using `secrets.token_bytes()`. This ensures the app starts even without a qBraid account.

### Pool Consumers

| Consumer | How It Reads |
|----------|-------------|
| `demo/backend/server.py` | Reads sequentially, wraps around on depletion |
| `src/zipminator/crypto/quantum_random.py` | Thread-safe `QuantumEntropyPool` class, reloads on exhaustion |
| `src/zipminator/cli.py` | Reads first 32 bytes for keygen seed |

---

## 15. Project Cleanup Strategy

### Archive Directory

Legacy files are preserved in `_archive/` (gitignored):

```bash
# Already configured in .gitignore:
_archive/
archive/
deprecated/
```

### What Gets Committed

| Directory | Status | Notes |
|-----------|--------|-------|
| `crates/`, `src/zipminator/`, `api/` | Commit | Core source code |
| `web/`, `demo/`, `mobile/` | Commit | Frontend and demos |
| `tests/` | Commit | Test suites |
| `.github/workflows/` | Commit | CI/CD pipelines |
| `.claude/skills/`, `.claude/agents/` | Commit | AI orchestration config |
| `Cargo.toml`, `Cargo.lock`, `pyproject.toml` | Commit | Build configuration |
| `scripts/` | Commit | Build and harvesting scripts |
| `docs/guides/` | Commit | Developer guides |

### What Gets Gitignored

| Pattern | Reason |
|---------|--------|
| `_archive/` | Legacy files preserved locally |
| `quantum_entropy/*.bin` | Generated entropy data |
| `target/` | Rust build artifacts |
| `demo-*.png` | Playwright verification screenshots |
| `*.so`, `*.dylib` | Compiled shared libraries |

### Reducing Git Status Noise

```bash
# Stage all the deletions (files already moved to _archive/)
git add -u

# Add new source directories
git add crates/ src/zipminator/ api/ web/ tests/ scripts/ \
       .github/ .claude/ Cargo.toml Cargo.lock pyproject.toml \
       docs/guides/ demo/ config/

# Commit the restructure
git commit -m "chore: archive legacy docs/compliance/benchmarks, restructure repo"
```

---

## 16. Verification Checklist

After any orchestrated session, verify:

- [ ] `cargo test --workspace` passes
- [ ] `pytest tests/` passes
- [ ] Demo starts: `bash demo/run.sh`
- [ ] `GET http://localhost:5001/api/quantum/status` shows pool size > 0
- [ ] `POST http://localhost:5001/api/quantum/generate` returns entropy
- [ ] Kyber round-trip works: keygen -> encrypt -> decrypt
- [ ] `python scripts/qrng_harvester.py` shows Marrakesh->Fez fallback logic
- [ ] No references to "ruflo" in codebase
- [ ] No private keys in any log output
- [ ] `.gitignore` covers `_archive/`, `target/`, `*.so`, `demo-*.png`

---

## 17. Companion Files Reference

All files in `docs/guides/` and their purpose:

| File | Purpose | Feed To |
|------|---------|---------|
| **claude-flow-orchestration.md** | This file. Master prompt hub and orchestration reference. | You (human operator) |
| **task.md** | Phase-by-phase checklist with checkbox status | Agent team leads, RALPH loops |
| **FEATURES.md** | Complete feature specs for all 8 pillars | Coder agents, researchers |
| **implementation_plan.md** | Vision document with competitive analysis and roadmap | Lead agents, planners |
| **architecture.md** | Rust core internals, NTT, entropy pool, PyO3, security model | Coder agents working on crypto |
| **api-reference.md** | FastAPI endpoint contracts, auth, request/response schemas | Backend coder agents |
| **getting-started.md** | Build commands, SDK usage, CLI quickstart, troubleshooting | New session bootstrapping |
| **deployment.md** | Docker, Kubernetes, Helm charts, env vars, production hardening | DevOps agents |
| **investor-overview.md** | Business case, market, moat, roadmap (not used by agents) | Humans only |

### How to Feed Context Files to Agents

In your prompt, reference them explicitly:

```
Read these files for context:
- docs/guides/task.md (what's done and remaining)
- docs/guides/architecture.md (system design constraints)
- docs/guides/FEATURES.md (feature specifications)
```

Claude Code reads them into context automatically. For agent teams, include the paths in each teammate's spawn prompt so they load the right context independently.

---

## 18. UI/UX Polish Toolkit

Complete reference for the `.claude/` resources available for iterative visual refinement. Use with Recipes J, K, L above.

### 18.1 Frontend Enhancer Skill

**Location:** `.claude/skills/frontend-enhancer/`

The primary skill for visual polish. Contains production-ready assets and design references.

| Resource | Path | Contents |
|----------|------|----------|
| **SKILL.md** | `SKILL.md` | Master workflow: Assess → Design → Implement → Refine → Review |
| **Design Principles** | `references/design_principles.md` | Visual hierarchy, spacing rhythm, typography, accessibility (WCAG AA/AAA) |
| **Color Palettes** | `references/color_palettes.md` | 6 palettes: Corporate Blue, Vibrant Purple, Minimalist Gray, Warm Sunset, Ocean Fresh, Dark Mode |
| **Button Variants** | `assets/button-variants.tsx` | primary, secondary, outline, ghost, danger × sm/md/lg + loading state |
| **Card Variants** | `assets/card-variants.tsx` | default, bordered, elevated, interactive + Header/Title/Description/Content/Footer |
| **Input Variants** | `assets/input-variants.tsx` | Text + textarea with validation states, icons, error/helper text |
| **Hero Section** | `assets/layout-hero-section.tsx` | centered, split, minimal variants with CTA support |
| **Feature Grid** | `assets/layout-feature-grid.tsx` | 2/3/4 column responsive grid with icon slots |
| **Animations** | `assets/animations.css` | fadeIn/Out/Up/Down, slideIn, scaleIn, bounce, pulse, shimmer, hover-lift/glow/scale + stagger delays |
| **cn() Utility** | `assets/utils-cn.ts` | `clsx` + `tailwind-merge` class name helper |

**Zipminator palette recommendation:** "Vibrant Purple" for landing pages (maps to existing `quantum-*` tokens), "Dark Mode" for dashboard and developer-facing UIs.

### 18.2 RALPH-Wiggum Checkpoint System

**Location:** `.claude/skills/skill-artisan/references/ralph-wiggum.md`

The autonomous iteration engine. Wraps any RALPH loop with state persistence and convergence detection.

```yaml
ralph_wiggum:
  max_iterations: 12          # hard stop
  checkpoint_interval: 3      # save state every 3 cycles
  auto_resume: true           # pick up where you left off
  stop_conditions:
    - score >= 0.995          # target quality reached
    - convergence_delta < 0.001  # no more improvement possible
    - structural_limitation_detected  # blocked by external constraint
```

**Checkpoint file** (`.checkpoint.json`):
```json
{
  "status": "iterating",
  "iteration": 5,
  "current_score": 0.978,
  "target_score": 0.995,
  "fixes_applied": 8,
  "remaining_issues": ["contrast on hero subtitle", "mobile nav overflow"],
  "convergence_history": [0.812, 0.890, 0.934, 0.967, 0.978]
}
```

**For UI/UX, adapt the scoring axes:**

| Axis | Weight | Measurement |
|------|--------|-------------|
| Visual hierarchy | 25% | Layout structure, spacing rhythm, typography scale |
| Color consistency | 20% | Palette adherence, contrast ratios (WCAG AA = 4.5:1) |
| Responsiveness | 20% | Correct rendering at 320/640/768/1024/1280px breakpoints |
| Animations | 15% | Smoothness (60fps), purpose, `prefers-reduced-motion` support |
| Accessibility | 20% | Keyboard nav, focus indicators, semantic HTML, touch targets (44×44px) |

### 18.3 BMAD UX Design Workflow

**Location:** `.claude/commands/bmad/bmm/`

| Resource | Path | Use |
|----------|------|-----|
| UX Design Workflow | `workflows/create-ux-design.md` | Collaborative design sessions with UX expert persona |
| UX Designer Agent | `agents/ux-designer.md` | Full UX designer persona with menu-driven interaction |
| Wireframe Creator | `workflows/create-excalidraw-wireframe.md` | ASCII/Excalidraw wireframe notation |
| PRD Workflow | `workflows/create-prd.md` | Product requirements for UI features |
| Story Creator | `workflows/create-story.md` | User stories with acceptance criteria |

**Activation:** Reference the agent file in your prompt to make Claude adopt the UX designer persona:
```
Load the UX Designer persona from .claude/commands/bmad/bmm/agents/ux-designer.md.
Conduct a design review of web/app/page.tsx.
Focus on the hero section layout and CTA placement.
```

### 18.4 SPARC Refinement Agent

**Location:** `.claude/agents/sparc/refinement.md`

The TDD Red/Green/Refactor cycle adapted for UI work:

| Phase | Traditional (Code) | Adapted (UI/UX) |
|-------|-------------------|------------------|
| **Red** | Write failing test | Take screenshot, identify visual defects |
| **Green** | Implement to pass | Apply minimal CSS/component fix |
| **Refactor** | Improve structure | Consolidate tokens, extract components, clean up |

### 18.5 Verification Quality Scoring

**Location:** `.claude/skills/skill-artisan/references/verification.md`

Default scoring weights (adapt for UI work):

```
Structure:    20%  →  Layout structure, component hierarchy
Content:      25%  →  Visual completeness, feature coverage
Compliance:   20%  →  Accessibility, responsive breakpoints
Ecosystem:    15%  →  Design token usage, animation consistency
Documentation: 20% →  Component API docs, storybook coverage
```

Threshold: 0.995 (99.5%) before marking a component as "done".

### 18.6 Playwright Screenshot Verification Loop

The visual feedback loop that replaces unit tests for UI work:

```
┌─────────────────────────────────────────────────┐
│  SCREENSHOT-DRIVEN RALPH LOOP                   │
├─────────────────────────────────────────────────┤
│                                                  │
│  1. Start dev server (npm run dev / flask)       │
│  2. Navigate to target page via Playwright       │
│  3. Take baseline screenshot                     │
│  4. Score current state (5 axes, 0-1 each)       │
│                                                  │
│  LOOP (max 12 iterations):                       │
│    5. Identify lowest-scoring axis               │
│    6. Apply targeted fix                         │
│    7. Take new screenshot                        │
│    8. Re-score all axes                          │
│    9. If any axis regressed → revert fix         │
│   10. If all axes >= 0.95 → DONE                 │
│   11. If convergence_delta < 0.01 → DONE         │
│   12. Checkpoint every 3 iterations              │
│                                                  │
│  Compare: side-by-side before/after screenshots  │
└─────────────────────────────────────────────────┘
```

**Playwright commands used:**
```
browser_navigate → load the page
browser_snapshot → accessibility tree (for semantic checks)
browser_take_screenshot → visual capture
browser_resize → test breakpoints (320, 640, 768, 1024, 1280)
browser_evaluate → check computed styles, contrast ratios
```

### 18.7 Quick Reference: Which Tool for Which Task

| Task | Tool/Skill | Recipe |
|------|-----------|--------|
| "Make this page look better" | frontend-enhancer + Playwright | Recipe L |
| "Fix spacing on mobile" | Playwright resize + screenshot loop | Recipe L |
| "Build a design system" | Agent team + BMAD UX + frontend-enhancer | Recipe K |
| "Polish all UI surfaces" | RALPH loop + Playwright + checkpoints | Recipe J |
| "Choose a color palette" | frontend-enhancer `color_palettes.md` | Recipe J step 2 |
| "Add animations" | frontend-enhancer `animations.css` | Recipe J step 4 |
| "Accessibility audit" | Playwright snapshot + WCAG checks | Recipe J step 5 |
| "Design a new component" | BMAD UX Designer persona + TDD | Recipe K |
| "Review UX patterns" | BMAD `create-ux-design` workflow | Standalone |
| "Wireframe a layout" | BMAD `create-excalidraw-wireframe` | Standalone |

### 18.8 Personalities (Optional Flavor)

**Location:** `.claude/personalities/`

20 personality modes available. Useful for design review sessions where different perspectives help:

| Personality | Best For |
|-------------|----------|
| `professional.md` | Formal design reviews, stakeholder demos |
| `zen.md` | Minimalist design sessions ("less is more") |
| `sarcastic.md` | Brutally honest UI critique |
| `dramatic.md` | Emphatic feedback on visual impact |

Activate by reading the personality file into context before the design session.
