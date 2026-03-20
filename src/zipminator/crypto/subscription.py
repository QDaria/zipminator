"""
Zipminator Subscription Management System

This module manages the 4-tier subscription system with activation code validation
and feature access control. It enforces tier-based limitations on anonymization
levels, quantum RNG access, and data processing limits.

Hybrid Naming (Public / Internal Character):
- Free / Amir (Developers): $0 with levels 1-3
- Developer / Nils (Professional): $9/mo early-adopter, $29/mo standard with levels 1-5
- Pro / Solveig (Teams): $29/mo early-adopter, $69/mo standard with levels 1-7
- Enterprise / Robindra: Custom ($5K-$50K/mo) with levels 1-10 + QRNG

License: MIT + Commercial (see LICENSE file)
"""

import os
import re
from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum


class SubscriptionTier(Enum):
    """Subscription tier levels with character names."""
    DEVELOPERS = "amir"      # Free ($0)
    PROFESSIONAL = "nils"    # Developer ($9/mo early, $29/mo standard)
    TEAMS = "solveig"        # Pro ($29/mo early, $69/mo standard)
    ENTERPRISE = "robindra"  # Enterprise (custom $5K-$50K/mo)


class AnonymizationLevel(Enum):
    """Anonymization techniques mapped to levels 1-10."""
    # Tier 1: Developers (Amir) - Free
    MINIMAL_MASKING = 1           # Replace with asterisks
    PARTIAL_REDACTION = 2         # Remove partial data
    STATIC_MASKING = 3            # Static replacement values

    # Tier 2: Developer (Nils) - $9/mo early, $29/mo standard
    HASH_BASED = 4                # SHA-256 hashing
    K_ANONYMITY = 5               # k-anonymity grouping

    # Tier 3: Pro (Solveig) - $29/mo early, $69/mo standard
    L_DIVERSITY = 6               # l-diversity protection
    T_CLOSENESS = 7               # t-closeness distribution

    # Tier 4: Enterprise (Robindra) - $5K-$50K/mo
    DIFFERENTIAL_PRIVACY = 8      # Differential privacy noise
    GENERALIZATION = 9            # Data generalization
    QUANTUM_PSEUDOANONYMIZATION = 10  # Quantum-enhanced + QRNG


@dataclass
class SubscriptionFeatures:
    """Features available for each subscription tier."""
    tier: SubscriptionTier
    character_name: str
    public_name: str
    max_level: int
    qrng_access: bool
    data_limit_gb: Optional[int]  # None = unlimited
    support_level: str
    api_access: bool
    team_features: bool
    sso_integration: bool
    custom_integrations: bool
    hsm_support: bool
    sla_guarantee: bool
    on_premise_deployment: bool
    price_monthly: Optional[str]  # None = contact sales
    price_monthly_standard: Optional[str] = None  # Post-beta price
    workshops: bool = False
    certifications: bool = False
    dedicated_csm: bool = False
    industry_certifications: Optional[List[str]] = None


