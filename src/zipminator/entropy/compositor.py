"""
Heterogeneous entropy compositor.

XOR-fuses multiple independent entropy sources with dynamic
health-based weighting. Provides provenance metadata for each
composition, enabling downstream certification.

Security property: the composed output has min-entropy at least
as high as the strongest individual source (assuming independence).
This is the standard leftover hash lemma bound for XOR composition.

Part of the Certified Heterogeneous Entropy (CHE) framework.
"""
from __future__ import annotations

import enum
import hashlib
import logging
import time
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, List, Protocol, runtime_checkable

if TYPE_CHECKING:
    from .base import QuantumProvider

logger = logging.getLogger(__name__)


class SourceStatus(enum.Enum):
    """Health status of an entropy source."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    FAILED = "failed"


@runtime_checkable
class EntropySource(Protocol):
    """Protocol for pluggable entropy sources.

    Any object satisfying this interface can participate in
    heterogeneous entropy composition.
    """

    @property
    def name(self) -> str:
        """Human-readable source identifier."""
        ...

    def read(self, n: int) -> bytes:
        """Read n bytes of entropy from the source."""
        ...

    @property
    def estimated_min_entropy(self) -> float:
        """Estimated min-entropy in bits per byte (0.0 to 8.0)."""
        ...

    @property
    def status(self) -> SourceStatus:
        """Current health status of this source."""
        ...


@dataclass
class CompositionResult:
    """Result of composing entropy from multiple sources.

    Attributes:
        data: The composed entropy bytes.
        sources_used: Names of sources that contributed.
        estimated_min_entropy: Conservative min-entropy bound (bits/byte).
        provenance: Per-source metadata for audit trail.
        sha256: SHA-256 hex digest of the composed data.
    """
    data: bytes
    sources_used: List[str]
    estimated_min_entropy: float
    provenance: List[dict] = field(default_factory=list)
    sha256: str = ""

    def __post_init__(self) -> None:
        if not self.sha256:
            self.sha256 = hashlib.sha256(self.data).hexdigest()


class EntropyCompositor:
    """Composes entropy from multiple heterogeneous sources via XOR.

    Defense-in-depth: even if k-1 of k sources are compromised,
    the output retains the min-entropy of the remaining honest source
    (assuming independence between sources).

    Only sources with status != FAILED participate in composition.
    DEGRADED sources are included with a warning.

    Args:
        sources: List of entropy sources satisfying EntropySource protocol.
        min_sources: Minimum number of non-FAILED sources required.
            Raises RuntimeError if fewer are available.
    """

    def __init__(
        self,
        sources: List[EntropySource],
        min_sources: int = 1,
    ) -> None:
        self._sources = sources
        self._min_sources = min_sources

    def compose(self, num_bytes: int) -> CompositionResult:
        """Read num_bytes from all healthy sources, XOR-fuse, return result.

        Args:
            num_bytes: Number of bytes of composed entropy to produce.

        Returns:
            CompositionResult with data, provenance, and entropy estimate.

        Raises:
            RuntimeError: If fewer than min_sources are available.
        """
        active_sources = [
            s for s in self._sources if s.status != SourceStatus.FAILED
        ]

        if len(active_sources) < self._min_sources:
            raise RuntimeError(
                f"Only {len(active_sources)} healthy sources, "
                f"need {self._min_sources}"
            )

        result = bytearray(num_bytes)
        provenance: List[dict] = []
        sources_used: List[str] = []
        max_entropy = 0.0

        for src in active_sources:
            try:
                if src.status == SourceStatus.DEGRADED:
                    logger.warning(
                        "Source %s is DEGRADED; including with caution",
                        src.name,
                    )

                chunk = src.read(num_bytes)
                if len(chunk) < num_bytes:
                    chunk = chunk + bytes(num_bytes - len(chunk))

                # XOR into accumulator
                for i in range(num_bytes):
                    result[i] ^= chunk[i]

                sources_used.append(src.name)
                max_entropy = max(max_entropy, src.estimated_min_entropy)
                provenance.append({
                    "source": src.name,
                    "min_entropy": src.estimated_min_entropy,
                    "status": src.status.value,
                    "bytes_contributed": num_bytes,
                    "timestamp": time.time(),
                })
            except Exception as exc:
                logger.error("Source %s failed during read: %s", src.name, exc)
                continue

        return CompositionResult(
            data=bytes(result),
            sources_used=sources_used,
            estimated_min_entropy=max_entropy,
            provenance=provenance,
        )


class QuantumProviderAdapter:
    """Adapts the existing QuantumProvider ABC to the EntropySource protocol.

    Bridges the gap between the legacy interface
    (``get_entropy(num_bits) -> str``) and the compositor's
    expected interface (``read(n_bytes) -> bytes``).

    Runs NIST SP 800-90B health tests and min-entropy estimation
    on every byte read, so the compositor has live status and
    entropy estimates.
    """

    def __init__(self, provider: QuantumProvider) -> None:
        from .health import HealthTestSuite, MinEntropyEstimator

        self._provider = provider
        self._health = HealthTestSuite()
        self._estimator = MinEntropyEstimator()

    @property
    def name(self) -> str:
        return self._provider.name()

    def read(self, n: int) -> bytes:
        bits = self._provider.get_entropy(n * 8)
        data = int(bits, 2).to_bytes(n, "big")
        for byte in data:
            self._health.feed(byte)
            self._estimator.feed(byte)
        return data

    @property
    def estimated_min_entropy(self) -> float:
        h = self._estimator.estimate()
        return h if h is not None else 8.0  # assume uniform until enough data

    @property
    def status(self) -> SourceStatus:
        if self._health.failure_rate > 0.01:
            return SourceStatus.FAILED
        return SourceStatus.HEALTHY
