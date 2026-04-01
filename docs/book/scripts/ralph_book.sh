#!/usr/bin/env bash
# RALPH Loop for Jupyter Book quality
# R=Research A=Architecture L=Logic P=Polish H=Harden
# Max 5 iterations, then report status
set -euo pipefail

BOOK_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$BOOK_DIR"
MAX_ITER=5
ITER=0

echo "=== RALPH Book Quality Loop ==="
echo "Max iterations: $MAX_ITER"

# Activate environment
eval "$(micromamba shell hook -s bash)" 2>/dev/null || true
micromamba activate zip-pqc 2>/dev/null || echo "Warning: using current env"

while [[ $ITER -lt $MAX_ITER ]]; do
    ITER=$((ITER + 1))
    echo ""
    echo "--- Iteration $ITER/$MAX_ITER ---"

    # R: Research — run quality check
    echo "[R] Running quality check..."
    if python scripts/quality_check.py 2>/dev/null; then
        echo "[R] All quality checks pass."
        QUALITY_OK=true
    else
        echo "[R] Quality issues found."
        QUALITY_OK=false
    fi

    # A: Architecture — check viz.py coverage
    echo "[A] Checking viz.py line count..."
    VIZ_LINES=$(wc -l < notebooks/_helpers/viz.py 2>/dev/null || echo 0)
    echo "    viz.py: $VIZ_LINES lines"
    if [[ -f notebooks/_helpers/viz_extended.py ]]; then
        EXT_LINES=$(wc -l < notebooks/_helpers/viz_extended.py)
        echo "    viz_extended.py: $EXT_LINES lines"
    fi

    # L: Logic — fix untagged cells
    echo "[L] Tagging untagged cells..."
    python scripts/tag_cells.py 2>/dev/null || echo "    tag_cells.py not available"

    # P: Polish — verify no matplotlib
    echo "[P] Checking for matplotlib..."
    MPL_COUNT=$(grep -rl "matplotlib" notebooks/*.ipynb 2>/dev/null | wc -l || echo 0)
    if [[ "$MPL_COUNT" -gt 0 ]]; then
        echo "    WARNING: $MPL_COUNT notebooks still use matplotlib"
    else
        echo "    Clean: no matplotlib found"
    fi

    # H: Harden — build the book
    echo "[H] Building book..."
    if jupyter-book build . --all 2>&1 | tail -5; then
        BUILD_OK=true
        echo "    Build succeeded."
    else
        BUILD_OK=false
        echo "    Build failed."
    fi

    # Check if we're done
    if [[ "$QUALITY_OK" == "true" ]] && [[ "$BUILD_OK" == "true" ]] && [[ "$MPL_COUNT" -eq 0 ]]; then
        echo ""
        echo "=== RALPH Complete: All checks pass after $ITER iteration(s) ==="
        exit 0
    fi
done

echo ""
echo "=== RALPH: Max iterations ($MAX_ITER) reached. Manual review needed. ==="
exit 1
