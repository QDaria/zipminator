"""SQLite-backed encrypted message store with offline queue and TTL cleanup.

This module is independent of the SQLAlchemy/PostgreSQL stack. It uses raw
sqlite3 for zero-dependency persistence that works in-memory for tests and
file-backed for production.

CRITICAL: Only ciphertext (bytes) is stored. The MessageStore never sees plaintext.
"""

import sqlite3
import uuid
import time
from typing import Optional


_SCHEMA = """
CREATE TABLE IF NOT EXISTS messages (
    id              TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id       TEXT NOT NULL,
    recipient_id    TEXT NOT NULL,
    ciphertext      BLOB NOT NULL,
    timestamp       REAL NOT NULL,
    ttl_expires_at  REAL,
    delivered       INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_msg_conv
    ON messages(conversation_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_msg_recipient_delivered
    ON messages(recipient_id, delivered);
CREATE INDEX IF NOT EXISTS idx_msg_ttl
    ON messages(ttl_expires_at);
"""


class MessageStore:
    """Lightweight SQLite message store for PQC messenger persistence.

    Args:
        db_path: Path to SQLite database file, or ":memory:" for in-memory.
    """

    def __init__(self, db_path: str = ":memory:") -> None:
        self._conn = sqlite3.connect(db_path, check_same_thread=False)
        self._conn.execute("PRAGMA journal_mode=WAL")
        self._conn.execute("PRAGMA foreign_keys=ON")
        self._conn.executescript(_SCHEMA)
        self._conn.commit()

    def close(self) -> None:
        """Close the database connection."""
        self._conn.close()

    def store(
        self,
        conversation_id: str,
        sender_id: str,
        recipient_id: str,
        ciphertext: bytes,
        ttl_seconds: int = 86400,
    ) -> str:
        """Store an encrypted message.

        Args:
            conversation_id: Conversation identifier.
            sender_id: Sender user ID.
            recipient_id: Recipient user ID.
            ciphertext: Encrypted message payload (must be bytes).
            ttl_seconds: Time-to-live in seconds (default 24h).

        Returns:
            The generated message ID (UUID4 hex string).

        Raises:
            TypeError: If ciphertext is not bytes.
        """
        if not isinstance(ciphertext, bytes):
            raise TypeError(
                f"ciphertext must be bytes, got {type(ciphertext).__name__}"
            )

        msg_id = uuid.uuid4().hex
        now = time.time()
        ttl_expires_at = now + ttl_seconds

        self._conn.execute(
            """INSERT INTO messages
               (id, conversation_id, sender_id, recipient_id, ciphertext,
                timestamp, ttl_expires_at, delivered)
               VALUES (?, ?, ?, ?, ?, ?, ?, 0)""",
            (msg_id, conversation_id, sender_id, recipient_id,
             ciphertext, now, ttl_expires_at),
        )
        self._conn.commit()
        return msg_id

    def get_messages(
        self,
        conversation_id: str,
        limit: int = 50,
        offset: int = 0,
    ) -> list[dict]:
        """Retrieve messages for a conversation in chronological order.

        Args:
            conversation_id: Conversation to query.
            limit: Max messages to return.
            offset: Number of messages to skip.

        Returns:
            List of message dicts with keys: id, conversation_id, sender_id,
            recipient_id, ciphertext (bytes), timestamp, delivered.
        """
        cur = self._conn.execute(
            """SELECT id, conversation_id, sender_id, recipient_id,
                      ciphertext, timestamp, delivered
               FROM messages
               WHERE conversation_id = ?
               ORDER BY timestamp ASC
               LIMIT ? OFFSET ?""",
            (conversation_id, limit, offset),
        )
        return [self._row_to_dict(row) for row in cur.fetchall()]

    def get_undelivered(self, recipient_id: str) -> list[dict]:
        """Get all undelivered messages for a recipient (offline queue).

        Returns messages in chronological order.
        """
        cur = self._conn.execute(
            """SELECT id, conversation_id, sender_id, recipient_id,
                      ciphertext, timestamp, delivered
               FROM messages
               WHERE recipient_id = ? AND delivered = 0
               ORDER BY timestamp ASC""",
            (recipient_id,),
        )
        return [self._row_to_dict(row) for row in cur.fetchall()]

    def mark_delivered(self, message_id: str) -> None:
        """Mark a message as delivered. Idempotent."""
        self._conn.execute(
            "UPDATE messages SET delivered = 1 WHERE id = ?",
            (message_id,),
        )
        self._conn.commit()

    def cleanup_expired(self) -> int:
        """Delete messages whose TTL has expired.

        Returns:
            Number of purged rows.
        """
        now = time.time()
        cur = self._conn.execute(
            "DELETE FROM messages WHERE ttl_expires_at <= ?",
            (now,),
        )
        self._conn.commit()
        return cur.rowcount

    def group_fanout(
        self,
        conversation_id: str,
        sender_id: str,
        recipients: list[str],
        ciphertext: bytes,
        ttl_seconds: int = 86400,
    ) -> list[str]:
        """Store one copy of a message for each group member.

        Args:
            conversation_id: Group conversation ID.
            sender_id: Sender user ID.
            recipients: List of recipient user IDs.
            ciphertext: Encrypted payload (bytes).
            ttl_seconds: TTL in seconds.

        Returns:
            List of generated message IDs (one per recipient).
        """
        if not recipients:
            return []

        msg_ids = []
        for recipient_id in recipients:
            msg_id = self.store(
                conversation_id, sender_id, recipient_id, ciphertext, ttl_seconds
            )
            msg_ids.append(msg_id)
        return msg_ids

    @staticmethod
    def _row_to_dict(row: tuple) -> dict:
        return {
            "id": row[0],
            "conversation_id": row[1],
            "sender_id": row[2],
            "recipient_id": row[3],
            "ciphertext": row[4],
            "timestamp": row[5],
            "delivered": bool(row[6]),
        }
