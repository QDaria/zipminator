"""PQC tunnel for remote LLM API calls (Pillar 6 -- Q-AI Assistant).

Wraps outbound prompts in an ML-KEM-768 envelope so that even if the
transport layer is compromised, the payload remains quantum-safe encrypted.

Each PQCTunnel instance generates an ephemeral keypair.  The encrypt/decrypt
cycle uses KEM-derived AES-256-GCM.

Envelope format (JSON):
    {"ct": <base64>, "kem_ct": <base64>, "nonce": <base64>}
"""

from __future__ import annotations

import base64
import json
import os
from dataclasses import dataclass, field
from typing import Any, Dict, Tuple

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from zipminator.crypto.pqc import PQC


@dataclass
class PQCTunnel:
    """Ephemeral PQC tunnel for a single session.

    Typical flow (client side):
        tunnel = PQCTunnel()
        envelope = tunnel.encrypt(prompt_payload)
        # ... send envelope + tunnel.public_key to server ...
        # ... server encrypts response with our public key ...
        plaintext = tunnel.decrypt_response(response_envelope)

    The server side uses ``encrypt_for()`` with a provided public key.
    """

    _pqc: PQC = field(init=False, repr=False)
    _pk: bytes = field(init=False, repr=False)
    _sk: bytes = field(init=False, repr=False)

    def __post_init__(self) -> None:
        self._pqc = PQC(level=768)
        self._pk, self._sk = self._pqc.generate_keypair()

    # -- public accessors --

    @property
    def public_key(self) -> bytes:
        """Return the ephemeral public key (1184 bytes for ML-KEM-768)."""
        return self._pk

    # -- encryption (outbound prompt) --

    def encrypt(self, plaintext: str | bytes) -> Dict[str, str]:
        """Encrypt *plaintext* using our own public key.

        This is the "self-encrypt" path: useful when the caller wants to
        create an envelope that only this tunnel instance can decrypt (e.g.
        for audit logging or local round-trip tests).
        """
        return self.encrypt_for(plaintext, self._pk)

    def encrypt_for(self, plaintext: str | bytes, recipient_pk: bytes) -> Dict[str, str]:
        """Encrypt *plaintext* for *recipient_pk*.

        Returns a JSON-serialisable dict with base64-encoded fields:
            ct      -- AES-256-GCM ciphertext
            kem_ct  -- KEM ciphertext (encapsulated shared secret)
            nonce   -- 12-byte GCM nonce
        """
        if isinstance(plaintext, str):
            plaintext = plaintext.encode("utf-8")

        # KEM: encapsulate produces (kem_ciphertext, shared_secret)
        kem_ct, shared_secret = self._pqc.encapsulate(recipient_pk)

        # Derive AES-256 key from the 32-byte shared secret directly
        aes_key = shared_secret[:32]
        nonce = os.urandom(12)
        aesgcm = AESGCM(aes_key)
        ct = aesgcm.encrypt(nonce, plaintext, None)

        return {
            "ct": base64.b64encode(ct).decode("ascii"),
            "kem_ct": base64.b64encode(kem_ct).decode("ascii"),
            "nonce": base64.b64encode(nonce).decode("ascii"),
        }

    # -- decryption (inbound response) --

    def decrypt_response(self, envelope: Dict[str, str]) -> bytes:
        """Decrypt an envelope that was encrypted for this tunnel's public key.

        Args:
            envelope: dict with keys ``ct``, ``kem_ct``, ``nonce`` (all base64).

        Returns:
            Decrypted plaintext as bytes.

        Raises:
            ValueError: If the envelope is malformed.
            cryptography.exceptions.InvalidTag: If decryption fails (tampered data).
        """
        try:
            ct = base64.b64decode(envelope["ct"])
            kem_ct = base64.b64decode(envelope["kem_ct"])
            nonce = base64.b64decode(envelope["nonce"])
        except (KeyError, Exception) as exc:
            raise ValueError(f"Malformed PQC envelope: {exc}") from exc

        # Decapsulate to recover shared secret
        shared_secret = self._pqc.decapsulate(self._sk, kem_ct)

        aes_key = shared_secret[:32]
        aesgcm = AESGCM(aes_key)
        return aesgcm.decrypt(nonce, ct, None)

    # -- convenience --

    def wrap_prompt(self, prompt: str) -> str:
        """Encrypt a prompt string and return the envelope as a JSON string."""
        envelope = self.encrypt(prompt)
        return json.dumps(envelope)

    def unwrap_response(self, envelope_json: str) -> str:
        """Decrypt a JSON envelope string and return plaintext as a string."""
        envelope = json.loads(envelope_json)
        return self.decrypt_response(envelope).decode("utf-8")
