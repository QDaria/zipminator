# zipminator/patterns/denmark.py
"""Denmark PII detection patterns (GDPR compliance)."""

from ._base import PIIPattern, CountryPatterns
from .validators import validate_danish_cpr


def validate_danish_cvr(cvr: str) -> dict:
    """
    Validate Danish CVR number (Central Business Register).

    Format: 8 digits. MOD11 checksum.
    """
    cleaned = cvr.replace(' ', '').replace('-', '')

    if len(cleaned) != 8 or not cleaned.isdigit():
        return {'valid': False, 'reason': 'Invalid format'}

    weights = [2, 7, 6, 5, 4, 3, 2, 1]
    total = sum(int(d) * w for d, w in zip(cleaned, weights))

    if total % 11 != 0:
        return {'valid': False, 'reason': 'Invalid MOD11 checksum'}

    return {
        'valid': True,
        'checksum_valid': True,
        'metadata': {
            'formatted': f"DK{cleaned}"
        }
    }


# Denmark PII Patterns
DENMARK_PATTERNS = CountryPatterns(
    country_code='dk',
    country_name='Denmark',
    regulation='GDPR',
    language='da',
    patterns={
        # CPR Number (Det Centrale Personregister)
        'cpr': PIIPattern(
            name='Danish CPR Number',
            category='national_id',
            regex=r'\b\d{6}[-\s]?\d{4}\b',
            description='Danish CPR number (DDMMYY-SSSS, 10 digits, MOD11 for pre-2007)',
            validator=validate_danish_cpr,
            examples=[
                '010180-1234',
                '0101801234',
            ],
            sensitivity=5
        ),

        # CVR Number (Central Business Register)
        'cvr': PIIPattern(
            name='Danish CVR Number',
            category='business_id',
            regex=r'\b\d{8}\b',
            description='Danish CVR company registration number (8 digits, MOD11)',
            validator=validate_danish_cvr,
            examples=[
                '13585628',
            ],
            sensitivity=3
        ),
    }
)
