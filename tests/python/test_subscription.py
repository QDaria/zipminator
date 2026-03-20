"""
Test suite for subscription management and API key gating.

Tests tier validation, activation codes, level access control, data limits,
and the new API key validation flow.
"""

import os
import pytest

from zipminator.crypto.subscription import (
    SubscriptionManager,
    SubscriptionTier,
    APIKeyValidator,
    TIER_FEATURES,
)


class TestTierConfiguration:
    def test_four_tiers_exist(self):
        assert len(SubscriptionTier) == 4

    def test_list_all_tiers(self):
        tiers = SubscriptionManager.list_all_tiers()
        assert len(tiers) == 4
        names = [t["public_name"] for t in tiers]
        assert names == ["Free", "Developer", "Pro", "Enterprise"]

    def test_free_tier_max_level_3(self):
        features = TIER_FEATURES[SubscriptionTier.DEVELOPERS]
        assert features.max_level == 3

    def test_enterprise_has_qrng(self):
        features = TIER_FEATURES[SubscriptionTier.ENTERPRISE]
        assert features.qrng_access is True

    def test_enterprise_unlimited_data(self):
        features = TIER_FEATURES[SubscriptionTier.ENTERPRISE]
        assert features.data_limit_gb is None


class TestActivationCodes:
    def test_free_level3_valid(self):
        result = SubscriptionManager.validate_activation_code("FREE-LEVEL3")
        assert result.valid is True
        assert result.tier == SubscriptionTier.DEVELOPERS
        assert result.level == 3

    def test_enterprise_level10_valid(self):
        result = SubscriptionManager.validate_activation_code("ENTERPRISE-LEVEL10")
        assert result.valid is True
        assert result.tier == SubscriptionTier.ENTERPRISE
        assert result.level == 10

    def test_beta_code_gets_enterprise(self):
        result = SubscriptionManager.validate_activation_code("BETA2026-LEVEL10")
        assert result.valid is True
        assert result.tier == SubscriptionTier.ENTERPRISE

    def test_invalid_format_rejected(self):
        result = SubscriptionManager.validate_activation_code("NOTACODE")
        assert result.valid is False

    def test_level_exceeds_tier(self):
        result = SubscriptionManager.validate_activation_code("FREE-LEVEL5")
        assert result.valid is False
        assert "exceeds" in result.error_message.lower() or "Upgrade" in result.error_message

    def test_level_out_of_range(self):
        result = SubscriptionManager.validate_activation_code("ENTERPRISE-LEVEL11")
        assert result.valid is False

    def test_case_insensitive(self):
        result = SubscriptionManager.validate_activation_code("free-level3")
        assert result.valid is True


class TestFreeTierL1L3NoKeyNeeded:
    """L1-L3 should always be accessible with a free activation code."""

    @pytest.mark.parametrize("level", [1, 2, 3])
    def test_free_tier_allows_l1_l3(self, level):
        allowed, msg = SubscriptionManager.can_use_level("FREE-LEVEL3", level)
        assert allowed is True
        assert msg is None


class TestL4DeniedWithoutKey:
    """L4+ requires at least PROFESSIONAL tier."""

    def test_free_cannot_use_l4(self):
        allowed, msg = SubscriptionManager.can_use_level("FREE-LEVEL3", 4)
        assert allowed is False

    def test_free_cannot_use_l7(self):
        allowed, msg = SubscriptionManager.can_use_level("FREE-LEVEL3", 7)
        assert allowed is False

    def test_pro_code_allows_l5(self):
        allowed, msg = SubscriptionManager.can_use_level("PRO-LEVEL5", 5)
        assert allowed is True


class TestActivationCodeStillWorks:
    """Existing activation code flow must continue to work."""

    def test_xraised_code_full_access(self):
        result = SubscriptionManager.validate_activation_code("XRAISED-LEVEL10")
        assert result.valid is True
        assert result.features.max_level == 10

    def test_ghstar_code_developer_tier(self):
        result = SubscriptionManager.validate_activation_code("GHSTAR-LEVEL5")
        assert result.valid is True
        assert result.tier == SubscriptionTier.PROFESSIONAL

    def test_custom_enterprise_code(self):
        result = SubscriptionManager.validate_activation_code("CUSTOMER123-LEVEL8")
        assert result.valid is True
        assert result.level == 8


