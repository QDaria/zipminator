# IBM Quantum Credit Management Guide

## Overview

This guide covers the comprehensive credit monitoring and rate limiting system for IBM Quantum free tier (10 minutes/month).

## Table of Contents

1. [Quick Start](#quick-start)
2. [Credit Tracking](#credit-tracking)
3. [Rate Limiting](#rate-limiting)
4. [Monitoring Dashboard](#monitoring-dashboard)
5. [Intelligent Scheduling](#intelligent-scheduling)
6. [Emergency Procedures](#emergency-procedures)
7. [API Reference](#api-reference)
8. [Best Practices](#best-practices)

## Quick Start

### Check Current Status

```bash
# Simple status check
./scripts/ibm_credit_monitor.sh --status

# Real-time monitoring
watch -n 60 ./scripts/ibm_credit_monitor.sh --status
```

### Schedule a Job

```bash
# Schedule entropy harvest
./scripts/ibm_scheduler.py --schedule "entropy_harvest" --shots 4096 --priority high

# Process pending jobs
./scripts/ibm_scheduler.py --process
```

### View Dashboard

```bash
# Generate and view dashboard
./scripts/ibm_credit_monitor.sh --dashboard
cat docs/monitoring/ibm_credit_dashboard.md
```

## Credit Tracking

### Alert Thresholds

| Level | Usage | Action |
|-------|-------|--------|
| **Normal** | 0-79% | No action needed |
| **Warning** | 80-89% | Review scheduled jobs |
| **Critical** | 90-94% | Defer non-critical jobs |
| **Emergency** | 95-99% | Manual approval required |
| **Exhausted** | 100% | Auto-fallback to classical |

### Usage Calculation

```python
from ibm_rate_limiter import IBMCreditManager

manager = IBMCreditManager()

# Get current status
status = manager.get_status()
print(f"Used: {status.used_minutes:.3f} / {status.max_minutes} minutes")
print(f"Alert Level: {status.alert_level.value}")
```

### Historical Tracking

```bash
# View 30-day history
python3 src/python/ibm_rate_limiter.py --history 30

# Generate usage report
./scripts/ibm_credit_monitor.sh --report

# Export to CSV
./scripts/ibm_credit_monitor.sh --report --format csv > usage.csv
```

## Rate Limiting

### Limits and Constraints

| Parameter | Value | Configurable |
|-----------|-------|--------------|
| Min job interval | 5 seconds | Yes |
| Max concurrent jobs | 3 | Yes |
| Max shots per job | 8192 | Yes |
| Recommended shots | 4096 | Yes |

### Exponential Backoff

On rate limit errors:

1. **Initial delay**: 10 seconds
2. **Max delay**: 300 seconds (5 minutes)
3. **Multiplier**: 2.0x
4. **Max retries**: 5

```python
# Configure backoff in config/ibm_limits.yaml
rate_limits:
  backoff:
    initial_delay_seconds: 10
    max_delay_seconds: 300
    multiplier: 2.0
    max_retries: 5
```

### Job Estimation

```python
from ibm_rate_limiter import IBMCreditManager

manager = IBMCreditManager()

# Estimate job resource usage
estimate = manager.estimate_job(shots=4096, circuits=1, backend="ibm_brisbane")

print(f"Estimated runtime: {estimate.estimated_runtime_seconds:.1f} seconds")
print(f"Estimated minutes: {estimate.estimated_minutes:.3f} minutes")

# Check if can submit
can_submit, reason = manager.can_submit_job(estimate)
print(f"Can submit: {can_submit} - {reason}")
```

## Monitoring Dashboard

### Real-Time Dashboard

Location: `docs/monitoring/ibm_credit_dashboard.md`

Updates automatically after each job completion.

**Features:**
- Current usage progress bar
- Alert level status
- Job statistics
- Time until reset
- Recent history
- Action recommendations

### Prometheus Metrics

```bash
# Export metrics
./scripts/ibm_credit_monitor.sh --metrics

# Metrics available:
# - ibm_quantum_credits_used_minutes
# - ibm_quantum_credits_remaining_minutes
# - ibm_quantum_credits_percentage_used
# - ibm_quantum_jobs_submitted_total
# - ibm_quantum_jobs_in_queue
# - ibm_quantum_alert_level
# - ibm_quantum_can_submit
```

### Grafana Integration

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'ibm_quantum'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: '/metrics'
    scrape_interval: 60s
```

## Intelligent Scheduling

### Preferred Time Windows

Default windows (UTC):
- **02:00-06:00**: Off-peak hours (primary)
- **14:00-16:00**: Secondary window

```yaml
# config/ibm_limits.yaml
scheduling:
  preferred_windows:
    - start: "02:00"
      end: "06:00"
    - start: "14:00"
      end: "16:00"
```

### Job Batching

Combine multiple small requests into larger jobs:

```python
from ibm_scheduler import IBMQuantumScheduler

scheduler = IBMQuantumScheduler()

# Batch multiple requests
requests = [
    (1024, 1),  # (shots, circuits)
    (2048, 1),
    (1024, 1)
]

batched_job = scheduler.batch_requests(requests)
```

### Priority Levels

| Priority | Value | Use Case |
|----------|-------|----------|
| **Critical** | 3 | Emergency entropy needs |
| **High** | 2 | Pool near depletion |
| **Medium** | 1 | Regular harvests |
| **Low** | 0 | Pre-emptive harvests |

### Optimization

```bash
# Optimize current schedule
./scripts/ibm_scheduler.py --optimize

# Process with dry run
./scripts/ibm_scheduler.py --process --dry-run

# Export optimized schedule
./scripts/ibm_scheduler.py --export optimized_schedule.json
```

## Emergency Procedures

### Automatic Fallback

When credits exhausted, system automatically falls back to classical RNG:

```yaml
# config/ibm_limits.yaml
emergency:
  auto_fallback: true
```

### Manual Override

For critical operations requiring quantum entropy:

```python
# Check if emergency override available
status = manager.get_status()
if status.alert_level == AlertLevel.EMERGENCY:
    # Request manual approval
    # Only for critical security operations
    pass
```

### Budget Allocation

Configure paid tier upgrade:

```yaml
emergency:
  paid_tier:
    enabled: false
    max_monthly_budget_usd: 0
    auto_upgrade: false
```

### Stop All Harvests

```bash
# Emergency stop
./scripts/ibm_harvest_stop.sh

# Clear job queue
./scripts/ibm_scheduler.py --clear-queue

# Enable fallback mode
./scripts/ibm_config.sh --set emergency.auto_fallback true
```

## API Reference

### IBMCreditManager

```python
class IBMCreditManager:
    def __init__(self, config_path: str = "config/ibm_limits.yaml")

    def estimate_job(self, shots: int, circuits: int = 1,
                    backend: str = "ibm_brisbane") -> JobEstimate

    def get_status(self) -> UsageStatus

    def can_submit_job(self, estimate: JobEstimate) -> Tuple[bool, str]

    def register_job_submission(self, job_id: str, estimate: JobEstimate) -> None

    def update_job_completion(self, job_id: str, runtime_seconds: float,
                             success: bool, entropy_bytes: int = 0) -> None

    def get_historical_usage(self, days: int = 30) -> List[Dict]

    def get_best_submission_window(self) -> Optional[datetime]

    def export_metrics(self) -> Dict
```

### IBMQuantumScheduler

```python
class IBMQuantumScheduler:
    def __init__(self, config_path: str = "config/ibm_limits.yaml")

    def schedule_job(self, name: str, shots: int, circuits: int = 1,
                    backend: str = "ibm_brisbane",
                    priority: int = SchedulingPriority.MEDIUM) -> ScheduledJob

    def get_schedule(self, include_submitted: bool = False) -> List[ScheduledJob]

    def process_schedule(self, dry_run: bool = False) -> List[ScheduledJob]

    def batch_requests(self, requests: List[Tuple[int, int]]) -> ScheduledJob

    def get_queue_status(self) -> Dict

    def optimize_schedule(self) -> int

    def export_schedule(self, filepath: str) -> None
```

## Best Practices

### Job Sizing

**Optimal shots per job:**
- **4096 shots**: Best balance of queue time vs entropy
- **8192 shots**: Maximum efficiency (if credits available)
- **2048 shots**: Faster turnaround for urgent needs

**Circuit count:**
- Keep to 1-2 circuits per job for predictable timing
- Batch similar circuits together

### Scheduling Strategy

1. **Pre-emptive harvesting**: Trigger at 512 bytes remaining
2. **Off-peak scheduling**: Use preferred windows
3. **Batch low-priority**: Combine small requests
4. **Monitor queue**: Avoid high-traffic periods

### Credit Conservation

1. **Use simulator for testing**
2. **Batch requests when possible**
3. **Schedule during off-peak hours**
4. **Set appropriate alert thresholds**
5. **Enable auto-fallback**

### Monitoring

1. **Check status daily**: `./scripts/ibm_credit_monitor.sh`
2. **Review alerts**: `./scripts/ibm_credit_monitor.sh --alerts`
3. **Update dashboard**: Auto-updates after each job
4. **Export metrics**: Set up Prometheus scraping

### Emergency Planning

1. **Test fallback regularly**: Ensure classical RNG works
2. **Document critical operations**: Which require quantum entropy
3. **Set conservative thresholds**: Alert before exhaustion
4. **Have paid tier ready**: For production systems

## Configuration Reference

### Complete Configuration

See `config/ibm_limits.yaml` for full configuration options:

- **Free tier limits**: Max minutes, alert thresholds
- **Rate limits**: Job intervals, concurrent limits, backoff
- **Estimation**: Backend speeds, queue times
- **Scheduling**: Time windows, batching, days to avoid
- **Emergency**: Fallback settings, paid tier
- **Monitoring**: Dashboard, logs, notifications
- **Tracking**: Database, metrics
- **Backend selection**: Priority, requirements
- **Pool management**: Thresholds, target sizes

## Troubleshooting

### Common Issues

**"Rate limit exceeded"**
- Wait for minimum job interval (5 seconds)
- Check concurrent job count
- Review exponential backoff settings

**"Credit limit reached"**
- Enable auto-fallback: `emergency.auto_fallback: true`
- Wait until next month
- Consider paid tier upgrade

**"Cannot submit job"**
- Check `get_status()` for alert level
- Review remaining credits
- Verify job estimate doesn't exceed remaining

**Dashboard not updating**
- Check file permissions in `docs/monitoring/`
- Verify Python script has write access
- Review logs at `logs/credit_monitor.log`

### Debug Commands

```bash
# Check Python environment
python3 -c "import yaml; print('PyYAML OK')"

# Verify database
sqlite3 data/ibm_usage.db "SELECT COUNT(*) FROM jobs;"

# Test credit manager
python3 src/python/ibm_rate_limiter.py

# Test scheduler
./scripts/ibm_scheduler.py --status

# Verbose logging
./scripts/ibm_credit_monitor.sh --status --verbose
```

## Support

- **Issues**: Open issue in project repository
- **Documentation**: This file and inline code documentation
- **Logs**: Check `logs/ibm_credit_alerts.log`
- **Configuration**: Review `config/ibm_limits.yaml`

---

**Last Updated**: 2025-10-30
**Version**: 1.0.0
**License**: MIT
