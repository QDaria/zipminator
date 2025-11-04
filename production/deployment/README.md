# Zipminator Production Deployment

This directory contains production deployment configurations for Zipminator - Quantum Random Number Generator with Kyber768 post-quantum cryptography.

## Directory Structure

```
production/deployment/
├── Dockerfile.cpp              # C++ multi-stage Docker build
├── Dockerfile.rust             # Rust multi-stage Docker build
├── docker-compose.yml          # Docker Compose for local deployment
├── k8s/                        # Kubernetes manifests
│   ├── deployment.yaml         # Deployment specification
│   ├── service.yaml            # Service definitions
│   ├── configmap.yaml          # Configuration
│   ├── secret.yaml             # Secrets (template)
│   ├── hpa.yaml                # Horizontal Pod Autoscaler
│   └── ingress.yaml            # Ingress rules
├── helm/                       # Helm chart
│   └── zipminator/
│       ├── Chart.yaml          # Chart metadata
│       ├── values.yaml         # Default values
│       ├── values-dev.yaml     # Dev environment
│       ├── values-staging.yaml # Staging environment
│       ├── values-prod.yaml    # Production environment
│       └── templates/          # Kubernetes templates
├── scripts/                    # Deployment scripts
│   ├── deploy-dev.sh          # Deploy to dev
│   ├── deploy-staging.sh      # Deploy to staging
│   ├── deploy-prod.sh         # Deploy to production
│   └── rollback.sh            # Rollback deployment
└── monitoring/                 # Monitoring configuration
    ├── prometheus.yml          # Prometheus config
    ├── prometheus-rules.yaml   # Alert rules
    └── grafana-dashboard.json  # Grafana dashboard
```

## Quick Start

### 1. Docker Deployment

```bash
# Build and run with Docker Compose
cd production/deployment
docker-compose up -d

# Access services:
# - C++ implementation: http://localhost:8080
# - Rust implementation: http://localhost:8081
# - Prometheus: http://localhost:9090
# - Grafana: http://localhost:3000
```

### 2. Kubernetes Deployment

#### Development Environment
```bash
cd production/deployment/scripts
chmod +x *.sh
./deploy-dev.sh cpp  # or rust
```

#### Staging Environment
```bash
./deploy-staging.sh cpp v1.0.0
```

#### Production Environment
```bash
./deploy-prod.sh cpp v1.0.0
```

### 3. Helm Chart Deployment

```bash
# Install with default values
helm install zipminator ./helm/zipminator

# Install with environment-specific values
helm install zipminator ./helm/zipminator \
  -f helm/zipminator/values-prod.yaml \
  --namespace zipminator-prod

# Upgrade existing deployment
helm upgrade zipminator ./helm/zipminator \
  --namespace zipminator-prod

# Rollback deployment
helm rollback zipminator --namespace zipminator-prod
```

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/production.yml`) automatically:

1. **Build**: Compiles C++ and Rust implementations
2. **Test**: Runs unit tests, NIST KAT validation, constant-time tests
3. **Security Scan**: Trivy vulnerability scanning
4. **Benchmark**: Performance benchmarking
5. **Validate**: Kubernetes manifest validation
6. **Publish**: Builds and pushes Docker images (on main branch)

### Triggering Workflows

```bash
# Push to main triggers full pipeline
git push origin main

# Create pull request triggers tests only
git push origin feature-branch
# Then create PR via GitHub UI

# Manual trigger
gh workflow run production.yml
```

## Configuration

### Environment Variables

- `ZIPMINATOR_ENV`: Environment (development/staging/production)
- `LOG_LEVEL`: Logging level (debug/info/warn/error)
- `QRNG_DEVICE`: QRNG device path (e.g., /dev/qrng0)
- `API_KEY`: API authentication key

### Secrets Management

**Development**: Use Kubernetes secrets
```bash
kubectl create secret generic zipminator-secrets \
  --from-literal=api_key=your-api-key \
  --namespace zipminator-dev
```

**Production**: Use external secrets management
- AWS Secrets Manager
- HashiCorp Vault
- Google Secret Manager

Example with AWS Secrets Manager:
```yaml
apiVersion: v1
kind: Secret
metadata:
  annotations:
    secretsmanager.amazonaws.com/secret-name: "zipminator/production/credentials"
