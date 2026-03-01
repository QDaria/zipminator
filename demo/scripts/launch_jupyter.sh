#!/bin/bash
#
# Launch JupyterLab with zip-pqc micromamba environment
# Opens automatically in browser
#

# Activate micromamba environment
eval "$(micromamba shell hook --shell bash)"
micromamba activate zip-pqc

# Change to examples directory
cd "$(dirname "$0")/../../examples/notebooks" || exit 1

# Launch JupyterLab
echo "Launching JupyterLab on port 8888..."
jupyter lab --no-browser --port=8888 &

# Wait for server to start
sleep 3

# Open in browser
if command -v open &> /dev/null; then
    # macOS
    open http://localhost:8888
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open http://localhost:8888
fi

echo "JupyterLab launched at http://localhost:8888"
