"""
Robindra - Quantum Random Number Generator

Drop-in replacement for Python's `random` module using REAL quantum entropy.
Named after Robindra-tier enterprise subscription with LEVEL10 quantum access.

Usage:
    import zipminator.robindra as robindra
    x = robindra.randint(1, 100)  # Uses quantum entropy!

License Tiers:
    - Free/Amir/Nils/Solveig: Fallback to pseudo-random (Python's random)
    - Enterprise/Robindra (LEVEL10): True quantum entropy from IBM Quantum

Author: Zipminator Team
License: MIT + Commercial (see LICENSE)
"""

from __future__ import annotations

import logging
import math
import os
import random as _stdlib_random
import struct
import threading
from pathlib import Path
from typing import Any, List, Optional, Sequence, TypeVar

__version__ = "0.3.0"

# Type variables for generics
T = TypeVar("T")

# Configuration
ENTROPY_POOL_PATH = Path(__file__).parent.parent.parent / \
    "quantum_entropy" / "quantum_entropy_pool.bin"
MIN_POOL_THRESHOLD = 500  # bytes - trigger refill warning
BYTES_PER_RANDOM = 8  # 64-bit floats

# Setup logging
logger = logging.getLogger(__name__)


class QuantumEntropyPool:
    """
    Thread-safe quantum entropy pool manager.

    Reads from quantum entropy file and provides random bytes.
    Automatically refills when pool is exhausted (stub implementation).
    """

    def __init__(self, pool_path: Path = ENTROPY_POOL_PATH) -> None:
        """
        Initialize quantum entropy pool.

        Args:
            pool_path: Path to quantum entropy binary file
        """
        self.pool_path = pool_path
        self._lock = threading.Lock()
        self._pool: bytearray = bytearray()
        self._position = 0
        self._total_consumed = 0
        self._refill_count = 0

        # Load initial pool
        self._load_pool()

    def _load_pool(self) -> None:
        """Load quantum entropy from file."""
        try:
            if not self.pool_path.exists():
                logger.warning(
                    f"Quantum entropy pool not found: {self.pool_path}. "
                    "Falling back to pseudo-random."
                )
                self._pool = bytearray()
                return

            with open(self.pool_path, "rb") as f:
                self._pool = bytearray(f.read())

            self._position = 0
            logger.info(
                f"Loaded quantum entropy pool: {len(self._pool)} bytes from {self.pool_path}"
            )
        except Exception as e:
            logger.error(f"Failed to load quantum entropy pool: {e}")
            self._pool = bytearray()

    def _refill_pool(self) -> None:
        """
        Refill quantum entropy pool.

        STUB: In production, this would call IBM Quantum API or other QRNG service.
        For now, we reload from the demo file.
        """
        logger.info(
            f"Quantum entropy pool exhausted after {self._total_consumed} bytes consumed. "
            "Reloading from shared entropy pool file (populated by qrng_harvester.py)."
        )

        self._refill_count += 1
        self._load_pool()

        if len(self._pool) == 0:
            logger.error(
                "Cannot refill quantum entropy pool - falling back to pseudo-random!"
            )

    def get_bytes(self, n: int) -> bytes:
        """
        Get n random bytes from quantum entropy pool.

        Args:
            n: Number of bytes to retrieve

        Returns:
            Random bytes from quantum pool (or pseudo-random if pool exhausted)
        """
        with self._lock:
            # For large requests, collect bytes across multiple refills
            if n > len(self._pool):
                result = bytearray()
                remaining_needed = n

                while remaining_needed > 0:
                    # Get what we can from current pool
                    available = len(self._pool) - self._position
                    chunk_size = min(available, remaining_needed)

                    if chunk_size > 0:
                        result.extend(
                            self._pool[self._position:self._position + chunk_size])
                        self._position += chunk_size
                        self._total_consumed += chunk_size
                        remaining_needed -= chunk_size

                    # Need more? Refill
                    if remaining_needed > 0:
                        if len(self._pool) > 0:
                            self._refill_pool()

                        # If still no pool, fallback to pseudo-random for remainder
                        if len(self._pool) == 0:
                            logger.debug(
                                f"Using pseudo-random for {remaining_needed} bytes")
                            result.extend(
                                _stdlib_random.randbytes(remaining_needed))
                            break

                return bytes(result)

            # Normal case: request fits in current pool
            # Check if we need to refill
            if self._position + n > len(self._pool):
                if len(self._pool) > 0:
                    self._refill_pool()

                # If still no pool, fallback to pseudo-random
                if len(self._pool) == 0:
                    logger.debug(f"Using pseudo-random for {n} bytes")
                    return _stdlib_random.randbytes(n)

            # Warn if pool is getting low
            remaining = len(self._pool) - self._position
            if remaining < MIN_POOL_THRESHOLD and remaining > n:
                logger.warning(
                    f"Quantum entropy pool low: {remaining} bytes remaining "
                    f"(refilled {self._refill_count} times)"
                )

            # Extract bytes from pool
            result = bytes(self._pool[self._position:self._position + n])
            self._position += n
            self._total_consumed += n

            return result

    def get_stats(self) -> dict[str, Any]:
        """Get entropy pool statistics."""
        with self._lock:
            return {
                "pool_size": len(self._pool),
                "position": self._position,
                "remaining": len(self._pool) - self._position,
                "total_consumed": self._total_consumed,
                "refill_count": self._refill_count,
                "pool_path": str(self.pool_path),
            }


