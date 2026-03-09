# 07 -- Terminal Prompt Recipes G-I (Browser & Email)

> Extracted from Section 7 of the orchestration guide (Recipes G through I).
> See also: [06-recipes-core.md](06-recipes-core.md) for Recipes A-F,
> [08-recipes-uiux.md](08-recipes-uiux.md) for Recipes J-L.

---

## Recipe G: Phase 8 Research Sprint (Start NOW -- Before Phase 3 Completes)

Phase 8 (ZipBrowser) is the most ambitious phase. The first question -- Chromium fork vs Tauri -- determines the entire architecture. Start research now while Phases 2-3 are in progress.

```
Phase 8 (ZipBrowser) needs deep research before any code.

Spawn 4 researcher subagents in parallel:

1. "chromium-feasibility": Research Chromium fork approach
   - How do Brave, Arc, Vivaldi fork Chromium?
   - What's required to integrate custom TLS (ML-KEM-768)?
   - Build time, binary size, update cadence, licensing
   - Effort: months? years?

2. "tauri-feasibility": Research Tauri desktop browser approach
   - Can Tauri's WebView act as a full browser?
   - How to intercept ALL HTTPS and inject PQC TLS?
   - Does system WebView support TLS extension points?
   - Integration with Rust core (already Rust -- natural fit)

3. "pqc-tls-state-of-art": Research PQC TLS implementations
   - OQS-OpenSSL / OQS-BoringSSL current status
   - ML-KEM-768 in TLS 1.3 -- which CAs support it?
   - Cloudflare/Google PQC TLS experiments
   - Can we proxy all traffic through a local PQC tunnel instead?

4. "ai-browser-landscape": Research competing AI browsers
   - OpenAI Atlas, Browser Company Dia, Perplexity Comet
   - What AI features do users actually want?
   - How do they handle privacy? (none use PQC -- our differentiator)
   - Extension API vs sidebar vs agent mode

After all research completes, synthesize into a decision document:
- Chromium vs Tauri recommendation with trade-offs
- PQC TLS integration strategy
- AI sidebar architecture
- Write findings to docs/guides/phase8-zipbrowser-research.md
Do NOT write code yet.
```

---

## Recipe H: Phase 8 Full Build (After Phase 3 Completes)

This is the hierarchical team-of-teams pattern: a Hive Queen coordinates domain team leads, each lead manages their own agent team.

