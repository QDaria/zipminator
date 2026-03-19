# Subscription Tiers

Zipminator uses a four-tier subscription model. The open-source SDK includes all 10 anonymization levels, but levels 4-10 require authentication via an API key or activation code.

## Tier Comparison

| Feature | Free | Developer | Pro | Enterprise |
|---------|:----:|:---------:|:---:|:----------:|
| **Price** | $0 | $9/mo | $29/mo | Custom |
| **Anonymization levels** | 1-3 | 1-5 | 1-7 | 1-10 |
| **Monthly entropy** | 1 MB | 10 MB | 100 MB | Unlimited |
| **QRNG access** | No | No | No | Yes |
| **API access** | No | Yes | Yes | Yes |
| **Team features** | No | No | Yes | Yes |
| **SSO integration** | No | No | Yes | Yes |
| **HSM support** | No | No | No | Yes |
| **SLA guarantee** | No | No | No | Yes |
| **Support** | Community | Email | Priority | 24/7 Dedicated |
| **Data limit** | 1 GB/mo | 10 GB/mo | 100 GB/mo | Unlimited |

## Authentication Flow

The SDK checks authorization in this order:

1. **Levels 1-3**: Always allowed, no authentication needed
2. **API key** (`ZIPMINATOR_API_KEY` env var): Validated against the remote API
3. **Activation code**: Local validation with tier-based level checks
4. **Deny**: If no auth method succeeds

### Using an API Key

```python
import os
os.environ["ZIPMINATOR_API_KEY"] = "your-api-key"

from zipminator.crypto.subscription import APIKeyValidator

# Check access
allowed, msg, method = APIKeyValidator.authorize_level(7)
print(f"Allowed: {allowed}, Method: {method}")
```

### Using an Activation Code

```python
from zipminator.crypto.subscription import APIKeyValidator

allowed, msg, method = APIKeyValidator.authorize_level(
    level=5,
    activation_code="BETA2026-LEVEL10"
)
print(f"Allowed: {allowed}, Method: {method}")
# Allowed: True, Method: activation_code
```

### Offline Mode

If the API is unreachable or you want to skip remote validation:

```bash
export ZIPMINATOR_OFFLINE=1
```

In offline mode, only activation codes are checked.

## Activation Code Format

Activation codes follow the pattern `PREFIX-LEVELX`, where:

- **PREFIX** identifies the tier or program
- **LEVEL** specifies the maximum anonymization level (1-10)

| Prefix | Tier | Notes |
|--------|------|-------|
| `FREE` | Free | Levels 1-3 |
| `PRO` | Developer | Levels 1-5 |
| `TEAM` | Pro | Levels 1-7 |
| `ENTERPRISE` | Enterprise | Levels 1-10 |
| `BETA2026` | Enterprise | Beta testers, full access |
| `XRAISED` | Enterprise | Affiliates/investors, full access |
| `GHSTAR` | Developer | GitHub Star supporters |

### Validating an Activation Code

```python
from zipminator.crypto.subscription import SubscriptionManager

result = SubscriptionManager.validate_activation_code("ENTERPRISE-LEVEL10")
print(f"Valid: {result.valid}")
print(f"Tier: {result.tier}")           # SubscriptionTier.ENTERPRISE
print(f"Max level: {result.features.max_level}")  # 10
print(f"QRNG: {result.features.qrng_access}")     # True
```

### Checking Feature Access

```python
from zipminator.crypto.subscription import SubscriptionManager

# Check if a code grants QRNG access
has_qrng = SubscriptionManager.can_use_qrng("ENTERPRISE-LEVEL10")
print(f"QRNG access: {has_qrng}")  # True

# Check if a code allows a specific level
allowed, msg = SubscriptionManager.can_use_level("FREE-LEVEL3", 5)
print(f"Level 5 allowed: {allowed}")  # False
print(f"Message: {msg}")  # "Anonymization level 5 requires Nils tier..."
```

## GitHub Star Program

Users who star the [QDaria/zipminator](https://github.com/QDaria/zipminator) repository receive a `GHSTAR` activation code, granting Developer tier access (levels 1-5) for free.

## Listing All Tiers

```python
from zipminator.crypto.subscription import SubscriptionManager

for tier_info in SubscriptionManager.list_all_tiers():
    print(f"{tier_info['public_name']:12s} | "
          f"Levels {tier_info['levels']:5s} | "
          f"{tier_info['price_early_adopter']:8s} | "
          f"QRNG: {tier_info['qrng_access']}")
```

Output:

```
Free         | Levels 1-3   | $0       | QRNG: False
Developer    | Levels 1-5   | $9       | QRNG: False
Pro          | Levels 1-7   | $29      | QRNG: False
Enterprise   | Levels 1-10  | Custom   | QRNG: True
```

## Contact

For Enterprise pricing and custom deployments, contact [mo@qdaria.com](mailto:mo@qdaria.com).
