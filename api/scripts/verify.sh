#!/bin/bash

echo "🔍 Zipminator API Verification"
echo "================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Check Rust CLI
echo "Checking Rust CLI binary..."
if [ -f "../cli/target/release/zipminator" ]; then
    echo -e "${GREEN}✓${NC} Rust CLI binary found"
else
    echo -e "${RED}✗${NC} Rust CLI binary not found at ../cli/target/release/zipminator"
    ERRORS=$((ERRORS+1))
fi

# Check Python files
echo ""
echo "Checking source files..."
REQUIRED_FILES=(
    "src/main.py"
    "src/config.py"
    "src/models/auth.py"
    "src/models/crypto.py"
    "src/models/keys.py"
    "src/routes/health.py"
    "src/routes/auth.py"
    "src/routes/keys.py"
    "src/routes/crypto.py"
    "src/services/rust_cli.py"
    "src/services/auth.py"
    "src/services/rate_limit.py"
    "src/db/database.py"
    "src/db/models.py"
    "src/middleware/auth.py"
    "src/middleware/logging.py"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} Missing: $file"
        ERRORS=$((ERRORS+1))
    fi
done

# Check test files
echo ""
echo "Checking test files..."
TEST_FILES=(
    "tests/conftest.py"
    "tests/test_health.py"
    "tests/test_auth.py"
    "tests/test_keys.py"
    "tests/test_crypto.py"
)

for file in "${TEST_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} Missing: $file"
        ERRORS=$((ERRORS+1))
    fi
done

# Check config files
echo ""
echo "Checking configuration files..."
CONFIG_FILES=(
    "requirements.txt"
    "pyproject.toml"
    "Dockerfile"
    "docker-compose.yml"
    "alembic.ini"
    ".env.example"
    "README.md"
)

for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} Missing: $file"
        ERRORS=$((ERRORS+1))
    fi
done

# Count test functions
echo ""
echo "Counting test cases..."
TEST_COUNT=$(grep -r "^def test_" tests/ | wc -l | tr -d ' ')
if [ "$TEST_COUNT" -ge 10 ]; then
    echo -e "${GREEN}✓${NC} Found $TEST_COUNT test cases (requirement: >10)"
else
    echo -e "${RED}✗${NC} Only $TEST_COUNT test cases (requirement: >10)"
    ERRORS=$((ERRORS+1))
fi

# Check Python syntax
echo ""
echo "Checking Python syntax..."
if command -v python3 &> /dev/null; then
    SYNTAX_ERRORS=0
    for file in $(find src tests -name "*.py"); do
        if ! python3 -m py_compile "$file" 2>/dev/null; then
            echo -e "${RED}✗${NC} Syntax error in $file"
            SYNTAX_ERRORS=$((SYNTAX_ERRORS+1))
        fi
    done

    if [ $SYNTAX_ERRORS -eq 0 ]; then
        echo -e "${GREEN}✓${NC} No syntax errors found"
    else
        echo -e "${RED}✗${NC} Found $SYNTAX_ERRORS files with syntax errors"
        ERRORS=$((ERRORS+SYNTAX_ERRORS))
    fi
else
    echo -e "${YELLOW}!${NC} Python3 not found, skipping syntax check"
fi

# Check Docker
echo ""
echo "Checking Docker..."
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker installed"

    if command -v docker-compose &> /dev/null; then
        echo -e "${GREEN}✓${NC} Docker Compose installed"
    else
        echo -e "${YELLOW}!${NC} Docker Compose not found (optional)"
    fi
else
    echo -e "${YELLOW}!${NC} Docker not found (optional for local dev)"
fi

# Summary
echo ""
echo "================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Verification passed! All systems ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run: ./scripts/setup.sh"
    echo "  2. Run: ./scripts/test.sh"
    echo "  3. Visit: http://localhost:8000/docs"
    exit 0
else
    echo -e "${RED}✗ Verification failed with $ERRORS error(s)${NC}"
    echo ""
    echo "Please fix the errors above before proceeding."
    exit 1
fi
