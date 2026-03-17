# zipminator/patterns/usa.py
"""USA PII detection patterns (CCPA, HIPAA compliance)."""

from ._base import PIIPattern, CountryPatterns
from .validators import validate_us_ssn, luhn_checksum


def validate_us_ein(ein: str) -> dict:
    """
    Validate US Employer Identification Number.

    Format: XX-XXXXXXX (9 digits total)
    """
    ein = ein.replace('-', '')

    if len(ein) != 9 or not ein.isdigit():
        return {'valid': False, 'reason': 'Invalid format'}

    # First 2 digits must be in valid range
    prefix = int(ein[0:2])
    valid_prefixes = list(range(1, 7)) + list(range(10, 13)) + list(range(15, 17)) + \
                     list(range(20, 27)) + list(range(30, 37)) + list(range(38, 62)) + \
                     list(range(71, 78)) + [80, 90]

    if prefix not in valid_prefixes:
        return {'valid': False, 'reason': f'Invalid prefix: {prefix}'}

    return {
        'valid': True,
        'checksum_valid': True,  # EIN has no checksum
        'metadata': {
            'formatted': f"{ein[0:2]}-{ein[2:9]}"
        }
    }


# USA PII Patterns
USA_PATTERNS = CountryPatterns(
    country_code='us',
    country_name='United States',
    regulation='CCPA, HIPAA',
    language='en',
    patterns={
        # Social Security Number
        'ssn': PIIPattern(
            name='US Social Security Number',
            category='national_id',
            regex=r'\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b',
            description='US Social Security Number (format: XXX-XX-XXXX)',
            validator=validate_us_ssn,
            examples=[
                '123-45-6789',
                '123 45 6789',
                '123456789'
            ],
            false_positives=[
                '000-00-0000',
                '666-00-0000',
                '900-00-0000'
            ],
            sensitivity=5
        ),

        # Employer Identification Number
        'ein': PIIPattern(
            name='US Employer Identification Number',
            category='tax_id',
            regex=r'\b\d{2}[-\s]?\d{7}\b',
            description='US EIN (format: XX-XXXXXXX)',
            validator=validate_us_ein,
            examples=[
                '12-3456789',
                '12 3456789'
            ],
            sensitivity=4
        ),

        # Driver's License (generic pattern, varies by state)
        'drivers_license': PIIPattern(
            name='US Driver\'s License',
            category='identity_document',
            regex=r'\b[A-Z]{1,2}\d{5,8}\b',
            description='US driver\'s license (varies by state)',
            examples=[
                'A1234567',
                'AB12345'
            ],
            sensitivity=4
        ),

        # Passport
        'passport': PIIPattern(
            name='US Passport Number',
            category='travel_document',
            regex=r'\b[A-Z]{1,2}\d{6,9}\b',
            description='US passport number (1-2 letters + 6-9 digits)',
            examples=[
                'C12345678',
                'AB123456'
            ],
            sensitivity=4
        ),

        # Credit Card
        'credit_card': PIIPattern(
            name='Credit Card Number',
            category='financial',
            regex=r'\b(?:\d{4}[-\s]?){3}\d{4}\b',
            description='Credit card number (16 digits)',
            validator=lambda cc: {'valid': luhn_checksum(cc.replace('-', '').replace(' ', ''))},
            examples=[
                '4532 1234 5678 9010',
                '5425-2334-3010-9903'
            ],
            sensitivity=5
        ),

        # Bank Account Number
        'bank_account': PIIPattern(
            name='US Bank Account Number',
            category='financial',
            regex=r'\b\d{8,17}\b',
            description='US bank account number (8-17 digits)',
            examples=['123456789012'],
            sensitivity=5
        ),

        # Bank Routing Number
        'routing_number': PIIPattern(
            name='US Bank Routing Number',
            category='financial',
            regex=r'\b\d{9}\b',
            description='US bank routing number (9 digits, ABA number)',
            examples=['021000021'],
            sensitivity=4
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

        # US Phone Number
        'phone': PIIPattern(
            name='US Phone Number',
            category='contact',
            regex=r'\b(?:\+1\s?)?(?:\(\d{3}\)|\d{3})[-\s]?\d{3}[-\s]?\d{4}\b',
            description='US phone number (10 digits)',
            examples=[
                '+1 (555) 123-4567',
                '555-123-4567',
                '(555) 123 4567',
                '5551234567'
            ],
            sensitivity=3
        ),

        # ZIP Code
        'zip_code': PIIPattern(
            name='US ZIP Code',
            category='location',
            regex=r'\b\d{5}(?:-\d{4})?\b',
            description='US ZIP code (5 digits or ZIP+4)',
            examples=[
                '12345',
                '12345-6789'
            ],
            sensitivity=2
        ),

        # Vehicle Identification Number (VIN)
        'vin': PIIPattern(
            name='Vehicle Identification Number',
            category='vehicle',
            regex=r'\b[A-HJ-NPR-Z0-9]{17}\b',
            description='Vehicle identification number (17 characters)',
            examples=['1HGBH41JXMN109186'],
            sensitivity=3
        ),

        # Medicare Number (old format, pre-2019)
        'medicare_old': PIIPattern(
            name='Medicare Number (Old Format)',
            category='health_id',
            regex=r'\b\d{3}[-\s]?\d{2}[-\s]?\d{4}[A-Z]\b',
            description='Old Medicare number (SSN-based + suffix)',
            examples=['123-45-6789A'],
            sensitivity=5
        ),

        # Medicare Number (new format, post-2019)
        'medicare_new': PIIPattern(
            name='Medicare Beneficiary Identifier',
            category='health_id',
            regex=r'\b[1-9][A-C][A-HJ-NP-Z0-9]{2}[-\s]?[A-HJ-NP-Z0-9]{2}[-\s]?[A-HJ-NP-Z0-9]{4}\b',
            description='New Medicare Beneficiary Identifier (MBI)',
            examples=[
                '1AB2-CD3-EF45',
                '1AB2CD3EF45'
            ],
            sensitivity=5
        ),
    }
)
