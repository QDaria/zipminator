#!/usr/bin/env python3
"""Generate publication-quality PDF figures 9-12 for the PoPETs paper.

Figures are conceptual diagrams (state machines, timelines, bar charts, game diagrams)
rendered as vector PDFs suitable for column-width (~3.5 in) academic layout.

Usage:
    micromamba activate zip-pqc
    python generate_new_figures.py
"""

from pathlib import Path

import matplotlib
matplotlib.use("pdf")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np

# ---------------------------------------------------------------------------
# Style constants
# ---------------------------------------------------------------------------
CYAN = "#0891B2"
ROSE = "#E11D48"
AMBER = "#D97706"
EMERALD = "#059669"
VIOLET = "#7C3AED"
DARK = "#1E293B"
LIGHT_GRAY = "#F1F5F9"
WHITE = "#FFFFFF"

OUT_DIR = Path(__file__).resolve().parent / "figures"
OUT_DIR.mkdir(exist_ok=True)

plt.rcParams.update({
    "font.family": "serif",
    "font.size": 10,
    "axes.linewidth": 0.6,
    "axes.edgecolor": DARK,
    "text.color": DARK,
    "figure.facecolor": WHITE,
    "axes.facecolor": WHITE,
    "savefig.facecolor": WHITE,
    "savefig.dpi": 300,
    "savefig.bbox": "tight",
    "savefig.pad_inches": 0.08,
})


# ===================================================================
# Helper: draw a rounded box with centered text
# ===================================================================
def _box(ax, xy, w, h, text, fc=LIGHT_GRAY, ec=DARK, lw=0.8,
         fontsize=8.5, text_color=DARK, ls="-", zorder=2):
    """Draw a FancyBboxPatch and return its center (cx, cy)."""
    x, y = xy
    box = FancyBboxPatch(
        (x, y), w, h,
        boxstyle="round,pad=0.02",
        facecolor=fc, edgecolor=ec, linewidth=lw, linestyle=ls,
        zorder=zorder,
    )
    ax.add_patch(box)
    ax.text(
        x + w / 2, y + h / 2, text,
        ha="center", va="center", fontsize=fontsize,
        color=text_color, zorder=zorder + 1,
        fontweight="medium",
    )
    return x + w / 2, y + h / 2


def _arrow(ax, start, end, color=DARK, lw=1.0, style="-|>",
           connectionstyle="arc3,rad=0", zorder=1):
    """Draw a FancyArrowPatch between two (x,y) points."""
    ar = FancyArrowPatch(
        start, end,
        arrowstyle=style,
        connectionstyle=connectionstyle,
        color=color,
        linewidth=lw,
        zorder=zorder,
        mutation_scale=12,
    )
    ax.add_patch(ar)
    return ar


