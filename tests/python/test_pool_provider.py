"""
Tests for the PoolProvider and entropy API schemas.
"""

import os
import struct
import threading
import time

import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock

from zipminator.entropy.pool_provider import PoolProvider, _DEFAULT_POOL_PATH


# ─── Fixtures ───


@pytest.fixture
def pool_dir(tmp_path):
    """Temporary directory for pool files."""
    return tmp_path / "entropy"


@pytest.fixture
def pool_file(pool_dir):
    """Create a pool file with 256 bytes of known data."""
    pool_dir.mkdir(parents=True, exist_ok=True)
    path = pool_dir / "pool.bin"
    data = bytes(range(256))
    path.write_bytes(data)
    return path


@pytest.fixture
def provider(pool_file):
    """PoolProvider backed by the temporary pool file."""
    return PoolProvider(pool_path=str(pool_file))


@pytest.fixture
def empty_pool(pool_dir):
    """Create an empty pool file."""
    pool_dir.mkdir(parents=True, exist_ok=True)
    path = pool_dir / "empty.bin"
    path.write_bytes(b"")
    return path


# ─── Basic Read ───


class TestReadFromPool:
    def test_read_returns_correct_length(self, provider):
        result = provider.get_entropy(64)
        assert len(result) == 64
        assert all(c in "01" for c in result)

    def test_read_8_bits_returns_first_byte(self, provider):
        result = provider.get_entropy(8)
        # First byte is 0x00 -> "00000000"
        assert result == "00000000"

    def test_read_16_bits_returns_first_two_bytes(self, provider):
        result = provider.get_entropy(16)
        # Bytes 0x00, 0x01 -> "0000000000000001"
        assert result == "0000000000000001"

    def test_read_non_multiple_of_8(self, provider):
        result = provider.get_entropy(13)
        assert len(result) == 13
        assert all(c in "01" for c in result)


# ─── Position Advancement ───


class TestPositionAdvancement:
    def test_sequential_reads_advance(self, provider):
        first = provider.get_entropy(8)
        second = provider.get_entropy(8)
        # First byte 0x00, second byte 0x01
        assert first == "00000000"
        assert second == "00000001"

    def test_position_file_created(self, provider, pool_file):
        provider.get_entropy(8)
        pos_path = pool_file.with_suffix(".pos")
        assert pos_path.exists()

    def test_position_value_correct(self, provider, pool_file):
        provider.get_entropy(16)  # 2 bytes
        pos_path = pool_file.with_suffix(".pos")
        raw = pos_path.read_bytes()
        pos = struct.unpack("<Q", raw[:8])[0]
        assert pos == 2

    def test_multiple_reads_accumulate_position(self, provider, pool_file):
        provider.get_entropy(8)   # 1 byte
        provider.get_entropy(16)  # 2 bytes
        provider.get_entropy(24)  # 3 bytes = 6 total
        pos_path = pool_file.with_suffix(".pos")
        raw = pos_path.read_bytes()
        pos = struct.unpack("<Q", raw[:8])[0]
        assert pos == 6


# ─── Fallback Behavior ───


class TestFallback:
    def test_empty_pool_falls_back(self, empty_pool):
        p = PoolProvider(pool_path=str(empty_pool))
        result = p.get_entropy(64)
        assert len(result) == 64
        assert all(c in "01" for c in result)

    def test_missing_pool_falls_back(self, tmp_path):
        missing = tmp_path / "nonexistent" / "pool.bin"
        p = PoolProvider(pool_path=str(missing))
        result = p.get_entropy(64)
        assert len(result) == 64
        assert all(c in "01" for c in result)

    def test_pool_exhausted_falls_back(self, pool_dir):
        pool_dir.mkdir(parents=True, exist_ok=True)
        path = pool_dir / "tiny.bin"
        path.write_bytes(b"\xAB")  # Only 1 byte
        p = PoolProvider(pool_path=str(path))
        # Read 1 byte from pool
        p.get_entropy(8)
        # Pool now exhausted; next read must fall back
        result = p.get_entropy(8)
        assert len(result) == 8

    def test_large_read_partially_from_pool(self, pool_dir):
        pool_dir.mkdir(parents=True, exist_ok=True)
        path = pool_dir / "small.bin"
        path.write_bytes(b"\xFF\x00")  # 2 bytes
        p = PoolProvider(pool_path=str(path))
        # Request 4 bytes (32 bits) but only 2 in pool
        result = p.get_entropy(32)
        assert len(result) == 32
        # First 16 bits should be from pool: 0xFF=11111111, 0x00=00000000
        assert result[:16] == "1111111100000000"


# ─── Freshness Check ───


class TestFreshness:
    def test_fresh_pool(self, provider):
        is_fresh, age = provider.check_freshness()
        assert is_fresh is True
        assert age < 1.0  # Just created, less than 1 hour

    def test_stale_pool(self, pool_file):
        # Backdate mtime by 8 days
        eight_days_ago = time.time() - (8 * 24 * 3600)
        os.utime(pool_file, (eight_days_ago, eight_days_ago))
        p = PoolProvider(pool_path=str(pool_file))
        is_fresh, age = p.check_freshness()
        assert is_fresh is False
        assert age > 7 * 24

    def test_missing_pool_not_fresh(self, tmp_path):
        p = PoolProvider(pool_path=str(tmp_path / "nope.bin"))
        is_fresh, age = p.check_freshness()
        assert is_fresh is False
        assert age == float("inf")


# ─── Bytes Remaining ───


