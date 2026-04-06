#!/usr/bin/env python3
"""Generate all figures for QDaria IP Assessment Report."""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import numpy as np
from matplotlib.patches import FancyBboxPatch
import os

OUT = os.path.dirname(os.path.abspath(__file__))

# ── Color palette ──
CYAN = "#22D3EE"
AMBER = "#F59E0B"
ROSE = "#FB7185"
GREEN = "#34D399"
VIOLET = "#A78BFA"
BLUE = "#3B82F6"
WHITE = "#F8FAFC"
DARK = "#0F172A"
GRID = "#1E293B"

plt.rcParams.update({
    "figure.facecolor": DARK,
    "axes.facecolor": DARK,
    "axes.edgecolor": GRID,
    "axes.labelcolor": WHITE,
    "text.color": WHITE,
    "xtick.color": WHITE,
    "ytick.color": WHITE,
    "grid.color": GRID,
    "grid.alpha": 0.3,
    "font.family": "sans-serif",
    "font.size": 11,
})


# ═══════════════════════════════════════════════════════════════
# FIGURE 1: Radar / Spider chart — 4 contributions scored
# ═══════════════════════════════════════════════════════════════
def fig_radar():
    categories = [
        "Novelty", "Defensibility", "Market\nReach",
        "Standard-\nEssential", "Implementation", "Regulatory\nAlignment",
        "Revenue\nPotential"
    ]
    N = len(categories)
    angles = np.linspace(0, 2 * np.pi, N, endpoint=False).tolist()
    angles += angles[:1]

    data = {
        "Patent 2: CSI/PUEK":    [10, 10, 10, 9, 8, 9, 10],
        "Patent 3: CHE/ARE":     [10, 9, 7, 8, 8, 10, 8],
        "Patent 1: Anonymization": [9, 9, 8, 7, 9, 10, 8],
        "Zipminator App":        [8, 8, 9, 6, 9, 9, 9],
    }
    colors = [CYAN, VIOLET, AMBER, GREEN]

    fig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(polar=True))
    ax.set_facecolor(DARK)
    fig.patch.set_facecolor(DARK)

    for (name, vals), color in zip(data.items(), colors):
        vals_closed = vals + vals[:1]
        ax.plot(angles, vals_closed, "o-", linewidth=2, label=name, color=color)
        ax.fill(angles, vals_closed, alpha=0.08, color=color)

    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(categories, size=10)
    ax.set_ylim(0, 10.5)
    ax.set_yticks([2, 4, 6, 8, 10])
    ax.set_yticklabels(["2", "4", "6", "8", "10"], size=8)
    ax.legend(loc="upper right", bbox_to_anchor=(1.35, 1.1), frameon=False, fontsize=9)
    ax.set_title("QDaria IP Portfolio — Multi-Dimensional Assessment", size=14, pad=20, weight="bold")
    fig.tight_layout()
    fig.savefig(f"{OUT}/fig1_radar.pdf", dpi=200, bbox_inches="tight")
    fig.savefig(f"{OUT}/fig1_radar.png", dpi=200, bbox_inches="tight")
    plt.close(fig)


