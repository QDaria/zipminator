# qBraid Credit Optimization Strategy

## Executive Summary

**Your 1000 qBraid Credits Analysis:**
- **Value**: $10.00 USD (1 credit = $0.01 USD)
- **Shot Range**: 125-1000 shots (depending on QPU selection)
- **Entropy Potential**: 1-8 KB of quantum random numbers
- **Status**: Likely one-time promotional credits

## qBraid Credit System Fundamentals

### Credit Value
- **1 qBraid credit = $0.01 USD**
- **1000 credits = $10.00 total value**

### Pricing Components (Per Quantum Job)

1. **Per-Shot Fee**: 1-8 credits (varies by QPU)
2. **Per-Task Fee**: ~30 credits (flat fee per job submission)
3. **Per-Minute Fee**: Variable (only on certain QPUs like Rigetti Ankaa-3)

### Critical Cost Equation
```
Total Cost = (Shots × Per-Shot-Cost) + Per-Task-Fee + (Minutes × Per-Minute-Cost)

Example:
- 100 shots on 1-credit QPU = 100 + 30 = 130 credits
- 100 shots on 8-credit QPU = 800 + 30 = 830 credits
```

## Provider Cost Analysis

### Available Providers via qBraid

| Provider | Access Method | Per-Shot Cost | Per-Task Fee | Notes |
|----------|--------------|---------------|--------------|-------|
| **IonQ Harmony** | Direct/Braket | 1-3 credits | 30 credits | Most cost-efficient |
| **IonQ Aria** | Direct/Braket/Azure | 3-5 credits | 30 credits | Requires min 2500 shots for error mitigation |
| **Rigetti Aspen** | Braket | 2-4 credits | 30 credits | Mid-range cost |
| **Rigetti Ankaa-3** | Azure | 4-6 credits | 30 credits | Has per-minute charges |
| **Oxford Lucy** | Direct | 5-8 credits | 30 credits | Premium pricing |

**Note**: IBM Quantum is NOT directly available via qBraid (must use IBM Quantum Experience separately)

## Optimization Strategies

### Strategy A: Maximum Entropy per Credit (RECOMMENDED)

**Goal**: Generate maximum random bytes from 1000 credits

**Implementation**:
1. **Choose IonQ Harmony** (lowest per-shot cost: 1 credit)
2. **Optimize shot batching**:
   ```python
   # Maximize shots per job
   per_shot_cost = 1  # credit
   per_task_cost = 30  # credits
   total_budget = 1000  # credits

   # Calculate optimal batch size
   shots_per_job = 970  # (1000 - 30 overhead)
   total_entropy = shots_per_job * 8 / 8  # 970 bytes

   # OR: Multiple smaller jobs for redundancy
   num_jobs = 3
   budget_per_job = 323  # credits
   shots_per_job = (323 - 30) = 293 shots
   total_entropy = 293 * 3 * 8 / 8 = 2,637 bytes
   ```

**Expected Output**:
- **Single large job**: ~970 bytes (0.95 KB)
- **3 medium jobs**: ~2.6 KB
- **10 small jobs**: Inefficient (300 credits wasted on overhead)

### Strategy B: Quality over Quantity

**Goal**: Generate highest-quality entropy with error mitigation

**Implementation**:
1. **Use IonQ Aria with error mitigation**
2. **Minimum requirement**: 2500 shots
3. **Cost calculation**:
   ```
   Per-shot: 5 credits
   Shots: 2500
   Task fee: 30 credits
   Total: (2500 × 5) + 30 = 12,530 credits

   PROBLEM: Exceeds 1000 credit budget!
   ```

**Verdict**: Not feasible with 1000 credits

### Strategy C: Multi-Qubit Entropy Maximization

**Goal**: Extract more bits per shot using multi-qubit circuits

**Implementation**:
```python
# Standard single-qubit: 1 bit per shot
# Multi-qubit 8-bit circuit: 8 bits per shot

per_shot_cost = 1  # credit (IonQ Harmony)
per_task_cost = 30  # credits
shots = 970
qubits = 8  # measure 8 qubits simultaneously

entropy_bits = shots * qubits  # 7,760 bits
entropy_bytes = 7760 / 8  # 970 bytes

# With multiple jobs (3 jobs)
total_entropy = 2,637 bytes × 8 qubits = 21,096 bytes (~20.6 KB!)
```

**Expected Output**: **~20-21 KB** with 3 jobs using 8-qubit circuits

### Strategy D: Hybrid Multi-Platform Approach (MAXIMUM FREE ENTROPY)

**Combine all free resources:**

| Platform | Monthly Allocation | Entropy Potential | Renewable? |
|----------|-------------------|-------------------|------------|
| **qBraid** | 1000 credits (one-time) | ~21 KB (8-qubit) | No* |
| **IBM Quantum** | 10 min/month | ~8-50 KB/month | Yes (monthly) |
| **AWS Braket** | $0 (via qBraid) | Included in qBraid | No |
| **Azure Quantum** | Free tier? | TBD | Possibly |

**Total First Month**: ~29-71 KB
**Ongoing Monthly**: ~8-50 KB (IBM only)

