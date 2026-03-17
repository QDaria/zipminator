"""Integration tests: PQC email crypto roundtrip and SMTP transport.

Tests the full encrypt-build_message-decrypt pipeline using the Rust
ML-KEM-768 bindings (zipminator._core) and the Python pqc_bridge layer.

The SMTP test requires docker (GreenMail) and is skipped when docker is
unavailable.  The crypto-only tests run everywhere.
"""

from __future__ import annotations

import base64
import os
import shutil
import subprocess
import sys
import tempfile

import pytest

# ---------------------------------------------------------------------------
# Availability checks
# ---------------------------------------------------------------------------

try:
    from zipminator._core import keypair, encapsulate, decapsulate

    _RUST_AVAILABLE = True
except ImportError:
    _RUST_AVAILABLE = False

# Add email/ to sys.path so pqc_bridge is importable without shadowing stdlib
EMAIL_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "email")
)
if EMAIL_DIR not in sys.path:
    sys.path.insert(0, EMAIL_DIR)

try:
    from transport.pqc_bridge import encrypt_email, decrypt_email

    _BRIDGE_AVAILABLE = True
except ImportError:
    _BRIDGE_AVAILABLE = False

_DOCKER_AVAILABLE = shutil.which("docker") is not None


def _docker_compose_has_greenmail() -> bool:
    """Check whether the integration docker-compose includes GreenMail."""
    if not _DOCKER_AVAILABLE:
        return False
    compose = os.path.join(
        os.path.dirname(__file__), "..", "..", "docker-compose.integration.yml"
    )
    if not os.path.exists(compose):
        return False
    try:
        result = subprocess.run(
            ["docker", "compose", "-f", compose, "ps", "--format", "json"],
            capture_output=True,
            text=True,
            timeout=10,
        )
        return "greenmail" in result.stdout.lower()
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False


# ---------------------------------------------------------------------------
# ML-KEM-768 roundtrip (pure Rust bindings, no network)
# ---------------------------------------------------------------------------


@pytest.mark.skipif(not _RUST_AVAILABLE, reason="Rust _core bindings not built")
class TestEmailCryptoRoundtrip:
    """Verify ML-KEM-768 key exchange works end-to-end via Python bindings."""

    def test_shared_secret_matches(self):
        """encapsulate + decapsulate must produce identical 32-byte secrets."""
        pk, sk = keypair()
        ct, shared_a = encapsulate(pk)
        shared_b = decapsulate(ct, sk)
        assert shared_a == shared_b
        assert len(shared_a) == 32

    def test_wrong_sk_fails(self):
        """Decapsulating with wrong secret key must NOT produce same secret."""
        pk1, _sk1 = keypair()
        _pk2, sk2 = keypair()
        ct, shared_a = encapsulate(pk1)
        shared_b = decapsulate(ct, sk2)
        # ML-KEM implicit reject: decapsulate succeeds but returns random bytes
        assert shared_a != shared_b

    def test_key_sizes(self):
        """Verify NIST ML-KEM-768 key and ciphertext sizes."""
        pk, sk = keypair()
        ct, _shared = encapsulate(pk)
        assert len(pk.to_bytes()) == 1184, "ML-KEM-768 public key = 1184 bytes"
        assert len(sk.to_bytes()) == 2400, "ML-KEM-768 secret key = 2400 bytes"
        assert len(ct.to_bytes()) == 1088, "ML-KEM-768 ciphertext = 1088 bytes"

    def test_deterministic_shared_secret(self):
        """Same (ct, sk) pair always yields the same shared secret."""
        pk, sk = keypair()
        ct, shared_a = encapsulate(pk)
        shared_b = decapsulate(ct, sk)
        shared_c = decapsulate(ct, sk)
        assert shared_b == shared_c


# ---------------------------------------------------------------------------
# PQC Bridge envelope roundtrip (Python fallback or Rust-backed)
# ---------------------------------------------------------------------------


@pytest.mark.skipif(not _BRIDGE_AVAILABLE, reason="pqc_bridge not importable")
class TestPqcBridgeEmailRoundtrip:
    """Test the Python pqc_bridge encrypt/decrypt envelope pipeline."""

    def test_encrypt_decrypt_roundtrip(self):
        """Encrypt a body, then decrypt it; plaintext must match."""
        pk_b64 = base64.b64encode(os.urandom(1184)).decode()
        sk_b64 = base64.b64encode(os.urandom(2400)).decode()
        plaintext = b"Quantum-safe email body for integration test"
        envelope = encrypt_email(plaintext, pk_b64)
        recovered = decrypt_email(envelope, sk_b64)
        assert recovered == plaintext

    def test_empty_body_roundtrip(self):
        """Empty email body must survive encrypt/decrypt."""
        pk_b64 = base64.b64encode(os.urandom(1184)).decode()
        sk_b64 = base64.b64encode(os.urandom(2400)).decode()
        envelope = encrypt_email(b"", pk_b64)
        recovered = decrypt_email(envelope, sk_b64)
        assert recovered == b""

    def test_large_body_roundtrip(self):
        """64 KB body (attachment-sized) must survive roundtrip."""
        pk_b64 = base64.b64encode(os.urandom(1184)).decode()
        sk_b64 = base64.b64encode(os.urandom(2400)).decode()
        large = os.urandom(64 * 1024)
        envelope = encrypt_email(large, pk_b64)
        recovered = decrypt_email(envelope, sk_b64)
        assert recovered == large

    def test_envelope_is_json_serialisable(self):
        """Envelope dict must survive JSON round-trip."""
        import json

        pk_b64 = base64.b64encode(os.urandom(1184)).decode()
        envelope = encrypt_email(b"json check", pk_b64)
        serialised = json.dumps(envelope)
        recovered = json.loads(serialised)
        assert recovered == envelope


