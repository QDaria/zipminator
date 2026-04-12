# Zipminator: The First Quantum Post-Quantum Cybersecurity Super-App

## Vision

Zipminator is no longer just a file vault or key generator. It is the world's first **Post-Quantum Cryptography (PQC) Super-App**. Relying on React Native (Expo) for mobile/tablet and Tauri for desktop, the app harvests true quantum entropy directly from live quantum computers via qBraid (e.g., IBM Marrakesh, Fez 156q) to power a quantum-resistant suite of communication, network, data analysis, and storage tools.

## 1. The PQC Feature Suite (The Super-App)

### 1️⃣ The Quantum Vault & Self-Destruct Storage

* **Function:** Encrypts local files, photos, passwords, and notes using PQC keys directly seeded by IBM Quantum. Optional self-destruction modes for extreme endpoint security.
* **Architecture:** `liboqs` running locally, combining FIPS-203 ML-KEM and AES-256-GCM.

### 2️⃣ Quantum Secure Messenger (Chat)

* **Function:** An end-to-end encrypted messaging service hardened against "Harvest Now, Decrypt Later" data-center attacks.
* **Architecture:** P2P WebSockets/WebRTC using a Post-Quantum Double Ratchet algorithm.

### 3️⃣ Quantum VoIP & Video Calling

* **Function:** Crystal-clear voice and video calling designed to resist ISP interception and mitigate telecom SS7 vulnerabilities.
* **Architecture:** Decentralized WebRTC with SRTP master keys negotiated using Post-Quantum KEMs.

### 4️⃣ The Q-VPN (Device-Wide Protection)

* **Function:** A built-in virtual private network securing all traffic leaving the device.
* **Architecture:** PQ-WireGuard (WireGuard wrapped in Kyber-768 handshakes).

### 5️⃣ The 10-Level Anonymization & Data Science Suite (Legacy Facelift)

* **Function:** A full data engineering and analytics suite (legacy Zipminator features) with JupyterLab and micromamba (`zip-pqc`).
* **Architecture:** Transforms the original NAV `Zipndel` logic into the flagship **10-Level Anonymization System**.
* **The 10 Levels:**
  * **L1-L3 (Basic):** Regex masking & SHA-3 deterministic hashing (seeded by PQC keys).
  * **L4-L6 (Advanced):** Tokenization & K-Anonymity using secure local storage.
  * **L7-L9 (Quantum Noise):** Numerical data jitter and Differential Privacy using **QRNG Entropy Pool**.
  * **L10 (Quantum Pseudoanonymization):** Total data replacement using a quantum-random one-time pad mapping.

### 6️⃣ "Q-AI Assistant" PQC AI Assistant

