<!-- SECTION: HEADER -->
# The Complete Claude Code Operator's Guide
# Zipminator Enhancement Stack: From First Command to Full Orchestration

> **Infrastructure**: 137 skills, 173 commands, 87 agents, 9 helpers, 6 rules, Ruflo v3.5 (215 MCP tools)
> **Version**: v1.0 | 2026-03-27
> **Audience**: Developers with access to the Zipminator `.claude/` infrastructure
> **How to read**: Each part is self-contained. Start with Part 8 (Quick Reference) for daily use, Part 2 for learning, Parts 4-5 for specific missions.

---

<!-- SECTION: PART 1 -->
# Part 1: The Improved Universal Prompt

Your original prompt asked Claude to explain how to use all slash commands, skills, workflows, and orchestration tools together, with use cases for research paper improvement and product shipping, plus a one-push improve mechanism.

Here is that prompt refined through 3 rounds.

## Round 1: Structure (add caps, modes, infrastructure awareness)

> I need a comprehensive tutorial on using the full Claude Code enhancement stack in this project. The stack includes:
>
> **Infrastructure** (auto-discovered from `.claude/`):
> - 137 skills (quantum specialists, agentdb, reasoningbank, stream-chain, etc.)
> - 173 slash commands (swarm/, hive-mind/, sparc/, hooks/, memory/, bmad/, etc.)
> - 87 agent definitions (core, consensus, optimization, swarm, testing)
> - Ruflo v3.5 with 215 MCP tools (always-on orchestration)
> - Superpowers plugin (brainstorming, TDD, debugging, plan mode, worktrees)
> - BMAD workflows (PRD, sprint planning, story creation, code review)
> - MCP servers: ruflo, ruv-swarm, playwright, context7, chrome-devtools, pinecone
>
> **Deliverables**:
> 1. Layered tutorial: basics → composition → advanced orchestration
> 2. Use Case A: Improve research paper (main.tex) to 0.995 threshold for Nature/Science
> 3. Use Case B: Ship Zipminator to all platforms with 100% pillar completion
> 4. A `/improve` command for one-push output improvement at any conversation stage
> 5. Industry best practices for prompt engineering, context management, agent coordination
>
> **Constraints**:
> - Max 3 rounds of clarifying questions, with self-answer suggestions
> - If a task exceeds one session, document what's achievable and what's blocked
> - Zero hallucination: verify all claims against actual `.claude/` file inventory
> - Reference existing docs (AESR v4, prompt_master, end-to-end, claude-flow-v3) rather than duplicating

## Round 2: Specificity (add concrete tools per use case)

> I need a comprehensive tutorial on the full Claude Code enhancement stack.
>
> **For research paper improvement** (Use Case A), the tutorial should show:
> - Which skills to load: `/quantum-scientific-writer`, `/research-paper-writer`, `/verification-quality`, `/quantum-assurance-validator`, `/quantum-cryptanalysis-expert`
> - Orchestration: `/hive-mind-advanced` with 7 workstreams (theory, literature, experiments, format, prose, adversarial, false-positive)
> - Pipeline: `/stream-chain` 7-stage AESR pipeline per workstream
> - Iteration: RALPH inner loops (max 5 per worker), outer loop (max 12), threshold 0.995
> - Learning: ReasoningBank trajectory at session end, distill to CLAUDE.md if score > 0.85
>
> **For product shipping** (Use Case B), the tutorial should show:
> - Gap analysis from `docs/guides/FEATURES.md` + `implementation_plan.md`
> - 9 parallel agent teams (from end-to-end-100percent-completion.md)
> - RALPH N=20, threshold 0.995
> - Manual vs automated separation (Apple signing, PYPI_TOKEN = manual; everything else = automated)
> - Session continuity: `/compact` + ruflo memory checkpoint + `/go` to resume
>
> **For the `/improve` mechanism**: Score on 5 dimensions (correctness, completeness, clarity, efficiency, impact), propose 3 fixes with skill recommendations, apply on approval, re-score, learn.
>
> **Model routing**: Opus for crypto/security, Sonnet for features/tests, Haiku for docs/config.
> **Quality assurance**: `/verification-quality` with 0.95 threshold (0.99 for crypto), Playwright screenshots, zero-hallucination protocol.

## Round 3: Final Refined Prompt

