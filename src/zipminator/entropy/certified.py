"""Certified Heterogeneous Entropy (CHE) provider.

Orchestrates: health check -> compositor -> provenance certificate.
This is the main entry point for consuming certified entropy.

Usage:
    provider = CertifiedEntropyProvider()
    result = provider.get_certified_entropy(256)  # 256 bits
    assert result.certificate.verify()  # cryptographic proof of provenance

The returned CertifiedEntropyResult contains:
- data: the composed entropy bytes
- certificate: a Merkle-tree provenance certificate
- min_entropy_bits: conservative min-entropy estimate
- sources: names of all sources that contributed
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import List, Optional

from .compositor import EntropyCompositor
from .factory import get_compositor
from .provenance import ProvenanceCertificate, build_certificate

logger = logging.getLogger(__name__)


@dataclass
class CertifiedEntropyResult:
    """Result of a certified entropy request.

    Attributes:
        data: The composed entropy bytes.
        certificate: Merkle-tree provenance certificate proving lineage.
        min_entropy_bits: Estimated total min-entropy in bits.
        sources: Names of entropy sources that contributed.
    """

    data: bytes
    certificate: ProvenanceCertificate
    min_entropy_bits: float
    sources: List[str]


class CertifiedEntropyProvider:
    """Top-level API for certified heterogeneous entropy.

    Wraps the compositor and provenance certificate builder into
    a single call that returns entropy with cryptographic proof
    of its multi-source provenance.

    Args:
        pool_path: Override path to the entropy pool binary file.
        min_sources: Minimum number of healthy sources required
            for composition. Defaults to 1 (at least OS fallback).
    """

    def __init__(
        self,
        pool_path: Optional[str] = None,
        min_sources: int = 1,
    ) -> None:
        self._compositor: EntropyCompositor = get_compositor(
            pool_path=pool_path,
            min_sources=min_sources,
        )

    def get_certified_entropy(self, num_bits: int) -> CertifiedEntropyResult:
        """Compose entropy from all available sources and certify it.

        Steps:
            1. Compose num_bits of entropy via XOR fusion (compositor).
            2. Build a Merkle-tree provenance certificate.
            3. Compute conservative min-entropy bound.

        Args:
            num_bits: Number of bits of entropy requested.
                Must be a positive multiple of 8.

        Returns:
            CertifiedEntropyResult with data, certificate, and metadata.

        Raises:
            ValueError: If num_bits is not a positive multiple of 8.
            RuntimeError: If insufficient healthy entropy sources.
        """
        if num_bits <= 0 or num_bits % 8 != 0:
            raise ValueError(
                f"num_bits must be a positive multiple of 8, got {num_bits}"
            )

        num_bytes = num_bits // 8

        # Step 1: compose entropy from all healthy sources
        composition = self._compositor.compose(num_bytes)

        # Step 2: build provenance certificate
        certificate = build_certificate(composition)

        # Step 3: compute total min-entropy in bits
        # min-entropy per byte * number of bytes = total bits
        min_entropy_bits = composition.estimated_min_entropy * num_bytes

        logger.info(
            "Certified entropy: %d bits from %d sources, "
            "min-entropy=%.1f bits, merkle_root=%s",
            num_bits,
            len(composition.sources_used),
            min_entropy_bits,
            certificate.merkle_root[:16] + "...",
        )

        return CertifiedEntropyResult(
            data=composition.data,
            certificate=certificate,
            min_entropy_bits=min_entropy_bits,
            sources=composition.sources_used,
        )
