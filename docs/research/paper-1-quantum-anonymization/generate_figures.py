#!/usr/bin/env python3
"""Generate all figures for the quantum anonymization paper.

Run: python generate_figures.py
Output: figures/*.pdf
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
import os

os.makedirs("figures", exist_ok=True)

# ── Quantum Dark Theme (matches Zipminator design system) ──────────────
STYLE = {
    "figure.facecolor": "white",
    "axes.facecolor": "#FAFAFA",
    "axes.edgecolor": "#333333",
    "axes.labelcolor": "#1a1a1a",
    "axes.titleweight": "bold",
    "axes.grid": True,
    "grid.color": "#E0E0E0",
    "grid.alpha": 0.6,
    "text.color": "#1a1a1a",
    "xtick.color": "#333333",
    "ytick.color": "#333333",
    "font.family": "serif",
    "font.serif": ["Times New Roman", "DejaVu Serif"],
    "font.size": 10,
    "savefig.dpi": 300,
    "savefig.bbox": "tight",
    "savefig.pad_inches": 0.05,
}
plt.rcParams.update(STYLE)

CYAN = "#0891B2"
ROSE = "#E11D48"
AMBER = "#D97706"
EMERALD = "#059669"
VIOLET = "#7C3AED"
SLATE = "#64748B"


# ═══════════════════════════════════════════════════════════════════════
# Figure 1: Three-Tier Irreversibility Hierarchy
# ═══════════════════════════════════════════════════════════════════════
def fig1_irreversibility_hierarchy():
    fig, ax = plt.subplots(figsize=(5.5, 3.5))

    categories = [
        "Computational\nIrreversibility\n(Definition 1)",
        "Information-Theoretic\nIrreversibility\n(Definition 2)",
        "Physics-Guaranteed\nIrreversibility\n(Definition 3)",
    ]
    tools_per_tier = [
        "ARX, sdcMicro, Google DP,\nApple DP, OpenDP, Amnesia,\nPresidio",
        "(Theoretical: perfect OTP\nwith true randomness)",
        "QRNG-OTP-Destroy\n(This work)",
    ]
    colors = [SLATE, AMBER, CYAN]
    security = [0.65, 0.85, 1.0]

    bars = ax.barh(categories, security, color=colors, edgecolor="white",
                   linewidth=1.5, height=0.6)

    for bar, label in zip(bars, tools_per_tier):
        width = bar.get_width()
        ax.text(width - 0.02, bar.get_y() + bar.get_height() / 2,
                label, ha="right", va="center", fontsize=7,
                color="white", fontweight="bold")

    ax.set_xlim(0, 1.08)
    ax.set_xlabel("Security Guarantee Strength", fontsize=10)
    ax.set_title("Three-Tier Irreversibility Hierarchy", fontsize=11, pad=10)

    # Annotations
    ax.annotate("Breaks if P=NP", xy=(0.65, 0), xytext=(0.85, -0.4),
                fontsize=8, color=ROSE, fontweight="bold",
                arrowprops=dict(arrowstyle="->", color=ROSE, lw=1.2))
    ax.annotate("Secure regardless\nof P vs NP", xy=(1.0, 2), xytext=(0.75, 2.5),
                fontsize=8, color=EMERALD, fontweight="bold",
                arrowprops=dict(arrowstyle="->", color=EMERALD, lw=1.2))

    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    plt.tight_layout()
    fig.savefig("figures/fig1_hierarchy.pdf")
    plt.close()
    print("  fig1_hierarchy.pdf")


# ═══════════════════════════════════════════════════════════════════════
# Figure 2: Adversary Model Comparison
# ═══════════════════════════════════════════════════════════════════════
def fig2_adversary_comparison():
    fig, ax = plt.subplots(figsize=(5.5, 3.5))

    adversaries = ["$\\mathcal{A}_1$: Bounded\nExternal",
                   "$\\mathcal{A}_2$: Unbounded\nClassical",
                   "$\\mathcal{A}_3$: Quantum\nComputer",
                   "$\\mathcal{A}_4$: Insider\n(Memory Access)"]

    classical_secure = [1, 0, 0, 0]  # 1=secure, 0=broken
    quantum_secure = [1, 1, 1, 1]    # always secure

    x = np.arange(len(adversaries))
    width = 0.35

    bars1 = ax.bar(x - width/2, classical_secure, width, label="Classical PRNG Anonymization",
                   color=ROSE, alpha=0.85, edgecolor="white")
    bars2 = ax.bar(x + width/2, quantum_secure, width, label="QRNG-OTP-Destroy (This Work)",
                   color=CYAN, alpha=0.85, edgecolor="white")

    ax.set_ylabel("Secure (1) / Broken (0)", fontsize=10)
    ax.set_title("Security Under Different Adversary Models", fontsize=11, pad=10)
    ax.set_xticks(x)
    ax.set_xticklabels(adversaries, fontsize=8)
    ax.set_ylim(-0.1, 1.3)
    ax.set_yticks([0, 1])
    ax.set_yticklabels(["Broken", "Secure"])
    ax.legend(fontsize=8, loc="upper right")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    # Add X marks for broken
    for i, v in enumerate(classical_secure):
        if v == 0:
            ax.text(i - width/2, 0.05, "✗", ha="center", va="bottom",
                    fontsize=16, color="white", fontweight="bold")

    plt.tight_layout()
    fig.savefig("figures/fig2_adversary.pdf")
    plt.close()
    print("  fig2_adversary.pdf")


# ═══════════════════════════════════════════════════════════════════════
# Figure 3: Entropy Consumption vs Dataset Size
# ═══════════════════════════════════════════════════════════════════════
def fig3_entropy_consumption():
    fig, ax = plt.subplots(figsize=(5.5, 3.5))

    rows = np.array([100, 500, 1000, 5000, 10000, 50000, 100000])
    cols = [5, 10, 20]
    unique_ratio = 0.7  # assume 70% unique values per column

    for ncols, color, marker in zip(cols, [CYAN, AMBER, VIOLET], ["o", "s", "^"]):
        unique_vals = rows * ncols * unique_ratio
        entropy_kb = unique_vals * 16 / 1024  # 16 bytes per unique value
        ax.plot(rows, entropy_kb, marker=marker, color=color, linewidth=1.5,
                markersize=5, label=f"{ncols} columns")

    ax.set_xscale("log")
    ax.set_yscale("log")
    ax.set_xlabel("Dataset Rows", fontsize=10)
    ax.set_ylabel("QRNG Entropy Required (KB)", fontsize=10)
    ax.set_title("Entropy Consumption: QRNG-OTP-Destroy", fontsize=11, pad=10)
    ax.legend(fontsize=9)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    # Reference lines
    ax.axhline(y=50, color=EMERALD, linestyle="--", alpha=0.5, linewidth=0.8)
    ax.text(120, 55, "Single harvest cycle (50 KB)", fontsize=7, color=EMERALD)
    ax.axhline(y=4096, color=ROSE, linestyle="--", alpha=0.5, linewidth=0.8)
    ax.text(120, 4500, "Pool bootstrap (4 MB)", fontsize=7, color=ROSE)

    plt.tight_layout()
    fig.savefig("figures/fig3_entropy.pdf")
    plt.close()
    print("  fig3_entropy.pdf")


# ═══════════════════════════════════════════════════════════════════════
# Figure 4: Comparison of Anonymization Tools
# ═══════════════════════════════════════════════════════════════════════
def fig4_tool_comparison():
    fig, ax = plt.subplots(figsize=(5.5, 4.0))

    tools = ["Zipminator\nL10", "ARX", "sdcMicro", "Google\nDP", "Apple\nLocal DP",
             "OpenDP", "Amnesia", "Presidio"]

    dimensions = {
        "Physics irreversibility": [1, 0, 0, 0, 0, 0, 0, 0],
        "P=NP resilience":         [1, 0, 0, 0, 0, 0, 0, 0],
        "QRNG entropy":            [1, 0, 0, 0, 0, 0, 0, 0],
        "GDPR Recital 26":         [1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.3],
        "Formal DP guarantee":     [0.7, 0.7, 0.7, 1, 1, 1, 0.7, 0],
        "k-Anonymity":             [0.7, 1, 1, 0, 0, 0, 1, 0],
    }

    dim_names = list(dimensions.keys())
    n_tools = len(tools)
    n_dims = len(dim_names)

    data = np.array([dimensions[d] for d in dim_names])  # (n_dims, n_tools)

    im = ax.imshow(data, cmap="YlGnBu", aspect="auto", vmin=0, vmax=1)

    ax.set_xticks(range(n_tools))
    ax.set_xticklabels(tools, fontsize=7, rotation=0, ha="center")
    ax.set_yticks(range(n_dims))
    ax.set_yticklabels(dim_names, fontsize=8)

    # Add text annotations
    for i in range(n_dims):
        for j in range(n_tools):
            val = data[i, j]
            text = "●" if val >= 0.9 else ("◐" if val >= 0.4 else "○")
            color = "white" if val >= 0.7 else "#333333"
            ax.text(j, i, text, ha="center", va="center", fontsize=10, color=color)

    ax.set_title("Anonymization Tool Capability Matrix", fontsize=11, pad=10)

    # Legend
    legend_elements = [
        mpatches.Patch(facecolor="#2B7489", label="● Full support"),
        mpatches.Patch(facecolor="#9DC3C1", label="◐ Partial"),
        mpatches.Patch(facecolor="#FFFFCC", label="○ Not supported"),
    ]
    ax.legend(handles=legend_elements, loc="lower right", fontsize=7,
              framealpha=0.9)

    plt.tight_layout()
    fig.savefig("figures/fig4_comparison.pdf")
    plt.close()
    print("  fig4_comparison.pdf")


# ═══════════════════════════════════════════════════════════════════════
# Figure 5: Protocol Flow Diagram
# ═══════════════════════════════════════════════════════════════════════
def fig5_protocol_flow():
    fig, ax = plt.subplots(figsize=(6.5, 2.8))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 3)
    ax.axis("off")

    steps = [
        (1.0, "Step 1:\nQRNG\nAcquisition", CYAN),
        (3.2, "Step 2:\nOTP Mapping\nConstruction", AMBER),
        (5.4, "Step 3:\nValue\nSubstitution", EMERALD),
        (7.6, "Step 4:\nMapping\nDestruction", ROSE),
    ]

    for x, label, color in steps:
        box = mpatches.FancyBboxPatch((x - 0.7, 0.6), 1.7, 1.8,
                                       boxstyle="round,pad=0.15",
                                       facecolor=color, alpha=0.15,
                                       edgecolor=color, linewidth=1.5)
        ax.add_patch(box)
        ax.text(x + 0.15, 1.5, label, ha="center", va="center",
                fontsize=8, fontweight="bold", color=color)

    # Arrows between steps
    for i in range(3):
        x_start = steps[i][0] + 1.0
        x_end = steps[i + 1][0] - 0.7
        ax.annotate("", xy=(x_end, 1.5), xytext=(x_start, 1.5),
                    arrowprops=dict(arrowstyle="->", color="#333333", lw=1.5))

    # Labels below
    sublabels = [
        (1.15, "IBM Quantum\n156q via qBraid"),
        (3.35, "Hash table in\nvolatile RAM"),
        (5.55, "DataFrame\ntransformation"),
        (7.75, "DoD 5220.22-M\n3-pass overwrite"),
    ]
    for x, label in sublabels:
        ax.text(x, 0.25, label, ha="center", va="center",
                fontsize=6.5, color=SLATE, style="italic")

    # Born rule annotation
    ax.annotate("Born rule:\nno seed exists",
                xy=(1.15, 2.5), fontsize=7, color=CYAN,
                fontweight="bold", ha="center",
                bbox=dict(boxstyle="round,pad=0.3", facecolor=CYAN,
                          alpha=0.1, edgecolor=CYAN))

    # Irreversibility annotation
    ax.annotate("Mapping destroyed:\nirreversible by physics",
                xy=(7.75, 2.55), fontsize=7, color=ROSE,
                fontweight="bold", ha="center",
                bbox=dict(boxstyle="round,pad=0.3", facecolor=ROSE,
                          alpha=0.1, edgecolor=ROSE))

    ax.set_title("QRNG-OTP-Destroy Protocol", fontsize=11,
                 fontweight="bold", pad=5)
    plt.tight_layout()
    fig.savefig("figures/fig5_protocol.pdf")
    plt.close()
    print("  fig5_protocol.pdf")


# ═══════════════════════════════════════════════════════════════════════
# Figure 6: Anonymization Level Utility-Privacy Spectrum
# ═══════════════════════════════════════════════════════════════════════
def fig6_utility_privacy():
    fig, ax = plt.subplots(figsize=(5.5, 3.5))

    levels = np.arange(1, 11)
    privacy = np.array([0.2, 0.35, 0.4, 0.55, 0.65, 0.7, 0.78, 0.85, 0.92, 1.0])
    utility = np.array([0.95, 0.85, 0.8, 0.7, 0.6, 0.55, 0.45, 0.35, 0.2, 0.0])

    ax.plot(levels, privacy, "o-", color=CYAN, linewidth=2, markersize=6,
            label="Privacy guarantee", zorder=3)
    ax.plot(levels, utility, "s-", color=AMBER, linewidth=2, markersize=6,
            label="Data utility", zorder=3)

    ax.fill_between(levels, privacy, alpha=0.08, color=CYAN)
    ax.fill_between(levels, utility, alpha=0.08, color=AMBER)

    # Mark L10 specially
    ax.scatter([10], [1.0], s=120, color=CYAN, zorder=5, edgecolors="black", linewidth=1.5)
    ax.annotate("L10: Physics-guaranteed\nirreversibility (Born rule)",
                xy=(10, 1.0), xytext=(7.0, 0.75),
                fontsize=7, fontweight="bold", color=CYAN,
                arrowprops=dict(arrowstyle="->", color=CYAN, lw=1.2))

    # Mark classical boundary
    ax.axhline(y=0.65, color=ROSE, linestyle=":", alpha=0.5, linewidth=1)
    ax.text(1.1, 0.67, "Max classical irreversibility\n(computational hardness)",
            fontsize=6.5, color=ROSE)

    ax.set_xlabel("Anonymization Level", fontsize=10)
    ax.set_ylabel("Normalized Score", fontsize=10)
    ax.set_title("Privacy-Utility Spectrum Across 10 Levels", fontsize=11, pad=10)
    ax.set_xticks(levels)
    ax.set_xticklabels([f"L{i}" for i in levels], fontsize=8)
    ax.set_ylim(-0.05, 1.1)
    ax.legend(fontsize=9, loc="center left")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    plt.tight_layout()
    fig.savefig("figures/fig6_utility_privacy.pdf")
    plt.close()
    print("  fig6_utility_privacy.pdf")


# ═══════════════════════════════════════════════════════════════════════
# Generate all
# ═══════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("Generating figures...")
    fig1_irreversibility_hierarchy()
    fig2_adversary_comparison()
    fig3_entropy_consumption()
    fig4_tool_comparison()
    fig5_protocol_flow()
    fig6_utility_privacy()
    print("Done. 6 figures in figures/")
