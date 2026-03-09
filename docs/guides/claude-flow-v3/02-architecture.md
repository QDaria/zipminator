# 02 -- Architecture & File Map

> Extracted from Section 3 of the orchestration guide.
> See also: [01-project-state.md](01-project-state.md) for completion status.

---

## File Map

```
zipminator/
├── crates/zipminator-core/       # Rust Kyber768 + PyO3 bindings
│   └── src/
│       ├── lib.rs                # Main lib
│       ├── python_bindings.rs    # PyO3 bridge
│       ├── ratchet.rs            # PQC Double Ratchet (in progress)
│       └── ffi.rs                # C/FFI bridge (in progress)
├── src/zipminator/               # Python SDK package
│   ├── __init__.py               # Imports _core.abi3.so
│   ├── cli.py                    # Typer CLI
│   ├── crypto/
│   │   ├── pqc.py                # PQC wrapper (Rust or fallback)
│   │   └── quantum_random.py     # Robindra quantum RNG module
│   └── messenger/
│       └── signaling.py          # FastAPI WebSocket signaling
├── api/                          # FastAPI REST backend
├── web/                          # Next.js 16 landing + dashboard
│   └── components/               # 15+ React components
├── demo/
│   ├── backend/server.py         # Flask demo backend (all API endpoints)
│   ├── src/app.js                # React SPA (CDN, no build)
│   ├── gov-demo/                 # Government evaluation installer
│   └── run.sh                    # Launches Flask + HTTP server
├── mobile/                       # React Native / Expo (in progress)
├── scripts/
│   └── qrng_harvester.py         # Quantum entropy harvester
├── quantum_entropy/              # Entropy pool directory
│   └── quantum_entropy_pool.bin  # Growing pool (gitignored)
├── tests/                        # Python, Rust, integration tests
├── docs/guides/                  # Developer guides (9+ files)
└── .claude/
    ├── skills/                   # 80+ skill definitions
    ├── agents/                   # 85 agent definitions
    └── settings.json             # Claude Code local settings
```
