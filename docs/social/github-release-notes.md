# Zipminator v1.0.0-beta.1 -- Release Notes

## The World's First PQC Super-App

Zipminator is a post-quantum cryptography platform with 9 pillars of encryption infrastructure, built on a pure Rust cryptographic core implementing ML-KEM-768 (NIST FIPS 203). Keys are seeded by real quantum entropy harvested from IBM Quantum hardware (156 qubits).

This is the first public beta release.

---

## What's Included

### Cryptographic Core (Rust)
- ML-KEM-768 (NIST FIPS 203) key encapsulation mechanism
- Constant-time operations verified via dudect testing
- NIST Known Answer Test (KAT) vectors passing
- Multi-source entropy: IBM Quantum (primary), Rigetti (fallback), OS urandom (tertiary)
- Quantum entropy harvester pulling ~50KB/cycle from live quantum hardware
- PyO3 bindings for Python SDK
- Flutter Rust Bridge (FRB v2.11.1) for mobile/desktop
- C FFI for Tauri browser integration
- **332 Rust tests passing across 5 crates**

### 9 Pillars

| # | Pillar | Status | Description |
|---|--------|--------|-------------|
| 1 | Quantum Vault | 95% | AES-256-GCM file encryption with ML-KEM-768 key derivation, self-destruct (DoD 5220.22-M), PII auto-scanning |
| 2 | PQC Messenger | 85% | Post-Quantum Double Ratchet (ML-KEM-768 + AES-256-GCM + HKDF-SHA-256) with forward secrecy |
| 3 | Quantum VoIP | 80% | WebRTC voice/video with PQ-SRTP key negotiation |
| 4 | Q-VPN | 90% | PQ-WireGuard with ML-KEM-768 handshake and kill switch |
| 5 | 10-Level Anonymizer | 100% | Regex masking through differential privacy, QRNG jitter, originally built for NAV (Norwegian government) |
| 6 | Q-AI Assistant | 85% | Local LLM mode (zero data egress) or PQC-tunneled backend, with prompt injection defense |
| 7 | Quantum Mail | 90% | End-to-end PQC-encrypted email with QRNG session tokens and PII scanning |
| 8 | ZipBrowser | 75% | Tauri 2.x browser with PQC transport, built-in Q-VPN, zero telemetry (103 tests) |
| 9 | Q-Mesh | 15% | Quantum-secured WiFi sensing via RuView ESP32 mesh (planned) |

### Platform Support

- **Flutter super-app**: macOS, iOS, Android, Windows, Linux, Web (single codebase)
- **Tauri desktop browser**: macOS Apple Silicon (DMG available), Windows/Linux planned
- **Web landing + dashboard**: Next.js at https://www.zipminator.zip
- **Python SDK**: PyO3 bindings for programmatic access
- **JupyterLab integration**: Anonymization suite with notebook magics

### Test Coverage

| Component | Tests | Status |
|-----------|-------|--------|
| Rust core (5 crates) | 332 | Passing |
| Flutter | 23 | Passing |
| Web (vitest) | 15 | Passing |
| Mobile (Expo/Jest) | 267/274 | Passing (7 skipped) |
| flutter analyze | 0 issues | Clean |
| cargo clippy | 0 warnings | Clean |

---

## What's Coming in beta.2

- Message persistence for PQC Messenger
- iOS/Android VPN service integration for Q-VPN
- Self-destruct UI wiring completion for Quantum Vault
- Q-AI sidebar in ZipBrowser
- Q-Mesh (RuView) QRNG entropy bridge
- Apple Developer code signing for macOS DMG
- TestFlight and Play Store distribution
- Release APK with split-per-abi

---

## Known Limitations

- **ZipBrowser macOS**: Ad-hoc signed (requires `xattr -cr` or copying to writable location before first launch). Apple Developer signing pending.
- **Q-VPN**: Packet wrapping has prototype shortcuts. Full WireGuard kernel integration not yet complete on mobile platforms.
- **PQC Messenger**: No message persistence -- messages exist only during active sessions.
- **Quantum Mail**: Crypto library complete, but no SMTP/IMAP server deployed yet. Email sending/receiving is not functional in this beta.
- **Q-AI Assistant**: Local LLM mode requires users to provide their own model files. No bundled model.
- **Anonymizer L8-L10**: Stubbed by design -- requires Enterprise QRNG allocation for differential privacy and k-anonymity modes.
- **Q-Mesh**: Concept validated only. No code integration between Zipminator and RuView yet.
- **Python .so binding**: Currently built for macOS arm64 only. Other platforms need `maturin develop` from source.

---

## Getting Started

### Web
Visit https://www.zipminator.zip and sign up for the waitlist.

### From Source (Developers)

```bash
# Clone
git clone https://github.com/qdaria/zipminator.git
cd zipminator

# Rust core
cargo test --workspace
cargo build --release

# Python SDK
micromamba activate zip-pqc
uv pip install maturin
maturin develop

# Flutter app
cd app && flutter pub get && flutter run

# Web dashboard
cd web && npm install --legacy-peer-deps && npm run dev

# Tauri browser
cd browser && cargo tauri dev
```

### Run Tests

```bash
cargo test --workspace          # 332 Rust tests
cd app && flutter test          # 23 Flutter tests
cd web && npm test              # 15 web tests
cd mobile && npm test           # 267 mobile tests
```

---

## Technical Details

- **Crypto algorithm**: ML-KEM-768 (NIST FIPS 203)
- **Symmetric cipher**: AES-256-GCM
- **Key derivation**: HKDF-SHA-256
- **Entropy source**: IBM Quantum (156 qubits) via qBraid, Rigetti fallback, OS urandom tertiary
- **Core language**: Rust (no unsafe, constant-time, clippy clean)
- **App framework**: Flutter 3.41.4 + Dart 3.8
- **Bridge**: flutter_rust_bridge v2.11.1
- **State management**: Riverpod 3 (Notifier pattern)
- **Browser**: Tauri 2.x
- **Web**: Next.js 16 + Tailwind + Framer Motion
- **Backend**: FastAPI + PostgreSQL + Redis

---

## About

Built by [QDaria AS](https://qdaria.com) in Norway.

Zipminator implements NIST FIPS 203 (ML-KEM-768). It is **not** FIPS 140-3 certified (CMVP validation is on the roadmap).

For questions, feedback, or security reports: [Open an issue](https://github.com/qdaria/zipminator/issues) or contact the team directly.
