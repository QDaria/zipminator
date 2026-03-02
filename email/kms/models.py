"""Pydantic models for the Email KMS service."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ── Enums ────────────────────────────────────────────────────────────────────


class SelfDestructMode(str, Enum):
    """When the DEK self-destructs."""

    AFTER_SEND = "after_send"
    AFTER_READ = "after_read"
    READ_ONCE = "read_once"


class AuditEventType(str, Enum):
    """Lifecycle events recorded in the audit log."""

    KEY_CREATED = "KEY_CREATED"
    KEY_FETCHED = "KEY_FETCHED"
    READ_RECEIPT = "READ_RECEIPT"
    HOLD_APPLIED = "HOLD_APPLIED"
    HOLD_RELEASED = "HOLD_RELEASED"
    KEY_DESTROYED = "KEY_DESTROYED"


class HoldTargetType(str, Enum):
    """What the legal hold targets."""

    ACCOUNT = "account"
    MESSAGE = "message"


# ── Request models ───────────────────────────────────────────────────────────


class StoreKeyRequest(BaseModel):
    message_id: str = Field(..., description="Unique email message identifier")
    dek_encrypted: str = Field(..., description="Base64-encoded encrypted DEK")
    ttl_seconds: int = Field(..., gt=0, description="Time-to-live in seconds")
    mode: SelfDestructMode = Field(..., description="Self-destruct trigger mode")
    post_read_ttl_seconds: Optional[int] = Field(
        None,
        gt=0,
        description="TTL after read receipt (only for after_read mode)",
    )


class CreateHoldRequest(BaseModel):
    target_type: HoldTargetType
    target_id: str = Field(..., description="account_id or message_id to freeze")
    reason: str = Field(..., min_length=1, description="Legal justification")


# ── Response models ──────────────────────────────────────────────────────────


class StoreKeyResponse(BaseModel):
    key_id: str


class FetchKeyResponse(BaseModel):
    dek_encrypted: str
    remaining_ttl: int


class ReadReceiptResponse(BaseModel):
    new_ttl: int


class DestroyKeyResponse(BaseModel):
    destroyed: bool = True


class CreateHoldResponse(BaseModel):
    hold_id: str


class HoldInfo(BaseModel):
    hold_id: str
    target_type: HoldTargetType
    target_id: str
    reason: str
    created_at: str


class ListHoldsResponse(BaseModel):
    holds: list[HoldInfo]


class AuditEvent(BaseModel):
    key_id: str
    event_type: AuditEventType
    timestamp_utc: str
    actor: Optional[str] = None
    metadata: Optional[dict] = None


class AuditLogResponse(BaseModel):
    events: list[AuditEvent]


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "zipminator-email-kms"
    redis_connected: bool = False


class ErrorResponse(BaseModel):
    detail: str
