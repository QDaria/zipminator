# PII Scanning

Zipminator's PII (Personally Identifiable Information) scanner detects sensitive data across multiple jurisdictions before encryption or anonymization. Each match receives a confidence score and risk level, enabling automated compliance workflows.

## Quick Start

```python
from zipminator.crypto.pii_scanner import PIIScanner
import pandas as pd

scanner = PIIScanner()

df = pd.DataFrame({
    "name": ["Ola Nordmann", "Jane Smith"],
    "email": ["ola@example.no", "jane@example.com"],
    "national_id": ["12345678901", "123-45-6789"],
    "notes": ["Called from 555-0123", "IP: 192.168.1.1"],
})

results = scanner.scan_dataframe(df)
print(results["summary"])
```

Output:

```
PII Scan Results:
  - 4 column(s) contain PII
  - Risk Level: HIGH
  - Recommended Anonymization Level: 7/10
```

## Detected PII Types

The scanner recognizes 18+ PII patterns:

| PII Type | Example | Risk Level |
|----------|---------|:----------:|
| Norwegian FNR (fodselsnummer) | 12345678901 | Critical |
| US Social Security Number | 123-45-6789 | Critical |
| Credit card number | 4111-1111-1111-1111 | Critical |
| IBAN | NO93 8601 1117 947 | High |
| API key / auth token | sk_live_abc123... | Critical |
| Password (in plaintext) | password=hunter2 | Critical |
| Email address | user@example.com | Medium |
| Phone number | +47 123 45 678 | Medium |
| IP address | 192.168.1.1 | Low |
| Street address | Karl Johans gate 1 | Medium |
| Date of birth | 1990-01-15 | Medium |
| Passport number | NO12345678 | High |
| Driver's license | DL-123456 | High |
| Bank account number | 1234.56.78901 | High |
| Medical record number | MRN-123456 | High |
| Biometric identifier | FINGERPRINT_HASH_... | Critical |
| Vehicle identification | VIN: 1HGBH41JXMN109186 | Medium |
| Tax ID | 999-99-9999 | High |

## Country Coverage

The scanner supports jurisdiction-specific patterns for 15 countries across 5 regions:

::::{grid} 2
:gutter: 2

:::{grid-item-card} Nordics
- **Norway (NO)**: Fodselsnummer, D-nummer, bankgiro
- **Sweden (SE)**: Personnummer, samordningsnummer
- **Denmark (DK)**: CPR-nummer
- **Finland (FI)**: Henkilotunnus (HETU)
:::

:::{grid-item-card} Europe
- **EU**: IBAN, VAT ID, GDPR identifiers
- **Germany (DE)**: Personalausweisnummer, Steuer-ID
- **France (FR)**: NIR (INSEE), carte d'identite
- **UK**: NIN, NHS number, sort code
:::

:::{grid-item-card} Americas
- **US**: SSN, EIN, ITIN, driver's license
- **Canada (CA)**: SIN, health card, driver's license
- **Brazil (BR)**: CPF, CNPJ, RG
:::

:::{grid-item-card} Asia-Pacific & Middle East
- **India (IN)**: Aadhaar, PAN, voter ID
- **Japan (JP)**: My Number, residence card
- **Australia (AU)**: TFN, Medicare, ABN
- **UAE**: Emirates ID, trade license
:::
::::

## Multi-Country Scanning

To scan with specific country patterns:

```python
from zipminator.crypto.pii_scanner import PIIScanner

scanner = PIIScanner()

# Scan with Norwegian + EU patterns
results = scanner.scan_text(
    "Fodselsnummer: 12345678901, IBAN: NO93 8601 1117 947",
    countries=["NO", "EU"]
)

for match in results:
    print(f"Type: {match['type']}, Confidence: {match['confidence']:.2f}, Risk: {match['risk']}")
```

## Integration with Anonymization

The recommended workflow is: scan for PII first, then anonymize at the recommended level.

```python
from zipminator.crypto.pii_scanner import PIIScanner
from zipminator.crypto.anonymization import AnonymizationEngine
import pandas as pd

scanner = PIIScanner()
engine = AnonymizationEngine()

df = pd.read_csv("customer_data.csv")

# Step 1: Scan for PII
results = scanner.scan_dataframe(df)
pii_columns = [col for col in results["columns"] if results["columns"][col]["has_pii"]]
recommended_level = results["recommended_level"]

print(f"Found PII in columns: {pii_columns}")
print(f"Recommended anonymization level: {recommended_level}")

# Step 2: Anonymize PII columns at the recommended level
anonymized = engine.apply_anonymization(df, columns=pii_columns, level=recommended_level)
```

## Risk Levels

Each PII detection is assigned a risk level:

:::{list-table}
:header-rows: 1

* - Risk Level
  - Description
  - Example Types
* - **Critical**
  - Direct identifiers that can identify an individual alone
  - SSN, FNR, credit card, API keys, passwords
* - **High**
  - Quasi-identifiers that can identify when combined
  - Passport, IBAN, bank account, medical record
* - **Medium**
  - Contact information and demographic data
  - Email, phone, address, date of birth
* - **Low**
  - Technical identifiers with limited PII risk
  - IP address, user agent, session ID
:::

## Confidence Scoring

Each match includes a confidence score from 0.0 to 1.0:

- **0.9-1.0**: High confidence. Pattern matches exactly (e.g., valid Luhn check on credit card).
- **0.7-0.9**: Medium confidence. Pattern matches but no checksum validation available.
- **0.5-0.7**: Low confidence. Partial pattern match; may be a false positive.
- **Below 0.5**: Not reported.

## DataFrame Output Format

The `scan_dataframe()` method returns a dictionary with:

```python
{
    "summary": "PII Scan Results:\n  - 3 column(s) contain PII\n  ...",
    "columns": {
        "email": {
            "has_pii": True,
            "types": ["email_address"],
            "risk": "medium",
            "confidence": 0.95,
            "sample_matches": 2,
        },
        # ...
    },
    "recommended_level": 7,
    "total_pii_columns": 3,
}
```
