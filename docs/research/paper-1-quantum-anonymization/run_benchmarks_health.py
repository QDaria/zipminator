#!/usr/bin/env python3
"""Benchmark anonymizer levels on UCI Heart Disease dataset.

Downloads the UCI Heart Disease (Cleveland) dataset (303 records, 14 attributes)
and runs anonymizer levels L1, L2, L4, L5, L8, L10. Measures timing (30 runs,
mean + 95% CI), unique output values, and changed-cell percentage.

This supplements the UCI Adult benchmark (Table 8) with a second dataset from
the medical/health domain to demonstrate generalisability across data types
and sizes. PoPETs reviewers expect dataset diversity.

Dataset: https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/
"""

import logging
import os
import sys
import time
import urllib.request

import numpy as np
import pandas as pd
from scipy import stats

# Suppress noisy entropy pool exhaustion warnings during benchmarking.
# The pool falls back to os.urandom which is fine for timing/property tests.
logging.getLogger("zipminator.entropy").setLevel(logging.CRITICAL)
logging.getLogger("zipminator.entropy.pool_provider").setLevel(logging.CRITICAL)
logging.getLogger("zipminator").setLevel(logging.CRITICAL)

# Ensure the project root is on sys.path so we can import zipminator
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from zipminator.anonymizer import LevelAnonymizer

# ── UCI Heart Disease (Cleveland) dataset ──

HEART_URL = (
    "https://archive.ics.uci.edu/ml/machine-learning-databases/"
    "heart-disease/processed.cleveland.data"
)
HEART_COLUMNS = [
    "age", "sex", "cp", "trestbps", "chol", "fbs", "restecg",
    "thalach", "exang", "oldpeak", "slope", "ca", "thal", "num",
]
CACHE_PATH = os.path.join(os.path.dirname(__file__), "processed.cleveland.data")


def download_heart() -> pd.DataFrame:
    """Download and parse the UCI Heart Disease (Cleveland) dataset. Caches locally."""
    if not os.path.exists(CACHE_PATH):
        print(f"Downloading UCI Heart Disease dataset from {HEART_URL} ...")
        urllib.request.urlretrieve(HEART_URL, CACHE_PATH)
        print(f"  Saved to {CACHE_PATH}")
    else:
        print(f"Using cached {CACHE_PATH}")

    df = pd.read_csv(
        CACHE_PATH,
        header=None,
        names=HEART_COLUMNS,
        na_values="?",
        skipinitialspace=True,
    )
    # Drop rows with missing values (6 rows have '?' in ca/thal)
    df = df.dropna().reset_index(drop=True)
    return df


def count_unique(df: pd.DataFrame) -> int:
    """Sum of nunique() across all columns."""
    return sum(df[col].nunique() for col in df.columns)


def count_changed(original: pd.DataFrame, result: pd.DataFrame) -> float:
    """Fraction of cells that changed (0.0 - 1.0)."""
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
    df: pd.DataFrame, level: int, n_runs: int = 30, **kwargs
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

    # 95% CI using Student's t-distribution
    ci_lo, ci_hi = stats.t.interval(
        0.95, len(times) - 1,
        loc=np.mean(times), scale=stats.sem(times),
    )

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
        "ci_lo": ci_lo,
        "ci_hi": ci_hi,
        "unique_out": unique_out,
        "pct_changed": pct_changed,
    }


