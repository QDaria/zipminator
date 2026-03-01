# zipminator/patterns/uk.py
"""UK PII detection patterns (GDPR compliance)."""

from ._base import PIIPattern, CountryPatterns
from .validators import validate_uk_ni_number, luhn_checksum


def validate_uk_nhs_number(nhs: str) -> dict:
    """
    Validate UK NHS number (10 digits with checksum).

    Format: XXX XXX XXXX (10 digits)
    Check digit is calculated using MOD11 algorithm
    """
    nhs = nhs.replace(' ', '')

    if len(nhs) != 10 or not nhs.isdigit():
        return {'valid': False, 'reason': 'Invalid format'}

    # Calculate checksum (MOD11)
    weights = [10, 9, 8, 7, 6, 5, 4, 3, 2]
    total = sum(int(nhs[i]) * weights[i] for i in range(9))
    checksum = 11 - (total % 11)

    if checksum == 11:
        checksum = 0

    check_digit = int(nhs[9])

    if checksum == 10 or checksum != check_digit:
        return {'valid': False, 'reason': 'Invalid checksum'}

    return {
        'valid': True,
        'checksum_valid': True,
        'metadata': {
            'formatted': f"{nhs[0:3]} {nhs[3:6]} {nhs[6:10]}"
        }
    }


# UK PII Patterns
UK_PATTERNS = CountryPatterns(
    country_code='uk',
    country_name='United Kingdom',
    regulation='UK GDPR',
    language='en',
    patterns={
        # National Insurance Number
        'ni_number': PIIPattern(
            name='UK National Insurance Number',
            category='national_id',
            regex=r'\b[A-CEGHJ-PR-TW-Z][A-CEGHJ-NPR-TW-Z]\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]\b',
            description='UK National Insurance number (format: XX 12 34 56 A)',
            validator=validate_uk_ni_number,
            examples=[
                'AB123456C',
                'AB 12 34 56 C',
                'JY 12 34 56 D'
            ],
            false_positives=[
                'BG123456A',  # Invalid prefix
                'GB123456A',  # Invalid prefix
            ],
            sensitivity=5
        ),

        # NHS Number
        'nhs_number': PIIPattern(
            name='UK NHS Number',
            category='health_id',
            regex=r'\b\d{3}\s?\d{3}\s?\d{4}\b',
            description='UK National Health Service number (10 digits)',
            validator=validate_uk_nhs_number,
            examples=[
                '123 456 7890',
                '9434765870'
            ],
            sensitivity=5
        ),

        # UK Passport
        'passport': PIIPattern(
            name='UK Passport Number',
            category='travel_document',
            regex=r'\b\d{9}\b',
            description='UK passport number (9 digits)',
            examples=['123456789'],
            sensitivity=4
        ),

        # UK Driving License
        'driving_license': PIIPattern(
            name='UK Driving License',
            category='identity_document',
            regex=r'\b[A-Z]{5}\d{6}[A-Z]{2}\d[A-Z]{2}\b',
            description='UK driving license number (format: MORGA657054SM9IJ)',
            examples=['MORGA657054SM9IJ'],
            sensitivity=4
        ),

        # Bank Account (Sort Code + Account Number)
        'bank_account': PIIPattern(
            name='UK Bank Account',
            category='financial',
            regex=r'\b\d{2}[-\s]?\d{2}[-\s]?\d{2}\s+\d{8}\b',
            description='UK bank account (sort code + account number)',
            examples=[
                '12-34-56 12345678',
                '12 34 56 12345678'
            ],
            sensitivity=5
        ),

        # Credit Card (generic, works for UK)
        'credit_card': PIIPattern(
            name='Credit Card Number',
            category='financial',
            regex=r'\b(?:\d{4}[-\s]?){3}\d{4}\b',
            description='Credit card number (16 digits)',
            validator=lambda cc: {'valid': luhn_checksum(cc.replace('-', '').replace(' ', ''))}
,
            examples=[
                '1234 5678 9012 3456',
                '1234-5678-9012-3456'
            ],
            sensitivity=5
        ),

        # Email
        'email': PIIPattern(
            name='Email Address',
            category='contact',
            regex=r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            description='Email address',
            examples=['john.doe@example.com'],
            sensitivity=3
        ),

        # UK Phone Number
        'phone': PIIPattern(
            name='UK Phone Number',
            category='contact',
            regex=r'\b(?:\+44\s?|0)(?:\d{2}\s?\d{4}\s?\d{4}|\d{3}\s?\d{3}\s?\d{4})\b',
            description='UK phone number (landline or mobile)',
            examples=[
                '+44 20 1234 5678',
                '020 1234 5678',
                '07700 900123'
            ],
            sensitivity=3
        ),

        # UK Postcode
        'postcode': PIIPattern(
            name='UK Postcode',
            category='location',
            regex=r'\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b',
            description='UK postcode',
            examples=[
                'SW1A 1AA',
                'EC1A1BB',
                'W1A0AX'
            ],
            sensitivity=2
        ),

        # Vehicle Registration (License Plate)
        'vehicle_registration': PIIPattern(
            name='UK Vehicle Registration',
            category='vehicle',
            regex=r'\b[A-Z]{2}\d{2}\s?[A-Z]{3}\b',
            description='UK vehicle registration plate (format: AB12 CDE)',
            examples=[
                'AB12 CDE',
                'XY99ZZZ'
            ],
            sensitivity=3
        ),
    }
)
