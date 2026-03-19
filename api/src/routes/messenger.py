"""Messenger persistence REST API routes.

Lightweight endpoints backed by SQLite MessageStore. These endpoints handle
ciphertext-only message storage, conversation history, offline queue drain,
delivery acknowledgment, and TTL cleanup.

Independent of the SQLAlchemy/PostgreSQL stack used by the legacy messages router.
"""

import base64
import os
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from api.src.db.message_store import MessageStore

router = APIRouter()

# Default store instance (overridable via dependency injection for tests)
_default_store: MessageStore | None = None


def get_message_store() -> MessageStore:
    """FastAPI dependency that returns the MessageStore singleton."""
    global _default_store
    if _default_store is None:
        db_path = os.environ.get("MESSENGER_DB_PATH", ":memory:")
        _default_store = MessageStore(db_path=db_path)
    return _default_store


# ── Request/Response models ──────────────────────────────────────────────────

class SendRequest(BaseModel):
    conversation_id: str
    sender_id: str
    recipient_id: str
    ciphertext_b64: str
    ttl_seconds: int = 86400


class GroupSendRequest(BaseModel):
    conversation_id: str
    sender_id: str
    recipients: list[str]
    ciphertext_b64: str
    ttl_seconds: int = 86400


class MessageOut(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    recipient_id: str
    ciphertext_b64: str
    timestamp: float
    delivered: bool


class MessageListOut(BaseModel):
    messages: list[MessageOut]
    count: int


class CleanupOut(BaseModel):
    purged: int


class GroupSendOut(BaseModel):
    message_ids: list[str]
    count: int


# ── Helpers ──────────────────────────────────────────────────────────────────

def _msg_to_out(msg: dict) -> MessageOut:
    return MessageOut(
        id=msg["id"],
        conversation_id=msg["conversation_id"],
        sender_id=msg["sender_id"],
        recipient_id=msg["recipient_id"],
        ciphertext_b64=base64.b64encode(msg["ciphertext"]).decode(),
        timestamp=msg["timestamp"],
        delivered=msg["delivered"],
    )


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/send", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def send_message(body: SendRequest, store: MessageStore = Depends(get_message_store)):
    """Store an encrypted message. Ciphertext is base64-encoded in transit."""
    try:
        ciphertext = base64.b64decode(body.ciphertext_b64)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid base64 in ciphertext_b64",
        )

    msg_id = store.store(
        body.conversation_id,
        body.sender_id,
        body.recipient_id,
        ciphertext,
        body.ttl_seconds,
    )
    messages = store.get_messages(body.conversation_id, limit=1000)
    msg = next((m for m in messages if m["id"] == msg_id), None)
    if not msg:
        raise HTTPException(status_code=500, detail="Store failed")
    return _msg_to_out(msg)


@router.get("/messages/{conversation_id}", response_model=MessageListOut)
async def get_conversation(
    conversation_id: str,
    limit: int = 50,
    offset: int = 0,
    store: MessageStore = Depends(get_message_store),
):
    """Retrieve message history for a conversation."""
    messages = store.get_messages(conversation_id, limit=limit, offset=offset)
    return MessageListOut(
        messages=[_msg_to_out(m) for m in messages],
        count=len(messages),
    )


@router.get("/undelivered/{recipient_id}", response_model=MessageListOut)
async def get_undelivered(
    recipient_id: str,
    store: MessageStore = Depends(get_message_store),
):
    """Get all undelivered messages for a recipient (offline queue drain)."""
    messages = store.get_undelivered(recipient_id)
    return MessageListOut(
        messages=[_msg_to_out(m) for m in messages],
        count=len(messages),
    )


@router.post("/delivered/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def mark_delivered(
    message_id: str,
    store: MessageStore = Depends(get_message_store),
):
    """Mark a message as delivered."""
    store.mark_delivered(message_id)


@router.post("/cleanup", response_model=CleanupOut)
async def cleanup_expired(store: MessageStore = Depends(get_message_store)):
    """Purge messages whose TTL has expired."""
    purged = store.cleanup_expired()
    return CleanupOut(purged=purged)


@router.post("/group-send", response_model=GroupSendOut, status_code=status.HTTP_201_CREATED)
async def group_send(body: GroupSendRequest, store: MessageStore = Depends(get_message_store)):
    """Fan out an encrypted message to multiple group members."""
    try:
        ciphertext = base64.b64decode(body.ciphertext_b64)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid base64 in ciphertext_b64",
        )

    msg_ids = store.group_fanout(
        body.conversation_id,
        body.sender_id,
        body.recipients,
        ciphertext,
        body.ttl_seconds,
    )
    return GroupSendOut(message_ids=msg_ids, count=len(msg_ids))
