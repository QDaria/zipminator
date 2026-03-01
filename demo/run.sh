#!/usr/bin/env bash
# Zipminator Demo -- Local Launch Script
# Usage: ./run.sh
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/src"
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    echo ""
    echo "Shutting down..."
    [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null
    [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null
    exit 0
}
trap cleanup INT TERM

# -------------------------------------------------------------------
# 1. Check Python
# -------------------------------------------------------------------
if ! command -v python3 &>/dev/null; then
    echo "ERROR: python3 is required. Install from https://www.python.org/"
    exit 1
fi

echo "=== Zipminator Investor Demo ==="
echo ""

# -------------------------------------------------------------------
# 2. Set up Python venv and install deps
# -------------------------------------------------------------------
if [ ! -d "$BACKEND_DIR/venv" ]; then
    echo "[1/4] Creating Python virtual environment..."
    python3 -m venv "$BACKEND_DIR/venv"
else
    echo "[1/4] Python virtual environment exists."
fi

echo "[2/4] Installing Python dependencies..."
"$BACKEND_DIR/venv/bin/pip" install -q flask flask-cors 2>&1 | tail -1

# -------------------------------------------------------------------
# 3. Start backend
# -------------------------------------------------------------------
echo "[3/4] Starting Flask backend on http://localhost:5001 ..."
"$BACKEND_DIR/venv/bin/python3" "$BACKEND_DIR/server.py" &
BACKEND_PID=$!

# Wait for backend health
for i in $(seq 1 15); do
    if curl -sf http://localhost:5001/api/health >/dev/null 2>&1; then
        break
    fi
    sleep 1
done

if ! curl -sf http://localhost:5001/api/health >/dev/null 2>&1; then
    echo "ERROR: Backend failed to start. Check output above."
    cleanup
fi

# -------------------------------------------------------------------
# 4. Start frontend (simple HTTP server from demo root for asset paths)
# -------------------------------------------------------------------
echo "[4/4] Serving frontend on http://localhost:3000 ..."
python3 -m http.server 3000 --directory "$SCRIPT_DIR" &>/dev/null &
FRONTEND_PID=$!

sleep 1

# -------------------------------------------------------------------
# 5. Open browser
# -------------------------------------------------------------------
URL="http://localhost:3000/src/index.html"
echo ""
echo "Demo is running:"
echo "  Frontend : $URL"
echo "  Backend  : http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop."
echo ""

if command -v open &>/dev/null; then
    open "$URL"
elif command -v xdg-open &>/dev/null; then
    xdg-open "$URL"
fi

# Keep script alive
wait
