"""PII pattern detection across 15 countries."""

from typing import Dict

from ._base import PIIPattern, CountryPatterns, PIIDetector
from .usa import USA_PATTERNS
from .uk import UK_PATTERNS
from .uae import UAE_PATTERNS
from .norway import NORWAY_PATTERNS
from .sweden import SWEDEN_PATTERNS
from .denmark import DENMARK_PATTERNS
from .finland import FINLAND_PATTERNS
from .eu_generic import EU_GENERIC_PATTERNS
from .germany import GERMANY_PATTERNS
from .france import FRANCE_PATTERNS
from .india import INDIA_PATTERNS
from .brazil import BRAZIL_PATTERNS
from .japan import JAPAN_PATTERNS
from .canada import CANADA_PATTERNS
from .australia import AUSTRALIA_PATTERNS

ALL_COUNTRY_PATTERNS: Dict[str, CountryPatterns] = {
    "us": USA_PATTERNS,
    "uk": UK_PATTERNS,
    "ae": UAE_PATTERNS,
    "no": NORWAY_PATTERNS,
    "se": SWEDEN_PATTERNS,
    "dk": DENMARK_PATTERNS,
    "fi": FINLAND_PATTERNS,
    "eu": EU_GENERIC_PATTERNS,
    "de": GERMANY_PATTERNS,
    "fr": FRANCE_PATTERNS,
    "in": INDIA_PATTERNS,
    "br": BRAZIL_PATTERNS,
    "jp": JAPAN_PATTERNS,
    "ca": CANADA_PATTERNS,
    "au": AUSTRALIA_PATTERNS,
}


def get_all_patterns() -> Dict[str, CountryPatterns]:
    """Return all registered country PII patterns."""
    return dict(ALL_COUNTRY_PATTERNS)


def create_detector(countries: list = None) -> PIIDetector:
    """Create a PIIDetector pre-loaded with country patterns.

    Args:
        countries: List of country codes to register. None = all 15 countries.

    Returns:
        Configured PIIDetector instance.
    """
    detector = PIIDetector()
    patterns = ALL_COUNTRY_PATTERNS

    if countries is not None:
        patterns = {k: v for k, v in patterns.items() if k in countries}

    for country_patterns in patterns.values():
        detector.register_country(country_patterns)

    return detector


__all__ = [
    "PIIPattern",
    "CountryPatterns",
    "PIIDetector",
    "ALL_COUNTRY_PATTERNS",
    "get_all_patterns",
    "create_detector",
    "USA_PATTERNS",
    "UK_PATTERNS",
    "UAE_PATTERNS",
    "NORWAY_PATTERNS",
    "SWEDEN_PATTERNS",
    "DENMARK_PATTERNS",
    "FINLAND_PATTERNS",
    "EU_GENERIC_PATTERNS",
    "GERMANY_PATTERNS",
    "FRANCE_PATTERNS",
    "INDIA_PATTERNS",
    "BRAZIL_PATTERNS",
    "JAPAN_PATTERNS",
    "CANADA_PATTERNS",
    "AUSTRALIA_PATTERNS",
]
