"""
Zipminator Quantum Dark Theme — Plotly Visualization Helpers
============================================================

Provides a consistent quantum-dark theme for all Jupyter Book notebooks.
Import once at the top of each notebook:

    from _helpers.viz import *

This gives you:
- ZM_COLORS: dict of named quantum palette colors
- ZM_TEMPLATE: Plotly template with dark background + quantum accents
- zm_bar, zm_line, zm_scatter, zm_pie, zm_heatmap: quick chart functions
- zm_animated_bar: animated bar chart with frame transitions
- zm_3d_scatter: 3D scatter plot
- zm_subplots: multi-panel layout
"""

import plotly.graph_objects as go
import plotly.express as px
import plotly.io as pio
from plotly.subplots import make_subplots
import numpy as np

# Force Plotly to output full HTML (not just JSON MIME) for Jupyter Book compatibility.
# myst-nb does not render application/vnd.plotly.v1+json, but it DOES render text/html.
pio.renderers.default = "notebook_connected"

# ── Quantum Color Palette ────────────────────────────────────
ZM_COLORS = {
    "cyan":    "#22d3ee",
    "violet":  "#a78bfa",
    "emerald": "#34d399",
    "amber":   "#f59e0b",
    "rose":    "#fb7185",
    "blue":    "#60a5fa",
    "indigo":  "#818cf8",
    "teal":    "#2dd4bf",
    "orange":  "#fb923c",
    "pink":    "#f472b6",
}

# Ordered cycle for multi-series charts
ZM_CYCLE = [
    ZM_COLORS["cyan"],
    ZM_COLORS["violet"],
    ZM_COLORS["emerald"],
    ZM_COLORS["amber"],
    ZM_COLORS["rose"],
    ZM_COLORS["blue"],
    ZM_COLORS["indigo"],
    ZM_COLORS["teal"],
    ZM_COLORS["orange"],
    ZM_COLORS["pink"],
]

# ── Plotly Template ──────────────────────────────────────────
_layout = go.Layout(
    paper_bgcolor="#0a0f1e",
    plot_bgcolor="#0f172a",
    font=dict(family="DM Sans, sans-serif", size=13, color="#e2e8f0"),
    title=dict(font=dict(size=18, color="#f8fafc"), x=0.5),
    xaxis=dict(
        gridcolor="rgba(34,211,238,0.08)",
        zerolinecolor="rgba(34,211,238,0.15)",
        tickfont=dict(color="#94a3b8"),
    ),
    yaxis=dict(
        gridcolor="rgba(34,211,238,0.08)",
        zerolinecolor="rgba(34,211,238,0.15)",
        tickfont=dict(color="#94a3b8"),
    ),
    colorway=ZM_CYCLE,
    legend=dict(
        bgcolor="rgba(15,23,42,0.8)",
        bordercolor="rgba(34,211,238,0.15)",
        borderwidth=1,
        font=dict(color="#e2e8f0"),
    ),
    hoverlabel=dict(
        bgcolor="#1e293b",
        bordercolor="#22d3ee",
        font=dict(color="#f8fafc", size=12),
    ),
    margin=dict(l=60, r=30, t=60, b=50),
)

ZM_TEMPLATE = go.layout.Template(layout=_layout)
pio.templates["quantum_dark"] = ZM_TEMPLATE
pio.templates.default = "quantum_dark"


# ── Quick Chart Functions ────────────────────────────────────

def zm_bar(x, y, title="", color=None, horizontal=False, text=None, **kwargs):
    """Quick quantum-themed bar chart."""
    orientation = "h" if horizontal else "v"
    fig = go.Figure(go.Bar(
        x=y if horizontal else x,
        y=x if horizontal else y,
        orientation=orientation,
        marker_color=color or ZM_COLORS["cyan"],
        text=text,
        textposition="auto" if text else None,
        **kwargs,
    ))
    fig.update_layout(title=title)
    return fig


def zm_line(x, y_dict, title="", **kwargs):
    """Quick multi-line chart. y_dict = {"Series A": [1,2,3], ...}."""
    fig = go.Figure()
    for i, (name, y) in enumerate(y_dict.items()):
        fig.add_trace(go.Scatter(
            x=x, y=y, name=name, mode="lines+markers",
            line=dict(color=ZM_CYCLE[i % len(ZM_CYCLE)], width=2),
            marker=dict(size=5),
            **kwargs,
        ))
    fig.update_layout(title=title)
    return fig


def zm_scatter(x, y, title="", color=None, size=None, text=None, **kwargs):
    """Quick scatter plot with optional size/color encoding."""
    fig = go.Figure(go.Scatter(
        x=x, y=y, mode="markers",
        marker=dict(
            color=color if color is not None else ZM_COLORS["cyan"],
            size=size if size is not None else 8,
            opacity=0.8,
            line=dict(width=1, color="rgba(34,211,238,0.3)"),
        ),
        text=text,
        hoverinfo="text+x+y" if text else "x+y",
        **kwargs,
    ))
    fig.update_layout(title=title)
    return fig


