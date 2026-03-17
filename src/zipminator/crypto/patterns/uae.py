# zipminator/patterns/uae.py
"""UAE PII detection patterns (PDPL compliance - for Emirates pitch)."""

from ._base import PIIPattern, CountryPatterns
from .validators import validate_uae_emirates_id, luhn_checksum


# UAE PII Patterns
UAE_PATTERNS = CountryPatterns(
    country_code='ae',
    country_name='United Arab Emirates',
    regulation='PDPL (Personal Data Protection Law)',
    language='ar',  # Primary, but English widely used
    patterns={
        # Emirates ID
        'emirates_id': PIIPattern(
            name='UAE Emirates ID',
            category='national_id',
            regex=r'\b784[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d\b',
            description='UAE Emirates ID (format: 784-YYYY-NNNNNNN-C)',
            validator=validate_uae_emirates_id,
            examples=[
                '784-1990-1234567-8',
                '784 1990 1234567 8',
                '784199012345678'
            ],
            sensitivity=5
        ),

        # UAE Unified Number (Tax Registration)
        'tax_registration': PIIPattern(
            name='UAE Tax Registration Number',
            category='tax_id',
            regex=r'\b\d{15}\b',
            description='UAE Tax Registration Number (TRN - 15 digits)',
            examples=['123456789012345'],
            sensitivity=4
        ),

        # UAE Phone Number
        'phone': PIIPattern(
            name='UAE Phone Number',
            category='contact',
            regex=r'\b(?:\+971|00971|971)?\s?(?:50|52|54|55|56|58|2|3|4|6|7|9)\s?\d{3}\s?\d{4}\b',
            description='UAE phone number (mobile or landline)',
            examples=[
                '+971 50 123 4567',
                '050 123 4567',
                '971501234567',
                '+971 2 123 4567'  # Abu Dhabi landline
            ],
            sensitivity=3
        ),

        # Email
        'email': PIIPattern(
            name='Email Address',
            category='contact',
            regex=r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            description='Email address',
            examples=['ahmed@example.ae'],
            sensitivity=3
        ),

        # Credit Card (generic, works in UAE)
        'credit_card': PIIPattern(
            name='Credit Card Number',
            category='financial',
            regex=r'\b(?:\d{4}[-\s]?){3}\d{4}\b',
            description='Credit card number (16 digits)',
            validator=lambda cc: {'valid': luhn_checksum(cc.replace('-', '').replace(' ', ''))},
            examples=[
                '1234 5678 9012 3456',
                '1234-5678-9012-3456'
            ],
            sensitivity=5
        ),

        # IBAN (International Bank Account Number)
        'iban': PIIPattern(
            name='UAE IBAN',
            category='financial',
            regex=r'\bAE\d{21}\b',
            description='UAE IBAN (format: AE + 21 digits)',
            examples=['AE070331234567890123456'],
            sensitivity=5
        ),

        # Passport Number (UAE)
        'passport': PIIPattern(
            name='UAE Passport Number',
            category='travel_document',
            regex=r'\b[A-Z]\d{7}\b',
            description='UAE passport number (1 letter + 7 digits)',
            examples=['A1234567'],
            sensitivity=4
        ),

        # Trade License Number
        'trade_license': PIIPattern(
            name='UAE Trade License',
            category='business_id',
            regex=r'\b\d{6,10}\b',
            description='UAE Trade License Number',
            examples=['123456'],
            sensitivity=3
        ),

        # P.O. Box
        'po_box': PIIPattern(
            name='UAE P.O. Box',
            category='location',
            regex=r'\b(?:P\.?\s?O\.?\s?Box|PO Box)\s?\d+\b',
            description='UAE P.O. Box',
            examples=[
                'P.O. Box 12345',
                'PO Box 12345'
            ],
            sensitivity=2
        ),
    }
)

# Saudi Arabia PII Patterns (bonus - similar region)
SAUDI_PATTERNS = CountryPatterns(
    country_code='sa',
    country_name='Saudi Arabia',
    regulation='PDPL (Personal Data Protection Law)',
    language='ar',
    patterns={
        # Saudi National ID
        'national_id': PIIPattern(
            name='Saudi National ID',
            category='national_id',
            regex=r'\b[12]\d{9}\b',
            description='Saudi National ID (10 digits, starts with 1 or 2)',
            examples=['1234567890'],
            sensitivity=5
        ),

        # Saudi Iqama (Resident ID)
        'iqama': PIIPattern(
            name='Saudi Iqama Number',
            category='resident_id',
            regex=r'\b[2]\d{9}\b',
            description='Saudi Iqama (residence permit, 10 digits starting with 2)',
            examples=['2123456789'],
            sensitivity=5
        ),

        # Saudi Phone Number
        'phone': PIIPattern(
            name='Saudi Phone Number',
            category='contact',
            regex=r'\b(?:\+966|00966|966)?\s?(?:50|51|52|53|54|55|56|57|58|59|2|1)\s?\d{3}\s?\d{4}\b',
            description='Saudi phone number',
            examples=[
                '+966 50 123 4567',
                '0501234567',
                '966501234567'
            ],
            sensitivity=3
        ),

        # Email
        'email': PIIPattern(
            name='Email Address',
            category='contact',
            regex=r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            description='Email address',
            examples=['mohammed@example.sa'],
            sensitivity=3
        ),

        # IBAN (Saudi)
        'iban': PIIPattern(
            name='Saudi IBAN',
            category='financial',
            regex=r'\bSA\d{22}\b',
            description='Saudi IBAN (format: SA + 22 digits)',
            examples=['SA0380000000608010167519'],
            sensitivity=5
        ),

        # Credit Card
        'credit_card': PIIPattern(
            name='Credit Card Number',
            category='financial',
            regex=r'\b(?:\d{4}[-\s]?){3}\d{4}\b',
            description='Credit card number (16 digits)',
            validator=lambda cc: {'valid': luhn_checksum(cc.replace('-', '').replace(' ', ''))},
            examples=['1234 5678 9012 3456'],
            sensitivity=5
        ),
    }
)
