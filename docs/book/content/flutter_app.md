# Flutter Super-App

Zipminator ships as a Flutter super-app for macOS, Windows, Linux, iOS, Android, and Web from a single Dart codebase in `app/`. Build 43 (`v0.5.0+43`) has been live on TestFlight since 2026-04-06. This chapter documents the platform matrix, installation, architecture, and each of the 11 feature screens.

## Platform matrix

| Platform | Status | Notes |
|----------|--------|-------|
| iOS | TestFlight (Build 43, 2026-04-06) | Public review pending |
| macOS | `flutter build macos` | Desktop-sized layouts |
| Windows | `flutter build windows` | Desktop-sized layouts |
| Linux | `flutter build linux` | Desktop-sized layouts |
| Android | Google Play Store submission pending | Same APK can be side-loaded for internal testing |
| Web | `flutter build web` | Feature subset; no native bridges |

```{note}
The Web target currently disables the Rust-backed VPN and Mesh screens because those features require the native `flutter_rust_bridge` surface. Everything else, including crypto-core primitives compiled to WebAssembly, works.
```

## Install (end-users)

### iOS via TestFlight

1. Install the TestFlight app from the App Store.
2. Email `testflight@zipminator.zip` with your Apple ID.
3. Accept the invite link when it arrives.
4. Future builds auto-update inside TestFlight.

### Android via Play Store

The Play Store submission is queued. A note here will confirm when public download opens. In the meantime, Android users can request an APK through the same TestFlight channel and side-load it.

### Desktop

Desktop builds are produced via the standard Flutter tooling:

```bash
cd app
flutter build macos     # or windows, linux
```

The resulting bundle lives under `build/macos/Build/Products/Release/`.

## Run locally (developers)

### Prerequisites

- Flutter 3.41.4 or newer
- Rust toolchain (for the `flutter_rust_bridge` build step)
- Xcode (for iOS / macOS), Android Studio (for Android)

### Setup

```bash
git clone https://github.com/QDaria/zipminator
cd zipminator/app
flutter pub get
flutter run -d macos           # or ios, windows, linux, android, chrome
```

```{tip}
On a fresh clone, the first build regenerates the `flutter_rust_bridge` Dart bindings. This can take a few minutes on a cold build cache.
```

### Environment variables

The app expects a `.env` file at `app/.env` with Supabase credentials:

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=...
```

The file is gitignored. For TestFlight builds, the same values are injected at build time so the IPA carries them.

## Architecture

The app follows a strict separation between UI, state, and native code.

```
app/
  lib/
    features/        # One folder per feature screen
    providers/       # 17 Riverpod providers
    router/          # GoRouter definitions
    theme/           # Material 3 Quantum theme
    bridge/          # Generated flutter_rust_bridge bindings
```

### State management

State is organised around Riverpod 3 providers. The 17 providers cover auth, crypto, entropy, messenger, VoIP, vault, VPN, mail, browser, mesh, AI, settings, dashboard counters, and navigation state. Providers are auto-disposed when their consumer trees unmount.

### Routing

GoRouter drives navigation. Routes are declared in `router/app_router.dart` and use typed route parameters where applicable.

### Native bridge

`flutter_rust_bridge` v2.11.1 connects Dart to the Rust crate at `crates/zipminator-app/`, which exposes 16 FRB functions covering:

- Keygen, encapsulate, decapsulate
- Entropy pool read / mix / status
- Anonymisation pipeline entry points
- Vault open / close / rotate
- Mesh presence proof generation
- VPN tunnel control

### Theme

The Material 3 Quantum theme uses the OKLCH colour tokens from `.claude/rules/01-stack.md`. Fonts are Fraunces (display), DM Sans (body), and JetBrains Mono (code).

## Feature screens (11)

### Vault

Encrypted local store for credentials, notes, and files. Uses the Rust Kyber768 core for wrap / unwrap. Auto-locks on inactivity.

### Messenger

End-to-end encrypted text messenger with a PQC ratchet. Coordinates rendezvous through the Fly.io signalling server. Offline messages queue locally and deliver on reconnect.

### VoIP

PQC voice calls using the same signalling server. Audio pipeline tuned on-device; end-to-end latency verified on iPhone 14 Pro (2026-04-01).

### Q-VPN

Post-quantum tunnel with configurable exit regions. The core tunnel logic lives in `browser/src-tauri/src/vpn/`; the Flutter screen is the control surface. Production VPN servers are staged but not yet deployed.

### Anonymiser

UI over the anonymisation pipeline. Accepts structured input (CSV, JSON), runs it through the configured level, and exports a certified transcript.

### Q-AI

Local AI assistant gated through the Q-Mesh clearance model. Answers queries without leaking prompt content to a third-party model provider.

### Mail

End-to-end encrypted mail, compatible with IMAP / SMTP for delivery. Messages are PQC-wrapped before handoff to the mail transport.

### Browser

Thin Flutter shell over the Tauri PQC browser that lives at `browser/src-tauri/`. Shares the same PQC tunnel as Q-VPN.

### Mesh

Status panel for the Q-Mesh stack from [Q-Mesh: Physical Cryptography Wave 1](mesh_wave1.md). Shows threat level, mesh topology, and presence-proof log.

### Settings

Controls for theme, security policies, auto-lock timing, clearance level, and entropy source preferences.

### Dashboard

Top-level overview: recent activity, subscription state, and links into each feature screen.

## Rust bridge

The Rust bridge crate exposes 16 FRB functions. A representative slice:

```dart
final kp = await rust.keygenKyber768();
final ct = await rust.encapsulate(publicKey: kp.publicKey);
final ss = await rust.decapsulate(secretKey: kp.secretKey, ciphertext: ct.ciphertext);
```

All bridge calls run on a Rust worker isolate so the UI thread stays responsive.

## Auth

The app uses Supabase OAuth with four providers: GitHub, Google, LinkedIn, and Apple. On iOS, the Apple provider is the default per App Store guidelines when other social logins are offered.

```{warning}
If a login hangs after provider consent, verify that `app/.env` is present and that both `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set for the build target.
```

## Related chapters

- [Installation](installation.md), base install path
- [Getting started](getting_started.md), first encrypted payload
- [Releases](releases.md), what's new in recent builds
- [Q-Mesh: Physical Cryptography Wave 1](mesh_wave1.md), mesh stack shown in the Mesh screen
- [Subscription](subscription.md), subscription level gating in each screen
