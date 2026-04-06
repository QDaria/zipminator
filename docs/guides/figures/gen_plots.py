#!/usr/bin/env python3
"""Generate all figures for QDaria IP Assessment Report — v2 (improved)."""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import matplotlib.patheffects as pe
import numpy as np
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle
from matplotlib.collections import LineCollection
from matplotlib.colors import LinearSegmentedColormap
import os

OUT = os.path.dirname(os.path.abspath(__file__))
DPI = 250

# ── Quantum Design System ──
CYAN    = "#22D3EE"
AMBER   = "#F59E0B"
ROSE    = "#FB7185"
GREEN   = "#34D399"
VIOLET  = "#A78BFA"
BLUE    = "#3B82F6"
ORANGE  = "#FB923C"
WHITE   = "#F1F5F9"
SILVER  = "#94A3B8"
DARK    = "#020817"
SURFACE = "#0F172A"
GRID    = "#1E293B"

GLOW = [pe.withStroke(linewidth=4, foreground=DARK)]

plt.rcParams.update({
    "figure.facecolor": DARK,
    "axes.facecolor": DARK,
    "axes.edgecolor": GRID,
    "axes.labelcolor": WHITE,
    "text.color": WHITE,
    "xtick.color": SILVER,
    "ytick.color": SILVER,
    "grid.color": GRID,
    "grid.alpha": 0.25,
    "font.family": "sans-serif",
    "font.size": 11,
    "axes.titleweight": "bold",
    "axes.titlesize": 15,
})


def _add_watermark(fig):
    fig.text(0.99, 0.01, "QDaria Quantum Research", fontsize=7, color=GRID,
             ha="right", va="bottom", alpha=0.5, style="italic")


# ═══════════════════════════════════════════════════════════════
# FIGURE 1: Radar / Spider — 4 contributions, with glow + scores
# ═══════════════════════════════════════════════════════════════
def fig_radar():
    categories = ["Novelty", "Defensibility", "Market\nReach",
                  "Standard-\nEssential", "Implementation",
                  "Regulatory\nAlignment", "Revenue\nPotential"]
    N = len(categories)
    angles = np.linspace(0, 2 * np.pi, N, endpoint=False).tolist()
    angles += angles[:1]

    data = {
        "Patent 2: CSI/PUEK  (9.4)":  ([10, 10, 10, 9, 8, 9, 10], CYAN),
        "Patent 3: CHE/ARE  (8.6)":    ([10, 9, 7, 8, 8, 10, 8], VIOLET),
        "Patent 1: Anon.  (8.6)":      ([9, 9, 8, 7, 9, 10, 8], AMBER),
        "Zipminator App  (8.3)":       ([8, 8, 9, 6, 9, 9, 9], GREEN),
    }

    fig, ax = plt.subplots(figsize=(9, 9), subplot_kw=dict(polar=True))
    ax.set_facecolor(DARK)

    # Filled concentric rings for reference
    for r in [2, 4, 6, 8, 10]:
        ring = [r] * (N + 1)
        ax.fill(angles, ring, color=SURFACE if r % 4 == 0 else DARK, alpha=0.3)
        ax.plot(angles, ring, color=GRID, lw=0.5, alpha=0.4)

    for name, (vals, color) in data.items():
        vals_c = vals + vals[:1]
        # Glow line
        ax.plot(angles, vals_c, linewidth=5, color=color, alpha=0.15)
        # Main line
        ax.plot(angles, vals_c, "o-", linewidth=2.2, label=name, color=color,
                markersize=6, markeredgecolor=DARK, markeredgewidth=1.5, zorder=5)
        ax.fill(angles, vals_c, alpha=0.06, color=color)

    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(categories, size=10, weight="bold")
    ax.set_ylim(0, 11)
    ax.set_yticks([2, 4, 6, 8, 10])
    ax.set_yticklabels(["2", "4", "6", "8", "10"], size=8, color=SILVER)
    ax.spines["polar"].set_color(GRID)
    ax.legend(loc="upper right", bbox_to_anchor=(1.42, 1.12), frameon=True,
              facecolor=SURFACE, edgecolor=GRID, fontsize=9.5, labelspacing=0.9)
    ax.set_title("QDaria IP Portfolio\nMulti-Dimensional Assessment", size=16, pad=28, weight="bold")
    _add_watermark(fig)
    fig.tight_layout()
    fig.savefig(f"{OUT}/fig1_radar.pdf", dpi=DPI, bbox_inches="tight")
    fig.savefig(f"{OUT}/fig1_radar.png", dpi=DPI, bbox_inches="tight")
    plt.close(fig)


