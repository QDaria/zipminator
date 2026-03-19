# tests/python/test_pii_de.py
"""Tests for German PII detection patterns."""

import pytest
from src.zipminator.crypto.patterns._base import PIIDetector
from src.zipminator.crypto.patterns.germany import GERMANY_PATTERNS
from src.zipminator.crypto.patterns.validators import validate_german_steuer_id


class TestGermanSteuerIdValidator:
    """Tests for validate_german_steuer_id."""

    def test_valid_steuer_id(self):
        result = validate_german_steuer_id('65929970489')
        assert result['valid'] is True
        assert result['checksum_valid'] is True

    def test_valid_steuer_id_second(self):
        result = validate_german_steuer_id('86095742719')
        assert result['valid'] is True
        assert result['checksum_valid'] is True

    def test_valid_steuer_id_third(self):
        result = validate_german_steuer_id('12345678903')
        assert result['valid'] is True
        assert result['checksum_valid'] is True

    def test_invalid_checksum(self):
        result = validate_german_steuer_id('65929970480')
        assert result['valid'] is False
        assert 'checksum' in result.get('reason', '').lower()

    def test_first_digit_zero(self):
        result = validate_german_steuer_id('05929970489')
        assert result['valid'] is False

    def test_too_short(self):
        result = validate_german_steuer_id('1234567890')
        assert result['valid'] is False

    def test_too_long(self):
        result = validate_german_steuer_id('123456789012')
        assert result['valid'] is False

    def test_non_digit(self):
        result = validate_german_steuer_id('6592997048A')
        assert result['valid'] is False

    def test_with_spaces(self):
        result = validate_german_steuer_id('65929 970489')
        assert result['valid'] is True


class TestGermanyPatterns:
    """Tests for GERMANY_PATTERNS integration."""

    def test_country_code(self):
        assert GERMANY_PATTERNS.country_code == 'de'

    def test_regulation(self):
        assert 'GDPR' in GERMANY_PATTERNS.regulation

    def test_steuer_id_detection(self):
        text = 'My tax ID is 65929970489 for filing.'
        results = GERMANY_PATTERNS.detect_all(text)
        assert 'steuer_id' in results
        assert '65929970489' in results['steuer_id']

    def test_steuer_id_invalid_not_detected(self):
        text = 'Number 65929970480 is not valid.'
        results = GERMANY_PATTERNS.detect_all(text)
        assert 'steuer_id' not in results

    def test_detector_integration(self):
        detector = PIIDetector()
        detector.register_country(GERMANY_PATTERNS)
        text = 'Steuer-ID: 86095742719'
        results = detector.detect(text, countries=['de'])
        assert 'de' in results
        assert 'steuer_id' in results['de']

    def test_list_categories(self):
        categories = GERMANY_PATTERNS.list_categories()
        assert 'steuer_id' in categories
        assert 'personalausweis' in categories
        assert 'iban' in categories
