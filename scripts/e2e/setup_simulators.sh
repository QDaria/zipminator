#!/usr/bin/env bash
# Setup iOS Simulator clones for Zipminator E2E testing.
# Creates 3 named clones, each can be pre-seeded with an OAuth account.
# Usage: ./scripts/e2e/setup_simulators.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Simulator names
SIM_NAMES=("Zip-E2E-Mo" "Zip-E2E-H81" "Zip-E2E-DMO")
# Base device type (adjust if needed)
DEVICE_TYPE="com.apple.CoreSimulator.SimDeviceType.iPhone-16-Pro"
# Runtime (latest available)
RUNTIME=$(xcrun simctl list runtimes -j | python3 -c "
import json, sys
runtimes = json.load(sys.stdin)['runtimes']
ios = [r for r in runtimes if 'iOS' in r.get('name','') and r.get('isAvailable')]
print(ios[-1]['identifier'] if ios else '')
")

if [ -z "$RUNTIME" ]; then
  echo "ERROR: No available iOS runtime found. Install via Xcode."
  exit 1
fi

echo "Using runtime: $RUNTIME"
echo "Device type: $DEVICE_TYPE"

for name in "${SIM_NAMES[@]}"; do
  # Check if already exists
  existing=$(xcrun simctl list devices -j | python3 -c "
import json, sys
devices = json.load(sys.stdin)['devices']
for runtime_devices in devices.values():
  for d in runtime_devices:
    if d['name'] == '$name' and d.get('isAvailable'):
      print(d['udid'])
      break
" 2>/dev/null || true)

  if [ -n "$existing" ]; then
    echo "Simulator '$name' already exists: $existing"
  else
    udid=$(xcrun simctl create "$name" "$DEVICE_TYPE" "$RUNTIME")
    echo "Created simulator '$name': $udid"
  fi
done

echo ""
echo "Simulators ready. To pre-seed OAuth:"
echo "  1. xcrun simctl boot Zip-E2E-Mo"
echo "  2. open -a Simulator"
echo "  3. Sign into Google/GitHub in Safari"
echo "  4. xcrun simctl shutdown Zip-E2E-Mo"
echo ""
echo "To list: xcrun simctl list devices | grep Zip-E2E"
