#!/usr/bin/env python3
"""Reproduce Table 8 (UCI Adult benchmark) from the PoPETs paper.

Downloads the UCI Adult dataset (32,561 records, 15 attributes) and runs
anonymizer levels L1, L2, L4, L5, L8, L10. Measures timing (5 runs,
mean + std), unique output values, and changed-cell percentage.

Reference values from main.tex lines 710-718:
  L1   Regex masking         164 ms   22,134 unique   60%
  L2   SHA-3 hashing         407 ms   22,146 unique  100%
  L4   Tokenization          731 ms   22,146 unique  100%
  L5   k-anonymity         2,309 ms      111 unique   40%
  L8   Differential privacy 10,392 ms 195,470 unique  100%
  L10  QRNG-OTP-Destroy     1,303 ms   22,146 unique  100%
"""

import os
import sys
import time
import urllib.request

import numpy as np
import pandas as pd

# Ensure the project root is on sys.path so we can import zipminator
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from zipminator.anonymizer import LevelAnonymizer

# ── UCI Adult dataset ──

ADULT_URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/adult/adult.data"
ADULT_COLUMNS = [
    "age", "workclass", "fnlwgt", "education", "education_num",
    "marital_status", "occupation", "relationship", "race", "sex",
    "capital_gain", "capital_loss", "hours_per_week", "native_country",
    "income",
]
CACHE_PATH = os.path.join(os.path.dirname(__file__), "adult.data")


def download_adult() -> pd.DataFrame:
    """Download and parse the UCI Adult dataset. Caches locally."""
    if not os.path.exists(CACHE_PATH):
        print(f"Downloading UCI Adult dataset from {ADULT_URL} ...")
        urllib.request.urlretrieve(ADULT_URL, CACHE_PATH)
        print(f"  Saved to {CACHE_PATH}")
    else:
        print(f"Using cached {CACHE_PATH}")

    df = pd.read_csv(
        CACHE_PATH,
        header=None,
        names=ADULT_COLUMNS,
        na_values=" ?",
        skipinitialspace=True,
    )
    # Drop rows with NaN (mirrors standard preprocessing)
    df = df.dropna().reset_index(drop=True)
    return df


def count_unique(df: pd.DataFrame) -> int:
    """Sum of nunique() across all columns."""
    return sum(df[col].nunique() for col in df.columns)


def count_changed(original: pd.DataFrame, result: pd.DataFrame) -> float:
    """Fraction of cells that changed (0.0 - 1.0)."""
    # Only compare columns that exist in both
    cols = [c for c in original.columns if c in result.columns]
    changed = 0
    total = 0
    for col in cols:
        for i in range(len(original)):
            total += 1
            if str(result[col].iloc[i]) != str(original[col].iloc[i]):
                changed += 1
    return changed / total if total > 0 else 0.0


def benchmark_level(
    df: pd.DataFrame, level: int, n_runs: int = 5, **kwargs
) -> dict:
    """Benchmark a single level: timing, unique count, changed %."""
    times = []
    for _ in range(n_runs):
        anon = LevelAnonymizer()
        df_copy = df.copy()
        t0 = time.perf_counter()
        _out = anon.apply(df_copy, level=level, **kwargs)
        t1 = time.perf_counter()
        times.append((t1 - t0) * 1000)

    # Final run for property measurement
    anon = LevelAnonymizer()
    df_copy = df.copy()
    out = anon.apply(df_copy, level=level, **kwargs)

    unique_out = count_unique(out)
    pct_changed = count_changed(df, out) * 100

    return {
        "level": level,
        "mean_ms": np.mean(times),
        "std_ms": np.std(times),
        "unique_out": unique_out,
        "pct_changed": pct_changed,
    }


# ── Paper reference values ──

PAPER_TABLE_8 = {
    1:  {"technique": "Regex masking",        "time_ms": 164,    "unique_out": 22134, "changed_pct": 60},
    2:  {"technique": "SHA-3 hashing",        "time_ms": 407,    "unique_out": 22146, "changed_pct": 100},
    4:  {"technique": "Tokenization",         "time_ms": 731,    "unique_out": 22146, "changed_pct": 100},
    5:  {"technique": "k-anonymity",          "time_ms": 2309,   "unique_out": 111,   "changed_pct": 40},
    8:  {"technique": "Differential privacy", "time_ms": 10392,  "unique_out": 195470,"changed_pct": 100},
    10: {"technique": "QRNG-OTP-Destroy",     "time_ms": 1303,   "unique_out": 22146, "changed_pct": 100},
}


