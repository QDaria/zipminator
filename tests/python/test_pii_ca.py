# tests/python/test_pii_ca.py
"""Tests for Canadian PII detection patterns."""

import pytest
from src.zipminator.crypto.patterns._base import PIIDetector
from src.zipminator.crypto.patterns.canada import CANADA_PATTERNS
from src.zipminator.crypto.patterns.validators import validate_canada_sin


class TestCanadaSinValidator:
    """Tests for validate_canada_sin."""

    def test_valid_sin(self):
        result = validate_canada_sin('046454286')
        assert result['valid'] is True
        assert result['checksum_valid'] is True

    def test_valid_sin_atlantic(self):
        result = validate_canada_sin('123456782')
        assert result['valid'] is True
        assert 'Atlantic' in result['metadata']['province_region']

    def test_valid_sin_pacific(self):
        result = validate_canada_sin('723456786')
        assert result['valid'] is True
        assert 'Pacific' in result['metadata']['province_region']

    def test_invalid_luhn(self):
        result = validate_canada_sin('046454287')
        assert result['valid'] is False

    def test_all_same_digits(self):
        result = validate_canada_sin('111111111')
        assert result['valid'] is False

    def test_too_short(self):
        result = validate_canada_sin('04645428')
        assert result['valid'] is False

    def test_too_long(self):
        result = validate_canada_sin('0464542861')
        assert result['valid'] is False

    def test_non_digit(self):
        result = validate_canada_sin('04645428A')
        assert result['valid'] is False

    def test_with_spaces(self):
        result = validate_canada_sin('046 454 286')
        assert result['valid'] is True

    def test_with_dashes(self):
        result = validate_canada_sin('046-454-286')
        assert result['valid'] is True

    def test_temporary_sin(self):
        """SINs starting with 9 are temporary."""
        # Generate a valid SIN starting with 9
        # 900000008 -> Luhn check
        from src.zipminator.crypto.patterns.validators import luhn_checksum
        for d in range(10):
            candidate = '90000000' + str(d)
            if luhn_checksum(candidate) and len(set(candidate)) > 1:
                result = validate_canada_sin(candidate)
                if result['valid']:
                    assert result['metadata']['temporary'] is True
                    break

    def test_formatted_metadata(self):
        result = validate_canada_sin('046454286')
        assert result['metadata']['formatted'] == '046 454 286'


class TestCanadaPatterns:
    """Tests for CANADA_PATTERNS integration."""

    def test_country_code(self):
        assert CANADA_PATTERNS.country_code == 'ca'

    def test_regulation(self):
        assert 'PIPEDA' in CANADA_PATTERNS.regulation

    def test_sin_detection(self):
        text = 'SIN: 046454286'
        results = CANADA_PATTERNS.detect_all(text)
        assert 'sin' in results

    def test_sin_invalid_not_detected(self):
        text = 'Number 046454287 is not valid.'
        results = CANADA_PATTERNS.detect_all(text)
        assert 'sin' not in results

    def test_detector_integration(self):
        detector = PIIDetector()
        detector.register_country(CANADA_PATTERNS)
        text = 'Canadian SIN: 123456782'
        results = detector.detect(text, countries=['ca'])
        assert 'ca' in results
        assert 'sin' in results['ca']

    def test_list_categories(self):
        categories = CANADA_PATTERNS.list_categories()
        assert 'sin' in categories
        assert 'health_card' in categories
        assert 'postal_code' in categories
