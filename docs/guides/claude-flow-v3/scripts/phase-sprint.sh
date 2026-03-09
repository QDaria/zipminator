#!/usr/bin/env bash
# phase-sprint.sh — Launch claude with agent teams for a phase
set -euo pipefail
PHASE=${1:?"Usage: phase-sprint.sh <phase> '<task>'"}
TASK=${2:?"Usage: phase-sprint.sh <phase> '<task>'"}
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
echo "=== Phase $PHASE Sprint: $TASK ==="
source "$(dirname "$0")/activate-all.sh"
cd "$ROOT"
claude --agent-teams \
  --prompt "Phase $PHASE: $TASK. RALPH loop, ultrathink for crypto." 2>&1
