# Deployment Guide

This guide covers deploying Zipminator in Docker, Kubernetes, and bare-metal environments.

---

## Docker Deployment

### Development Stack

The API ships with a `docker-compose.yml` that runs PostgreSQL, Redis, and the FastAPI server:

```bash
cd api
docker-compose up -d
```

This starts:

| Service | Port | Image |
|---|---|---|
| PostgreSQL 15 | 5432 | `postgres:15-alpine` |
| Redis 7 | 6379 | `redis:7-alpine` |
| Zipminator API | 8000 | Built from `api/Dockerfile` |

The API container mounts the Rust CLI binary from `cli/target/release/zipminator` as a read-only volume. Build the CLI before starting:

```bash
cd cli/rust && cargo build --release
cd ../../api && docker-compose up -d
```

### Production Stack

The production Docker Compose file at `production/deployment/docker-compose.yml` runs a full production-grade stack:

```bash
cd production/deployment
docker-compose up -d
```

| Service | Port | Purpose |
|---|---|---|
| zipminator-rust | 8081 | Rust implementation (primary) |
| zipminator-cpp | 8080 | C++ implementation (legacy) |
| nginx | 80, 443 | Reverse proxy and TLS termination |
| prometheus | 9090 | Metrics collection |
| grafana | 3000 | Monitoring dashboards |

Resource limits are enforced per container:

```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    requests:
      cpus: '0.25'
      memory: 256M
```

### Building the Rust Docker Image

The multi-stage Dockerfile at `production/deployment/Dockerfile.rust` compiles the Rust binary in a builder stage and copies only the binary to a minimal Debian runtime:

```bash
docker build -t zipminator-rust:latest \
  -f production/deployment/Dockerfile.rust .
```

Builder stage requirements:

- Rust 1.75+ toolchain
- `libusb-1.0-0-dev` (for QRNG hardware device access)

Runtime stage:

- `debian:bookworm-slim`
- Runs as non-root user (`uid 1000`)
- Health check via `curl http://localhost:8080/health`

### Building the API Docker Image

```bash
cd api
docker build -t zipminator-api:latest .
```

The API image is based on `python:3.11-slim` and requires the Rust CLI binary to be available at `/app/cli/zipminator` inside the container (either mounted or copied during build).

---

## Kubernetes Deployment

### Prerequisites

- Kubernetes 1.25+
- `kubectl` configured for your cluster
- Helm 3 (for chart-based deployment)
- Container registry access

### Raw Manifests

Apply the Kubernetes manifests directly:

```bash
# Create namespace
kubectl create namespace zipminator-prod

# Apply configuration
kubectl apply -f production/deployment/k8s/configmap.yaml
kubectl apply -f production/deployment/k8s/secret.yaml

# Deploy
kubectl apply -f production/deployment/k8s/deployment.yaml
kubectl apply -f production/deployment/k8s/service.yaml
kubectl apply -f production/deployment/k8s/ingress.yaml
kubectl apply -f production/deployment/k8s/hpa.yaml
```

### Deployment Configuration

The deployment runs 3 replicas by default with rolling updates (zero-downtime):

```yaml
replicas: 3
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
```

Pod security context:

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 1000
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop:
      - ALL
```

Resource requests and limits:

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### Health Checks

| Probe | Path | Delay | Period | Timeout | Threshold |
|---|---|---|---|---|---|
| Liveness | `/health` | 10s | 30s | 5s | 3 failures |
| Readiness | `/ready` | 5s | 10s | 3s | 3 failures |

The readiness check verifies database connectivity, Redis availability, and CLI binary presence.

### Horizontal Pod Autoscaler

The HPA scales between 3 and 10 replicas based on:

| Metric | Target |
|---|---|
| CPU utilization | 70% |
| Memory utilization | 80% |
| HTTP requests/second | 1000 per pod |

Scale-down is conservative (stabilization window of 300s, min of 50% reduction or 2 pods per minute). Scale-up is aggressive (no stabilization, max of 100% increase or 4 pods per 30s).

### Services

Two services are defined:

- **ClusterIP** (`zipminator`): Standard service with session affinity (300s timeout).
- **Headless** (`zipminator-headless`): For direct pod discovery.

### Pod Anti-Affinity

Pods prefer to be scheduled on different nodes to maximize availability:

```yaml
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchLabels:
              app: zipminator
          topologyKey: kubernetes.io/hostname
```

---

## Helm Chart Deployment

The Helm chart at `production/deployment/helm/zipminator/` provides a parameterized deployment.

### Install

```bash
helm install zipminator production/deployment/helm/zipminator/ \
  -n zipminator-prod --create-namespace \
  -f production/deployment/helm/zipminator/values-prod.yaml
```

### Upgrade

```bash
helm upgrade zipminator production/deployment/helm/zipminator/ \
  -n zipminator-prod \
  -f production/deployment/helm/zipminator/values-prod.yaml
```

### Key Values

```yaml
# Image
image:
  repository: zipminator
  tag: "1.0.0"
  implementation: rust    # or "cpp"

# Replicas
replicaCount: 3

# Autoscaling
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

# Ingress
ingress:
  enabled: true
  className: "nginx"
  hosts:
    - host: api.zipminator.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: zipminator-tls
      hosts:
        - api.zipminator.com

# Kyber-768 configuration
config:
  kyber768:
    enabled: true
    keyRotationInterval: 3600
  qrngDevice: "/dev/qrng0"
  server:
    workers: 4
    maxConnections: 1000
