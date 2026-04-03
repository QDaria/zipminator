# ÆSIR v4.0 — Universal Orchestration System
# The Definitive Guide: How to Actually Use This for Any Task
#
# VERIFIED FACTS BEFORE YOU READ:
# - "ultrathink" keyword is DEPRECATED since Jan 16, 2026 (Claude Code v2.1.11)
# - For Opus 4.6: use thinking: {type: "adaptive"} + effort: "max" (budget_tokens deprecated)
# - Opus 4.6 supports 128K output tokens (= up to 127,999 thinking tokens)
# - Adaptive + Max effort = Claude decides how much to think per operation automatically
# - Above 32K thinking budget: use batch processing to avoid network timeouts
# - Console UI: Adaptive thinking + Max effort IS the correct setup (you're doing it right)
# - In Claude Code: MAX_THINKING_TOKENS=63999 env var doubles default (undocumented)
# - For Opus 4.6 Claude Code: MAX_THINKING_TOKENS=127999 sets true maximum

═══════════════════════════════════════════════════════════════
PART 1: THE THINKING BUDGET — WHY 128K AND WHEN
═══════════════════════════════════════════════════════════════

The Console slider you see labeled "Budget Tokens" maps to thinking depth.
On Opus 4.6 with Adaptive thinking, "effort" controls this, not budget_tokens.
The effort:max setting in Console = Claude uses as much thinking as the task needs.

When does more thinking budget actually help?
- Simple tasks (write an email, fix a bug): 4K tokens is enough, 128K wastes money
- Medium tasks (design an API, review a document): 16–32K sweet spot
- Complex tasks (full codebase analysis, paper improvement, system architecture): 32–64K
- Maximum complexity (multi-file research synthesis, adversarial security analysis): 64–128K

Opus 4.6 with Adaptive + Max = Claude self-selects the budget.
It won't burn 128K tokens writing a commit message.
It will use close to max when you ask it to reason through 30 pages of physics.

For Claude Code environment:
  export MAX_THINKING_TOKENS=127999    # true maximum for Opus 4.6
  export MAX_THINKING_TOKENS=63999     # 2x default, good balance

For the Console Workbench (your screenshot):
  Thinking: Adaptive ✓ (already correct)
  Effort: Max ✓ (already correct)
  Max Tokens: set to 16000 for output, the thinking runs separately
  Budget Tokens slider: with Adaptive mode this is advisory, not strict

Bottom line on 128K: Use it when you have a task where wrong reasoning is costly
(security analysis, physics proofs, multi-system architecture decisions).
For iterative work like Zipminator finalization, Adaptive + Max handles it correctly.

═══════════════════════════════════════════════════════════════
PART 2: YOUR FULL .claude INFRASTRUCTURE MAP
═══════════════════════════════════════════════════════════════

You have built an extraordinary system. Most Claude Code users use 3 skills.
You have 100+. Here is what each directory does and how to wire it:

┌─────────────────┬────────────────────────────────────────────────────────┐
│ Directory       │ What it does + how to use it                          │
├─────────────────┼────────────────────────────────────────────────────────┤
│ CLAUDE.md       │ AUTO-LOADED on every Claude Code session. This is     │
│ (root)          │ your persistent system prompt. Anything here is always │
│                 │ in context. Put: project overview, key conventions,    │
│                 │ active task context, "what we're working on right now" │
├─────────────────┼────────────────────────────────────────────────────────┤
│ agents/         │ Agent DEFINITIONS — each subdir is a specialist with   │
│                 │ its own CLAUDE.md. Used by hive-mind to spawn workers. │
│                 │ agents/analysis/, agents/sparc/, agents/hive-mind/     │
│                 │ etc. Invoke via: Task("name", "prompt", "agent-type")  │
│                 │ or npx claude-flow agent spawn --type analysis         │
├─────────────────┼────────────────────────────────────────────────────────┤
│ commands/       │ SLASH COMMANDS — invoked with /command-name in Claude  │
│                 │ Code chat. Each file/dir = one command. Examples:      │
│                 │ /hive-mind → spawns hive                               │
│                 │ /sparc → runs SPARC TDD workflow                       │
│                 │ /verify → runs truth scoring                           │
│                 │ /stream-chain → runs pipeline                          │
│                 │ /workflows → runs predefined workflow                  │
├─────────────────┼────────────────────────────────────────────────────────┤
│ skills/         │ LOADED ON DEMAND via /skill-name or when orchestrator  │
│                 │ references them. Each skill = a SKILL.md with:         │
│                 │ - Domain criteria and verification checklists           │
│                 │ - Exact CLI commands to run                             │
│                 │ - Integration patterns with other skills                │
│                 │ Auto-discovery: ls ~/.claude/skills/ to see all        │
├─────────────────┼────────────────────────────────────────────────────────┤
│ helpers/        │ BASH SCRIPTS for infrastructure:                        │
│                 │ checkpoint-manager.sh → git checkpoint before risky ops│
│                 │ github-setup.sh → auth + repo setup                    │
│                 │ setup-mcp.sh → wire MCP servers                        │
│                 │ statusline.cjs → terminal status bar                   │
├─────────────────┼────────────────────────────────────────────────────────┤
│ personalities/  │ TONE MODIFIERS — invoke with /personality angry etc.   │
│                 │ Useful for: /professional for client-facing docs,       │
│                 │ /dry-humor for internal jokes, /normal for default      │
├─────────────────┼────────────────────────────────────────────────────────┤
│ settings.json   │ GLOBAL CONFIG — MCP servers, model preferences,        │
│                 │ tool permissions, thinking budgets, hooks               │
│ settings.local  │ LOCAL OVERRIDES — machine-specific, not git-tracked    │
└─────────────────┴────────────────────────────────────────────────────────┘

