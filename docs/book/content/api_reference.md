# API Reference

This page provides auto-generated API documentation for Zipminator's Python classes.

## Core Cryptography

### PQC Wrapper

```{eval-rst}
.. autoclass:: zipminator.crypto.pqc.PQC
    :members:
    :undoc-members:
    :show-inheritance:
```

### Quantum Random

```{eval-rst}
.. autoclass:: zipminator.crypto.quantum_random.QuantumRandom
    :members:
    :undoc-members:
    :show-inheritance:
```

```{eval-rst}
.. autoclass:: zipminator.crypto.quantum_random.QuantumEntropyPool
    :members:
    :undoc-members:
    :show-inheritance:
```

---

## Anonymization

### AnonymizationEngine (10-Level System)

```{eval-rst}
.. autoclass:: zipminator.crypto.anonymization.AnonymizationEngine
    :members: apply_anonymization
    :undoc-members:
    :show-inheritance:
```

### AdvancedAnonymizer (Legacy NAV System)

```{eval-rst}
.. autoclass:: zipminator.anonymizer.AdvancedAnonymizer
    :members: process
    :undoc-members:
    :show-inheritance:
```

---

## PII Scanning

### PIIScanner

```{eval-rst}
.. autoclass:: zipminator.crypto.pii_scanner.PIIScanner
    :members:
    :undoc-members:
    :show-inheritance:
```

```{eval-rst}
.. autoclass:: zipminator.crypto.pii_scanner.PIIMatch
    :members:
    :undoc-members:
```

```{eval-rst}
.. autoclass:: zipminator.crypto.pii_scanner.PIIType
    :members:
    :undoc-members:
```

```{eval-rst}
.. autoclass:: zipminator.crypto.pii_scanner.RiskLevel
    :members:
    :undoc-members:
```

---

## Data Protection

### Zipndel (Encrypt & Compress DataFrames)

```{eval-rst}
.. autoclass:: zipminator.crypto.zipit.Zipndel
    :members:
    :undoc-members:
    :show-inheritance:
```

### Unzipndel (Decrypt & Decompress)

```{eval-rst}
.. autoclass:: zipminator.crypto.unzipit.Unzipndel
    :members:
    :undoc-members:
    :show-inheritance:
```

### SelfDestruct (Secure Deletion)

```{eval-rst}
.. autoclass:: zipminator.crypto.self_destruct.SelfDestruct
    :members:
    :undoc-members:
    :show-inheritance:
```

```{eval-rst}
.. autoclass:: zipminator.crypto.self_destruct.SelfDestructScheduler
    :members:
    :undoc-members:
    :show-inheritance:
```

---

## Subscription & Access Control

### SubscriptionManager

```{eval-rst}
.. autoclass:: zipminator.crypto.subscription.SubscriptionManager
    :members:
    :undoc-members:
    :show-inheritance:
```

### APIKeyValidator

```{eval-rst}
.. autoclass:: zipminator.crypto.subscription.APIKeyValidator
    :members:
    :undoc-members:
    :show-inheritance:
```

### Data Classes

```{eval-rst}
.. autoclass:: zipminator.crypto.subscription.SubscriptionFeatures
    :members:
    :undoc-members:
```

```{eval-rst}
.. autoclass:: zipminator.crypto.subscription.ActivationCodeInfo
    :members:
    :undoc-members:
```

### Enumerations

```{eval-rst}
.. autoclass:: zipminator.crypto.subscription.SubscriptionTier
    :members:
    :undoc-members:
```

```{eval-rst}
.. autoclass:: zipminator.crypto.subscription.AnonymizationLevel
    :members:
    :undoc-members:
```
