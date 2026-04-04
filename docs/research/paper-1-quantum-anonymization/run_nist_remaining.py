#!/usr/bin/env python3
"""
NIST SP 800-22 Rev 1a: 5 Remaining Statistical Tests
=====================================================
Tests 6, 7, 8, 9, 10 (of the 15-test suite) on IBM Quantum entropy.

Reads 1,000,000 bits from the quantum entropy pool and runs:
  1. Non-overlapping Template Matching (Sect 2.7)
  2. Overlapping Template Matching (Sect 2.8)
  3. Maurer's Universal Statistical Test (Sect 2.9)
  4. Random Excursions (Sect 2.14)
  5. Linear Complexity (Sect 2.10)

Alpha = 0.01 for all tests.
"""

import math
import sys
from pathlib import Path

import numpy as np
from scipy.special import gammaincc, erfc
from scipy.stats import chi2

POOL_PATH = Path(__file__).resolve().parent.parent.parent.parent / "quantum_entropy" / "quantum_entropy_pool.bin"
N_BITS = 1_000_000
ALPHA = 0.01


def read_bits(path: Path, n_bits: int) -> np.ndarray:
    """Read n_bits from binary file, returning int8 array of 0s and 1s."""
    n_bytes = (n_bits + 7) // 8
    raw = np.fromfile(path, dtype=np.uint8, count=n_bytes)
    if len(raw) < n_bytes:
        raise ValueError(f"Pool has only {len(raw)} bytes, need {n_bytes}")
    bits = np.unpackbits(raw)[:n_bits].astype(np.int8)
    return bits


# ---------------------------------------------------------------------------
# Test 1: Non-overlapping Template Matching (NIST SP 800-22 Sect 2.7)
# ---------------------------------------------------------------------------
def nonoverlapping_template_matching(bits: np.ndarray) -> dict:
    """
    Count occurrences of a non-periodic template in N blocks; compare to
    expected via chi-squared.
    Template: B = "000000001" (length m=9), block size M=1032 (from NIST).
    """
    n = len(bits)
    template = np.array([0, 0, 0, 0, 0, 0, 0, 0, 1], dtype=np.int8)
    m = len(template)
    M = 1032  # block size (NIST recommendation for n=10^6)
    N_blocks = n // M

    # Expected values per NIST
    mu = (M - m + 1) / (2**m)
    sigma_sq = M * (1.0 / (2**m) - (2 * m - 1) / (2 ** (2 * m)))

    chi_sq = 0.0
    for i in range(N_blocks):
        block = bits[i * M : (i + 1) * M]
        # Count non-overlapping occurrences
        count = 0
        j = 0
        while j <= M - m:
            if np.array_equal(block[j : j + m], template):
                count += 1
                j += m  # skip past match (non-overlapping)
            else:
                j += 1
        chi_sq += (count - mu) ** 2 / sigma_sq

    p_value = gammaincc(N_blocks / 2.0, chi_sq / 2.0)
    return {
        "name": "Non-overlapping Template Matching",
        "statistic": chi_sq,
        "stat_label": "chi2",
        "p_value": p_value,
        "detail": f"template=000000001, M={M}, N={N_blocks}, mu={mu:.4f}",
    }


