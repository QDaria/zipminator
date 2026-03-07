# API Reference

## AdvancedAnonymizer

```python
from zipminator.anonymizer import AdvancedAnonymizer
```

The primary interface for the 10-level anonymization system.

### Constructor

```python
AdvancedAnonymizer(
    subscription_tier: str = "free",
    entropy_pool_path: str | None = None,
)
```

**Parameters**:
- `subscription_tier`: One of `"free"`, `"developer"`, `"pro"`, `"enterprise"`. Controls which anonymization levels are available.
- `entropy_pool_path`: Path to the QRNG entropy pool file. Defaults to `quantum_entropy/quantum_entropy_pool.bin`.

### Methods

#### `anonymize`

```python
def anonymize(
    self,
    data: pd.DataFrame,
    level: int,
    columns: list[str] | None = None,
    epsilon: float = 1.0,
    k: int = 5,
    return_mapping: bool = False,
) -> pd.DataFrame | tuple[pd.DataFrame, bytes]:
```

Apply anonymization at the specified level.

**Parameters**:
- `data`: Input DataFrame to anonymize.
- `level`: Anonymization level (1-10).
- `columns`: Specific columns to anonymize. If `None`, auto-detects PII columns.
- `epsilon`: Privacy budget for L8 differential privacy. Lower = more private.
- `k`: Minimum group size for L9 k-anonymity.
- `return_mapping`: If `True` and level is 4 or 10, returns the encrypted mapping table alongside the result.

**Returns**: Anonymized DataFrame, or a tuple of (DataFrame, encrypted_mapping_bytes) when `return_mapping=True`.

**Raises**: `SubscriptionError` if the requested level exceeds the current tier.

#### `detect_pii_columns`

```python
def detect_pii_columns(self, data: pd.DataFrame) -> list[str]:
```

Identify columns likely to contain PII based on column names and content sampling.

#### `get_allowed_levels`

```python
def get_allowed_levels(self) -> list[int]:
```

Return the list of anonymization levels permitted by the current subscription tier.

---

## SubscriptionManager

```python
from zipminator.crypto.subscription import SubscriptionManager
```

Manages subscription tiers and feature gating.

### Constructor

```python
SubscriptionManager(tier: str = "free")
```

### Methods

#### `get_allowed_levels`

```python
def get_allowed_levels(self) -> list[int]:
```

Return anonymization levels available for the current tier.

#### `check_access`

```python
def check_access(self, feature: str) -> bool:
```

Check whether a specific feature is available under the current tier.

**Parameters**:
- `feature`: Feature identifier string (e.g., `"anonymize_l8"`, `"self_destruct"`, `"audit_trail"`).

#### `upgrade`

```python
def upgrade(self, new_tier: str) -> None:
```

Upgrade to a new subscription tier.

---

## QuantumRandom

```python
from zipminator.crypto.quantum_random import QuantumRandom
```

Interface to the quantum random number generator backed by the 156-qubit IBM quantum entropy pool.

### Constructor

```python
QuantumRandom(pool_path: str | None = None)
```

**Parameters**:
- `pool_path`: Path to the entropy pool binary file. Defaults to `quantum_entropy/quantum_entropy_pool.bin`.

### Methods

#### `random_bytes`

```python
def random_bytes(self, n: int) -> bytes:
```

Return `n` random bytes from the quantum entropy pool.

#### `random_int`

```python
def random_int(self, low: int, high: int) -> int:
```

Return a random integer in `[low, high)`.

#### `random_float`

```python
def random_float(self) -> float:
```

Return a random float in `[0.0, 1.0)`.

#### `pool_health`

```python
def pool_health(self) -> dict:
```

Return entropy pool statistics: size in bytes, estimated entropy bits, last harvest timestamp, and source chain.

#### `gaussian`

```python
def gaussian(self, mu: float = 0.0, sigma: float = 1.0) -> float:
```

Return a Gaussian-distributed random value using the Box-Muller transform with quantum entropy.

---

## QuantumReadinessScanner

```python
from zipminator.scanner import QuantumReadinessScanner
```

Scans data for PII and assesses quantum readiness (HNDL risk exposure).

### Constructor

```python
QuantumReadinessScanner(
    sensitivity: str = "medium",
    custom_patterns: dict[str, str] | None = None,
)
```

**Parameters**:
- `sensitivity`: Detection sensitivity: `"low"`, `"medium"`, or `"high"`.
- `custom_patterns`: Dictionary of `{pii_type: regex_pattern}` for custom PII detection.

### Methods

#### `scan`

```python
def scan(self, data: dict | pd.DataFrame) -> list[PiiFinding]:
```

Scan input data for PII. Returns a list of `PiiFinding` objects.

#### `scan_file`

```python
def scan_file(self, path: str) -> list[PiiFinding]:
```

Scan a file (CSV, JSON, or text) for PII.

#### `report`

```python
def report(self, findings: list[PiiFinding]) -> str:
```

Generate a human-readable report from scan findings.

### PiiFinding

```python
@dataclass
class PiiFinding:
    field: str           # Column or field name
    pii_type: str        # Type of PII detected (email, ssn, phone, etc.)
    confidence: float    # Detection confidence (0.0 to 1.0)
    sample: str          # Masked sample of the detected value
    row_index: int | None  # Row index if applicable
```

---

## HNDLCalculator

```python
from zipminator.hndl_risk import HNDLCalculator
```

Calculates Harvest Now, Decrypt Later (HNDL) risk scores for data assets.

### Constructor

```python
HNDLCalculator()
```

### Methods

#### `calculate_risk`

```python
def calculate_risk(
    self,
    data_sensitivity: str,
    retention_years: int,
    encryption_type: str,
    has_pqc: bool = False,
) -> dict:
```

Calculate HNDL risk score.

**Parameters**:
- `data_sensitivity`: One of `"low"`, `"medium"`, `"high"`, `"critical"`.
- `retention_years`: How long the data must remain confidential.
- `encryption_type`: Current encryption algorithm (e.g., `"RSA-2048"`, `"AES-256"`, `"Kyber768"`).
- `has_pqc`: Whether PQC protection is already applied.

**Returns**: Dictionary with `risk_score` (0-100), `risk_level` (low/medium/high/critical), `recommendation` (string), and `years_until_vulnerable` (estimated).

#### `batch_assess`

```python
def batch_assess(self, assets: list[dict]) -> pd.DataFrame:
```

Assess HNDL risk for multiple data assets. Returns a DataFrame with risk scores and recommendations.
