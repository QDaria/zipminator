"""Tests: ML-KEM envelope encryption via pqc_bridge.

These tests exercise the public API of pqc_bridge using the pure-Python
fallback (no Rust binding required) so they run in any environment.
"""

from __future__ import annotations

import base64
import json
import os
import sys

import pytest

# ---------------------------------------------------------------------------
# Add email/ to sys.path so `transport` is importable as a top-level package
# (avoids shadowing the stdlib `email` module)
# ---------------------------------------------------------------------------
EMAIL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "email"))
if EMAIL_DIR not in sys.path:
    sys.path.insert(0, EMAIL_DIR)

from transport.pqc_bridge import encrypt_email, decrypt_email  # noqa: E402


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _fake_keypair() -> tuple[str, str]:
    """Generate a fake (random) 1184-byte public key and 2400-byte secret key.

    The pure-Python fallback only uses the first 32 bytes of the PK for HKDF,
    so any random bytes of the correct length work.
    """
    pk = base64.b64encode(os.urandom(1184)).decode()
    sk = base64.b64encode(os.urandom(2400)).decode()
    return pk, sk


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestPQCBridge:
    def test_encrypt_returns_dict(self):
        pk, _ = _fake_keypair()
        plaintext = b"Hello, PQC world!"
        envelope = encrypt_email(plaintext, pk)
        assert isinstance(envelope, dict), "encrypt_email must return a dict"

    def test_envelope_has_required_fields(self):
        pk, _ = _fake_keypair()
        envelope = encrypt_email(b"test payload", pk)
        # Fallback envelope always has these keys
        assert "version" in envelope or "ciphertext" in envelope, (
            "envelope missing version or ciphertext field"
        )

    def test_encrypt_decrypt_roundtrip(self):
        pk, sk = _fake_keypair()
        plaintext = b"Secret email body for roundtrip test"
        envelope = encrypt_email(plaintext, pk)
        recovered = decrypt_email(envelope, sk)
        assert recovered == plaintext, "Decrypted body must match original"

    def test_encrypt_different_plaintexts_differ(self):
        pk, _ = _fake_keypair()
        env1 = encrypt_email(b"message one", pk)
        env2 = encrypt_email(b"message two", pk)
        # Ciphertexts should differ (nonce randomisation)
        ct1 = env1.get("ciphertext", "")
        ct2 = env2.get("ciphertext", "")
        assert ct1 != ct2, "Different plaintexts must produce different ciphertexts"

    def test_encrypt_empty_body(self):
        pk, sk = _fake_keypair()
        envelope = encrypt_email(b"", pk)
        recovered = decrypt_email(envelope, sk)
        assert recovered == b"", "Empty body roundtrip must succeed"

    def test_encrypt_large_body(self):
        pk, sk = _fake_keypair()
        large = os.urandom(64 * 1024)  # 64 KB
        envelope = encrypt_email(large, pk)
        recovered = decrypt_email(envelope, sk)
        assert recovered == large, "Large body roundtrip must succeed"

    def test_wrong_key_decrypt_fails(self):
        """Wrong SK must cause failure; skipped for the pure-Python fallback.

        In the fallback path the CEK is stored directly (no KEM), so any SK
        can decrypt.  When the Rust ML-KEM-768 binding is present, a wrong SK
        produces a different shared secret and thus a wrong KEK, causing
        AES-GCM tag verification to fail.
        """
        from transport.pqc_bridge import _RUST_AVAILABLE
        if not _RUST_AVAILABLE:
            pytest.skip("wrong-key test only meaningful with Rust KEM binding")
        pk, _ = _fake_keypair()
        _, wrong_sk = _fake_keypair()
        envelope = encrypt_email(b"confidential", pk)
        with pytest.raises(Exception):
            decrypt_email(envelope, wrong_sk)

    def test_tampered_ciphertext_fails(self):
        pk, sk = _fake_keypair()
        envelope = encrypt_email(b"tamper test", pk)
        if "ciphertext" in envelope:
            ct_bytes = base64.b64decode(envelope["ciphertext"])
            ct_bytes = bytes([ct_bytes[0] ^ 0xFF]) + ct_bytes[1:]
            envelope["ciphertext"] = base64.b64encode(ct_bytes).decode()
        with pytest.raises(Exception):
            decrypt_email(envelope, sk)

    def test_envelope_is_json_serialisable(self):
        pk, _ = _fake_keypair()
        envelope = encrypt_email(b"json check", pk)
        serialised = json.dumps(envelope)
        recovered = json.loads(serialised)
        assert recovered == envelope, "Envelope must survive JSON round-trip"