```

## Monitoring

### Prometheus Metrics

Access Prometheus: `http://prometheus:9090`

Key metrics:
- `qrng_device_status`: QRNG device health
- `qrng_entropy_rate`: Entropy quality
- `http_requests_total`: API request count
- `http_request_duration_seconds`: API latency
- `kyber768_key_age_seconds`: Key age

### Grafana Dashboards

Access Grafana: `http://grafana:3000`
Default credentials: admin/admin

The dashboard includes:
- QRNG device status and entropy rate
- API request rate and latency
- Kyber768 operations and key age
- Resource usage (CPU, memory)
- Pod health and availability

### Alerts

Configured alerts:
- QRNG device down
- Low entropy rate
- High API latency
- High error rate
- Key rotation failures
- Pod crash looping
- Low pod count

## Deployment Strategies

### Rolling Update (Default)
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
```

### Blue-Green Deployment
```bash
# Deploy new version (green)
helm install zipminator-green ./helm/zipminator \
  --set nameOverride=zipminator-green \
  --set image.tag=v2.0.0

# Switch traffic
kubectl patch service zipminator \
  -p '{"spec":{"selector":{"version":"v2.0.0"}}}'

# Remove old version (blue)
helm uninstall zipminator
```

### Canary Deployment
```bash
# Deploy canary with 10% traffic
helm install zipminator-canary ./helm/zipminator \
  --set replicaCount=1 \
  --set image.tag=v2.0.0-canary

# Monitor canary metrics
# If successful, roll out to all pods
helm upgrade zipminator ./helm/zipminator \
  --set image.tag=v2.0.0
```

## Scaling

### Manual Scaling
```bash
kubectl scale deployment zipminator --replicas=5 -n zipminator-prod
```

### Auto-scaling (HPA)
```yaml
spec:
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Cluster Autoscaling
Enable cluster autoscaler to add nodes when needed:
```bash
# AWS EKS
eksctl create cluster --asg-access

# GKE
gcloud container clusters update cluster-name \
  --enable-autoscaling \
  --min-nodes=3 \
  --max-nodes=10
```

## Troubleshooting

### Check Pod Status
```bash
kubectl get pods -n zipminator-prod
kubectl describe pod <pod-name> -n zipminator-prod
```

### View Logs
```bash
kubectl logs -n zipminator-prod -l app=zipminator -f
```

### Check Service Health
```bash
kubectl port-forward -n zipminator-prod svc/zipminator 8080:80
curl http://localhost:8080/health
```

### Check Resource Usage
```bash
kubectl top pods -n zipminator-prod
kubectl top nodes
```

### Rollback Deployment
```bash
# Using Helm
helm rollback zipminator -n zipminator-prod

# Using kubectl
kubectl rollout undo deployment/zipminator -n zipminator-prod

# Or use rollback script
./scripts/rollback.sh prod
```

## Security Considerations

1. **Secrets**: Never commit secrets to git. Use external secrets management.
2. **RBAC**: Configure proper role-based access control
3. **Network Policies**: Restrict pod-to-pod communication
4. **Pod Security**: Run as non-root, read-only root filesystem
5. **Image Scanning**: Scan images for vulnerabilities before deployment
6. **TLS**: Use TLS for all external communication
7. **API Authentication**: Require API keys for sensitive endpoints

## Performance Tuning

1. **Resource Limits**: Set appropriate CPU/memory limits
2. **Connection Pooling**: Configure connection pool sizes
3. **Caching**: Enable response caching where appropriate
4. **Compression**: Enable compression for API responses
5. **HPA Configuration**: Tune autoscaling thresholds
6. **Node Affinity**: Schedule pods on appropriate nodes

## Backup and Recovery

### Backup Configuration
```bash
# Backup all resources
kubectl get all -n zipminator-prod -o yaml > backup.yaml

# Backup secrets (encrypted)
kubectl get secrets -n zipminator-prod -o yaml > secrets-backup.yaml
```

### Disaster Recovery
```bash
# Restore from backup
kubectl apply -f backup.yaml

# Restore secrets
kubectl apply -f secrets-backup.yaml
```

## Support

For issues and questions:
- GitHub Issues: https://github.com/zipminator/zipminator/issues
- Documentation: https://zipminator.com/docs
- Email: support@zipminator.com
