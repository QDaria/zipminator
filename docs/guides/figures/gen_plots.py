#!/usr/bin/env python3
"""Generate all figures for QDaria IP Assessment Report — v3 (readability fixes)."""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import numpy as np
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
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


def _wm(fig):
    fig.text(0.99, 0.01, "QDaria Quantum Research", fontsize=7,
             color=GRID, ha="right", va="bottom", alpha=0.5, style="italic")


# ═══════════════════════════════════════════════════════════════
# FIG 1: Radar
# ═══════════════════════════════════════════════════════════════
def fig_radar():
    cats = ["Novelty", "Defensibility", "Market\nReach", "Standard-\nEssential",
            "Implementation", "Regulatory\nAlignment", "Revenue\nPotential"]
    N = len(cats)
    angles = np.linspace(0, 2 * np.pi, N, endpoint=False).tolist() + [0]

    data = [
        ("Patent 2: CSI/PUEK  (9.4)",  [10, 10, 10, 9, 8, 9, 10], CYAN),
        ("Patent 3: CHE/ARE  (8.6)",   [10, 9, 7, 8, 8, 10, 8], VIOLET),
        ("Patent 1: Anon.  (8.6)",     [9, 9, 8, 7, 9, 10, 8], AMBER),
        ("Zipminator App  (8.3)",      [8, 8, 9, 6, 9, 9, 9], GREEN),
    ]

    fig, ax = plt.subplots(figsize=(9, 9), subplot_kw=dict(polar=True))
    for r in [2, 4, 6, 8, 10]:
        ax.fill(angles, [r]*(N+1), color=SURFACE if r % 4 == 0 else DARK, alpha=0.3)
        ax.plot(angles, [r]*(N+1), color=GRID, lw=0.5, alpha=0.4)

    for name, vals, color in data:
        vc = vals + vals[:1]
        ax.plot(angles, vc, linewidth=5, color=color, alpha=0.12)
        ax.plot(angles, vc, "o-", linewidth=2.2, label=name, color=color,
                markersize=6, markeredgecolor=DARK, markeredgewidth=1.5, zorder=5)
        ax.fill(angles, vc, alpha=0.06, color=color)

    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(cats, size=10, weight="bold")
    ax.set_ylim(0, 11)
    ax.set_yticks([2, 4, 6, 8, 10])
    ax.set_yticklabels(["2", "4", "6", "8", "10"], size=8, color=SILVER)
    ax.spines["polar"].set_color(GRID)
    ax.legend(loc="upper right", bbox_to_anchor=(1.42, 1.12), frameon=True,
              facecolor=SURFACE, edgecolor=GRID, fontsize=9.5, labelspacing=0.9)
    ax.set_title("QDaria IP Portfolio\nMulti-Dimensional Assessment",
                 size=16, pad=28, weight="bold")
    _wm(fig)
    fig.tight_layout()
    fig.savefig(f"{OUT}/fig1_radar.pdf", dpi=DPI, bbox_inches="tight")
    fig.savefig(f"{OUT}/fig1_radar.png", dpi=DPI, bbox_inches="tight")
    plt.close(fig)


