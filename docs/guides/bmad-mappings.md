# BMAD (Behavior, Motivation, Ability, Design) Gamification Logic

This guide maps out the Zipminator gamified user progression logic for the front-end animations and unlocking mechanism.

## 1. Behavior (The Target Action)
- **Target**: Users successfully dragging-and-dropping sensitive files into the PQC-encrypted vault, or utilizing the web app to spin up a multi-agent Hive-Mind session.
- **Micro-animation**: "Glass" modal reveals itself smoothly on drag-over, triggering standard Tailwind `obsidian` deep dark contrasts.

## 2. Motivation (The Reward)
- **Extrinsic**: Earning "Quantum Tokens" or unlocking "Investor-Sexy" particle effects during the anonymization phase. 
- **Intrinsic**: Experiencing 100% zero-hallucination peace of mind using the PQC pipeline. 
- **Mapping in Code**: `bmad.reward` colors triggered inside `tailwind.config.js` when an anonymization phase passes verification.

## 3. Ability (Lowering the Friction)
- **Action**: Leveraging the `zip-pqc` micromamba environment directly via a 1-click JupyterLab extension or out-of-the-box Windows installer.
- **Interface**: Utilizing the ModelRouter logic ensuring users do not need to configure API keys for free tiers. The system auto-routes to Gemini 3 Flash / Sonnet silently.

## 4. Design (The Prompt/Visual Trigger)
- **Visuals**: `QuantumBackground.tsx` pulses in correlation to network latency and active parallel universes computed.
- **Entanglement VFX**: Bright lasers pairing nodes when the user groups files logically.
- **Superposition VFX**: Files entering the "encryption state" exhibit ghosted/blurred states via Framer Motion until wave-function collapse (encryption complete).
