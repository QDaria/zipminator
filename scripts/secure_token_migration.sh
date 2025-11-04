#!/bin/bash
###############################################################################
# IBM Quantum Token Security Migration Script
# Migrates hardcoded tokens to secure environment variable storage
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   IBM Quantum Token Security Migration                        ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo ""

###############################################################################
# Step 1: Scan for exposed tokens
###############################################################################
echo -e "${YELLOW}[Step 1/6] Scanning for exposed tokens...${NC}"

EXPOSED_FILES=()
TOKEN_PATTERN='token\s*=\s*["\x27][a-f0-9]{100,}["\x27]'

# Search Python files
while IFS= read -r file; do
    if grep -qE "$TOKEN_PATTERN" "$file" 2>/dev/null; then
        EXPOSED_FILES+=("$file")
        echo -e "  ${RED}✗${NC} Found hardcoded token in: $file"
    fi
done < <(find "$PROJECT_ROOT" -name "*.py" -not -path "*/\.*" -not -path "*/venv/*" -not -path "*/node_modules/*")

# Search Jupyter notebooks
while IFS= read -r file; do
    if grep -qE "$TOKEN_PATTERN" "$file" 2>/dev/null; then
        EXPOSED_FILES+=("$file")
        echo -e "  ${RED}✗${NC} Found hardcoded token in: $file"
    fi
done < <(find "$PROJECT_ROOT" -name "*.ipynb" -not -path "*/\.*")

