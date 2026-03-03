"""PostgreSQL email storage layer.

Table: emails
  id              UUID primary key
  sender          TEXT NOT NULL
  recipient       TEXT NOT NULL
  subject         TEXT
  encrypted_body  BYTEA NOT NULL
  envelope_data   JSONB NOT NULL   -- serialised EnvelopeDict
  received_at     TIMESTAMPTZ DEFAULT NOW()
  read_at         TIMESTAMPTZ
  self_destruct_at TIMESTAMPTZ
  deleted         BOOLEAN DEFAULT FALSE

A background task calls `delete_expired()` periodically to purge messages
whose `self_destruct_at` has passed.
"""

from __future__ import annotations

import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

import asyncpg

log = logging.getLogger(__name__)

# DDL executed once on startup
_CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS emails (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender           TEXT NOT NULL,
    recipient        TEXT NOT NULL,
    subject          TEXT DEFAULT '',
    encrypted_body   BYTEA NOT NULL,
    envelope_data    JSONB NOT NULL,
    received_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at          TIMESTAMPTZ,
    self_destruct_at TIMESTAMPTZ,
    deleted          BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_emails_recipient ON emails(recipient) WHERE NOT deleted;
CREATE INDEX IF NOT EXISTS idx_emails_self_destruct ON emails(self_destruct_at)
    WHERE self_destruct_at IS NOT NULL AND NOT deleted;
"""


class EmailStorage:
    """Async PostgreSQL email store."""

    def __init__(self, pool: asyncpg.Pool) -> None:
        self._pool = pool

    # ------------------------------------------------------------------
    # Lifecycle helpers (call from app startup)
    # ------------------------------------------------------------------

    @classmethod
    async def create(cls, database_url: str) -> "EmailStorage":
        """Create a connection pool and run migrations."""
        pool = await asyncpg.create_pool(database_url, min_size=2, max_size=10)
        storage = cls(pool)
        await storage._migrate()
        return storage

    async def close(self) -> None:
        await self._pool.close()

    async def _migrate(self) -> None:
        async with self._pool.acquire() as conn:
            await conn.execute(_CREATE_TABLE_SQL)
        log.info("storage: migrations complete")

    # ------------------------------------------------------------------
    # Write operations
    # ------------------------------------------------------------------

    async def store_email(
        self,
        sender: str,
        recipient: str,
        subject: str,
        encrypted_body: bytes,
        envelope_data: dict[str, Any],
        self_destruct_at: Optional[datetime] = None,
    ) -> str:
        """Insert an encrypted email; returns the new UUID as a string."""
        email_id = str(uuid.uuid4())
        async with self._pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO emails
                    (id, sender, recipient, subject,
                     encrypted_body, envelope_data, self_destruct_at)
                VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
                """,
                email_id,
                sender,
                recipient,
                subject,
                encrypted_body,
                json.dumps(envelope_data),
                self_destruct_at,
            )
        log.debug("storage: stored email %s for %s", email_id, recipient)
        return email_id

    async def mark_read(self, email_id: str, recipient: str) -> bool:
        """Mark an email as read; returns True if the row was found and updated."""
        async with self._pool.acquire() as conn:
            result = await conn.execute(
                """
                UPDATE emails
                   SET read_at = NOW()
                 WHERE id = $1
                   AND recipient = $2
                   AND NOT deleted
                   AND read_at IS NULL
                """,
                email_id,
                recipient,
            )
        return result != "UPDATE 0"

    async def soft_delete(self, email_id: str, recipient: str) -> bool:
        """Soft-delete a single email; returns True if updated."""
        async with self._pool.acquire() as conn:
            result = await conn.execute(
                "UPDATE emails SET deleted=TRUE WHERE id=$1 AND recipient=$2",
                email_id,
                recipient,
            )
        return result != "UPDATE 0"

    # ------------------------------------------------------------------
    # Read operations
    # ------------------------------------------------------------------

    async def list_emails(
        self,
        recipient: str,
        include_read: bool = True,
        limit: int = 50,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Return email metadata (no body) for a recipient's INBOX."""
        extra = "" if include_read else "AND read_at IS NULL"
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                f"""
                SELECT id, sender, recipient, subject,
                       received_at, read_at, self_destruct_at
                  FROM emails
                 WHERE recipient = $1
                   AND NOT deleted
                   {extra}
                 ORDER BY received_at DESC
                 LIMIT $2 OFFSET $3
                """,
                recipient,
                limit,
                offset,
            )
        return [dict(r) for r in rows]

    async def fetch_email(
        self, email_id: str, recipient: str
    ) -> Optional[dict[str, Any]]:
        """Fetch a single email including encrypted body and envelope data."""
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, sender, recipient, subject,
                       encrypted_body, envelope_data,
                       received_at, read_at, self_destruct_at
                  FROM emails
                 WHERE id = $1
                   AND recipient = $2
                   AND NOT deleted
                """,
                email_id,
                recipient,
            )
        if row is None:
            return None
        data = dict(row)
        # asyncpg returns JSONB as a string; parse it
        if isinstance(data["envelope_data"], str):
            data["envelope_data"] = json.loads(data["envelope_data"])
        return data

    async def count_unseen(self, recipient: str) -> int:
        """Return number of unread, non-deleted emails for a recipient."""
        async with self._pool.acquire() as conn:
            return await conn.fetchval(
                "SELECT COUNT(*) FROM emails WHERE recipient=$1 AND NOT deleted AND read_at IS NULL",
                recipient,
            )

    # ------------------------------------------------------------------
    # Self-destruct purge
    # ------------------------------------------------------------------

    async def delete_expired(self) -> int:
        """Hard-delete emails past their self_destruct_at timestamp.

        Returns the number of rows deleted.
        """
        async with self._pool.acquire() as conn:
            result = await conn.execute(
                """
                DELETE FROM emails
                 WHERE self_destruct_at IS NOT NULL
                   AND self_destruct_at < NOW()
                   AND NOT deleted
                """
            )
        count = int(result.split()[-1])
        if count:
            log.info("storage: purged %d expired email(s)", count)
        return count


async def purge_loop(storage: EmailStorage, interval_seconds: int = 60) -> None:
    """Background coroutine: calls delete_expired() every *interval_seconds*."""
    while True:
        try:
            await storage.delete_expired()
        except Exception as exc:
            log.error("purge_loop error: %s", exc)
        await asyncio.sleep(interval_seconds)
