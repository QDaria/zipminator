"""Tests for the standalone PQC signaling server.

Covers: room lifecycle, peer signaling (offer/answer/ICE), encrypted message
relay, broadcast, presence notifications, and error handling.
"""

import json
import sys
from pathlib import Path

import pytest

# Ensure src is on the path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "src"))

try:
    from starlette.testclient import TestClient
    from zipminator.messenger.signaling_server import create_app, SignalingRoomManager

    _HAS_DEPS = True
except (ImportError, TypeError) as exc:
    _HAS_DEPS = False
    _skip_reason = str(exc)

pytestmark = pytest.mark.skipif(
    not _HAS_DEPS,
    reason=f"dependencies unavailable: {_skip_reason if not _HAS_DEPS else ''}",
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def app():
    """Fresh app with a fresh manager for each test."""
    return create_app()


@pytest.fixture()
def client(app):
    return TestClient(app)


# ---------------------------------------------------------------------------
# REST endpoint tests
# ---------------------------------------------------------------------------


class TestHealthEndpoint:
    def test_health_returns_ok(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert "peers" in data
        assert "rooms" in data

    def test_rooms_initially_empty(self, client):
        resp = client.get("/rooms")
        assert resp.status_code == 200
        assert resp.json()["rooms"] == []


# ---------------------------------------------------------------------------
# WebSocket connection tests
# ---------------------------------------------------------------------------


class TestWebSocketConnection:
    def test_connect_and_disconnect(self, client):
        with client.websocket_connect("/ws/alice") as ws:
            # Connection established; send a list_rooms to verify comms
            ws.send_text(json.dumps({"action": "list_rooms"}))
            data = json.loads(ws.receive_text())
            assert data["type"] == "room_list"

    def test_invalid_json_returns_error(self, client):
        with client.websocket_connect("/ws/alice") as ws:
            ws.send_text("not json at all")
            data = json.loads(ws.receive_text())
            assert data["type"] == "error"
            assert "invalid JSON" in data["detail"]

    def test_unknown_action_returns_error(self, client):
        with client.websocket_connect("/ws/alice") as ws:
            ws.send_text(json.dumps({"action": "foobar"}))
            data = json.loads(ws.receive_text())
            assert data["type"] == "error"
            assert "unknown action" in data["detail"]


# ---------------------------------------------------------------------------
# Room lifecycle tests
# ---------------------------------------------------------------------------


class TestRoomLifecycle:
    def test_create_room_auto_id(self, client):
        with client.websocket_connect("/ws/alice") as ws:
            ws.send_text(json.dumps({"action": "create_room"}))
            data = json.loads(ws.receive_text())
            assert data["type"] == "room_created"
            assert "room_id" in data
            assert len(data["room_id"]) > 0

    def test_create_room_custom_id(self, client):
        with client.websocket_connect("/ws/alice") as ws:
            ws.send_text(json.dumps({"action": "create_room", "room_id": "test-room"}))
            data = json.loads(ws.receive_text())
            assert data["type"] == "room_created"
            assert data["room_id"] == "test-room"

    def test_join_room(self, client):
        with client.websocket_connect("/ws/alice") as ws:
            ws.send_text(json.dumps({"action": "create_room", "room_id": "r1"}))
            ws.receive_text()  # room_created
            ws.send_text(json.dumps({"action": "join", "room_id": "r1"}))
            data = json.loads(ws.receive_text())
            assert data["type"] == "joined"
            assert data["room_id"] == "r1"
            assert "alice" in data["peers"]

    def test_join_without_room_id_errors(self, client):
        with client.websocket_connect("/ws/alice") as ws:
            ws.send_text(json.dumps({"action": "join"}))
            data = json.loads(ws.receive_text())
            assert data["type"] == "error"
            assert "room_id required" in data["detail"]

    def test_leave_room(self, client):
        with client.websocket_connect("/ws/alice") as ws:
            ws.send_text(json.dumps({"action": "create_room", "room_id": "r1"}))
            ws.receive_text()
            ws.send_text(json.dumps({"action": "join", "room_id": "r1"}))
            ws.receive_text()  # joined
            ws.send_text(json.dumps({"action": "leave"}))
            data = json.loads(ws.receive_text())
            assert data["type"] == "left"
            assert data["room_id"] == "r1"

    def test_leave_when_not_in_room_errors(self, client):
        with client.websocket_connect("/ws/alice") as ws:
            ws.send_text(json.dumps({"action": "leave"}))
            data = json.loads(ws.receive_text())
            assert data["type"] == "error"
            assert "not in a room" in data["detail"]

    def test_peer_joined_notification(self, client):
        """When bob joins a room alice is in, alice gets a peer_joined notification."""
        with client.websocket_connect("/ws/alice") as ws_alice:
            ws_alice.send_text(json.dumps({"action": "create_room", "room_id": "r1"}))
            ws_alice.receive_text()
            ws_alice.send_text(json.dumps({"action": "join", "room_id": "r1"}))
            ws_alice.receive_text()  # joined

            with client.websocket_connect("/ws/bob") as ws_bob:
                ws_bob.send_text(json.dumps({"action": "join", "room_id": "r1"}))
                ws_bob.receive_text()  # joined response to bob

                # Alice should receive peer_joined
                notif = json.loads(ws_alice.receive_text())
                assert notif["type"] == "peer_joined"
                assert notif["peer_id"] == "bob"
                assert "alice" in notif["peers"]
                assert "bob" in notif["peers"]

    def test_peer_left_notification(self, client):
        """When bob leaves, alice gets a peer_left notification."""
        with client.websocket_connect("/ws/alice") as ws_alice:
            ws_alice.send_text(json.dumps({"action": "create_room", "room_id": "r1"}))
            ws_alice.receive_text()
            ws_alice.send_text(json.dumps({"action": "join", "room_id": "r1"}))
            ws_alice.receive_text()

            with client.websocket_connect("/ws/bob") as ws_bob:
                ws_bob.send_text(json.dumps({"action": "join", "room_id": "r1"}))
                ws_bob.receive_text()
                ws_alice.receive_text()  # peer_joined for bob

                ws_bob.send_text(json.dumps({"action": "leave"}))
                ws_bob.receive_text()  # left response

            # Alice should get peer_left (either from explicit leave or disconnect)
            notif = json.loads(ws_alice.receive_text())
            assert notif["type"] == "peer_left"
            assert notif["peer_id"] == "bob"


# ---------------------------------------------------------------------------
# Signaling (PQ Double Ratchet handshake) tests
# ---------------------------------------------------------------------------


class TestSignaling:
    def test_offer_answer_flow(self, client):
        """Simulates a PQ Double Ratchet offer/answer exchange."""
        with client.websocket_connect("/ws/alice") as ws_alice:
            with client.websocket_connect("/ws/bob") as ws_bob:
                # Alice sends offer to Bob
                offer = {
                    "action": "signal",
                    "target": "bob",
                    "type": "offer",
                    "pq_kem_public_key": "AAAA...base64...",
                    "ecdh_public_key": "BBBB...base64...",
                }
                ws_alice.send_text(json.dumps(offer))
                data = json.loads(ws_bob.receive_text())
                assert data["type"] == "offer"
                assert data["from"] == "alice"
                assert data["pq_kem_public_key"] == "AAAA...base64..."

                # Bob sends answer back to Alice
                answer = {
                    "action": "signal",
                    "target": "alice",
                    "type": "answer",
                    "pq_kem_ciphertext": "CCCC...base64...",
                    "ecdh_public_key": "DDDD...base64...",
                }
                ws_bob.send_text(json.dumps(answer))
                data = json.loads(ws_alice.receive_text())
                assert data["type"] == "answer"
                assert data["from"] == "bob"
                assert data["pq_kem_ciphertext"] == "CCCC...base64..."

    def test_ice_candidate_relay(self, client):
        """ICE candidates are relayed between peers."""
        with client.websocket_connect("/ws/alice") as ws_alice:
            with client.websocket_connect("/ws/bob") as ws_bob:
                ice = {
                    "action": "signal",
                    "target": "bob",
                    "type": "ice",
                    "candidate": "candidate:1 1 UDP 2122252543 ...",
                    "sdpMid": "0",
                }
                ws_alice.send_text(json.dumps(ice))
                data = json.loads(ws_bob.receive_text())
                assert data["type"] == "ice"
                assert data["from"] == "alice"
                assert "candidate" in data

    def test_signal_to_offline_peer(self, client):
        """Signaling to a non-existent peer returns an error."""
        with client.websocket_connect("/ws/alice") as ws_alice:
            ws_alice.send_text(
                json.dumps({
                    "action": "signal",
                    "target": "nobody",
                    "type": "offer",
                })
            )
            data = json.loads(ws_alice.receive_text())
            assert data["type"] == "error"
            assert "offline" in data["detail"]

    def test_signal_without_target_errors(self, client):
        with client.websocket_connect("/ws/alice") as ws_alice:
            ws_alice.send_text(json.dumps({"action": "signal", "type": "offer"}))
            data = json.loads(ws_alice.receive_text())
            assert data["type"] == "error"
            assert "target required" in data["detail"]


# ---------------------------------------------------------------------------
# Encrypted message relay tests
# ---------------------------------------------------------------------------


class TestMessageRelay:
    def test_encrypted_message_1to1(self, client):
        """Two clients exchange encrypted messages through the server."""
        with client.websocket_connect("/ws/alice") as ws_alice:
            with client.websocket_connect("/ws/bob") as ws_bob:
                # Alice sends encrypted message to Bob
                ws_alice.send_text(
                    json.dumps({
                        "action": "message",
                        "target": "bob",
                        "ciphertext": "AES-256-GCM{...encrypted...}",
                        "nonce": "abc123",
                        "header": {"dh": "...", "pn": 0, "n": 0},
                    })
                )
                data = json.loads(ws_bob.receive_text())
                assert data["type"] == "message"
                assert data["from"] == "alice"
                assert data["ciphertext"] == "AES-256-GCM{...encrypted...}"
                assert data["nonce"] == "abc123"

                # Bob replies
                ws_bob.send_text(
                    json.dumps({
                        "action": "message",
                        "target": "alice",
                        "ciphertext": "AES-256-GCM{...reply...}",
                        "nonce": "def456",
                        "header": {"dh": "...", "pn": 0, "n": 1},
                    })
                )
                data = json.loads(ws_alice.receive_text())
                assert data["type"] == "message"
                assert data["from"] == "bob"
                assert data["ciphertext"] == "AES-256-GCM{...reply...}"

    def test_message_to_offline_peer(self, client):
        with client.websocket_connect("/ws/alice") as ws_alice:
            ws_alice.send_text(
                json.dumps({
                    "action": "message",
                    "target": "ghost",
                    "ciphertext": "...",
                })
            )
            data = json.loads(ws_alice.receive_text())
            assert data["type"] == "error"
            assert "offline" in data["detail"]

    def test_message_without_target_errors(self, client):
        with client.websocket_connect("/ws/alice") as ws_alice:
            ws_alice.send_text(
                json.dumps({"action": "message", "ciphertext": "..."})
            )
            data = json.loads(ws_alice.receive_text())
            assert data["type"] == "error"
            assert "target required" in data["detail"]


# ---------------------------------------------------------------------------
# Room broadcast tests
# ---------------------------------------------------------------------------


class TestBroadcast:
    def test_broadcast_to_room(self, client):
        """A message broadcast reaches all room peers except the sender."""
        with client.websocket_connect("/ws/alice") as ws_alice:
            with client.websocket_connect("/ws/bob") as ws_bob:
                # Both join the same room
                ws_alice.send_text(
                    json.dumps({"action": "create_room", "room_id": "group"})
                )
                ws_alice.receive_text()
                ws_alice.send_text(
                    json.dumps({"action": "join", "room_id": "group"})
                )
                ws_alice.receive_text()  # joined

                ws_bob.send_text(
                    json.dumps({"action": "join", "room_id": "group"})
                )
                ws_bob.receive_text()  # joined
                ws_alice.receive_text()  # peer_joined notification

                # Alice broadcasts
                ws_alice.send_text(
                    json.dumps({
                        "action": "broadcast",
                        "room_id": "group",
                        "ciphertext": "group-encrypted-msg",
                    })
                )
                data = json.loads(ws_bob.receive_text())
                assert data["type"] == "broadcast"
                assert data["from"] == "alice"
                assert data["ciphertext"] == "group-encrypted-msg"

    def test_broadcast_without_room_id_uses_current_room(self, client):
        with client.websocket_connect("/ws/alice") as ws_alice:
            with client.websocket_connect("/ws/bob") as ws_bob:
                ws_alice.send_text(
                    json.dumps({"action": "create_room", "room_id": "auto"})
                )
                ws_alice.receive_text()
                ws_alice.send_text(
                    json.dumps({"action": "join", "room_id": "auto"})
                )
                ws_alice.receive_text()

                ws_bob.send_text(
                    json.dumps({"action": "join", "room_id": "auto"})
                )
                ws_bob.receive_text()
                ws_alice.receive_text()  # peer_joined

                # Broadcast without specifying room_id (uses alice's current room)
                ws_alice.send_text(
                    json.dumps({
                        "action": "broadcast",
                        "ciphertext": "auto-room-msg",
                    })
                )
                data = json.loads(ws_bob.receive_text())
                assert data["type"] == "broadcast"
                assert data["ciphertext"] == "auto-room-msg"


# ---------------------------------------------------------------------------
# Room query tests
# ---------------------------------------------------------------------------


class TestRoomQueries:
    def test_list_rooms(self, client):
        with client.websocket_connect("/ws/alice") as ws:
            ws.send_text(json.dumps({"action": "create_room", "room_id": "q1"}))
            ws.receive_text()
            ws.send_text(json.dumps({"action": "create_room", "room_id": "q2"}))
            ws.receive_text()
            ws.send_text(json.dumps({"action": "list_rooms"}))
            data = json.loads(ws.receive_text())
            assert data["type"] == "room_list"
            room_ids = [r["room_id"] for r in data["rooms"]]
            assert "q1" in room_ids
            assert "q2" in room_ids

    def test_room_peers_query(self, client):
        with client.websocket_connect("/ws/alice") as ws_alice:
            ws_alice.send_text(
                json.dumps({"action": "create_room", "room_id": "rp"})
            )
            ws_alice.receive_text()
            ws_alice.send_text(json.dumps({"action": "join", "room_id": "rp"}))
            ws_alice.receive_text()

            ws_alice.send_text(
                json.dumps({"action": "room_peers", "room_id": "rp"})
            )
            data = json.loads(ws_alice.receive_text())
            assert data["type"] == "room_peers"
            assert "alice" in data["peers"]

    def test_room_peers_without_room_id_errors(self, client):
        with client.websocket_connect("/ws/alice") as ws:
            ws.send_text(json.dumps({"action": "room_peers"}))
            data = json.loads(ws.receive_text())
            assert data["type"] == "error"


# ---------------------------------------------------------------------------
# SignalingRoomManager unit tests
# ---------------------------------------------------------------------------


class TestSignalingRoomManager:
    def test_create_room_idempotent(self):
        mgr = SignalingRoomManager()
        r1 = mgr.create_room("same")
        r2 = mgr.create_room("same")
        assert r1 is r2
        assert len(mgr.rooms) == 1

    def test_peer_count(self):
        mgr = SignalingRoomManager()
        assert mgr.peer_count == 0

    def test_list_rooms_empty(self):
        mgr = SignalingRoomManager()
        assert mgr.list_rooms() == []

    def test_room_peers_nonexistent(self):
        mgr = SignalingRoomManager()
        assert mgr.room_peers("nope") == []
