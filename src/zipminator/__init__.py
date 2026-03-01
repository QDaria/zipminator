"""Zipminator -- Post-Quantum Cryptography with Quantum Entropy.

A Python SDK for quantum-safe encryption using CRYSTALS-Kyber-768 (ML-KEM)
with multi-provider quantum entropy from Rigetti Computing and IBM Quantum.

Example:
    >>> from zipminator import Zipndel
    >>> zipper = Zipndel(file_name="data.csv")
    >>> zipper.zipit(df)
"""

__version__ = "1.0.0"

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
    """Lazy import for pandas-dependent modules."""
    if name == "Zipndel":
        from zipminator.crypto.zipit import Zipndel
        return Zipndel
    raise AttributeError(f"module 'zipminator' has no attribute {name!r}")


__all__ = [
    "Zipndel",
    "PQC",
    "QuantumRandom",
    "keypair",
    "encapsulate",
    "decapsulate",
    "RUST_AVAILABLE",
    "__version__",
]