*Unless you can obtain additional promotional credits

## Tactical Recommendations

### Immediate Actions (Within 1000 Credits)

1. **Test Run (50 credits)**:
   ```python
   # Validate setup before committing all credits
   shots = 20
   qubits = 1
   cost = (20 × 1) + 30 = 50 credits
   ```

2. **Primary Harvest (900 credits)**:
   ```python
   # 3 jobs of ~293 shots each with 8-qubit circuits

   Job 1: 293 shots × 8 qubits = 2,344 bits (293 bytes)
   Job 2: 293 shots × 8 qubits = 2,344 bits (293 bytes)
   Job 3: 293 shots × 8 qubits = 2,344 bits (293 bytes)

   Total: ~20.6 KB of quantum entropy
   ```

3. **Reserve Buffer (50 credits)**:
   - Keep for debugging/retries

### Long-Term Strategy

**Phase 1: One-Time Harvest (Now)**
- Use 1000 qBraid credits immediately
- Generate ~20 KB entropy
- Store in secure location

**Phase 2: Recurring Free Tier (Monthly)**
- Set up IBM Quantum 10-min allocation
- Generate ~8-50 KB/month (depending on optimization)
- Automate monthly harvesting

**Phase 3: Credit Acquisition**
- Complete qBraid tutorials for bonus credits
- Apply for academic/research grants
- Participate in quantum hackathons (often offer credits)
- Monitor promotional campaigns

## Credit Preservation vs. Immediate Use

### Arguments for IMMEDIATE USE:
1. **Expiration risk**: Promotional credits may expire
2. **Account changes**: qBraid may modify credit policies
3. **Current need**: You need entropy NOW for your QRNG system
4. **IBM backup**: You have IBM as ongoing source

### Arguments for PRESERVATION:
1. **Emergency reserve**: Save for critical future needs
2. **Better algorithms**: Wait for improved QRNG circuits
3. **Price drops**: Future credits might be cheaper
4. **Platform stability**: Ensure qBraid remains viable

**RECOMMENDATION**: Use 900 credits now, preserve 100 for emergencies

## Cost Comparison with Other Platforms

### Per-Kilobyte Entropy Cost

| Platform | Cost per KB | Renewable | Best For |
|----------|-------------|-----------|----------|
| **qBraid (IonQ)** | ~$0.50/KB | No* | One-time bulk harvest |
| **IBM Quantum** | $0.00/month | Yes | Ongoing production |
| **AWS Braket** | ~$0.30/KB | Pay-as-go | Scalability |
| **Azure Quantum** | ~$0.25/KB | Pay-as-go | Enterprise |

**Verdict**: IBM Quantum is most cost-effective for ONGOING use; qBraid is best for IMMEDIATE one-time harvest.

## Earning Additional Free Credits

### Confirmed Methods:
1. **New account signup**: 1000 credits (already obtained)
2. **Academic verification**: Request academic pricing/grants
3. **Tutorial completion**: Check qBook tutorials for rewards
4. **Referral program**: Unknown if exists
5. **Hackathon participation**: Often includes credit prizes

### Research Required:
- Contact qBraid support about academic grants
- Check for active promotional campaigns
- Look for partnership programs (e.g., university affiliations)

## Final Recommendations

### For Your 1000 Credits:

**OPTIMAL CONFIGURATION**:
```yaml
provider: "IonQ Harmony"  # Lowest cost
access_method: "Direct qBraid"
strategy: "Multi-qubit maximum entropy"

jobs:
  - shots: 293
    qubits: 8
    expected_cost: 323 credits
    expected_entropy: ~2.3 KB

  - shots: 293
    qubits: 8
    expected_cost: 323 credits
    expected_entropy: ~2.3 KB

  - shots: 293
    qubits: 8
    expected_cost: 323 credits
    expected_entropy: ~2.3 KB

reserve: 31 credits (for retries)

total_entropy: ~7 KB (raw) → ~20-21 KB (with 8-qubit circuits)
```

### Combined Strategy (qBraid + IBM):

**Month 1**:
- qBraid: ~20 KB (one-time)
- IBM: ~8 KB
- **Total: ~28 KB**

**Month 2+**:
- IBM: ~8 KB/month
- **Ongoing sustainable source**

**Long-term**: Your QRNG system will primarily rely on IBM Quantum's 10-min free tier, with qBraid as initial bootstrap.

## Next Steps

1. **Verify credit status**: Check qBraid dashboard for expiration date
2. **Test connection**: Run 50-credit test job
3. **Execute harvest**: Run 3 × 323-credit jobs
4. **Validate entropy**: Test randomness with NIST suite
5. **Set up IBM**: Configure IBM Quantum as ongoing source
6. **Document results**: Track actual entropy vs. projections

## Questions to Research

1. Do qBraid credits expire? (Check terms of service)
2. Is there a monthly credit refresh?
3. Can you purchase additional credits at educational rates?
4. Are there bulk discounts for larger credit purchases?
5. Does qBraid offer research grants for academic projects?

---

**Last Updated**: 2025-10-30
**Next Review**: After first test job completion