class TestBytesRemaining:
    def test_full_pool(self, provider):
        assert provider.bytes_remaining() == 256

    def test_after_read(self, provider):
        provider.get_entropy(80)  # 10 bytes
        assert provider.bytes_remaining() == 246

    def test_missing_pool_zero(self, tmp_path):
        p = PoolProvider(pool_path=str(tmp_path / "nope.bin"))
        assert p.bytes_remaining() == 0

    def test_empty_pool_zero(self, empty_pool):
        p = PoolProvider(pool_path=str(empty_pool))
        assert p.bytes_remaining() == 0


# ─── Thread Safety ───


class TestThreadSafety:
    def test_concurrent_reads(self, pool_dir):
        pool_dir.mkdir(parents=True, exist_ok=True)
        path = pool_dir / "concurrent.bin"
        # 1024 bytes
        path.write_bytes(os.urandom(1024))
        p = PoolProvider(pool_path=str(path))

        results = []
        errors = []

        def read_worker():
            try:
                r = p.get_entropy(64)  # 8 bytes each
                results.append(r)
            except Exception as e:
                errors.append(e)

        threads = [threading.Thread(target=read_worker) for _ in range(20)]
        for t in threads:
            t.start()
        for t in threads:
            t.join(timeout=5)

        assert len(errors) == 0
        assert len(results) == 20
        # All results should be 64-char binary strings
        for r in results:
            assert len(r) == 64
            assert all(c in "01" for c in r)

        # Position should be 20 * 8 = 160
        assert p.bytes_remaining() == 1024 - 160


# ─── Position Persistence ───


class TestPositionPersistence:
    def test_position_survives_new_instance(self, pool_file):
        p1 = PoolProvider(pool_path=str(pool_file))
        p1.get_entropy(24)  # 3 bytes
        del p1

        p2 = PoolProvider(pool_path=str(pool_file))
        assert p2.bytes_remaining() == 253
        # Next read should start at byte 3 (value 0x03)
        result = p2.get_entropy(8)
        assert result == "00000011"  # 0x03

    def test_corrupted_pos_file_resets(self, pool_file):
        pos_path = pool_file.with_suffix(".pos")
        pos_path.write_bytes(b"\x00\x01")  # Too short (< 8 bytes)
        p = PoolProvider(pool_path=str(pool_file))
        assert p.bytes_remaining() == 256  # Position reset to 0


# ─── Provider Name ───


class TestProviderName:
    def test_name(self, provider):
        assert provider.name() == "PoolProvider"


# ─── Quota Integration ───


class TestQuotaIntegration:
    def test_no_quota_without_user_id(self, pool_file):
        p = PoolProvider(pool_path=str(pool_file))
        assert p._quota_mgr is None

    def test_quota_initialized_with_user_id(self, pool_file, tmp_path):
        with patch(
            "zipminator.entropy.quota.EntropyQuotaManager"
        ) as mock_cls:
            mock_cls.return_value = MagicMock()
            p = PoolProvider(
                pool_path=str(pool_file),
                user_id="test-user",
                tier="amir",
            )
            assert p._quota_mgr is not None
            mock_cls.assert_called_once()


# ─── Factory Priority ───


class TestFactoryPriority:
    def test_pool_provider_first_when_pool_exists(self, pool_file):
        from zipminator.entropy.factory import get_provider

        provider = get_provider(pool_path=str(pool_file))
        assert provider.name() == "PoolProvider"

    def test_fallback_when_pool_missing(self, tmp_path):
        from zipminator.entropy.factory import get_provider

        missing = str(tmp_path / "nonexistent.bin")
        # Without any env vars, should get APIProxyProvider
        with patch.dict(os.environ, {}, clear=True):
            provider = get_provider(pool_path=missing)
            assert provider.name() != "PoolProvider"

    def test_fallback_when_pool_empty(self, empty_pool):
        from zipminator.entropy.factory import get_provider

        with patch.dict(os.environ, {}, clear=True):
            provider = get_provider(pool_path=str(empty_pool))
            assert provider.name() != "PoolProvider"


# ─── API Schema Validation ───


class TestApiSchema:
    """Test EntropyRequest / EntropyResponse pydantic models."""

    @pytest.fixture(autouse=True)
    def _skip_if_no_pydantic(self):
        pytest.importorskip("pydantic")

    def test_valid_request(self):
        from zipminator.entropy.api_schema import EntropyRequest

        req = EntropyRequest(
            bytes=1024,
            api_key="a" * 16,
            source="pool",
        )
        assert req.bytes == 1024
        assert req.source == "pool"

    def test_request_default_source(self):
        from zipminator.entropy.api_schema import EntropyRequest

        req = EntropyRequest(bytes=1, api_key="x" * 16)
        assert req.source == "auto"

    def test_request_bytes_too_large(self):
        from zipminator.entropy.api_schema import EntropyRequest
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            EntropyRequest(bytes=2_000_000, api_key="x" * 16)

    def test_request_bytes_zero(self):
        from zipminator.entropy.api_schema import EntropyRequest
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            EntropyRequest(bytes=0, api_key="x" * 16)

    def test_request_short_api_key(self):
        from zipminator.entropy.api_schema import EntropyRequest
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            EntropyRequest(bytes=10, api_key="short")

    def test_valid_response(self):
        from zipminator.entropy.api_schema import EntropyResponse

        resp = EntropyResponse(
            entropy="deadbeef",
            source="PoolProvider",
            freshness_hours=2.5,
            quota_remaining=999_000,
            pool_bytes_remaining=50_000,
        )
        assert resp.entropy == "deadbeef"
        assert resp.freshness_hours == 2.5
