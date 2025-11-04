# IBM Quantum Token Security Guide

## Overview

This guide covers security best practices for managing IBM Quantum API tokens in the Qdaria QRNG project.

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                          │
├─────────────────────────────────────────────────────────────┤
│  1. Environment Variables (.env) - Primary Storage          │
│  2. Pre-commit Hooks - Prevent Accidental Exposure         │
│  3. .gitignore - Block Sensitive Files                     │
│  4. Token Validation - Verify Before Use                   │
│  5. Rotation Policy - Regular Token Updates                │
└─────────────────────────────────────────────────────────────┘
```

## Critical Security Issue

**STATUS: EXPOSED TOKEN DETECTED**

The current `ibm-qrng.ipynb` notebook contains a hardcoded token:
```
f72296ec653dec6e86032631f76bc605a6cf5bbd337d86db2b974e3eddce19e2e61356d1ee7cba40b7af116cd49adc830215ae3de2f2fa0d1f6e34b5ce64c3ab
```

**IMMEDIATE ACTIONS REQUIRED:**

1. **Revoke this token immediately** at https://quantum.ibm.com/account
2. **Generate a new token**
3. **Never commit tokens to version control**
4. **Run the migration script**: `./scripts/secure_token_migration.sh`

## Threat Model

### Risks of Exposed Tokens

| Threat | Impact | Likelihood | Mitigation |
|--------|--------|------------|------------|
| Unauthorized API usage | High | High | Immediate revocation |
| Account takeover | Critical | Medium | Token rotation |
| Resource exhaustion | High | High | Usage monitoring |
| Data exfiltration | Medium | Low | Access audits |
| Reputation damage | Medium | Medium | Security training |

### Attack Vectors

1. **Version Control Exposure**
   - Tokens committed to public/private repos
   - Visible in commit history
   - Accessible through GitHub search

2. **Log File Leakage**
   - Tokens printed to console/logs
   - Debug output with credentials
   - Error messages containing tokens

3. **Screenshot Sharing**
   - Notebooks with visible tokens
   - Documentation images
   - Social media posts

4. **Clipboard Hijacking**
   - Malware monitoring clipboard
   - Shared computers
   - Cloud clipboard sync

## Security Best Practices

### 1. Environment Variable Storage

**✅ CORRECT:**
```python
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Retrieve token securely
token = os.getenv("IBM_QUANTUM_TOKEN")

# Validate token exists
if not token:
    raise ValueError(
        "IBM_QUANTUM_TOKEN not set. "
        "Create .env file from .env.template"
    )

# Use token
service = QiskitRuntimeService(
    channel="ibm_quantum",
    token=token
)
```

**❌ WRONG:**
```python
# Hardcoded token (NEVER DO THIS)
token = "f72296ec653dec6e8603263..."

# Token in source code
TOKEN = "abc123..."

# Token in config file committed to git
config = {"ibm_token": "xyz789..."}
```

### 2. File Permissions

Restrict access to sensitive files:

```bash
# .env file should be readable only by owner
chmod 600 .env

# Verify permissions
ls -la .env
# Should show: -rw------- (600)
```

### 3. Pre-commit Hook Protection

The migration script installs a pre-commit hook that scans for tokens:

```bash
# Hook automatically runs on: git commit
# Scans: .py, .ipynb, .json, .txt, .md files
# Blocks: Commits containing token patterns

# To test the hook manually:
.git/hooks/pre-commit
```

### 4. Token Rotation Policy

**Rotation Schedule:**
- **Development tokens**: Every 30 days
- **Production tokens**: Every 90 days
- **Suspected exposure**: Immediately

**Rotation Procedure:**
1. Generate new token at https://quantum.ibm.com/account
2. Update `.env` file with new token
3. Test with `python scripts/validate_ibm_token.py`
4. Revoke old token
5. Update `TOKEN_LAST_UPDATED` in `.env`

### 5. Separate Tokens for Environments

Use different tokens for different purposes:

```bash
# .env.development
IBM_QUANTUM_TOKEN=dev_token_here

# .env.production
IBM_QUANTUM_TOKEN=prod_token_here

# .env.testing
IBM_QUANTUM_TOKEN=test_token_here
```

Load environment-specific config:
```python
import os

ENV = os.getenv("ENVIRONMENT", "development")
dotenv_file = f".env.{ENV}"

if os.path.exists(dotenv_file):
    load_dotenv(dotenv_file)
else:
    load_dotenv()  # Fallback to .env
