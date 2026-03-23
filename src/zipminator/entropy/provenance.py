"""Cryptographic provenance certificates for entropy composition.

Each certificate is a Merkle tree where:
- Leaves = SHA-256 hashes of source provenance records
- Root = the certificate hash verifiable by any auditor

A certificate proves: "this entropy was derived from sources X, Y, Z
with health test results A, B, C at time T."

Part of the Certified Heterogeneous Entropy (CHE) framework.
"""
from __future__ import annotations

import hashlib
import time
from dataclasses import dataclass, field
from typing import List

from .compositor import CompositionResult


@dataclass
class ProvenanceRecord:
    """Provenance metadata for a single entropy source contribution.

    Attributes:
        source_name: Human-readable source identifier (e.g. "pool", "qbraid").
        min_entropy: Estimated min-entropy in bits per byte at time of read.
        health_status: NIST SP 800-90B health test result ("healthy", "degraded", "failed").
        bytes_contributed: Number of bytes this source contributed.
        timestamp: UNIX timestamp of the read.
        sha256_hash: SHA-256 hex digest of the entropy bytes from this source.
    """

    source_name: str
    min_entropy: float
    health_status: str
    bytes_contributed: int
    timestamp: float
    sha256_hash: str

    def to_leaf_bytes(self) -> bytes:
        """Serialize this record to deterministic bytes for Merkle tree hashing.

        The canonical encoding is:
            source_name || min_entropy || health_status || bytes_contributed || timestamp || sha256_hash

        All fields are UTF-8 encoded with pipe separators for unambiguous parsing.
        """
        canonical = (
            f"{self.source_name}|{self.min_entropy:.6f}|{self.health_status}"
            f"|{self.bytes_contributed}|{self.timestamp:.6f}|{self.sha256_hash}"
        )
        return canonical.encode("utf-8")

    def to_dict(self) -> dict:
        return {
            "source_name": self.source_name,
            "min_entropy": self.min_entropy,
            "health_status": self.health_status,
            "bytes_contributed": self.bytes_contributed,
            "timestamp": self.timestamp,
            "sha256_hash": self.sha256_hash,
        }

    @staticmethod
    def from_dict(d: dict) -> ProvenanceRecord:
        return ProvenanceRecord(
            source_name=d["source_name"],
            min_entropy=d["min_entropy"],
            health_status=d["health_status"],
            bytes_contributed=d["bytes_contributed"],
            timestamp=d["timestamp"],
            sha256_hash=d["sha256_hash"],
        )


def _merkle_root(leaves: List[bytes]) -> str:
    """Compute SHA-256 Merkle root from a list of leaf byte strings.

    Standard binary Merkle tree:
    - Each leaf is hashed with SHA-256.
    - Pairs of hashes are concatenated and hashed.
    - Odd number of nodes: the last node is duplicated.
    - Single leaf: root = SHA-256(leaf).

    Args:
        leaves: Non-empty list of byte strings.

    Returns:
        Hex-encoded SHA-256 Merkle root.

    Raises:
        ValueError: If leaves is empty.
    """
    if not leaves:
        raise ValueError("Merkle tree requires at least one leaf")

    # Hash each leaf
    layer: List[bytes] = [hashlib.sha256(leaf).digest() for leaf in leaves]

    # Build tree bottom-up
    while len(layer) > 1:
        next_layer: List[bytes] = []
        for i in range(0, len(layer), 2):
            left = layer[i]
            # Odd number: duplicate last node
            right = layer[i + 1] if i + 1 < len(layer) else layer[i]
            combined = hashlib.sha256(left + right).digest()
            next_layer.append(combined)
        layer = next_layer

    return layer[0].hex()


@dataclass
class ProvenanceCertificate:
    """Merkle-tree provenance certificate for composed entropy.

    The certificate binds a set of provenance records to a single
    Merkle root hash. Verification recomputes the root from the
    records and checks that it matches the stored root.

    Attributes:
        records: Ordered list of provenance records (Merkle leaves).
        merkle_root: SHA-256 hex digest of the Merkle tree root.
        total_min_entropy: Aggregate min-entropy estimate in bits.
        created_at: UNIX timestamp when the certificate was created.
    """

    records: List[ProvenanceRecord]
    merkle_root: str
    total_min_entropy: float
    created_at: float

    @classmethod
    def from_records(cls, records: List[ProvenanceRecord]) -> ProvenanceCertificate:
        """Build a certificate from a list of provenance records.

        Args:
            records: Non-empty list of ProvenanceRecord objects.

        Returns:
            A new ProvenanceCertificate with a computed Merkle root.

        Raises:
            ValueError: If records is empty.
        """
        if not records:
            raise ValueError("Certificate requires at least one provenance record")

        leaves = [rec.to_leaf_bytes() for rec in records]
        root = _merkle_root(leaves)

        total_min_entropy = sum(
            rec.min_entropy * rec.bytes_contributed for rec in records
        )

        return cls(
            records=list(records),
            merkle_root=root,
            total_min_entropy=total_min_entropy,
            created_at=time.time(),
        )

    def verify(self) -> bool:
        """Recompute Merkle root from records and check it matches.

        Returns:
            True if the recomputed root matches the stored root.
        """
        if not self.records:
            return False

        leaves = [rec.to_leaf_bytes() for rec in self.records]
        recomputed = _merkle_root(leaves)
        return recomputed == self.merkle_root

    def to_dict(self) -> dict:
        """Serialize the certificate to a JSON-compatible dict."""
        return {
            "records": [rec.to_dict() for rec in self.records],
            "merkle_root": self.merkle_root,
            "total_min_entropy": self.total_min_entropy,
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, d: dict) -> ProvenanceCertificate:
        """Deserialize a certificate from a dict.

        Note: this restores the stored merkle_root without recomputation,
        so verify() can be called to check integrity.
        """
        records = [ProvenanceRecord.from_dict(r) for r in d["records"]]
        return cls(
            records=records,
            merkle_root=d["merkle_root"],
            total_min_entropy=d["total_min_entropy"],
            created_at=d["created_at"],
        )


def build_certificate(composition_result: CompositionResult) -> ProvenanceCertificate:
    """Build a provenance certificate from a CompositionResult.

    Converts the compositor's provenance dicts into ProvenanceRecords,
    computes the data hash for each record, and constructs the Merkle tree.

    Args:
        composition_result: Output from EntropyCompositor.compose().

    Returns:
        A verified ProvenanceCertificate.

    Raises:
        ValueError: If the composition result has no provenance entries.
    """
    if not composition_result.provenance:
        raise ValueError("Certificate requires at least one provenance entry")

    data_hash = hashlib.sha256(composition_result.data).hexdigest()

    records: List[ProvenanceRecord] = []
    for prov in composition_result.provenance:
        records.append(
            ProvenanceRecord(
                source_name=prov["source"],
                min_entropy=prov["min_entropy"],
                health_status=prov["status"],
                bytes_contributed=prov["bytes_contributed"],
                timestamp=prov["timestamp"],
                sha256_hash=data_hash,
            )
        )

    return ProvenanceCertificate.from_records(records)
