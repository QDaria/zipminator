# Zipminator Manual Testing Guide

> Comprehensive checklist for verifying all 9 pillars across platforms.
> Last updated: 2026-03-11

---

## Prerequisites

### Environment Setup

```bash
# Rust toolchain (required for all platforms)
rustup update stable

# Flutter (super-app)
flutter doctor          # All checks green
cd app && flutter pub get

# Web landing (Next.js)
cd web && npm install --legacy-peer-deps

# Python SDK
micromamba activate zip-pqc
uv pip install maturin && maturin develop
```

### Required Ports

| Service | Port | Command |
|---------|------|---------|
| Web landing | 3099 | `cd web && npm run dev` |
| Flutter web | 8080 | `cd app && flutter run -d chrome` |
| API (if running) | 8000 | `cd api && uvicorn src.main:app` |
| Demo | 3000/5001 | `./demo/run.sh` |

---

## Platform Launch Commands

```bash
# Flutter super-app (primary)
cd app && flutter run -d macos          # macOS desktop
cd app && flutter run -d chrome         # Web (Chrome)
cd app && flutter run -d iPhone\ 16     # iOS simulator (adjust name)
cd app && flutter run -d android        # Android emulator/device

# Web landing page
cd web && npm run dev                   # http://localhost:3099

# Rust tests
cargo test --workspace                  # 332 tests

# Python tests
micromamba run -n zip-pqc pytest tests/ # 116 tests
```

---

## Pillar 1: Quantum Vault (95%)

Route: `/vault` (initial screen)

- [ ] Screen loads with PillarHeader: lock icon, "Quantum Vault", "ML-KEM-768 Key Management"
- [ ] FIPS 203 badge visible (cyan)
- [ ] Tap "Generate Keypair" -- button shows "Generating..." with shimmer spinner
- [ ] Public Key card appears: 1184 bytes, cyan glow, hex preview shown
- [ ] Secret Key card appears: 2400 bytes, purple glow, shows "** hidden **"
- [ ] Tap eye icon on Secret Key -- reveals hex preview; tap again to hide
- [ ] Tap copy icon -- snackbar confirms "[key] copied"
- [ ] Tap "Test KEM Roundtrip" -- green snackbar: "KEM roundtrip verified: 32-byte shared secret matches"
- [ ] Generate again -- keys change (different hex values)

**Stubbed**: Self-destruct UI wiring (timer, DoD wipe) not accessible from this screen.

---

## Pillar 2: PQC Messenger (75%)

Route: `/messenger`

- [ ] Screen loads with PillarHeader: chat icon, "PQC Messenger", subtitle about ML-KEM ratchet
- [ ] PQ-Ratchet badge in app bar (grey when disconnected)
- [ ] Tap "Start Session" -- snackbar shows "Session initialized (1184 byte PK)"
- [ ] PQ-Ratchet badge turns green (active)
- [ ] Text input field appears at bottom with send button
- [ ] Type message, tap send -- message bubble appears (right-aligned, cyan glow)
- [ ] Each bubble shows lock icon + "PQ-encrypted" label
- [ ] Simulated reply appears (left-aligned, purple glow)
- [ ] Typing indicator (3 pulsing dots) visible below messages
- [ ] Send multiple messages -- scroll works, bubbles animate in

**Stubbed**: No message persistence (messages lost on screen exit). No real peer connection. No group chat.

---

## Pillar 3: Quantum VoIP (60%)

Route: `/voip`

- [ ] Screen loads with PillarHeader: phone icon, "Quantum VoIP", "PQ-SRTP Encrypted Calls"
- [ ] PQ-SRTP badge visible (grey initially)
- [ ] Caller avatar: gradient circle (cyan/purple) with person icon
- [ ] Status text: "Ready"
- [ ] Two info cards visible: "HKDF-SHA-256" and "AES-128-CM" with descriptions
- [ ] Tap "Start Call" (if button exists via provider) -- status changes to "In Call"
- [ ] SRTP Master Key and Salt byte counts displayed in a QuantumCard

**Stubbed**: No actual media stream. No microphone/camera access. No TURN/STUN server. Key derivation works but does not protect real audio.

**Platform notes**: VoIP provider state machine works identically on all platforms since there is no real WebRTC integration.

