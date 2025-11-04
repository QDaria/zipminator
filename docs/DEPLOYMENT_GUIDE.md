# Zipminator Production Deployment Guide

## Overview

Complete production deployment infrastructure for Zipminator QRNG with Kyber768 post-quantum cryptography, featuring Docker containerization, Kubernetes orchestration, Helm charts, CI/CD pipelines, and comprehensive monitoring.

## Deployment Architecture

### Multi-Environment Support
- **Development**: Local testing with minimal resources
- **Staging**: Pre-production validation environment
- **Production**: High-availability production deployment

### Implementation Variants
- **C++ Implementation**: High-performance native implementation
- **Rust Implementation**: Memory-safe implementation with zero-cost abstractions

## Quick Start

### 1. Local Development (Docker Compose)

```bash
cd production/deployment
docker-compose up -d

# Access services:
# C++ API:     http://localhost:8080
# Rust API:    http://localhost:8081
# Prometheus:  http://localhost:9090
# Grafana:     http://localhost:3000 (admin/admin)
```

### 2. Kubernetes Development

```bash
cd production/deployment/scripts
chmod +x *.sh
./deploy-dev.sh cpp  # or rust
```

### 3. Production Deployment

```bash
# Staging first
./deploy-staging.sh cpp v1.0.0

# Then production (requires multiple confirmations)
./deploy-prod.sh cpp v1.0.0
```

## Components Delivered

### Docker Configurations

**Dockerfile.cpp**:
- Multi-stage build for minimal image size
- Security hardening (non-root user, read-only FS)
- Health checks and proper signal handling
- Runtime dependencies only in final image

**Dockerfile.rust**:
- Cargo dependency caching for faster builds
- Release optimizations enabled
- Security hardening and health checks
- Minimal Debian slim base image

**docker-compose.yml**:
- Both C++ and Rust services
- Prometheus and Grafana monitoring
- NGINX reverse proxy/load balancer
- USB device passthrough for QRNG

### Kubernetes Manifests

**deployment.yaml**:
- 3 replicas with rolling update strategy
- Resource limits: 500m CPU, 512Mi memory
- Health probes (liveness, readiness)
- Pod anti-affinity for HA
- Security context (non-root, no privileges)

**service.yaml**:
- ClusterIP service for internal access
- Headless service for StatefulSet-style discovery
- Session affinity for client consistency

**configmap.yaml**:
- Complete application configuration
- QRNG device settings
- Kyber768 parameters
- API rate limiting rules
- Security headers

**secret.yaml**:
- Template for API keys and credentials
- External secrets integration (AWS SM, Vault)
- TLS certificates

**hpa.yaml**:
- Horizontal Pod Autoscaler
- Scale 3-10 pods based on CPU/memory
- Custom metrics support (requests/sec)
- Intelligent scale-up/down policies

**ingress.yaml**:
- NGINX Ingress Controller configuration
- TLS termination with Let's Encrypt
- Rate limiting (100 RPS)
- CORS and security headers

### Helm Chart

**Chart Structure**:
```
helm/zipminator/
├── Chart.yaml                 # Chart metadata
├── values.yaml                # Default configuration
├── values-dev.yaml            # Dev overrides
├── values-staging.yaml        # Staging overrides
├── values-prod.yaml           # Production overrides
└── templates/
    ├── deployment.yaml        # Parameterized deployment
    └── _helpers.tpl           # Template helpers
```

**Features**:
- Environment-specific configurations
- External secrets integration
- Resource management per environment
- Monitoring and alerting configuration

### CI/CD Pipeline

**GitHub Actions Workflow** (`.github/workflows/production.yml`):

**Build Jobs**:
- C++ compilation with NIST KAT validation
- Rust build with clippy and formatting checks
- Docker image creation for both implementations
- Dependency caching for faster builds

**Test Jobs**:
- Unit tests for both implementations
- NIST Known Answer Tests
- Constant-time operation validation
- Memory leak detection (Valgrind)
- Performance benchmarking