* **Function:** A built-in, highly capable AI chatbot interface (acting as the user's cyber-assistant).
* **Architecture:** Either runs lightweight Local LLMs (so no data ever leaves the device) or uses Quantum-Secured API tunnels to specialized backend servers, ensuring prompt data cannot be intercepted or harvested.

### 7️⃣ Quantum-Secure Email (`username@zipminator.zip`)

* **Function:** The world's most secure email service. Users get `username@zipminator.zip` addresses with end-to-end PQC encryption, PII auto-scanning before send, and self-destructing emails.
* **Architecture:** PQC-secured SMTP/IMAP server with ML-KEM-768 key exchange, AES-256-GCM message encryption at rest, QRNG-seeded session tokens, and integrated PII scanner + 10-level anonymization for outgoing attachments.
* **Differentiator:** Neither Proton Mail nor Tuta use real quantum entropy. Zipminator Mail seeds all keys from IBM Quantum hardware. The `.zip` TLD is brand-perfect for a security company.

### 8️⃣ ZipBrowser — PQC AI Browser

* **Function:** The world's only quantum-safe AI browser. Combines agentic AI capabilities (like ChatGPT Atlas / Perplexity Comet / Dia) with full PQC transport security and built-in Q-VPN.
* **Architecture:** Chromium-based (or Tauri-based for desktop), with Q-AI Assistant sidebar, PQC TLS for all connections (ML-KEM-768 key exchange), built-in Q-VPN tunnel, QRNG-seeded session tokens, and zero telemetry. AI runs locally or through PQC-secured tunnels.
* **Differentiator:** No AI browser (Atlas, Dia, Comet, Edge Copilot) uses PQC. Every one sends queries over classical TLS. Zipminator would be first to market.

### 9️⃣ Q-Mesh — Quantum-Secured WiFi Sensing (RuView Integration)

* **Function:** Quantum-secured WiFi sensing mesh that detects human pose, breathing, heartbeat, and presence through walls using ESP32-S3 CSI signals. No cameras, no wearables, no internet.
* **Architecture:** [RuView](https://github.com/MoHoushmand/RuView) ESP32 mesh with ADR-032 security hardening (HMAC-SHA256 beacon auth + SipHash-2-4 frame integrity), where Zipminator's QRNG replaces classical random for mesh key generation and rotation. QUIC transport (TLS 1.3) for aggregator uplinks.
* **Differentiator:** No WiFi sensing system uses quantum-random keys. Healthcare and defense deployments require the highest-grade entropy for tamper-proof mesh authentication. Zipminator + RuView is the only quantum-secured spatial awareness platform.

---

## 2. Unique UX/UI Concepts: Bridging the Gap

* **The "Quantum Core" Selector (Novice vs. Expert Modes):** Instantly translates dense cryptography terminology into "Everyday" or "Cyberpunk" modes.
* **Haptic "Harvesting":** Uses the device's Taptic Engine to physically vibrate as quantum entropy is pulled from the cloud.
* **Interactive Sandbox:** A visual 3D simulation of qubits that reacts to touch.

---

## 3. High-Level Architecture

* **UI Layer:** React Native / Expo (Mobile/Tablet), Tauri (macOS/Windows/Linux Desktop), and Chromium (ZipBrowser).
* **Cryptography Bridge:** Swift/JNI native modules wrapping `liboqs`, alongside OS-specific VPN APIs.
* **Backend:** qBraid and IBM API polling. WebRTC signaling servers. PQC SMTP/IMAP mail server.
* **Email Infrastructure:** PQC-secured mail server with `@zipminator.zip` domain.

---

## 4. Implementation Roadmap

### Phase 1: Foundation & The Vault ✅

* [x] Initialize Expo cross-platform project (`mobile/`).
* [x] Build the "Expertise Mode" Context API and Vault UI.

### Phase 2: Quantum Secure Messenger ✅ 100% code / 85% integration

* [x] Build WebRTC signaling endpoints and React Native Chat UI.
* [x] Complete PQC Double Ratchet integration with native bridge (Flutter + FRB v2.11.1).
* [x] Deploy signalling server to Fly.io (`wss://zipminator-signaling.fly.dev`, live 2026-03-26).
* [x] Messenger round-trip verified on physical iPhone (2026-03-29).

### Phase 3: VoIP, Video, & Q-VPN ✅ 90% code

* [x] Integrate `flutter_webrtc` for camera/mic with PQ-SRTP (2026-03-30).
* [x] Wire Q-VPN to native iOS `NEVPNManager` via platform channel (2026-03-29).
* [x] VoIP audio verified on device (2026-04-01).
* [ ] PQ-WireGuard server deployment (bridge created, not hosted).
* [ ] Android VPN service integration (planned).

### Phase 4: Big Data, AI, & Anonymization ✅

* [x] Build UI flows for the 10-Level Anonymization System.
* [x] Connect JupyterLab & `zip-pqc` micromamba environment endpoints.
* [x] Implement the `AdvancedAnonymizer` Python module (L1-L10 logic).
* [x] Port Legacy `Zipndel` (Zip-and-Delete) logic to the PQC Vault.
* [x] Integrate QRNG (IBM Marrakesh) for Levels 7-10 noise injection.
* [x] Develop the "Q-AI Assistant" Chatbot UI for in-app AI interactions.

### Phase 5: Agentic Systems (MCP Server) ✅

* [x] Expand `Zipminator MCP Server` with `AdvancedAnonymizer` tools (L1-L10).
* [x] Implement PQC Cryptography tools (Kyber, Dilithium) via JSI bridges.
* [x] Create binary-level QRNG entropy harvesting tools for the agent.
* [x] **TDD**: Write Python tests for all MCP tool endpoints before final integration.

### Phase 6: Custom Agentic Workflows & Skills ✅

* [x] **Slash Command: `/anonymize-vault`**: Automatic L1-L10 processing + AES-PQC encryption + local storage.
* [x] **Slash Command: `/pqc-shield`**: Activates PQ-WireGuard and locks all sensitive data science ports.
* [x] **Slash Command: `/quantum-status`**: Detailed telemetry on entropy pool levels and IBM/Rigetti availability.
* [x] **Agent Skill: `PQC-Expert`**: Specialized system prompts for the agent to use `liboqs` correctly.

### Phase 7: Quantum-Secure Email (`@zipminator.zip`) 🟡 90%

* [x] Register `zipminator.zip` domain and configure DNS (MX, SPF, DKIM, DMARC).
* [ ] Deploy PQC-secured SMTP/IMAP mail server (Postfix/Dovecot + ML-KEM-768 TLS). *(crypto library ready, server not deployed)*
* [x] Build webmail UI (React/Next.js) with quantum-purple design language.
* [x] Integrate PII scanner into compose flow (auto-warn before sending sensitive data).
* [x] Implement self-destructing emails (time-based + read-receipt triggered). *(crypto protocol complete, no transport integration)*
* [x] Add 10-level anonymization for outgoing file attachments.
* [x] Build mobile email client component (`ZipMail.tsx`) in the Expo app.
* [x] QRNG-seeded session tokens and per-message encryption keys.

### Phase 8: ZipBrowser — PQC AI Browser ✅ 85%

* [x] Build Tauri 2.x desktop browser shell (`browser/src-tauri/`). *(compiles, DMG at target/release/bundle/dmg/)*
* [x] Integrate PQC TLS (ML-KEM-768 key exchange for all HTTPS connections). *(proxy layer with ML-KEM-768)*
* [x] Embed Q-VPN (PQ-WireGuard) as always-on tunnel for all browser traffic. *(state machine + kill switch, packet wrapping has shortcuts)*
* [x] Integrate Q-AI Assistant sidebar (page summarization, agentic tasks, writing assist). *(Recipe W: Tauri command + React component in SidebarSlot; 157 Rust tests)*
* [x] QRNG-seeded session tokens and cookie rotation for fingerprint resistance.
* [x] Zero telemetry architecture — no data leaves device unless PQC-tunneled.
* [x] Build extension system for PQC password manager and form autofill. *(Argon2 vault implemented)*
* [ ] Mobile browser component via WebView with PQC proxy. *(planned)*
* **103 Rust tests passing** | 7 privacy subsystems implemented | DMG 5.7MB aarch64

### Phase 9: Production & Go-to-Market 🟡 75%

* [x] Deploy web landing at `https://zipminator.zip` (Vercel). *(39 routes, 0 errors)*
* [x] Build investor pitch deck at `/invest`, expanded to 50K-word IP valuation blueprint at `/blueprint` (2026-04-08).
* [x] Configure OAuth (GitHub, Google, LinkedIn, Apple) with next-auth v5 beta. *(all callback URLs registered)*
* [x] Set up Supabase waitlist with rate limiting and Zod validation.
* [x] Create grant templates for 10 institutions.
* [x] SVG gradient wordmark branding across pitch deck.
* [x] og:image, sitemap.xml, robots.txt for SEO.
* [x] Production deploy with AUTH_URL fix.
* [x] Python SDK v0.5.0 shipped to PyPI (2026-04-02).
* [x] Flutter super-app shipped to TestFlight as Build 43 (2026-04-06).
* [x] Three patents filed at Patentstyret, March 2026 (46 claims total).
* [x] Three research papers public on GitHub (quantum-certified-anonymization, unilateral-csi-entropy, certified-heterogeneous-entropy).
* [ ] Play Store AAB submission (Android).
* [ ] Blog posts for qdaria.com.
* [ ] LinkedIn + social launch content.
* [ ] GitHub Release v1.0.0 tag.
* [ ] FIPS 140-3 CMVP certification process initiation. *(currently implements FIPS 203 algorithms only, no validation certificate)*
* [ ] SOC 2 readiness assessment.
* [ ] Enterprise pilot deployments.

### Phase 9b: Q-Mesh — Quantum-Secured WiFi Sensing (RuView) ✅ 90% (Wave 1 shipped 2026-03-20)

* [x] Create entropy bridge crate linking `zipminator-core` QRNG to mesh key derivation.
* [x] HKDF-SHA256 key derivation from quantum pool; `MeshKey` (16-byte PSK) and `SipHashKey` types with zeroize-on-drop.
* [x] `MeshProvisioner` with `provision_nvs_binary()` generating ESP32-S3-compatible blobs (magic header, mesh_id, PSK, SipHash key, SHA-256 checksum).
* [x] Physical Cryptography Wave 1: six new modules in `crates/zipminator-mesh/`:
  - [x] `csi_entropy.rs` — CSI entropy harvester (Von Neumann debias + QRNG XOR)
  - [x] `puek.rs` — Physical Unclonable Environment Key via SVD eigenstructure
  - [x] `em_canary.rs` — 4-level electromagnetic threat escalation
  - [x] `vital_auth.rs` — WiFi-derived biometric continuous authentication
  - [x] `topo_auth.rs` — Graph-topology-invariant mesh authentication
  - [x] `spatiotemporal.rs` — Presence-proof non-repudiation signatures
* [x] 106 mesh tests (90 unit + 16 integration); total workspace 513 tests.
* [x] Wave 2 attestation types in progress (`PresenceProof`, `VitalAuth`, `EmCanary`).
* [ ] Cross-repo integration script linking Zipminator QRNG output to RuView `scripts/provision.py`.
* [ ] Healthcare demo (vital sign monitoring) on real ESP32-S3 hardware.
* [ ] Defence demo (through-wall personnel tracking) on real ESP32-S3 hardware.
* **External repo**: [MoHoushmand/RuView](https://github.com/MoHoushmand/RuView) | ADR-032 mesh security ready | 1300+ tests

### Phase 10: Flutter Super-App — Single Codebase ✅ (NEW)

**Replaces scattered Expo/Tauri/Next.js with one Flutter codebase for all platforms.**

#### Wave 1: Foundation ✅
* [x] Flutter 3.41.4 project setup (`app/`)
* [x] `crates/zipminator-app/` safe Rust bridge layer (15 tests)
* [x] `flutter_rust_bridge` v2.11.1 integration (16 FRB-annotated functions)
* [x] Quantum Design System (Material 3 dark/light themes: cyan, purple, green, Inter/Outfit/JetBrains Mono)
* [x] GoRouter with ShellRoute (responsive NavigationRail + bottom bar)
* [x] Crypto roundtrip verified: keypair → encapsulate → decapsulate → 32-byte shared secret match

#### Wave 2: All 8 Pillars ✅
* [x] 7 Riverpod 3 Notifier providers (crypto, ratchet, pii, email, vpn, srtp, theme)
* [x] Vault screen: ML-KEM-768 key generation + KEM roundtrip verification
* [x] Messenger screen: PQ Double Ratchet chat with session management
* [x] VoIP screen: PQ-SRTP key derivation + call state machine
* [x] VPN screen: connect/disconnect lifecycle + kill switch toggle
* [x] Anonymizer screen: PII scanning with sensitivity badges
* [x] Q-AI screen: chat with model selector (auto/opus/sonnet/haiku/local)
* [x] Email screen: PQC compose form with encrypt/decrypt roundtrip
* [x] Browser screen: URL bar + PQC proxy toggle + privacy controls

#### Wave 3: Integration + Polish ✅
* [x] Theme mode provider (dark/light toggle)
* [x] Settings screen (theme switch, Rust version, crypto engine info, licenses)
* [x] Cross-pillar integration tests (navigate all 8 pillars, theme switching, shared state)
* [x] GitHub Actions CI (flutter analyze + test on ubuntu + macOS, Rust bridge tests)
* [x] 23 Flutter widget tests passing (5 core + 8 pillar + 5 extended + 5 cross-pillar)
* [x] `flutter analyze`: 0 issues

#### Platform Toolchain ✅
* [x] Android SDK 36 + build-tools 36.0.0 + Java 21 (OpenJDK), `flutter doctor` green
* [x] Xcode installed, macOS/iOS builds ready
* [x] Code signing live (Apple Developer Program enrolled)
* [x] TestFlight submission live as **Build 43 (v0.5.0+43)** on 2026-04-06
* [ ] Rust NDK cross-compilation for Android APK (armv7/aarch64 targets)
* [ ] Play Store submission

#### Wave 4: Feature Completeness ✅ (2026-04)
* [x] Anonymiser L7-L10 real implementations wired to provider
* [x] Email PII scan before send with anonymise/send/cancel dialog
* [x] Email attachment picker with anonymisation
* [x] Messenger demo auto-reply gated behind `isLive`
* [x] Browser proxy port wired to AI sidebar
* [x] Q-AI Ollama local LLM integrated into Flutter screen
* [x] Supabase OAuth (GitHub / Google / LinkedIn / Apple) verified on physical iOS device
* [x] `.env` bundled in IPA with `SUPABASE_URL` + `SUPABASE_ANON_KEY`
