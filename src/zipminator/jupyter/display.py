"""Rich HTML formatters for Jupyter notebook cells."""

from __future__ import annotations

import html
from typing import Any, Dict, List, Optional

# Brand colours
INDIGO = "#6366f1"
GREEN = "#10b981"
RED = "#ef4444"
AMBER = "#f59e0b"
NAVY = "#0f172a"
SLATE = "#94a3b8"
BG_DARK = "#1e293b"

_BASE_STYLE = (
    "font-family:'JetBrains Mono',Menlo,monospace;font-size:13px;"
    f"background:{BG_DARK};color:#e2e8f0;padding:16px;border-radius:8px;"
    "line-height:1.6;overflow-x:auto;"
)

_BADGE = (
    "display:inline-block;padding:2px 8px;border-radius:4px;"
    "font-size:11px;font-weight:600;letter-spacing:0.5px;"
)


def _badge(label: str, colour: str) -> str:
    return f'<span style="{_BADGE}background:{colour};color:#fff">{html.escape(label)}</span>'


def _row(label: str, value: str, colour: str = SLATE) -> str:
    return (
        f'<tr><td style="padding:4px 12px 4px 0;color:{SLATE}">{html.escape(label)}</td>'
        f'<td style="padding:4px 0;color:{colour}">{value}</td></tr>'
    )


def _hex_preview(data: bytes, max_bytes: int = 32) -> str:
    preview = data[:max_bytes].hex()
    spaced = " ".join(preview[i : i + 2] for i in range(0, len(preview), 2))
    suffix = " ..." if len(data) > max_bytes else ""
    return f'<code style="color:{INDIGO}">{spaced}{suffix}</code>'


def render_keygen_result(
    pk: bytes,
    sk: bytes,
    elapsed_ms: float,
    quantum_seed: bool = False,
) -> str:
    seed_badge = _badge("QUANTUM SEED", GREEN) if quantum_seed else _badge("SYSTEM RNG", SLATE)
    rows = "".join([
        _row("Public key", f"{len(pk)} bytes"),
        _row("Secret key", f"{len(sk)} bytes"),
        _row("PK preview", _hex_preview(pk)),
        _row("Elapsed", f"{elapsed_ms:.2f} ms", GREEN),
        _row("Entropy", seed_badge),
    ])
    return (
        f'<div style="{_BASE_STYLE}">'
        f'{_badge("KEYGEN", INDIGO)} '
        f'{_badge("ML-KEM-768", NAVY)}'
        f'<table style="margin-top:8px;border-collapse:collapse">{rows}</table>'
        "</div>"
    )


def render_encapsulate_result(
    ct: bytes,
    ss: bytes,
    elapsed_ms: float,
) -> str:
    rows = "".join([
        _row("Ciphertext", f"{len(ct)} bytes"),
        _row("Shared secret", f"{len(ss)} bytes"),
        _row("CT preview", _hex_preview(ct)),
        _row("SS preview", _hex_preview(ss, 32)),
        _row("Elapsed", f"{elapsed_ms:.2f} ms", GREEN),
    ])
    return (
        f'<div style="{_BASE_STYLE}">'
        f'{_badge("ENCAPSULATE", INDIGO)}'
        f'<table style="margin-top:8px;border-collapse:collapse">{rows}</table>'
        "</div>"
    )


def render_decapsulate_result(
    ss: bytes,
    elapsed_ms: float,
) -> str:
    rows = "".join([
        _row("Shared secret", f"{len(ss)} bytes"),
        _row("SS preview", _hex_preview(ss, 32)),
        _row("Elapsed", f"{elapsed_ms:.2f} ms", GREEN),
    ])
    return (
        f'<div style="{_BASE_STYLE}">'
        f'{_badge("DECAPSULATE", GREEN)}'
        f'<table style="margin-top:8px;border-collapse:collapse">{rows}</table>'
        "</div>"
    )


