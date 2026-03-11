# Zipminator Development Guide

## Python Environment (MANDATORY)

Every Python/pip command MUST be preceded by environment activation:
```bash
micromamba activate zip-pqc
```

All pip installs use `uv pip`:
```bash
uv pip install <package>        # NOT pip install
uv pip install -r requirements.txt
uv pip install maturin
```

## Product Identity

Zipminator is the world's first PQC super-app — a QCaaS/QCaaP cybersecurity platform with 8 pillars of military-grade encryption infrastructure. It shields device network traffic, stored credentials, and data at rest from both classical and quantum adversaries. It is encryption infrastructure, NOT antivirus/EDR.

## Mandatory Session-Start Reads (EVERY session)

Before answering ANY prompt, read these files to understand the product:
1. `docs/guides/FEATURES.md` — Product spec (8 pillars, code-verified status, pricing)
2. `docs/guides/architecture.md` — System architecture (crypto core, layers)
3. `docs/guides/implementation_plan.md` — Roadmap (9 phases, completion %)
4. `MEMORY.md` (auto-loaded) — Cross-session state

After EVERY response that changes code or status:
- Update the relevant pillar status in `docs/guides/FEATURES.md`
- Update `docs/guides/implementation_plan.md` phase checkboxes
- Note progress in commit message or session summary

## Progress Tracking Protocol

After completing any task, record:
1. Which pillar(s) affected and new % complete
2. Which tests pass/fail (with counts)
3. Any new gaps discovered
4. Files modified

Format: `[Pillar N] X% -> Y% | tests: pass/fail | gap: description`

## Project Structure
- `crates/` -- Rust workspace (Kyber768 core, fuzz, NIST-KAT, benchmarks)
- `src/zipminator/` -- Python package with PyO3 bindings
- `api/` -- FastAPI REST backend
- `web/` -- Next.js dashboard (port 3099)
- `tests/` -- All tests (Python, Rust, integration)
- `mobile/` -- Expo React Native app
- `browser/` -- Tauri 2.x PQC browser (DMG at target/release/bundle/dmg/)
- `docs/guides/` -- Documentation
- `docs/guides/FEATURES.md` -- **Canonical product spec** (single source of truth for pillar status)
- `docs/guides/claude-flow-v3/` -- Orchestration guide (RALPH, agent teams, skills, recipes)
- `grants/` -- Grant templates (10 institutions)
- `_archive/` -- Archived docs (old FEATURES.md versions, etc.)

## Build Commands
```bash
# Rust
cargo test --workspace
cargo build --release

# Python (with Rust bindings) -- ALWAYS activate env first
micromamba activate zip-pqc
uv pip install maturin
maturin develop

# API
micromamba activate zip-pqc
cd api && uv pip install -r requirements.txt && uvicorn src.main:app

# Web
cd web && npm install --legacy-peer-deps && npm run dev

# Mobile
cd mobile && npm install && npx expo start

# Full stack
docker-compose up
```

## Testing (TDD-First -- Red/Green/Refactor)
```bash
cargo test --workspace          # Rust tests (268 passed, includes browser/src-tauri)
micromamba activate zip-pqc && pytest tests/  # Python tests
cargo fuzz run fuzz_keygen      # Fuzzing
cd web && npm run build         # Next.js build check
cd mobile && npm test           # Expo tests (11/11 suites)
```

## Web Dev Server
```bash
cd web && npm run dev    # runs on port 3099
```
- OAuth: AUTH_URL=http://localhost:3099 in web/.env.local (production: https://www.zipminator.zip)
- Providers: GitHub, Google, LinkedIn (credentials in .env.local, all callback URLs registered)
- Auth config: web/lib/auth.ts (next-auth v5 beta)

## Key Architecture Decisions
- Rust Kyber768 is the crypto engine, exposed to Python via PyO3/maturin
- Entropy pool aggregates from Rigetti, IBM Quantum, QBraid with OS fallback
- PII scanning runs automatically before encryption (configurable)
- Self-destruct uses DoD 5220.22-M 3-pass overwrite

