# Subscription Tiers

Zipminator uses a four-tier subscription model. The open-source SDK includes all 10 anonymization levels, but levels 4-10 require authentication via an API key or activation code.

```{admonition} Early Adopter Benefit
:class: tip

During the early adopter period, **QRNG access is enabled on all tiers**. All users get quantum-seeded key generation, entropy pool access, and quantum noise injection regardless of subscription level.
```

## Tier Comparison

::::{grid} 2
:gutter: 3

:::{grid-item-card} Free
**$0/month**
^^^
- Anonymization levels 1-3
- 1 MB/mo entropy
- QRNG access (early adopter)
- Community support
- 1 GB/mo data limit
:::

:::{grid-item-card} Developer
**$9/month** (early adopter) | $29/month standard
^^^
- Anonymization levels 1-5
- 10 MB/mo entropy
- QRNG access (early adopter)
- API access
- Email support
- 10 GB/mo data limit
:::

:::{grid-item-card} Pro
**$29/month** (early adopter) | $69/month standard
^^^
- Anonymization levels 1-7
- 100 MB/mo entropy
- QRNG access (early adopter)
- Team features + SSO
- Priority support
- 100 GB/mo data limit
:::

:::{grid-item-card} Enterprise
**Custom** ($5K-$50K/month)
^^^
- All 10 anonymization levels
- Unlimited entropy
- QRNG access
- HSM + SLA guarantee
- 24/7 dedicated support
- On-premise deployment
- Workshops + certifications
:::
::::

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
Free         | Levels 1-3   | $0       | QRNG: True
Developer    | Levels 1-5   | $9       | QRNG: True
Pro          | Levels 1-7   | $29      | QRNG: True
Enterprise   | Levels 1-10  | Custom   | QRNG: True
```

## Contact

For Enterprise pricing and custom deployments, contact [mo@qdaria.com](mailto:mo@qdaria.com).
