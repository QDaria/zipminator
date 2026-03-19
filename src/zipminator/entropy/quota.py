"""
Entropy Quota Management

Tracks per-user entropy consumption against subscription tier allowances.
Supports monthly quotas with pay-as-you-go overage.

Quota storage: local JSON file per user/API key.
In production, this would be backed by a database on api.zipminator.zip.

Tier Allowances (monthly):
    Free (Amir):        1 MB/month
    Developer (Nils):   10 MB/month
    Pro (Solveig):      100 MB/month
    Enterprise:         Unlimited

Pay-as-you-go overage: $0.01/KB beyond monthly allowance.
"""

import json
import logging
import os
import time
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Monthly entropy allowances per tier (in bytes)
TIER_QUOTAS = {
    "amir": 1 * 1024 * 1024,          # 1 MB
    "nils": 10 * 1024 * 1024,          # 10 MB
    "solveig": 100 * 1024 * 1024,      # 100 MB
    "robindra": None,                   # Unlimited
}

OVERAGE_RATE_PER_KB = 0.01  # $0.01/KB beyond monthly limit

QUOTA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "quantum_entropy" / "quotas"


@dataclass
class QuotaUsage:
    """Tracks entropy usage for a billing period."""
    user_id: str
    tier: str
    period: str  # YYYY-MM
    bytes_consumed: int = 0
    bytes_overage: int = 0
    overage_cost_usd: float = 0.0
    last_updated: str = ""

    @property
    def monthly_allowance(self) -> Optional[int]:
        return TIER_QUOTAS.get(self.tier)

    @property
    def bytes_remaining(self) -> Optional[int]:
        allowance = self.monthly_allowance
        if allowance is None:
            return None  # Unlimited
        return max(0, allowance - self.bytes_consumed)

    @property
    def is_over_quota(self) -> bool:
        allowance = self.monthly_allowance
        if allowance is None:
            return False
        return self.bytes_consumed > allowance


class EntropyQuotaManager:
    """
    Manages entropy consumption quotas per user per billing period.

    Usage:
        mgr = EntropyQuotaManager()

        # Check before dispensing entropy
        can_use, msg = mgr.check_quota("user-123", "amir", 1024)
        if can_use:
            entropy_bytes = get_entropy(1024)
            mgr.record_usage("user-123", "amir", 1024)

        # Get current usage
        usage = mgr.get_usage("user-123", "amir")
        print(f"Used: {usage.bytes_consumed}, Remaining: {usage.bytes_remaining}")
    """

    def __init__(self, quota_dir: Path = QUOTA_DIR):
        self.quota_dir = quota_dir
        self.quota_dir.mkdir(parents=True, exist_ok=True)

    def _current_period(self) -> str:
        """Current billing period as YYYY-MM."""
        return datetime.now(timezone.utc).strftime("%Y-%m")

    def _quota_path(self, user_id: str, period: str) -> Path:
        """Path to quota file for a user/period."""
        safe_id = user_id.replace("/", "_").replace("\\", "_")
        return self.quota_dir / f"{safe_id}_{period}.json"

    def get_usage(self, user_id: str, tier: str, period: Optional[str] = None) -> QuotaUsage:
        """Get current usage for a user in a billing period."""
        if period is None:
            period = self._current_period()

        path = self._quota_path(user_id, period)
        if path.exists():
            with open(path) as f:
                data = json.load(f)
                return QuotaUsage(**data)

        return QuotaUsage(
            user_id=user_id,
            tier=tier,
            period=period,
        )

    def _save_usage(self, usage: QuotaUsage) -> None:
        """Persist usage to disk."""
        path = self._quota_path(usage.user_id, usage.period)
        with open(path, "w") as f:
            json.dump(asdict(usage), f, indent=2)

    def check_quota(
        self, user_id: str, tier: str, requested_bytes: int, allow_overage: bool = True
    ) -> tuple:
        """
        Check if a user can consume the requested entropy.

        Args:
            user_id: User identifier (API key hash or activation code)
            tier: Subscription tier (amir, nils, solveig, robindra)
            requested_bytes: How many entropy bytes requested
            allow_overage: If True, allow pay-as-you-go beyond quota

        Returns:
            (allowed: bool, message: str or None)
        """
        usage = self.get_usage(user_id, tier)
        allowance = TIER_QUOTAS.get(tier)

        # Unlimited tier
        if allowance is None:
            return True, None

        remaining = max(0, allowance - usage.bytes_consumed)

        if requested_bytes <= remaining:
            return True, None

        if allow_overage:
            overage_bytes = requested_bytes - remaining
            overage_cost = (overage_bytes / 1024) * OVERAGE_RATE_PER_KB
            return True, (
                f"Request exceeds monthly allowance by {overage_bytes:,} bytes. "
                f"Overage cost: ${overage_cost:.4f} (${OVERAGE_RATE_PER_KB}/KB). "
                f"Set allow_overage=False to block overage."
            )

        return False, (
            f"Monthly entropy quota exceeded. "
            f"Used: {usage.bytes_consumed:,}/{allowance:,} bytes. "
            f"Requested: {requested_bytes:,} bytes. "
            f"Upgrade tier or enable pay-as-you-go overage."
        )

    def record_usage(self, user_id: str, tier: str, bytes_consumed: int) -> QuotaUsage:
        """
        Record entropy consumption for billing.

        Returns updated QuotaUsage.
        """
        usage = self.get_usage(user_id, tier)
        usage.bytes_consumed += bytes_consumed
        usage.last_updated = datetime.now(timezone.utc).isoformat()

        allowance = TIER_QUOTAS.get(tier)
        if allowance is not None and usage.bytes_consumed > allowance:
            usage.bytes_overage = usage.bytes_consumed - allowance
            usage.overage_cost_usd = (usage.bytes_overage / 1024) * OVERAGE_RATE_PER_KB
        else:
            usage.bytes_overage = 0
            usage.overage_cost_usd = 0.0

        self._save_usage(usage)
        return usage

    def get_tier_info(self, tier: str) -> dict:
        """Get quota details for a tier."""
        allowance = TIER_QUOTAS.get(tier)
        return {
            "tier": tier,
            "monthly_allowance_bytes": allowance,
            "monthly_allowance_human": _human_bytes(allowance) if allowance else "Unlimited",
            "overage_rate_per_kb_usd": OVERAGE_RATE_PER_KB if allowance else 0,
        }

    def list_all_quotas(self) -> list:
        """Get quota info for all tiers."""
        return [self.get_tier_info(tier) for tier in TIER_QUOTAS]


def _human_bytes(n: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"