---

## Pillar 4: Q-VPN (90%)

Route: `/vpn`

- [ ] Screen loads with PillarHeader: key icon, "Q-VPN", "PQ-WireGuard Tunnel"
- [ ] ML-KEM-768 badge visible (blue, inactive)
- [ ] Status indicator: grey dot (disconnected)
- [ ] Status text: "Disconnected"
- [ ] Large circular power button visible (dark background, cyan icon)
- [ ] Tap power button -- status changes to "Establishing PQ Handshake..." with pulse animation
- [ ] After connecting: button turns green, status says "Connected", badge activates
- [ ] Tap again -- disconnects, returns to grey
- [ ] Kill Switch toggle card visible: "Block traffic if VPN disconnects"
- [ ] Toggle kill switch on/off -- switch state updates
- [ ] Protocol info card: "ML-KEM-768 Handshake" / "PQ-WireGuard tunnel"

**Stubbed**: No real tunnel established. No actual network traffic routing. iOS/Android VPN service integration not wired.

---

## Pillar 5: 10-Level Anonymizer (70%)

Route: `/anonymizer`

- [ ] Screen loads with PillarHeader: visibility-off icon, "Anonymizer", "PII Scanner & Redactor"
- [ ] "166+ patterns" badge visible (orange)
- [ ] Text field with placeholder: "Paste text to scan for PII..."
- [ ] Enter text with PII: `My SSN is 123-45-6789, email me at test@example.com`
- [ ] Tap "Scan" -- results appear below
- [ ] Summary card shows count: "2 PII items detected (X high sensitivity)"
- [ ] Individual match cards show: pattern name, category, matched text, country code, sensitivity level (L1-L5)
- [ ] Sensitivity badges color-coded: green (low), orange (medium), red (high)
- [ ] App bar chip shows match count
- [ ] Tap "Clear" -- results and text field reset
- [ ] Enter clean text (no PII) and scan -- green "No PII detected" card appears

**Stubbed**: Only binary detection (present/absent). The "10 levels" of graduated anonymization (L4-L10: pseudonymization, generalization, suppression, etc.) are not implemented as selectable tiers.

---

## Pillar 6: Q-AI Assistant (30%)

Route: `/ai`

- [ ] Screen loads with app bar title "Q-AI Assistant"
- [ ] PillarHeader: brain icon, "Q-AI Assistant", "Multi-model Routing by Task Complexity"
- [ ] Model selector chip row: Auto Route, Opus, Sonnet, Haiku, Local
- [ ] Tap each chip -- selection highlights with model-specific color
- [ ] Subtitle text: "Opus for crypto, Sonnet for features, Haiku for config"
- [ ] Text input at bottom with send button; suffix shows selected model name
- [ ] Type question and send -- user bubble appears (right, purple)
- [ ] AI response bubble appears (left, color matches selected model)
- [ ] Response shows "via [model]" label and placeholder text about Rust bridge

**Stubbed**: No real LLM backend. All responses are hardcoded placeholder text. No prompt injection defense. No PII scanning before send. No local model loading.

---

## Pillar 7: Quantum Mail (60%)

Route: `/email`

- [ ] Screen loads with PillarHeader: email icon, "Quantum Mail", "PQC-Encrypted Email"
- [ ] ML-KEM-768 badge (active if keypair exists, inactive otherwise)
- [ ] Key status card: shows "No key -- generate one in Vault first" if no key
- [ ] Tap "Generate" button in key card -- key generated, card updates to show byte count
- [ ] Compose form: To, Subject, Message body fields with icons
- [ ] Fill all fields and tap "Encrypt with ML-KEM-768"
- [ ] Shimmer overlay appears on body field during processing
- [ ] Green "Email Encrypted" card appears with envelope byte count
- [ ] Tap "Test Decrypt" -- green snackbar shows decrypted body text matching input
- [ ] Send icon in app bar also triggers encrypt

**Stubbed**: No SMTP/IMAP transport. Encrypt/decrypt roundtrip is local-only (proves crypto works, does not send email). No self-destruct timer enforcement.

---

## Pillar 8: ZipBrowser (75%)

Route: `/browser`

