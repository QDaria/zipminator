# TDD-First + RALPH Loop

Every code modification follows Red/Green/Refactor. No exceptions.

## TDD Protocol
- Write a failing test BEFORE implementation code
- Run the test, confirm it fails (Red)
- Write minimum code to pass (Green)
- Refactor while tests stay green (Refactor)

## RALPH Phases (non-trivial changes)
- R: Read specs, existing code, Context7 docs. Spawn researcher if needed.
- A: Design solution. AskUserQuestion if architecture trade-offs exist.
- L: TDD cycle. Failing test first.
- P: Run /simplify. Remove dead code, improve naming.
- H: Security audit for crates/. Run full test suite. Playwright screenshot for UI.

## Quality Gates (ALL must pass)
- `cargo test --workspace` (Rust)
- `cd web && npx next build` (Web, if touched)
- `cd mobile && npm test` (Mobile, if touched)
- `cd browser/src-tauri && cargo test` (Browser, if touched)
- `cargo clippy --workspace -- -D warnings` (Rust lint)
- Playwright screenshot for any UI change
- No private keys in code, constant-time crypto ops verified

## Crypto Code (crates/, browser/src-tauri/src/vpn/, browser/src-tauri/src/proxy/)
- Always use `--effort max` reasoning tier
- Verify constant-time operations
- Run cargo fuzz if touching keygen/encapsulate/decapsulate

## Iteration Cap
Max 12 RALPH iterations per task. If still failing, escalate to user.
Script: `bash docs/guides/claude-flow-v3/scripts/ralph-loop.sh`