# ═══════════════════════════════════════════════════════════════
# FIGURE 2: Market size projections (stacked area)
# ═══════════════════════════════════════════════════════════════
def fig_market():
    years = [2025, 2027, 2030, 2033, 2035]
    markets = {
        "Post-Quantum Crypto":   [2, 4, 8, 12, 17.2],
        "QRNG":                  [0.5, 1, 2, 3.5, 5.5],
        "Encrypted Comms":       [3, 5, 8, 11, 15],
        "Data Anonymization":    [1.5, 2.5, 5, 8, 12],
        "WiFi Sensing":          [1, 2, 5, 9, 15],
        "VPN Services":          [45, 55, 75, 95, 120],
        "HSM / Key Mgmt":        [2, 3, 5, 7, 10],
    }
    colors = [CYAN, VIOLET, GREEN, AMBER, ROSE, BLUE, "#94A3B8"]

    fig, ax = plt.subplots(figsize=(12, 6))
    bottom = np.zeros(len(years))
    for (name, vals), color in zip(markets.items(), colors):
        ax.bar(years, vals, bottom=bottom, width=1.4, label=name, color=color, alpha=0.85, edgecolor=DARK)
        bottom += np.array(vals)

    ax.set_xlabel("Year", size=12)
    ax.set_ylabel("Market Size ($ Billion)", size=12)
    ax.set_title("QDaria Total Addressable Market by Segment", size=14, weight="bold", pad=15)
    ax.set_xticks(years)
    ax.legend(loc="upper left", frameon=False, fontsize=9, ncol=2)
    ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f"${x:.0f}B"))
    ax.grid(axis="y", alpha=0.2)
    ax.set_xlim(2024, 2036)

    # Annotation
    total_2035 = sum(v[-1] for v in markets.values())
    ax.annotate(f"TAM: ${total_2035:.0f}B+", xy=(2035, total_2035), xytext=(2033.5, total_2035 + 15),
                arrowprops=dict(arrowstyle="->", color=CYAN, lw=1.5),
                fontsize=12, weight="bold", color=CYAN)

    fig.tight_layout()
    fig.savefig(f"{OUT}/fig2_market.pdf", dpi=200, bbox_inches="tight")
    fig.savefig(f"{OUT}/fig2_market.png", dpi=200, bbox_inches="tight")
    plt.close(fig)


# ═══════════════════════════════════════════════════════════════
# FIGURE 3: Patent thicket flow diagram
# ═══════════════════════════════════════════════════════════════
def fig_thicket():
    fig, ax = plt.subplots(figsize=(12, 5))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 5)
    ax.axis("off")
    ax.set_title("Patent Thicket: Entropy Lifecycle Pipeline", size=14, weight="bold", pad=15)

    boxes = [
        (0.5, 1.5, 3, 2, "Patent 2\nCSI/PUEK\n\nEntropy\nGENERATION", CYAN, "9.4/10"),
        (4.5, 1.5, 3, 2, "Patent 3\nCHE/ARE\n\nEntropy\nCOMPOSITION", VIOLET, "8.6/10"),
        (8.5, 1.5, 3, 2, "Patent 1\nQRNG-OTP\n\nEntropy\nCONSUMPTION", AMBER, "8.6/10"),
    ]

    for x, y, w, h, text, color, score in boxes:
        bbox = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.15",
                              facecolor=color, alpha=0.15, edgecolor=color, linewidth=2)
        ax.add_patch(bbox)
        ax.text(x + w/2, y + h/2 + 0.15, text, ha="center", va="center",
                fontsize=10, weight="bold", color=WHITE, linespacing=1.3)
        ax.text(x + w/2, y + 0.25, score, ha="center", va="center",
                fontsize=11, weight="bold", color=color,
                bbox=dict(boxstyle="round,pad=0.2", facecolor=DARK, edgecolor=color, alpha=0.9))

    # Arrows
    for x_start, x_end, color in [(3.5, 4.5, CYAN), (7.5, 8.5, VIOLET)]:
        ax.annotate("", xy=(x_end, 2.5), xytext=(x_start, 2.5),
                    arrowprops=dict(arrowstyle="-|>", color=color, lw=2.5))

    # Bottom: Zipminator bar
    bar = FancyBboxPatch((0.5, 0.1), 11, 0.8, boxstyle="round,pad=0.1",
                         facecolor=GREEN, alpha=0.12, edgecolor=GREEN, linewidth=1.5)
    ax.add_patch(bar)
    ax.text(6, 0.5, "Zipminator Super-App  —  9 Pillars  —  1,584 Tests  —  6 Platforms  —  Score: 8.3/10",
            ha="center", va="center", fontsize=10, color=GREEN, weight="bold")

    # Top label
    ax.text(6, 4.2, "A competitor must license ALL THREE patents to build a comparable system",
            ha="center", va="center", fontsize=10, color=ROSE, style="italic")

    fig.tight_layout()
    fig.savefig(f"{OUT}/fig3_thicket.pdf", dpi=200, bbox_inches="tight")
    fig.savefig(f"{OUT}/fig3_thicket.png", dpi=200, bbox_inches="tight")
    plt.close(fig)


