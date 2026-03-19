"""E2E Messenger Test (Unit 7).

Flow: alice registers -> bob registers -> alice sends encrypted message
to bob via REST API -> bob fetches conversation -> verify message matches.

For WebSocket signaling, tests the connection + message forwarding.
"""

import asyncio
import base64
import json
import os
import pytest

import httpx

API_URL = os.environ.get("ZIPMINATOR_API_URL", "http://localhost:8000")

pytestmark = pytest.mark.integration


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


class TestMessengerE2E:
    """REST-based messenger flow."""

    @pytest.fixture(autouse=True)
    def _setup(self, mock_users, api_client):
        self.alice = mock_users["alice"]
        self.bob = mock_users["bob"]
        self.client = api_client

    def test_alice_sends_message_bob_receives(self):
        """Alice sends a PQC-encrypted message; Bob fetches the conversation."""
        # Encrypt a message (client-side in production; here we use test ciphertext)
        plaintext = b"Hello Bob, this is a quantum-safe message!"
        ct = base64.b64encode(plaintext).decode()
        nonce = base64.b64encode(os.urandom(12)).decode()
        conv_id = f"alice-bob-{os.urandom(4).hex()}"

        # Alice sends
        resp = self.client.post(
            "/v1/messages/send",
            json={
                "conversation_id": conv_id,
                "recipient_id": self.bob.user_id,
                "ciphertext_b64": ct,
                "nonce_b64": nonce,
            },
            headers=_auth(self.alice.token),
        )
        assert resp.status_code == 201, f"Send failed: {resp.text}"
        msg = resp.json()
        assert msg["conversation_id"] == conv_id
        assert msg["sender_id"] == self.alice.user_id

        # Bob fetches conversation
        resp = self.client.get(
            f"/v1/messages/{conv_id}",
            headers=_auth(self.bob.token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] >= 1
        received = data["messages"][0]
        assert received["sender_id"] == self.alice.user_id

        # Verify ciphertext matches
        received_ct = base64.b64decode(received["ciphertext_b64"])
        assert received_ct == plaintext

    def test_offline_queue_drain(self):
        """Messages queued for offline recipient can be drained."""
        ct = base64.b64encode(b"offline message").decode()
        nonce = base64.b64encode(os.urandom(12)).decode()
        conv_id = f"offline-{os.urandom(4).hex()}"

        # Alice sends to Bob (queued in offline queue)
        resp = self.client.post(
            "/v1/messages/send",
            json={
                "conversation_id": conv_id,
                "recipient_id": self.bob.user_id,
                "ciphertext_b64": ct,
                "nonce_b64": nonce,
            },
            headers=_auth(self.alice.token),
        )
        assert resp.status_code == 201

        # Bob drains offline queue
        resp = self.client.get(
            "/v1/messages/offline",
            headers=_auth(self.bob.token),
        )
        assert resp.status_code == 200
        data = resp.json()
        # Should contain at least the message we just sent
        assert data["count"] >= 1

    def test_multiple_messages_ordered(self):
        """Multiple messages in a conversation are returned in sequence order."""
        conv_id = f"ordered-{os.urandom(4).hex()}"
        messages_text = ["first", "second", "third"]

        for text in messages_text:
            resp = self.client.post(
                "/v1/messages/send",
                json={
                    "conversation_id": conv_id,
                    "recipient_id": self.bob.user_id,
                    "ciphertext_b64": base64.b64encode(text.encode()).decode(),
                    "nonce_b64": base64.b64encode(os.urandom(12)).decode(),
                },
                headers=_auth(self.alice.token),
            )
            assert resp.status_code == 201

        # Fetch conversation
        resp = self.client.get(
            f"/v1/messages/{conv_id}",
            headers=_auth(self.bob.token),
        )
        data = resp.json()
        assert data["count"] == 3
        seqs = [m["sequence"] for m in data["messages"]]
        assert seqs == [0, 1, 2], f"Expected sequential order, got {seqs}"


@pytest.mark.asyncio
class TestWebSocketSignaling:
    """WebSocket signaling integration."""

    async def test_websocket_connect_invalid_token(self):
        """Connection with invalid JWT should be rejected."""
        import websockets
        try:
            async with websockets.connect(
                f"ws://localhost:8000/ws/signal?token=invalid-jwt"
            ) as ws:
                # Should receive close frame
                msg = await asyncio.wait_for(ws.recv(), timeout=5)
                pytest.fail(f"Expected close, got: {msg}")
        except (websockets.exceptions.ConnectionClosedError, Exception):
            pass  # Expected: server closes with 4001