# ═══════════════════════════════════════════════════════════════
# FIGURE 2: Market — two-panel (core PQC vs total TAM)
# ═══════════════════════════════════════════════════════════════
def fig_market():
    years = [2025, 2027, 2030, 2033, 2035]

    # Panel A: Core PQC markets (billions)
    core = {
        "Post-Quantum Crypto":  ([2, 4, 8, 12, 17.2], CYAN),
        "QRNG":                 ([0.5, 1, 2, 3.5, 5.5], VIOLET),
        "Encrypted Comms":      ([3, 5, 8, 11, 15], GREEN),
        "Data Anonymization":   ([1.5, 2.5, 5, 8, 12], AMBER),
        "WiFi Sensing":         ([1, 2, 5, 9, 15], ROSE),
        "HSM / Key Mgmt":       ([2, 3, 5, 7, 10], BLUE),
    }

    # Panel B: Full TAM including VPN
    full_tam = [55, 72.5, 108, 155.5, 194.7]  # Sum of all markets including VPN

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6.5), gridspec_kw={"width_ratios": [3, 2]})

    # ── Panel A: Stacked area ──
    ys = np.zeros(len(years))
    xs = np.array(years, dtype=float)
    prev_colors = []
    for name, (vals, color) in core.items():
        v = np.array(vals)
        ax1.fill_between(xs, ys, ys + v, alpha=0.35, color=color, label=name, linewidth=0)
        ax1.plot(xs, ys + v, color=color, linewidth=1.8, alpha=0.8)
        ys += v
        prev_colors.append(color)

    ax1.set_xlabel("Year", size=12)
    ax1.set_ylabel("Market Size ($ Billion)", size=12)
    ax1.set_title("Core PQC & Adjacent Markets", size=14, weight="bold", pad=12)
    ax1.set_xticks(years)
    ax1.set_xlim(2024.5, 2035.5)
    ax1.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f"${x:.0f}B"))
    ax1.grid(axis="y", alpha=0.2)
    ax1.legend(loc="upper left", frameon=True, facecolor=SURFACE, edgecolor=GRID, fontsize=9)

    # Annotate 2035 total
    ax1.annotate(f"${ys[-1]:.0f}B", xy=(2035, ys[-1]), xytext=(2033, ys[-1] + 8),
                 arrowprops=dict(arrowstyle="->", color=CYAN, lw=1.5),
                 fontsize=13, weight="bold", color=CYAN)

    # ── Panel B: Growth rate lollipop ──
    markets_cagr = [
        ("iGaming\n(QRNG)", 45, ORANGE),
        ("PQC", 40, CYAN),
        ("WiFi\nSensing", 40, ROSE),
        ("QRNG", 35, VIOLET),
        ("Data\nAnon.", 30, AMBER),
        ("Encrypted\nComms", 25, GREEN),
        ("HSM /\nKey Mgmt", 20, BLUE),
        ("VPN", 15, SILVER),
        ("Cybersec.\n(Global)", 15, SILVER),
    ]
    names = [m[0] for m in markets_cagr]
    cagrs = [m[1] for m in markets_cagr]
    colors_c = [m[2] for m in markets_cagr]

    y_pos = np.arange(len(names))
    ax2.barh(y_pos, cagrs, height=0.55, color=colors_c, alpha=0.75, edgecolor=DARK, linewidth=0.5)
    for i, (c, col) in enumerate(zip(cagrs, colors_c)):
        ax2.plot(c, i, "o", color=col, markersize=10, markeredgecolor=DARK, markeredgewidth=1.5, zorder=5)
        ax2.text(c + 1.2, i, f"{c}%", va="center", fontsize=10, weight="bold", color=col)

    ax2.set_yticks(y_pos)
    ax2.set_yticklabels(names, fontsize=9)
    ax2.set_xlabel("CAGR (%)", size=12)
    ax2.set_title("Growth Rates by Segment", size=14, weight="bold", pad=12)
    ax2.set_xlim(0, 55)
    ax2.grid(axis="x", alpha=0.15)
    ax2.invert_yaxis()

    _add_watermark(fig)
    fig.tight_layout(w_pad=4)
    fig.savefig(f"{OUT}/fig2_market.pdf", dpi=DPI, bbox_inches="tight")
    fig.savefig(f"{OUT}/fig2_market.png", dpi=DPI, bbox_inches="tight")
    plt.close(fig)