## Code Conventions
- Rust: clippy clean, no unsafe, constant-time crypto ops
- Python: ruff + black, type hints, pytest, uv pip only
- TypeScript: strict mode, no any
- Max file length: 500 lines

## Data Integrity Rules (MANDATORY)
- NEVER add mock data, fake metrics, or unverified claims (e.g., "1000 downloads", "500 users")
- All numbers in UI, pitch deck, and docs must be verifiable or clearly labeled as projections/targets
- If a metric doesn't exist yet, use "N/A", "Coming soon", or omit it entirely
- Traction slides: only include metrics that can be proven (git commits, test counts, lines of code, npm downloads)
- Financial projections must be labeled "Projected" or "Target" -- never stated as fact
- 0% hallucination tolerance: every claim must have a verifiable source or be removable on challenge

## FIPS Compliance Language
- SAFE: "Implements NIST FIPS 203 (ML-KEM-768)" -- factual algorithm claim
- SAFE: "Verified against NIST KAT test vectors"
- NEVER: "FIPS 140-3 certified/validated" -- requires CMVP certificate ($80-150K)
- NEVER: "FIPS compliant" -- ambiguous, triggers red flags in federal procurement
- See grants/README.md for certification cost ladder

---

## Orchestration: Ruflo v3.5 (Always-On)

Ruflo (formerly claude-flow) is the default orchestration layer. It starts automatically and self-updates daily.

### Setup (run once)
```bash
# Add ruflo as MCP server
claude mcp add ruflo -- npx ruflo@latest mcp start

# Also add ruv-swarm for enhanced coordination
claude mcp add ruv-swarm -- npx ruv-swarm mcp start
```

### Daily Auto-Update (runs on session start)
```bash
# Update ruflo to latest (currently v3.5.14)
npx ruflo@latest update check && npx ruflo@latest update apply
# Update claude-flow alias too
npm update -g ruflo claude-flow 2>/dev/null || true
```

### Ruflo v3.5 Key Features (changelog v3.0 -> v3.5.14)
- 215 MCP tools via FastMCP 3.x
- 60+ specialized agent types
- IPFS plugin marketplace (20 official plugins)
- AgentDB with HNSW indexing (150x-12,500x faster search)
- Flash Attention (2.49x-7.47x speedup)
- ContinueGate safety mechanism
- Rust WASM policy kernel with SIMD128 acceleration
- Agent Booster token optimization (30-50% savings)
- Model routing: auto-select haiku/sonnet/opus by task complexity
- Coverage-based agent routing via RuVector
- Hive-Mind consensus: Byzantine, Raft, Gossip, CRDT, Quorum
- Self-learning hooks with pretrain pipeline
- Background daemon with 12 analysis/optimization workers

### Ruflo CLI Quick Reference
```bash
ruflo swarm init --v3-mode              # Initialize V3 swarm
ruflo agent spawn -t coder              # Spawn agent by type
ruflo hooks pretrain                    # Bootstrap learning from repo
ruflo hooks route "implement feature"   # Route to optimal agent
ruflo hooks model-route "task"          # Pick optimal Claude model
ruflo hooks token-optimize              # 30-50% token savings
ruflo memory search -q "pattern"        # Semantic memory search
ruflo doctor                            # System health check
ruflo plugins list                      # Browse 20 official plugins
ruflo neural train                      # Train on repo patterns
ruflo hive-mind init -t hierarchical-mesh  # Queen-led consensus
```

### Ruflo Hooks (self-learning workflow)
```bash
ruflo hooks pre-task --description "[task]"     # Before work
ruflo hooks post-edit --file "[file]"           # After editing
ruflo hooks post-task --task-id "[task]"         # After work
ruflo hooks session-end --export-metrics true    # End session
ruflo hooks metrics                             # View learning dashboard
```

---

## Claude Code Superpowers (v2.1.70)

### Agent Teams (always enabled)
```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```
- Shared task list with dependency tracking
- Direct inter-agent messaging
- Plan approval gates
- TeammateIdle and TaskCompleted hooks

### Worktree Isolation
Subagents with `isolation: "worktree"` get their own git branch. Safe parallel editing.

