"""
Tests for zipminator.robindra - Quantum Random Number Generator

Tests quantum entropy functionality, API compatibility with Python's random module,
and license tier behavior.
"""

import math
import os
import sys
from pathlib import Path

import pytest

# Add src to path for testing
sys.path.insert(0, str(Path(__file__).parent.parent / "src" / "zipminator"))

# Import robindra directly (standalone module)
import robindra


class TestQuantumEntropyPool:
    """Test quantum entropy pool management."""

    def test_pool_initialization(self):
        """Test entropy pool loads correctly."""
        pool = robindra.QuantumEntropyPool()
        stats = pool.get_stats()

        assert stats["pool_size"] > 0
        assert stats["position"] == 0
        assert stats["total_consumed"] == 0
        assert stats["refill_count"] == 0

    def test_get_bytes(self):
        """Test getting random bytes from pool."""
        pool = robindra.QuantumEntropyPool()

        # Get 16 bytes
        data = pool.get_bytes(16)
        assert len(data) == 16
        assert isinstance(data, bytes)

        # Verify position advanced
        stats = pool.get_stats()
        assert stats["position"] == 16
        assert stats["total_consumed"] == 16

    def test_pool_refill(self):
        """Test pool refills when exhausted."""
        pool = robindra.QuantumEntropyPool()
        pool_size = len(pool._pool)

        # Exhaust the pool
        pool.get_bytes(pool_size + 100)

        stats = pool.get_stats()
        assert stats["refill_count"] >= 1

    def test_thread_safety(self):
        """Test thread-safe access to entropy pool."""
        import threading

        pool = robindra.QuantumEntropyPool()
        results = []

        def worker():
            for _ in range(10):
                data = pool.get_bytes(8)
                results.append(data)

        threads = [threading.Thread(target=worker) for _ in range(5)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        # Should have 50 results (5 threads * 10 calls each)
        assert len(results) == 50
        # All results should be 8 bytes
        assert all(len(data) == 8 for data in results)


class TestQuantumRandom:
    """Test QuantumRandom class."""

    def test_initialization_level10(self):
        """Test initialization with LEVEL10 access."""
        qr = robindra.QuantumRandom(license_tier="ROBINDRA-LEVEL10")
        assert qr._has_quantum_access is True
        assert qr._entropy_pool is not None

    def test_initialization_free_tier(self):
        """Test initialization with free tier (pseudo-random fallback)."""
        qr = robindra.QuantumRandom(license_tier="FREE")
        assert qr._has_quantum_access is False
        assert qr._entropy_pool is None

    def test_random_float(self):
        """Test random() returns float in [0.0, 1.0)."""
        qr = robindra.QuantumRandom(license_tier="LEVEL10")

        for _ in range(100):
            value = qr.random()
            assert isinstance(value, float)
            assert 0.0 <= value < 1.0

    def test_randint(self):
        """Test randint returns integer in range."""
        qr = robindra.QuantumRandom(license_tier="LEVEL10")

        for _ in range(100):
            value = qr.randint(1, 100)
            assert isinstance(value, int)
            assert 1 <= value <= 100

    def test_randint_single_value(self):
        """Test randint with a=b returns that value."""
        qr = robindra.QuantumRandom(license_tier="LEVEL10")
        value = qr.randint(42, 42)
        assert value == 42

    def test_randint_invalid_range(self):
        """Test randint raises error for invalid range."""
        qr = robindra.QuantumRandom(license_tier="LEVEL10")

        with pytest.raises(ValueError):
            qr.randint(100, 1)  # a > b

    def test_choice(self):
        """Test choice selects from sequence."""
        qr = robindra.QuantumRandom(license_tier="LEVEL10")
        seq = [1, 2, 3, 4, 5]

        for _ in range(50):
            value = qr.choice(seq)
            assert value in seq

    def test_choice_empty_sequence(self):
        """Test choice raises error for empty sequence."""
        qr = robindra.QuantumRandom(license_tier="LEVEL10")

        with pytest.raises(IndexError):
            qr.choice([])

    def test_shuffle(self):
        """Test shuffle randomizes list in-place."""
        qr = robindra.QuantumRandom(license_tier="LEVEL10")
        original = list(range(20))
        shuffled = original.copy()

        qr.shuffle(shuffled)

        # Should contain same elements
        assert sorted(shuffled) == sorted(original)
        # Should be different order (with very high probability)
        assert shuffled != original

    def test_sample(self):
        """Test sample returns unique elements."""
        qr = robindra.QuantumRandom(license_tier="LEVEL10")
        population = list(range(100))

        sample = qr.sample(population, 10)

        assert len(sample) == 10
        assert len(set(sample)) == 10  # All unique
        assert all(x in population for x in sample)

    def test_sample_too_large(self):
        """Test sample raises error if k > population size."""
        qr = robindra.QuantumRandom(license_tier="LEVEL10")

        with pytest.raises(ValueError):
            qr.sample([1, 2, 3], 5)

    def test_uniform(self):
        """Test uniform returns float in range."""
        qr = robindra.QuantumRandom(license_tier="LEVEL10")

        for _ in range(100):
            value = qr.uniform(10.0, 20.0)
            assert isinstance(value, float)
            assert 10.0 <= value <= 20.0

    def test_gauss(self):
        """Test Gaussian distribution has correct mean and std dev."""
        qr = robindra.QuantumRandom(license_tier="LEVEL10")

        # Generate large sample
        samples = [qr.gauss(mu=50.0, sigma=10.0) for _ in range(1000)]

        # Check approximate mean and std dev
        mean = sum(samples) / len(samples)
        variance = sum((x - mean) ** 2 for x in samples) / len(samples)
        std_dev = math.sqrt(variance)

        # Should be close to mu=50, sigma=10 (within 10% tolerance)
        assert 45 < mean < 55
        assert 8 < std_dev < 12

    def test_randbytes(self):
        """Test randbytes returns correct number of bytes."""
        qr = robindra.QuantumRandom(license_tier="LEVEL10")

        for n in [1, 8, 16, 100, 1000]:
            data = qr.randbytes(n)
            assert isinstance(data, bytes)
            assert len(data) == n

    def test_getrandbits(self):
        """Test getrandbits returns integer with k bits."""
        qr = robindra.QuantumRandom(license_tier="LEVEL10")

        # Test various bit lengths
        for k in [1, 8, 16, 32, 64, 128]:
            value = qr.getrandbits(k)
            assert isinstance(value, int)
            assert 0 <= value < (1 << k)

    def test_getrandbits_invalid(self):
        """Test getrandbits raises error for invalid k."""
        qr = robindra.QuantumRandom(license_tier="LEVEL10")

        with pytest.raises(ValueError):
            qr.getrandbits(0)

        with pytest.raises(ValueError):
            qr.getrandbits(-5)

    def test_get_stats(self):
        """Test statistics reporting."""
        qr = robindra.QuantumRandom(license_tier="LEVEL10")

        # Generate some random data
        for _ in range(10):
            qr.random()

        stats = qr.get_stats()
        assert "license_tier" in stats
        assert "quantum_access" in stats
        assert stats["quantum_access"] is True


class TestModuleFunctions:
    """Test module-level functions (API compatibility with random module)."""

    def test_random(self):
        """Test module-level random()."""
        value = robindra.random()
        assert isinstance(value, float)
        assert 0.0 <= value < 1.0

    def test_randint(self):
        """Test module-level randint()."""
        value = robindra.randint(1, 10)
        assert isinstance(value, int)
        assert 1 <= value <= 10

    def test_choice(self):
        """Test module-level choice()."""
        value = robindra.choice([1, 2, 3, 4, 5])
        assert value in [1, 2, 3, 4, 5]

    def test_shuffle(self):
        """Test module-level shuffle()."""
        lst = list(range(10))
        robindra.shuffle(lst)
        assert sorted(lst) == list(range(10))

    def test_sample(self):
        """Test module-level sample()."""
        sample = robindra.sample(range(100), 5)
        assert len(sample) == 5
        assert len(set(sample)) == 5

    def test_uniform(self):
        """Test module-level uniform()."""
        value = robindra.uniform(1.0, 10.0)
        assert isinstance(value, float)
        assert 1.0 <= value <= 10.0

    def test_gauss(self):
        """Test module-level gauss()."""
        value = robindra.gauss(0.0, 1.0)
        assert isinstance(value, float)

    def test_randbytes(self):
        """Test module-level randbytes()."""
        data = robindra.randbytes(16)
        assert isinstance(data, bytes)
        assert len(data) == 16

    def test_getrandbits(self):
        """Test module-level getrandbits()."""
        value = robindra.getrandbits(32)
        assert isinstance(value, int)
        assert 0 <= value < (1 << 32)

    def test_get_stats(self):
        """Test module-level get_stats()."""
        stats = robindra.get_stats()
        assert isinstance(stats, dict)
        assert "license_tier" in stats


class TestLicenseTiers:
    """Test license tier behavior."""

    def test_configure_level10(self):
        """Test configure with LEVEL10 access."""
        robindra.configure("BETA2026-LEVEL10")
        stats = robindra.get_stats()
        assert stats["quantum_access"] is True

    def test_configure_free_tier(self):
        """Test configure with free tier."""
        robindra.configure("FREE")
        stats = robindra.get_stats()
        assert stats["quantum_access"] is False

    def test_environment_variable(self):
        """Test quantum access via environment variable."""
        os.environ["ZIPMINATOR_QUANTUM_ENABLED"] = "true"
        qr = robindra.QuantumRandom(license_tier="FREE")
        assert qr._has_quantum_access is True

        del os.environ["ZIPMINATOR_QUANTUM_ENABLED"]


class TestRandomnessQuality:
    """Test randomness quality and distribution."""

    def test_uniform_distribution(self):
        """Test random() produces uniform distribution."""
        qr = robindra.QuantumRandom(license_tier="LEVEL10")

        # Generate 1000 samples
        samples = [qr.random() for _ in range(1000)]

        # Divide into 10 bins and check distribution
        bins = [0] * 10
        for sample in samples:
            bin_idx = int(sample * 10)
            if bin_idx == 10:
                bin_idx = 9  # Handle edge case of 1.0
            bins[bin_idx] += 1

        # Each bin should have roughly 100 samples (allow 50-150 range)
        for count in bins:
            assert 50 < count < 150, f"Bin count {count} outside expected range"

    def test_no_correlation(self):
        """Test consecutive values are not correlated."""
        qr = robindra.QuantumRandom(license_tier="LEVEL10")

        # Generate pairs of consecutive values
        pairs = [(qr.random(), qr.random()) for _ in range(100)]

        # Calculate correlation coefficient (should be close to 0)
        x_values = [p[0] for p in pairs]
        y_values = [p[1] for p in pairs]

        mean_x = sum(x_values) / len(x_values)
        mean_y = sum(y_values) / len(y_values)

        numerator = sum((x - mean_x) * (y - mean_y) for x, y in zip(x_values, y_values))
        denominator_x = sum((x - mean_x) ** 2 for x in x_values)
        denominator_y = sum((y - mean_y) ** 2 for y in y_values)

        if denominator_x > 0 and denominator_y > 0:
            correlation = numerator / math.sqrt(denominator_x * denominator_y)
            # Correlation should be weak (< 0.3)
            assert abs(correlation) < 0.3


def test_drop_in_replacement():
    """
    Test that robindra can be used as drop-in replacement for random module.

    This mimics the user experience:
        import zipminator.robindra as robindra
        x = robindra.randint(1, 100)
    """
    # Configure for quantum access
    robindra.configure("XRAISED-LEVEL10")

    # Use like Python's random module
    rand_float = robindra.random()
    rand_int = robindra.randint(1, 100)
    rand_choice = robindra.choice([10, 20, 30, 40, 50])
    rand_bytes = robindra.randbytes(32)

    assert isinstance(rand_float, float)
    assert isinstance(rand_int, int)
    assert isinstance(rand_choice, int)
    assert isinstance(rand_bytes, bytes)

    # Verify quantum access is working
    stats = robindra.get_stats()
    assert stats["quantum_access"] is True
    print(f"\nQuantum entropy stats: {stats}")


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