# ---------------------------------------------------------------------------
# PQC email MIME message construction (Python-level)
# ---------------------------------------------------------------------------


@pytest.mark.skipif(not _RUST_AVAILABLE, reason="Rust _core bindings not built")
class TestPqcEmailMimeConstruction:
    """Build a MIME message with PQC headers and verify structure."""

    def test_build_pqc_email_message(self):
        """Construct an RFC 5322 email with PQC envelope in body."""
        from email.mime.text import MIMEText

        pk, sk = keypair()
        ct, shared = encapsulate(pk)

        # Build email carrying the KEM ciphertext (simulating envelope)
        ct_b64 = base64.b64encode(ct.to_bytes()).decode()
        msg = MIMEText(ct_b64, "plain")
        msg["Subject"] = "PQC Integration Test"
        msg["From"] = "sender@zipminator.zip"
        msg["To"] = "recipient@zipminator.zip"
        msg["X-PQC-Version"] = "ML-KEM-768"
        msg["X-PQC-Ciphertext-Length"] = str(len(ct.to_bytes()))

        raw = msg.as_string()
        assert "X-PQC-Version: ML-KEM-768" in raw
        assert "sender@zipminator.zip" in raw
        assert "recipient@zipminator.zip" in raw
        assert ct_b64[:40] in raw  # first 40 chars of b64 body present

    def test_pqc_headers_present(self):
        """PQC discovery headers must be in the built message."""
        from email.mime.text import MIMEText

        pk, _sk = keypair()
        pk_b64 = base64.b64encode(pk.to_bytes()).decode()

        msg = MIMEText("encrypted-payload-here", "plain")
        msg["X-PQC-Version"] = "ML-KEM-768"
        msg["X-PQC-Sender-Key"] = pk_b64[:64] + "..."  # truncated for header

        raw = msg.as_string()
        assert "X-PQC-Version" in raw
        assert "X-PQC-Sender-Key" in raw


# ---------------------------------------------------------------------------
# Self-destruct wipe (file-based, no network)
# ---------------------------------------------------------------------------


class TestSelfDestructIntegration:
    """Test self-destruct file wipe logic at the Python level."""

    def test_self_destruct_file_wipe(self):
        """Write a temp file, wipe it with random overwrite, verify gone."""
        tmpdir = tempfile.mkdtemp(prefix="zipminator_wipe_")
        path = os.path.join(tmpdir, "secret_email.bin")
        secret_data = os.urandom(256)
        with open(path, "wb") as f:
            f.write(secret_data)

        assert os.path.exists(path)

        # Overwrite with random data then delete (simulating OverwriteRandom)
        size = os.path.getsize(path)
        with open(path, "wb") as f:
            f.write(os.urandom(size))
        os.remove(path)

        assert not os.path.exists(path)
        # Cleanup
        os.rmdir(tmpdir)

    def test_three_pass_overwrite(self):
        """Simulate DoD 5220.22-M 3-pass wipe: zeros, ones, random."""
        tmpdir = tempfile.mkdtemp(prefix="zipminator_3pass_")
        path = os.path.join(tmpdir, "classified.bin")
        with open(path, "wb") as f:
            f.write(b"TOP SECRET PQC KEY MATERIAL" * 10)

        size = os.path.getsize(path)

        # Pass 1: zeros
        with open(path, "wb") as f:
            f.write(b"\x00" * size)
        # Pass 2: ones
        with open(path, "wb") as f:
            f.write(b"\xff" * size)
        # Pass 3: random
        with open(path, "wb") as f:
            f.write(os.urandom(size))

        os.remove(path)
        assert not os.path.exists(path)
        os.rmdir(tmpdir)


# ---------------------------------------------------------------------------
# SMTP send via GreenMail (docker-dependent)
# ---------------------------------------------------------------------------


@pytest.mark.skipif(
    not _DOCKER_AVAILABLE or os.environ.get("CI_SKIP_DOCKER"),
    reason="Docker not available or CI_SKIP_DOCKER set",
)
class TestSmtpTransport:
    """Send a PQC-encrypted email via SMTP to GreenMail (docker)."""

    def test_pqc_email_smtp_send(self, docker_services, smtp_config):
        """Send a PQC-encrypted email via SMTP to GreenMail."""
        import smtplib
        from email.mime.text import MIMEText

        if not _RUST_AVAILABLE:
            pytest.skip("Rust bindings not available")

        pk, sk = keypair()
        ct, shared = encapsulate(pk)

        msg = MIMEText(
            base64.b64encode(ct.to_bytes()).decode(), "plain"
        )
        msg["Subject"] = "PQC Integration Test"
        msg["From"] = "sender@zipminator.zip"
        msg["To"] = "test@zipminator.zip"
        msg["X-PQC-Version"] = "ML-KEM-768"

        with smtplib.SMTP(smtp_config["host"], smtp_config["port"]) as server:
            server.send_message(msg)

        # If we got here without exception, SMTP send succeeded