### Extended Thinking (Three Tiers)
- **think** (~4K tokens): routine debugging, quick fixes
- **megathink** (~10K tokens): API design, performance optimization, architecture review
- **ultrathink** (~32K tokens): system architecture, critical production bugs, crypto code, security audits
- Trigger via keywords in prompt. Toggle with `Tab` key.
- Force via env: `export CLAUDE_REASONING_EFFORT=high`

### Plan Mode
- `Shift+Tab` cycles: normal -> auto-accept -> plan mode
- In plan mode: reads files, answers questions, no changes made
- `Ctrl+G` opens plan in text editor for direct editing
- Workflow: Explore (plan) -> Plan (plan) -> Implement (normal) -> Commit

### 1M Context Window
Available on Max plan with Opus 4.6. Disable with `CLAUDE_CODE_DISABLE_1M_CONTEXT`.

### Key Slash Commands
- `/pair-programming` -- Navigator/Driver TDD mode
- `/hive-mind-advanced` -- Queen-led multi-agent coordination
- `/sparc-methodology` -- SPARC TDD (Specification, Pseudocode, Architecture, Refinement, Completion)
- `/verification-quality` -- Truth scoring with automatic rollback
- `/simplify` -- Code review for reuse, quality, efficiency
- `/go` -- Session startup routine (reads state, runs tests, browser check)
- `/compact <instructions>` -- Proactively compact context at ~70% usage
- `/clear` -- Fresh context between unrelated tasks
- `/rewind` -- Undo conversation steps, restore code

### Keyboard Shortcuts
- `Esc` -- stop mid-action (context preserved)
- `Esc+Esc` -- rewind menu (restore conversation, code, or both)
- `Shift+Tab` -- cycle modes (normal/auto-accept/plan)
- `Tab` -- toggle extended thinking
- `Ctrl+T` -- task list
- `Shift+Down` -- cycle agent team teammates

### Prompt Notation
- `@<filename>` -- reference files
- `#<content>` -- add to CLAUDE.md
- `!<command>` -- execute shell command
- `& <task>` -- background task

