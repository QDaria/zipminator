# Multi-Provider Quantum QRNG Harvester Guide

## Overview

The Multi-Provider Quantum Random Number Generator Harvester provides a unified interface to access quantum hardware from multiple cloud providers with automatic fallback, load balancing, and credit optimization.

## Supported Providers

### 1. IBM Quantum
- **Access**: Direct API or via qBraid
- **Hardware**: Brisbane (127 qubits), Kyoto, Osaka, Sherbrooke
- **Best for**: Large-scale entropy generation
- **Cost**: ~$0.01 per 1000 shots

### 2. IonQ
- **Access**: Direct API, qBraid, or AWS Braket
- **Hardware**: Harmony (11 qubits), Aria (25 qubits)
- **Best for**: High-quality randomness (trapped ion)
- **Cost**: ~$0.30 per task

### 3. Rigetti
- **Access**: Direct API, qBraid, or AWS Braket
- **Hardware**: Aspen-M-3 (79 qubits)
- **Best for**: Medium-scale generation
- **Cost**: ~$0.00003 per shot

### 4. AWS Braket
- **Access**: AWS SDK
- **Hardware**: Multiple backends (IonQ, Rigetti, SV1 simulator)
- **Best for**: AWS ecosystem integration
- **Cost**: Variable by backend

### 5. Oxford Quantum Circuits (OQC)
- **Access**: qBraid
- **Hardware**: Lucy (8 qubits)
- **Best for**: Small-scale testing
- **Cost**: ~$0.25 per task

## Understanding Qubit Usage

### Key Concept: Qubits = Bytes per Shot

- **8 qubits** = 2^8 = 256 states = 1 byte per measurement
- **16 qubits** = 2^16 = 65,536 states = 2 bytes per measurement
- **64 qubits** = 2^64 states = 8 bytes per measurement
- **120 qubits** = 2^120 states = 15 bytes per measurement

### Example: Generating 1000 Bytes

#### Strategy 1: Minimum Qubits (Inefficient)
```
8 qubits × 1000 shots = 1000 bytes
- Simple but requires many shots
- More job submissions = higher overhead
- Total jobs: 1 (if under shot limit)
```

#### Strategy 2: Medium Qubits (Balanced)
```
64 qubits × 125 shots = 1000 bytes
- Good balance
- Fewer shots = less overhead
- Total jobs: 1
```

#### Strategy 3: Maximum Qubits (Optimal!)
```
120 qubits × 67 shots = 1005 bytes
- Most efficient
- Minimal shots = lowest overhead
- Total jobs: 1
- Best cost per byte!
```

### Why Use More Qubits?

1. **Fewer Shots Needed**: 120 qubits generates 15 bytes per shot vs 1 byte for 8 qubits
2. **Lower Job Overhead**: Fewer API calls and job submissions
3. **Better Credit Efficiency**: Cost is often per-shot, not per-qubit
4. **Faster Completion**: Less time waiting in queues

## Cost Optimization

### IBM Brisbane (127 qubits available)

For 1000 bytes:

| Strategy | Qubits | Shots | Cost | Time | Efficiency |
|----------|--------|-------|------|------|------------|
| Minimum  | 8      | 1000  | $0.01 | ~10 min | Low |
| Balanced | 64     | 125   | $0.0013 | ~5 min | Medium |
| Optimal  | 120    | 67    | $0.00067 | ~3 min | **High** |

**Recommendation**: Use maximum available qubits (120) for best efficiency!

### Multi-Provider Cost Comparison

For 1000 bytes of quantum randomness:

| Provider | Hardware | Qubits Used | Estimated Cost | Time |
|----------|----------|-------------|----------------|------|
| IBM Brisbane | 127q superconducting | 120 | $0.00067 | ~3 min |
| Rigetti Aspen | 79q superconducting | 72 | $0.0020 | ~4 min |
| IonQ Harmony | 11q trapped ion | 8 | $0.30 | ~2 min |
| AWS Braket SV1 | Simulator | 120 | $0.075 | <1 min |
| OQC Lucy | 8q superconducting | 8 | $0.25 | ~2 min |

**Best Value**: IBM Brisbane (127 qubits)
**Highest Quality**: IonQ Harmony (trapped ion, lowest error rate)
**Fastest**: AWS Braket SV1 (but not true quantum!)

## Setup

### 1. Install Dependencies

```bash
pip install qiskit qiskit-ibm-runtime qbraid numpy pyyaml
```

Optional providers:
```bash
pip install boto3 amazon-braket-sdk  # AWS Braket
```

### 2. Set API Keys