# ═══════════════════════════════════════════════════════════════
# FIG 2: Market — two-panel (stacked area + CAGR lollipop)
# ═══════════════════════════════════════════════════════════════
def fig_market():
    years = [2025, 2027, 2030, 2033, 2035]
    core = [
        ("Post-Quantum Crypto",  [2, 4, 8, 12, 17.2], CYAN),
        ("QRNG",                 [0.5, 1, 2, 3.5, 5.5], VIOLET),
        ("Encrypted Comms",      [3, 5, 8, 11, 15], GREEN),
        ("Data Anonymization",   [1.5, 2.5, 5, 8, 12], AMBER),
        ("WiFi Sensing",         [1, 2, 5, 9, 15], ROSE),
        ("HSM / Key Mgmt",      [2, 3, 5, 7, 10], BLUE),
    ]

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 7),
                                    gridspec_kw={"width_ratios": [3, 2]})

    # Panel A: stacked area
    xs = np.array(years, dtype=float)
    ys = np.zeros(len(years))
    for name, vals, color in core:
        v = np.array(vals)
        ax1.fill_between(xs, ys, ys + v, alpha=0.35, color=color,
                         label=name, linewidth=0)
        ax1.plot(xs, ys + v, color=color, linewidth=1.8, alpha=0.8)
        ys += v

    ax1.set_xlabel("Year", size=12)
    ax1.set_ylabel("Market Size ($ Billion)", size=12)
    ax1.set_title("Core PQC & Adjacent Markets", size=14, weight="bold", pad=12)
    ax1.set_xticks(years)
    ax1.set_xlim(2024.5, 2035.5)
    ax1.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f"${x:.0f}B"))
    ax1.grid(axis="y", alpha=0.2)
    ax1.legend(loc="upper left", frameon=True, facecolor=SURFACE,
               edgecolor=GRID, fontsize=9)
    ax1.annotate(f"${ys[-1]:.0f}B", xy=(2035, ys[-1]),
                 xytext=(2033, ys[-1] + 8),
                 arrowprops=dict(arrowstyle="->", color=CYAN, lw=1.5),
                 fontsize=13, weight="bold", color=CYAN)

    # Panel B: CAGR lollipop
    cagr_data = [
        ("iGaming (QRNG)", 45, ORANGE),
        ("PQC", 40, CYAN),
        ("WiFi Sensing", 40, ROSE),
        ("QRNG", 35, VIOLET),
        ("Data Anon.", 30, AMBER),
        ("Encrypted Comms", 25, GREEN),
        ("HSM / Key Mgmt", 20, BLUE),
        ("VPN", 15, SILVER),
        ("Cybersec. (Global)", 15, SILVER),
    ]
    y_pos = np.arange(len(cagr_data))
    for i, (nm, cg, col) in enumerate(cagr_data):
        ax2.barh(i, cg, height=0.5, color=col, alpha=0.65, edgecolor=DARK)
        ax2.plot(cg, i, "o", color=col, markersize=10,
                 markeredgecolor=DARK, markeredgewidth=1.5, zorder=5)
        ax2.text(cg + 1.5, i, f"{cg}%", va="center", fontsize=10,
                 weight="bold", color=col)

    ax2.set_yticks(y_pos)
    ax2.set_yticklabels([d[0] for d in cagr_data], fontsize=10)
    ax2.set_xlabel("CAGR (%)", size=12)
    ax2.set_title("Growth Rates by Segment", size=14, weight="bold", pad=12)
    ax2.set_xlim(0, 55)
    ax2.grid(axis="x", alpha=0.15)
    ax2.invert_yaxis()

    _wm(fig)
    fig.tight_layout(w_pad=5)
    fig.savefig(f"{OUT}/fig2_market.pdf", dpi=DPI, bbox_inches="tight")
    fig.savefig(f"{OUT}/fig2_market.png", dpi=DPI, bbox_inches="tight")
    plt.close(fig)


