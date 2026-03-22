"""
Tests for entropy quota management and harvester scheduler.
"""

import json
import os
import pytest
from pathlib import Path
from unittest.mock import patch

from zipminator.entropy.quota import (
    EntropyQuotaManager,
    QuotaUsage,
    TIER_QUOTAS,
    OVERAGE_RATE_PER_KB,
)
from zipminator.entropy.scheduler import (
    harvest_quantum,
    get_pool_stats,
    get_budget_status,
    _get_pool_size,
    _append_to_pool,
    _check_budget,
    _estimate_qpu_seconds,
    _record_qpu_usage,
    _load_budget,
    _save_budget,
    _current_month,
    ENTROPY_POOL,
    ENTROPY_DIR,
    BUDGET_FILE,
    DEFAULT_QPU_BUDGET_SECONDS,
)


@pytest.fixture
def tmp_quota_dir(tmp_path):
    return tmp_path / "quotas"


@pytest.fixture
def quota_mgr(tmp_quota_dir):
    return EntropyQuotaManager(quota_dir=tmp_quota_dir)


# ─── Quota Tier Configuration ───


class TestTierQuotas:
    def test_free_tier_1mb(self):
        assert TIER_QUOTAS["amir"] == 1 * 1024 * 1024

    def test_developer_tier_10mb(self):
        assert TIER_QUOTAS["nils"] == 10 * 1024 * 1024

    def test_pro_tier_100mb(self):
        assert TIER_QUOTAS["solveig"] == 100 * 1024 * 1024

    def test_enterprise_unlimited(self):
        assert TIER_QUOTAS["robindra"] is None

    def test_list_all_quotas(self, quota_mgr):
        quotas = quota_mgr.list_all_quotas()
        assert len(quotas) == 4
        enterprise = [q for q in quotas if q["tier"] == "robindra"][0]
        assert enterprise["monthly_allowance_human"] == "Unlimited"


# ─── Quota Check Logic ───


class TestQuotaCheck:
    def test_within_quota(self, quota_mgr):
        allowed, msg = quota_mgr.check_quota("user-1", "amir", 1024)
        assert allowed is True
        assert msg is None

    def test_exceeds_quota_with_overage(self, quota_mgr):
        # Consume most of the quota first
        quota_mgr.record_usage("user-1", "amir", 1024 * 1024 - 100)
        # Request more than remaining
        allowed, msg = quota_mgr.check_quota("user-1", "amir", 200)
        assert allowed is True
        assert "Overage" in msg

    def test_exceeds_quota_without_overage(self, quota_mgr):
        quota_mgr.record_usage("user-1", "amir", 1024 * 1024 - 100)
        allowed, msg = quota_mgr.check_quota("user-1", "amir", 200, allow_overage=False)
        assert allowed is False
        assert "exceeded" in msg.lower()

    def test_enterprise_always_allowed(self, quota_mgr):
        # Even absurd amounts
        allowed, msg = quota_mgr.check_quota("user-1", "robindra", 10 * 1024 * 1024 * 1024)
        assert allowed is True
        assert msg is None


# ─── Usage Recording ───


class TestUsageRecording:
    def test_record_increments(self, quota_mgr):
        quota_mgr.record_usage("user-1", "amir", 500)
        quota_mgr.record_usage("user-1", "amir", 300)
        usage = quota_mgr.get_usage("user-1", "amir")
        assert usage.bytes_consumed == 800

    def test_overage_calculation(self, quota_mgr):
        limit = TIER_QUOTAS["amir"]
        overage = 2048
        quota_mgr.record_usage("user-1", "amir", limit + overage)
        usage = quota_mgr.get_usage("user-1", "amir")
        assert usage.bytes_overage == overage
        expected_cost = (overage / 1024) * OVERAGE_RATE_PER_KB
        assert abs(usage.overage_cost_usd - expected_cost) < 0.001

    def test_enterprise_no_overage(self, quota_mgr):
        quota_mgr.record_usage("user-1", "robindra", 999_999_999)
        usage = quota_mgr.get_usage("user-1", "robindra")
        assert usage.bytes_overage == 0
        assert usage.overage_cost_usd == 0.0

    def test_usage_persisted_to_disk(self, quota_mgr, tmp_quota_dir):
        quota_mgr.record_usage("user-1", "nils", 5000)
        # Find the file
        files = list(tmp_quota_dir.glob("user-1_*.json"))
        assert len(files) == 1
        data = json.loads(files[0].read_text())
        assert data["bytes_consumed"] == 5000


# ─── QuotaUsage Properties ───


