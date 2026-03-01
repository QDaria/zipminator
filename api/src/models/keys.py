from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class APIKeyCreate(BaseModel):
    """API key creation request"""

    name: str = Field(..., min_length=1, max_length=100)
    rate_limit: int = Field(default=1000, ge=1, le=10000)


class APIKeyResponse(BaseModel):
    """API key response"""

    id: int
    name: str
    key: Optional[str] = None  # Only returned on creation
    rate_limit: int
    is_active: bool
    created_at: datetime
    last_used_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class APIKeyList(BaseModel):
    """List of API keys"""

    keys: list[APIKeyResponse]
    total: int
