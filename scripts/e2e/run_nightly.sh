#!/usr/bin/env bash
# Nightly E2E suite: full tests + simulator pairs + Playwright.
# Usage: ./scripts/e2e/run_nightly.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_DIR="$PROJECT_ROOT/test-results/e2e/$TIMESTAMP"
mkdir -p "$RESULTS_DIR"

echo "=== Zipminator Nightly E2E Suite ==="
echo "Timestamp: $TIMESTAMP"
echo "Results: $RESULTS_DIR"

# Step 1: Run full RALPH loop
echo ""
echo "--- Step 1: RALPH loop (all tests) ---"
"$SCRIPT_DIR/run_e2e.sh" --full 2>&1 | tee "$RESULTS_DIR/ralph.log"
RALPH_EXIT=${PIPESTATUS[0]}

# Step 2: Simulator pair smoke tests (if simulators available)
echo ""
echo "--- Step 2: Simulator pair tests ---"
SIM_AVAILABLE=$(xcrun simctl list devices | grep -c "Zip-E2E" || true)
if [ "$SIM_AVAILABLE" -ge 2 ]; then
  echo "Found $SIM_AVAILABLE E2E simulators, running pair tests..."

  # Boot two simulators
  SIM1=$(xcrun simctl list devices -j | python3 -c "
import json, sys
for devs in json.load(sys.stdin)['devices'].values():
  for d in devs:
    if d['name'] == 'Zip-E2E-Mo' and d.get('isAvailable'):
      print(d['udid']); break
" 2>/dev/null || true)

  SIM2=$(xcrun simctl list devices -j | python3 -c "
import json, sys
for devs in json.load(sys.stdin)['devices'].values():
  for d in devs:
    if d['name'] == 'Zip-E2E-H81' and d.get('isAvailable'):
      print(d['udid']); break
" 2>/dev/null || true)

  if [ -n "$SIM1" ] && [ -n "$SIM2" ]; then
    xcrun simctl boot "$SIM1" 2>/dev/null || true
    xcrun simctl boot "$SIM2" 2>/dev/null || true
    echo "Booted: Zip-E2E-Mo ($SIM1), Zip-E2E-H81 ($SIM2)"

    # Run multi-device tests on first simulator
    cd "$PROJECT_ROOT/app"
    flutter test integration_test/e2e/multi_device/ -d "$SIM1" 2>&1 | tee "$RESULTS_DIR/sim-pair.log" || true

    # Shutdown simulators
    xcrun simctl shutdown "$SIM1" 2>/dev/null || true
    xcrun simctl shutdown "$SIM2" 2>/dev/null || true
  else
    echo "Could not find both simulators. Skipping pair tests."
  fi
else
  echo "No E2E simulators found. Run setup_simulators.sh first. Skipping."
fi

# Step 3: Summary
echo ""
echo "=== Nightly Results ==="
echo "RALPH exit code: $RALPH_EXIT"
echo "Results saved to: $RESULTS_DIR"
if [ "$RALPH_EXIT" -eq 0 ]; then
  echo "STATUS: ALL PASSED"
else
  echo "STATUS: FAILURES DETECTED (see $RESULTS_DIR/ralph.log)"
fi
exit $RALPH_EXIT
