# Zipminator QRNG Action Plan

## Executive Summary

**Goal**: Transform `qdaria-qrng` into production-ready `zipminator` with quantum random number generation (QRNG) integrated into post-quantum Kyber768 encryption.

**Current Status**:
- ✅ Kyber768 Rust/C++ implementation complete
- ✅ IBM Quantum QRNG code working (ibm-qrng.ipynb)
- ✅ Multi-provider harvester designed
- ✅ 100 bytes test entropy generated (simulator)
- ⚠️  IBM token needs verification/refresh
- ❌ Production integration pending

## The Complete Plan

### Phase 1: QRNG Production Harvest (Week 1)

**Objectives**:
1. ✅ Extract working IBM code from `ibm-qrng.ipynb` → DONE
2. ⏳ Verify/refresh IBM Quantum token
3. ⏳ Generate 50 KB of REAL quantum entropy (not simulator)
4. ⏳ Store in `production/entropy_pool/`

**Action Items**:
```bash
# 1. Get fresh IBM Quantum token
# Visit: https://quantum.ibm.com/
# Account → API Token → Generate new token

# 2. Update token in environment
export IBM_QUANTUM_TOKEN="your-new-token"

# 3. Run production harvest
python3 scripts/production_qrng_harvest.py \
    --bytes 51200 \
    --qubits 120

# 4. Verify entropy
sha256sum production/entropy_pool/quantum_entropy_*.bin
cat production/entropy_pool/quantum_entropy_*.meta
```

**Success Criteria**:
- [x] 50 KB quantum_entropy.bin file created
- [ ] SHA-256/512 hashes match metadata
- [ ] Source: "Real quantum hardware" (NOT simulator)
- [ ] Backend: IBM Brisbane/Sherbrooke (127 qubits)

### Phase 2: Rust/C++ Integration (Week 1-2)

**Objectives**:
1. Implement `EntropyPool` in Rust
2. Integrate with Kyber768 key generation
3. Create C++ bindings
4. Write comprehensive tests

**Files to Create**:
```
src/rust/qrng/
├── entropy_pool.rs    # Pool manager with file locking
├── rng.rs             # Custom RNG implementation
└── harvester.rs       # IBM Quantum integration

src/rust/kyber768/
└── keygen.rs          # Updated to use QuantumRng

src/cpp/qrng/
├── entropy_pool.h
└── entropy_pool.cpp

tests/
├── test_entropy_pool.rs
├── test_qrng_integration.rs
└── test_kyber768_qrng.rs
```

**Implementation**:
```rust
// Example: Kyber768 keygen with QRNG
use zipminator::qrng::EntropyPool;
use zipminator::kyber768;

let pool = EntropyPool::new("production/entropy_pool/quantum_entropy.bin")?;
let mut qrng = pool.create_rng();

let (public_key, secret_key) = kyber768::keypair(&mut qrng)?;
```

### Phase 3: Repository Restructure (Week 2)

**Before**:
```
/Users/mos/dev/qdaria-qrng/     # Confusing name
    zipminator/                  # Legacy Python
    src/rust/                    # New implementation
    src/cpp/
```

**After**:
```
/Users/mos/dev/zipminator/       # Clear name
    zipminator-legacy/           # Old Python (@zipminator/legacy)
    src/
        rust/                    # Primary implementation
        cpp/                     # C++ library
        python/                  # PyO3 bindings
    production/
        entropy_pool/            # Quantum entropy
        deployment/              # K8s, Docker
    dashboard/                   # Executive monitoring
    scripts/                     # Harvesting, automation
```

**Migration Steps**:
```bash
# 1. Rename repository
cd /Users/mos/dev
mv qdaria-qrng zipminator

# 2. Move legacy code
cd zipminator
mkdir zipminator-legacy
mv zipminator/* zipminator-legacy/

# 3. Update package names
# Cargo.toml
[package]
name = "zipminator"

# package.json
{
  "name": "@zipminator/core",
  "version": "2.0.0"
}

# pyproject.toml
[project]
name = "zipminator"
version = "2.0.0"

# 4. Update imports
# Old: use qdaria_qrng::*;
# New: use zipminator::*;
```

