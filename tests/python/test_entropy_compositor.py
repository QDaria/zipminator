"""Tests for heterogeneous entropy compositor."""
import os

import pytest

from zipminator.entropy.compositor import (
    CompositionResult,
    EntropyCompositor,
    EntropySource,
    SourceStatus,
)


class FakeSource:
    """Deterministic source for testing -- satisfies EntropySource protocol."""

    def __init__(self, name: str, data: bytes, min_entropy: float = 8.0):
        self._name = name
        self._data = data
        self._pos = 0
        self._min_entropy = min_entropy

    @property
    def name(self) -> str:
        return self._name

    def read(self, n: int) -> bytes:
        chunk = self._data[self._pos : self._pos + n]
        self._pos += n
        if len(chunk) < n:
            chunk += b"\x00" * (n - len(chunk))
        return chunk

    @property
    def estimated_min_entropy(self) -> float:
        return self._min_entropy

    @property
    def status(self) -> SourceStatus:
        if self._pos > len(self._data):
            return SourceStatus.DEGRADED
        return SourceStatus.HEALTHY


class FailedSource:
    """Source that always reports FAILED status."""

    @property
    def name(self) -> str:
        return "failed"

    def read(self, n: int) -> bytes:
        return b"\x00" * n

    @property
    def estimated_min_entropy(self) -> float:
        return 0.0

    @property
    def status(self) -> SourceStatus:
        return SourceStatus.FAILED


class TestEntropyCompositor:
    def test_single_source(self):
        """With one source, output equals source data."""
        data = os.urandom(64)
        src = FakeSource("test", data)
        comp = EntropyCompositor([src])
        result = comp.compose(32)
        assert len(result.data) == 32
        assert result.sources_used == ["test"]
        # Single source: output should equal that source's bytes
        assert result.data == data[:32]

    def test_xor_composition(self):
        """Two sources XOR'd should differ from either individual source."""
        data_a = os.urandom(64)
        data_b = os.urandom(64)
        src_a = FakeSource("alpha", data_a)
        src_b = FakeSource("beta", data_b)
        comp = EntropyCompositor([src_a, src_b])
        result = comp.compose(32)
        assert result.data != data_a[:32]
        assert result.data != data_b[:32]
        assert len(result.sources_used) == 2
        # Verify the XOR is correct
        expected = bytes(a ^ b for a, b in zip(data_a[:32], data_b[:32]))
        assert result.data == expected

    def test_failed_source_excluded(self):
        """Source with status FAILED should be skipped."""
        data = os.urandom(64)
        src_good = FakeSource("good", data)
        src_bad = FailedSource()
        comp = EntropyCompositor([src_good, src_bad], min_sources=1)
        result = comp.compose(32)
        assert "good" in result.sources_used
        assert "failed" not in result.sources_used
        # Output equals the single healthy source
        assert result.data == data[:32]

    def test_degraded_source_included(self):
        """DEGRADED sources should still be included (only FAILED excluded)."""
        data_a = os.urandom(64)
        data_b = os.urandom(64)
        src_a = FakeSource("primary", data_a)
        src_b = FakeSource("degraded", data_b)
        # Read past data to trigger DEGRADED status
        src_b._pos = len(data_b) + 1
        assert src_b.status == SourceStatus.DEGRADED
        # Reset pos for actual read
        src_b._pos = 0
        src_b._data = data_b
        # Change status check: DEGRADED should still be used
        comp = EntropyCompositor([src_a, src_b])
        result = comp.compose(16)
        assert "degraded" in result.sources_used

    def test_provenance_metadata(self):
        """Result should include provenance for each source."""
        src = FakeSource("quantum", os.urandom(64), min_entropy=7.5)
        comp = EntropyCompositor([src])
        result = comp.compose(16)
        assert result.provenance is not None
        assert len(result.provenance) == 1
        assert result.provenance[0]["source"] == "quantum"
        assert result.provenance[0]["min_entropy"] >= 7.0
        assert "timestamp" in result.provenance[0]
        assert "status" in result.provenance[0]
        assert result.provenance[0]["bytes_contributed"] == 16

    def test_min_entropy_of_composition(self):
        """Composed min-entropy >= max of individual sources."""
        src_a = FakeSource("high", os.urandom(64), min_entropy=7.8)
        src_b = FakeSource("low", os.urandom(64), min_entropy=3.2)
        comp = EntropyCompositor([src_a, src_b])
        result = comp.compose(32)
        assert result.estimated_min_entropy >= 7.8

    def test_sha256_in_result(self):
        """Result should contain a valid SHA-256 hex digest."""
        src = FakeSource("test", os.urandom(64))
        comp = EntropyCompositor([src])
        result = comp.compose(16)
        assert len(result.sha256) == 64  # hex digest length
        import hashlib
        assert result.sha256 == hashlib.sha256(result.data).hexdigest()

    def test_insufficient_sources_raises(self):
        """If all sources are FAILED and min_sources > 0, should raise."""
        src_bad = FailedSource()
        comp = EntropyCompositor([src_bad], min_sources=1)
        with pytest.raises(RuntimeError, match="healthy sources"):
            comp.compose(32)

    def test_empty_sources_raises(self):
        """No sources at all should raise."""
        comp = EntropyCompositor([], min_sources=1)
        with pytest.raises(RuntimeError, match="healthy sources"):
            comp.compose(32)

    def test_three_source_xor(self):
        """Three sources should all be XOR'd together."""
        data_a = os.urandom(32)
        data_b = os.urandom(32)
        data_c = os.urandom(32)
        comp = EntropyCompositor([
            FakeSource("a", data_a),
            FakeSource("b", data_b),
            FakeSource("c", data_c),
        ])
        result = comp.compose(16)
        expected = bytes(a ^ b ^ c for a, b, c in zip(data_a[:16], data_b[:16], data_c[:16]))
        assert result.data == expected
        assert len(result.sources_used) == 3


class TestFactoryIntegration:
    """Compositor integrates with existing factory."""

    def test_get_compositor_returns_compositor(self):
        from zipminator.entropy.factory import get_compositor

        comp = get_compositor()
        assert comp is not None
        result = comp.compose(32)
        assert len(result.data) == 32
        assert len(result.sources_used) >= 1

    def test_get_compositor_backward_compat(self):
        """get_provider() should still work after adding get_compositor()."""
        from zipminator.entropy.factory import get_provider

        provider = get_provider()
        assert provider is not None
        bits = provider.get_entropy(64)
        assert len(bits) == 64
        assert all(c in "01" for c in bits)
