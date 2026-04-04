#!/usr/bin/env python3
"""Run empirical evaluation benchmarks for the quantum anonymization paper.

Measures: runtime per level, entropy consumption, output properties.
Generates: figures/fig7_benchmarks.pdf, figures/fig8_privacy_metric.pdf
"""
import time
import os
import sys
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy import stats

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from zipminator.anonymizer import LevelAnonymizer

# ── Plot style ──
plt.rcParams.update({
    "figure.facecolor": "white",
    "axes.facecolor": "#FAFAFA",
    "axes.edgecolor": "#333333",
    "axes.grid": True,
    "grid.color": "#E0E0E0",
    "grid.alpha": 0.6,
    "font.family": "serif",
    "font.size": 10,
    "savefig.dpi": 300,
    "savefig.bbox": "tight",
})
CYAN, ROSE, AMBER, EMERALD, VIOLET = "#0891B2", "#E11D48", "#D97706", "#059669", "#7C3AED"


def generate_dataset(n_rows: int = 1000) -> pd.DataFrame:
    """Generate a synthetic PII dataset for benchmarking."""
    rng = np.random.default_rng(42)
    first = ["Alice", "Bob", "Carol", "David", "Eve", "Frank", "Grace", "Hank", "Iris", "Jack"]
    last = ["Smith", "Jones", "Williams", "Brown", "Taylor", "Wilson", "Davis", "Clark", "Hall", "Lee"]
    domains = ["example.com", "corp.net", "hospital.org", "school.edu", "lab.io"]
    diagnoses = ["Diabetes", "Hypertension", "Asthma", "Migraine", "Arthritis", "Flu", "COVID", "Anemia"]
    cities = ["Oslo", "Bergen", "Trondheim", "Stavanger", "Tromso", "Drammen", "Kristiansand", "Fredrikstad"]

    names = [f"{rng.choice(first)} {rng.choice(last)}" for _ in range(n_rows)]
    emails = [f"{n.split()[0].lower()}{rng.integers(100, 999)}@{rng.choice(domains)}" for n in names]
    ages = rng.integers(18, 90, size=n_rows).tolist()
    salaries = (rng.normal(75000, 20000, size=n_rows).astype(int)).tolist()
    diag = [rng.choice(diagnoses) for _ in range(n_rows)]
    city = [rng.choice(cities) for _ in range(n_rows)]

    return pd.DataFrame({
        "name": names,
        "email": emails,
        "age": ages,
        "salary": salaries,
        "diagnosis": diag,
        "city": city,
    })


def benchmark_levels(df: pd.DataFrame, n_runs: int = 30):
    """Benchmark all 10 levels, return timing and property data."""
    results = []
    for level in range(1, 11):
        times = []
        for run in range(n_runs):
            anon = LevelAnonymizer()
            df_copy = df.copy()
            t0 = time.perf_counter()
            out = anon.apply(df_copy, level=level)
            t1 = time.perf_counter()
            times.append((t1 - t0) * 1000)  # ms

        # 95% CI using Student's t-distribution
        ci_lo, ci_hi = stats.t.interval(
            0.95, len(times) - 1,
            loc=np.mean(times), scale=stats.sem(times),
        )

        # Measure properties on last run
        anon = LevelAnonymizer()
        df_copy = df.copy()
        out = anon.apply(df_copy, level=level)

        # Count how many values changed
        changed = 0
        total = 0
        for col in df.columns:
            for i in range(len(df)):
                total += 1
                if str(out[col].iloc[i]) != str(df[col].iloc[i]):
                    changed += 1

        # Unique values in output vs input
        input_unique = sum(df[col].nunique() for col in df.columns)
        output_unique = sum(out[col].nunique() for col in out.columns)

        results.append({
            "level": level,
            "mean_ms": np.mean(times),
            "std_ms": np.std(times),
            "ci_lo": ci_lo,
            "ci_hi": ci_hi,
            "min_ms": np.min(times),
            "max_ms": np.max(times),
            "pct_changed": changed / total * 100,
            "input_unique": input_unique,
            "output_unique": output_unique,
        })
        print(
            f"  L{level:2d}: {np.mean(times):8.1f} ms [{ci_lo:.1f}, {ci_hi:.1f}]  |"
            f"  {changed/total*100:5.1f}% changed  |  unique: {input_unique} -> {output_unique}"
        )

    return results


