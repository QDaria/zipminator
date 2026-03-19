# End-to-End 100% Completion Sprint — Full Orchestration Prompt

> **Origin**: `prompt0.md` — parallelised agent teams, ruflo v3, superpowers, RALPH N=20, /batch, /simplify
>
> **Goal**: 9 agent teams (one per track N, R, S, T, V, W, U, X, Y), each with RALPH loop N=20 or convergence threshold 0.995.
>
> **Method**: Parallelised agent teams using ruflo v3 + superpowers + all available skills/agents/commands.

---

## RALPH Loop Protocol (ALL tracks)

```
RALPH N=20, threshold=0.995:
  R - Research    Read specs, spawn researcher subagent, Context7 docs
  A - Architecture Design solution, AskUserQuestion if trade-offs
  L - Logic       TDD: failing test → implement → green
  P - Polish      /simplify, dead code, naming
  H - Harden      Security audit, cargo test, pytest, Playwright screenshot

  Repeat until:
    - All quality gates pass (convergence), OR
    - Threshold 0.995 reached on verification score, OR
    - N=20 iterations exhausted → escalate to user
```

---

## Skills to Invoke Per Track

### Core Skills (use on ALL tracks):
- `/verification-quality` — truth scoring with automatic rollback (0.95 threshold)
- `/simplify` — code review for reuse, quality, efficiency
- `/pair-programming` — navigator/driver TDD mode
- `/batch-tdd` — parallel TDD across all domains
- `/hive-tdd` — hive-mind TDD with RALPH

### Specialized Skills (per track):
- `/agentic-jujutsu` — quantum-resistant version control for AI agents
- `/hive-mind-advanced` — queen-led multi-agent coordination
- `/quantum-hive-mind-therese-helen` — supreme orchestrator for QRC scaling
- `/reasoningbank-agentdb` — adaptive learning with AgentDB
- `/reasoningbank-intelligence` — pattern recognition + strategy optimization
- `/agentdb-advanced` — QUIC sync, multi-DB, hybrid search
- `/agentdb-learning` — 9 reinforcement learning algorithms
- `/agentdb-memory-patterns` — persistent memory for agents
- `/agentdb-optimization` — quantization, HNSW indexing, caching
- `/agentdb-vector-search` — semantic vector search

### Domain Skills:
- `/quantum-backend-api` — for Pillar 6, 7 backend work
- `/quantum-frontend-dashboard` — for UI wiring (Pillar 1, 8)
- `/quantum-assurance-validator` — physics fact-checking
- `/quantum-cryptanalysis-expert` — crypto code review (Pillar 3, 6, 9)
- `/docker-containerization` — Track U email transport
- `/test-specialist` — test writing across all tracks
- `/performance-analysis` — bottleneck detection
- `/hooks-automation` — ruflo hook coordination

---

## Agents to Spawn Per Track

### From `.claude/agents/`:
- `testing/` — test runners, coverage, fuzzing
- `analysis/` — code analysis, bottleneck detection
- `architecture/` — system design validation
- `core/` — crypto core work (Pillars 1, 3, 6, 9)
- `development/` — feature implementation
- `devops/` — Docker, CI/CD, deployment (Track U, N, R)
- `documentation/` — FEATURES.md updates
- `github/` — PR, issues, release management
- `hive-mind/` — queen-led coordination
- `neural/` — pattern training
- `optimization/` — performance tuning
- `reasoning/` — complex decision making
- `specialized/` — domain-specific tasks

---

## Commands Available

### From `.claude/commands/`:
- `/go` — session startup (reads state, runs tests, browser check)
- `/batch-tdd` — parallel TDD across all domains
- `/hive-tdd` — hive-mind TDD with RALPH
- `/mega-task` — full-stack multi-day mission
- `/sprint-task` — medium-complexity 30-180 min mission
- `/self-improve` — self-improving learning loop

