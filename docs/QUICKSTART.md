# IBM Quantum QRNG Harvester - Quick Start

## 🚀 Get Started in 60 Seconds

### 1. Install Dependencies

```bash
pip install qiskit qiskit-ibm-runtime qiskit-aer pyyaml cryptography numpy
```

### 2. Get IBM Quantum Token

Go to: https://quantum.ibm.com/account

### 3. Set Token

```bash
export IBM_QUANTUM_TOKEN="your_token_here"
```

### 4. Run First Harvest

```bash
./scripts/harvest_quantum_entropy.sh
```

That's it! You'll get ~1KB of quantum random bytes in `data/quantum_entropy/`.

---

## 📊 Common Usage Patterns

### Pattern 1: Quick Test (100 shots)

```bash
./scripts/harvest_quantum_entropy.sh --shots 100
```

- **Time**: ~5 minutes (mostly queue time)
- **Credits**: ~5 credits
- **Entropy**: 100 bytes

### Pattern 2: Standard Harvest (1000 shots) ⭐ RECOMMENDED

```bash
./scripts/harvest_quantum_entropy.sh --shots 1000
```

- **Time**: ~5-6 minutes
- **Credits**: ~5 credits
- **Entropy**: 1000 bytes (1KB)
- **Best efficiency**: 200 bytes/credit

### Pattern 3: Batch Harvest (5 jobs x 1000 shots)

```bash
./scripts/harvest_quantum_entropy.sh --batch 5
```

- **Time**: ~30-40 minutes total
- **Credits**: ~25-30 credits
- **Entropy**: 5000 bytes (5KB)
- **Best for**: Maximizing free tier

### Pattern 4: Estimate Only (No Harvest)

```bash
./scripts/harvest_quantum_entropy.sh --estimate --shots 2000
```

Shows credit and time estimates without running actual harvest.

---

## 💡 Pro Tips

1. **Best Time to Run**: US night time (UTC 6:00-12:00) for shorter queues
2. **Optimal Shots**: 1000-2000 shots per job
3. **Batch Mode**: Use for large entropy needs (5-10 jobs)
4. **Free Tier**: You get 10 minutes/month (~50-60KB maximum)
5. **Check Token**: Tokens expire after 6-12 months

---

## 🔍 Verify Your Harvest

```bash
# List harvested files
ls -lh data/quantum_entropy/

# View metadata
cat data/quantum_entropy/quantum_entropy_*.json | jq

# Check logs
tail logs/ibm_qrng_harvester.log
```

---

## 🆘 Troubleshooting

### Token Error
```bash
export IBM_QUANTUM_TOKEN="your_new_token_here"
```

### Job Timeout
```bash
./scripts/harvest_quantum_entropy.sh --shots 500  # Reduce shots
```

### Health Check Failed
```bash
# Just retry - quantum hardware varies
./scripts/harvest_quantum_entropy.sh
```

---

## 📚 Next Steps

- Read full guide: `docs/ibm_qrng_harvester_guide.md`
- Configure: Edit `config/ibm_qrng_config.yaml`
- Python API: See guide for programmatic usage

---

## 🎯 Quick Reference

| Command | Description |
|---------|-------------|
| `--shots N` | Number of quantum measurements |
| `--batch N` | Run N jobs sequentially |
| `--estimate` | Show cost estimate only |
| `--no-encrypt` | Disable output encryption |
| `--token TOKEN` | Provide token via CLI |
| `--help` | Show full help |

**Default Token Location**: Environment variable `IBM_QUANTUM_TOKEN`

**Default Output**: `data/quantum_entropy/quantum_entropy_TIMESTAMP.bin`

---

**Status**: ✅ Production Ready | **Version**: 1.0.0 | **Updated**: 2025-01-30
