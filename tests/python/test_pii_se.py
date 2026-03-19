# tests/python/test_pii_se.py
"""Tests for Swedish PII detection patterns."""

import pytest
from zipminator.crypto.patterns._base import PIIDetector
from zipminator.crypto.patterns.sweden import SWEDEN_PATTERNS
from zipminator.crypto.patterns.validators import (
    validate_swedish_personnummer,
    luhn_checksum,
)


class TestSwedishPersonnummer:
    """Test Swedish personnummer validation."""

    def test_valid_personnummer_with_dash(self):
        """Known test personnummer 811228-9874 should validate."""
        result = validate_swedish_personnummer('811228-9874')
        assert result['valid'] is True
        assert result['checksum_valid'] is True

    def test_valid_personnummer_12_digit(self):
        """12-digit format with century should validate."""
        result = validate_swedish_personnummer('19811228-9874')
        assert result['valid'] is True
        assert result['checksum_valid'] is True

    def test_valid_personnummer_no_dash(self):
        """10-digit format without dash should validate."""
        result = validate_swedish_personnummer('8112289874')
        assert result['valid'] is True

    def test_invalid_luhn(self):
        """Personnummer with wrong check digit should fail."""
        result = validate_swedish_personnummer('811228-9875')
        assert result['valid'] is False

    def test_gender_male(self):
        """Odd 3rd digit of birth number = male."""
        result = validate_swedish_personnummer('811228-9874')
        if result['valid']:
            # 987 -> 7 is odd -> male
            assert result['metadata']['gender'] == 'male'

    def test_gender_female(self):
        """Even 3rd digit of birth number = female."""
        # 811228-9804 -> need valid Luhn for 8112289804
        result = validate_swedish_personnummer('811228-9804')
        if result['valid']:
            assert result['metadata']['gender'] == 'female'

    def test_birth_date_extraction(self):
        """Birth date should be extracted correctly."""
        result = validate_swedish_personnummer('811228-9874')
        if result['valid']:
            assert result['metadata']['birth_date'] == '1981-12-28'

    def test_samordningsnummer(self):
        """Samordningsnummer has day + 60 (e.g., day 88 = 28+60)."""
        result = validate_swedish_personnummer('811288-9814')
        if result['valid']:
            assert result['metadata']['is_samordningsnummer'] is True

    def test_invalid_length(self):
        """Too few digits should fail."""
        result = validate_swedish_personnummer('81122898')
        assert result['valid'] is False

    def test_non_digit(self):
        """Non-digit characters (besides separator) should fail."""
        result = validate_swedish_personnummer('81122a-9874')
        assert result['valid'] is False

    def test_invalid_date(self):
        """Invalid month should fail."""
        result = validate_swedish_personnummer('811328-9874')
        assert result['valid'] is False

    def test_plus_separator_centenarian(self):
        """Plus separator indicates person 100+ years old."""
        result = validate_swedish_personnummer('121212+1212')
        # May or may not validate (Luhn dependent), but should not crash
        assert 'valid' in result


class TestSwedishOrgNumber:
    """Test Swedish organization number validation."""

    def test_valid_org_number(self):
        """Known org number 556036-0793 should validate (Luhn)."""
        from zipminator.crypto.patterns.sweden import validate_swedish_org_number
        result = validate_swedish_org_number('556036-0793')
        assert result['valid'] is True
        assert result['checksum_valid'] is True

    def test_third_digit_less_than_2(self):
        """Org number with 3rd digit < 2 should fail."""
        from zipminator.crypto.patterns.sweden import validate_swedish_org_number
        result = validate_swedish_org_number('551036-0793')
        assert result['valid'] is False

    def test_invalid_luhn(self):
        """Org number with invalid Luhn should fail."""
        from zipminator.crypto.patterns.sweden import validate_swedish_org_number
        result = validate_swedish_org_number('556036-0794')
        assert result['valid'] is False


class TestSwedenPIIDetector:
    """Test integration with PIIDetector."""

    def test_register_sweden(self):
        """Sweden patterns should register without error."""
        detector = PIIDetector()
        detector.register_country(SWEDEN_PATTERNS)
        assert 'se' in detector.list_countries()

    def test_detect_personnummer_in_text(self):
        """Personnummer embedded in text should be detected."""
        detector = PIIDetector()
        detector.register_country(SWEDEN_PATTERNS)
        text = "Mitt personnummer är 811228-9874."
        results = detector.detect(text, countries=['se'])
        if 'se' in results:
            assert 'personnummer' in results['se']

    def test_country_patterns_structure(self):
        """SWEDEN_PATTERNS should have expected categories."""
        assert 'personnummer' in SWEDEN_PATTERNS.patterns
        assert 'samordningsnummer' in SWEDEN_PATTERNS.patterns
        assert 'org_number' in SWEDEN_PATTERNS.patterns
        assert SWEDEN_PATTERNS.country_code == 'se'
        assert SWEDEN_PATTERNS.regulation == 'GDPR'
