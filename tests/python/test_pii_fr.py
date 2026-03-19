# tests/python/test_pii_fr.py
"""Tests for French PII detection patterns."""

import pytest
from src.zipminator.crypto.patterns._base import PIIDetector
from src.zipminator.crypto.patterns.france import FRANCE_PATTERNS
from src.zipminator.crypto.patterns.validators import (
    validate_french_nir,
    validate_french_nir_corsica,
)


class TestFrenchNirValidator:
    """Tests for validate_french_nir."""

    def test_valid_nir_female(self):
        result = validate_french_nir('269054958815780')
        assert result['valid'] is True
        assert result['checksum_valid'] is True
        assert result['metadata']['gender'] == 'female'

    def test_valid_nir_male(self):
        result = validate_french_nir('185056800700126')
        assert result['valid'] is True
        assert result['metadata']['gender'] == 'male'

    def test_invalid_key(self):
        result = validate_french_nir('269054958815799')
        assert result['valid'] is False
        assert 'key' in result.get('reason', '').lower()

    def test_invalid_sex_digit(self):
        result = validate_french_nir('369054958815780')
        assert result['valid'] is False

    def test_invalid_month(self):
        result = validate_french_nir('199134958815780')
        assert result['valid'] is False

    def test_too_short(self):
        result = validate_french_nir('26905495881578')
        assert result['valid'] is False

    def test_too_long(self):
        result = validate_french_nir('2690549588157801')
        assert result['valid'] is False

    def test_non_digit(self):
        result = validate_french_nir('26905495881578A')
        assert result['valid'] is False

    def test_with_spaces(self):
        result = validate_french_nir('2 69 05 49 588 157 80')
        assert result['valid'] is True  # Spaces are stripped before validation

    def test_metadata_fields(self):
        result = validate_french_nir('269054958815780')
        assert result['metadata']['birth_year_suffix'] == '69'
        assert result['metadata']['birth_month'] == 5
        assert result['metadata']['department'] == '49'


class TestFrenchNirCorsicaValidator:
    """Tests for validate_french_nir_corsica."""

    def test_corsica_2a_format(self):
        # Build a valid Corsica NIR with 2A department
        # Replace dept with 19 for computation: body with 19 at pos 5-6
        body_numeric = '1850519007001'
        key = 97 - (int(body_numeric) % 97)
        nir_corsica = body_numeric[:5] + '2A' + body_numeric[7:] + str(key).zfill(2)
        # This won't be 15 chars because we replaced 2 digits with 2 chars (same)
        # Actually 2A is 2 chars same as 19, so length stays 15
        nir_corsica = '18505' + '2A' + '007001' + str(key).zfill(2)
        assert len(nir_corsica) == 15
        result = validate_french_nir_corsica(nir_corsica)
        assert result['valid'] is True

    def test_invalid_corsica(self):
        result = validate_french_nir_corsica('18505XX00700126')
        assert result['valid'] is False


class TestFrancePatterns:
    """Tests for FRANCE_PATTERNS integration."""

    def test_country_code(self):
        assert FRANCE_PATTERNS.country_code == 'fr'

    def test_regulation(self):
        assert 'GDPR' in FRANCE_PATTERNS.regulation

    def test_nir_detection(self):
        text = 'NIR: 269054958815780'
        results = FRANCE_PATTERNS.detect_all(text)
        assert 'nir' in results

    def test_detector_integration(self):
        detector = PIIDetector()
        detector.register_country(FRANCE_PATTERNS)
        text = 'Numero INSEE: 185056800700126'
        results = detector.detect(text, countries=['fr'])
        assert 'fr' in results
        assert 'nir' in results['fr']

    def test_list_categories(self):
        categories = FRANCE_PATTERNS.list_categories()
        assert 'nir' in categories
        assert 'carte_identite' in categories
