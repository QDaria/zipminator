# zipminator/patterns/finland.py
"""Finland PII detection patterns (GDPR compliance)."""

from ._base import PIIPattern, CountryPatterns
from .validators import validate_finnish_henkilotunnus, mod11_checksum


def validate_finnish_y_tunnus(yt: str) -> dict:
    """
    Validate Finnish Y-tunnus (business ID).

    Format: XXXXXXX-X (7 digits, dash, 1 check digit).
    MOD11 checksum with weights [7, 9, 10, 5, 8, 4, 2].
    """
    cleaned = yt.replace('-', '').replace(' ', '')

    if len(cleaned) != 8 or not cleaned.isdigit():
        return {'valid': False, 'reason': 'Invalid format'}

    weights = [7, 9, 10, 5, 8, 4, 2]
    calculated = mod11_checksum(cleaned[0:7], weights)

    if calculated == 10:
        return {'valid': False, 'reason': 'Invalid checksum (remainder yields 10)'}

    if calculated != int(cleaned[7]):
        return {'valid': False, 'reason': 'Invalid MOD11 checksum'}

    return {
        'valid': True,
        'checksum_valid': True,
        'metadata': {
            'formatted': f"{cleaned[0:7]}-{cleaned[7]}"
        }
    }


# Finland PII Patterns
FINLAND_PATTERNS = CountryPatterns(
    country_code='fi',
    country_name='Finland',
    regulation='GDPR',
    language='fi',
    patterns={
        # Henkilotunnus (Personal Identity Code)
        'henkilotunnus': PIIPattern(
            name='Finnish Henkilötunnus',
            category='national_id',
            regex=r'\b\d{6}[+\-A]\d{3}[0-9A-Z]\b',
            description='Finnish personal identity code (DDMMYY[+-A]XXXC)',
            validator=validate_finnish_henkilotunnus,
            examples=[
                '131052-308T',
            ],
            sensitivity=5
        ),

        # Y-tunnus (Business ID)
        'y_tunnus': PIIPattern(
            name='Finnish Y-tunnus',
            category='business_id',
            regex=r'\b\d{7}-\d\b',
            description='Finnish business ID (XXXXXXX-X, MOD11)',
            validator=validate_finnish_y_tunnus,
            examples=[
                '0737546-2',
            ],
            sensitivity=3
        ),
    }
)
