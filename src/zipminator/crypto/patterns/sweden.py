# zipminator/patterns/sweden.py
"""Sweden PII detection patterns (GDPR compliance)."""

from ._base import PIIPattern, CountryPatterns
from .validators import validate_swedish_personnummer, luhn_checksum


def validate_swedish_org_number(org: str) -> dict:
    """
    Validate Swedish organization number.

    Format: XXXXXX-XXXX (10 digits). Third digit >= 2 distinguishes from personnummer.
    Luhn checksum on all 10 digits.
    """
    cleaned = org.replace('-', '').replace(' ', '')

    if len(cleaned) != 10 or not cleaned.isdigit():
        return {'valid': False, 'reason': 'Invalid format'}

    # Third digit must be >= 2 for org numbers
    if int(cleaned[2]) < 2:
        return {'valid': False, 'reason': 'Third digit must be >= 2 for org numbers'}

    if not luhn_checksum(cleaned):
        return {'valid': False, 'reason': 'Invalid Luhn checksum'}

    return {
        'valid': True,
        'checksum_valid': True,
        'metadata': {
            'formatted': f"{cleaned[0:6]}-{cleaned[6:10]}"
        }
    }


# Sweden PII Patterns
SWEDEN_PATTERNS = CountryPatterns(
    country_code='se',
    country_name='Sweden',
    regulation='GDPR',
    language='sv',
    patterns={
        # Personnummer (Personal Identity Number)
        'personnummer': PIIPattern(
            name='Swedish Personnummer',
            category='national_id',
            regex=r'\b(?:\d{8}[-+]?\d{4}|\d{6}[-+]\d{4})\b',
            description='Swedish personal identity number (YYMMDD-XXXX or YYYYMMDD-XXXX)',
            validator=validate_swedish_personnummer,
            examples=[
                '811228-9874',
                '19811228-9874',
                '8112289874',
            ],
            sensitivity=5
        ),

        # Samordningsnummer (coordination number, day + 60)
        'samordningsnummer': PIIPattern(
            name='Swedish Samordningsnummer',
            category='national_id',
            regex=r'\b\d{6}[-+]?\d{4}\b',
            description='Swedish coordination number (like personnummer but day + 60)',
            validator=validate_swedish_personnummer,
            examples=[
                '811288-9814',
            ],
            sensitivity=5
        ),

        # Organization number
        'org_number': PIIPattern(
            name='Swedish Organization Number',
            category='business_id',
            regex=r'\b\d{6}-?\d{4}\b',
            description='Swedish organization number (10 digits, 3rd digit >= 2, Luhn)',
            validator=validate_swedish_org_number,
            examples=[
                '556036-0793',
            ],
            sensitivity=3
        ),
    }
)