# ═══════════════════════════════════════════════════════════════
# FIGURE 4: Regulatory timeline
# ═══════════════════════════════════════════════════════════════
def fig_regulatory():
    fig, ax = plt.subplots(figsize=(14, 4))
    ax.set_xlim(2018, 2036)
    ax.set_ylim(-1, 5)
    ax.axis("off")
    ax.set_title("Regulatory Wave Driving PQC Adoption", size=14, weight="bold", pad=15)

    events = [
        (2018, 0, "GDPR\nActive", GREEN, 0.7),
        (2024, 1, "NIS2\nEffective", BLUE, 0.7),
        (2024.5, 2, "UK PSTI\nAct", "#94A3B8", 0.5),
        (2025, 3, "DORA\n(Norway)", CYAN, 0.9),
        (2025.5, 0, "CNSA 2.0\nBegins", AMBER, 0.8),
        (2026, 1, "AI Act\n(phased)", VIOLET, 0.6),
        (2026.5, 2, "eIDAS 2.0", "#94A3B8", 0.5),
        (2030, 3, "RSA/ECC\nDeprecated", ROSE, 1.0),
        (2035, 0, "RSA/ECC\nDISALLOWED", ROSE, 1.0),
    ]

    # Timeline bar
    ax.plot([2018, 2036], [-0.5, -0.5], color=GRID, lw=3, zorder=1)
    for year in range(2018, 2037, 2):
        ax.plot(year, -0.5, "o", color=GRID, markersize=4, zorder=2)
        ax.text(year, -0.85, str(year), ha="center", fontsize=7, color="#64748B")

    for x, row, text, color, importance in events:
        y = row * 1.1 + 0.3
        ax.plot([x, x], [-0.5, y - 0.1], color=color, lw=1.5, alpha=0.5)
        ax.plot(x, -0.5, "o", color=color, markersize=8, zorder=3)
        ax.text(x, y, text, ha="center", va="bottom", fontsize=8, color=color,
                weight="bold", linespacing=1.2,
                bbox=dict(boxstyle="round,pad=0.3", facecolor=DARK, edgecolor=color, alpha=0.8))

    # QDaria window
    ax.axvspan(2025, 2030, alpha=0.06, color=CYAN)
    ax.text(2027.5, 4.3, "QDaria Window: 2025-2030", ha="center", fontsize=11,
            color=CYAN, weight="bold", style="italic")

    fig.tight_layout()
    fig.savefig(f"{OUT}/fig4_regulatory.pdf", dpi=200, bbox_inches="tight")
    fig.savefig(f"{OUT}/fig4_regulatory.png", dpi=200, bbox_inches="tight")
    plt.close(fig)


# ═══════════════════════════════════════════════════════════════
# FIGURE 5: Valuation waterfall
# ═══════════════════════════════════════════════════════════════
def fig_valuation():
    fig, ax = plt.subplots(figsize=(12, 6))

    labels = ["Patent 2\n(CSI/PUEK)", "Patent 3\n(CHE/ARE)", "Patent 1\n(Anon.)",
              "Zipminator\nPlatform", "Thicket\nSynergy", "Academic +\nRegulatory", "Combined\nPortfolio"]
    low =  [1, 0.5, 0.2, 5, 0, 0, 10]
    high = [50, 5, 2, 30, 0, 0, 100]
    colors_bar = [CYAN, VIOLET, AMBER, GREEN, ROSE, BLUE, WHITE]

    x = np.arange(len(labels))
    width = 0.55

    for i in range(len(labels)):
        if i < 4:
            ax.bar(x[i], high[i] - low[i], bottom=low[i], width=width,
                   color=colors_bar[i], alpha=0.7, edgecolor=colors_bar[i])
            ax.text(x[i], high[i] + 1.5, f"${low[i]}-{high[i]}B", ha="center",
                    fontsize=9, weight="bold", color=colors_bar[i])
        elif i == 4:
            ax.text(x[i], 25, "2-5x\nmultiplier", ha="center", fontsize=11,
                    color=ROSE, weight="bold")
        elif i == 5:
            ax.text(x[i], 25, "+20-50%\npremium", ha="center", fontsize=11,
                    color=BLUE, weight="bold")
        else:
            ax.bar(x[i], high[i] - low[i], bottom=low[i], width=width,
                   color=WHITE, alpha=0.15, edgecolor=WHITE, linewidth=2)
            ax.text(x[i], high[i] + 1.5, f"${low[i]}-{high[i]}B", ha="center",
                    fontsize=12, weight="bold", color=WHITE)

    ax.set_xticks(x)
    ax.set_xticklabels(labels, fontsize=9)
    ax.set_ylabel("Estimated Value ($ Billion)", size=12)
    ax.set_title("QDaria Portfolio Valuation Waterfall", size=14, weight="bold", pad=15)
    ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda v, _: f"${v:.0f}B"))
    ax.set_ylim(0, 110)
    ax.grid(axis="y", alpha=0.15)

    fig.tight_layout()
    fig.savefig(f"{OUT}/fig5_valuation.pdf", dpi=200, bbox_inches="tight")
    fig.savefig(f"{OUT}/fig5_valuation.png", dpi=200, bbox_inches="tight")
    plt.close(fig)


