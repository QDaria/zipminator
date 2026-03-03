"""Tests: IMAP server retrieves and decrypts stored email.

Spins up an in-process IMAP server on a random port, connects with a raw
asyncio TCP client, and exercises the protocol commands.  PostgreSQL storage
and keydir lookups are mocked.
"""

from __future__ import annotations

import asyncio
import base64
import json
import os
import sys
from datetime import datetime, timezone
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

EMAIL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "email"))
if EMAIL_DIR not in sys.path:
    sys.path.insert(0, EMAIL_DIR)

from transport.imap_server import handle_imap_client  # noqa: E402
from transport.pqc_bridge import encrypt_email  # noqa: E402
from transport.storage import EmailStorage  # noqa: E402


# ---------------------------------------------------------------------------
# In-process IMAP server fixture
# ---------------------------------------------------------------------------

def _random_port() -> int:
    import socket
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def _b64_keypair() -> tuple[str, str]:
    pk = base64.b64encode(os.urandom(1184)).decode()
    sk = base64.b64encode(os.urandom(2400)).decode()
    return pk, sk


def _make_storage_mock(emails: list[dict], full_email: dict | None = None) -> MagicMock:
    storage = MagicMock(spec=EmailStorage)
    storage.list_emails = AsyncMock(return_value=emails)
    storage.fetch_email = AsyncMock(return_value=full_email)
    storage.count_unseen = AsyncMock(return_value=len(emails))
    storage.mark_read = AsyncMock(return_value=True)
    storage.soft_delete = AsyncMock(return_value=True)
    return storage


async def _start_imap_server(
    storage: EmailStorage, host: str = "127.0.0.1"
) -> tuple[asyncio.AbstractServer, int]:
    port = _random_port()
    server = await asyncio.start_server(
        lambda r, w: handle_imap_client(r, w, storage),
        host=host,
        port=port,
    )
    return server, port


