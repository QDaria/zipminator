"""Standalone PQC signaling server for Zipminator Messenger (Pillar 2) and VoIP (Pillar 3).

Runs independently without PostgreSQL or Redis. All state is in-memory.
Supports:
  - Room creation, join, leave
  - Encrypted message relay between peers
  - PQ Double Ratchet key exchange handshake (offer/answer/ICE candidates)
  - Presence notifications (peer join/leave)

Usage:
    micromamba activate zip-pqc
    python -m zipminator.messenger.signaling_server          # port 8765
    python -m zipminator.messenger.signaling_server --port 9000
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import time
import uuid
from dataclasses import dataclass, field
from typing import Dict, Optional, Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

log = logging.getLogger("zipminator.signaling")

# ---------------------------------------------------------------------------
# Data models (in-memory, no DB)
# ---------------------------------------------------------------------------


@dataclass
class Peer:
    """A connected WebSocket peer."""

    client_id: str
    ws: WebSocket
    room_id: Optional[str] = None
    connected_at: float = field(default_factory=time.time)


@dataclass
class Room:
    """A signaling room that groups peers for key exchange and message relay."""

    room_id: str
    peers: Set[str] = field(default_factory=set)
    created_at: float = field(default_factory=time.time)


# ---------------------------------------------------------------------------
# Connection / Room manager
# ---------------------------------------------------------------------------


class SignalingRoomManager:
    """Manages peers, rooms, and message routing. All in-memory."""

    def __init__(self) -> None:
        self.peers: Dict[str, Peer] = {}
        self.rooms: Dict[str, Room] = {}

    # -- connection lifecycle ------------------------------------------------

    async def connect(self, client_id: str, ws: WebSocket) -> Peer:
        await ws.accept()
        peer = Peer(client_id=client_id, ws=ws)
        self.peers[client_id] = peer
        log.info("peer connected: %s", client_id)
        return peer

    async def disconnect(self, client_id: str) -> None:
        peer = self.peers.pop(client_id, None)
        if peer and peer.room_id:
            await self._leave_room(peer)
        log.info("peer disconnected: %s", client_id)

    # -- room operations -----------------------------------------------------

    def create_room(self, room_id: Optional[str] = None) -> Room:
        rid = room_id or str(uuid.uuid4())
        if rid not in self.rooms:
            self.rooms[rid] = Room(room_id=rid)
            log.info("room created: %s", rid)
        return self.rooms[rid]

    async def join_room(self, client_id: str, room_id: str) -> bool:
        peer = self.peers.get(client_id)
        if not peer:
            return False
        # Leave current room first if in one
        if peer.room_id and peer.room_id != room_id:
            await self._leave_room(peer)
        room = self.create_room(room_id)
        room.peers.add(client_id)
        peer.room_id = room_id
        log.info("peer %s joined room %s", client_id, room_id)
        # Notify others in room
        await self._broadcast_to_room(
            room_id,
            {
                "type": "peer_joined",
                "peer_id": client_id,
                "room_id": room_id,
                "peers": list(room.peers),
            },
            exclude=client_id,
        )
        return True

    async def leave_room(self, client_id: str) -> bool:
        peer = self.peers.get(client_id)
        if not peer or not peer.room_id:
            return False
        await self._leave_room(peer)
        return True

    async def _leave_room(self, peer: Peer) -> None:
        room = self.rooms.get(peer.room_id)
        if not room:
            peer.room_id = None
            return
        room.peers.discard(peer.client_id)
        old_room_id = peer.room_id
        peer.room_id = None
        log.info("peer %s left room %s", peer.client_id, old_room_id)
        # Notify remaining peers
        await self._broadcast_to_room(
            old_room_id,
            {
                "type": "peer_left",
                "peer_id": peer.client_id,
                "room_id": old_room_id,
                "peers": list(room.peers),
            },
        )
        # Garbage-collect empty rooms
        if not room.peers:
            self.rooms.pop(old_room_id, None)
            log.info("room %s removed (empty)", old_room_id)

    # -- message routing -----------------------------------------------------

    async def relay_to_peer(self, from_id: str, target_id: str, payload: dict) -> bool:
        """Send a message directly to a specific peer (1:1 signaling)."""
        target = self.peers.get(target_id)
        if not target:
            return False
        payload["from"] = from_id
        await target.ws.send_text(json.dumps(payload))
        return True

    async def broadcast_to_room(
        self, from_id: str, room_id: str, payload: dict
    ) -> int:
        """Broadcast a message to all peers in a room except the sender."""
        payload["from"] = from_id
        return await self._broadcast_to_room(room_id, payload, exclude=from_id)

    async def _broadcast_to_room(
        self, room_id: str, payload: dict, exclude: Optional[str] = None
    ) -> int:
        room = self.rooms.get(room_id)
        if not room:
            return 0
        msg_text = json.dumps(payload)
        sent = 0
        for pid in list(room.peers):
            if pid == exclude:
                continue
            peer = self.peers.get(pid)
            if peer:
                try:
                    await peer.ws.send_text(msg_text)
                    sent += 1
                except Exception:
                    log.warning("failed to send to peer %s", pid)
        return sent

    # -- queries -------------------------------------------------------------

    def list_rooms(self) -> list:
        return [
            {"room_id": r.room_id, "peer_count": len(r.peers)}
            for r in self.rooms.values()
        ]

    def room_peers(self, room_id: str) -> list:
        room = self.rooms.get(room_id)
        return list(room.peers) if room else []

    @property
    def peer_count(self) -> int:
        return len(self.peers)


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------

manager = SignalingRoomManager()


def create_app() -> FastAPI:
    """Factory that builds the signaling FastAPI app."""
    application = FastAPI(
        title="Zipminator PQC Signaling Server",
        version="0.1.0",
        description="In-memory WebSocket signaling for PQ Messenger and VoIP",
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # -- REST endpoints (health, room listing) --------------------------------

    @application.get("/health")
    async def health():
        return {
            "status": "ok",
            "peers": manager.peer_count,
            "rooms": len(manager.rooms),
        }

    @application.get("/rooms")
    async def list_rooms():
        return {"rooms": manager.list_rooms()}

    @application.get("/rooms/{room_id}")
    async def room_info(room_id: str):
        if room_id not in manager.rooms:
            return {"error": "room not found"}, 404
        return {
            "room_id": room_id,
            "peers": manager.room_peers(room_id),
        }

    # -- WebSocket endpoint ---------------------------------------------------

    @application.websocket("/ws/{client_id}")
    async def ws_endpoint(websocket: WebSocket, client_id: str):
        """Main signaling WebSocket endpoint.

        Protocol (JSON messages from client):
            {"action": "create_room"}
                -> responds {"type": "room_created", "room_id": ...}

            {"action": "create_room", "room_id": "my-room"}
                -> responds {"type": "room_created", "room_id": "my-room"}

            {"action": "join", "room_id": "..."}
                -> responds {"type": "joined", "room_id": ...}
                -> broadcasts {"type": "peer_joined", ...} to room

            {"action": "leave"}
                -> responds {"type": "left", "room_id": ...}
                -> broadcasts {"type": "peer_left", ...} to room

            {"action": "signal", "target": "peer_id", "type": "offer"|"answer"|"ice", ...}
                -> forwards entire payload to target peer with "from" injected

            {"action": "message", "target": "peer_id", "ciphertext": "..."}
                -> forwards encrypted message to target (1:1)

            {"action": "broadcast", "room_id": "...", "ciphertext": "..."}
                -> forwards encrypted message to all room peers except sender

            {"action": "list_rooms"}
                -> responds {"type": "room_list", "rooms": [...]}

            {"action": "room_peers", "room_id": "..."}
                -> responds {"type": "room_peers", "peers": [...]}
        """
        peer = await manager.connect(client_id, websocket)
        try:
            while True:
                raw = await websocket.receive_text()
                try:
                    msg = json.loads(raw)
                except json.JSONDecodeError:
                    await websocket.send_text(
                        json.dumps({"type": "error", "detail": "invalid JSON"})
                    )
                    continue

                action = msg.get("action", "")
                await _handle_action(peer, msg, action, websocket)

        except WebSocketDisconnect:
            await manager.disconnect(client_id)
        except Exception as exc:
            log.error("ws error for %s: %s", client_id, exc)
            await manager.disconnect(client_id)

    return application


async def _handle_action(
    peer: Peer, msg: dict, action: str, ws: WebSocket
) -> None:
    """Dispatch a single client message by action type."""

    if action == "create_room":
        room = manager.create_room(msg.get("room_id"))
        await ws.send_text(
            json.dumps({"type": "room_created", "room_id": room.room_id})
        )

    elif action == "join":
        room_id = msg.get("room_id")
        if not room_id:
            await ws.send_text(
                json.dumps({"type": "error", "detail": "room_id required"})
            )
            return
        ok = await manager.join_room(peer.client_id, room_id)
        if ok:
            await ws.send_text(
                json.dumps({
                    "type": "joined",
                    "room_id": room_id,
                    "peers": manager.room_peers(room_id),
                })
            )
        else:
            await ws.send_text(
                json.dumps({"type": "error", "detail": "join failed"})
            )

    elif action == "leave":
        old_room = peer.room_id
        ok = await manager.leave_room(peer.client_id)
        if ok:
            await ws.send_text(
                json.dumps({"type": "left", "room_id": old_room})
            )
        else:
            await ws.send_text(
                json.dumps({"type": "error", "detail": "not in a room"})
            )

    elif action == "signal":
        # PQ Double Ratchet handshake: offer, answer, ice candidates
        target_id = msg.get("target")
        if not target_id:
            await ws.send_text(
                json.dumps({"type": "error", "detail": "target required"})
            )
            return
        payload = {k: v for k, v in msg.items() if k != "action"}
        ok = await manager.relay_to_peer(peer.client_id, target_id, payload)
        if not ok:
            await ws.send_text(
                json.dumps({
                    "type": "error",
                    "detail": f"peer {target_id} is offline",
                })
            )

    elif action == "message":
        # Encrypted 1:1 message relay
        target_id = msg.get("target")
        if not target_id:
            await ws.send_text(
                json.dumps({"type": "error", "detail": "target required"})
            )
            return
        payload = {k: v for k, v in msg.items() if k != "action"}
        payload["type"] = "message"
        ok = await manager.relay_to_peer(peer.client_id, target_id, payload)
        if not ok:
            await ws.send_text(
                json.dumps({
                    "type": "error",
                    "detail": f"peer {target_id} is offline",
                })
            )

    elif action == "broadcast":
        room_id = msg.get("room_id", peer.room_id)
        if not room_id:
            await ws.send_text(
                json.dumps({"type": "error", "detail": "room_id required"})
            )
            return
        payload = {k: v for k, v in msg.items() if k != "action"}
        payload["type"] = "broadcast"
        await manager.broadcast_to_room(peer.client_id, room_id, payload)

    elif action == "list_rooms":
        await ws.send_text(
            json.dumps({"type": "room_list", "rooms": manager.list_rooms()})
        )

    elif action == "room_peers":
        room_id = msg.get("room_id")
        if not room_id:
            await ws.send_text(
                json.dumps({"type": "error", "detail": "room_id required"})
            )
            return
        await ws.send_text(
            json.dumps({
                "type": "room_peers",
                "room_id": room_id,
                "peers": manager.room_peers(room_id),
            })
        )

    else:
        await ws.send_text(
            json.dumps({"type": "error", "detail": f"unknown action: {action}"})
        )


# Module-level app for import / TestClient usage
app = create_app()


# ---------------------------------------------------------------------------
# Standalone runner
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Zipminator PQC Signaling Server")
    parser.add_argument("--host", default="0.0.0.0", help="Bind address")
    parser.add_argument("--port", type=int, default=8765, help="Port (default 8765)")
    parser.add_argument("--log-level", default="info", help="Log level")
    args = parser.parse_args()

    logging.basicConfig(
        level=getattr(logging, args.log_level.upper(), logging.INFO),
        format="%(asctime)s [%(name)s] %(levelname)s %(message)s",
    )
    import uvicorn

    log.info("Starting signaling server on %s:%d", args.host, args.port)
    uvicorn.run(app, host=args.host, port=args.port, log_level=args.log_level)


if __name__ == "__main__":
    main()