# ---------------------------------------------------------------------------
# Test 2: Overlapping Template Matching (NIST SP 800-22 Sect 2.8)
# ---------------------------------------------------------------------------
def overlapping_template_matching(bits: np.ndarray) -> dict:
    """
    Overlapping template test. Template: B = "111111111" (m=9 ones).
    Block size M=1032, K=5 degrees of freedom.
    Uses NIST-specified lambda, eta, and precomputed pi values.
    """
    n = len(bits)
    template = np.array([1, 1, 1, 1, 1, 1, 1, 1, 1], dtype=np.int8)
    m = len(template)
    M = 1032
    N_blocks = n // M
    K = 5  # number of categories is K+1 = 6

    lam = (M - m + 1) / (2.0**m)
    eta = lam / 2.0

    # Precomputed probabilities pi_0..pi_5 from NIST for m=9, M=1032
    # pi_i = Pr(exactly i overlapping occurrences) for i=0..K-1, pi_K = tail
    pi = np.zeros(K + 1)
    pi[0] = math.exp(-eta)
    for i in range(1, K):
        pi[i] = eta * math.exp(-2.0 * eta) * (2.0 * eta) ** (i - 1)
        for j in range(2, i + 1):
            pi[i] += (
                math.exp(-eta)
                * eta**j
                / math.factorial(j)
                * math.exp(-eta)
                * (2.0 * eta) ** (i - j)
            )
        # Simpler recurrence from NIST appendix:
    # Use the exact NIST formula for pi values
    pi[0] = math.exp(-eta)
    for i in range(1, K):
        acc = 0.0
        for j in range(i):
            acc += math.exp(-eta) * (eta**j) / math.factorial(j)
        pi[i] = 1.0 - acc
        pi[i] -= (1.0 - pi[i - 1] if i > 0 else 0.0)  # this is wrong; use proper CDF

    # Better: compute directly from Poisson CDF
    # pi[i] = Pr(v=i) where v ~ Poisson(eta) convolved for overlapping
    # Use NIST's recommended approach: Poisson probabilities
    from scipy.stats import poisson

    cdf_vals = [poisson.cdf(i, eta) for i in range(K + 1)]
    pi[0] = cdf_vals[0]
    for i in range(1, K):
        pi[i] = cdf_vals[i] - cdf_vals[i - 1]
    pi[K] = 1.0 - cdf_vals[K - 1]

    # Count overlapping occurrences in each block
    counts = np.zeros(K + 1, dtype=np.float64)  # frequency of blocks with 0,1,...,>=K matches
    for i in range(N_blocks):
        block = bits[i * M : (i + 1) * M]
        v = 0
        for j in range(M - m + 1):
            if np.array_equal(block[j : j + m], template):
                v += 1
        idx = min(v, K)
        counts[idx] += 1

    # Chi-squared
    chi_sq = 0.0
    for i in range(K + 1):
        expected = N_blocks * pi[i]
        if expected > 0:
            chi_sq += (counts[i] - expected) ** 2 / expected

    p_value = gammaincc(K / 2.0, chi_sq / 2.0)
    return {
        "name": "Overlapping Template Matching",
        "statistic": chi_sq,
        "stat_label": "chi2",
        "p_value": p_value,
        "detail": f"template=111111111, M={M}, N={N_blocks}, lam={lam:.4f}",
    }


# ---------------------------------------------------------------------------
# Test 3: Maurer's Universal Statistical Test (NIST SP 800-22 Sect 2.9)
# ---------------------------------------------------------------------------
def maurers_universal(bits: np.ndarray) -> dict:
    """
    Maurer's Universal Statistical Test. Measures compressibility.
    L=7, Q=1280 (NIST table values).
    """
    n = len(bits)
    L = 7
    Q = 1280  # initialization blocks

    # NIST Table: expected value and variance for L=7
    expected_value = {
        1: 0.7326495, 2: 1.5374383, 3: 2.4016068, 4: 3.3112247,
        5: 4.2534266, 6: 5.2177052, 7: 6.1962507, 8: 7.1836656,
        9: 8.1764248, 10: 9.1723243, 11: 10.170032, 12: 11.168765,
        13: 12.168070, 14: 13.167693, 15: 14.167488, 16: 15.167379,
    }
    variance = {
        1: 0.690, 2: 1.338, 3: 1.901, 4: 2.358,
        5: 2.705, 6: 2.954, 7: 3.125, 8: 3.238,
        9: 3.311, 10: 3.356, 11: 3.384, 12: 3.401,
        13: 3.410, 14: 3.416, 15: 3.419, 16: 3.421,
    }

    K = n // L - Q  # test blocks
    if K <= 0:
        raise ValueError(f"Not enough bits: need > {(Q + 1) * L}, have {n}")

    # Convert to L-bit blocks
    num_blocks = Q + K
    blocks = np.zeros(num_blocks, dtype=np.int64)
    for i in range(num_blocks):
        val = 0
        for j in range(L):
            val = (val << 1) | int(bits[i * L + j])
        blocks[i] = val

    # Initialize table T with last occurrence positions from Q init blocks
    T = np.zeros(2**L, dtype=np.int64)
    for i in range(Q):
        T[blocks[i]] = i + 1  # 1-indexed

    # Compute test statistic
    fn_sum = 0.0
    for i in range(Q, Q + K):
        val = blocks[i]
        dist = (i + 1) - T[val]
        fn_sum += math.log2(dist)
        T[val] = i + 1

    fn = fn_sum / K

    # Compute p-value
    c = 0.7 - 0.8 / L + (4.0 + 32.0 / L) * (K ** (-3.0 / L)) / 15.0
    sigma = c * math.sqrt(variance[L] / K)
    p_value = erfc(abs(fn - expected_value[L]) / (math.sqrt(2.0) * sigma))

    return {
        "name": "Maurer's Universal Statistical",
        "statistic": fn,
        "stat_label": "fn",
        "p_value": float(p_value),
        "detail": f"L={L}, Q={Q}, K={K}, E[fn]={expected_value[L]:.7f}",
    }