# ═══════════════════════════════════════════════════════════════
# FIG 3: Patent thicket — larger text, visible arrows
# ═══════════════════════════════════════════════════════════════
def fig_thicket():
    fig, ax = plt.subplots(figsize=(16, 8))
    ax.set_xlim(-0.5, 16)
    ax.set_ylim(-0.5, 8.5)
    ax.axis("off")

    ax.text(7.75, 8, "The QDaria Patent Thicket", size=20, weight="bold",
            ha="center")
    ax.text(7.75, 7.3, "Three interlocking patents covering the complete entropy lifecycle",
            size=12, ha="center", color=SILVER, style="italic")

    boxes = [
        (0.3, 1.8, 4.5, 4.5, CYAN, "GENERATION", "Patent 2: CSI/PUEK", "9.4/10",
         ["WiFi CSI extraction", "Unilateral (single device)", "PUEK eigenstructure",
          "18.2B addressable devices", "14 claims filed"]),
        (5.75, 1.8, 4.5, 4.5, VIOLET, "COMPOSITION", "Patent 3: CHE/ARE", "8.6/10",
         ["Algebraic Randomness Extractors", "Domains: C, H, O, GF(p^n), Q_p",
          "Merkle provenance chain", "Multi-source entropy fusion", "17 claims filed"]),
        (11.2, 1.8, 4.5, 4.5, AMBER, "CONSUMPTION", "Patent 1: QRNG-OTP", "8.6/10",
         ["Quantum anonymization", "Born rule irreversibility", "GDPR Recital 26 threshold",
          "10-level system (L1-L10)", "15 claims filed"]),
    ]

    for x, y, w, h, color, phase, title, score, bullets in boxes:
        # Glow
        g = FancyBboxPatch((x-0.1, y-0.1), w+0.2, h+0.2, boxstyle="round,pad=0.2",
                           facecolor=color, alpha=0.04, edgecolor="none")
        ax.add_patch(g)
        # Box
        b = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.15",
                           facecolor=SURFACE, alpha=0.95, edgecolor=color, linewidth=2.5)
        ax.add_patch(b)
        # Phase
        ax.text(x + w/2, y + h - 0.35, phase, ha="center", va="top",
                fontsize=10, weight="bold", color=color, alpha=0.6,
                fontfamily="monospace")
        # Title
        ax.text(x + w/2, y + h - 0.85, title, ha="center", va="top",
                fontsize=13, weight="bold", color=WHITE)
        # Score
        sb = FancyBboxPatch((x + w/2 - 0.65, y + h - 1.6), 1.3, 0.45,
                            boxstyle="round,pad=0.08", facecolor=color, alpha=0.2,
                            edgecolor=color, linewidth=1.5)
        ax.add_patch(sb)
        ax.text(x + w/2, y + h - 1.38, score, ha="center", va="center",
                fontsize=12, weight="bold", color=color)
        # Bullets
        for i, bullet in enumerate(bullets):
            by = y + h - 2.1 - i * 0.5
            ax.plot(x + 0.5, by + 0.08, "s", color=color, markersize=4, alpha=0.5)
            ax.text(x + 0.8, by, bullet, fontsize=10.5, color=SILVER, va="top")

    # Arrows
    for x1, x2, col in [(4.8, 5.75, CYAN), (10.25, 11.2, VIOLET)]:
        arr = FancyArrowPatch((x1, 4.05), (x2, 4.05),
                              arrowstyle="Simple,tail_width=4,head_width=16,head_length=10",
                              color=col, alpha=0.5, mutation_scale=1)
        ax.add_patch(arr)
        ax.text((x1 + x2) / 2, 4.55, "feeds into", ha="center", fontsize=8,
                color=col, alpha=0.6, style="italic")

    # Bottom bar
    bb = FancyBboxPatch((0.3, 0.15), 15.4, 1.1, boxstyle="round,pad=0.12",
                        facecolor=GREEN, alpha=0.08, edgecolor=GREEN, linewidth=2)
    ax.add_patch(bb)
    ax.text(8, 0.85, "Zipminator Super-App", ha="center", fontsize=14,
            color=GREEN, weight="bold")
    ax.text(8, 0.4, "9 Pillars   |   1,584 Tests   |   6 Platforms   |   Score: 8.3/10   |   46 Patent Claims Total",
            ha="center", fontsize=10, color=GREEN, alpha=0.7)

    # Warning
    wb = FancyBboxPatch((2.5, 6.5), 10.5, 0.5, boxstyle="round,pad=0.1",
                        facecolor=ROSE, alpha=0.08, edgecolor=ROSE, linewidth=1)
    ax.add_patch(wb)
    ax.text(7.75, 6.75, "A competitor must license ALL THREE to build a comparable system",
            ha="center", fontsize=11, color=ROSE, weight="bold")

    _wm(fig)
    fig.tight_layout()
    fig.savefig(f"{OUT}/fig3_thicket.pdf", dpi=DPI, bbox_inches="tight")
    fig.savefig(f"{OUT}/fig3_thicket.png", dpi=DPI, bbox_inches="tight")
    plt.close(fig)