# ═══════════════════════════════════════════════════════════════
# FIGURE 3: Patent thicket — redesigned with icons and depth
# ═══════════════════════════════════════════════════════════════
def fig_thicket():
    fig, ax = plt.subplots(figsize=(14, 7))
    ax.set_xlim(-0.5, 14.5)
    ax.set_ylim(-0.5, 7.5)
    ax.axis("off")

    # Title
    ax.text(7, 7, "The QDaria Patent Thicket", size=18, weight="bold",
            ha="center", va="center", color=WHITE)
    ax.text(7, 6.35, "Three interlocking patents covering the complete entropy lifecycle",
            size=11, ha="center", va="center", color=SILVER, style="italic")

    # Three main boxes
    boxes = [
        (0.3, 2, 4, 3.5, CYAN, "GENERATION", "Patent 2: CSI/PUEK",
         "9.4/10", ["WiFi CSI extraction", "Unilateral (single device)", "PUEK eigenstructure",
                     "18.2B addressable devices", "14 claims"]),
        (5.25, 2, 4, 3.5, VIOLET, "COMPOSITION", "Patent 3: CHE/ARE",
         "8.6/10", ["Algebraic extractors (ARE)", "C, H, O, GF(p^n), Q_p", "Merkle provenance",
                     "Multi-source fusion", "17 claims"]),
        (10.2, 2, 4, 3.5, AMBER, "CONSUMPTION", "Patent 1: QRNG-OTP",
         "8.6/10", ["Quantum anonymization", "Born rule irreversibility", "GDPR Recital 26",
                     "10-level system", "15 claims"]),
    ]

    for x, y, w, h, color, phase, title, score, bullets in boxes:
        # Outer glow
        glow = FancyBboxPatch((x - 0.08, y - 0.08), w + 0.16, h + 0.16,
                              boxstyle="round,pad=0.2", facecolor=color, alpha=0.04,
                              edgecolor="none")
        ax.add_patch(glow)
        # Main box
        bbox = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.15",
                              facecolor=SURFACE, alpha=0.95, edgecolor=color, linewidth=2.5)
        ax.add_patch(bbox)
        # Phase label
        ax.text(x + w/2, y + h - 0.3, phase, ha="center", va="top",
                fontsize=9, weight="bold", color=color, alpha=0.7,
                fontfamily="monospace")
        # Title
        ax.text(x + w/2, y + h - 0.75, title, ha="center", va="top",
                fontsize=11.5, weight="bold", color=WHITE)
        # Score badge
        badge = FancyBboxPatch((x + w/2 - 0.55, y + h - 1.35), 1.1, 0.4,
                               boxstyle="round,pad=0.08", facecolor=color, alpha=0.2,
                               edgecolor=color, linewidth=1.5)
        ax.add_patch(badge)
        ax.text(x + w/2, y + h - 1.15, score, ha="center", va="center",
                fontsize=11, weight="bold", color=color)
        # Bullets
        for i, bullet in enumerate(bullets):
            ax.text(x + 0.4, y + h - 1.8 - i * 0.38, f"  {bullet}",
                    fontsize=8.5, color=SILVER, va="top")
            ax.plot(x + 0.35, y + h - 1.72 - i * 0.38, "s", color=color,
                    markersize=3, alpha=0.6)

    # Arrows between boxes
    arrow_style = "Simple,tail_width=3,head_width=12,head_length=8"
    for x1, x2, color in [(4.3, 5.25, CYAN), (9.25, 10.2, VIOLET)]:
        arrow = FancyArrowPatch((x1, 3.75), (x2, 3.75),
                                arrowstyle=arrow_style, color=color,
                                alpha=0.6, mutation_scale=1)
        ax.add_patch(arrow)

    # Bottom platform bar
    bar = FancyBboxPatch((0.3, 0.2), 13.9, 1.2, boxstyle="round,pad=0.12",
                         facecolor=GREEN, alpha=0.08, edgecolor=GREEN, linewidth=2)
    ax.add_patch(bar)
    ax.text(7.25, 0.95, "Zipminator Super-App", ha="center", va="center",
            fontsize=13, color=GREEN, weight="bold")
    ax.text(7.25, 0.5, "9 Pillars   |   1,584 Tests   |   6 Platforms   |   Score: 8.3/10   |   46 Patent Claims Total",
            ha="center", va="center", fontsize=9.5, color=GREEN, alpha=0.75)

    # Top warning
    warn_box = FancyBboxPatch((2.5, 5.7), 9, 0.45, boxstyle="round,pad=0.1",
                              facecolor=ROSE, alpha=0.08, edgecolor=ROSE, linewidth=1)
    ax.add_patch(warn_box)
    ax.text(7, 5.92, "A competitor must license ALL THREE patents to build a comparable system",
            ha="center", va="center", fontsize=10, color=ROSE, weight="bold")

    _add_watermark(fig)
    fig.tight_layout()
    fig.savefig(f"{OUT}/fig3_thicket.pdf", dpi=DPI, bbox_inches="tight")
    fig.savefig(f"{OUT}/fig3_thicket.png", dpi=DPI, bbox_inches="tight")
    plt.close(fig)


