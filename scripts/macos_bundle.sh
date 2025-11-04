#!/usr/bin/env bash
#
# macOS Application Bundle Builder
# Creates a signed .app bundle with entitlements
#
# Usage: ./macos_bundle.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

APP_NAME="QDaria-QRNG"
BUNDLE_ID="com.qdaria.qrng"
VERSION="0.1.0"

# Create entitlements file
cat > "${PROJECT_ROOT}/build/entitlements.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
    <key>com.apple.security.device.usb</key>
    <true/>
</dict>
</plist>
EOF

echo "macOS bundle configuration created"
