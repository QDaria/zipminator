# CLI Reference

The Zipminator CLI provides command-line access to all core features. After installation, it is available as `zipminator` or `python -m zipminator`.

## Global Options

```
zipminator [OPTIONS] COMMAND [ARGS]
```

| Option | Description |
|--------|-------------|
| `--tier TIER` | Set subscription tier (`free`, `developer`, `pro`, `enterprise`) |
| `--entropy-pool PATH` | Path to quantum entropy pool file |
| `--verbose / -v` | Enable verbose output |
| `--version` | Show version and exit |
| `--help` | Show help and exit |

---

## keygen

Generate a Kyber768 keypair.

```bash
zipminator keygen [OPTIONS]
```

| Option | Description |
|--------|-------------|
| `--output-dir DIR` | Directory to write key files (default: current directory) |
| `--prefix PREFIX` | Filename prefix for key files (default: `zipminator`) |
| `--format FORMAT` | Output format: `pem`, `der`, `raw` (default: `raw`) |

**Example**:

```bash
zipminator keygen --output-dir keys/ --prefix alice
# Creates: keys/alice.pub (1184 bytes), keys/alice.key (2400 bytes)
```

---

## encrypt

Encrypt a file using Kyber768 key encapsulation + AES-256-GCM.

```bash
zipminator encrypt [OPTIONS] INPUT_FILE
```

| Option | Description |
|--------|-------------|
| `--pubkey PATH` | Path to recipient's public key |
| `--output PATH` | Output file path (default: `INPUT_FILE.enc`) |
| `--scan / --no-scan` | Run PII scan before encryption (default: `--scan`) |
| `--anonymize LEVEL` | Anonymize before encrypting (level 1-10) |

**Example**:

```bash
zipminator encrypt --pubkey alice.pub --anonymize 4 sensitive_data.csv
# Output: sensitive_data.csv.enc
```

---

## decrypt

Decrypt a file using the recipient's secret key.

```bash
zipminator decrypt [OPTIONS] INPUT_FILE
```

| Option | Description |
|--------|-------------|
| `--seckey PATH` | Path to recipient's secret key |
| `--output PATH` | Output file path (default: strips `.enc` suffix) |

**Example**:

```bash
zipminator decrypt --seckey alice.key sensitive_data.csv.enc
# Output: sensitive_data.csv
```

---

## scan

Scan a file or directory for PII.

```bash
zipminator scan [OPTIONS] TARGET
```

| Option | Description |
|--------|-------------|
| `--sensitivity LEVEL` | Detection sensitivity: `low`, `medium`, `high` (default: `medium`) |
| `--format FORMAT` | Output format: `text`, `json`, `csv` (default: `text`) |
| `--output PATH` | Write report to file instead of stdout |
| `--recursive / -r` | Scan directories recursively |

**Example**:

```bash
zipminator scan --sensitivity high --format json data/
# Outputs JSON report of all PII findings
```

**Sample output**:

```
PII Scan Report
===============
File: patient_records.csv
  Row 3, Column "email": EMAIL (confidence: 98%)
  Row 3, Column "ssn": SSN (confidence: 99%)
  Row 7, Column "phone": PHONE (confidence: 95%)

Summary: 3 findings in 1 file
  HIGH risk: 1 (SSN)
  MEDIUM risk: 2 (EMAIL, PHONE)
```

---

## self-destruct

Securely destroy a file using DoD 5220.22-M 3-pass overwrite.

```bash
zipminator self-destruct [OPTIONS] TARGET
```

| Option | Description |
|--------|-------------|
| `--passes INT` | Number of overwrite passes (default: 3) |
| `--verify / --no-verify` | Verify destruction after overwrite (default: `--verify`) |
| `--recursive / -r` | Destroy all files in a directory |
| `--confirm / --no-confirm` | Skip confirmation prompt (default: requires confirmation) |

**Example**:

```bash
zipminator self-destruct --recursive classified_docs/
# Prompts for confirmation, then securely destroys all files
```

**Overwrite sequence**:
1. Pass 1: Write all zeros (`0x00`)
2. Pass 2: Write all ones (`0xFF`)
3. Pass 3: Write QRNG random data
4. Verify: Read back and confirm no original data remains
5. Delete: Remove the file from the filesystem

```{warning}
Self-destruct is irreversible. There is no recovery after destruction. Always verify you have backups of data you need to retain before using this command.
```
