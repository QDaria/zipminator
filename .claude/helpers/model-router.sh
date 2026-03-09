#!/usr/bin/env bash
# model-router.sh -- Determine optimal Claude model tier for a task/file
# Usage: model-router.sh [--task "description"] [--file "path"]
# Output: haiku | sonnet | opus
set -euo pipefail

TASK=""
FILE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --task) TASK="$2"; shift 2 ;;
    --file) FILE="$2"; shift 2 ;;
    *) shift ;;
  esac
done

TIER="sonnet"  # default

# File-based routing
if [[ -n "$FILE" ]]; then
  case "$FILE" in
    crates/*/src/*.rs|crates/*/tests/*.rs)         TIER="opus" ;;
    browser/src-tauri/src/vpn/*|browser/src-tauri/src/proxy/*) TIER="opus" ;;
    browser/src-tauri/src/privacy/*)                TIER="opus" ;;
    web/components/*|web/app/*|mobile/src/*)        TIER="sonnet" ;;
    api/src/*|browser/src/*)                        TIER="sonnet" ;;
    *.md|*.json|*.toml|*.css|*.yml|*.yaml)          TIER="haiku" ;;
    *.lock|*.config.*|*.gitignore)                  TIER="haiku" ;;
  esac
fi

# Task keyword override (higher priority)
if [[ -n "$TASK" ]]; then
  TASK_LOWER=$(echo "$TASK" | tr '[:upper:]' '[:lower:]')
  if echo "$TASK_LOWER" | grep -qE 'security|crypto|constant.time|pqc|kyber|entropy|fips|audit|vulnerability'; then
    TIER="opus"
  elif echo "$TASK_LOWER" | grep -qE 'format|lint|rename|typo|docs|readme|config|style'; then
    TIER="haiku"
  fi
fi

# Log decision
LOG_DIR="${ZIPMINATOR_ROOT:-.}/.claude-flow/metrics"
mkdir -p "$LOG_DIR" 2>/dev/null || true
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) tier=$TIER file=$FILE task=$TASK" >> "$LOG_DIR/model-routing.log" 2>/dev/null || true

echo "$TIER"