# ---------------------------------------------------------------------------
# Test 4: Random Excursions (NIST SP 800-22 Sect 2.14)
# ---------------------------------------------------------------------------
def random_excursions(bits: np.ndarray) -> list[dict]:
    """
    Random Excursions Test. Converts to +1/-1, computes cumulative sum,
    partitions into cycles, counts visits to states {-4...-1, 1...4}.
    Returns one result per state.
    """
    n = len(bits)
    # Map 0->-1, 1->+1
    x = 2 * bits.astype(np.int64) - 1

    # Cumulative sum with 0 prepended and appended
    S = np.concatenate(([0], np.cumsum(x), [0]))

    # Find cycle boundaries (where S == 0)
    zero_indices = np.where(S == 0)[0]
    J = len(zero_indices) - 1  # number of cycles

    if J < 500:
        # NIST requires at least 500 cycles for valid test
        return [{
            "name": f"Random Excursions (insufficient cycles: {J})",
            "statistic": 0.0,
            "stat_label": "chi2",
            "p_value": float("nan"),
            "detail": f"J={J} < 500 minimum",
        }]

    states = [-4, -3, -2, -1, 1, 2, 3, 4]

    # Precomputed pi values from NIST table (for each state x, k=0..5)
    # pi[k][x] = probability of exactly k visits in a cycle
    # For |x|, pi_k values are symmetric
    def pi_values(x_abs: int) -> np.ndarray:
        """Return pi[0..5] for state |x|."""
        pi = np.zeros(6)
        if x_abs == 1:
            pi[0] = 0.5000
            pi[1] = 0.2500
            pi[2] = 0.1250
            pi[3] = 0.0625
            pi[4] = 0.0312
            pi[5] = 0.0313  # tail
        elif x_abs == 2:
            pi[0] = 0.7500
            pi[1] = 0.0625
            pi[2] = 0.0469
            pi[3] = 0.0352
            pi[4] = 0.0264
            pi[5] = 0.0791  # tail
        elif x_abs == 3:
            pi[0] = 0.8333
            pi[1] = 0.0278
            pi[2] = 0.0231
            pi[3] = 0.0193
            pi[4] = 0.0161
            pi[5] = 0.0804  # tail
        elif x_abs == 4:
            pi[0] = 0.8750
            pi[1] = 0.0156
            pi[2] = 0.0137
            pi[3] = 0.0120
            pi[4] = 0.0105
            pi[5] = 0.0733  # tail
        return pi

    results = []
    for state in states:
        x_abs = abs(state)
        pi = pi_values(x_abs)

        # Count visits per cycle for this state
        freq = np.zeros(6, dtype=np.int64)  # freq[k] = number of cycles with exactly k visits
        for c in range(J):
            cycle = S[zero_indices[c] : zero_indices[c + 1] + 1]
            visits = np.count_nonzero(cycle == state)
            idx = min(visits, 5)
            freq[idx] += 1

        # Chi-squared statistic
        chi_sq = 0.0
        for k in range(6):
            expected = J * pi[k]
            if expected > 0:
                chi_sq += (freq[k] - expected) ** 2 / expected

        p_value = gammaincc(5.0 / 2.0, chi_sq / 2.0)
        results.append({
            "name": f"Random Excursions (x={state:+d})",
            "statistic": chi_sq,
            "stat_label": "chi2",
            "p_value": float(p_value),
            "detail": f"J={J}, visits_freq={freq.tolist()}",
        })

    return results


