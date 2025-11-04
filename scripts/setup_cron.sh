#!/bin/bash
# Setup Automated Monthly Quantum Harvest
# This script configures a cron job for automatic monthly harvesting

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARVEST_SCRIPT="$SCRIPT_DIR/monthly_quantum_harvest.sh"

echo "Setting up automated monthly quantum harvest..."
echo ""

# Check if harvest script exists
if [ ! -f "$HARVEST_SCRIPT" ]; then
    echo "ERROR: Harvest script not found at $HARVEST_SCRIPT"
    exit 1
fi

# Make sure it's executable
chmod +x "$HARVEST_SCRIPT"

# Create the cron entry
CRON_ENTRY="0 2 1 * * $HARVEST_SCRIPT >> $SCRIPT_DIR/../logs/cron.log 2>&1"

echo "This will add the following cron job:"
echo ""
echo "  $CRON_ENTRY"
echo ""
echo "This means: Run on the 1st of every month at 2:00 AM"
echo ""

# Check if cron entry already exists
if crontab -l 2>/dev/null | grep -q "$HARVEST_SCRIPT"; then
    echo "⚠️  Cron job already exists!"
    echo ""
    echo "Current quantum harvest cron jobs:"
    crontab -l | grep "$HARVEST_SCRIPT" || true
    echo ""
    read -p "Do you want to replace it? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi

    # Remove old entry
    crontab -l | grep -v "$HARVEST_SCRIPT" | crontab -
    echo "Old entry removed."
fi

# Add new entry
(crontab -l 2>/dev/null || true; echo "$CRON_ENTRY") | crontab -

echo ""
echo "✓ Cron job installed successfully!"
echo ""
echo "Current crontab:"
crontab -l
echo ""
echo "To verify it's working, you can:"
echo "  1. Check logs: tail -f $SCRIPT_DIR/../logs/quantum_harvest.log"
echo "  2. Run manually: $HARVEST_SCRIPT"
echo "  3. List cron jobs: crontab -l"
echo "  4. Remove cron job: crontab -e (then delete the line)"
echo ""
echo "Next automatic harvest: 1st of next month at 2:00 AM"
