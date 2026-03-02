# Zipminator — Complete Feature & Capability Reference

> **The World's First Post-Quantum Cryptography (PQC) Super-App**
>
> Zipminator is a cross-platform cybersecurity platform that harvests true quantum entropy from live quantum computers (IBM Quantum, Rigetti) to power an impenetrable suite of encryption, communication, networking, data anonymization, and AI tools — plus the world's most secure email and the only quantum-safe AI browser.

---

## The 8-Pillar PQC Super-App

| # | Pillar | What It Does | Status |
|---|--------|-------------|--------|
| 1 | **Quantum Vault** | PQC file encryption + DoD self-destruct | ✅ Complete |
| 2 | **Quantum Secure Messenger** | PQC Double Ratchet E2E chat | 🟡 70% |
| 3 | **Quantum VoIP & Video** | PQ-SRTP calls via WebRTC | 🟡 30% |
| 4 | **Q-VPN (PQ-WireGuard)** | Device-wide PQC VPN | 🟡 30% |
| 5 | **10-Level Anonymization Suite** | QRNG-powered data anonymization (NAV heritage) | ✅ Complete |
| 6 | **OpenClaw AI Assistant** | On-device PQC AI chatbot | ✅ Complete |
| 7 | **Quantum-Secure Email** | `username@zipminator.zip` — world's most secure email | 📋 Planned |
| 8 | **ZipBrowser** | PQC AI Browser — first quantum-safe AI browser | 📋 Planned |

---

## 1. The Quantum Vault & Self-Destruct Storage

- **Encryption:** AES-256-GCM with keys derived from ML-KEM-768 (FIPS 203)
- **Key seeding:** 32-byte seeds from real IBM Quantum entropy (`quantum_entropy_pool.bin`)
- **Formats:** CSV, JSON, Parquet, Excel via Pandas integration
- **Compression:** AES-encrypted ZIP archives with configurable passwords
- **Self-destruct:** Timer-based, DoD 5220.22-M 3-pass overwrite (zeros → ones → random), scheduled destruction, memory clearing
- **PII scanning:** Auto-detects 20+ PII types before encryption with risk assessment
- **Files:** `crypto/zipit.py` (Zipndel class, 434 lines), `crypto/self_destruct.py` (245 lines)

---

## 2. Quantum Secure Messenger

- **Protocol:** Post-Quantum Double Ratchet — ML-KEM-768 for ratchet key exchange, AES-256-GCM for payloads, HKDF-SHA-256 chain keys with forward secrecy
- **Transport:** WebSocket signaling (FastAPI) + WebRTC data channels
- **Ratchet core:** Rust native (`crates/zipminator-core/src/ratchet.rs`)
- **Mobile services:** `SignalingService.ts`, `PqcMessengerService.ts`
- **UI:** `SecureMessenger.tsx` with PQC handshake initiation

---

## 3. Quantum VoIP & Video Calling

- **Media:** WebRTC peer connections with native camera/microphone
- **Security:** PQ-SRTP — SRTP master keys derived from ML-KEM-768 shared secrets (not RSA/ECDH)
- **Signaling:** Shared WebSocket signaling server with Messenger
- **Mobile:** `VoipService.ts` for SDP exchange and call management
- **UI:** `NetworkShield.tsx` with Novice/Expert modes

---

## 4. Q-VPN (PQ-WireGuard)

- **Protocol:** WireGuard wrapped in ML-KEM-768 handshakes (replaces Curve25519 DH)
- **iOS:** `NetworkExtension` packet tunnel provider (planned)
- **Android:** `VpnService` with PQ-WireGuard (planned)
- **Key rotation:** Automated Kyber rotation via Rust core
- **Telemetry:** Real-time IP, RX/TX, latency in Expert mode

---

## 5. 10-Level Anonymization & Data Science Suite

**Origins:** Production code from NAV (Norwegian Labour and Welfare Administration), upgraded with PQC + QRNG.

| Level | Name | Technique |
|-------|------|-----------|
| L1 | Minimal Masking | Regex redaction (`j***@mail.com`) |
| L2 | Partial Redaction | First/last char exposure (`J...h`) |
| L3 | Static Masking | Constant `[REDACTED]` |
| L4 | PQC Pseudonymization | SHA-3 hashing seeded with Kyber-768 key |
| L5 | Data Generalization | Range bucketing (Age 34 → 30–40) |
| L6 | Data Suppression | Complete column removal |
| L7 | Quantum Jitter | QRNG Gaussian noise (5% σ) |
| L8 | Quantum Differential Privacy | QRNG Laplace noise (ε=0.1) |
| L9 | Enhanced K-Anonymity | Quantile-based clustering |
| L10 | Total Quantum Pseudoanonymization | QRNG one-time pad mapping (irreversible) |

**Key differentiator:** Levels 7–10 use real quantum random numbers from IBM Quantum hardware.

