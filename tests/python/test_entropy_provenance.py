"""Tests for Merkle-tree provenance certificates.

Verifies that entropy composition provenance records can be
cryptographically certified via a SHA-256 Merkle tree, enabling
any auditor to verify the lineage of composed entropy.
"""
import hashlib
import time

import pytest

from zipminator.entropy.provenance import (
    ProvenanceRecord,
    ProvenanceCertificate,
    build_certificate,
    _merkle_root,
)
from zipminator.entropy.compositor import CompositionResult


class TestMerkleRoot:
    """Low-level Merkle tree construction."""

    def test_single_leaf(self):
        """Single leaf: root = hash(leaf)."""
        leaf = b"hello"
        root = _merkle_root([leaf])
        expected = hashlib.sha256(leaf).hexdigest()
        assert root == expected

    def test_two_leaves(self):
        """Two leaves: root = hash(hash(a) || hash(b))."""
        a, b = b"alpha", b"beta"
        ha = hashlib.sha256(a).digest()
        hb = hashlib.sha256(b).digest()
        expected = hashlib.sha256(ha + hb).hexdigest()
        assert _merkle_root([a, b]) == expected

    def test_three_leaves_duplicates_last(self):
        """Odd number of leaves: last leaf is duplicated."""
        a, b, c = b"one", b"two", b"three"
        ha = hashlib.sha256(a).digest()
        hb = hashlib.sha256(b).digest()
        hc = hashlib.sha256(c).digest()
        # Pair: (a,b), (c,c)
        hab = hashlib.sha256(ha + hb).digest()
        hcc = hashlib.sha256(hc + hc).digest()
        expected = hashlib.sha256(hab + hcc).hexdigest()
        assert _merkle_root([a, b, c]) == expected

    def test_merkle_root_deterministic(self):
        """Same inputs always produce the same root."""
        leaves = [b"x", b"y", b"z", b"w"]
        root1 = _merkle_root(leaves)
        root2 = _merkle_root(leaves)
        assert root1 == root2

    def test_empty_leaves_raises(self):
        """Empty leaf list should raise ValueError."""
        with pytest.raises(ValueError, match="at least one leaf"):
            _merkle_root([])


class TestProvenanceRecord:
    """ProvenanceRecord dataclass."""

    def test_record_creation(self):
        rec = ProvenanceRecord(
            source_name="pool",
            min_entropy=7.5,
            health_status="healthy",
            bytes_contributed=32,
            timestamp=time.time(),
            sha256_hash=hashlib.sha256(b"test").hexdigest(),
        )
        assert rec.source_name == "pool"
        assert rec.min_entropy == 7.5
        assert rec.bytes_contributed == 32

    def test_record_to_leaf_bytes(self):
        """Record should produce deterministic leaf bytes for Merkle tree."""
        rec = ProvenanceRecord(
            source_name="qrng",
            min_entropy=7.9,
            health_status="healthy",
            bytes_contributed=64,
            timestamp=1000.0,
            sha256_hash="abc123",
        )
        leaf = rec.to_leaf_bytes()
        assert isinstance(leaf, bytes)
        assert len(leaf) > 0
        # Deterministic
        assert rec.to_leaf_bytes() == leaf