# ═══════════════════════════════════════════════════════════════
# FIG 4: Regulatory — horizontal timeline with staggered rows
# ═══════════════════════════════════════════════════════════════
def fig_regulatory():
    fig, ax = plt.subplots(figsize=(16, 7))
    ax.set_xlim(2017.5, 2036)
    ax.set_ylim(-2, 6)
    ax.axis("off")

    ax.text(2026.75, 5.5, "Regulatory Wave Driving PQC Adoption",
            size=18, weight="bold", ha="center")

    # Timeline bar
    ax.plot([2018, 2035.5], [0, 0], color=GRID, lw=4, zorder=1)
    for y in range(2018, 2036):
        ax.plot(y, 0, "o", color=GRID, markersize=4, zorder=2)
        if y % 2 == 0:
            ax.text(y, -0.4, str(y), ha="center", fontsize=8, color=SILVER)

    # Events with staggered y positions to avoid overlap
    events = [
        (2018, 2.0, "GDPR Active", GREEN,
         "All EU data controllers  |  Recital 26 = Patent 1"),
        (2024, 3.5, "NIS2 Directive", BLUE,
         "18 sectors  |  State-of-the-art crypto = PQC"),
        (2024.5, 1.5, "UK PSTI Act", SILVER,
         "UK IoT devices  |  Security requirements"),
        (2025, 4.5, "DORA (Norway)", CYAN,
         "22,000+ financial entities  |  Art. 6.4 quantum-readiness"),
        (2026, 2.5, "CNSA 2.0", AMBER,
         "US National Security  |  ML-KEM by 2030"),
        (2027, 3.5, "EU AI Act", VIOLET,
         "AI systems  |  PII in training data = Anonymizer"),
        (2028, 1.5, "eIDAS 2.0", SILVER,
         "EU digital identity  |  Signatures need PQC"),
        (2030, 4.5, "RSA/ECC DEPRECATED", ROSE,
         "NIST deprecation  |  Forced PQC migration"),
        (2035, 2.5, "RSA/ECC DISALLOWED", ROSE,
         "NIST disallowance  |  Classical crypto prohibited"),
    ]

    for xyr, ypos, title, color, desc in events:
        # Vertical line from timeline to box
        ax.plot([xyr, xyr], [0.15, ypos - 0.35], color=color, lw=1.5, alpha=0.4)
        ax.plot(xyr, 0, "o", color=color, markersize=9, zorder=3)

        # Box
        bw, bh = 3.2, 0.7
        bx = xyr - bw / 2
        bbox = FancyBboxPatch((bx, ypos - bh/2), bw, bh,
                              boxstyle="round,pad=0.08", facecolor=SURFACE,
                              edgecolor=color, linewidth=1.8, alpha=0.95)
        ax.add_patch(bbox)

        ax.text(xyr, ypos + 0.05, title, ha="center", va="center",
                fontsize=10, weight="bold", color=color)
        ax.text(xyr, ypos - 0.25, desc, ha="center", va="center",
                fontsize=7.5, color=SILVER)

    # QDaria window
    ax.axvspan(2025, 2030, ymin=0.05, ymax=0.25, alpha=0.08, color=CYAN)
    ax.text(2027.5, -1.2, "QDaria Window: 2025 — 2030",
            ha="center", fontsize=13, color=CYAN, weight="bold", style="italic")
    ax.annotate("", xy=(2025, -1.5), xytext=(2030, -1.5),
                arrowprops=dict(arrowstyle="<->", color=CYAN, lw=2))

    _wm(fig)
    fig.tight_layout()
    fig.savefig(f"{OUT}/fig4_regulatory.pdf", dpi=DPI, bbox_inches="tight")
    fig.savefig(f"{OUT}/fig4_regulatory.png", dpi=DPI, bbox_inches="tight")
    plt.close(fig)


# ═══════════════════════════════════════════════════════════════
# FIG 5: Valuation — horizontal bars, benchmarks below
# ═══════════════════════════════════════════════════════════════
def fig_valuation():
    fig, ax = plt.subplots(figsize=(14, 7))

    items = [
        ("Combined Portfolio", 10, 100, WHITE),
        ("Zipminator Platform", 5, 30, GREEN),
        ("Patent 2: CSI / PUEK", 1, 50, CYAN),
        ("Patent 3: CHE / ARE", 0.5, 5, VIOLET),
        ("Patent 1: Anonymization", 0.2, 2, AMBER),
    ]

    y_pos = np.arange(len(items))

    for i, (label, low, high, color) in enumerate(items):
        ax.barh(i, high - low, left=low, height=0.5, color=color,
                alpha=0.25, edgecolor=color, linewidth=1.8)
        ax.plot(low, i, "|", color=color, markersize=20, markeredgewidth=2.5)
        ax.plot(high, i, "|", color=color, markersize=20, markeredgewidth=2.5)
        mid = np.sqrt(low * high)  # geometric mean for log scale
        ax.plot(mid, i, "D", color=color, markersize=8,
                markeredgecolor=DARK, markeredgewidth=1.5, zorder=5)
        ax.text(high * 1.15, i, f"${low}B — ${high}B", va="center",
                fontsize=11.5, weight="bold", color=color)

    ax.set_yticks(y_pos)
    ax.set_yticklabels([it[0] for it in items], fontsize=11.5, weight="bold")
    ax.set_xlabel("Estimated Value ($ Billion)", size=12)
    ax.set_title("QDaria Portfolio Valuation Range", size=16, weight="bold", pad=18)
    ax.set_xscale("log")
    ax.set_xlim(0.1, 250)
    ax.xaxis.set_major_formatter(mticker.FuncFormatter(
        lambda x, _: f"${x:.0f}B" if x >= 1 else f"${x*1000:.0f}M"))
    ax.grid(axis="x", alpha=0.12)
    ax.invert_yaxis()

    # Benchmarks as annotations BELOW the chart
    ax.text(0.12, len(items) + 0.3, "Benchmarks:", fontsize=9, color=SILVER,
            weight="bold", va="top")
    benchmarks = [
        (6, "Qualcomm patent royalties: $6B/yr"),
        (3, "ARM architecture licenses: $3B/yr"),
        (1.3, "Dolby codec patents: $1.3B/yr"),
    ]
    for val, label in benchmarks:
        ax.axvline(x=val, color=SILVER, linestyle=":", alpha=0.2, lw=1)
        ax.text(val, len(items) + 0.3, f"  {label}", fontsize=8,
                color=SILVER, alpha=0.7, va="top", rotation=0)

    ax.set_ylim(len(items) + 0.8, -0.6)

    _wm(fig)
    fig.tight_layout()
    fig.savefig(f"{OUT}/fig5_valuation.pdf", dpi=DPI, bbox_inches="tight")
    fig.savefig(f"{OUT}/fig5_valuation.png", dpi=DPI, bbox_inches="tight")
    plt.close(fig)


