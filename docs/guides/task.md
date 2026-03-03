# Zipminator Super-App: Master Checklist

## Phase 1: Foundation & The Vault (In Progress)

- [x] Configure Tailwind CSS (NativeWind) in the Expo project.
- [x] Implement `ExpertiseContext` for toggling Novice/Expert modes.
- [x] Create the main dashboard layout and `FileVault` UI.
- [x] Port the `KeyGenerator` component logic to React Native UI.
- [x] Implement Native/Rust bridges for device-side ML-KEM and local file encryption.
- [x] Create Rust `build_rust_mobile.sh` cross-compilation pipeline for iOS/Android JSI.

## Phase 2: Quantum Secure Messenger

- [x] Build WebRTC signaling endpoints in the backend.
- [x] Build React Native Chat UI (Messages, Contacts).
- [x] Implement Post-Quantum Double Ratchet for message keys.
- [x] Implement `SignalingService` and `PqcMessengerService` in mobile.

## Phase 3: VoIP, Video & Q-VPN

- [x] Build UI Layout for VoIP Call Screens and Q-VPN toggles.
- [x] Implement WebRTC signaling for PQC VoIP calls.
- [x] Integrate React Native WebRTC natively for camera and microphone access.
- [x] Secure media streams with PQ-SRTP negotiation.
- [x] Build native iOS `NetworkExtension` and Android `VpnService` for PQ-WireGuard.

## Phase 4: Big Data, AI, & Anonymization

- [x] Build UI flows for the 10-Level Anonymization System.
- [x] Implement the `AdvancedAnonymizer` Python module (L1-L10 logic).
- [x] Port Legacy `Zipndel` (Zip-and-Delete) logic to the PQC Vault.
- [x] Integrate QRNG (IBM Marrakesh) for Levels 7-10 noise injection.
- [x] Develop the "OpenClaw" Chatbot UI for in-app AI interactions.
- [x] Connect JupyterLab & `zip-pqc` micromamba environment endpoints for desktop users.

## Phase 5: Agentic Systems (MCP Server) [TDD & Parallel]

- [x] Expand `Zipminator MCP Server` with `AdvancedAnonymizer` tools.
- [x] Implement PQC Cryptography tools (Kyber, Dilithium).
- [x] Create binary-level QRNG entropy harvesting tools.
- [x] **TDD**: Write Python tests for all MCP tool endpoints.

## Phase 6: Custom Agentic Workflows & Skills (Slash Commands)

- [x] **Slash Command: `/anonymize-vault`**: L1-L10 processing + PQC encryption.
- [x] **Slash Command: `/pqc-shield`**: Activates PQ-WireGuard.
- [x] **Slash Command: `/quantum-status`**: Entropy telemetry.
- [x] **Agent Skill: `PQC-Expert`**: Specialized system prompts.

## Phase 7: Quantum-Secure Email (`@zipminator.zip`)

- [ ] Register `zipminator.zip` domain and configure DNS (MX, SPF, DKIM, DMARC).
- [x] Deploy PQC-secured SMTP/IMAP mail server (ML-KEM-768 TLS).
- [x] Build webmail UI with quantum-purple design language.
- [x] Integrate PII scanner into compose flow (auto-warn on sensitive data).
- [x] Implement self-destructing emails (timer + read-receipt).
- [x] Add 10-level anonymization for outgoing attachments.
- [x] Build mobile `ZipMail.tsx` component in Expo app.
- [x] QRNG-seeded session tokens and per-message encryption keys.

## Phase 8: ZipBrowser — PQC AI Browser

- [x] Fork Chromium or build Tauri desktop browser shell.
- [x] Integrate PQC TLS (ML-KEM-768 for all HTTPS connections).
- [x] Embed Q-VPN (PQ-WireGuard) as always-on browser tunnel.
- [x] Integrate OpenClaw AI sidebar (summarize, agentic tasks, writing).
- [x] QRNG-seeded session tokens and fingerprint-resistant cookie rotation.
- [x] Zero telemetry architecture (no data exits without PQC tunnel).
- [x] PQC password manager extension and form autofill.
- [x] Mobile browser component via WebView with PQC proxy.
