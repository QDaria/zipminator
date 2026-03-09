"""Tests for the PQC Key Directory FastAPI service.

Uses FastAPI's TestClient (synchronous, no real server needed).
"""

import hashlib
import sys
from pathlib import Path

import pytest

# The `email` directory conflicts with Python's stdlib `email` package,
# so we add the keydir directory to sys.path directly.
_keydir_path = str(Path(__file__).resolve().parents[2] / "email" / "keydir")
if _keydir_path not in sys.path:
    sys.path.insert(0, _keydir_path)

from app import app, _store, _fingerprint_index  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

AUTH_HEADER = {"Authorization": "Bearer dev-token-change-me"}


@pytest.fixture(autouse=True)
def clear_store():
    """Reset the in-memory store between tests."""
    _store.clear()
    _fingerprint_index.clear()
    yield
    _store.clear()
    _fingerprint_index.clear()


@pytest.fixture
def client():
    return TestClient(app)


def _make_key_body(
    email_addr: str = "alice@qdaria.com",
    fingerprint: str = "a" * 64,
) -> dict:
    """Build a valid PublicKeyCreate payload."""
    return {
        "email": email_addr,
        "mlkem_pk": "AAAA" * 395 + "AA==",
        "x25519_pk": "AAAA" * 10 + "AA==",
        "ed25519_pk": "BBBB" * 10 + "AA==",
        "fingerprint": fingerprint,
    }


# ── Publish key ───────────────────────────────────────────────────────────────


class TestPublishKey:
    def test_publish_returns_201(self, client):
        resp = client.post("/keys", json=_make_key_body(), headers=AUTH_HEADER)
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "alice@qdaria.com"
        assert data["fingerprint"] == "a" * 64

    def test_publish_without_auth_returns_422(self, client):
        resp = client.post("/keys", json=_make_key_body())
        # Missing Authorization header -> 422 (validation error)
        assert resp.status_code == 422

    def test_publish_with_wrong_token_returns_403(self, client):
        resp = client.post(
            "/keys",
            json=_make_key_body(),
            headers={"Authorization": "Bearer wrong-token"},
        )
        assert resp.status_code == 403

    def test_duplicate_fingerprint_returns_409(self, client):
        body = _make_key_body()
        resp1 = client.post("/keys", json=body, headers=AUTH_HEADER)
        assert resp1.status_code == 201

        resp2 = client.post("/keys", json=body, headers=AUTH_HEADER)
        assert resp2.status_code == 409

    def test_invalid_fingerprint_returns_422(self, client):
        body = _make_key_body(fingerprint="not-hex")
        resp = client.post("/keys", json=body, headers=AUTH_HEADER)
        assert resp.status_code == 422


# ── Lookup by email ───────────────────────────────────────────────────────────


class TestLookupByEmail:
    def test_lookup_returns_published_key(self, client):
        client.post("/keys", json=_make_key_body(), headers=AUTH_HEADER)

        resp = client.get("/keys/alice@qdaria.com")
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] == 1
        assert data["keys"][0]["email"] == "alice@qdaria.com"

    def test_lookup_missing_email_returns_empty(self, client):
        resp = client.get("/keys/nobody@example.com")
        assert resp.status_code == 200
        assert resp.json()["count"] == 0

    def test_lookup_case_insensitive(self, client):
        client.post(
            "/keys",
            json=_make_key_body(email_addr="Alice@Qdaria.com"),
            headers=AUTH_HEADER,
        )
        resp = client.get("/keys/alice@qdaria.com")
        assert resp.json()["count"] == 1

    def test_multiple_keys_for_same_email(self, client):
        client.post(
            "/keys",
            json=_make_key_body(fingerprint="a" * 64),
            headers=AUTH_HEADER,
        )
        client.post(
            "/keys",
            json=_make_key_body(fingerprint="b" * 64),
            headers=AUTH_HEADER,
        )
        resp = client.get("/keys/alice@qdaria.com")
        assert resp.json()["count"] == 2


# ── Lookup by fingerprint ────────────────────────────────────────────────────


class TestLookupByFingerprint:
    def test_lookup_returns_key(self, client):
        fp = "c" * 64
        client.post(
            "/keys", json=_make_key_body(fingerprint=fp), headers=AUTH_HEADER
        )
        resp = client.get(f"/keys/fingerprint/{fp}")
        assert resp.status_code == 200
        assert resp.json()["count"] == 1
        assert resp.json()["keys"][0]["fingerprint"] == fp

    def test_lookup_missing_returns_empty(self, client):
        resp = client.get("/keys/fingerprint/" + "f" * 64)
        assert resp.status_code == 200
        assert resp.json()["count"] == 0


# ── Revoke key ────────────────────────────────────────────────────────────────


class TestRevokeKey:
    def test_revoke_removes_key(self, client):
        fp = "d" * 64
        client.post(
            "/keys", json=_make_key_body(fingerprint=fp), headers=AUTH_HEADER
        )

        resp = client.delete(f"/keys/{fp}", headers=AUTH_HEADER)
        assert resp.status_code == 200
        assert resp.json()["revoked"] is True

        # Verify it's gone
        resp = client.get(f"/keys/fingerprint/{fp}")
        assert resp.json()["count"] == 0

    def test_revoke_missing_returns_404(self, client):
        resp = client.delete("/keys/" + "e" * 64, headers=AUTH_HEADER)
        assert resp.status_code == 404

    def test_revoke_without_auth_returns_422(self, client):
        resp = client.delete("/keys/" + "e" * 64)
        assert resp.status_code == 422


# ── WKD endpoint ──────────────────────────────────────────────────────────────


class TestWKD:
    def test_wkd_lookup_by_hash(self, client):
        email_addr = "alice@qdaria.com"
        client.post(
            "/keys", json=_make_key_body(email_addr=email_addr), headers=AUTH_HEADER
        )

        email_hash = hashlib.sha256(email_addr.lower().encode()).hexdigest()
        resp = client.get(f"/.well-known/openpgpkey/hu/{email_hash}")
        assert resp.status_code == 200
        assert resp.json()["count"] == 1

    def test_wkd_wrong_hash_returns_empty(self, client):
        resp = client.get("/.well-known/openpgpkey/hu/" + "0" * 64)
        assert resp.status_code == 200
        assert resp.json()["count"] == 0


# ── Health check ──────────────────────────────────────────────────────────────


class TestHealth:
    def test_health(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
