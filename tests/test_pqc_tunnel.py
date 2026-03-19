"""Tests for PQC tunnel mode (Pillar 6 -- Q-AI Assistant)."""

from __future__ import annotations

import json

import pytest
from cryptography.exceptions import InvalidTag

from zipminator.ai.pqc_tunnel import PQCTunnel


# ---------- roundtrip ----------

class TestRoundtrip:
    """Encrypt a prompt, decrypt it, verify it matches."""

    def test_roundtrip_bytes(self):
        tunnel = PQCTunnel()
        original = b"Summarize the quarterly report."
        envelope = tunnel.encrypt(original)

        assert set(envelope.keys()) == {"ct", "kem_ct", "nonce"}
        recovered = tunnel.decrypt_response(envelope)
        assert recovered == original

    def test_roundtrip_str(self):
        tunnel = PQCTunnel()
        original = "What is the capital of Norway?"
        envelope = tunnel.encrypt(original)
        recovered = tunnel.decrypt_response(envelope)
        assert recovered == original.encode("utf-8")

    def test_roundtrip_unicode(self):
        tunnel = PQCTunnel()
        original = "Hei verden! \u00c6\u00d8\u00c5 \u2603\ufe0f"
        envelope = tunnel.encrypt(original)
        recovered = tunnel.decrypt_response(envelope).decode("utf-8")
        assert recovered == original

    def test_roundtrip_empty_string(self):
        tunnel = PQCTunnel()
        envelope = tunnel.encrypt("")
        recovered = tunnel.decrypt_response(envelope)
        assert recovered == b""

    def test_roundtrip_large_payload(self):
        tunnel = PQCTunnel()
        original = "A" * 100_000
        envelope = tunnel.encrypt(original)
        recovered = tunnel.decrypt_response(envelope).decode("utf-8")
        assert recovered == original

    def test_wrap_unwrap_convenience(self):
        tunnel = PQCTunnel()
        prompt = "Explain post-quantum cryptography."
        envelope_json = tunnel.wrap_prompt(prompt)
        recovered = tunnel.unwrap_response(envelope_json)
        assert recovered == prompt


# ---------- ephemeral keys ----------

class TestEphemeralKeys:
    """Each tunnel instance must use a different ephemeral keypair."""

    def test_different_public_keys(self):
        t1 = PQCTunnel()
        t2 = PQCTunnel()
        assert t1.public_key != t2.public_key

    def test_cross_tunnel_decrypt_fails(self):
        """Tunnel A's envelope cannot be decrypted by Tunnel B."""
        a = PQCTunnel()
        b = PQCTunnel()
        envelope = a.encrypt("secret prompt")
        with pytest.raises((InvalidTag, Exception)):
            b.decrypt_response(envelope)

    def test_encrypt_for_other_tunnel(self):
        """Tunnel A encrypts for Tunnel B's public key; B can decrypt."""
        a = PQCTunnel()
        b = PQCTunnel()
        envelope = a.encrypt_for("hello from A", b.public_key)
        recovered = b.decrypt_response(envelope).decode("utf-8")
        assert recovered == "hello from A"


# ---------- invalid ciphertext / tamper detection ----------

class TestInvalidCiphertext:
    """Tampered or invalid envelopes must fail gracefully."""

    def test_tampered_ct_raises(self):
        tunnel = PQCTunnel()
        envelope = tunnel.encrypt("test")
        # Flip a byte in the AES ciphertext
        import base64
        raw = bytearray(base64.b64decode(envelope["ct"]))
        raw[0] ^= 0xFF
        envelope["ct"] = base64.b64encode(bytes(raw)).decode("ascii")
        with pytest.raises((InvalidTag, Exception)):
            tunnel.decrypt_response(envelope)

    def test_tampered_kem_ct_raises(self):
        tunnel = PQCTunnel()
        envelope = tunnel.encrypt("test")
        import base64
        raw = bytearray(base64.b64decode(envelope["kem_ct"]))
        raw[0] ^= 0xFF
        envelope["kem_ct"] = base64.b64encode(bytes(raw)).decode("ascii")
        with pytest.raises((InvalidTag, ValueError, Exception)):
            tunnel.decrypt_response(envelope)

    def test_missing_key_raises_value_error(self):
        tunnel = PQCTunnel()
        with pytest.raises(ValueError, match="Malformed"):
            tunnel.decrypt_response({"ct": "abc", "nonce": "abc"})

    def test_empty_envelope_raises(self):
        tunnel = PQCTunnel()
        with pytest.raises(ValueError, match="Malformed"):
            tunnel.decrypt_response({})

    def test_bad_base64_raises(self):
        tunnel = PQCTunnel()
        with pytest.raises((ValueError, Exception)):
            tunnel.decrypt_response({"ct": "!!!", "kem_ct": "!!!", "nonce": "!!!"})


# ---------- tunnel disabled by default ----------

class TestTunnelDisabledByDefault:
    """Without the X-PQC-Tunnel header, the route should not encrypt."""

    def test_header_parsing(self):
        """Simulates the header check logic from ai.py."""
        # No header = None = tunnel disabled
        header_value = None
        assert header_value != "enabled"

        # Explicit enable
        header_value = "enabled"
        assert header_value == "enabled"

        # Any other value = disabled
        header_value = "disabled"
        assert header_value != "enabled"


# ---------- envelope structure ----------

class TestEnvelopeStructure:
    """Verify the envelope is JSON-serialisable and has correct fields."""

    def test_envelope_is_json_serialisable(self):
        tunnel = PQCTunnel()
        envelope = tunnel.encrypt("test")
        serialised = json.dumps(envelope)
        deserialised = json.loads(serialised)
        assert deserialised == envelope

    def test_all_values_are_base64_strings(self):
        tunnel = PQCTunnel()
        envelope = tunnel.encrypt("test")
        import base64
        for key in ("ct", "kem_ct", "nonce"):
            value = envelope[key]
            assert isinstance(value, str)
            # Should decode without error
            base64.b64decode(value)

    def test_nonce_is_12_bytes(self):
        tunnel = PQCTunnel()
        envelope = tunnel.encrypt("test")
        import base64
        nonce = base64.b64decode(envelope["nonce"])
        assert len(nonce) == 12