> **MISSION**: Create the Complete Claude Code Operator's Guide for the Zipminator project.
>
> **CONTEXT**: This project has 137 skills, 173 commands, 87 agents, 215 Ruflo MCP tools, and extensive orchestration infrastructure in `.claude/`. Existing documentation is scattered across `docs/guides/prompts/AESR_v4_universal_guide.md`, `prompt_master.md`, `end-to-end-100percent-competion.md`, and `docs/guides/claude-flow-v3/` (17 files + 3 scripts). This guide unifies everything.
>
> **STRUCTURE** (8 parts):
> 1. Improved universal prompt (this section, 3-round refinement)
> 2. Foundation layer: 16 subsystems explained individually with copy-paste examples
> 3. Composition patterns: 8 patterns from quick-fix to multi-day campaigns
> 4. Use Case: Research paper to Nature/Science caliber (0.995, 7 workstreams, hive-mind + stream-chain + RALPH)
> 5. Use Case: Ship Zipminator to all platforms (9 agent teams, RALPH N=20)
> 6. The `/improve` mechanism (one-push output improvement)
> 7. Industry best practices (prompt engineering, context, agents, memory, QA, sessions)
> 8. Quick reference cards (top 30 commands, skill matrix, decision matrix, shortcuts, 5 starter prompts)
>
> **CONSTRAINTS**:
> - Every slash command and skill mentioned must exist in `.claude/commands/` or `.claude/skills/`
> - Copy-paste prompts must be directly pasteable into Claude Code
> - Reference existing docs by path (don't duplicate content)
> - Zero hallucination: every capability claim is verified against the actual file system
> - Structural limits: document what cannot be done in a single session
> - Max iteration caps: 3 for Q&A, 12 for RALPH, 20 for end-to-end sprints
>
> **AVAILABLE TOOLS** (auto-discovered):
> - `/improve` for one-push improvement at any point
> - `/go` for session startup
> - `/mega-task` for multi-day missions
> - `/sprint-task` for 30-180 min tasks
> - `/hive-mind-advanced` for queen-led orchestration
> - `/batch-tdd` for parallel TDD
> - `/self-improve` for learning loops
> - `/simplify` for code review
> - `/verification-quality` for truth scoring
> - `/ralph-loop` for RALPH iteration management
> - `/schedule` for cron-scheduled remote agents
> - `/loop` for recurring interval tasks
> - 16 `/sparc:*` modes for SPARC methodology
> - 12 `/hive-mind:*` commands for hive coordination
> - 10 `/swarm:*` commands for swarm management
> - 30+ `/bmad:*` workflows for product management

---

<!-- SECTION: PART 2 -->
# Part 2: Foundation Layer — How Each Capability Works

Each subsection: 1-paragraph explanation, exact invocation syntax, copy-paste example.

---

## 2.1 CLAUDE.md + Rules (Always-Loaded Context)

**What**: `CLAUDE.md` files at project root, `.claude/CLAUDE.md`, and parent directories are auto-loaded on every Claude Code session. They form your persistent system prompt. Rule files in `.claude/rules/*.md` are also auto-loaded and act as behavioral guardrails.

**Files**:
- `CLAUDE.md` (root) — project overview, build commands, conventions, orchestration setup
- `.claude/rules/00-core.md` — communication rules, thinking tiers, file operations
- `.claude/rules/01-stack.md` — Next.js 16, shadcn/ui v4, Tailwind v4, TypeScript strict
- `.claude/rules/02-security-pqc.md` — NIST PQC standards, DORA compliance, FIPS language
- `.claude/rules/tdd-ralph.md` — TDD-first protocol, RALPH phases, quality gates
- `.claude/rules/model-routing.md` — Opus/Sonnet/Haiku routing by file type and domain
- `.claude/rules/context-management.md` — `/compact` triggers, agent teams vs subagents, delegation
- `.claude/rules/zero-hallucination.md` — claim verification, citation protocol, FIPS language

**Example**: Rule `02-security-pqc.md` prevents you from ever writing "FIPS 140-3 certified" (requires $80-150K CMVP certificate). You can say "Implements NIST FIPS 203 (ML-KEM-768)".

---

## 2.2 Skills (137 On-Demand Domain Specialists)

**What**: Skills live in `.claude/skills/*/SKILL.md`. They are NOT auto-loaded — invoked via `/skill-name` or when an orchestrator references them. Each skill has YAML frontmatter defining its domain, triggers, and verification checklists. Skills are the specialized knowledge modules of the system.

**Invocation**: Type `/skill-name` in Claude Code chat. The skill content loads into active context.

**Key skills by category**:

| Category | Skills | When to use |
|----------|--------|-------------|
| Orchestration | `hive-mind-advanced`, `swarm-advanced`, `swarm-orchestration` | Multi-agent campaigns |
| Quality | `verification-quality`, `simplify`, `pair-programming` | Every code change |
| Research | `quantum-scientific-writer`, `research-paper-writer`, `quantum-literature-synthesis-expert` | Paper writing |
| Learning | `reasoningbank-agentdb`, `reasoningbank-intelligence`, `agentic-jujutsu`, `agentdb-*` (5 skills) | Cross-session learning |
| Quantum | `quantum-cryptanalysis-expert`, `quantum-assurance-validator`, `quantum-circuit-architect` + 15 more | PQC/physics work |
| Pipeline | `stream-chain`, `sparc-methodology` | Multi-stage processing |
| Dev tools | `test-specialist`, `docker-containerization`, `cicd-pipeline-generator`, `github-*` (5 skills) | DevOps and CI/CD |
| Product | `pitch-deck`, `startup-validator`, `brand-analyzer` | Business deliverables |

**Example**:
```
# Load verification quality skill for truth scoring
/verification-quality

# Now Claude has the 0.95 threshold protocol, automatic rollback, and scoring rubric in context
```

---

## 2.3 Commands (173 Slash Commands)

**What**: Commands live in `.claude/commands/**/*.md`. They are auto-discovered and available as `/command-name` or `/category:command-name`. Commands are action-oriented instructions that Claude executes immediately.

**Top-level commands** (most used):

| Command | What it does | Time |
|---------|-------------|------|
| `/go` | Session startup: load context, run tests, verify state, produce status report | 5 min |
| `/improve` | One-push improve: score output, propose 3 fixes, apply on approval | 2-5 min |
| `/mega-task` | Full-stack multi-day mission with all orchestration systems | Hours-days |
| `/sprint-task` | Medium-complexity 30-180 min mission | 30-180 min |
| `/batch-tdd` | Parallel TDD across all domains (Rust, Python, Web, Mobile) | 30-60 min |
| `/hive-tdd` | Hive-mind TDD with RALPH loop | 1-4 hours |
| `/self-improve` | Train ruflo intelligence pipeline on session history | 15 min |
| `/pitch` | Improve pitch deck slides with hive-mind workers | 1-2 hours |

**Command categories** (invoke as `/category:command`):

| Category | Commands | Examples |
|----------|----------|---------|
| `swarm:` | 10 commands | `/swarm:swarm-init`, `/swarm:swarm-status`, `/swarm:swarm-modes` |
| `hive-mind:` | 12 commands | `/hive-mind:hive-mind-init`, `/hive-mind:hive-mind-spawn`, `/hive-mind:hive-mind-consensus` |
| `sparc:` | 16 modes | `/sparc:tdd`, `/sparc:architect`, `/sparc:coder`, `/sparc:reviewer` |
| `hooks:` | 6 commands | `/hooks:pre-task`, `/hooks:post-task`, `/hooks:session-end` |
| `memory:` | 5 commands | `/memory:memory-search`, `/memory:memory-persist`, `/memory:neural` |
| `analysis:` | 5 commands | `/analysis:bottleneck-detect`, `/analysis:token-efficiency` |
| `coordination:` | 7 commands | `/coordination:swarm-init`, `/coordination:agent-spawn`, `/coordination:orchestrate` |
| `optimization:` | 6 commands | `/optimization:parallel-execute`, `/optimization:auto-topology` |
| `training:` | 6 commands | `/training:neural-train`, `/training:pattern-learn`, `/training:specialization` |
| `monitoring:` | 6 commands | `/monitoring:status`, `/monitoring:real-time-view`, `/monitoring:agent-metrics` |
| `automation:` | 6 commands | `/automation:smart-spawn`, `/automation:self-healing`, `/automation:session-memory` |
| `workflows:` | 5 commands | `/workflows:workflow-create`, `/workflows:research`, `/workflows:development` |
| `agents:` | 5 commands | `/agents:agent-spawning`, `/agents:agent-types`, `/agents:agent-coordination` |
| `github:` | 6 commands | `/github:code-review`, `/github:pr-enhance`, `/github:repo-analyze` |
| `bmad:` | 30+ commands | `/bmad:bmm:workflows:prd`, `/bmad:bmm:workflows:sprint-planning`, `/bmad:cis:workflows:brainstorming` |

**Example**:
```
# Start a session
/go

# Begin a medium-complexity task
/sprint-task

# At session end, train the learning pipeline
/self-improve
```

---

## 2.4 Agents (87 Specialist Definitions)

**What**: Agent definitions in `.claude/agents/**/*.md` define specialist personas used by hive-mind, ruflo swarms, and the Task tool. Each agent has its own system prompt, domain expertise, and tool preferences. They are not invoked directly — they are spawned by orchestrators.

**Categories**:

| Category | Count | Agents | Use case |
|----------|-------|--------|----------|
| `core/` | 5 | coder, tester, reviewer, researcher, planner | Every task |
| `consensus/` | 7 | byzantine-coordinator, raft-manager, gossip-coordinator, quorum-manager, crdt-synchronizer, security-manager, performance-benchmarker | Multi-agent agreement |
| `swarm/` | 3 | hierarchical-coordinator, mesh-coordinator, adaptive-coordinator | Topology selection |
| `optimization/` | 5 | load-balancer, resource-allocator, benchmark-suite, topology-optimizer, performance-monitor | Performance work |
| `testing/` | 2 | tdd-london-swarm, production-validator | Quality gates |
| `reasoning/` | 2 | agent (general), goal-planner | Complex decisions |
| `hive-mind/` | 5 | queen-coordinator, collective-intelligence, scout-explorer, worker-specialist, swarm-memory-manager | Large campaigns |
| Others | 58+ | documentation, devops, analysis, development, architecture, specialized, github, neural, flow-nexus | Domain-specific |

**How agents are spawned** (three methods):

```
# Method 1: Claude Code Task tool (most common)
Task("Crypto auditor", "Review crates/ for constant-time violations", "reviewer")

# Method 2: Hive-mind (for large campaigns)
/hive-mind-advanced  # spawns queen + N workers from agent definitions

# Method 3: Ruflo CLI
ruflo agent spawn -t coder
```

---

## 2.5 Helpers (9 Shell Scripts)

**What**: Bash scripts in `.claude/helpers/` for infrastructure operations that run outside Claude's context.

| Script | Purpose |
|--------|---------|
| `auto-commit.sh` | Post-task conventional commits |
| `feedback-loop.sh` | Self-improvement metrics collection |
| `model-router.sh` | Model tier selection by file type |
| `checkpoint-manager.sh` | Git checkpoint before risky operations |
| `github-setup.sh` | Auth and repo configuration |
| `github-safe.js` | Safe GitHub operations wrapper |
| `setup-mcp.sh` | Wire MCP servers |
| `quick-start.sh` | First-time project setup |
| `standard-checkpoint-hooks.sh` | Standard checkpoint hook configuration |

**Example**:
```bash
# Before a risky refactor, checkpoint the current state
bash .claude/helpers/checkpoint-manager.sh

# After a task, auto-commit with conventional format
bash .claude/helpers/auto-commit.sh
```

---

## 2.6 Ruflo v3.5 MCP (215 Tools, Always-On)

**What**: Ruflo (formerly claude-flow) is the MCP orchestration layer providing 215 tools for memory, hooks, swarms, hive-mind, neural training, browser automation, workflows, agent management, and system monitoring. It runs as an MCP server and is always available.

**Installation** (one-time):
```bash
claude mcp add ruflo -- npx ruflo@latest mcp start
claude mcp add ruv-swarm -- npx ruv-swarm mcp start
```

**Key CLI commands**:
```bash
ruflo swarm init --v3-mode              # Initialize V3 swarm
ruflo agent spawn -t coder              # Spawn agent by type
ruflo hooks pretrain                    # Bootstrap learning from repo
ruflo hooks route "implement feature"   # Route to optimal agent
ruflo hooks model-route "task"          # Pick optimal Claude model
ruflo hooks token-optimize              # 30-50% token savings
ruflo memory search -q "pattern"        # Semantic memory search
ruflo neural train                      # Train on repo patterns
ruflo doctor                            # System health check
ruflo plugins list                      # Browse 20 official plugins
ruflo hive-mind init -t hierarchical-mesh  # Queen-led consensus
```

**MCP tool categories** (accessible as `mcp__claude-flow_alpha__*` or `mcp__ruv-swarm__*`):

| Category | Example tools |
|----------|--------------|
| Coordination | `swarm_init`, `agent_spawn`, `task_orchestrate`, `coordination_sync` |
| Memory | `memory_store`, `memory_search`, `memory_retrieve` |
| Neural | `neural_train`, `neural_patterns`, `neural_predict` |
| Hooks | `hooks_pretrain`, `hooks_route`, `hooks_model-route`, `hooks_metrics` |
| Browser | `browser_open`, `browser_screenshot`, `browser_snapshot` |
| Workflows | `workflow_create`, `workflow_execute`, `workflow_status` |
| GitHub | `github_repo_analyze`, `github_pr_manage`, `github_metrics` |
| System | `system_health`, `system_metrics`, `performance_report` |

---

## 2.7 Hooks (Self-Learning Workflow)

**What**: Hooks in `settings.json` run automatically on specific events. They enable the intelligence pipeline — learning from every operation without manual intervention.

**Hook types**:
```
PreToolUse   — Before a tool executes (validate, route, prepare)
PostToolUse  — After a tool executes (format, learn, notify)
Stop         — When Claude stops responding (auto-commit, session summary)
SessionStart — When a session begins (restore context, update ruflo)
```

**Example hooks from settings.json**:
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "command": "npx ruflo@latest hooks pre-command"
    }],
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "command": "npx ruflo@latest hooks post-edit --file \"$FILE\""
    }],
    "Stop": [{
      "command": "npx ruflo@latest hooks session-end --export-metrics true"
    }]
  }
}
```

**What hooks enable**: Every file edit triggers ruflo learning. Every session end exports metrics. Every bash command is validated for safety. This creates a self-improving system that gets smarter with each session.

---

## 2.8 Extended Thinking / Effort Control (v2.1.88)

**What**: Four effort levels for Opus 4.6. Controlled via CLI flag `--effort` or `/effort` slash command. The old "ultrathink" keyword is deprecated; use `--effort max` instead.

| Level | Tokens | When to use | Invocation |
|-------|--------|-------------|------------|
| low | ~4K | Typo, rename, config change | `--effort low` |
| medium | ~16K | Feature work, API design | Default for Opus 4.6 |
| high | ~32K | Architecture, cross-file refactors | `--effort high` or `Tab` key |
| max | ~128K | Crypto, security audits, formal proofs, research papers | `--effort max` or `/effort max` |

**CLI flag** (per-session):
```bash
claude --effort max    # Maximum reasoning for entire session
```

**In-conversation**:
```
/effort max

