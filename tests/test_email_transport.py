"""Standalone email transport layer tests.

Tests the PQC bridge (encrypt/decrypt), storage layer (store/fetch/TTL purge),
and SMTP handler logic without requiring the full FastAPI app.

Requirements:
  - PostgreSQL running on localhost:5433 (docker-compose.integration.yml)
    OR set TEST_DATABASE_URL to a valid asyncpg DSN.
  - Tests skip gracefully when Postgres is unavailable.

Run:
  micromamba activate zip-pqc && python -m pytest tests/test_email_transport.py -v
"""

from __future__ import annotations

import asyncio
import base64
import importlib.util
import os
import smtplib
import sys
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText

import pytest

# ---------------------------------------------------------------------------
# Import transport modules from filesystem path (avoids collision with
# stdlib 'email' package since the project dir is named 'email/').
# ---------------------------------------------------------------------------
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _import_transport_module(name: str):
    """Import a module from email/transport/ by filesystem path."""
    mod_path = os.path.join(PROJECT_ROOT, "email", "transport", f"{name}.py")
    spec = importlib.util.spec_from_file_location(f"transport_{name}", mod_path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)
    return mod


_pqc_bridge = _import_transport_module("pqc_bridge")
encrypt_email = _pqc_bridge.encrypt_email
decrypt_email = _pqc_bridge.decrypt_email


def _get_email_storage_class():
    """Lazy import of EmailStorage (requires asyncpg)."""
    mod = _import_transport_module("storage")
    return mod.EmailStorage


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_TEST_DB_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql://test:test@localhost:5433/zipminator_test",
)

_SMTP_HOST = os.environ.get("TEST_SMTP_HOST", "localhost")
_SMTP_PORT = int(os.environ.get("TEST_SMTP_PORT", "2525"))


def _postgres_available() -> bool:
    """Check if Postgres is reachable (non-blocking quick probe)."""
    import socket

    host, port = "localhost", 5433
    if "TEST_DATABASE_URL" in os.environ:
        url = os.environ["TEST_DATABASE_URL"]
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            host = parsed.hostname or host
            port = parsed.port or port
        except Exception:
            pass
    try:
        sock = socket.create_connection((host, port), timeout=2)
        sock.close()
        return True
    except (OSError, ConnectionRefusedError):
        return False


def _smtp_available() -> bool:
    """Check if SMTP server is reachable."""
    import socket

    try:
        sock = socket.create_connection((_SMTP_HOST, _SMTP_PORT), timeout=2)
        sock.close()
        return True
    except (OSError, ConnectionRefusedError):
        return False


# ---------------------------------------------------------------------------
# PQC Bridge Tests (no external dependencies)
# ---------------------------------------------------------------------------


class TestPQCBridge:
    """Test encrypt/decrypt round-trip using the pure-Python fallback."""

    def test_encrypt_returns_envelope_dict(self):
        plaintext = b"Hello from Zipminator Quantum Mail!"
        pk_b64 = base64.b64encode(os.urandom(1184)).decode()
        envelope = encrypt_email(plaintext, pk_b64)

        assert isinstance(envelope, dict)
        assert "ciphertext" in envelope
        assert "nonce" in envelope
        assert envelope["ciphertext"] != ""

    def test_encrypt_decrypt_roundtrip(self):
        plaintext = b"PQC envelope encryption test payload"
        pk_b64 = base64.b64encode(os.urandom(1184)).decode()
        sk_b64 = base64.b64encode(os.urandom(2400)).decode()

        envelope = encrypt_email(plaintext, pk_b64)
        recovered = decrypt_email(envelope, sk_b64)

        assert recovered == plaintext

    def test_encrypt_empty_body(self):
        plaintext = b""
        pk_b64 = base64.b64encode(os.urandom(32)).decode()
        envelope = encrypt_email(plaintext, pk_b64)
        sk_b64 = base64.b64encode(os.urandom(32)).decode()
        recovered = decrypt_email(envelope, sk_b64)
        assert recovered == plaintext

    def test_encrypt_large_body(self):
        plaintext = os.urandom(1024 * 100)  # 100 KB
        pk_b64 = base64.b64encode(os.urandom(1184)).decode()
        sk_b64 = base64.b64encode(os.urandom(2400)).decode()

        envelope = encrypt_email(plaintext, pk_b64)
        recovered = decrypt_email(envelope, sk_b64)
        assert recovered == plaintext

    def test_envelope_fields_are_base64(self):
        plaintext = b"test"
        pk_b64 = base64.b64encode(os.urandom(32)).decode()
        envelope = encrypt_email(plaintext, pk_b64)

        for field in ("ciphertext", "nonce"):
            val = envelope.get(field, "")
            if val:
                base64.b64decode(val)  # should not raise

    def test_version_field_present(self):
        plaintext = b"version check"
        pk_b64 = base64.b64encode(os.urandom(32)).decode()
        envelope = encrypt_email(plaintext, pk_b64)
        assert "version" in envelope