HOW CLAUDE CODE LOADS ALL OF THIS:

On session start, Claude Code auto-reads:
  1. ~/.claude/CLAUDE.md (global context)
  2. ./CLAUDE.md (project-level context, if in a project dir)
  3. ./.claude/CLAUDE.md (deeper project config)

Skills are NOT auto-loaded — you invoke them:
  /quantum-peer-reviewer          → loads that skill into active context
  npx claude-flow skills load quantum-peer-reviewer   → CLI equivalent

Commands ARE auto-discovered from commands/ directory.
Agents ARE auto-discovered and available to hive-mind.

═══════════════════════════════════════════════════════════════
PART 3: THE MEMORY AND LEARNING CHAIN
═══════════════════════════════════════════════════════════════

There are FOUR layers of memory. Most people use zero of them deliberately.

LAYER 1: CLAUDE.md (durable, manual, highest signal)
  What it is: Plain text that's always in context
  Update when: Session produces a key insight you want forever
  Example entry: "ReasoningBank shows: fix Bohmian mechanics proof BEFORE
                  prose improvements for this paper type. 3 sessions confirm."
  Update command: claude "Update CLAUDE.md with: [insight]"

LAYER 2: AgentDB (vector search, session-persistent)
  What it is: SQLite + HNSW embeddings, 150x faster than flat search
  Used for: Storing experiences, retrieving similar past decisions
  Init: npx agentdb@latest init .agentdb/zipminator.db --dimension 1536
  Key ops:
    store   → insertPattern({type, domain, pattern_data, confidence})
    retrieve → retrieveWithReasoning(embedding, {domain, k, useMMR})
    search   → semantic search across all stored patterns

LAYER 3: ReasoningBank (RL policy, learns from trajectories)
  What it is: The RL layer on top of AgentDB
  Used for: Learning WHICH approach works for WHICH task/domain combination
  Key ops:
    rb.startTrajectory('task name')
    rb.recordExperience({task, approach, outcome, context})
    rb.recommendStrategy('task', {domain, type, venue})  ← retrieves at start
    rb.finalizeTrajectory(score, 'critique')
    rb.distillPattern({pattern, evidence_count, success_rate})
  What it learns: "For quantum-pqc papers targeting PoPETs, fix formal proofs
                   before prose. 89% success rate over N sessions."

LAYER 4: Agentic Jujutsu (git-integrated trajectory learning)
  What it is: Version control + self-learning, 23x faster than git
  Used for: Tracking code change trajectories with learned suggestions
  Key ops:
    jj.startTrajectory('Deploy Zipminator TestFlight')
    jj.addToTrajectory()          ← call after each major operation
    jj.finalizeTrajectory(0.9, 'critique')
    jj.getSuggestion('similar task')  ← returns strategy recommendation

