# Automated Monthly Quantum Entropy Harvesting

**Date**: 2025-10-30
**Target**: IBM Quantum Free Tier (10 minutes/month)

---

## 🎯 Quick Answer: YES, You Should Automate!

With IBM's 10 free minutes per month, **automated monthly harvesting is perfect**!

### Why Automate?

1. **Never Forget**: Harvest runs automatically on the 1st of each month
2. **Maximize Value**: Use your full 10 minutes before they expire
3. **Pool Always Full**: Never run out of quantum entropy
4. **Zero Maintenance**: Set it and forget it

---

## 📊 Optimal Strategy for 10 Minutes/Month

### Single Monthly Harvest (Recommended)
```
Schedule: 1st of every month, 2:00 AM UTC
Backend: IBM Fez (156 qubits)
Qubits Used: 144 (18 bytes per shot)
Shots: 445 shots
Entropy Generated: ~8 KB (8,010 bytes)
Credit Usage: ~10 minutes (100% utilization)
```

**Result**: 8 KB/month quantum entropy, perfect for MVP!

### Alternative: Bi-Weekly Harvest (Conservative)
```
Schedule: 1st and 15th, 2:00 AM UTC
Backend: IBM Strasbourg (127 qubits)
Qubits Used: 120 (15 bytes per shot)
Shots: 222 shots per harvest
Entropy Generated: ~3.3 KB per harvest, ~6.6 KB/month
Credit Usage: ~5 minutes per harvest (10 minutes total)
```

**Result**: Lower risk of exhaustion, but slightly less total entropy.

---

## 🚀 Complete Automation Setup

I'll create a comprehensive automated system for you with 3 methods:

### Method 1: Cron Job (Linux/macOS)
### Method 2: systemd Timer (Linux)
### Method 3: launchd (macOS)

---

## Method 1: Cron Job (Simplest)

### 1. Create Harvest Script

```bash
#!/bin/bash
# /usr/local/bin/monthly_quantum_harvest.sh

set -euo pipefail

# Configuration
ENTROPY_DIR="/var/lib/zipminator/quantum"
LOG_FILE="/var/log/zipminator/harvest.log"
POOL_PATH="$ENTROPY_DIR/quantum_entropy.qep"
TARGET_BYTES=8000
BACKEND="ibm_fez"

# Ensure directories exist
mkdir -p "$ENTROPY_DIR" "$(dirname "$LOG_FILE")"

# Log start
echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting monthly quantum harvest" >> "$LOG_FILE"

# Load environment
export IBM_QUANTUM_TOKEN="$(cat ~/.config/zipminator/ibm_token)"

# Check pool status
CURRENT_BYTES=0
if [ -f "$POOL_PATH" ]; then
    CURRENT_BYTES=$(python3 -c "
from quantum_entropy_pool import QuantumEntropyPool
pool = QuantumEntropyPool.open('$POOL_PATH')
print(pool.bytes_remaining)
" 2>/dev/null || echo "0")
fi

echo "$(date '+%Y-%m-%d %H:%M:%S') - Current pool: $CURRENT_BYTES bytes" >> "$LOG_FILE"

# Harvest if below threshold (2 KB)
if [ "$CURRENT_BYTES" -lt 2048 ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Pool low, harvesting..." >> "$LOG_FILE"

    python3 /usr/local/bin/optimal_harvest.py \
        --backend "$BACKEND" \
        --bytes "$TARGET_BYTES" \
        --output "$POOL_PATH" \
        >> "$LOG_FILE" 2>&1

    EXIT_CODE=$?

    if [ $EXIT_CODE -eq 0 ]; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') - ✓ Harvest successful!" >> "$LOG_FILE"

        # Send success notification (optional)
        # mail -s "Quantum Harvest Successful" you@example.com < /dev/null
    else
        echo "$(date '+%Y-%m-%d %H:%M:%S') - ✗ Harvest failed (exit $EXIT_CODE)" >> "$LOG_FILE"

        # Send error notification (optional)
        # mail -s "Quantum Harvest FAILED" you@example.com < "$LOG_FILE"
    fi
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Pool sufficient, skipping harvest" >> "$LOG_FILE"
fi

echo "$(date '+%Y-%m-%d %H:%M:%S') - Harvest check complete" >> "$LOG_FILE"
```

### 2. Make Script Executable

```bash
chmod +x /usr/local/bin/monthly_quantum_harvest.sh
```

### 3. Create Cron Job

```bash
# Open crontab editor
crontab -e

# Add this line (runs 1st of month at 2:00 AM):
0 2 1 * * /usr/local/bin/monthly_quantum_harvest.sh

# Alternative: Bi-weekly (1st and 15th)
0 2 1,15 * * /usr/local/bin/monthly_quantum_harvest.sh

# Alternative: Weekly (every Sunday)
0 2 * * 0 /usr/local/bin/monthly_quantum_harvest.sh
```

### 4. Verify Cron Job

```bash
# List current cron jobs
crontab -l

# Test the script manually
/usr/local/bin/monthly_quantum_harvest.sh

# Check logs
tail -f /var/log/zipminator/harvest.log
```

---

