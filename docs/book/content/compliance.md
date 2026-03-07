# Compliance

Zipminator provides tools and features aligned with major data protection regulations. This section documents how the platform supports compliance efforts.

## FIPS 203 Algorithm Compliance

Zipminator implements the NIST FIPS 203 specification (ML-KEM-768 / Kyber768). The Rust crypto engine has been verified against official NIST Known Answer Test (KAT) vectors at `crates/zipminator-nist/`.

```{admonition} Important Distinction
:class: warning

**FIPS 203** is an algorithm specification. Claiming "implements FIPS 203" is a factual statement about which algorithm is used.

**FIPS 140-3** is a module validation program administered by CMVP (Cryptographic Module Validation Program). Achieving FIPS 140-3 validation requires laboratory testing, costs $80,000-$150,000+, and takes 6-18 months.

Zipminator does **not** hold a FIPS 140-3 certificate. Do not represent it as "FIPS certified" or "FIPS compliant" in procurement or regulatory contexts.
```

### Certification Roadmap

For organizations requiring FIPS 140-3 validation:

| Path | Cost | Timeline | Notes |
|------|------|----------|-------|
| wolfCrypt FIPS OE addition | $5,000-$25,000 | ~90 days | Cheapest path; add Zipminator as an Operating Environment |
| AWS-LC FIPS 3.0 integration | $0 (open source) | Variable | First open-source lib with ML-KEM in FIPS 140-3 validation |
| Full CMVP submission | $80,000-$150,000+ | 6-18 months | Independent module validation |

---

## GDPR (General Data Protection Regulation)

### Supported Articles

| GDPR Article | Zipminator Feature |
|-------------|-------------------|
| Art. 5(1)(c) - Data minimization | L5 generalization, L6 suppression |
| Art. 5(1)(e) - Storage limitation | Self-destruct with retention policies |
| Art. 17 - Right to erasure | Self-destruct (DoD 5220.22-M) |
| Art. 25 - Data protection by design | PII scanning, automatic anonymization |
| Art. 32 - Security of processing | Kyber768 encryption, QRNG |
| Art. 35 - DPIA support | HNDL risk calculator, PII scan reports |
| Art. 89 - Research exemption | L8 differential privacy, L9 k-anonymity |

### GDPR Workflow Example

```python
from zipminator.anonymizer import AdvancedAnonymizer
from zipminator.scanner import QuantumReadinessScanner

# Step 1: Scan for PII
scanner = QuantumReadinessScanner(sensitivity="high")
findings = scanner.scan(customer_data)

# Step 2: Anonymize for analytics (Art. 89 research exemption)
anonymizer = AdvancedAnonymizer(subscription_tier="enterprise")
anonymized = anonymizer.anonymize(customer_data, level=8, epsilon=0.5)

# Step 3: Encrypted storage (Art. 32)
# Use Kyber768 encryption for data at rest
```

---

## HIPAA (Health Insurance Portability and Accountability Act)

### Safe Harbor De-identification

HIPAA Safe Harbor (45 CFR 164.514(b)) requires removal of 18 identifier types. Zipminator's PII scanner detects all 18 categories:

1. Names
2. Geographic data (smaller than state)
3. Dates (except year)
4. Phone numbers
5. Fax numbers
6. Email addresses
7. Social Security numbers
8. Medical record numbers
9. Health plan beneficiary numbers
10. Account numbers
11. Certificate/license numbers
12. Vehicle identifiers
13. Device identifiers
14. Web URLs
15. IP addresses
16. Biometric identifiers
17. Full-face photographs
18. Any other unique identifying number

### HIPAA Workflow

```python
# Scan for all 18 HIPAA identifier types
scanner = QuantumReadinessScanner(sensitivity="high")
findings = scanner.scan(patient_records)

# Apply L6 suppression to remove identifier columns entirely
anonymizer = AdvancedAnonymizer(subscription_tier="pro")
safe_harbor = anonymizer.anonymize(patient_records, level=6)

# Or apply L9 k-anonymity for research datasets
research_set = anonymizer.anonymize(patient_records, level=9, k=5)
```

---

## CCPA (California Consumer Privacy Act)

### Supported Rights

| CCPA Right | Zipminator Feature |
|-----------|-------------------|
| Right to know | PII scan report with field-level inventory |
| Right to delete | Self-destruct with verification |
| Right to opt-out of sale | L4+ pseudonymization before data sharing |
| Right to non-discrimination | Anonymized datasets preserve analytical utility |

---

## Audit Trail

For Pro and Enterprise tiers, Zipminator maintains a cryptographically signed audit trail of all operations:

```python
# Audit trail entries include:
{
    "timestamp": "2026-03-07T14:32:01Z",
    "operation": "anonymize",
    "level": 8,
    "input_hash": "sha3_256:a1b2c3...",
    "output_hash": "sha3_256:d4e5f6...",
    "user": "analyst@corp.com",
    "parameters": {"epsilon": 1.0, "columns": ["name", "email", "ssn"]},
    "signature": "kyber768:..."
}
```

### Audit Properties

- **Immutable**: Each entry is signed with the organization's Kyber768 key
- **Tamper-evident**: Entries are hash-chained; modifying any entry invalidates the chain
- **Retention**: Pro tier retains 90 days; Enterprise tier retains indefinitely
- **Export**: Audit logs can be exported as JSON or CSV for compliance reporting

---

## Data Retention Policies

Enterprise tier supports configurable data retention with automatic self-destruct:

```python
# Configure retention policy
policy = {
    "default_retention_days": 365,
    "pii_retention_days": 90,
    "destruction_method": "dod_5220_22m",
    "destruction_passes": 3,
    "notify_before_days": 7,
    "audit_trail": True,
}
```

When a retention period expires, Zipminator automatically:
1. Sends notification to the data owner
2. Waits for the configured grace period
3. Executes secure destruction (DoD 5220.22-M)
4. Logs the destruction event in the audit trail
5. Generates a certificate of destruction