# ═══════════════════════════════════════════════════════════════
# FIGURE 4: Regulatory timeline — vertical swimlane
# ═══════════════════════════════════════════════════════════════
def fig_regulatory():
    fig, ax = plt.subplots(figsize=(10, 9))
    ax.set_xlim(-2, 8)
    ax.set_ylim(2017, 2036.5)
    ax.axis("off")
    ax.invert_yaxis()

    ax.text(3, 2017.3, "Regulatory Wave Driving PQC Adoption", size=16,
            weight="bold", ha="center", va="center")

    # Central timeline
    ax.plot([3, 3], [2018, 2036], color=GRID, lw=3, zorder=1)
    for y in range(2018, 2037):
        ax.plot(3, y, "o", color=GRID, markersize=3, zorder=2)

    events = [
        (2018, "left",  "GDPR Active", GREEN, "All EU data controllers\nRecital 26 = Patent 1"),
        (2024, "right", "NIS2 Directive", BLUE, "18 sectors, essential entities\nState-of-the-art crypto = PQC"),
        (2024.5, "left", "UK PSTI Act", SILVER, "All UK-sold IoT devices\nSecurity requirements"),
        (2025, "right", "DORA (Norway)", CYAN, "22,000+ EU/EEA financial entities\nArt. 6.4 quantum-readiness"),
        (2025.5, "left", "CNSA 2.0 Begins", AMBER, "All US National Security Systems\nML-KEM mandatory by 2030"),
        (2026, "right", "EU AI Act", VIOLET, "EU AI systems (phased)\nPII in training data = Anonymizer"),
        (2026.5, "left", "eIDAS 2.0", SILVER, "EU digital identity\nElectronic signatures need PQC"),
        (2030, "right", "RSA/ECC DEPRECATED", ROSE, "NIST deprecation deadline\nForced PQC migration begins"),
        (2035, "left",  "RSA/ECC DISALLOWED", ROSE, "NIST disallowance deadline\nClassical crypto = prohibited"),
    ]

    for year, side, title, color, desc in events:
        xdir = -1 if side == "left" else 1
        x_text = 3 + xdir * 2.5
        x_box = x_text - (1.8 if side == "left" else -0.2)

        # Connector
        ax.plot([3, x_text - xdir * 0.1], [year, year], color=color, lw=1.5, alpha=0.5)
        ax.plot(3, year, "o", color=color, markersize=8, zorder=3)

        # Box
        box_w = 3.6
        box_h = 0.65
        bx = x_box if side == "right" else x_box - 1.6
        bbox = FancyBboxPatch((bx, year - box_h/2), box_w, box_h,
                              boxstyle="round,pad=0.08", facecolor=SURFACE,
                              edgecolor=color, linewidth=1.5, alpha=0.95)
        ax.add_patch(bbox)

        ax.text(bx + box_w/2, year - 0.1, title, ha="center", va="center",
                fontsize=9.5, weight="bold", color=color)
        ax.text(bx + box_w/2, year + 0.2, desc, ha="center", va="center",
                fontsize=7, color=SILVER, linespacing=1.3)

    # QDaria window highlight
    ax.axhspan(2025, 2030, xmin=0.3, xmax=0.7, alpha=0.04, color=CYAN)
    ax.text(3, 2027.5, "QDaria\nWindow", ha="center", va="center",
            fontsize=12, color=CYAN, weight="bold", alpha=0.4,
            rotation=0, style="italic")

    _add_watermark(fig)
    fig.tight_layout()
    fig.savefig(f"{OUT}/fig4_regulatory.pdf", dpi=DPI, bbox_inches="tight")
    fig.savefig(f"{OUT}/fig4_regulatory.png", dpi=DPI, bbox_inches="tight")
    plt.close(fig)


