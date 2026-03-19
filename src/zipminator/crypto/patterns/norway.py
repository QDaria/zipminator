# zipminator/patterns/norway.py
"""Norway PII detection patterns (GDPR compliance)."""

from ._base import PIIPattern, CountryPatterns
from .validators import validate_norwegian_fodselsnummer, mod11_checksum


def validate_norwegian_org_number(org: str) -> dict:
    """
    Validate Norwegian organization number.

    Format: 9 digits starting with 8 or 9.
    MOD11 checksum on the last digit.
    """
    cleaned = org.replace(' ', '')

    if len(cleaned) != 9 or not cleaned.isdigit():
        return {'valid': False, 'reason': 'Invalid format'}

    if cleaned[0] not in ('8', '9'):
        return {'valid': False, 'reason': f'Must start with 8 or 9, got {cleaned[0]}'}

    weights = [3, 2, 7, 6, 5, 4, 3, 2]
    calculated = mod11_checksum(cleaned[0:8], weights)

    if calculated == 10:
        return {'valid': False, 'reason': 'Invalid checksum (remainder yields 10)'}

    if calculated != int(cleaned[8]):
        return {'valid': False, 'reason': 'Invalid MOD11 checksum'}

    return {
        'valid': True,
        'checksum_valid': True,
        'metadata': {
            'formatted': f"{cleaned[0:3]} {cleaned[3:6]} {cleaned[6:9]}"
        }
    }


def validate_norwegian_bank_account(account: str) -> dict:
    """
    Validate Norwegian bank account number.

    Format: 11 digits. MOD11 checksum on the last digit.
    """
    cleaned = account.replace('.', '').replace(' ', '')

    if len(cleaned) != 11 or not cleaned.isdigit():
        return {'valid': False, 'reason': 'Invalid format'}

    weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
    calculated = mod11_checksum(cleaned[0:10], weights)

    if calculated == 10:
        return {'valid': False, 'reason': 'Invalid checksum (remainder yields 10)'}

    if calculated != int(cleaned[10]):
        return {'valid': False, 'reason': 'Invalid MOD11 checksum'}

    return {
        'valid': True,
        'checksum_valid': True,
        'metadata': {
            'formatted': f"{cleaned[0:4]}.{cleaned[4:6]}.{cleaned[6:11]}"
        }
    }


# Norway PII Patterns
NORWAY_PATTERNS = CountryPatterns(
    country_code='no',
    country_name='Norway',
    regulation='GDPR',
    language='no',
    patterns={
        # Fødselsnummer (National ID)
        'fodselsnummer': PIIPattern(
            name='Norwegian Fødselsnummer',
            category='national_id',
            regex=r'\b\d{11}\b',
            description='Norwegian personal identification number (11 digits, MOD11 checksum)',
            validator=validate_norwegian_fodselsnummer,
            examples=[
                '13097248022',
            ],
            sensitivity=5
        ),

        # D-nummer (temporary ID for foreign nationals, day + 40)
        'd_nummer': PIIPattern(
            name='Norwegian D-nummer',
            category='national_id',
            regex=r'\b[4-7]\d{10}\b',
            description='Norwegian D-nummer for foreign nationals (day + 40, 11 digits)',
            validator=validate_norwegian_fodselsnummer,
            examples=[
                '53097248016',
            ],
            sensitivity=5
        ),

        # Organization number
        'org_number': PIIPattern(
            name='Norwegian Organization Number',
            category='business_id',
            regex=r'\b[89]\d{8}\b',
            description='Norwegian organization number (9 digits starting with 8 or 9, MOD11)',
            validator=validate_norwegian_org_number,
            examples=[
                '923456789',
            ],
            sensitivity=3
        ),

        # Bank account number
        'bank_account': PIIPattern(
            name='Norwegian Bank Account Number',
            category='financial',
            regex=r'\b\d{4}[\.\s]?\d{2}[\.\s]?\d{5}\b',
            description='Norwegian bank account number (11 digits, MOD11)',
            validator=validate_norwegian_bank_account,
            examples=[
                '1234.56.12345',
            ],
            sensitivity=4
        ),
    }
)
