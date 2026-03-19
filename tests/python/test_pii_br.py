# tests/python/test_pii_br.py
"""Tests for Brazilian PII detection patterns."""

import pytest
from src.zipminator.crypto.patterns._base import PIIDetector
from src.zipminator.crypto.patterns.brazil import BRAZIL_PATTERNS
from src.zipminator.crypto.patterns.validators import (
    validate_brazilian_cpf,
    validate_brazilian_cnpj,
)


class TestBrazilianCpfValidator:
    """Tests for validate_brazilian_cpf (already existed, regression tests)."""

    def test_valid_cpf(self):
        result = validate_brazilian_cpf('52998224725')
        assert result['valid'] is True
        assert result['checksum_valid'] is True

    def test_valid_cpf_formatted(self):
        result = validate_brazilian_cpf('529.982.247-25')
        assert result['valid'] is True

    def test_invalid_checksum(self):
        result = validate_brazilian_cpf('52998224726')
        assert result['valid'] is False

    def test_all_same_digits(self):
        result = validate_brazilian_cpf('11111111111')
        assert result['valid'] is False

    def test_too_short(self):
        result = validate_brazilian_cpf('1234567890')
        assert result['valid'] is False


class TestBrazilianCnpjValidator:
    """Tests for validate_brazilian_cnpj."""

    def test_valid_cnpj(self):
        result = validate_brazilian_cnpj('11222333000181')
        assert result['valid'] is True
        assert result['checksum_valid'] is True

    def test_valid_cnpj_formatted(self):
        result = validate_brazilian_cnpj('11.222.333/0001-81')
        assert result['valid'] is True

    def test_valid_cnpj_second(self):
        result = validate_brazilian_cnpj('11444777000161')
        assert result['valid'] is True

    def test_valid_cnpj_third(self):
        result = validate_brazilian_cnpj('53146407000198')
        assert result['valid'] is True

    def test_invalid_first_check_digit(self):
        result = validate_brazilian_cnpj('11222333000191')
        assert result['valid'] is False

    def test_invalid_second_check_digit(self):
        result = validate_brazilian_cnpj('11222333000182')
        assert result['valid'] is False

    def test_all_same_digits(self):
        result = validate_brazilian_cnpj('11111111111111')
        assert result['valid'] is False

    def test_too_short(self):
        result = validate_brazilian_cnpj('1122233300018')
        assert result['valid'] is False

    def test_non_digit(self):
        result = validate_brazilian_cnpj('1122233300018A')
        assert result['valid'] is False

    def test_formatted_metadata(self):
        result = validate_brazilian_cnpj('11222333000181')
        assert result['metadata']['formatted'] == '11.222.333/0001-81'


class TestBrazilPatterns:
    """Tests for BRAZIL_PATTERNS integration."""

    def test_country_code(self):
        assert BRAZIL_PATTERNS.country_code == 'br'

    def test_regulation(self):
        assert 'LGPD' in BRAZIL_PATTERNS.regulation

    def test_cpf_detection(self):
        text = 'CPF: 52998224725'
        results = BRAZIL_PATTERNS.detect_all(text)
        assert 'cpf' in results

    def test_cnpj_detection(self):
        text = 'CNPJ: 11222333000181'
        results = BRAZIL_PATTERNS.detect_all(text)
        assert 'cnpj' in results

    def test_detector_integration(self):
        detector = PIIDetector()
        detector.register_country(BRAZIL_PATTERNS)
        text = 'CPF 52998224725 and CNPJ 11222333000181'
        results = detector.detect(text, countries=['br'])
        assert 'br' in results

    def test_list_categories(self):
        categories = BRAZIL_PATTERNS.list_categories()
        assert 'cpf' in categories
        assert 'cnpj' in categories
