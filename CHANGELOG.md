# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2026-04-02

### Added
- Python SDK v0.5.0 general availability on PyPI: `pip install zipminator` (extras: `data`, `anonymization`, `cli`, `quantum`, `jupyter`, `email`, `benchmark`, `dev`, `all`)
- API-key gating: L1-L3 anonymisation free; L4+ requires `ZIPMINATOR_API_KEY`
- 429 passing tests (17 skipped for optional backends)

### Changed
- Graduated from `0.5.0b1` beta to stable. All public APIs frozen for 0.5.x.

## [flutter-build-43] - 2026-04-06

### Added
- Flutter super-app published to TestFlight as Build 43 (`v0.5.0+43`)
- 11 feature screens (Vault, Messenger, VoIP, Q-VPN, Anonymiser, Q-AI, Mail, Browser, Mesh, Settings, Dashboard)
- 17 Riverpod 3 providers wiring the Rust bridge to the UI layer
- Supabase OAuth (GitHub / Google / LinkedIn / Apple) verified on physical iOS device

### Fixed
- iPhone messenger routing (live- prefix mismatch)
- VoIP answer detection and WebRTC audio path
- macOS deployment target set to 13.0 with camera/mic entitlements

## [mesh-wave-1] - 2026-03-20

### Added
- `crates/zipminator-mesh/` six physical-cryptography modules:
  - `csi_entropy.rs` — Von Neumann debiased CSI entropy harvester
  - `puek.rs` — Physical Unclonable Environment Key via SVD eigenstructure
  - `em_canary.rs` — 4-level electromagnetic threat escalation
  - `vital_auth.rs` — WiFi-derived biometric continuous authentication
  - `topo_auth.rs` — Graph-topology-invariant mesh authentication
  - `spatiotemporal.rs` — Presence-proof non-repudiation signatures
- 106 mesh tests (90 unit + 16 integration)
- Total workspace test count: 513

## [paper-1-eprint-cycle] - 2026-04-06

### Changed
- Paper 1 "Quantum-Certified Anonymization" strengthened after first ePrint cycle with IND-ANON definition, composition theorem, and UC-security treatment. Target venue: PoPETs 2027 (deadline 2026-05-31).

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