def benchmark_scaling(levels=(1, 5, 8, 10)):
    """Benchmark L1, L5, L8, L10 across different dataset sizes."""
    sizes = [100, 500, 1000, 5000]
    results = []
    for size in sizes:
        df = generate_dataset(size)
        for level in levels:
            anon = LevelAnonymizer()
            df_copy = df.copy()
            t0 = time.perf_counter()
            anon.apply(df_copy, level=level)
            t1 = time.perf_counter()
            results.append({
                "rows": size,
                "level": level,
                "ms": (t1 - t0) * 1000,
            })
            print(f"  {size:5d} rows x L{level}: {(t1-t0)*1000:.1f} ms")
    return results


def plot_runtime_bars(results):
    """Fig 7: Runtime per anonymization level."""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))

    levels = [r["level"] for r in results]
    means = [r["mean_ms"] for r in results]
    stds = [r["std_ms"] for r in results]
    colors = [CYAN if l < 7 else (AMBER if l < 10 else ROSE) for l in levels]

    ax1.bar([f"L{l}" for l in levels], means, yerr=stds, color=colors,
            edgecolor="white", linewidth=0.5, capsize=3, alpha=0.85)
    ax1.set_ylabel("Runtime (ms)", fontsize=10)
    ax1.set_xlabel("Anonymization Level", fontsize=10)
    ax1.set_title("Runtime per Level (1000 rows, 6 columns)", fontsize=11, pad=10)
    ax1.spines["top"].set_visible(False)
    ax1.spines["right"].set_visible(False)

    # Pct changed
    pcts = [r["pct_changed"] for r in results]
    ax2.bar([f"L{l}" for l in levels], pcts, color=colors,
            edgecolor="white", linewidth=0.5, alpha=0.85)
    ax2.set_ylabel("Values Changed (%)", fontsize=10)
    ax2.set_xlabel("Anonymization Level", fontsize=10)
    ax2.set_title("Data Transformation Rate", fontsize=11, pad=10)
    ax2.set_ylim(0, 110)
    ax2.spines["top"].set_visible(False)
    ax2.spines["right"].set_visible(False)

    plt.tight_layout()
    fig.savefig("figures/fig7_benchmarks.pdf")
    plt.close()
    print("  fig7_benchmarks.pdf")


def plot_scaling(scaling_results):
    """Fig 8: Runtime scaling across dataset sizes."""
    fig, ax = plt.subplots(figsize=(5.5, 3.5))

    level_colors = {1: CYAN, 5: AMBER, 8: VIOLET, 10: ROSE}
    level_markers = {1: "o", 5: "s", 8: "^", 10: "D"}

    for level in [1, 5, 8, 10]:
        data = [r for r in scaling_results if r["level"] == level]
        rows = [r["rows"] for r in data]
        ms = [r["ms"] for r in data]
        ax.plot(rows, ms, marker=level_markers[level], color=level_colors[level],
                linewidth=1.5, markersize=5, label=f"L{level}")

    ax.set_xlabel("Dataset Rows", fontsize=10)
    ax.set_ylabel("Runtime (ms)", fontsize=10)
    ax.set_title("Anonymization Scaling by Dataset Size", fontsize=11, pad=10)
    ax.legend(fontsize=9)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    plt.tight_layout()
    fig.savefig("figures/fig8_scaling.pdf")
    plt.close()
    print("  fig8_scaling.pdf")


if __name__ == "__main__":
    os.makedirs("figures", exist_ok=True)

    print("Generating dataset (1000 rows)...")
    df = generate_dataset(1000)
    print(f"  Shape: {df.shape}, Columns: {list(df.columns)}")

    print("\nBenchmarking all 10 levels (30 runs each)...")
    results = benchmark_levels(df, n_runs=30)

    print("\nBenchmarking scaling (L1, L5, L8, L10)...")
    scaling = benchmark_scaling()

    print("\nGenerating figures...")
    plot_runtime_bars(results)
    plot_scaling(scaling)

    # Print summary table for paper
    print("\n=== PAPER TABLE: Empirical Evaluation (n=30) ===")
    print(
        f"{'Level':>5} {'Mean (ms)':>10} {'95% CI lower':>13} {'95% CI upper':>13}"
        f" {'Changed%':>9} {'Unique Out':>11}"
    )
    print("-" * 70)
    for r in results:
        print(
            f"  L{r['level']:<3} {r['mean_ms']:>9.1f} {r['ci_lo']:>13.1f} {r['ci_hi']:>13.1f}"
            f" {r['pct_changed']:>8.1f}% {r['output_unique']:>11}"
        )
    print("\nDone.")
