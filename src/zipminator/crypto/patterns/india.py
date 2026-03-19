# zipminator/patterns/india.py
"""India PII detection patterns (DPDP Act compliance)."""

from ._base import PIIPattern, CountryPatterns
from .validators import validate_india_aadhaar, validate_india_pan


# India PII Patterns
INDIA_PATTERNS = CountryPatterns(
    country_code='in',
    country_name='India',
    regulation='DPDP Act (Digital Personal Data Protection Act)',
    language='en',  # English and Hindi; patterns use Latin script
    patterns={
        # Aadhaar Number
        'aadhaar': PIIPattern(
            name='Indian Aadhaar Number',
            category='national_id',
            regex=r'\b[2-9]\d{3}\s?\d{4}\s?\d{4}\b',
            description='Indian Aadhaar number (12 digits, starts with 2-9, Verhoeff checksum)',
            validator=validate_india_aadhaar,
            examples=[
                '234567890120',
                '2345 6789 0120',
            ],
            sensitivity=5
        ),

        # PAN (Permanent Account Number)
        'pan': PIIPattern(
            name='Indian PAN',
            category='tax_id',
            regex=r'\b[A-Z]{5}\d{4}[A-Z]\b',
            description='Indian Permanent Account Number (AAAAA9999A format)',
            validator=validate_india_pan,
            examples=[
                'ABCPD1234E',
                'BNZPM2501F',
            ],
            sensitivity=5
        ),

        # Indian Passport
        'passport': PIIPattern(
            name='Indian Passport Number',
            category='travel_document',
            regex=r'\b[A-Z][1-9]\d{6}\b',
            description='Indian passport number (1 letter + 7 digits, first digit non-zero)',
            examples=[
                'A2096457',
                'J8369854',
            ],
            sensitivity=4
        ),

        # Voter ID (EPIC)
        'voter_id': PIIPattern(
            name='Indian Voter ID (EPIC)',
            category='identity_document',
            regex=r'\b[A-Z]{3}\d{7}\b',
            description='Indian Voter ID / EPIC number (3 letters + 7 digits)',
            examples=['ABC1234567'],
            sensitivity=4
        ),

        # Indian Phone Number
        'phone': PIIPattern(
            name='Indian Phone Number',
            category='contact',
            regex=r'\b(?:\+91|0091|91)?\s?[6-9]\d{4}[-\s]?\d{5}\b',
            description='Indian mobile phone number (10 digits, starts with 6-9)',
            examples=[
                '+91 98765 43210',
                '9876543210',
                '+91-98765-43210',
            ],
            sensitivity=3
        ),

        # Email
        'email': PIIPattern(
            name='Email Address',
            category='contact',
            regex=r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            description='Email address',
            examples=['priya.sharma@example.in'],
            sensitivity=3
        ),

        # PIN Code
        'pin_code': PIIPattern(
            name='Indian PIN Code',
            category='location',
            regex=r'\b[1-9]\d{5}\b',
            description='Indian postal PIN code (6 digits, first digit non-zero)',
            examples=['110001', '400001'],
            sensitivity=2
        ),
    }
)
