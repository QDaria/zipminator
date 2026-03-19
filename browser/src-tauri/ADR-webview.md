# ADR: System WebView vs Custom Browser Engine

**Status:** Accepted
**Date:** 2026-03-17

## Decision
ZipBrowser uses the platform's native WebView (WKWebView on macOS, WebView2 on Windows) via Tauri 2.x.

## Rationale
A custom browser engine (Chromium/Gecko fork) was evaluated and rejected:
- ~150MB binary size increase
- Ongoing security patch maintenance burden
- No PQC benefit -- TLS interception happens at our PQC proxy layer regardless of WebView engine

The PQC proxy intercepts all traffic before it reaches any WebView engine, so the security posture is identical whether using system WebView or a custom engine.

## Consequences
- Smaller binary (5.7MB DMG vs estimated ~160MB)
- Automatic security updates via OS updates
- Minor rendering differences across platforms (acceptable trade-off)
