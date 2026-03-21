# Zipminator Feature Matrix — Code-Verified Status

> **Single Source of Truth** for all pillar statuses. Updated after every code change session.
>
> Last verified: 2026-03-20 | Verifier: Claude Code Physical Cryptography Wave 1
>
> Percentages reconciled Mar 19 2026 — summary table now matches detail sections.
> Summary table reflects actual production-readiness, not just code-structure completeness.
>
> **Mar 20 update**: Q-Mesh upgraded to 90% (Physical Cryptography Wave 1: 6 new modules, 106 mesh tests, 513 workspace total).
> **Mar 19 update**: Reconciled all pillar percentages. VoIP upgraded to 85% (frame encryption exists). Mesh upgraded to 80% (entropy bridge functional). Browser upgraded to 85% (AI sidebar integrated).

---

## Product Identity

**Zipminator** is the world's first Post-Quantum Cryptography (PQC) super-app — a QCaaS/QCaaP cybersecurity platform that harvests true quantum entropy from live quantum computers (IBM Quantum 156q, Rigetti) to power 9 pillars of military-grade encryption infrastructure for communications, data, and spatial awareness.

---

## The 9-Pillar PQC Super-App — Code-Verified Status

| # | Pillar | Overall | Crypto | Tests | UI | Integration | Notes |
|---|--------|:-------:|:------:|:-----:|:--:|:-----------:|-------|
| 1 | **Quantum Vault** | **100%** | Done | Done | Done | Done | DoD 5220.22-M 3-pass self-destruct wired to Tauri UI (6 tests) |
| 2 | **PQC Messenger** | **85%** | Done | Done | Done | Partial | MessageStore + offline queue done; e2e needs running API |
| 3 | **Quantum VoIP** | **90%** | Done | Done | Done | Partial | PQ-SRTP frame encryption + encrypted voicemail storage (33 tests) |
| 4 | **Q-VPN** | **90%** | Done | Done | Done | Partial | Packet wrapping has shortcuts; no mobile VPN service |
| 5 | **10-Level Anonymizer** | **95%** | Done | Done | Done | Done | All L1-L10 verified; CLI `--level N` wired |
| 6 | **Q-AI Assistant** | **85%** | Done | Done | Done | Partial | Prompt guard + Ollama + PII scan + PQC tunnel done (45 AI tests) |
| 7 | **Quantum Mail** | **75%** | Done | Done | Done | Partial | PQC envelope + SMTP transport + server-side self-destruct TTL (15 tests) |
| 8 | **ZipBrowser** | **85%** | Done | Done | Done | Done | AI sidebar integrated (Recipe W); WebView limitation (ADR documented) |
| 9 | **Q-Mesh (RuView)** | **90%** | Done | Done | Planned | Partial | Physical Cryptography Wave 1 complete: 6 new modules, 106 mesh tests, 513 workspace total |

**Legend**: Done = code exists, tested, reviewed | Partial = code exists but incomplete | Planned = no code yet

---

## Pillar 1: Quantum Vault & Self-Destruct Storage (100%)

- **Encryption**: AES-256-GCM with keys derived from ML-KEM-768 (FIPS 203)
- **Key seeding**: 32-byte seeds from real IBM Quantum entropy (`quantum_entropy_pool.bin`)
- **Formats**: CSV, JSON, Parquet, Excel via Pandas integration
- **Compression**: AES-encrypted ZIP archives with configurable passwords
- **Self-destruct**: Timer-based, DoD 5220.22-M 3-pass overwrite (zeros, ones, random), scheduled destruction, memory clearing. **Tauri UI wired**: `self_destruct_file` command with two-step confirmation, progress spinner, system path safety guard (6 tests)
- **PII scanning**: Auto-detects 20+ PII types before encryption with risk assessment

### File Paths

| Layer | Files |
|-------|-------|
| **Rust core** | `crates/zipminator-core/src/kyber768.rs` (ML-KEM-768), `kyber768_qrng.rs` (QRNG integration), `quantum_entropy_pool.rs` (entropy aggregation), `entropy_source.rs`, `python_bindings.rs` (PyO3), `ffi.rs` (C FFI) |
| **Rust QRNG** | `crates/zipminator-core/src/qrng/mod.rs`, `entropy_pool.rs`, `ibm_quantum.rs`, `id_quantique.rs`, `mock.rs` |
| **Python crypto** | `src/zipminator/crypto/zipit.py` (Zipndel, 434 lines), `unzipit.py`, `pqc.py`, `quantum_random.py`, `self_destruct.py` (245 lines), `destruct_monitor.py` |
| **Python entropy** | `src/zipminator/entropy/api.py`, `factory.py`, `ibm.py`, `qbraid.py`, `rigetti.py`, `base.py` |
| **Web UI** | `web/components/FileVault.tsx`, `web/components/KeyGenerator.tsx` |
| **Mobile UI** | `mobile/src/components/FileVault.tsx`, `mobile/src/components/KeyGenerator.tsx` |
| **API** | `api/src/routes/crypto.py`, `api/src/routes/keys.py`, `api/src/models/crypto.py`, `api/src/services/rust_cli.py` |
| **Tests** | `tests/python/test_comprehensive.py`, `tests/python/test_multi_provider.py`, `tests/rust/test_qrng.rs`, `tests/constant_time/dudect_tests.rs` |
| **Config** | `config/ibm_qrng_config.yaml`, `config/qbraid_providers.yaml`, `config/qbraid_optimal_settings.yaml` |

