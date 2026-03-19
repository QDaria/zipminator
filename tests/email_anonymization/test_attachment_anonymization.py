"""Tests for POST /v1/anonymize-attachment endpoint.

Builds a minimal FastAPI app containing only the anonymize router so the tests
run without a database, Redis, or any other infrastructure dependency.
"""

from __future__ import annotations

import io
import json
import sys
import os

import pandas as pd
import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_csv(rows: list[dict]) -> bytes:
    df = pd.DataFrame(rows)
    buf = io.StringIO()
    df.to_csv(buf, index=False)
    return buf.getvalue().encode()


def _make_json(rows: list[dict]) -> bytes:
    return json.dumps(rows).encode()


def _make_text(content: str) -> bytes:
    return content.encode()


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def app():
    """Build a lightweight FastAPI app with only the anonymize router.

    Uses importlib to avoid conflicts when 'src' exists in sys.modules
    from another package (e.g., when running the full test suite).
    """
    import importlib.util

    api_dir = os.path.join(os.path.dirname(__file__), "..", "..", "api")
    routes_path = os.path.join(api_dir, "src", "routes", "anonymize.py")

    if not os.path.exists(routes_path):
        pytest.skip(f"API route not found: {routes_path}")

    # Ensure api/src is importable without polluting global sys.modules['src']
    if api_dir not in sys.path:
        sys.path.insert(0, api_dir)

    try:
        # Try direct import first (works when run standalone)
        from src.routes.anonymize import router
    except (ModuleNotFoundError, ImportError):
        # Fallback: load the module directly by file path
        spec = importlib.util.spec_from_file_location(
            "api_src_routes_anonymize", routes_path
        )
        if spec is None or spec.loader is None:
            pytest.skip(f"Cannot load anonymize route from {routes_path}")
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        router = mod.router

    test_app = FastAPI(title="Anonymize Test App")
    test_app.include_router(router, prefix="/v1")
    return test_app


