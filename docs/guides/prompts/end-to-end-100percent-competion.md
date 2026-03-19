# End-to-End 100% Completion Sprint — Executable Orchestration Prompt

> **Goal**: Bring all 9 Zipminator pillars from "code-complete" (structure exists, tests pass in isolation) to "production-complete" (end-to-end functionality verified, gaps closed).
>
> **Convergence**: Each track runs RALPH loop (max 20 iterations) until quality gates pass.
>
> **Session context**: Read `docs/guides/FEATURES.md` + `docs/guides/implementation_plan.md` before starting.

---

## Current State Snapshot (verified 2026-03-19)

| # | Pillar | Table % | Real % | Primary Gap |
|---|--------|:-------:|:------:|-------------|
| 1 | Quantum Vault | 100 | **95** | Self-destruct Tauri UI wiring |
| 2 | PQC Messenger | 100 | **85** | Persistence done (V); e2e needs running API |
| 3 | Quantum VoIP | 100 | **85** | Frame encryption done; WebRTC DTLS-SRTP replacement missing |
| 4 | Q-VPN | 100 | **90** | Packet wrapping shortcuts; no mobile VPN service |
| 5 | 10-Level Anonymizer | 100 | **92** | CLI `--level N` not wired; Flutter selector not connected |
| 6 | Q-AI Assistant | 100 | **65** | PII scan before send missing; PQC tunnel missing |
| 7 | Quantum Mail | 100 | **60** | No SMTP/IMAP deployed; self-destruct UI-only |
| 8 | ZipBrowser | 100 | **85** | AI sidebar done (W); WebView limitation remains |
| 9 | Q-Mesh (RuView) | 100 | **80** | Entropy bridge done; RuView repo integration missing |

**Tests**: Python 737 pass / 24 errors (all e2e needing running API). Rust: all pass.

**Completed tracks**: M (push), O (blog), P (social), Q (release tag), S (prompt guard), T (anonymizer L4-L10), V (messenger persistence), W (browser AI sidebar).

**Blocked**: N (PyPI — needs token), R (App Store — needs signing certs).

---

## Dependency Graph

```
        ┌─────────────┐
        │ BLOCKED      │
        │ N: PyPI      │─── needs PYPI_TOKEN env var
        │ R: App Store │─── needs Apple signing cert + Google Play keystore
        └─────────────┘

 Independent (run in parallel):
 ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
 │ Pillar 1     │  │ Pillar 5     │  │ Pillar 4     │
 │ Tauri UI fix │  │ CLI --level  │  │ Packet wrap  │
 │ (Sonnet, 1h) │  │ (Sonnet,30m) │  │ (Sonnet, 2h) │
 └──────────────┘  └──────────────┘  └──────────────┘

 ┌──────────────┐  ┌──────────────┐
 │ Pillar 6     │  │ Pillar 3     │
 │ PII+PQC tun  │  │ VoIP session │
 │ (Opus, 2h)   │  │ (Opus, 2h)   │
 └──────────────┘  └──────────────┘

 Sequential (needs Docker):
 ┌──────────────┐     ┌──────────────┐
 │ Track U      │────▶│ E2E verify   │
 │ Email SMTP   │     │ (all pillars)│
 │ (Sonnet, 3h) │     └──────────────┘
 └──────────────┘

 Research-first:
 ┌──────────────┐     ┌──────────────┐
 │ Track Y      │────▶│ RuView link  │
 │ Q-Mesh recon │     │ (Opus, 2h)   │
 │ (Opus, 1h)   │     └──────────────┘
 └──────────────┘
```

---

## Track Recipes

### Track: Pillar 1 — Vault Self-Destruct UI (95% → 100%)

- **Gap**: Self-destruct timer triggers in Rust (`self_destruct.py`) but Tauri desktop UI doesn't invoke it
- **Files**: `browser/src-tauri/src/commands.rs`, `browser/src/components/FileVault.tsx`
- **Model**: Sonnet
- **RALPH config**: max_iter=10
- **Quality gate**: `cd browser/src-tauri && cargo test` passes; Tauri command `self_destruct_file` exists and is wired to frontend button
- **Skills**: /verification-quality

### Track: Pillar 3 — VoIP Transport (85% → 95%)

- **Gap**: `SrtpContext` (AES-256-GCM frame encrypt/decrypt) exists and works. `VoipSession` wires KEM to SRTP. Missing: encrypted voicemail storage, TURN/STUN config
- **Files**: `crates/zipminator-core/src/voip_session.rs`, `crates/zipminator-core/src/srtp.rs`
- **Model**: Opus (crypto)
- **RALPH config**: max_iter=20
- **Quality gate**: `cargo test -p zipminator-core -- voip` passes; roundtrip test: offer → encapsulate → derive SRTP → protect frame → unprotect frame
- **Skills**: /verification-quality, /pair-programming

