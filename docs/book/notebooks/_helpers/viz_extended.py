"""
Zipminator Extended Chart Types
================================

15 additional Plotly visualizations using the quantum-dark theme from viz.py.

    from _helpers.viz import *          # base + extended via re-export
    fig = zm_radar(categories, {"A": [1,2,3]}, title="Radar")
"""

from _helpers.viz import ZM_COLORS, ZM_CYCLE, ZM_TEMPLATE, go, make_subplots, np

__all__ = [
    "zm_radar",
    "zm_area",
    "zm_stacked_bar",
    "zm_grouped_bar",
    "zm_funnel",
    "zm_treemap",
    "zm_sankey",
    "zm_waterfall",
    "zm_box",
    "zm_violin",
    "zm_sunburst",
    "zm_bullet",
    "zm_sparkline",
    "zm_kpi_card",
    "zm_card_grid",
]


# ── Radar / Spider ──────────────────────────────────────────

def zm_radar(categories, values_dict, title="", **kwargs):
    """Polar radar chart. values_dict maps series name -> list of values."""
    fig = go.Figure()
    cats = list(categories) + [categories[0]]  # close the polygon
    for i, (name, vals) in enumerate(values_dict.items()):
        fig.add_trace(go.Scatterpolar(
            r=list(vals) + [vals[0]],
            theta=cats,
            name=name,
            fill="toself",
            fillcolor=ZM_CYCLE[i % len(ZM_CYCLE)].replace(")", ",0.15)").replace("rgb", "rgba").replace("#", "#"),
            line=dict(color=ZM_CYCLE[i % len(ZM_CYCLE)], width=2),
            **kwargs,
        ))
    fig.update_layout(
        title=title,
        polar=dict(
            bgcolor="#0f172a",
            angularaxis=dict(gridcolor="rgba(34,211,238,0.12)", tickfont=dict(color="#94a3b8")),
            radialaxis=dict(gridcolor="rgba(34,211,238,0.12)", tickfont=dict(color="#94a3b8")),
        ),
    )
    return fig


# ── Area Chart ──────────────────────────────────────────────

def zm_area(x, y_dict, title="", stacked=False, **kwargs):
    """Area chart. y_dict maps series name -> y-values. stacked=True stacks them."""
    fig = go.Figure()
    fill = "tonexty" if stacked else "tozeroy"
    for i, (name, y) in enumerate(y_dict.items()):
        kw = dict(stackgroup="one") if stacked else dict(fill=fill)
        color = ZM_CYCLE[i % len(ZM_CYCLE)]
        fig.add_trace(go.Scatter(
            x=x, y=y, name=name, mode="lines",
            line=dict(color=color, width=2),
            **kw, **kwargs,
        ))
    fig.update_layout(title=title)
    return fig


# ── Stacked Bar ─────────────────────────────────────────────

def zm_stacked_bar(x, y_dict, title="", horizontal=False, **kwargs):
    """Stacked bar chart. y_dict maps series name -> values."""
    fig = go.Figure()
    orientation = "h" if horizontal else "v"
    for i, (name, y) in enumerate(y_dict.items()):
        fig.add_trace(go.Bar(
            x=y if horizontal else x,
            y=x if horizontal else y,
            name=name,
            orientation=orientation,
            marker_color=ZM_CYCLE[i % len(ZM_CYCLE)],
            **kwargs,
        ))
    fig.update_layout(title=title, barmode="stack")
    return fig


# ── Grouped Bar ─────────────────────────────────────────────

def zm_grouped_bar(x, y_dict, title="", horizontal=False, **kwargs):
    """Grouped bar chart. y_dict maps series name -> values."""
    fig = go.Figure()
    orientation = "h" if horizontal else "v"
    for i, (name, y) in enumerate(y_dict.items()):
        fig.add_trace(go.Bar(
            x=y if horizontal else x,
            y=x if horizontal else y,
            name=name,
            orientation=orientation,
            marker_color=ZM_CYCLE[i % len(ZM_CYCLE)],
            **kwargs,
        ))
    fig.update_layout(title=title, barmode="group")
    return fig


# ── Funnel ──────────────────────────────────────────────────