**Security Jobs**:
- Trivy vulnerability scanning
- Cargo audit for Rust dependencies
- SARIF report upload to GitHub Security

**Validation Jobs**:
- Kubernetes manifest validation
- Helm chart linting
- Configuration syntax checking

**Publish Jobs**:
- Push to GitHub Container Registry
- Multi-platform image support
- Semantic versioning tags
- Automatic tagging (latest, SHA, version)

### Deployment Scripts

**deploy-dev.sh**:
- Local/dev cluster deployment
- Image loading to kind/minikube
- Port forwarding setup
- No confirmation prompts

**deploy-staging.sh**:
- Staging cluster deployment
- Single confirmation required
- Smoke tests after deployment
- Automatic rollback on failure

**deploy-prod.sh**:
- Production deployment with safeguards
- Multiple confirmation prompts
- Pre-deployment validation checks
- Comprehensive health checks
- Automatic backup creation
- Rollback on health check failure

**rollback.sh**:
- Environment-aware rollback
- Deployment history display
- Pre-rollback backup
- Health validation after rollback

### Monitoring Configuration

**Prometheus**:
- Service discovery for Kubernetes
- 30-second scrape interval
- Custom alert rules
- Pod and node metrics

**Alert Rules**:
- QRNG device health monitoring
- Entropy rate thresholds
- API latency and error rate
- Kyber768 key rotation failures
- Resource usage warnings
- Pod health and availability

**Grafana Dashboard**:
- Real-time QRNG status
- Entropy rate visualization
- API performance metrics
- Kyber768 operation tracking
- Resource usage graphs
- Pod health indicators

## Configuration

### Environment Variables

```bash
ZIPMINATOR_ENV=production
LOG_LEVEL=info
QRNG_DEVICE=/dev/qrng0
API_KEY=<secret>
```

### Resource Requirements

**Development**:
- CPU: 100m-200m
- Memory: 128Mi-256Mi
- Replicas: 1

**Staging**:
- CPU: 200m-400m
- Memory: 256Mi-384Mi
- Replicas: 2

**Production**:
- CPU: 250m-500m
- Memory: 256Mi-512Mi
- Replicas: 3-10 (autoscaling)

## Security Features

### Container Security
- Non-root user execution
- Read-only root filesystem
- Dropped capabilities
- No privilege escalation

### Network Security
- TLS termination at ingress
- CORS configuration
- Rate limiting (100 RPS)
- Security headers (XSS, CSP, HSTS)

### Secrets Management
- Kubernetes secrets (dev/staging)
- External secrets (production)
- AWS Secrets Manager integration
- HashiCorp Vault support

### Image Security
- Trivy vulnerability scanning
- Multi-stage builds (minimal attack surface)
- Base image updates in CI/CD
- SARIF security reports

## Deployment Strategies

### Rolling Update (Default)
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
```
- Zero downtime
- Gradual pod replacement
- Automatic rollback on failure

### Blue-Green Deployment
```bash
# Deploy new version
helm install zipminator-green ./helm/zipminator \
  --set image.tag=v2.0.0

# Switch traffic
kubectl patch service zipminator \
  -p '{"spec":{"selector":{"version":"v2.0.0"}}}'
```
- Instant traffic switch
- Easy rollback
- Requires 2x resources temporarily

### Canary Deployment
```bash
# Deploy canary (10% traffic)
helm install zipminator-canary ./helm/zipminator \
  --set replicaCount=1 \
  --set image.tag=v2.0.0-canary

