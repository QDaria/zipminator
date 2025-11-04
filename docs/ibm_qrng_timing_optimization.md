# IBM Quantum QRNG Timing Optimization Guide

**Date**: 2025-10-30
**Version**: 1.0
**Author**: Zipminator Development Team

---

## 🎯 Executive Summary

**Your Question**: "Are the quantum random numbers being rolled every few seconds or minutes?"

**Short Answer**: Each quantum job takes **3-6 minutes** to complete due to queue time, but you can harvest **1000 shots at once** to get 1KB of entropy per job. This is FAR more efficient than generating numbers every few seconds.

---

## ⏱️ IBM Quantum Timing Breakdown

### Single 8-bit Number (Your Current Approach)

```
Job Submission → Queue Wait → Execution → Result Retrieval
     ↓              ↓            ↓              ↓
   <1 sec        3-6 min      <1 sec         <1 sec

Total Time: ~3-6 minutes for 1 byte (8 bits)
```

**From your notebook output:**
- Job 1 (ibm_sherbrooke): Generated 1 byte (decimal 144)
- Job 2 (ibm_brisbane): Generated 1 byte (decimal 77)
- Each job: ~3-6 minutes queue + execution time

### Problem with Current Approach ❌

```
Cost-Benefit Analysis:
- Time per byte: 3-6 minutes
- Free tier limit: 10 minutes/month
- Total bytes possible: ~2-3 bytes/month
- Entropy per credit: 0.2 bytes/minute
```

**This is EXTREMELY inefficient!**

---

## ✅ Optimal Strategy: Batch Harvesting

### Recommended: 1000 Shots Per Job

```
Job Submission → Queue Wait → Execution (1000 shots) → Result Retrieval
     ↓              ↓            ↓                          ↓
   <1 sec        3-6 min      <1 sec                    <1 sec

Total Time: ~3-6 minutes for 1000 bytes (1 KB)
Cost: Same queue time, 1000x more entropy!
```

### Efficiency Comparison

| Approach | Time | Bytes | Efficiency |
|----------|------|-------|------------|
| **1 shot** (your current) | 5 min | 1 byte | 0.2 bytes/min |
| **100 shots** | 5 min | 100 bytes | 20 bytes/min |
| **1000 shots** (optimal) | 5 min | 1000 bytes | **200 bytes/min** |
| **4096 shots** (max) | 5 min | 4096 bytes | 819 bytes/min |

**1000 shots = 1000x more efficient!**

---

## 📊 Free Tier Credit Management

### IBM Quantum Free Tier
- **Total Credits**: 10 minutes/month
- **Queue Time**: 3-6 minutes per job (counted against your credits)
- **Execution Time**: <1 second (minimal credit usage)

### Optimal Harvesting Strategy

**Option 1: Conservative (Recommended)**
```
Jobs per month: 2 jobs
Shots per job: 1000 shots
Interval: 2 weeks
Total entropy: 2 KB/month (2000 bytes)
Credit usage: 6-10 minutes (full allocation)
```

**Option 2: Maximum Throughput**
```
Jobs per month: 2-3 jobs
Shots per job: 4096 shots (max efficiency)
Interval: 1-2 weeks
Total entropy: 8-12 KB/month
Credit usage: 9-10 minutes (near limit)
```

**Option 3: Monthly Harvest**
```
Jobs per month: 1 job
Shots per job: 4096 shots
Interval: 30 days
Total entropy: 4 KB/month
Credit usage: 3-5 minutes (50% allocation)
Safety margin: High (5+ minutes remaining)
```

---

## 🎯 Recommended Timing Schedule

### Production Deployment Strategy

**Phase 1: Initial Harvest (Week 1)**
```bash
# Generate large entropy pool
python src/python/ibm_qrng_harvester.py --shots 4096

# Result: 4 KB quantum entropy stored in pool
# Credit usage: ~5 minutes
# Remaining: 5 minutes
```

**Phase 2: Refill (Week 3)**
```bash
# Check pool status
python -c "from quantum_entropy_pool import QuantumEntropyPool; \
           pool = QuantumEntropyPool.open('entropy.qep'); \
           print(f'Bytes remaining: {pool.bytes_remaining}')"

# Refill if below 1 KB
if [ $(bytes_remaining) -lt 1024 ]; then
    python src/python/ibm_qrng_harvester.py --shots 4096
fi
```

**Phase 3: Monthly Maintenance**
```bash
# Automated monthly harvest (cron job)
0 0 1 * * /path/to/harvest_quantum_entropy.sh --shots 4096
```

---

## 💡 Why NOT Generate Every Few Seconds?

### Technical Limitations

**1. Queue Time Dominates**
```
Queue Wait: 3-6 minutes
Job Execution: <1 second
Result Retrieval: <1 second

Total: 99.9% waiting, 0.1% computing
```