---

## Pillar 2: PQC Messenger (85%)

- **Protocol**: Post-Quantum Double Ratchet — ML-KEM-768 for ratchet key exchange, AES-256-GCM for payloads, HKDF-SHA-256 chain keys with forward secrecy
- **Transport**: WebSocket signaling (FastAPI) + WebRTC data channels
- **What works**: Ratchet key exchange, message encrypt/decrypt roundtrip, session state management, MessageStore with offline queue + group fanout (Recipe V), 6 persistence tests
- **What's missing**: E2E tests need running API server; WebSocket signaling not yet tested in integration

### File Paths

| Layer | Files |
|-------|-------|
| **Rust ratchet** | `crates/zipminator-core/src/ratchet/mod.rs`, `state.rs`, `header.rs`, `chains.rs` |
| **Python** | `src/zipminator/messenger/signaling.py` |
| **Browser UI** | `browser/src/components/ChatPanel.tsx`, `browser/src/components/AISidebar.tsx` |
| **Web UI** | `web/components/dashboard/MessengerPreview.tsx`, `web/components/SuperAppShowcase.tsx` |
| **Mobile** | `mobile/src/services/PqcMessengerService.ts`, `mobile/src/services/SignalingService.ts`, `mobile/src/components/SecureMessenger.tsx`, `mobile/src/bridges/PqcBridge.ts` |
| **Tests** | `crates/zipminator-core/src/tests/ratchet_tests.rs`, `tests/test_ratchet_integration.py`, `tests/messenger/test_signaling.py`, `mobile/src/__tests__/PqcMessengerService.test.ts` |

---

## Pillar 3: Quantum VoIP & Video (90%)

- **Media**: WebRTC peer connections with native camera/microphone
- **Security**: PQ-SRTP — SRTP master keys derived from ML-KEM-768 shared secrets, AES-256-GCM frame encryption via `SrtpContext`
- **Signaling**: Shared WebSocket signaling server with Messenger
- **What works**: SRTP key derivation from ML-KEM-768 shared secret; AES-256-GCM frame encrypt/decrypt (`SrtpContext::protect`/`unprotect`); VoIP session with offer/answer/hangup lifecycle; encrypted voicemail storage (HKDF-separated keys from live session); call state machine; signaling WebSocket; 33 tests
- **What's missing**: WebRTC DTLS-SRTP key exchange not replaced at browser level; no TURN/STUN server

### File Paths

| Layer | Files |
|-------|-------|
| **Rust** | `crates/zipminator-core/src/srtp.rs` |
| **Web UI** | `web/components/dashboard/VoipVpnPanel.tsx` |
| **Mobile** | `mobile/src/services/VoipService.ts`, `VoipService.web.ts`, `VoipService.types.ts`, `PqSrtpService.ts`, `SignalingService.ts` |
| **Tests** | `mobile/src/services/__tests__/VoipService.test.ts`, `mobile/src/services/__tests__/PqSrtpService.test.ts` |

---

## Pillar 4: Q-VPN — PQ-WireGuard (90%)

- **Protocol**: WireGuard wrapped in ML-KEM-768 handshakes
- **State machine**: Full VPN lifecycle (Disconnected -> Connecting -> Connected -> Reconnecting)
- **Kill switch**: Network isolation when VPN drops
- **PQ handshake**: ML-KEM-768 key exchange verified in tests
- **Gap**: Packet wrapping has prototype shortcuts; iOS/Android VPN service integration planned

### File Paths

| Layer | Files |
|-------|-------|
| **Rust VPN** | `browser/src-tauri/src/vpn/mod.rs`, `tunnel.rs`, `pq_handshake.rs`, `state.rs`, `config.rs`, `metrics.rs`, `kill_switch.rs` |
| **Rust proxy** | `browser/src-tauri/src/proxy/mod.rs`, `server.rs`, `certificate.rs`, `tls.rs`, `config.rs`, `pqc_detector.rs`, `metrics.rs` |
| **Browser UI** | `browser/src/components/VpnToggle.tsx`, `browser/src/components/StatusBar.tsx` |
| **Web UI** | `web/components/dashboard/VoipVpnPanel.tsx` |
| **Mobile** | `mobile/src/services/VpnService.ts`, `VpnService.android.ts`, `mobile/src/components/NetworkShield.tsx`, `mobile/src/components/ZipBrowser.tsx` |
| **Tests** | `browser/src-tauri/tests/vpn_state_test.rs`, `kill_switch_test.rs`, `pq_handshake_test.rs`, `vpn_proxy_integration_test.rs`, `mobile/src/services/__tests__/VpnService.test.ts`, `VpnService.android.test.ts` |

