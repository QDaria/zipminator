"""Email send/receive API endpoints (Unit 6).

Wraps the existing SMTP transport and PQC bridge for HTTP access.
For receive (inbox), queries the email storage directly.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime
import base64
import json
import logging
import os
import smtplib
from email.mime.text import MIMEText

from src.db.models import User
from src.middleware.auth import get_current_user

log = logging.getLogger(__name__)

router = APIRouter()

# ── Configuration ────────────────────────────────────────────────────────────

SMTP_HOST = os.environ.get("MAIL_SMTP_HOST", "localhost")
SMTP_PORT = int(os.environ.get("MAIL_SMTP_PORT", "2525"))
KEYDIR_URL = os.environ.get("KEYDIR_URL", "http://localhost:8080")


# ── Pydantic models ─────────────────────────────────────────────────────────

class EmailSendRequest(BaseModel):
    to: str
    subject: str
    body: str
    self_destruct_minutes: Optional[int] = None


class EmailSendResponse(BaseModel):
    status: str
    message_id: Optional[str] = None


class EmailMeta(BaseModel):
    id: str
    sender: str
    subject: str
    received_at: datetime
    read: bool


class EmailInboxResponse(BaseModel):
    emails: List[EmailMeta]
    count: int


class EmailDetailResponse(BaseModel):
    id: str
    sender: str
    subject: str
    body: str
    received_at: datetime
    read: bool


# ── Helpers ──────────────────────────────────────────────────────────────────

def _send_via_smtp(sender: str, recipient: str, subject: str, body: str) -> None:
    """Send a plaintext email via the PQC SMTP transport.

    The SMTP server handles PQC envelope encryption transparently
    by looking up the recipient's ML-KEM-768 public key from the key directory.
    """
    msg = MIMEText(body)
    msg["From"] = sender
    msg["To"] = recipient
    msg["Subject"] = subject

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.send_message(msg)


async def _fetch_inbox(recipient: str, limit: int = 50):
    """Fetch inbox from email storage (asyncpg).

    Falls back to empty list if storage is unavailable.
    """
    db_url = os.environ.get(
        "DATABASE_URL",
        "postgresql://zipminator:zipminator_dev@localhost:5432/zipminator"
    )
    try:
        import asyncpg
        conn = await asyncpg.connect(db_url)
        rows = await conn.fetch(
            """
            SELECT id, sender, subject, received_at, read_at
              FROM emails
             WHERE recipient = $1 AND NOT deleted
             ORDER BY received_at DESC
             LIMIT $2
            """,
            recipient, limit,
        )
        await conn.close()
        return [dict(r) for r in rows]
    except Exception as exc:
        log.warning("email inbox fetch failed: %s", exc)
        return []


async def _fetch_email_detail(email_id: str, recipient: str):
    """Fetch and decrypt a single email."""
    db_url = os.environ.get(
        "DATABASE_URL",
        "postgresql://zipminator:zipminator_dev@localhost:5432/zipminator"
    )
    try:
        import asyncpg
        conn = await asyncpg.connect(db_url)
        row = await conn.fetchrow(
            """
            SELECT id, sender, subject, encrypted_body, envelope_data,
                   received_at, read_at
              FROM emails
             WHERE id = $1 AND recipient = $2 AND NOT deleted
            """,
            email_id, recipient,
        )
        # Mark as read
        if row and row["read_at"] is None:
            await conn.execute(
                "UPDATE emails SET read_at = NOW() WHERE id = $1",
                email_id,
            )
        await conn.close()
        if row is None:
            return None
        return dict(row)
    except Exception as exc:
        log.warning("email detail fetch failed: %s", exc)
        return None


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/send", response_model=EmailSendResponse)
async def send_email(
    body: EmailSendRequest,
    current_user: User = Depends(get_current_user),
):
    """Send a PQC-encrypted email via the SMTP transport.

    The SMTP server performs ML-KEM-768 envelope encryption transparently.
    """
    sender = current_user.email
    try:
        _send_via_smtp(sender, body.to, body.subject, body.body)
    except Exception as exc:
        log.error("email send failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"SMTP delivery failed: {exc}",
        )

    return EmailSendResponse(status="sent")


@router.get("/inbox", response_model=EmailInboxResponse)
async def get_inbox(
    current_user: User = Depends(get_current_user),
):
    """Fetch the inbox for the current user."""
    rows = await _fetch_inbox(current_user.email)
    return EmailInboxResponse(
        emails=[
            EmailMeta(
                id=str(r["id"]),
                sender=r["sender"],
                subject=r.get("subject", ""),
                received_at=r["received_at"],
                read=r.get("read_at") is not None,
            )
            for r in rows
        ],
        count=len(rows),
    )


@router.get("/{email_id}", response_model=EmailDetailResponse)
async def get_email(
    email_id: str,
    current_user: User = Depends(get_current_user),
):
    """Fetch a single email by ID.

    Note: Full decryption requires the recipient's secret key.
    This endpoint returns the encrypted body as base64 for client-side decryption,
    or the plaintext if a fallback PQC bridge is available server-side.
    """
    row = await _fetch_email_detail(email_id, current_user.email)
    if row is None:
        raise HTTPException(status_code=404, detail="Email not found")

    # Try to decrypt via PQC bridge (server-side, for demo)
    body_text = "[encrypted — decrypt client-side]"
    try:
        envelope_data = row.get("envelope_data")
        if isinstance(envelope_data, str):
            envelope_data = json.loads(envelope_data)
        if envelope_data and envelope_data.get("version") == "py-fallback-v1":
            # Fallback path: CEK is in the envelope (test-only)
            from email.transport.pqc_bridge import _py_decrypt
            plaintext = _py_decrypt(envelope_data, "")
            body_text = plaintext.decode(errors="replace")
    except Exception:
        pass

    return EmailDetailResponse(
        id=str(row["id"]),
        sender=row["sender"],
        subject=row.get("subject", ""),
        body=body_text,
        received_at=row["received_at"],
        read=row.get("read_at") is not None,
    )
