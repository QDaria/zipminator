"""PQC-encrypted voicemail recording and playback.

File format (PQVM):
  Bytes 0-3:   Magic bytes b"PQVM"
  Bytes 4-15:  12-byte AES-GCM nonce
  Bytes 16-N:  AES-256-GCM ciphertext (plaintext audio + 16-byte auth tag)
  AAD:         b"voicemail"

The encryption key is the first 32 bytes of the ML-KEM-768 shared secret,
providing post-quantum confidentiality for stored voice messages.
"""

from __future__ import annotations

import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

_MAGIC = b"PQVM"
_NONCE_LEN = 12
_AAD = b"voicemail"


def record_voicemail(
    path: str, frames: list[bytes], shared_secret: bytes
) -> None:
    """Encrypt and write audio frames to a PQVM voicemail file.

    Args:
        path: Filesystem path for the output .pqvm file.
        frames: Ordered list of raw audio frame bytes (e.g., Opus packets).
        shared_secret: At least 32 bytes from ML-KEM-768 key exchange.

    Raises:
        ValueError: If shared_secret is shorter than 32 bytes.
    """
    if len(shared_secret) < 32:
        raise ValueError("shared_secret must be at least 32 bytes")

    raw = b"".join(frames)
    nonce = os.urandom(_NONCE_LEN)
    gcm = AESGCM(shared_secret[:32])
    ct = gcm.encrypt(nonce, raw, _AAD)

    with open(path, "wb") as f:
        f.write(_MAGIC)
        f.write(nonce)
        f.write(ct)


def play_voicemail(path: str, shared_secret: bytes) -> bytes:
    """Decrypt and return voicemail audio from a PQVM file.

    Args:
        path: Filesystem path to the .pqvm file.
        shared_secret: Same 32+ byte secret used during recording.

    Returns:
        The concatenated raw audio bytes.

    Raises:
        ValueError: If file does not have PQVM magic bytes.
        ValueError: If shared_secret is shorter than 32 bytes.
        cryptography.exceptions.InvalidTag: If decryption fails (wrong key).
    """
    if len(shared_secret) < 32:
        raise ValueError("shared_secret must be at least 32 bytes")

    with open(path, "rb") as f:
        magic = f.read(4)
        if magic != _MAGIC:
            raise ValueError("Not a PQC voicemail file (bad magic bytes)")
        nonce = f.read(_NONCE_LEN)
        ct = f.read()

    gcm = AESGCM(shared_secret[:32])
    return gcm.decrypt(nonce, ct, _AAD)
