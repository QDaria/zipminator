# Use Case: Healthcare

Healthcare data is among the most sensitive and heavily regulated. Patient records contain diagnoses, genomic data, prescription histories, and insurance details that must remain confidential for decades. Zipminator protects this data against both current and future quantum threats.

## The Challenge

Healthcare organizations face a unique combination of requirements:

- **HIPAA** (US): Protected Health Information (PHI) must be encrypted or de-identified
- **GDPR Article 9**: Health data is a "special category" with stricter processing rules
- **Long retention**: Medical records may be kept for 30+ years (longer than classical encryption lifetimes)
- **Research sharing**: De-identified datasets must support statistical analysis without re-identification risk

A quantum computer capable of breaking RSA-2048 would expose every patient record encrypted with classical methods, violating both regulations and patient trust.

## Zipminator Solution

### Patient Record Encryption

Encrypt patient records with quantum-resistant keys:

```python
from zipminator import keypair, encapsulate, decapsulate
import json

# Hospital generates a keypair for its records vault
pk, sk = keypair()

# Encrypt a patient record
patient_record = json.dumps({
    "patient_id": "P-12345",
    "diagnosis": "Type 2 Diabetes",
    "medication": "Metformin 500mg",
}).encode()

# Encapsulate to get a symmetric key
ct, shared_secret = encapsulate(pk)

# Use shared_secret as AES-256-GCM key to encrypt the record
# (AES encryption is left to the application layer)
```

### Research Data Anonymization

When sharing patient data with researchers, apply appropriate anonymization:

```python
from zipminator.crypto.anonymization import AnonymizationEngine
import pandas as pd

engine = AnonymizationEngine()
patient_df = pd.read_csv("patient_cohort.csv")

# k-Anonymity: ensure each combination of quasi-identifiers
# appears at least k=5 times (prevents singling out patients)
anonymized = engine.apply_anonymization(
    patient_df,
    columns=["age", "zip_code", "diagnosis"],
    level=8  # k-Anonymity
)

# Differential privacy for aggregate statistics
# (formal guarantee that individual patients cannot be identified)
dp_stats = engine.apply_anonymization(
    patient_df,
    columns=["blood_pressure", "bmi", "cholesterol"],
    level=9  # Differential privacy (Laplace noise, epsilon=1.0)
)
```

### PII Detection in Clinical Notes

Free-text clinical notes often contain embedded PII. Scan before sharing:

```python
from zipminator.crypto.pii_scanner import PIIScanner

scanner = PIIScanner()
notes = pd.DataFrame({
    "note": [
        "Patient Ola Nordmann (FNR 12345678901) presented with chest pain",
        "Referred to Dr. Smith at 555-0123, email dr.smith@hospital.no",
    ]
})

results = scanner.scan_dataframe(notes)
# Detects: Norwegian FNR, phone number, email address
```

## HIPAA De-Identification

HIPAA provides two methods for de-identification:

### Safe Harbor Method (18 identifiers removed)

Zipminator's anonymization levels cover all 18 HIPAA Safe Harbor identifiers:

| HIPAA Identifier | Zipminator Approach |
|-----------------|-------------------|
| Names | L1 (hash), L2 (random), L7 (synthetic) |
| Dates (except year) | L4 (generalize to year) |
| Phone numbers | L2 (random replacement) |
| Geographic data | L4 (generalize to state/region) |
| SSN | L1 (hash) or L5 (suppress) |
| Medical record numbers | L3 (tokenize) |
| Email addresses | L2 (random) or L7 (synthetic) |
| Account numbers | L1 (hash) or L5 (suppress) |
| Biometric identifiers | L5 (suppress) |

### Expert Determination Method

For the expert determination method, use L9 (differential privacy) to provide a formal mathematical guarantee that individual patients cannot be re-identified:

```python
# Epsilon=1.0 provides strong privacy (standard recommendation)
dp_data = engine.apply_anonymization(df, columns=["age", "weight"], level=9)
```

## Genomic Data Protection

Genomic data is uniquely re-identifiable and has an indefinite lifespan. Even partial genomic sequences can identify individuals. Zipminator's L10 (Paillier homomorphic encryption) allows computation on encrypted genomic data without exposing the underlying sequence:

```python
# Encrypt allele frequencies for GWAS study
encrypted_df = engine.apply_anonymization(
    genomic_df,
    columns=["allele_frequency"],
    level=10  # Paillier homomorphic encryption
)
# Researchers can compute sums and averages on encrypted values
```

## Deployment Considerations

- **Air-gapped environments**: Zipminator works fully offline. Set `ZIPMINATOR_OFFLINE=1` and use activation codes instead of API keys.
- **HSM integration**: Enterprise tier supports hardware security module key storage for HIPAA compliance.
- **Audit logging**: The self-destruct module provides DoD 5220.22-M 3-pass overwrite with tamper-evident audit trails.

Contact [mo@qdaria.com](mailto:mo@qdaria.com) for healthcare compliance packages.
