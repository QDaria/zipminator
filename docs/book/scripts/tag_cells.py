#!/usr/bin/env python3
"""Add 'hide-input' tag to all code cells in Jupyter notebooks.

Usage:
    python tag_cells.py [--check] [--dir ../notebooks/]

    --check: Report untagged cells without modifying files
    --dir:   Directory to scan (default: ../notebooks/)
"""
import json
import sys
from pathlib import Path

def tag_notebook(path: Path, check_only: bool = False) -> int:
    """Add hide-input to untagged code cells. Returns count of cells tagged."""
    try:
        with open(path) as f:
            nb = json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        print(f"  WARNING: skipping {path.name} ({e})")
        return 0

    tagged = 0
    for cell in nb.get("cells", []):
        if cell.get("cell_type") != "code":
            continue
        tags = cell.setdefault("metadata", {}).setdefault("tags", [])
        if "hide-input" not in tags:
            if not check_only:
                tags.append("hide-input")
            tagged += 1

    if tagged > 0 and not check_only:
        with open(path, "w") as f:
            json.dump(nb, f, indent=1, ensure_ascii=False)
            f.write("\n")

    return tagged

def main():
    check_only = "--check" in sys.argv
    dir_arg = "../notebooks/"
    for i, arg in enumerate(sys.argv):
        if arg == "--dir" and i + 1 < len(sys.argv):
            dir_arg = sys.argv[i + 1]

    notebooks_dir = Path(__file__).parent / dir_arg
    total = 0
    for nb_path in sorted(notebooks_dir.glob("*.ipynb")):
        count = tag_notebook(nb_path, check_only)
        if count > 0:
            action = "untagged" if check_only else "tagged"
            print(f"  {nb_path.name}: {count} cells {action}")
            total += count

    if check_only:
        print(f"\nTotal untagged cells: {total}")
        sys.exit(1 if total > 0 else 0)
    else:
        print(f"\nTotal cells tagged: {total}")

if __name__ == "__main__":
    main()
