#!/bin/bash
set -e

echo "🧪 Running Zipminator API Tests"
echo "================================"

# Install dependencies if needed
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Run tests
echo ""
echo "Running pytest..."
pytest -v --cov=src --cov-report=term --cov-report=html

echo ""
echo "✅ Tests complete!"
echo "📊 Coverage report: htmlcov/index.html"
