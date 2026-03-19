# tests/python/test_pii_in.py
"""Tests for Indian PII detection patterns."""

import pytest
from src.zipminator.crypto.patterns._base import PIIDetector
from src.zipminator.crypto.patterns.india import INDIA_PATTERNS
from src.zipminator.crypto.patterns.validators import (
    validate_india_aadhaar,
    validate_india_pan,
)


class TestAadhaarValidator:
    """Tests for validate_india_aadhaar."""

    def test_valid_aadhaar(self):
        result = validate_india_aadhaar('234567890124')
        assert result['valid'] is True
        assert result['checksum_valid'] is True

    def test_valid_aadhaar_second(self):
        result = validate_india_aadhaar('987654321008')
        assert result['valid'] is True

    def test_valid_aadhaar_third(self):
        result = validate_india_aadhaar('512345678903')
        assert result['valid'] is True

    def test_invalid_verhoeff(self):
        result = validate_india_aadhaar('234567890121')
        assert result['valid'] is False

    def test_starts_with_zero(self):
        result = validate_india_aadhaar('012345678901')
        assert result['valid'] is False

    def test_starts_with_one(self):
        result = validate_india_aadhaar('123456789012')
        assert result['valid'] is False

    def test_too_short(self):
        result = validate_india_aadhaar('23456789012')
        assert result['valid'] is False

    def test_non_digit(self):
        result = validate_india_aadhaar('23456789012A')
        assert result['valid'] is False

    def test_with_spaces(self):
        result = validate_india_aadhaar('2345 6789 0124')
        assert result['valid'] is True

    def test_formatted_metadata(self):
        result = validate_india_aadhaar('234567890124')
        assert result['metadata']['formatted'] == '2345 6789 0124'


class TestPanValidator:
    """Tests for validate_india_pan."""

    def test_valid_pan_person(self):
        result = validate_india_pan('ABCPD1234E')
        assert result['valid'] is True
        assert result['metadata']['holder_type_code'] == 'P'
        assert 'Individual' in result['metadata']['holder_type']

    def test_valid_pan_company(self):
        result = validate_india_pan('ABCCD1234E')
        assert result['valid'] is True
        assert result['metadata']['holder_type_code'] == 'C'

    def test_invalid_format_digits_wrong(self):
        result = validate_india_pan('ABCPD12E4E')
        assert result['valid'] is False

    def test_invalid_format_too_short(self):
        result = validate_india_pan('ABCPD1234')
        assert result['valid'] is False

    def test_lowercase_normalized(self):
        result = validate_india_pan('abcpd1234e')
        assert result['valid'] is True


class TestIndiaPatterns:
    """Tests for INDIA_PATTERNS integration."""

    def test_country_code(self):
        assert INDIA_PATTERNS.country_code == 'in'

    def test_regulation(self):
        assert 'DPDP' in INDIA_PATTERNS.regulation

    def test_pan_detection(self):
        text = 'My PAN is ABCPD1234E'
        results = INDIA_PATTERNS.detect_all(text)
        assert 'pan' in results
        assert 'ABCPD1234E' in results['pan']

    def test_detector_integration(self):
        detector = PIIDetector()
        detector.register_country(INDIA_PATTERNS)
        text = 'Aadhaar: 234567890124, PAN: ABCPD1234E'
        results = detector.detect(text, countries=['in'])
        assert 'in' in results

    def test_list_categories(self):
        categories = INDIA_PATTERNS.list_categories()
        assert 'aadhaar' in categories
        assert 'pan' in categories
        assert 'passport' in categories