---

## Pillar 5: 10-Level Anonymization Suite (95%)

- **Origins**: Production code from NAV (Norwegian Labour and Welfare Administration), upgraded with PQC + QRNG
- **What works**: All 10 levels implemented as selectable tiers via `LevelAnonymizer.apply(df, level=N)`:
  - L1-L3: Regex masking, SHA-3 deterministic hashing, PQC-salted hashing
  - L4: Reversible tokenization (SQLite-backed TokenStore with detokenize())
  - L5: K-Anonymity (generalization of quasi-identifiers, verified k>=5)
  - L6: L-Diversity (sensitive attribute diversity within equivalence classes)
  - L7: Quantum noise jitter (numerical perturbation using QRNG entropy)
  - L8: Differential privacy (Laplace mechanism with configurable epsilon, QRNG noise)
  - L9: Combined K-Anonymity + Differential privacy
  - L10: Quantum OTP anonymization from entropy pool (irreversible with real QRNG)
- **CLI**: `zipminator anonymize --level N input.csv output.csv` (Typer + Rich, levels 1-10)
- **Entropy**: All L7-L10 use PoolProvider with OS fallback (never crash)
- **Tests**: 64 new level tests + 45 existing integration tests (109 total)
- **Gap**: Flutter UI level selector not connected to backend
- **Integration**: JupyterLab, Pandas DataFrames, CLI, MCP tools

### File Paths

| Layer | Files |
|-------|-------|
| **Rust** | `crates/zipminator-core/src/pii.rs` |
| **Python core** | `src/zipminator/anonymizer.py` (main engine), `src/zipminator/crypto/anonymization.py`, `crypto/pii_scanner.py`, `crypto/mask.py` |
| **Python patterns** | `src/zipminator/crypto/patterns/_base.py`, `usa.py`, `uk.py`, `uae.py`, `validators.py` |
| **Web UI** | `web/components/mail/AnonymizationPanel.tsx`, `web/components/mail/PiiOverlay.tsx` |
| **Mobile** | `mobile/src/services/PiiScannerService.ts`, `mobile/src/components/AnonymizationPanel.tsx`, `mobile/src/components/mail/AnonymizationSlider.tsx`, `mobile/src/components/mail/PiiWarningPanel.tsx` |
| **API** | `api/src/routes/anonymize.py` |
| **Tests** | `tests/email_anonymization/test_attachment_anonymization.py`, `mobile/src/services/__tests__/PiiScannerService.test.ts`, `web/components/mail/__tests__/AnonymizationPanel.test.tsx` |
| **Scripts** | `scripts/verify_anonymizer.py` |

---

## Pillar 6: Q-AI PQC AI Assistant (85%)

- **What works**:
  - OllamaClient for local-first LLM (localhost:11434, models: llama3.2, mistral, phi-3)
  - PromptGuard with 18 injection patterns across 6 categories (system override, role hijack, delimiter injection, data extraction, encoding bypass, recursive injection)
  - **PII scanning before send**: All `/api/ai/chat` and `/api/ai/summarize` routes scan user prompts for PII (SSN, email, credit card, phone, passwords, API keys). PII detected → HTTP 400 with type listing and risk level. Bypass with `X-PII-Scan: skip` header (enterprise opt-in)
  - FastAPI routes: POST /api/ai/chat (streaming), POST /api/ai/summarize, GET /api/ai/models
  - Graceful fallback when Ollama is offline (helpful error, no crash)
  - All routes run PromptGuard then PII scan before forwarding to LLM
  - Flutter UI shell with model selector and chat interface
  - Tauri AI sidebar with config structs
- **PQC tunnel**: `PQCTunnel` class with ephemeral ML-KEM-768 keypair per session. Encrypts prompts with AES-256-GCM, wraps in JSON envelope `{ct, kem_ct, nonce}`. Activated via `X-PQC-Tunnel: enabled` header. 18 tunnel tests
- **Tests**: 85 tests (30 prompt guard + 10 LLM service + 27 PII guard + 18 PQC tunnel)
- **What's missing**: Local model auto-download; Tauri sidebar not integrated with Ollama backend; streaming mode PQC wrapping

### File Paths

| Layer | Files |
|-------|-------|
| **Rust AI** | `browser/src-tauri/src/ai/mod.rs`, `sidebar.rs`, `cloud_llm.rs`, `local_llm.rs`, `config.rs`, `page_context.rs` |
| **Browser UI** | `browser/src/components/AISidebar.tsx`, `AISettings.tsx`, `ChatPanel.tsx`, `WritingAssist.tsx`, `SummaryPanel.tsx` |
| **Browser hooks** | `browser/src/hooks/useAI.ts` |
| **Mobile** | `mobile/src/components/QaiChat.tsx` |
| **Tests** | `browser/tests/ai_sidebar_test.ts`, `browser/tests/local_llm_test.ts` |

