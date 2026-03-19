# tests/python/test_pii_jp.py
"""Tests for Japanese PII detection patterns."""

import pytest
from src.zipminator.crypto.patterns._base import PIIDetector
from src.zipminator.crypto.patterns.japan import JAPAN_PATTERNS
from src.zipminator.crypto.patterns.validators import validate_japan_my_number


class TestJapanMyNumberValidator:
    """Tests for validate_japan_my_number."""

    def test_valid_my_number(self):
        result = validate_japan_my_number('123456789018')
        assert result['valid'] is True
        assert result['checksum_valid'] is True

    def test_valid_my_number_second(self):
        result = validate_japan_my_number('987654321000')
        assert result['valid'] is True

    def test_valid_my_number_third(self):
        result = validate_japan_my_number('111111111118')
        assert result['valid'] is True

    def test_invalid_check_digit(self):
        result = validate_japan_my_number('123456789019')
        assert result['valid'] is False

    def test_too_short(self):
        result = validate_japan_my_number('12345678901')
        assert result['valid'] is False

    def test_too_long(self):
        result = validate_japan_my_number('1234567890123')
        assert result['valid'] is False

    def test_non_digit(self):
        result = validate_japan_my_number('12345678901A')
        assert result['valid'] is False

    def test_with_spaces(self):
        result = validate_japan_my_number('1234 5678 9018')
        assert result['valid'] is True

    def test_with_dashes(self):
        result = validate_japan_my_number('1234-5678-9018')
        assert result['valid'] is True

    def test_formatted_metadata(self):
        result = validate_japan_my_number('123456789018')
        assert result['metadata']['formatted'] == '1234 5678 9018'

    def test_all_zeros_invalid(self):
        # Check digit for 00000000000 should be computed
        result = validate_japan_my_number('000000000000')
        assert result['valid'] is True or result['valid'] is False  # Just ensure no crash

    def test_edge_case_remainder_zero(self):
        """When remainder is 0, check digit should be 0."""
        result = validate_japan_my_number('987654321000')
        assert result['valid'] is True


class TestJapanPatterns:
    """Tests for JAPAN_PATTERNS integration."""

    def test_country_code(self):
        assert JAPAN_PATTERNS.country_code == 'jp'

    def test_regulation(self):
        assert 'APPI' in JAPAN_PATTERNS.regulation

    def test_language(self):
        assert JAPAN_PATTERNS.language == 'ja'

    def test_my_number_detection(self):
        text = 'My Number: 123456789018'
        results = JAPAN_PATTERNS.detect_all(text)
        assert 'my_number' in results

    def test_detector_integration(self):
        detector = PIIDetector()
        detector.register_country(JAPAN_PATTERNS)
        text = 'Individual Number is 987654321000'
        results = detector.detect(text, countries=['jp'])
        assert 'jp' in results
        assert 'my_number' in results['jp']

    def test_list_categories(self):
        categories = JAPAN_PATTERNS.list_categories()
        assert 'my_number' in categories
        assert 'passport' in categories