# Tier configuration
TIER_FEATURES = {
    SubscriptionTier.DEVELOPERS: SubscriptionFeatures(
        tier=SubscriptionTier.DEVELOPERS,
        character_name="Amir",
        public_name="Free",
        max_level=3,
        qrng_access=True,  # Early adopter: QRNG on all tiers
        data_limit_gb=1,
        support_level="Community",
        api_access=False,
        team_features=False,
        sso_integration=False,
        custom_integrations=False,
        hsm_support=False,
        sla_guarantee=False,
        on_premise_deployment=False,
        price_monthly="$0",
        price_monthly_standard="$0",
    ),
    SubscriptionTier.PROFESSIONAL: SubscriptionFeatures(
        tier=SubscriptionTier.PROFESSIONAL,
        character_name="Nils",
        public_name="Developer",
        max_level=5,
        qrng_access=True,  # Early adopter: QRNG on all tiers
        data_limit_gb=10,
        support_level="Email",
        api_access=True,
        team_features=False,
        sso_integration=False,
        custom_integrations=False,
        hsm_support=False,
        sla_guarantee=False,
        on_premise_deployment=False,
        price_monthly="$9",
        price_monthly_standard="$29",
    ),
    SubscriptionTier.TEAMS: SubscriptionFeatures(
        tier=SubscriptionTier.TEAMS,
        character_name="Solveig",
        public_name="Pro",
        max_level=7,
        qrng_access=True,  # Early adopter: QRNG on all tiers
        data_limit_gb=100,
        support_level="Priority",
        api_access=True,
        team_features=True,
        sso_integration=True,
        custom_integrations=False,
        hsm_support=False,
        sla_guarantee=False,
        on_premise_deployment=False,
        price_monthly="$29",
        price_monthly_standard="$69",
    ),
    SubscriptionTier.ENTERPRISE: SubscriptionFeatures(
        tier=SubscriptionTier.ENTERPRISE,
        character_name="Robindra",
        public_name="Enterprise",
        max_level=10,
        qrng_access=True,
        data_limit_gb=None,  # Unlimited
        support_level="24/7 Dedicated",
        api_access=True,
        team_features=True,
        sso_integration=True,
        custom_integrations=True,
        hsm_support=True,
        sla_guarantee=True,
        on_premise_deployment=True,
        price_monthly="Custom",
        price_monthly_standard="$5,000-$50,000",
        workshops=True,
        certifications=True,
        dedicated_csm=True,
        industry_certifications=[
            "Quantum Computing Fundamentals",
            "Quantum Machine Learning (QML)",
            "Quantum+AI Integration",
            "Post-Quantum Cryptography Specialist",
        ],
    ),
}


@dataclass
class ActivationCodeInfo:
    """Parsed activation code information."""
    code: str
    prefix: str
    level: int
    tier: SubscriptionTier
    features: SubscriptionFeatures
    valid: bool
    error_message: Optional[str] = None


