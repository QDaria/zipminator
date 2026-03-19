"""ipywidgets-based interactive components for JupyterLab."""

from __future__ import annotations

import time
from typing import Optional

try:
    import ipywidgets as widgets
    from IPython.display import display, HTML

    WIDGETS_AVAILABLE = True
except ImportError:
    WIDGETS_AVAILABLE = False

from zipminator.crypto.pqc import PQC
from zipminator.crypto.quantum_random import QuantumEntropyPool

from . import display as fmt


def _require_widgets() -> None:
    if not WIDGETS_AVAILABLE:
        raise ImportError(
            "ipywidgets is required for interactive widgets. "
            "Install with: pip install 'zipminator[jupyter]'"
        )


class KeyGenWidget:
    """Interactive key generation with entropy source dropdown."""

    def __init__(self) -> None:
        _require_widgets()

        self.entropy_dropdown = widgets.Dropdown(
            options=["System RNG", "Quantum Entropy"],
            value="System RNG",
            description="Entropy:",
            style={"description_width": "80px"},
        )
        self.generate_btn = widgets.Button(
            description="Generate Keypair",
            button_style="primary",
            icon="key",
        )
        self.output = widgets.Output()

        self.pk: Optional[bytes] = None
        self.sk: Optional[bytes] = None

        self.generate_btn.on_click(self._on_generate)

    def _on_generate(self, _: object) -> None:
        self.output.clear_output(wait=True)
        with self.output:
            use_quantum = self.entropy_dropdown.value == "Quantum Entropy"
            pqc = PQC(level=768)
            seed: Optional[bytes] = None
            if use_quantum:
                pool = QuantumEntropyPool()
                seed = pool.get_bytes(32)

            t0 = time.perf_counter()
            self.pk, self.sk = pqc.generate_keypair(seed=seed)
            elapsed_ms = (time.perf_counter() - t0) * 1000

            display(HTML(fmt.render_keygen_result(
                self.pk, self.sk, elapsed_ms, quantum_seed=use_quantum,
            )))

    def show(self) -> None:
        controls = widgets.HBox([self.entropy_dropdown, self.generate_btn])
        display(widgets.VBox([controls, self.output]))


class EncryptDecryptWidget:
    """Full KEM round-trip demo widget."""

    def __init__(self) -> None:
        _require_widgets()

        self.keygen_btn = widgets.Button(
            description="1. Keygen", button_style="primary", icon="key",
        )
        self.encaps_btn = widgets.Button(
            description="2. Encapsulate", button_style="info", icon="lock",
        )
        self.decaps_btn = widgets.Button(
            description="3. Decapsulate", button_style="success", icon="unlock",
        )
        self.verify_label = widgets.HTML(value="")
        self.output = widgets.Output()

        self._pk: Optional[bytes] = None
        self._sk: Optional[bytes] = None
        self._ct: Optional[bytes] = None
        self._ss: Optional[bytes] = None

        self.keygen_btn.on_click(self._on_keygen)
        self.encaps_btn.on_click(self._on_encaps)
        self.decaps_btn.on_click(self._on_decaps)

    def _on_keygen(self, _: object) -> None:
        self.output.clear_output(wait=True)
        self.verify_label.value = ""
        with self.output:
            pqc = PQC(level=768)
            t0 = time.perf_counter()
            self._pk, self._sk = pqc.generate_keypair()
            elapsed_ms = (time.perf_counter() - t0) * 1000
            display(HTML(fmt.render_keygen_result(self._pk, self._sk, elapsed_ms)))

    def _on_encaps(self, _: object) -> None:
        self.output.clear_output(wait=True)
        self.verify_label.value = ""
        with self.output:
            if self._pk is None:
                print("Generate a keypair first.")
                return
            pqc = PQC(level=768)
            t0 = time.perf_counter()
            self._ct, self._ss = pqc.encapsulate(self._pk)
            elapsed_ms = (time.perf_counter() - t0) * 1000
            display(HTML(fmt.render_encapsulate_result(self._ct, self._ss, elapsed_ms)))

    def _on_decaps(self, _: object) -> None:
        self.output.clear_output(wait=True)
        with self.output:
            if self._ct is None or self._sk is None:
                print("Run keygen and encapsulate first.")
                return
            pqc = PQC(level=768)
            t0 = time.perf_counter()
            ss_dec = pqc.decapsulate(self._sk, self._ct)
            elapsed_ms = (time.perf_counter() - t0) * 1000
            display(HTML(fmt.render_decapsulate_result(ss_dec, elapsed_ms)))

            match = ss_dec == self._ss
            colour = fmt.GREEN if match else fmt.RED
            icon = "MATCH" if match else "MISMATCH"
            self.verify_label.value = (
                f'<span style="color:{colour};font-weight:bold;font-size:14px">'
                f'Shared secret: {icon}</span>'
            )

    def show(self) -> None:
        buttons = widgets.HBox([self.keygen_btn, self.encaps_btn, self.decaps_btn])
        display(widgets.VBox([buttons, self.output, self.verify_label]))


