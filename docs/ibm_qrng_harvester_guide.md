# IBM Quantum QRNG Harvester - Complete Guide

## Overview

The IBM Quantum QRNG Harvester is an enterprise-grade tool for efficiently generating quantum random bytes using IBM's quantum computers. It's optimized for the 10-minute free tier and includes advanced features like automatic retry, health checks, and encrypted storage.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Architecture](#architecture)
- [Token Management](#token-management)
- [Cost Optimization](#cost-optimization)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

## Features

### Core Features

- **Efficient Batch Generation**: 100-1000 shots per job, optimized for free tier
- **Smart Backend Selection**: Automatically chooses least busy quantum computer
- **Token Management**: Built-in validation and expiration checking
- **Cost Estimation**: Calculate credits and time before running
- **Progress Monitoring**: Real-time progress with ETA
- **Error Recovery**: Automatic retry with exponential backoff
- **Secure Storage**: AES-128 encryption via Fernet
- **Health Checks**: NIST SP 800-90B statistical validation

### Advanced Features

- **Batch Mode**: Run multiple jobs sequentially
- **Incremental Saving**: Data saved immediately to prevent loss
- **Job Metadata**: Comprehensive logging and statistics
- **Circuit Optimization**: Level 3 transpiler optimization
- **Session Management**: Faster job execution with IBM Sessions

## Installation

### Prerequisites

```bash
# Python 3.8 or higher
python3 --version

# Pip package manager
pip --version
```

### Install Dependencies

```bash
# Core dependencies
pip install qiskit qiskit-ibm-runtime qiskit-aer

# Additional requirements
pip install pyyaml cryptography numpy

# Or install all at once
pip install qiskit qiskit-ibm-runtime qiskit-aer pyyaml cryptography numpy
```

### Verify Installation

```bash
python3 -c "import qiskit; print(qiskit.__version__)"
python3 -c "from qiskit_ibm_runtime import QiskitRuntimeService; print('IBM Runtime OK')"
```

### Setup Project Structure

```bash
# Create necessary directories
mkdir -p data/quantum_entropy logs config scripts

# Make scripts executable
chmod +x scripts/harvest_quantum_entropy.sh
```

## Quick Start

### 1. Get IBM Quantum Token

1. Go to [IBM Quantum](https://quantum.ibm.com/)
2. Create account or sign in
3. Navigate to Account settings
4. Copy your API token

### 2. Set Environment Variable

```bash
# Linux/macOS
export IBM_QUANTUM_TOKEN="your_token_here"

# Or add to ~/.bashrc or ~/.zshrc for persistence
echo 'export IBM_QUANTUM_TOKEN="your_token_here"' >> ~/.bashrc
source ~/.bashrc

# Windows (PowerShell)
$env:IBM_QUANTUM_TOKEN="your_token_here"
```

### 3. Run First Harvest

```bash
# Using wrapper script (recommended)
./scripts/harvest_quantum_entropy.sh

# Or directly with Python
python3 src/python/ibm_qrng_harvester.py --shots 1000 --token "your_token_here"
```

### 4. Check Output

```bash
# View harvested entropy files
ls -lh data/quantum_entropy/

# View logs
tail -f logs/ibm_qrng_harvester.log

# Check metadata
cat data/quantum_entropy/*.json
```

## Configuration

### Configuration File

Edit `config/ibm_qrng_config.yaml`:

```yaml
# Quantum job configuration
shots_per_job: 1000  # 1000 shots = ~1KB of entropy
num_bits: 8          # 8 qubits = 1 byte per shot

# Error handling
max_retries: 3
retry_delay: 5

# Output
output_dir: "data/quantum_entropy"
encrypt_output: true

# Health checks
run_health_checks: true
```

### Environment Variables

```bash
# Required
export IBM_QUANTUM_TOKEN="your_token_here"

# Optional
export QRNG_ENCRYPTION_KEY="strong_password_here"
```

## Usage Examples

### Basic Harvesting

```bash
# Harvest 1000 shots (default)
./scripts/harvest_quantum_entropy.sh

# Harvest 5000 shots
./scripts/harvest_quantum_entropy.sh --shots 5000

# Harvest with custom output directory
./scripts/harvest_quantum_entropy.sh --output /custom/path
```

### Batch Harvesting

```bash
# Run 5 jobs x 1000 shots = 5000 bytes total
./scripts/harvest_quantum_entropy.sh --batch 5

# Run 10 jobs x 500 shots = 5000 bytes total
./scripts/harvest_quantum_entropy.sh --batch 10 --shots 500
```

### Cost Estimation

```bash
# Estimate before running (no actual harvest)
./scripts/harvest_quantum_entropy.sh --estimate --shots 2000

# Output:
# Credit estimate: 5.28 credits
# Total time: 330 seconds (5.5 minutes)
# Entropy: 2000 bytes
# Fits in free tier: True
```

### Python API Usage

```python
from pathlib import Path
from ibm_qrng_harvester import IBMQuantumHarvester

# Initialize
harvester = IBMQuantumHarvester(
    config_path=Path('config/ibm_qrng_config.yaml')
)

# Estimate cost
estimate = harvester.credit_estimator.estimate_credit_usage(
    num_shots=1000,
    num_bits=8
)
print(f"Estimated credits: {estimate['estimated_credits']}")

# Harvest
result = harvester.harvest_with_retry(
    num_shots=1000,
    num_bits=8,
    token="your_token_here"
)

if result['success']:
    print(f"Harvested {result['num_bytes']} bytes")
    print(f"Backend: {result['backend']}")
    print(f"Job ID: {result['job_id']}")

    # Save
    save_result = harvester.save_harvest(result)
    print(f"Saved to: {save_result['metadata']['path']}")
```

### Advanced Usage

```python
# Custom health checks
from ibm_qrng_harvester import NISTHealthChecker

checker = NISTHealthChecker()
health = checker.run_all_tests(entropy_bytes)

if health['all_passed']:
    print("All NIST health checks passed!")
else:
    print(f"Failed tests: {health}")

# Token validation
from ibm_qrng_harvester import TokenValidator

validator = TokenValidator()
status = validator.check_token_validity("your_token")

if status['valid']:
    print(f"{status['backends_available']} backends available")
else:
    print(f"Token invalid: {status['message']}")
```

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                 IBM Quantum QRNG Harvester              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────┐ │
│  │   Token      │  │    Credit     │  │   NIST      │ │
│  │  Validator   │  │   Estimator   │  │   Health    │ │
│  │              │  │               │  │   Checker   │ │
│  └──────────────┘  └───────────────┘  └─────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         IBM Quantum Harvester (Core)             │  │
│  │  - Circuit creation                              │  │
│  │  - Backend selection                             │  │
│  │  - Job submission                                │  │
│  │  - Result extraction                             │  │
│  │  - Retry logic                                   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────┐                                       │
│  │   Secure    │                                       │
│  │   Storage   │                                       │
│  │             │                                       │
│  └─────────────┘                                       │
└─────────────────────────────────────────────────────────┘
           │                                      │
           ▼                                      ▼
   ┌──────────────┐                      ┌──────────────┐
   │ IBM Quantum  │                      │   Encrypted  │
   │   Hardware   │                      │    Output    │
   └──────────────┘                      └──────────────┘
```

### Data Flow

1. **Initialization**: Load config, validate token
2. **Estimation**: Calculate credit usage and time
3. **Backend Selection**: Choose least busy quantum computer
4. **Circuit Creation**: Build H-gate + measure circuit
5. **Job Submission**: Submit to IBM Quantum via Session
6. **Monitoring**: Track job progress with retry logic
7. **Result Extraction**: Convert quantum measurements to bytes
8. **Health Checks**: Run NIST statistical tests
9. **Storage**: Encrypt and save to disk with metadata

## Token Management

### Getting Your Token

1. Visit [IBM Quantum Account](https://quantum.ibm.com/account)
2. Copy API token
3. Store securely (never commit to git!)

### Token Expiration

Tokens typically expire after 6-12 months. The harvester will:

1. Validate token before each harvest
2. Provide clear error message if expired
3. Show refresh URL: https://quantum.ibm.com/account

### Token Refresh Process

```bash
# 1. Get new token from IBM
# 2. Update environment variable
export IBM_QUANTUM_TOKEN="new_token_here"

# 3. Or update in config (not recommended for security)
# token: "new_token_here"  # in config/ibm_qrng_config.yaml

# 4. Verify new token
./scripts/harvest_quantum_entropy.sh --estimate
```

### Security Best Practices

```bash
# ✓ GOOD: Use environment variable
export IBM_QUANTUM_TOKEN="token_here"

# ✓ GOOD: Pass via command line (for testing)
./scripts/harvest_quantum_entropy.sh --token "token_here"

# ✗ BAD: Hardcode in config file
# ✗ BAD: Commit token to git
# ✗ BAD: Share token publicly
```

## Cost Optimization

### Free Tier Limits

- **Runtime**: 10 minutes per month
- **Jobs**: ~100 jobs per month (estimated)
- **Qubits**: Up to 127 qubits
- **Backends**: All open plan backends

### Optimal Configuration

```yaml
# Maximize entropy per credit
shots_per_job: 1000  # Sweet spot: 1000-2000 shots

# For maximum efficiency
batch_jobs: 5        # 5 x 1000 = 5KB entropy
batch_delay_sec: 10  # Avoid queue congestion

# Expected results:
# - 5KB entropy
# - ~8-10 minutes total time
# - ~8-10 credits used
```

### Shot Count Trade-offs

| Shots | Bytes | Queue Time | Exec Time | Total Time | Credits | Efficiency |
|-------|-------|------------|-----------|------------|---------|------------|
| 100   | 100   | 5 min      | 0.15 sec  | 5 min      | 5.0     | 20 B/credit|
| 500   | 500   | 5 min      | 0.75 sec  | 5 min      | 5.0     | 100 B/credit|
| 1000  | 1000  | 5 min      | 1.5 sec   | 5 min      | 5.0     | 200 B/credit|
| 2000  | 2000  | 5 min      | 3 sec     | 5 min      | 5.0     | 400 B/credit|
| 5000  | 5000  | 8 min      | 7.5 sec   | 8 min      | 8.0     | 625 B/credit|

**Recommendation**: 1000-2000 shots per job for best balance.

### Batch vs Single Job

```bash
# STRATEGY 1: Single large job
./scripts/harvest_quantum_entropy.sh --shots 5000
# Pros: One queue wait
# Cons: Higher risk of timeout, all-or-nothing

# STRATEGY 2: Multiple small jobs (RECOMMENDED)
./scripts/harvest_quantum_entropy.sh --batch 5 --shots 1000
# Pros: Incremental results, better fault tolerance
# Cons: Multiple queue waits

# STRATEGY 3: Medium batches
./scripts/harvest_quantum_entropy.sh --batch 3 --shots 1500
# Pros: Good balance of efficiency and safety
```

## Security

### Encryption

```bash
# Set encryption password
export QRNG_ENCRYPTION_KEY="your_strong_password_here"

# Run harvest (output will be encrypted)
./scripts/harvest_quantum_entropy.sh

# Disable encryption (not recommended)
./scripts/harvest_quantum_entropy.sh --no-encrypt
```

### Decryption

```python
from cryptography.fernet import Fernet
from pathlib import Path

# Load encrypted file
with open('data/quantum_entropy/quantum_entropy_20250130.bin', 'rb') as f:
    salt = f.read(16)
    encrypted_data = f.read()

# Derive key from password
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
from cryptography.hazmat.primitives import hashes

kdf = PBKDF2(
    algorithm=hashes.SHA256(),
    length=32,
    salt=salt,
    iterations=100000,
)
key = kdf.derive(b"your_password_here")

# Decrypt
fernet = Fernet(key)
entropy_bytes = fernet.decrypt(encrypted_data)

print(f"Decrypted {len(entropy_bytes)} bytes")
```

### Integrity Verification

```bash
# Check SHA-256 hash
cat data/quantum_entropy/quantum_entropy_20250130.json | jq '.sha256'

# Verify file integrity
sha256sum data/quantum_entropy/quantum_entropy_20250130.bin
```

## Troubleshooting

### Common Issues

#### Issue 1: Token Invalid or Expired

```
ERROR: Token validation failed: Token is invalid or expired
```

**Solution**:
1. Go to https://quantum.ibm.com/account
2. Copy new API token
3. Update environment variable: `export IBM_QUANTUM_TOKEN="new_token"`
4. Retry harvest

#### Issue 2: Job Timeout

```
ERROR: Job timeout after 900 seconds
```

**Solution**:
- Reduce shots: `--shots 500`
- Use batch mode: `--batch 5 --shots 500`
- Try different time of day (less queue congestion)

#### Issue 3: Health Check Failed

```
WARNING: Repetition count test FAILED
```

**Solution**:
- This is rare but can happen with quantum hardware
- Retry harvest (quantum randomness varies)
- If persistent, file issue at: https://github.com/IBM/qiskit-ibm-runtime/issues

#### Issue 4: No Backends Available

```
ERROR: No backends available with min_qubits=8
```

**Solution**:
- Check IBM Quantum status: https://quantum.ibm.com/services/resources
- Some backends may be under maintenance
- Retry in a few hours

#### Issue 5: Free Tier Exceeded

```
WARNING: Estimated time exceeds 10-minute free tier
```

**Solution**:
- Reduce shots or batch count
- Wait until next month for credit refresh
- Consider IBM Quantum Premium plan

### Debug Mode

```bash
# Enable verbose logging
export QRNG_LOG_LEVEL=DEBUG

# Run with debugging
python3 src/python/ibm_qrng_harvester.py --shots 1000 --token "your_token" 2>&1 | tee debug.log

# Check logs
tail -f logs/ibm_qrng_harvester.log
```

### Getting Help

1. **Check logs**: `logs/ibm_qrng_harvester.log`
2. **IBM Quantum Docs**: https://docs.quantum.ibm.com/
3. **Qiskit Slack**: https://qiskit.slack.com/
4. **GitHub Issues**: https://github.com/IBM/qiskit-ibm-runtime/issues

## Performance Tips

1. **Use Sessions**: Enabled by default for faster execution
2. **Least Busy Backend**: Automatically selected
3. **Circuit Optimization**: Level 3 transpiler optimization
4. **Batch Delay**: 10-second delay prevents queue congestion
5. **Off-Peak Hours**: Run during US night time for faster queues

## Output Files

### Directory Structure

```
data/quantum_entropy/
├── quantum_entropy_20250130_143022.bin        # Encrypted entropy
├── quantum_entropy_20250130_143022.json       # Metadata
├── quantum_entropy_20250130_144500.bin
├── quantum_entropy_20250130_144500.json
└── ...
```

### Metadata Example

```json
{
  "timestamp": "2025-01-30T14:30:22",
  "size_bytes": 1000,
  "sha256": "a3f5...",
  "encrypted": true,
  "encryption": "Fernet (AES-128-CBC)",
  "backend": "ibm_brisbane",
  "job_id": "d1c0qmyv3z50008ah8x0",
  "shots": 1000,
  "num_bits": 8,
  "health_checks": {
    "repetition_count_test": true,
    "adaptive_proportion_test": true,
    "all_passed": true
  }
}
```

## License

MIT License - See LICENSE file for details.

## Credits

- **IBM Quantum**: Quantum computing platform
- **Qiskit**: Quantum SDK
- **NIST SP 800-90B**: Statistical health tests

## Support

For issues, questions, or contributions, please contact the Qdaria QRNG team.

---

**Last Updated**: 2025-01-30
**Version**: 1.0.0