This is security-critical code in crates/zipminator-core/. Review the
constant-time guarantees in the ML-KEM-768 decapsulation path.
Verify no timing side-channels exist.
```

**Environment variable** (persistent):
```bash
export CLAUDE_REASONING_EFFORT=max    # Force max for all tasks
```

## 2.8b Ralph Loop Plugin (persistent iteration)

**What**: The `/ralph-loop` plugin implements persistent iteration via a Stop hook. When active, Claude cannot exit the session; instead, the hook re-feeds the prompt, creating a self-referential improvement loop. Each iteration sees files modified by previous iterations.

**Invocation**:
```
/ralph-loop "Build and test the entropy pool dashboard" \
  --completion-promise "ALL_TESTS_PASS" \
  --max-iterations 20
```

**Cancel**: `/ralph-loop:cancel-ralph`
**Help**: `/ralph-loop:help`

This is separate from the RALPH methodology (Research-Architecture-Logic-Polish-Harden). The ralph-loop plugin provides the iteration mechanism; RALPH provides the methodology within each iteration.

## 2.8c Recurring Tasks (`/loop`) and Scheduled Agents (`/schedule`)

**`/loop`**: Run a command on a recurring interval in the current session.
```
/loop 5m /batch-tdd           # Run parallel TDD every 5 minutes
/loop 10m /improve code       # Improve code every 10 minutes
/loop 30s "check build status"  # Quick status poll
```

**`/schedule`**: Create cron-triggered remote agents that run unattended.
```
/schedule create "nightly-tests" --cron "0 2 * * *" --prompt "Run cargo test + pytest, commit fixes"
/schedule list                 # View all scheduled agents
/schedule delete "nightly-tests"
```

---

## 2.9 Agent Teams + Worktrees

**What**: Multiple Claude Code instances working together with shared task lists and direct messaging. Each teammate can get an isolated git worktree for safe parallel editing.

**Enable**:
```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
# Or in settings.json: { "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" } }
```

**Controls**:

| Action | Key |
|--------|-----|
| Cycle between teammates | `Shift+Down` |
| View task list | `Ctrl+T` |
| Toggle plan mode | `Shift+Tab` |
| Toggle extended thinking | `Tab` |
| Stop mid-action | `Esc` |
| Rewind menu | `Esc+Esc` |

**Worktree isolation**: Subagents spawned with `isolation: "worktree"` get their own git branch. Safe parallel editing without conflicts. Changes auto-merge or return as a branch for review.

**When to use teams vs subagents**:

| Scenario | Use | Why |
|----------|-----|-----|
| Quick research (< 2 min) | Subagent | Lower cost, summarized results |
| Single file scope | Subagent | No coordination needed |
| 3+ parallel work streams | Agent teams | Shared task list, direct messaging |
| Cross-domain coordination | Agent teams | Teammates see each other's progress |
| Full-project campaign | Hive-mind | Queen-led consensus, 10+ agents |

---

## 2.10 RALPH Loop (Research-Architecture-Logic-Polish-Harden)

**What**: The iterative refinement protocol for every non-trivial code change. Each domain cycles through 5 phases until quality gates pass.

```
+---------------------------------------------+
|                RALPH LOOP                    |
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
|       +-- PASS --> DONE                     |
|       +-- FAIL --> Back to Research          |
|  Max iterations: 12 (then escalate)         |
+---------------------------------------------+
```

| Phase | Skills used | What happens |
|-------|------------|-------------|
| **R**esearch | Researcher subagent, Context7 | Read specs, existing code, docs |
| **A**rchitecture | `/sparc:architect` | Design solution, write plan |
| **L**ogic | `/pair-programming`, `/test-specialist` | Write failing test (Red), implement (Green) |
| **P**olish | `/simplify` | Refactor, remove dead code, tighten |
| **H**arden | `/verification-quality`, `/quantum-assurance-validator` | Security audit, fuzz, CI run |

**Invocation options**:
```
# As a slash command (plugin)
/ralph-loop

# In any prompt
"Run a RALPH loop on this task. Max 12 iterations, threshold 0.995."