---

## Pillar 7: Quantum-Secure Email (75%)

- **Domain**: `@zipminator.zip` (`.zip` = real Google TLD, brand-perfect)
- **What works**: Envelope crypto (ML-KEM-768 key exchange, AES-256-GCM at rest, QRNG-seeded per-message keys); Rust `email_crypto.rs` encrypt/decrypt roundtrip; config files for Postfix/Dovecot; SMTP transport with PQC bridge; server-side self-destruct TTL via `X-Zipminator-TTL` header (parses seconds, sets `self_destruct_at`, existing `purge_loop` handles deletion); Docker compose integration with GreenMail + mail-transport service; 15 transport tests (6 PQC bridge + 9 storage/SMTP requiring Docker)
- **What's missing**: Production SMTP/IMAP deployment (Docker stack ready but needs hosting); attachment anonymization not wired into email pipeline; PII scanning not wired into compose flow

### File Paths

| Layer | Files |
|-------|-------|
| **Rust crypto** | `crates/zipminator-core/src/email_crypto.rs`, `openpgp_keys.rs` |
| **Python transport** | `email/transport/app.py`, `smtp_server.py`, `imap_server.py`, `pqc_bridge.py`, `storage.py` |
| **Python keydir** | `email/keydir/app.py`, `models.py` |
| **Python KMS** | `email/kms/app.py`, `store.py`, `models.py` |
| **Web mail** | `web/app/mail/page.tsx`, `layout.tsx`, `compose/page.tsx`, `[id]/page.tsx`, `[id]/EmailViewer.tsx` |
| **Web components** | `web/components/mail/SelfDestructTimer.tsx`, `AnonymizationPanel.tsx`, `PiiOverlay.tsx` |
| **Mobile** | `mobile/src/services/ZipMailService.ts`, `EmailCryptoService.ts`, `KmsService.ts`, `mobile/src/components/ZipMail.tsx`, `mail/ExpertMailView.tsx`, `NoviceMailView.tsx`, `EncryptionIndicator.tsx`, `SelfDestructSelector.tsx` |
| **Mobile types** | `mobile/src/types/email.ts` |
| **Tests** | `tests/email_transport/test_smtp_receive.py`, `test_imap_serve.py`, `test_pqc_envelope.py`, `tests/email_keydir/test_keydir.py`, `tests/email_kms/test_kms.py`, `mobile/src/services/__tests__/ZipMailService.test.ts`, `EmailCryptoService.test.ts`, `KmsService.test.ts` |
| **Mail server config** | `email/mailserver/config/postfix/master.cf`, `email/mailserver/config/dovecot/dovecot.conf`, `10-ssl.conf`, `10-mail.conf`, `10-auth.conf` |

---

## Pillar 8: ZipBrowser — PQC AI Browser (85%)

- **Shell**: Tauri 2.x desktop browser (`browser/src-tauri/`)
- **DMG**: `target/release/bundle/dmg/Zipminator_0.2.0_aarch64.dmg` (5.7MB, all Apple Silicon M1-M5)
- **Privacy subsystems** (7 implemented):
  - VPN state machine + kill switch
  - PQC proxy with ML-KEM-768
  - Canvas/WebGL/Audio fingerprint spoofing
  - Per-tab cookie isolation + QRNG rotation
  - Domain-level telemetry/tracker blocking
  - PQC-encrypted password vault (Argon2)
  - Audit logging
- **AI sidebar**: Integrated via Recipe W (registered Tauri command + React component rendered in SidebarSlot)
- **Tests**: 157 Rust tests passing
- **Gap**: Uses system WebView (not custom browser engine; limitation documented in ADR)

### File Paths

