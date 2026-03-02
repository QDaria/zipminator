"""Tests for the Zipminator Email KMS service.

Requires a running Redis instance on localhost:6380 for integration tests,
OR uses fakeredis for unit tests (preferred for CI).
"""

from __future__ import annotations

import asyncio
import json
import sys
import os
import time

import pytest
import pytest_asyncio

# Add KMS source to path so we can import modules directly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "email", "kms"))

from models import (
    AuditEventType,
    HoldTargetType,
    SelfDestructMode,
    StoreKeyRequest,
    CreateHoldRequest,
)
import audit
import store


# ── Fixtures ─────────────────────────────────────────────────────────────────


@pytest_asyncio.fixture
async def redis_client():
    """Create a fakeredis client for isolated, fast tests."""
    try:
        import fakeredis.aioredis as fakeredis_aio

        r = fakeredis_aio.FakeRedis(decode_responses=True)
    except ImportError:
        # Fall back to real Redis on localhost:6380
        import redis.asyncio as aioredis

        r = aioredis.from_url("redis://localhost:6380", decode_responses=True)
        await r.flushdb()

    yield r
    await r.aclose()


def _make_store_request(
    mode: SelfDestructMode = SelfDestructMode.AFTER_SEND,
    ttl: int = 60,
    post_read_ttl: int | None = None,
    message_id: str = "msg-001",
) -> StoreKeyRequest:
    return StoreKeyRequest(
        message_id=message_id,
        dek_encrypted="dGVzdC1kZWstZW5jcnlwdGVk",  # base64("test-dek-encrypted")
        ttl_seconds=ttl,
        mode=mode,
        post_read_ttl_seconds=post_read_ttl,
    )


# ── Store & Fetch ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_store_and_fetch(redis_client):
    """Store a DEK and fetch it back."""
    req = _make_store_request()
    key_id = await store.store_dek(redis_client, req)

    assert key_id is not None
    result = await store.fetch_dek(redis_client, key_id)
    assert result is not None

    dek, ttl = result
    assert dek == "dGVzdC1kZWstZW5jcnlwdGVk"
    assert ttl > 0


@pytest.mark.asyncio
async def test_fetch_nonexistent_key(redis_client):
    """Fetching a key that doesn't exist returns None."""
    result = await store.fetch_dek(redis_client, "nonexistent-key-id")
    assert result is None


# ── TTL expiration ───────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_ttl_expiration(redis_client):
    """Key becomes unavailable after TTL expires."""
    req = _make_store_request(ttl=1)
    key_id = await store.store_dek(redis_client, req)

    # Key should exist immediately
    result = await store.fetch_dek(redis_client, key_id)
    assert result is not None

    # Wait for expiration
    await asyncio.sleep(1.5)

    result = await store.fetch_dek(redis_client, key_id)
    assert result is None


# ── Read-once mode ───────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_read_once_destroys_after_fetch(redis_client):
    """In read_once mode, the DEK is deleted after the first fetch."""
    req = _make_store_request(mode=SelfDestructMode.READ_ONCE, ttl=300)
    key_id = await store.store_dek(redis_client, req)

    # First fetch succeeds
    result = await store.fetch_dek(redis_client, key_id)
    assert result is not None
    dek, _ = result
    assert dek == "dGVzdC1kZWstZW5jcnlwdGVk"

    # Second fetch fails (key destroyed)
    result = await store.fetch_dek(redis_client, key_id)
    assert result is None


# ── Read receipt ─────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_read_receipt_resets_ttl(redis_client):
    """Read receipt resets the TTL to post_read_ttl_seconds."""
    req = _make_store_request(
        mode=SelfDestructMode.AFTER_READ,
        ttl=300,
        post_read_ttl=10,
    )
    key_id = await store.store_dek(redis_client, req)

    new_ttl = await store.apply_read_receipt(redis_client, key_id)
    assert new_ttl == 10


@pytest.mark.asyncio
async def test_read_receipt_one_shot(redis_client):
    """Second read receipt returns -1 (conflict sentinel)."""
    req = _make_store_request(
        mode=SelfDestructMode.AFTER_READ,
        ttl=300,
        post_read_ttl=10,
    )
    key_id = await store.store_dek(redis_client, req)

    # First receipt succeeds
    result = await store.apply_read_receipt(redis_client, key_id)
    assert result == 10

    # Second receipt returns -1 (409 conflict)
    result = await store.apply_read_receipt(redis_client, key_id)
    assert result == -1


@pytest.mark.asyncio
async def test_read_receipt_expired_key(redis_client):
    """Read receipt on nonexistent key returns None."""
    result = await store.apply_read_receipt(redis_client, "nonexistent")
    assert result is None


