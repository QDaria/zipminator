# zipminator/patterns/brazil.py
"""Brazil PII detection patterns (LGPD compliance)."""

from ._base import PIIPattern, CountryPatterns
from .validators import validate_brazilian_cpf, validate_brazilian_cnpj


# Brazil PII Patterns
BRAZIL_PATTERNS = CountryPatterns(
    country_code='br',
    country_name='Brazil',
    regulation='LGPD (Lei Geral de Protecao de Dados)',
    language='pt',
    patterns={
        # CPF (Individual Taxpayer ID)
        'cpf': PIIPattern(
            name='Brazilian CPF',
            category='national_id',
            regex=r'\b\d{3}\.?\d{3}\.?\d{3}[-.]?\d{2}\b',
            description='Brazilian CPF (11 digits with dual check digits)',
            validator=validate_brazilian_cpf,
            examples=[
                '529.982.247-25',
                '52998224725',
            ],
            false_positives=[
                '000.000.000-00',
                '111.111.111-11',
            ],
            sensitivity=5
        ),

        # CNPJ (Business Taxpayer ID)
        'cnpj': PIIPattern(
            name='Brazilian CNPJ',
            category='tax_id',
            regex=r'\b\d{2}\.?\d{3}\.?\d{3}/?\d{4}[-.]?\d{2}\b',
            description='Brazilian CNPJ (14 digits with dual check digits)',
            validator=validate_brazilian_cnpj,
            examples=[
                '11.222.333/0001-81',
                '11222333000181',
            ],
            false_positives=[
                '00.000.000/0000-00',
                '11.111.111/1111-11',
            ],
            sensitivity=4
        ),

        # RG (Identity Card) - varies by state, basic pattern
        'rg': PIIPattern(
            name='Brazilian RG',
            category='identity_document',
            regex=r'\b\d{2}\.?\d{3}\.?\d{3}[-.]?\d{1}\b',
            description='Brazilian RG identity card (varies by state, 9 digits common)',
            examples=[
                '12.345.678-9',
                '123456789',
            ],
            sensitivity=5
        ),

        # Brazilian Phone Number
        'phone': PIIPattern(
            name='Brazilian Phone Number',
            category='contact',
            regex=r'\b(?:\+55|0055|55)?\s?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}\b',
            description='Brazilian phone number (mobile with 9th digit)',
            examples=[
                '+55 11 91234-5678',
                '(11) 91234-5678',
                '11912345678',
            ],
            sensitivity=3
        ),

        # Email
        'email': PIIPattern(
            name='Email Address',
            category='contact',
            regex=r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            description='Email address',
            examples=['joao.silva@example.com.br'],
            sensitivity=3
        ),

        # CEP (Postal Code)
        'cep': PIIPattern(
            name='Brazilian CEP',
            category='location',
            regex=r'\b\d{5}[-]?\d{3}\b',
            description='Brazilian CEP postal code (8 digits)',
            examples=[
                '01310-100',
                '01310100',
            ],
            sensitivity=2
        ),
    }
)
