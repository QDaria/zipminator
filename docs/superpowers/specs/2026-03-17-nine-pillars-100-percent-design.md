# Nine Pillars → 100% Design Spec

> **For agentic workers:** This is the design spec. Implementation plan is at `docs/superpowers/plans/2026-03-17-nine-pillars-100-percent.md`.

**Goal:** Close all gaps across 9 Zipminator pillars to 100% code-complete with docker-compose integration tests.

**Definition of 100%:** Code-complete + integration tests. All logic implemented, tested, compiles. External services run in docker-compose for CI. Each pillar has integration tests that verify against real (containerized) services.

---

## Approach: Option C — Code-Complete + Integration Tests

Every gap is closed with real, testable code. External dependencies (SMTP, TURN, Ollama, ESP32 mock) run as docker-compose services. Integration test suites verify end-to-end against these containers.

## Orchestration Strategy

**Tier 3: Hive-Mind + Agent Teams + RALPH Loop**

The 9 pillars decompose into 5 independent work streams that can run in parallel agent teams:

| Stream | Pillars | Agent Type | Worktree |
|--------|---------|-----------|----------|
| A: Vault + Anonymizer | P1, P5 | Rust + Python | `feature/vault-anon-100` |
| B: Messenger + VoIP | P2, P3 | Rust + Flutter | `feature/msg-voip-100` |
| C: VPN + Browser | P4, P8 | Rust (Tauri) | `feature/vpn-browser-100` |
| D: Q-AI + Mail | P6, P7 | Rust + Docker | `feature/qai-mail-100` |
| E: Q-Mesh | P9 | Rust + Python | `feature/mesh-100` |

Each stream runs RALPH independently (max 12 iterations) with quality gates.

## Docker-Compose Integration Services

```yaml
# docker-compose.integration.yml (new file)
services:
  postgres:        # Existing — API backend
  redis:           # Existing — session cache
  greenmail:         # NEW — SMTP/IMAP mock for Pillar 7
  coturn:          # NEW — TURN/STUN server for Pillar 3
  ollama:          # NEW — Local LLM for Pillar 6
  esp32-mock:      # NEW — Mock ESP32 mesh for Pillar 9
```

## Per-Pillar Gap Closure

### Pillar 1: Quantum Vault (95% → 100%)
- **Gap**: Self-destruct UI wiring in Tauri desktop
- **Fix**: Wire `destruct_command` Tauri command to frontend `SelfDestructTimer` component
- **Test**: Integration test: create file → set timer → verify 3-pass wipe executed
- **Effort**: Low (~30 min)

### Pillar 2: PQC Messenger (75% → 100%)
- **Gap**: No message persistence, no offline queue, no group chat
- **Fix**:
  - Add `MessageStore` trait + SQLite backend (encrypted at rest via ML-KEM-768)
  - Offline message queue (store-and-forward when recipient offline)
  - Group chat: fan-out ratchet sessions per member
- **Test**: Integration test: send msg → kill connection → reconnect → verify delivery
- **Effort**: Medium (~2-3 hours)

### Pillar 3: Quantum VoIP (60% → 100%)
- **Gap**: No actual media stream encryption, no TURN/STUN, no voicemail
- **Fix**:
  - Implement PQ-SRTP frame encryptor (AES-256-GCM on RTP payloads, key from ML-KEM-768 shared secret)
  - TURN/STUN via coturn docker service
  - Voicemail: record to encrypted file when callee unavailable
- **Test**: coturn docker + integration test: establish PQ-SRTP session → verify encrypted RTP frames
- **Effort**: High (~3-4 hours)

### Pillar 4: Q-VPN (90% → 100%)
- **Gap**: Packet wrapping shortcuts, mobile VPN service
- **Fix**:
  - Replace prototype shortcuts with proper WireGuard packet encapsulation (Type + Reserved + Counter + Encrypted payload)
  - Add `VpnServiceManager` for iOS/Android (platform service stubs with real packet routing logic)
- **Test**: Integration test: handshake → tunnel data → verify decryption roundtrip
- **Effort**: Medium (~2 hours)