# ═══════════════════════════════════════════════════════════════
# FIG 6: Competitive matrix
# ═══════════════════════════════════════════════════════════════
def fig_competitive():
    competitors = ["QDaria", "ID Quantique", "NordVPN", "ProtonMail", "Signal",
                   "Origin Wireless", "Anonos", "Qrypt", "Brave"]
    caps = ["QRNG", "CSI", "PQC\nCrypto", "Messenger", "VoIP",
            "VPN", "Anon-\nymizer", "Email", "Browser", "Prov-\nenance"]

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

    fig, ax = plt.subplots(figsize=(14, 7.5))
    ax.set_xlim(-0.5, len(caps) + 0.8)
    ax.set_ylim(-0.5, len(competitors) - 0.5)
    ax.invert_yaxis()

    for i in range(len(competitors)):
        ax.axhline(y=i, color=GRID, lw=0.5, alpha=0.3)
    for j in range(len(caps)):
        ax.axvline(x=j, color=GRID, lw=0.5, alpha=0.15)

    ax.axhspan(-0.5, 0.5, color=CYAN, alpha=0.06)

    for i in range(len(competitors)):
        for j in range(len(caps)):
            v = data[i, j]
            if v == 1:
                ax.plot(j, i, "o", color=CYAN, markersize=20, alpha=0.12)
                ax.plot(j, i, "o", color=CYAN, markersize=13,
                        markeredgecolor=DARK, markeredgewidth=1.5, zorder=5)
            elif v == 0.5:
                ax.plot(j, i, "o", color=AMBER, markersize=13,
                        markeredgecolor=DARK, markeredgewidth=1.5, zorder=5)
                ax.plot([j-0.09, j+0.09], [i, i], color=DARK, lw=2.5, zorder=6)
            else:
                ax.plot(j, i, "o", color=GRID, markersize=8, alpha=0.3)

    # Coverage counts
    for i in range(len(competitors)):
        full = int(np.sum(data[i] >= 1))
        part = int(np.sum(data[i] == 0.5))
        txt = f"{full}" + (f"+{part}" if part else "")
        col = CYAN if i == 0 else SILVER
        ax.text(len(caps) + 0.3, i, txt, va="center", ha="left",
                fontsize=11, weight="bold", color=col)

    ax.text(len(caps) + 0.3, -0.65, "Count", va="center", ha="left",
            fontsize=8, color=SILVER, weight="bold")

    ax.set_xticks(range(len(caps)))
    ax.set_xticklabels(caps, fontsize=9.5, ha="center", weight="bold")
    ax.set_yticks(range(len(competitors)))
    ax.set_yticklabels(competitors, fontsize=11)
    ax.get_yticklabels()[0].set_weight("bold")
    ax.tick_params(top=True, bottom=False, labeltop=True, labelbottom=False)

    ax.set_title("Competitive Coverage Matrix", size=16, weight="bold", pad=28)

    # Legend at bottom
    ly = len(competitors) - 0.1
    for x, lbl, col, ms in [(1.5, "Full", CYAN, 13),
                              (4, "Partial", AMBER, 13),
                              (6.5, "None", GRID, 8)]:
        ax.plot(x-0.4, ly, "o", color=col, markersize=ms,
                markeredgecolor=DARK, markeredgewidth=1, alpha=0.5 if col==GRID else 1)
        ax.text(x, ly, lbl, va="center", fontsize=10, color=SILVER)

    _wm(fig)
    fig.tight_layout()
    fig.savefig(f"{OUT}/fig6_competitive.pdf", dpi=DPI, bbox_inches="tight")
    fig.savefig(f"{OUT}/fig6_competitive.png", dpi=DPI, bbox_inches="tight")
    plt.close(fig)