# ═══════════════════════════════════════════════════════════════
# FIGURE 5: Valuation — horizontal bar with range + benchmarks
# ═══════════════════════════════════════════════════════════════
def fig_valuation():
    fig, ax = plt.subplots(figsize=(13, 7))

    items = [
        ("Combined\nPortfolio", 10, 100, WHITE, 1.0),
        ("", 0, 0, DARK, 0),  # Spacer
        ("Zipminator\nPlatform", 5, 30, GREEN, 0.85),
        ("Patent 2\nCSI / PUEK", 1, 50, CYAN, 0.85),
        ("Patent 3\nCHE / ARE", 0.5, 5, VIOLET, 0.85),
        ("Patent 1\nAnonymization", 0.2, 2, AMBER, 0.85),
    ]

    y_pos = np.arange(len(items))

    for i, (label, low, high, color, alpha) in enumerate(items):
        if high == 0:
            continue
        # Range bar
        ax.barh(i, high - low, left=low, height=0.55, color=color, alpha=alpha * 0.25,
                edgecolor=color, linewidth=1.5)
        # Low marker
        ax.plot(low, i, "|", color=color, markersize=18, markeredgewidth=2)
        # High marker
        ax.plot(high, i, "|", color=color, markersize=18, markeredgewidth=2)
        # Center dot
        mid = (low + high) / 2
        ax.plot(mid, i, "D", color=color, markersize=7, markeredgecolor=DARK,
                markeredgewidth=1, zorder=5)
        # Label
        ax.text(high + 1.5, i, f"${low}B – ${high}B", va="center",
                fontsize=11, weight="bold", color=color)

    ax.set_yticks(y_pos)
    ax.set_yticklabels([it[0] for it in items], fontsize=11, weight="bold")
    ax.set_xlabel("Estimated Value ($ Billion)", size=12)
    ax.set_title("QDaria Portfolio Valuation Range", size=16, weight="bold", pad=15)
    ax.set_xscale("log")
    ax.set_xlim(0.1, 200)
    ax.xaxis.set_major_formatter(mticker.FuncFormatter(
        lambda x, _: f"${x:.0f}B" if x >= 1 else f"${x*1000:.0f}M"))
    ax.grid(axis="x", alpha=0.15)
    ax.invert_yaxis()

    # Benchmark lines
    benchmarks = [
        (6, "Qualcomm\npatent royalties\n$6B/yr", SILVER),
        (3, "ARM licenses\n$3B/yr", SILVER),
        (1.3, "Dolby codecs\n$1.3B/yr", SILVER),
    ]
    for val, label, color in benchmarks:
        ax.axvline(x=val, color=color, linestyle=":", alpha=0.3, lw=1)
        ax.text(val, -0.3, label, ha="center", va="top", fontsize=7,
                color=color, alpha=0.6, linespacing=1.1)

    _add_watermark(fig)
    fig.tight_layout()
    fig.savefig(f"{OUT}/fig5_valuation.pdf", dpi=DPI, bbox_inches="tight")
    fig.savefig(f"{OUT}/fig5_valuation.png", dpi=DPI, bbox_inches="tight")
    plt.close(fig)


