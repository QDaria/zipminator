"""Zipminator -- Post-Quantum Cryptography with Quantum Entropy.

A Python SDK for quantum-safe encryption using CRYSTALS-Kyber-768 (ML-KEM)
with multi-provider quantum entropy from Rigetti Computing and IBM Quantum.

Example:
    >>> from zipminator import Zipndel
    >>> zipper = Zipndel(file_name="data.csv")
    >>> zipper.zipit(df)
"""

__version__ = "0.5.0b1"

# Lightweight imports (no heavy deps like pandas)
from zipminator.crypto.quantum_random import QuantumRandom
from zipminator.crypto.pqc import PQC

# Try importing Rust bindings
try:
    from zipminator._core import keypair, encapsulate, decapsulate
    RUST_AVAILABLE = True
except ImportError:
    RUST_AVAILABLE = False


def __getattr__(name):
    """Lazy import for optional-dep modules."""
    if name == "Zipndel":
        from zipminator.crypto.zipit import Zipndel
        return Zipndel
    if name == "AdvancedAnonymizer":
        from zipminator.crypto.anonymization import AnonymizationEngine
        return AnonymizationEngine
    if name == "SubscriptionManager":
        from zipminator.crypto.subscription import SubscriptionManager
        return SubscriptionManager
    if name == "PIIScanner":
        from zipminator.crypto.pii_scanner import PIIScanner
        return PIIScanner
    raise AttributeError(f"module 'zipminator' has no attribute {name!r}")


__all__ = [
    "Zipndel",
    "PQC",
    "QuantumRandom",
    "AdvancedAnonymizer",
    "SubscriptionManager",
    "PIIScanner",
    "keypair",
    "encapsulate",
    "decapsulate",
    "RUST_AVAILABLE",
    "__version__",
]