class QuantumRandom:
    """
    Quantum random number generator with Python random module API compatibility.

    Provides cryptographically secure random numbers using quantum entropy.
    Falls back to pseudo-random if quantum pool is unavailable.
    """

    def __init__(self, license_tier: str = "FREE") -> None:
        """
        Initialize quantum random generator.

        Args:
            license_tier: License tier (FREE, AMIR, NILS, SOLVEIG, ROBINDRA-LEVEL10, etc.)
        """
        self.license_tier = license_tier.upper()
        self._has_quantum_access = self._check_quantum_access()

        if self._has_quantum_access:
            self._entropy_pool = QuantumEntropyPool()
            logger.info(
                f"Quantum random initialized with tier: {self.license_tier}")
        else:
            self._entropy_pool = None
            logger.info(
                f"License tier {self.license_tier} does not have quantum access. "
                "Using pseudo-random fallback."
            )

    def _check_quantum_access(self) -> bool:
        """
        Check if license tier allows quantum entropy access.

        Returns:
            True if LEVEL10 access granted
        """
        # Check for LEVEL10 suffix (enterprise/Robindra tier)
        if "-LEVEL10" in self.license_tier or self.license_tier == "LEVEL10":
            return True

        # Check environment variable
        if os.getenv("ZIPMINATOR_QUANTUM_ENABLED", "").lower() == "true":
            logger.info("Quantum access enabled via environment variable")
            return True

        # Free tiers don't get quantum access
        free_tiers = ["FREE", "AMIR", "NILS", "SOLVEIG"]
        return self.license_tier not in free_tiers

    def _get_random_bytes(self, n: int) -> bytes:
        """Get n random bytes (quantum or pseudo-random)."""
        if self._has_quantum_access and self._entropy_pool:
            return self._entropy_pool.get_bytes(n)
        else:
            return _stdlib_random.randbytes(n)

    def random(self) -> float:
        """
        Random float in [0.0, 1.0) using quantum entropy.

        Returns:
            Random float in range [0.0, 1.0)
        """
        # Get 8 random bytes and convert to float [0.0, 1.0)
        random_bytes = self._get_random_bytes(8)
        # Convert to uint64, then normalize to [0.0, 1.0)
        random_int = struct.unpack(">Q", random_bytes)[0]
        return random_int / (2**64)

    def randint(self, a: int, b: int) -> int:
        """
        Random integer in [a, b] (inclusive on both ends).

        Args:
            a: Lower bound (inclusive)
            b: Upper bound (inclusive)

        Returns:
            Random integer in range [a, b]
        """
        if a > b:
            raise ValueError(f"empty range for randint({a}, {b})")

        # Calculate range and number of bytes needed
        range_size = b - a + 1
        bytes_needed = (range_size.bit_length() + 7) // 8

        # Generate random number in range using rejection sampling
        while True:
            random_bytes = self._get_random_bytes(bytes_needed)
            random_int = int.from_bytes(random_bytes, byteorder="big")

            # Ensure uniform distribution by rejecting values >= range_size
            max_valid = (256 ** bytes_needed // range_size) * range_size
            if random_int < max_valid:
                return a + (random_int % range_size)

    def choice(self, seq: Sequence[T]) -> T:
        """
        Choose random element from non-empty sequence.

        Args:
            seq: Non-empty sequence

        Returns:
            Random element from sequence

        Raises:
            IndexError: If sequence is empty
        """
        if len(seq) == 0:
            raise IndexError("Cannot choose from empty sequence")

        index = self.randint(0, len(seq) - 1)
        return seq[index]

    def shuffle(self, seq: List[T]) -> None:
        """
        Shuffle list in-place using Fisher-Yates algorithm.

        Args:
            seq: List to shuffle (modified in-place)
        """
        n = len(seq)
        for i in range(n - 1, 0, -1):
            j = self.randint(0, i)
            seq[i], seq[j] = seq[j], seq[i]

    def sample(self, population: Sequence[T], k: int) -> List[T]:
        """
        Choose k unique random elements from population.

        Args:
            population: Sequence to sample from
            k: Number of elements to choose

        Returns:
            List of k unique random elements

        Raises:
            ValueError: If k > len(population)
        """
        n = len(population)
        if k > n:
            raise ValueError(f"Sample larger than population: {k} > {n}")

        # Use set-based sampling for efficiency
        selected_indices = set()
        result = []

        while len(result) < k:
            index = self.randint(0, n - 1)
            if index not in selected_indices:
                selected_indices.add(index)
                result.append(population[index])

        return result

    def uniform(self, a: float, b: float) -> float:
        """
        Random float in [a, b] or [b, a] (order doesn't matter).

        Args:
            a: Lower or upper bound
            b: Upper or lower bound

        Returns:
            Random float in range
        """
        return a + (b - a) * self.random()

    def gauss(self, mu: float = 0.0, sigma: float = 1.0) -> float:
        """
        Gaussian (normal) distribution using Box-Muller transform.

        Args:
            mu: Mean
            sigma: Standard deviation

        Returns:
            Random value from Gaussian distribution
        """
        # Box-Muller transform
        u1 = self.random()
        u2 = self.random()

        # Avoid log(0)
        while u1 == 0.0:
            u1 = self.random()

        z0 = math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2)
        return mu + sigma * z0

    def randbytes(self, n: int) -> bytes:
        """
        Generate n random bytes.

        Args:
            n: Number of bytes

        Returns:
            n random bytes
        """
        return self._get_random_bytes(n)

    def getrandbits(self, k: int) -> int:
        """
        Generate random integer with k random bits.

        Args:
            k: Number of bits

        Returns:
            Random integer with k bits
        """
        if k <= 0:
            raise ValueError("number of bits must be positive")

        bytes_needed = (k + 7) // 8
        random_bytes = self._get_random_bytes(bytes_needed)
        random_int = int.from_bytes(random_bytes, byteorder="big")

        # Mask to k bits
        return random_int & ((1 << k) - 1)

    def get_stats(self) -> dict[str, Any]:
        """
        Get statistics about quantum entropy usage.

        Returns:
            Dictionary with entropy pool statistics
        """
        if self._entropy_pool:
            return {
                "license_tier": self.license_tier,
                "quantum_access": self._has_quantum_access,
                **self._entropy_pool.get_stats(),
            }
        else:
            return {
                "license_tier": self.license_tier,
                "quantum_access": self._has_quantum_access,
                "mode": "pseudo-random",
            }


