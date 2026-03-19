# zipminator/patterns/australia.py
"""Australia PII detection patterns (Privacy Act 1988 compliance)."""

from ._base import PIIPattern, CountryPatterns
from .validators import validate_australia_tfn


# Australia PII Patterns
AUSTRALIA_PATTERNS = CountryPatterns(
    country_code='au',
    country_name='Australia',
    regulation='Privacy Act 1988',
    language='en',
    patterns={
        # Tax File Number (TFN)
        'tfn': PIIPattern(
            name='Australian Tax File Number',
            category='tax_id',
            regex=r'\b\d{3}\s?\d{3}\s?\d{2,3}\b',
            description='Australian TFN (8-9 digits, weighted checksum MOD 11)',
            validator=validate_australia_tfn,
            examples=[
                '123456782',
                '123 456 782',
            ],
            sensitivity=5
        ),

        # Medicare Number
        'medicare': PIIPattern(
            name='Australian Medicare Number',
            category='health_id',
            regex=r'\b\d{4}\s?\d{5}\s?\d{1,2}\b',
            description='Australian Medicare number (10-11 digits)',
            examples=[
                '2123 45670 1',
                '21234567012',
            ],
            sensitivity=5
        ),

        # Australian Passport
        'passport': PIIPattern(
            name='Australian Passport Number',
            category='travel_document',
            regex=r'\b[A-Z]{1,2}\d{7}\b',
            description='Australian passport number (1-2 letters + 7 digits)',
            examples=[
                'N1234567',
                'PA1234567',
            ],
            sensitivity=4
        ),

        # Driver's License (varies by state; NSW format as example)
        'drivers_license': PIIPattern(
            name='Australian Driver\'s License',
            category='identity_document',
            regex=r'\b\d{8,10}\b',
            description='Australian driver\'s license (varies by state, 8-10 digits)',
            examples=['12345678'],
            sensitivity=4
        ),

        # Australian Phone Number
        'phone': PIIPattern(
            name='Australian Phone Number',
            category='contact',
            regex=r'\b(?:\+61|0061|61)?\s?(?:0?\d)[-\s]?\d{4}[-\s]?\d{4}\b',
            description='Australian phone number (mobile or landline)',
            examples=[
                '+61 4 1234 5678',
                '0412 345 678',
                '02 1234 5678',
            ],
            sensitivity=3
        ),

        # Email
        'email': PIIPattern(
            name='Email Address',
            category='contact',
            regex=r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            description='Email address',
            examples=['emma.smith@example.com.au'],
            sensitivity=3
        ),

        # Australian Business Number (ABN)
        'abn': PIIPattern(
            name='Australian Business Number',
            category='business_id',
            regex=r'\b\d{2}\s?\d{3}\s?\d{3}\s?\d{3}\b',
            description='Australian Business Number (11 digits)',
            examples=[
                '51 824 753 556',
                '51824753556',
            ],
            sensitivity=3
        ),

        # Postal Code
        'postal_code': PIIPattern(
            name='Australian Postal Code',
            category='location',
            regex=r'\b\d{4}\b',
            description='Australian postal code (4 digits)',
            examples=['2000', '3000'],
            sensitivity=2
        ),
    }
)