**2. Credit Exhaustion**
```
If you tried to generate every 5 seconds:
- Jobs needed: 43,200 jobs/day
- Credit required: 216,000 minutes (~150 days of credits)
- Actual free tier: 10 minutes total

Result: You'd run out in the first minute!
```

**3. Rate Limiting**
IBM enforces:
- Max 5 concurrent jobs
- Min 5 seconds between submissions
- Account suspension for abuse

---

## 🚀 Optimal Workflow: "Harvest Once, Use All Month"

### The Right Way

```
┌─────────────────────────────────────────┐
│ Step 1: Harvest (5 minutes, once/month) │
│   python ibm_qrng_harvester.py --shots 4096 │
│   → Generates 4 KB entropy pool          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ Step 2: Store in Encrypted Pool         │
│   entropy.qep file (AES-256 encrypted)  │
│   → 4096 bytes available                 │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ Step 3: Use Continuously (instant)      │
│   Kyber-768 KeyGen: 32 bytes            │
│   Kyber-768 Encaps: 32 bytes            │
│   → 64 crypto operations with 4 KB pool │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ Step 4: Monitor & Refill                │
│   When pool < 1 KB: Harvest again       │
│   → 2 harvests/month = 8 KB total       │
└─────────────────────────────────────────┘
```

---

## 📈 Usage Patterns

### Kyber-768 Entropy Requirements

**Per Key Generation:**
- Seed generation: 32 bytes
- Public key randomness: 32 bytes
- **Total**: 64 bytes per key pair

**With 4 KB Entropy Pool:**
```
Number of key pairs: 4096 / 64 = 64 key pairs
Time to generate 64 keys: <1 second (instant pool access)
Need to refill after: 64 operations
```

### Real-World Scenarios

**Scenario 1: VPN Server**
- Key pairs per day: 10
- Bytes per day: 640 bytes
- 4 KB pool lasts: 6.4 days
- Harvests per month: ~5 (only need 2 with 4096 shots)

**Scenario 2: TLS Certificate Authority**
- Certificates per day: 100
- Bytes per day: 6400 bytes (6.4 KB)
- 4 KB pool lasts: ~15 hours
- Harvests per month: Need paid tier (>10 min)

**Scenario 3: IoT Device Fleet**
- Devices: 1000
- Key rotation: Monthly
- Bytes per month: 64,000 bytes (64 KB)
- Solution: Paid tier required OR distribute to 10 free accounts

---

## ⚙️ Automated Harvesting Scripts

### Monthly Cron Job

```bash
#!/bin/bash
# /etc/cron.monthly/harvest_quantum_entropy.sh

# Environment variables
export IBM_QUANTUM_TOKEN="your_token_here"
export ENTROPY_POOL_PATH="/var/lib/zipminator/quantum_entropy.qep"

# Check pool status
BYTES_REMAINING=$(python3 -c "
from quantum_entropy_pool import QuantumEntropyPool
pool = QuantumEntropyPool.open('$ENTROPY_POOL_PATH')
print(pool.bytes_remaining)
")

# Refill if below 1 KB
if [ $BYTES_REMAINING -lt 1024 ]; then
    echo "Pool low ($BYTES_REMAINING bytes), harvesting..."
    python3 /usr/local/bin/ibm_qrng_harvester.py --shots 4096 --output "$ENTROPY_POOL_PATH"
    echo "Harvest complete!"
else
    echo "Pool sufficient ($BYTES_REMAINING bytes), skipping harvest"
fi
```

### Smart Scheduling

```python
# scripts/ibm_scheduler.py

from datetime import datetime, timedelta

def calculate_next_harvest(pool_bytes, daily_usage):
    """
    Calculate optimal next harvest time.

    Args:
        pool_bytes: Current bytes in pool
        daily_usage: Average bytes consumed per day

    Returns:
        datetime: When to harvest next
    """
    # Keep 3-day buffer
    buffer_days = 3
    days_remaining = pool_bytes / daily_usage

    if days_remaining < buffer_days:
        return datetime.now()  # Harvest immediately
    else:
        harvest_date = datetime.now() + timedelta(days=days_remaining - buffer_days)
        return harvest_date

# Example usage
pool_bytes = 4096
daily_usage = 640  # 10 Kyber key pairs/day

next_harvest = calculate_next_harvest(pool_bytes, daily_usage)
print(f"Next harvest scheduled: {next_harvest.strftime('%Y-%m-%d')}")
# Output: Next harvest scheduled: 2025-11-02 (3 days from now)
```

---

## 🎯 Best Practices Summary

### ✅ DO