# Monitor metrics, then roll out
```
- Progressive rollout
- Risk mitigation
- Gradual validation

## Monitoring and Observability

### Metrics Available

**QRNG Metrics**:
- `qrng_device_status`: Device health (0/1)
- `qrng_entropy_rate`: Entropy quality (0-1)
- `qrng_bytes_generated_total`: Total bytes generated
- `qrng_buffer_overflow_total`: Buffer overflow count

**API Metrics**:
- `http_requests_total`: Request count by endpoint
- `http_request_duration_seconds`: Latency histogram
- `http_requests_rate_limited_total`: Rate limit hits

**Kyber768 Metrics**:
- `kyber768_keygen_total`: Key generation count
- `kyber768_encapsulate_total`: Encapsulation count
- `kyber768_decapsulate_total`: Decapsulation count
- `kyber768_key_age_seconds`: Current key age
- `kyber768_key_rotation_failures_total`: Rotation failures

### Alerts Configured

**Critical**:
- QRNG device down (>1 minute)
- High API error rate (>5%)
- Kyber768 key rotation failed
- Pod crash looping
- Low pod count (<2)

**Warning**:
- Low entropy rate (<0.95)
- High API latency (>500ms p95)
- Key expiring soon (>90% of max age)
- High resource usage (>85%)

## Troubleshooting

### Common Issues

**Pod Not Starting**:
```bash
kubectl describe pod <pod-name> -n zipminator-prod
kubectl logs <pod-name> -n zipminator-prod
```

**QRNG Device Not Found**:
- Check USB device permissions
- Verify device path in ConfigMap
- Check kernel modules (cdc_acm)

**High Latency**:
- Check resource limits
- Verify HPA is scaling
- Review QRNG buffer size
- Check network policies

**Key Rotation Failures**:
- Check QRNG entropy availability
- Review key rotation interval
- Verify memory limits

### Emergency Procedures

**Immediate Rollback**:
```bash
./scripts/rollback.sh prod
# or
helm rollback zipminator -n zipminator-prod
```

**Scale Down Temporarily**:
```bash
kubectl scale deployment zipminator --replicas=1 -n zipminator-prod
```

**Disable Problematic Features**:
```bash
helm upgrade zipminator ./helm/zipminator \
  --set config.kyber768.enabled=false \
  --namespace zipminator-prod
```

## Performance Tuning

### Optimization Checklist
- [ ] Adjust worker count based on CPU cores
- [ ] Tune QRNG buffer size (default 1MB)
- [ ] Configure connection pooling
- [ ] Enable response compression
- [ ] Adjust HPA thresholds
- [ ] Review key cache size
- [ ] Enable key precomputation

### Benchmarking
```bash
# Run benchmarks in CI
gh workflow run production.yml

# Local benchmarking
cd benchmarks
make benchmark-cpp
make benchmark-rust
```

## Backup and Recovery

### Backup Procedure
```bash
# Automated backup before deployment
# Created by deploy-*.sh scripts

# Manual backup
kubectl get all -n zipminator-prod -o yaml > backup.yaml
```

### Recovery Procedure
```bash
# From backup
kubectl apply -f backup.yaml

# From script
./scripts/rollback.sh prod
```

## Maintenance

### Regular Tasks
- [ ] Update dependencies monthly
- [ ] Review and rotate secrets quarterly
- [ ] Update base images for security patches
- [ ] Review and tune HPA thresholds
- [ ] Clean up old Docker images
- [ ] Review and archive logs

### Health Checks
- [ ] QRNG device functionality
- [ ] Entropy rate monitoring
- [ ] API latency tracking
- [ ] Key rotation success rate
- [ ] Resource utilization trends

## Support and Documentation

- **Full Documentation**: `/Users/mos/dev/qdaria-qrng/production/deployment/README.md`
- **CI/CD Pipeline**: `.github/workflows/production.yml`
- **Monitoring Setup**: `production/deployment/monitoring/`
- **Memory Storage**: `zipminator-production/deployment` namespace

## Files Created

All deployment artifacts are located in:
- `/Users/mos/dev/qdaria-qrng/production/deployment/`
- `/Users/mos/dev/qdaria-qrng/.github/workflows/`
- `/Users/mos/dev/qdaria-qrng/production/config/`

Total: 25 configuration files covering all aspects of production deployment.
