# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0b1] - 2026-03-16

### Added
- Python SDK rewrite with PyO3 bindings to Rust Kyber768 core
- 10-level data anonymization engine (hashing through homomorphic encryption)
- PII scanner with 15-country coverage (US, UK, UAE, NO, SE, DK, FI, EU, DE, FR, IN, BR, JP, CA, AU)
- Quantum entropy harvester with scheduler daemon (IBM Quantum, qBraid, Rigetti)
- Entropy quota management system (Free/Developer/Pro/Enterprise tiers)
- Pool-based entropy provider with thread-safe file reads and OS fallback
- Subscription gating with API key validation and activation codes
- CLI tools: `zipminator keygen`, `zipminator entropy`
- QuantumRandom drop-in replacement for Python's `random` module
- Self-destruct with DoD 5220.22-M 3-pass overwrite
- JupyterLab magics and widgets
- Universal installer scripts for macOS, Linux, and Windows
- Jupyter Book documentation (20 pages, 5 use cases)
- Community files (SECURITY.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md)
- CI with Python 3.9-3.13 matrix testing
- 162 Python tests, 413 Rust tests (575 total)

### Changed
- Repository moved from `MoHoushmand/zipminator-pqc` to `QDaria/zipminator`
- License classifier corrected from MIT to Apache-2.0
- Contact email updated to mo@qdaria.com
- Entropy factory priority: Pool -> qBraid -> IBM -> Rigetti -> API -> OS

### Fixed
- Stale repository URLs across all configuration files
- License classifier mismatch in pyproject.toml

## [0.2.0] - 2025-11-15

### Added
- Rust CRYSTALS-Kyber-768 implementation (from-scratch, constant-time)
- NTT layer with Montgomery and Barrett reductions
- PyO3 bindings for Python (`keypair`, `encapsulate`, `decapsulate`)
- NIST FIPS 203 Known Answer Test validation via deterministic DRBG
- Four `cargo-fuzz` targets (keygen, encapsulate, decapsulate, round-trip)
- Quantum entropy pool with IBM Quantum (Fez, Marrakesh) via qBraid
- macOS ARM64 installer script
- Basic PII scanning (US, UK, UAE)
- 255 Rust tests passing

### Security
- All secret-dependent operations use `subtle` crate for constant-time arithmetic
- `csubq()` with arithmetic masking (no conditional branches)
- `zeroize` for automatic secret key cleanup

## [0.1.0] - 2025-09-01

### Added
- Initial project scaffolding
- Cargo workspace with `zipminator-core` crate
- Basic Kyber768 key generation

[0.5.0b1]: https://github.com/QDaria/zipminator/compare/v0.2.0...v0.5.0b1
[0.2.0]: https://github.com/QDaria/zipminator/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/QDaria/zipminator/releases/tag/v0.1.0