1. **Batch Harvest**: 1000-4096 shots per job
2. **Monthly Schedule**: 1-2 harvests per month max
3. **Monitor Pool**: Check remaining bytes weekly
4. **Buffer Management**: Keep 3-day supply minimum
5. **Secure Storage**: Encrypt entropy pool at rest
6. **Rate Limiting**: Respect 5-second minimum between jobs

### ❌ DON'T

1. **Don't Generate Per-Second**: Wastes credits (99.9% queue time)
2. **Don't Submit Small Jobs**: 1-10 shots is inefficient
3. **Don't Ignore Limits**: 10 minutes/month is strict
4. **Don't Run Without Monitoring**: Track credit usage
5. **Don't Forget Fallback**: Have classical RNG backup
6. **Don't Expose Tokens**: Use environment variables

---

## 📊 Credit Usage Calculator

### Interactive Calculation

```python
def calculate_credits(shots, num_jobs):
    """Calculate credit usage for planned harvesting."""

    # Average queue + execution time
    minutes_per_job = 5  # Conservative estimate

    # Calculate totals
    total_minutes = minutes_per_job * num_jobs
    total_bytes = shots * num_jobs

    # Efficiency metrics
    bytes_per_minute = total_bytes / total_minutes if total_minutes > 0 else 0
    free_tier_max_bytes = 10 * (shots / minutes_per_job)  # Max with 10 min

    print(f"Harvest Plan:")
    print(f"  Shots per job: {shots}")
    print(f"  Number of jobs: {num_jobs}")
    print(f"  Total bytes: {total_bytes}")
    print(f"  Total credits: {total_minutes:.1f} minutes")
    print(f"  Efficiency: {bytes_per_minute:.1f} bytes/minute")
    print(f"")
    print(f"Free Tier Analysis:")
    print(f"  Credits used: {(total_minutes/10)*100:.1f}%")
    print(f"  Within limit: {'✓' if total_minutes <= 10 else '✗'}")
    print(f"  Max possible: {free_tier_max_bytes:.0f} bytes/month")

# Example calculations
print("=== Conservative Strategy ===")
calculate_credits(shots=1000, num_jobs=2)

print("\n=== Optimal Strategy ===")
calculate_credits(shots=4096, num_jobs=2)

print("\n=== Maximum Strategy ===")
calculate_credits(shots=4096, num_jobs=3)
```

**Output:**
```
=== Conservative Strategy ===
Harvest Plan:
  Shots per job: 1000
  Number of jobs: 2
  Total bytes: 2000
  Total credits: 10.0 minutes
  Efficiency: 200.0 bytes/minute

Free Tier Analysis:
  Credits used: 100.0%
  Within limit: ✓
  Max possible: 2000 bytes/month

=== Optimal Strategy ===
Harvest Plan:
  Shots per job: 4096
  Number of jobs: 2
  Total bytes: 8192
  Total credits: 10.0 minutes
  Efficiency: 819.2 bytes/minute

Free Tier Analysis:
  Credits used: 100.0%
  Within limit: ✓
  Max possible: 8192 bytes/month

=== Maximum Strategy ===
Harvest Plan:
  Shots per job: 4096
  Number of jobs: 3
  Total bytes: 12288
  Total credits: 15.0 minutes
  Efficiency: 819.2 bytes/minute

Free Tier Analysis:
  Credits used: 150.0%
  Within limit: ✗
  Max possible: 8192 bytes/month
```

---

## 🎓 Key Takeaways

1. **Timing**: Don't generate every few seconds/minutes - harvest once per month with 1000-4096 shots
2. **Efficiency**: Batching is 1000x more efficient than single-shot generation
3. **Credits**: Free tier is 10 minutes/month - use wisely with 2-3 large harvests
4. **Storage**: Store entropy in encrypted pool, use instantly as needed
5. **Monitoring**: Track usage, refill when pool < 1 KB
6. **Production**: 4 KB pool = 64 Kyber key pairs, lasts ~week with moderate use

---

## 📞 Questions?

**Q: Can I generate quantum numbers on-demand?**
A: No - queue time makes this impractical. Harvest in advance, store in pool.

**Q: How long does a 4096-shot job take?**
A: 3-6 minutes (mostly queue wait, <1 sec execution).

**Q: How often should I harvest?**
A: 1-2 times per month for most applications.

**Q: What if I run out of credits?**
A: Automatic fallback to /dev/urandom (still cryptographically secure).

**Q: Can I upgrade to paid tier?**
A: Yes - IBM Quantum paid tier provides more credits and priority access.

---

**Status**: ✅ **TIMING OPTIMIZATION COMPLETE**
**Recommendation**: Harvest 4096 shots bi-weekly (2x/month)
**Expected Entropy**: 8 KB/month
**Credit Usage**: 100% of free tier (optimal)

🚀 **Ready for efficient quantum entropy harvesting!**
