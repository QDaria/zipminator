"""Zipminator Email KMS -- Self-Destructing Key Management Service.

Each email is encrypted with a per-message DEK stored in Redis with a TTL.
When the TTL expires the DEK is purged, making ciphertext permanently
unrecoverable (crypto-shredding).
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

import redis.asyncio as aioredis
from fastapi import FastAPI, HTTPException

from models import (
    AuditLogResponse,
    CreateHoldRequest,
    CreateHoldResponse,
    DestroyKeyResponse,
    ErrorResponse,
    FetchKeyResponse,
    HealthResponse,
    ListHoldsResponse,
    ReadReceiptResponse,
    StoreKeyRequest,
    StoreKeyResponse,
)
import audit
import store

# ── Configuration ────────────────────────────────────────────────────────────

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6380")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("zipminator.kms")

# ── Application lifespan ─────────────────────────────────────────────────────

_redis: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    """Return the shared Redis connection pool."""
    assert _redis is not None, "Redis not initialised"
    return _redis


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _redis
    logger.info("Connecting to Redis at %s", REDIS_URL)
    _redis = aioredis.from_url(REDIS_URL, decode_responses=True)
    await _redis.ping()
    logger.info("Redis connection established")
    yield
    await _redis.aclose()
    _redis = None
    logger.info("Redis connection closed")


app = FastAPI(
    title="Zipminator Email KMS",
    version="0.1.0",
    description="Self-destructing key management for quantum-secure email",
    lifespan=lifespan,
)


# ── Health ───────────────────────────────────────────────────────────────────


@app.get("/health", response_model=HealthResponse)
async def health():
    connected = False
    try:
        r = await get_redis()
        await r.ping()
        connected = True
    except Exception:
        pass
    return HealthResponse(
        status="ok" if connected else "degraded",
        redis_connected=connected,
    )


# ── Key operations ───────────────────────────────────────────────────────────


@app.post(
    "/keys",
    response_model=StoreKeyResponse,
    status_code=201,
    responses={400: {"model": ErrorResponse}},
)
async def store_key(req: StoreKeyRequest):
    """Store a DEK with a self-destruct TTL."""
    if req.mode.value == "after_read" and req.post_read_ttl_seconds is None:
        raise HTTPException(
            status_code=400,
            detail="post_read_ttl_seconds required for after_read mode",
        )
    r = await get_redis()
    key_id = await store.store_dek(r, req)
    logger.info("Stored DEK key_id=%s mode=%s ttl=%d", key_id, req.mode, req.ttl_seconds)
    return StoreKeyResponse(key_id=key_id)


@app.get(
    "/keys/{key_id}",
    response_model=FetchKeyResponse,
    responses={404: {"model": ErrorResponse}},
)
async def fetch_key(key_id: str):
    """Fetch a DEK. For read_once mode, the key is deleted after this call."""
    r = await get_redis()
    result = await store.fetch_dek(r, key_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Key not found or expired")
    dek, ttl = result
    return FetchKeyResponse(dek_encrypted=dek, remaining_ttl=ttl)


@app.post(
    "/keys/{key_id}/read-receipt",
    response_model=ReadReceiptResponse,
    responses={404: {"model": ErrorResponse}, 409: {"model": ErrorResponse}},
)
async def read_receipt(key_id: str):
    """Trigger post-read TTL. One-shot: only accepted once per key_id."""
    r = await get_redis()
    result = await store.apply_read_receipt(r, key_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Key not found or expired")
    if result == -1:
        raise HTTPException(status_code=409, detail="Read receipt already applied")
    return ReadReceiptResponse(new_ttl=result)


@app.delete(
    "/keys/{key_id}",
    response_model=DestroyKeyResponse,
    responses={404: {"model": ErrorResponse}},
)
async def destroy_key(key_id: str):
    """Immediately destroy a DEK (crypto-shred)."""
    r = await get_redis()
    destroyed = await store.destroy_dek(r, key_id)
    if not destroyed:
        raise HTTPException(status_code=404, detail="Key not found or already destroyed")
    logger.info("Destroyed DEK key_id=%s", key_id)
    return DestroyKeyResponse(destroyed=True)


# ── Legal hold ───────────────────────────────────────────────────────────────


@app.post(
    "/hold/{target_id}",
    response_model=CreateHoldResponse,
    status_code=201,
)
async def create_hold(target_id: str, req: CreateHoldRequest):
    """Freeze TTL for an account or message (legal hold)."""
    r = await get_redis()
    # Override target_id from path into request
    req.target_id = target_id
    hold_id = await store.create_hold(r, req)
    logger.info("Legal hold created hold_id=%s target=%s", hold_id, target_id)
    return CreateHoldResponse(hold_id=hold_id)


@app.delete(
    "/hold/{hold_id}",
    response_model=DestroyKeyResponse,
    responses={404: {"model": ErrorResponse}},
)
async def release_hold(hold_id: str):
    """Release a legal hold and resume TTL countdown."""
    r = await get_redis()
    released = await store.release_hold(r, hold_id)
    if not released:
        raise HTTPException(status_code=404, detail="Hold not found")
    logger.info("Legal hold released hold_id=%s", hold_id)
    return DestroyKeyResponse(destroyed=True)


@app.get("/hold", response_model=ListHoldsResponse)
async def list_holds():
    """List all active legal holds."""
    r = await get_redis()
    holds = await store.list_holds(r)
    return ListHoldsResponse(holds=holds)


# ── Audit ────────────────────────────────────────────────────────────────────


@app.get(
    "/audit/{key_id}",
    response_model=AuditLogResponse,
    responses={404: {"model": ErrorResponse}},
)
async def get_audit_log(key_id: str):
    """Return the audit trail for a key."""
    r = await get_redis()
    events = await audit.get_events(r, key_id)
    if not events:
        raise HTTPException(status_code=404, detail="No audit events for this key")
    return AuditLogResponse(events=events)
