# x86_64 Cloud Execution Scripts

Quick reference for executing QRNG validation on x86_64 cloud infrastructure.

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Provision VM (AWS recommended)
./provision_x86_64_vm.sh --provider aws --instance-type c5.2xlarge --spot

# 2. Run validation (SSH connection displayed after provisioning)
ssh -i ~/.ssh/qrng-validation-key.pem ubuntu@<instance-ip>
cd qdaria-qrng/scripts
./run_validation_suite.sh

# 3. Collect results (from local machine)
./collect_results.sh --format html --compress

# 4. Teardown VM
./teardown_vm.sh --keep-data
```

## 📁 Scripts Overview

### `provision_x86_64_vm.sh`
Automated VM provisioning for AWS, Azure, or GCP.

**Usage:**
```bash
./provision_x86_64_vm.sh --provider aws --spot
./provision_x86_64_vm.sh --provider azure --instance-type F8s_v2
./provision_x86_64_vm.sh --provider gcp --region us-central1
```

**Features:**
- Automatic SSH key generation
- Security group configuration
- Spot/preemptible instance support
- Auto-shutdown timer
- System dependency installation

### `run_validation_suite.sh`
Comprehensive validation suite with dudect, benchmarks, and memory checks.

**Usage:**
```bash
./run_validation_suite.sh                    # Standard (10M samples, 3 hours)
./run_validation_suite.sh --quick            # Fast (1M samples, 30 min)
./run_validation_suite.sh --full             # Production (50M samples, 12 hours)
./run_validation_suite.sh --stress           # 8-hour stress test
```

**Validation Phases:**
1. System information collection
2. dudect constant-time validation
3. Performance benchmarks (KeyGen, Encaps, Decaps)
4. Memory safety (Valgrind)
5. Stress testing (optional)

### `collect_results.sh`
Download validation results from VM to local machine.

**Usage:**
```bash
./collect_results.sh                         # Download results
./collect_results.sh --format html           # Generate HTML report
./collect_results.sh --compress --clean      # Archive and cleanup VM
```

**Downloads:**
- dudect JSON reports
- Benchmark JSON results
- Valgrind memory logs
- System information
- Validation summary

### `teardown_vm.sh`
Safely terminate VM and cleanup resources.

**Usage:**
```bash
./teardown_vm.sh                             # Interactive teardown
./teardown_vm.sh --force                     # Skip confirmation
./teardown_vm.sh --keep-data                 # Preserve results
```

**Safety Features:**
- Results download verification
- Cost summary calculation
- Confirmation prompts
- Resource cleanup

## 💰 Cost Estimates

| Platform | Instance Type | On-Demand | Spot | 3-Hour Validation |
|----------|---------------|-----------|------|-------------------|
| AWS | c5.2xlarge | $0.34/hr | $0.17/hr | $0.51 |
| Azure | F8s_v2 | $0.338/hr | $0.068/hr | $0.20 |
| GCP | c2-standard-8 | $0.376/hr | $0.075/hr | $0.23 |

**Tip:** Use spot/preemptible instances for 50-80% savings.

## ⚡ Performance Targets

| Operation | Target | Acceptable Range |
|-----------|--------|------------------|
| KeyGen | 25 μs | 20-30 μs |
| Encaps | 35 μs | 30-40 μs |
| Decaps | 40 μs | 35-45 μs |
| Full Cycle | 100 μs | 90-110 μs |

## 🔒 Security Best Practices

1. **SSH Keys:** Never commit private keys to git
2. **Security Groups:** Whitelist your IP only
3. **Auto-Shutdown:** Set 1-2 hour timer to prevent runaway costs
4. **Spot Instances:** Use for non-critical workloads
5. **Results Backup:** Download before teardown

## 📊 Expected Outputs

### dudect Results
```json
{
  "samples": 10000000,
  "t_statistic": -1.42,
  "confidence": 0.999,
  "result": "PASS"
}
```

### Benchmark Results
```json
{
  "operations": {
    "keygen": {"average_us": 24.5, "stddev_us": 2.1},
    "encaps": {"average_us": 34.2, "stddev_us": 3.5},
    "decaps": {"average_us": 38.7, "stddev_us": 4.2}
  }
}
```

## 🐛 Troubleshooting

### Issue: AVX2 not supported
```bash
# Check CPU flags
cat /proc/cpuinfo | grep avx2

# Solution: Use c5.2xlarge (AWS) or F8s_v2 (Azure)
```

### Issue: SSH connection timeout
```bash
# Wait 30-60 seconds after provisioning
# Check security group allows SSH from your IP
```

### Issue: Out of memory
```bash
# Solution: Reduce parallel threads
./run_validation_suite.sh --threads 4
```

## 📖 Full Documentation

See `x86_64_execution_guide.md` for comprehensive documentation including:
- Detailed architecture requirements
- Manual setup instructions
- Advanced configuration options
- CI/CD integration examples
- Monitoring and debugging guides

## 🆘 Support

- **Issues:** https://github.com/yourusername/qdaria-qrng/issues
- **Documentation:** `/scripts/x86_64_execution_guide.md`
- **Memory:** Execution plan stored in `zipminator-week1/x86-execution-plan`
