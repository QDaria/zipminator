"""TDD tests for Zipminator Jupyter integration.

Tests the magics, widgets, convenience functions, display formatters,
and bridge — verifying the full round-trip works correctly.

Red/Green/Refactor: These tests define the contract.
"""

from __future__ import annotations

import json
import pytest
from unittest.mock import MagicMock, patch


# ---------------------------------------------------------------------------
# 1. Convenience function exports (docs promise these)
# ---------------------------------------------------------------------------


class TestConvenienceFunctions:
    """Docs say: from zipminator.jupyter.widgets import key_size_comparison, etc."""

    def test_key_size_comparison_importable(self):
        from zipminator.jupyter.widgets import key_size_comparison

        assert callable(key_size_comparison)

    def test_entropy_monitor_importable(self):
        from zipminator.jupyter.widgets import entropy_monitor

        assert callable(entropy_monitor)

    def test_anonymization_demo_importable(self):
        from zipminator.jupyter.widgets import anonymization_demo

        assert callable(anonymization_demo)


# ---------------------------------------------------------------------------
# 2. Magics variable names (docs promise specific names)
# ---------------------------------------------------------------------------


class TestMagicsVariableNames:
    """Magics must store variables with the names the docs promise."""

    def _make_shell(self):
        """Create a minimal IPython shell mock that satisfies traitlets."""
        from traitlets.config import Config
        from IPython.core.interactiveshell import InteractiveShell

        shell = InteractiveShell.instance(config=Config())
        shell.user_ns.clear()
        return shell

    def test_keygen_stores_pk_and_sk(self):
        from zipminator.jupyter.magics import ZipminatorMagics

        shell = self._make_shell()
        m = ZipminatorMagics(shell=shell)
        m.keygen("")

        assert "pk" in shell.user_ns
        assert "sk" in shell.user_ns
        assert isinstance(shell.user_ns["pk"], bytes)
        assert isinstance(shell.user_ns["sk"], bytes)
        assert len(shell.user_ns["pk"]) == 1184
        assert len(shell.user_ns["sk"]) == 2400

    def test_encrypt_stores_ct_and_shared_secret(self):
        """Docs say %encrypt creates 'ct' and 'shared_secret'."""
        from zipminator.jupyter.magics import ZipminatorMagics

        shell = self._make_shell()
        m = ZipminatorMagics(shell=shell)
        m.keygen("")
        m.encrypt("pk")

        assert "ct" in shell.user_ns
        assert "shared_secret" in shell.user_ns
        assert isinstance(shell.user_ns["ct"], bytes)
        assert isinstance(shell.user_ns["shared_secret"], bytes)
        assert len(shell.user_ns["ct"]) == 1088
        assert len(shell.user_ns["shared_secret"]) == 32

    def test_decrypt_stores_recovered(self):
        """Docs say %decrypt creates 'recovered'."""
        from zipminator.jupyter.magics import ZipminatorMagics

        shell = self._make_shell()
        m = ZipminatorMagics(shell=shell)
        m.keygen("")
        m.encrypt("pk")
        m.decrypt("ct sk")

        assert "recovered" in shell.user_ns
        assert isinstance(shell.user_ns["recovered"], bytes)
        assert len(shell.user_ns["recovered"]) == 32

    def test_roundtrip_shared_secrets_match(self):
        from zipminator.jupyter.magics import ZipminatorMagics

        shell = self._make_shell()
        m = ZipminatorMagics(shell=shell)
        m.keygen("")
        m.encrypt("pk")
        m.decrypt("ct sk")

        assert shell.user_ns["shared_secret"] == shell.user_ns["recovered"]


# ---------------------------------------------------------------------------
# 3. Display formatters produce valid HTML
# ---------------------------------------------------------------------------


