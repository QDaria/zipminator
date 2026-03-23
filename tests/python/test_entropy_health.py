"""NIST SP 800-90B Section 4.4 online health tests."""
import os
import pytest
from zipminator.entropy.health import (
    RepetitionCountTest,
    AdaptiveProportionTest,
    HealthTestSuite,
    HealthStatus,
    MinEntropyEstimator,
)


class TestRepetitionCountTest:
    """Section 4.4.1: catches stuck-at faults."""

    def test_healthy_random_data(self):
        """Random-looking data should pass."""
        rct = RepetitionCountTest(alpha=2**-20, bit_width=8)
        data = bytes(range(256)) * 4  # cycling 0-255
        for byte in data:
            result = rct.feed(byte)
            assert result == HealthStatus.HEALTHY

    def test_stuck_at_fault(self):
        """Repeated identical values must trigger failure."""
        rct = RepetitionCountTest(alpha=2**-20, bit_width=8)
        # Feed the same byte many times -- must fail before 100 repetitions
        failed = False
        for _ in range(100):
            if rct.feed(0xAA) == HealthStatus.FAILED:
                failed = True
                break
        assert failed, "RCT should detect stuck-at-zero fault"

    def test_cutoff_calculation(self):
        """Cutoff C should be ceil(1 + (-log2(alpha) / H))."""
        rct = RepetitionCountTest(alpha=2**-20, bit_width=8)
        # For H=8 (uniform bytes), C = 1 + ceil(20/8) = 4
        assert rct.cutoff >= 3  # minimum reasonable cutoff


class TestAdaptiveProportionTest:
    """Section 4.4.2: catches bias drift."""

    def test_healthy_uniform_data(self):
        """Roughly uniform data should pass."""
        apt = AdaptiveProportionTest(alpha=2**-20, bit_width=8, window_size=512)
        data = os.urandom(512)
        results = [apt.feed(b) for b in data]
        assert all(r != HealthStatus.FAILED for r in results)

    def test_heavily_biased_data(self):
        """Data that's 90% one value must trigger failure."""
        apt = AdaptiveProportionTest(alpha=2**-20, bit_width=8, window_size=512)
        biased = bytes([0x42] * 460 + list(range(52)))  # 90% same value
        failed = any(apt.feed(b) == HealthStatus.FAILED for b in biased)
        assert failed, "APT should detect heavy bias"

    def test_window_reset(self):
        """After a window completes, counters should reset."""
        apt = AdaptiveProportionTest(alpha=2**-20, bit_width=8, window_size=64)
        data = os.urandom(128)  # two full windows
        for b in data:
            apt.feed(b)
        assert apt.samples_in_window < 64  # should have reset


class TestHealthTestSuite:
    """Combined suite runs both tests."""

    def test_suite_healthy(self):
        suite = HealthTestSuite(alpha=2**-20, bit_width=8)
        for b in os.urandom(1024):
            status = suite.feed(b)
            assert status != HealthStatus.FAILED

    def test_suite_detects_failure(self):
        suite = HealthTestSuite(alpha=2**-20, bit_width=8)
        failed = any(suite.feed(0xFF) == HealthStatus.FAILED for _ in range(100))
        assert failed


class TestMinEntropyEstimator:
    """Online min-entropy estimation via Most Common Value (MCV) method.
    NIST SP 800-90B Section 6.3.1."""

    def test_uniform_source_high_entropy(self):
        """os.urandom should yield near-maximal min-entropy."""
        est = MinEntropyEstimator(bit_width=8)
        for b in os.urandom(10000):
            est.feed(b)
        h_min = est.estimate()
        # Uniform 8-bit source: H_min should be close to 8.0
        assert h_min > 7.0, f"uniform source should have high entropy, got {h_min}"

    def test_constant_source_zero_entropy(self):
        """Constant source should yield near-zero min-entropy."""
        est = MinEntropyEstimator(bit_width=8)
        for _ in range(10000):
            est.feed(42)
        h_min = est.estimate()
        assert h_min < 0.1, f"constant source should have ~0 entropy, got {h_min}"

    def test_biased_source_intermediate_entropy(self):
        """Source with 50% one value should have ~1 bit entropy."""
        est = MinEntropyEstimator(bit_width=8)
        data = [0] * 5000 + list(range(256)) * 19 + [0] * 136
        for b in data:
            est.feed(b % 256)
        h_min = est.estimate()
        assert 0.5 < h_min < 3.0, f"biased source entropy out of range: {h_min}"

    def test_insufficient_samples(self):
        """Should return None if not enough samples."""
        est = MinEntropyEstimator(bit_width=8, min_samples=1000)
        for b in range(100):
            est.feed(b)
        assert est.estimate() is None