- [ ] Screen loads with URL bar in app bar (prefilled "https://")
- [ ] PQC/STD badge in app bar (shows "STD" initially)
- [ ] Tab chips: New Tab, Search, Bookmarks -- tappable, selection highlights
- [ ] PillarHeader: globe icon, "PQC Browser", "ML-KEM-768 TLS Proxy"
- [ ] Padlock icon visible (open lock initially)
- [ ] Tap "Enable PQC Proxy" -- button text changes to "PQC Proxy Active", badge changes to "PQC" (green), padlock closes with scale animation
- [ ] Bottom privacy controls bar with 3 toggles: Fingerprint, Cookie Rot., Telemetry
- [ ] Tap Fingerprint toggle -- deactivates (icon turns grey)
- [ ] Tap Cookie Rot. toggle -- deactivates
- [ ] Telemetry toggle always active (non-interactive in current build)

**Stubbed**: No actual web content rendering. URL submission does nothing. No WebView integration. The Tauri desktop browser (`browser/src-tauri/`) is a separate build with actual WebView.

---

## Pillar 9: Q-Mesh / RuView (10%)

No Flutter screen exists yet.

- [ ] Verify `crates/zipminator-mesh/` compiles: `cargo test -p zipminator-mesh` (15 tests)
- [ ] No UI route defined in `router.dart`

**Stubbed**: Entropy bridge skeleton only. No RuView integration. No QRNG-seeded key provisioning.

---

## Cross-Platform Verification

### Navigation

- [ ] **Desktop (macOS/Windows)**: NavigationRail visible on left with all 8 pillar icons + Settings
- [ ] **Mobile (iOS/Android/narrow web)**: BottomNavigationBar with 4 items + "More" overflow
- [ ] Tap each nav item -- correct screen loads with entry animation
- [ ] "More" menu (mobile) shows remaining pillars
- [ ] Deep-link each route directly: `/vault`, `/messenger`, `/voip`, `/vpn`, `/anonymizer`, `/ai`, `/email`, `/browser`, `/settings`

### Theme

- [ ] Navigate to `/settings`
- [ ] Theme toggle switch visible (dark/light)
- [ ] Toggle -- entire app switches theme (backgrounds, cards, text contrast)
- [ ] Verify Rust bridge version displayed
- [ ] Verify crypto engine info displayed
- [ ] "Open Source Licenses" button works

### Responsive Layout

- [ ] Resize window (macOS/web): NavigationRail appears above ~600px width, BottomNav below
- [ ] All cards reflow without overflow
- [ ] Text remains readable at all sizes

---

## Automated Test Quick Reference

```bash
# Rust (332 tests)
cargo test --workspace

# Flutter (23 tests)
cd app && flutter test

# Web vitest (30 tests)
cd web && npx vitest run

# Mobile Expo (267 tests)
cd mobile && npm test

# Python (116 tests)
micromamba run -n zip-pqc pytest tests/

# Rust lint
cargo clippy --workspace -- -D warnings

# Flutter lint
cd app && flutter analyze
```

---

## Known Issues / Expected Failures

| Issue | Impact | Workaround |
|-------|--------|------------|
| No LLM API key configured | Q-AI returns placeholder text only | Expected; set up cloud LLM endpoint when available |
| No SMTP/IMAP server | Email encrypt works but cannot send/receive | Use "Test Decrypt" to verify crypto roundtrip |
| No VPN server | VPN connect is simulated state change only | Verify state machine transitions (connect/disconnect/kill switch) |
| No WebView in Flutter browser | URL bar does nothing, no page rendering | Use Tauri desktop build for real browsing |
| VoIP: no media stream | Call state works but no audio/video | Verify SRTP key derivation output |
| Messenger: no persistence | Messages lost when leaving screen | Expected; persistence layer not yet built |
| Q-Mesh: no UI | Pillar 9 has no Flutter screen | Run `cargo test -p zipminator-mesh` for Rust-level verification |
| macOS code signing | App may require `xattr -cr` to launch | Copy to /Applications, then `xattr -cr /Applications/zipminator.app` |
| Android release APK | Only debug APK built (~160MB) | Use `--split-per-abi` for release builds (~30-40MB) |
| web/ AnonymizationPanel test | Uses jest.mock instead of vi.mock | Known pre-existing; does not affect runtime |
