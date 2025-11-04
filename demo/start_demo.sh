#!/bin/bash

# Zipminator Quantum Entropy Demo - One-Click Launch Script
# =========================================================

set -e  # Exit on error

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "===================================================================="
echo "               Zipminator Quantum Entropy Platform"
echo "                  Investor Demo Application"
echo "===================================================================="
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "        Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed!"
    echo "        Please install Python 3 from https://www.python.org/"
    exit 1
fi

echo "[OK] Node.js version: $(node --version)"
echo "[OK] Python version: $(python3 --version)"
echo ""

# Attempt to activate micromamba environment
CONDA_ACTIVATED=0
if command -v micromamba &> /dev/null; then
    if micromamba env list | grep -q "ds-quantum"; then
        echo "[INFO] Activating micromamba environment: ds-quantum"
        eval "$(micromamba shell hook --shell bash)"
        micromamba activate ds-quantum
        CONDA_ACTIVATED=1
        echo "[OK] Environment activated"
        echo ""
    else
        echo "[INFO] ds-quantum environment not found in micromamba"
        echo "      Using system Python environment"
        echo ""
    fi
else
    echo "[INFO] micromamba not available"
    echo "      Using system Python environment"
    echo ""
fi

# Check for quantum entropy file
ENTROPY_FILE="../quantum_entropy/entropy_demo_750B.bin"
if [ -f "$ENTROPY_FILE" ]; then
    ENTROPY_SIZE=$(stat -f%z "$ENTROPY_FILE" 2>/dev/null || stat -c%s "$ENTROPY_FILE" 2>/dev/null || echo "unknown")
    echo "[OK] Quantum entropy pool found"
    echo "     Location: $ENTROPY_FILE"
    echo "     Size: $ENTROPY_SIZE bytes"
    echo ""
else
    echo "[WARNING] Quantum entropy file not found"
    echo "          Expected: $ENTROPY_FILE"
    echo "          Demo will operate with reduced entropy capabilities"
    echo ""
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing Node.js dependencies..."
    npm install --silent
    echo "[OK] Node.js dependencies installed"
    echo ""
fi

if [ ! -d "backend/venv" ]; then
    echo "[INFO] Setting up Python virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -q -r requirements.txt
    deactivate
    cd ..
    echo "[OK] Python dependencies installed"
    echo ""
fi

# Create sample data directory
mkdir -p sample_data

# Check if .env exists for quantum credentials
if [ ! -f "../.env" ] && [ ! -f "../../.env" ]; then
    echo "[WARNING] No .env file found with IBM Quantum credentials"
    echo "          Demo will run in simulation mode"
    echo "          For real quantum entropy, add IBM_QUANTUM_TOKEN to .env"
    echo ""
fi

echo "===================================================================="
echo "Starting Zipminator Quantum Entropy Demo"
echo "===================================================================="
echo ""
echo "Frontend: Electron GUI"
echo "Backend: Python Flask API (port 5000)"
echo "Quantum: IBM ibm_brisbane (127 qubits - simulated)"
if [ $CONDA_ACTIVATED -eq 1 ]; then
    echo "Environment: ds-quantum (micromamba)"
else
    echo "Environment: System Python"
fi
echo ""
echo "===================================================================="
echo ""

# Start the application
npm start
