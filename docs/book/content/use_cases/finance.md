# Use Case: Finance

Financial institutions process millions of transactions daily, each containing sensitive PII and payment data. Regulatory frameworks (PCI-DSS, SOX, MiFID II, Basel III) mandate encryption of data at rest and in transit. Zipminator provides quantum-resistant encryption that protects financial data against both current and future threats.

## The Challenge

Financial data faces several distinct risks:

- **Long-lived secrets**: Encryption keys protecting wire transfers, SWIFT messages, and trade records must remain secure for 7-30 years (regulatory retention periods)
- **High-value targets**: Nation-state adversaries actively target financial infrastructure
- **Regulatory pressure**: PCI-DSS requires "strong cryptography" but does not yet mandate PQC; early adoption provides competitive advantage
- **Cross-border exposure**: International wire transfers traverse multiple jurisdictions, each with different data protection requirements

## Zipminator Solution

### Transaction Data Protection

Encrypt transaction records with quantum-resistant keys:

```python
from zipminator import keypair, encapsulate, decapsulate

# Bank generates a keypair for its transaction vault
pk, sk = keypair()

# For each batch of transactions, encapsulate a fresh symmetric key
ct, batch_key = encapsulate(pk)

# Use batch_key as the AES-256-GCM key for encrypting the transaction batch
# (AES encryption handled at the application layer)
```

### Credit Card PII Detection

Scan datasets for credit card numbers and other financial PII before processing:

```python
from zipminator.crypto.pii_scanner import PIIScanner
import pandas as pd

scanner = PIIScanner()
df = pd.DataFrame({
    "customer_name": ["Alice Johnson", "Bob Smith"],
    "card_number": ["4111-1111-1111-1111", "5500-0000-0000-0004"],
    "transaction_note": ["Ref: IBAN DE89 3704 0044 0532 0130 00", "Wire to account 12345"],
})

results = scanner.scan_dataframe(df)
# Detects: credit card numbers (Luhn-validated), IBAN, names
print(f"Risk level: {results['summary']}")
```

### Anonymization for Analytics

Financial analytics teams need aggregate insights without access to individual customer data:

```python
from zipminator.crypto.anonymization import AnonymizationEngine

engine = AnonymizationEngine()

# L4: Generalize transaction amounts to ranges (for trend analysis)
analytics_df = engine.apply_anonymization(
    df, columns=["amount"], level=4
)
# amount: "1000-1010" (bucketed)

# L9: Differential privacy for risk models (formal privacy guarantees)
risk_df = engine.apply_anonymization(
    df, columns=["credit_score", "income"], level=9
)
```

### SWIFT Message Security

SWIFT messages (MT103, MT202) carry wire transfer instructions between banks. Protecting these with PQC ensures quantum adversaries cannot retroactively decrypt intercepted messages:

```python
from zipminator import keypair, encapsulate, decapsulate

# Correspondent bank keypair exchange
sender_pk, sender_sk = keypair()
receiver_pk, receiver_sk = keypair()

# Sender encapsulates using receiver's public key
ct, shared_secret = encapsulate(receiver_pk)

# Receiver decapsulates
recovered = decapsulate(ct, receiver_sk)

# shared_secret used as HMAC key for message authentication
assert shared_secret == recovered
```

## PCI-DSS Alignment

PCI-DSS v4.0 requires "strong cryptography" for cardholder data. While PCI-DSS does not yet mandate PQC, Zipminator's Kyber768 exceeds current requirements:

| PCI-DSS Requirement | Zipminator Coverage |
|--------------------|--------------------|
| Req 3.4: Render PAN unreadable | L1 (SHA-256 hash) or L3 (tokenization) |
| Req 3.5: Protect encryption keys | Kyber768 KEM with optional HSM storage |
| Req 4.1: Encrypt transmission | Kyber768 key exchange for AES-256-GCM |
| Req 6.5: Secure coding | Constant-time operations, fuzz testing |

## Quantum Risk Timeline for Finance

| Timeframe | Risk | Action |
|-----------|------|--------|
| Now | Harvest-now-decrypt-later attacks on archived data | Encrypt archives with PQC |
| 2-5 years | Regulatory mandates for PQC migration begin | Integrate PQC into payment infrastructure |
| 5-10 years | Cryptographically relevant quantum computers possible | All financial encryption must be post-quantum |

## Deployment Model

Financial institutions typically require:

- **On-premise deployment** with no cloud dependency
- **HSM integration** for key storage (PKCS#11 compatible)
- **Audit trail** for all cryptographic operations
- **Dual encryption** (classical + PQC) during migration period

Zipminator's Enterprise tier provides all of these. Contact [mo@qdaria.com](mailto:mo@qdaria.com) for financial services pricing.