# As a shell script
bash docs/guides/claude-flow-v3/scripts/ralph-loop.sh
```

---

## 2.11 Memory Chain (4 Layers)

**What**: Four layers of memory, from manual-durable to automatic-learning.

### Layer 1: CLAUDE.md (durable, manual, highest signal)
Always in context. Update when a session produces a key insight you want forever.
```
# In conversation:
"Update CLAUDE.md with: ReasoningBank shows fix formal proofs BEFORE prose for PoPETs papers."
```

### Layer 2: Auto-Memory (MEMORY.md)
Claude automatically persists useful patterns to `~/.claude/projects/<path>/memory/MEMORY.md`. Survives session restarts. Manage with `/memory`.

### Layer 3: AgentDB (vector search, session-persistent)
SQLite + HNSW embeddings, 150x faster than flat search.
```bash
ruflo memory store --key "pattern/auth" --value "Use ML-KEM-768 for key exchange"
ruflo memory search -q "authentication pattern"
```

### Layer 4: ReasoningBank (RL policy, learns from trajectories)
Learns WHICH approach works for WHICH task type.
```bash
# Record at end of task
ruflo hooks post-task --task-id "paper-improve-v3"
# Recall at start of similar task
ruflo memory search -q "paper improvement strategy" --namespace reasoningbank
```

**The learning loop** (run at END of every major task):
1. Record experience to ReasoningBank via ruflo hooks
2. If score > 0.85, distill pattern to CLAUDE.md
3. Tag git commit with quality score
4. Run `/self-improve` to train neural pipeline

---

## 2.12 Zero-Hallucination Protocol

**What**: Enforced by `.claude/rules/zero-hallucination.md`. Every factual claim must be verifiable.

**Rules**:
- Never state unverified facts about libraries, APIs, or standards
- Verify with Context7 (`resolve-library-id`, `query-docs`) before claiming API behavior
- WebFetch to verify DOIs and arXiv IDs before citing
- Run code to prove functionality — never say "it should work"
- FIPS language: "Implements FIPS 203" is safe; "FIPS certified" is forbidden

**Self-critique before delivering any result**:
1. Re-read output for unsupported claims
2. Flag speculative statements with "[unverified]"
3. Playwright screenshots = proof of visual output
4. Test output = proof of logic

---

## 2.13 Context Engineering

**What**: Enforced by `.claude/rules/context-management.md`. Manage the 1M context window strategically.

**Key patterns**:

| Pattern | When | How |
|---------|------|-----|
| `/compact` | ~70% context usage | Proactively compact with preservation instructions |
| `/clear` | Between unrelated tasks | Fresh context prevents cross-contamination |
| Front-loading | Start of session | Batch ALL file reads in one message |
| Interview | Complex features | AskUserQuestion before coding |
| Writer/Reviewer | Quality-critical code | Session A implements, Session B reviews |
| Delegation | Research tasks | Subagent explores, returns summary, protects main context |

**After `/compact`**: Re-read CLAUDE.md task tracker, re-read current test status. Rules survive compaction (auto-loaded).

---

## 2.14 Model Routing

**What**: Route different agent types to different model tiers. Defined in `.claude/rules/model-routing.md`.

| Domain | Model | Trigger files/keywords |
|--------|-------|----------------------|
| Crypto, security, PQC, architecture | Opus | `crates/`, `vpn/`, `proxy/`, security, FIPS, audit |
| Features, components, API, tests | Sonnet | `web/`, `api/`, `mobile/`, `tests/`, implement, feature |
| Docs, config, formatting, CSS | Haiku | `*.md`, `*.json`, `*.toml`, `*.css`, format, typo |

**Automatic routing** via ruflo:
```bash
ruflo hooks model-route "implement PQC key exchange"  # → Opus
ruflo hooks model-route "add dashboard tab"            # → Sonnet
ruflo hooks model-route "fix typo in README"           # → Haiku
```

---

## 2.15 BMAD Workflows

**What**: BMad Method workflows in `.claude/commands/bmad/` for product management. 30+ workflows across three modules.

**Key workflows**:

| Workflow | What it does |
|----------|-------------|
| `/bmad:bmm:workflows:prd` | Create Product Requirements Document |
| `/bmad:bmm:workflows:architecture` | Collaborative architecture decisions |
| `/bmad:bmm:workflows:create-epics-and-stories` | Transform PRD into epics and stories |
| `/bmad:bmm:workflows:sprint-planning` | Generate sprint status tracking |
| `/bmad:bmm:workflows:dev-story` | Execute a story with TDD gates |
| `/bmad:bmm:workflows:code-review` | Senior developer code review |
| `/bmad:bmm:workflows:retrospective` | Post-epic review and lessons |
| `/bmad:cis:workflows:brainstorming` | Creative brainstorming sessions |
| `/bmad:cis:workflows:design-thinking` | Human-centered design process |

---

## 2.16 SPARC Methodology (16 Modes)

**What**: Specification-Pseudocode-Architecture-Refinement-Completion methodology with 16 specialized modes in `.claude/commands/sparc/`.

| Mode | Purpose |
|------|---------|
| `/sparc:tdd` | Test-Driven Development (Red-Green-Refactor) |
| `/sparc:architect` | System architecture design |
| `/sparc:coder` | Implementation specialist |
| `/sparc:reviewer` | Code review specialist |
| `/sparc:tester` | Comprehensive test generation |
| `/sparc:debugger` | Bug diagnosis and fix |
| `/sparc:optimizer` | Performance optimization |
| `/sparc:researcher` | Deep research and analysis |
| `/sparc:designer` | UI/UX design |
| `/sparc:documenter` | Documentation generation |
| `/sparc:innovator` | Creative solution finding |
| `/sparc:analyzer` | Code analysis and metrics |
| `/sparc:batch-executor` | Parallel batch execution |
| `/sparc:memory-manager` | Memory and context management |
| `/sparc:workflow-manager` | Workflow orchestration |
| `/sparc:swarm-coordinator` | Swarm coordination |

## 2.17 Installed Plugins (v2.1.88)

**What**: Claude Code plugins extend capabilities via marketplaces. Installed plugins provide additional skills, hooks, and agent types.

**Active plugins** (from `~/.claude/plugins/`):

| Plugin | Skills | Purpose |
|--------|--------|---------|
| **ralph-loop** | `/ralph-loop:ralph-loop`, `/ralph-loop:cancel-ralph`, `/ralph-loop:help` | Persistent iteration via Stop hook; session never exits until completion |
| **superpowers** | `/superpowers:brainstorming`, `/superpowers:writing-plans`, `/superpowers:executing-plans`, `/superpowers:test-driven-development`, `/superpowers:systematic-debugging`, `/superpowers:dispatching-parallel-agents`, `/superpowers:verification-before-completion`, +more | 14 structured development workflows |
| **episodic-memory** | `/episodic-memory:search-conversations`, `/episodic-memory:remembering-conversations` | Cross-session conversation search via semantic indexing |
| **code-review** | `/code-review:code-review` | Pull request code review |
| **pr-review-toolkit** | `/pr-review-toolkit:review-pr` | Comprehensive PR review with specialized agents |
| **commit-commands** | `/commit-commands:commit`, `/commit-commands:commit-push-pr`, `/commit-commands:clean_gone` | Git workflow automation |
| **hookify** | `/hookify:hookify`, `/hookify:list`, `/hookify:configure` | Create hooks from conversation behaviors |
| **claude-md-management** | `/claude-md-management:revise-claude-md`, `/claude-md-management:claude-md-improver` | CLAUDE.md auditing and improvement |
| **coderabbit** | `/coderabbit:review`, `/coderabbit:autofix` | AI code review and auto-fix |
| **feature-dev** | `/feature-dev:feature-dev` | Guided feature development with codebase understanding |

**Superpowers workflows** (most useful for orchestration):
- `/superpowers:brainstorming` -- creative ideation before any major task
- `/superpowers:writing-plans` -- structured plan creation from specs
- `/superpowers:executing-plans` -- execute plans with subagent-driven development
- `/superpowers:dispatching-parallel-agents` -- parallel agent execution for independent tasks
- `/superpowers:verification-before-completion` -- validate work before declaring done

## 2.18 Cross-Session Memory (Episodic Memory + Auto-Memory)

**What**: Two systems for remembering across sessions.

**Auto-Memory** (built-in, v2.1.59+): Claude automatically persists useful patterns to `~/.claude/projects/<path>/memory/MEMORY.md`. Always loaded. Managed via `/memory`.

**Episodic Memory** (plugin v1.0.15): Indexes all past conversations for semantic search. Retrieves relevant context from previous sessions.

**Usage**:
```
/episodic-memory:search-conversations "how did we fix the entropy pool race condition?"
```

Returns matching conversation snippets with timestamps, enabling you to recover decisions, code patterns, and lessons learned from any past session.

---

<!-- SECTION: PART 3 -->
# Part 3: Composition Patterns — How Capabilities Combine

---

## Pattern 1: Quick Fix (< 15 min)

**When**: Typo, rename, config change, single-file bug fix.
**Tools**: Direct edit + test + think tier.
**No agents, no RALPH.** Just fix and verify.

```
Fix the typo in web/components/Hero.tsx line 42.
Change "encyrption" to "encryption".
Run: cd web && npx next build
```

---

## Pattern 2: Sprint Task (30-180 min)

**When**: Single feature, 1-3 files, clear scope.
**Tools**: `/sprint-task` + 2-3 subagents + RALPH + `/simplify`.

```
/sprint-task

