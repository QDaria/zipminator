#!/bin/bash
# Automated Monthly Quantum Entropy Harvest
# Location: /Users/mos/dev/qdaria-qrng/scripts/monthly_quantum_harvest.sh
# Purpose: Harvest quantum entropy from IBM Quantum once per month

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENTROPY_DIR="$PROJECT_ROOT/quantum_entropy"
LOG_DIR="$PROJECT_ROOT/logs"
LOG_FILE="$LOG_DIR/quantum_harvest.log"
POOL_PATH="$ENTROPY_DIR/quantum_entropy.qep"
TARGET_BYTES=8000
BACKEND="ibm_fez"  # 156 qubits, most efficient

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ensure directories exist
mkdir -p "$ENTROPY_DIR" "$LOG_DIR"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✓ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠ $1${NC}" | tee -a "$LOG_FILE"
}

# Load environment
if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
    log "Environment loaded from .env"
else
    log_error ".env file not found at $PROJECT_ROOT/.env"
    exit 1
fi

# Verify IBM token
if [ -z "${IBM_QUANTUM_TOKEN:-}" ]; then
    log_error "IBM_QUANTUM_TOKEN not set in environment"
    exit 1
fi

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    log_error "python3 not found in PATH"
    exit 1
fi

# Check pool status
log "Checking current entropy pool status..."
CURRENT_BYTES=0
if [ -f "$POOL_PATH" ]; then
    CURRENT_BYTES=$(python3 -c "
import sys
sys.path.insert(0, '$PROJECT_ROOT/src/python')
try:
    from quantum_entropy_pool import QuantumEntropyPool
    pool = QuantumEntropyPool.open('$POOL_PATH')
    print(pool.bytes_remaining)
except Exception as e:
    print(0)
" 2>/dev/null || echo "0")

    log "Current pool: $CURRENT_BYTES bytes"
else
    log "No existing pool found, will create new one"
fi

# Decide if we need to harvest
THRESHOLD=2048  # 2 KB minimum
if [ "$CURRENT_BYTES" -lt "$THRESHOLD" ]; then
    log "Pool below threshold ($CURRENT_BYTES < $THRESHOLD bytes), harvesting..."

    # Run the harvest
    log "Starting quantum entropy harvest..."
    log "Backend: $BACKEND"
    log "Target: $TARGET_BYTES bytes"

    if python3 "$SCRIPT_DIR/optimal_harvest.py" \
        --backend "$BACKEND" \
        --bytes "$TARGET_BYTES" \
        --output "$POOL_PATH" \
        2>&1 | tee -a "$LOG_FILE"; then

        EXIT_CODE=${PIPESTATUS[0]}

        if [ $EXIT_CODE -eq 0 ]; then
            log_success "Harvest completed successfully!"

            # Verify new pool
            NEW_BYTES=$(python3 -c "
import sys
sys.path.insert(0, '$PROJECT_ROOT/src/python')
from quantum_entropy_pool import QuantumEntropyPool
pool = QuantumEntropyPool.open('$POOL_PATH')
print(pool.bytes_remaining)
" 2>/dev/null || echo "0")

            log_success "New pool size: $NEW_BYTES bytes"

            # Calculate next harvest date (30 days from now)
            NEXT_HARVEST=$(date -v+30d '+%Y-%m-%d' 2>/dev/null || date -d '+30 days' '+%Y-%m-%d' 2>/dev/null || echo "in 30 days")
            log "Next scheduled harvest: $NEXT_HARVEST"

        else
            log_error "Harvest failed with exit code $EXIT_CODE"
            exit $EXIT_CODE
        fi
    else
        log_error "Harvest script execution failed"
        exit 1
    fi
else
    log "Pool sufficient ($CURRENT_BYTES bytes), skipping harvest"

    # Estimate days remaining (assuming 640 bytes/day usage for 10 Kyber ops)
    BYTES_PER_DAY=640
    DAYS_REMAINING=$(echo "scale=1; $CURRENT_BYTES / $BYTES_PER_DAY" | bc)
    log "Estimated days remaining: $DAYS_REMAINING days"
fi

log "Harvest check complete"
log "----------------------------------------"

exit 0