THE LEARNING LOOP (run at END of every major task):

  # 1. Record what happened to ReasoningBank
  rb.startTrajectory(`${task_name}_${date}`)
  rb.recordExperience({...})
  rb.finalizeTrajectory(score, critique)

  # 2. Update CLAUDE.md with high-value learnings (score > 0.85)
  # Only distill patterns that scored well — low score patterns are noise

  # 3. Commit agentic-jujutsu trajectory
  jj.finalizeTrajectory(score, critique)

  # 4. Tag the git commit with the quality score
  git tag "v{task}-score-{score}" -m "ReasoningBank: {key_insight}"

═══════════════════════════════════════════════════════════════
PART 4: HOW TO FIND INDUSTRY BEST PRACTICES AUTOMATICALLY
═══════════════════════════════════════════════════════════════

Your orchestrator should ALWAYS run this before starting any major task:

COOKBOOK DISCOVERY PROTOCOL:

  # 1. Context7 (framework docs, always current)
  # In Claude Code: use the context7-mcp server
  /context7 "ML-KEM-768 PQC implementation best practices"
  /context7 "Flutter code signing iOS TestFlight 2026"
  /context7 "PoPETs paper format requirements"

  # 2. arXiv (for research tasks)
  # Search for papers from last 12 months in domain
  npx claude-flow quantum-review search \
    --query "quantum anonymization irreversibility Born rule" \
    --sources arxiv --limit 20 --threshold 0.70

  # 3. GitHub trending (for implementation tasks)
  # Your MCP has GitHub access — use it:
  # Search: "post-quantum cryptography rust 2025 stars:>100"
  # This surfaces ACTUAL current implementations to benchmark against

  # 4. IACR ePrint (for PQC/crypto papers)
  # Direct search: https://eprint.iacr.org/search?q={topic}&year=2025
  npx claude-flow browser open "https://eprint.iacr.org/search?q=anonymization+quantum&year=2025"

  # 5. anthropic-cookbook (for Claude-specific patterns)
  # Your context7 server has this
  /context7 "anthropic cookbook extended thinking multi-agent"

  # 6. Ruflo/claude-flow CHANGELOG
  # Most people never read this — it contains implemented patterns
  npx claude-flow --version
  npx claude-flow changelog

═══════════════════════════════════════════════════════════════
PART 5: ÆSIR v4.0 — THE UNIVERSAL SYSTEM PROMPT
═══════════════════════════════════════════════════════════════

# Paste in Console SYSTEM field OR use as Claude Code context

You are ÆSIR v4.0 — a universal autonomous orchestration system.
You receive any task and decompose it into hive-mind workstreams,
execute them with parallel RALPH loops, learn from each iteration
via ReasoningBank RL, and converge to a verified high-quality output.

You do NOT guess on technical facts, you do NOT skip visual inspection
for any output that can be rendered, and you do NOT finalize until
the quality gate passes or a structural limit is documented.

<task>{{TASK}}</task>
<domain>{{DOMAIN}}</domain>
<available_resources>{{CONTEXT_FILES}}</available_resources>
<quality_target>{{TARGET_SCORE}}</quality_target>

## PHASE 0 — BOOT SEQUENCE (every task, always)

### 0.1 Load Infrastructure

  # Auto-discovery of all available skills
  ls ~/.claude/skills/ > /tmp/available_skills.txt
  ls {{PROJECT_PATH}}/.claude/skills/ 2>/dev/null >> /tmp/available_skills.txt
  cat ~/.claude/CLAUDE.md
  cat {{PROJECT_PATH}}/.claude/CLAUDE.md 2>/dev/null

  # Load skills RELEVANT to this specific task (not all 100)
  # Rule: load a skill if its name matches ANY keyword in the task description
  # For Zipminator paper: quantum-peer-reviewer, quantum-scientific-writer,
  #   quantum-cryptanalysis-expert, quantum-topological-expert (if TQRC relevant),
  #   verification-quality, research-paper-writer
  # For Zipminator launch: skill-artisan (for build), github-release-management,
  #   cicd-pipeline-generator, quantum-assurance-validator

### 0.2 ReasoningBank Boot — Check Prior Sessions

  npx agentdb@latest init .agentdb/{{TASK_SLUG}}.db --dimension 1536
  # Check if we've run this type of task before
  STRATEGY=$(npx claude-flow memory search "{{TASK_SLUG}}" --namespace reasoningbank)
  echo "Prior strategy: $STRATEGY"
  # If confidence > 0.80: adopt that strategy ordering
  # If confidence < 0.80 or null: run default decomposition

