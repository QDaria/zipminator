# Jupyter Book Phase 2: Visual/Layout Overhaul

> **Launch**: `cd ~/dev/qdaria/zipminator && claude --dangerously-skip-permissions`
> **Effort**: Use `--effort max` or ultrathink for all CSS/JS work
> **Env**: `micromamba activate zip-pqc` before any Python/pip command

## What Phase 1 Already Did (DO NOT REDO)

- Expanded viz.py from 9 → 24 chart types (viz.py 282 lines + viz_extended.py 331 lines)
- Tagged ALL code cells with `hide-input` (70 cells, 0 untagged)
- Added 7 CSS glow classes (.zm-glow, .zm-card-violet, .zm-card-emerald, .zm-card-amber, .zm-glow-animated, .zm-kpi-grid, .zm-chart-container, .zm-dashboard-row)
- Replaced raw Plotly in 4 notebooks with zm_* helpers or ZM_TEMPLATE
- Converted Monte Carlo notebook from matplotlib → Plotly (0 matplotlib remaining)
- Added 8 new rich charts across 7 notebooks (radars, sankeys, treemaps, funnels, KPI grids)
- Updated Ruflo 3.5.14 → 3.5.48 in CLAUDE.md
- Deleted duplicate notebooks (09_monte_carlo, Untitled.ipynb)
- Added Part VIII "Advanced Topics" to TOC
- Created 4 automation scripts in docs/book/scripts/
- Book builds successfully with 5 pre-existing warnings

## 9 Issues to Fix (from visual inspection of built book)

1. **Plots overflow content area** — Plotly charts have no max-width, spill into right sidebar
2. **Code fold/unfold inconsistent** — `details.hide` vs `.cell_input` mismatch; some cells fold, others don't
3. **Output cells not foldable** — no mechanism to collapse chart/output cells (only code cells fold)
4. **Light-on-light contrast** — myst-nb default CSS overrides dark theme; white text on light backgrounds in output areas
5. **Tables poorly styled** — default light backgrounds leak through, no dark-theme table styling
6. **Cards stacking** — two cards on top of each other with no gap/spacing
7. **Right sidebar too wide** — pushes content area, especially on narrower viewports
8. **No theme switching** — locked to sphinx-book-theme; need 5 themes available
9. **Overall design not world-class** — needs comprehensive polish across all components

## Execution Instructions

Use RALPH loop for every change:
- **R**: Read `.claude/rules/tdd-ralph.md`, read current file state
- **A**: Design fix (AskUserQuestion for non-obvious trade-offs)
- **L**: Implement (check in browser before/after)
- **P**: Run `/simplify`, remove dead CSS, clean naming
- **H**: Build book (`jupyter-book build . --all`), verify no regressions

Launch ALL 4 agents in parallel using Claude Code Agent tool (all Opus):

### Agent 1: Layout Fixer (Track D)

Create `docs/book/_static/custom-layout.css` with these rules:

```css
/* === Plotly chart containment === */
.js-plotly-plot, .plotly-graph-div {
  max-width: 100% !important;
  overflow: hidden;
}
.cell_output .js-plotly-plot { width: 100%; }

/* === Right sidebar narrower === */
.bd-sidebar-secondary { max-width: 230px; flex: 0 0 230px; font-size: 0.85rem; }

/* === Table dark styling === */
.bd-article-container table,
.bd-article-container .dataframe {
  background: var(--zm-bg-card);
  color: var(--zm-text);
  border-collapse: collapse;
  width: 100%;
  font-size: 0.9rem;
}
.bd-article-container th {
  background: rgba(34, 211, 238, 0.08);
  color: var(--zm-text-bright);
  border-bottom: 2px solid rgba(34, 211, 238, 0.2);
  padding: 10px 12px;
  text-align: left;
}
.bd-article-container td {
  border-bottom: 1px solid rgba(34, 211, 238, 0.06);
  padding: 8px 12px;
}
.bd-article-container tr:hover td {
  background: rgba(34, 211, 238, 0.04);
}

/* === Contrast: override myst-nb light defaults === */
.cell_output, .cell_output pre, .cell_output .output {
  background: var(--zm-bg-card) !important;
  color: var(--zm-text) !important;
}
.cell_input, .cell_input pre {
  background: var(--zm-bg-code) !important;
  color: var(--zm-text) !important;
}

/* === Card spacing === */
.sd-card + .sd-card { margin-top: 1rem; }
.sd-row > .sd-col { padding: 0.5rem; }

/* === Content area === */
.bd-article { max-width: calc(100vw - 560px); }

/* === Responsive === */
@media (max-width: 1024px) {
  .bd-sidebar-secondary { display: none; }
  .bd-article { max-width: 100%; }
}
@media (max-width: 768px) {
  .bd-sidebar-primary { display: none; }
}
```

