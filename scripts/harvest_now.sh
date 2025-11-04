#!/bin/bash
# Run Quantum Entropy Harvest NOW (manual execution)
# Usage: ./harvest_now.sh [bytes] [backend]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Default parameters
BYTES=${1:-1000}  # Default 1 KB
BACKEND=${2:-ibm_fez}  # Default to IBM Fez (156 qubits)

echo "=========================================="
echo "  Quantum Entropy Harvest"
echo "=========================================="
echo ""
echo "Target:  $BYTES bytes"
echo "Backend: $BACKEND"
echo ""

# Load environment
if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
else
    echo "ERROR: .env file not found"
    exit 1
fi

# Verify token
if [ -z "${IBM_QUANTUM_TOKEN:-}" ]; then
    echo "ERROR: IBM_QUANTUM_TOKEN not set"
    exit 1
fi

# Create directories
mkdir -p "$PROJECT_ROOT/quantum_entropy"
mkdir -p "$PROJECT_ROOT/logs"

# Output file
OUTPUT="$PROJECT_ROOT/quantum_entropy/entropy_$(date +%Y%m%d_%H%M%S).qep"

echo "Output:  $OUTPUT"
echo ""
echo "Starting harvest..."
echo ""

# Run the harvest
python3 "$SCRIPT_DIR/optimal_harvest.py" \
    --backend "$BACKEND" \
    --bytes "$BYTES" \
    --output "$OUTPUT"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "  ✓ Harvest Successful!"
    echo "=========================================="
    echo ""
    echo "Entropy saved to: $OUTPUT"

    # Show file info
    if [ -f "$OUTPUT" ]; then
        SIZE=$(ls -lh "$OUTPUT" | awk '{print $5}')
        echo "File size: $SIZE"

        # Try to get pool info
        python3 -c "
import sys
sys.path.insert(0, '$PROJECT_ROOT/src/python')
try:
    from quantum_entropy_pool import QuantumEntropyPool
    pool = QuantumEntropyPool.open('$OUTPUT')
    print(f'Entropy bytes: {pool.bytes_remaining}')
    print(f'Backend: {pool.backend}')
    print(f'Generated: {pool.timestamp}')
except Exception as e:
    print(f'Could not read pool info: {e}')
" 2>/dev/null || echo "Pool info not available"
    fi
else
    echo ""
    echo "=========================================="
    echo "  ✗ Harvest Failed (exit code $EXIT_CODE)"
    echo "=========================================="
    exit $EXIT_CODE
fi
