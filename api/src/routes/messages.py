"""Messenger REST API endpoints (Unit 3).

Provides send, fetch conversation, and offline drain endpoints.
Uses SQLAlchemy MessageStore backed by PostgreSQL.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid
import base64

from src.db.database import get_db
from src.db.models import User
from src.db.message_models import Message, OfflineQueue
from src.middleware.auth import get_current_user

router = APIRouter()


# ── Request/Response models ──────────────────────────────────────────────────

class MessageSend(BaseModel):
    conversation_id: str
    recipient_id: int
    ciphertext_b64: str
    nonce_b64: str


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: int
    recipient_id: Optional[int]
    ciphertext_b64: str
    nonce_b64: str
    timestamp: datetime
    sequence: int

    class Config:
        from_attributes = True


class MessageListResponse(BaseModel):
    messages: List[MessageResponse]
    count: int


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/send", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    body: MessageSend,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send an encrypted message. The ciphertext is stored as-is (server never decrypts)."""
    # Get next sequence number for conversation
    last = (
        db.query(Message)
        .filter(Message.conversation_id == body.conversation_id)
        .order_by(Message.sequence.desc())
        .first()
    )
    next_seq = (last.sequence + 1) if last else 0

    msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=body.conversation_id,
        sender_id=current_user.id,
        recipient_id=body.recipient_id,
        ciphertext=base64.b64decode(body.ciphertext_b64),
        nonce=base64.b64decode(body.nonce_b64),
        sequence=next_seq,
    )
    db.add(msg)

    # Queue for offline delivery
    offline = OfflineQueue(
        recipient_id=body.recipient_id,
        message_id=msg.id,
    )
    db.add(offline)
    db.commit()
    db.refresh(msg)

    return MessageResponse(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender_id=msg.sender_id,
        recipient_id=msg.recipient_id,
        ciphertext_b64=base64.b64encode(msg.ciphertext).decode(),
        nonce_b64=base64.b64encode(msg.nonce).decode(),
        timestamp=msg.timestamp,
        sequence=msg.sequence,
    )


@router.get("/offline", response_model=MessageListResponse)
async def drain_offline(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Drain all queued offline messages for the current user."""
    queued = (
        db.query(OfflineQueue)
        .filter(OfflineQueue.recipient_id == current_user.id)
        .all()
    )
    message_ids = [q.message_id for q in queued]

    msgs = (
        db.query(Message)
        .filter(Message.id.in_(message_ids))
        .order_by(Message.timestamp)
        .all()
    ) if message_ids else []

    # Clear the queue
    for q in queued:
        db.delete(q)
    db.commit()

    return MessageListResponse(
        messages=[
            MessageResponse(
                id=m.id,
                conversation_id=m.conversation_id,
                sender_id=m.sender_id,
                recipient_id=m.recipient_id,
                ciphertext_b64=base64.b64encode(m.ciphertext).decode(),
                nonce_b64=base64.b64encode(m.nonce).decode(),
                timestamp=m.timestamp,
                sequence=m.sequence,
            )
            for m in msgs
        ],
        count=len(msgs),
    )


@router.get("/{conversation_id}", response_model=MessageListResponse)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch all messages in a conversation (ordered by sequence)."""
    msgs = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .filter(
            (Message.sender_id == current_user.id)
            | (Message.recipient_id == current_user.id)
        )
        .order_by(Message.sequence)
        .all()
    )
    return MessageListResponse(
        messages=[
            MessageResponse(
                id=m.id,
                conversation_id=m.conversation_id,
                sender_id=m.sender_id,
                recipient_id=m.recipient_id,
                ciphertext_b64=base64.b64encode(m.ciphertext).decode(),
                nonce_b64=base64.b64encode(m.nonce).decode(),
                timestamp=m.timestamp,
                sequence=m.sequence,
            )
            for m in msgs
        ],
        count=len(msgs),
    )