def zm_funnel(stages, values, title="", **kwargs):
    """Funnel chart with quantum colors per stage."""
    fig = go.Figure(go.Funnel(
        y=stages, x=values,
        marker=dict(color=ZM_CYCLE[:len(stages)]),
        textinfo="value+percent initial",
        textfont=dict(color="#f8fafc"),
        **kwargs,
    ))
    fig.update_layout(title=title)
    return fig


# ── Treemap ─────────────────────────────────────────────────

def zm_treemap(labels, parents, values, title="", **kwargs):
    """Treemap with quantum colorscale."""
    fig = go.Figure(go.Treemap(
        labels=labels, parents=parents, values=values,
        marker=dict(
            colorscale=[[0, "#0f172a"], [0.5, "#22d3ee"], [1, "#a78bfa"]],
            line=dict(color="#0a0f1e", width=1),
        ),
        textfont=dict(color="#f8fafc"),
        **kwargs,
    ))
    fig.update_layout(title=title)
    return fig


# ── Sankey ──────────────────────────────────────────────────

def zm_sankey(labels, sources, targets, values, title="", **kwargs):
    """Sankey diagram with quantum-colored links."""
    link_colors = [ZM_CYCLE[s % len(ZM_CYCLE)].replace(")", ",0.4)").replace("rgb", "rgba")
                   if ZM_CYCLE[s % len(ZM_CYCLE)].startswith("rgb") else
                   ZM_CYCLE[s % len(ZM_CYCLE)] + "66"
                   for s in sources]
    fig = go.Figure(go.Sankey(
        node=dict(
            label=labels,
            color=ZM_CYCLE[:len(labels)],
            pad=15, thickness=20,
            line=dict(color="#0a0f1e", width=0.5),
        ),
        link=dict(source=sources, target=targets, value=values, color=link_colors),
        **kwargs,
    ))
    fig.update_layout(title=title)
    return fig


# ── Waterfall ───────────────────────────────────────────────

def zm_waterfall(x, y, title="", measure=None, **kwargs):
    """Waterfall chart. measure: list of 'relative'|'total'|'absolute'."""
    m = measure or ["relative"] * len(y)
    fig = go.Figure(go.Waterfall(
        x=x, y=y, measure=m,
        increasing=dict(marker=dict(color=ZM_COLORS["emerald"])),
        decreasing=dict(marker=dict(color=ZM_COLORS["rose"])),
        totals=dict(marker=dict(color=ZM_COLORS["cyan"])),
        connector=dict(line=dict(color="rgba(34,211,238,0.3)", width=1)),
        textposition="outside",
        textfont=dict(color="#e2e8f0"),
        **kwargs,
    ))
    fig.update_layout(title=title)
    return fig


# ── Box Plot ────────────────────────────────────────────────

def zm_box(data_dict, title="", **kwargs):
    """Box plot. data_dict maps series name -> array of values."""
    fig = go.Figure()
    for i, (name, vals) in enumerate(data_dict.items()):
        fig.add_trace(go.Box(
            y=vals, name=name,
            marker_color=ZM_CYCLE[i % len(ZM_CYCLE)],
            line=dict(color=ZM_CYCLE[i % len(ZM_CYCLE)]),
            **kwargs,
        ))
    fig.update_layout(title=title)
    return fig


# ── Violin Plot ─────────────────────────────────────────────

def zm_violin(data_dict, title="", show_box=True, **kwargs):
    """Violin plot. data_dict maps series name -> array of values."""
    fig = go.Figure()
    for i, (name, vals) in enumerate(data_dict.items()):
        fig.add_trace(go.Violin(
            y=vals, name=name, box_visible=show_box,
            line_color=ZM_CYCLE[i % len(ZM_CYCLE)],
            fillcolor=ZM_CYCLE[i % len(ZM_CYCLE)].replace(")", ",0.2)").replace("rgb", "rgba")
            if ZM_CYCLE[i % len(ZM_CYCLE)].startswith("rgb") else ZM_CYCLE[i % len(ZM_CYCLE)] + "33",
            meanline_visible=True,
            **kwargs,
        ))
    fig.update_layout(title=title)
    return fig


# ── Sunburst ────────────────────────────────────────────────

def zm_sunburst(labels, parents, values, title="", **kwargs):
    """Sunburst chart with quantum colors."""
    fig = go.Figure(go.Sunburst(
        labels=labels, parents=parents, values=values,
        marker=dict(
            colorscale=[[0, "#0f172a"], [0.33, "#22d3ee"], [0.66, "#a78bfa"], [1, "#fb7185"]],
            line=dict(color="#0a0f1e", width=1),
        ),
        textfont=dict(color="#f8fafc"),
        **kwargs,
    ))
    fig.update_layout(title=title)
    return fig


