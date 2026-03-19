# Contributing to Zipminator

Thank you for your interest in contributing to Zipminator. This guide covers the workflow, quality standards, and conventions you need to follow.

## Getting Started

1. Fork the repository on GitHub.
2. Clone your fork locally.
3. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
4. Make your changes following the guidelines below.
5. Push your branch and open a Pull Request against `main`.

## Development Setup

### Rust

```bash
cargo build --workspace
cargo test --workspace
```

### Python

```bash
micromamba activate zip-pqc
uv pip install maturin
maturin develop
pytest tests/python/
```

## TDD Required

All code changes must follow Test-Driven Development (Red/Green/Refactor):

1. **Red**: Write a failing test that defines the expected behavior.
2. **Green**: Write the minimum code to make the test pass.
3. **Refactor**: Clean up while keeping tests green.

Do not submit PRs with untested code. If you are fixing a bug, add a regression test first.

## Quality Gates

All of the following must pass before a PR will be merged:

```bash
# Rust
cargo clippy --workspace -- -D warnings
cargo test --workspace

# Python
ruff check src/ tests/
pytest tests/python/
```

If your change touches crypto code in `crates/`, also run:

```bash
cargo fuzz run fuzz_keygen -- -max_total_time=60
```

## Code Style

### Rust
- Clippy clean with `-D warnings` (zero warnings policy)
- No `unsafe` blocks unless absolutely necessary and thoroughly documented
- Constant-time operations for all cryptographic code
- Maximum file length: 500 lines

### Python
- Formatter: `black`
- Linter: `ruff`
- Type hints on all public functions
- Maximum file length: 500 lines

## Commit Messages

Use conventional commit format:

```
feat: add quantum entropy scheduler
fix: correct KAT vector comparison for edge case
test: add regression test for empty ciphertext
docs: update API reference for encapsulate()
```

## DCO Sign-Off

All commits must include a Developer Certificate of Origin sign-off line:

```
Signed-off-by: Your Name <your.email@example.com>
```

Add this automatically with `git commit -s`. By signing off, you certify that you wrote the code or have the right to submit it under the project's license (Apache-2.0).

## Pull Request Checklist

- [ ] Branch created from latest `main`
- [ ] Failing test written before implementation
- [ ] All quality gates pass locally
- [ ] Commit messages follow conventional format
- [ ] All commits have DCO sign-off
- [ ] No files exceed 500 lines
- [ ] No hardcoded secrets, API keys, or credentials
- [ ] CHANGELOG.md updated (for user-facing changes)

## What We Accept

- Bug fixes with regression tests
- New features with tests and documentation
- Performance improvements with benchmarks
- Security hardening of cryptographic code
- Test coverage improvements

## What We Do Not Accept

- Changes that break existing tests without justification
- Code with `unsafe` blocks in crypto paths without security review
- PRs without tests
- Cosmetic-only changes (formatting, whitespace) unless part of a larger PR

## Code of Conduct

This project follows the [Contributor Covenant v2.1](CODE_OF_CONDUCT.md). Please read it before participating.

## Questions?

Open a GitHub Discussion or email [mo@qdaria.com](mailto:mo@qdaria.com).
