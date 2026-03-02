"""Pydantic models for the PQC Key Directory service.

Defines key entries conforming to draft-ietf-openpgp-pqc composite key
structures: ML-KEM-768 + X25519 for encryption, Ed25519 for signing.
"""

from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class PublicKeyEntry(BaseModel):
    """A published composite public key entry."""

    email: str = Field(
        ..., description="Owner's email address", examples=["alice@qdaria.com"]
    )
    mlkem_pk: str = Field(
        ..., description="Base64-encoded ML-KEM-768 public key (1184 bytes)"
    )
    x25519_pk: str = Field(
        ..., description="Base64-encoded X25519 public key (32 bytes)"
    )
    ed25519_pk: str = Field(
        ..., description="Base64-encoded Ed25519 signing public key (32 bytes)"
    )
    fingerprint: str = Field(
        ..., description="Hex-encoded SHA-256 fingerprint of composite public key"
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Key creation timestamp (UTC)",
    )
    expires_at: Optional[datetime] = Field(
        None, description="Key expiry timestamp (UTC), null for no expiry"
    )

    @field_validator("fingerprint")
    @classmethod
    def validate_fingerprint_hex(cls, v: str) -> str:
        """Ensure fingerprint is valid hex (64 chars = 32 bytes)."""
        v = v.lower().strip()
        if len(v) != 64:
            raise ValueError("fingerprint must be 64 hex chars (32 bytes)")
        try:
            bytes.fromhex(v)
        except ValueError:
            raise ValueError("fingerprint must be valid hexadecimal")
        return v


class PublicKeyCreate(BaseModel):
    """Request body for publishing a new key."""

    email: str
    mlkem_pk: str
    x25519_pk: str
    ed25519_pk: str
    fingerprint: str
    expires_at: Optional[datetime] = None

    @field_validator("fingerprint")
    @classmethod
    def validate_fingerprint_hex(cls, v: str) -> str:
        v = v.lower().strip()
        if len(v) != 64:
            raise ValueError("fingerprint must be 64 hex chars (32 bytes)")
        bytes.fromhex(v)
        return v


class KeyLookupResponse(BaseModel):
    """Response body for key lookup endpoints."""

    keys: list[PublicKeyEntry] = Field(
        default_factory=list,
        description="List of matching public key entries",
    )
    count: int = Field(0, description="Number of keys returned")


class KeyRevokeResponse(BaseModel):
    """Response body for key revocation."""

    fingerprint: str
    revoked: bool = True
    message: str = "Key revoked successfully"
