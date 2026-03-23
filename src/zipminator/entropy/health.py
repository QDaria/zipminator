"""
NIST SP 800-90B Section 4.4 online health tests.

Provides continuous entropy source monitoring via:
- Repetition Count Test (RCT): detects stuck-at faults
- Adaptive Proportion Test (APT): detects bias drift
- MinEntropyEstimator: online min-entropy estimation (MCV method, Section 6.3.1)

Both health tests run per-sample with O(1) memory and O(1) time.
The estimator uses O(alphabet_size) memory with O(1) per-sample time.

No scipy dependency: cutoffs use Chernoff-bound approximation.
"""
import enum
import math
from typing import Optional


class HealthStatus(enum.Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    FAILED = "failed"


class RepetitionCountTest:
    """NIST SP 800-90B Section 4.4.1.

    Detects stuck-at faults by counting consecutive identical samples.
    Fails if the count exceeds a cutoff derived from the significance
    level alpha and assumed min-entropy H.
    """

    def __init__(
        self,
        alpha: float = 2**-20,
        bit_width: int = 8,
        assumed_h: Optional[float] = None,
    ):
        self.bit_width = bit_width
        # Conservative: assume H = bit_width (uniform) if not specified
        h = assumed_h if assumed_h is not None else float(bit_width)
        # Cutoff C = 1 + ceil(-log2(alpha) / H)
        self.cutoff = 1 + math.ceil(-math.log2(alpha) / h)
        self._prev: Optional[int] = None
        self._count = 0

    def feed(self, sample: int) -> HealthStatus:
        if sample == self._prev:
            self._count += 1
        else:
            self._prev = sample
            self._count = 1

        if self._count >= self.cutoff:
            return HealthStatus.FAILED
        return HealthStatus.HEALTHY

    def reset(self) -> None:
        self._prev = None
        self._count = 0


class AdaptiveProportionTest:
    """NIST SP 800-90B Section 4.4.2.

    Detects bias drift within a sliding window. Fails if any single
    value appears more than the cutoff number of times in a window.
    """

    def __init__(
        self,
        alpha: float = 2**-20,
        bit_width: int = 8,
        window_size: int = 512,
        assumed_h: Optional[float] = None,
    ):
        self.bit_width = bit_width
        self.window_size = window_size
        h = assumed_h if assumed_h is not None else float(bit_width)

        # Cutoff from NIST SP 800-90B Table 2 approximation.
        # No scipy dependency: use Chernoff bound for binomial tail.
        # C = ceil(window_size * p + z * sqrt(window_size * p * (1-p)))
        # where p = 2^(-H) and z = sqrt(-2 * ln(alpha))
        p = 2**(-h)
        z = math.sqrt(-2.0 * math.log(alpha))
        mean = window_size * p
        stddev = math.sqrt(window_size * p * (1 - p))
        self._cutoff = max(3, math.ceil(mean + z * stddev))

        self._reference: Optional[int] = None
        self._count = 0
        self.samples_in_window = 0

    def feed(self, sample: int) -> HealthStatus:
        if self.samples_in_window == 0:
            # Start new window: first sample is the reference
            self._reference = sample
            self._count = 1
            self.samples_in_window = 1
            return HealthStatus.HEALTHY

        self.samples_in_window += 1
        if sample == self._reference:
            self._count += 1

        if self._count >= self._cutoff:
            self.reset()
            return HealthStatus.FAILED

        if self.samples_in_window >= self.window_size:
            self.reset()

        return HealthStatus.HEALTHY

    def reset(self) -> None:
        self._reference = None
        self._count = 0
        self.samples_in_window = 0


class HealthTestSuite:
    """Combined NIST SP 800-90B online health test suite.

    Runs RCT and APT in parallel on every sample. Returns the worst
    status of the two tests.
    """

    def __init__(
        self,
        alpha: float = 2**-20,
        bit_width: int = 8,
        window_size: int = 512,
    ):
        self.rct = RepetitionCountTest(alpha=alpha, bit_width=bit_width)
        self.apt = AdaptiveProportionTest(
            alpha=alpha, bit_width=bit_width, window_size=window_size
        )
        self._total_samples = 0
        self._failures = 0

    def feed(self, sample: int) -> HealthStatus:
        self._total_samples += 1
        rct_status = self.rct.feed(sample)
        apt_status = self.apt.feed(sample)

        if rct_status == HealthStatus.FAILED or apt_status == HealthStatus.FAILED:
            self._failures += 1
            return HealthStatus.FAILED
        return HealthStatus.HEALTHY

    @property
    def failure_rate(self) -> float:
        if self._total_samples == 0:
            return 0.0
        return self._failures / self._total_samples

    def reset(self) -> None:
        self.rct.reset()
        self.apt.reset()
        self._total_samples = 0
        self._failures = 0


class MinEntropyEstimator:
    """Online min-entropy estimation via Most Common Value (MCV).

    NIST SP 800-90B Section 6.3.1. Tracks frequency of each symbol
    and estimates: H_min = -log2(p_max) where p_max is the maximum
    observed probability.

    This is a conservative (lower-bound) estimator: real min-entropy
    may be higher than the estimate.
    """

    def __init__(self, bit_width: int = 8, min_samples: int = 1000):
        self.bit_width = bit_width
        self.min_samples = min_samples
        self._counts: dict[int, int] = {}
        self._total = 0

    def feed(self, sample: int) -> None:
        self._counts[sample] = self._counts.get(sample, 0) + 1
        self._total += 1

    def estimate(self) -> Optional[float]:
        """Return estimated min-entropy in bits, or None if insufficient data."""
        if self._total < self.min_samples:
            return None
        p_max = max(self._counts.values()) / self._total
        if p_max <= 0 or p_max >= 1:
            return 0.0 if p_max >= 1 else float(self.bit_width)
        return -math.log2(p_max)

    @property
    def sample_count(self) -> int:
        return self._total

    def reset(self) -> None:
        self._counts.clear()
        self._total = 0