@pytest_asyncio.fixture
async def client(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


# ── CSV tests ─────────────────────────────────────────────────────────────────

# Detect whether the zipminator anonymizer is importable in this environment
try:
    from zipminator.anonymizer import AdvancedAnonymizer as _AA  # noqa: F401
    _HAS_ANONYMIZER = True
except ImportError:
    _HAS_ANONYMIZER = False


class TestCsvAnonymization:
    """Verify that CSV uploads are parsed, anonymized, and returned correctly."""

    SAMPLE_ROWS = [
        {"name": "Alice", "ssn": "123-45-6789", "salary": 90000},
        {"name": "Bob",   "ssn": "987-65-4321", "salary": 75000},
    ]

    @pytest.mark.asyncio
    async def test_level_3_static_masking_returns_ok(self, client):
        """CSV upload succeeds at L3 regardless of anonymizer availability."""
        csv_bytes = _make_csv(self.SAMPLE_ROWS)
        resp = await client.post(
            "/v1/anonymize-attachment?level=3",
            files={"file": ("employees.csv", csv_bytes, "text/csv")},
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    @pytest.mark.skipif(not _HAS_ANONYMIZER, reason="zipminator.anonymizer not installed")
    async def test_level_3_redacts_all_values(self, client):
        """When the full anonymizer is available, L3 replaces every cell with [REDACTED]."""
        csv_bytes = _make_csv(self.SAMPLE_ROWS)
        resp = await client.post(
            "/v1/anonymize-attachment?level=3",
            files={"file": ("data.csv", csv_bytes, "text/csv")},
        )
        assert resp.status_code == 200
        assert "text/csv" in resp.headers["content-type"]
        out_df = pd.read_csv(io.StringIO(resp.content.decode()))
        for col in ["name", "ssn"]:
            if col in out_df.columns:
                assert out_df[col].eq("[REDACTED]").all(), f"Column {col} not fully redacted at L3"

    @pytest.mark.asyncio
    @pytest.mark.skipif(not _HAS_ANONYMIZER, reason="zipminator.anonymizer not installed")
    async def test_level_1_preserves_column_structure(self, client):
        csv_bytes = _make_csv(self.SAMPLE_ROWS)
        resp = await client.post(
            "/v1/anonymize-attachment?level=1",
            files={"file": ("data.csv", csv_bytes, "text/csv")},
        )
        assert resp.status_code == 200
        out_df = pd.read_csv(io.StringIO(resp.content.decode()))
        assert set(out_df.columns) == {"name", "ssn", "salary"}

    @pytest.mark.asyncio
    @pytest.mark.skipif(not _HAS_ANONYMIZER, reason="zipminator.anonymizer not installed")
    async def test_level_6_suppresses_columns(self, client):
        """L6 drops all columns — output should have zero columns."""
        csv_bytes = _make_csv(self.SAMPLE_ROWS)
        resp = await client.post(
            "/v1/anonymize-attachment?level=6",
            files={"file": ("data.csv", csv_bytes, "text/csv")},
        )
        assert resp.status_code == 200
        out_df = pd.read_csv(io.StringIO(resp.content.decode()))
        assert len(out_df.columns) == 0


# ── JSON tests ────────────────────────────────────────────────────────────────

class TestJsonAnonymization:
    @pytest.mark.asyncio
    async def test_json_array_returns_ok(self, client):
        json_bytes = _make_json([{"email": "alice@example.com", "age": 30}])
        resp = await client.post(
            "/v1/anonymize-attachment?level=4",
            files={"file": ("records.json", json_bytes, "application/json")},
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    @pytest.mark.skipif(not _HAS_ANONYMIZER, reason="zipminator.anonymizer not installed")
    async def test_level_4_hashes_values(self, client):
        json_bytes = _make_json([{"id": "user_001"}, {"id": "user_002"}])
        resp = await client.post(
            "/v1/anonymize-attachment?level=4",
            files={"file": ("ids.json", json_bytes, "application/json")},
        )
        assert resp.status_code == 200
        assert "json" in resp.headers["content-type"]
        data = resp.json()
        assert isinstance(data, list)
        # L4 replaces with 16-char hex strings — verify the original value is gone
        assert all(row.get("id") != "user_001" for row in data)


# ── Plain text tests ──────────────────────────────────────────────────────────

class TestPlainTextAnonymization:
    @pytest.mark.asyncio
    async def test_text_level_1_masks_ssn(self, client):
        text = "SSN: 123-45-6789 and email: bob@example.com"
        resp = await client.post(
            "/v1/anonymize-attachment?level=1",
            files={"file": ("note.txt", _make_text(text), "text/plain")},
        )
        assert resp.status_code == 200
        body = resp.content.decode()
        assert "123-45-6789" not in body
        assert "***-**-****" in body

    @pytest.mark.asyncio
    async def test_text_level_3_redacts_words(self, client):
        text = "Hello world this is sensitive"
        resp = await client.post(
            "/v1/anonymize-attachment?level=3",
            files={"file": ("note.txt", _make_text(text), "text/plain")},
        )
        assert resp.status_code == 200
        body = resp.content.decode()
        assert "Hello" not in body
        assert "[REDACTED]" in body


# ── Validation tests ──────────────────────────────────────────────────────────

class TestValidation:
    @pytest.mark.asyncio
    async def test_unsupported_media_type_returns_415(self, client):
        resp = await client.post(
            "/v1/anonymize-attachment?level=5",
            files={"file": ("binary.bin", b"\x00\x01\x02", "application/octet-stream")},
        )
        assert resp.status_code == 415

    @pytest.mark.asyncio
    async def test_level_below_1_rejected(self, client):
        csv_bytes = _make_csv([{"x": 1}])
        resp = await client.post(
            "/v1/anonymize-attachment?level=0",
            files={"file": ("data.csv", csv_bytes, "text/csv")},
        )
        assert resp.status_code == 422  # FastAPI Query validation

    @pytest.mark.asyncio
    async def test_level_above_10_rejected(self, client):
        csv_bytes = _make_csv([{"x": 1}])
        resp = await client.post(
            "/v1/anonymize-attachment?level=11",
            files={"file": ("data.csv", csv_bytes, "text/csv")},
        )
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_response_header_contains_level(self, client):
        csv_bytes = _make_csv([{"val": "test"}])
        resp = await client.post(
            "/v1/anonymize-attachment?level=7",
            files={"file": ("data.csv", csv_bytes, "text/csv")},
        )
        assert resp.status_code == 200
        assert resp.headers.get("x-anonymization-level") == "7"

    @pytest.mark.asyncio
    async def test_output_filename_includes_level_prefix(self, client):
        csv_bytes = _make_csv([{"val": "test"}])
        resp = await client.post(
            "/v1/anonymize-attachment?level=5",
            files={"file": ("report.csv", csv_bytes, "text/csv")},
        )
        assert resp.status_code == 200
        disposition = resp.headers.get("content-disposition", "")
        assert "anon_L5_" in disposition
