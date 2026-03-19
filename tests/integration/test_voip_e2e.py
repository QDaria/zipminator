"""E2E VoIP Test (Unit 8).

Flow: alice creates SDP offer with PQ extension -> sends via API -> bob receives ->
creates answer with PQ ciphertext -> sends back -> verify session connected.
"""

import base64
import os
import pytest

API_URL = os.environ.get("ZIPMINATOR_API_URL", "http://localhost:8000")

pytestmark = pytest.mark.integration


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


class TestVoipE2E:
    """VoIP SDP exchange flow via API."""

    @pytest.fixture(autouse=True)
    def _setup(self, mock_users, api_client):
        self.alice = mock_users["alice"]
        self.bob = mock_users["bob"]
        self.client = api_client

    def test_offer_answer_hangup_flow(self):
        """Full VoIP call lifecycle: offer -> answer -> hangup."""
        # Alice creates offer targeting Bob
        resp = self.client.post(
            "/v1/voip/offer",
            json={"callee_id": self.bob.user_id},
            headers=_auth(self.alice.token),
        )
        assert resp.status_code == 200, f"Offer failed: {resp.text}"
        offer = resp.json()
        assert offer["caller_id"] == self.alice.user_id
        assert offer["callee_id"] == self.bob.user_id
        assert offer["kem_line"].startswith("a=pq-kem:ML-KEM-768 ")
        assert len(offer["fingerprint"]) == 64  # SHA-256 hex

        session_id = offer["session_id"]
        pk_b64 = offer["pk_b64"]

        # Bob encapsulates against Alice's public key
        # (In production, this uses real KEM; here we generate test ciphertext)
        pk_bytes = base64.b64decode(pk_b64)

        try:
            from zipminator._core import encapsulate, PublicKey
            pk_obj = PublicKey.from_bytes(pk_bytes)
            result = encapsulate(pk_obj)
            ct_bytes = result[0].to_bytes()
        except ImportError:
            # Fallback: random ciphertext (won't derive real shared secret)
            ct_bytes = os.urandom(1088)

        ct_b64 = base64.b64encode(ct_bytes).decode()

        # Bob sends answer
        resp = self.client.post(
            "/v1/voip/answer",
            json={
                "session_id": session_id,
                "ct_b64": ct_b64,
            },
            headers=_auth(self.bob.token),
        )
        assert resp.status_code == 200, f"Answer failed: {resp.text}"
        answer = resp.json()
        assert answer["answerer_id"] == self.bob.user_id
        assert answer["ct_line"].startswith("a=pq-ct:")
        assert len(answer["fingerprint"]) == 64
        assert len(answer["srtp_key_b64"]) > 0  # SRTP key derived

        # Alice hangs up
        resp = self.client.post(
            "/v1/voip/hangup",
            json={"session_id": session_id},
            headers=_auth(self.alice.token),
        )
        assert resp.status_code == 204

    def test_offer_creates_unique_sessions(self):
        """Each offer creates a distinct session ID."""
        ids = set()
        for _ in range(3):
            resp = self.client.post(
                "/v1/voip/offer",
                json={"callee_id": self.bob.user_id},
                headers=_auth(self.alice.token),
            )
            assert resp.status_code == 200
            ids.add(resp.json()["session_id"])
        assert len(ids) == 3, "Session IDs must be unique"

    def test_wrong_callee_cannot_answer(self):
        """Only the designated callee can answer an offer."""
        carol = None
        try:
            from tests.integration.conftest import _auth_header
        except ImportError:
            pass

        # Create offer for Bob
        resp = self.client.post(
            "/v1/voip/offer",
            json={"callee_id": self.bob.user_id},
            headers=_auth(self.alice.token),
        )
        session_id = resp.json()["session_id"]

        # Alice tries to answer her own offer (she's the caller, not callee)
        resp = self.client.post(
            "/v1/voip/answer",
            json={
                "session_id": session_id,
                "ct_b64": base64.b64encode(os.urandom(1088)).decode(),
            },
            headers=_auth(self.alice.token),
        )
        assert resp.status_code == 403, "Non-callee should be rejected"

    def test_hangup_nonexistent_session(self):
        """Hanging up a nonexistent session returns 404."""
        resp = self.client.post(
            "/v1/voip/hangup",
            json={"session_id": "nonexistent-session-id"},
            headers=_auth(self.alice.token),
        )
        assert resp.status_code == 404