class TestQuotaUsageProperties:
    def test_bytes_remaining(self):
        usage = QuotaUsage(user_id="u", tier="amir", period="2026-03", bytes_consumed=500_000)
        assert usage.bytes_remaining == TIER_QUOTAS["amir"] - 500_000

    def test_unlimited_remaining(self):
        usage = QuotaUsage(user_id="u", tier="robindra", period="2026-03", bytes_consumed=999)
        assert usage.bytes_remaining is None

    def test_is_over_quota(self):
        usage = QuotaUsage(
            user_id="u", tier="amir", period="2026-03",
            bytes_consumed=TIER_QUOTAS["amir"] + 1
        )
        assert usage.is_over_quota is True

    def test_not_over_quota(self):
        usage = QuotaUsage(user_id="u", tier="amir", period="2026-03", bytes_consumed=100)
        assert usage.is_over_quota is False


# ─── Harvester ───


class TestHarvester:
    def test_harvest_fallback_to_system(self, monkeypatch):
        """Without QBRAID_API_KEY, falls back to os.urandom."""
        monkeypatch.delenv("QBRAID_API_KEY", raising=False)
        record = harvest_quantum(target_bytes=1024)
        assert record["backend"] == "os.urandom"
        assert record["bytes_harvested"] == 1024
        assert record["pool_after"] > record["pool_before"]

    def test_pool_stats(self):
        stats = get_pool_stats()
        assert "pool_size_bytes" in stats
        assert "pool_size_human" in stats
        assert "total_harvests" in stats


# ─── Quota + Subscription Integration ───


class TestQuotaSubscriptionMapping:
    """Verify quota tiers map correctly to subscription tiers."""

    def test_tier_names_match_subscription(self):
        from zipminator.crypto.subscription import SubscriptionTier
        sub_tiers = {t.value for t in SubscriptionTier}
        quota_tiers = set(TIER_QUOTAS.keys())
        assert quota_tiers == sub_tiers


# ─── IBM QPU Budget Guard ───


@pytest.fixture(autouse=False)
def clean_budget():
    """Remove budget file before and after each budget test."""
    if BUDGET_FILE.exists():
        BUDGET_FILE.unlink()
    yield
    if BUDGET_FILE.exists():
        BUDGET_FILE.unlink()


class TestQPUBudgetGuard:
    """Tests for the IBM QPU credit guard that prevents exceeding 10 min free tier."""

    def test_default_budget_is_480_seconds(self, clean_budget):
        assert DEFAULT_QPU_BUDGET_SECONDS == 480

    def test_budget_starts_empty(self, clean_budget):
        status = get_budget_status()
        assert status["used_seconds"] == 0.0
        assert status["month"] == _current_month()
        assert status["jobs_this_month"] == 0

    def test_estimate_qpu_seconds(self):
        est = _estimate_qpu_seconds(10_000)
        assert est == 10.0  # 0.001s/shot * 10000

    def test_check_budget_passes_when_empty(self, clean_budget):
        assert _check_budget(100.0) is True

    def test_check_budget_blocks_when_exceeded(self, clean_budget):
        _record_qpu_usage("ibm_fez", 50000, 475.0)
        assert _check_budget(10.0) is False  # 475 + 10 = 485 > 480

    def test_record_actual_usage(self, clean_budget):
        _record_qpu_usage("ibm_fez", 5000, 4.2)
        status = get_budget_status()
        assert status["used_seconds"] == 4.2
        assert status["jobs_this_month"] == 1

    def test_record_estimated_usage_when_no_actual(self, clean_budget):
        _record_qpu_usage("qbraid:ibm_fez", 5000, None)
        status = get_budget_status()
        assert status["used_seconds"] == 5.0  # 5000 * 0.001

    def test_cumulative_tracking(self, clean_budget):
        _record_qpu_usage("ibm_fez", 1000, 1.0)
        _record_qpu_usage("ibm_marrakesh", 2000, 2.5)
        _record_qpu_usage("ibm_fez", 3000, 3.0)
        status = get_budget_status()
        assert status["used_seconds"] == 6.5
        assert status["jobs_this_month"] == 3

    def test_budget_env_override(self, clean_budget, monkeypatch):
        monkeypatch.setenv("IBM_QPU_BUDGET_SECONDS", "60")
        _record_qpu_usage("ibm_fez", 50000, 55.0)
        assert _check_budget(10.0) is False  # 55 + 10 > 60
        assert _check_budget(4.0) is True   # 55 + 4 < 60

    def test_month_rollover_resets(self, clean_budget):
        budget = _load_budget()
        budget["month"] = "2025-01"  # old month
        budget["cumulative_seconds"] = 999.0
        _save_budget(budget)
        # Loading for current month should reset
        fresh = _load_budget()
        assert fresh["month"] == _current_month()
        assert fresh["cumulative_seconds"] == 0.0

    def test_remaining_seconds(self, clean_budget):
        _record_qpu_usage("ibm_fez", 10000, 100.0)
        status = get_budget_status()
        assert status["remaining_seconds"] == 380.0  # 480 - 100

    def test_percent_used(self, clean_budget):
        _record_qpu_usage("ibm_fez", 10000, 240.0)
        status = get_budget_status()
        assert status["percent_used"] == 50.0
