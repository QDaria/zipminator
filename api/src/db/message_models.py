"""SQLAlchemy models for messenger messages + offline queue (Unit 4).

Maps the Rust MessageStore trait to PostgreSQL via SQLAlchemy.
"""

from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, LargeBinary, Text,
    ForeignKey, Index,
)
from datetime import datetime
from src.db.database import Base


class Message(Base):
    """Encrypted message stored in a conversation."""

    __tablename__ = "messages"

    id = Column(String(128), primary_key=True)
    conversation_id = Column(String(128), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    ciphertext = Column(LargeBinary, nullable=False)
    nonce = Column(LargeBinary, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    sequence = Column(Integer, default=0, nullable=False)
    delivered = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("idx_msg_conv_seq", "conversation_id", "sequence"),
    )


class OfflineQueue(Base):
    """Messages queued for offline recipients."""

    __tablename__ = "offline_queue"

    id = Column(Integer, primary_key=True, autoincrement=True)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    message_id = Column(String(128), ForeignKey("messages.id"), nullable=False)
    queued_at = Column(DateTime, default=datetime.utcnow, nullable=False)