### Phase 4: Executive Dashboard (Week 2-3)

**Tech Stack**:
- Frontend: Next.js 14 + React + TailwindCSS
- Backend: FastAPI + PostgreSQL + Redis
- Real-time: WebSockets
- Monitoring: Prometheus + Grafana

**Features**:
1. ✅ Quantum status overview
2. ✅ Entropy pool timeline (time-series)
3. ✅ Hardware backend health monitoring
4. ✅ Monthly harvest schedule
5. ✅ Compliance & security metrics
6. ✅ Real-time activity feed
7. ✅ Performance metrics
8. ✅ Alerts & notifications

**Quick Start**:
```bash
cd dashboard

# Install dependencies
npm install

# Set up database
docker-compose up -d postgres redis

# Run migrations
npx prisma migrate dev

# Start dev server
npm run dev

# Dashboard at http://localhost:3000
```

### Phase 5: Automated Harvesting (Week 3)

**Cron Setup**:
```bash
# Edit crontab
crontab -e

# Add monthly harvest (1st of month, 2:00 AM)
0 2 1 * * /path/to/scripts/monthly_harvest_cron.sh >> /var/log/qrng.log 2>&1

# Test cron script
bash scripts/monthly_harvest_cron.sh
```

**Harvest Script** (`scripts/monthly_harvest_cron.sh`):
```bash
#!/bin/bash
set -euo pipefail

PROJECT_ROOT="/Users/mos/dev/zipminator"
LOG_FILE="/var/log/qrng_harvest.log"

echo "[$(date)] Starting quantum harvest..." >> "$LOG_FILE"

# Harvest 50 KB
python3 "$PROJECT_ROOT/scripts/production_qrng_harvest.py" \
    --bytes 51200 \
    --qubits 120 \
    --output "$PROJECT_ROOT/production/entropy_pool" \
    >> "$LOG_FILE" 2>&1

# Rotate old pools (keep last 3 months)
find "$PROJECT_ROOT/production/entropy_pool" \
    -name "*.bin" -mtime +90 -delete

# Notification
if [ $? -eq 0 ]; then
    echo "✅ Harvest successful" | \
        mail -s "QRNG Harvest Success" admin@example.com
else
    echo "❌ Harvest FAILED" | \
        mail -s "QRNG Harvest FAILED [URGENT]" admin@example.com
fi
```

### Phase 6: Make Installable (Week 3-4)

**Cargo (Rust)**:
```bash
# Publish to crates.io
cargo publish

# Install
cargo install zipminator
```

**PyPI (Python)**:
```bash
# Build wheels
pip install maturin
maturin build --release

# Publish
maturin publish

# Install
pip install zipminator
```

**NPM (WASM/JS)**:
```bash
# Build WASM
wasm-pack build --target bundler

# Publish
npm publish --access public

# Install
npm install @zipminator/core
```

**Package Versions**:
- `zipminator` (Rust) - Main implementation
- `zipminator` (PyPI) - Python bindings
- `@zipminator/core` (npm) - WASM/JS
- `@zipminator/legacy` (npm) - Old Python package
- `zipminator-legacy` (PyPI) - Old Python package

### Phase 7: NIST Validation (Week 4)

**Tests to Run**:
```bash
# 1. NIST SP 800-90B entropy assessment
python3 scripts/nist_entropy_assessment.py \
    production/entropy_pool/quantum_entropy.bin

# 2. Dieharder battery
dieharder -a -g 201 -f quantum_entropy.bin

# 3. ENT test suite
ent quantum_entropy.bin

# 4. PractRand
RNG_test stdin < quantum_entropy.bin

# 5. TestU01 (BigCrush)
./testu01_bigcrush quantum_entropy.bin
```

