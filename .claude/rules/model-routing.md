# Model Routing by Domain

## Opus Tier (deep reasoning, security-critical)
Trigger: files in crates/, browser/src-tauri/src/vpn/, browser/src-tauri/src/proxy/
Keywords: security, crypto, constant-time, PQC, Kyber, entropy, FIPS, audit
Use for: architecture decisions, security audits, FIPS compliance, crypto implementations

## Sonnet Tier (balanced, feature work)
Trigger: files in web/, mobile/src/, api/, browser/src/
Keywords: implement, feature, component, API, endpoint, test, service
Use for: React components, API endpoints, test suites, service implementations

## Haiku Tier (fast, low-cost)
Trigger: *.md, *.json, *.toml (non-crypto config), *.css
Keywords: format, lint, rename, typo, docs, config, style
Use for: documentation, configuration, formatting, simple renames

## Agent Team Routing
When spawning agent teams, route each agent independently:
- Rust crypto agent -> Opus
- Web UI agent -> Sonnet
- Test runner agent -> Sonnet
- Doc updater agent -> Haiku

## Learning
Log routing decisions. Run /self-improve periodically to refine routing based on outcomes.
Helper: .claude/helpers/model-router.sh