Implement QRNG entropy status indicator in the Flutter dashboard.
- Read app/lib/features/ for existing pillar screens
- TDD: write widget test first, then implement
- RALPH: Research (existing patterns) → Architecture (widget design) →
  Logic (test + implement) → Polish (/simplify) → Harden (flutter test)
- Spawn researcher subagent to check Flutter animation patterns via Context7
```

---

## Pattern 3: Mega Task (Hours-Days)

**When**: Multi-domain, security-critical, touches 5+ directories.
**Tools**: `/mega-task` + hive-mind + agent teams + agentic-jujutsu + /effort max.

```
/mega-task

Add post-quantum VPN kill switch with E2E tests, mobile bridge,
web dashboard widget, and FIPS documentation.

This touches: crates/ (Rust crypto), browser/src-tauri/ (Tauri),
mobile/ (React Native), web/ (Next.js), docs/ (FIPS).

/effort max — this is security-critical code.
Interview me about requirements first using AskUserQuestion.
```

See `.claude/commands/mega-task.md` for the full 6-phase protocol.

---

## Pattern 4: Research-to-Publication Pipeline

**When**: Improving a research paper toward publication threshold.
**Tools**: `/hive-mind-advanced` + `/stream-chain` + `/verification-quality` + Context7 + AESR v4.

```
/hive-mind-advanced

Improve docs/research/paper-1-quantum-anonymization/main.tex to score 0.995 for Nature Physics.

Load skills: /quantum-scientific-writer, /research-paper-writer,
/verification-quality, /quantum-assurance-validator

Spawn 7 workstreams:
W1 (opus): Theoretical rigor — verify proofs, address Bohmian mechanics gap
W2 (sonnet): Literature — systematic comparison with ARX, PPRL, k-anonymity
W3 (sonnet): Experiments — verify UCI Adult results, statistical soundness
W4 (haiku): Format — venue-specific compliance check
W5 (sonnet): Prose — academic writing quality, notation consistency
W6 (opus): Adversarial — simulate 3 hostile reviewers
W7 (sonnet): False-positive — verify flagged issues before confirming

Each worker runs inner RALPH (max 5 iterations).
Outer loop: max 12 iterations, threshold 0.995.
Stream-chain: UNDERSTAND → VERIFY → DISCOVER → EXECUTE → ADVERSARIAL → INSPECT → SCORE
```

See Part 4 for the complete walkthrough.

---

## Pattern 5: Product Launch (Multi-Day)

**When**: Shipping to app stores, deploying backends, publishing packages.
**Tools**: `/batch-tdd` + `/hive-tdd` + agent teams + BMAD + `/github-release-management`.

```
/hive-tdd

Ship Zipminator to all platforms. 9 agent teams, RALPH N=20, threshold 0.995.

Read docs/guides/FEATURES.md for current pillar status.
Read docs/guides/implementation_plan.md for remaining work.

Critical path: Apple signing → flutter build ipa → TestFlight
High priority: Deploy signaling server, FastAPI backend, live message test
Medium: GitHub Release v1.0.0-beta.1, App Store listing, Play Store AAB

Separate manual steps (Mo must do: Apple portal, PYPI token, Play keystore)
from automated steps (agents handle everything else).
```

See Part 5 for the complete walkthrough.

---

## Pattern 6: Self-Learning Loop (15 min/session)

**When**: End of every session, after completing a major feature, weekly maintenance.
**Tools**: `/self-improve` + ruflo hooks + neural train + ReasoningBank.

```
/self-improve
```

This runs:
1. `ruflo hooks pretrain` — scan repo for patterns
2. `ruflo neural train` — train on coordination patterns
3. `ruflo hooks metrics` — review learning dashboard
4. Store insights to ruflo memory
5. `ruflo hooks model-outcome` — feed results back to model routing

---

## Pattern 7: Adversarial Security Review (1-4 hours)

**When**: Before shipping crypto code, after PQC changes, security audit.
**Tools**: `/agentic-jujutsu` + `/hive-mind-advanced` (Byzantine consensus) + cargo fuzz.

```
/agentic-jujutsu

Security audit of crates/zipminator-core/.
Spawn attacker/defender/auditor agents.

/effort max — this is PQC crypto code.

Attacker: Find timing side-channels, memory leaks, key material exposure
Defender: Verify constant-time guarantees, zeroize on drop, no unsafe blocks
Auditor: Cross-reference against NIST FIPS 203 spec, verify KAT vectors

Byzantine consensus on findings.
cargo fuzz run fuzz_keygen -- -max_total_time=300
```

---

## Pattern 8: One-Push Improve (2-5 min, any time)

**When**: At any point in any conversation when output quality could be better.
**Tools**: `/improve` + `/verification-quality`.

```
/improve

# Or target a specific output type:
/improve prompt
/improve code
/improve paper
```

See Part 6 for the full mechanism design.

---

## Pattern 9: Persistent Ralph Loop (hours-days, unattended)

**When**: Multi-hour task that should run autonomously until completion.
**Tools**: `/ralph-loop` plugin + RALPH methodology + `/improve` per iteration.

```
/ralph-loop "Implement all missing tests for crates/zipminator-core. \
  Run cargo test after each addition. Continue until all public functions \
  have test coverage >= 90%." \
  --completion-promise "COVERAGE_TARGET_MET" \
  --max-iterations 30
```

The Stop hook prevents session exit. Each iteration sees the test files from previous iterations. Combine with `/improve code` inside the prompt for progressive quality enhancement.

**Cancel**: `/ralph-loop:cancel-ralph`

---

## Pattern 10: Scheduled Continuous Improvement (overnight, unattended)

**When**: Long-running improvement that should happen while you sleep.
**Tools**: `/schedule` + `/loop` + `/improve`.

```
# Schedule a nightly paper improvement agent
/schedule create "paper-polish" \
  --cron "0 2 * * *" \
  --prompt "/effort max\nRun /improve paper on docs/research/paper-1-quantum-anonymization/main.tex. \
    Focus on the lowest-scoring dimension. Commit if score improves by 0.05+."

# Or use /loop for in-session recurring checks
/loop 15m /improve code    # Continuous code quality improvement
```

---

## Composition Decision Matrix

| Task Complexity | Files | Security? | Pattern | Time |
|----------------|-------|-----------|---------|------|
| Typo, rename | 1 | No | Quick Fix | < 15 min |
| Single feature | 1-3 | No | Sprint Task | 30-180 min |
| Single feature | 1-3 | Yes | Sprint + `--effort max` | 1-3 hours |
| Multi-domain | 4-10 | No | Mega Task (Sonnet team) | 4-8 hours |
| Multi-domain | 4-10 | Yes | Mega Task (Opus lead) | 1-2 days |
| Research paper | N/A | N/A | Research Pipeline | 2-8 hours |
| Product launch | All | Mixed | Product Launch | Multi-day |
| Unattended iteration | Varies | Varies | Persistent Ralph Loop | Hours-days |
| Overnight automation | Varies | No | Scheduled Improvement | Overnight |
| End of session | N/A | N/A | Self-Learning Loop | 15 min |
| Any time | N/A | N/A | One-Push Improve | 2-5 min |

---

<!-- SECTION: PART 4 -->
# Part 4: Use Case — Research Paper to Nature/Science Caliber

Target: `docs/research/paper-1-quantum-anonymization/main.tex` (currently scored 0.80/1.0 by adversarial PoPETs review)
Goal: Iteratively improve to 0.995 threshold for Nature/Science submission.

---

## Step 0: Session Setup

```
/go

