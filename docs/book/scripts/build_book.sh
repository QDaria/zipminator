#!/usr/bin/env bash
# Build the Zipminator Jupyter Book
# Usage: bash scripts/build_book.sh [--clean]
set -euo pipefail

BOOK_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$BOOK_DIR"

echo "=== Zipminator Jupyter Book Builder ==="
echo "Directory: $BOOK_DIR"

# Activate environment
eval "$(micromamba shell hook -s bash)" 2>/dev/null || true
micromamba activate zip-pqc 2>/dev/null || echo "Warning: zip-pqc env not found, using current env"

# Clean if requested
if [[ "${1:-}" == "--clean" ]]; then
    echo "Cleaning previous build..."
    rm -rf _build/
fi

# Run cell tagger first
echo ""
echo "--- Tagging untagged code cells ---"
python scripts/tag_cells.py 2>/dev/null || echo "tag_cells.py not found or failed"

# Build
echo ""
echo "--- Building Jupyter Book ---"
jupyter-book build . --all 2>&1 | tee _build/build.log

# Report
WARNINGS=$(grep -c "WARNING" _build/build.log 2>/dev/null || echo 0)
ERRORS=$(grep -c "ERROR\|CRITICAL" _build/build.log 2>/dev/null || echo 0)

echo ""
echo "=== Build Complete ==="
echo "Warnings: $WARNINGS"
echo "Errors:   $ERRORS"
echo "Output:   $BOOK_DIR/_build/html/index.html"

if [[ "$ERRORS" -gt 0 ]]; then
    echo ""
    echo "--- Errors found: ---"
    grep "ERROR\|CRITICAL" _build/build.log
    exit 1
fi

# Open in browser (macOS)
if command -v open &>/dev/null; then
    echo ""
    read -p "Open in browser? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "$BOOK_DIR/_build/html/index.html"
    fi
fi
