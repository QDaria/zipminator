"""Tests: SMTP server receives and stores encrypted email.

Uses aiosmtpd in-process and mocks out PostgreSQL storage and keydir HTTP
calls so no external services are required.
"""

from __future__ import annotations

import asyncio
import base64
import json
import os
import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

EMAIL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "email"))
if EMAIL_DIR not in sys.path:
    sys.path.insert(0, EMAIL_DIR)

from transport.smtp_server import PQCSmtpHandler  # noqa: E402
from transport.storage import EmailStorage  # noqa: E402


# ---------------------------------------------------------------------------
# Helpers / fixtures
# ---------------------------------------------------------------------------

def _b64_pk() -> str:
    return base64.b64encode(os.urandom(1184)).decode()


def _make_mock_storage() -> MagicMock:
    storage = MagicMock(spec=EmailStorage)
    storage.store_email = AsyncMock(return_value="fake-uuid-1234")
    return storage


def _make_email_message(
    sender: str = "alice@example.com",
    recipient: str = "bob@zipminator.zip",
    subject: str = "Test subject",
    body: str = "Hello Bob!",
) -> MagicMock:
    """Create a mock email.message.Message object."""
    import email as email_lib
    msg = email_lib.message_from_string(
        f"From: {sender}\r\nTo: {recipient}\r\nSubject: {subject}\r\n\r\n{body}"
    )
    msg.envelope_recipients = [recipient]
    return msg


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestSMTPHandler:
    """Unit tests for PQCSmtpHandler.handle_message."""

    @pytest.mark.asyncio
    async def test_message_stored_when_key_found(self):
        """Handler should encrypt and store a message when recipient PK exists."""
        storage = _make_mock_storage()
        handler = PQCSmtpHandler(storage)
        msg = _make_email_message()

        pk = _b64_pk()
        with patch(
            "transport.smtp_server._lookup_recipient_pk",
            new=AsyncMock(return_value=pk),
        ):
            await handler.handle_message(msg)

        storage.store_email.assert_awaited_once()
        call_kwargs = storage.store_email.call_args
        assert call_kwargs is not None
        args = call_kwargs.kwargs if call_kwargs.kwargs else {}
        # Verify the right recipient was used
        if "recipient" in args:
            assert args["recipient"] == "bob@zipminator.zip"

    @pytest.mark.asyncio
    async def test_message_dropped_when_no_key(self):
        """Handler should silently drop a message when recipient has no PQC key."""
        storage = _make_mock_storage()
        handler = PQCSmtpHandler(storage)
        msg = _make_email_message()

        with patch(
            "transport.smtp_server._lookup_recipient_pk",
            new=AsyncMock(return_value=None),
        ):
            await handler.handle_message(msg)

        storage.store_email.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_storage_failure_does_not_raise(self):
        """Handler should log and swallow storage errors (no crash)."""
        storage = _make_mock_storage()
        storage.store_email = AsyncMock(side_effect=RuntimeError("DB down"))
        handler = PQCSmtpHandler(storage)
        msg = _make_email_message()

        pk = _b64_pk()
        with patch(
            "transport.smtp_server._lookup_recipient_pk",
            new=AsyncMock(return_value=pk),
        ):
            # Must not raise
            await handler.handle_message(msg)

    @pytest.mark.asyncio
    async def test_encrypted_body_stored_not_plaintext(self):
        """The body stored in DB must differ from the original plaintext."""
        storage = _make_mock_storage()
        handler = PQCSmtpHandler(storage)
        plaintext_body = "Super secret content"
        msg = _make_email_message(body=plaintext_body)

        stored_calls: list = []

        async def capture_store(**kwargs):
            stored_calls.append(kwargs)
            return "uuid-xyz"

        storage.store_email = capture_store

        pk = _b64_pk()
        with patch(
            "transport.smtp_server._lookup_recipient_pk",
            new=AsyncMock(return_value=pk),
        ):
            await handler.handle_message(msg)

        assert len(stored_calls) == 1
        call = stored_calls[0]
        # envelope_data should exist and be a non-empty dict
        assert "envelope_data" in call
        assert isinstance(call["envelope_data"], dict)
        # The stored encrypted_body should be bytes (not the raw plaintext string)
        assert isinstance(call["encrypted_body"], bytes)
        assert call["encrypted_body"] != plaintext_body.encode()

    @pytest.mark.asyncio
    async def test_multiple_recipients(self):
        """Handler processes each RCPT TO address independently."""
        storage = _make_mock_storage()
        handler = PQCSmtpHandler(storage)

        import email as email_lib
        msg = email_lib.message_from_string(
            "From: alice@example.com\r\nTo: bob@z.zip\r\nSubject: multi\r\n\r\nhi"
        )
        msg.envelope_recipients = ["bob@zipminator.zip", "carol@zipminator.zip"]

        pk = _b64_pk()
        with patch(
            "transport.smtp_server._lookup_recipient_pk",
            new=AsyncMock(return_value=pk),
        ):
            await handler.handle_message(msg)

        assert storage.store_email.await_count == 2