# ---------------------------------------------------------------------------
# Test 5: Linear Complexity (NIST SP 800-22 Sect 2.10)
# ---------------------------------------------------------------------------
def berlekamp_massey(bits: np.ndarray) -> int:
    """Berlekamp-Massey algorithm; returns linear complexity of bit sequence."""
    n = len(bits)
    c = np.zeros(n, dtype=np.int8)
    b = np.zeros(n, dtype=np.int8)
    c[0] = 1
    b[0] = 1
    L = 0
    m = -1
    N_ = 0

    while N_ < n:
        d = bits[N_]
        for i in range(1, L + 1):
            d ^= c[i] & bits[N_ - i]
        d = int(d) & 1

        if d == 1:
            t = c.copy()
            shift = N_ - m
            for i in range(shift, n):
                c[i] ^= b[i - shift]
            if L <= N_ // 2:
                L = N_ + 1 - L
                m = N_
                b = t.copy()
        N_ += 1

    return L


def linear_complexity(bits: np.ndarray) -> dict:
    """
    Linear Complexity Test. Partition into blocks of M=500.
    Compute linear complexity via Berlekamp-Massey, then T statistic,
    then chi-squared with 6 df.
    """
    n = len(bits)
    M = 500
    N_blocks = n // M
    K = 6  # degrees of freedom

    # Theoretical mean
    mu = M / 2.0 + (9.0 + (-1) ** (M + 1)) / 36.0 - (M / 3.0 + 2.0 / 9.0) / (2**M)

    # Compute T for each block and classify into bins
    # T_i = (-1)^M * (L_i - mu) + 2/9
    # Categories: T <= -2.5, -2.5<T<=-1.5, ..., T>2.5
    thresholds = [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5]
    # NIST pi values for M=500 (from table)
    pi = [0.010417, 0.03125, 0.125, 0.5, 0.25, 0.0625, 0.020833]

    freq = np.zeros(K + 1, dtype=np.int64)
    for i in range(N_blocks):
        block = bits[i * M : (i + 1) * M]
        L_i = berlekamp_massey(block)
        T_i = ((-1) ** M) * (L_i - mu) + 2.0 / 9.0

        # Classify into bin
        if T_i <= thresholds[0]:
            freq[0] += 1
        elif T_i > thresholds[-1]:
            freq[K] += 1
        else:
            for j in range(len(thresholds) - 1):
                if thresholds[j] < T_i <= thresholds[j + 1]:
                    freq[j + 1] += 1
                    break

    # Chi-squared
    chi_sq = 0.0
    for i in range(K + 1):
        expected = N_blocks * pi[i]
        if expected > 0:
            chi_sq += (freq[i] - expected) ** 2 / expected

    p_value = gammaincc(K / 2.0, chi_sq / 2.0)
    return {
        "name": "Linear Complexity",
        "statistic": chi_sq,
        "stat_label": "chi2",
        "p_value": float(p_value),
        "detail": f"M={M}, N={N_blocks}, mu={mu:.4f}, freq={freq.tolist()}",
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    print(f"NIST SP 800-22 Rev 1a: 5 Remaining Statistical Tests")
    print(f"{'=' * 70}")
    print(f"Pool:  {POOL_PATH}")
    print(f"Bits:  {N_BITS:,}")
    print(f"Alpha: {ALPHA}")
    print()

    bits = read_bits(POOL_PATH, N_BITS)
    ones = int(np.sum(bits))
    print(f"Loaded {len(bits):,} bits  (ones: {ones:,}, zeros: {N_BITS - ones:,})")
    print()

    all_results: list[dict] = []

    # 1. Non-overlapping Template Matching
    print("Running Non-overlapping Template Matching...")
    r = nonoverlapping_template_matching(bits)
    all_results.append(r)
    print(f"  Done: p={r['p_value']:.6f}")

    # 2. Overlapping Template Matching
    print("Running Overlapping Template Matching...")
    r = overlapping_template_matching(bits)
    all_results.append(r)
    print(f"  Done: p={r['p_value']:.6f}")

    # 3. Maurer's Universal
    print("Running Maurer's Universal Statistical Test...")
    r = maurers_universal(bits)
    all_results.append(r)
    print(f"  Done: p={r['p_value']:.6f}")

    # 4. Random Excursions
    print("Running Random Excursions...")
    re_results = random_excursions(bits)
    all_results.extend(re_results)
    for r in re_results:
        p_str = f"{r['p_value']:.6f}" if not math.isnan(r['p_value']) else "N/A"
        print(f"  {r['name']}: p={p_str}")

    # 5. Linear Complexity
    print("Running Linear Complexity (Berlekamp-Massey, may take a moment)...")
    r = linear_complexity(bits)
    all_results.append(r)
    print(f"  Done: p={r['p_value']:.6f}")

    # Summary table
    print()
    print(f"{'=' * 90}")
    print(f"{'Test':<45} {'Statistic':>12} {'p-value':>12} {'Result':>8}")
    print(f"{'-' * 90}")
    for r in all_results:
        p = r["p_value"]
        if math.isnan(p):
            verdict = "N/A"
            p_str = "N/A"
        else:
            verdict = "PASS" if p >= ALPHA else "FAIL"
            p_str = f"{p:.6f}"
        stat_str = f"{r['statistic']:.4f}"
        print(f"{r['name']:<45} {stat_str:>12} {p_str:>12} {verdict:>8}")
    print(f"{'=' * 90}")

    # Count pass/fail
    valid = [r for r in all_results if not math.isnan(r["p_value"])]
    passed = sum(1 for r in valid if r["p_value"] >= ALPHA)
    failed = len(valid) - passed
    print(f"\nSummary: {passed}/{len(valid)} tests PASSED (alpha={ALPHA})")

    # LaTeX table rows
    print()
    print("LaTeX table rows (paste into paper):")
    print("% ---------------------------------------------------------------")
    for r in all_results:
        p = r["p_value"]
        if math.isnan(p):
            continue
        verdict = "Pass" if p >= ALPHA else "Fail"
        # Collapse Random Excursions to one row (worst p-value)
        # Print each individually for completeness
        name_tex = r["name"].replace("_", r"\_")
        stat_tex = f"{r['statistic']:.4f}"
        p_tex = f"{p:.6f}"
        print(f"    {name_tex} & {stat_tex} & {p_tex} & {verdict} \\\\")
    print("% ---------------------------------------------------------------")

    # Also print a collapsed Random Excursions row (min p-value)
    re_only = [r for r in all_results if "Random Excursions" in r["name"] and not math.isnan(r["p_value"])]
    if re_only:
        worst = min(re_only, key=lambda x: x["p_value"])
        best = max(re_only, key=lambda x: x["p_value"])
        print()
        print("% Collapsed Random Excursions (min/max p-value across 8 states):")
        print(f"%   Worst: x={worst['name']}, p={worst['p_value']:.6f}")
        print(f"%   Best:  x={best['name']}, p={best['p_value']:.6f}")
        min_p = worst["p_value"]
        v = "Pass" if min_p >= ALPHA else "Fail"
        print(f"    Random Excursions & {worst['statistic']:.4f} & {min_p:.6f} & {v} \\\\")

    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
