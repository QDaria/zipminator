# 19 -- Product Completeness Execution Prompts

> Parallelized agent team recipes for the 7 medium-priority product completeness items.
> These are larger tasks, each needing a dedicated RALPH session.
>
> **Dependency graph**:
>
> ```
> PARALLEL TRACK C (fully independent):
>   ├── Recipe S: Q-AI real LLM backend (crates/ + api/)
>   ├── Recipe T: Anonymizer L4-L10 (src/zipminator/)
>   ├── Recipe V: Messenger persistence (crates/ + api/)
>   └── Recipe W: ZipBrowser AI sidebar (browser/)
>
> SEQUENTIAL TRACK D:
>   Recipe U: Email SMTP/IMAP deploy ──→ (needs Docker infra)
>
> TRACK E (needs VPN + AI done first):
>   Recipe X: VoIP media encryption (depends on nothing, but lower priority)
>
> TRACK F (research-first):
>   Recipe Y: Q-Mesh RuView integration (external repo, needs architecture)
> ```

---

## Recipe S: Q-AI Real LLM Backend (Pillar 6)

**Tier**: Agent team (2 teammates)
**Time**: 2-3 hours
**Model**: Opus (crypto tunnel) + Sonnet (integration)
**Current state**: Stub-only backend; returns placeholder responses

```
Complete Pillar 6 (Q-AI Assistant) with a real LLM backend.

CONTEXT FILES:
- docs/guides/FEATURES.md (Pillar 6 section)
- browser/src-tauri/src/ai/ (Rust AI module stubs)
- api/src/routes/ (existing API routes)
- src/zipminator/crypto/pqc.py (PQC encryption for tunneled requests)

ARCHITECTURE DECISION (pre-approved):
- Local-first via Ollama (privacy-preserving, no data leaves device)
- Fallback: PQC-tunneled API to cloud LLM (ML-KEM-768 encrypted channel)
- Prompt injection defense: filter input patterns before LLM

SPAWN 2 teammates:

Teammate 1: "ollama-backend" (Sonnet)
  1. Check if Ollama is installed: `ollama --version`
  2. Create api/src/services/llm_service.py:
     - OllamaClient: connect to localhost:11434
     - Model selection: llama3.2, mistral, phi-3
     - Streaming responses
     - Prompt guard: reject injection patterns (18 patterns from FEATURES.md)
  3. Create api/src/routes/ai.py:
     - POST /api/ai/chat (stream=true/false)
     - POST /api/ai/summarize (page content -> summary)
     - GET /api/ai/models (list available local models)
  4. Write tests FIRST: tests/api/test_ai_routes.py
  5. RALPH loop until tests pass

Teammate 2: "pqc-tunnel" (Opus, worktree)
  1. Create src/zipminator/ai/pqc_tunnel.py:
     - Encrypt prompt with ML-KEM-768 before sending to remote LLM API
     - Decrypt response
     - Use existing keypair()/encapsulate()/decapsulate() from crypto core
  2. Create src/zipminator/ai/prompt_guard.py:
     - 18 injection patterns (system prompt override, role hijack, etc.)
     - PII scanning before send (reuse existing PII scanner)
  3. Write tests FIRST: tests/ai/test_pqc_tunnel.py, tests/ai/test_prompt_guard.py
  4. Constant-time verification for crypto ops (ultrathink)

QUALITY GATES:
- [ ] cargo test --workspace
- [ ] pytest tests/ai/ passes
- [ ] Ollama responds to test prompt (if installed)
- [ ] Prompt guard rejects all 18 injection patterns
- [ ] No private keys logged
```

---

## Recipe T: Anonymizer L4-L10 Implementation (Pillar 5)

**Tier**: Agent team (3 teammates)
**Time**: 3-4 hours
**Model**: Opus (crypto levels) + Sonnet (implementation)
**Current state**: Binary PII detection only. L4-L10 described but not implemented as selectable tiers.

