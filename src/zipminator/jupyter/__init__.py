"""Zipminator JupyterLab integration -- IPython magics and ipywidgets."""

from __future__ import annotations


def load_ipython_extension(ipython) -> None:  # type: ignore[no-untyped-def]
    from .magics import ZipminatorMagics

    ipython.register_magics(ZipminatorMagics)


def _repr_html_() -> str:
    from zipminator import __version__

    return (
        '<span style="color:#6366f1;font-weight:bold">'
        f"Zipminator PQC v{__version__}</span> "
        '&mdash; <code>%load_ext zipminator.jupyter</code> to activate magics'
    )


__all__ = ["load_ipython_extension"]
