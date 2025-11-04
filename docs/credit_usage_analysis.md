# IBM Quantum Credit Usage Analysis

## Overview

This document provides a detailed analysis of IBM Quantum credit usage for quantum entropy harvesting operations, with specific focus on IBM Brisbane (127-qubit system).

## Credit Model

IBM Quantum credits are based on **queue time**, not qubit count or circuit complexity.

### Key Factors:
- **Queue Time**: Time spent waiting in queue before execution
- **Execution Time**: Actual circuit execution time (minimal)
- **Backend Load**: Number of pending jobs affects queue time

### Typical Rates:
- **Free Tier**: 10 minutes/month of quantum computing time
- **Premium Plan**: Pay-per-use at ~0.5-1.0 credits per minute
- **Enterprise**: Custom pricing

## Strategy Comparison

### Objective: Generate 1000 bytes of quantum entropy

| Strategy | Qubits | Shots | Bytes/Shot | Total Bytes | Job Submissions | Efficiency |
|----------|--------|-------|------------|-------------|-----------------|------------|
| **Naive** | 8 | 1000 | 1 | 1000 | 1000 | 1.0 bytes/shot |
| **Moderate** | 64 | 125 | 8 | 1000 | 125 | 8.0 bytes/shot |
| **Optimal** | 120 | 67 | 15 | 1005 | 67 | 15.0 bytes/shot |

### Analysis:

#### Strategy 1: Naive (8 qubits × 1000 shots)
- **Pros**: Simple implementation
- **Cons**:
  - 1000 separate job submissions
  - High overhead per submission
  - Inefficient use of quantum resources
  - Estimated queue time: 15-20 minutes per batch
  - **NOT RECOMMENDED**

#### Strategy 2: Moderate (64 qubits × 125 shots)
- **Pros**: Reasonable efficiency
- **Cons**:
  - Still requires 125 job submissions
  - Moderate overhead
  - Queue time: 8-12 minutes per batch
  - **ACCEPTABLE FOR SMALLER HARVESTS**

#### Strategy 3: Optimal (120 qubits × 67 shots) ⭐
- **Pros**:
  - Maximum bytes per shot (15)
  - Minimal job submissions (67)
  - Best efficiency: 15x better than naive
  - Estimated queue time: 5-8 minutes
  - **RECOMMENDED**

## Credit Calculation

### Optimal Strategy (120 qubits × 67 shots)

```python
# Parameters
num_qubits = 120
num_shots = 67
bytes_generated = 1005

# Credit estimation
estimated_queue_minutes = 5
credits_per_minute = 0.7  # Conservative estimate
total_credits = estimated_queue_minutes * credits_per_minute

print(f"Estimated Credits: {total_credits:.2f}")  # ~3.5 credits
```

### Cost Breakdown:

| Component | Time (min) | Credits/min | Total Credits |
|-----------|------------|-------------|---------------|
| Queue Time | 5 | 0.7 | 3.5 |
| Execution | <0.1 | 0.7 | ~0 |
| **Total** | **~5** | **-** | **~3.5** |

### Per-Byte Cost:
- Credits per byte: 3.5 / 1005 = **0.00348 credits/byte**
- Bytes per credit: 1005 / 3.5 = **287 bytes/credit**

## Scaling Analysis

### Large-Scale Harvesting (10,000 bytes)

| Strategy | Qubits | Shots | Jobs | Est. Credits | Credits/KB |
|----------|--------|-------|------|--------------|------------|
| Naive | 8 | 10000 | 10000 | ~350 | 35.0 |
| Moderate | 64 | 1250 | 1250 | ~44 | 4.4 |
| **Optimal** | 120 | 667 | 667 | **~35** | **3.5** |

### Cost Savings:
- Optimal vs Naive: **90% reduction** (350 → 35 credits)
- Optimal vs Moderate: **20% reduction** (44 → 35 credits)

## Real-World Considerations

### Queue Time Variability

Queue times vary based on:
1. **Time of Day**: Peak hours (US business hours) have longer queues
2. **Day of Week**: Weekends typically faster
3. **Backend Load**: Check `backend.status().pending_jobs`

### Recommendations:
- **Off-Peak Hours**: 10 PM - 6 AM EST (shortest queues)
- **Weekends**: Generally 30-50% faster
- **Backend Selection**: Use `ibm_sherbrooke` if `ibm_brisbane` is busy

### Credit Optimization Tips:

1. **Batch Operations**: Submit large jobs instead of many small ones
2. **Monitor Queue**: Check pending jobs before submission
3. **Use Simulators**: Test circuits with `qasm_simulator` first
4. **Off-Peak Timing**: Schedule harvests during low-traffic hours
5. **Backend Selection**: Compare load across available backends

## Backend Comparison

### Available 100+ Qubit Systems:

| Backend | Qubits | Typical Queue | Recommended Use |
|---------|--------|---------------|-----------------|
| `ibm_brisbane` | 127 | 5-8 min | Primary choice |
| `ibm_sherbrooke` | 127 | 6-10 min | Backup option |
| `ibm_osaka` | 127 | 7-12 min | High availability |

### Selection Strategy:
```python
# Pseudo-code for backend selection
backends = get_available_backends(min_qubits=120)
optimal = min(backends, key=lambda b: b.pending_jobs)
```

## Free Tier Considerations

IBM Quantum Free Tier includes:
- **10 minutes/month** of quantum computing time
- Access to all quantum systems
- No credit purchases required

### Free Tier Budget:
- 10 minutes × 0.7 credits/min = **7 credits/month**
- 7 credits × 287 bytes/credit = **~2,000 bytes/month**

### Recommendation:
- Use free tier for testing and small harvests
- Upgrade to premium for production workloads (>5,000 bytes/month)

## Production Recommendations

### For 1,000 byte harvest:
- **Strategy**: Optimal (120 qubits × 67 shots)
- **Credits**: ~3.5
- **Time**: ~5-8 minutes
- **Cost**: $0 (within free tier)

### For 10,000 byte harvest:
- **Strategy**: Optimal (120 qubits × 667 shots)
- **Credits**: ~35
- **Time**: ~45-60 minutes
- **Cost**: ~$5-10 (premium tier)

### For 100,000 byte harvest:
- **Strategy**: Optimal (120 qubits × 6,667 shots)
- **Credits**: ~350
- **Time**: ~8-10 hours
- **Cost**: ~$50-100 (premium tier)
- **Alternative**: Contact IBM for enterprise pricing

## Monitoring and Analytics

### Job Monitoring:
```python
job = backend.run(circuit, shots=67)
print(f"Job ID: {job.job_id()}")
print(f"Status: {job.status()}")
print(f"Queue Position: {job.queue_position()}")
```

### Credit Tracking:
```python
service = QiskitRuntimeService()
usage = service.usage()
print(f"Credits Used: {usage}")
```

## Conclusion

The **Optimal Strategy** (120 qubits × 67 shots) provides:
- **15x efficiency** improvement over naive approach
- **~3.5 credits** for 1,000 bytes
- **~5-8 minutes** queue time
- **$0 cost** within free tier
- **Best cost-per-byte** ratio

### Next Steps:
1. Validate IBM token with `/scripts/test_ibm_token.py`
2. Perform test harvest with `/scripts/optimal_harvest.py --bytes 100`
3. Monitor credit usage and queue times
4. Scale to production volumes as needed

---

**Last Updated**: 2025-10-30
**Version**: 1.0.0
**Author**: Qdaria Quantum Entropy System