```
Implement the graduated 10-level anonymization system in Python.

CONTEXT FILES:
- docs/guides/FEATURES.md (Pillar 5 — the 10 levels spec)
- src/zipminator/anonymizer.py (current engine)
- src/zipminator/crypto/anonymization.py (existing crypto-based anonymization)
- src/zipminator/crypto/pii_scanner.py (PII detection)
- src/zipminator/crypto/patterns/ (15-country patterns)
- tests/ (existing anonymizer tests)

THE 10 LEVELS (from FEATURES.md):
L1: Regex masking (SSN → ***-**-1234)
L2: SHA-3 deterministic hashing
L3: SHA-3 with PQC-derived salt
L4: Tokenization (reversible mapping, secure local store)
L5: K-Anonymity (generalize quasi-identifiers until k=5)
L6: L-Diversity (ensure l-diverse sensitive attributes)
L7: Quantum noise jitter (numerical perturbation using QRNG)
L8: Differential privacy (epsilon-delta, Laplace mechanism, QRNG noise)
L9: K-Anonymity + Differential privacy combined
L10: Quantum anonymization (irreversible OTP mapping from QRNG)

SPAWN 3 teammates:

Teammate 1: "levels-1-6" (Sonnet)
  Implement L1-L6 as selectable tiers in src/zipminator/anonymizer.py
  Each level must be independently callable: anonymizer.apply(data, level=4)
  L1-L3: enhance existing regex/hash code
  L4: New tokenization engine with reversible mapping
  L5-L6: K-anonymity and L-diversity (use pandas DataFrames)
  Tests first: tests/anonymizer/test_levels_1_6.py

Teammate 2: "levels-7-10" (Opus, worktree)
  Implement L7-L10 with QRNG integration
  L7: Numerical jitter using entropy pool bytes
  L8: Laplace mechanism with epsilon parameter, QRNG for noise
  L9: Combined K-anon + DP
  L10: OTP mapping where pad comes from quantum_entropy_pool.bin
  Tests first: tests/anonymizer/test_levels_7_10.py
  CRITICAL: L7-L10 must use PoolProvider for entropy, OS fallback if pool empty

Teammate 3: "integration" (Sonnet)
  Wire all 10 levels into a unified API:
  - anonymizer.apply(df, level=N) for each N in 1-10
  - CLI: `zipminator anonymize --level 7 input.csv output.csv`
  - Update API endpoint: api/src/routes/anonymize.py
  - Cross-level integration tests: apply L1 then L7, verify composition
  Tests: tests/anonymizer/test_integration.py

QUALITY GATES:
- [ ] pytest tests/anonymizer/ all pass
- [ ] Each level produces different output from the level below
- [ ] L7-L10 fallback to OS entropy if pool empty (no crash)
- [ ] L5 achieves k=5 on test dataset
- [ ] L8 epsilon parameter works (epsilon=0.1 adds more noise than epsilon=1.0)
```

---

## Recipe U: Email SMTP/IMAP Deployment (Pillar 7)

**Tier**: Hive-mind (3 domain leads)
**Time**: 4-6 hours
**Model**: Opus (crypto transport) + Sonnet (infra)
**Current state**: Crypto envelope works; no transport deployed

```
Deploy PQC-secured email transport for @zipminator.zip.

CONTEXT FILES:
- docs/guides/FEATURES.md (Pillar 7)
- docs/guides/phase7-quantum-email-plan.md (detailed plan)
- email/ directory (existing transport, keydir, KMS code)
- email/mailserver/config/ (Postfix/Dovecot configs)
- crates/zipminator-core/src/email_crypto.rs (Rust envelope crypto)
- docker-compose.yml (existing Docker setup)

This is the most complex remaining task. Use /hive-mind-advanced.

DOMAIN LEAD 1: "mail-server" (Sonnet)
  - Get Postfix + Dovecot running in Docker
  - Wire PQC TLS (ML-KEM-768) for SMTP STARTTLS
  - Configure @zipminator.zip MX records (verify DNS)
  - Test: send email localhost -> localhost, verify delivery

DOMAIN LEAD 2: "pqc-bridge" (Opus)
  - Wire email/transport/pqc_bridge.py to use Rust email_crypto
  - Encrypt messages at rest with ML-KEM-768 envelope
  - Implement self-destruct timer (server-side enforcement, not just UI)
  - Wire PII scanner into compose pipeline

DOMAIN LEAD 3: "integration-test" (Sonnet)
  - End-to-end test: compose -> PII scan -> encrypt -> SMTP -> IMAP -> decrypt -> read
  - Docker-based integration test (GreenMail or real Postfix)
  - Verify self-destruct timer works

QUALITY GATES:
- [ ] Docker mail stack starts without errors
- [ ] Send/receive roundtrip works
- [ ] PQC envelope encrypt/decrypt roundtrip in transport
- [ ] Self-destruct enforced server-side
- [ ] PII scanner triggers on sensitive content
```

---

## Recipe V: Messenger Persistence (Pillar 2)

**Tier**: Agent team (2 teammates)
**Time**: 2-3 hours
**Model**: Sonnet
**Current state**: Messages exist only in-session; no offline queue

```
Add message persistence and offline queue to PQC Messenger.

CONTEXT FILES:
- docs/guides/FEATURES.md (Pillar 2)
- crates/zipminator-core/src/ratchet/ (Double Ratchet state)
- src/zipminator/messenger/signaling.py (WebSocket signaling)
- api/src/db/ (existing DB models)

SPAWN 2 teammates:

Teammate 1: "message-store" (Sonnet)
  - Create api/src/db/message_store.py:
    - Store encrypted messages (ciphertext, not plaintext)
    - Per-conversation message history
    - Offline queue: store messages for offline recipients
    - TTL-based cleanup (messages expire after configurable period)
  - PostgreSQL schema for messages table
  - Tests: tests/messenger/test_message_store.py

Teammate 2: "offline-queue" (Sonnet)
  - Create src/zipminator/messenger/offline_queue.py:
    - Queue messages when recipient offline
    - Deliver queued messages on reconnect
    - Group chat fanout (already partially in FEATURES.md)
  - Wire into signaling.py WebSocket handler
  - Tests: tests/messenger/test_offline_queue.py

QUALITY GATES:
- [ ] Messages survive server restart
- [ ] Offline recipient gets queued messages on reconnect
- [ ] Messages stored as ciphertext only (never plaintext in DB)
- [ ] TTL cleanup works
```

