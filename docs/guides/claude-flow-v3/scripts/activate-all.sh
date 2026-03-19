#!/usr/bin/env bash
# activate-all.sh — Export env vars, enable agent teams + ultrathink, update ruflo
set -euo pipefail
echo "=== Zipminator Orchestration Activation ==="

# Claude Code superpowers
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
export CLAUDE_CODE_EXPERIMENTAL_WORKTREES=1
export CLAUDE_AGENT_TEAMS=true
export CLAUDE_REASONING_EFFORT=high
export CLAUDE_ULTRATHINK=true

# Ruflo intelligence pipeline
export RUFLO_INTELLIGENCE_PIPELINE=true
export RUFLO_AGENT_BOOSTER=true
export RUFLO_MODEL_ROUTING=auto

# Project paths
export ZIPMINATOR_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
export ZIPMINATOR_WEB="$ZIPMINATOR_ROOT/web"
export ENTROPY_POOL="$ZIPMINATOR_ROOT/quantum_entropy/quantum_entropy_pool.bin"

# Python environment reminder
export ZIPMINATOR_PYTHON_ENV="zip-pqc"

# Daily ruflo auto-update (skip if already updated today)
RUFLO_UPDATE_MARKER="/tmp/.ruflo-updated-$(date +%Y%m%d)"
if [ ! -f "$RUFLO_UPDATE_MARKER" ]; then
  echo "  Updating ruflo to latest..."
  npx ruflo@latest --version 2>/dev/null && touch "$RUFLO_UPDATE_MARKER" || true
fi

# Bootstrap learning (background, skip if already cached today)
PRETRAIN_MARKER="/tmp/.ruflo-pretrained-$(date +%Y%m%d)"
if [ ! -f "$PRETRAIN_MARKER" ]; then
  echo "  Bootstrapping ruflo learning pipeline..."
  npx ruflo@latest hooks pretrain --source "$ZIPMINATOR_ROOT" --depth 3 --skip-if-cached 2>/dev/null &
  touch "$PRETRAIN_MARKER" 2>/dev/null || true
fi

echo ""
echo "  CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1"
echo "  CLAUDE_CODE_EXPERIMENTAL_WORKTREES=1"
echo "  CLAUDE_REASONING_EFFORT=high"
echo "  RUFLO_INTELLIGENCE_PIPELINE=true"
echo "  RUFLO_AGENT_BOOSTER=true"
echo "  RUFLO_MODEL_ROUTING=auto"
echo "  ZIPMINATOR_ROOT=$ZIPMINATOR_ROOT"
echo "  Python env: micromamba activate $ZIPMINATOR_PYTHON_ENV"
echo ""
echo "Ready. Ruflo v3.5.7+ always-on. Intelligence pipeline active."
echo "Use 'ultrathink' for deep crypto reasoning."
echo "Always: micromamba activate zip-pqc && uv pip install <pkg>"
