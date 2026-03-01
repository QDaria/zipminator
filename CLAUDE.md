# Zipminator Development Guide

## Project Structure
- `crates/` -- Rust workspace (Kyber768 core, fuzz, NIST-KAT, benchmarks)
- `src/zipminator/` -- Python package with PyO3 bindings
- `api/` -- FastAPI REST backend
- `web/` -- Next.js dashboard
- `tests/` -- All tests (Python, Rust, integration)
- `docs/guides/` -- Documentation

## Build Commands
```
# Rust
cargo test --workspace
cargo build --release

# Python (with Rust bindings)
pip install maturin
maturin develop

# API
cd api && pip install -r requirements.txt && uvicorn src.main:app

# Web
cd web && npm install && npm run dev

# Full stack
docker-compose up
```

## Testing
```
cargo test --workspace          # Rust tests
pytest tests/                   # Python tests
cargo fuzz run fuzz_keygen      # Fuzzing
```

## Key Architecture Decisions
- Rust Kyber768 is the crypto engine, exposed to Python via PyO3/maturin
- Entropy pool aggregates from Rigetti, IBM Quantum, QBraid with OS fallback
- PII scanning runs automatically before encryption (configurable)
- Self-destruct uses DoD 5220.22-M 3-pass overwrite

## Code Conventions
- Rust: clippy clean, no unsafe, constant-time crypto ops
- Python: ruff + black, type hints, pytest
- Max file length: 500 lines
