#!/bin/bash
# RALPH cycle multi-provider review rotation
# Usage: ralph-multi-review.sh <cycle_number> <paper.tex>
set -euo pipefail

CYCLE=${1:?Usage: ralph-multi-review.sh <cycle> <paper.tex>}
PAPER=${2:?Usage: ralph-multi-review.sh <cycle> <paper.tex>}
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== RALPH Cycle $CYCLE: Multi-Provider Review ==="
echo "Paper: $PAPER"
echo ""

# Primary reviewer rotation
if [ $((CYCLE % 2)) -eq 1 ]; then
    MODEL="gpt-5.4"
else
    MODEL="gemini-3.1"
fi

echo "--- Primary review: $MODEL ---"
python3 "$SCRIPT_DIR/openrouter-review.py" "$PAPER" "$MODEL"

# Every 3rd cycle: add Grok 4 + DeepSeek-R1 math check
if [ $((CYCLE % 3)) -eq 0 ]; then
    echo ""
    echo "--- Third-opinion: grok-4 ---"
    python3 "$SCRIPT_DIR/openrouter-review.py" "$PAPER" "grok-4"

    echo ""
    echo "--- Math verification: deepseek-r1 ---"
    python3 "$SCRIPT_DIR/openrouter-review.py" "$PAPER" "deepseek-r1"
fi

# Cycle 12: ALL models (Byzantine consensus)
if [ "$CYCLE" -eq 12 ]; then
    echo ""
    echo "=== CYCLE 12: FULL BYZANTINE CONSENSUS ==="
    for m in gpt-5.4 gemini-3.1 grok-4 deepseek-r1 qwen-3.6 glm-5.1; do
        echo ""
        echo "--- Review: $m ---"
        python3 "$SCRIPT_DIR/openrouter-review.py" "$PAPER" "$m" || echo "WARN: $m failed"
    done
    echo ""
    echo "=== All 6 models reviewed. Compute Byzantine 2/3 consensus manually. ==="
fi

echo ""
echo "=== RALPH Cycle $CYCLE complete ==="
