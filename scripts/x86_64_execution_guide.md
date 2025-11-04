# x86_64 Cloud Execution Guide for QRNG Validation

## Executive Summary

This guide provides comprehensive instructions for executing constant-time validation and performance benchmarks on x86_64 cloud infrastructure. ARM64 architecture is incompatible with AVX2 SIMD intrinsics required for optimized Kyber768 operations.

## Architecture Requirements

### Why x86_64?
- **AVX2 Support**: Required for vectorized polynomial operations
- **RDTSC Instruction**: High-precision timing for performance analysis
- **dudect Compatibility**: Constant-time validation requires x86_64 timing precision
- **Industry Standard**: Production deployment targets x86_64 servers

### Blocked on ARM64
```
Error: use of undeclared identifier '_mm256_loadu_si256'
Reason: ARM64 lacks AVX2 instruction set
Impact: Cannot compile optimized Kyber768 implementation
```

## Cloud Platform Options

### Option 1: AWS EC2 (Recommended)

**Instance Type**: `c5.2xlarge`
- **vCPUs**: 8 (3.0 GHz Intel Xeon Platinum 8124M)
- **Memory**: 16 GB
- **Network**: Up to 10 Gbps
- **AVX2**: Full support
- **Cost**: $0.34/hour ($0.17/hour spot)
- **Region**: us-east-1 (lowest latency)

**Estimated Costs:**
- Setup + validation (3 hours): $1.02
- Extended benchmarks (8 hours): $2.72
- Monthly development (40 hours): $13.60

### Option 2: Azure Virtual Machines

**Instance Type**: `F8s_v2`
- **vCPUs**: 8 (Intel Xeon Platinum 8168)
- **Memory**: 16 GB
- **AVX2**: Full support
- **Cost**: $0.338/hour
- **Region**: East US

**Estimated Costs:**
- Setup + validation (3 hours): $1.01
- Extended benchmarks (8 hours): $2.70
- Monthly development (40 hours): $13.52

### Option 3: Google Cloud Platform

**Instance Type**: `c2-standard-8`
- **vCPUs**: 8 (3.8 GHz Intel Cascade Lake)
- **Memory**: 32 GB
- **AVX512**: Enhanced SIMD support
- **Cost**: $0.376/hour
- **Region**: us-central1

## Quick Start (5 Minutes)

### Prerequisites
- AWS/Azure account with billing enabled
- SSH key pair generated locally
- AWS CLI or Azure CLI installed

### Automated Provisioning

```bash
# Clone repository
git clone https://github.com/yourusername/qdaria-qrng.git
cd qdaria-qrng/scripts

# AWS Deployment
./provision_x86_64_vm.sh --provider aws --instance-type c5.2xlarge

# Azure Deployment
./provision_x86_64_vm.sh --provider azure --instance-type F8s_v2

# SSH into instance (credentials displayed after provisioning)
ssh -i ~/.ssh/qrng_key.pem ubuntu@<instance-ip>

# Run validation suite (automated)
./run_validation_suite.sh

# Collect results
./collect_results.sh
```

## Manual Setup Guide

### Step 1: Provision EC2 Instance (AWS)

#### Using AWS Console
1. Navigate to EC2 Dashboard → Launch Instance
2. **Name**: `qrng-validation-x86`
3. **AMI**: Ubuntu Server 22.04 LTS (ami-0c7217cdde317cfec)
4. **Instance Type**: c5.2xlarge
5. **Key Pair**: Create new or select existing
6. **Security Group**:
   - SSH (22) from your IP
   - Custom TCP (8080) for monitoring dashboard
7. **Storage**: 30 GB gp3 (3000 IOPS, 125 MB/s)
8. **Launch Instance**

#### Using AWS CLI
```bash
aws ec2 run-instances \
  --image-id ami-0c7217cdde317cfec \
  --instance-type c5.2xlarge \
  --key-name qrng-key \
  --security-group-ids sg-xxxxxxxxx \
  --subnet-id subnet-xxxxxxxxx \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":30,"VolumeType":"gp3"}}]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=qrng-validation}]'
```

### Step 2: Provision VM (Azure)

#### Using Azure Portal
1. Navigate to Virtual Machines → Create
2. **Subscription**: Select active subscription
3. **Resource Group**: Create `qrng-validation-rg`
4. **Name**: `qrng-validation-vm`
5. **Region**: East US
6. **Image**: Ubuntu Server 22.04 LTS
7. **Size**: F8s_v2 (8 vcpus, 16 GiB memory)
8. **Authentication**: SSH public key
9. **Inbound Ports**: 22 (SSH)
10. **Disk**: 30 GB Premium SSD
11. **Create**