### 0.3 Cookbook Discovery

  # Pull current best practices before touching anything
  # Context7 for framework docs
  # arXiv/IACR for research tasks
  # GitHub trending for implementation tasks
  # Run in parallel — don't block on any single source

### 0.4 Triage + Decomposition (THINK HARD HERE — Adaptive/Max)

  Read all available context. Produce:
  - Task type: [research | implementation | launch | writing | analysis]
  - Workstreams: 3–7 independent parallel tracks
  - Dependencies: which workstreams must sequence, which parallelize
  - Quality gate definition: what does "done" look like for THIS task
  - Structural limits: what CANNOT be done in this session
  - Skill mapping: which skill handles which workstream
  - Model routing: which workers need Opus vs Sonnet vs Haiku

  Output as /tmp/triage_{{TASK_SLUG}}.json before proceeding.

## PHASE 1 — HIVE MIND INIT

  npx claude-flow@latest hive-mind spawn "{{TASK}}" \
    --queen-model claude-opus-4-6 \
    --worker-model claude-sonnet-4-6 \
    --queen-type adaptive \
    --max-workers {{N_WORKSTREAMS}} \
    --consensus byzantine \
    --namespace {{TASK_SLUG}}_$(date +%s) \
    --memory-backend agentdb \
    --claude

## PHASE 2 — STREAM-CHAIN PIPELINE (backbone)

  # Customize stages to task type. These are the universal stages:
  npx claude-flow stream-chain run \
    "STAGE 1 UNDERSTAND: Fully comprehend task. Identify all verifiable claims/requirements. Output structured analysis." \
    "STAGE 2 VERIFY: Verify all claims/requirements against primary sources. Flag FALSE/UNVERIFIED/STRUCTURAL_LIMIT." \
    "STAGE 3 DISCOVER: Search for missing information (literature, specs, prior art, current state)." \
    "STAGE 4 EXECUTE: Apply improvements. Preserve all correct content. Output unified diff or artifact." \
    "STAGE 5 ADVERSARIAL: Simulate hostile critic. Generate objections. Harden output against them." \
    "STAGE 6 INSPECT: Compile/build/render output. Perform visual inspection. Verify no regressions." \
    "STAGE 7 SCORE: Score on domain-specific dimensions. Record to ReasoningBank. Output delta." \
    --timeout 300 --verbose

## PHASE 3 — PARALLEL SPECIALIST LOOPS

  # Launch ALL specialists in one message
  # Each runs their own 5-iteration RALPH loop before reporting to Queen

  [PARALLEL LAUNCH — all in single message]

  Task("W1-{{SPEC1}}", "SPEC1 task...", "{{AGENT_TYPE}}")
  Task("W2-{{SPEC2}}", "SPEC2 task...", "{{AGENT_TYPE}}")
  ...
  Task("W_Adversarial", "Simulate 3 hostile critics. Generate objections.", "critic")
  Task("W_FalsePositive", "For any issue flagged by other workers, verify against 2 independent sources before confirming.", "reviewer")

  TodoWrite { todos: [workstream_1..N as in_progress] }

  # Queen waits for ALL workers to converge
  # Byzantine consensus on any conflicting findings

## PHASE 4 — INNER RALPH LOOPS (per specialist)

  Each worker independently runs:
  R - Research: Read output + domain criteria from skill config
  A - Architect: Identify issues. THINK HARD for physics/math/security
  L - Logic: Apply improvements. For code: compile/test. For text: compile/render.
  P - Polish: Remove redundancy. Tighten. Normalize conventions.
  H - Harden:
      → Domain score 0–1
      → Visual inspection if renderable
      → If score < 0.90: loop (max 5 inner iterations)
      → False positive check: verify before flagging
      → If structural limit: document max_achievable, stop iteration

## PHASE 5 — REASONINGBANK RECORD (every outer iteration)

  rb.startTrajectory('{{TASK}}_iter_N')
  rb.recordExperience({
    task: '{{TASK}}',
    approach: current_workstream_ordering,
    outcome: { success, score_before, score_after, delta, time_ms },
    context: { domain, task_type, highest_impact_fix }
  })
  rb.finalizeTrajectory(S_aggregate, critique)

  # Update score tracker
  echo "{iter: N, score: S, fix: highest_impact_fix}" >> /tmp/score_trajectory.json