```bash
# IBM Quantum
export IBM_QUANTUM_TOKEN="your_ibm_token"

# qBraid (unified access)
export QBRAID_API_KEY="your_qbraid_key"

# AWS Braket
export AWS_ACCESS_KEY_ID="your_aws_key"
export AWS_SECRET_ACCESS_KEY="your_aws_secret"

# IonQ (if direct access)
export IONQ_API_KEY="your_ionq_key"

# Rigetti (if direct access)
export RIGETTI_API_KEY="your_rigetti_key"
```

### 3. Configure Settings

Edit `config/multi_provider_config.yaml` to customize:
- Provider priority
- Cost limits
- Quality requirements
- Optimization goals

## Usage

### Command Line

```bash
# Generate 1KB using best available provider
./scripts/harvest_multi_provider.sh -b 1024

# Generate 10KB from IBM, optimize for cost
./scripts/harvest_multi_provider.sh -b 10240 -p ibm -g cost

# Generate 1MB with budget constraint
./scripts/harvest_multi_provider.sh -b 1048576 -C 10.00 -T 3600

# Use qBraid with verbose output
./scripts/harvest_multi_provider.sh -b 1000 -p qbraid -v
```

### Python API

```python
from multi_provider_harvester import MultiProviderHarvester, QuantumProvider

# Initialize harvester
harvester = MultiProviderHarvester()

# Auto-select best provider
entropy = harvester.harvest_quantum_entropy(num_bytes=1000)

# Use specific provider
entropy = harvester.harvest_quantum_entropy(
    num_bytes=1000,
    provider=QuantumProvider.IBM_DIRECT
)

# Check provider status
status = harvester.get_provider_status()
print(f"Available backends: {status['total_backends']}")
```

### qBraid Adapter

```python
from qbraid_adapter import QBraidAdapter, QBraidProvider

# Initialize qBraid
adapter = QBraidAdapter()

# List available devices
for device in adapter.devices:
    print(f"{device.name}: {device.num_qubits} qubits ({device.status})")

# Get best device
device = adapter.get_best_device(min_qubits=8)

# Harvest entropy
entropy = adapter.harvest_entropy(num_bytes=1000, device_id=device.device_id)
```

### Credit Optimizer

```python
from credit_optimizer import CreditOptimizer, OptimizationGoal

# Initialize optimizer
optimizer = CreditOptimizer()

# Compare all providers for 1KB generation
plans = optimizer.compare_providers(target_bytes=1000)

for plan in plans:
    print(f"{plan.provider}:")
    print(f"  Cost: ${plan.estimated_cost:.4f}")
    print(f"  Time: {plan.estimated_time_seconds/60:.1f} min")
    print(f"  Strategy: {plan.num_qubits} qubits × {plan.num_shots} shots")

# Get recommendation with constraints
best = optimizer.recommend_provider(
    target_bytes=1000,
    budget=0.50,          # $0.50 max
    max_time_seconds=600, # 10 minutes max
    goal=OptimizationGoal.MINIMIZE_COST
)

print(f"Recommended: {best.provider}")
print(f"Cost: ${best.estimated_cost:.4f}")
```

## Provider Selection Strategy

### Automatic Selection (Recommended)

The harvester automatically selects the best provider based on:

1. **Availability**: Is the provider accessible?
2. **Queue Depth**: How busy is the backend?
3. **Qubit Count**: More qubits = better efficiency
4. **Cost**: Optimize for budget constraints
5. **Quality**: Consider error rates

### Manual Provider Selection

Specify provider when you need:
- **IBM Direct**: Maximum efficiency (127 qubits)
- **IonQ**: Highest quality (trapped ion, low errors)
- **Rigetti**: Good balance (79 qubits)
- **AWS Braket**: AWS ecosystem integration
- **qBraid**: Unified access to multiple providers

## Optimization Goals

### 1. Balanced (Default)
```python
goal=OptimizationGoal.BALANCED
```
- Balance cost, time, and quality
- Good for most use cases
- Recommended starting point

### 2. Minimize Cost
```python
goal=OptimizationGoal.MINIMIZE_COST
```
- Use maximum qubits to minimize shots
- Prefer lower-cost providers
- Best for budget-conscious applications

### 3. Minimize Time
```python
goal=OptimizationGoal.MINIMIZE_TIME
```
- Use providers with shortest queue times
- Parallelize when possible
- Best for real-time applications

### 4. Minimize Jobs
```python
goal=OptimizationGoal.MINIMIZE_JOBS
```
- Use maximum qubits per job
- Reduce API overhead
- Best for rate-limited scenarios

### 5. Maximize Quality
```python
goal=OptimizationGoal.MAXIMIZE_QUALITY
```
- Prefer low-error-rate providers (IonQ)
- Run additional validation
- Best for cryptographic applications

## Troubleshooting

### No Providers Available

```
Error: No available quantum backends
```