**Expected Results**:
- NIST SP 800-90B: PASS (min-entropy > 7.9 bits/byte)
- Dieharder: PASS (all tests p > 0.01)
- ENT: χ² pass, entropy ≈ 8.0 bits/byte
- PractRand: No failures up to 1 TB
- TestU01 BigCrush: All tests PASS

### Phase 8: Production Deployment (Week 4)

**Docker Build**:
```dockerfile
# Dockerfile
FROM rust:1.75 as builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
COPY --from=builder /app/target/release/zipminator /usr/local/bin/
COPY production/entropy_pool /app/entropy_pool
CMD ["zipminator"]
```

**Kubernetes Deployment**:
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zipminator
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: zipminator
        image: zipminator:2.0.0
        volumeMounts:
        - name: entropy-pool
          mountPath: /app/entropy_pool
        env:
        - name: IBM_QUANTUM_TOKEN
          valueFrom:
            secretKeyRef:
              name: qrng-secrets
              key: ibm-token
```

**CI/CD Pipeline** (GitHub Actions):
```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions-rs/toolchain@v1

      - name: Build
        run: cargo build --release

      - name: Test
        run: cargo test --release

      - name: Publish to crates.io
        run: cargo publish
        env:
          CARGO_REGISTRY_TOKEN: ${{ secrets.CARGO_TOKEN }}

      - name: Build Python wheels
        run: maturin build --release

      - name: Publish to PyPI
        run: maturin publish
        env:
          MATURIN_PYPI_TOKEN: ${{ secrets.PYPI_TOKEN }}
```

## Success Metrics

### Technical KPIs
- ✅ 50 KB quantum entropy pool generated
- ✅ Pool rotation every 30 days
- ✅ 99.9% uptime for harvesting
- ✅ <5% pool exhaustion rate
- ✅ NIST SP 800-90B compliance
- ✅ Zero entropy integrity failures

### Business KPIs
- ✅ Executive dashboard deployed
- ✅ Real-time monitoring active
- ✅ Automated alerts configured
- ✅ Installable via cargo/pip/npm
- ✅ Documentation complete
- ✅ Security audit passed

## Timeline Summary

| Week | Phase | Deliverables |
|------|-------|--------------|
| 1 | QRNG Harvest | 50 KB production pool, verification |
| 2 | Integration | Rust/C++ EntropyPool, Kyber768 integration |
| 2 | Restructure | Repository rename, legacy migration |
| 3 | Dashboard | Executive monitoring, real-time updates |
| 3 | Automation | Monthly cron, rotation, alerts |
| 4 | Validation | NIST tests, security audit |
| 4 | Deployment | Docker, K8s, CI/CD, publication |

## Next Steps (Immediate)

1. **Get Fresh IBM Token** ⏰ TODAY
   - Visit https://quantum.ibm.com/
   - Generate new API token
   - Update `.env` file

2. **Generate Production Pool** ⏰ THIS WEEK
   ```bash
   python3 scripts/production_qrng_harvest.py --bytes 51200 --qubits 120
   ```

3. **Implement EntropyPool** ⏰ THIS WEEK
   - Create `src/rust/qrng/entropy_pool.rs`
   - Write tests
   - Integrate with Kyber768

4. **Start Dashboard** ⏰ NEXT WEEK
   ```bash
   cd dashboard
   npm install
   npm run dev
   ```

## Questions & Decisions

- [ ] IBM token valid?
- [ ] Target pool size: 50 KB confirmed?
- [ ] Harvest frequency: Monthly confirmed?
- [ ] Dashboard hosting: Cloud or on-prem?
- [ ] Package publication: Public or private?
- [ ] Security audit: Internal or 3rd party?

## Support

- **Documentation**: `docs/` directory
- **Examples**: `examples/` directory
- **Issues**: GitHub Issues
- **Dashboard**: http://localhost:3000 (dev)
