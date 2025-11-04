# Zipminator Staging Deployment - Quick Reference Card

**Namespace:** `zipminator-staging`
**Environment:** Staging (Mock QRNG)
**Week:** 4

---

## 🚀 Quick Deploy

```bash
# Standard deployment
./scripts/deploy_staging.sh cpp

# With version tag
./scripts/deploy_staging.sh cpp staging-v1.2.3

# Dry run first
DRY_RUN=true ./scripts/deploy_staging.sh cpp
```

---

## ✅ Validate Deployment

```bash
# Full validation (11 checks)
./scripts/validate_staging.sh

# Integration tests (29 tests)
./tests/staging/integration_test_suite.sh
```

---

## 🔄 Rollback

```bash
# Quick rollback to previous
./scripts/rollback_staging.sh

# Rollback to specific revision
./scripts/rollback_staging.sh 3
```

---

## 📊 Monitoring Commands

```bash
# Pod status
kubectl get pods -n zipminator-staging

# Follow logs
kubectl logs -n zipminator-staging -l app=zipminator -f

# Resource usage
kubectl top pods -n zipminator-staging

# HPA status
kubectl get hpa -n zipminator-staging

# Service & Ingress
kubectl get svc,ingress -n zipminator-staging
```

---

## 🔍 Health Checks

```bash
# Get pod name
POD=$(kubectl get pod -n zipminator-staging -l app=zipminator -o jsonpath='{.items[0].metadata.name}')

# Health endpoint
kubectl exec -n zipminator-staging $POD -- curl http://localhost:8080/health

# Readiness endpoint
kubectl exec -n zipminator-staging $POD -- curl http://localhost:8080/ready

# Metrics endpoint
kubectl exec -n zipminator-staging $POD -- curl http://localhost:8080/metrics
```

---

## 🐛 Troubleshooting

```bash
# Describe pod
kubectl describe pod -n zipminator-staging <pod-name>

# Get events
kubectl get events -n zipminator-staging --sort-by='.lastTimestamp'

# Check deployment
kubectl describe deployment zipminator -n zipminator-staging

# Helm status
helm status zipminator -n zipminator-staging

# Helm history
helm history zipminator -n zipminator-staging
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `/production/deployment/staging/DEPLOYMENT_CHECKLIST.md` | Full deployment guide |
| `/production/deployment/helm/zipminator/values-staging.yaml` | Staging config |
| `/scripts/deploy_staging.sh` | Deploy automation |
| `/scripts/validate_staging.sh` | Validation suite |
| `/scripts/rollback_staging.sh` | Rollback automation |
| `/tests/staging/integration_test_suite.sh` | Integration tests |

---

## 🎯 Success Criteria

- [ ] All 29 integration tests pass
- [ ] Zero ERROR logs in first hour
- [ ] Health checks < 100ms
- [ ] API requests < 50ms
- [ ] CPU < 50% of limits
- [ ] Memory < 70% of limits
- [ ] HPA scaling working
- [ ] Monitoring operational

---

## 📞 Support

- **Documentation:** `/production/deployment/staging/DEPLOYMENT_CHECKLIST.md`
- **Runbook:** `/production/OPERATIONAL_RUNBOOK.md`
- **Monitoring:** Grafana → "Zipminator Staging"

---

## ⚙️ Configuration

**Mock QRNG:**
- Device: `/dev/urandom`
- Latency: 5ms (simulated)
- Throughput: 1MB/s (simulated)

**Resources:**
- CPU: 200m (request) / 400m (limit)
- Memory: 256Mi (request) / 384Mi (limit)
- Replicas: 2-5 (auto-scaling)

**Access:**
- URL: `https://staging-api.zipminator.com`
- Rate Limit: 100 req/min

---

**Version:** 1.0.0 | **Updated:** 2025-10-30