**Solutions**:
1. Check API credentials are set
2. Verify network connectivity
3. Check provider status pages
4. Use simulator fallback

### Job Failures

```
Error: Job submission failed
```

**Solutions**:
1. Check queue depth (try different backend)
2. Reduce shots per job
3. Retry with exponential backoff
4. Switch to alternative provider

### Cost Overruns

```
Warning: Estimated cost exceeds budget
```

**Solutions**:
1. Use optimizer to find cheaper strategy
2. Switch to lower-cost provider
3. Generate smaller batches
4. Use simulator for testing

### Quality Issues

```
Warning: Entropy quality below threshold
```

**Solutions**:
1. Use higher-quality provider (IonQ)
2. Increase sample size
3. Apply post-processing
4. Verify backend calibration

## Best Practices

### 1. Start Small
```python
# Test with small batch first
entropy = harvester.harvest_quantum_entropy(num_bytes=100)
```

### 2. Check Costs
```python
# Estimate before harvesting
optimizer = CreditOptimizer()
plan = optimizer.calculate_strategy(1000, 'ibm_brisbane_127q')
print(f"Estimated cost: ${plan.estimated_cost:.4f}")
```

### 3. Use Maximum Qubits
```python
# More efficient than using fewer qubits
# 120 qubits × 67 shots > 8 qubits × 1000 shots
```

### 4. Monitor Queue Depths
```python
# Select backend with lowest queue
backend = harvester.select_backend()
print(f"Queue depth: {backend.queue_depth}")
```

### 5. Implement Fallbacks
```python
try:
    entropy = harvester.harvest_quantum_entropy(
        num_bytes=1000,
        provider=QuantumProvider.IBM_DIRECT
    )
except Exception:
    # Fallback to alternative provider
    entropy = harvester.harvest_quantum_entropy(
        num_bytes=1000,
        provider=QuantumProvider.QBRAID_IBM
    )
```

## Security Considerations

### 1. API Key Management
- Never commit API keys to git
- Use environment variables
- Rotate keys regularly
- Use separate keys for dev/prod

### 2. Entropy Quality
- Verify randomness with NIST tests
- Use multiple sources when possible
- Apply entropy pooling for critical applications

### 3. Cost Controls
- Set budget limits
- Monitor credit usage
- Implement approval workflows for large batches

## Performance Benchmarks

### IBM Brisbane (127 qubits)

| Batch Size | Strategy | Time | Cost | Quality |
|------------|----------|------|------|---------|
| 1 KB | 120q × 67s | ~3 min | $0.00067 | ⭐⭐⭐⭐ |
| 10 KB | 120q × 667s | ~15 min | $0.0067 | ⭐⭐⭐⭐ |
| 100 KB | 120q × 6667s | ~2 hours | $0.067 | ⭐⭐⭐⭐ |
| 1 MB | 120q × 66667s | ~20 hours | $0.67 | ⭐⭐⭐⭐ |

### IonQ Harmony (11 qubits)

| Batch Size | Strategy | Time | Cost | Quality |
|------------|----------|------|------|---------|
| 1 KB | 8q × 1000s | ~2 min | $0.30 | ⭐⭐⭐⭐⭐ |
| 10 KB | 8q × 10000s | ~20 min | $3.00 | ⭐⭐⭐⭐⭐ |

**Note**: IonQ has highest quality (trapped ion) but higher cost

## Advanced Features

### Load Balancing

Distribute generation across multiple backends:

```python
harvester = MultiProviderHarvester()
harvester.config['advanced']['enable_load_balancing'] = True
entropy = harvester.harvest_quantum_entropy(num_bytes=10000)
```

### Parallel Harvesting

Generate from multiple providers simultaneously:

```python
harvester.config['advanced']['parallel_harvesting'] = True
harvester.config['advanced']['max_parallel_jobs'] = 5
entropy = harvester.harvest_quantum_entropy(num_bytes=10000)
```

### Result Caching

Cache results for repeated queries:

```python
harvester.config['cache']['enable_result_caching'] = True
harvester.config['cache']['cache_ttl_seconds'] = 3600  # 1 hour
```

## Future Enhancements

- [ ] Add Quantinuum support
- [ ] Implement entropy pooling
- [ ] Add NIST randomness tests
- [ ] Support for QUIC synchronization
- [ ] Real-time monitoring dashboard
- [ ] Automated cost optimization
- [ ] Multi-region support
- [ ] Blockchain verification

## Support

For issues or questions:
- GitHub Issues: [qdaria-qrng](https://github.com/yourusername/qdaria-qrng)
- IBM Quantum: https://quantum-computing.ibm.com/
- qBraid Docs: https://docs.qbraid.com/
- AWS Braket: https://aws.amazon.com/braket/

## License

MIT License - see LICENSE file for details