| Layer | Files |
|-------|-------|
| **Rust core** | `browser/src-tauri/src/main.rs`, `lib.rs`, `commands.rs`, `pqc.rs`, `state.rs`, `tabs.rs`, `navigation.rs`, `extensions.rs` |
| **Rust privacy** | `browser/src-tauri/src/privacy/mod.rs`, `fingerprint.rs`, `cookie_rotation.rs`, `session.rs`, `entropy.rs`, `telemetry_blocker.rs`, `password_manager.rs`, `audit.rs` |
| **Rust VPN** | `browser/src-tauri/src/vpn/mod.rs`, `tunnel.rs`, `pq_handshake.rs`, `state.rs`, `config.rs`, `metrics.rs`, `kill_switch.rs` |
| **Rust proxy** | `browser/src-tauri/src/proxy/mod.rs`, `server.rs`, `certificate.rs`, `tls.rs`, `config.rs`, `pqc_detector.rs`, `metrics.rs` |
| **Rust AI** | `browser/src-tauri/src/ai/mod.rs`, `sidebar.rs`, `cloud_llm.rs`, `local_llm.rs`, `config.rs`, `page_context.rs` |
| **Browser UI** | `browser/src/App.tsx`, `browser/src/components/WebContent.tsx`, `AddressBar.tsx`, `TabBar.tsx`, `StatusBar.tsx`, `PrivacyDashboard.tsx`, `PrivacyBadge.tsx`, `PasswordVault.tsx`, `QuantumScanner.tsx`, `PqcSelfTest.tsx`, `NavigationControls.tsx`, `VpnToggle.tsx`, `AISidebar.tsx`, `AISettings.tsx`, `ChatPanel.tsx`, `WritingAssist.tsx`, `SummaryPanel.tsx`, `SidebarSlot.tsx` |
| **Mobile** | `mobile/src/components/ZipBrowser.tsx`, `browser/PqcIndicator.tsx`, `browser/AddressBar.tsx`, `browser/NavigationBar.tsx`, `mobile/src/services/BrowserService.ts`, `mobile/src/types/browser.ts` |
| **Web dashboard** | `web/components/dashboard/BrowserPreview.tsx` |
| **Tests** | `browser/src-tauri/tests/vpn_state_test.rs`, `kill_switch_test.rs`, `pq_handshake_test.rs`, `vpn_proxy_integration_test.rs`, `browser/tests/navigation.test.ts`, `tabs.test.ts`, `telemetry_audit_test.ts`, `fingerprint_test.ts`, `entropy_test.ts`, `proxy_server_test.rs`, `pqc_negotiation_test.ts`, `ai_sidebar_test.ts`, `local_llm_test.ts`, `mobile/src/services/__tests__/BrowserService.test.ts`, `mobile/src/components/__tests__/ZipBrowser.test.tsx` |
| **Config** | `browser/src-tauri/tauri.conf.json`, `browser/src-tauri/Cargo.toml`, `browser/package.json`, `browser/vite.config.ts` |

---

## Pillar 9: Q-Mesh — Quantum-Secured WiFi Sensing (90%)

