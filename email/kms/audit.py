"""Append-only audit logger for DEK lifecycle events.

Events are stored in Redis lists keyed by `audit:{key_id}`.
No message content is ever recorded; only lifecycle metadata.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Optional

import redis.asyncio as aioredis

from models import AuditEvent, AuditEventType


async def record_event(
    r: aioredis.Redis,
    key_id: str,
    event_type: AuditEventType,
    actor: Optional[str] = None,
    metadata: Optional[dict] = None,
) -> None:
    """Append a lifecycle event to the audit log for *key_id*."""
    event = AuditEvent(
        key_id=key_id,
        event_type=event_type,
        timestamp_utc=datetime.now(timezone.utc).isoformat(),
        actor=actor,
        metadata=metadata,
    )
    await r.rpush(f"audit:{key_id}", event.model_dump_json())


async def get_events(r: aioredis.Redis, key_id: str) -> list[AuditEvent]:
    """Return all audit events for *key_id* in chronological order."""
    raw_events = await r.lrange(f"audit:{key_id}", 0, -1)
    return [AuditEvent.model_validate(json.loads(e)) for e in raw_events]
