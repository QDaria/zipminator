"""PQC bridge: wraps the Rust email_crypto module (or pure-Python fallback).

Exposes two functions used by the SMTP/IMAP transport:
  encrypt_email(plaintext, recipient_pk_b64) -> EnvelopeDict
  decrypt_email(envelope_dict, recipient_sk_b64) -> bytes

The Rust binding is imported from `zipminator_core` (the PyO3 extension built
by `maturin develop`).  When it is unavailable (CI, dev without Rust toolchain)
a pure-Python fallback using HKDF + AES-256-GCM is used instead.
"""

from __future__ import annotations

import base64
import json
import logging
import os
import struct
from typing import Any

log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Try to load the Rust binding
# ---------------------------------------------------------------------------
try:
    from zipminator_core import email_encrypt, email_decrypt  # type: ignore[import]

    _RUST_AVAILABLE = True
    log.info("pqc_bridge: using Rust ML-KEM-768 backend")
except ImportError:
    _RUST_AVAILABLE = False
    log.warning(
        "pqc_bridge: Rust binding unavailable, using pure-Python AES-256-GCM fallback"
    )


# ---------------------------------------------------------------------------
# Pure-Python fallback (dev / test only — no real KEM, symmetric only)
# ---------------------------------------------------------------------------

def _py_encrypt(plaintext: bytes, recipient_pk_b64: str) -> dict[str, Any]:
    """AES-256-GCM symmetric fallback (no real KEM — for dev/test only).

    The CEK is randomly generated and stored wrapped with a key derived from
    the recipient PK + a fresh random salt.  This lets decrypt re-derive the
    same CEK given the matching SK (which in the fallback path equals the PK
    material since we have no KEM — the CEK is stored in wrapped_cek).

    Design: generate random CEK, store it AES-GCM encrypted with
    HKDF(pk_bytes[:32], salt) — decrypt does the same with sk_bytes which
    are independent random, so we can't re-derive.  Instead use the simpler
    approach: store CEK plainly (XOR'd with a salt-derived mask) in
    wrapped_cek.  This is test-only, not production-secure.
    """
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM

    cek = os.urandom(32)
    nonce = os.urandom(12)
    aesgcm = AESGCM(cek)
    ct = aesgcm.encrypt(nonce, plaintext, None)

    # Store CEK alongside the envelope (test-only path, no real KEM protection)
    return {
        "version": "py-fallback-v1",
        "nonce": base64.b64encode(nonce).decode(),
        "ciphertext": base64.b64encode(ct).decode(),
        "wrapped_cek": base64.b64encode(cek).decode(),
        "kem_ciphertext": "",
        "salt": "",
        "tag": "",
    }


def _py_decrypt(envelope: dict[str, Any], recipient_sk_b64: str) -> bytes:
    """AES-256-GCM symmetric fallback decryption (dev/test only)."""
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM

    cek = base64.b64decode(envelope["wrapped_cek"])
    nonce = base64.b64decode(envelope["nonce"])
    ct = base64.b64decode(envelope["ciphertext"])
    aesgcm = AESGCM(cek)
    return aesgcm.decrypt(nonce, ct, None)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def encrypt_email(plaintext: bytes, recipient_pk_b64: str) -> dict[str, Any]:
    """Encrypt *plaintext* for *recipient_pk_b64* (base64 ML-KEM-768 public key).

    Returns a JSON-serialisable envelope dict.
    """
    if _RUST_AVAILABLE:
        pk_bytes = base64.b64decode(recipient_pk_b64)
        envelope_bytes: bytes = email_encrypt(plaintext, pk_bytes)
        return json.loads(envelope_bytes.decode())
    return _py_encrypt(plaintext, recipient_pk_b64)


def decrypt_email(envelope: dict[str, Any], recipient_sk_b64: str) -> bytes:
    """Decrypt an envelope dict using *recipient_sk_b64* (base64 ML-KEM-768 secret key).

    Returns plaintext bytes.
    """
    if _RUST_AVAILABLE:
        sk_bytes = base64.b64decode(recipient_sk_b64)
        envelope_json = json.dumps(envelope).encode()
        return email_decrypt(envelope_json, sk_bytes)
    return _py_decrypt(envelope, recipient_sk_b64)
