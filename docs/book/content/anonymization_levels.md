# 10-Level Anonymization System

Zipminator provides a progressive anonymization system with 10 distinct levels. Each level increases privacy protection at the cost of data utility. Levels are gated by subscription tier.

## Overview

| Level | Name | Tier | Reversible | Utility Loss |
|-------|------|------|------------|-------------|
| L1 | Minimal Masking | Free | Yes | Very Low |
| L2 | Partial Redaction | Free | Yes | Low |
| L3 | Static Masking | Free | No | Medium |
| L4 | PQC Pseudonymization | Developer | With key | Low |
| L5 | Data Generalization | Developer | No | Medium |
| L6 | Data Suppression | Pro | No | High |
| L7 | Quantum Jitter | Pro | No | Medium |
| L8 | Differential Privacy | Enterprise | No | Configurable |
| L9 | Enhanced K-Anonymity | Enterprise | No | Medium-High |
| L10 | Total Quantum Pseudoanonymization | Enterprise | With key | Very Low |

---

## L1: Minimal Masking

**Tier**: Free | **Reversible**: Yes | **Technique**: Regex pattern matching

Applies lightweight regex-based masking to known PII patterns (emails, phone numbers, SSNs). The original structure is preserved, making it easy to reverse.

```python
from zipminator.anonymizer import AdvancedAnonymizer
import pandas as pd

anonymizer = AdvancedAnonymizer()

df = pd.DataFrame({
    "name": ["Alice Johnson", "Bob Smith"],
    "email": ["alice@example.com", "bob@corp.net"],
    "phone": ["555-123-4567", "555-987-6543"],
})

result = anonymizer.anonymize(df, level=1)
print(result)
# name            email                   phone
# A**** J******   a****@example.com       555-***-4567
# B** S****       b**@corp.net            555-***-6543
```

**Trade-offs**: Minimal privacy gain. Suitable for internal logging where full PII is unnecessary but data shape must be preserved.

---

## L2: Partial Redaction

**Tier**: Free | **Reversible**: Yes | **Technique**: First/last character preservation

Retains the first and last characters of each field value, replacing the middle with asterisks. Preserves enough structure for pattern recognition while obscuring the full value.

```python
result = anonymizer.anonymize(df, level=2)
print(result)
# name            email                   phone
# A***********n   a***********m           5*********7
# B*******h       b*******t               5*********3
```

**Trade-offs**: Slightly better privacy than L1 but still reversible with context. Good for QA environments.

---

## L3: Static Masking

**Tier**: Free | **Reversible**: No | **Technique**: Fixed `[REDACTED]` replacement

Replaces all detected PII fields with a static `[REDACTED]` token. This is a one-way operation; original values cannot be recovered.

```python
result = anonymizer.anonymize(df, level=3)
print(result)
# name         email        phone
# [REDACTED]   [REDACTED]   [REDACTED]
# [REDACTED]   [REDACTED]   [REDACTED]
```

**Trade-offs**: Strong privacy for PII fields but complete loss of analytical utility in masked columns. Non-PII columns are untouched.

---

## L4: PQC Pseudonymization

**Tier**: Developer | **Reversible**: With key | **Technique**: SHA-3 + PQC seed hashing

Generates deterministic pseudonyms using SHA-3 keyed with a PQC-derived seed. The same input always produces the same pseudonym (enabling joins and aggregation), but the mapping cannot be reversed without the PQC key.

```python
result = anonymizer.anonymize(df, level=4)
print(result)
# name                              email                             phone
# pqc_a3f8b2c1d4e5f6a7b8c9d0e1f2   pqc_1a2b3c4d5e6f7a8b9c0d1e2f3a   pqc_7f8e9d0c1b2a3f4e5d6c7b8a9f
# pqc_b4c9d3e2f5a6b7c8d9e0f1a2b3   pqc_2b3c4d5e6f7a8b9c0d1e2f3a4b   pqc_8a9b0c1d2e3f4a5b6c7d8e9f0a
```

**Trade-offs**: Preserves referential integrity (same person gets same pseudonym). Requires secure storage of the PQC key for re-identification.

---

## L5: Data Generalization

**Tier**: Developer | **Reversible**: No | **Technique**: Range bucketing

Replaces precise values with generalized ranges. Numeric values are bucketed; categorical values are replaced with broader categories.

```python
df_with_age = pd.DataFrame({
    "name": ["Alice Johnson", "Bob Smith"],
    "age": [34, 52],
    "salary": [85000, 120000],
    "zipcode": ["10001", "90210"],
})

result = anonymizer.anonymize(df_with_age, level=5)
print(result)
# name         age      salary          zipcode
# [REDACTED]   30-39    80000-90000     100**
# [REDACTED]   50-59    120000-130000   902**
```

**Trade-offs**: Preserves statistical distributions at reduced granularity. Suitable for demographic analysis and reporting.

---

## L6: Data Suppression

**Tier**: Pro | **Reversible**: No | **Technique**: Column removal

Removes entire columns that are deemed high-risk for re-identification. The anonymizer uses PII detection to select columns for suppression.

