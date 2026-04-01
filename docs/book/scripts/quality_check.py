#!/usr/bin/env python3
"""Quality checker for Zipminator Jupyter Book.

Validates:
- All code cells have hide-input tag
- No raw plotly.graph_objects imports (should use viz.py helpers)
- No matplotlib imports (Plotly only)
- TOC matches notebooks on disk
- File line counts under 500

Usage: python quality_check.py
Exit code: 0 = all pass, 1 = failures found
"""
import json
import sys
from pathlib import Path

BOOK_DIR = Path(__file__).parent.parent
NOTEBOOKS_DIR = BOOK_DIR / "notebooks"
HELPERS_DIR = NOTEBOOKS_DIR / "_helpers"
STATIC_DIR = BOOK_DIR / "_static"

PASS = "\033[92mPASS\033[0m"
FAIL = "\033[91mFAIL\033[0m"
WARN = "\033[93mWARN\033[0m"

failures = 0


def check(name: str, ok: bool, detail: str = ""):
    global failures
    status = PASS if ok else FAIL
    if not ok:
        failures += 1
    msg = f"  [{status}] {name}"
    if detail and not ok:
        msg += f" — {detail}"
    print(msg)


def check_cell_tags():
    """All code cells must have hide-input tag."""
    print("\n--- Cell Tags ---")
    for nb_path in sorted(NOTEBOOKS_DIR.glob("*.ipynb")):
        with open(nb_path) as f:
            nb = json.load(f)
        untagged = 0
        for cell in nb.get("cells", []):
            if cell.get("cell_type") != "code":
                continue
            tags = cell.get("metadata", {}).get("tags", [])
            if "hide-input" not in tags:
                untagged += 1
        check(nb_path.name, untagged == 0, f"{untagged} untagged code cells")


def check_no_matplotlib():
    """No matplotlib imports in notebooks."""
    print("\n--- No Matplotlib ---")
    for nb_path in sorted(NOTEBOOKS_DIR.glob("*.ipynb")):
        with open(nb_path) as f:
            content = f.read()
        has_mpl = "matplotlib" in content
        check(nb_path.name, not has_mpl, "contains matplotlib import")


def check_no_raw_plotly():
    """Warn (not fail) on raw plotly imports outside viz.py."""
    print("\n--- Raw Plotly Usage (warnings) ---")
    for nb_path in sorted(NOTEBOOKS_DIR.glob("*.ipynb")):
        with open(nb_path) as f:
            content = f.read()
        has_raw = "import plotly" in content and "viz" not in nb_path.name
        if has_raw:
            print(f"  [{WARN}] {nb_path.name} — has raw plotly import (consider using viz.py)")


def check_toc_sync():
    """All notebooks in TOC exist on disk."""
    print("\n--- TOC Sync ---")
    import yaml

    toc_path = BOOK_DIR / "_toc.yml"
    if not toc_path.exists():
        check("_toc.yml exists", False, "file not found")
        return

    with open(toc_path) as f:
        toc = yaml.safe_load(f)

    nb_refs = []
    for part in toc.get("parts", []):
        for chapter in part.get("chapters", []):
            f = chapter.get("file", "")
            if f.startswith("notebooks/"):
                nb_refs.append(f)
            for section in chapter.get("sections", []):
                f = section.get("file", "")
                if f.startswith("notebooks/"):
                    nb_refs.append(f)

    for ref in nb_refs:
        full_path = BOOK_DIR / f"{ref}.ipynb"
        check(ref, full_path.exists(), f"{full_path} not found")


def check_line_counts():
    """Key files must be under 500 lines."""
    print("\n--- Line Counts (max 500) ---")
    files_to_check = [
        HELPERS_DIR / "viz.py",
        HELPERS_DIR / "viz_extended.py",
        STATIC_DIR / "custom.css",
        STATIC_DIR / "custom.js",
    ]
    for fp in files_to_check:
        if not fp.exists():
            continue
        lines = len(fp.read_text().splitlines())
        check(fp.name, lines <= 500, f"{lines} lines")


def main():
    print("=== Zipminator Jupyter Book Quality Check ===")
    print(f"Book directory: {BOOK_DIR}")

    check_cell_tags()
    check_no_matplotlib()
    check_no_raw_plotly()
    check_line_counts()

    try:
        check_toc_sync()
    except ImportError:
        print(f"\n  [{WARN}] PyYAML not installed — skipping TOC sync check")

    print(f"\n{'='*50}")
    if failures > 0:
        print(f"  {failures} check(s) FAILED")
        sys.exit(1)
    else:
        print(f"  All checks PASSED")
        sys.exit(0)


if __name__ == "__main__":
    main()