# ═══════════════════════════════════════════════════════════════
# FIG 7: Pillars — horizontal bar chart (NO overlapping bubbles)
# ═══════════════════════════════════════════════════════════════
def fig_pillars():
    fig, ax = plt.subplots(figsize=(14, 8))

    pillars = [
        ("P1: Quantum Vault",    100, 65,   CYAN,   "$65M"),
        ("P2: PQC Messenger",    85,  3000, VIOLET, "$3B"),
        ("P3: Quantum VoIP",     90,  300,  GREEN,  "$300M"),
        ("P4: Q-VPN",            90,  3500, AMBER,  "$3.5B"),
        ("P5: 10-Level Anon.",   95,  275,  ROSE,   "$275M"),
        ("P6: Q-AI Assistant",   85,  550,  BLUE,   "$550M"),
        ("P7: Quantum Mail",     75,  3000, ORANGE, "$3B"),
        ("P8: ZipBrowser",       85,  1750, CYAN,   "$1.75B"),
        ("P9: Q-Mesh",           90,  600,  VIOLET, "$600M"),
    ]

    y_pos = np.arange(len(pillars))
    max_val = max(p[2] for p in pillars)

    for i, (name, completion, val, color, val_str) in enumerate(pillars):
        # Value bar
        bar_width = val / max_val * 0.8  # normalize
        ax.barh(i, val, height=0.6, color=color, alpha=0.5,
                edgecolor=color, linewidth=1.5)

        # Value label
        ax.text(val + 80, i, val_str, va="center", fontsize=11,
                weight="bold", color=color)

        # Completion badge on right
        ax.text(max_val + 800, i, f"{completion}%", va="center", ha="center",
                fontsize=11, weight="bold", color=GREEN if completion >= 90 else AMBER,
                bbox=dict(boxstyle="round,pad=0.25", facecolor=SURFACE,
                          edgecolor=GREEN if completion >= 90 else AMBER,
                          linewidth=1.2, alpha=0.8))

    ax.set_yticks(y_pos)
    ax.set_yticklabels([p[0] for p in pillars], fontsize=11.5, weight="bold")
    ax.set_xlabel("Estimated Market Value ($ Million)", size=12)
    ax.set_title("Zipminator: 9 Pillars — Each a Standalone Startup",
                 size=16, weight="bold", pad=15)
    ax.xaxis.set_major_formatter(mticker.FuncFormatter(
        lambda x, _: f"${x/1000:.1f}B" if x >= 1000 else f"${x:.0f}M"))
    ax.set_xlim(0, max_val + 1200)
    ax.grid(axis="x", alpha=0.15)
    ax.invert_yaxis()

    # Column header for completion
    ax.text(max_val + 800, -0.7, "Done", ha="center", fontsize=9,
            color=SILVER, weight="bold")

    # Aggregate annotation
    total = sum(p[2] for p in pillars)
    ax.text(max_val / 2, len(pillars) + 0.3,
            f"Aggregate individual pillar valuation: ${total/1000:.0f}B+",
            ha="center", fontsize=12, color=WHITE, weight="bold", style="italic")
    ax.set_ylim(len(pillars) + 0.6, -1.0)

    _wm(fig)
    fig.tight_layout()
    fig.savefig(f"{OUT}/fig7_pillars.pdf", dpi=DPI, bbox_inches="tight")
    fig.savefig(f"{OUT}/fig7_pillars.png", dpi=DPI, bbox_inches="tight")
    plt.close(fig)


if __name__ == "__main__":
    for i, fn in enumerate([fig_radar, fig_market, fig_thicket, fig_regulatory,
                             fig_valuation, fig_competitive, fig_pillars], 1):
        fn()
        print(f"  [{i}/7] {fn.__name__}")
    print("All 7 figures generated.")
