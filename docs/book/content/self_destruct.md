# Secure Self-Destruct

Zipminator provides DoD 5220.22-M compliant secure data destruction for files, directories, and in-memory data. The `SelfDestruct` class ensures that deleted data cannot be recovered through forensic analysis.

## How It Works

The destruction process performs a 3-pass overwrite before deletion:

| Pass | Data Written | Purpose |
|-----:|-------------|---------|
| 1 | All zeros (`0x00`) | Clear original bit patterns |
| 2 | All ones (`0xFF`) | Flip all bits to prevent remnant detection |
| 3 | QRNG random bytes | Eliminate statistical traces |

After overwriting, the file is deleted from the filesystem and optionally verified as unrecoverable.

## Basic Usage

```python
from zipminator.crypto.self_destruct import SelfDestruct

sd = SelfDestruct(log_operations=True)

# Securely delete a single file (3-pass overwrite)
sd.secure_delete_file("sensitive_report.csv", overwrite_passes=3, verify=True)

# Securely delete an entire directory
sd.secure_delete_directory("classified_docs/", overwrite_passes=3)
```

## Timed Auto-Destruct

The `SelfDestructScheduler` enables timer-based automatic destruction, useful for ephemeral keys and temporary data exports.

```python
from zipminator.crypto.self_destruct import SelfDestruct

sd = SelfDestruct()

# Schedule destruction after 24 hours
sd.schedule_destruction(
    path="temp_export.csv",
    delay_hours=24,
    overwrite_passes=3,
)
```

## CLI Usage

```bash
# Destroy a file with verification
zipminator self-destruct --verify sensitive_data.csv

# Destroy all files in a directory
zipminator self-destruct --recursive classified_docs/

# Custom number of passes
zipminator self-destruct --passes 7 top_secret.bin
```

```{warning}
Self-destruct is **irreversible**. No data recovery is possible after destruction. Always verify you have backups before using this feature.
```

## Audit Trail

When `log_operations=True`, every destruction event is logged with timestamp, file path, passes completed, and verification status. These logs integrate with the compliance audit trail for GDPR Article 17 (Right to Erasure) and CCPA deletion requests.

```python
sd = SelfDestruct(log_operations=True)
sd.secure_delete_file("customer_pii.csv")

# Review the operations log
for entry in sd.operations_log:
    print(entry)
```

## Integration with Zipndel

The {doc}`zipndel` module uses `SelfDestruct` internally for its auto-destruct timer feature, combining encrypted storage with time-limited access.

## Compliance Alignment

| Regulation | Requirement | Zipminator Feature |
|-----------|------------|-------------------|
| GDPR Art. 17 | Right to erasure | `secure_delete_file()` with audit |
| CCPA | Right to delete | Verified destruction with certificate |
| HIPAA | PHI disposal | 3-pass overwrite exceeds requirement |
| DoD 5220.22-M | Classified data sanitization | Native 3-pass implementation |