# ═══════════════════════════════════════════════════════════════
# FIGURE 6: Competitive landscape — dot matrix with better contrast
# ═══════════════════════════════════════════════════════════════
def fig_competitive():
    competitors = ["QDaria", "ID Quantique", "NordVPN", "ProtonMail", "Signal",
                   "Origin Wireless", "Anonos", "Qrypt", "Brave"]
    capabilities = ["QRNG", "CSI", "PQC\nCrypto", "Messenger",
                    "VoIP", "VPN", "Anon-\nymizer", "Email", "Browser", "Prov-\nenance"]

    # 1 = full, 0.5 = partial, 0 = none
    data = np.array([
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0.5, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0.5, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0.5, 1, 0, 1, 0, 1, 0, 0],
        [0, 0, 0.5, 1, 0.5, 0, 0, 0, 0, 0],
        [0, 0.5, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0.5],
        [0, 0, 0, 0, 0, 0.5, 0, 0, 1, 0],
    ])

    fig, ax = plt.subplots(figsize=(13, 7))
    ax.set_xlim(-0.5, len(capabilities) - 0.5)
    ax.set_ylim(-0.5, len(competitors) - 0.5)
    ax.invert_yaxis()

    # Grid lines
    for i in range(len(competitors)):
        ax.axhline(y=i, color=GRID, lw=0.5, alpha=0.3)
    for j in range(len(capabilities)):
        ax.axvline(x=j, color=GRID, lw=0.5, alpha=0.15)

    # Highlight QDaria row
    ax.axhspan(-0.5, 0.5, color=CYAN, alpha=0.06)

    # Dots
    for i in range(len(competitors)):
        for j in range(len(capabilities)):
            v = data[i, j]
            if v == 1:
                # Full circle with glow
                ax.plot(j, i, "o", color=CYAN, markersize=18, alpha=0.15)
                ax.plot(j, i, "o", color=CYAN, markersize=12,
                        markeredgecolor=DARK, markeredgewidth=1.5, zorder=5)
            elif v == 0.5:
                ax.plot(j, i, "o", color=AMBER, markersize=12,
                        markeredgecolor=DARK, markeredgewidth=1.5, zorder=5)
                # Half-fill effect: draw a white line through center
                ax.plot([j - 0.08, j + 0.08], [i, i], color=DARK, lw=2, zorder=6)
            else:
                ax.plot(j, i, "o", color=GRID, markersize=8, alpha=0.3)

    # Coverage count per row
    for i in range(len(competitors)):
        count = int(np.sum(data[i] >= 1))
        partial = int(np.sum(data[i] == 0.5))
        txt = f"{count}"
        if partial:
            txt += f"+{partial}"
        color = CYAN if i == 0 else SILVER
        ax.text(len(capabilities) + 0.2, i, txt, va="center", ha="left",
                fontsize=10, weight="bold", color=color)

    ax.text(len(capabilities) + 0.2, -0.7, "Full\n+Part.", va="center", ha="left",
            fontsize=7, color=SILVER)

    ax.set_xticks(range(len(capabilities)))
    ax.set_xticklabels(capabilities, fontsize=9, ha="center", weight="bold")
    ax.set_yticks(range(len(competitors)))
    ax.set_yticklabels(competitors, fontsize=10.5)
    # Bold QDaria label only
    ax.get_yticklabels()[0].set_weight("bold")
    ax.tick_params(top=True, bottom=False, labeltop=True, labelbottom=False)

    ax.set_title("Competitive Coverage Matrix", size=16, weight="bold", pad=25)

    # Legend
    legend_y = len(competitors) - 0.3
    for x, label, color, ms in [(1, "Full capability", CYAN, 12),
                                 (4, "Partial", AMBER, 12),
                                 (6.5, "None", GRID, 8)]:
        ax.plot(x - 0.3, legend_y, "o", color=color, markersize=ms,
                markeredgecolor=DARK, markeredgewidth=1, alpha=0.6 if color == GRID else 1)
        ax.text(x + 0.1, legend_y, label, va="center", fontsize=9, color=SILVER)

    _add_watermark(fig)
    fig.tight_layout()
    fig.savefig(f"{OUT}/fig6_competitive.pdf", dpi=DPI, bbox_inches="tight")
    fig.savefig(f"{OUT}/fig6_competitive.png", dpi=DPI, bbox_inches="tight")
    plt.close(fig)


