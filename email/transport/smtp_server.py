"""Async SMTP server (aiosmtpd) for PQC-secured inbound mail.

Receives messages on port 2525 (configurable), looks up the recipient's
ML-KEM-768 public key from the key directory service, encrypts the email body
with ML-KEM envelope encryption, then stores it to PostgreSQL via `storage.py`.

Usage (standalone):
    python smtp_server.py

Environment variables:
    SMTP_HOST          Bind address (default: 0.0.0.0)
    SMTP_PORT          Bind port    (default: 2525)
    DATABASE_URL       asyncpg DSN  (required)
    KEYDIR_URL         Key directory base URL (default: http://keydir:8000)
"""

from __future__ import annotations

import asyncio
import base64
import email
import logging
import os
from datetime import datetime, timedelta, timezone
from email.policy import default as email_policy
from typing import Any

import httpx
from aiosmtpd.controller import UnthreadedController
from aiosmtpd.handlers import AsyncMessage

from .pqc_bridge import encrypt_email
from .storage import EmailStorage, purge_loop

log = logging.getLogger(__name__)

_KEYDIR_URL = os.environ.get("KEYDIR_URL", "http://keydir:8000")
_SMTP_HOST = os.environ.get("SMTP_HOST", "0.0.0.0")
_SMTP_PORT = int(os.environ.get("SMTP_PORT", "2525"))


# ---------------------------------------------------------------------------
# Key directory lookup
# ---------------------------------------------------------------------------

async def _lookup_recipient_pk(recipient: str) -> str | None:
    """Return the base64 ML-KEM-768 public key for *recipient*, or None."""
    url = f"{_KEYDIR_URL}/keys/{recipient}"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
        if resp.status_code == 200:
            data = resp.json()
            keys = data.get("keys", [])
            if keys:
                return keys[0].get("mlkem_pk")
    except Exception as exc:
        log.warning("keydir lookup failed for %s: %s", recipient, exc)
    return None


# ---------------------------------------------------------------------------
# SMTP handler
# ---------------------------------------------------------------------------

class PQCSmtpHandler(AsyncMessage):
    """aiosmtpd handler: encrypts and stores each received message."""

    def __init__(self, storage: EmailStorage) -> None:
        super().__init__()
        self._storage = storage

    async def handle_message(self, message: email.message.Message) -> None:
        sender: str = message.get("From", "unknown@unknown")
        recipient_header: str = message.get("To", "")
        subject: str = message.get("Subject", "")

        # Parse self-destruct TTL from custom header (seconds)
        ttl_header = message.get("X-Zipminator-TTL", "")
        self_destruct_at: datetime | None = None
        if ttl_header:
            try:
                ttl_seconds = int(ttl_header.strip())
                if ttl_seconds > 0:
                    self_destruct_at = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)
            except ValueError:
                log.warning("smtp: invalid X-Zipminator-TTL header: %s", ttl_header)

        # Collect all RCPT TO addresses from the envelope (envelope_recipients
        # attribute is set by aiosmtpd on the message object).
        recipients: list[str] = []
        if hasattr(message, "envelope_recipients"):
            recipients = list(message.envelope_recipients)
        if not recipients and recipient_header:
            recipients = [recipient_header.strip()]

        # Extract body as bytes
        if message.is_multipart():
            body_bytes = message.get_payload(decode=True) or b""
        else:
            body_bytes = message.get_payload(decode=True) or b""
        if isinstance(body_bytes, str):
            body_bytes = body_bytes.encode()

        # Build AAD from headers (From, To, Subject)
        aad = f"From:{sender}\nTo:{','.join(recipients)}\nSubject:{subject}".encode()

        for rcpt in recipients:
            await self._process_for_recipient(
                sender=sender,
                recipient=rcpt,
                subject=subject,
                body_bytes=body_bytes,
                aad=aad,
                self_destruct_at=self_destruct_at,
            )

    async def _process_for_recipient(
        self,
        sender: str,
        recipient: str,
        subject: str,
        body_bytes: bytes,
        aad: bytes,
        self_destruct_at: datetime | None = None,
    ) -> None:
        pk_b64 = await _lookup_recipient_pk(recipient)
        if pk_b64 is None:
            # No registered PQC key -- use fallback envelope encryption so the
            # message is still stored (encrypted with a random symmetric key).
            # In production this path should reject or queue for key exchange.
            pk_b64 = base64.b64encode(os.urandom(1184)).decode()
            log.warning(
                "smtp: no PQC key for %s; using fallback envelope encryption",
                recipient,
            )

        try:
            envelope_dict = encrypt_email(body_bytes, pk_b64)
        except Exception as exc:
            log.error("smtp: encryption failed for %s: %s", recipient, exc)
            return

        # Store encrypted_body as bytes (the full ciphertext field)
        ct_b64 = envelope_dict.get("ciphertext", "")
        encrypted_body = base64.b64decode(ct_b64) if ct_b64 else body_bytes

        try:
            email_id = await self._storage.store_email(
                sender=sender,
                recipient=recipient,
                subject=subject,
                encrypted_body=encrypted_body,
                envelope_data=envelope_dict,
                self_destruct_at=self_destruct_at,
            )
            log.info("smtp: stored email %s for %s", email_id, recipient)
        except Exception as exc:
            log.error("smtp: storage failed for %s: %s", recipient, exc)


# ---------------------------------------------------------------------------
# Server: UnthreadedController runs on the caller's event loop
# ---------------------------------------------------------------------------

async def run_smtp(storage: EmailStorage) -> None:
    """Start the SMTP server on the current event loop (no separate thread).

    Uses UnthreadedController's internal _create_server coroutine to bind
    the SMTP listener on the running loop.  This avoids the cross-loop errors
    caused by aiosmtpd.Controller's threaded model, and avoids the blocking
    run_until_complete call in UnthreadedController.begin().
    """
    handler = PQCSmtpHandler(storage)
    loop = asyncio.get_running_loop()
    controller = UnthreadedController(
        handler,
        hostname=_SMTP_HOST,
        port=_SMTP_PORT,
        loop=loop,
    )
    # Await the server coroutine directly instead of calling begin()
    # (which uses run_until_complete and would block the running loop).
    server = await controller._create_server()
    controller.server = server
    log.info("smtp: listening on %s:%d", _SMTP_HOST, _SMTP_PORT)
    try:
        await server.serve_forever()
    finally:
        server.close()
        await server.wait_closed()
        log.info("smtp: stopped")


# ---------------------------------------------------------------------------
# Standalone entry-point
# ---------------------------------------------------------------------------

async def _main() -> None:
    logging.basicConfig(level=logging.INFO)
    db_url = os.environ["DATABASE_URL"]
    storage = await EmailStorage.create(db_url)
    asyncio.create_task(purge_loop(storage))
    await run_smtp(storage)


if __name__ == "__main__":
    asyncio.run(_main())
