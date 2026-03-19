# Zipndel: Encrypt & Compress DataFrames

Zipndel is Zipminator's original DataFrame encryption utility. It compresses a pandas DataFrame into a password-protected AES-encrypted ZIP file, with optional PII scanning, anonymization, and self-destruct timers.

## Quick Start

```python
from zipminator.crypto.zipit import Zipndel

# Create an encrypted archive from a DataFrame
znd = Zipndel(
    file_name="customer_data",
    file_format="csv",
    password="strong-passphrase",
)
znd.zipit(df)  # Creates customer_data.zip (AES-encrypted)
```

## Reading Encrypted Files

```python
from zipminator.crypto.unzipit import Unzipndel

uznd = Unzipndel(file_name="customer_data", file_format="csv")
df = uznd.unzipit()  # Prompts for password, returns DataFrame
```

## PII Auto-Scan

When the PII scanner is installed, Zipndel automatically scans the DataFrame before encryption and warns about detected sensitive data:

```python
znd = Zipndel(
    file_name="patient_records",
    compliance_check=True,  # Enable PII scanning
)
znd.zipit(df)
# Warning: PII detected in columns: ['ssn', 'email']
# Recommended anonymization level: 7/10
```

## Anonymization Before Encryption

Combine anonymization with encryption for defense-in-depth:

```python
znd = Zipndel(
    file_name="salary_report",
    anonymize_columns=["name", "ssn"],  # Anonymize before archiving
    mask_columns=["email"],              # SHA-256 hash masking
)
znd.zipit(df)
```

## Self-Destruct Timer

Set a countdown timer that automatically destroys the archive after a specified duration:

```python
znd = Zipndel(
    file_name="temp_export",
    self_destruct_enabled=True,
    self_destruct_time=(24, 0, 0),  # 24 hours
)
znd.zipit(df)
# Archive will self-destruct after 24 hours
```

The destruction uses DoD 5220.22-M 3-pass overwrite. See {doc}`self_destruct` for details.

## PQC Key Encapsulation Mode

When the Kyber768 engine is available, Zipndel can use PQC key encapsulation instead of password-based encryption:

```python
from zipminator.crypto.pqc import PQC

pqc = PQC(level=768)
pk, sk = pqc.generate_keypair()

znd = Zipndel(file_name="classified", pqc_public_key=pk)
znd.zipit(df)  # Encrypted with Kyber768 + AES-256
```

## Audit Trail

Enable `audit_trail=True` to log all operations:

```python
znd = Zipndel(
    file_name="audit_export",
    audit_trail=True,
)
znd.zipit(df)
# Logs: timestamp, file hash, columns processed, encryption method
```

## Constructor Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `file_name` | `str` | `"df"` | Base name for the output file |
| `file_format` | `str` | `"csv"` | DataFrame serialization format |
| `password` | `str` | `None` | Archive password (prompted if not set) |
| `encryption_algorithm` | `str` | `"AES"` | ZIP encryption algorithm |
| `mask_columns` | `list` | `None` | Columns to SHA-256 hash |
| `anonymize_columns` | `list` | `None` | Columns to anonymize with random data |
| `self_destruct_enabled` | `bool` | `False` | Enable auto-destruct timer |
| `self_destruct_time` | `tuple` | `(672, 0, 0)` | Timer as (hours, minutes, seconds) |
| `compliance_check` | `bool` | `False` | Run PII scan before encryption |
| `audit_trail` | `bool` | `False` | Log all operations |
