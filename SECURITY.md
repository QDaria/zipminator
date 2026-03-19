# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Zipminator, please report it responsibly.

**Email**: [mo@qdaria.com](mailto:mo@qdaria.com)

Include:
- Description of the vulnerability
- Steps to reproduce
- Affected component(s) and version(s)
- Any potential impact assessment

## Scope

The following components are in scope for security reports:

- `crates/` — Rust cryptographic core (Kyber768 KEM, entropy, key management)
- `src/zipminator/` — Python SDK and PyO3 bindings

## Response Timeline

- **72 hours**: Initial acknowledgment of your report
- **7 days**: Preliminary assessment and severity classification
- **30 days**: Target for patch release (critical vulnerabilities may be faster)

## What to Expect

1. We will acknowledge receipt of your report within 72 hours.
2. We will work with you to understand and validate the issue.
3. We will develop and test a fix.
4. We will release a patch and publicly disclose the issue with credit to you (unless you prefer anonymity).

## What NOT to Do

- **Do not** open a public GitHub issue for security vulnerabilities.
- **Do not** disclose the vulnerability publicly before a fix is available.
- **Do not** exploit the vulnerability beyond what is necessary to demonstrate it.
- **Do not** access, modify, or delete data belonging to other users.
- **Do not** perform denial-of-service attacks against any Zipminator infrastructure.

## Bounty Program

There is no formal bug bounty program at this time. We will credit reporters in release notes and the CHANGELOG unless they prefer to remain anonymous.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.5.x   | Yes       |
| 0.2.x   | Security fixes only |
| < 0.2   | No        |
