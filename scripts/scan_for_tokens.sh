#!/bin/bash
###############################################################################
# Scan repository for exposed IBM Quantum tokens
###############################################################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Scanning for exposed IBM Quantum tokens...${NC}\n"

# Token pattern: 128-character lowercase hex string
TOKEN_PATTERN='[a-f0-9]{128}'

FOUND=0
TOTAL_FILES=0

# Scan Python files
echo "Scanning Python files..."
while IFS= read -r file; do
    ((TOTAL_FILES++))
    if grep -qE "$TOKEN_PATTERN" "$file" 2>/dev/null; then
        echo -e "  ${RED}✗${NC} $file"
        ((FOUND++))
    fi
done < <(find . -name "*.py" -not -path "*/.*" -not -path "*/venv/*" -not -path "*/node_modules/*")

# Scan Jupyter notebooks
echo "Scanning Jupyter notebooks..."
while IFS= read -r file; do
    ((TOTAL_FILES++))
    if grep -qE "$TOKEN_PATTERN" "$file" 2>/dev/null; then
        echo -e "  ${RED}✗${NC} $file"
        ((FOUND++))
    fi
done < <(find . -name "*.ipynb" -not -path "*/.*")

# Scan configuration files
echo "Scanning configuration files..."
for ext in json yaml yml toml ini; do
    while IFS= read -r file; do
        ((TOTAL_FILES++))
        if grep -qE "$TOKEN_PATTERN" "$file" 2>/dev/null; then
            echo -e "  ${RED}✗${NC} $file"
            ((FOUND++))
        fi
    done < <(find . -name "*.$ext" -not -path "*/.*" -not -path "*/node_modules/*")
done

echo ""
echo "============================================"
if [ $FOUND -eq 0 ]; then
    echo -e "${GREEN}✓ No exposed tokens found${NC}"
    echo "Scanned $TOTAL_FILES files"
    exit 0
else
    echo -e "${RED}✗ Found $FOUND file(s) with potential tokens${NC}"
    echo "Scanned $TOTAL_FILES files"
    echo ""
    echo "Action required:"
    echo "1. Run: ./scripts/secure_token_migration.sh"
    echo "2. Remove hardcoded tokens"
    echo "3. Use environment variables"
    exit 1
fi
