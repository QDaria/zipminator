# zipminator/patterns/japan.py
"""Japan PII detection patterns (APPI compliance)."""

from ._base import PIIPattern, CountryPatterns
from .validators import validate_japan_my_number


# Japan PII Patterns
JAPAN_PATTERNS = CountryPatterns(
    country_code='jp',
    country_name='Japan',
    regulation='APPI (Act on the Protection of Personal Information)',
    language='ja',
    patterns={
        # My Number (Individual Number)
        'my_number': PIIPattern(
            name='Japanese My Number',
            category='national_id',
            regex=r'\b\d{4}\s?\d{4}\s?\d{4}\b',
            description='Japanese My Number / Individual Number (12 digits with check digit)',
            validator=validate_japan_my_number,
            examples=[
                '123456789018',
                '1234 5678 9018',
            ],
            sensitivity=5
        ),

        # Japanese Passport
        'passport': PIIPattern(
            name='Japanese Passport Number',
            category='travel_document',
            regex=r'\b[A-Z]{2}\d{7}\b',
            description='Japanese passport number (2 letters + 7 digits)',
            examples=['TK1234567'],
            sensitivity=4
        ),

        # Driver's License
        'drivers_license': PIIPattern(
            name='Japanese Driver\'s License',
            category='identity_document',
            regex=r'\b\d{12}\b',
            description='Japanese driver\'s license number (12 digits)',
            examples=['123456789012'],
            sensitivity=4
        ),

        # Japanese Phone Number
        'phone': PIIPattern(
            name='Japanese Phone Number',
            category='contact',
            regex=r'\b(?:\+81|0081|81)?\s?(?:0?\d{1,4})[-\s]?\d{2,4}[-\s]?\d{4}\b',
            description='Japanese phone number (mobile or landline)',
            examples=[
                '+81 90 1234 5678',
                '090-1234-5678',
                '03-1234-5678',
            ],
            sensitivity=3
        ),

        # Email
        'email': PIIPattern(
            name='Email Address',
            category='contact',
            regex=r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            description='Email address',
            examples=['tanaka@example.jp'],
            sensitivity=3
        ),

        # Postal Code
        'postal_code': PIIPattern(
            name='Japanese Postal Code',
            category='location',
            regex=r'\b\d{3}[-]?\d{4}\b',
            description='Japanese postal code (7 digits, XXX-XXXX)',
            examples=[
                '100-0001',
                '1000001',
            ],
            sensitivity=2
        ),
    }
)
