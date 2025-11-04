# IBM Quantum Token Security - Quick Start

## CRITICAL: Token Security Issue Detected

Your IBM Quantum token is exposed in `ibm-qrng.ipynb`. Follow these steps immediately:

## 30-Second Quick Fix

```bash
# 1. Run migration script
./scripts/secure_token_migration.sh

# 2. Visit IBM Quantum and revoke old token
open https://quantum.ibm.com/account

# 3. Generate new token at the same page

# 4. Update .env file (created by migration script)
nano .env
# Add: IBM_QUANTUM_TOKEN=your_new_token_here

# 5. Validate
python scripts/validate_ibm_token.py
```

## Complete Documentation

- **Quick Start**: This file
- **Security Guide**: `docs/ibm_token_security.md`
- **Refresh Guide**: `docs/ibm_token_refresh_guide.md`
- **Implementation**: `docs/TOKEN_SECURITY_IMPLEMENTATION.md`
- **Checklist**: `docs/token_migration_checklist.md`

## Tools Available

1. **validate_ibm_token.py** - Validate tokens
2. **secure_token_migration.sh** - Automated migration
3. **scan_for_tokens.sh** - Find exposed tokens
4. **ibm_qrng_secure.py** - Secure implementation example

## Get Token

Visit: https://quantum.ibm.com/account

---

For complete details, see `docs/TOKEN_SECURITY_IMPLEMENTATION.md`
