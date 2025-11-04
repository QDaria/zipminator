# Quick Start - Quantum Entropy Harvesting

**Ready in 2 minutes!**

---

## 📁 Where Are The Docs?

All Zipminator analysis docs are in **this project** (qdaria-qrng):

```bash
cd /Users/mos/dev/qdaria-qrng/docs

# Main security analysis
cat ZIPMINATOR_FINAL_VERDICT.md      # Complete security verdict
cat ZIPMINATOR_CLONE_GUIDE.md        # Clone instructions

# Deep security review (if created by agent)
ls -l zipminator-analysis/            # Detailed analysis folder
```

**Note**: These docs are in the **qdaria-qrng** project, not in the cloned zipminator repo!

---

## 🚀 1. Run Your First Quantum Harvest (NOW!)

### Option A: Quick Test (100 bytes, ~30 seconds)
```bash
cd /Users/mos/dev/qdaria-qrng
./scripts/harvest_now.sh 100 ibm_strasbourg
```

### Option B: Production Harvest (1 KB, ~5 minutes)
```bash
./scripts/harvest_now.sh 1000 ibm_fez
```

### Option C: Maximum Monthly Harvest (8 KB, ~10 minutes)
```bash
./scripts/harvest_now.sh 8000 ibm_fez
```

**Output**: Creates `quantum_entropy/entropy_YYYYMMDD_HHMMSS.qep`

---

## ⚙️ 2. Set Up Automated Monthly Harvesting

### Install Cron Job (One Command!)
```bash
./scripts/setup_cron.sh
```

**This will**:
- Automatically harvest on the 1st of every month at 2:00 AM
- Generate 8 KB of quantum entropy
- Use your full 10 minutes of free IBM credits
- Log everything to `logs/quantum_harvest.log`

### Verify It's Working
```bash
# Check cron is configured
crontab -l | grep quantum

# Check logs
tail -f logs/quantum_harvest.log

# Run manually to test
./scripts/monthly_quantum_harvest.sh
```

---

## 📊 3. Check Your Entropy Pool Status

```bash
cd /Users/mos/dev/qdaria-qrng

python3 << 'EOF'
import sys
sys.path.insert(0, 'src/python')
from quantum_entropy_pool import QuantumEntropyPool

# Check latest pool
import glob
pools = sorted(glob.glob('quantum_entropy/*.qep'))
if pools:
    pool = QuantumEntropyPool.open(pools[-1])
    print(f"Entropy Available: {pool.bytes_remaining:,} bytes")
    print(f"Backend: {pool.backend}")
    print(f"Generated: {pool.timestamp}")
    print(f"Kyber-768 Operations: {pool.bytes_remaining // 64} key pairs")
else:
    print("No pools found. Run: ./scripts/harvest_now.sh")
EOF
```

---

## 🎯 Available Scripts

All scripts are in `/Users/mos/dev/qdaria-qrng/scripts/`:

| Script | Purpose | Usage |
|--------|---------|-------|
| `harvest_now.sh` | Manual harvest | `./harvest_now.sh 1000 ibm_fez` |
| `monthly_quantum_harvest.sh` | Automated harvest | Run by cron |
| `setup_cron.sh` | Install automation | `./setup_cron.sh` |
| `test_ibm_token.py` | Validate token | `python3 test_ibm_token.py` |
| `optimal_harvest.py` | Core harvester | Used by scripts |

---

## 🔧 Troubleshooting

### "IBM_QUANTUM_TOKEN not set"
```bash
# Check .env file
cat .env | grep IBM_QUANTUM_TOKEN

# If empty or placeholder, update it:
nano .env
# Set: IBM_QUANTUM_TOKEN="your_actual_token_here"
```

### "python3: command not found"
```bash
# Install Python 3 (macOS)
brew install python3

# Or use system Python
python3 --version
```

### "Permission denied"
```bash
# Make scripts executable
chmod +x scripts/*.sh
```

### Check IBM Token Validity
```bash
python3 scripts/test_ibm_token.py
```

---

## 📈 What Happens After Harvest?

1. **Entropy Generated**: Real quantum random bytes from IBM hardware
2. **Encrypted Storage**: AES-256-GCM with HMAC-SHA256 integrity
3. **Secure Permissions**: File set to 0600 (owner-only)
4. **Ready for Use**: Integrate with Kyber-768 operations

---

## 🎓 Next Steps

### Immediate
- ✅ Run first harvest (`./scripts/harvest_now.sh 100`)
- ✅ Set up automation (`./scripts/setup_cron.sh`)
- ✅ Verify logs (`tail -f logs/quantum_harvest.log`)

### This Week
- Integrate with Kyber-768 implementation
- Run NIST KAT validation
- Performance benchmarking

### This Month
- Deploy to staging
- Monitor automated harvests
- Optimize credit usage

---

## 💡 Tips

1. **Start Small**: Test with 100 bytes first (30 seconds, ~0.1 credits)
2. **Monitor Credits**: Check IBM dashboard regularly
3. **Log Everything**: Review `logs/quantum_harvest.log` weekly
4. **Backup Pools**: Keep old `.qep` files as backup

---

**Ready?** Run your first harvest now:
```bash
cd /Users/mos/dev/qdaria-qrng
./scripts/harvest_now.sh 100
```

🚀 **You'll have real quantum entropy in 30 seconds!**