### MCP Servers (always active)
- `ruflo` -- Agent orchestration, swarm coordination, 215 MCP tools
- `ruv-swarm` -- Enhanced coordination, DAA agents, neural patterns
- `playwright` -- Browser automation, screenshots, visual verification (#2 most popular MCP)
- `context7` -- Up-to-date library documentation lookup (#1 most popular MCP, prevents hallucination)

---

## RALPH Loop (Mandatory Iteration Protocol)

Every non-trivial task follows RALPH. Max 12 iterations, then escalate.

```
R - Research    Read specs, existing code, spawn researcher subagents
A - Architecture   Design solution, get user approval if non-trivial
L - Logic       TDD: write failing test first, implement, verify green
P - Polish      /simplify, remove dead code, clean naming
H - Harden      Security audit, cargo test, pytest, Playwright screenshot
```

### Quality Gates (must ALL pass before "done")
- [ ] cargo test --workspace passes
- [ ] pytest tests/ passes (if Python touched)
- [ ] npm run build passes (if web touched)
- [ ] Playwright screenshot verifies visual output
- [ ] No console errors in browser
- [ ] No private key leaks in code
- [ ] Constant-time crypto ops verified

### Automating RALPH
```bash
bash docs/guides/claude-flow-v3/scripts/ralph-loop.sh
```

---

## Zero-Hallucination Protocol

### Claim Verification (MANDATORY)
- NEVER state unverified facts about external systems, libraries, or APIs
- ALWAYS verify claims with: WebFetch, WebSearch, context7 docs lookup, or source code reading
- If uncertain: state "I cannot verify this" and ask user for source
- Use AskUserQuestion as DEFAULT when multiple valid approaches exist

### Citation Protocol
- Verify DOI resolves before citing: `WebFetch https://doi.org/[DOI]`
- Verify arXiv exists: `WebFetch https://arxiv.org/abs/[ID]`
- Cross-check: title, authors, year, journal must match
- NEVER invent citation keys or guess DOIs

### Critical Claim Critique
Before delivering ANY result:
1. Re-read your output for unsupported claims
2. Flag speculative statements with "[unverified]"
3. Run code to prove it works -- NEVER say "it should work"
4. Take Playwright screenshots as proof of visual output

---

## Context Engineering Protocol

### Session Startup (auto via /go)
1. Read CLAUDE.md + MEMORY.md
2. Check git status for uncommitted work
3. Run ruflo hooks session-restore
4. Update ruflo to latest version
5. Load relevant task tracker state
6. Run quick verification sweep (cargo test, npm build)

### AskUserQuestion (DEFAULT behavior)
Use AskUserQuestion tool proactively when:
- Multiple valid implementation approaches exist
- Architecture decisions have trade-offs
- User intent is ambiguous
- Destructive or irreversible actions are about to happen
- Business logic choices need domain knowledge

### Interview Pattern (for large features)
For complex tasks, start with: "Interview me about [feature] using AskUserQuestion. Ask about technical implementation, edge cases, concerns, and tradeoffs. Keep interviewing until we've covered everything, then write a spec." Then start a fresh session to execute with clean context.

### Writer/Reviewer Pattern
For quality-critical code: Session A implements, Session B reviews (fresh context prevents bias). Alternative: Session A writes tests, Session B writes code to pass them.

### Context Window Management
- Start fresh sessions per task; `/clear` between unrelated tasks
- `/compact <instructions>` proactively at ~70% context usage
- Delegate research to subagents (they explore in separate windows, return summaries)
- After two failed corrections: `/clear` and rewrite the prompt
- `/rewind` > "Summarize from here" to compact partial conversation

### Prompt Enhancement Stack
When launching `claude` or `claude --dangerously-skip-permissions`:
1. ruflo auto-updates to latest version
2. Source activate-all.sh for env vars
3. Agent teams enabled
4. Ultrathink available via keyword
5. RALPH loop active for all tasks
6. AskUserQuestion enabled as default interaction pattern

---

## Session Activation Script

```bash
# Full activation (source before claude launch)
source docs/guides/claude-flow-v3/scripts/activate-all.sh
```

This exports:
- CLAUDE_AGENT_TEAMS=true
- CLAUDE_REASONING_EFFORT=high
- ZIPMINATOR_ROOT, ZIPMINATOR_WEB, ENTROPY_POOL paths

---

## Task Tracker (updated 2026-03-06)

### Completed
- [x] Delete 28 empty CLAUDE.md stubs
- [x] Split orchestration guide into docs/guides/claude-flow-v3/ (16 files + 3 scripts)
- [x] Improve all 20 pitch deck slides (green credentials, Norwegian positioning, competitive data)
- [x] RALPH loop: screenshot all slides, verify rendering
- [x] Move 72 screenshots from root to _screenshots/
- [x] Add AUTH_URL=http://localhost:3099 to web/.env.local
- [x] Update package.json dev script to use port 3099
- [x] Fix DeviceShield.tsx: "Secure Everything" -> "Secure Every Communication"
- [x] Research FIPS 203 vs 140-3 certification (cost ladder documented)
- [x] Research cell tower masking (5G SUCI analysis)
- [x] Research Anthropic latest features (Claude Code Security, Vercept acquisition)
- [x] Research Shannon/KeygraphHQ (AGPL-3.0, use externally only)
- [x] Research open source PQC strategy (Apache-2.0 for crypto, proprietary for apps)
- [x] Update CLAUDE.md: ruflo v3.5 always-on, micromamba+uv pip, RALPH, zero-hallucination

### Completed (2026-03-09, Sprint 2)
- [x] Wave 4 UI Polish Sprint: glass-morphic QuantumCard, PillarHeader animations, GradientBackground, PqcBadge, ShimmerPlaceholder
- [x] OpenClaw -> Q-AI Assistant rename across 17+ files (0 references remaining)
- [x] 66 PNGs moved from root to _screenshots/
- [x] 15+ CLAUDE.md stubs deleted
- [x] FIPS language violations fixed in web/docs/
- [x] Shell scaffold upgraded: 4+More mobile nav, desktop NavigationRail with logo, AnimatedSwitcher transitions
- [x] Theme upgraded: pageTransitions, bottomSheetTheme, dialogTheme, chipTheme, gradient helpers
- [x] All 8 pillar screens polished with QuantumCard, PillarHeader, entry animations
- [x] flutter analyze: 0 issues, flutter test: 23/23 pass, cargo test: 302 pass, web build: 0 errors
- [x] MEMORY.md + FEATURES.md + implementation_plan.md updated for Q-AI rename

### Completed (2026-03-09, Sprint 1)
- [x] FEATURES.md consolidated: single source of truth at docs/guides/FEATURES.md (code-verified percentages)
- [x] Root FEATURES.md archived to _archive/FEATURES-v0.2-2026-03-02.md
- [x] CLAUDE.md: added mandatory session-start reads, product identity, progress tracking protocol
- [x] implementation_plan.md: corrected Phase 7/8 status to match code audit
- [x] DMG tested on M1 Max: mounts, launches, ad-hoc signed (aarch64 = all Apple Silicon)
- [x] MEMORY.md updated: product identity, DMG path, correct test counts, doc locations
- [x] OAuth provider console callback registration (all 3 providers verified working)

### Completed (2026-03-08)
- [x] Remove /invest from protectedPaths in auth.ts (was inconsistent with middleware.ts)
- [x] Set up vitest + @testing-library for web/ (first test infrastructure)
- [x] TDD: 15 waitlist tests (8 API route + 7 component) -- all pass
- [x] Fix globals.css: remove Tailwind v4 border-border/outline-ring (shadcn v4 vs Tailwind v3 conflict)
- [x] npm run build: 0 errors, 24 routes
- [x] Playwright: 0 console errors, hero + waitlist sign-in card screenshots verified
- [x] Grant templates audited: 10/10 complete, FIPS language fixed in eic-accelerator.md
- [x] GitHub OAuth callback URL registered via Playwright
- [x] Google OAuth callback URL registered via Playwright (mo@qdaria.com, project qdaria-25-firebase)
- [x] LinkedIn OAuth: callback URL already registered (http://localhost:3099/api/auth/callback/linkedin)
- [x] Vercel production deployed: https://www.zipminator.zip (22 routes, 0 errors, AUTH_URL set)
- [x] Fix 12 Rust clippy warnings (cargo fix + pub IBMQuantumStats)

### Completed (2026-03-06)
- [x] Update CLAUDE.md: ruflo v3.5 always-on, micromamba+uv pip, RALPH, zero-hallucination
- [x] Docs consolidation: documentation/ archived, empty dirs removed, no other duplicates found
- [x] Update docs/guides/claude-flow-v3/ for ruflo v3.5 (README, 03-superpowers, 14-mcp, activate-all.sh)
- [x] Directory audit: 9.2G total, ~5.1G build cache, codebase clean, no code duplicates
- [x] TDD verification: cargo test 166/166, web build 22 pages 0 errors, mobile 11/11 suites 267/274 tests

### Completed (previous sessions)
- [x] Run cargo test --workspace: 166 tests passed, 0 failures
- [x] Fix SOC 2 Type II -> SOC 2 Ready (Footer, CTA, AskSlide)
- [x] Browser-inspect all pages: landing, features, demo, dashboard (9 tabs), impact
- [x] Supabase waitlist: SQL + RLS + form submission verified (Playwright screenshot proof)
- [x] One-click installer design: Tauri 2.x desktop, Expo mobile
- [x] JupyterLab integration: 6 files created (magics, widgets, display, bridge, __init__, notebook)
- [x] zip-pqc micromamba env: 312 packages, full data science stack
- [x] One-click installer script: scripts/install-jupyter-env.sh
- [x] /go startup routine: .claude/commands/go.md
- [x] Mobile Expo TDD: 0 TS errors, 11/11 test suites pass (267/274)
- [x] Fix react-native-webrtc web crash: VoipService.web.ts
- [x] Expo web dev server verified: HTTP 200, 1142 modules bundled
