# Zipminator Feature Matrix

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
| **Workshops** | - | - | - | Yes |
| **Certifications** | - | - | - | Yes |
| **Dedicated CSM** | - | - | - | Yes |
| **Support** | Community | Email | Priority | 24/7 Dedicated |

## GitHub Star Supporter Program

Star [MoHoushmand/zipminator-pqc](https://github.com/MoHoushmand/zipminator-pqc) to unlock Developer tier features for free:

- Anonymization levels 1-5
- PQC API access
- 10 GB data limit
- Email support
- Star Supporter badge
- Activation code: `GHSTAR-LEVEL5`

Implementation: `web/app/api/github-stars/route.ts` checks star status via GitHub OAuth, `web/components/GitHubStarReward.tsx` renders CTA card, `web/app/api/linkedin-badge/route.ts` generates shareable SVG badge.

## 10-Level Anonymization System

| Level | Name | Technique | Tier |
|:-----:|------|-----------|------|
| 1 | Minimal Masking | Regex-based partial masks (emails, IDs) | Free |
| 2 | Partial Redaction | First/last character exposure | Free |
| 3 | Static Masking | Constant `[REDACTED]` replacement | Free |
| 4 | PQC Pseudonymization | SHA-3 hashing seeded with PQC key | Developer |
| 5 | Data Generalization | Numerical ranges (age, income) | Developer |
| 6 | Data Suppression | Complete column removal | Pro |
| 7 | Quantum Jitter | QRNG Gaussian noise injection | Pro |
| 8 | Differential Privacy | Laplace noise with QRNG | Enterprise |
| 9 | Enhanced K-Anonymity | Quantile-based clustering | Enterprise |
| 10 | Quantum Pseudoanonymization | OTP mapping with QRNG | Enterprise |

## PQC Security Stack

- **Algorithm**: ML-KEM-768 (Kyber768) per NIST FIPS 203
- **Key sizes**: PK 1184B, SK 2400B, CT 1088B, SS 32B
- **Implementation**: Rust (constant-time, no unsafe), PyO3 bindings
- **Entropy**: 156-qubit IBM Quantum (Marrakesh/Fez) via qBraid
- **Hybrid**: X25519 + ML-KEM-768 for TLS key exchange
- **Self-destruct**: DoD 5220.22-M 3-pass overwrite

## Quantum Vulnerability Scanner

Python SDK: `src/zipminator/scanner.py` (QuantumReadinessScanner)
- Scan TLS endpoints for PQC support via stdlib `ssl` module
- Grading: A (PQC hybrid active) to F (TLS 1.1 or below)
- Network-wide scanning with aggregated reports
- Integrated in Tauri desktop browser (`browser/src-tauri/src/commands.rs::scan_pqc_endpoint`)

Tauri components:
- `browser/src/components/PqcSelfTest.tsx` — "Verify My Protection" self-test panel
- `browser/src/components/QuantumScanner.tsx` — "Scan My Connections" scanner UI

### Grading Criteria

| Grade | Criteria |
|:-----:|----------|
| A | PQC hybrid (X25519MLKEM768) active |
| B | PQC available but not default |
| C | TLS 1.3 with strong classical (ECDHE-P384+) |
| D | TLS 1.2 with forward secrecy |
| F | TLS 1.1 or below, weak ciphers, no forward secrecy |

## HNDL Risk Calculator

Module: `src/zipminator/hndl_risk.py` (HNDLCalculator)

Quantifies the "Harvest Now, Decrypt Later" risk for your data:

- **Inputs**: data sensitivity, retention years, current encryption, industry, CRQC estimate
- **Output**: risk score (0-100), risk level (LOW/MEDIUM/HIGH/CRITICAL), recommendations
- **Timeline**: based on NIST CRQC estimates (2030-2040)
- **Industries**: government (1.5x), defense (1.6x), healthcare (1.3x), finance (1.4x)
- **Sensitivity levels**: public, internal, confidential, top_secret

## PQC Self-Test (Tauri Browser)

Rust command: `browser/src-tauri/src/pqc.rs::pqc_self_test`

- Keygen, encapsulate, decapsulate timing benchmarks
- Shared secret match verification
- Key/ciphertext size reporting
- Frontend: `browser/src/components/PqcSelfTest.tsx`

## Super-App Modules (8 Pillars)

| # | Pillar | Description | Status |
|---|--------|-------------|--------|
| 1 | **Quantum Vault** | PQC file encryption + DoD self-destruct | Complete |
| 2 | **PQC Messenger** | E2E messaging with PQ Double Ratchet (Kyber768 + X3DH) | Complete |
| 3 | **Quantum VoIP** | Voice/video with PQ-SRTP (ML-KEM + SRTP) | Complete |
| 4 | **Q-VPN** | Post-quantum VPN with kill switch (WireGuard + Kyber768) | Complete |
| 5 | **10-Level Anonymizer** | QRNG-powered data anonymization (NAV heritage) | Complete |
| 6 | **OpenClaw AI** | On-device PQC AI assistant | Complete |
| 7 | **Quantum Mail** | Self-destructing PQC emails with PII scanning | Complete |
| 8 | **ZipBrowser** | PQC AI browser with built-in Q-VPN (Tauri 2.x) | Complete |

## Enterprise Certifications

Available with Enterprise (Robindra) tier:

- Quantum Computing Fundamentals
- Quantum Machine Learning (QML)
- Quantum+AI Integration
- Post-Quantum Cryptography Specialist

## Compliance

- **GDPR**: Full compliance with Norwegian Data Protection Authority standards
- **HIPAA**: Healthcare data protection features
- **CCPA**: California consumer privacy support
- **NIST FIPS 203**: ML-KEM-768 algorithm implementation
- **CNSA 2.0**: NSA Commercial National Security Algorithm Suite alignment
- **ETSI QSC**: European quantum-safe cryptography standards

> **Note**: Zipminator implements NIST FIPS 203 (ML-KEM-768) algorithms. This is NOT a FIPS 140-3 validated module. FIPS 140-3 validation requires CMVP certification ($80-150K+). See grants/README.md for certification cost ladder.

## Platform Support

| Platform | Technology | Status |
|----------|-----------|--------|
| Web | Next.js 16 + Tailwind + Framer Motion | Production (zipminator.zip) |
| Desktop | Tauri 2.x (ZipBrowser) | Beta |
| iOS | React Native + Expo | Beta (11 test suites, 267+ tests) |
| Android | React Native + Expo | Beta |
| API | FastAPI + PostgreSQL + Redis | Production |
| CLI | Python Typer + Rich | Production |
| JupyterLab | zip-pqc micromamba env (312 packages) | Production |

## Jupyter Book Documentation

Location: `docs/book/`

| Resource | Path |
|----------|------|
| Configuration | `docs/book/_config.yml`, `_toc.yml` |
| Content pages | `docs/book/content/` (intro, getting_started, anonymization_levels, api_reference, cli_reference, compliance, appendix) |
| Tutorial notebooks | `docs/book/notebooks/` (01-06) |
| Environment | `docs/book/environment.yml`, `requirements.txt` |

### Tutorial Notebooks

| # | Notebook | Content |
|---|----------|---------|
| 01 | quickstart | Keygen + encrypt/decrypt DataFrame |
| 02 | anonymization | All 10 levels on sample data |
| 03 | qrng_entropy | QRNG pool + QuantumRandom |
| 04 | compliance | PII scanning + audit trail |
| 05 | shor_demo | Shor's algorithm for N=15, qubit comparison, HNDL risk |
| 06 | quantum_capabilities | QRNG harvesting demo, NIST SP 800-22 tests |

Build: `jupyter-book build docs/book/`

## One-Click Installer

Script: `scripts/install-jupyter-env.sh`

Features:
- Platform detection (macOS ARM/Intel, Linux, WSL)
- Micromamba + Rust toolchain installation
- uv pip inside conda env
- maturin develop (Rust->Python bindings)
- JupyterLab kernel registration (zip-pqc-kernel)
- Tutorial notebook copying to ~/zipminator-tutorials/
- Optional `--auto-launch` for JupyterLab

## Web Features (zipminator.zip)

| Feature | Status |
|---------|--------|
| Landing page with 16 security technologies | Production |
| 21-slide investor pitch deck (`/invest`) | Production |
| 9-tab dashboard (`/dashboard`) | Production |
| OAuth (GitHub, Google, LinkedIn) via next-auth v5 | Production |
| Supabase waitlist with rate limiting | Production |
| Dark/light mode toggle | Production |
| Pricing cards slide (4-column, early-adopter badges) | Production |
| GitHub Star Supporter CTA + LinkedIn badge sharing | Production |
| Vercel production deployment | Live at zipminator.zip |

## Waitlist OAuth Integration (March 2026)

### Authentication Flow
- **Provider**: next-auth v5 beta (JWT strategy, 30-day sessions)
- **Providers**: Google, GitHub, LinkedIn (credentials in `web/.env.local`)
- **Protected routes**: `/dashboard`, `/mail` (via `middleware.ts` matcher)
- **Public routes**: `/`, `/features`, `/demo`, `/impact`, `/invest`
- **Auth config**: `web/lib/auth.ts`

### Waitlist Form (`web/components/WaitlistForm.tsx`)
Three-state component based on `useSession()`:
1. **Loading**: Spinner while auth status resolves
2. **Unauthenticated**: Sign-in card with Google/GitHub/LinkedIn OAuth buttons
3. **Authenticated**: Auto-filled form (name + email from session, readonly with lock icons)

Features:
- OAuth buttons redirect to `/#waitlist` after login (via `callbackUrl`)
- Form submits `userId` from session for linking waitlist entry to OAuth account
- Duplicate detection (409 response shows "already on the waitlist" message)
- NDA consent checkbox required

### Waitlist API (`web/app/api/waitlist/route.ts`)
- **Validation**: Zod schema (fullName, companyName, email, industry enum, volume enum, ndaConsent)
- **Rate limiting**: 3 requests/minute per IP (in-memory Map)
- **Supabase**: Inserts to `waitlist` table; falls back to demo mode if Supabase not configured
- **Duplicate handling**: PostgreSQL unique constraint (error code 23505) returns 409

### Test Coverage (vitest v4 + @testing-library/react)
| Suite | Tests | File |
|-------|:-----:|------|
| API route | 8 | `web/app/api/waitlist/__tests__/route.test.ts` |
| Component | 7 | `web/components/__tests__/WaitlistForm.test.tsx` |

Tests cover: Zod validation, rate limiting, NDA enforcement, all 9 industry enums, auth states, OAuth button clicks, form submission with userId, duplicate handling, success state.

## Recent Implementation (March 2026)

### Completed (WS1-WS6)

- **WS1 Jupyter Book**: 18 files — config, TOC, 7 content pages, 6 tutorial notebooks, env specs
- **WS2 Scanner**: Python `QuantumReadinessScanner` + Tauri `scan_pqc_endpoint` + `PqcSelfTest.tsx` + `QuantumScanner.tsx`
- **WS3 Subscription**: Hybrid naming, early-adopter pricing, GHSTAR-LEVEL5 activation, enterprise features
- **WS4 HNDL + Demos**: `HNDLCalculator` module, Shor demo notebook, quantum capabilities notebook
- **WS5 Installer**: Platform detection, Rust check, uv, kernel registration, tutorial copy
- **WS6 GitHub Stars**: Star check API, reward CTA component, LinkedIn badge, PricingSlide, FEATURES.md

### Test Results

- Rust core: 166/166 tests passed
- Web build: 24 pages, 0 errors
- Web tests (vitest): 15/15 passed (8 API + 7 component)
- Mobile: 11/11 suites, 267/274 tests passed
- Python modules: HNDL calculator, scanner, subscription all verified
- Pre-existing issues (not from this work): 4 collection errors in email/mcp tests (missing aiosmtpd, pydantic incompatibility); AnonymizationPanel.test.tsx uses jest.mock (needs vi.mock for vitest)

### Remaining Work

- **Jupyter Book build**: Run `jupyter-book build docs/book/` to verify HTML output
- **Playwright screenshots**: Visual verification of PqcSelfTest, QuantumScanner, PricingSlide
- **Tauri desktop build**: `cd browser && cargo build --release` (requires full dependency chain)
- **Installer testing**: Run `scripts/install-jupyter-env.sh` on clean macOS ARM64
- **Email modules**: Fix aiosmtpd dependency for email transport tests
- **MCP server**: Fix pydantic model annotation in mcp_server.py
- **Production deploy**: Push WS6 changes to Vercel (pricing slide, GitHub stars API)
