# zipminator/patterns/canada.py
"""Canada PII detection patterns (PIPEDA compliance)."""

from ._base import PIIPattern, CountryPatterns
from .validators import validate_canada_sin, luhn_checksum


# Canada PII Patterns
CANADA_PATTERNS = CountryPatterns(
    country_code='ca',
    country_name='Canada',
    regulation='PIPEDA (Personal Information Protection and Electronic Documents Act)',
    language='en',  # English and French
    patterns={
        # Social Insurance Number (SIN)
        'sin': PIIPattern(
            name='Canadian Social Insurance Number',
            category='national_id',
            regex=r'\b\d{3}[-\s]?\d{3}[-\s]?\d{3}\b',
            description='Canadian SIN (9 digits, Luhn checksum)',
            validator=validate_canada_sin,
            examples=[
                '046 454 286',
                '046-454-286',
                '046454286',
            ],
            false_positives=[
                '000-000-000',
                '111-111-111',
            ],
            sensitivity=5
        ),

        # Health Card (Ontario format as common example)
        'health_card': PIIPattern(
            name='Canadian Health Card Number',
            category='health_id',
            regex=r'\b\d{4}[-\s]?\d{3}[-\s]?\d{3}\b',
            description='Canadian health card number (varies by province, 10 digits common)',
            examples=[
                '1234-567-890',
                '1234567890',
            ],
            sensitivity=5
        ),

        # Canadian Passport
        'passport': PIIPattern(
            name='Canadian Passport Number',
            category='travel_document',
            regex=r'\b[A-Z]{2}\d{6}\b',
            description='Canadian passport number (2 letters + 6 digits)',
            examples=['AB123456'],
            sensitivity=4
        ),

        # Driver's License (Ontario format as example)
        'drivers_license': PIIPattern(
            name='Canadian Driver\'s License',
            category='identity_document',
            regex=r'\b[A-Z]\d{4}[-\s]?\d{5}[-\s]?\d{5}\b',
            description='Canadian driver\'s license (varies by province)',
            examples=['A1234-56789-01234'],
            sensitivity=4
        ),

        # Canadian Phone Number
        'phone': PIIPattern(
            name='Canadian Phone Number',
            category='contact',
            regex=r'\b(?:\+1\s?)?(?:\(\d{3}\)|\d{3})[-\s]?\d{3}[-\s]?\d{4}\b',
            description='Canadian phone number (10 digits, +1 country code)',
            examples=[
                '+1 (416) 555-1234',
                '416-555-1234',
                '4165551234',
            ],
            sensitivity=3
        ),

        # Email
        'email': PIIPattern(
            name='Email Address',
            category='contact',
            regex=r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            description='Email address',
            examples=['sarah.johnson@example.ca'],
            sensitivity=3
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
                '5425-2334-3010-9903',
            ],
            sensitivity=5
        ),

        # Postal Code
        'postal_code': PIIPattern(
            name='Canadian Postal Code',
            category='location',
            regex=r'\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b',
            description='Canadian postal code (A1A 1A1 format)',
            examples=[
                'M5V 2T6',
                'K1A0B1',
            ],
            sensitivity=2
        ),
    }
)