---

## Recipe W: ZipBrowser AI Sidebar Integration (Pillar 8)

**Tier**: Single session + pair programming
**Time**: 2-3 hours
**Model**: Sonnet
**Current state**: AI sidebar registered but not integrated into browser

```
Integrate Q-AI Assistant sidebar into ZipBrowser.

CONTEXT FILES:
- docs/guides/FEATURES.md (Pillar 8)
- browser/src-tauri/src/ai/ (Rust AI module)
- browser/src/components/AISidebar.tsx (existing UI component)
- browser/src/hooks/useAI.ts (existing hook)

Use /pair-programming mode. I'll navigate, you drive.

STEPS:
1. Wire AISidebar.tsx into browser/src/App.tsx layout
2. Connect useAI.ts hook to Tauri commands (invoke Rust AI backend)
3. Implement page summarization:
   - Get current page HTML via Tauri
   - Send to local Ollama (or stub if not installed)
   - Display summary in sidebar
4. Implement writing assist:
   - User selects text on page
   - AI rewrites/summarizes/translates
5. Add sidebar toggle (keyboard shortcut: Cmd+Shift+A)

RALPH loop until:
- [ ] Sidebar opens/closes with Cmd+Shift+A
- [ ] Page content can be summarized (even if stub response)
- [ ] browser/src-tauri tests still pass (cargo test)
```

---

## Recipe X: VoIP Media Encryption (Pillar 3)

**Tier**: Pair programming (Opus)
**Time**: 3-4 hours
**Model**: Opus (crypto-critical)
**Current state**: Key derivation works; no actual SRTP frame encryption

```
Implement actual PQ-SRTP frame encryption for VoIP.

CONTEXT FILES:
- docs/guides/FEATURES.md (Pillar 3)
- docs/guides/architecture.md (SRTP key derivation)
- crates/zipminator-core/src/srtp.rs (existing key derivation)

Use ultrathink. This is crypto-critical code.

STEPS:
1. Read srtp.rs current state
2. Implement SRTP frame encrypt/decrypt:
   - Use derived SRTP master key from ML-KEM-768 shared secret
   - AES-256-GCM for SRTP payload encryption
   - HMAC-SHA-256 for SRTP authentication tag
   - Proper SRTP packet format (RFC 3711)
3. Wire into VoIP service:
   - Encrypt outgoing audio frames before WebRTC send
   - Decrypt incoming frames after WebRTC receive
4. Add voicemail encryption (encrypt recorded messages at rest)
5. Tests: cargo test for srtp module

QUALITY GATES:
- [ ] cargo test --workspace passes
- [ ] Constant-time crypto operations verified
- [ ] SRTP encrypt/decrypt roundtrip produces original audio bytes
- [ ] No private keys in logs
```

---

## Recipe Y: Q-Mesh RuView Integration (Pillar 9)

**Tier**: Research-first (subagent), then pair programming
**Time**: 4-6 hours
**Model**: Opus
**Current state**: Skeleton only; no functional code

```
Integrate Zipminator QRNG with RuView mesh security.

This is the most research-heavy task. Start with research, then implement.

PHASE 1 — RESEARCH (spawn researcher subagent):
  - Read https://github.com/MoHoushmand/RuView ADR-032 spec
  - Read crates/zipminator-mesh/src/lib.rs (current skeleton)
  - Read crates/zipminator-core/src/qrng/ (entropy sources)
  - Understand: How does RuView currently generate mesh keys?
  - Understand: What's the interface for providing external entropy?
  - Write findings to docs/guides/phase9b-qmesh-research.md

PHASE 2 — IMPLEMENTATION (pair programming, Opus):
  1. Complete crates/zipminator-mesh/ entropy bridge:
     - Read 16 bytes from quantum_entropy_pool.bin
     - Derive mesh key via HKDF-SHA256
     - Output format compatible with RuView NVS key storage
  2. Create scripts/provision_qrng.py:
     - Extends RuView provision.py with --qrng-source flag
     - Reads QRNG-derived mesh key and provisions to ESP32-S3 nodes
  3. Integration test:
     - Generate quantum mesh key
     - Verify HMAC-SHA256 beacon auth with that key
     - Verify SipHash-2-4 frame integrity with derived key

QUALITY GATES:
- [ ] cargo test for zipminator-mesh passes
- [ ] Entropy bridge reads from pool and produces valid 16-byte key
- [ ] HKDF derivation matches expected test vector
- [ ] Beacon auth HMAC verifies with QRNG-derived key
```
