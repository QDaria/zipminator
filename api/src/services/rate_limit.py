import redis
from datetime import datetime, timedelta
from typing import Optional
from src.config import settings


class RateLimiter:
    """Redis-based rate limiter"""

    def __init__(self):
        self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

    def check_rate_limit(self, key: str, limit: int, window_seconds: int = 3600) -> bool:
        """
        Check if rate limit is exceeded

        Args:
            key: Unique identifier (e.g., API key hash)
            limit: Maximum requests allowed
            window_seconds: Time window in seconds (default 1 hour)

        Returns:
            True if request is allowed, False if rate limit exceeded
        """
        now = datetime.utcnow()
        window_start = now - timedelta(seconds=window_seconds)

        redis_key = f"rate_limit:{key}"

        self.redis_client.zremrangebyscore(redis_key, 0, window_start.timestamp())
        current_count = self.redis_client.zcard(redis_key)

        if current_count >= limit:
            return False

        self.redis_client.zadd(redis_key, {str(now.timestamp()): now.timestamp()})
        self.redis_client.expire(redis_key, window_seconds)

        return True

    def get_remaining_requests(self, key: str, limit: int, window_seconds: int = 3600) -> int:
        """Get number of remaining requests in current window"""
        now = datetime.utcnow()
        window_start = now - timedelta(seconds=window_seconds)

        redis_key = f"rate_limit:{key}"
        self.redis_client.zremrangebyscore(redis_key, 0, window_start.timestamp())
        current_count = self.redis_client.zcard(redis_key)

        return max(0, limit - current_count)


# Lazy singleton -- only initialize when first accessed (avoids crash if Redis is down)
_rate_limiter: Optional[RateLimiter] = None


def get_rate_limiter() -> RateLimiter:
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RateLimiter()
    return _rate_limiter
