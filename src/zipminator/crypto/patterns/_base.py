# zipminator/patterns/_base.py
"""Base classes for PII pattern detection across multiple countries."""

from dataclasses import dataclass, field
from typing import Optional, Callable, List, Dict, Any
import re


@dataclass
class PIIPattern:
    """
    Represents a single PII pattern with optional validation.

    Attributes:
        name: Human-readable pattern name (e.g., "Norwegian Fødselsnummer")
        category: Category of PII (e.g., "national_id", "tax_id", "bank_account")
        regex: Regular expression pattern string
        description: Detailed description of what this pattern detects
        validator: Optional validation function for checksum/format validation
        examples: List of valid example strings (for testing)
        false_positives: Known false positives to filter out
        sensitivity: How sensitive this PII is (1-5, 5 being most sensitive)
    """

    name: str
    category: str
    regex: str
    description: str
    validator: Optional[Callable[[str], Dict[str, Any]]] = None
    examples: List[str] = field(default_factory=list)
    false_positives: List[str] = field(default_factory=list)
    sensitivity: int = 3  # 1-5 scale

    def __post_init__(self):
        """Validate configuration."""
        if not 1 <= self.sensitivity <= 5:
            raise ValueError(f"Sensitivity must be 1-5, got {self.sensitivity}")

    @property
    def compiled(self) -> re.Pattern:
        """Compile and cache regex pattern."""
        if not hasattr(self, '_compiled'):
            self._compiled = re.compile(self.regex)
        return self._compiled

    def match(self, text: str) -> List[str]:
        """
        Find all matches in text, applying validation if available.

        Args:
            text: Text to search for PII

        Returns:
            List of validated matches
        """
        matches = self.compiled.findall(text)

        # Remove known false positives
        if self.false_positives:
            matches = [m for m in matches if m not in self.false_positives]

        # Apply validator if provided
        if self.validator:
            validated = []
            for match in matches:
                result = self.validator(match)
                if result.get('valid', False):
                    validated.append(match)
            return validated

        return matches

    def validate(self, value: str) -> Dict[str, Any]:
        """
        Validate a single value against this pattern.

        Args:
            value: String to validate

        Returns:
            Dictionary with validation results:
            {
                'valid': bool,
                'pattern_match': bool,
                'checksum_valid': bool (if applicable),
                'metadata': dict (extracted information, e.g., birth date, gender)
            }
        """
        result = {
            'valid': False,
            'pattern_match': False,
            'checksum_valid': None,
            'metadata': {}
        }

        # Check regex match
        if not self.compiled.match(value):
            return result

        result['pattern_match'] = True

        # Apply custom validator if provided
        if self.validator:
            validator_result = self.validator(value)
            result.update(validator_result)
        else:
            result['valid'] = True

        return result


@dataclass
class CountryPatterns:
    """
    Collection of PII patterns for a specific country.

    Attributes:
        country_code: ISO 3166-1 alpha-2 code (e.g., 'NO', 'GB', 'US')
        country_name: Full country name
        patterns: Dictionary mapping pattern category to PIIPattern
        regulation: Primary data protection regulation (e.g., 'GDPR', 'CCPA')
        language: Primary language (for internationalization)
    """

    country_code: str
    country_name: str
    patterns: Dict[str, PIIPattern]
    regulation: str
    language: str

    def detect_all(self, text: str) -> Dict[str, List[str]]:
        """
        Detect all PII types in text.

        Args:
            text: Text to scan for PII

        Returns:
            Dictionary mapping category to list of matches
        """
        results = {}
        for category, pattern in self.patterns.items():
            matches = pattern.match(text)
            if matches:
                results[category] = matches
        return results

    def get_pattern(self, category: str) -> Optional[PIIPattern]:
        """Get pattern by category."""
        return self.patterns.get(category)

    def list_categories(self) -> List[str]:
        """List all available PII categories for this country."""
        return list(self.patterns.keys())

    def __repr__(self) -> str:
        return f"CountryPatterns({self.country_code}: {len(self.patterns)} patterns)"


class PIIDetector:
    """
    Multi-country PII detector.

    Usage:
        detector = PIIDetector()
        detector.register_country(NORWEGIAN_PATTERNS)
        detector.register_country(UK_PATTERNS)

        results = detector.detect(text, countries=['no', 'uk'])
    """

    def __init__(self):
        self.countries: Dict[str, CountryPatterns] = {}

    def register_country(self, country_patterns: CountryPatterns):
        """Register a country's PII patterns."""
        self.countries[country_patterns.country_code] = country_patterns

    def detect(
        self,
        text: str,
        countries: Optional[List[str]] = None,
        categories: Optional[List[str]] = None
    ) -> Dict[str, Dict[str, List[str]]]:
        """
        Detect PII across multiple countries.

        Args:
            text: Text to scan
            countries: List of country codes to check (None = all registered)
            categories: List of categories to check (None = all)

        Returns:
            Nested dictionary:
            {
                'no': {'fodselsnummer': ['13048212345'], 'email': ['test@example.com']},
                'uk': {'ni_number': ['AB123456C']},
                ...
            }
        """
        if countries is None:
            countries = list(self.countries.keys())

        results = {}
        for country_code in countries:
            if country_code not in self.countries:
                continue

            country = self.countries[country_code]
            country_results = {}

            for category, pattern in country.patterns.items():
                if categories and category not in categories:
                    continue

                matches = pattern.match(text)
                if matches:
                    country_results[category] = matches

            if country_results:
                results[country_code] = country_results

        return results

    def get_country(self, country_code: str) -> Optional[CountryPatterns]:
        """Get CountryPatterns by code."""
        return self.countries.get(country_code)

    def list_countries(self) -> List[str]:
        """List all registered country codes."""
        return list(self.countries.keys())

    def __repr__(self) -> str:
        return f"PIIDetector(countries={len(self.countries)})"