# ── Immediate destruction ────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_destroy_key(redis_client):
    """Immediate destruction removes the key."""
    req = _make_store_request(ttl=300)
    key_id = await store.store_dek(redis_client, req)

    destroyed = await store.destroy_dek(redis_client, key_id)
    assert destroyed is True

    result = await store.fetch_dek(redis_client, key_id)
    assert result is None


@pytest.mark.asyncio
async def test_destroy_nonexistent_key(redis_client):
    """Destroying a nonexistent key returns False."""
    destroyed = await store.destroy_dek(redis_client, "nonexistent")
    assert destroyed is False


# ── Legal hold ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_legal_hold_freeze(redis_client):
    """A legal hold persists the key past its original TTL."""
    req = _make_store_request(ttl=2, message_id="msg-hold-test")
    key_id = await store.store_dek(redis_client, req)

    # Apply hold
    hold_req = CreateHoldRequest(
        target_type=HoldTargetType.MESSAGE,
        target_id="msg-hold-test",
        reason="Legal investigation",
    )
    hold_id = await store.create_hold(redis_client, hold_req)
    assert hold_id is not None

    # Wait past original TTL
    await asyncio.sleep(2.5)

    # Key should still exist (frozen)
    result = await store.fetch_dek(redis_client, key_id)
    assert result is not None


@pytest.mark.asyncio
async def test_legal_hold_release(redis_client):
    """Releasing a hold re-applies the frozen TTL."""
    req = _make_store_request(ttl=60, message_id="msg-release-test")
    key_id = await store.store_dek(redis_client, req)

    hold_req = CreateHoldRequest(
        target_type=HoldTargetType.MESSAGE,
        target_id="msg-release-test",
        reason="Subpoena compliance",
    )
    hold_id = await store.create_hold(redis_client, hold_req)

    released = await store.release_hold(redis_client, hold_id)
    assert released is True

    # Key should now have a TTL again
    ttl = await redis_client.ttl(f"email:{key_id}:dek")
    assert ttl > 0


@pytest.mark.asyncio
async def test_list_holds(redis_client):
    """Listing holds returns all active holds."""
    hold_req = CreateHoldRequest(
        target_type=HoldTargetType.ACCOUNT,
        target_id="acct-123",
        reason="Internal audit",
    )
    await store.create_hold(redis_client, hold_req)

    holds = await store.list_holds(redis_client)
    assert len(holds) >= 1
    assert any(h.target_id == "acct-123" for h in holds)


@pytest.mark.asyncio
async def test_release_nonexistent_hold(redis_client):
    """Releasing a nonexistent hold returns False."""
    released = await store.release_hold(redis_client, "nonexistent")
    assert released is False


# ── Audit log ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_audit_log_records_events(redis_client):
    """Store, fetch, and destroy cycle produces correct audit events."""
    req = _make_store_request(ttl=300)
    key_id = await store.store_dek(redis_client, req)

    await store.fetch_dek(redis_client, key_id)
    await store.destroy_dek(redis_client, key_id)

    events = await audit.get_events(redis_client, key_id)
    event_types = [e.event_type for e in events]

    assert AuditEventType.KEY_CREATED in event_types
    assert AuditEventType.KEY_FETCHED in event_types
    assert AuditEventType.KEY_DESTROYED in event_types


@pytest.mark.asyncio
async def test_audit_log_empty_for_unknown_key(redis_client):
    """Audit log for an unknown key returns empty list."""
    events = await audit.get_events(redis_client, "unknown-key")
    assert events == []


@pytest.mark.asyncio
async def test_audit_log_records_read_receipt(redis_client):
    """Read receipt generates an audit event."""
    req = _make_store_request(
        mode=SelfDestructMode.AFTER_READ,
        ttl=300,
        post_read_ttl=10,
    )
    key_id = await store.store_dek(redis_client, req)
    await store.apply_read_receipt(redis_client, key_id)

    events = await audit.get_events(redis_client, key_id)
    event_types = [e.event_type for e in events]
    assert AuditEventType.READ_RECEIPT in event_types


@pytest.mark.asyncio
async def test_audit_log_records_hold_events(redis_client):
    """Hold apply/release generate audit events."""
    req = _make_store_request(ttl=300, message_id="msg-audit-hold")
    key_id = await store.store_dek(redis_client, req)

    hold_req = CreateHoldRequest(
        target_type=HoldTargetType.MESSAGE,
        target_id="msg-audit-hold",
        reason="Compliance",
    )
    hold_id = await store.create_hold(redis_client, hold_req)
    await store.release_hold(redis_client, hold_id)

    events = await audit.get_events(redis_client, key_id)
    event_types = [e.event_type for e in events]

    assert AuditEventType.HOLD_APPLIED in event_types
    assert AuditEventType.HOLD_RELEASED in event_types