```
You are the Hive Queen for Zipminator Phase 8 (ZipBrowser).
Use /hive-mind-advanced for supreme coordination.

PREREQUISITE CHECK:
- Phase 3 Q-VPN (PQ-WireGuard) must be complete (needed for embedded VPN)
- Phase 4 OpenClaw AI must be complete (needed for AI sidebar) -- already done
- Read docs/guides/phase8-zipbrowser-research.md for the Chromium vs Tauri decision

DEPENDENCY GRAPH:
  Phase 2 crypto core --> Phase 8 PQC TLS
  Phase 3 Q-VPN -------> Phase 8 embedded VPN
  Phase 4 OpenClaw -----> Phase 8 AI sidebar

HIERARCHICAL ORCHESTRATION:
Create an agent team with 5 domain leads. Each lead should further
delegate to subagents for their domain's subtasks.

DOMAIN LEAD 1: "browser-shell" (Opus)
  Owns: Browser engine setup (Chromium fork OR Tauri, per research decision)
  Subagents:
  - Build system + CI for browser compilation
  - Window management, tab system, navigation chrome
  - Extension/plugin API scaffold
  RALPH loop until: browser launches, loads pages, has tab management

DOMAIN LEAD 2: "pqc-tls" (Opus)
  Owns: All HTTPS connections use ML-KEM-768 key exchange
  Subagents:
  - OQS-BoringSSL integration OR local PQC proxy approach
  - Certificate handling, TLS 1.3 negotiation with PQC
  - Fallback to classical TLS for non-PQC servers
  RALPH loop until: browser connects to any website with PQC when available

DOMAIN LEAD 3: "embedded-vpn" (Sonnet)
  Owns: Q-VPN (PQ-WireGuard) always-on inside browser
  Subagents:
  - Reuse Phase 3's PQ-WireGuard implementation
  - Tunnel all browser traffic through VPN
  - Kill switch: no traffic if VPN drops
  RALPH loop until: all browser traffic routes through PQ-WireGuard

DOMAIN LEAD 4: "ai-sidebar" (Sonnet)
  Owns: OpenClaw AI integration in browser
  Subagents:
  - Sidebar UI (page summarization, agentic tasks, writing assist)
  - Local LLM mode (no data leaves device)
  - PQC tunnel mode for cloud LLM queries
  RALPH loop until: AI can summarize current page and answer questions

DOMAIN LEAD 5: "privacy-engine" (Sonnet)
  Owns: Zero telemetry, QRNG sessions, fingerprint resistance
  Subagents:
  - QRNG-seeded session tokens from quantum_entropy_pool.bin
  - Fingerprint-resistant cookie rotation
  - PQC password manager + form autofill
  - Audit: verify zero telemetry (no data exits without PQC tunnel)
  RALPH loop until: no outbound connections without PQC encryption

CROSS-DOMAIN INTERFACES (Queen enforces):
  browser-shell <-> pqc-tls: TLS hook point where PQC intercepts connections
  browser-shell <-> embedded-vpn: Network layer routing
  browser-shell <-> ai-sidebar: Extension/sidebar API
  privacy-engine <-> all: Entropy pool access, session management

QUALITY GATES:
  - Browser launches and renders pages
  - PQC TLS negotiation succeeds (test against pq.cloudflareresearch.com)
  - All traffic routes through PQ-WireGuard tunnel
  - AI sidebar summarizes a page
  - Zero telemetry audit passes
  - No private keys or entropy bytes in logs

ENTROPY NOTE:
  The quantum entropy pool at quantum_entropy/quantum_entropy_pool.bin is
  append-only and ever-growing. Harvested via qBraid -> IBM Marrakesh/Fez.
  Entropy is reusable (quantum randomness has no memory). The pool is NOT
  consumed -- readers wrap around and reload. The privacy-engine domain
  reads from this pool for session tokens and cookie rotation seeds.
```

See [15-entropy-pool.md](15-entropy-pool.md) for entropy pool details.

---

## Recipe I: Phase 7+8 Parallel Campaign (Maximum Orchestration)

Phase 7 (Email) and Phase 8 (Browser) are independent. Run them simultaneously with two separate agent teams under one Hive Queen.

```
You are the Hive Queen for Zipminator Phases 7 and 8 simultaneously.
Use /hive-mind-advanced for supreme coordination.

These phases are INDEPENDENT -- they share no code dependencies.
Run them as two parallel agent teams.

TEAM ALPHA: Phase 7 (Quantum-Secure Email)
  Lead: "email-lead" (Sonnet)
  Teammates:
  - "mail-server": Postfix/Dovecot + ML-KEM-768 TLS config
  - "webmail-ui": React/Next.js webmail with quantum-purple design
  - "mail-security": PII scanner in compose, self-destruct, L1-L10 attachments
  - "mobile-mail": ZipMail.tsx in Expo app

TEAM BETA: Phase 8 (ZipBrowser)
  Lead: "browser-lead" (Opus)
  Teammates: [Use Recipe H structure above]

SHARED RESOURCES (both teams use):
  - quantum_entropy/quantum_entropy_pool.bin (read-only, ever-growing)
  - crates/zipminator-core/ (Kyber768, existing crypto)
  - src/zipminator/crypto/ (Python PQC wrapper)

Queen's job:
  - Ensure no file conflicts between teams
  - Run RALPH loop per team independently
  - Cross-pollinate: if email team discovers a PQC TLS pattern, share with browser team
  - Final integration verification after both teams complete
```

See [09-ralph-loop.md](09-ralph-loop.md) for RALPH loop details.