class TestQRNGAccess:
    def test_enterprise_level10_has_qrng(self):
        assert SubscriptionManager.can_use_qrng("ENTERPRISE-LEVEL10") is True

    def test_free_has_qrng_early_adopter(self):
        # Early adopter: QRNG on all tiers
        assert SubscriptionManager.can_use_qrng("FREE-LEVEL3") is True

    def test_all_tiers_have_qrng_early_adopter(self):
        # Early adopter: QRNG on all tiers
        assert SubscriptionManager.can_use_qrng("PRO-LEVEL5") is True
        assert SubscriptionManager.can_use_qrng("TEAM-LEVEL7") is True
        assert SubscriptionManager.can_use_qrng("ENTERPRISE-LEVEL8") is True


class TestDataLimits:
    def test_free_tier_1gb_limit(self):
        within, msg = SubscriptionManager.check_data_limit("FREE-LEVEL3", 0.5)
        assert within is True

    def test_free_tier_exceeds_limit(self):
        within, msg = SubscriptionManager.check_data_limit("FREE-LEVEL3", 2.0)
        assert within is False

    def test_enterprise_unlimited(self):
        within, msg = SubscriptionManager.check_data_limit("ENTERPRISE-LEVEL10", 1000.0)
        assert within is True


class TestFeatureAccess:
    def test_enterprise_has_api_access(self):
        assert SubscriptionManager.has_feature_access("ENTERPRISE-LEVEL10", "api_access") is True

    def test_free_no_api_access(self):
        assert SubscriptionManager.has_feature_access("FREE-LEVEL3", "api_access") is False

    def test_invalid_code_no_access(self):
        assert SubscriptionManager.has_feature_access("INVALID", "api_access") is False


class TestAPIKeyValidation:
    """Tests for API key gating (env-var based, offline-first)."""

    def setup_method(self):
        APIKeyValidator.clear_cache()

    def test_offline_mode_env_var(self, monkeypatch):
        """ZIPMINATOR_OFFLINE=1 forces activation-code-only mode."""
        monkeypatch.setenv("ZIPMINATOR_OFFLINE", "1")
        assert APIKeyValidator.is_offline_mode() is True

    def test_offline_mode_default_off(self, monkeypatch):
        monkeypatch.delenv("ZIPMINATOR_OFFLINE", raising=False)
        assert APIKeyValidator.is_offline_mode() is False

    def test_api_key_env_var_exists(self, monkeypatch):
        """ZIPMINATOR_API_KEY env var should be readable."""
        monkeypatch.setenv("ZIPMINATOR_API_KEY", "test-key-123")
        assert APIKeyValidator.get_api_key() == "test-key-123"

    def test_api_key_env_var_missing(self, monkeypatch):
        monkeypatch.delenv("ZIPMINATOR_API_KEY", raising=False)
        assert APIKeyValidator.get_api_key() is None

    def test_free_tier_l1_l3_no_auth(self):
        """L1-3 always allowed without any auth."""
        for level in [1, 2, 3]:
            allowed, msg, method = APIKeyValidator.authorize_level(level)
            assert allowed is True
            assert method == "free_tier"

    def test_l4_denied_without_any_auth(self, monkeypatch):
        """L4+ denied when no API key and no activation code."""
        monkeypatch.delenv("ZIPMINATOR_API_KEY", raising=False)
        monkeypatch.delenv("ZIPMINATOR_OFFLINE", raising=False)
        allowed, msg, method = APIKeyValidator.authorize_level(4)
        assert allowed is False
        assert method == "denied"

    def test_l4_with_activation_code(self):
        """L4+ allowed with valid activation code."""
        allowed, msg, method = APIKeyValidator.authorize_level(
            5, activation_code="PRO-LEVEL5"
        )
        assert allowed is True
        assert method == "activation_code"

    def test_offline_mode_uses_activation_code(self, monkeypatch):
        """In offline mode, API key is skipped, activation code works."""
        monkeypatch.setenv("ZIPMINATOR_OFFLINE", "1")
        monkeypatch.setenv("ZIPMINATOR_API_KEY", "some-key")
        allowed, msg, method = APIKeyValidator.authorize_level(
            10, activation_code="ENTERPRISE-LEVEL10"
        )
        assert allowed is True
        assert method == "activation_code"

    def test_activation_code_insufficient(self, monkeypatch):
        """Activation code too low for requested level."""
        monkeypatch.delenv("ZIPMINATOR_API_KEY", raising=False)
        allowed, msg, method = APIKeyValidator.authorize_level(
            5, activation_code="FREE-LEVEL3"
        )
        assert allowed is False
        assert "activation_code_insufficient" in method
