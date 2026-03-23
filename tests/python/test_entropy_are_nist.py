"""NIST SP 800-22 statistical tests for ARE-extracted output.

Generates ARE output and validates randomness quality using simplified
implementations of NIST SP 800-22 tests:

1. Frequency (monobit) test
2. Runs test
3. Block frequency test (128-bit blocks)
4. Longest run of ones test
5. Comparison: raw os.urandom vs ARE-processed

These are self-contained implementations; no external NIST test suite needed.
"""

from __future__ import annotations

import math
import os
import struct

import pytest

from zipminator.entropy.are import AreExtractor

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SAMPLE_SIZE = 100 * 1024  # 100 KB of ARE output
SIGNIFICANCE = 0.01       # p-value threshold (1%)
BLOCK_SIZE = 128          # bits per block for block-frequency test


# ---------------------------------------------------------------------------
# Helpers: generate ARE output
# ---------------------------------------------------------------------------

def _generate_are_output(size: int, seed: bytes = b"nist_validation_seed") -> bytes:
    """Generate `size` bytes of ARE-extracted random data.

    Uses os.urandom as input and ARE as a post-processor, matching the
    intended CHE Layer 2 usage pattern.
    """
    ext = AreExtractor.from_seed(seed, num_steps=8, modulus=1_000_000_007)
    raw = os.urandom(size * 2)  # Extra input to ensure enough output.
    return ext.extract_bytes(raw, size)


def _bytes_to_bits(data: bytes) -> list[int]:
    """Convert bytes to a list of individual bits (MSB first)."""
    bits = []
    for byte in data:
        for i in range(7, -1, -1):
            bits.append((byte >> i) & 1)
    return bits


# ---------------------------------------------------------------------------
# NIST SP 800-22 Test 1: Frequency (Monobit) Test
# ---------------------------------------------------------------------------

def _frequency_test(bits: list[int]) -> float:
    """Frequency (monobit) test.

    The proportion of ones in the entire sequence should be approximately 0.5.
    Returns a p-value.
    """
    n = len(bits)
    if n == 0:
        return 0.0
    # S_n = sum of (2*bit - 1) for each bit
    s_n = sum(2 * b - 1 for b in bits)
    s_obs = abs(s_n) / math.sqrt(n)
    p_value = math.erfc(s_obs / math.sqrt(2))
    return p_value


# ---------------------------------------------------------------------------
# NIST SP 800-22 Test 2: Runs Test
# ---------------------------------------------------------------------------

def _runs_test(bits: list[int]) -> float:
    """Runs test.

    A run is a maximal sequence of identical bits. The number of runs
    should match the expected distribution for a random sequence.
    Returns a p-value.
    """
    n = len(bits)
    if n == 0:
        return 0.0

    # Pre-test: proportion of ones
    pi = sum(bits) / n
    # If proportion is too far from 0.5, the runs test is not applicable.
    tau = 2.0 / math.sqrt(n)
    if abs(pi - 0.5) >= tau:
        return 0.0

    # Count runs
    v_obs = 1
    for i in range(1, n):
        if bits[i] != bits[i - 1]:
            v_obs += 1

    # Compute p-value
    numerator = abs(v_obs - 2 * n * pi * (1 - pi))
    denominator = 2 * math.sqrt(2 * n) * pi * (1 - pi)
    if denominator == 0:
        return 0.0
    p_value = math.erfc(numerator / denominator)
    return p_value


# ---------------------------------------------------------------------------
# NIST SP 800-22 Test 3: Block Frequency Test
# ---------------------------------------------------------------------------

def _block_frequency_test(bits: list[int], block_size: int = BLOCK_SIZE) -> float:
    """Block frequency test.

    Divide the sequence into non-overlapping blocks of `block_size` bits.
    The proportion of ones in each block should be approximately 0.5.
    Returns a p-value.
    """
    n = len(bits)
    num_blocks = n // block_size
    if num_blocks == 0:
        return 0.0

    chi_sq = 0.0
    for i in range(num_blocks):
        block = bits[i * block_size : (i + 1) * block_size]
        pi_i = sum(block) / block_size
        chi_sq += (pi_i - 0.5) ** 2

    chi_sq *= 4 * block_size

    # p-value from incomplete gamma function (chi-squared with num_blocks/2 df)
    # Using a simplified approximation via regularized incomplete gamma.
    p_value = _igamc(num_blocks / 2.0, chi_sq / 2.0)
    return p_value