# ═══════════════════════════════════════════════════════════════
# FIGURE 6: Competitive landscape heatmap
# ═══════════════════════════════════════════════════════════════
def fig_competitive():
    competitors = ["QDaria", "ID Quantique", "NordVPN", "ProtonMail", "Signal",
                   "Origin Wireless", "Anonos", "Qrypt", "Brave"]
    capabilities = ["QRNG\nEntropy", "CSI\nEntropy", "PQC\nEncryption", "Messenger",
                    "VoIP", "VPN", "Anonymizer", "Email", "Browser", "Provenance"]

    # 1 = has it, 0.5 = partial, 0 = no
    data = np.array([
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],      # QDaria
        [1, 0, 0.5, 0, 0, 0, 0, 0, 0, 0],     # ID Quantique
        [0, 0, 0.5, 0, 0, 1, 0, 0, 0, 0],     # NordVPN
        [0, 0, 0.5, 1, 0, 1, 0, 1, 0, 0],     # ProtonMail
        [0, 0, 0.5, 1, 0.5, 0, 0, 0, 0, 0],   # Signal
        [0, 0.5, 0, 0, 0, 0, 0, 0, 0, 0],     # Origin Wireless
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0],       # Anonos
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0.5],     # Qrypt
        [0, 0, 0, 0, 0, 0.5, 0, 0, 1, 0],     # Brave
    ])

    fig, ax = plt.subplots(figsize=(13, 6))

    cmap = matplotlib.colors.LinearSegmentedColormap.from_list("q", [DARK, "#1E3A5F", CYAN])
    im = ax.imshow(data, cmap=cmap, aspect="auto", vmin=0, vmax=1)

    ax.set_xticks(range(len(capabilities)))
    ax.set_xticklabels(capabilities, fontsize=9, ha="center")
    ax.set_yticks(range(len(competitors)))
    ax.set_yticklabels(competitors, fontsize=10)
    ax.tick_params(top=True, bottom=False, labeltop=True, labelbottom=False)

    # Cell labels
    for i in range(len(competitors)):
        for j in range(len(capabilities)):
            v = data[i, j]
            symbol = "●" if v == 1 else ("◐" if v == 0.5 else "○")
            color = WHITE if v == 1 else ("#64748B" if v == 0 else AMBER)
            ax.text(j, i, symbol, ha="center", va="center", fontsize=14, color=color)

    # Highlight QDaria row
    ax.axhline(y=0.5, color=CYAN, linewidth=2, alpha=0.5)

    ax.set_title("Competitive Coverage Matrix — ● Full  ◐ Partial  ○ None", size=13, weight="bold", pad=25)
    fig.tight_layout()
    fig.savefig(f"{OUT}/fig6_competitive.pdf", dpi=200, bbox_inches="tight")
    fig.savefig(f"{OUT}/fig6_competitive.png", dpi=200, bbox_inches="tight")
    plt.close(fig)


if __name__ == "__main__":
    fig_radar()
    fig_market()
    fig_thicket()
    fig_regulatory()
    fig_valuation()
    fig_competitive()
    print("All 6 figures generated.")
