#!/bin/bash
# IBM Quantum Credit Monitor
# Monitors IBM credit usage and generates status reports

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/config/ibm_limits.yaml"
PYTHON_SCRIPT="$PROJECT_ROOT/src/python/ibm_rate_limiter.py"
OUTPUT_DIR="$PROJECT_ROOT/docs/monitoring"
LOG_FILE="$PROJECT_ROOT/logs/credit_monitor.log"

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ensure directories exist
mkdir -p "$OUTPUT_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Error handling
error() {
    echo -e "${RED}ERROR: $*${NC}" >&2
    log "ERROR: $*"
    exit 1
}

# Check Python availability
check_python() {
    if ! command -v python3 &> /dev/null; then
        error "python3 not found. Please install Python 3.8+"
    fi

    # Check required packages
    python3 -c "import yaml" 2>/dev/null || error "PyYAML not installed. Run: pip install pyyaml"
}

# Get status from Python manager
get_status() {
    python3 - <<EOF
import sys
sys.path.insert(0, '$PROJECT_ROOT/src/python')
from ibm_rate_limiter import IBMCreditManager
import json

manager = IBMCreditManager('$CONFIG_FILE')
status = manager.get_status()
print(json.dumps(status.to_dict(), indent=2))
EOF
}

# Get metrics for Prometheus
get_metrics() {
    python3 - <<EOF
import sys
sys.path.insert(0, '$PROJECT_ROOT/src/python')
from ibm_rate_limiter import IBMCreditManager

manager = IBMCreditManager('$CONFIG_FILE')
metrics = manager.export_metrics()

for key, value in metrics.items():
    print(f"{key} {value}")
EOF
}

# Generate status dashboard
generate_dashboard() {
    local status_json="$1"
    local dashboard_file="$OUTPUT_DIR/ibm_credit_dashboard.md"

    # Extract values from JSON
    local used_minutes=$(echo "$status_json" | python3 -c "import sys, json; print(json.load(sys.stdin)['used_minutes'])")
    local remaining_minutes=$(echo "$status_json" | python3 -c "import sys, json; print(json.load(sys.stdin)['remaining_minutes'])")
    local max_minutes=$(echo "$status_json" | python3 -c "import sys, json; print(json.load(sys.stdin)['max_minutes'])")
    local percentage=$(echo "$status_json" | python3 -c "import sys, json; print(json.load(sys.stdin)['percentage_used'])")
    local alert_level=$(echo "$status_json" | python3 -c "import sys, json; print(json.load(sys.stdin)['alert_level'])")
    local jobs_count=$(echo "$status_json" | python3 -c "import sys, json; print(json.load(sys.stdin)['jobs_submitted'])")
    local can_submit=$(echo "$status_json" | python3 -c "import sys, json; print(json.load(sys.stdin)['can_submit'])")
    local time_until_reset=$(echo "$status_json" | python3 -c "import sys, json; print(json.load(sys.stdin)['time_until_reset'])")

    # Determine status emoji and color
    local status_emoji="✅"
    local status_color="green"
    case "$alert_level" in
        "warning")
            status_emoji="⚠️"
            status_color="yellow"
            ;;
        "critical")
            status_emoji="🔴"
            status_color="orange"
            ;;
        "emergency"|"exhausted")
            status_emoji="🚨"
            status_color="red"
            ;;
    esac

    # Generate progress bar
    local bar_length=50
    local filled=$(python3 -c "print(int($percentage * $bar_length / 100))")
    local empty=$((bar_length - filled))
    local progress_bar=$(printf '█%.0s' $(seq 1 $filled))$(printf '░%.0s' $(seq 1 $empty))

    # Create dashboard
    cat > "$dashboard_file" <<DASHBOARD
# IBM Quantum Credit Dashboard

**Last Updated:** $(date '+%Y-%m-%d %H:%M:%S %Z')

---

## Current Status: $status_emoji **${alert_level^^}**