# ===================================================================
# Figure 9: Protocol State Machine
# ===================================================================
def fig9_state_machine():
    fig, ax = plt.subplots(figsize=(7, 3.5))
    ax.set_xlim(-0.2, 7.2)
    ax.set_ylim(-0.6, 3.6)
    ax.axis("off")

    bw, bh = 1.25, 0.50  # box width/height
    gap = 0.15

    states = [
        "Input\nData",
        "PII\nDetection",
        "Level\nSelection",
        "Entropy\nAcquisition",
        "OTP\nMapping",
        "Substitution",
        "Secure\nDestruction",
        "Output",
    ]

    # Layout: two rows of 4
    positions = []
    for i in range(4):
        positions.append((i * (bw + gap) + 0.3, 2.5))
    for i in range(4):
        positions.append(((3 - i) * (bw + gap) + 0.3, 0.8))

    # Volatile window box (states 4-6, indices 4,5,6 in the second row)
    # Map positions: idx 4 = pos[4], idx 5 = pos[5], idx 6 = pos[6]
    vx_start = positions[6][0] - 0.12
    vy_start = positions[6][1] - 0.15
    vx_end = positions[4][0] + bw + 0.12
    vy_end = positions[4][1] + bh + 0.15
    dashed_rect = mpatches.FancyBboxPatch(
        (vx_start, vy_start), vx_end - vx_start, vy_end - vy_start,
        boxstyle="round,pad=0.04",
        facecolor="none", edgecolor=ROSE, linewidth=1.2,
        linestyle=(0, (5, 3)), zorder=0,
    )
    ax.add_patch(dashed_rect)
    ax.text(
        (vx_start + vx_end) / 2, vy_start - 0.18,
        "Volatile mapping window (~500 ms)\nMapping exists only in volatile memory",
        ha="center", va="top", fontsize=7.5, color=ROSE,
        fontstyle="italic",
    )

    centers = []
    for i, (label, pos) in enumerate(zip(states, positions)):
        fc = LIGHT_GRAY
        if i == 0:
            fc = "#E0F2FE"   # pale cyan for start
        elif i == 7:
            fc = "#DCFCE7"   # pale green for output
        elif 4 <= i <= 6:
            fc = "#FFF1F2"   # pale rose for volatile states
        cx, cy = _box(ax, pos, bw, bh, label, fc=fc, fontsize=8)
        centers.append((cx, cy))

    # Arrows: top row left-to-right
    for i in range(3):
        _arrow(ax, (centers[i][0] + bw / 2 + 0.02, centers[i][1]),
               (centers[i + 1][0] - bw / 2 - 0.02, centers[i + 1][1]),
               color=CYAN)

    # Arrow: top-right to bottom-right (row transition)
    _arrow(ax, (centers[3][0], centers[3][1] - bh / 2 - 0.02),
           (centers[4][0], centers[4][1] + bh / 2 + 0.02),
           color=CYAN)

    # Bottom row right-to-left
    for i in range(4, 7):
        _arrow(ax, (centers[i][0] - bw / 2 - 0.02, centers[i][1]),
               (centers[i + 1][0] + bw / 2 + 0.02, centers[i + 1][1]),
               color=CYAN)

    ax.set_title("QRNG-OTP-Destroy Protocol State Machine",
                 fontsize=11, fontweight="bold", pad=10)

    fig.savefig(OUT_DIR / "fig9_state_machine.pdf")
    plt.close(fig)
    print(f"  Saved {OUT_DIR / 'fig9_state_machine.pdf'}")


# ===================================================================
# Figure 10: HNDL Threat Timeline
# ===================================================================
def fig10_hndl_timeline():
    fig, ax = plt.subplots(figsize=(7, 3.2))
    ax.set_xlim(-0.5, 10.5)
    ax.set_ylim(-2.0, 3.0)
    ax.axis("off")

    # Main timeline
    ax.annotate("", xy=(10.2, 1.0), xytext=(-0.2, 1.0),
                arrowprops=dict(arrowstyle="-|>", color=DARK, lw=1.5))

    # Era markers
    eras = [
        (1.0, "Today", "Adversary harvests\nencrypted data"),
        (5.0, "2030\u20132035", "NIST deprecates\nRSA / ECC"),
        (8.5, "Future", "Quantum computer\nbreaks classical crypto"),
    ]
    for ex, label, desc in eras:
        ax.plot([ex, ex], [0.7, 1.3], color=DARK, lw=1.0)
        ax.text(ex, 1.55, label, ha="center", va="bottom",
                fontsize=9.5, fontweight="bold")
        ax.text(ex, 0.45, desc, ha="center", va="top",
                fontsize=7.5, color="#475569")

    # CSPRNG path (broken) -- red
    y_csprng = -0.3
    ax.annotate("", xy=(8.5, y_csprng), xytext=(1.0, y_csprng),
                arrowprops=dict(arrowstyle="-|>", color=ROSE, lw=1.8,
                                linestyle="solid"))
    ax.text(4.75, y_csprng + 0.22, "CSPRNG-based anonymization",
            ha="center", va="bottom", fontsize=8.5, color=ROSE,
            fontweight="bold")
    # X mark (use matplotlib marker instead of unicode glyph)
    ax.plot(8.5, y_csprng, marker="X", markersize=14, color=ROSE,
            markeredgecolor=ROSE, zorder=5)
    ax.text(9.3, y_csprng, "Broken", ha="left", va="center",
            fontsize=8.5, color=ROSE, fontweight="bold")

    # QRNG-OTP-Destroy path (secure) -- teal
    y_qrng = -1.2
    ax.annotate("", xy=(8.5, y_qrng), xytext=(1.0, y_qrng),
                arrowprops=dict(arrowstyle="-|>", color=EMERALD, lw=1.8,
                                linestyle="solid"))
    ax.text(4.75, y_qrng + 0.22, "QRNG-OTP-Destroy anonymization",
            ha="center", va="bottom", fontsize=8.5, color=EMERALD,
            fontweight="bold")
    # Check mark (use matplotlib marker instead of unicode glyph)
    ax.plot(8.5, y_qrng, marker="o", markersize=14, color=EMERALD,
            markeredgecolor=EMERALD, zorder=5)
    ax.plot(8.5, y_qrng, marker="$\\checkmark$", markersize=10,
            color=WHITE, markeredgecolor=WHITE, zorder=6)
    ax.text(9.3, y_qrng, "Secure", ha="left", va="center",
            fontsize=8.5, color=EMERALD, fontweight="bold")

    ax.set_title("Harvest-Now-Decrypt-Later (HNDL) Threat Timeline",
                 fontsize=11, fontweight="bold", pad=10)

    fig.savefig(OUT_DIR / "fig10_hndl_timeline.pdf")
    plt.close(fig)
    print(f"  Saved {OUT_DIR / 'fig10_hndl_timeline.pdf'}")


