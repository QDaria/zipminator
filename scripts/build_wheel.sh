#!/usr/bin/env bash
# Build Python wheels for Zipminator
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_DIR="$SCRIPT_DIR/../cli"

echo "🔧 Building Zipminator Python Wheels"
echo "===================================="

# Check if maturin is installed
if ! command -v maturin &> /dev/null; then
    echo "❌ maturin not found. Installing..."
    pip install maturin
fi

cd "$CLI_DIR"

echo ""
echo "📦 Building wheel for current platform..."
maturin build --release

echo ""
echo "📦 Building universal2 wheel for macOS (Intel + Apple Silicon)..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    maturin build --release --target universal2-apple-darwin
else
    echo "⏭️  Skipping universal2 build (macOS only)"
fi

echo ""
echo "✅ Build complete!"
echo ""
echo "Wheels are located in: $CLI_DIR/target/wheels/"
ls -lh "$CLI_DIR/target/wheels/" 2>/dev/null || echo "No wheels found"

echo ""
echo "📝 To install the wheel:"
echo "  pip install $CLI_DIR/target/wheels/zipminator-*.whl"
echo ""
echo "📝 To develop locally:"
echo "  cd $CLI_DIR && maturin develop"