# Load relevant skills
/quantum-scientific-writer
/research-paper-writer
/verification-quality
/quantum-assurance-validator
/quantum-cryptanalysis-expert
```

## Step 1: ReasoningBank Boot

Check what prior sessions learned about paper improvement:
```
ruflo memory search -q "paper improvement strategy" --namespace reasoningbank
```

If prior strategy exists with confidence > 0.80, adopt its ordering (e.g., "fix formal proofs BEFORE prose improvements").

## Step 2: Cookbook Discovery (parallel)

```
# Venue format requirements
Context7: "PoPETs paper format requirements 2026"
Context7: "Nature Physics letter format requirements"

# Related work (find papers to cite/compare)
WebSearch: "quantum anonymization irreversibility Born rule 2025 2026"
WebSearch: "privacy-preserving record linkage PPRL survey 2025"
WebSearch: "k-anonymity l-diversity t-closeness quantum 2025"

# IACR ePrint for PQC-specific papers
WebFetch: "https://eprint.iacr.org/search?q=anonymization+quantum&year=2025"
```

## Step 3: Decompose into 7 Workstreams

```
/hive-mind-advanced

Initialize hierarchical-mesh hive with queen + 7 workers.
Topic: Improve quantum anonymization paper to 0.995.

Queen (Opus): Coordinates all workers, manages quality gate, resolves conflicts.

W1-Theory (Opus): Theoretical rigor
  - Verify all proofs in Section 3-4
  - Address Bohmian mechanics objection to Born rule guarantee
  - Verify information-theoretic bounds are correctly stated
  - Skills: /quantum-assurance-validator, /quantum-cryptanalysis-expert

W2-Literature (Sonnet): Literature completeness
  - Systematic comparison with ARX, PPRL, k-anonymity, l-diversity, t-closeness
  - Why is Born-rule approach superior to epsilon-differential privacy?
  - Missing citations: find and verify via WebFetch (DOI must resolve)
  - Skills: /quantum-literature-synthesis-expert

W3-Experiments (Sonnet): Experimental validation
  - Verify UCI Adult dataset results are statistically sound
  - Check p-values, confidence intervals, effect sizes
  - Verify Rigetti Ankaa-3 demo claims (gate counts, fidelities)
  - Skills: /quantum-statistical-validator

W4-Format (Haiku): Format compliance
  - PoPETs: check page limits, reference format, supplementary material rules
  - Nature Physics: check letter format (3000 words, 4 figures max)
  - Cross-check both formats, flag incompatibilities
  - Skills: /research-paper-writer

W5-Prose (Sonnet): Writing quality
  - Academic tone, notation consistency across all sections
  - Remove redundancy, tighten arguments
  - Ensure abstract matches conclusions
  - Skills: /quantum-scientific-writer

W6-Adversarial (Opus): Hostile reviewers
  - Simulate 3 reviewers: crypto theorist, privacy researcher, quantum physicist
  - Each generates 5 specific objections with line numbers
  - Rank objections by severity
  - Skills: /verification-quality

W7-FalsePositive (Sonnet): Verification
  - For every issue flagged by W1-W6, verify against 2 independent sources
  - Prevent over-correction and false positive fixes
  - Mark issues as CONFIRMED, FALSE_POSITIVE, or NEEDS_MORE_INFO
```

## Step 4: Stream-Chain Pipeline

Each worker processes the paper through 7 stages:
```
STAGE 1 UNDERSTAND: Read assigned sections, identify all verifiable claims
STAGE 2 VERIFY: Check claims against primary sources, flag FALSE/UNVERIFIED
STAGE 3 DISCOVER: Search for missing information, better citations, stronger arguments
STAGE 4 EXECUTE: Apply improvements, output unified diff
STAGE 5 ADVERSARIAL: Self-critique the improvements, generate objections
STAGE 6 INSPECT: Compile LaTeX, render PDF, verify no formatting breaks
STAGE 7 SCORE: Score on assigned dimension (0-1), record to ReasoningBank
```

## Step 5: Quality Gate

```
S_aggregate = weighted sum of dimension scores

Weights:
  Theory:      0.25 (most critical for Nature/Science)
  Literature:  0.15
  Experiments: 0.20
  Format:      0.05
  Prose:       0.10
  Adversarial: 0.15 (must survive hostile review)
  FalsePos:    0.10

If S_aggregate >= 0.995: DONE
If structural_limit: REPORT max_achievable, stop
If iteration >= 12: ESCALATE to user
Else: focus next iteration on lowest-scoring dimension
```

## Step 6: Finalize

```bash
# Compile and verify
cd docs/research/paper && pdflatex main.tex && bibtex main && pdflatex main.tex && pdflatex main.tex

# Visual inspection via Playwright

# Commit with quality score
git add docs/research/paper-1-quantum-anonymization/
git commit -m "paper(anonymization): improve to score X.XX

Quality: 0.80 -> X.XX | N iterations | AESR v4
Key fix: [highest-impact improvement]
Method: 7-workstream hive-mind + stream-chain + RALPH"

# Record to ReasoningBank
ruflo hooks post-task --task-id "paper-improve-nature"
```

## Copy-Paste Starter Prompt

```
/effort max

Improve docs/research/paper-1-quantum-anonymization/main.tex from score 0.80 to 0.995 for Nature Physics.

Load: /quantum-scientific-writer, /research-paper-writer, /verification-quality,
      /quantum-assurance-validator, /quantum-cryptanalysis-expert

Use /hive-mind-advanced with 7 workstreams:
W1 Theory (Opus), W2 Literature (Sonnet), W3 Experiments (Sonnet),
W4 Format (Haiku), W5 Prose (Sonnet), W6 Adversarial (Opus), W7 FalsePositive (Sonnet).

Each worker runs inner RALPH (max 5 iterations).
Outer loop: max 12 iterations, threshold 0.995.
Stream-chain: UNDERSTAND -> VERIFY -> DISCOVER -> EXECUTE -> ADVERSARIAL -> INSPECT -> SCORE.

Check ruflo memory for prior improvement strategies first.
Compile LaTeX after each outer iteration to verify no formatting breaks.
At session end: record trajectory, distill learnings if score > 0.85.
```

---

<!-- SECTION: PART 5 -->
# Part 5: Use Case — Ship Zipminator to All Platforms

Current state: 9 pillars at 100% code-complete per FEATURES.md, but integration layer not deployed.
Goal: 100% shipped with live TestFlight, Play Store AAB, PyPI package, running backend, and verified live messaging.

---

## Step 0: Session Setup

```
/go

# Read current state
Read: docs/guides/FEATURES.md
Read: docs/guides/implementation_plan.md
```

## Step 1: Gap Analysis

| Track | Gap | Manual? | RALPH N= |
|-------|-----|---------|----------|
| TestFlight (iOS) | Apple signing, flutter build ipa, Transporter upload | Partially (Mo: certs) | 10 |
| Play Store (Android) | Signing keystore, flutter build appbundle | Partially (Mo: keystore) | 5 |
| PyPI | Need PYPI_TOKEN, maturin build, twine upload | Partially (Mo: token) | 5 |
| Backend API | Deploy FastAPI + PostgreSQL + Redis | No | 15 |
| Signaling Server | Deploy WebSocket server for Messenger | No | 10 |
| Live Message | Send real message device A to device B | No (needs backend first) | 5 |
| GitHub Release | Tag v1.0.0-beta.1, release notes | No | 3 |
| App Store Listing | Screenshots, description, privacy policy | Partially (Mo: review) | 5 |
| Web Deploy | Verify zipminator.zip deployment | No | 3 |

## Step 2: Separate Manual from Automated

**Mo must do** (cannot be automated):
1. Apple Developer portal: Create App ID, distribution cert, provisioning profile
2. Generate PYPI_TOKEN at pypi.org/manage/account/token
3. Generate Android signing keystore (`keytool -genkey`)
4. Review App Store listing text before submission
5. Approve TestFlight for external testing

**Agents automate everything else.**

## Step 3: Spawn 9 Agent Teams

```
/hive-tdd

9 agent teams, RALPH N=20, threshold 0.995.

Team 1 -- iOS TestFlight (Sonnet): Prepare ExportOptions.plist, flutter build ipa
Team 2 -- Android Play Store (Sonnet): Prepare key.properties, flutter build appbundle
Team 3 -- PyPI Publish (Sonnet): maturin build --release, verify wheel
Team 4 -- Backend Deploy (Sonnet): docker-compose for postgres + redis + api
Team 5 -- Signaling Server (Sonnet): Build and deploy signaling Dockerfile
Team 6 -- Live Message Test (Sonnet, depends on Teams 4+5): Send test message
Team 7 -- GitHub Release (Haiku): Tag v1.0.0-beta.1, release notes
Team 8 -- App Store Listing (Haiku): Draft description, screenshots
Team 9 -- Web Verification (Haiku): Verify zipminator.zip, Lighthouse audit