#### Using Azure CLI
```bash
az group create --name qrng-validation-rg --location eastus

az vm create \
  --resource-group qrng-validation-rg \
  --name qrng-validation-vm \
  --image UbuntuLTS \
  --size Standard_F8s_v2 \
  --admin-username azureuser \
  --generate-ssh-keys \
  --public-ip-sku Standard
```

### Step 3: Initial VM Configuration

```bash
# SSH into instance
ssh -i ~/.ssh/qrng_key.pem ubuntu@<instance-ip>

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install build tools
sudo apt-get install -y \
  build-essential \
  cmake \
  git \
  libusb-1.0-0-dev \
  pkg-config \
  clang \
  llvm \
  valgrind \
  linux-tools-common \
  linux-tools-generic

# Verify AVX2 support
cat /proc/cpuinfo | grep avx2
# Expected output: flags ... avx2 ...

# Check CPU model
lscpu | grep "Model name"
# Expected: Intel Xeon with AVX2 support
```

### Step 4: Clone and Build Project

```bash
# Clone repository
cd ~
git clone https://github.com/yourusername/qdaria-qrng.git
cd qdaria-qrng

# Create build directory
mkdir -p build && cd build

# Configure with CMake (Release with AVX2)
cmake .. \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_CXX_FLAGS="-march=native -mavx2 -O3" \
  -DENABLE_DUDECT=ON \
  -DENABLE_BENCHMARKS=ON

# Build (parallel compilation)
make -j8

# Verify AVX2 instructions in binary
objdump -d ../src/kyber768_avx2.cpp | grep vpadd
# Should show AVX2 vector instructions
```

## Validation Execution

### Phase 1: Constant-Time Validation (dudect)

```bash
cd ~/qdaria-qrng/build

# Run dudect with 10 million samples (20-30 minutes)
./dudect_kyber768 \
  --samples 10000000 \
  --confidence 0.999 \
  --output dudect_report.json

# Expected output:
# t-statistic: -1.42 (within [-4.5, 4.5] threshold)
# Result: PASS - No timing leakage detected
```

#### Interpreting Results
- **t-statistic < 4.5**: Constant-time implementation ✅
- **t-statistic > 4.5**: Timing leakage detected ❌
- **Confidence**: 99.9% statistical confidence
- **Samples**: 10M recommended for production validation

### Phase 2: Performance Benchmarks

```bash
# Run comprehensive benchmarks (5-10 minutes)
./benchmark_kyber768 \
  --iterations 100000 \
  --format json \
  --output benchmark_results.json

# View results
cat benchmark_results.json | jq '.'
```

#### Expected Performance Targets
| Operation | Target | Acceptable Range |
|-----------|--------|------------------|
| KeyGen | 25 μs | 20-30 μs |
| Encaps | 35 μs | 30-40 μs |
| Decaps | 40 μs | 35-45 μs |
| Full Cycle | 100 μs | 90-110 μs |

### Phase 3: Memory Safety Validation

```bash
# Run Valgrind memcheck (slower, thorough)
valgrind \
  --leak-check=full \
  --show-leak-kinds=all \
  --track-origins=yes \
  --log-file=valgrind_report.txt \
  ./benchmark_kyber768 --iterations 1000

# Check for memory leaks
grep "ERROR SUMMARY" valgrind_report.txt
# Expected: "ERROR SUMMARY: 0 errors from 0 contexts"
```

### Phase 4: Stress Testing

```bash
# Run extended stress test (8 hours)
./stress_test_kyber768 \
  --duration 28800 \
  --threads 8 \
  --log stress_test.log &

# Monitor progress
tail -f stress_test.log

# Check for failures
grep "FAILURE" stress_test.log
# Expected: No output (zero failures)
```

## Results Collection

```bash
# Aggregate all results
cd ~/qdaria-qrng/scripts
./collect_results.sh

# Results stored in:
# - results/dudect_report.json
# - results/benchmark_results.json
# - results/valgrind_report.txt
# - results/stress_test.log
# - results/system_info.txt

# Download to local machine
rsync -avz -e "ssh -i ~/.ssh/qrng_key.pem" \
  ubuntu@<instance-ip>:~/qdaria-qrng/results/ \
  ./local_results/
```

## Cost Optimization

### Spot Instances (AWS)
Save 50-70% by using spot instances for non-critical workloads:

