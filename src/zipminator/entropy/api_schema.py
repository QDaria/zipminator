"""
Pydantic models for the entropy REST API.

These schemas define request/response contracts for the
``/api/v1/entropy`` endpoint. They are used by the FastAPI
backend in ``api/`` and by SDK clients for validation.

Pydantic is an optional dependency (not in core). Import
errors are caught so the rest of the entropy package loads
cleanly without it.
"""

try:
    from pydantic import BaseModel, Field
except ImportError:
    raise ImportError(
        "pydantic is required for API schema models. "
        "Install it with: uv pip install 'zipminator[api]'  "
        "or: uv pip install pydantic>=2"
    )


class EntropyRequest(BaseModel):
    """Incoming request for entropy bytes."""

    bytes: int = Field(
        ge=1,
        le=1_048_576,
        description="Number of entropy bytes requested (1 B to 1 MB)",
    )
    api_key: str = Field(
        min_length=16,
        description="API key for authentication and quota tracking",
    )
    source: str = Field(
        default="auto",
        description=(
            "Preferred entropy source. "
            "One of: auto, pool, quantum, os. "
            "'auto' selects the best available source."
        ),
    )


class EntropyResponse(BaseModel):
    """Response containing hex-encoded entropy."""

    entropy: str = Field(
        description="Hex-encoded entropy bytes",
    )
    source: str = Field(
        description="Actual entropy source that fulfilled the request",
    )
    freshness_hours: float = Field(
        description="Hours since the entropy pool was last refreshed",
    )
    quota_remaining: int = Field(
        description="Bytes remaining in the caller's monthly quota",
    )
    pool_bytes_remaining: int = Field(
        description="Unread bytes remaining in the entropy pool file",
    )
