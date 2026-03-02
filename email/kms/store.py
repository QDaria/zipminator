"""Redis store abstraction for the Email KMS.

Key layout
----------
email:{key_id}:dek       -- encrypted DEK bytes (string, with EXPIREAT)
email:{key_id}:meta      -- JSON metadata (mode, message_id, original_ttl, ...)
rr:{key_id}              -- read-receipt flag ("1" if receipt already sent)
hold:{hold_id}           -- JSON hold metadata
hold:index                -- Redis SET of active hold_ids
hold:target:{target_id}  -- Redis SET of hold_ids targeting this entity
frozen:{key_id}           -- remaining TTL snapshot when hold was applied

audit:{key_id}           -- (managed by audit.py) append-only event list
"""

from __future__ import annotations

import json
import time
import uuid
from datetime import datetime, timezone
from typing import Optional

import redis.asyncio as aioredis

from models import (
    AuditEventType,
    CreateHoldRequest,
    HoldInfo,
    HoldTargetType,
    SelfDestructMode,
    StoreKeyRequest,
)
import audit


# ── DEK operations ───────────────────────────────────────────────────────────


async def store_dek(
    r: aioredis.Redis,
    req: StoreKeyRequest,
) -> str:
    """Persist an encrypted DEK with a TTL. Returns the generated key_id."""
    key_id = str(uuid.uuid4())

    meta = {
        "message_id": req.message_id,
        "mode": req.mode.value,
        "original_ttl": req.ttl_seconds,
        "post_read_ttl": req.post_read_ttl_seconds,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    pipe = r.pipeline(transaction=True)
    pipe.set(f"email:{key_id}:dek", req.dek_encrypted, ex=req.ttl_seconds)
    pipe.set(f"email:{key_id}:meta", json.dumps(meta), ex=req.ttl_seconds)
    await pipe.execute()

    await audit.record_event(
        r,
        key_id,
        AuditEventType.KEY_CREATED,
        metadata={"mode": req.mode.value, "ttl": req.ttl_seconds},
    )
    return key_id


async def fetch_dek(r: aioredis.Redis, key_id: str) -> Optional[tuple[str, int]]:
    """Return (dek_encrypted, remaining_ttl) or None if expired/missing."""
    dek = await r.get(f"email:{key_id}:dek")
    if dek is None:
        return None

    ttl = await r.ttl(f"email:{key_id}:dek")
    remaining = max(ttl, 0)

    # Check mode for read_once
    raw_meta = await r.get(f"email:{key_id}:meta")
    if raw_meta:
        meta = json.loads(raw_meta)
        if meta.get("mode") == SelfDestructMode.READ_ONCE.value:
            # Delete key immediately after read
            await destroy_dek(r, key_id, audit_event=False)
            await audit.record_event(
                r, key_id, AuditEventType.KEY_FETCHED,
                metadata={"read_once_destroyed": True},
            )
            return (dek if isinstance(dek, str) else dek.decode(), 0)

    await audit.record_event(r, key_id, AuditEventType.KEY_FETCHED)
    return (dek if isinstance(dek, str) else dek.decode(), remaining)


async def destroy_dek(
    r: aioredis.Redis,
    key_id: str,
    audit_event: bool = True,
) -> bool:
    """Immediately destroy a DEK. Returns True if a key was deleted."""
    pipe = r.pipeline(transaction=True)
    pipe.delete(f"email:{key_id}:dek")
    pipe.delete(f"email:{key_id}:meta")
    pipe.delete(f"rr:{key_id}")
    pipe.delete(f"frozen:{key_id}")
    results = await pipe.execute()

    destroyed = results[0] > 0
    if destroyed and audit_event:
        await audit.record_event(
            r, key_id, AuditEventType.KEY_DESTROYED,
        )
    return destroyed


# ── Read receipt ─────────────────────────────────────────────────────────────


async def apply_read_receipt(
    r: aioredis.Redis,
    key_id: str,
) -> Optional[int]:
    """Apply a read receipt, resetting TTL. Returns new TTL or None.

    Returns None if the key does not exist, has no post_read_ttl, or
    the receipt was already applied (caller should return 409).
    Returns -1 to signal a 409 conflict (already triggered).
    """
    # Check key exists
    dek = await r.get(f"email:{key_id}:dek")
    if dek is None:
        return None

    # One-shot enforcement
    already = await r.set(f"rr:{key_id}", "1", nx=True)
    if not already:
        return -1  # sentinel for 409

    raw_meta = await r.get(f"email:{key_id}:meta")
    if raw_meta is None:
        return None

    meta = json.loads(raw_meta)
    post_ttl = meta.get("post_read_ttl")
    if post_ttl is None:
        # No post-read TTL configured; use a default short window
        post_ttl = 30

    pipe = r.pipeline(transaction=True)
    pipe.expire(f"email:{key_id}:dek", post_ttl)
    pipe.expire(f"email:{key_id}:meta", post_ttl)
    pipe.expire(f"rr:{key_id}", post_ttl)
    await pipe.execute()

    await audit.record_event(
        r, key_id, AuditEventType.READ_RECEIPT,
        metadata={"new_ttl": post_ttl},
    )
    return post_ttl


# ── Legal hold ───────────────────────────────────────────────────────────────


async def create_hold(
    r: aioredis.Redis,
    req: CreateHoldRequest,
) -> str:
    """Freeze TTL for a target. Returns hold_id."""
    hold_id = str(uuid.uuid4())
    hold_info = {
        "hold_id": hold_id,
        "target_type": req.target_type.value,
        "target_id": req.target_id,
        "reason": req.reason,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    pipe = r.pipeline(transaction=True)
    pipe.set(f"hold:{hold_id}", json.dumps(hold_info))
    pipe.sadd("hold:index", hold_id)
    pipe.sadd(f"hold:target:{req.target_id}", hold_id)
    await pipe.execute()

    # Freeze all matching keys
    if req.target_type == HoldTargetType.MESSAGE:
        await _freeze_keys_for_target(r, req.target_id, hold_id)
    # For account holds, keys must be checked at fetch time (or by a scanner)

    return hold_id


async def release_hold(r: aioredis.Redis, hold_id: str) -> bool:
    """Release a legal hold and resume TTL countdown. Returns False if not found."""
    raw = await r.get(f"hold:{hold_id}")
    if raw is None:
        return False

    hold_info = json.loads(raw)
    target_id = hold_info["target_id"]

    pipe = r.pipeline(transaction=True)
    pipe.delete(f"hold:{hold_id}")
    pipe.srem("hold:index", hold_id)
    pipe.srem(f"hold:target:{target_id}", hold_id)
    await pipe.execute()

    # Check if any other holds remain for this target
    remaining_holds = await r.scard(f"hold:target:{target_id}")
    if remaining_holds == 0:
        await _unfreeze_keys_for_target(r, target_id, hold_id)

    return True


async def list_holds(r: aioredis.Redis) -> list[HoldInfo]:
    """Return all active holds."""
    hold_ids = await r.smembers("hold:index")
    holds: list[HoldInfo] = []
    for hid in hold_ids:
        hid_str = hid if isinstance(hid, str) else hid.decode()
        raw = await r.get(f"hold:{hid_str}")
        if raw:
            data = json.loads(raw)
            holds.append(HoldInfo(**data))
    return holds


async def is_held(r: aioredis.Redis, target_id: str) -> bool:
    """Check if a target has any active legal hold."""
    return await r.scard(f"hold:target:{target_id}") > 0


# ── Internal helpers ─────────────────────────────────────────────────────────


async def _freeze_keys_for_target(
    r: aioredis.Redis,
    target_id: str,
    hold_id: str,
) -> None:
    """Snapshot remaining TTL and persist keys matching *target_id*."""
    # Scan for keys whose meta contains this message_id
    async for raw_key in r.scan_iter(match="email:*:meta"):
        key_str = raw_key if isinstance(raw_key, str) else raw_key.decode()
        raw_meta = await r.get(key_str)
        if raw_meta is None:
            continue
        meta = json.loads(raw_meta)
        if meta.get("message_id") != target_id:
            continue

        key_id = key_str.split(":")[1]
        ttl = await r.ttl(f"email:{key_id}:dek")
        if ttl > 0:
            await r.set(f"frozen:{key_id}", str(ttl))
        # Remove expiry (persist)
        await r.persist(f"email:{key_id}:dek")
        await r.persist(f"email:{key_id}:meta")

        await audit.record_event(
            r, key_id, AuditEventType.HOLD_APPLIED,
            metadata={"hold_id": hold_id, "frozen_ttl": ttl},
        )


async def _unfreeze_keys_for_target(
    r: aioredis.Redis,
    target_id: str,
    hold_id: str,
) -> None:
    """Re-apply TTL to keys that were frozen for *target_id*."""
    async for raw_key in r.scan_iter(match="email:*:meta"):
        key_str = raw_key if isinstance(raw_key, str) else raw_key.decode()
        raw_meta = await r.get(key_str)
        if raw_meta is None:
            continue
        meta = json.loads(raw_meta)
        if meta.get("message_id") != target_id:
            continue

        key_id = key_str.split(":")[1]
        frozen_ttl_raw = await r.get(f"frozen:{key_id}")
        if frozen_ttl_raw is None:
            continue

        frozen_ttl = int(frozen_ttl_raw)
        pipe = r.pipeline(transaction=True)
        pipe.expire(f"email:{key_id}:dek", frozen_ttl)
        pipe.expire(f"email:{key_id}:meta", frozen_ttl)
        pipe.delete(f"frozen:{key_id}")
        await pipe.execute()

        await audit.record_event(
            r, key_id, AuditEventType.HOLD_RELEASED,
            metadata={"hold_id": hold_id, "resumed_ttl": frozen_ttl},
        )