### Pillar 5: 10-Level Anonymizer (70% → 100%)
- **Gap**: L4-L10 graduated levels not implemented
- **Fix**:
  - L4: PQC pseudonymization (HMAC-SHA256 with QRNG key)
  - L5: Generalization (date→year, zip→region, age→range)
  - L6: Suppression (remove field entirely based on sensitivity)
  - L7: Quantum jitter (add QRNG noise to numeric fields)
  - L8: Differential privacy (Laplace mechanism, epsilon configurable)
  - L9: k-Anonymity (group records so k identical quasi-identifiers)
  - L10: Full synthetic data (statistical model replacement)
- **Test**: For each level: input DataFrame → anonymize at level N → verify transformation applied + PII not recoverable at that level
- **Effort**: High (~3-4 hours)

### Pillar 6: Q-AI Assistant (30% → 100%)
- **Gap**: No real LLM backend, no prompt injection defense, no PII scanning, no local model, no PQC tunnel
- **Fix**:
  - LLM backend: Ollama (local) + OpenAI-compatible API (remote) with PQC tunnel
  - Prompt injection defense: `PromptGuard` with 18+ injection patterns (already partially exists)
  - PII scanning: Hook `pii.rs` scanner before sending prompts to LLM
  - Local model: Ollama integration (configurable model name)
  - PQC tunnel: Route remote LLM calls through ML-KEM-768 encrypted channel
- **Docker**: Ollama service with small model (tinyllama or phi-2)
- **Test**: Integration test: prompt with PII → verify PII stripped → response returned → no injection succeeded
- **Effort**: High (~4-5 hours)

### Pillar 7: Quantum Mail (60% → 100%)
- **Gap**: No SMTP/IMAP transport, self-destruct UI-only, PII not wired
- **Fix**:
  - SMTP transport: Complete `PqcSmtpClient::send` (lettre feature already exists)
  - IMAP receive: Add `PqcImapClient` with envelope decryption on fetch
  - Server-side self-destruct: Background task that checks `SelfDestructTimer::is_expired()` and wipes
  - PII pipeline: Wire `pii.rs` scanner into email compose before encryption
- **Docker**: GreenMail (SMTP capture + IMAP mock)
- **Test**: Integration test: compose → encrypt → SMTP send to GreenMail → IMAP fetch → decrypt → verify roundtrip
- **Effort**: High (~3-4 hours)

### Pillar 8: ZipBrowser (75% → 100%)
- **Gap**: Q-AI sidebar not integrated into browser
- **Fix**:
  - Wire AI sidebar Tauri commands to browser chrome (already has `AISidebar.tsx` + `sidebar.rs`)
  - Connect sidebar to Ollama backend (same as Pillar 6)
  - Add page context extraction (`page_context.rs` already exists) → feed to LLM
  - Document system WebView limitation as architecture decision (not a gap)
- **Test**: Integration test: load page → extract context → send to AI → verify response in sidebar
- **Effort**: Medium (~2 hours)

### Pillar 9: Q-Mesh / RuView (10% → 100%)
- **Gap**: Everything — no functional code
- **Fix**:
  - Entropy bridge: `crates/zipminator-mesh/src/entropy_bridge.rs` — read QRNG pool → output 16-byte mesh keys
  - Key provisioner: `scripts/mesh_provision.py` — generate keys, write NVS format for ESP32
  - HMAC beacon auth: Implement ADR-032 beacon format (4-byte nonce + 8-byte truncated HMAC)
  - SipHash frame integrity: CSI frame MAC generation/verification
  - Key rotation: Coordinator broadcast with configurable rotation period
  - Mock ESP32: Python service that simulates mesh node behavior for testing
- **Docker**: `esp32-mock` service (Python FastAPI simulating mesh nodes)
- **Test**: Integration test: provision key → beacon auth roundtrip → frame integrity verify → key rotation
- **Effort**: High (~5-6 hours)

## Quality Gates (ALL must pass)

- `cargo test --workspace` — all Rust crates
- `micromamba activate zip-pqc && pytest tests/` — all Python tests
- `cd web && npx next build` — web builds
- `docker-compose -f docker-compose.integration.yml up -d && pytest tests/integration/` — integration suite
- `cargo clippy --workspace -- -D warnings` — no Rust warnings
- Playwright screenshots for UI changes

## Total Estimated Effort

~25-30 hours of agent work, parallelizable to ~8-10 hours wall-clock with 5 agent team streams.

---

*Spec created: 2026-03-17 | QDaria AS*
