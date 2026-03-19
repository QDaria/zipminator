# 20 -- Master Execution Orchestration

> Copy-paste this into Claude Code to orchestrate the full beta launch.
> Uses /hive-mind-advanced with queen coordination.
>
> **Estimated total time**: 8-12 hours across multiple parallel sessions
> **Optimal parallelism**: 4 concurrent Claude Code sessions

---

## Quick Launch: High Priority Only (4 Parallel Agents)

```
You are the Hive Queen for Zipminator Beta Launch.

PREREQUISITE: source docs/guides/claude-flow-v3/scripts/activate-all.sh

Read these context files:
- docs/guides/claude-flow-v3/18-beta-launch-prompts.md (all 6 recipes)
- docs/guides/FEATURES.md (product spec)
- CLAUDE.md (project rules)

EXECUTION PLAN:

STEP 1 (IMMEDIATE, single agent):
  Execute Recipe M: Push 23 commits to remote.
  Run cargo test --workspace and cd web && npx next build first.
  If both green, git push origin main.

STEP 2 (PARALLEL, 4 agents after push succeeds):
  Spawn 4 agent team members:
  1. "pypi-publisher" (Sonnet): Execute Recipe N (PyPI publish)
  2. "blog-writer" (Sonnet): Execute Recipe O (3 blog posts)
  3. "social-creator" (Sonnet): Execute Recipe P (LinkedIn + Twitter content)
  4. "release-manager" (Sonnet): Execute Recipe Q (GitHub Release tag)

STEP 3 (AFTER release tag):
  Execute Recipe R: App Store submissions (will likely block on credentials).
  Document all blockers for user.

RALPH loop each recipe independently. Max 12 iterations per recipe.
Report status after each recipe completes.
```

---

## Full Launch: High + Medium Priority (Queen + 6 Domain Leads)

```
You are the Hive Queen for Zipminator Full Beta Completion.
Use /hive-mind-advanced for supreme coordination.

Read ALL context:
- docs/guides/claude-flow-v3/18-beta-launch-prompts.md
- docs/guides/claude-flow-v3/19-product-completeness-prompts.md
- docs/guides/FEATURES.md
- docs/guides/architecture.md
- CLAUDE.md

PHASE 1 — LAUNCH (2-3 hours, parallel):
  Execute recipes M through R from 18-beta-launch-prompts.md
  (See dependency graph: Track A parallel, Track B sequential after M)

PHASE 2 — PRODUCT (4-8 hours, parallel after Phase 1):
  Execute recipes S through Y from 19-product-completeness-prompts.md
  (See dependency graph: Track C fully parallel, D sequential, E/F independent)

  Priority order within Phase 2:
  1. Recipe T (Anonymizer L4-L10) — highest user-facing impact
  2. Recipe S (Q-AI LLM backend) — most visible gap
  3. Recipe V (Messenger persistence) — core functionality gap
  4. Recipe W (Browser AI sidebar) — completes Pillar 8
  5. Recipe X (VoIP encryption) — completes Pillar 3
  6. Recipe U (Email transport) — complex, needs Docker infra
  7. Recipe Y (Q-Mesh RuView) — research-heavy, external repo

COORDINATION RULES:
- Each recipe runs RALPH loop independently
- Report completion of each recipe to Queen
- Queen updates docs/guides/FEATURES.md percentages after each recipe
- Queen updates docs/guides/implementation_plan.md checkboxes
- Auto-commit after each recipe: feat(pillarN): description

QUALITY GATE (before marking any recipe done):
- [ ] Relevant test suite passes
- [ ] No regressions in cargo test --workspace
- [ ] FEATURES.md percentages updated
- [ ] Commit created with conventional format
```

---

## Single-Session Sprint: Pick and Execute One Recipe

```
Execute Recipe [LETTER] from docs/guides/claude-flow-v3/[18 or 19]-*.md

Read the recipe, then:
1. R: Read all context files listed in the recipe
2. A: Design approach (skip if recipe pre-approves architecture)
3. L: TDD — write tests first, implement to pass
4. P: /simplify the code
5. H: Run quality gates listed in the recipe

RALPH loop up to 12 iterations until all quality gates pass.
Auto-commit when done: feat(scope): description
```

---

## Monitoring Dashboard

After starting any execution, check progress with:

```bash
# Git activity (are agents committing?)
git log --oneline --since="1 hour ago"

# Test health
cargo test --workspace 2>&1 | tail -5
cd web && npx next build 2>&1 | tail -5
micromamba activate zip-pqc && pytest tests/ --tb=no -q 2>&1 | tail -5

# FEATURES.md diff (are percentages updating?)
git diff docs/guides/FEATURES.md | head -30
```
