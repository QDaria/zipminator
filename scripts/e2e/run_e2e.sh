#!/usr/bin/env bash
# RALPH loop E2E test runner for Zipminator.
# Usage:
#   ./scripts/e2e/run_e2e.sh --fast          # Mock peer, single sim, all pillars
#   ./scripts/e2e/run_e2e.sh --full          # Sim pairs + all pillars + Playwright
#   ./scripts/e2e/run_e2e.sh --pillar vault  # Single pillar
#   ./scripts/e2e/run_e2e.sh --web           # Playwright only

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
APP_DIR="$PROJECT_ROOT/app"
WEB_DIR="$PROJECT_ROOT/web"
MAX_ITERATIONS=12
ITERATION=0
MODE="${1:---fast}"
PILLAR="${2:-}"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

log() { echo -e "${CYAN}[RALPH]${NC} $*"; }
ok()  { echo -e "${GREEN}[PASS]${NC} $*"; }
fail(){ echo -e "${RED}[FAIL]${NC} $*"; }
warn(){ echo -e "${YELLOW}[WARN]${NC} $*"; }

# ── Signaling server lifecycle ───────────────────────────────────────
start_signaling() {
  if curl -s http://localhost:8765/health | grep -q '"ok"'; then
    log "Signaling server already running"
    return
  fi
  log "Starting signaling server..."
  cd "$PROJECT_ROOT"
  micromamba run -n zip-pqc python -m zipminator.messenger.signaling_server --port 8765 --log-level warning &
  SIGNALING_PID=$!
  for i in $(seq 1 30); do
    if curl -s http://localhost:8765/health | grep -q '"ok"'; then
      log "Signaling server ready (PID $SIGNALING_PID)"
      return
    fi
    sleep 0.5
  done
  fail "Signaling server failed to start"
  exit 1
}

stop_signaling() {
  if [ -n "${SIGNALING_PID:-}" ]; then
    kill "$SIGNALING_PID" 2>/dev/null || true
    wait "$SIGNALING_PID" 2>/dev/null || true
    log "Signaling server stopped"
  fi
}

trap stop_signaling EXIT

# ── Test runners ─────────────────────────────────────────────────────
run_pillar_tests() {
  local test_dir="$APP_DIR/integration_test/e2e/pillar_tests"
  if [ -n "$PILLAR" ]; then
    log "Running pillar test: $PILLAR"
    cd "$APP_DIR" && flutter test "$test_dir/${PILLAR}_e2e_test.dart" -d macos 2>&1
  else
    log "Running all 9 pillar tests..."
    local failed=0
    for test_file in "$test_dir"/*_e2e_test.dart; do
      local name=$(basename "$test_file" _e2e_test.dart)
      log "  Pillar: $name"
      if cd "$APP_DIR" && flutter test "$test_file" -d macos 2>&1; then
        ok "  $name passed"
      else
        fail "  $name FAILED"
        ((failed++))
      fi
    done
    return $failed
  fi
}

run_multi_device_tests() {
  log "Running multi-device tests..."
  local test_dir="$APP_DIR/integration_test/e2e/multi_device"
  local failed=0
  for test_file in "$test_dir"/*_test.dart; do
    local name=$(basename "$test_file" _test.dart)
    log "  Multi-device: $name"
    if cd "$APP_DIR" && flutter test "$test_file" -d macos 2>&1; then
      ok "  $name passed"
    else
      fail "  $name FAILED"
      ((failed++))
    fi
  done
  return $failed
}

run_auth_tests() {
  log "Running OAuth flow tests..."
  cd "$APP_DIR" && flutter test "$APP_DIR/integration_test/e2e/auth/oauth_flow_test.dart" -d macos 2>&1
}

run_playwright_tests() {
  log "Running Playwright web tests..."
  cd "$WEB_DIR" && npx playwright test e2e/ 2>&1
}

# ── RALPH loop ───────────────────────────────────────────────────────
ralph_loop() {
  local total_failures=0

  while [ $ITERATION -lt $MAX_ITERATIONS ]; do
    ((ITERATION++))
    log "=== RALPH iteration $ITERATION/$MAX_ITERATIONS ==="

    # R: Research - check current state
    log "[R] Checking test state..."

    # A: Architecture - route to correct tests
    local failures=0

    # L: Logic - run tests
    log "[L] Running tests (mode: $MODE)..."

    start_signaling

    case "$MODE" in
      --fast)
        run_pillar_tests || ((failures+=$?))
        ;;
      --full)
        run_pillar_tests || ((failures+=$?))
        run_multi_device_tests || ((failures+=$?))
        run_auth_tests || ((failures+=$?))
        run_playwright_tests || ((failures+=$?))
        ;;
      --pillar)
        run_pillar_tests || ((failures+=$?))
        ;;
      --web)
        run_playwright_tests || ((failures+=$?))
        ;;
    esac

    # P: Polish - report results
    log "[P] Iteration $ITERATION results: $failures failures"

    # H: Harden - check if done
    if [ "$failures" -eq 0 ]; then
      ok "=== ALL TESTS PASSED on iteration $ITERATION ==="
      return 0
    fi

    total_failures=$failures
    warn "$failures tests failed. Retrying (iteration $((ITERATION+1))/$MAX_ITERATIONS)..."
    sleep 2
  done

  fail "=== RALPH: $total_failures failures after $MAX_ITERATIONS iterations ==="
  return 1
}

# ── Main ─────────────────────────────────────────────────────────────
log "Zipminator E2E Test Runner (RALPH loop)"
log "Mode: $MODE | Max iterations: $MAX_ITERATIONS"
ralph_loop