# ── Bullet / Gauge ──────────────────────────────────────────

def zm_bullet(value, target, title="", ranges=None, **kwargs):
    """Bullet gauge with target line and colored range steps."""
    r = ranges or [target * 0.5, target * 0.8, target * 1.2]
    fig = go.Figure(go.Indicator(
        mode="number+gauge",
        value=value,
        number=dict(font=dict(color="#f8fafc", size=28)),
        title=dict(text=title, font=dict(color="#e2e8f0", size=14)),
        gauge=dict(
            axis=dict(range=[0, max(r)], tickfont=dict(color="#94a3b8")),
            bar=dict(color=ZM_COLORS["cyan"], thickness=0.6),
            bgcolor="#1e293b",
            bordercolor="rgba(34,211,238,0.2)",
            steps=[
                dict(range=[0, r[0]], color="rgba(34,211,238,0.05)"),
                dict(range=[r[0], r[1]], color="rgba(34,211,238,0.1)"),
                dict(range=[r[1], r[2]], color="rgba(34,211,238,0.15)"),
            ],
            threshold=dict(line=dict(color=ZM_COLORS["amber"], width=3), thickness=0.8, value=target),
        ),
        **kwargs,
    ))
    fig.update_layout(height=250)
    return fig


# ── Sparkline ───────────────────────────────────────────────

def zm_sparkline(y, title="", color=None, height=60, **kwargs):
    """Minimal sparkline: thin line, no axes, compact height."""
    fig = go.Figure(go.Scatter(
        y=y, mode="lines",
        line=dict(color=color or ZM_COLORS["cyan"], width=1.5),
        hoverinfo="y",
        **kwargs,
    ))
    fig.update_layout(
        title=dict(text=title, font=dict(size=11)),
        height=height, margin=dict(l=5, r=5, t=20, b=5),
        xaxis=dict(visible=False), yaxis=dict(visible=False),
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
    )
    return fig


# ── KPI Card ────────────────────────────────────────────────

def zm_kpi_card(value, title="", delta=None, prefix="", suffix="", **kwargs):
    """Single KPI indicator card with optional delta."""
    mode = "number+delta" if delta is not None else "number"
    delta_kw = dict(reference=value - delta, valueformat=".1f",
                    increasing=dict(color=ZM_COLORS["emerald"]),
                    decreasing=dict(color=ZM_COLORS["rose"])) if delta is not None else None
    fig = go.Figure(go.Indicator(
        mode=mode, value=value,
        number=dict(prefix=prefix, suffix=suffix, font=dict(color="#f8fafc", size=40)),
        delta=delta_kw,
        title=dict(text=title, font=dict(color="#94a3b8", size=14)),
        **kwargs,
    ))
    fig.update_layout(height=160, margin=dict(l=20, r=20, t=50, b=20))
    return fig


# ── Card Grid ───────────────────────────────────────────────

def zm_card_grid(cards, cols=3, **kwargs):
    """Grid of KPI indicator cards. cards: list of dicts with value, title, delta, prefix, suffix."""
    rows = -(-len(cards) // cols)  # ceiling division
    titles = [c.get("title", "") for c in cards]
    fig = make_subplots(rows=rows, cols=cols, subplot_titles=titles,
                        specs=[[{"type": "indicator"}] * cols for _ in range(rows)])
    for idx, c in enumerate(cards):
        r, col = divmod(idx, cols)
        mode = "number+delta" if c.get("delta") is not None else "number"
        delta_kw = dict(reference=c["value"] - c["delta"], valueformat=".1f",
                        increasing=dict(color=ZM_COLORS["emerald"]),
                        decreasing=dict(color=ZM_COLORS["rose"])) if c.get("delta") is not None else None
        fig.add_trace(go.Indicator(
            mode=mode, value=c["value"],
            number=dict(prefix=c.get("prefix", ""), suffix=c.get("suffix", ""),
                        font=dict(color="#f8fafc", size=32)),
            delta=delta_kw,
        ), row=r + 1, col=col + 1)
    fig.update_layout(height=160 * rows, margin=dict(l=20, r=20, t=50, b=20), **kwargs)
    return fig