Also edit `docs/book/_static/custom.css` line 317-322: add `max-width: 100%; overflow: hidden;` to `.js-plotly-plot, .plotly-graph-div`.

Edit `docs/book/_config.yml`: add `custom-layout.css` to `html_css_files` list.

### Agent 2: JS Enhancer (Track E1)

Rewrite `docs/book/_static/custom.js` to:
- Keep existing: Plotly download buttons, code download buttons, global toggle
- Fix: unify fold/unfold to target BOTH `details.hide` AND `.cell_input`
- Add: output cell folding — wrap `.cell_output` in `<details>` with "Show/Hide Output" toggle
- Add: per-cell toggle buttons (small eye icon per cell)
- Add: "Collapse All Outputs" / "Expand All Outputs" buttons in global toggle bar
- Safety: continue using createElement + textContent (no innerHTML)
- Timing: MutationObserver + 1.5s init delay (same as current)

### Agent 3: Theme Installer (Track E2)

```bash
micromamba activate zip-pqc
uv pip install sphinx-rtd-theme furo
```

Edit `docs/book/requirements.txt`: add `sphinx-rtd-theme>=2.0` and `furo>=2024.0`.

Create `docs/book/scripts/switch_theme.sh`:
- Arg: theme name (sphinx_book_theme, pydata_sphinx_theme, furo, alabaster, sphinx_rtd_theme)
- Backs up _config.yml
- Swaps html_theme value using sed
- Rebuilds with jupyter-book build . --all
- Restores original _config.yml
- Reports build status

### Agent 4: Viz Responsive (Track F)

Edit `docs/book/notebooks/_helpers/viz.py`:
- Add `autosize=True` to `_layout` in Plotly template (line 58)
- Add `ZM_CONFIG = {"responsive": True, "displayModeBar": "hover"}` after ZM_TEMPLATE
- Export ZM_CONFIG

Edit `docs/book/notebooks/_helpers/viz_extended.py`:
- Import ZM_CONFIG from viz.py
- Add autosize=True to any explicit fig.update_layout() calls

Create a script `docs/book/scripts/add_show_config.py` that walks all .ipynb files and replaces `fig.show()` with `fig.show(config=ZM_CONFIG)` in code cells. Run it.

## After All Agents Complete

1. Build: `cd docs/book && jupyter-book build . --all`
2. Quality: `python scripts/quality_check.py`
3. Open: `open _build/html/index.html`
4. Visual verify (Playwright screenshots or manual):
   - [ ] Plots fit within content area (no horizontal scroll)
   - [ ] Right sidebar narrower, not pushing content
   - [ ] Tables dark with cyan-accent headers
   - [ ] Code cells fold/unfold consistently
   - [ ] Output cells have show/hide toggle
   - [ ] No light-on-light contrast anywhere
   - [ ] Cards properly spaced
5. Theme test: `bash scripts/switch_theme.sh furo` + `bash scripts/switch_theme.sh pydata_sphinx_theme`
6. Run `/simplify` on all modified files
7. Run `/improve` for iterative enhancement pass
8. Commit: `feat(docs): jupyter book phase 2 visual overhaul`

## References

- `.claude/rules/tdd-ralph.md` — RALPH protocol, quality gates
- `.claude/rules/model-routing.md` — Opus for CSS/design work
- `.claude/rules/zero-hallucination.md` — verify all claims
- `docs/guides/claude-flow-v3/scripts/ralph-loop.sh` — automation
- `CLAUDE.md` — session defaults (auto-commit, no PR, solo dev on main)
- `docs/book/scripts/quality_check.py` — automated quality validation
- `docs/book/scripts/tag_cells.py` — cell tag maintenance