Dependencies: Team 6 waits for Teams 4+5.
Convergence: all test suites pass, FEATURES.md 100%.
```

## Step 4: Convergence Criteria

```bash
cargo test --workspace                                    # 0 failures
micromamba activate zip-pqc && pytest tests/ --tb=no -q   # 0 errors
cd web && npx next build                                  # clean
cd app && flutter test                                    # 23/23 pass
cd browser/src-tauri && cargo test                        # 0 failures
```

## Step 5: Session Continuity (Multi-Day)

```bash
# At session end:
ruflo memory store --key "ship/checkpoint" --namespace active \
  --value "Teams 1-3 blocked on manual steps. Teams 4-5 in progress. Teams 7-9 done."

/compact Preserve: team status per track, blocking items list, test results

# At next session start:
/go
ruflo memory search -q "ship checkpoint" --namespace active
```

## Copy-Paste Starter Prompt

```
Ship Zipminator to all platforms.

/go first, then read docs/guides/FEATURES.md and implementation_plan.md.

Use /hive-tdd with 9 agent teams, RALPH N=20, threshold 0.995.
See docs/guides/prompts/end-to-end-100percent-competion.md for team definitions.

MANUAL STEPS (I will do these, skip them):
- Apple signing certs (Team 1 blocker)
- PYPI_TOKEN generation (Team 3 blocker)
- Android keystore generation (Team 2 blocker)

AUTOMATE EVERYTHING ELSE.
Report which teams are blocked vs in-progress vs done.
Checkpoint state to ruflo memory at each milestone.
```

---

<!-- SECTION: PART 6 -->
# Part 6: The `/improve` Mechanism

The `/improve` command is defined at `.claude/commands/improve.md`. It provides one-push output improvement at any conversation stage.

## How It Works

```
You (working on anything) -> output produced -> "/improve" -> analysis -> 3 fixes -> apply -> verify
```

## Invocation

| Command | Target |
|---------|--------|
| `/improve` | Auto-detect (most recent substantial output) |
| `/improve prompt` | Improve the current prompt/instructions |
| `/improve code` | Improve the most recent code |
| `/improve plan` | Improve the current plan |
| `/improve paper` | Improve research paper prose |

## Scoring Dimensions

| Dimension | Weight | What it measures |
|-----------|--------|-----------------|
| Correctness | 0.25 | Factual accuracy, compilable, no hallucinations |
| Completeness | 0.25 | All requirements covered, edge cases handled |
| Clarity | 0.20 | Readable, well-structured, unambiguous |
| Efficiency | 0.15 | No redundancy, DRY, optimal approach |
| Impact | 0.15 | Achieves the goal, high-value changes |

## Output Format

```
IMPROVE ANALYSIS
Target: [type] -- [description]
Score:  0.72 -> 0.89 (projected)

FIX 1 (Correctness -> +0.08):
  Issue: Unverified claim about FIPS 140-3 compliance on line 47
  Fix:   Change to "Implements NIST FIPS 203 (ML-KEM-768)"
  Tool:  /verification-quality

FIX 2 (Completeness -> +0.05):
  Issue: Missing error handling for quantum entropy pool exhaustion
  Fix:   Add OS fallback path with logging
  Tool:  /test-specialist

FIX 3 (Clarity -> +0.04):
  Issue: Function process_data is 120 lines with nested conditionals
  Fix:   Extract 3 helper functions, flatten control flow
  Tool:  /simplify

Apply all? [Y/n] or select specific fixes [1/2/3]
```

## Chaining

| Chain | Effect |
|-------|--------|
| `/simplify` then `/improve` | Catch what simplify missed |
| `/improve prompt` then `/mega-task` | Optimize mission prompt before execution |
| `/improve paper` inside RALPH | Acts as the Polish phase |
| `/improve` x5 | Cumulative improvement, stops after 5 rounds |

---

<!-- SECTION: PART 7 -->
# Part 7: Industry Best Practices

---

## 7.1 Prompt Engineering

**Front-load context**: Batch all file reads in the first message. When context is fresh, load everything you need.
```
Read: CLAUDE.md, docs/guides/FEATURES.md, docs/guides/implementation_plan.md,
      the file I'm about to modify, and its test file.
```

**Use `@filename`**: Reference files directly in prompts. Claude reads them automatically.

**Role-play for complex reasoning**:
```
Act as a NIST PQC auditor reviewing this ML-KEM-768 implementation.
Check for: timing side-channels, key material exposure, zeroization on drop.
```

**Structural limits**: Always include an escape clause.
```
If this task cannot be completed in one session, document:
- What was achieved
- What is blocked and why
- Exact commands to resume in next session
```

**Iteration caps**: Prevent infinite loops.
- Max 3 rounds of Q&A, then produce result
- Max 12 RALPH iterations, then escalate
- Max 20 for end-to-end sprints

**Self-answer mode**: For Q&A rounds, generate both question and suggested answer. User approves or overrides with one word.

---

## 7.2 Context Engineering

**Session hygiene**:
- Start every session with `/go`
- `/clear` between unrelated tasks
- `/compact` at ~70% context usage with preservation instructions
- Fresh sessions per major task

**Interview pattern** (for complex features):
```
Interview me about [feature] using AskUserQuestion.
Ask about: technical implementation, edge cases, concerns, tradeoffs.
Keep interviewing until we've covered everything, then write a spec.
```

Then start a fresh session to execute with clean context.

**Writer/Reviewer pattern** (for quality-critical code):
- Session A writes tests
- Session B writes code to pass them
- Session C reviews both (fresh context prevents bias)

**After two failed corrections**: `/clear` and rewrite the prompt from scratch. Do not fight context rot.

---

## 7.3 Agent Coordination

**Golden Rule**: 1 message = ALL related agent operations. Never spawn agents across multiple messages.

```
# CORRECT: single message, all agents
Task("Rust crypto", "...", "coder")
Task("Web UI", "...", "coder")
Task("Tests", "...", "tester")

# WRONG: multiple messages
Message 1: Task("Rust crypto", "...", "coder")
Message 2: Task("Web UI", "...", "coder")    # breaks coordination
```

**Decision table**:

| Scenario | Use | Why |
|----------|-----|-----|
| Quick research (< 2 min) | Subagent | Lower cost, returns summary |
| Independent file edit | Subagent with worktree | Isolated, no conflicts |
| 3+ coordinated streams | Agent teams | Shared task list |
| 10+ agents, consensus needed | Hive-mind | Queen-led, Byzantine/Raft |
| Security audit | Hive-mind + adversarial | Byzantine consensus on findings |

---

## 7.4 Memory and Learning

**End of every major task**:
1. Record to ReasoningBank: `ruflo hooks post-task --task-id "task-name"`
2. If score > 0.85: distill to CLAUDE.md
3. Tag git commit: `git tag "v-task-score-0.92" -m "Key insight: ..."`
4. Run `/self-improve`

**Memory hierarchy** (highest signal first):
1. CLAUDE.md -- always in context, highest signal
2. MEMORY.md -- auto-loaded, cross-session state
3. AgentDB -- vector search, 150x faster
4. ReasoningBank -- RL policy, learns strategies

**Avoid memory bloat**: Only store patterns that scored > 0.85. Low-score patterns are noise.

---

## 7.5 Quality Assurance

**Never mark a task complete without**:
- Running the relevant test suite
- Verifying the output (read file, view screenshot, compile)
- Checking for regressions (`cargo test --workspace`)

**Thresholds**:
- Standard code: `/verification-quality` with 0.95 threshold
- Crypto code: `/verification-quality` with 0.99 threshold + /effort max + cargo fuzz
- Research paper: 0.995 threshold with adversarial review

**Visual verification**: For any UI change, take a Playwright screenshot as proof.

**Zero-hallucination enforcement**: Every claim must have a verifiable source. Flag speculative statements with "[unverified]". Use Context7 to verify library APIs. Verify DOIs resolve before citing.

---

## 7.6 Session Management

**Session start**: Always `/go`. It loads context, runs tests, produces status report.

**Commits**: Auto-commit after task completion using conventional format.

**Multi-day work**: Checkpoint at session end.
```bash
ruflo memory store --key "task/checkpoint" --namespace active --value "status description"
/compact Preserve: current task, test status, blocking items, files modified
```

**Resume**: Next session starts with `/go`, which restores context and runs verification.

**Recurring tasks**: Use `/loop` for polling and `/schedule` for cron jobs.
```
# Check deploy status every 5 minutes
/loop 5m check if the Railway deploy completed and tests pass