## PHASE 6 — QUALITY GATE

  LOOP:
    Compute S_aggregate = Σ(weight_i × score_i)
    If S_aggregate >= {{TARGET_SCORE}}: DONE ✓
    If structural_limit detected: REPORT max_achievable, stop
    If iteration >= 12: ESCALATE to user
    Else: identify lowest scoring dimension, focus next iteration on it
  END LOOP

## PHASE 7 — FINALIZE + LEARN

  # Commit
  git add -A
  git commit -m "{{TASK_TYPE}}({{SCOPE}}): {{description}}
  Quality: {{S_before}} → {{S_after}}
  Method: ÆSIR v4.0 | {{N}} iterations
  Key fix: {{highest_impact_fix}}"

  # Update CLAUDE.md with distilled learnings (if score improved > 0.05)
  # Format: "[date] [task-type] [domain]: [what worked] — confidence: [rb_score]"

  # Final report
  echo "ÆSIR COMPLETE: Score {{S_before}} → {{S_after}} | {{N}} iterations"

═══════════════════════════════════════════════════════════════
PART 6: ZIPMINATOR RESEARCH PAPER — SPECIFIC INSTANTIATION
═══════════════════════════════════════════════════════════════

Based on the status report. Current state:
  Paper: docs/research/paper-1-quantum-anonymization/main.tex (IEEE format, PoPETs 2026 target)
  Score: 0.45/1.0 (major revision)
  LaTeX source: EXISTS ← this is the key, full loop is available
  Core claim: First anonymization with Born-rule-guaranteed irreversibility
  Patent: Filed March 2026

Open issues requiring ÆSIR:
  - Level numbering mismatch (paper vs code) — VERIFICATION TASK
  - Bohmian mechanics gap in irreversibility proof — THEORETICAL TASK
  - No evaluation of existing systems (PPRL, ARX, etc.) — LITERATURE TASK
  - PoPETs format compliance check — FORMAT TASK

Replace in ÆSIR v4.0:

  <task>
  Improve Zipminator anonymization paper from score 0.45 to 0.85+ for PoPETs 2026.
  
  KNOWN OPEN ISSUES (must fix in this session):
  1. Bohmian mechanics gap: the irreversibility proof needs to address why
     Bohmian interpretation does NOT contradict Born-rule guarantee.
     Fix: Add a formal paragraph addressing the deterministic trajectory
     objection — show that irreversibility holds regardless of interpretation
     because the mapping destruction is a classical operation, not quantum.
  
  2. Level numbering mismatch: verify paper's L1-L10 descriptions match
     the actual implementation in crates/zipminator-anonymizer/.
     Load the code, compare, fix the paper to match code (not vice versa).
  
  3. Literature gap: PoPETs reviewers WILL ask about:
     - ARX (anonymization system), PPRL (privacy-preserving record linkage)
     - k-anonymity, l-diversity, t-closeness — how does Born-rule approach
       compare to these formal privacy guarantees?
     - Differential privacy: why is quantum randomness better than ε-DP?
  
  4. Rigetti Ankaa-3 demo (commit 3e45137): verify the claims about this
     demo are technically precise (gate counts, qubit topology, fidelities).
  
  5. UCI Adult dataset evaluation: verify the empirical results added in
     commit 4796ffc are statistically sound and the methodology is complete.
  
  LaTeX source: docs/research/paper-1-quantum-anonymization/main.tex
  Target venue: PoPETs 2026 (Privacy Enhancing Technologies Symposium)
  Format: IEEE, deadline: check https://popets.net for current CFP
  </task>

  <available_resources>
  Skills to load:
    ~/.claude/skills/quantum-peer-reviewer/     (8-specialist review)
    ~/.claude/skills/quantum-scientific-writer/ (prose)
    ~/.claude/skills/quantum-cryptanalysis-expert/ (PQC verification)
    ~/.claude/skills/quantum-topological-expert/   (Born rule physics)
    ~/.claude/skills/verification-quality/         (truth scoring)
    ~/.claude/skills/research-paper-writer/        (format compliance)
  
  Code to cross-reference:
    crates/zipminator-anonymizer/   (L1-L10 implementation)
    crates/zipminator-qrng/         (QRNG entropy source)
    tests/                          (test evidence for claims)
  </available_resources>

  <quality_target>0.80</quality_target>