# ===================================================================
# Figure 11: Comparison Grouped Bar Chart
# ===================================================================
def fig11_comparison_chart():
    tools = ["Zipminator\nL10", "Google\nDP", "ARX", "Apple\nDP", "OpenDP"]
    categories = [
        "Irreversibility\nStrength",
        "HNDL\nResistance",
        "Insider\nResistance",
        "Quantum\nResistance",
        "GDPR\nCompliance",
    ]
    # Scores (0-5)
    scores = np.array([
        [5, 5, 5, 5, 5],   # Zipminator L10
        [3, 1, 2, 0, 4],   # Google DP
        [4, 1, 2, 0, 3],   # ARX
        [3, 1, 1, 0, 3],   # Apple DP
        [3, 1, 2, 0, 3],   # OpenDP
    ])

    colors = [CYAN, ROSE, AMBER, EMERALD, VIOLET]
    n_tools = len(tools)
    n_cats = len(categories)
    x = np.arange(n_cats)
    bar_w = 0.14

    fig, ax = plt.subplots(figsize=(7, 3.5))

    for i in range(n_tools):
        offset = (i - n_tools / 2 + 0.5) * bar_w
        bars = ax.bar(
            x + offset, scores[i], bar_w,
            label=tools[i].replace("\n", " "),
            color=colors[i], edgecolor=WHITE, linewidth=0.4,
            zorder=3,
        )
        # Value labels
        for bar, val in zip(bars, scores[i]):
            if val > 0:
                ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.12,
                        str(val), ha="center", va="bottom", fontsize=6.5,
                        color=colors[i], fontweight="bold")

    ax.set_xticks(x)
    ax.set_xticklabels(categories, fontsize=8)
    ax.set_ylabel("Score (0\u20135)", fontsize=9)
    ax.set_ylim(0, 6.0)
    ax.set_yticks(range(0, 6))
    ax.legend(fontsize=7.5, ncol=5, loc="upper center",
              bbox_to_anchor=(0.5, 1.18), frameon=False)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    ax.set_title("Privacy Tool Comparison", fontsize=11, fontweight="bold",
                 pad=28)

    fig.savefig(OUT_DIR / "fig11_comparison_chart.pdf")
    plt.close(fig)
    print(f"  Saved {OUT_DIR / 'fig11_comparison_chart.pdf'}")


