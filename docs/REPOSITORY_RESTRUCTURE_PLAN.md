# Repository Restructure Plan

## Current State
- `zipminator/` - Original Python package (legacy)
- `/Users/mos/dev/qdaria-qrng/` - New Rust/C++ implementation with QRNG

## Proposed Structure

```
zipminator/                          # Main repo (renamed from qdaria-qrng)
├── README.md                        # New unified README
├── Cargo.toml                       # Rust workspace
├── package.json                     # NPM package
├── pyproject.toml                   # Python bindings
│
├── src/
│   ├── rust/                        # Rust implementation
│   │   ├── kyber768/               # Post-quantum crypto
│   │   └── qrng/                   # Quantum RNG integration
│   ├── cpp/                         # C++ implementation
│   │   ├── kyber768/               # CRYSTALS-Kyber
│   │   └── qrng/                   # Entropy pool
│   └── python/                      # Python bindings
│       └── bindings.rs             # PyO3 bindings
│
├── production/
│   ├── entropy_pool/               # Production quantum entropy
│   │   ├── quantum_entropy_*.bin  # Raw binary pools
│   │   ├── quantum_entropy_*.hex  # Hex format
│   │   └── quantum_entropy_*.meta # Metadata
│   └── deployment/                 # K8s, Docker, Helm
│
├── zipminator-legacy/              # Original Python package
│   ├── zipminator/                 # @zipminator/zipminator-legacy
│   ├── README.md                   # Legacy docs
│   └── pyproject.toml             # Poetry config
│
├── scripts/
│   ├── production_qrng_harvest.py # IBM Quantum harvester
│   ├── monthly_harvest_cron.sh    # Automated harvesting
│   └── install.sh                  # Installation script
│
├── dashboard/                      # Executive monitoring
│   ├── src/                       # React/Next.js dashboard
│   └── api/                       # FastAPI backend
│
└── docs/
    ├── ARCHITECTURE.md
    ├── QRNG_INTEGRATION.md
    └── INSTALLATION.md
```

## Migration Steps

1. **Rename Repository**
   - `qdaria-qrng` → `zipminator`
   - Update all GitHub references

2. **Move Legacy Code**
   - `zipminator/` → `zipminator-legacy/`
   - Publish as `@zipminator/legacy` on npm
   - Keep on PyPI as `zipminator-legacy`

3. **New Package Names**
   - Rust: `zipminator` (cargo)
   - Python: `zipminator` (PyPI, replaces old package)
   - NPM: `@zipminator/core` (new)
   - Legacy: `@zipminator/legacy` (old Python)

4. **Installation**
   ```bash
   # Rust (primary)
   cargo install zipminator

   # Python bindings
   pip install zipminator

   # NPM (WASM/JS)
   npm install @zipminator/core

   # Legacy Python
   npm install @zipminator/legacy
   pip install zipminator-legacy
   ```

## Phases

### Phase 1: QRNG Integration (Current)
- [x] Generate real quantum entropy from IBM
- [ ] Integrate with Rust/C++ Kyber768
- [ ] Production entropy pool (10KB+)
- [ ] Automated monthly harvesting

### Phase 2: Repository Restructure
- [ ] Rename qdaria-qrng → zipminator
- [ ] Move legacy code to zipminator-legacy/
- [ ] Update package.json, Cargo.toml, pyproject.toml
- [ ] Update all imports and references

### Phase 3: Executive Dashboard
- [ ] Real-time QRNG monitoring
- [ ] Entropy pool status
- [ ] Hardware backend health
- [ ] Monthly harvest schedule
- [ ] Compliance metrics

### Phase 4: Production Release
- [ ] NIST KAT validation
- [ ] Performance benchmarks
- [ ] Security audit
- [ ] Docker/K8s deployment
- [ ] CI/CD pipelines

## Timeline
- **Week 1**: QRNG integration complete
- **Week 2**: Repository restructure
- **Week 3**: Dashboard + automation
- **Week 4**: Production release