if [ ${#EXPOSED_FILES[@]} -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} No exposed tokens found"
else
    echo -e "\n  ${YELLOW}WARNING: Found ${#EXPOSED_FILES[@]} file(s) with hardcoded tokens${NC}"
fi

###############################################################################
# Step 2: Create .env.template
###############################################################################
echo -e "\n${YELLOW}[Step 2/6] Creating .env.template...${NC}"

cat > "$PROJECT_ROOT/.env.template" << 'EOF'
# IBM Quantum API Configuration
# ==============================
#
# This file serves as a template for your .env file.
# Copy this to .env and fill in your actual values.
#
# IMPORTANT: Never commit .env to version control!
# The .env file is gitignored for security.

# IBM Quantum API Token
# Obtain from: https://quantum.ibm.com/account
# Format: 128-character hexadecimal string
IBM_QUANTUM_TOKEN=your_token_here

# IBM Quantum Configuration (Optional)
# Channel: "ibm_quantum" or "ibm_cloud"
IBM_QUANTUM_CHANNEL=ibm_quantum

# Instance: Format "hub/group/project"
# Example: "ibm-q/open/main" (free tier)
IBM_QUANTUM_INSTANCE=ibm-q/open/main

# Token Refresh Reminder (days since last update)
# Set to the date you last updated your token
TOKEN_LAST_UPDATED=2025-10-30

# Security Notes:
# 1. Tokens should be rotated every 90 days minimum
# 2. Never share tokens in code, logs, or screenshots
# 3. Use separate tokens for development and production
# 4. Revoke immediately if exposed
EOF

echo -e "  ${GREEN}✓${NC} Created .env.template"

###############################################################################
# Step 3: Update .gitignore
###############################################################################
echo -e "\n${YELLOW}[Step 3/6] Updating .gitignore...${NC}"

GITIGNORE="$PROJECT_ROOT/.gitignore"

# Create .gitignore if it doesn't exist
if [ ! -f "$GITIGNORE" ]; then
    touch "$GITIGNORE"
fi

# Add security patterns if not already present
PATTERNS=(
    "# Environment variables and secrets"
    ".env"
    ".env.local"
    ".env.*.local"
    "*.env"
    ""
    "# IBM Quantum credentials"
    "ibm_quantum_credentials.json"
    "qiskit-ibm.json"
    ".qiskit/"
    ""
    "# Backup files with potential secrets"
    "*.bak"
    "*.backup"
    "*_backup.*"
)

for pattern in "${PATTERNS[@]}"; do
    if ! grep -qF "$pattern" "$GITIGNORE" 2>/dev/null; then
        echo "$pattern" >> "$GITIGNORE"
    fi
done

echo -e "  ${GREEN}✓${NC} Updated .gitignore with security patterns"

###############################################################################
# Step 4: Create pre-commit hook
###############################################################################
echo -e "\n${YELLOW}[Step 4/6] Installing pre-commit hook...${NC}"

GIT_HOOKS_DIR="$PROJECT_ROOT/.git/hooks"
PRE_COMMIT_HOOK="$GIT_HOOKS_DIR/pre-commit"

if [ -d "$GIT_HOOKS_DIR" ]; then
    cat > "$PRE_COMMIT_HOOK" << 'EOF'
#!/bin/bash
###############################################################################
# Pre-commit hook to prevent token exposure
###############################################################################

# Token pattern (128-char hex strings that look like IBM tokens)
TOKEN_PATTERN='[a-f0-9]{100,}'

echo "🔍 Scanning staged files for exposed tokens..."

# Get list of staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(py|ipynb|json|txt|md)$' || true)

if [ -z "$STAGED_FILES" ]; then
    exit 0
fi

# Check each file
FOUND_TOKENS=0
for file in $STAGED_FILES; do
    if [ -f "$file" ]; then
        # Search for token patterns
        if grep -qE "$TOKEN_PATTERN" "$file" 2>/dev/null; then
            echo "❌ BLOCKED: Potential token found in $file"
            FOUND_TOKENS=1
        fi
    fi
done

if [ $FOUND_TOKENS -eq 1 ]; then
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║  COMMIT BLOCKED: Potential secrets detected                  ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "To fix:"
    echo "  1. Remove hardcoded tokens from files"
    echo "  2. Use environment variables (IBM_QUANTUM_TOKEN)"
    echo "  3. Check .env.template for guidance"
    echo ""
    echo "To bypass this check (NOT RECOMMENDED):"
    echo "  git commit --no-verify"
    echo ""
    exit 1
fi

echo "✅ No tokens detected in staged files"
exit 0
EOF

    chmod +x "$PRE_COMMIT_HOOK"
    echo -e "  ${GREEN}✓${NC} Installed pre-commit hook at $PRE_COMMIT_HOOK"
else
    echo -e "  ${YELLOW}⚠${NC}  Not a git repository - skipping pre-commit hook"
fi

###############################################################################
# Step 5: Prompt for token and create .env
###############################################################################
echo -e "\n${YELLOW}[Step 5/6] Setting up .env file...${NC}"

ENV_FILE="$PROJECT_ROOT/.env"

if [ -f "$ENV_FILE" ]; then
    echo -e "  ${YELLOW}⚠${NC}  .env file already exists"
    read -p "  Overwrite? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "  ${BLUE}ℹ${NC}  Skipping .env creation"
        ENV_CREATED=false
    else
        ENV_CREATED=true
    fi
else
    ENV_CREATED=true
fi

if [ "$ENV_CREATED" = true ]; then
    echo ""
    echo "Enter your IBM Quantum token (or press Enter to skip):"
    echo "(Get it from: https://quantum.ibm.com/account)"
    read -s IBM_TOKEN

    if [ -n "$IBM_TOKEN" ]; then
        cp "$PROJECT_ROOT/.env.template" "$ENV_FILE"

        # Replace placeholder with actual token
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/IBM_QUANTUM_TOKEN=.*/IBM_QUANTUM_TOKEN=$IBM_TOKEN/" "$ENV_FILE"
            sed -i '' "s/TOKEN_LAST_UPDATED=.*/TOKEN_LAST_UPDATED=$(date +%Y-%m-%d)/" "$ENV_FILE"
        else
            # Linux
            sed -i "s/IBM_QUANTUM_TOKEN=.*/IBM_QUANTUM_TOKEN=$IBM_TOKEN/" "$ENV_FILE"
            sed -i "s/TOKEN_LAST_UPDATED=.*/TOKEN_LAST_UPDATED=$(date +%Y-%m-%d)/" "$ENV_FILE"
        fi

        chmod 600 "$ENV_FILE"  # Restrict permissions
        echo -e "\n  ${GREEN}✓${NC} Created .env file with secure permissions (600)"

        # Validate token
        if [ -f "$SCRIPT_DIR/validate_ibm_token.py" ]; then
            echo -e "\n  ${BLUE}ℹ${NC}  Validating token..."
            if python3 "$SCRIPT_DIR/validate_ibm_token.py" --token "$IBM_TOKEN" > /dev/null 2>&1; then
                echo -e "  ${GREEN}✓${NC} Token validated successfully"
            else
                echo -e "  ${YELLOW}⚠${NC}  Token validation failed - please check manually"
            fi
        fi
    else
        echo -e "\n  ${BLUE}ℹ${NC}  Skipped token entry - manually edit .env later"
        cp "$PROJECT_ROOT/.env.template" "$ENV_FILE"
        chmod 600 "$ENV_FILE"
    fi
fi

###############################################################################
# Step 6: Provide migration instructions
###############################################################################
echo -e "\n${YELLOW}[Step 6/6] Migration complete!${NC}"
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Next Steps                                                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "1. Update your code to load tokens from environment:"
echo ""
echo "   Python:"
echo "   -------"
echo "   import os"
echo "   token = os.getenv('IBM_QUANTUM_TOKEN')"
echo "   if not token:"
echo "       raise ValueError('IBM_QUANTUM_TOKEN not set')"
echo ""
echo "   Jupyter Notebook:"
echo "   -----------------"
echo "   from dotenv import load_dotenv"
echo "   load_dotenv()"
echo "   token = os.getenv('IBM_QUANTUM_TOKEN')"
echo ""
echo "2. Remove hardcoded tokens from files:"
if [ ${#EXPOSED_FILES[@]} -gt 0 ]; then
    echo -e "   ${RED}Files with exposed tokens:${NC}"
    for file in "${EXPOSED_FILES[@]}"; do
        echo "   - $file"
    done
fi
echo ""
echo "3. Test your changes:"
echo "   python3 scripts/validate_ibm_token.py"
echo ""
echo "4. If token was previously committed to git, rotate it immediately:"
echo "   - Generate new token at: https://quantum.ibm.com/account"
echo "   - Update .env file with new token"
echo "   - Consider: git filter-repo to remove from history"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "  - Security guide: docs/ibm_token_security.md"
echo "  - Refresh guide: docs/ibm_token_refresh_guide.md"
echo ""
echo -e "${GREEN}✓ Migration script completed successfully!${NC}"
