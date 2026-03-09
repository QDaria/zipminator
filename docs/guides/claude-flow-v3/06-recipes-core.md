# 06 -- Terminal Prompt Recipes A-F (Core)

> Extracted from Section 7 of the orchestration guide (Recipes A through F).
> See also: [07-recipes-browser-email.md](07-recipes-browser-email.md) for Recipes G-I,
> [08-recipes-uiux.md](08-recipes-uiux.md) for Recipes J-L.

---

## Quick Reference: How to Start Claude Code

```bash
# Standard session
cd ~/dev/qdaria/zipminator && claude

# With agent teams enabled
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
cd ~/dev/qdaria/zipminator && claude

# Resume previous session
claude --resume

# With worktree isolation from start
claude --worktree

# Specific model (default is Opus 4.6)
claude  # uses opus by default on Max plan

# Split-pane agent teams (requires tmux)
claude --teammate-mode tmux
```

---

## Recipe A: Phase 2 Messenger Sprint (Agent Team)

```
Create an agent team to complete Zipminator Phase 2 (Quantum Secure Messenger).

Read these context files first:
- docs/guides/task.md (checklist of remaining work)
- docs/guides/architecture.md (Rust core design, NTT, entropy)
- crates/zipminator-core/src/ratchet.rs (current Double Ratchet state)
- crates/zipminator-core/src/ffi.rs (current FFI state)

Spawn 4 teammates:
1. "rust-crypto" (Sonnet): Complete ratchet.rs and ffi.rs, run cargo test
2. "native-bridge" (Sonnet): C++ JSI bridge, Swift/Kotlin modules
3. "mobile-integration" (Sonnet): PqcMessengerService.ts + SecureMessenger.tsx
4. "quality-gate" (Sonnet): Write tests BEFORE each piece lands, run full suite

Use worktree isolation for rust-crypto and native-bridge.
Require plan approval for rust-crypto before implementation.

RALPH loop: iterate until cargo test --workspace && pytest tests/ both pass.
Constraint: ML-KEM-768 for KEM, AES-256-GCM for symmetric, never log private keys.
```

---

## Recipe B: Phase 3 VoIP + Q-VPN Sprint (Agent Team)

```
Create an agent team to complete Zipminator Phase 3 (VoIP & Q-VPN).

Context files:
- docs/guides/task.md
- docs/guides/FEATURES.md (feature specs for VoIP, Q-VPN)

Spawn 4 teammates:
1. "webrtc" (Sonnet): react-native-webrtc integration, VoipService.ts
2. "pq-srtp" (Sonnet): PQ-SRTP implementation, Kyber shared secret -> SRTP keys
3. "vpn-ios" (Sonnet): iOS NetworkExtension with PQ-WireGuard
4. "vpn-android" (Sonnet): Android VpnService with PQ-WireGuard

All use worktree isolation. TDD required.
```

---

## Recipe C: Single-File Deep Work (Pair Programming)

```
Use /pair-programming mode to complete ratchet.rs.

I'll be the Navigator (design decisions), you be the Driver (implementation).

Context: Read docs/guides/architecture.md for Kyber-768 internals.
The Double Ratchet must use ML-KEM-768 for ratchet key rotation
and AES-256-GCM for message encryption.

Write failing tests first (Red), implement to pass (Green), refactor (Refactor).
Iterate until cargo test passes with all ratchet tests.
```

See [11-pair-programming.md](11-pair-programming.md) for more on pair programming mode.

---

## Recipe D: Research-Then-Build (Subagent Pattern)

```
Phase 7 (Quantum-Secure Email) needs research before coding.

Spawn 3 researcher subagents in parallel:
1. Research PQC TLS for SMTP/IMAP (Postfix + ML-KEM-768 patches)
2. Research self-destructing email protocols (timer + read-receipt patterns)
3. Research PII scanning in email compose flow (real-time regex + NER)

After research completes, create an implementation plan in docs/guides/.
Do NOT write code yet -- research only.
```

---

## Recipe E: Hive-Mind Full Campaign

```
You are the Hive Queen Coordinator for Zipminator.
Use /hive-mind-advanced to orchestrate Phases 2 and 3 completion.

Read all context:
- docs/guides/task.md (remaining work checklist)
- docs/guides/FEATURES.md (feature specifications)
- docs/guides/architecture.md (system design)
- CLAUDE.md (project conventions)

Spawn domain agents:
- DOMAIN A (PQC Security): ratchet.rs, ffi.rs, Rust tests
- DOMAIN B (Native Bridge): C++ JSI, Swift, Kotlin modules
- DOMAIN C (WebRTC & VoIP): react-native-webrtc, PQ-SRTP
- DOMAIN D (Q-VPN): iOS NetworkExtension, Android VpnService

Run RALPH loop per domain:
  Research -> Architecture -> Logic -> Polish -> Harden

Quality gates via /verification-quality:
  cargo test --workspace must pass
  pytest tests/ must pass
  No private keys in logs

Use /quantum-memory-archivist for cross-session context persistence.
```

See [09-ralph-loop.md](09-ralph-loop.md) for RALPH details, [13-quantum-skills.md](13-quantum-skills.md) for quantum skill activation.

---

## Recipe F: Code Review Swarm

```
Run a parallel code review on the Phase 2 messenger implementation.

Create an agent team with 3 reviewers:
1. "security-reviewer": Focus on crypto correctness, constant-time ops, key handling
2. "performance-reviewer": Check for unnecessary allocations, NTT bottlenecks
3. "test-reviewer": Verify test coverage, edge cases, fuzz targets

Review files: crates/zipminator-core/src/ratchet.rs, ffi.rs, and mobile/ services.
Each reviewer reports findings. Lead synthesizes into actionable issues.
```