## Method 2: systemd Timer (Linux)

### 1. Create Service File

```ini
# /etc/systemd/system/quantum-harvest.service

[Unit]
Description=Monthly Quantum Entropy Harvest
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=qdaria
Group=qdaria
WorkingDirectory=/home/qdaria
EnvironmentFile=/etc/zipminator/quantum.env
ExecStart=/usr/local/bin/monthly_quantum_harvest.sh
StandardOutput=journal
StandardError=journal

# Security hardening
PrivateTmp=yes
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/zipminator/quantum /var/log/zipminator

[Install]
WantedBy=multi-user.target
```

### 2. Create Timer File

```ini
# /etc/systemd/system/quantum-harvest.timer

[Unit]
Description=Monthly Quantum Harvest Timer
Requires=quantum-harvest.service

[Timer]
# Run on the 1st of every month at 2:00 AM
OnCalendar=monthly
Persistent=true
RandomizedDelaySec=1h

[Install]
WantedBy=timers.target
```

### 3. Create Environment File

```bash
# /etc/zipminator/quantum.env
IBM_QUANTUM_TOKEN=your_token_here
ENTROPY_DIR=/var/lib/zipminator/quantum
LOG_FILE=/var/log/zipminator/harvest.log
```

### 4. Enable and Start Timer

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable timer (survives reboots)
sudo systemctl enable quantum-harvest.timer

# Start timer
sudo systemctl start quantum-harvest.timer

# Check timer status
sudo systemctl status quantum-harvest.timer

# List all timers
systemctl list-timers

# View logs
sudo journalctl -u quantum-harvest.service -f
```

---

## Method 3: launchd (macOS)

### 1. Create Plist File

```xml
<!-- ~/Library/LaunchAgents/com.qdaria.quantum-harvest.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.qdaria.quantum-harvest</string>

    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/monthly_quantum_harvest.sh</string>
    </array>

    <key>StartCalendarInterval</key>
    <dict>
        <key>Day</key>
        <integer>1</integer>
        <key>Hour</key>
        <integer>2</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>

    <key>StandardOutPath</key>
    <string>/var/log/zipminator/harvest.log</string>

    <key>StandardErrorPath</key>
    <string>/var/log/zipminator/harvest.err</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>IBM_QUANTUM_TOKEN</key>
        <string>your_token_here</string>
    </dict>

    <key>RunAtLoad</key>
    <false/>
</dict>
</plist>
```

### 2. Load and Start

```bash
# Load the job
launchctl load ~/Library/LaunchAgents/com.qdaria.quantum-harvest.plist

# Start it now (for testing)
launchctl start com.qdaria.quantum-harvest

# Check status
launchctl list | grep quantum-harvest

# View logs
tail -f /var/log/zipminator/harvest.log

# Unload (to stop)
launchctl unload ~/Library/LaunchAgents/com.qdaria.quantum-harvest.plist
```

---

## 📊 Monitoring Dashboard

### Create Status Check Script

```bash
#!/bin/bash
# /usr/local/bin/quantum_status.sh

echo "=== Quantum Entropy Pool Status ==="
echo ""

# Pool status
POOL_PATH="/var/lib/zipminator/quantum/quantum_entropy.qep"
if [ -f "$POOL_PATH" ]; then
    python3 << EOF
from quantum_entropy_pool import QuantumEntropyPool
import datetime

pool = QuantumEntropyPool.open('$POOL_PATH')
print(f"Pool Size: {pool.bytes_remaining:,} bytes")
print(f"Capacity: {(pool.bytes_remaining / 8192 * 100):.1f}% (8 KB target)")
print(f"Backend: {pool.backend}")
print(f"Last Updated: {datetime.datetime.fromtimestamp(pool.timestamp).strftime('%Y-%m-%d %H:%M:%S')}")

# Days until refill needed
bytes_per_day = 640  # 10 Kyber key pairs
days_remaining = pool.bytes_remaining / bytes_per_day
print(f"Days Remaining: {days_remaining:.1f} days")
EOF
else
    echo "Pool file not found!"
fi

echo ""
echo "=== Last Harvest ==="
tail -n 20 /var/log/zipminator/harvest.log | grep -E "(Starting|successful|failed|complete)"

echo ""
echo "=== Next Scheduled Harvest ==="
# For cron
crontab -l | grep quantum

# For systemd
# systemctl list-timers | grep quantum

# For launchd
# launchctl list | grep quantum
```

### Daily Status Email (Optional)

```bash
# Add to cron for daily status email
0 8 * * * /usr/local/bin/quantum_status.sh | mail -s "Quantum Pool Status" you@example.com
```

---

## 🚨 Error Handling & Alerts

### Email Notifications (Optional)

```bash
#!/bin/bash
# In your harvest script, add:

send_alert() {
    local SUBJECT="$1"
    local BODY="$2"

    # Option 1: Using mail command
    echo "$BODY" | mail -s "$SUBJECT" your-email@example.com

    # Option 2: Using sendmail
    # (echo "Subject: $SUBJECT"; echo ""; echo "$BODY") | sendmail your-email@example.com

    # Option 3: Using curl + Mailgun
    # curl -s --user 'api:YOUR_API_KEY' \
    #     https://api.mailgun.net/v3/YOUR_DOMAIN/messages \
    #     -F from='Quantum Harvester <harvester@your-domain.com>' \
    #     -F to='your-email@example.com' \
    #     -F subject="$SUBJECT" \
    #     -F text="$BODY"
}

