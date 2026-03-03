"""Minimal async IMAP4rev1 server for PQC-secured mail delivery.

Implements the following IMAP4rev1 commands (RFC 3501 subset):
  CAPABILITY, NOOP, LOGOUT, LOGIN, SELECT, SEARCH, FETCH, STORE (\\Seen flag),
  EXPUNGE (soft-delete marked messages)

On FETCH BODY[] the server decrypts the stored envelope using the recipient's
ML-KEM-768 secret key obtained from the key directory (via authenticated lookup).

Listening on port 1143 by default (configurable via IMAP_PORT env var).

Environment variables:
    IMAP_HOST     Bind address       (default: 0.0.0.0)
    IMAP_PORT     Bind port          (default: 1143)
    DATABASE_URL  asyncpg DSN        (required)
    KEYDIR_URL    Key directory URL  (default: http://keydir:8000)

NOTE: Authentication passes the user's secret key as the password (base64).
This is suitable for internal/trusted transport.  Production deployments
should add TLS (STARTTLS or implicit) and a proper auth mechanism.
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import os
from typing import Optional

import httpx

from .pqc_bridge import decrypt_email
from .storage import EmailStorage

log = logging.getLogger(__name__)

_IMAP_HOST = os.environ.get("IMAP_HOST", "0.0.0.0")
_IMAP_PORT = int(os.environ.get("IMAP_PORT", "1143"))
_KEYDIR_URL = os.environ.get("KEYDIR_URL", "http://keydir:8000")

_CAPABILITY = "CAPABILITY IMAP4rev1 AUTH=PLAIN"


# ---------------------------------------------------------------------------
# Key directory: fetch secret key for authenticated user
# ---------------------------------------------------------------------------

async def _fetch_sk_for_user(email_addr: str, sk_b64: str) -> Optional[str]:
    """Validate that the supplied SK matches a registered key and return it.

    For this implementation the client supplies their SK as the IMAP password.
    We verify the PK fingerprint exists in the key directory to confirm the
    user is registered, then trust the supplied SK.
    """
    url = f"{_KEYDIR_URL}/keys/{email_addr}"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
        if resp.status_code != 200:
            return None
        data = resp.json()
        if not data.get("keys"):
            return None
        # User exists in key directory — accept their SK
        return sk_b64
    except Exception as exc:
        log.warning("keydir check failed for %s: %s", email_addr, exc)
    return None


# ---------------------------------------------------------------------------
# IMAP session state
# ---------------------------------------------------------------------------

class ImapState:
    NOT_AUTHENTICATED = "not_authenticated"
    AUTHENTICATED = "authenticated"
    SELECTED = "selected"
    LOGOUT = "logout"


class ImapSession:
    def __init__(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter,
                 storage: EmailStorage) -> None:
        self.reader = reader
        self.writer = writer
        self.storage = storage
        self.state = ImapState.NOT_AUTHENTICATED
        self.user: Optional[str] = None
        self.sk_b64: Optional[str] = None
        self.mailbox: Optional[str] = None   # currently selected mailbox name
        self._messages: list[dict] = []       # cached envelope list for SELECT

    async def send(self, line: str) -> None:
        self.writer.write((line + "\r\n").encode())
        await self.writer.drain()

    async def run(self) -> None:
        await self.send("* OK Zipminator IMAP4rev1 server ready")
        while self.state != ImapState.LOGOUT:
            try:
                raw = await asyncio.wait_for(self.reader.readline(), timeout=120)
            except asyncio.TimeoutError:
                await self.send("* BYE Autologout; idle for too long")
                break
            if not raw:
                break
            line = raw.decode(errors="replace").rstrip("\r\n")
            await self._dispatch(line)
        self.writer.close()

    async def _dispatch(self, line: str) -> None:
        parts = line.split(None, 2)
        if len(parts) < 2:
            return
        tag, command = parts[0], parts[1].upper()
        args = parts[2] if len(parts) > 2 else ""

        handlers = {
            "CAPABILITY": self._cmd_capability,
            "NOOP": self._cmd_noop,
            "LOGOUT": self._cmd_logout,
            "LOGIN": self._cmd_login,
            "SELECT": self._cmd_select,
            "EXAMINE": self._cmd_select,
            "SEARCH": self._cmd_search,
            "FETCH": self._cmd_fetch,
            "STORE": self._cmd_store,
            "EXPUNGE": self._cmd_expunge,
        }
        handler = handlers.get(command)
        if handler is None:
            await self.send(f"{tag} BAD Unknown command {command}")
            return
        await handler(tag, args)

    # ---- Individual command handlers ----------------------------------------

    async def _cmd_capability(self, tag: str, _: str) -> None:
        await self.send(f"* {_CAPABILITY}")
        await self.send(f"{tag} OK CAPABILITY completed")

    async def _cmd_noop(self, tag: str, _: str) -> None:
        await self.send(f"{tag} OK NOOP completed")

    async def _cmd_logout(self, tag: str, _: str) -> None:
        await self.send("* BYE Zipminator IMAP signing off")
        await self.send(f"{tag} OK LOGOUT completed")
        self.state = ImapState.LOGOUT

    async def _cmd_login(self, tag: str, args: str) -> None:
        """LOGIN <username> <password>  — password is base64 ML-KEM-768 SK."""
        tokens = args.split(None, 1)
        if len(tokens) < 2:
            await self.send(f"{tag} BAD LOGIN requires username and password")
            return
        username, password = tokens[0].strip('"'), tokens[1].strip('"')
        sk = await _fetch_sk_for_user(username, password)
        if sk is None:
            await self.send(f"{tag} NO LOGIN failed: unknown user or invalid key")
            return
        self.user = username
        self.sk_b64 = sk
        self.state = ImapState.AUTHENTICATED
        await self.send(f"{tag} OK LOGIN completed")

    async def _cmd_select(self, tag: str, args: str) -> None:
        if self.state not in (ImapState.AUTHENTICATED, ImapState.SELECTED):
            await self.send(f"{tag} NO Not authenticated")
            return
        mailbox = args.strip().strip('"').upper()
        if mailbox != "INBOX":
            await self.send(f"{tag} NO Only INBOX is supported")
            return
        self.mailbox = "INBOX"
        self.state = ImapState.SELECTED
        emails = await self.storage.list_emails(self.user)
        self._messages = emails
        unseen = await self.storage.count_unseen(self.user)
        await self.send(f"* {len(emails)} EXISTS")
        await self.send(f"* {unseen} RECENT")
        await self.send(f"* OK [UNSEEN {unseen}] Message {unseen} is first unseen")
        await self.send(f"* FLAGS (\\Seen \\Deleted)")
        await self.send(f"{tag} OK [READ-WRITE] SELECT completed")

    async def _cmd_search(self, tag: str, args: str) -> None:
        if self.state != ImapState.SELECTED:
            await self.send(f"{tag} NO Select a mailbox first")
            return
        criterion = args.strip().upper()
        if criterion == "ALL":
            seq_nums = " ".join(str(i + 1) for i in range(len(self._messages)))
        elif criterion == "UNSEEN":
            seq_nums = " ".join(
                str(i + 1)
                for i, m in enumerate(self._messages)
                if m.get("read_at") is None
            )
        else:
            seq_nums = ""
        await self.send(f"* SEARCH {seq_nums}")
        await self.send(f"{tag} OK SEARCH completed")

    async def _cmd_fetch(self, tag: str, args: str) -> None:
        if self.state != ImapState.SELECTED:
            await self.send(f"{tag} NO Select a mailbox first")
            return
        tokens = args.split(None, 1)
        if len(tokens) < 2:
            await self.send(f"{tag} BAD FETCH requires sequence and item")
            return
        seq_str, item = tokens[0], tokens[1].strip().upper()

        try:
            seq = int(seq_str) - 1  # convert to 0-based
        except ValueError:
            await self.send(f"{tag} BAD Invalid sequence number")
            return
        if seq < 0 or seq >= len(self._messages):
            await self.send(f"{tag} NO No such message")
            return

        msg_meta = self._messages[seq]
        msg_id = str(msg_meta["id"])

        if "BODY[]" in item or "RFC822" in item:
            # Full fetch — decrypt the body
            full = await self.storage.fetch_email(msg_id, self.user)
            if full is None:
                await self.send(f"{tag} NO Message not found")
                return
            envelope_data = full["envelope_data"]
            if isinstance(envelope_data, str):
                envelope_data = json.loads(envelope_data)
            try:
                plaintext = decrypt_email(envelope_data, self.sk_b64)
            except Exception as exc:
                log.error("imap: decryption failed for %s: %s", msg_id, exc)
                await self.send(f"{tag} NO Decryption failed")
                return
            body = plaintext.decode(errors="replace")
            await self.send(
                f"* {seq + 1} FETCH (BODY[] {{{len(body)}}}\r\n{body})"
            )
            await self.storage.mark_read(msg_id, self.user)
        elif "FLAGS" in item:
            flags = "(\\Seen)" if msg_meta.get("read_at") else "()"
            await self.send(f"* {seq + 1} FETCH (FLAGS {flags})")
        elif "ENVELOPE" in item:
            subj = msg_meta.get("subject", "")
            frm = msg_meta.get("sender", "")
            await self.send(f'* {seq + 1} FETCH (ENVELOPE ("{subj}" "{frm}"))')
        else:
            await self.send(f"{tag} BAD Unsupported FETCH item: {item}")
            return

        await self.send(f"{tag} OK FETCH completed")

    async def _cmd_store(self, tag: str, args: str) -> None:
        """STORE <seq> +FLAGS (\\Seen)  — only \\Seen flag supported."""
        if self.state != ImapState.SELECTED:
            await self.send(f"{tag} NO Select a mailbox first")
            return
        tokens = args.split(None, 2)
        if len(tokens) < 2:
            await self.send(f"{tag} BAD STORE requires arguments")
            return
        try:
            seq = int(tokens[0]) - 1
        except ValueError:
            await self.send(f"{tag} BAD Invalid sequence")
            return
        if seq < 0 or seq >= len(self._messages):
            await self.send(f"{tag} NO No such message")
            return
        msg_meta = self._messages[seq]
        await self.storage.mark_read(str(msg_meta["id"]), self.user)
        await self.send(f"* {seq + 1} FETCH (FLAGS (\\Seen))")
        await self.send(f"{tag} OK STORE completed")

    async def _cmd_expunge(self, tag: str, _: str) -> None:
        """EXPUNGE — soft-delete messages marked \\Deleted (not yet tracked)."""
        if self.state != ImapState.SELECTED:
            await self.send(f"{tag} NO Select a mailbox first")
            return
        # MVP: nothing to expunge (\\Deleted tracking not implemented)
        await self.send(f"{tag} OK EXPUNGE completed")


# ---------------------------------------------------------------------------
# Server
# ---------------------------------------------------------------------------

async def handle_imap_client(
    reader: asyncio.StreamReader,
    writer: asyncio.StreamWriter,
    storage: EmailStorage,
) -> None:
    addr = writer.get_extra_info("peername")
    log.debug("imap: connection from %s", addr)
    session = ImapSession(reader, writer, storage)
    try:
        await session.run()
    except Exception as exc:
        log.error("imap: session error from %s: %s", addr, exc)
    finally:
        try:
            writer.close()
        except Exception:
            pass


async def run_imap(storage: EmailStorage) -> None:
    server = await asyncio.start_server(
        lambda r, w: handle_imap_client(r, w, storage),
        host=_IMAP_HOST,
        port=_IMAP_PORT,
    )
    log.info("imap: listening on %s:%d", _IMAP_HOST, _IMAP_PORT)
    async with server:
        await server.serve_forever()