```

## Token Validation

### Automated Validation

Run the validation script regularly:

```bash
# Validate token from environment
python scripts/validate_ibm_token.py

# Validate specific token
python scripts/validate_ibm_token.py --token "your_token"

# Output JSON for automation
python scripts/validate_ibm_token.py --json

# Save results to file
python scripts/validate_ibm_token.py --output validation_report.json
```

### Validation Checks

The validator performs these checks:

1. **Authentication Test**
   - Verifies token format (128 hex characters)
   - Tests authentication with IBM Quantum API
   - Detects expired/invalid tokens

2. **Backend Access Test**
   - Lists available quantum backends
   - Checks real hardware access
   - Verifies simulator access

3. **Permissions Test**
   - Identifies instance (hub/group/project)
   - Determines plan type (Open/Premium)
   - Checks job execution capability

### Expected Results

```
╔═══════════════════════════════════════════════════════════╗
║   IBM QUANTUM TOKEN VALIDATION REPORT                     ║
╚═══════════════════════════════════════════════════════════╝

Overall Status: PASSED

DETAILED TEST RESULTS
─────────────────────────────────────────────────────────────

AUTHENTICATION: ✓ PASS
  Message: Authentication successful

BACKEND_ACCESS: ✓ PASS
  Message: Access to 15 backends (5 real hardware)
  Available Backends: ibm_brisbane, ibm_kyoto, ibm_osaka, ...

PERMISSIONS: ✓ PASS
  Message: Token has full permissions
  Permissions:
    - Can run jobs: True
    - Hardware access: True
    - Instance: ibm-q/open/main
    - Plan: Open Plan (Free Tier)

RECOMMENDATION
─────────────────────────────────────────────────────────────
Token is valid and fully functional.
```

## Incident Response

### If Token is Exposed

**IMMEDIATE (within 5 minutes):**
1. Revoke token at https://quantum.ibm.com/account
2. Generate new token
3. Update `.env` file
4. Test with validation script

**SHORT-TERM (within 1 hour):**
1. Audit recent API usage for suspicious activity
2. Check logs for unauthorized access
3. Review commit history for other exposed secrets
4. Notify team if shared repository

**LONG-TERM (within 24 hours):**
1. Remove token from git history if committed
2. Implement additional security measures
3. Update documentation
4. Conduct security training

### Removing Tokens from Git History

If a token was committed to git:

```bash
# WARNING: This rewrites git history
# Coordinate with team before running

# Install git-filter-repo (better than git filter-branch)
pip install git-filter-repo

# Remove token from all commits
git filter-repo --replace-text <(echo 'your_exposed_token==>TOKEN_REMOVED')

# Force push (requires coordination)
git push --force --all
```

**Alternative (BFG Repo-Cleaner):**
```bash
# Install BFG
brew install bfg  # macOS
# or download from: https://rtyley.github.io/bfg-repo-cleaner/

# Remove token
bfg --replace-text replacements.txt

# Push changes
git push --force --all
```

## Security Monitoring

### Usage Auditing

Monitor token usage at:
- https://quantum.ibm.com/jobs
- https://quantum.ibm.com/usage

Check for:
- Unexpected job submissions
- Unusual usage patterns
- Jobs from unknown locations
- Excessive API calls

### Automated Monitoring

Add monitoring to your code:

```python
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    filename='ibm_quantum_usage.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def track_api_call(operation, backend=None):
    """Log API calls for auditing."""
    logging.info(
        f"IBM Quantum API call: {operation} "
        f"| Backend: {backend} "
        f"| Timestamp: {datetime.now().isoformat()}"
    )

# Usage
track_api_call("job_submission", backend="ibm_brisbane")
```

## Security Checklist

Before committing code:

- [ ] No hardcoded tokens in source files
- [ ] `.env` file in `.gitignore`
- [ ] Token loaded from environment variables
- [ ] Pre-commit hook installed
- [ ] Token validation passing
- [ ] File permissions set correctly (600 for .env)
- [ ] Documentation updated
- [ ] Team notified of security changes

## Additional Resources

- **IBM Quantum Security**: https://quantum.ibm.com/terms
- **Token Management**: https://quantum.ibm.com/account
- **API Documentation**: https://docs.quantum.ibm.com/
- **Security Best Practices**: https://docs.quantum.ibm.com/start/setup-channel

## Support

For security concerns:
- File an issue (without exposing tokens)
- Contact project maintainers
- Review IBM Quantum security policies

---

**Last Updated**: 2025-10-30
**Next Review**: 2026-01-30
