# Prompt Master: Generalized Orchestration Prompt

> Universal task decomposition and multi-agent orchestration prompt.
> Takes any task description and auto-decomposes into parallel workstreams.

---

## Usage

```
Paste this prompt into Claude Code, replacing {{TASK}} with your objective.
The system will auto-decompose, spawn agents, and iterate until done.
```

---

## The Prompt

```markdown
# MISSION: {{TASK}}

## Phase 0: Research & Decomposition

Before writing ANY code:

1. **Read context files**:
   - CLAUDE.md + MEMORY.md (auto-loaded)
   - docs/guides/FEATURES.md (if product work)
   - docs/guides/implementation_plan.md (if roadmap work)
   - Any files directly relevant to {{TASK}}

2. **Decompose into workstreams**: Break {{TASK}} into 3-7 independent workstreams.
   Each workstream should be:
   - Self-contained (can run in parallel)
   - Has clear deliverables (files created/modified, tests passing)
   - Has a verification criterion (how do we know it's done?)

3. **Present decomposition to user**: Use AskUserQuestion to confirm the plan.

## Phase 1: Spawn Hive Mind

Initialize queen-led coordination:

```bash
# Queen coordinates, workers execute
/hive-mind-advanced
```

Configuration:
- **Topology**: hierarchical-mesh (queen + N workers)
- **N workers**: Match workstream count (3-7)
- **Consensus**: Byzantine (for safety-critical), Raft (for speed)
- **Memory**: Shared memory namespace per task

## Phase 2: Agent Assignment

For each workstream, spawn a worker agent via Claude Code Task tool.
Route models by domain:

| Domain | Model | Trigger |
|--------|-------|---------|
| Crypto, security, PQC, architecture | Opus | crates/*, security audit, FIPS |
| Features, components, API, tests | Sonnet | web/*, api/*, tests/*, mobile/* |
| Docs, config, formatting, CSS | Haiku | *.md, *.json, *.css, *.toml |

Each agent MUST follow RALPH:

```
R - Research    Read specs, existing code, Context7 docs
A - Architecture   Design solution, get queen approval
L - Logic       TDD: failing test first, implement, verify green
P - Polish      /simplify, remove dead code
H - Harden      Full test suite, Playwright screenshot if UI
```

RALPH parameters:
- **Max iterations**: 20
- **Quality threshold**: 0.995
- **Escalation**: After 12 failed iterations, escalate to queen

## Phase 3: Parallel Execution

ALL agents launch in a SINGLE message:

```javascript
[Single Message - All Agents]:
  Task("Worker 1", "{{workstream_1_description}}", "{{agent_type}}")
  Task("Worker 2", "{{workstream_2_description}}", "{{agent_type}}")
  Task("Worker 3", "{{workstream_3_description}}", "{{agent_type}}")
  // ... up to N workers

  TodoWrite { todos: [
    {id: "ws-1", content: "{{workstream_1}}", status: "in_progress"},
    {id: "ws-2", content: "{{workstream_2}}", status: "in_progress"},
    // ...
  ]}
```

## Phase 4: Verification Gate

After all workers complete:

1. **Build check**: Run relevant build commands
   ```bash
   cargo test --workspace          # If Rust touched
   cd web && npm run build         # If web touched
   pytest tests/                   # If Python touched
   jb build .                      # If Jupyter Book
   ```

2. **Visual verification**: For any UI changes
   ```bash
   # Playwright screenshot
   mcp__plugin_playwright_playwright__browser_navigate { url: "..." }
   mcp__plugin_playwright_playwright__browser_take_screenshot
   ```

3. **Quality score**: Each deliverable gets a score 0-1
   - Code compiles/builds: 0.3
   - Tests pass: 0.3
   - Visual verification: 0.2
   - No regressions: 0.2

   **Threshold: 0.995** (all four must essentially pass)

4. **If below threshold**: Identify failing component, re-enter RALPH for that workstream only.

## Phase 5: Integration & Commit

1. **Merge workstream outputs** (resolve any conflicts)
2. **Run full test suite** one final time
3. **Auto-commit** with conventional commit format:
   ```
   feat(scope): {{concise description of TASK}}

   - Workstream 1: {{what was done}}
   - Workstream 2: {{what was done}}
   ...
   ```

## Phase 6: Update State

1. Update `docs/guides/FEATURES.md` if pillar status changed
2. Update `docs/guides/implementation_plan.md` if phase progress changed
3. Record progress: `[Pillar N] X% -> Y% | tests: pass/fail | gap: description`

---

## Available Skills & Commands

The orchestrator has access to all Claude Code skills. Key ones:

| Skill | When to Use |
|-------|-------------|
| `/hive-mind-advanced` | Multi-agent coordination |
| `/sparc-methodology` | SPARC TDD workflow |
| `/pair-programming` | Navigator/Driver TDD |
| `/verification-quality` | Truth scoring + rollback |
| `/simplify` | Code review for quality |
| `/batch-tdd` | Parallel TDD across domains |
| `/self-improve` | Learning loop from outcomes |

## Available Agent Types

Core: `coder`, `reviewer`, `tester`, `planner`, `researcher`
Specialized: `frontend-specialist`, `sparc-coder`, `tdd-london-swarm`
Coordination: `hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`

## Error Handling

- **Agent timeout (>10 min)**: Kill and respawn with narrower scope
- **Build failure**: Isolate failing module, RALPH that module only
- **Consensus failure**: Queen makes final decision, logs rationale
- **Context overflow**: `/compact` with preservation instructions
- **12 failed iterations**: Escalate to user via AskUserQuestion
```

---

## Example Invocations

### Fill a Jupyter Book section (5 files)
```
TASK: Fill Part V (Post-Quantum Cryptography) of quantum-book with complete content.
Files: foundations/pqc/{intro,nist_standards,lattice_crypto,qrng_vs_prng,risk_assessment}.md
Source material: NIST FIPS 203/204/205, zipminator/docs/book/, /dev/mo/ notebooks
```

### Build a new product feature
```
TASK: Add quantum portfolio optimizer to Qm9 with QAOA backend.
Deliverables: API endpoint, React dashboard component, 3 unit tests, 1 integration test.
```

### Enhance documentation
```
TASK: Enhance all 7 JupyterBook notebooks with professional visualizations,
Monte Carlo simulations, and banking/cybersecurity context.
```