```

### Environment-Specific Values

| File | Environment | Notes |
|---|---|---|
| `values.yaml` | Default | Base configuration |
| `values-dev.yaml` | Development | Single replica, debug logging |
| `values-staging.yaml` | Staging | 2 replicas, staging domain |
| `values-prod.yaml` | Production | 3+ replicas, TLS, autoscaling |

---

## Environment Variables Reference

### API Server

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://zipminator:dev_password@localhost:5432/zipminator_dev` | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `SECRET_KEY` | `your-secret-key-change-in-production` | JWT signing key (MUST change for production) |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | JWT token lifetime |
| `CLI_PATH` | `../cli/target/release/zipminator` | Path to Rust CLI binary |
| `DEFAULT_RATE_LIMIT` | `1000` | Default API key rate limit (requests/hour) |
| `CORS_ORIGINS` | `["http://localhost:3000", "http://localhost:8000"]` | Allowed CORS origins |

### Rust Core / CLI

| Variable | Default | Description |
|---|---|---|
| `ZIPMINATOR_ENV` | `development` | Environment: `development`, `staging`, `production` |
| `LOG_LEVEL` | `info` | Log level: `debug`, `info`, `warning`, `error` |
| `QRNG_DEVICE` | `/dev/qrng0` | Path to QRNG hardware device |

### Quantum Entropy Providers

| Variable | Default | Description |
|---|---|---|
| `IBM_CLOUD_TOKEN` | -- | IBM Cloud Quantum API token |
| `IBM_CLOUD_INSTANCE` | `open-instance` | IBM Quantum instance ID |
| `IBM_QUANTUM_BACKEND` | -- | IBM backend (e.g., `ibm_brisbane`) |
| `QBRAID_API_KEY` | -- | qBraid API key for multi-provider access |

### Demo Application

| Variable | Default | Description |
|---|---|---|
| `FLASK_ENV` | `development` | Flask environment |
| `FLASK_DEBUG` | `true` | Debug mode |
| `DEMO_FRONTEND_PORT` | `3000` | Demo frontend port |
| `DEMO_BACKEND_PORT` | `5000` | Demo backend port |

---

## Production Hardening Checklist

### Secrets Management

- [ ] Change `SECRET_KEY` from the default value
- [ ] Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, or Kubernetes External Secrets) for all credentials
- [ ] Never commit `.env` files to version control
- [ ] Rotate API keys and JWT secrets periodically
- [ ] Store database passwords in Kubernetes Secrets, not ConfigMaps

### Network Security

- [ ] Enable TLS termination at the ingress/load balancer level
- [ ] Set `HSTS` header: `Strict-Transport-Security: max-age=31536000`
- [ ] Set `X-Frame-Options: DENY`
- [ ] Set `X-Content-Type-Options: nosniff`
- [ ] Restrict CORS origins to production domains only
- [ ] Configure rate limiting at the ingress level (nginx: `limit-rps: 100`)
- [ ] Use a WAF in front of the API for DDoS protection

### Container Security

- [ ] Run as non-root user (`runAsUser: 1000`)
- [ ] Set `readOnlyRootFilesystem: true`
- [ ] Drop all Linux capabilities (`drop: ALL`)
- [ ] Disable privilege escalation (`allowPrivilegeEscalation: false`)
- [ ] Scan images for vulnerabilities (Trivy, Snyk)
- [ ] Pin image tags to digests in production
- [ ] Use distroless or minimal base images

### Database

- [ ] Use strong, unique passwords
- [ ] Enable TLS for database connections (`sslmode=require`)
- [ ] Restrict database access to the API pod network only
- [ ] Enable automated backups
- [ ] Set connection pool limits

### Monitoring

- [ ] Deploy Prometheus and Grafana (included in production Docker Compose)
- [ ] Configure alerting for health check failures
- [ ] Monitor entropy pool depletion rates
- [ ] Track API latency percentiles (p50, p95, p99)
- [ ] Set up log aggregation (ELK, Loki, or CloudWatch)

### Cryptographic Operations

- [ ] Verify Rust binary is compiled with `--release` (debug builds lack constant-time guarantees)
- [ ] Implement key rotation (default: 1 hour in production ConfigMap)
- [ ] Set maximum key age (default: 24 hours)
- [ ] Log all cryptographic operations for audit trail
- [ ] Validate NIST KAT vectors before deploying a new build

---

## Monitoring and Health Checks

### Prometheus Metrics

The Rust service exposes Prometheus metrics at `/metrics` on port 8080. The production Docker Compose includes a Prometheus instance with preconfigured scrape targets.

Prometheus alert rules are defined in `production/deployment/monitoring/prometheus-rules.yaml`.

### Grafana Dashboards

Grafana is available at port 3000 (default credentials: `admin`/`admin`). A preconfigured Zipminator dashboard is loaded automatically from `production/deployment/monitoring/grafana-dashboard.json`.

### Kubernetes Monitoring

Prometheus ServiceMonitor is enabled by default in the Helm chart:

```yaml
monitoring:
  prometheus:
    enabled: true
    serviceMonitor:
      enabled: true
      interval: 30s
```

Pod annotations ensure Prometheus discovers and scrapes the Zipminator pods:

```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8080"
  prometheus.io/path: "/metrics"
```

### Health Check Endpoints

| Endpoint | Purpose | Frequency |
|---|---|---|
| `GET /health` | Liveness -- confirms the process is alive | Every 30s |
| `GET /ready` | Readiness -- confirms all dependencies are available | Every 10s |

Use these for Kubernetes probes, load balancer health checks, and external uptime monitoring.
