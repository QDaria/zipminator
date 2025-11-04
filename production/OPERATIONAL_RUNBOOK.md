# Zipminator Operational Runbook

## Table of Contents
1. [System Overview](#system-overview)
2. [Deployment](#deployment)
3. [Monitoring](#monitoring)
4. [Common Operations](#common-operations)
5. [Troubleshooting](#troubleshooting)
6. [Incident Response](#incident-response)
7. [Maintenance](#maintenance)

## System Overview

Zipminator is a production-grade post-quantum Key Encapsulation Mechanism (KEM) system that combines ML-KEM-768 with quantum random number generation (QRNG) for enhanced security.

### Architecture Components

- **QRNG Device**: ID Quantique USB QRNG for true quantum entropy
- **ML-KEM-768**: NIST-standardized post-quantum KEM algorithm
- **Entropy Pool**: 1MB buffer for high-performance random number generation
- **Health Monitor**: Continuous system health checking
- **Metrics System**: Prometheus-compatible metrics export

### Key Files and Directories

```
/etc/zipminator/          # Configuration files
/var/log/zipminator/      # Log files
/var/lib/zipminator/      # Runtime data
/usr/local/bin/           # Binaries
```

## Deployment

### Prerequisites

1. **Hardware Requirements**:
   - x86_64 CPU with AVX2 support
   - 2GB RAM minimum (4GB recommended)
   - USB port for QRNG device
   - 10GB disk space

2. **Software Requirements**:
   - Linux kernel 5.10+
   - glibc 2.31+
   - libusb 1.0+

### Installation Steps

```bash
# 1. Install dependencies
sudo apt-get update
sudo apt-get install -y libusb-1.0-0 libyaml-cpp-dev

# 2. Create system user
sudo useradd -r -s /bin/false zipminator

# 3. Install binary
sudo cp build/bin/zipminator /usr/local/bin/
sudo chmod 755 /usr/local/bin/zipminator

# 4. Install configuration
sudo mkdir -p /etc/zipminator
sudo cp production/config/zipminator.yaml /etc/zipminator/
sudo chown -R zipminator:zipminator /etc/zipminator

# 5. Create log directory
sudo mkdir -p /var/log/zipminator
sudo chown zipminator:zipminator /var/log/zipminator

# 6. Install systemd service
sudo cp production/systemd/zipminator.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable zipminator
```

### Configuration

Edit `/etc/zipminator/zipminator.yaml`:

```yaml
# Adjust based on your environment
qrng:
  device_type: "id_quantique_usb"
  fallback_enabled: true

logging:
  level: "INFO"
  log_file_path: "/var/log/zipminator/app.log"

monitoring:
  enabled: true
  metrics_endpoint: "/metrics"
  health_endpoint: "/health"
```

### Starting the Service

```bash
# Start service
sudo systemctl start zipminator

# Check status
sudo systemctl status zipminator

# View logs
sudo journalctl -u zipminator -f
```

## Monitoring

### Health Check Endpoint

```bash
# Check overall health
curl http://localhost:8443/health

# Example response:
{
  "overall_healthy": true,
  "components": [
    {"name": "qrng", "state": "HEALTHY"},
    {"name": "crypto", "state": "HEALTHY"}
  ],
  "uptime_seconds": 3600.0
}
```

### Metrics Endpoint

```bash
# Prometheus metrics
curl http://localhost:8443/metrics

# Key metrics:
# - zipminator_operations_total{operation="keygen"}
# - zipminator_operation_duration_seconds_bucket
# - zipminator_errors_total
# - zipminator_qrng_health_score
```

### Grafana Dashboard

Import the dashboard from `production/monitoring/grafana_dashboard.json`:

1. Open Grafana
2. Go to Dashboards → Import
3. Upload `grafana_dashboard.json`
4. Select your Prometheus data source

### Alerting Rules

**Critical Alerts**:
- QRNG device disconnected
- Error rate > 10 errors/second
- System health check failed
- Memory usage > 90%

**Warning Alerts**:
- QRNG entropy rate < 7.8 bits/byte
- Operation latency p95 > 100ms
- Entropy pool < 25% full

## Common Operations

### Viewing Logs

```bash
# Real-time logs
sudo journalctl -u zipminator -f

# Logs from last hour
sudo journalctl -u zipminator --since "1 hour ago"

# Error logs only
sudo journalctl -u zipminator -p err

# JSON-formatted logs
sudo tail -f /var/log/zipminator/app.log | jq '.'
```

### Checking QRNG Status

```bash
# List USB devices
lsusb | grep "ID Quantique"

# Check device permissions
ls -l /dev/ttyUSB* /dev/idq*

# Test QRNG health
zipminator-cli health --component qrng
```

### Performance Testing

```bash
# Run built-in benchmark
zipminator-cli benchmark --operations 10000

# Expected output:
# KeyGen: 5000 ops/sec (p95: 0.2ms)
# Encaps: 7000 ops/sec (p95: 0.14ms)
# Decaps: 6000 ops/sec (p95: 0.16ms)
```

### Configuration Reload

```bash
# Validate configuration
zipminator-cli config validate /etc/zipminator/zipminator.yaml

# Reload configuration (graceful)
sudo systemctl reload zipminator

# Or send SIGHUP
sudo kill -HUP $(pidof zipminator)
```

## Troubleshooting

### Problem: Service Won't Start

**Symptoms**: `systemctl start zipminator` fails

**Diagnosis**:
```bash
# Check logs
sudo journalctl -u zipminator -n 50

# Common causes:
# 1. Configuration error
zipminator-cli config validate /etc/zipminator/zipminator.yaml

# 2. QRNG device not found
lsusb | grep "ID Quantique"

# 3. Permission denied
sudo -u zipminator /usr/local/bin/zipminator --config /etc/zipminator/zipminator.yaml
```

**Solutions**:
- Fix configuration syntax errors
- Check QRNG device connection and permissions
- Verify file ownership: `sudo chown -R zipminator:zipminator /etc/zipminator`

### Problem: QRNG Device Not Found

**Symptoms**: Health check shows QRNG unhealthy

**Diagnosis**:
```bash
# Check device presence
lsusb | grep "ID Quantique"

# Check kernel messages
dmesg | grep -i usb | tail -20

# Check udev rules
ls -l /etc/udev/rules.d/*idquantique*
```

**Solutions**:
1. **Device unplugged**: Replug USB device
2. **Driver issue**:
   ```bash
   sudo modprobe usbserial
   sudo modprobe ftdi_sio
   ```
3. **Permissions**: Add udev rule:
   ```bash
   echo 'SUBSYSTEM=="usb", ATTRS{idVendor}=="0403", ATTRS{idProduct}=="6001", MODE="0666", GROUP="zipminator"' | sudo tee /etc/udev/rules.d/99-idquantique.rules
   sudo udevadm control --reload-rules
   sudo udevadm trigger
   ```

### Problem: High Error Rate

**Symptoms**: Prometheus alert: Error rate > 10/sec

**Diagnosis**:
```bash
# Check error types
curl http://localhost:8443/metrics | grep zipminator_errors_total

# View recent error logs
sudo journalctl -u zipminator -p err --since "10 minutes ago"
```

**Solutions**:
- **QRNG errors**: Check QRNG health, may need device reset
- **Crypto errors**: Check for invalid input data, may indicate attack
- **Memory errors**: Check system memory: `free -h`, may need restart

### Problem: Performance Degradation

**Symptoms**: Operation latency increasing

**Diagnosis**:
```bash
# Check current performance
zipminator-cli metrics --operation-latency

# Check system resources
top -p $(pidof zipminator)
iostat -x 1

# Check entropy pool
curl http://localhost:8443/metrics | grep entropy_available
```

**Solutions**:
- **Low entropy**: Increase `entropy_pool_size` in config
- **High CPU**: Reduce `worker_threads` or check for CPU throttling
- **Memory pressure**: Check for memory leaks, may need restart

### Problem: Memory Leak

**Symptoms**: Memory usage constantly increasing

**Diagnosis**:
```bash
# Monitor memory over time
watch -n 5 'ps aux | grep zipminator'

# Check for leaks with valgrind (dev environment only)
valgrind --leak-check=full zipminator --config /etc/zipminator/zipminator.yaml
```

**Solutions**:
1. **Short-term**: Restart service
2. **Long-term**: Report bug with valgrind output

## Incident Response

### Severity Levels

**P0 - Critical (Immediate Response)**:
- Complete service outage
- Security breach detected
- Data integrity compromised

**P1 - High (Response within 1 hour)**:
- QRNG failure with fallback active
- Error rate > 50/sec
- Health check failures

**P2 - Medium (Response within 4 hours)**:
- Performance degradation > 50%
- QRNG entropy quality issues
- High memory usage

**P3 - Low (Response within 24 hours)**:
- Minor performance degradation
- Non-critical warnings
- Maintenance reminders

### Incident Response Checklist

**Immediate Actions**:
1. [ ] Acknowledge alert in monitoring system
2. [ ] Check service status: `systemctl status zipminator`
3. [ ] Review recent logs: `journalctl -u zipminator --since "1 hour ago"`
4. [ ] Check health endpoint: `curl http://localhost:8443/health`
5. [ ] Verify QRNG device: `lsusb | grep "ID Quantique"`

**Investigation**:
1. [ ] Collect diagnostic bundle:
   ```bash
   zipminator-cli diagnostics --output /tmp/zipminator-diag.tar.gz
   ```
2. [ ] Review metrics dashboard
3. [ ] Check for system-wide issues: `dmesg | tail -50`
4. [ ] Compare with recent changes (deployments, config changes)

**Mitigation**:
1. [ ] If service down: Restart service
2. [ ] If QRNG failed: Verify fallback active, check device
3. [ ] If under attack: Enable rate limiting, review audit logs
4. [ ] Document actions taken

**Post-Incident**:
1. [ ] Write incident report
2. [ ] Update runbook with lessons learned
3. [ ] Create tickets for preventive measures
4. [ ] Schedule postmortem meeting

### Emergency Procedures

**Complete Service Restart**:
```bash
sudo systemctl stop zipminator
sleep 5
sudo systemctl start zipminator
sudo systemctl status zipminator
```

**Emergency Rollback**:
```bash
# Restore previous version
sudo cp /usr/local/bin/zipminator.backup /usr/local/bin/zipminator
sudo systemctl restart zipminator
```

**QRNG Device Reset**:
```bash
# Unplug and replug USB device, or:
sudo usbreset $(lsusb | grep "ID Quantique" | awk '{print $2":"$4}' | sed 's/://')
sudo systemctl restart zipminator
```

## Maintenance

### Regular Maintenance Tasks

**Daily**:
- [ ] Review error logs for anomalies
- [ ] Check Grafana dashboard for trends
- [ ] Verify all health checks passing

**Weekly**:
- [ ] Review performance metrics
- [ ] Check disk space: `df -h /var/log/zipminator`
- [ ] Rotate logs: `logrotate /etc/logrotate.d/zipminator`

**Monthly**:
- [ ] Update system packages
- [ ] Review and update configuration
- [ ] Test backup and restore procedures
- [ ] Review incident reports

**Quarterly**:
- [ ] Perform security audit
- [ ] Update dependencies
- [ ] Capacity planning review
- [ ] Disaster recovery drill

### Backup Procedures

**Configuration Backup**:
```bash
sudo tar czf zipminator-config-$(date +%Y%m%d).tar.gz /etc/zipminator/
```

**Log Archival**:
```bash
sudo tar czf zipminator-logs-$(date +%Y%m%d).tar.gz /var/log/zipminator/
sudo mv zipminator-logs-*.tar.gz /backup/zipminator/
```

### Update Procedures

**Before Update**:
1. Backup configuration
2. Backup current binary
3. Review changelog
4. Test in staging environment

**Update Process**:
```bash
# 1. Stop service
sudo systemctl stop zipminator

# 2. Backup current binary
sudo cp /usr/local/bin/zipminator /usr/local/bin/zipminator.backup

# 3. Install new binary
sudo cp build/bin/zipminator /usr/local/bin/
sudo chmod 755 /usr/local/bin/zipminator

# 4. Validate configuration compatibility
zipminator-cli config validate /etc/zipminator/zipminator.yaml

# 5. Start service
sudo systemctl start zipminator

# 6. Monitor for 15 minutes
sudo journalctl -u zipminator -f
```

**Rollback Process**:
```bash
sudo systemctl stop zipminator
sudo cp /usr/local/bin/zipminator.backup /usr/local/bin/zipminator
sudo systemctl start zipminator
```

## Contact Information

- **On-Call Engineer**: [Your PagerDuty/Opsgenie]
- **Security Team**: security@example.com
- **Development Team**: dev@example.com
- **Documentation**: https://zipminator.example.com/docs

## References

- [ML-KEM Specification (FIPS 203)](https://csrc.nist.gov/publications/detail/fips/203/final)
- [QRNG Best Practices](https://www.idquantique.com/)
- [Prometheus Monitoring](https://prometheus.io/docs/)
- [Grafana Dashboards](https://grafana.com/docs/)
