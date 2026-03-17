#!/bin/bash

# Homebrew tap setup script for Zipminator
# This script creates the necessary structure for a Homebrew tap

set -e

REPO_NAME="homebrew-zipminator"
REPO_URL="https://github.com/qdaria/${REPO_NAME}"
REPO_DIR="${REPO_NAME}"

echo "Setting up Homebrew tap for Zipminator..."

# Create directory structure
mkdir -p "${REPO_DIR}/Formula"
mkdir -p "${REPO_DIR}/.github/workflows"

# Copy formula
echo "Copying Homebrew formula..."
cp config/zipminator.rb "${REPO_DIR}/Formula/"

# Create README for tap
cat > "${REPO_DIR}/README.md" << 'EOF'
# Homebrew Tap for Zipminator

Quantum-safe cryptography CLI with NIST Kyber768 and IBM QRNG

## Installation

Add this tap:
```bash
brew tap qdaria/zipminator https://github.com/qdaria/homebrew-zipminator
```

Then install Zipminator:
```bash
brew install zipminator
```

## Usage

```bash
zipminator --help
```

## Updating

```bash
brew update
brew upgrade zipminator
```

## License

MIT
EOF

# Create GitHub Actions workflow for formula updates
cat > "${REPO_DIR}/.github/workflows/tests.yml" << 'EOF'
name: brew test-bot

on:
  push:
    branches:
      - main
  pull_request:

jobs:
  test-bot:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Homebrew/actions/setup-homebrew@master
      - run: brew test-bot --only-cleanup-tap
      - run: brew test-bot --tap=qdaria/zipminator --no-update-python --skip-dependents
        if: always()
EOF

# Create gitignore
cat > "${REPO_DIR}/.gitignore" << 'EOF'
*.swp
*.swo
*~
.DS_Store
EOF

echo "Homebrew tap structure created in ${REPO_DIR}/"
echo ""
echo "Next steps:"
echo "1. cd ${REPO_DIR}"
echo "2. git init"
echo "3. git add ."
echo "4. git commit -m 'Initial commit'"
echo "5. git remote add origin ${REPO_URL}"
echo "6. git branch -M main"
echo "7. git push -u origin main"
echo ""
echo "Then users can install with:"
echo "  brew tap qdaria/zipminator ${REPO_URL}"
echo "  brew install zipminator"
