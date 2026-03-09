# 05 -- Skills & Agents Reference

> Extracted from Section 6 of the orchestration guide.
> See also: [13-quantum-skills.md](13-quantum-skills.md) for quantum skill activation patterns.

---

## Skills for Zipminator Development

| Skill | When to Use | Invoke |
|-------|-------------|--------|
| `hive-mind-advanced` | Multi-agent queen-led orchestration with consensus | `/hive-mind-advanced` |
| `pair-programming` | Navigator/Driver TDD, one writes tests the other implements | `/pair-programming` |
| `sparc-methodology` | SPARC TDD workflow (Specification -> Architecture -> Refinement) | `/sparc-methodology` |
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

## BMAD Workflows (`.claude/commands/bmad/bmm/`)

| Workflow | Purpose | Agent Persona |
|----------|---------|---------------|
| `create-ux-design.md` | Collaborative UX pattern planning, look-and-feel sessions | `ux-designer` |
| `create-excalidraw-wireframe.md` | UI wireframing with Excalidraw notation | `ux-designer` |
| `create-prd.md` | Product requirements document | `pm` / `analyst` |
| `create-story.md` | User story creation with acceptance criteria | `pm` |
| `code-review.md` | Structured code review workflow | `dev` / `tea` |
| `dev-story.md` | Story implementation with TDD gates | `dev` |

## Agent Definitions (`.claude/agents/`)

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