**Integration:** JupyterLab + `zip-pqc` micromamba environment, Pandas DataFrames, CLI, MCP tools.

---

## 6. OpenClaw PQC AI Assistant

- **Local LLM mode:** No data leaves the device
- **PQC tunnel mode:** Prompts routed through Q-VPN to backend LLMs
- **AIDefence:** Prompt injection and PII scanning before send
- **UI:** `OpenClawChat.tsx` chat interface

---

## 7. Quantum-Secure Email (`username@zipminator.zip`) 🆕

**The world's most secure email service** — powered by real quantum entropy.

- **Domain:** `@zipminator.zip` (`.zip` is a real Google TLD — brand-perfect for security)
- **Encryption:** ML-KEM-768 key exchange for SMTP/IMAP, AES-256-GCM at rest
- **Key seeding:** QRNG-seeded per-message encryption keys from IBM Quantum
- **PII protection:** Auto-scans outgoing emails for 20+ PII types, warns before send
- **Self-destruct:** Emails that auto-delete after read or after a configurable timer
- **Attachment anonymization:** Apply L1–L10 anonymization to outgoing files
- **Webmail UI:** React/Next.js with quantum-purple design language
- **Mobile:** `ZipMail.tsx` component in the Expo app

**Competitive advantage:**

| Feature | Proton Mail | Tuta | **Zipminator Mail** |
|---------|------------|------|---------------------|
| PQC encryption | Hybrid | ✅ TutaCrypt | ✅ ML-KEM-768 + QRNG |
| Real quantum entropy | ❌ | ❌ | ✅ IBM Quantum |
| Self-destructing emails | ❌ | ❌ | ✅ DoD 5220.22-M |
| PII auto-scanning | ❌ | ❌ | ✅ 20+ PII types |
| 10-level anonymization | ❌ | ❌ | ✅ Attachments |
| AI assistant | ❌ | ❌ | ✅ OpenClaw |
| Built-in VPN | ✅ Proton VPN | ❌ | ✅ Q-VPN |
| Domain brand | `@proton.me` | `@tuta.com` | **`@zipminator.zip`** |

---

## 8. ZipBrowser — PQC AI Browser 🆕

**The world's only quantum-safe AI browser** — combining agentic AI with full PQC security.

- **Engine:** Chromium-based (or Tauri for desktop)
- **AI:** OpenClaw sidebar — summarize pages, agentic tasks, writing assist (like Atlas/Dia/Comet)
- **PQC TLS:** All HTTPS connections use ML-KEM-768 key exchange
- **Built-in Q-VPN:** PQ-WireGuard always-on for all browser traffic
- **Privacy:** Zero telemetry, QRNG-seeded sessions, fingerprint-resistant cookie rotation
- **Password manager:** PQC-encrypted credential storage and form autofill
- **Mobile:** WebView component with PQC proxy

**Competitive advantage:**

| Feature | Atlas (OpenAI) | Dia (Browser Co.) | Comet (Perplexity) | **ZipBrowser** |
|---------|---------------|-------------------|-------------------|----------------|
| AI Agent mode | ✅ | ✅ | ✅ | ✅ OpenClaw |
| PQC encryption | ❌ | ❌ | ❌ | ✅ ML-KEM-768 |
| Built-in VPN | ❌ | ❌ | ❌ | ✅ PQ-WireGuard |
| Real QRNG | ❌ | ❌ | ❌ | ✅ IBM Quantum |
| Zero telemetry | ❌ | 🟡 Partial | ❌ | ✅ Full |
| Local AI | ❌ | ✅ | ❌ | ✅ |

---

## Quantum Entropy Infrastructure

### Multi-Provider Architecture

| Provider | Backend | Qubits | File |
|----------|---------|--------|------|
| IBM Quantum | `ibm_q_marrakesh` | 156q Eagle r3 | `entropy/ibm.py` |
| IBM Quantum | `ibm_q_fez` | 156q Eagle r3 | `entropy/ibm.py` |
| Rigetti | Aspen-M / Ankaa | 80–84q | `entropy/rigetti.py` |
| qBraid | Multi-provider | Variable | `entropy/qbraid.py` |

### QRNG Harvester (`scripts/qrng_harvester.py`)

120-qubit Hadamard circuit → ~3,400 shots → **50 KB of quantum entropy per harvest** → Appended to `quantum_entropy_pool.bin` with SHA-256 integrity hash.

### Robindra Quantum Random Module (`crypto/quantum_random.py`)

Drop-in replacement for Python's `random` module backed by real quantum entropy:

```python
import zipminator.robindra as robindra
x = robindra.randint(1, 100)  # Real quantum entropy!
```

Functions: `random()`, `randint()`, `choice()`, `shuffle()`, `sample()`, `uniform()`, `gauss()`, `randbytes()`, `getrandbits()`, `configure()`, `get_stats()`

