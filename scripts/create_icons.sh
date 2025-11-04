#!/usr/bin/env bash
#
# Icon Creation Script
# Generates platform-specific icons from a source SVG or PNG
#
# Usage: ./create_icons.sh <source_image>

set -euo pipefail

SOURCE="${1:-}"
if [[ -z "$SOURCE" ]]; then
    echo "Usage: $0 <source_image.png|svg>"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ICON_DIR="${PROJECT_ROOT}/docs/icons"

mkdir -p "${ICON_DIR}"

echo "Creating icons from: $SOURCE"

# macOS .icns (requires iconutil on macOS)
if [[ "$(uname -s)" == "Darwin" ]]; then
    echo "Creating macOS .icns..."

    ICONSET="${ICON_DIR}/icon.iconset"
    mkdir -p "${ICONSET}"

    # Generate different sizes
    sips -z 16 16     "$SOURCE" --out "${ICONSET}/icon_16x16.png"
    sips -z 32 32     "$SOURCE" --out "${ICONSET}/icon_16x16@2x.png"
    sips -z 32 32     "$SOURCE" --out "${ICONSET}/icon_32x32.png"
    sips -z 64 64     "$SOURCE" --out "${ICONSET}/icon_32x32@2x.png"
    sips -z 128 128   "$SOURCE" --out "${ICONSET}/icon_128x128.png"
    sips -z 256 256   "$SOURCE" --out "${ICONSET}/icon_128x128@2x.png"
    sips -z 256 256   "$SOURCE" --out "${ICONSET}/icon_256x256.png"
    sips -z 512 512   "$SOURCE" --out "${ICONSET}/icon_256x256@2x.png"
    sips -z 512 512   "$SOURCE" --out "${ICONSET}/icon_512x512.png"
    sips -z 1024 1024 "$SOURCE" --out "${ICONSET}/icon_512x512@2x.png"

    iconutil -c icns "${ICONSET}" -o "${ICON_DIR}/icon.icns"
    rm -rf "${ICONSET}"

    echo "Created: ${ICON_DIR}/icon.icns"
fi

# Windows .ico (requires ImageMagick)
if command -v convert >/dev/null 2>&1; then
    echo "Creating Windows .ico..."
    convert "$SOURCE" -define icon:auto-resize=256,128,96,64,48,32,16 "${ICON_DIR}/icon.ico"
    echo "Created: ${ICON_DIR}/icon.ico"
else
    echo "Warning: ImageMagick not found. Skipping .ico creation."
fi

# Linux PNG icons (various sizes)
echo "Creating Linux PNG icons..."
for size in 16 32 48 64 128 256 512; do
    if command -v convert >/dev/null 2>&1; then
        convert "$SOURCE" -resize "${size}x${size}" "${ICON_DIR}/icon_${size}x${size}.png"
    elif command -v sips >/dev/null 2>&1; then
        sips -z $size $size "$SOURCE" --out "${ICON_DIR}/icon_${size}x${size}.png"
    fi
done

# Copy 256x256 as default icon.png
cp "${ICON_DIR}/icon_256x256.png" "${ICON_DIR}/icon.png" 2>/dev/null || \
    cp "$SOURCE" "${ICON_DIR}/icon.png"

echo "Icon creation complete!"
echo "Icons saved to: ${ICON_DIR}"
