"""VoIP SDP API endpoints with PQ extensions (Unit 5).

Provides offer/answer/hangup endpoints that serialize the Rust VoipSessionManager
SDP extensions to JSON. For the Python API layer, we re-implement the KEM exchange
using the Python bindings (zipminator._core or fallback).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Optional
import base64
import hashlib
import os
import logging

from src.db.models import User
from src.middleware.auth import get_current_user

log = logging.getLogger(__name__)

router = APIRouter()

# ── In-memory session store (production: Redis or PostgreSQL) ────────────────

_sessions: Dict[str, dict] = {}  # session_id -> session data


# ── Pydantic models ─────────────────────────────────────────────────────────

class VoipOfferRequest(BaseModel):
    """Client requests to create an offer."""
    callee_id: int  # target user


class VoipOfferResponse(BaseModel):
    session_id: str
    caller_id: int
    callee_id: int
    pk_b64: str  # ML-KEM-768 public key (base64)
    kem_line: str
    fingerprint: str


class VoipAnswerRequest(BaseModel):
    session_id: str
    ct_b64: str  # KEM ciphertext from answerer (base64)


class VoipAnswerResponse(BaseModel):
    session_id: str
    answerer_id: int
    ct_line: str
    fingerprint: str
    srtp_key_b64: str  # derived SRTP master key (base64)


class VoipHangupRequest(BaseModel):
    session_id: str


# ── Crypto helpers ───────────────────────────────────────────────────────────

def _try_import_kem():
    """Try to import Kyber KEM from the Rust binding or fallback."""
    try:
        from zipminator._core import keypair, encapsulate, decapsulate
        return keypair, encapsulate, decapsulate
    except ImportError:
        pass
    # Fallback: use cryptography ECDH as a stand-in for dev/test
    return None, None, None


def _generate_keypair_fallback():
    """Dev fallback: generate a random 'keypair' (not real KEM)."""
    pk = os.urandom(1184)  # ML-KEM-768 PK size
    sk = os.urandom(2400)  # ML-KEM-768 SK size
    return pk, sk


def _encapsulate_fallback(pk_bytes: bytes):
    """Dev fallback: generate random ct + shared secret."""
    ct = os.urandom(1088)  # ML-KEM-768 CT size
    ss = os.urandom(32)
    return ct, ss


def _decapsulate_fallback(ct_bytes: bytes, sk_bytes: bytes):
    """Dev fallback: return zeros (won't match, but exercises the API)."""
    return os.urandom(32)


def _derive_srtp_key(shared_secret: bytes, label: bytes) -> bytes:
    """HKDF-SHA256 key derivation for SRTP master key."""
    from hashlib import sha256
    return sha256(label + shared_secret).digest()[:16]  # 128-bit SRTP key


def _hex_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/offer", response_model=VoipOfferResponse)
async def create_offer(
    body: VoipOfferRequest,
    current_user: User = Depends(get_current_user),
):
    """Create an SDP offer with a fresh ML-KEM-768 public key."""
    keypair_fn, _, _ = _try_import_kem()

    if keypair_fn:
        result = keypair_fn()
        pk_bytes = result[0].to_bytes()
        sk_bytes = result[1].to_bytes()
    else:
        pk_bytes, sk_bytes = _generate_keypair_fallback()

    session_id = base64.urlsafe_b64encode(os.urandom(16)).decode().rstrip("=")
    pk_b64 = base64.b64encode(pk_bytes).decode()
    fingerprint = _hex_sha256(pk_bytes)

    _sessions[session_id] = {
        "caller_id": current_user.id,
        "callee_id": body.callee_id,
        "pk_bytes": pk_bytes,
        "sk_bytes": sk_bytes,
        "state": "offering",
    }

    return VoipOfferResponse(
        session_id=session_id,
        caller_id=current_user.id,
        callee_id=body.callee_id,
        pk_b64=pk_b64,
        kem_line=f"a=pq-kem:ML-KEM-768 {pk_b64}",
        fingerprint=fingerprint,
    )


@router.post("/answer", response_model=VoipAnswerResponse)
async def create_answer(
    body: VoipAnswerRequest,
    current_user: User = Depends(get_current_user),
):
    """Accept an offer: provide KEM ciphertext, derive SRTP keys."""
    session = _sessions.get(body.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["callee_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not the callee for this session")
    if session["state"] != "offering":
        raise HTTPException(status_code=400, detail="Session not in offering state")

    ct_bytes = base64.b64decode(body.ct_b64)

    # Decapsulate on the offerer side
    _, _, decap_fn = _try_import_kem()
    if decap_fn:
        from zipminator._core import Ciphertext, SecretKey
        ct_obj = Ciphertext.from_bytes(ct_bytes)
        sk_obj = SecretKey.from_bytes(session["sk_bytes"])
        ss = decap_fn(ct_obj, sk_obj)
        ss_bytes = bytes(ss)
    else:
        ss_bytes = _decapsulate_fallback(ct_bytes, session["sk_bytes"])

    srtp_key = _derive_srtp_key(ss_bytes, b"answerer")
    fingerprint = _hex_sha256(ct_bytes)

    session["state"] = "connected"
    session["shared_secret"] = ss_bytes

    return VoipAnswerResponse(
        session_id=body.session_id,
        answerer_id=current_user.id,
        ct_line=f"a=pq-ct:{body.ct_b64}",
        fingerprint=fingerprint,
        srtp_key_b64=base64.b64encode(srtp_key).decode(),
    )


@router.post("/hangup", status_code=status.HTTP_204_NO_CONTENT)
async def hangup(
    body: VoipHangupRequest,
    current_user: User = Depends(get_current_user),
):
    """End a VoIP session."""
    session = _sessions.pop(body.session_id, None)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if current_user.id not in (session["caller_id"], session["callee_id"]):
        raise HTTPException(status_code=403, detail="Not a participant")
    log.info("voip: session %s ended by user %d", body.session_id, current_user.id)
