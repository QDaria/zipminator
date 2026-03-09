#!/usr/bin/env bash
# ralph-loop.sh — RALPH iteration loop with cargo test + pytest gate
set -euo pipefail
MAX_ITER=${1:-12}; ITER=0
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
echo "=== RALPH Iteration Loop (max $MAX_ITER) ==="
while [ $ITER -lt $MAX_ITER ]; do
  ITER=$((ITER + 1))
  echo "--- Iteration $ITER / $MAX_ITER ---"
  echo "[Gate 1] cargo test"
  if ! (cd "$ROOT" && cargo test --workspace 2>&1); then echo "  FAIL"; continue; fi
  echo "  PASS"
  echo "[Gate 2] pytest"
  if ! (cd "$ROOT" && python -m pytest tests/ -q 2>&1); then echo "  FAIL"; continue; fi
  echo "  PASS"
  if [ -d "$ROOT/web/node_modules" ]; then
    echo "[Gate 3] next build"
    if ! (cd "$ROOT/web" && npx next build 2>&1); then echo "  FAIL"; continue; fi
    echo "  PASS"
  fi
  echo "ALL GATES PASSED on iteration $ITER."; exit 0
done
echo "Exhausted after $MAX_ITER iterations."; exit 1
