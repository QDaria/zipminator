# Zipminator × Claude Code v2.1.71+: Advanced Multi-Agent Orchestration & RALPH Loop Guide

> **Purpose:** A highly complex, consolidated master guide for utilizing Claude Code (v2.1.4–v2.1.71+) with `ruflo` v3 parallel orchestration, RALPH loops, ReasoningBank continuous learning, agent teams, and quantum skills to complete the remaining phases of the Zipminator Post-Quantum Cryptography Super-App.

---

## 1. The Core Files & Their Orchestration Strategy

You recently synchronized three critical project artifacts into your `docs/guides/` folder. These files are the "Brain" of your hive-mind session.

1. **`docs/guides/implementation_plan.md`**: Your high-level architectural roadmap. Agent Teams use this to understand *what* the system should look like (Phases 7 & 8 added).
2. **`docs/guides/task.md`**: The granular, stateful checklist. The `quantum-execution-manager` skill relies on this to assign sub-tasks to parallel agents.
3. **`docs/guides/FEATURES.md`**: The source of truth for product capabilities. The `reviewer` and `tester` agents use this to ensure developed features meet the declared competitive positioning (e.g., real quantum entropy vs hybrid).

**How to Use Them Together:**  
When initiating Claude Code, you will bind these files into the context window. Your prompt will instruct the top-level **Hive Queen** to distribute sub-sections of `task.md` to worker agents, verifying their architectural compliance against `implementation_plan.md`.

---

## 2. Claude Code v2.1.63+ Superpowers & Concepts

Recent changelogs (v2.1.4 → v2.1.63) have introduced powerful features that change how we deploy Claude Code:

- **Agent Teams & Parallelization:** Claude Code can now spawn sub-agents that run parallel tasks (e.g., Domain A: Rust core, Domain B: C++ JSI bridge).
- **ReasoningBank & Continuous Learning (RL):** The system builds a persistent neural pattern of failures and successes. Using `agentic-jujutsu` and `reasoningbank-intelligence`, the agent avoids repeating identical compilation errors and optimizes code generation over time.
- **Pair Programming Mode (`Driver`/`Navigator`):** Intelligent context switching. The Navigator maps the architecture, while the Driver writes the boilerplate and tests in a tight Red-Green-Refactor loop.
- **Quantum Skills:** Deeply specialized personas (`quantum-circuit-architect`, `quantum-cryptanalysis-expert`, etc.) activated dynamically via MCP.
- **RALPH Loop (Read, Analyze, Loop, Prompt, Halt):** An autonomous execution constraint where the agent runs tests, analyzes output, self-corrects, and loops until `cargo test` and `pytest` pass with 0.995+ truth scores.

---

## 3. The Hive-Mind Configuration

To accomplish Phases 2, 3, 7, and 8, you will use a **Hierarchical Mesh Topology**:

1. **`quantum-hive-queen` (Top Node):** Receives your initial terminal prompt. Reads `implementation_plan.md` and `task.md`.
2. **`pair-programming` Swarm:** Deployed for frontend (React Native / Next.js) and native bridges (Swift/Kotlin).
3. **`sparc-methodology` TDD Nodes:** Deployed for Rust crypto core (`crates/zipminator-core`).
4. **`quantum-cryptanalysis-expert` Validator:** Ensures ML-KEM-768 and PQ-WireGuard implementations have no side-channel or cryptographic downgrade vulnerabilities.
5. **`reasoningbank-agentdb`:** Ingests the logs of every failed build to train the local RL model for future sub-agents.

---

## 4. How to Prompt `claude-code` from the Terminal

Below is the definitive **Master Prompt Workflow** to execute in your terminal. This triggers the RALPH Loop and parallel orchestration.

### Step A: Start the Session with Context

Run this exact command from the Zipminator root directory. It explicitly feeds the three crucial files into Claude Code's context immediately.

```bash
claude -p "docs/guides/FEATURES.md" -p "docs/guides/implementation_plan.md" -p "docs/guides/task.md"
```

### Step B: Paste the Master Orchestration Prompt

Once inside the interactive `claude` prompt, paste the following complex coordination command:

```text
/clear
You are the **Quantum Hive Queen**, operating under Claude Code v2.1.63+. We are using a Hierarchical Mesh Topology with the RALPH continuous learning loop and ReasoningBank.

Your objective is to advance **Phase 2 (PQC Messenger)**, **Phase 3 (Q-VPN/VoIP)**, and begin foundational work on **Phase 7 (Email)** as defined in `docs/guides/task.md`.

### Execution Directives

1. **Information Synthesis:** Ingest `docs/guides/implementation_plan.md` (for architecture) and `docs/guides/FEATURES.md` (for product capabilities). 
2. **Parallel Team Deployment:** Spawn three conceptual sub-agent teams:
   - **Team Alpha (Native Bridge & Rust):** Navigate to `crates/zipminator-core` and mobile native directories. Use the `pair-programming` and `sparc-methodology` skills. Focus: PQC Double Ratchet C++ JSI integration.
   - **Team Beta (WebRTC & Network):** Focus on PQ-WireGuard and PQ-SRTP integration. Use `quantum-cryptanalysis-expert` to review Kyber handshake implementations.
   - **Team Gamma (Infrastructure):** Begin scaffolding the Phase 7 PQC SMTP/IMAP backend services and directory structures.
3. **RALPH Loop Enforcement:** 
   - Write unit tests first (TDD).
   - Execute tests using the terminal.
   - If tests fail, send the error trace to ReasoningBank, adapt the approach using RL loop parameters, and rewrite.
   - Do not request human intervention until Truth Score > 0.995 or all assigned `task.md` checkboxes in the current sprint are complete.
4. **Quantum Alignment:** Ensure all new cryptographic pipelines properly ingest entropy from `scripts/qrng_harvester.py` and `quantum_entropy_pool.bin`.

### Output Constraints
- Keep dialogue minimal. Use the `task_boundary` tool properly to reflect granular task progress.
- Prefix your terminal operations with "[Hive-Mind Task: <Team>]" so I can track parallel execution.
- Begin execution on the first unchecked item in `docs/guides/task.md`.
```

---

## 5. Other Key Files in `docs/guides/`

While the core three files are your primary context, Claude Code will seamlessly reference these other files in `docs/guides/` during parallel execution:

- **`api-reference.md`**: Team Gamma will use this when building the Phase 7 `/api/email/*` endpoints to ensure consistency with existing REST patterns.
- **`architecture.md`**: The `reviewer` agents use this to ensure the new Chromium fork or Tauri desktop wrapper (Phase 8) complies with the defined IPC mechanisms.
- **`getting-started.md` & `deployment.md`**: Used by the `production-validator` skill at the end of the RALPH loop to ensure new features haven't broken the local dev setup or GitHub Actions CI/CD pipelines.

## 6. Continuous Learning & RL Verification

As Claude Code v2.1.63 interacts with the environment, it uses **ReasoningBank** to build context.
If Team Alpha encounters a PyO3 memory lifecycle error compiling Rust bindings:

1. It reads the compiler error.
2. Formulates a pattern.
3. Caches it.
4. When Team Beta starts working on C++ JSI bindings, it will *anticipate* memory lifecycle errors across the FFI boundary because the underlying RL model has updated its immediate context loop.

**Your Role:** Sit back, monitor the terminal, and only intervene when the Hive Queen hits a critical roadblock or asks for architectural consensus on Phase 7/8 design decisions.