# ===================================================================
# Figure 12: Security Game Diagram
# ===================================================================
def fig12_security_game():
    fig, ax = plt.subplots(figsize=(7, 4.5))
    ax.set_xlim(-0.5, 10.5)
    ax.set_ylim(-0.5, 7.5)
    ax.axis("off")

    col_c = 2.5   # Challenger column center
    col_a = 7.5   # Adversary column center
    col_w = 2.8
    col_h = 0.55

    # Column headers
    _box(ax, (col_c - col_w / 2, 6.6), col_w, 0.6, "Challenger  C",
         fc=CYAN, ec=CYAN, text_color=WHITE, fontsize=10, lw=0)
    _box(ax, (col_a - col_w / 2, 6.6), col_w, 0.6, "Adversary  A",
         fc=ROSE, ec=ROSE, text_color=WHITE, fontsize=10, lw=0)

    # Steps (y positions decrease)
    steps = [
        # (y, challenger_text, adversary_text, arrow_dir, arrow_label)
        (5.6, "Generate keys\n(pk, sk)", "", None, ""),
        (5.6, "", "", "right", "pk"),
        (4.6, "", "Choose messages\nm$_0$, m$_1$", None, ""),
        (4.6, "", "", "left", "m$_0$, m$_1$"),
        (3.6, "b <- {0,1}\nAnonymize(m$_b$)", "", None, ""),
        (3.6, "", "", "right", "c* = Anon(m$_b$)"),
        (2.6, "", "Output guess b'", None, ""),
        (2.6, "", "", "left", "b'"),
        (1.6, "Win iff b' = b", "", None, ""),
    ]

    # Draw step boxes
    y_positions_c = [5.6, 3.6, 1.6]
    c_labels = [
        "Setup\nGenerate QRNG seed,\nsampling parameters",
        "Challenge\nb $\\leftarrow$ {0,1}; return\nc* = Anonymize(m$_b$)",
        "Verify\nWin iff b' = b",
    ]
    y_positions_a = [4.6, 2.6]
    a_labels = [
        "Query\nChoose distinct\nrecords m$_0$, m$_1$",
        "Guess\nOutput b' $\\in$ {0,1}",
    ]

    c_centers = []
    a_centers = []
    for y, label in zip(y_positions_c, c_labels):
        cx, cy = _box(ax, (col_c - col_w / 2, y), col_w, col_h * 1.6,
                       label, fc="#E0F7FA", ec=CYAN, fontsize=7.5, lw=0.8)
        c_centers.append((cx, cy))

    for y, label in zip(y_positions_a, a_labels):
        cx, cy = _box(ax, (col_a - col_w / 2, y), col_w, col_h * 1.6,
                       label, fc="#FFF1F2", ec=ROSE, fontsize=7.5, lw=0.8)
        a_centers.append((cx, cy))

    # Arrows between columns
    arrow_specs = [
        # (from_center, to_center, label, direction)
        (c_centers[0], a_centers[0], "pk, params", "right"),
        (a_centers[0], c_centers[1], "m$_0$, m$_1$", "left"),
        (c_centers[1], a_centers[1], "c*", "right"),
        (a_centers[1], c_centers[2], "b'", "left"),
    ]

    for (fx, fy), (tx, ty), label, direction in arrow_specs:
        if direction == "right":
            start = (col_c + col_w / 2, fy)
            end = (col_a - col_w / 2, ty)
            color = CYAN
        else:
            start = (col_a - col_w / 2, fy)
            end = (col_c + col_w / 2, ty)
            color = ROSE

        _arrow(ax, start, end, color=color, lw=1.2)
        mid_x = (start[0] + end[0]) / 2
        mid_y = (start[1] + end[1]) / 2
        ax.text(mid_x, mid_y + 0.15, label, ha="center", va="bottom",
                fontsize=8, color=color, fontweight="bold",
                fontstyle="italic")

    # Advantage formula at bottom
    ax.text(
        5.0, 0.3,
        r"$\mathbf{Adv}_{\mathcal{A}}^{\mathrm{ANON}}$"
        r"$ = \Pr[\mathrm{win}] - |\Sigma|^{-t} = 0$"
        r"   (information-theoretic)",
        ha="center", va="center", fontsize=9.5,
        color=DARK,
        bbox=dict(boxstyle="round,pad=0.3", facecolor="#F0FDF4",
                  edgecolor=EMERALD, linewidth=1.0),
    )

    ax.set_title("ANON Security Game", fontsize=11, fontweight="bold", pad=8)

    fig.savefig(OUT_DIR / "fig12_security_game.pdf")
    plt.close(fig)
    print(f"  Saved {OUT_DIR / 'fig12_security_game.pdf'}")


# ===================================================================
# Main
# ===================================================================
if __name__ == "__main__":
    print("Generating figures 9-12 ...")
    fig9_state_machine()
    fig10_hndl_timeline()
    fig11_comparison_chart()
    fig12_security_game()
    print("Done.")
