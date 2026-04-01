"""Tests for CSI entropy pool provider — separate from quantum pool."""
import os
import struct
import tempfile

import pytest


class TestCsiPoolProvider:
    """CsiPoolProvider reads from csi_entropy_pool.bin, separate from quantum pool."""

    def test_import(self):
        from zipminator.entropy.csi_pool_provider import CsiPoolProvider
        assert CsiPoolProvider is not None

    def test_name(self):
        from zipminator.entropy.csi_pool_provider import CsiPoolProvider
        provider = CsiPoolProvider(pool_path="/nonexistent")
        assert provider.name() == "CsiPoolProvider"

    def test_reads_from_csi_pool_file(self):
        """Should read entropy from a separate CSI pool binary."""
        from zipminator.entropy.csi_pool_provider import CsiPoolProvider

        with tempfile.TemporaryDirectory() as tmpdir:
            pool_path = os.path.join(tmpdir, "csi_entropy_pool.bin")
            # Write known data
            data = os.urandom(256)
            with open(pool_path, "wb") as f:
                f.write(data)

            provider = CsiPoolProvider(pool_path=pool_path)
            bits = provider.get_entropy(64)
            assert len(bits) == 64
            assert all(c in "01" for c in bits)

    def test_sequential_reads_advance_position(self):
        """Position should advance across reads, tracked in .pos file."""
        from zipminator.entropy.csi_pool_provider import CsiPoolProvider

        with tempfile.TemporaryDirectory() as tmpdir:
            pool_path = os.path.join(tmpdir, "csi_entropy_pool.bin")
            data = os.urandom(256)
            with open(pool_path, "wb") as f:
                f.write(data)

            provider = CsiPoolProvider(pool_path=pool_path)
            bits1 = provider.get_entropy(64)  # reads 8 bytes
            bits2 = provider.get_entropy(64)  # reads next 8 bytes

            # Two consecutive reads should produce different output
            assert bits1 != bits2

            # Position file should exist
            pos_path = pool_path.replace(".bin", ".pos")
            assert os.path.exists(pos_path)
            pos = struct.unpack("<Q", open(pos_path, "rb").read(8))[0]
            assert pos == 16  # 8 bytes per read, 2 reads

    def test_bytes_remaining(self):
        from zipminator.entropy.csi_pool_provider import CsiPoolProvider

        with tempfile.TemporaryDirectory() as tmpdir:
            pool_path = os.path.join(tmpdir, "csi_entropy_pool.bin")
            with open(pool_path, "wb") as f:
                f.write(os.urandom(100))

            provider = CsiPoolProvider(pool_path=pool_path)
            assert provider.bytes_remaining() == 100
            provider.get_entropy(64)  # consume 8 bytes
            assert provider.bytes_remaining() == 92

    def test_exhausted_pool_returns_error_not_urandom(self):
        """Unlike PoolProvider, CSI pool should NOT fall back to os.urandom.
        Provenance matters: CSI bytes must come from CSI, not OS."""
        from zipminator.entropy.csi_pool_provider import CsiPoolProvider

        with tempfile.TemporaryDirectory() as tmpdir:
            pool_path = os.path.join(tmpdir, "csi_entropy_pool.bin")
            with open(pool_path, "wb") as f:
                f.write(os.urandom(4))  # tiny pool

            provider = CsiPoolProvider(pool_path=pool_path)
            # First read succeeds (partial)
            bits = provider.get_entropy(32)
            assert len(bits) == 32

            # Pool exhausted — should raise, not silently fall back
            with pytest.raises(RuntimeError, match="CSI pool exhausted"):
                provider.get_entropy(64)

    def test_missing_pool_raises(self):
        """Missing pool file should raise, not silently use OS entropy."""
        from zipminator.entropy.csi_pool_provider import CsiPoolProvider

        provider = CsiPoolProvider(pool_path="/nonexistent/csi_pool.bin")
        with pytest.raises(RuntimeError, match="CSI pool"):
            provider.get_entropy(64)

    def test_separate_from_quantum_pool(self):
        """CSI and quantum pools must use different files."""
        from zipminator.entropy.csi_pool_provider import CsiPoolProvider, DEFAULT_CSI_POOL_PATH
        from zipminator.entropy.pool_provider import _DEFAULT_POOL_PATH

        assert str(DEFAULT_CSI_POOL_PATH) != str(_DEFAULT_POOL_PATH)
        assert "csi" in str(DEFAULT_CSI_POOL_PATH).lower()

    def test_check_freshness(self):
        from zipminator.entropy.csi_pool_provider import CsiPoolProvider

        with tempfile.TemporaryDirectory() as tmpdir:
            pool_path = os.path.join(tmpdir, "csi_entropy_pool.bin")
            with open(pool_path, "wb") as f:
                f.write(os.urandom(64))

            provider = CsiPoolProvider(pool_path=pool_path)
            is_fresh, age_hours = provider.check_freshness()
            assert is_fresh is True
            assert age_hours < 1.0  # just created


class TestCsiInFactory:
    """CSI pool should be registered in the factory's provider collection."""

    def test_collect_providers_includes_csi(self):
        """_collect_providers should include CSI pool when file exists."""
        from zipminator.entropy.factory import _collect_providers

        with tempfile.TemporaryDirectory() as tmpdir:
            csi_path = os.path.join(tmpdir, "csi_entropy_pool.bin")
            with open(csi_path, "wb") as f:
                f.write(os.urandom(256))

            providers = _collect_providers(csi_pool_path=csi_path)
            names = [p.name() for p in providers]
            assert "CsiPoolProvider" in names

    def test_compositor_includes_csi_source(self):
        """get_compositor should include CSI in multi-source composition."""
        from zipminator.entropy.factory import get_compositor

        with tempfile.TemporaryDirectory() as tmpdir:
            csi_path = os.path.join(tmpdir, "csi_entropy_pool.bin")
            with open(csi_path, "wb") as f:
                f.write(os.urandom(256))

            comp = get_compositor(csi_pool_path=csi_path)
            result = comp.compose(32)
            assert "CsiPoolProvider" in result.sources_used
