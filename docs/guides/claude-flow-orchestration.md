# Zipminator × Claude-Flow V3: Parallel Hive-Mind Orchestration Guide

> **Purpose:** Everything needed to continue developing the Zipminator PQC platform using Claude-Flow V3's parallel hive-mind orchestration in Claude Code.

---

## Table of Contents

1. [Current Project State](#1-current-project-state)
2. [What Remains To Be Done](#2-what-remains-to-be-done)
3. [Architecture & File Map](#3-architecture--file-map)
4. [Skills & Agents](#4-skills--agents)
5. [Claude-Flow V3 Setup](#5-claude-flow-v3-setup)
6. [Master Prompt (Copy-Paste Ready)](#6-master-prompt)
7. [Quantum Entropy Pool](#7-quantum-entropy-pool)
8. [Project Cleanup Strategy](#8-project-cleanup-strategy)
9. [Verification Checklist](#9-verification-checklist)

---

## 1. Current Project State

### Completed

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

### In-Progress

| Component | Status | Remaining Work |
|-----------|--------|---------------|
| **Secure Messenger** | 70% | Double Ratchet Rust impl, C++ JSI bridge, native PQC calls |
| **VoIP & Q-VPN** | 30% | WebRTC native, PQ-SRTP, PQ-WireGuard NetworkExtension/VpnService |

---

## 2. What Remains To Be Done

### Phase 2: Quantum Secure Messenger

| Task | Priority | Agent Type |
|------|----------|-----------|
| Complete PQC Double Ratchet in `crates/zipminator-core/src/ratchet.rs` | Critical | `coder` |
| Build C++ JSI bridge for React Native | Critical | `coder` |
| Replace mock crypto in `PqcMessengerService.ts` with native calls | High | `coder` |
| Add PQC-encrypted file attachments in `SecureMessenger.tsx` | Medium | `coder` |

### Phase 3: VoIP, Video & Q-VPN

| Task | Priority | Agent Type |
|------|----------|-----------|
| Integrate `react-native-webrtc` in `VoipService.ts` | Critical | `coder` |
| Implement PQ-SRTP: seed SRTP keys from Kyber shared secret | Critical | `coder` |
| Build iOS `NetworkExtension` for PQ-WireGuard | Critical | `coder` |
| Build Android `VpnService` for PQ-WireGuard | Critical | `coder` |
| Connect `NetworkShield.tsx` to real tunnel telemetry | High | `coder` |

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
├── guides/                       # This directory
└── .claude/
    ├── skills/                   # 80+ skill definitions
    └── agents/                   # 85 agent definitions
```

---

## 4. Skills & Agents

### Skills (confirmed in `.claude/skills/`)

| Skill | Purpose |
|-------|---------|
| `hive-mind-advanced` | Queen-led multi-agent coordination with consensus |
| `pair-programming` | Navigator/Driver TDD mode |
| `sparc-methodology` | SPARC TDD workflow (Red-Green-Refactor) |
| `verification-quality` | Truth scoring, 0.995 threshold, automatic rollback |
| `quantum-hive-queen` | Supreme coordinator for multi-domain orchestration |
| `quantum-chief-of-staff` | Strategic operations coordination |
| `quantum-execution-manager` | Task orchestration and resource allocation |
| `quantum-cryptanalysis-expert` | PQC algorithm auditing |
| `quantum-memory-archivist` | Persistent memory and context management |
| `performance-analysis` | Performance profiling and optimization |
| `swarm-advanced` | Advanced swarm orchestration patterns |
| `stream-chain` | Pipeline orchestration |
| `agentic-jujutsu` | Quantum-resistant self-learning patterns |
| `hooks-automation` | Automated coordination and formatting |
| `quantum-circuit-architect` | Hardware-native circuit design |
| `quantum-assurance-validator` | Physics fact-checking |

### Agents (confirmed in `.claude/agents/`)

| Agent Path | Role |
|-----------|------|
| `hive-mind/queen-coordinator.md` | Hive Queen orchestrator |
| `hive-mind/collective-intelligence-coordinator.md` | Distributed cognition |
| `hive-mind/scout-explorer.md` | Reconnaissance specialist |
| `hive-mind/worker-specialist.md` | Task execution |
| `hive-mind/swarm-memory-manager.md` | Distributed memory |
| `core/coder.md` | Implementation |
| `core/tester.md` | TDD and testing |
| `core/reviewer.md` | Code review |
| `core/researcher.md` | Research and analysis |
| `core/planner.md` | Strategic planning |
| `optimization/performance-monitor.md` | Performance monitoring |
| `optimization/benchmark-suite.md` | Benchmarking |
| `optimization/load-balancer.md` | Load distribution |
| `optimization/topology-optimizer.md` | Topology optimization |
| `consensus/byzantine-coordinator.md` | Byzantine fault tolerance |
| `consensus/raft-manager.md` | Raft consensus |
| `swarm/hierarchical-coordinator.md` | Hierarchical topology |
| `swarm/mesh-coordinator.md` | Mesh topology |
| `swarm/adaptive-coordinator.md` | Dynamic topology switching |
| `specialized/spec-mobile-react-native.md` | React Native specialist |
| `github/pr-manager.md` | PR lifecycle management |
| `github/code-review-swarm.md` | Multi-agent code review |
| `testing/tdd-london-swarm.md` | London-school TDD |
| `testing/production-validator.md` | Production readiness |

Total: **85 agent definitions** across 15 categories.

---

## 5. Claude-Flow V3 Setup

### Installation

```bash
# Install claude-flow (the actual package name)
npx claude-flow@alpha --version

# Add as MCP server to Claude Code
claude mcp add claude-flow -- npx claude-flow@alpha mcp start
```

> **Note:** The package is `claude-flow`, not "ruflo". There is no `ruflo` npm package.

### Verified Claude-Flow V3 Commands

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

---

## 6. Master Prompt

Copy-paste into Claude Code to begin orchestrated development:

```
You are the Hive Queen Coordinator for the Zipminator PQC platform.
Complete Phase 2 (Quantum Secure Messenger) and Phase 3 (VoIP & Q-VPN).

## PROJECT ROOT
/Users/mos/dev/qdaria/zipminator

## CONTEXT FILES
- CLAUDE.md (project conventions)
- guides/ruflo-v3-orchestration/README.md (this guide)
- crates/zipminator-core/Cargo.toml (Rust dependencies)

## STEP 1: Initialize
claude-flow hive-mind init
claude-flow hive-mind spawn -n 8 --claude -o "Complete Zipminator Phase 2 & 3"

## STEP 2: Parallel Execution

DOMAIN A -- PQC SECURITY (skill: /quantum-cryptanalysis-expert)
1. Complete ratchet.rs: Double Ratchet with Kyber-768 key rotation
2. Complete ffi.rs: Expose encrypt/decrypt/ratchet_step over C FFI
3. Write Rust unit tests
4. Cross-compile via scripts/build_rust_mobile.sh

DOMAIN B -- NATIVE BRIDGE (skill: /pair-programming)
1. Build C++ JSI bridge wrapping Rust staticlib
2. Update ZipminatorCryptoModule.swift for iOS
3. Create ZipminatorCryptoModule.kt for Android
4. Replace mocks in PqcMessengerService.ts with native calls

DOMAIN C -- WEBRTC & VOIP (skill: /sparc-methodology)
1. Install react-native-webrtc in Expo project
2. Implement real WebRTC in VoipService.ts
3. Implement PQ-SRTP from Kyber shared secret
4. Test end-to-end audio/video through signaling server

DOMAIN D -- Q-VPN (skill: /sparc-methodology)
1. iOS NetworkExtension with PQ-WireGuard
2. Android VpnService with PQ-WireGuard
3. Connect NetworkShield.tsx to real tunnel status
4. Display real metrics (IP, RX/TX, latency)

## STEP 3: Verification (skill: /verification-quality)
1. cargo test --workspace
2. pytest tests/
3. npx expo start (verify mobile UI)

## CONSTRAINTS
- TDD: Write tests BEFORE implementation
- Crypto: ML-KEM-768 (Kyber) for KEM, AES-256-GCM for symmetric
- Performance: Sub-100ms crypto handshakes
- Security: Never log private keys
```

---

## 7. Quantum Entropy Pool

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

## 8. Project Cleanup Strategy

### Archive Directory

Legacy files (old docs, compliance, benchmarks) are preserved in `_archive/` at the project root. This directory is gitignored, so archived content stays local but doesn't bloat the repo.

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
| `guides/` | Commit | Developer guides |

### What Gets Gitignored

| Pattern | Reason |
|---------|--------|
| `_archive/` | Legacy files preserved locally |
| `quantum_entropy/*.bin` | Generated entropy data |
| `target/` | Rust build artifacts |
| `demo-*.png` | Playwright verification screenshots |
| `*.so`, `*.dylib` | Compiled shared libraries |

### Reducing Git Status Noise

The repository had 283 files staged for deletion (moved to `_archive/`) and 143 untracked files. To clean up:

```bash
# Stage all the deletions (files already moved to _archive/)
git add -u

# Add new source directories
git add crates/ src/zipminator/ api/ web/ tests/ scripts/ \
       .github/ .claude/ Cargo.toml Cargo.lock pyproject.toml \
       guides/ demo/ config/ docs/guides/

# Commit the restructure
git commit -m "chore: archive legacy docs/compliance/benchmarks, restructure repo"
```

---

## 9. Verification Checklist

After any orchestrated session, verify:

- [ ] `cargo test --workspace` passes
- [ ] `pytest tests/` passes
- [ ] Demo starts: `bash demo/run.sh`
- [ ] `GET http://localhost:5001/api/quantum/status` shows pool size > 0
- [ ] `POST http://localhost:5001/api/quantum/generate` returns entropy
- [ ] Kyber round-trip works: keygen → encrypt → decrypt
- [ ] `python scripts/qrng_harvester.py` shows Marrakesh→Fez fallback logic
- [ ] No references to "ruflo" in guide (`grep -r "ruflo" guides/`)
- [ ] No phantom V3 skill references (`v3-security-overhaul`, etc.)
- [ ] `.gitignore` covers `_archive/`, `target/`, `*.so`, `demo-*.png`