class TestDisplayFormatters:
    def test_render_keygen_result_html(self):
        from zipminator.jupyter import display as fmt

        html = fmt.render_keygen_result(b"\x00" * 1184, b"\x00" * 2400, 0.5)
        assert "KEYGEN" in html
        assert "ML-KEM-768" in html
        assert "1184 bytes" in html

    def test_render_encapsulate_result_html(self):
        from zipminator.jupyter import display as fmt

        html = fmt.render_encapsulate_result(b"\x00" * 1088, b"\x00" * 32, 0.3)
        assert "ENCAPSULATE" in html
        assert "1088 bytes" in html

    def test_render_decapsulate_result_html(self):
        from zipminator.jupyter import display as fmt

        html = fmt.render_decapsulate_result(b"\x00" * 32, 0.2)
        assert "DECAPSULATE" in html
        assert "32 bytes" in html

    def test_render_info_html(self):
        from zipminator.jupyter import display as fmt

        html = fmt.render_info()
        assert "Zipminator PQC" in html
        assert "ML-KEM-768" in html

    def test_render_benchmark_html(self):
        from zipminator.jupyter import display as fmt

        html = fmt.render_benchmark(100, 0.1, 0.2, 0.15)
        assert "BENCHMARK" in html
        assert "100" in html

    def test_render_entropy_status_html(self):
        from zipminator.jupyter import display as fmt

        stats = {
            "pool_size": 4096,
            "remaining": 2048,
            "total_consumed": 2048,
            "refill_count": 1,
            "pool_path": "/tmp/test.bin",
        }
        html = fmt.render_entropy_status(stats)
        assert "ENTROPY POOL" in html
        assert "4,096 bytes" in html


# ---------------------------------------------------------------------------
# 4. Bridge fallback logic
# ---------------------------------------------------------------------------


class TestBridge:
    def test_bridge_falls_back_to_sdk(self):
        from zipminator.jupyter.bridge import FlaskBridge

        bridge = FlaskBridge("http://localhost:99999")  # unreachable
        pk, sk = bridge.generate_keypair()
        assert len(pk) == 1184
        assert len(sk) == 2400

    def test_bridge_encapsulate_fallback(self):
        from zipminator.jupyter.bridge import FlaskBridge

        bridge = FlaskBridge("http://localhost:99999")
        pk, _ = bridge.generate_keypair()
        ct, ss = bridge.encapsulate(pk.hex())
        assert len(ct) == 1088
        assert len(ss) == 32


# ---------------------------------------------------------------------------
# 5. Module load_ipython_extension
# ---------------------------------------------------------------------------


class TestExtensionLoad:
    def test_load_extension(self):
        from zipminator.jupyter import load_ipython_extension

        shell = MagicMock()
        load_ipython_extension(shell)
        shell.register_magics.assert_called_once()

    def test_repr_html(self):
        from zipminator.jupyter import _repr_html_

        html = _repr_html_()
        assert "Zipminator PQC" in html
        assert "load_ext" in html


# ---------------------------------------------------------------------------
# 6. Quickstart notebook API compatibility
# ---------------------------------------------------------------------------


class TestNotebookAPIs:
    """Both the Rust FFI and Python wrapper APIs should work for notebooks."""

    def test_pqc_wrapper_roundtrip(self):
        from zipminator.crypto.pqc import PQC

        pqc = PQC(level=768)
        pk, sk = pqc.generate_keypair()
        ct, ss = pqc.encapsulate(pk)
        ss2 = pqc.decapsulate(sk, ct)
        assert ss == ss2
        assert len(pk) == 1184

    def test_rust_ffi_roundtrip(self):
        """Rust FFI returns custom types with .to_bytes()."""
        pytest.importorskip("zipminator._core")
        from zipminator._core import keypair, encapsulate, decapsulate

        pk, sk = keypair()
        assert hasattr(pk, "to_bytes")
        assert len(pk.to_bytes()) == 1184

        ct, ss = encapsulate(pk)
        ss2 = decapsulate(ct, sk)
        assert ss == ss2

    def test_top_level_import_roundtrip(self):
        """zipminator.keypair() should work as a top-level convenience."""
        from zipminator import keypair, encapsulate, decapsulate

        pk, sk = keypair()
        ct, ss = encapsulate(pk)
        ss2 = decapsulate(ct, sk)
        assert ss == ss2