# ---------------------------------------------------------------------------
# NIST SP 800-22 Test 4: Longest Run of Ones
# ---------------------------------------------------------------------------

def _longest_run_test(bits: list[int]) -> float:
    """Longest run of ones in a block test.

    For 100KB+ sequences, use 10000-bit blocks. The longest run of ones
    in each block is tallied and compared to expected distribution.
    Returns a p-value.
    """
    n = len(bits)

    # Choose parameters based on sequence length (NIST SP 800-22 Table 4)
    if n < 128:
        return 1.0  # Too short for this test
    elif n < 6272:
        m = 8
        k = 3
        v_values = [1, 2, 3, 4]  # bin boundaries
        pi = [0.2148, 0.3672, 0.2305, 0.1875]
    elif n < 750000:
        m = 128
        k = 5
        v_values = [4, 5, 6, 7, 8, 9]
        pi = [0.1174, 0.2430, 0.2493, 0.1752, 0.1027, 0.1124]
    else:
        m = 10000
        k = 6
        v_values = [10, 11, 12, 13, 14, 15, 16]
        pi = [0.0882, 0.2092, 0.2483, 0.1933, 0.1208, 0.0675, 0.0727]

    num_blocks = n // m
    if num_blocks == 0:
        return 1.0

    # Compute longest run for each block
    longest_runs = []
    for i in range(num_blocks):
        block = bits[i * m : (i + 1) * m]
        max_run = 0
        current_run = 0
        for bit in block:
            if bit == 1:
                current_run += 1
                max_run = max(max_run, current_run)
            else:
                current_run = 0
        longest_runs.append(max_run)

    # Tally into bins
    freq = [0] * len(v_values)
    for lr in longest_runs:
        if lr <= v_values[0]:
            freq[0] += 1
        elif lr >= v_values[-1]:
            freq[-1] += 1
        else:
            for j in range(1, len(v_values)):
                if lr == v_values[j]:
                    freq[j] += 1
                    break
            else:
                # Falls between bins; assign to nearest
                for j in range(len(v_values) - 1):
                    if v_values[j] < lr < v_values[j + 1]:
                        freq[j + 1] += 1
                        break

    # Chi-squared statistic
    chi_sq = 0.0
    for j in range(len(v_values)):
        expected = num_blocks * pi[j]
        if expected > 0:
            chi_sq += (freq[j] - expected) ** 2 / expected

    p_value = _igamc(len(v_values) / 2.0, chi_sq / 2.0)
    return p_value


# ---------------------------------------------------------------------------
# Helper: Incomplete gamma function (regularized upper)
# ---------------------------------------------------------------------------

def _igamc(a: float, x: float) -> float:
    """Regularized upper incomplete gamma function Q(a, x) = 1 - P(a, x).

    Uses a simple series/continued-fraction approximation sufficient for
    our NIST test p-value calculations.
    """
    if x < 0 or a <= 0:
        return 1.0
    if x == 0:
        return 1.0
    if x < a + 1:
        # Use series for P(a, x) then return 1 - P
        return 1.0 - _igam_series(a, x)
    else:
        # Use continued fraction for Q(a, x)
        return _igamc_cf(a, x)


def _igam_series(a: float, x: float, max_iter: int = 200) -> float:
    """Lower regularized incomplete gamma via series expansion."""
    if x == 0:
        return 0.0
    ap = a
    total = 1.0 / a
    delta = total
    for _ in range(max_iter):
        ap += 1
        delta *= x / ap
        total += delta
        if abs(delta) < abs(total) * 1e-15:
            break
    return total * math.exp(-x + a * math.log(x) - math.lgamma(a))


def _igamc_cf(a: float, x: float, max_iter: int = 200) -> float:
    """Upper regularized incomplete gamma via continued fraction."""
    fpmin = 1e-300
    b = x + 1 - a
    c = 1.0 / fpmin
    d = 1.0 / b
    h = d
    for i in range(1, max_iter + 1):
        an = -i * (i - a)
        b += 2.0
        d = an * d + b
        if abs(d) < fpmin:
            d = fpmin
        c = b + an / c
        if abs(c) < fpmin:
            c = fpmin
        d = 1.0 / d
        delta = d * c
        h *= delta
        if abs(delta - 1.0) < 1e-15:
            break
    return h * math.exp(-x + a * math.log(x) - math.lgamma(a))


# ===========================================================================
# Tests
# ===========================================================================