### Track: Pillar 5 — CLI `--level N` (92% → 97%)

- **Gap**: CLI has `keygen` and `entropy` commands but no `anonymize` subcommand
- **Files**: `src/zipminator/cli.py`, `src/zipminator/anonymizer.py`
- **Model**: Sonnet
- **RALPH config**: max_iter=10
- **Quality gate**: `micromamba activate zip-pqc && zipminator anonymize --level 5 tests/fixtures/sample.csv /tmp/out.csv` produces anonymized output
- **Skills**: /simplify

### Track: Pillar 6 — PII Guard + PQC Tunnel (65% → 85%)

- **Gap**: PromptGuard blocks injections but doesn't scan for PII before forwarding to LLM. No PQC tunnel for remote API calls
- **Files**: `api/src/routes/ai.py`, `src/zipminator/ai/pii_guard.py` (new), `src/zipminator/ai/pqc_tunnel.py` (new)
- **Model**: Opus (crypto for tunnel, security for PII)
- **RALPH config**: max_iter=20
- **Quality gate**: Test with PII-containing prompt → blocked before reaching LLM; PQC tunnel wraps outbound request with ML-KEM-768 envelope
- **Skills**: /verification-quality, /pair-programming

### Track U: Email Transport (60% → 85%)

- **Gap**: Postfix/Dovecot configs exist but no Docker-based test stack; self-destruct is UI-only
- **Files**: `email/transport/`, `docker-compose.integration.yml`, `tests/integration/test_email_e2e.py`
- **Model**: Sonnet + Docker
- **RALPH config**: max_iter=15
- **Quality gate**: `docker compose -f docker-compose.integration.yml up -d && pytest tests/integration/test_email_e2e.py -v` passes
- **Skills**: /docker-containerization

### Track Y: Q-Mesh RuView Integration (80% → 90%)

- **Gap**: Entropy bridge crate is functional (HKDF derivation, file + memory sources, 11 tests). Missing: CLI provisioner that writes mesh keys to NVS format for ESP32-S3
- **Files**: `crates/zipminator-mesh/src/provisioner.rs`, `scripts/provision_mesh.py` (new)
- **Model**: Opus (research + crypto)
- **RALPH config**: max_iter=20, research-first
- **Quality gate**: `cargo test -p zipminator-mesh` passes (all existing + new provisioner tests); Python provisioner script generates NVS binary
- **Skills**: /pair-programming

---

## BLOCKED Tracks (Unblock Steps)

### Track N: PyPI Publish
- **Blocker**: No `PYPI_TOKEN` in environment
- **Unblock**: `export PYPI_TOKEN=pypi-...` (get from pypi.org/manage/account/token)
- **Then**: `micromamba activate zip-pqc && maturin build --release && twine upload target/wheels/*.whl`

### Track R: App Store Submission
- **Blocker**: No Apple signing certificate; no Google Play keystore
- **Unblock (Apple)**: Xcode → Signing & Capabilities → select team → archive → distribute
- **Unblock (Google)**: `keytool -genkey -v -keystore upload.jks` → upload to Play Console
- **Then**: `flutter build ipa` / `flutter build appbundle`

---

## Parallel Execution Plan

### Batch A (3 agents, independent):
1. Pillar 1: Tauri self-destruct UI (Sonnet)
2. Pillar 5: CLI --level N (Sonnet)
3. Pillar 3: VoIP transport polish (Opus)

### Batch B (2 agents, independent):
4. Pillar 6: PII guard + PQC tunnel (Opus)
5. Track Y: Q-Mesh provisioner (Opus)

### Batch C (sequential, needs Docker):
6. Track U: Email transport (Sonnet)

### After all batches:
7. Update FEATURES.md with new percentages
8. Run full test suite
9. Commit + push

---

## Convergence Criteria

All tracks complete when:
- [ ] `cargo test --workspace` — 0 failures
- [ ] `micromamba activate zip-pqc && pytest tests/ --tb=no -q` — 0 errors (skips OK)
- [ ] `cd web && npx next build` — clean
- [ ] FEATURES.md summary table matches detail section percentages
- [ ] All modified files committed with conventional commit format
- [ ] `git status` clean

---

## SB1 Pitch Deck (Parallel Track)

The SpareBank 1 pitch deck V2 is committed. Refinement track runs alongside:
- Verify all data claims match `FEATURES.md`
- Ensure no mock/fake metrics (zero hallucination rule)
- Use `/pitch` skill for improvements
- Model: Haiku (content review only)

---

*Generated 2026-03-19 | Orchestration prompt for Zipminator 100% completion sprint*
