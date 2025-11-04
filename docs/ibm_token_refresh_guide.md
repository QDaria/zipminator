# IBM Quantum Token Refresh Guide

## Overview

This guide provides step-by-step instructions for generating and refreshing IBM Quantum API tokens.

## Why Refresh Tokens?

**Security Reasons:**
- Regular rotation reduces exposure window
- Limits impact of compromised tokens
- Follows security best practices
- Maintains compliance standards

**Operational Reasons:**
- Tokens may expire
- Access permissions change
- Account upgrades/downgrades
- Project restructuring

**Recommended Schedule:**
- **Development**: Every 30 days
- **Production**: Every 90 days
- **After exposure**: Immediately

## Token Generation Methods

### Method 1: IBM Quantum Platform (Primary)

#### Step 1: Access Your Account

1. Navigate to: **https://quantum.ibm.com/**
2. Click **"Sign In"** (top right)
3. Log in with your IBM credentials

#### Step 2: Navigate to Token Management

1. Click your **profile icon** (top right)
2. Select **"Account Settings"** from dropdown
3. Or directly visit: **https://quantum.ibm.com/account**

#### Step 3: Generate New Token

```
┌─────────────────────────────────────────────────┐
│  IBM Quantum Account Dashboard                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  API Tokens                                     │
│  ┌──────────────────────────────────────┐      │
│  │                                      │      │
│  │  [Generate New Token] [Revoke]      │      │
│  │                                      │      │
│  │  Token: f72296...                   │      │
│  │  Created: 2025-10-30                │      │
│  │  Last Used: 2025-10-30              │      │
│  │                                      │      │
│  └──────────────────────────────────────┘      │
│                                                 │
│  Instance: ibm-q/open/main                     │
│  Plan: Open Plan (Free)                        │
│                                                 │
└─────────────────────────────────────────────────┘
```

