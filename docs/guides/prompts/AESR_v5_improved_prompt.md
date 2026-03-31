# AESR v5.0 -- Improved Universal Prompt Engineer

> **Version**: 5.0 | **Date**: 2026-04-01
> **Claude Code**: v2.1.88 | **Ruflo**: v3.5.48
> **Supersedes**: `prompt_i1.md`, incorporates AESR v4 boot sequence
> **Purpose**: Eliminates infinite question loops; maximizes infrastructure utilization

---

## How to Use

Paste any task description after this prompt. The system will:
1. Auto-discover relevant skills/agents/commands from `.claude/` based on task keywords
2. Run 3 rounds of self-answer Q&A (you approve or override with single words)
3. Produce a production-ready prompt with infrastructure refs, quality gates, structural limits

At any point, type `/improve` to analyze and strengthen the current output.

---

## Self-Answer Protocol (3 rounds max)

For each question, Claude provides a suggested answer. User approves with `Y` or overrides.

```
QUESTION 1: What is the target quality threshold?
SUGGESTED: 0.995 (standard for research-grade and crypto work)
[Y / override value]

QUESTION 2: Sequential or parallel execution?
SUGGESTED: Parallel agent teams with worktree isolation (5 workstreams detected)
[Y / override]

QUESTION 3: Which reasoning depth?
SUGGESTED: --effort max (security-critical domains detected)
[Y / override]
```

After Round 3, Claude produces the final optimized prompt. No further questions.
If user asks followup questions after Round 3, redirect to `/improve`.

---

## Infrastructure Auto-Discovery

Based on task keywords, surface relevant capabilities automatically:

### Research / Paper / Publication
- `/hive-mind-advanced` -- Queen + specialist reviewers
- `/verification-quality` -- truth scoring 0.0-1.0
- `/quantum-scientific-writer`, `/research-paper-writer` -- prose and format
- `/quantum-assurance-validator`, `/quantum-cryptanalysis-expert` -- physics and crypto rigor
- Context7 MCP -- arXiv/IACR/venue format lookup
- `/ralph-loop` -- persistent iteration until quality threshold met
- `/episodic-memory:search-conversations` -- retrieve past paper improvement patterns

### Full-Stack Development / Feature Work
- `/batch-tdd` -- parallel TDD across Rust/Web/Mobile/Browser
- `/hive-tdd` -- hive-mind consensus + RALPH combined
- Agent teams with `isolation: "worktree"` -- safe parallel editing
- Model routing: Sonnet for features, Opus for crypto, Haiku for docs
- `/superpowers:test-driven-development` -- structured TDD workflow
- `/simplify` -- code review before commit

### Cryptographic / Security-Critical
- `--effort max` -- full 128K thinking tokens
- `/quantum-cryptanalysis-expert` -- PQC algorithm auditing
- `/agentic-jujutsu` -- attacker/defender/auditor adversarial testing
- `/hive-mind-advanced` -- Byzantine consensus (2/3 majority required)
- `cargo fuzz` -- fuzzing for keygen/encapsulate/decapsulate
- FIPS language rules from `.claude/rules/02-security-pqc.md`

### Multi-Day Campaign / Product Launch
- `/mega-task` -- 6-phase multi-day orchestration
- `/ralph-loop "task" --max-iterations 50` -- persistent iteration with Stop hook
- `/schedule` -- cron-triggered remote agents for overnight work
- `/loop 10m /batch-tdd` -- recurring test verification
- Session continuity: `/compact` + ruflo memory + `/go` to resume
- `end-to-end-100percent-completion.md` template (9 agent teams, RALPH N=20)

### Quick Fix / Small Change
- Direct edit + tests + `--effort low`
- No agents, no RALPH, just fix and verify
- `/simplify` for code review afterward

---

## Effort Control (v2.1.88)

| Tier | Tokens | When | Invocation |
|------|--------|------|------------|
| Low | ~4K | Typo, rename, config | `--effort low` or default for small tasks |
| Medium | ~16K | API design, feature work | `--effort medium` (default for Opus) |
| High | ~32K | Architecture, cross-file refactors | `--effort high` |
| Max | ~128K | Crypto, security audits, physics proofs, research | `--effort max` or `/effort max` |

Claude Opus 4.6 with `--effort max` uses adaptive thinking up to 128K tokens.
The old "ultrathink" keyword is deprecated since v2.1.80+. Use `--effort max` instead.

---

## Structural Limit Detection

If any of these conditions are true, flag immediately instead of looping:

| Condition | Action |
|-----------|--------|
| Task requires >128K context | Multi-session strategy with `/compact` checkpoints |
| Manual steps needed (API keys, certs) | List what user must do vs what agents automate |
| External dependencies (DB, API) | Mark as blocking; propose workarounds |
| Ambiguous after 3 rounds | Provide 2-3 interpretations, ask user to pick ONE |
| Quality plateaued after 12 iterations | Document max-achievable score; stop iterating |

---

## Output Template

After 3 self-answer rounds, produce this structure:

