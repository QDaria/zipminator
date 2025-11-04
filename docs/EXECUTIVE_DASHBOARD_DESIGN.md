# Executive QRNG Monitoring Dashboard

## Overview
Real-time monitoring dashboard for quantum random number generation, entropy pool management, and compliance tracking.

## Tech Stack
- **Frontend**: Next.js 14 + React + TailwindCSS
- **Backend**: FastAPI (Python) + WebSockets
- **Database**: PostgreSQL + TimescaleDB (time-series)
- **Real-time**: Redis Pub/Sub
- **Deployment**: Docker + K8s

## Dashboard Sections

### 1. **Quantum Status Overview** (Top Banner)
```
┌─────────────────────────────────────────────────────────────┐
│ 🌌 Quantum Entropy Pool Status                              │
│                                                               │
│ ✅ IBM Quantum: ONLINE                                       │
│ 📊 Current Pool: 10.2 KB / 50 KB (20.4%)                    │
│ 🎯 Next Harvest: 3 days, 14 hours                           │
│ 🔐 Last SHA-256: 09ce86b4...ada87338                        │
│ ⚡ Backend: ibm_brisbane (127 qubits)                       │
└─────────────────────────────────────────────────────────────┘
```

### 2. **Entropy Pool Timeline** (Time Series Chart)
- Line graph showing entropy pool levels over time
- Monthly harvest points marked
- Warning threshold at 10 KB
- Critical threshold at 5 KB
- Color-coded: Green (>20KB), Yellow (10-20KB), Red (<10KB)

### 3. **Hardware Backend Health**
```
╔══════════════════════════════════════════════════════════╗
║ Quantum Backend Status                                   ║
╠══════════════════════════════════════════════════════════╣
║ IBM Brisbane (127 qubits)      ✅ Online    Queue: 42   ║
║ IBM Sherbrooke (127 qubits)    ✅ Online    Queue: 38   ║
║ IBM Kyoto (127 qubits)         🟡 Busy      Queue: 125  ║
║ IBM Osaka (127 qubits)         ❌ Offline                ║
╚══════════════════════════════════════════════════════════╝
```

### 4. **Monthly Harvest Schedule**
Calendar view with:
- Next scheduled harvest (1st of each month)
- Historical harvest success/failures
- Harvest size and duration
- Job IDs and verification hashes

### 5. **Compliance & Security Metrics**
```
┌─────────────────────────────────────────────────────────┐
│ NIST Compliance                                          │
│ ✅ NIST SP 800-90B: PASSED (2025-10-01)                 │
│ ✅ Randomness Tests: 100% (dieharder, ent)              │
│ ✅ FIPS 140-3: IN PROGRESS                              │
│                                                           │
│ Security Audit                                           │
│ ✅ Entropy verification: SHA-256/512 matching           │
│ ✅ Post-quantum crypto: Kyber768 active                 │
│ ⚠️  Monthly rotation: Due in 3 days                     │
└─────────────────────────────────────────────────────────┘
```

### 6. **Real-Time Activity Feed**
Live updates:
```
[10:23:45] 🔄 Entropy pool check: 10,245 bytes available
[10:15:32] ✅ Kyber768 key generation: SUCCESS (using QRNG)
[09:42:18] 📊 Backend health check: All systems operational
[08:30:00] 🌌 Scheduled harvest check: Next in 3d 14h
[Yesterday] ✅ NIST randomness test: PASSED (100%)
```

### 7. **Performance Metrics**
- **Harvest Efficiency**: Qubits/shot optimization
  - Current: 120 qubits × 683 shots = 10KB (optimal)
  - Comparison: 8 qubits × 10,240 shots = 10KB (inefficient)
- **Cost Analysis**: IBM credits per harvest
- **Time to Harvest**: Average job completion time
- **Success Rate**: 99.8% (last 12 months)

### 8. **Alerts & Notifications**
- 🔴 Critical: Pool below 5 KB
- 🟡 Warning: Pool below 10 KB
- 🔵 Info: Scheduled harvest in 24 hours
- ✅ Success: Harvest completed
- ❌ Error: Harvest failed (auto-retry)

## API Endpoints

