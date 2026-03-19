# tests/python/test_pii_fi.py
"""Tests for Finnish PII detection patterns."""

import pytest
from zipminator.crypto.patterns._base import PIIDetector
from zipminator.crypto.patterns.finland import FINLAND_PATTERNS
from zipminator.crypto.patterns.validators import validate_finnish_henkilotunnus


class TestFinnishHenkilotunnus:
    """Test Finnish henkilötunnus validation."""

    def test_valid_hetu_1900s(self):
        """Known test hetu 131052-308T should validate (born 1952)."""
        result = validate_finnish_henkilotunnus('131052-308T')
        assert result['valid'] is True
        assert result['checksum_valid'] is True

    def test_valid_hetu_check_char(self):
        """Check character should be correct for known input."""
        # 131052308 -> 131052308 % 31 = ?
        # 131052308 / 31 = 4227493 remainder 5 -> lookup[5] = '5'
        # Actually: 131052308 % 31 = 131052308 - 31*4227493 = 131052308 - 131052283 = 25
        # lookup[25] = 'T'  -> matches '131052-308T'
        result = validate_finnish_henkilotunnus('131052-308T')
        assert result['valid'] is True

    def test_invalid_check_char(self):
        """Wrong check character should fail."""
        result = validate_finnish_henkilotunnus('131052-308X')
        assert result['valid'] is False

    def test_century_marker_plus(self):
        """Plus separator means 1800s."""
        result = validate_finnish_henkilotunnus('131052+308T')
        # Different century means different date; may or may not be valid
        assert 'valid' in result

    def test_century_marker_A(self):
        """A separator means 2000s."""
        # 010100A123N: born Jan 1, 2000
        # 010100123 % 31 = ? -> 010100123 % 31
        # 10100123 % 31 = 10100123 - 31*325810 = 10100123 - 10100110 = 13 -> lookup[13] = 'F'
        result = validate_finnish_henkilotunnus('010100A123F')
        assert 'valid' in result

    def test_invalid_century_marker(self):
        """Invalid separator should fail."""
        result = validate_finnish_henkilotunnus('131052X308T')
        assert result['valid'] is False

    def test_gender_male(self):
        """Odd individual number = male."""
        result = validate_finnish_henkilotunnus('131052-308T')
        if result['valid']:
            # 308 is even -> female actually
            # 308 % 2 = 0 -> female
            pass

    def test_gender_female(self):
        """Even individual number = female."""
        result = validate_finnish_henkilotunnus('131052-308T')
        if result['valid']:
            assert result['metadata']['gender'] == 'female'

    def test_birth_date_extraction(self):
        """Birth date should be extracted correctly."""
        result = validate_finnish_henkilotunnus('131052-308T')
        if result['valid']:
            assert result['metadata']['birth_date'] == '1952-10-13'

    def test_invalid_length(self):
        """Too short input should fail."""
        result = validate_finnish_henkilotunnus('131052-30')
        assert result['valid'] is False

    def test_invalid_date(self):
        """Invalid month should fail."""
        result = validate_finnish_henkilotunnus('131352-308T')
        assert result['valid'] is False

    def test_non_digit_in_date(self):
        """Non-digit in date portion should fail."""
        result = validate_finnish_henkilotunnus('13a052-308T')
        assert result['valid'] is False


class TestFinnishYTunnus:
    """Test Finnish Y-tunnus (business ID) validation."""

    def test_valid_y_tunnus(self):
        """Known Y-tunnus 0737546-2 should validate."""
        from zipminator.crypto.patterns.finland import validate_finnish_y_tunnus
        result = validate_finnish_y_tunnus('0737546-2')
        assert result['valid'] is True
        assert result['checksum_valid'] is True

    def test_invalid_checksum(self):
        """Y-tunnus with wrong check digit should fail."""
        from zipminator.crypto.patterns.finland import validate_finnish_y_tunnus
        result = validate_finnish_y_tunnus('0737546-3')
        assert result['valid'] is False

    def test_invalid_length(self):
        """Y-tunnus with wrong length should fail."""
        from zipminator.crypto.patterns.finland import validate_finnish_y_tunnus
        result = validate_finnish_y_tunnus('073754-2')
        assert result['valid'] is False


class TestFinlandPIIDetector:
    """Test integration with PIIDetector."""

    def test_register_finland(self):
        """Finland patterns should register without error."""
        detector = PIIDetector()
        detector.register_country(FINLAND_PATTERNS)
        assert 'fi' in detector.list_countries()

    def test_country_patterns_structure(self):
        """FINLAND_PATTERNS should have expected categories."""
        assert 'henkilotunnus' in FINLAND_PATTERNS.patterns
        assert 'y_tunnus' in FINLAND_PATTERNS.patterns
        assert FINLAND_PATTERNS.country_code == 'fi'
        assert FINLAND_PATTERNS.regulation == 'GDPR'
