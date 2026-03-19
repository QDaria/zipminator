# Use Case: E-Commerce

E-commerce platforms process customer PII (names, addresses, payment details) at scale. GDPR's right to erasure, PCI-DSS cardholder data requirements, and the growing quantum threat create a complex compliance landscape. Zipminator simplifies this with a unified PQC + anonymization toolkit.

## The Challenge

E-commerce companies face:

- **GDPR right to erasure** (Art. 17): Customers can request deletion of all personal data
- **PCI-DSS**: Payment card data must be encrypted or tokenized
- **Data analytics**: Marketing and recommendation engines need customer behavior data, but not PII
- **Third-party sharing**: Logistics partners, payment processors, and ad networks each receive subsets of customer data
- **Retention conflicts**: Tax regulations require keeping transaction records while privacy laws demand deletion

## Zipminator Solution

### Customer PII Protection

Scan customer databases for PII before sharing with third parties:

```python
from zipminator.crypto.pii_scanner import PIIScanner
import pandas as pd

scanner = PIIScanner()
customers = pd.read_csv("customer_export.csv")

results = scanner.scan_dataframe(customers)
pii_cols = [c for c in results["columns"] if results["columns"][c]["has_pii"]]
print(f"PII found in: {pii_cols}")
# PII found in: ['name', 'email', 'phone', 'address', 'card_last4']
```

### Payment Tokenization

Replace credit card numbers with deterministic tokens that preserve referential integrity (same card always maps to the same token):

```python
from zipminator.crypto.anonymization import AnonymizationEngine

engine = AnonymizationEngine()

# L3: Deterministic tokenization (same input = same token)
tokenized = engine.apply_anonymization(
    customers, columns=["card_number"], level=3
)
print(tokenized["card_number"][0])
# "TOKEN_4A8B2C1D" (stable, non-reversible without the token map)
```

The token map is stored in `engine._token_maps["card_number"]` for authorized reversal if needed.

### GDPR Right to Erasure

When a customer exercises their right to erasure, use suppression to remove their data while preserving the record structure for accounting:

```python
from zipminator.crypto.anonymization import AnonymizationEngine
import pandas as pd

engine = AnonymizationEngine()

# Identify the customer's rows
customer_mask = customers["email"] == "delete.me@example.com"
customer_rows = customers[customer_mask]

# L5: Suppress all PII columns (replace with NULL)
for col in pii_cols:
    customers.loc[customer_mask, col] = pd.NA

# The transaction record remains for tax compliance,
# but all PII is removed
```

### Analytics Without PII

Share customer behavior data with the analytics team using synthetic data:

```python
engine = AnonymizationEngine()

# L7: Synthetic data generation (realistic but entirely fake)
analytics_df = engine.apply_anonymization(
    customers,
    columns=["name", "email", "phone", "address"],
    level=7
)
# Names, emails, phones, and addresses are now synthetic (Faker-generated)
# but statistical distributions are preserved
```

### Logistics Partner Data Sharing

When sharing order data with shipping partners, generalize addresses:

```python
# L4: Generalize (reduce precision)
shipping_df = engine.apply_anonymization(
    orders, columns=["address"], level=4
)
# Full address -> "CATEGORY_1" (first-letter category)
# For numeric ZIP codes: "10000-10010" (range)
```

## Data Flow Architecture

```
Customer Data (full PII)
    |
    +-- PII Scanner (detect sensitive columns)
    |
    +-- L3 Tokenization --> Payment processor (tokens only)
    |
    +-- L7 Synthetic data --> Analytics team (fake but realistic)
    |
    +-- L4 Generalization --> Logistics partner (reduced precision)
    |
    +-- L5 Suppression --> Right-to-erasure requests
    |
    +-- Kyber768 encryption --> Long-term storage (quantum-safe)
```

## Subscription Recommendation

| E-Commerce Size | Recommended Tier | Key Features |
|----------------|:----------------:|-------------|
| Small (< 10K customers) | Free | L1-3 anonymization, PII scanning |
| Medium (10K-100K) | Developer ($9/mo) | L1-5, API access, 10 GB/mo |
| Large (100K-1M) | Pro ($29/mo) | L1-7, synthetic data, team features |
| Enterprise (1M+) | Enterprise | L1-10, HSM, QRNG, unlimited data |

Contact [mo@qdaria.com](mailto:mo@qdaria.com) for volume pricing.
