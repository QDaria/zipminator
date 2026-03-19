"""WebSocket signaling endpoint mounted into the FastAPI app (Unit 2).

Reuses the ConnectionManager pattern from src/zipminator/messenger/signaling.py
but adds JWT authentication on the WebSocket handshake.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Dict
import json
import logging

from src.services.auth import decode_access_token

log = logging.getLogger(__name__)

router = APIRouter()


class SignalingManager:
    """Manages authenticated WebSocket connections for signaling."""

    def __init__(self):
        self.connections: Dict[int, WebSocket] = {}  # user_id -> ws

    async def connect(self, user_id: int, ws: WebSocket):
        await ws.accept()
        self.connections[user_id] = ws
        log.info("signaling: user %d connected", user_id)

    def disconnect(self, user_id: int):
        self.connections.pop(user_id, None)
        log.info("signaling: user %d disconnected", user_id)

    async def send_to(self, user_id: int, data: str) -> bool:
        ws = self.connections.get(user_id)
        if ws:
            await ws.send_text(data)
            return True
        return False


manager = SignalingManager()


@router.websocket("/ws/signal")
async def signaling_endpoint(
    ws: WebSocket,
    token: str = Query(...),
):
    """Authenticated WebSocket for signaling (offer/answer/ICE forwarding).

    Connect with: ws://host/ws/signal?token=<jwt>

    Message format (JSON):
        {"target": <user_id>, "type": "offer"|"answer"|"ice"|"message", ...payload}
    """
    # Authenticate via JWT query param
    payload = decode_access_token(token)
    if payload is None:
        await ws.close(code=4001, reason="Invalid token")
        return

    user_id: int = payload.get("user_id")
    if user_id is None:
        await ws.close(code=4001, reason="Invalid token payload")
        return

    await manager.connect(user_id, ws)
    try:
        while True:
            raw = await ws.receive_text()
            msg = json.loads(raw)
            target_id = msg.get("target")
            if target_id is not None:
                # Inject sender info
                msg["from"] = user_id
                forwarded = await manager.send_to(int(target_id), json.dumps(msg))
                if not forwarded:
                    # Notify sender that target is offline
                    await ws.send_text(json.dumps({
                        "type": "error",
                        "detail": f"User {target_id} is offline",
                    }))
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as exc:
        log.error("signaling error for user %d: %s", user_id, exc)
        manager.disconnect(user_id)