class EntropyMonitorWidget:
    """Entropy pool status gauge with refresh button."""

    def __init__(self) -> None:
        _require_widgets()

        self.refresh_btn = widgets.Button(
            description="Refresh", button_style="info", icon="sync",
        )
        self.output = widgets.Output()
        self.refresh_btn.on_click(self._on_refresh)

    def _on_refresh(self, _: object) -> None:
        self.output.clear_output(wait=True)
        with self.output:
            pool = QuantumEntropyPool()
            stats = pool.get_stats()
            display(HTML(fmt.render_entropy_status(stats)))

    def show(self) -> None:
        self._on_refresh(None)
        display(widgets.VBox([self.refresh_btn, self.output]))


class PIIScannerWidget:
    """DataFrame PII detection with anonymization level display."""

    def __init__(self) -> None:
        _require_widgets()

        self.df_name_input = widgets.Text(
            value="df",
            description="Variable:",
            placeholder="DataFrame variable name",
            style={"description_width": "80px"},
        )
        self.scan_btn = widgets.Button(
            description="Scan for PII", button_style="warning", icon="search",
        )
        self.output = widgets.Output()
        self.scan_btn.on_click(self._on_scan)

    def _on_scan(self, _: object) -> None:
        self.output.clear_output(wait=True)
        with self.output:
            try:
                import pandas as pd
            except ImportError:
                print("pandas is required for PII scanning.")
                return

            # Attempt to retrieve from the running IPython kernel
            try:
                from IPython import get_ipython

                ip = get_ipython()
                if ip is None:
                    print("Not running inside IPython.")
                    return
                df = ip.user_ns.get(self.df_name_input.value)
            except Exception:
                print("Could not access IPython namespace.")
                return

            if df is None:
                print(f"Variable '{self.df_name_input.value}' not found.")
                return
            if not isinstance(df, pd.DataFrame):
                print(f"'{self.df_name_input.value}' is not a DataFrame.")
                return

            from zipminator.crypto.pii_scanner import PIIScanner

            scanner = PIIScanner()
            results = scanner.scan_dataframe(df)
            display(HTML(fmt.render_pii_results(results)))

    def show(self) -> None:
        controls = widgets.HBox([self.df_name_input, self.scan_btn])
        display(widgets.VBox([controls, self.output]))


# ---------------------------------------------------------------------------
# Convenience functions (documented in docs/book/content/jupyter.md)
# ---------------------------------------------------------------------------


def key_size_comparison() -> None:
    """Display an interactive Plotly bar chart comparing PQC key sizes.

    Compares ML-KEM-768 against RSA-2048, RSA-4096, and other PQC candidates.
    """
    _require_widgets()
    try:
        import plotly.graph_objects as go
    except ImportError:
        raise ImportError(
            "plotly is required for key_size_comparison. "
            "Install with: pip install 'zipminator[jupyter]'"
        )

    algorithms = [
        "RSA-2048", "RSA-4096", "ML-KEM-512", "ML-KEM-768", "ML-KEM-1024",
    ]
    pk_sizes = [256, 512, 800, 1184, 1568]
    sk_sizes = [256, 512, 1632, 2400, 3168]
    ct_sizes = [256, 512, 768, 1088, 1568]

    fig = go.Figure()
    fig.add_trace(go.Bar(name="Public Key", x=algorithms, y=pk_sizes, marker_color="#6366f1"))
    fig.add_trace(go.Bar(name="Secret Key", x=algorithms, y=sk_sizes, marker_color="#10b981"))
    fig.add_trace(go.Bar(name="Ciphertext", x=algorithms, y=ct_sizes, marker_color="#f59e0b"))
    fig.update_layout(
        title="Key & Ciphertext Sizes (bytes)",
        barmode="group",
        template="plotly_dark",
        height=400,
        font=dict(family="JetBrains Mono, monospace"),
    )
    fig.show()


def entropy_monitor() -> None:
    """Display the quantum entropy pool status widget."""
    EntropyMonitorWidget().show()


def anonymization_demo() -> None:
    """Display an interactive anonymization level demo widget.

    Creates a sample DataFrame and lets users scan it for PII.
    """
    _require_widgets()
    try:
        import pandas as pd
    except ImportError:
        raise ImportError(
            "pandas is required for anonymization_demo. "
            "Install with: pip install 'zipminator[data]'"
        )

    from IPython.display import display as ipy_display

    sample_df = pd.DataFrame({
        "name": ["Alice Johnson", "Bob Smith", "Carol Williams"],
        "email": ["alice@example.com", "bob@corp.net", "carol@hospital.org"],
        "phone": ["555-123-4567", "555-987-6543", "555-246-8135"],
        "ssn": ["123-45-6789", "987-65-4321", "456-78-9012"],
    })

    ipy_display(HTML(
        '<div style="font-family:JetBrains Mono,monospace;color:#6366f1;'
        'font-weight:bold;margin-bottom:8px">Sample PII DataFrame:</div>'
    ))
    ipy_display(sample_df)

    # Store in kernel namespace so PIIScannerWidget can find it
    try:
        from IPython import get_ipython
        ip = get_ipython()
        if ip is not None:
            ip.user_ns["demo_df"] = sample_df
    except Exception:
        pass

    scanner_widget = PIIScannerWidget()
    scanner_widget.df_name_input.value = "demo_df"
    scanner_widget.show()
