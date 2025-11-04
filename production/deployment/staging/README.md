# Staging Environment Deployment Guide

## Overview

This directory contains all configuration and documentation for deploying Zipminator to the staging environment. The staging environment uses mock QRNG functionality until hardware arrives.

## Quick Start

### Prerequisites
- `kubectl` configured for staging cluster
- `helm` v3.x installed
- Access to container registry
- Staging cluster context configured

### Deploy to Staging

```bash
# Deploy C++ implementation
./scripts/deploy_staging.sh cpp

# Deploy Rust implementation
./scripts/deploy_staging.sh rust

# Deploy specific version
./scripts/deploy_staging.sh cpp staging-v1.2.3
```

### Validate Deployment

```bash
# Run comprehensive validation
./scripts/validate_staging.sh

# Run integration tests
./tests/staging/integration_test_suite.sh
```

### Rollback if Needed

```bash
# Rollback to previous version
./scripts/rollback_staging.sh

# Rollback to specific revision
./scripts/rollback_staging.sh 3
```

## Documentation

- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Complete deployment procedures and validation steps
- **[values-staging.yaml](../helm/zipminator/values-staging.yaml)** - Helm configuration overrides for staging

## Key Configuration

### Mock QRNG Settings
Staging uses mock QRNG until hardware arrives:

```yaml
config:
  qrngMode: "mock"
  qrngDevice: "/dev/urandom"
  mockQrng:
    enabled: true
    seedMethod: "crypto"
    latencyMs: 5
    throughputBytesPerSec: 1048576
```

### Resource Limits
Staging uses smaller resources than production:

```yaml
resources:
  limits:
    cpu: 400m
    memory: 384Mi
  requests:
    cpu: 200m
    memory: 256Mi

autoscaling:
  minReplicas: 2
  maxReplicas: 5
```

### Access
- **API URL:** `https://staging-api.zipminator.com`
- **Namespace:** `zipminator-staging`
- **Monitoring:** Grafana dashboard "Zipminator Staging"

## Automation Scripts

| Script | Purpose | Location |
|--------|---------|----------|
| `deploy_staging.sh` | Deploy to staging | `/scripts/` |
| `validate_staging.sh` | Validate deployment | `/scripts/` |
| `rollback_staging.sh` | Rollback deployment | `/scripts/` |
| `integration_test_suite.sh` | Run integration tests | `/tests/staging/` |

## Deployment Workflow

1. **Pre-Deployment**
   - Review checklist
   - Verify cluster access
   - Check resource availability

2. **Deployment**
   - Run `deploy_staging.sh`
   - Monitor rollout
   - Verify pod health

3. **Validation**
   - Run `validate_staging.sh`
   - Execute integration tests
   - Check monitoring dashboards

4. **Post-Deployment**
   - Update documentation
   - Monitor for 24 hours
   - Review metrics

## Troubleshooting

### Common Issues

**Pods not starting:**
```bash
kubectl describe pods -n zipminator-staging
kubectl logs -n zipminator-staging -l app=zipminator
```

**Health checks failing:**
```bash
kubectl exec -n zipminator-staging <pod> -- curl http://localhost:8080/health
kubectl describe pod <pod> -n zipminator-staging
```

**Ingress not accessible:**
```bash
kubectl get ingress -n zipminator-staging -o yaml
kubectl describe ingress -n zipminator-staging
```

## Week 4 Timeline

| Day | Activity | Owner |
|-----|----------|-------|
| Mon | Pre-deployment validation | DevOps |
| Tue | Deploy to staging | DevOps |
| Tue | Smoke tests | QA |
| Wed | Integration testing | Dev + QA |
| Thu | Load testing | DevOps |
| Fri | Documentation & handoff | All |

## Support

- **DevOps Team:** Check internal wiki for contact info
- **On-Call:** See PagerDuty rotation
- **Documentation:** `/production/OPERATIONAL_RUNBOOK.md`
- **Monitoring:** Grafana → "Zipminator Staging"

## Next Steps After Staging

Once staging is validated:
1. Hardware QRNG integration (when hardware arrives)
2. Production deployment planning
3. Load testing with real hardware
4. Security audit
5. Production go-live

---

**Last Updated:** 2025-10-30
**Version:** 1.0.0
**Environment:** Staging
