@echo off
REM Qdaria QRNG Demo - One-Click Launch Script (Windows)
REM ======================================================

setlocal enabledelayedexpansion

cd /d "%~dp0"

echo ╔════════════════════════════════════════════════════════════╗
echo ║        Qdaria QRNG - Quantum Security Platform            ║
echo ║              Investor Demo Application                     ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js is not installed!
    echo    Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check for Python
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Python is not installed!
    echo    Please install Python from https://www.python.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected
echo ✅ Python detected
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing Node.js dependencies...
    call npm install --silent
    echo ✅ Node.js dependencies installed
    echo.
)

if not exist "backend\venv" (
    echo 📦 Setting up Python virtual environment...
    cd backend
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -q -r requirements.txt
    deactivate
    cd ..
    echo ✅ Python dependencies installed
    echo.
)

REM Create sample data directory
if not exist "sample_data" mkdir sample_data

REM Check for .env
if not exist "..\\.env" (
    if not exist "..\\..\\.env" (
        echo ⚠️  Warning: No .env file found with IBM Quantum credentials
        echo    Demo will run in simulation mode
        echo    For real quantum entropy, add IBM_QUANTUM_TOKEN to .env
        echo.
    )
)

echo 🚀 Starting Qdaria QRNG Demo...
echo.
echo    Frontend: Electron GUI
echo    Backend: Python Flask API (port 5000)
echo    Quantum: IBM ibm_brisbane (127 qubits - simulated)
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Start the application
call npm start