### REST API (FastAPI)
```python
GET  /api/v1/entropy/status          # Current pool status
GET  /api/v1/entropy/history         # Time-series data
GET  /api/v1/backends/health         # Backend status
GET  /api/v1/harvests/schedule       # Upcoming harvests
GET  /api/v1/harvests/{id}           # Harvest details
POST /api/v1/harvests/trigger        # Manual trigger
GET  /api/v1/compliance/reports      # Compliance status
GET  /api/v1/metrics/performance     # Performance metrics
```

### WebSocket Endpoints
```python
WS /ws/realtime                      # Real-time updates
WS /ws/harvests/{job_id}            # Live harvest progress
```

## Data Models

### EntropyPool
```python
{
  "id": "uuid",
  "timestamp": "2025-10-30T21:17:59Z",
  "bytes": 10245,
  "sha256": "09ce86b4...",
  "sha512": "7a8f9c2d...",
  "provider": "IBM Quantum",
  "backend": "ibm_brisbane",
  "job_id": "d1c0qmyv3z50008ah8x0",
  "source": "real_quantum_hardware"
}
```

### HarvestJob
```python
{
  "job_id": "uuid",
  "status": "completed" | "running" | "failed",
  "scheduled_at": "2025-11-01T00:00:00Z",
  "started_at": "2025-11-01T00:01:23Z",
  "completed_at": "2025-11-01T00:15:47Z",
  "target_bytes": 50000,
  "actual_bytes": 50010,
  "num_qubits": 120,
  "num_shots": 3334,
  "backend": "ibm_brisbane",
  "credits_used": 33.34
}
```

## Deployment

### Docker Compose
```yaml
version: '3.8'
services:
  dashboard:
    build: ./dashboard
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:8000

  api:
    build: ./api
    ports:
      - "8000:8000"
    environment:
      - IBM_QUANTUM_TOKEN=${IBM_QUANTUM_TOKEN}
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://redis:6379

  postgres:
    image: timescale/timescaledb:latest-pg16
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
```

### Kubernetes Deployment
- Auto-scaling based on traffic
- Health checks for API and harvester
- Secrets management for IBM token
- Persistent volumes for entropy pool
- Monitoring with Prometheus + Grafana

## Security Features

1. **Authentication**: OAuth2 + JWT
2. **Authorization**: Role-based access control (RBAC)
3. **Encryption**: TLS 1.3 for all communications
4. **Audit Logging**: All harvest operations logged
5. **Rate Limiting**: Prevent API abuse
6. **Secret Management**: Kubernetes secrets for IBM token

## Monitoring & Alerts

### Prometheus Metrics
- `entropy_pool_bytes` - Current pool size
- `harvest_success_total` - Successful harvests
- `harvest_failure_total` - Failed harvests
- `backend_health_status` - Backend health (0/1)
- `harvest_duration_seconds` - Time to complete

### Grafana Dashboards
- Executive overview
- Technical metrics
- Compliance reports
- Cost analysis

### Alert Rules
```yaml
- alert: EntropyPoolLow
  expr: entropy_pool_bytes < 10000
  for: 1h
  annotations:
    summary: "Entropy pool below 10 KB"

- alert: HarvestFailed
  expr: increase(harvest_failure_total[5m]) > 0
  annotations:
    summary: "Quantum harvest failed"
```

## Implementation Timeline

**Week 1**: Backend API + Database
- FastAPI setup
- PostgreSQL + TimescaleDB
- Redis integration
- IBM Quantum integration

**Week 2**: Frontend Dashboard
- Next.js setup
- Real-time WebSocket
- Charts (Recharts/Chart.js)
- UI components (shadcn/ui)

**Week 3**: Monitoring & Automation
- Prometheus + Grafana
- Automated harvesting cron
- Alert system (Email, Slack, PagerDuty)
- Health checks

**Week 4**: Production Deployment
- Docker containers
- Kubernetes manifests
- CI/CD pipeline (GitHub Actions)
- Security hardening
- Load testing

## Access Levels

1. **Executive**: View-only dashboard
2. **Engineer**: Full dashboard + manual triggers
3. **Admin**: All features + configuration
4. **Auditor**: Read-only compliance reports