def render_entropy_status(stats: Dict[str, Any]) -> str:
    pool_size = stats.get("pool_size", 0)
    remaining = stats.get("remaining", 0)
    consumed = stats.get("total_consumed", 0)
    refills = stats.get("refill_count", 0)
    pool_path = stats.get("pool_path", "N/A")

    pct = (remaining / pool_size * 100) if pool_size > 0 else 0
    bar_colour = GREEN if pct > 30 else (AMBER if pct > 10 else RED)
    bar_width = max(int(pct), 1)

    bar_html = (
        f'<div style="width:200px;height:12px;background:#334155;border-radius:6px;overflow:hidden">'
        f'<div style="width:{bar_width}%;height:100%;background:{bar_colour};'
        f'border-radius:6px;transition:width 0.3s"></div></div>'
    )

    rows = "".join([
        _row("Pool size", f"{pool_size:,} bytes"),
        _row("Remaining", f"{remaining:,} bytes ({pct:.1f}%)"),
        _row("Consumed", f"{consumed:,} bytes"),
        _row("Refills", str(refills)),
        _row("Pool file", f'<code style="font-size:11px">{html.escape(pool_path)}</code>'),
    ])
    return (
        f'<div style="{_BASE_STYLE}">'
        f'{_badge("ENTROPY POOL", GREEN)} {bar_html}'
        f'<table style="margin-top:8px;border-collapse:collapse">{rows}</table>'
        "</div>"
    )


def render_pii_results(results: Dict[str, Any]) -> str:
    detected = results.get("pii_detected", False)
    risk = results.get("risk_level")
    risk_str = risk.value.upper() if hasattr(risk, "value") else str(risk).upper()
    level = results.get("recommended_anonymization_level", 0)
    warnings: List[str] = results.get("warnings", [])

    risk_colour = {
        "LOW": GREEN,
        "MEDIUM": AMBER,
        "HIGH": RED,
        "CRITICAL": RED,
    }.get(risk_str, SLATE)

    status_badge = _badge("PII DETECTED", RED) if detected else _badge("CLEAN", GREEN)
    risk_badge = _badge(f"RISK: {risk_str}", risk_colour)

    rows = "".join([
        _row("Status", status_badge),
        _row("Risk level", risk_badge),
        _row("Anonymization level", f"{level}/10"),
    ])

    warning_html = ""
    if warnings:
        items = "".join(
            f'<li style="margin:4px 0;color:{AMBER}">{html.escape(w)}</li>' for w in warnings
        )
        warning_html = f'<ul style="padding-left:20px;margin:8px 0">{items}</ul>'

    return (
        f'<div style="{_BASE_STYLE}">'
        f'{_badge("PII SCAN", INDIGO)}'
        f'<table style="margin-top:8px;border-collapse:collapse">{rows}</table>'
        f"{warning_html}"
        "</div>"
    )


def render_benchmark(
    rounds: int,
    keygen_ms: float,
    encaps_ms: float,
    decaps_ms: float,
) -> str:
    total = keygen_ms + encaps_ms + decaps_ms
    rows = "".join([
        _row("Rounds", str(rounds)),
        _row("Keygen avg", f"{keygen_ms:.3f} ms", INDIGO),
        _row("Encaps avg", f"{encaps_ms:.3f} ms", INDIGO),
        _row("Decaps avg", f"{decaps_ms:.3f} ms", INDIGO),
        _row("Total avg", f"{total:.3f} ms", GREEN),
        _row("Ops/sec", f"{1000 / total:.0f}" if total > 0 else "N/A", GREEN),
    ])
    return (
        f'<div style="{_BASE_STYLE}">'
        f'{_badge("BENCHMARK", AMBER)} {_badge("ML-KEM-768", NAVY)}'
        f'<table style="margin-top:8px;border-collapse:collapse">{rows}</table>'
        "</div>"
    )


def render_info() -> str:
    from zipminator import __version__, RUST_AVAILABLE

    backend = _badge("RUST (native)", GREEN) if RUST_AVAILABLE else _badge("PYTHON (kyber-py)", AMBER)

    try:
        from zipminator.crypto.quantum_random import ENTROPY_POOL_PATH

        pool_exists = ENTROPY_POOL_PATH.exists()
        pool_info = (
            f'{ENTROPY_POOL_PATH.stat().st_size:,} bytes'
            if pool_exists
            else "not found"
        )
    except Exception:
        pool_info = "unavailable"

    rows = "".join([
        _row("Version", f'<strong style="color:#fff">{__version__}</strong>'),
        _row("Backend", backend),
        _row("Algorithm", "ML-KEM-768 (FIPS 203)"),
        _row("PK / SK / CT", "1184 / 2400 / 1088 bytes"),
        _row("Shared secret", "32 bytes"),
        _row("Entropy pool", pool_info),
    ])
    return (
        f'<div style="{_BASE_STYLE}">'
        f'<span style="color:{INDIGO};font-size:16px;font-weight:700">Zipminator PQC</span>'
        f'<table style="margin-top:8px;border-collapse:collapse">{rows}</table>'
        "</div>"
    )