# ═══════════════════════════════════════════════════════════════
# FIGURE 7 (NEW): Pillar value breakdown — bubble chart
# ═══════════════════════════════════════════════════════════════
def fig_pillars():
    fig, ax = plt.subplots(figsize=(14, 7))

    pillars = [
        ("Quantum\nVault", 100, 65, CYAN, 109),
        ("PQC\nMessenger", 85, 3000, VIOLET, 6),
        ("Quantum\nVoIP", 90, 300, GREEN, 33),
        ("Q-VPN", 90, 3500, AMBER, 0),
        ("10-Level\nAnonymizer", 95, 275, ROSE, 109),
        ("Q-AI\nAssistant", 85, 550, BLUE, 85),
        ("Quantum\nMail", 75, 3000, ORANGE, 15),
        ("Zip\nBrowser", 85, 1750, CYAN, 103),
        ("Q-Mesh", 90, 600, VIOLET, 106),
    ]

    for i, (name, completion, val_mid, color, tests) in enumerate(pillars):
        x = i
        y = completion
        size = np.sqrt(val_mid) * 3.5

        # Glow
        ax.plot(x, y, "o", color=color, markersize=size * 1.3, alpha=0.08)
        ax.plot(x, y, "o", color=color, markersize=size, alpha=0.2)
        # Main bubble
        ax.plot(x, y, "o", color=color, markersize=size * 0.7,
                markeredgecolor=color, markeredgewidth=1.5, alpha=0.6)

        # Name inside
        ax.text(x, y + 0.3, name, ha="center", va="center", fontsize=8,
                weight="bold", color=WHITE, linespacing=1.1)
        # Value below
        if val_mid >= 1000:
            val_str = f"${val_mid/1000:.0f}B"
        else:
            val_str = f"${val_mid}M"
        ax.text(x, y - 2.5, val_str, ha="center", va="center", fontsize=8,
                color=color, weight="bold")

    ax.set_xticks(range(len(pillars)))
    ax.set_xticklabels(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9"],
                       fontsize=9, color=SILVER)
    ax.set_ylabel("Completion (%)", size=12)
    ax.set_ylim(65, 105)
    ax.set_xlim(-0.8, 8.8)
    ax.grid(axis="y", alpha=0.15)
    ax.set_title("Zipminator: 9 Pillars — Each a Standalone Startup\nBubble Size = Estimated Market Value",
                 size=14, weight="bold", pad=15)

    _add_watermark(fig)
    fig.tight_layout()
    fig.savefig(f"{OUT}/fig7_pillars.pdf", dpi=DPI, bbox_inches="tight")
    fig.savefig(f"{OUT}/fig7_pillars.png", dpi=DPI, bbox_inches="tight")
    plt.close(fig)


if __name__ == "__main__":
    fig_radar()
    print("  [1/7] Radar chart")
    fig_market()
    print("  [2/7] Market (two-panel)")
    fig_thicket()
    print("  [3/7] Patent thicket")
    fig_regulatory()
    print("  [4/7] Regulatory timeline")
    fig_valuation()
    print("  [5/7] Valuation range")
    fig_competitive()
    print("  [6/7] Competitive matrix")
    fig_pillars()
    print("  [7/7] Pillar bubbles")
    print("All 7 figures generated.")