# ---------------------------------------------------------------------------
# Storage Tests (requires PostgreSQL)
# ---------------------------------------------------------------------------

requires_postgres = pytest.mark.skipif(
    not _postgres_available(),
    reason="PostgreSQL not available on localhost:5433 (start docker-compose.integration.yml)",
)


@requires_postgres
class TestEmailStorage:
    """Test the async PostgreSQL storage layer.

    Uses subprocess to run each async test in isolation, avoiding the
    event loop conflict between asyncpg and pytest-asyncio strict mode.
    """

    def _run_async(self, code: str) -> str:
        """Run async code in a subprocess to avoid event loop conflicts."""
        import subprocess
        full_code = f"""
import asyncio, sys, os, base64, importlib.util, json
sys.path.insert(0, '{PROJECT_ROOT}')
spec = importlib.util.spec_from_file_location('storage', '{PROJECT_ROOT}/email/transport/storage.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
EmailStorage = mod.EmailStorage
spec2 = importlib.util.spec_from_file_location('pqc_bridge', '{PROJECT_ROOT}/email/transport/pqc_bridge.py')
mod2 = importlib.util.module_from_spec(spec2)
spec2.loader.exec_module(mod2)
encrypt_email = mod2.encrypt_email

async def _main():
    s = await EmailStorage.create('{_TEST_DB_URL}')
    async with s._pool.acquire() as conn:
        await conn.execute('DELETE FROM emails')
    {code}
    await s.close()
    print('OK')

asyncio.run(_main())
"""
        result = subprocess.run(
            [sys.executable, "-c", full_code],
            capture_output=True, text=True, timeout=15,
        )
        assert result.returncode == 0, f"Storage test failed:\n{result.stderr}"
        return result.stdout

    def test_store_and_fetch_email(self):
        self._run_async("""
    pk_b64 = base64.b64encode(os.urandom(1184)).decode()
    envelope = encrypt_email(b'Test body', pk_b64)
    ct_bytes = base64.b64decode(envelope['ciphertext'])
    email_id = await s.store_email(
        sender='alice@zipminator.zip', recipient='bob@zipminator.zip',
        subject='PQC Test', encrypted_body=ct_bytes, envelope_data=envelope,
    )
    assert email_id
    fetched = await s.fetch_email(email_id, 'bob@zipminator.zip')
    assert fetched is not None
    assert fetched['sender'] == 'alice@zipminator.zip'
    assert fetched['subject'] == 'PQC Test'
    assert fetched['encrypted_body'] == ct_bytes
""")

    def test_list_emails_for_recipient(self):
        self._run_async("""
    pk_b64 = base64.b64encode(os.urandom(32)).decode()
    envelope = encrypt_email(b'msg1', pk_b64)
    for i in range(3):
        await s.store_email(sender='alice@zipminator.zip', recipient='bob@zipminator.zip',
            subject=f'Email #{i}', encrypted_body=b'encrypted', envelope_data=envelope)
    emails = await s.list_emails('bob@zipminator.zip')
    assert len(emails) == 3
    emails_carol = await s.list_emails('carol@zipminator.zip')
    assert len(emails_carol) == 0
""")

    def test_mark_read(self):
        self._run_async("""
    pk_b64 = base64.b64encode(os.urandom(32)).decode()
    envelope = encrypt_email(b'read test', pk_b64)
    email_id = await s.store_email(sender='alice@zipminator.zip', recipient='bob@zipminator.zip',
        subject='Read Test', encrypted_body=b'encrypted', envelope_data=envelope)
    unseen = await s.count_unseen('bob@zipminator.zip')
    assert unseen == 1
    result = await s.mark_read(email_id, 'bob@zipminator.zip')
    assert result is True
    unseen_after = await s.count_unseen('bob@zipminator.zip')
    assert unseen_after == 0
""")

    def test_soft_delete(self):
        self._run_async("""
    pk_b64 = base64.b64encode(os.urandom(32)).decode()
    envelope = encrypt_email(b'delete test', pk_b64)
    email_id = await s.store_email(sender='alice@zipminator.zip', recipient='bob@zipminator.zip',
        subject='Delete Test', encrypted_body=b'encrypted', envelope_data=envelope)
    result = await s.soft_delete(email_id, 'bob@zipminator.zip')
    assert result is True
    fetched = await s.fetch_email(email_id, 'bob@zipminator.zip')
    assert fetched is None
""")

    def test_self_destruct_ttl_purge(self):
        """Store an email with TTL=1s, wait 2s, run purge, verify deleted."""
        self._run_async("""
    from datetime import datetime, timedelta, timezone
    pk_b64 = base64.b64encode(os.urandom(32)).decode()
    envelope = encrypt_email(b'self-destruct payload', pk_b64)
    destruct_at = datetime.now(timezone.utc) + timedelta(seconds=1)
    email_id = await s.store_email(sender='alice@zipminator.zip', recipient='bob@zipminator.zip',
        subject='Self-Destruct Test', encrypted_body=b'encrypted', envelope_data=envelope,
        self_destruct_at=destruct_at)
    fetched = await s.fetch_email(email_id, 'bob@zipminator.zip')
    assert fetched is not None, 'Email should exist immediately'
    await s.delete_expired()
    fetched_still = await s.fetch_email(email_id, 'bob@zipminator.zip')
    assert fetched_still is not None, 'Email should survive early purge'
    await asyncio.sleep(2)
    purged = await s.delete_expired()
    assert purged >= 1, f'Expected at least 1 purged, got {purged}'
    fetched_after = await s.fetch_email(email_id, 'bob@zipminator.zip')
    assert fetched_after is None, 'Email should be deleted after TTL expiry'
""")

    def test_self_destruct_does_not_affect_permanent_emails(self):
        """Emails without self_destruct_at should never be purged."""
        self._run_async("""
    from datetime import datetime, timedelta, timezone
    pk_b64 = base64.b64encode(os.urandom(32)).decode()
    envelope = encrypt_email(b'permanent message', pk_b64)
    email_id = await s.store_email(sender='alice@zipminator.zip', recipient='bob@zipminator.zip',
        subject='Permanent Email', encrypted_body=b'encrypted', envelope_data=envelope)
    expired_id = await s.store_email(sender='alice@zipminator.zip', recipient='bob@zipminator.zip',
        subject='Expired Email', encrypted_body=b'encrypted', envelope_data=envelope,
        self_destruct_at=datetime.now(timezone.utc) - timedelta(seconds=10))
    purged = await s.delete_expired()
    assert purged == 1
    fetched = await s.fetch_email(email_id, 'bob@zipminator.zip')
    assert fetched is not None
    fetched_expired = await s.fetch_email(expired_id, 'bob@zipminator.zip')
    assert fetched_expired is None
""")