### From `.claude/commands/` directories:
- `agents/` — agent spawning, capabilities, coordination, types
- `analysis/` — bottleneck detect, token efficiency, performance report
- `automation/` — auto-agent, smart-spawn, self-healing, session memory
- `coordination/` — swarm init, agent spawn, task orchestrate
- `hive-mind/` — init, spawn, memory, consensus, metrics, wizard
- `github/` — issue triage, PR enhance, code review, repo analyze
- `hooks/` — pre-task, post-task, pre-edit, post-edit, session-end
- `monitoring/` — status, agents, real-time-view, metrics
- `optimization/` — parallel-execute, auto-topology, cache-manage
- `training/` — neural patterns, model update, specialization
- `workflows/` — create, execute, export

---

## Track Status & Execution Plan

### DONE (this session — Recipes S, T, V, W + Sprint):
| Track | What | Status |
|-------|------|--------|
| S | Q-AI prompt guard (18 patterns) | DONE |
| T | Anonymizer L4-L10 (64 tests) | DONE |
| V | Messenger persistence + offline queue | DONE |
| W | Browser AI sidebar integration | DONE |
| — | CLI `anonymize --level N` (Pillar 5) | DONE |
| — | PII scan before AI send (Pillar 6) | DONE, 27 tests |
| — | VoIP encrypted voicemail (Pillar 3) | DONE, 4 new tests |
| — | Q-Mesh NVS provisioner (Pillar 9) | DONE, 6 new tests |

### REMAINING (execute NOW):
| Priority | Track | Pillar | Gap | RALPH N= |
|----------|-------|--------|-----|----------|
| 1 | **Pillar 1** | Vault | Tauri self-destruct UI wiring | 10 |
| 2 | **Pillar 6** | Q-AI | PQC tunnel for remote LLM | 20 |
| 3 | **Track U** | Mail | SMTP/IMAP Docker stack + e2e | 15 |
| 4 | **Track N** | PyPI | Publish wheel to PyPI | 5 |
| 5 | **Track R** | App Store | iOS TestFlight + APK | 10 |

### UNBLOCKED:
- **Track N (PyPI)**: No token in system. Need `PYPI_TOKEN`. Generate at pypi.org/manage/account/token. Then: `maturin build --release && twine upload target/wheels/*.whl`
- **Track R (App Store)**: **SIGNING CERTS FOUND!** Team 5EK49H64WB, 4 valid identities. Flutter already configured with `DEVELOPMENT_TEAM = 5EK49H64WB`. Can build immediately:
  - iOS: `cd app && flutter build ipa`
  - macOS: `cd app && flutter build macos`
  - Android: needs Play Store keystore (`keytool -genkey`)

---

## Convergence Criteria (ALL must pass)

```bash
# Rust
cargo test --workspace                    # 0 failures

# Python
micromamba activate zip-pqc && pytest tests/ --tb=no -q  # 0 errors

# Web
cd web && npx next build                  # clean

# Flutter
cd app && flutter test                    # 23+ tests pass

# FEATURES.md
# Summary table % = detail section %

# Git
git status                                # clean
```

---

## Helpers & Rules

- `.claude/helpers/` — auto-commit, model-router, etc.
- `.claude/rules/00-core.md` — communication, thinking, file ops, git
- `.claude/rules/01-stack.md` — Next.js 16 + shadcn v4 + Tailwind v4
- `.claude/rules/02-security-pqc.md` — NIST PQC, DORA compliance
- `.claude/rules/tdd-ralph.md` — TDD-first + RALPH phases
- `.claude/rules/model-routing.md` — Opus/Sonnet/Haiku per domain
- `.claude/rules/zero-hallucination.md` — claim verification, FIPS language
- `.claude/rules/context-management.md` — /compact, agent teams, delegation

---

*Prompt0 origin preserved. All skills, agents, commands, and RALPH N=20 protocol included.*
*Updated 2026-03-19 after completion sprint session.*
