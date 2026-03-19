# tests/python/test_pii_eu.py
"""Tests for EU-generic PII detection patterns."""

import pytest
from zipminator.crypto.patterns._base import PIIDetector
from zipminator.crypto.patterns.eu_generic import (
    EU_GENERIC_PATTERNS,
    validate_iban,
    validate_eu_vat,
)


class TestIBANValidation:
    """Test IBAN validation (MOD97)."""

    def test_valid_german_iban(self):
        """DE89 3704 0044 0532 0130 00 is a well-known test IBAN."""
        result = validate_iban('DE89 3704 0044 0532 0130 00')
        assert result['valid'] is True
        assert result['checksum_valid'] is True
        assert result['metadata']['country_code'] == 'DE'

    def test_valid_british_iban(self):
        """GB29 NWBK 6016 1331 9268 19 is a known test IBAN."""
        result = validate_iban('GB29 NWBK 6016 1331 9268 19')
        assert result['valid'] is True

    def test_valid_norwegian_iban(self):
        """NO93 8601 1117 947 is a known test IBAN."""
        result = validate_iban('NO93 8601 1117 947')
        assert result['valid'] is True

    def test_valid_french_iban(self):
        """FR76 3000 6000 0112 3456 7890 189 is a known test IBAN."""
        result = validate_iban('FR76 3000 6000 0112 3456 7890 189')
        assert result['valid'] is True

    def test_valid_swedish_iban(self):
        """SE45 5000 0000 0583 9825 7466 should validate."""
        result = validate_iban('SE45 5000 0000 0583 9825 7466')
        assert result['valid'] is True

    def test_invalid_checksum(self):
        """IBAN with wrong check digits should fail."""
        result = validate_iban('DE00 3704 0044 0532 0130 00')
        assert result['valid'] is False

    def test_too_short(self):
        """IBAN shorter than 5 characters should fail."""
        result = validate_iban('DE89')
        assert result['valid'] is False

    def test_too_long(self):
        """IBAN longer than 34 characters should fail."""
        result = validate_iban('DE89 3704 0044 0532 0130 0012 3456 7890 1')
        assert result['valid'] is False

    def test_invalid_country_code(self):
        """Non-letter country code should fail."""
        result = validate_iban('12 3704 0044 0532 0130 00')
        assert result['valid'] is False

    def test_formatted_output(self):
        """Formatted IBAN should be in 4-character groups."""
        result = validate_iban('DE89370400440532013000')
        if result['valid']:
            assert result['metadata']['formatted'] == 'DE89 3704 0044 0532 0130 00'

    def test_lowercase_input(self):
        """Lowercase IBAN input should be uppercased and validated."""
        result = validate_iban('de89 3704 0044 0532 0130 00')
        assert result['valid'] is True

    def test_danish_iban(self):
        """DK50 0040 0440 1162 43 is a known test IBAN."""
        result = validate_iban('DK50 0040 0440 1162 43')
        assert result['valid'] is True

    def test_finnish_iban(self):
        """FI21 1234 5600 0007 85 is a known test IBAN."""
        result = validate_iban('FI21 1234 5600 0007 85')
        assert result['valid'] is True


class TestEUVATValidation:
    """Test EU VAT number validation."""

    def test_valid_german_vat(self):
        """German VAT DE123456789 should pass format check."""
        result = validate_eu_vat('DE123456789')
        assert result['valid'] is True
        assert result['metadata']['country_code'] == 'DE'

    def test_valid_french_vat(self):
        """French VAT should pass format check."""
        result = validate_eu_vat('FR12345678901')
        assert result['valid'] is True

    def test_valid_swedish_vat(self):
        """Swedish VAT should pass format check."""
        result = validate_eu_vat('SE556036079301')
        assert result['valid'] is True

    def test_invalid_country_code(self):
        """Unknown country code should fail."""
        result = validate_eu_vat('XX123456789')
        assert result['valid'] is False

    def test_too_short(self):
        """VAT number too short should fail."""
        result = validate_eu_vat('DE1')
        assert result['valid'] is False

    def test_non_alpha_prefix(self):
        """Non-letter prefix should fail."""
        result = validate_eu_vat('12345678901')
        assert result['valid'] is False


class TestEUPIIDetector:
    """Test integration with PIIDetector."""

    def test_register_eu(self):
        """EU patterns should register without error."""
        detector = PIIDetector()
        detector.register_country(EU_GENERIC_PATTERNS)
        assert 'eu' in detector.list_countries()

    def test_country_patterns_structure(self):
        """EU_GENERIC_PATTERNS should have expected categories."""
        assert 'iban' in EU_GENERIC_PATTERNS.patterns
        assert 'eu_vat' in EU_GENERIC_PATTERNS.patterns
        assert EU_GENERIC_PATTERNS.country_code == 'eu'
        assert EU_GENERIC_PATTERNS.regulation == 'GDPR'

    def test_multi_country_detection(self):
        """Detector should handle multiple registered countries."""
        from zipminator.crypto.patterns.norway import NORWAY_PATTERNS
        from zipminator.crypto.patterns.sweden import SWEDEN_PATTERNS

        detector = PIIDetector()
        detector.register_country(EU_GENERIC_PATTERNS)
        detector.register_country(NORWAY_PATTERNS)
        detector.register_country(SWEDEN_PATTERNS)

        assert len(detector.list_countries()) == 3
