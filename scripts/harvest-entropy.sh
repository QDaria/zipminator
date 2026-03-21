#!/usr/bin/env bash
# Zipminator Quantum Entropy Harvester
# Called by launchd (com.qdaria.entropy-harvester.plist)
# Harvests real quantum entropy from IBM Fez/Marrakesh into the local pool.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Use the conda env Python directly (no shell activation needed)
PYTHON="/Users/mos/y/envs/zip-pqc/bin/python3"

# Load environment variables from .env
if [ -f "$PROJECT_ROOT/.env" ]; then
    set -a
    # Only export lines that look like KEY=VALUE (skip comments, empty lines)
    while IFS= read -r line; do
        # Skip comments and empty lines
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        # Only export valid env var assignments
        [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]] && export "$line"
    done < "$PROJECT_ROOT/.env"
    set +a
fi

export PYTHONPATH="$PROJECT_ROOT/src"

# Run one-shot harvest
cd "$PROJECT_ROOT"
exec "$PYTHON" -m zipminator.entropy.scheduler --once