def zm_pie(labels, values, title="", hole=0.4, **kwargs):
    """Quantum-themed donut chart."""
    fig = go.Figure(go.Pie(
        labels=labels, values=values, hole=hole,
        marker=dict(colors=ZM_CYCLE[:len(labels)]),
        textinfo="label+percent",
        textfont=dict(color="#f8fafc"),
        **kwargs,
    ))
    fig.update_layout(title=title)
    return fig


def zm_heatmap(z, x=None, y=None, title="", colorscale=None, **kwargs):
    """Quantum-themed heatmap."""
    cs = colorscale or [
        [0.0, "#0a0f1e"], [0.25, "#1e3a5f"], [0.5, "#22d3ee"],
        [0.75, "#a78bfa"], [1.0, "#fb7185"],
    ]
    fig = go.Figure(go.Heatmap(
        z=z, x=x, y=y, colorscale=cs,
        colorbar=dict(tickfont=dict(color="#94a3b8")),
        **kwargs,
    ))
    fig.update_layout(title=title)
    return fig


def zm_animated_bar(frames_data, title="", x_label="", y_label=""):
    """
    Animated bar chart with play/pause.

    frames_data: list of dicts with keys "name", "x", "y", "color" (optional).
    Each dict becomes one animation frame.
    """
    if not frames_data:
        return go.Figure()

    first = frames_data[0]
    fig = go.Figure(
        data=[go.Bar(
            x=first["x"], y=first["y"],
            marker_color=first.get("color", ZM_COLORS["cyan"]),
        )],
        frames=[
            go.Frame(
                data=[go.Bar(
                    x=f["x"], y=f["y"],
                    marker_color=f.get("color", ZM_COLORS["cyan"]),
                )],
                name=f["name"],
            )
            for f in frames_data
        ],
    )
    fig.update_layout(
        title=title,
        xaxis_title=x_label,
        yaxis_title=y_label,
        updatemenus=[dict(
            type="buttons", showactive=False, x=0.05, y=1.12,
            buttons=[
                dict(label="Play", method="animate",
                     args=[None, {"frame": {"duration": 500}, "fromcurrent": True}]),
                dict(label="Pause", method="animate",
                     args=[[None], {"frame": {"duration": 0}, "mode": "immediate"}]),
            ],
        )],
        sliders=[dict(
            active=0, yanchor="top", y=-0.1, x=0.05, len=0.9,
            steps=[
                dict(args=[[f["name"]], {"frame": {"duration": 300}, "mode": "immediate"}],
                     label=f["name"], method="animate")
                for f in frames_data
            ],
        )],
    )
    return fig


def zm_3d_scatter(x, y, z, title="", color=None, size=3, text=None, **kwargs):
    """3D scatter plot with quantum dark theme."""
    fig = go.Figure(go.Scatter3d(
        x=x, y=y, z=z, mode="markers",
        marker=dict(
            size=size, opacity=0.8,
            color=color if color is not None else z,
            colorscale=[[0, "#22d3ee"], [0.5, "#a78bfa"], [1, "#fb7185"]],
            colorbar=dict(tickfont=dict(color="#94a3b8")),
        ),
        text=text,
        **kwargs,
    ))
    fig.update_layout(
        title=title,
        scene=dict(
            xaxis=dict(backgroundcolor="#0f172a", gridcolor="rgba(34,211,238,0.1)"),
            yaxis=dict(backgroundcolor="#0f172a", gridcolor="rgba(34,211,238,0.1)"),
            zaxis=dict(backgroundcolor="#0f172a", gridcolor="rgba(34,211,238,0.1)"),
            bgcolor="#0a0f1e",
        ),
    )
    return fig


def zm_subplots(rows, cols, titles=None, **kwargs):
    """Create a subplot grid with quantum theme applied."""
    fig = make_subplots(rows=rows, cols=cols, subplot_titles=titles, **kwargs)
    fig.update_layout(template=ZM_TEMPLATE)
    return fig


def zm_gauge(value, title="", max_val=100, suffix="%"):
    """Quantum-themed gauge/indicator chart."""
    fig = go.Figure(go.Indicator(
        mode="gauge+number",
        value=value,
        number=dict(suffix=suffix, font=dict(color="#f8fafc", size=36)),
        title=dict(text=title, font=dict(color="#e2e8f0", size=16)),
        gauge=dict(
            axis=dict(range=[0, max_val], tickfont=dict(color="#94a3b8")),
            bar=dict(color=ZM_COLORS["cyan"]),
            bgcolor="#1e293b",
            bordercolor="rgba(34,211,238,0.2)",
            steps=[
                dict(range=[0, max_val * 0.5], color="rgba(34,211,238,0.05)"),
                dict(range=[max_val * 0.5, max_val * 0.8], color="rgba(34,211,238,0.1)"),
                dict(range=[max_val * 0.8, max_val], color="rgba(34,211,238,0.15)"),
            ],
            threshold=dict(
                line=dict(color=ZM_COLORS["emerald"], width=3),
                thickness=0.8, value=value,
            ),
        ),
    ))
    fig.update_layout(height=300)
    return fig


from _helpers.viz_extended import *  # noqa: F401,F403 — Extended chart types
