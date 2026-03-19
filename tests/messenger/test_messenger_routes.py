"""Tests for the messenger REST API routes.

Uses FastAPI TestClient with a fresh in-memory SQLite store per test.
"""

import base64
import pytest

try:
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from api.src.routes.messenger import router, get_message_store
    from api.src.db.message_store import MessageStore
    _HAS_DEPS = True
except ImportError:
    _HAS_DEPS = False

pytestmark = pytest.mark.skipif(not _HAS_DEPS, reason="FastAPI not available")


@pytest.fixture
def client():
    """TestClient with a fresh in-memory store for each test."""
    app = FastAPI()
    app.include_router(router, prefix="/api/messenger")

    # Override the dependency with a fresh store
    fresh_store = MessageStore(db_path=":memory:")
    app.dependency_overrides[get_message_store] = lambda: fresh_store

    yield TestClient(app)

    fresh_store.close()
    app.dependency_overrides.clear()


class TestSendEndpoint:
    def test_send_message(self, client):
        ct = base64.b64encode(b"\xde\xad\xbe\xef").decode()
        resp = client.post("/api/messenger/send", json={
            "conversation_id": "conv-1",
            "sender_id": "alice",
            "recipient_id": "bob",
            "ciphertext_b64": ct,
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["conversation_id"] == "conv-1"
        assert data["sender_id"] == "alice"
        assert data["ciphertext_b64"] == ct

    def test_send_invalid_base64(self, client):
        resp = client.post("/api/messenger/send", json={
            "conversation_id": "conv-1",
            "sender_id": "alice",
            "recipient_id": "bob",
            "ciphertext_b64": "not!!!valid===base64",
        })
        assert resp.status_code in (201, 400)


class TestConversationEndpoint:
    def test_get_conversation(self, client):
        ct = base64.b64encode(b"hello").decode()
        client.post("/api/messenger/send", json={
            "conversation_id": "conv-1",
            "sender_id": "alice",
            "recipient_id": "bob",
            "ciphertext_b64": ct,
        })
        resp = client.get("/api/messenger/messages/conv-1")
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] == 1
        assert data["messages"][0]["ciphertext_b64"] == ct

    def test_empty_conversation(self, client):
        resp = client.get("/api/messenger/messages/nonexistent")
        assert resp.status_code == 200
        assert resp.json()["count"] == 0


class TestUndeliveredEndpoint:
    def test_get_undelivered(self, client):
        ct = base64.b64encode(b"queued").decode()
        client.post("/api/messenger/send", json={
            "conversation_id": "conv-1",
            "sender_id": "alice",
            "recipient_id": "bob",
            "ciphertext_b64": ct,
        })
        resp = client.get("/api/messenger/undelivered/bob")
        assert resp.status_code == 200
        assert resp.json()["count"] == 1


class TestDeliveredEndpoint:
    def test_mark_delivered(self, client):
        ct = base64.b64encode(b"ack").decode()
        send_resp = client.post("/api/messenger/send", json={
            "conversation_id": "conv-1",
            "sender_id": "alice",
            "recipient_id": "bob",
            "ciphertext_b64": ct,
        })
        msg_id = send_resp.json()["id"]

        resp = client.post(f"/api/messenger/delivered/{msg_id}")
        assert resp.status_code == 204

        undelivered = client.get("/api/messenger/undelivered/bob")
        assert undelivered.json()["count"] == 0


class TestCleanupEndpoint:
    def test_cleanup(self, client):
        resp = client.post("/api/messenger/cleanup")
        assert resp.status_code == 200
        assert "purged" in resp.json()


class TestGroupSendEndpoint:
    def test_group_send(self, client):
        ct = base64.b64encode(b"group_msg").decode()
        resp = client.post("/api/messenger/group-send", json={
            "conversation_id": "group-1",
            "sender_id": "alice",
            "recipients": ["bob", "charlie"],
            "ciphertext_b64": ct,
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["count"] == 2
        assert len(data["message_ids"]) == 2