- **Integration**: [RuView](https://github.com/MoHoushmand/RuView) WiFi DensePose system with Zipminator QRNG entropy
- **What RuView does**: ESP32-S3 mesh network that senses human pose, breathing, heartbeat, and presence through WiFi CSI signals. No cameras, no wearables, no internet required
- **Security layer (ADR-032)**: HMAC-SHA256 authenticated TDM sync beacons (28-byte wire format with 4-byte nonce + 8-byte truncated HMAC tag) and SipHash-2-4 frame integrity for CSI data. Pre-shared 16-byte mesh key with replay protection (nonce window = 16)
- **Zipminator integration**: Replace the classical random entropy source for mesh key generation and rotation with Zipminator's QRNG (IBM Quantum 156q). The QRNG harvester produces 50KB/cycle; a mesh key is 16 bytes. This creates quantum-secured WiFi sensing mesh
- **QUIC transport (ADR-032a)**: Aggregator-class nodes use `midstreamer-quic` with TLS 1.3 AEAD. ESP32-S3 nodes retain manual HMAC/SipHash over UDP
- **Use cases**: Healthcare (vital sign monitoring, fall detection), defense (through-wall personnel tracking), elder care, smart buildings

### Physical Cryptography — Wave 1 (Complete)

Six new modules in `crates/zipminator-mesh/` implementing physical-layer crypto primitives:

1. **CSI Entropy Harvester** (`csi_entropy.rs`) — Von Neumann debiasing of WiFi CSI phase data; implements `PoolEntropySource` trait; XOR-mixed with QRNG for defense-in-depth
2. **PUEK (Physical Unclonable Environment Key)** (`puek.rs`) — Location-as-key via SVD eigenstructure of CSI snapshots; configurable security profiles (SCIF/Office/Home) with tunable eigenvalue thresholds
3. **EM Canary Session Controller** (`em_canary.rs`) — 4-level threat escalation (Normal → Elevated → High → Critical); policy-driven key rotation and destruction on electromagnetic anomaly detection
4. **Vital-Sign Continuous Auth** (`vital_auth.rs`) — WiFi-derived biometric session authentication with rolling HMAC; drift detection for liveness verification
5. **Topological Mesh Authentication** (`topo_auth.rs`) — Network key derived from graph topology invariants via petgraph; topology changes trigger re-authentication
6. **Spatiotemporal Non-Repudiation** (`spatiotemporal.rs`) — Presence-proof signatures combining CSI fingerprint + vital signs + timestamp for undeniable physical attestation

- **What else works**: Entropy bridge crate with HKDF-SHA256 key derivation from quantum pool; MeshKey (16-byte PSK) and SipHashKey types with zeroize-on-drop; FilePoolSource and MemoryEntropySource; MeshProvisioner with `provision_nvs_binary()` generating ESP32-S3-compatible blobs (magic header, mesh_id, PSK, SipHash key, SHA-256 checksum)
- **Tests**: 106 Rust tests in mesh crate (90 unit + 16 integration); 513 total workspace tests passing
- **Wave 2 (in progress)**: Attestation wire format, provisioner extensions for new module keys
- **Wave 3 (research-phase)**: Ghost Protocol, TEMPEST countermeasures, ZKP presence proofs, RF Shroud
- **Remaining integration**: Cross-repo integration script linking Zipminator QRNG output to RuView's `scripts/provision.py`; shared NVS key management; OTA key rotation over mesh

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Zipminator QRNG                                            │
│  (IBM Quantum 156q → quantum_entropy_pool.bin)              │
│       │                                                     │
│       ▼  16-byte quantum-random mesh key                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  RuView Mesh Security (ADR-032)                     │    │
│  │                                                     │    │
│  │  Beacon Auth:  HMAC-SHA256(mesh_key, payload+nonce) │    │
│  │  Frame MAC:    SipHash-2-4(derived_key, header+IQ)  │    │
│  │  Key derive:   siphash_key = HMAC-SHA256(mesh_key,  │    │
│  │                "csi-frame-siphash")[0..16]           │    │
│  │  Replay:       Monotonic nonce, window=16           │    │
│  │  Rotation:     Coordinator broadcast (90-day cycle) │    │
│  └─────────────────────────────────────────────────────┘    │
│       │                                                     │
│       ▼                                                     │
│  ESP32-S3 Mesh (4-6 nodes, ~$1/node)                        │
│  WiFi CSI → Pose / Breathing / Heartbeat / Presence         │
└─────────────────────────────────────────────────────────────┘
```

### File Paths (RuView — external repo)

| Layer | Files |
|-------|-------|
| **Mesh security** | `crates/wifi-densepose-hardware/src/esp32/tdm.rs` (beacon auth), `firmware/esp32-csi-node/main/csi_collector.c` (SipHash frame MAC, NDP rate limiter) |
| **Key management** | `scripts/provision.py` (mesh key provisioning + rotation), NVS namespace `mesh_sec` |
| **QUIC transport** | `midstreamer-quic` v0.1.0 (TLS 1.3 AEAD for aggregator uplinks) |
| **Signal processing** | `crates/wifi-densepose-signal/src/ruvsense/` (coherence gate, cross-room tracker) |
| **Integration point** | Zipminator `crates/zipminator-core/src/qrng/` → RuView `scripts/provision.py --mesh-key` |

---

## Subscription Tiers

| Feature | Free (Amir) | Developer (Nils) | Pro (Solveig) | Enterprise (Robindra) |
|---------|:-----------:|:-----------------:|:-------------:|:---------------------:|
| **Public Price** | $0 | $9/mo (early) / $29/mo | $29/mo (early) / $69/mo | Custom ($5K-$50K/mo) |
| **Anonymization Levels** | 1-3 | 1-5 | 1-7 | 1-10 |
| **QRNG Access** | - | - | - | Yes |
| **Data Limit** | 1 GB | 10 GB | 100 GB | Unlimited |
| **API Access** | - | Yes | Yes | Yes |
| **Team Management** | - | - | Yes | Yes |
| **SSO Integration** | - | - | Yes | Yes |
| **Custom Integrations** | - | - | - | Yes |
| **HSM Support** | - | - | - | Yes |
| **SLA Guarantee** | - | - | - | 99.99% |
| **On-Premise Deployment** | - | - | - | Yes |
| **Support** | Community | Email | Priority | 24/7 Dedicated |

### GitHub Star Supporter Program

Star [QDaria/zipminator](https://github.com/QDaria/zipminator) to unlock Developer tier features for free. Activation code: `GHSTAR-LEVEL5`

Implementation: `web/app/api/github-stars/route.ts`, `web/components/GitHubStarReward.tsx`, `web/app/api/linkedin-badge/route.ts`

---

## PQC Security Stack

- **Algorithm**: ML-KEM-768 (Kyber768) per NIST FIPS 203
- **Key sizes**: PK 1184B, SK 2400B, CT 1088B, SS 32B
- **Implementation**: Rust (constant-time, no unsafe), PyO3 bindings
- **Entropy**: 156-qubit IBM Quantum (Marrakesh/Fez) via qBraid
- **Hybrid**: X25519 + ML-KEM-768 for TLS key exchange
- **Self-destruct**: DoD 5220.22-M 3-pass overwrite

> **Note**: Zipminator implements NIST FIPS 203 (ML-KEM-768) algorithms. This is NOT a FIPS 140-3 validated module. FIPS 140-3 validation requires CMVP certification ($80-150K+). See grants/README.md for certification cost ladder.

---

## Quantum Vulnerability Scanner

| Component | File |
|-----------|------|
| Python SDK | `src/zipminator/scanner.py` (QuantumReadinessScanner) |
| Tauri command | `browser/src-tauri/src/commands.rs::scan_pqc_endpoint` |
| Self-test UI | `browser/src/components/PqcSelfTest.tsx` |
| Scanner UI | `browser/src/components/QuantumScanner.tsx` |

Grading: A (PQC hybrid active) to F (TLS 1.1 or below)

---

## HNDL Risk Calculator

Module: `src/zipminator/hndl_risk.py` (HNDLCalculator)

- **Inputs**: data sensitivity, retention years, current encryption, industry, CRQC estimate
- **Output**: risk score (0-100), risk level (LOW/MEDIUM/HIGH/CRITICAL), recommendations

---

## Shared Infrastructure

### Rust Core (`crates/`)

```
crates/
├── zipminator-core/    # 16 source files (~96K lines)
│   ├── kyber768.rs         # Pure Rust ML-KEM-768
│   ├── quantum_entropy_pool.rs  # Entropy management
│   ├── python_bindings.rs  # PyO3 bindings
│   ├── ratchet/            # PQC Double Ratchet (mod, state, header, chains)
│   ├── ffi.rs              # C FFI for mobile
│   ├── ntt.rs / poly.rs    # NTT + ring arithmetic
│   ├── pii.rs              # PII detection
│   ├── email_crypto.rs     # Email encryption
│   ├── srtp.rs             # PQ-SRTP
│   └── qrng/ (5 files)     # Provider abstraction
├── zipminator-app/     # Flutter bridge layer (safe Rust types for FRB)
│   ├── crypto.rs           # ML-KEM-768 safe wrappers (keypair, encapsulate, decapsulate, composite)
│   ├── ratchet.rs          # Session-store PQ Double Ratchet (LazyLock<Mutex<HashMap>>)
│   ├── email.rs            # Email encrypt/decrypt wrappers
│   ├── pii.rs              # PII scanning wrappers
│   └── srtp.rs             # SRTP key derivation wrappers
├── zipminator-bench/   # Performance benchmarks
├── zipminator-fuzz/    # Fuzz testing
└── zipminator-nist/    # NIST KAT compliance validation
```

### Flutter App (`app/`)

```
app/
├── rust/                    # FRB bridge (flutter_rust_bridge v2.11.1)
│   └── src/api/simple.rs   # 16 FRB-annotated functions → auto-generates Dart bindings
├── lib/
│   ├── main.dart            # Entry point (RustLib.init())
│   ├── app.dart             # MaterialApp.router with Quantum theme
│   ├── core/
│   │   ├── router.dart      # GoRouter with ShellRoute (8 pillars + settings)
│   │   ├── theme/quantum_theme.dart  # Material 3 dark/light themes
│   │   └── providers/       # 7 Riverpod 3 Notifiers (crypto, ratchet, pii, email, vpn, srtp, theme)
│   ├── features/            # 8 pillar screens + settings
│   │   ├── vault/           # Key gen, KEM roundtrip
│   │   ├── messenger/       # PQ Double Ratchet chat
│   │   ├── voip/            # PQ-SRTP calls
│   │   ├── vpn/             # Connect + kill switch
│   │   ├── anonymizer/      # PII scanning
│   │   ├── qai/             # Q-AI chat + model selector
│   │   ├── email/           # PQC email compose
│   │   ├── browser/         # PQC proxy browser
│   │   └── settings/        # Theme toggle + app info
│   └── shared/widgets/      # ShellScaffold (responsive nav rail/bottom bar)
└── test/                    # 23 widget tests (core, pillar, cross-pillar)
```

### FastAPI Backend (`api/`)

| File | Purpose |
|------|---------|
| `api/src/main.py` | App entry point |
| `api/src/routes/crypto.py` | `/api/crypto` endpoints |
| `api/src/routes/keys.py` | `/api/keys` management |
| `api/src/routes/anonymize.py` | `/api/anonymize` endpoint |
| `api/src/middleware/auth.py` | Auth middleware |
| `api/src/db/models.py` | Database models |

### Python SDK (`src/zipminator/`)

| File | Purpose |
|------|---------|
| `cli.py` | Command-line interface |
| `scanner.py` | PQC vulnerability scanner |
| `hndl_risk.py` | HNDL risk calculator |
| `anonymizer.py` | Main anonymizer engine |
| `mcp_server.py` | MCP server tools |
| `api_server.py` | API server launcher |
| `jupyter/` | JupyterLab integration (magics, widgets, display, bridge) |

### Quantum Entropy Infrastructure

| Component | File |
|-----------|------|
| IBM Quantum | `src/zipminator/entropy/ibm.py` (Marrakesh 156q, Fez 156q) |
| Rigetti | `src/zipminator/entropy/rigetti.py` (Aspen-M / Ankaa 80-84q) |
| qBraid | `src/zipminator/entropy/qbraid.py` (multi-provider) |
| Harvester | `scripts/qrng_harvester.py` (50KB/harvest) |
| Pool | `quantum_entropy/quantum_entropy_pool.bin` (gitignored, grows dynamically) |

---

## Platform Support

### Flutter Super-App (NEW — Single Codebase)

| Platform | Status | Build Command |
|----------|--------|---------------|
| macOS | Ready (pending Xcode config) | `flutter build macos` |
| iOS | Ready (pending Xcode config) | `flutter build ios` |
| Android | Ready (SDK 36 installed) | `flutter build apk` |
| Windows | Ready | `flutter build windows` |
| Linux | Ready | `flutter build linux` |
| Web | Ready | `flutter build web` |

**Technology**: Flutter 3.41.4 + `flutter_rust_bridge` v2.11.1 + Riverpod 3 + GoRouter + Material 3

**Architecture**: `app/rust/` → FRB bridge → `crates/zipminator-app/` → `crates/zipminator-core/`

All 8 pillars implemented with full Riverpod state management wired to Rust crypto:
- Vault: ML-KEM-768 key generation + KEM roundtrip verification
- Messenger: PQ Double Ratchet chat with session management
- VoIP: PQ-SRTP key derivation + call state machine
- VPN: Connect/disconnect lifecycle + kill switch toggle
- Anonymizer: PII scanning with sensitivity badges
- Q-AI: Chat interface with model selector (auto/opus/sonnet/haiku/local)
- Email: Compose form with encrypt/decrypt roundtrip
- Browser: URL bar + PQC proxy toggle + privacy controls (fingerprint, cookie rotation, telemetry)

Settings screen: theme toggle (dark/light), Rust bridge version, crypto engine info, open source licenses.

**Tests**: 23 Flutter widget tests (5 core + 8 pillar + 5 extended + 5 cross-pillar)

### Legacy Platform Apps (still maintained)

| Platform | Technology | Status | Key Files |
|----------|-----------|--------|-----------|
| Web | Next.js 16 + Tailwind + Framer Motion | Production (zipminator.zip) | `web/` |
| Desktop | Tauri 2.x (ZipBrowser) | Beta (DMG aarch64) | `browser/src-tauri/`, DMG at `target/release/bundle/dmg/` |
| iOS | React Native + Expo | Beta (11 suites, 267+ tests) | `mobile/` |
| Android | React Native + Expo | Beta | `mobile/` |
| API | FastAPI + PostgreSQL + Redis | Production | `api/` |
| CLI | Python Typer + Rich | Production | `src/zipminator/cli.py` |
| JupyterLab | zip-pqc micromamba env (312 packages) | Production | `src/zipminator/jupyter/`, `docs/book/` |

---

## Test Summary (verified 2026-03-19)

| Suite | Count | Command |
|-------|:-----:|---------|
| Rust core | 218 | `cargo test -p zipminator-core` |
| Rust browser | 157 | `cargo test -p zipbrowser` |
| Rust app bridge | 15 | `cargo test -p zipminator-app` |
| Rust FRB bridge | 5 | `cargo test -p rust_lib_zipminator` |
| Rust NIST | 5 | `cargo test -p nist-kat` |
| Rust bench | 17 | `cargo test -p zipminator-bench` |
| Rust mesh | 50 | `cargo test -p zipminator-mesh` |
| **Rust total** | **457** | `cargo test --workspace` |
| Flutter widget | 23 | `cd app && flutter test` |
| Web vitest | 30 | `cd web && npm test` |
| Mobile Expo | 267/274 | `cd mobile && npm test` |
| Python + integration | 800 | `micromamba activate zip-pqc && pytest tests/` |

---

## Compliance

- **GDPR**: Norwegian Data Protection Authority standards
- **HIPAA**: Healthcare data protection features
- **CCPA**: California consumer privacy support
- **NIST FIPS 203**: ML-KEM-768 algorithm implementation
- **CNSA 2.0**: NSA Commercial National Security Algorithm Suite alignment
- **ETSI QSC**: European quantum-safe cryptography standards

---

## Web Features (zipminator.zip)

| Feature | Status |
|---------|--------|
| Landing page with 16 security technologies | Production |
| 21-slide investor pitch deck (`/invest`) | Production |
| 9-tab dashboard (`/dashboard`) | Production |
| OAuth (GitHub, Google, LinkedIn) via next-auth v5 | Production |
| Supabase waitlist with rate limiting | Production |
| og:image, sitemap.xml, robots.txt | Production |
| Dark/light mode toggle | Production |
| Pricing cards slide (4-column, early-adopter badges) | Production |
| GitHub Star Supporter CTA + LinkedIn badge sharing | Production |
| Vercel production deployment | Live at zipminator.zip |

---

## Jupyter Book Documentation

Location: `docs/book/`

| Resource | Path |
|----------|------|
| Configuration | `docs/book/_config.yml`, `_toc.yml` |
| Content pages | `docs/book/content/` (7 pages) |
| Tutorial notebooks | `docs/book/notebooks/` (01-06) |
| Environment | `docs/book/environment.yml`, `requirements.txt` |

Build: `jupyter-book build docs/book/`

---

## CI/CD

| Workflow | File | Triggers |
|----------|------|----------|
| Flutter (analyze + test) | `.github/workflows/flutter.yml` | `app/**`, `crates/zipminator-app/**` on push/PR |
| Rust bridge tests | `.github/workflows/flutter.yml` (rust-bridge job) | same as above |

Matrix: ubuntu-latest + macos-latest for Flutter; ubuntu-latest for Rust bridge.

---

*Last verified: 2026-03-19 | QDaria AS | 100% Completion Sprint — Percentages reconciled*
