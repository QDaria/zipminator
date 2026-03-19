# tests/python/test_pii_au.py
"""Tests for Australian PII detection patterns."""

import pytest
from src.zipminator.crypto.patterns._base import PIIDetector
from src.zipminator.crypto.patterns.australia import AUSTRALIA_PATTERNS
from src.zipminator.crypto.patterns.validators import validate_australia_tfn


class TestAustraliaTfnValidator:
    """Tests for validate_australia_tfn."""

    def test_valid_tfn_9_digit(self):
        result = validate_australia_tfn('123456782')
        assert result['valid'] is True
        assert result['checksum_valid'] is True
        assert result['metadata']['digits'] == 9

    def test_valid_tfn_second(self):
        result = validate_australia_tfn('876543210')
        assert result['valid'] is True

    def test_invalid_checksum(self):
        result = validate_australia_tfn('123456789')
        assert result['valid'] is False

    def test_too_short(self):
        result = validate_australia_tfn('1234567')
        assert result['valid'] is False

    def test_too_long(self):
        result = validate_australia_tfn('1234567890')
        assert result['valid'] is False

    def test_non_digit(self):
        result = validate_australia_tfn('12345678A')
        assert result['valid'] is False

    def test_with_spaces(self):
        result = validate_australia_tfn('123 456 782')
        assert result['valid'] is True

    def test_with_dashes(self):
        result = validate_australia_tfn('123-456-782')
        assert result['valid'] is True

    def test_formatted_metadata(self):
        result = validate_australia_tfn('123456782')
        assert result['metadata']['formatted'] == '123 456 782'

    def test_8_digit_tfn(self):
        """8-digit TFNs use different weights."""
        # Try to find a valid 8-digit TFN
        weights_8 = [10, 7, 8, 4, 6, 3, 5, 1]
        for last in range(10):
            candidate = '1234567' + str(last)
            total = sum(int(d) * w for d, w in zip(candidate, weights_8))
            if total % 11 == 0:
                result = validate_australia_tfn(candidate)
                assert result['valid'] is True
                assert result['metadata']['digits'] == 8
                break


class TestAustraliaPatterns:
    """Tests for AUSTRALIA_PATTERNS integration."""

    def test_country_code(self):
        assert AUSTRALIA_PATTERNS.country_code == 'au'

    def test_regulation(self):
        assert 'Privacy Act' in AUSTRALIA_PATTERNS.regulation

    def test_tfn_detection(self):
        text = 'My TFN is 123456782'
        results = AUSTRALIA_PATTERNS.detect_all(text)
        assert 'tfn' in results

    def test_tfn_invalid_not_detected(self):
        text = 'Number 123456789 is not valid.'
        results = AUSTRALIA_PATTERNS.detect_all(text)
        assert 'tfn' not in results

    def test_detector_integration(self):
        detector = PIIDetector()
        detector.register_country(AUSTRALIA_PATTERNS)
        text = 'TFN: 876543210'
        results = detector.detect(text, countries=['au'])
        assert 'au' in results
        assert 'tfn' in results['au']

    def test_list_categories(self):
        categories = AUSTRALIA_PATTERNS.list_categories()
        assert 'tfn' in categories
        assert 'medicare' in categories
        assert 'passport' in categories

    def test_multi_country_detector(self):
        """Test that Australian patterns work alongside other countries."""
        from src.zipminator.crypto.patterns.usa import USA_PATTERNS
        detector = PIIDetector()
        detector.register_country(AUSTRALIA_PATTERNS)
        detector.register_country(USA_PATTERNS)
        assert len(detector.list_countries()) == 2
