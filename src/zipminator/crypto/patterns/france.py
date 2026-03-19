# zipminator/patterns/france.py
"""France PII detection patterns (GDPR / CNIL compliance)."""

from ._base import PIIPattern, CountryPatterns
from .validators import validate_french_nir


# France PII Patterns
FRANCE_PATTERNS = CountryPatterns(
    country_code='fr',
    country_name='France',
    regulation='GDPR (RGPD)',
    language='fr',
    patterns={
        # NIR / INSEE Number (Social Security)
        'nir': PIIPattern(
            name='French NIR (INSEE Number)',
            category='national_id',
            regex=r'\b[12]\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}\b',
            description='French NIR / social security number (15 digits)',
            validator=validate_french_nir,
            examples=[
                '269054958815780',
                '185056800700144',
            ],
            sensitivity=5
        ),

        # Carte Nationale d'Identite (National ID Card)
        'carte_identite': PIIPattern(
            name='French Carte Nationale d\'Identite',
            category='identity_document',
            regex=r'\b[A-Z0-9]{12}\b',
            description='French national identity card number (12 alphanumeric characters)',
            examples=[
                'GHI234567890',
                'F123456789AB',
            ],
            sensitivity=5
        ),

        # IBAN (France)
        'iban': PIIPattern(
            name='French IBAN',
            category='financial',
            regex=r'\bFR\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{3}\b',
            description='French IBAN (FR + 25 digits)',
            examples=[
                'FR76 3000 6000 0112 3456 7890 189',
                'FR7630006000011234567890189',
            ],
            sensitivity=5
        ),

        # Email
        'email': PIIPattern(
            name='Email Address',
            category='contact',
            regex=r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            description='Email address',
            examples=['jean.dupont@example.fr'],
            sensitivity=3
        ),

        # French Phone Number
        'phone': PIIPattern(
            name='French Phone Number',
            category='contact',
            regex=r'\b(?:\+33|0033|33)?\s?[0-9](?:[-\s]?\d{2}){4}\b',
            description='French phone number (10 digits)',
            examples=[
                '+33 6 12 34 56 78',
                '06 12 34 56 78',
                '0612345678',
            ],
            sensitivity=3
        ),

        # French Passport
        'passport': PIIPattern(
            name='French Passport Number',
            category='travel_document',
            regex=r'\b\d{2}[A-Z]{2}\d{5}\b',
            description='French passport number (2 digits + 2 letters + 5 digits)',
            examples=['12AB34567'],
            sensitivity=4
        ),

        # Postal Code
        'postal_code': PIIPattern(
            name='French Postal Code',
            category='location',
            regex=r'\b\d{5}\b',
            description='French postal code (5 digits)',
            examples=['75001', '13001'],
            sensitivity=2
        ),
    }
)