```markdown
# [Task Title]

## Objective
[1-sentence goal with measurable success criteria]

## Context
- **Current state**: [what exists now]
- **Target state**: [what success looks like]
- **Quality threshold**: 0.XXX
- **Effort tier**: --effort [low|medium|high|max]
- **Timeline**: [realistic estimate]

## Decomposition
### Workstream 1: [Name]
- **Owner**: [agent/skill/human]
- **Model tier**: [Opus/Sonnet/Haiku]
- **Dependencies**: [what must complete first]
- **Success criteria**: [measurable]

### Workstream 2: [Name]
...

## Orchestration
- **Tier**: [Quick Fix | Sprint Task | Mega Task]
- **Primary tools**: [slash commands]
- **Supporting skills**: [on-demand skills]
- **MCP servers**: [ruflo, context7, playwright, etc.]
- **Parallelization**: [agent teams | sequential | subagents]

## Quality Gates
| Phase | Check | Threshold | Rollback |
|-------|-------|-----------|----------|
| Code | cargo test + pytest | 100% pass | Any failure |
| Review | /simplify + /verification-quality | >= 0.95 | < 0.90 |
| Security | /agentic-jujutsu | No critical findings | Critical vuln |
| Final | Byzantine consensus 3/3 | 0.995 aggregate | < 0.995 after 20 iter |

## Structural Limits
- **Blocked by**: [manual steps, external deps]
- **Max achievable this session**: [scope]
- **Continuity**: ruflo memory checkpoint + /compact + /go resume

## Persistent Iteration (if multi-session)
/ralph-loop "[task description]" \
  --completion-promise "QUALITY_TARGET_MET" \
  --max-iterations 20

## Zero-Hallucination
- Every claim verified or marked [unverified]
- Citations checked via DOI/arXiv lookup
- Benchmarks reproducible from code
- 0% tolerance for mock/placeholder data
- FIPS: "implements FIPS 203" never "FIPS compliant"
```

---

## Copy-Paste Starters

### Research Paper (paste into Claude Code)
```
/effort max

Improve docs/research/paper/main.tex from 0.80 to 0.995 quality.
Target venue: PoPETs 2026 or Nature Computational Science.

Load skills: /quantum-scientific-writer, /verification-quality, /quantum-assurance-validator

Orchestration: /hive-mind-advanced with 7 workstreams:
W1: Theoretical rigor (proofs, formal verification)
W2: Literature completeness (50+ citations, SOTA comparison)
W3: Experimental validation (reproducible benchmarks, statistical tests)
W4: Format compliance (venue template, BibTeX)
W5: Prose quality (clarity, notation, flow)
W6: Adversarial review (simulate 3 hostile reviewers)
W7: False-positive checker (verify flagged issues against sources)

Quality gate: 0.995 convergence, Byzantine consensus 5/5, zero mock data.
Use /ralph-loop --max-iterations 20 for persistent iteration.
Checkpoint daily via ruflo memory + /compact.
```

### Product Launch (paste into Claude Code)
```
/effort high

Ship Zipminator to all platforms with 100% pillar completion.
Read @FEATURES.md and @implementation_plan.md for current gaps.

Orchestration: 9 parallel agent teams from end-to-end-100percent-completion.md
Each team: RALPH N=20, threshold 0.995

Priority:
1. Critical path: Apple signing -> flutter build ipa -> TestFlight
2. High: Deploy signaling server, FastAPI backend, live message test
3. Medium: GitHub Release, App Store listing, Play Store AAB

Manual steps (Mo must do): PYPI_TOKEN, Apple signing certs, Play Store keystore
Everything else: automated by agent teams

Convergence: cargo test + pytest + flutter test + npm build all green
Session continuity: /compact + ruflo memory checkpoint + /go resume
```

### Quick Fix (paste into Claude Code)
```
Fix [ISSUE] in [FILE]. Run cargo test / npm test after.
```

---

## Meta-Improvement

Type `/improve --meta` to improve this prompt engineer itself.
Type `/improve` at any point to improve the most recent output.

---

## Integration Map

```
AESR v5 Prompt Engineer
  |
  +-- Self-Answer Protocol (3 rounds max)
  |     |-- Auto-discover skills from keywords
  |     |-- Suggest effort tier (--effort max for crypto)
  |     +-- Detect structural limits early
  |
  +-- Infrastructure Layer
  |     |-- 137 skills (.claude/skills/)
  |     |-- 173 commands (.claude/commands/)
  |     |-- 87 agents (.claude/agents/)
  |     |-- 215 Ruflo MCP tools (v3.5.48)
  |     +-- Plugins: episodic-memory, superpowers, ralph-loop, etc.
  |
  +-- Execution Layer
  |     |-- /mega-task (multi-day, 6-phase)
  |     |-- /sprint-task (30-180 min)
  |     |-- /ralph-loop (persistent iteration via Stop hook)
  |     |-- /loop (recurring interval, e.g., /loop 5m /improve)
  |     |-- /schedule (cron-triggered remote agents)
  |     +-- /hive-mind-advanced (queen + N workers, Byzantine consensus)
  |
  +-- Quality Layer
  |     |-- /verification-quality (truth scoring 0-1)
  |     |-- /simplify (code review)
  |     |-- /agentic-jujutsu (adversarial)
  |     |-- /improve (one-push improvement)
  |     +-- RALPH methodology (R-A-L-P-H, max 12 iterations)
  |
  +-- Memory Layer
        |-- CLAUDE.md (durable, manual, always in context)
        |-- AgentDB (vector search, 150x faster via HNSW)
        |-- ReasoningBank (RL policy, trajectory learning)
        |-- Episodic Memory (cross-session search, plugin v1.0.15)
        +-- Agentic Jujutsu (git-integrated trajectories)
```
