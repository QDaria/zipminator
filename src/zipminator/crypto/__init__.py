"""Cryptographic operations: PQC, PII scanning, anonymization, self-destruct."""

from .quantum_random import QuantumRandom
from .pqc import PQC


def __getattr__(name):
    """Lazy import for pandas-dependent modules."""
    if name == "Zipndel":
        from .zipit import Zipndel
        return Zipndel
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


__all__ = ["Zipndel", "PQC", "QuantumRandom"]
