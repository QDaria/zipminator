# API Credentials & Access

Zipminator uses a tiered access model. Lower anonymization levels are free; higher levels require authentication.

## Access by Tier

````{tab-set}
```{tab-item} Free (L1-L3)
No API key or activation code needed. Install and use immediately:

    pip install zipminator

All Level 1-3 anonymization, PII scanning, key generation, and entropy operations are available without authentication.
```

```{tab-item} Developer (L1-L5)
Requires an activation code. Set via environment variable or pass directly:

    export ZIPMINATOR_API_KEY=your-developer-key

Or use an activation code:

    from zipminator.crypto.subscription import APIKeyValidator
    allowed, msg, method = APIKeyValidator.authorize_level(5, activation_code="PRO-LEVEL5")
```

```{tab-item} Pro (L1-L7)
Includes team features and SSO. Activation code format:

    TEAM-LEVEL7

Contact mo@qdaria.com for Pro tier access.
```

```{tab-item} Enterprise (L1-L10)
Full access including Paillier homomorphic encryption, HSM support, and 24/7 dedicated support.

    ENTERPRISE-LEVEL10
    BETA2026-LEVEL10    # Beta testers
    XRAISED-LEVEL10     # Investors/affiliates

Contact mo@qdaria.com for Enterprise onboarding.
```
````

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|:--------:|
| `ZIPMINATOR_API_KEY` | API key for remote validation | L4+ |
| `ZIPMINATOR_OFFLINE` | Set to `1` to skip remote validation | Optional |
| `QBRAID_API_KEY` | qBraid quantum backend access | Optional |
| `IBM_QUANTUM_TOKEN` | IBM Quantum hardware access | Optional |

## Activation Code Format

Codes follow the pattern `PREFIX-LEVELX`:

```
FREE-LEVEL3        # Free tier
PRO-LEVEL5         # Developer tier
TEAM-LEVEL7        # Pro tier
ENTERPRISE-LEVEL10 # Enterprise tier
BETA2026-LEVEL10   # Beta testers (full access)
GHSTAR-LEVEL5      # GitHub star supporters
```

## Validating Access

```python
from zipminator.crypto.subscription import SubscriptionManager

result = SubscriptionManager.validate_activation_code("BETA2026-LEVEL10")
print(f"Valid: {result.valid}")
print(f"Tier: {result.features.public_name}")
print(f"Max level: {result.features.max_level}")
print(f"QRNG: {result.features.qrng_access}")
```

## QRNG Access

```{admonition} Early Adopter Benefit
:class: tip

During the early adopter period, quantum entropy (QRNG) is available on **all tiers**. This includes quantum-seeded key generation, noise injection, and entropy pool access regardless of subscription level.
```

See {doc}`subscription` for full tier comparison and pricing.