# Alert on failure
if [ $HARVEST_FAILED ]; then
    send_alert "Quantum Harvest FAILED" "Check logs at $LOG_FILE"
fi

# Alert on low credits
CREDITS_REMAINING=$(python3 -c "from ibm_rate_limiter import IBMCreditManager; print(IBMCreditManager().get_status().remaining_minutes)")
if (( $(echo "$CREDITS_REMAINING < 2" | bc -l) )); then
    send_alert "Low IBM Credits" "Only ${CREDITS_REMAINING} minutes remaining"
fi
```

### Slack/Discord Webhook (Optional)

```bash
send_slack_alert() {
    local MESSAGE="$1"
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"$MESSAGE\"}" \
        YOUR_SLACK_WEBHOOK_URL
}

send_slack_alert "✓ Quantum harvest successful: 8,010 bytes generated"
```

---

## 📅 Recommended Schedule

### For MVP (Recommended)
```
Schedule: Monthly (1st at 2:00 AM)
Target: 8 KB
Credits: ~10 minutes (100% utilization)
Rationale: Maximum entropy, simple maintenance
```

### For Production (High Usage)
```
Schedule: Bi-weekly (1st and 15th at 2:00 AM)
Target: 3.3 KB per harvest
Credits: ~5 minutes per harvest
Rationale: More consistent pool levels
```

### For Testing (Conservative)
```
Schedule: Weekly (Sunday at 2:00 AM)
Target: 1 KB per harvest
Credits: ~1.25 minutes per harvest
Rationale: Frequent validation, lower risk
```

---

## 🎯 Next Steps

### 1. Choose Your Method

- **Cron**: Simplest, works everywhere
- **systemd**: Linux, best for servers
- **launchd**: macOS, best for desktops

### 2. Set Up Automation (5 minutes)

```bash
# Copy harvest script
sudo cp scripts/optimal_harvest.py /usr/local/bin/
sudo cp scripts/monthly_quantum_harvest.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/monthly_quantum_harvest.sh

# Create directories
sudo mkdir -p /var/lib/zipminator/quantum
sudo mkdir -p /var/log/zipminator

# Set permissions
sudo chown $USER:$USER /var/lib/zipminator/quantum
sudo chown $USER:$USER /var/log/zipminator

# Configure cron
crontab -e
# Add: 0 2 1 * * /usr/local/bin/monthly_quantum_harvest.sh
```

### 3. Test Before Production

```bash
# Run manually first
/usr/local/bin/monthly_quantum_harvest.sh

# Check logs
tail -f /var/log/zipminator/harvest.log

# Verify pool
python3 /usr/local/bin/quantum_status.sh
```

### 4. Monitor First Month

- Check logs daily for first week
- Verify harvest completed successfully
- Confirm entropy pool updated
- Adjust schedule if needed

---

## 📊 Expected Results

### After 1 Month
- **Entropy Pool**: 8 KB fresh quantum entropy
- **Credits Used**: ~10 minutes (100%)
- **Log File**: Complete audit trail
- **Status**: Pool ready for use

### After 3 Months
- **Total Generated**: 24 KB quantum entropy
- **Kyber Operations**: ~375 key pairs possible
- **Reliability**: 99%+ uptime (if configured correctly)
- **Cost**: $0 (completely free!)

---

## 🚀 Advanced: Multi-Backend Failover

### Intelligent Backend Selection

```bash
# Enhanced harvest script with fallback
BACKENDS=("ibm_fez" "ibm_strasbourg" "ibm_brisbane" "ibm_sherbrooke")

for BACKEND in "${BACKENDS[@]}"; do
    echo "Trying $BACKEND..."

    if python3 /usr/local/bin/optimal_harvest.py \
        --backend "$BACKEND" \
        --bytes 8000 \
        --output "$POOL_PATH" 2>&1 | tee -a "$LOG_FILE"; then

        echo "✓ Success with $BACKEND"
        exit 0
    else
        echo "✗ Failed with $BACKEND, trying next..."
    fi
done

echo "✗ All backends failed!"
exit 1
```

---

## ✅ Automation Checklist

- [ ] Choose automation method (cron/systemd/launchd)
- [ ] Copy scripts to /usr/local/bin
- [ ] Create directories (/var/lib, /var/log)
- [ ] Set file permissions (0700 for scripts)
- [ ] Configure schedule (monthly recommended)
- [ ] Test manual execution
- [ ] Verify log output
- [ ] Set up monitoring (optional)
- [ ] Configure alerts (optional)
- [ ] Document in runbook

---

**Status**: ✅ **AUTOMATION GUIDE COMPLETE**
**Recommendation**: Use cron job with monthly schedule
**Expected Benefit**: 8 KB/month quantum entropy, zero maintenance

🚀 **Ready for automated monthly quantum entropy harvesting!**