```python
result = anonymizer.anonymize(df_with_age, level=6)
print(result)
# age    salary
# 34     85000
# 52     120000
```

**Trade-offs**: Eliminates re-identification risk from direct identifiers. May remove columns needed for analysis; review column selection before applying.

---

## L7: Quantum Jitter

**Tier**: Pro | **Reversible**: No | **Technique**: QRNG Gaussian noise injection

Adds calibrated Gaussian noise to numerical columns using quantum random numbers from the 156-qubit IBM quantum processor. The noise magnitude is proportional to the column's standard deviation.

```python
result = anonymizer.anonymize(df_with_age, level=7)
print(result)
# name         age    salary    zipcode
# [REDACTED]   36     87341     [REDACTED]
# [REDACTED]   50     118209    [REDACTED]
```

**Trade-offs**: Preserves statistical properties (mean, variance) while preventing exact value matching. The quantum entropy source ensures noise is truly unpredictable.

---

## L8: Differential Privacy

**Tier**: Enterprise | **Reversible**: No | **Technique**: Calibrated Laplace noise

Applies formal differential privacy guarantees using the Laplace mechanism. The privacy budget (epsilon) controls the trade-off between privacy and accuracy.

```python
result = anonymizer.anonymize(df_with_age, level=8, epsilon=1.0)
print(result)
# name         age    salary    zipcode
# [REDACTED]   31     79823     [REDACTED]
# [REDACTED]   55     125417    [REDACTED]
```

**Parameters**:
- `epsilon` (float): Privacy budget. Lower values provide stronger privacy but more noise. Default: 1.0.
- `sensitivity` (float): Maximum influence of a single record. Auto-calculated if not provided.

**Trade-offs**: Provides mathematically provable privacy guarantees. Query accuracy degrades with smaller epsilon values.

---

## L9: Enhanced K-Anonymity

**Tier**: Enterprise | **Reversible**: No | **Technique**: Quasi-identifier clustering

Groups records so that every combination of quasi-identifiers (age, zipcode, gender, etc.) appears at least k times. Records are generalized or suppressed to meet the k threshold.

```python
df_large = pd.DataFrame({
    "name": ["Alice", "Bob", "Carol", "Dave", "Eve", "Frank"],
    "age": [34, 35, 33, 52, 51, 53],
    "zipcode": ["10001", "10001", "10002", "90210", "90210", "90211"],
    "salary": [85000, 88000, 82000, 120000, 115000, 125000],
})

result = anonymizer.anonymize(df_large, level=9, k=3)
print(result)
# name         age      zipcode   salary
# [REDACTED]   30-39    100**     85000
# [REDACTED]   30-39    100**     88000
# [REDACTED]   30-39    100**     82000
# [REDACTED]   50-59    902**     120000
# [REDACTED]   50-59    902**     115000
# [REDACTED]   50-59    902**     125000
```

**Parameters**:
- `k` (int): Minimum group size. Higher values provide stronger anonymity. Default: 5.

**Trade-offs**: Strong protection against linkage attacks. Requires sufficient dataset size; small datasets may need aggressive generalization.

---

## L10: Total Quantum Pseudoanonymization

**Tier**: Enterprise | **Reversible**: With key | **Technique**: OTP mapping + QRNG

The highest anonymization level. Creates a quantum one-time-pad mapping table where each original value is mapped to a unique random identifier generated using QRNG. The mapping table is encrypted with Kyber768 and stored separately.

```python
result, encrypted_mapping = anonymizer.anonymize(df, level=10, return_mapping=True)
print(result)
# name                                  email                                 phone
# qtp_8f2a1b3c4d5e6f7a8b9c0d1e2f3a4b   qtp_3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c   qtp_9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f
# qtp_c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9   qtp_4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d   qtp_0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a
```

**Properties**:
- Each value gets a unique QRNG-generated identifier (no collisions)
- The mapping table is encrypted with Kyber768 and can only be decrypted by the key holder
- Without the mapping key, re-identification is computationally infeasible
- Preserves referential integrity (same input maps to same pseudonym within a session)

**Trade-offs**: Maximum privacy with full reversibility for authorized parties. Requires secure key management infrastructure. The encrypted mapping table must be stored and protected.

---

## Choosing the Right Level

```{admonition} Decision Guide
:class: tip

- **Internal analytics, low sensitivity**: L1-L3 (Free tier)
- **Cross-department sharing**: L4-L5 (Developer tier, pseudonymization preserves joins)
- **External data sharing**: L6-L7 (Pro tier, remove identifiers, add noise)
- **Regulatory compliance**: L8-L9 (Enterprise tier, formal privacy guarantees)
- **Maximum protection with recovery**: L10 (Enterprise tier, quantum OTP)
```

## Tier Requirements

To use levels above your current tier, upgrade your subscription:

```python
from zipminator.crypto.subscription import SubscriptionManager

manager = SubscriptionManager()
print(manager.get_allowed_levels())
# Free: [1, 2, 3]
# Developer: [1, 2, 3, 4, 5]
# Pro: [1, 2, 3, 4, 5, 6, 7]
# Enterprise: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
```