```bash
aws ec2 request-spot-instances \
  --spot-price "0.17" \
  --instance-count 1 \
  --type "one-time" \
  --launch-specification file://spot-specification.json
```

### Reserved Instances
Long-term development (>6 months): 40-60% discount with 1-year commitment

### Auto-Shutdown
Prevent runaway costs:

```bash
# Set idle shutdown timer (1 hour)
echo "sudo shutdown -h now" | at now + 1 hour

# Cancel if still working
atrm <job-number>
```

## Monitoring and Debugging

### Real-Time CPU Monitoring
```bash
# Install htop
sudo apt-get install -y htop

# Monitor CPU usage during benchmarks
htop

# Expected: 100% CPU utilization on 8 cores during benchmarks
```

### Thermal Throttling Check
```bash
# Monitor CPU frequency
watch -n 1 "grep MHz /proc/cpuinfo | head -n 8"

# Expected: Stable at 3000 MHz (no throttling)
```

### Network Latency (if using remote QRNG)
```bash
# Test latency to QRNG server
ping -c 100 qrng.example.com | tail -n 1

# Expected: avg < 50ms for North America
```

## Troubleshooting

### Issue: AVX2 Instructions Not Available
```bash
# Verify CPU features
cat /proc/cpuinfo | grep flags | head -n 1

# Solution: Ensure c5.2xlarge or F8s_v2 instance type
```

### Issue: Out of Memory (OOM)
```bash
# Check memory usage
free -h

# Solution: Reduce parallel threads or upgrade to 32GB instance
```

### Issue: Compilation Fails with AVX2 Errors
```bash
# Check compiler flags
cmake .. -DCMAKE_VERBOSE_MAKEFILE=ON

# Solution: Verify -mavx2 flag is set
```

### Issue: dudect t-statistic Fails
```bash
# Increase sample size
./dudect_kyber768 --samples 50000000

# Solution: Investigate timing leaks in implementation
```

## Cleanup and Teardown

### Terminate Instance (AWS)
```bash
# Find instance ID
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=qrng-validation" \
  --query 'Reservations[].Instances[].InstanceId' \
  --output text

# Terminate instance
aws ec2 terminate-instances --instance-ids i-xxxxxxxxx
```

### Delete VM (Azure)
```bash
# Delete entire resource group
az group delete --name qrng-validation-rg --yes --no-wait
```

### Cleanup Local Files
```bash
# Remove SSH keys (if no longer needed)
rm ~/.ssh/qrng_key.pem

# Archive results
tar -czf qrng_validation_results_$(date +%Y%m%d).tar.gz local_results/
```

## Automation Scripts

All automation scripts are located in `/scripts`:

1. **provision_x86_64_vm.sh**: One-command VM provisioning
2. **run_validation_suite.sh**: Automated validation execution
3. **collect_results.sh**: Results aggregation and download
4. **teardown_vm.sh**: Safe cleanup and termination

### Example: Full Automated Workflow
```bash
# Provision → Validate → Collect → Teardown (3 hours)
./provision_x86_64_vm.sh --provider aws && \
  ssh-vm "cd qdaria-qrng/scripts && ./run_validation_suite.sh" && \
  ./collect_results.sh && \
  ./teardown_vm.sh

# Total cost: ~$1.02 (AWS spot pricing)
```

## CI/CD Integration

### GitHub Actions Workflow
```yaml
name: x86_64 Validation
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Provision x86_64 VM
        run: ./scripts/provision_x86_64_vm.sh --provider aws
      - name: Run validation
        run: ./scripts/run_validation_suite.sh
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: validation-results
          path: results/
```

## Security Considerations

1. **SSH Key Management**: Use ed25519 keys, never commit private keys
2. **Security Groups**: Whitelist only your IP for SSH access
3. **IAM Roles**: Use least-privilege policies for AWS CLI
4. **Secrets**: Store API keys in AWS Secrets Manager or Azure Key Vault
5. **Audit Logs**: Enable CloudTrail (AWS) or Activity Logs (Azure)

## Next Steps

1. **Week 1**: Complete dudect validation and baseline benchmarks
2. **Week 2**: Optimize AVX2 implementation, target <20μs KeyGen
3. **Week 3**: Integrate with QRNG hardware, end-to-end testing
4. **Week 4**: Production deployment, monitoring, documentation

## Support

- **Issues**: https://github.com/yourusername/qdaria-qrng/issues
- **Documentation**: https://github.com/yourusername/qdaria-qrng/wiki
- **Contact**: your.email@example.com

---

**Last Updated**: 2025-10-30
**Version**: 1.0.0
**Author**: Zipminator Development Team