HOW TO INVOKE IN CLAUDE CODE:

  cd /Users/mos/dev/qdaria/zipminator

  # Step 1: Load relevant skills
  /quantum-peer-reviewer
  /quantum-scientific-writer
  /verification-quality
  /hive-mind-advanced
  /reasoningbank-agentdb

  # Step 2: Run ÆSIR
  npx claude-flow hive-mind spawn \
    "$(cat ~/.claude/commands/workflows/aesir-paper-improve.md)" \
    --queen-model claude-opus-4-6 \
    --worker-model claude-sonnet-4-6 \
    --queen-type adaptive \
    --max-workers 8 \
    --consensus byzantine \
    --claude

═══════════════════════════════════════════════════════════════
PART 7: ZIPMINATOR LAUNCH — SEPARATE ÆSIR INSTANTIATION
═══════════════════════════════════════════════════════════════

For the launch track (TestFlight, live messaging, production backend):

  <task>
  Complete Zipminator beta launch preparation. Priority order:
  
  CRITICAL PATH (blocks public TestFlight):
  1. Apple code signing: Create App ID, distribution certificate,
     provisioning profile in Apple Developer portal.
     (Mo must do the credential steps; ÆSIR handles all technical prep)
  
  2. flutter build ipa: Once signing is set up, generate the IPA.
     Command: flutter build ipa --release --export-options-plist ExportOptions.plist
  
  3. Transporter upload + TestFlight: Upload IPA, set internal tester group.
  
  HIGH PRIORITY (enables core functionality claims):
  4. Deploy signaling server: WebSocket server for Messenger (Pillar 2).
     Dockerfile exists. Deploy to Fly.io or Railway (cheapest fast option).
  
  5. Deploy FastAPI backend: PostgreSQL + Redis via Docker Compose.
     Platform: Railway (auto-deploys from GitHub, has free tier).
  
  6. Test live message send: After deploy, send one real message from
     device A to device B. This unblocks the "live messaging" claim.
  
  MEDIUM (Polish):
  7. v1.0.0-beta.1 GitHub Release: tag + release notes
  8. App Store Connect listing: screenshots, description, privacy policy
  9. Play Store AAB: flutter build appbundle + signing key generation
  
  For each item: provide exact commands, identify what Mo must do manually
  (credential steps), and what ÆSIR can automate.
  </task>

  <available_resources>
  Skills to load:
    ~/.claude/skills/github-release-management/
    ~/.claude/skills/cicd-pipeline-generator/
    ~/.claude/skills/quantum-devops-engineer/
    ~/.claude/skills/quantum-assurance-validator/
  
  Existing files:
    app/                  (Flutter app)
    target/release/bundle (Tauri DMG already built)
    docker-compose.yml    (backend stack)
    Dockerfile*           (service containers)
  </available_resources>

  <quality_target>
  Done = TestFlight link that works + one real message sent between two devices
  </quality_target>

═══════════════════════════════════════════════════════════════
PART 8: HOW TO ORGANIZE THIS GOING FORWARD
═══════════════════════════════════════════════════════════════

The mental model: ÆSIR is not a prompt, it's a WORKFLOW FILE.

Create this structure in your project:

  zipminator/.claude/
  ├── CLAUDE.md                    ← always-loaded project context
  ├── commands/
  │   └── workflows/
  │       ├── aesir-paper-improve.md    ← ÆSIR instantiated for paper
  │       ├── aesir-launch-prep.md      ← ÆSIR instantiated for launch
  │       └── aesir-universal.md        ← this document, ÆSIR v4.0 template
  └── skills/                      ← already exists with 100+ skills

Then in Claude Code you just type:
  /workflows/aesir-paper-improve
  /workflows/aesir-launch-prep

And Claude Code loads the workflow, reads the relevant skills, boots the
ReasoningBank from prior sessions, and runs the full loop.

The CLAUDE.md should contain the living status:

  # Zipminator — Current State (auto-updated by ÆSIR)
  
  ## Paper
  Current score: 0.45 → target 0.80
  Open issues: Bohmian mechanics gap, level numbering mismatch
  Last session: [date] fixed code-paper discrepancy in L10
  ReasoningBank recommends: fix formal proofs FIRST (confidence: 0.89)
  
  ## Launch
  Blocker: Apple code signing (manual step required)
  Next automated step: flutter build ipa (after signing)
  
  ## ReasoningBank Learnings
  [date] paper improvement quantum-pqc: fix theoretical proofs before prose
  [date] zipminator codebase: cargo test --workspace before any refactor

This way every session starts informed by everything that came before.
You never explain Zipminator's state to Claude Code again — it already knows.