# ---------------------------------------------------------------------------
# SMTP Integration Tests (requires SMTP server running)
# ---------------------------------------------------------------------------

requires_smtp = pytest.mark.skipif(
    not _smtp_available(),
    reason=f"SMTP server not available on {_SMTP_HOST}:{_SMTP_PORT}",
)


@requires_smtp
class TestSMTPTransport:
    """Test sending email via the SMTP transport layer."""

    def test_send_plain_email(self):
        """Send a plain text email via SMTP and verify no errors."""
        msg = MIMEText("Hello from Zipminator PQC transport test!")
        msg["From"] = "alice@zipminator.zip"
        msg["To"] = "bob@zipminator.zip"
        msg["Subject"] = "SMTP Transport Test"

        with smtplib.SMTP(_SMTP_HOST, _SMTP_PORT, timeout=10) as server:
            server.sendmail(
                "alice@zipminator.zip",
                ["bob@zipminator.zip"],
                msg.as_string(),
            )

    def test_send_email_with_ttl_header(self):
        """Send an email with X-Zipminator-TTL header."""
        msg = MIMEText("This message will self-destruct!")
        msg["From"] = "alice@zipminator.zip"
        msg["To"] = "bob@zipminator.zip"
        msg["Subject"] = "Self-Destruct TTL Test"
        msg["X-Zipminator-TTL"] = "60"

        with smtplib.SMTP(_SMTP_HOST, _SMTP_PORT, timeout=10) as server:
            server.sendmail(
                "alice@zipminator.zip",
                ["bob@zipminator.zip"],
                msg.as_string(),
            )


# ---------------------------------------------------------------------------
# Combined SMTP + Storage integration (requires both)
# ---------------------------------------------------------------------------

requires_full_stack = pytest.mark.skipif(
    not (_postgres_available() and _smtp_available()),
    reason="Full stack test requires both PostgreSQL and SMTP server",
)


@requires_full_stack
class TestSMTPToStorage:
    """End-to-end: send via SMTP, verify stored in Postgres."""

    def _run(self, coro):
        loop = asyncio.new_event_loop()
        try:
            return loop.run_until_complete(coro)
        finally:
            loop.close()

    def test_smtp_send_stores_in_postgres(self):
        """Send via SMTP, then verify the message appears in storage."""
        EmailStorage = _get_email_storage_class()

        async def _test():
            storage = await EmailStorage.create(_TEST_DB_URL)
            try:
                before = await storage.list_emails("bob@zipminator.zip")
                count_before = len(before)

                msg = MIMEText("E2E storage verification")
                msg["From"] = "alice@zipminator.zip"
                msg["To"] = "bob@zipminator.zip"
                msg["Subject"] = "E2E Storage Test"

                with smtplib.SMTP(_SMTP_HOST, _SMTP_PORT, timeout=10) as server:
                    server.sendmail(
                        "alice@zipminator.zip",
                        ["bob@zipminator.zip"],
                        msg.as_string(),
                    )

                await asyncio.sleep(2)

                after = await storage.list_emails("bob@zipminator.zip")
                count_after = len(after)
                assert count_after > count_before, (
                    f"Expected more emails after send: before={count_before}, after={count_after}"
                )
            finally:
                await storage.close()

        self._run(_test())