---

## PII Detection & Compliance

- **20+ PII types:** Norwegian FNR, IBAN, SSN, credit cards, emails, phones, API keys, crypto keys, addresses, DOB
- **Multi-jurisdiction:** Norway, US, UK, UAE, EU patterns (`crypto/patterns/`)
- **Risk levels:** LOW → MEDIUM → HIGH → CRITICAL with auto-recommended anonymization level
- **Compliance:** GDPR, CCPA, HIPAA, Norwegian Personopplysningsloven (`compliance_check.py`)
- **Audit trail:** Timestamped logs of every operation (`audit_trail.py`)

---

## Subscription System

| Tier | Character | Levels | QRNG | Price |
|------|-----------|--------|------|-------|
| **Amir** | Developers | 1–3 | ❌ | Free |
| **Nils** | Professional | 1–5 | ❌ | Paid |
| **Solveig** | Teams | 1–7 | ❌ | Paid |
| **Robindra** | Enterprise | 1–10 | ✅ | Custom |

Activation codes: `FREE-LEVEL3`, `BETA2026-LEVEL10`, `ENTERPRISE-LEVEL10`

---

## Agentic AI Systems (MCP Server)

**MCP tools:** `anonymize_data`, `encrypt_file`, `decrypt_file`, `generate_keypair`, `encapsulate`, `decapsulate`, `harvest_entropy`, `scan_pii`, `check_compliance`, `self_destruct`

**Slash commands:** `/anonymize-vault`, `/pqc-shield`, `/quantum-status`

---

## Rust High-Performance Core

```
crates/
├── zipminator-core/    # 16 source files (~96K lines)
│   ├── kyber768.rs (16K)       # Pure Rust ML-KEM-768
│   ├── quantum_entropy_pool.rs (18K)  # Entropy management
│   ├── python_bindings.rs (7K) # PyO3 bindings
│   ├── ratchet.rs (4K)         # PQC Double Ratchet
│   ├── ffi.rs (1K)             # C FFI for mobile
│   ├── ntt.rs / poly.rs        # NTT + ring arithmetic
│   └── qrng/ (5 files)         # Provider abstraction
├── zipminator-bench/   # Performance benchmarks
├── zipminator-fuzz/    # Fuzz testing
└── zipminator-nist/    # NIST compliance validation
```

Compiles to `_core.abi3.so` (PyO3) + static `.a` / `.so` for mobile via `build_rust_mobile.sh`.

---

## Cross-Platform Architecture

| Platform | Framework | Status |
|----------|-----------|--------|
| iOS | React Native (Expo) | ✅ Active |
| Android | React Native (Expo) | ✅ Active |
| Web Landing | Next.js + Tailwind | ✅ 16 components |
| Desktop | Tauri (planned) / ZipBrowser | 📋 Phase 8 |
| Python SDK | Python + Rust bindings | ✅ Published |
| CLI | Click-based | ✅ Working |

---

## Security Standards

| Standard | Status |
|----------|--------|
| FIPS 203 (ML-KEM) | ✅ Kyber-768 |
| AES-256-GCM | ✅ Symmetric encryption |
| SHA-3 (Keccak) | ✅ L4 hashing |
| HKDF-SHA-256 | ✅ Key derivation |
| DoD 5220.22-M | ✅ Secure deletion |
| GDPR / CCPA / HIPAA | ✅ Compliance engine |
| FIPS 204 (ML-DSA) | 📋 Planned (Dilithium signatures) |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  Zipminator Super-App                        │
├─────────────┬──────────┬──────────┬──────────┬──────────────┤
│  Vault      │ Messenger│ VoIP/VPN │ OpenClaw │ ZipMail      │
│  FileVault  │ Secure   │ Network  │ Chat     │ Email        │
│  .tsx       │ Msg .tsx │ Shield   │ .tsx     │ Client       │
├─────────────┴──────────┴──────────┴──────────┴──────────────┤
│  Services: Signaling · PqcMessenger · VoIP · Mail           │
├─────────────────────────────────────────────────────────────┤
│  Native Bridge: Swift/Kotlin → C FFI → Rust                │
├─────────────────────────────────────────────────────────────┤
│  Rust Core: kyber768 · ratchet · qrng · ntt · poly · ffi   │
├─────────────────────────────────────────────────────────────┤
│  Python SDK: pqc · anonymizer · pii_scanner · subscription  │
├─────────────────────────────────────────────────────────────┤
│  Quantum HW: IBM Marrakesh 156q · Rigetti · qBraid          │
└─────────────────────────────────────────────────────────────┘

         ZipBrowser (Phase 8)
┌──────────────────────────────┐
│  Chromium + OpenClaw AI      │
│  PQC TLS · Q-VPN · Zero Tel. │
└──────────────────────────────┘
```

---

*Last updated: 2026-03-02 · v1.1.0 · QDaria AS*
