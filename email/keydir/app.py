"""PQC Key Directory Service -- FastAPI application.

Provides CRUD endpoints for composite public keys (ML-KEM-768 + X25519 + Ed25519)
and a WKD-compatible lookup endpoint.

Storage: PostgreSQL via asyncpg (uses the existing postgres service from
docker-compose.yml).
"""

import hashlib
import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, FastAPI, Header, HTTPException, status

try:
    from .models import (
        KeyLookupResponse,
        KeyRevokeResponse,
        PublicKeyCreate,
        PublicKeyEntry,
    )
except ImportError:
    from models import (  # type: ignore[no-redef]
        KeyLookupResponse,
        KeyRevokeResponse,
        PublicKeyCreate,
        PublicKeyEntry,
    )

# ── Configuration ─────────────────────────────────────────────────────────────

DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql://zipminator:zipminator@localhost:5432/zipminator"
)
AUTH_TOKEN = os.environ.get("KEYDIR_AUTH_TOKEN", "dev-token-change-me")

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Zipminator PQC Key Directory",
    description="Post-quantum composite public key directory service",
    version="0.1.0",
)

# ── In-memory store (PostgreSQL adapter plugged in via startup event) ─────────
# For production, swap _store with asyncpg calls.  The in-memory dict makes the
# service runnable without a database for development and testing.

_store: dict[str, list[PublicKeyEntry]] = {}
_fingerprint_index: dict[str, PublicKeyEntry] = {}


def _index_key(entry: PublicKeyEntry) -> None:
    """Add an entry to both the email and fingerprint indexes."""
    email = entry.email.lower()
    if email not in _store:
        _store[email] = []
    _store[email].append(entry)
    _fingerprint_index[entry.fingerprint] = entry


def _remove_key(fingerprint: str) -> Optional[PublicKeyEntry]:
    """Remove a key by fingerprint from both indexes."""
    entry = _fingerprint_index.pop(fingerprint, None)
    if entry is None:
        return None
    email = entry.email.lower()
    if email in _store:
        _store[email] = [k for k in _store[email] if k.fingerprint != fingerprint]
        if not _store[email]:
            del _store[email]
    return entry


# ── Auth dependency ───────────────────────────────────────────────────────────


def require_auth(authorization: str = Header(...)) -> str:
    """Validate Bearer token from the Authorization header."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must be 'Bearer <token>'",
        )
    token = authorization[7:]
    if token != AUTH_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid auth token"
        )
    return token


# ── Endpoints ─────────────────────────────────────────────────────────────────


@app.post(
    "/keys",
    response_model=PublicKeyEntry,
    status_code=status.HTTP_201_CREATED,
    summary="Publish a composite public key",
)
def publish_key(
    body: PublicKeyCreate,
    _token: str = Depends(require_auth),
) -> PublicKeyEntry:
    """Publish a new composite public key to the directory."""
    if body.fingerprint in _fingerprint_index:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A key with this fingerprint already exists",
        )

    entry = PublicKeyEntry(
        email=body.email,
        mlkem_pk=body.mlkem_pk,
        x25519_pk=body.x25519_pk,
        ed25519_pk=body.ed25519_pk,
        fingerprint=body.fingerprint,
        created_at=datetime.now(timezone.utc),
        expires_at=body.expires_at,
    )
    _index_key(entry)
    return entry


@app.get(
    "/keys/{email}",
    response_model=KeyLookupResponse,
    summary="Look up public keys by email address",
)
def lookup_by_email(email: str) -> KeyLookupResponse:
    """Return all non-expired public keys for the given email address."""
    now = datetime.now(timezone.utc)
    entries = _store.get(email.lower(), [])
    active = [e for e in entries if e.expires_at is None or e.expires_at > now]
    return KeyLookupResponse(keys=active, count=len(active))


@app.get(
    "/keys/fingerprint/{fingerprint}",
    response_model=KeyLookupResponse,
    summary="Look up a public key by fingerprint",
)
def lookup_by_fingerprint(fingerprint: str) -> KeyLookupResponse:
    """Return the public key matching the given fingerprint."""
    fp = fingerprint.lower().strip()
    entry = _fingerprint_index.get(fp)
    if entry is None:
        return KeyLookupResponse(keys=[], count=0)
    return KeyLookupResponse(keys=[entry], count=1)


@app.delete(
    "/keys/{fingerprint}",
    response_model=KeyRevokeResponse,
    summary="Revoke a published key",
)
def revoke_key(
    fingerprint: str,
    _token: str = Depends(require_auth),
) -> KeyRevokeResponse:
    """Revoke (delete) a key by fingerprint. Requires auth."""
    fp = fingerprint.lower().strip()
    entry = _remove_key(fp)
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No key found with this fingerprint",
        )
    return KeyRevokeResponse(fingerprint=fp)


@app.get(
    "/.well-known/openpgpkey/hu/{email_hash}",
    summary="WKD-compatible key lookup",
    response_model=KeyLookupResponse,
)
def wkd_lookup(email_hash: str) -> KeyLookupResponse:
    """WKD-compatible endpoint.

    The `email_hash` is the SHA-256 hex digest of the lowercase email address.
    Clients compute: sha256(email.lower()).hexdigest() to form the URL.
    """
    now = datetime.now(timezone.utc)
    for email_key, entries in _store.items():
        computed_hash = hashlib.sha256(email_key.encode()).hexdigest()
        if computed_hash == email_hash.lower():
            active = [e for e in entries if e.expires_at is None or e.expires_at > now]
            return KeyLookupResponse(keys=active, count=len(active))
    return KeyLookupResponse(keys=[], count=0)


@app.get("/health", summary="Health check")
def health_check() -> dict:
    """Simple health-check endpoint."""
    return {
        "status": "ok",
        "service": "pqc-keydir",
        "total_keys": len(_fingerprint_index),
    }