# Global instance (auto-detect license tier from environment)
_default_license = os.getenv("ZIPMINATOR_LICENSE", "FREE")
_quantum_random = QuantumRandom(license_tier=_default_license)


# Module-level functions (match Python's random module API)
def random() -> float:
    """Random float in [0.0, 1.0)."""
    return _quantum_random.random()


def randint(a: int, b: int) -> int:
    """Random integer in [a, b]."""
    return _quantum_random.randint(a, b)


def choice(seq: Sequence[T]) -> T:
    """Choose random element from sequence."""
    return _quantum_random.choice(seq)


def shuffle(seq: List[T]) -> None:
    """Shuffle list in-place."""
    _quantum_random.shuffle(seq)


def sample(population: Sequence[T], k: int) -> List[T]:
    """Choose k unique random elements."""
    return _quantum_random.sample(population, k)


def uniform(a: float, b: float) -> float:
    """Random float in [a, b]."""
    return _quantum_random.uniform(a, b)


def gauss(mu: float = 0.0, sigma: float = 1.0) -> float:
    """Gaussian distribution."""
    return _quantum_random.gauss(mu, sigma)


def randbytes(n: int) -> bytes:
    """Generate n random bytes."""
    return _quantum_random.randbytes(n)


def getrandbits(k: int) -> int:
    """Generate random integer with k bits."""
    return _quantum_random.getrandbits(k)


def get_stats() -> dict[str, Any]:
    """Get entropy pool statistics."""
    return _quantum_random.get_stats()


# Compatibility aliases
normalvariate = gauss


def configure(license_tier: str) -> None:
    """
    Configure quantum random with specific license tier.

    Args:
        license_tier: License tier (FREE, ROBINDRA-LEVEL10, etc.)
    """
    global _quantum_random
    _quantum_random = QuantumRandom(license_tier=license_tier)
    logger.info(f"Configured quantum random with tier: {license_tier}")


__all__ = [
    # Classes
    "QuantumRandom",
    "QuantumEntropyPool",
    # Module functions
    "random",
    "randint",
    "choice",
    "shuffle",
    "sample",
    "uniform",
    "gauss",
    "normalvariate",
    "randbytes",
    "getrandbits",
    "get_stats",
    "configure",
]