def main():
    print("=" * 70)
    print("UCI Heart Disease Benchmark (Cleveland, 14 attributes)")
    print("=" * 70)

    # 1. Load dataset
    df = download_heart()
    print(f"\nDataset: {len(df)} rows, {len(df.columns)} columns")
    print(f"Columns: {list(df.columns)}")
    input_unique = count_unique(df)
    print(f"Total unique values (input): {input_unique:,}")

    # 2. Run benchmarks
    levels = [1, 2, 4, 5, 8, 10]
    n_runs = 30
    results = []

    print(f"\nBenchmarking levels {levels} ({n_runs} runs each)...")
    print("-" * 70)

    for level in levels:
        label = LevelAnonymizer.LEVEL_NAMES.get(level, f"Level {level}")
        print(f"  Running L{level} ({label})...", end=" ", flush=True)
        r = benchmark_level(df, level, n_runs=n_runs)
        results.append(r)
        print(
            f"{r['mean_ms']:,.1f} ms [{r['ci_lo']:.1f}, {r['ci_hi']:.1f}] | "
            f"unique: {r['unique_out']:,} | "
            f"changed: {r['pct_changed']:.0f}%"
        )

    # 3. Print results table
    print("\n" + "=" * 90)
    print(f"RESULTS -- UCI Heart Disease ({len(df)} rows, {len(df.columns)} cols)")
    print(f"n={n_runs} runs, 95% CI via Student's t")
    print("=" * 90)
    print(
        f"{'Level':>5}  {'Technique':<28} "
        f"{'Mean(ms)':>9} {'95% CI':>19} "
        f"{'Unique':>7} "
        f"{'Changed':>8}"
    )
    print("-" * 90)

    for r in results:
        lvl = r["level"]
        technique = LevelAnonymizer.LEVEL_NAMES.get(lvl, f"Level {lvl}")
        ci_str = f"[{r['ci_lo']:.1f}, {r['ci_hi']:.1f}]"
        print(
            f"  L{lvl:<3} {technique:<28} "
            f"{r['mean_ms']:>8,.1f} {ci_str:>19} "
            f"{r['unique_out']:>7,} "
            f"{r['pct_changed']:>7.0f}%"
        )

    # 4. LaTeX table output
    print("\n" + "=" * 90)
    print("LaTeX TABLE (copy into paper)")
    print("=" * 90)
    print(r"\begin{table}[t]")
    print(r"  \centering")
    print(r"  \caption{Anonymization performance on UCI Heart Disease "
          r"(Cleveland, $n{=}%d$, 14~attributes, 30~runs, 95\%% CI).}" % len(df))
    print(r"  \label{tab:heart-benchmark}")
    print(r"  \small")
    print(r"  \begin{tabular}{@{}clrrr@{}}")
    print(r"    \toprule")
    print(r"    Level & Technique & Time (ms) & Unique & Changed \\")
    print(r"    \midrule")
    for r in results:
        lvl = r["level"]
        technique = LevelAnonymizer.LEVEL_NAMES.get(lvl, f"Level {lvl}")
        # Shorten technique names for table
        short = {
            "Regex Masking": "Regex masking",
            "SHA-3 Deterministic Hashing": "SHA-3 hashing",
            "Tokenization (reversible)": "Tokenization",
            "K-Anonymity": "$k$-anonymity",
            "Differential Privacy (Laplace)": "Differential privacy",
            "QRNG-OTP-Destroy (irreversible)": "QRNG-OTP-Destroy",
        }.get(technique, technique)
        ci_str = f"$[{r['ci_lo']:.1f},\\;{r['ci_hi']:.1f}]$"
        print(
            f"    L{lvl} & {short} & "
            f"{r['mean_ms']:.1f} {ci_str} & "
            f"{r['unique_out']:,} & "
            f"{r['pct_changed']:.0f}\\% \\\\"
        )
    print(r"    \bottomrule")
    print(r"  \end{tabular}")
    print(r"\end{table}")

    # 5. Non-reproducibility test for L10
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

    # 6. Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"  Dataset: UCI Heart Disease (Cleveland)")
    print(f"  Records: {len(df)} (after dropping {303 - len(df)} rows with missing values)")
    print(f"  Attributes: {len(df.columns)}")
    print(f"  Domain: Medical/health (cardiac diagnosis)")
    print(f"  Levels benchmarked: {[r['level'] for r in results]}")
    print(f"  Runs per level: {n_runs}")
    print(f"  Non-reproducibility (L10): {'PASS' if not identical else 'FAIL'}")
    print("\nDone.")


if __name__ == "__main__":
    main()