\`\`\`
Progress: [$progress_bar] ${percentage}%
\`\`\`

### Credit Usage

| Metric | Value |
|--------|-------|
| **Used** | ${used_minutes} minutes |
| **Remaining** | ${remaining_minutes} minutes |
| **Total Limit** | ${max_minutes} minutes |
| **Percentage Used** | ${percentage}% |
| **Alert Level** | ${alert_level} $status_emoji |

### Job Statistics

| Metric | Value |
|--------|-------|
| **Jobs This Month** | ${jobs_count} |
| **Can Submit Now** | ${can_submit} |
| **Time Until Reset** | ${time_until_reset} |

---

## Alert Thresholds

| Level | Threshold | Status |
|-------|-----------|--------|
| Warning | 80% (8 min) | $([ "${percentage%.*}" -ge 80 ] && echo "🔴 EXCEEDED" || echo "✅ OK") |
| Critical | 90% (9 min) | $([ "${percentage%.*}" -ge 90 ] && echo "🔴 EXCEEDED" || echo "✅ OK") |
| Emergency | 95% (9.5 min) | $([ "${percentage%.*}" -ge 95 ] && echo "🔴 EXCEEDED" || echo "✅ OK") |

---

## Recent History

\`\`\`bash
# View detailed history
python3 src/python/ibm_rate_limiter.py --history 30

# Check job queue
scripts/ibm_scheduler.py --status

# View logs
tail -f logs/ibm_credit_alerts.log
\`\`\`

---

## Actions

### If Approaching Limit:
1. **Review pending jobs** - Cancel non-critical harvests
2. **Enable classical fallback** - Ensure seamless RNG availability
3. **Consider paid tier** - Evaluate cost-benefit analysis

### Emergency Procedures:
1. **Stop all harvests**: \`scripts/ibm_harvest_stop.sh\`
2. **Enable fallback**: Set \`emergency.auto_fallback: true\` in config
3. **Alert team**: Check logs and notification channels

---

## Configuration

**Config File:** \`config/ibm_limits.yaml\`

**Key Settings:**
- Max Minutes: ${max_minutes}
- Auto Fallback: Enabled
- Manual Approval: > 0.5 minutes
- Rate Limit: 5 seconds between jobs

---

## Monitoring Commands

\`\`\`bash
# Real-time status
watch -n 60 scripts/ibm_credit_monitor.sh --status

# Export metrics (Prometheus)
scripts/ibm_credit_monitor.sh --metrics

# Generate report
scripts/ibm_credit_monitor.sh --report

# Alert history
scripts/ibm_credit_monitor.sh --alerts
\`\`\`

---

**Documentation:** \`docs/ibm_credit_management.md\`
**Support:** Open issue at project repository
DASHBOARD

    log "Dashboard generated: $dashboard_file"
    echo "$dashboard_file"
}

# Check for alerts
check_alerts() {
    local status_json="$1"
    local alert_level=$(echo "$status_json" | python3 -c "import sys, json; print(json.load(sys.stdin)['alert_level'])")
    local percentage=$(echo "$status_json" | python3 -c "import sys, json; print(json.load(sys.stdin)['percentage_used'])")

    case "$alert_level" in
        "warning")
            echo -e "${YELLOW}⚠️  WARNING: IBM credits at ${percentage}% usage${NC}"
            ;;
        "critical")
            echo -e "${YELLOW}🔴 CRITICAL: IBM credits at ${percentage}% usage${NC}"
            ;;
        "emergency")
            echo -e "${RED}🚨 EMERGENCY: IBM credits at ${percentage}% usage - approaching limit!${NC}"
            ;;
        "exhausted")
            echo -e "${RED}🚫 EXHAUSTED: IBM credit limit reached! Falling back to classical RNG.${NC}"
            ;;
        *)
            echo -e "${GREEN}✅ OK: IBM credits at ${percentage}% usage${NC}"
            ;;
    esac
}

# Show status
show_status() {
    log "Fetching IBM credit status..."

    local status_json=$(get_status)

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "           IBM QUANTUM CREDIT MONITOR"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    check_alerts "$status_json"

    echo ""
    echo "$status_json" | python3 -m json.tool
    echo ""

    # Generate dashboard
    local dashboard=$(generate_dashboard "$status_json")
    echo -e "${BLUE}Dashboard: $dashboard${NC}"
    echo ""
}

# Show Prometheus metrics
show_metrics() {
    log "Exporting Prometheus metrics..."
    get_metrics
}

# Show alert history
show_alerts_history() {
    log "Fetching alert history..."

    python3 - <<EOF
import sys
import sqlite3
from pathlib import Path

db_path = Path('$PROJECT_ROOT/data/ibm_usage.db')
if not db_path.exists():
    print("No alert history available")
    sys.exit(0)

with sqlite3.connect(db_path) as conn:
    cursor = conn.execute("""
        SELECT timestamp, alert_level, message, usage_percentage, acknowledged
        FROM alerts
        ORDER BY timestamp DESC
        LIMIT 20
    """)

    print("\nRecent Alerts:")
    print("━" * 80)
    for row in cursor.fetchall():
        timestamp, level, message, usage, ack = row
        ack_status = "✓" if ack else " "
        print(f"[{ack_status}] {timestamp} | {level:10s} | {usage:5.1f}% | {message}")
    print("━" * 80)
EOF
}

# Generate report
generate_report() {
    log "Generating credit usage report..."

    python3 - <<EOF
import sys
sys.path.insert(0, '$PROJECT_ROOT/src/python')
from ibm_rate_limiter import IBMCreditManager
import json

manager = IBMCreditManager('$CONFIG_FILE')
history = manager.get_historical_usage(days=30)

print("\nIBM Quantum Usage Report (Last 30 Days)")
print("━" * 100)
print(f"{'Date':<12} {'Jobs':>6} {'Shots':>10} {'Minutes':>8} {'Entropy (KB)':>12} {'Queue (s)':>10} {'Success':>8}")
print("━" * 100)

total_jobs = 0
total_minutes = 0
total_entropy = 0

for day in history:
    date = day['date']
    jobs = day['jobs'] or 0
    shots = day['total_shots'] or 0
    minutes = day['total_minutes'] or 0
    entropy = (day['total_entropy'] or 0) / 1024  # Convert to KB
    queue_time = day['avg_queue_time'] or 0
    success_rate = (day['success_rate'] or 0) * 100

    total_jobs += jobs
    total_minutes += minutes
    total_entropy += entropy

    print(f"{date:<12} {jobs:>6} {shots:>10} {minutes:>8.3f} {entropy:>12.1f} {queue_time:>10.1f} {success_rate:>7.1f}%")

print("━" * 100)
print(f"{'TOTAL':<12} {total_jobs:>6} {'':<10} {total_minutes:>8.3f} {total_entropy:>12.1f}")
print("━" * 100)
EOF
}

# Main function
main() {
    local command="${1:-status}"

    check_python

    case "$command" in
        --status|-s|status)
            show_status
            ;;
        --metrics|-m|metrics)
            show_metrics
            ;;
        --alerts|-a|alerts)
            show_alerts_history
            ;;
        --report|-r|report)
            generate_report
            ;;
        --dashboard|-d|dashboard)
            local status_json=$(get_status)
            generate_dashboard "$status_json"
            ;;
        --help|-h|help)
            cat <<HELP
IBM Quantum Credit Monitor

Usage: $0 [COMMAND]

Commands:
    status, --status, -s     Show current credit status (default)
    metrics, --metrics, -m   Export Prometheus metrics
    alerts, --alerts, -a     Show alert history
    report, --report, -r     Generate usage report
    dashboard, --dashboard, -d Generate dashboard
    help, --help, -h         Show this help message

Examples:
    $0                       # Show status
    $0 --metrics             # Export metrics
    $0 --report              # Generate report
    watch -n 60 $0           # Monitor in real-time

Configuration: $CONFIG_FILE
Log File: $LOG_FILE
HELP
            ;;
        *)
            error "Unknown command: $command. Use --help for usage."
            ;;
    esac
}

# Run main function
main "$@"