class SubscriptionManager:
    """
    Manages subscription tiers, activation codes, and feature access control.

    Activation code formats:
    - FREE-LEVEL3: Free tier (Developers/Amir)
    - BETA2026-LEVEL10: Beta tester with full access
    - XRAISED-LEVEL10: Affiliate/investor with full access
    - ENTERPRISE-LEVEL10: Enterprise tier with QRNG
    - CUSTOMER123-LEVEL8: Custom enterprise level
    """

    # Valid activation code prefixes mapped to tiers
    CODE_PREFIX_TIER_MAP = {
        "FREE": SubscriptionTier.DEVELOPERS,
        "BETA2026": SubscriptionTier.ENTERPRISE,  # Beta testers get full access
        "XRAISED": SubscriptionTier.ENTERPRISE,   # Affiliates get full access
        "ENTERPRISE": SubscriptionTier.ENTERPRISE,
        "PRO": SubscriptionTier.PROFESSIONAL,
        "TEAM": SubscriptionTier.TEAMS,
        "GHSTAR": SubscriptionTier.PROFESSIONAL,  # GitHub star supporters -> Developer tier
    }

    # Regex pattern for activation codes: PREFIX-LEVELX
    CODE_PATTERN = re.compile(r'^([A-Z0-9]+)-LEVEL(\d+)$', re.IGNORECASE)

    @classmethod
    def validate_activation_code(cls, code: str) -> ActivationCodeInfo:
        """
        Validate an activation code and return subscription information.

        Args:
            code: Activation code string (e.g., "ENTERPRISE-LEVEL10")

        Returns:
            ActivationCodeInfo with validation results and subscription details

        Examples:
            >>> result = SubscriptionManager.validate_activation_code("FREE-LEVEL3")
            >>> result.valid
            True
            >>> result.tier
            <SubscriptionTier.DEVELOPERS: 'amir'>
            >>> result.features.qrng_access
            False
        """
        code = code.strip().upper()

        # Parse code format
        match = cls.CODE_PATTERN.match(code)
        if not match:
            return ActivationCodeInfo(
                code=code,
                prefix="",
                level=0,
                tier=SubscriptionTier.DEVELOPERS,
                features=TIER_FEATURES[SubscriptionTier.DEVELOPERS],
                valid=False,
                error_message="Invalid activation code format. Expected: PREFIX-LEVELX"
            )

        prefix = match.group(1)
        level = int(match.group(2))

        # Validate level range
        if level < 1 or level > 10:
            return ActivationCodeInfo(
                code=code,
                prefix=prefix,
                level=level,
                tier=SubscriptionTier.DEVELOPERS,
                features=TIER_FEATURES[SubscriptionTier.DEVELOPERS],
                valid=False,
                error_message=f"Invalid level: {level}. Must be between 1 and 10."
            )

        # Determine tier from prefix (or custom prefix for enterprise)
        tier = cls.CODE_PREFIX_TIER_MAP.get(prefix)

        # If prefix not in map, check if it's a custom enterprise code
        # Custom codes (e.g., CUSTOMER123-LEVELX) are treated as enterprise
        if tier is None:
            # Custom codes must be at least 6 characters
            if len(prefix) >= 6:
                tier = cls._infer_tier_from_level(level)
            else:
                return ActivationCodeInfo(
                    code=code,
                    prefix=prefix,
                    level=level,
                    tier=SubscriptionTier.DEVELOPERS,
                    features=TIER_FEATURES[SubscriptionTier.DEVELOPERS],
                    valid=False,
                    error_message=f"Unknown activation code prefix: {prefix}"
                )

        features = TIER_FEATURES[tier]

        # Validate level against tier maximum
        if level > features.max_level:
            return ActivationCodeInfo(
                code=code,
                prefix=prefix,
                level=level,
                tier=tier,
                features=features,
                valid=False,
                error_message=(
                    f"Level {level} exceeds maximum for {features.character_name} tier "
                    f"(max: {features.max_level}). Upgrade to access higher levels."
                )
            )

        return ActivationCodeInfo(
            code=code,
            prefix=prefix,
            level=level,
            tier=tier,
            features=features,
            valid=True
        )

    @classmethod
    def _infer_tier_from_level(cls, level: int) -> SubscriptionTier:
        """
        Infer the minimum required tier from anonymization level.

        Args:
            level: Anonymization level (1-10)

        Returns:
            Minimum required subscription tier
        """
        if level <= 3:
            return SubscriptionTier.DEVELOPERS
        elif level <= 5:
            return SubscriptionTier.PROFESSIONAL
        elif level <= 7:
            return SubscriptionTier.TEAMS
        else:  # 8-10
            return SubscriptionTier.ENTERPRISE

    @classmethod
    def has_feature_access(cls, code: str, feature: str) -> bool:
        """
        Check if activation code grants access to a specific feature.

        Args:
            code: Activation code string
            feature: Feature name (e.g., 'qrng_access', 'api_access', 'hsm_support')

        Returns:
            True if feature is accessible, False otherwise

        Examples:
            >>> SubscriptionManager.has_feature_access("ENTERPRISE-LEVEL10", "qrng_access")
            True
            >>> SubscriptionManager.has_feature_access("FREE-LEVEL3", "qrng_access")
            True
        """
        code_info = cls.validate_activation_code(code)

        if not code_info.valid:
            return False

        return getattr(code_info.features, feature, False)

    @classmethod
    def can_use_qrng(cls, code: str) -> bool:
        """
        Check if activation code allows quantum random number generation.

        During the early adopter period, QRNG is available on all tiers.

        Args:
            code: Activation code string

        Returns:
            True if QRNG is accessible, False otherwise

        Examples:
            >>> SubscriptionManager.can_use_qrng("ENTERPRISE-LEVEL10")
            True
            >>> SubscriptionManager.can_use_qrng("BETA2026-LEVEL10")
            True
            >>> SubscriptionManager.can_use_qrng("FREE-LEVEL3")
            True
        """
        code_info = cls.validate_activation_code(code)

        if not code_info.valid:
            return False

        # Early adopter: QRNG available on all tiers
        return code_info.features.qrng_access

    @classmethod
    def can_use_level(cls, code: str, level: int) -> tuple[bool, Optional[str]]:
        """
        Check if activation code allows a specific anonymization level.

        Args:
            code: Activation code string
            level: Desired anonymization level (1-10)

        Returns:
            Tuple of (allowed: bool, error_message: Optional[str])

        Examples:
            >>> allowed, msg = SubscriptionManager.can_use_level("FREE-LEVEL3", 5)
            >>> allowed
            False
            >>> "Upgrade" in msg
            True
        """
        code_info = cls.validate_activation_code(code)

        if not code_info.valid:
            return False, code_info.error_message

        if level > code_info.features.max_level:
            return False, (
                f"Anonymization level {level} requires "
                f"{cls._get_required_tier_name(level)} tier or higher. "
                f"Your {code_info.features.character_name} tier supports up to "
                f"level {code_info.features.max_level}."
            )

        return True, None

    @classmethod
    def _get_required_tier_name(cls, level: int) -> str:
        """Get the character name of the tier required for a level."""
        tier = cls._infer_tier_from_level(level)
        return TIER_FEATURES[tier].character_name

    @classmethod
    def get_tier_info(cls, tier: SubscriptionTier) -> SubscriptionFeatures:
        """
        Get detailed feature information for a subscription tier.

        Args:
            tier: Subscription tier enum

        Returns:
            SubscriptionFeatures dataclass with all tier details
        """
        return TIER_FEATURES[tier]

    @classmethod
    def get_available_levels(cls, code: str) -> List[int]:
        """
        Get list of anonymization levels available for an activation code.

        Args:
            code: Activation code string

        Returns:
            List of available anonymization levels (1-10)
        """
        code_info = cls.validate_activation_code(code)

        if not code_info.valid:
            return []

        return list(range(1, code_info.features.max_level + 1))

    @classmethod
    def check_data_limit(cls, code: str, data_size_gb: float) -> tuple[bool, Optional[str]]:
        """
        Check if data size is within subscription limits.

        Args:
            code: Activation code string
            data_size_gb: Size of data to process in GB

        Returns:
            Tuple of (within_limit: bool, error_message: Optional[str])
        """
        code_info = cls.validate_activation_code(code)

        if not code_info.valid:
            return False, code_info.error_message

        limit = code_info.features.data_limit_gb

        # None means unlimited (enterprise)
        if limit is None:
            return True, None

        if data_size_gb > limit:
            return False, (
                f"Data size ({data_size_gb:.2f} GB) exceeds your "
                f"{code_info.features.character_name} tier limit of {limit} GB/month. "
                f"Upgrade to process larger datasets."
            )

        return True, None

    @classmethod
    def get_upgrade_recommendation(cls, desired_level: int) -> Dict[str, any]:
        """
        Get subscription tier recommendation for desired anonymization level.

        Args:
            desired_level: Desired anonymization level (1-10)

        Returns:
            Dictionary with tier recommendation and details
        """
        required_tier = cls._infer_tier_from_level(desired_level)
        features = TIER_FEATURES[required_tier]

        return {
            "required_tier": required_tier.value,
            "character_name": features.character_name,
            "max_level": features.max_level,
            "price": features.price_monthly,
            "qrng_access": features.qrng_access,
            "support_level": features.support_level,
            "data_limit_gb": features.data_limit_gb
        }

    @classmethod
    def list_all_tiers(cls) -> List[Dict[str, any]]:
        """
        Get information about all subscription tiers.

        Returns:
            List of dictionaries with tier information
        """
        result = []
        for tier in SubscriptionTier:
            features = TIER_FEATURES[tier]
            result.append({
                "tier": tier.value,
                "character_name": features.character_name,
                "public_name": features.public_name,
                "levels": f"1-{features.max_level}",
                "price_early_adopter": features.price_monthly,
                "price_standard": features.price_monthly_standard,
                "qrng_access": features.qrng_access,
                "data_limit_gb": features.data_limit_gb or "Unlimited",
                "support": features.support_level,
                "api_access": features.api_access,
                "team_features": features.team_features,
                "workshops": features.workshops,
                "certifications": features.certifications,
            })
        return result


