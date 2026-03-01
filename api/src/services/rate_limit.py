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

        # Use sorted set to track requests
        redis_key = f"rate_limit:{key}"

        # Remove old entries
        self.redis_client.zremrangebyscore(redis_key, 0, window_start.timestamp())

        # Count requests in current window
        current_count = self.redis_client.zcard(redis_key)

        if current_count >= limit:
            return False

        # Add current request
        self.redis_client.zadd(redis_key, {str(now.timestamp()): now.timestamp()})

        # Set expiration
        self.redis_client.expire(redis_key, window_seconds)

        return True

    def get_remaining_requests(self, key: str, limit: int, window_seconds: int = 3600) -> int:
        """
        Get number of remaining requests in current window

        Args:
            key: Unique identifier
            limit: Maximum requests allowed
            window_seconds: Time window in seconds

        Returns:
            Number of remaining requests
        """
        now = datetime.utcnow()
        window_start = now - timedelta(seconds=window_seconds)

        redis_key = f"rate_limit:{key}"

        # Remove old entries
        self.redis_client.zremrangebyscore(redis_key, 0, window_start.timestamp())

        # Count requests
        current_count = self.redis_client.zcard(redis_key)

        return max(0, limit - current_count)


# Singleton instance
rate_limiter = RateLimiter()
