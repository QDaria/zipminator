# Zipminator Investor Demo - Quick Launch

## One-Command Launch
```bash
cd /Users/mos/dev/zipminator/demo && ./start_demo.sh
```

## What You'll See
```
╔════════════════════════════════════════════════════════════╗
║         Zipminator Quantum Entropy Platform               ║
║              Investor Demo Application                     ║
╚════════════════════════════════════════════════════════════╝

[INFO] Environment: ds-quantum (micromamba) OR System Python
[OK] Node.js version: v22.x.x
[OK] Python version: 3.9.x
[INFO] Quantum Entropy: 750 bytes available from IBM ibm_brisbane

Starting Zipminator Demo...
  Frontend: Electron GUI
  Backend: Python Flask API (port 5001)
  Quantum: Real IBM Quantum Hardware (127 qubits)
```

## Features Demonstrated

### Tab 1: Quantum Entropy Generation
- Real quantum entropy from IBM's 127-qubit computer
- Live generation with quality metrics
- **Competitive Edge**: Actual quantum hardware (vs Naoris' false claims)

### Tab 2: Zipminator-Legacy Encryption  
- AES-256 with quantum-seeded keys
- GDPR compliance features (self-destruct, audit trail)
- Drag-and-drop file encryption

### Tab 3: Post-Quantum Kyber768
- NIST FIPS 203 (standardized August 2024)
- Full key generation → encryption → decryption cycle
- Performance metrics: <2ms per operation

## Testing (Optional)
```bash
cd /Users/mos/dev/zipminator/demo
./test_demo.sh
# Expected: 34/34 tests passing
```

## Troubleshooting

**Backend won't start**:
```bash
cd backend
micromamba activate ds-quantum  # or source venv/bin/activate
pip install -r requirements.txt
python3 server.py
```

**Port 5001 in use**:
```bash
lsof -ti:5001 | xargs kill -9
```

**Entropy file missing**:
```bash
cd /Users/mos/dev/zipminator
python3 scripts/qrng_harvester.py  # Regenerates 750 bytes
```

## Full Documentation
See `DEMO_GUIDE.md` for complete 15-minute pitch structure and objection handling.

---
**Ready to Impress Investors!**