class TestNISTFrequency:
    """NIST SP 800-22 Test 2.1: Frequency (Monobit)."""

    def test_are_output_passes_frequency(self):
        data = _generate_are_output(SAMPLE_SIZE)
        bits = _bytes_to_bits(data)
        p = _frequency_test(bits)
        assert p > SIGNIFICANCE, (
            f"Frequency test FAILED: p-value {p:.6f} < {SIGNIFICANCE}"
        )

    def test_urandom_passes_frequency(self):
        """Baseline: os.urandom should also pass."""
        data = os.urandom(SAMPLE_SIZE)
        bits = _bytes_to_bits(data)
        p = _frequency_test(bits)
        assert p > SIGNIFICANCE, (
            f"os.urandom frequency test FAILED: p-value {p:.6f}"
        )


class TestNISTRuns:
    """NIST SP 800-22 Test 2.3: Runs."""

    def test_are_output_passes_runs(self):
        data = _generate_are_output(SAMPLE_SIZE)
        bits = _bytes_to_bits(data)
        p = _runs_test(bits)
        assert p > SIGNIFICANCE, (
            f"Runs test FAILED: p-value {p:.6f} < {SIGNIFICANCE}"
        )

    def test_urandom_passes_runs(self):
        data = os.urandom(SAMPLE_SIZE)
        bits = _bytes_to_bits(data)
        p = _runs_test(bits)
        assert p > SIGNIFICANCE, (
            f"os.urandom runs test FAILED: p-value {p:.6f}"
        )


class TestNISTBlockFrequency:
    """NIST SP 800-22 Test 2.2: Block Frequency."""

    def test_are_output_passes_block_frequency(self):
        data = _generate_are_output(SAMPLE_SIZE)
        bits = _bytes_to_bits(data)
        p = _block_frequency_test(bits)
        assert p > SIGNIFICANCE, (
            f"Block frequency test FAILED: p-value {p:.6f} < {SIGNIFICANCE}"
        )

    def test_urandom_passes_block_frequency(self):
        data = os.urandom(SAMPLE_SIZE)
        bits = _bytes_to_bits(data)
        p = _block_frequency_test(bits)
        assert p > SIGNIFICANCE, (
            f"os.urandom block frequency test FAILED: p-value {p:.6f}"
        )


class TestNISTLongestRun:
    """NIST SP 800-22 Test 2.4: Longest Run of Ones."""

    def test_are_output_passes_longest_run(self):
        data = _generate_are_output(SAMPLE_SIZE)
        bits = _bytes_to_bits(data)
        p = _longest_run_test(bits)
        assert p > SIGNIFICANCE, (
            f"Longest run test FAILED: p-value {p:.6f} < {SIGNIFICANCE}"
        )

    def test_urandom_passes_longest_run(self):
        data = os.urandom(SAMPLE_SIZE)
        bits = _bytes_to_bits(data)
        p = _longest_run_test(bits)
        assert p > SIGNIFICANCE, (
            f"os.urandom longest run test FAILED: p-value {p:.6f}"
        )


class TestAREDoesNotDegradeQuality:
    """ARE post-processing should not degrade randomness quality.

    Both raw os.urandom and ARE-processed output should pass all tests.
    We run multiple seeds and verify consistent passing.
    """

    def test_multiple_seeds_all_pass_frequency(self):
        """Test 5 different seeds; all should pass frequency test."""
        pass_count = 0
        for i in range(5):
            seed = f"multi_seed_{i}".encode()
            data = _generate_are_output(SAMPLE_SIZE // 5, seed=seed)
            bits = _bytes_to_bits(data)
            p = _frequency_test(bits)
            if p > SIGNIFICANCE:
                pass_count += 1
        # At least 4 out of 5 should pass (accounting for statistical variance)
        assert pass_count >= 4, (
            f"Only {pass_count}/5 seeds passed frequency test"
        )

    def test_are_output_has_reasonable_byte_distribution(self):
        """ARE output bytes should be roughly uniformly distributed."""
        data = _generate_are_output(SAMPLE_SIZE)
        counts = [0] * 256
        for b in data:
            counts[b] += 1
        expected = SAMPLE_SIZE / 256
        # Chi-squared test for uniformity
        chi_sq = sum((c - expected) ** 2 / expected for c in counts)
        # 255 degrees of freedom; critical value at 1% ~ 310
        assert chi_sq < 350, (
            f"Byte distribution chi-sq {chi_sq:.1f} exceeds threshold"
        )
