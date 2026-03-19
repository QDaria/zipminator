# zipminator/patterns/germany.py
"""Germany PII detection patterns (GDPR compliance)."""

from ._base import PIIPattern, CountryPatterns
from .validators import validate_german_steuer_id


# Germany PII Patterns
GERMANY_PATTERNS = CountryPatterns(
    country_code='de',
    country_name='Germany',
    regulation='GDPR (DSGVO)',
    language='de',
    patterns={
        # Steuerliche Identifikationsnummer (Tax ID)
        'steuer_id': PIIPattern(
            name='German Steuerliche Identifikationsnummer',
            category='tax_id',
            regex=r'\b[1-9]\d{10}\b',
            description='German tax identification number (11 digits, first digit non-zero)',
            validator=validate_german_steuer_id,
            examples=[
                '65929970489',
                '86095742719',
            ],
            sensitivity=5
        ),

        # Personalausweis (Identity Card)
        'personalausweis': PIIPattern(
            name='German Personalausweis',
            category='identity_document',
            regex=r'\b[CFGHJKLMNPRTVWXYZ0-9]{10}\b',
            description='German identity card number (10 alphanumeric characters)',
            examples=[
                'T220001293',
                'L01X00T471',
            ],
            sensitivity=5
        ),

        # IBAN (Germany)
        'iban': PIIPattern(
            name='German IBAN',
            category='financial',
            regex=r'\bDE\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}\b',
            description='German IBAN (DE + 20 digits)',
            examples=[
                'DE89 3704 0044 0532 0130 00',
                'DE89370400440532013000',
            ],
            sensitivity=5
        ),

        # Email
        'email': PIIPattern(
            name='Email Address',
            category='contact',
            regex=r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            description='Email address',
            examples=['hans.mueller@example.de'],
            sensitivity=3
        ),

        # German Phone Number
        'phone': PIIPattern(
            name='German Phone Number',
            category='contact',
            regex=r'\b(?:\+49|0049|49)?\s?(?:\(?\d{2,5}\)?)[-\s]?\d{3,8}[-\s]?\d{0,5}\b',
            description='German phone number (landline or mobile)',
            examples=[
                '+49 30 12345678',
                '+49 170 1234567',
                '030 12345678',
            ],
            sensitivity=3
        ),

        # German Passport
        'passport': PIIPattern(
            name='German Passport Number',
            category='travel_document',
            regex=r'\b[CFGHJK][0-9A-Z]{8}\b',
            description='German passport number (1 letter + 8 alphanumeric)',
            examples=['C01X00T47'],
            sensitivity=4
        ),

        # Postal Code
        'postal_code': PIIPattern(
            name='German Postal Code',
            category='location',
            regex=r'\b\d{5}\b',
            description='German postal code (5 digits)',
            examples=['10115', '80331'],
            sensitivity=2
        ),
    }
)
