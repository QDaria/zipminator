#!/usr/bin/env bash
# pillar-sprint.sh — Launch hive-mind orchestration for 9-pillar → 100% sprint
# Usage: ./pillar-sprint.sh [stream] [plan-path]
# Streams: all, A, B, C, D, E
set -euo pipefail

STREAM=${1:-all}
PLAN=${2:-"docs/superpowers/plans/2026-03-17-nine-pillars-100-percent.md"}
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"

echo "=== Zipminator 9-Pillar Sprint ==="
echo "  Stream: $STREAM"
echo "  Plan: $PLAN"

# Activate orchestration environment
source "$(dirname "$0")/activate-all.sh"

# Update ruflo to latest
CURRENT=$(ruflo --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "0.0.0")
LATEST=$(npm view ruflo version 2>/dev/null || echo "$CURRENT")
if [ "$CURRENT" != "$LATEST" ]; then
  echo "  Updating ruflo $CURRENT → $LATEST..."
  npm install -g ruflo@latest 2>/dev/null || true
fi

# Ensure docker integration services are running
echo "  Starting docker integration services..."
docker compose -f "$ROOT/docker-compose.integration.yml" up -d --wait 2>/dev/null || {
  echo "  WARN: Docker services failed to start. Integration tests will skip."
}

cd "$ROOT"

case "$STREAM" in
  all)
    echo "  Launching full hive-mind orchestration..."
    cat <<PROMPT
Initialize hive-mind orchestration for Zipminator 9-Pillar Sprint.

Read: $PLAN

Execute Task 0 first (docker infrastructure), then launch 5 parallel streams:
- Stream A: Pillars 1+5 (Vault + Anonymizer)
- Stream B: Pillars 2+3 (Messenger + VoIP)
- Stream C: Pillars 4+8 (VPN + Browser)
- Stream D: Pillars 6+7 (Q-AI + Mail)
- Stream E: Pillar 9 (Q-Mesh)

Each stream: worktree isolation, RALPH loop (max 12), TDD-first.
Quality gates: cargo test + pytest + clippy + flutter test.
After merge: run Task F1 (full gate) and F2 (FEATURES.md update).
PROMPT
    ;;
  A|B|C|D|E)
    echo "  Launching Stream $STREAM only..."
    echo "Read $PLAN and execute Stream $STREAM tasks with RALPH loop. TDD-first. Worktree isolation."
    ;;
  *)
    echo "Unknown stream: $STREAM. Use: all, A, B, C, D, E"
    exit 1
    ;;
esac
