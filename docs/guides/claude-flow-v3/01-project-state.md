# 01 -- Current Project State & Remaining Work

> Extracted from Sections 1 and 2 of the orchestration guide.
> See also: [02-architecture.md](02-architecture.md) for the file map.

---

## 1. Current Project State

### Completed (Phases 1, 4, 5, 6)

| Component | Status | Key Deliverables |
|-----------|--------|-----------------|
| **Rust Kyber768 Core** | Done | `crates/zipminator-core/` with PyO3 bindings, keypair/encapsulate/decapsulate |
| **Python SDK** | Done | `src/zipminator/` imports `_core.abi3.so`, Robindra quantum RNG |
| **Demo App** | Done | Flask backend + CDN React frontend, Kyber round-trip, entropy viz |
| **Web Landing** | Done | Next.js 16 + Tailwind, dashboard, key generator component |
| **FastAPI Backend** | Done | `api/` with PostgreSQL + Redis (needs DB to start) |
| **QRNG Harvester** | Done | `scripts/qrng_harvester.py` appends to growing entropy pool |
| **Gov Demo** | Done | `demo/gov-demo/` with install script and tutorial |
| **CI/CD Workflows** | Done | `.github/workflows/` with CI, security, release, benchmarks |
| **10-Level Anonymizer** | Done | L1-L10 processing, QRNG Levels 7-10, AdvancedAnonymizer module |
| **Q-AI Assistant** | Done | Chat UI, PQC tunnel mode, prompt injection defense |
| **MCP Server** | Done | Kyber/Dilithium tools, QRNG harvesting, PII scanning |
| **Agentic Skills** | Done | `/anonymize-vault`, `/pqc-shield`, `/quantum-status` commands |

### Completed (Phases 2, 3, 7, 8)

| Component | Status | Key Deliverables |
|-----------|--------|-----------------|
| **Secure Messenger** | Done | PQC Double Ratchet, SignalingService, PqcMessengerService, native crypto |
| **VoIP & Q-VPN** | Done | WebRTC + PQ-SRTP, PQ-WireGuard, iOS NetworkExtension, Android VpnService |
| **Quantum-Secure Email** | Done | PQC SMTP/IMAP, webmail UI, PII scanner, self-destruct, mobile ZipMail |
| **ZipBrowser** | Done | Tauri 2.x shell (`browser/`), PQC TLS, Q-VPN, AI sidebar, zero telemetry |

### In-Progress (Phase 9: Production & GTM)

| Component | % | Remaining Work |
|-----------|---|---------------|
| **Production Deploy** | 80% | Live at zipminator.zip, OAuth, waitlist, pitch deck done |
| **Certifications** | 0% | FIPS 140-3 initiation, SOC 2 readiness assessment |
| **Enterprise Pilots** | 0% | Needs sales outreach, pilot agreements |
| **App Store Submissions** | 0% | iOS App Store, Google Play Store |

### Phase Dependency Graph

```
Phase 1 (Foundation)    ✅
Phase 2 (Messenger)     ✅
Phase 3 (VoIP/VPN)      ✅
Phase 4 (Anonymizer)    ✅
Phase 5 (MCP Server)    ✅
Phase 6 (Agentic Skills)✅
Phase 7 (Email)         ✅
Phase 8 (ZipBrowser)    ✅
Phase 9 (Production/GTM)🟡 80%
    │
    ├── zipminator.zip live on Vercel ✅
    ├── 21-slide pitch deck ✅
    ├── OAuth (GitHub/Google/LinkedIn) ✅
    ├── Supabase waitlist ✅
    ├── Grant templates (10 institutions) ✅
    ├── FIPS 140-3 certification 📋
    ├── SOC 2 readiness assessment 📋
    ├── Enterprise pilots 📋
    └── App Store submissions 📋
```

**All 8 super-app modules are complete.** Current focus is production hardening, certification, and go-to-market.

### Entropy Pool Model

The quantum entropy pool is **append-only and ever-growing**:
- Harvested via **qBraid** (not direct IBM) -> IBM Marrakesh / Fez 156q backends
- `scripts/qrng_harvester.py` appends ~50KB per cycle
- Pool at `quantum_entropy/quantum_entropy_pool.bin` is gitignored
- Consumers read sequentially and wrap around on exhaustion (reload from file)
- **Entropy is reusable** -- quantum random bytes are statistically independent
- No bytes are "consumed" or "destroyed" -- the file only grows
- Bootstrap: 4096-byte `secrets.token_bytes()` seed if no pool exists

See [15-entropy-pool.md](15-entropy-pool.md) for full details.

---

## 2. What Remains To Be Done

### Phase 9: Production & Go-to-Market

| Task | Priority | Agent Type | Status |
|------|----------|-----------|--------|
| FIPS 140-3 certification process initiation | Critical | manual | Not started |
| SOC 2 readiness assessment preparation | Critical | manual | Not started |
| Enterprise pilot deployments (finance, gov) | High | manual | Not started |
| iOS App Store submission | High | `coder` + manual | Not started |
| Google Play Store submission | High | `coder` + manual | Not started |
| Custom domain email setup (MX records for zipminator.zip) | Medium | manual | Not started |
| Performance benchmarking on production hardware | Medium | `coder` | Not started |
| Security audit by third party | High | manual | Not started |

### Completed Recently (March 2026)

| Deliverable | Details |
|-------------|---------|
| **Production deploy** | `https://zipminator.zip` live on Vercel, 24 pages, 0 build errors |
| **Investor pitch deck** | 21 slides at `/invest`, SVG gradient wordmark, public (no auth) |
| **OAuth setup** | GitHub, Google, LinkedIn providers; callbacks registered; PKCE S256 |
| **Supabase waitlist** | WaitlistForm + Zod validation + rate-limited API at `/api/waitlist` |
| **Grant templates** | 10 institutions: Innovation Norway, Research Council, EIC Accelerator, NATO DIANA, Horizon Europe, etc. |
| **SVG branding** | Gradient wordmark (`Zipminator_0_gradient.svg`), Z-new.svg on amber for ContactSlide |
| **Domain unification** | `zipminator.zip` (apex) and `www.zipminator.zip` both point to same Vercel project |
| **Rust health** | 166/166 tests, 0 clippy warnings, 12 warnings fixed |
| **Mobile TDD** | 11/11 test suites, 267/274 tests passing |
| **FIPS language audit** | All grant templates use correct "implements FIPS 203" (never "FIPS certified") |