class TestProvenanceCertificate:
    """Certificate creation, verification, and serialization."""

    def _make_records(self, n: int) -> list:
        """Create n test records."""
        records = []
        for i in range(n):
            data = f"source_{i}".encode()
            records.append(
                ProvenanceRecord(
                    source_name=f"source_{i}",
                    min_entropy=7.0 + i * 0.1,
                    health_status="healthy",
                    bytes_contributed=32,
                    timestamp=1000.0 + i,
                    sha256_hash=hashlib.sha256(data).hexdigest(),
                )
            )
        return records

    def test_single_source_certificate(self):
        """1 source: certificate should be valid."""
        records = self._make_records(1)
        cert = ProvenanceCertificate.from_records(records)
        assert cert.verify()
        assert len(cert.records) == 1
        assert cert.merkle_root != ""

    def test_multi_source_certificate(self):
        """3 sources: certificate should be valid."""
        records = self._make_records(3)
        cert = ProvenanceCertificate.from_records(records)
        assert cert.verify()
        assert len(cert.records) == 3
        assert cert.total_min_entropy > 0

    def test_tamper_detection(self):
        """Modifying a record after creation should fail verification."""
        records = self._make_records(3)
        cert = ProvenanceCertificate.from_records(records)
        assert cert.verify()

        # Tamper: change a record's min_entropy
        cert.records[1] = ProvenanceRecord(
            source_name=cert.records[1].source_name,
            min_entropy=0.0,  # tampered
            health_status=cert.records[1].health_status,
            bytes_contributed=cert.records[1].bytes_contributed,
            timestamp=cert.records[1].timestamp,
            sha256_hash=cert.records[1].sha256_hash,
        )
        assert not cert.verify()

    def test_serialization_roundtrip(self):
        """to_dict + from_dict should preserve the certificate."""
        records = self._make_records(4)
        cert = ProvenanceCertificate.from_records(records)
        d = cert.to_dict()

        restored = ProvenanceCertificate.from_dict(d)
        assert restored.merkle_root == cert.merkle_root
        assert restored.total_min_entropy == cert.total_min_entropy
        assert restored.created_at == cert.created_at
        assert len(restored.records) == len(cert.records)
        assert restored.verify()

    def test_empty_provenance_error(self):
        """No sources should raise ValueError."""
        with pytest.raises(ValueError, match="at least one"):
            ProvenanceCertificate.from_records([])

    def test_merkle_root_deterministic(self):
        """Same records produce same root."""
        records = self._make_records(2)
        cert1 = ProvenanceCertificate.from_records(records)
        cert2 = ProvenanceCertificate.from_records(records)
        assert cert1.merkle_root == cert2.merkle_root

    def test_total_min_entropy(self):
        """Total min-entropy = max of individual sources * total bytes."""
        records = self._make_records(3)
        cert = ProvenanceCertificate.from_records(records)
        # total_min_entropy is sum of (min_entropy * bytes) for each source
        expected = sum(r.min_entropy * r.bytes_contributed for r in records)
        assert abs(cert.total_min_entropy - expected) < 0.001


class TestBuildCertificate:
    """build_certificate() from CompositionResult."""

    def test_build_from_composition_result(self):
        """Certificate built from a CompositionResult verifies."""
        result = CompositionResult(
            data=b"\x42" * 32,
            sources_used=["pool", "qbraid"],
            estimated_min_entropy=7.8,
            provenance=[
                {
                    "source": "pool",
                    "min_entropy": 7.5,
                    "status": "healthy",
                    "bytes_contributed": 32,
                    "timestamp": 1000.0,
                },
                {
                    "source": "qbraid",
                    "min_entropy": 7.8,
                    "status": "healthy",
                    "bytes_contributed": 32,
                    "timestamp": 1001.0,
                },
            ],
        )
        cert = build_certificate(result)
        assert cert.verify()
        assert len(cert.records) == 2
        assert cert.records[0].source_name == "pool"
        assert cert.records[1].source_name == "qbraid"

    def test_build_includes_data_hash(self):
        """Each record's sha256_hash should be derived from the data."""
        data = b"\xDE\xAD" * 16
        result = CompositionResult(
            data=data,
            sources_used=["os"],
            estimated_min_entropy=8.0,
            provenance=[
                {
                    "source": "os",
                    "min_entropy": 8.0,
                    "status": "healthy",
                    "bytes_contributed": 32,
                    "timestamp": 2000.0,
                },
            ],
        )
        cert = build_certificate(result)
        # The sha256_hash on each record should match the composed data hash
        assert cert.records[0].sha256_hash == hashlib.sha256(data).hexdigest()

    def test_build_empty_provenance_raises(self):
        """CompositionResult with empty provenance should raise."""
        result = CompositionResult(
            data=b"\x00" * 32,
            sources_used=[],
            estimated_min_entropy=0.0,
            provenance=[],
        )
        with pytest.raises(ValueError, match="at least one"):
            build_certificate(result)