class APIKeyValidator:
    """
    Validates API keys for L4+ access.

    Auth flow:
    1. L1-3: always available (no key needed)
    2. L4+: check ZIPMINATOR_API_KEY env var -> validate against API -> fallback to activation code
    3. ZIPMINATOR_OFFLINE=1: skip API validation, use activation codes only

    The API endpoint (api.zipminator.zip/v1/validate) is not yet deployed;
    this class provides the client-side gating logic with local caching.
    """

    _cache: Dict[str, tuple] = {}  # key -> (tier, expiry_timestamp)
    CACHE_TTL_SECONDS = 3600  # 1 hour

    @classmethod
    def is_offline_mode(cls) -> bool:
        """Check if offline mode is forced via env var."""
        return os.getenv("ZIPMINATOR_OFFLINE", "").strip() in ("1", "true", "yes")

    @classmethod
    def get_api_key(cls) -> Optional[str]:
        """Read API key from environment."""
        return os.getenv("ZIPMINATOR_API_KEY", "").strip() or None

    @classmethod
    def validate_key(cls, api_key: str) -> Optional[SubscriptionTier]:
        """
        Validate an API key against the remote service.

        Returns the tier if valid, None if invalid or unreachable.
        Currently returns None (API not deployed); activation codes are the
        fallback auth path until api.zipminator.zip is live.
        """
        import time

        # Check cache first
        if api_key in cls._cache:
            tier, expiry = cls._cache[api_key]
            if time.time() < expiry:
                return tier

        # Try remote validation (requires httpx)
        try:
            import httpx
            resp = httpx.post(
                "https://api.zipminator.zip/v1/validate",
                json={"api_key": api_key},
                timeout=5.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                tier_str = data.get("tier", "").lower()
                tier_map = {t.value: t for t in SubscriptionTier}
                tier = tier_map.get(tier_str)
                if tier:
                    cls._cache[api_key] = (tier, time.time() + cls.CACHE_TTL_SECONDS)
                    return tier
        except Exception:
            pass  # Network error, httpx not installed, etc.

        return None

    @classmethod
    def authorize_level(cls, level: int, activation_code: Optional[str] = None) -> tuple:
        """
        Authorize access to a given anonymization level.

        Returns (allowed: bool, message: str, auth_method: str).

        Auth priority:
        1. L1-3 always allowed
        2. API key (if set and not offline)
        3. Activation code
        4. Deny
        """
        # L1-3 are always free
        if level <= 3:
            return True, None, "free_tier"

        # Check offline mode
        offline = cls.is_offline_mode()

        # Try API key first (unless offline)
        if not offline:
            api_key = cls.get_api_key()
            if api_key:
                tier = cls.validate_key(api_key)
                if tier:
                    features = TIER_FEATURES[tier]
                    if level <= features.max_level:
                        return True, None, "api_key"
                    else:
                        return False, (
                            f"API key tier ({features.character_name}) "
                            f"supports up to level {features.max_level}."
                        ), "api_key_insufficient"

        # Try activation code
        if activation_code:
            allowed, msg = SubscriptionManager.can_use_level(activation_code, level)
            if allowed:
                return True, None, "activation_code"
            return False, msg, "activation_code_insufficient"

        # No auth method succeeded
        required = SubscriptionManager._infer_tier_from_level(level)
        features = TIER_FEATURES[required]
        return False, (
            f"Level {level} requires {features.public_name} tier or higher. "
            "Set ZIPMINATOR_API_KEY or provide an activation code."
        ), "denied"

    @classmethod
    def clear_cache(cls):
        """Clear the API key validation cache."""
        cls._cache.clear()


# Convenience functions
def validate_code(code: str) -> ActivationCodeInfo:
    """Convenience wrapper for validate_activation_code."""
    return SubscriptionManager.validate_activation_code(code)


def can_use_qrng(code: str) -> bool:
    """Convenience wrapper for can_use_qrng."""
    return SubscriptionManager.can_use_qrng(code)


def can_use_level(code: str, level: int) -> tuple[bool, Optional[str]]:
    """Convenience wrapper for can_use_level."""
    return SubscriptionManager.can_use_level(code, level)