1. Click **"Generate New Token"** button
2. Confirm generation in the modal dialog
3. **IMMEDIATELY COPY** the token (it won't be shown again)
4. Store securely in password manager

#### Step 4: Update Your Environment

```bash
# Navigate to project directory
cd /Users/mos/dev/qdaria-qrng

# Edit .env file
nano .env  # or use your preferred editor

# Update the token
IBM_QUANTUM_TOKEN=your_new_token_here
TOKEN_LAST_UPDATED=2025-10-30

# Save and exit (Ctrl+X, Y, Enter for nano)
```

#### Step 5: Validate New Token

```bash
# Run validation script
python scripts/validate_ibm_token.py

# Expected output:
# ✓ Authentication successful
# ✓ Backend access verified
# ✓ Permissions validated
```

#### Step 6: Revoke Old Token

**IMPORTANT**: Only revoke after confirming new token works!

1. Return to https://quantum.ibm.com/account
2. Find the old token in the list
3. Click **"Revoke"** next to the old token
4. Confirm revocation

### Method 2: IBM Cloud CLI (Advanced)

For users with IBM Cloud accounts:

```bash
# Install IBM Cloud CLI
curl -fsSL https://clis.cloud.ibm.com/install/osx | sh  # macOS
# or
curl -fsSL https://clis.cloud.ibm.com/install/linux | sh  # Linux

# Login
ibmcloud login

# Get API key (can be used as token)
ibmcloud iam api-key-create qrng-api-key -d "QRNG project API key"

# Note: IBM Cloud tokens work differently than quantum tokens
# Prefer Method 1 for quantum-specific tokens
```

### Method 3: Qiskit CLI (Legacy)

```bash
# Save account (creates config file)
python -c "
from qiskit_ibm_runtime import QiskitRuntimeService
QiskitRuntimeService.save_account(
    channel='ibm_quantum',
    token='your_token_here',
    instance='ibm-q/open/main',
    overwrite=True
)
"

# Verify saved credentials
python -c "
from qiskit_ibm_runtime import QiskitRuntimeService
service = QiskitRuntimeService()
print('Token configured successfully')
"
```

## Automated Refresh Script

Create `scripts/refresh_token.sh` for guided refresh:

```bash
#!/bin/bash
# Token refresh automation

echo "IBM Quantum Token Refresh Wizard"
echo "================================"
echo ""
echo "1. Visit: https://quantum.ibm.com/account"
echo "2. Click 'Generate New Token'"
echo "3. Copy the new token"
echo ""
read -p "Press Enter when ready to continue..."
echo ""
echo "Paste your new token (input hidden):"
read -s NEW_TOKEN
echo ""

# Validate token format
if [[ ! $NEW_TOKEN =~ ^[a-f0-9]{100,}$ ]]; then
    echo "ERROR: Invalid token format"
    exit 1
fi

# Backup current .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Update .env
sed -i.tmp "s/IBM_QUANTUM_TOKEN=.*/IBM_QUANTUM_TOKEN=$NEW_TOKEN/" .env
sed -i.tmp "s/TOKEN_LAST_UPDATED=.*/TOKEN_LAST_UPDATED=$(date +%Y-%m-%d)/" .env
rm .env.tmp

# Validate new token
echo "Validating new token..."
if python scripts/validate_ibm_token.py; then
    echo "✓ Token refresh successful!"
    echo ""
    echo "Next steps:"
    echo "1. Test your application"
    echo "2. Revoke old token at https://quantum.ibm.com/account"
else
    echo "✗ Token validation failed"
    echo "Restoring backup..."
    cp .env.backup.* .env
    exit 1
fi
```

## Token Troubleshooting

### Issue: "Invalid token" error

**Symptoms:**
```
IBMNotAuthorizedError: 'Invalid authentication credentials'
```

**Solutions:**
1. Verify token was copied completely (128 characters)
2. Check for extra spaces/newlines
3. Ensure `.env` file is in correct location
4. Verify environment variable is loaded: `echo $IBM_QUANTUM_TOKEN`
5. Generate fresh token

### Issue: "Token expired" error

**Symptoms:**
```
QiskitRuntimeError: Token has expired
```

**Solutions:**
1. IBM Quantum tokens don't typically expire
2. This usually indicates account issues
3. Check account status at https://quantum.ibm.com/
4. Verify payment method (if premium plan)
5. Contact IBM support if persistent

### Issue: "Insufficient permissions" error

**Symptoms:**
```
IBMNotAuthorizedError: User doesn't have access to the backend
```

**Solutions:**
1. Verify instance in `.env` matches your account
2. Check plan limits (Open Plan = 10 min/month)
3. Upgrade plan if needed
4. Request access to premium backends
5. Use different backend: `service.least_busy()`

### Issue: Token validation fails

**Diagnosis:**
```bash
# Check token length
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(len(os.getenv('IBM_QUANTUM_TOKEN', '')))"
# Should output: 128

# Check token format (all lowercase hex)
python -c "import os, re; from dotenv import load_dotenv; load_dotenv(); token=os.getenv('IBM_QUANTUM_TOKEN', ''); print('Valid' if re.match(r'^[a-f0-9]{128}$', token) else 'Invalid')"
```

**Solutions:**
1. Regenerate token carefully
2. Use password manager to avoid typos
3. Copy token using "Copy to clipboard" button
4. Avoid manual typing

## Security During Refresh

### Before Generating New Token

- [ ] Audit current token usage
- [ ] Document which systems use the token
- [ ] Plan update schedule to minimize downtime
- [ ] Notify team members of upcoming change

### During Token Generation

- [ ] Use secure network (avoid public WiFi)
- [ ] Clear clipboard after copying token
- [ ] Don't paste token in unsecured locations
- [ ] Don't screenshot token display

### After Token Update

- [ ] Test immediately with validation script
- [ ] Update all systems using the token
- [ ] Revoke old token only after verification
- [ ] Update documentation with refresh date
- [ ] Store old token hash for audit trail

## Token Lifecycle Management

### Creation Phase

```
┌──────────────────────────────────────────────┐
│ 1. Generate Token                            │
│    └─> IBM Quantum Platform                  │
│                                              │
│ 2. Store Securely                            │
│    └─> .env file (chmod 600)                │
│    └─> Password manager                      │
│                                              │
│ 3. Validate                                  │
│    └─> validation script                     │
│    └─> Test API call                         │
└──────────────────────────────────────────────┘
```

### Active Phase

```
┌──────────────────────────────────────────────┐
│ 1. Regular Monitoring                        │
│    └─> Usage logs                            │
│    └─> Failed auth attempts                  │
│                                              │
│ 2. Periodic Validation                       │
│    └─> Weekly automated checks               │
│    └─> Pre-production deployments            │
│                                              │
│ 3. Rotation Reminders                        │
│    └─> Calendar alerts (30/60/90 days)      │
│    └─> Automated expiry warnings             │
└──────────────────────────────────────────────┘
```

### Retirement Phase

```
┌──────────────────────────────────────────────┐
│ 1. Generate Replacement                      │
│    └─> New token created                     │
│    └─> Validated successfully                │
│                                              │
│ 2. Migration                                 │
│    └─> Update all systems                    │
│    └─> Verify functionality                  │
│                                              │
│ 3. Revocation                                │
│    └─> Old token revoked                     │
│    └─> Audit log updated                     │
│    └─> Hash stored for records               │
└──────────────────────────────────────────────┘
```

## Advanced: Multiple Token Management

For projects requiring multiple tokens:

```bash
# .env
IBM_QUANTUM_TOKEN_DEV=dev_token_here
IBM_QUANTUM_TOKEN_PROD=prod_token_here
IBM_QUANTUM_TOKEN_TEST=test_token_here
```

```python
# token_manager.py
import os
from enum import Enum
from dotenv import load_dotenv

class Environment(Enum):
    DEV = "development"
    PROD = "production"
    TEST = "testing"

class TokenManager:
    """Manage multiple IBM Quantum tokens."""

    def __init__(self):
        load_dotenv()
        self._tokens = {
            Environment.DEV: os.getenv("IBM_QUANTUM_TOKEN_DEV"),
            Environment.PROD: os.getenv("IBM_QUANTUM_TOKEN_PROD"),
            Environment.TEST: os.getenv("IBM_QUANTUM_TOKEN_TEST"),
        }

    def get_token(self, env: Environment) -> str:
        """Get token for specific environment."""
        token = self._tokens.get(env)
        if not token:
            raise ValueError(f"Token not found for {env.value}")
        return token

    def validate_all(self) -> dict:
        """Validate all configured tokens."""
        results = {}
        for env, token in self._tokens.items():
            if token:
                # Run validation for each token
                results[env.value] = self._validate_token(token)
        return results

# Usage
manager = TokenManager()
prod_token = manager.get_token(Environment.PROD)
```

## Quick Reference Card

```
╔═══════════════════════════════════════════════════════════╗
║  IBM Quantum Token Quick Reference                        ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  Generate Token:                                          ║
║    https://quantum.ibm.com/account                       ║
║                                                           ║
║  Update .env:                                             ║
║    IBM_QUANTUM_TOKEN=your_new_token                      ║
║    TOKEN_LAST_UPDATED=2025-10-30                         ║
║                                                           ║
║  Validate:                                                ║
║    python scripts/validate_ibm_token.py                  ║
║                                                           ║
║  Revoke Old:                                              ║
║    https://quantum.ibm.com/account → Revoke              ║
║                                                           ║
║  Rotation Schedule:                                       ║
║    Development: 30 days                                   ║
║    Production: 90 days                                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

## Frequently Asked Questions

**Q: How long do tokens last?**
A: IBM Quantum tokens don't expire automatically, but should be rotated regularly for security (30-90 days).

**Q: Can I have multiple active tokens?**
A: Yes, you can generate multiple tokens. Useful for different environments or team members.

**Q: What happens to running jobs if I revoke a token?**
A: Jobs already submitted will continue. New job submissions with the old token will fail.

**Q: Can I recover a revoked token?**
A: No, revoked tokens cannot be recovered. Generate a new token.

**Q: Does rotating tokens affect my account quota?**
A: No, tokens don't impact quotas. Your account plan determines usage limits.

**Q: How do I know if my token was compromised?**
A: Check usage logs at https://quantum.ibm.com/jobs for unauthorized activity.

---

**Last Updated**: 2025-10-30
**Next Review**: 2026-01-30
