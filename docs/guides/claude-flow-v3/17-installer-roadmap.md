# 17 -- One-Click Installer Roadmap

> Desktop installer via Tauri 2.x. Mobile via Expo/React Native.

---

## Strategy

- **Desktop**: Tauri 2.x (macOS .dmg, Windows .msi/.exe, Linux .AppImage/.deb)
- **Mobile**: Keep existing Expo/React Native (mobile/ directory)
- **Crypto core**: Statically linked from crates/zipminator-core/ (no Python runtime)
- **Auto-update**: tauri-plugin-updater with minisign signatures on GitHub Releases

## Current State

The `browser/src-tauri/` directory has a Tauri 2.x skeleton ("ZipBrowser") with:
- PQC TLS proxy (rustls-post-quantum)
- VPN module (boringtun + pqcrypto-kyber)
- AI sidebar (reqwest streaming)
- Privacy engine (aes-gcm, argon2)
- Vite + React 18 frontend

## Phase 1: Foundation (1-2 days)

1. Generate icons from `web/public/logos/Zipminator_0.svg`:
   ```bash
   npx tauri icon path/to/1024x1024.png
   ```
2. Rename in `browser/src-tauri/tauri.conf.json`:
   - productName: "ZipBrowser" -> "Zipminator"
   - identifier: "com.qdaria.zipbrowser" -> "com.qdaria.zipminator"
3. Add zipminator-core dependency to browser/src-tauri/Cargo.toml:
   ```toml
   zipminator-core = { path = "../../crates/zipminator-core", default-features = false }
   ```
4. Remove standalone [workspace] from browser/src-tauri/Cargo.toml
5. In root Cargo.toml: move browser/src-tauri from exclude to members
6. Verify: `cd browser && npm run build && cargo build --release`

## Phase 2: Installer Config (1 day)

- Add full bundle config (macOS/Windows/Linux sections) to tauri.conf.json
- Create Entitlements.plist for macOS
- Generate Tauri update signing keypair
- Run `npx tauri build` locally on macOS to validate .dmg output

## Phase 3: Auto-Update (1 day)

- Add tauri-plugin-updater dependency
- Configure update endpoint (GitHub Releases)
- Add update check on app launch

## Phase 4: CI/CD Pipeline (1-2 days)

- Create .github/workflows/release-desktop.yml
- 4-platform matrix: macOS ARM, macOS Intel, Windows, Linux
- ~15 min parallel build time
- Artifact sizes: 8-18 MB per platform (vs 80-150 MB for Electron)

## Phase 5: Code Signing (1-2 weeks calendar)

- Apple Developer Program ($99/yr) + notarization
- Windows Authenticode ($200-500/yr)
- Total: ~$400/year minimum

## Key Files

| File | Action |
|------|--------|
| browser/src-tauri/tauri.conf.json | Rename, add bundle config, add updater |
| browser/src-tauri/Cargo.toml | Add zipminator-core dep, remove [workspace] |
| Cargo.toml (root) | Move browser/src-tauri to members |
| browser/src-tauri/icons/ | Regenerate from SVG |
| .github/workflows/release-desktop.yml | CREATE (Phase 4) |

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| aws-lc-rs Windows cross-compile | Test early; fallback to ring |
| Apple notarization rejection | Sign all bundled binaries |
| Large binary (>50 MB) | Use Cargo features for optional modules |
| Workspace version conflicts | Use [patch] or keep separate workspaces |