# Schedule daily paper improvement
/schedule "daily paper review" --cron "0 9 * * *" --prompt "Run /improve paper on main.tex"
```

---

<!-- SECTION: PART 8 -->
# Part 8: Quick Reference Cards

---

## 8.1 Top 30 Slash Commands

| # | Command | Purpose | Time |
|---|---------|---------|------|
| 1 | `/go` | Session startup: context, tests, status | 5 min |
| 2 | `/improve` | One-push output improvement | 2-5 min |
| 3 | `/improve prompt` | Improve current prompt | 2-5 min |
| 4 | `/simplify` | Code review for reuse/quality/efficiency | 5-15 min |
| 5 | `/sprint-task` | Medium-complexity mission | 30-180 min |
| 6 | `/mega-task` | Full-stack multi-day mission | Hours-days |
| 7 | `/batch-tdd` | Parallel TDD across all domains | 30-60 min |
| 8 | `/hive-tdd` | Hive-mind TDD with RALPH | 1-4 hours |
| 9 | `/self-improve` | Train learning pipeline | 15 min |
| 10 | `/ralph-loop` | Start RALPH iteration loop | Per task |
| 11 | `/loop 5m /command` | Run command every 5 minutes | Recurring |
| 12 | `/schedule` | Create cron-scheduled remote agent | Setup |
| 13 | `/compact` | Compress context at ~70% | 1 min |
| 14 | `/clear` | Fresh context between tasks | Instant |
| 15 | `/hive-mind:hive-mind-init` | Initialize hive coordination | 2 min |
| 16 | `/hive-mind:hive-mind-spawn` | Spawn hive workers | 2 min |
| 17 | `/hive-mind:hive-mind-status` | Check hive progress | Instant |
| 18 | `/swarm:swarm-init` | Initialize swarm | 2 min |
| 19 | `/sparc:tdd` | SPARC TDD mode | Per task |
| 20 | `/sparc:architect` | SPARC architecture mode | 30-60 min |
| 21 | `/verification-quality` | Truth scoring (0.95 threshold) | 5-15 min |
| 22 | `/pair-programming` | Navigator/Driver TDD | Per task |
| 23 | `/agentic-jujutsu` | Self-learning version control | Per task |
| 24 | `/stream-chain` | Multi-stage processing pipeline | Per task |
| 25 | `/pitch` | Improve pitch deck | 1-2 hours |
| 26 | `/bmad:bmm:workflows:prd` | Create PRD | 30-60 min |
| 27 | `/bmad:bmm:workflows:sprint-planning` | Sprint planning | 15-30 min |
| 28 | `/github:code-review` | GitHub code review | 15-30 min |
| 29 | `/memory:memory-search` | Search persistent memory | Instant |
| 30 | `/training:neural-train` | Train neural patterns | 5-15 min |

---

## 8.2 Skill Selection Matrix

| Task keyword | Skill to load |
|-------------|---------------|
| paper, research, publication | `/quantum-scientific-writer`, `/research-paper-writer` |
| proof, theorem, physics | `/quantum-assurance-validator`, `/quantum-topological-expert` |
| crypto, PQC, ML-KEM, security | `/quantum-cryptanalysis-expert` |
| test, coverage, TDD | `/test-specialist`, `/pair-programming` |
| deploy, docker, CI/CD | `/docker-containerization`, `/cicd-pipeline-generator` |
| UI, frontend, dashboard | `/frontend-enhancer`, `/quantum-frontend-dashboard` |
| multi-agent, swarm, hive | `/hive-mind-advanced`, `/swarm-advanced` |
| learning, memory, RL | `/reasoningbank-agentdb`, `/agentic-jujutsu` |
| pitch, startup, business | `/pitch-deck`, `/startup-validator` |
| GitHub, PR, release | `/github-release-management`, `/github-code-review` |
| verify, truth, accuracy | `/verification-quality` |
| simplify, clean, refactor | `/simplify` (built-in) |
| brainstorm, ideate | `/bmad:cis:workflows:brainstorming` |

---

## 8.3 Orchestration Decision Matrix

| Complexity | Duration | Agents | Tier | Pattern |
|-----------|----------|--------|------|---------|
| Trivial | < 15 min | 0 | Single session | Quick Fix |
| Low | 30-60 min | 0-1 | Single + subagent | Sprint Task |
| Medium | 1-3 hours | 2-3 | Subagents + RALPH | Sprint Task |
| High | 4-8 hours | 3-5 | Agent teams + worktrees | Mega Task |
| Very High | Days | 5-10 | Hive-mind + teams | Mega Task + checkpoints |
| Research | 2-8 hours | 5-7 | Hive-mind + stream-chain | Research Pipeline |
| Launch | Multi-day | 7-9 | Full stack | Product Launch |

---

## 8.4 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Esc` | Stop mid-action (context preserved) |
| `Esc+Esc` | Rewind menu (restore conversation, code, or both) |
| `Shift+Tab` | Cycle modes: normal, auto-accept, plan mode |
| `Tab` | Toggle extended thinking |
| `Ctrl+T` | Task list |
| `Ctrl+G` | Open plan in text editor |
| `Shift+Down` | Cycle agent team teammates |

---

## 8.5 Copy-Paste Starter Prompts

### Quick Fix
```
Fix [description] in [file:line].
Run [test command] to verify.
```

### Sprint Task
```
/sprint-task
[Feature description]. TDD: write test first.
RALPH: Research, Architecture, Logic, Polish, Harden.
Max 12 iterations.
```

### Mega Task
```
/mega-task
[Mission description]. This touches [domains].
/effort max -- [security/architecture justification].
Interview me about requirements first.
```

### Paper Improvement
```
/effort max
Improve [paper path] to score [threshold] for [venue].
Load: /quantum-scientific-writer, /verification-quality
Use /hive-mind-advanced with [N] workstreams.
RALPH inner loops max 5, outer max 12.
Check ruflo memory for prior strategies.
```

### Product Ship
```
/hive-tdd
Ship [product] to all platforms. [N] agent teams, RALPH N=20, threshold 0.995.
Read [status files] for current state.
MANUAL: [list what user must do]. AUTOMATE everything else.
Checkpoint to ruflo memory at each milestone.
```

---

## Further Reading

| Document | Path | What it covers |
|----------|------|---------------|
| AESR v4 Universal Guide | `docs/guides/prompts/AESR_v4_universal_guide.md` | 7-phase orchestration system |
| Prompt Master | `docs/guides/prompts/prompt_master.md` | 6-phase task decomposition |
| End-to-End Sprint | `docs/guides/prompts/end-to-end-100percent-competion.md` | 9-team sprint with RALPH N=20 |
| Claude-Flow v3 Guide | `docs/guides/claude-flow-v3/README.md` | 17-file orchestration reference |
| RALPH Loop | `docs/guides/claude-flow-v3/09-ralph-loop.md` | RALPH protocol with ASCII diagram |
| Agent Teams | `docs/guides/claude-flow-v3/10-agent-teams.md` | Team topology, controls, hooks |
| Learning Chain | `docs/guides/claude-flow-v3/12-learning-reasoning.md` | 4-layer memory, reasoning depth |
| Ruflo MCP | `docs/guides/claude-flow-v3/14-claude-flow-mcp.md` | 215 MCP tools reference |
| Superpowers | `docs/guides/claude-flow-v3/03-superpowers.md` | Native Claude Code features |
| Orchestration Tiers | `docs/guides/claude-flow-v3/04-orchestration-tiers.md` | When to use which tier |
| Activation Script | `docs/guides/claude-flow-v3/scripts/activate-all.sh` | Environment setup |