class ImapClient:
    """Minimal async IMAP raw-TCP client for testing."""

    def __init__(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        self.reader = reader
        self.writer = writer
        self._tag = 0

    @classmethod
    async def connect(cls, port: int) -> "ImapClient":
        reader, writer = await asyncio.open_connection("127.0.0.1", port)
        client = cls(reader, writer)
        # consume greeting
        await client._readline()
        return client

    async def _readline(self) -> str:
        line = await asyncio.wait_for(self.reader.readline(), timeout=5)
        return line.decode(errors="replace").rstrip("\r\n")

    async def send(self, command: str) -> list[str]:
        self._tag += 1
        tag = f"T{self._tag:04d}"
        self.writer.write(f"{tag} {command}\r\n".encode())
        await self.writer.drain()
        lines: list[str] = []
        while True:
            line = await self._readline()
            lines.append(line)
            if line.startswith(tag):
                break
        return lines

    async def close(self):
        self.writer.close()
        try:
            await self.writer.wait_closed()
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestIMAPServer:
    @pytest.mark.asyncio
    async def test_capability_response(self):
        storage = _make_storage_mock([])
        server, port = await _start_imap_server(storage)
        async with server:
            client = await ImapClient.connect(port)
            lines = await client.send("CAPABILITY")
            await client.close()

        caps_line = next((l for l in lines if "CAPABILITY" in l and l.startswith("*")), "")
        assert "IMAP4rev1" in caps_line

    @pytest.mark.asyncio
    async def test_noop(self):
        storage = _make_storage_mock([])
        server, port = await _start_imap_server(storage)
        async with server:
            client = await ImapClient.connect(port)
            lines = await client.send("NOOP")
            await client.close()

        assert any("OK" in l for l in lines)

    @pytest.mark.asyncio
    async def test_login_unknown_user_rejected(self):
        storage = _make_storage_mock([])
        server, port = await _start_imap_server(storage)
        async with server:
            with patch(
                "transport.imap_server._fetch_sk_for_user",
                new=AsyncMock(return_value=None),
            ):
                client = await ImapClient.connect(port)
                lines = await client.send('LOGIN nobody@example.com fakepassword')
                await client.close()

        assert any("NO" in l for l in lines)

    @pytest.mark.asyncio
    async def test_login_known_user_accepted(self):
        storage = _make_storage_mock([])
        server, port = await _start_imap_server(storage)
        _, sk = _b64_keypair()
        async with server:
            with patch(
                "transport.imap_server._fetch_sk_for_user",
                new=AsyncMock(return_value=sk),
            ):
                client = await ImapClient.connect(port)
                lines = await client.send(f'LOGIN alice@zipminator.zip {sk}')
                await client.close()

        assert any("OK" in l and "LOGIN" in l for l in lines)

    @pytest.mark.asyncio
    async def test_select_inbox(self):
        emails = [
            {
                "id": "uuid-1",
                "sender": "bob@example.com",
                "recipient": "alice@zipminator.zip",
                "subject": "Hello",
                "received_at": datetime.now(timezone.utc),
                "read_at": None,
                "self_destruct_at": None,
            }
        ]
        storage = _make_storage_mock(emails)
        server, port = await _start_imap_server(storage)
        _, sk = _b64_keypair()
        async with server:
            with patch(
                "transport.imap_server._fetch_sk_for_user",
                new=AsyncMock(return_value=sk),
            ):
                client = await ImapClient.connect(port)
                await client.send(f'LOGIN alice@zipminator.zip {sk}')
                lines = await client.send('SELECT INBOX')
                await client.close()

        exists_lines = [l for l in lines if "EXISTS" in l]
        assert exists_lines, "SELECT must return EXISTS untagged response"
        assert "1 EXISTS" in exists_lines[0]

    @pytest.mark.asyncio
    async def test_fetch_decrypts_body(self):
        pk, sk = _b64_keypair()
        plaintext = b"Secret message body"
        envelope = encrypt_email(plaintext, pk)

        import base64 as b64m
        ct_b64 = envelope.get("ciphertext", "")
        encrypted_body = b64m.b64decode(ct_b64) if ct_b64 else plaintext

        emails = [
            {
                "id": "uuid-abc",
                "sender": "bob@example.com",
                "recipient": "alice@zipminator.zip",
                "subject": "Encrypted",
                "received_at": datetime.now(timezone.utc),
                "read_at": None,
                "self_destruct_at": None,
            }
        ]
        full_email = {
            "id": "uuid-abc",
            "sender": "bob@example.com",
            "recipient": "alice@zipminator.zip",
            "subject": "Encrypted",
            "encrypted_body": encrypted_body,
            "envelope_data": envelope,
            "received_at": datetime.now(timezone.utc),
            "read_at": None,
            "self_destruct_at": None,
        }
        storage = _make_storage_mock(emails, full_email=full_email)
        server, port = await _start_imap_server(storage)
        async with server:
            with patch(
                "transport.imap_server._fetch_sk_for_user",
                new=AsyncMock(return_value=sk),
            ):
                client = await ImapClient.connect(port)
                await client.send(f'LOGIN alice@zipminator.zip {sk}')
                await client.send('SELECT INBOX')
                lines = await client.send('FETCH 1 BODY[]')
                await client.close()

        full_response = "\n".join(lines)
        assert plaintext.decode() in full_response, (
            "FETCH BODY[] must include decrypted plaintext"
        )

    @pytest.mark.asyncio
    async def test_search_all(self):
        emails = [
            {"id": f"uuid-{i}", "sender": "x@y.com", "recipient": "alice@z.zip",
             "subject": f"Msg {i}", "received_at": datetime.now(timezone.utc),
             "read_at": None, "self_destruct_at": None}
            for i in range(3)
        ]
        storage = _make_storage_mock(emails)
        server, port = await _start_imap_server(storage)
        _, sk = _b64_keypair()
        async with server:
            with patch(
                "transport.imap_server._fetch_sk_for_user",
                new=AsyncMock(return_value=sk),
            ):
                client = await ImapClient.connect(port)
                await client.send(f'LOGIN alice@z.zip {sk}')
                await client.send('SELECT INBOX')
                lines = await client.send('SEARCH ALL')
                await client.close()

        search_resp = next((l for l in lines if l.startswith("* SEARCH")), "")
        assert "1" in search_resp and "2" in search_resp and "3" in search_resp

    @pytest.mark.asyncio
    async def test_logout(self):
        storage = _make_storage_mock([])
        server, port = await _start_imap_server(storage)
        async with server:
            client = await ImapClient.connect(port)
            lines = await client.send('LOGOUT')
            await client.close()

        assert any("BYE" in l for l in lines)
        assert any("OK" in l and "LOGOUT" in l for l in lines)
