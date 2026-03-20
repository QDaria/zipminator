#!/usr/bin/env bash
# Zipminator Quantum Entropy Harvester
# Called by launchd (com.qdaria.entropy-harvester.plist)
# Harvests real quantum entropy from IBM Fez/Marrakesh into the local pool.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
fi

# Activate micromamba environment
eval "$(/Users/mos/y/bin/micromamba shell hook --shell bash)" 2>/dev/null
micromamba activate zip-pqc

# Run one-shot harvest
cd "$PROJECT_ROOT"
exec /Users/mos/y/envs/zip-pqc/bin/python3 -m zipminator.entropy.scheduler --once
