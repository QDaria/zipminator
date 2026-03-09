# 16 -- Project Cleanup, Verification & Companion Files

> Extracted from Sections 15, 16, and 17 of the orchestration guide.
> Run this checklist after any orchestrated session.

---

## Project Cleanup Strategy (Section 15)

### Archive Directory

Legacy files are preserved in `_archive/` (gitignored):

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
| `docs/guides/` | Commit | Developer guides |

### What Gets Gitignored

| Pattern | Reason |
|---------|--------|
| `_archive/` | Legacy files preserved locally |
| `quantum_entropy/*.bin` | Generated entropy data |
| `target/` | Rust build artifacts |
| `demo-*.png` | Playwright verification screenshots |
| `*.so`, `*.dylib` | Compiled shared libraries |

### Reducing Git Status Noise

```bash
# Stage all the deletions (files already moved to _archive/)
git add -u

# Add new source directories
git add crates/ src/zipminator/ api/ web/ tests/ scripts/ \
       .github/ .claude/ Cargo.toml Cargo.lock pyproject.toml \
       docs/guides/ demo/ config/

# Commit the restructure
git commit -m "chore: archive legacy docs/compliance/benchmarks, restructure repo"
```

---

## Verification Checklist (Section 16)

After any orchestrated session, verify:

- [ ] `cargo test --workspace` passes
- [ ] `pytest tests/` passes
- [ ] Demo starts: `bash demo/run.sh`
- [ ] `GET http://localhost:5001/api/quantum/status` shows pool size > 0
- [ ] `POST http://localhost:5001/api/quantum/generate` returns entropy
- [ ] Kyber round-trip works: keygen -> encrypt -> decrypt
- [ ] `python scripts/qrng_harvester.py` shows Marrakesh->Fez fallback logic
- [ ] No references to "ruflo" in codebase
- [ ] No private keys in any log output
- [ ] `.gitignore` covers `_archive/`, `target/`, `*.so`, `demo-*.png`

---

## Companion Files Reference (Section 17)

All files in `docs/guides/` and their purpose:

| File | Purpose | Feed To |
|------|---------|---------|
| **claude-flow-orchestration.md** | Monolith reference (this guide is the split version). | You (human operator) |
| **claude-flow-v3/** | This directory. Split guide with focused files. | You (human operator) |
| **task.md** | Phase-by-phase checklist with checkbox status | Agent team leads, RALPH loops |
| **FEATURES.md** | Complete feature specs for all 8 pillars | Coder agents, researchers |
| **implementation_plan.md** | Vision document with competitive analysis and roadmap | Lead agents, planners |
| **architecture.md** | Rust core internals, NTT, entropy pool, PyO3, security model | Coder agents working on crypto |
| **api-reference.md** | FastAPI endpoint contracts, auth, request/response schemas | Backend coder agents |
| **getting-started.md** | Build commands, SDK usage, CLI quickstart, troubleshooting | New session bootstrapping |
| **deployment.md** | Docker, Kubernetes, Helm charts, env vars, production hardening | DevOps agents |
| **investor-overview.md** | Business case, market, moat, roadmap (not used by agents) | Humans only |

### How to Feed Context Files to Agents

In your prompt, reference them explicitly:

```
Read these files for context:
- docs/guides/task.md (what's done and remaining)
- docs/guides/architecture.md (system design constraints)
- docs/guides/FEATURES.md (feature specifications)
```

Claude Code reads them into context automatically. For agent teams, include the paths in each teammate's spawn prompt so they load the right context independently.