def main():
    print("=" * 70)
    print("UCI Adult Benchmark — Reproducing Table 8 from PoPETs paper")
    print("=" * 70)

    # 1. Load dataset
    df = download_adult()
    print(f"\nDataset: {len(df)} rows, {len(df.columns)} columns")
    print(f"Columns: {list(df.columns)}")
    input_unique = count_unique(df)
    print(f"Total unique values (input): {input_unique:,}")

    # 2. Run benchmarks
    levels = [1, 2, 4, 5, 8, 10]
    n_runs = 5
    results = []

    print(f"\nBenchmarking levels {levels} ({n_runs} runs each)...")
    print("-" * 70)

    for level in levels:
        label = LevelAnonymizer.LEVEL_NAMES.get(level, f"Level {level}")
        print(f"  Running L{level} ({label})...", end=" ", flush=True)
        r = benchmark_level(df, level, n_runs=n_runs)
        results.append(r)
        print(
            f"{r['mean_ms']:,.0f} ms (std {r['std_ms']:.0f}) | "
            f"unique: {r['unique_out']:,} | "
            f"changed: {r['pct_changed']:.0f}%"
        )

    # 3. Print comparison table
    print("\n" + "=" * 70)
    print("RESULTS vs. PAPER (Table 8)")
    print("=" * 70)
    print(
        f"{'Level':>5}  {'Technique':<22} "
        f"{'Time(ms)':>9} {'Paper':>7} "
        f"{'Unique':>9} {'Paper':>9} "
        f"{'Chg%':>5} {'Paper':>5}"
    )
    print("-" * 85)

    for r in results:
        lvl = r["level"]
        ref = PAPER_TABLE_8[lvl]
        # Flags for match/mismatch
        unique_match = "OK" if abs(r["unique_out"] - ref["unique_out"]) / max(ref["unique_out"], 1) < 0.05 else "DIFF"
        changed_match = "OK" if abs(r["pct_changed"] - ref["changed_pct"]) < 5 else "DIFF"

        print(
            f"  L{lvl:<3} {ref['technique']:<22} "
            f"{r['mean_ms']:>8,.0f} {ref['time_ms']:>7,} "
            f"{r['unique_out']:>9,} {ref['unique_out']:>9,} [{unique_match}] "
            f"{r['pct_changed']:>4.0f}% {ref['changed_pct']:>4}% [{changed_match}]"
        )

    # 4. Non-reproducibility test for L10
    print("\n" + "=" * 70)
    print("NON-REPRODUCIBILITY TEST (L10 should differ each run)")
    print("=" * 70)
    anon1 = LevelAnonymizer()
    anon2 = LevelAnonymizer()
    small = df.head(5).copy()
    out1 = anon1.apply(small.copy(), level=10)
    out2 = anon2.apply(small.copy(), level=10)
    identical = out1.equals(out2)
    print(f"  Two L10 runs on same 5 rows produce identical output: {identical}")
    if not identical:
        print("  PASS: L10 is non-reproducible (OTP mapping destroyed)")
    else:
        print("  FAIL: L10 produced identical output (unexpected)")

    # 5. Summary checklist
    print("\n" + "=" * 70)
    print("CHECKLIST")
    print("=" * 70)
    print(f"  [{'x' if len(df) >= 30000 else ' '}] UCI Adult downloaded ({len(df):,} records)")
    all_ran = len(results) == len(levels)
    print(f"  [{'x' if all_ran else ' '}] Anonymizer levels L1,L2,L4,L5,L8,L10 run successfully")
    print(f"  [x] Timing recorded ({n_runs} runs each)")

    unique_ok = all(
        abs(r["unique_out"] - PAPER_TABLE_8[r["level"]]["unique_out"])
        / max(PAPER_TABLE_8[r["level"]]["unique_out"], 1)
        < 0.10
        for r in results
    )
    print(f"  [{'x' if unique_ok else ' '}] Unique-out counts match Table 8 (within 10%)")

    changed_ok = all(
        abs(r["pct_changed"] - PAPER_TABLE_8[r["level"]]["changed_pct"]) < 10
        for r in results
    )
    print(f"  [{'x' if changed_ok else ' '}] Changed% matches Table 8 (within 10pp)")
    print(f"  [x] Script saved to docs/research/paper/run_benchmarks_adult.py")
    print(f"  [{'x' if not identical else ' '}] Non-reproducibility verified (L10 differs each run)")

    print("\nDone.")


if __name__ == "__main__":
    main()
