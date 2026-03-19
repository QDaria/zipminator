# zipminator/patterns/eu_generic.py
"""EU-wide generic PII detection patterns (GDPR compliance)."""

from ._base import PIIPattern, CountryPatterns


def validate_iban(iban: str) -> dict:
    """
    Validate IBAN using MOD97 algorithm (ISO 13616).

    Format: CC## + up to 30 alphanumeric characters.
    Validation: move first 4 chars to end, convert letters to numbers (A=10..Z=35),
    check that the resulting integer mod 97 == 1.
    """
    cleaned = iban.replace(' ', '').replace('-', '').upper()

    if len(cleaned) < 5 or len(cleaned) > 34:
        return {'valid': False, 'reason': 'Invalid length'}

    # Country code must be 2 letters
    if not cleaned[0:2].isalpha():
        return {'valid': False, 'reason': 'Invalid country code'}

    # Check digits must be 2 digits
    if not cleaned[2:4].isdigit():
        return {'valid': False, 'reason': 'Invalid check digits'}

    # Rearrange: move first 4 characters to end
    rearranged = cleaned[4:] + cleaned[0:4]

    # Convert letters to numbers (A=10, B=11, ..., Z=35)
    numeric_str = ''
    for char in rearranged:
        if char.isdigit():
            numeric_str += char
        elif char.isalpha():
            numeric_str += str(ord(char) - ord('A') + 10)
        else:
            return {'valid': False, 'reason': f'Invalid character: {char}'}

    # MOD97 check
    if int(numeric_str) % 97 != 1:
        return {
            'valid': False,
            'checksum_valid': False,
            'reason': 'Invalid MOD97 checksum'
        }

    return {
        'valid': True,
        'checksum_valid': True,
        'metadata': {
            'country_code': cleaned[0:2],
            'check_digits': cleaned[2:4],
            'bban': cleaned[4:],
            'formatted': ' '.join(
                cleaned[i:i + 4] for i in range(0, len(cleaned), 4)
            )
        }
    }


def validate_eu_vat(vat: str) -> dict:
    """
    Validate EU VAT number (basic format check).

    Format: 2-letter country code + 2-15 alphanumeric characters.
    Full per-country validation is not implemented here; this is a format check.
    """
    cleaned = vat.replace(' ', '').replace('-', '').upper()

    if len(cleaned) < 4 or len(cleaned) > 17:
        return {'valid': False, 'reason': 'Invalid length'}

    country_code = cleaned[0:2]
    if not country_code.isalpha():
        return {'valid': False, 'reason': 'Invalid country code prefix'}

    # EU member state codes
    eu_codes = {
        'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES',
        'FI', 'FR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT',
        'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK',
        # EEA / associated
        'GB', 'NO', 'CH', 'XI',
    }

    if country_code not in eu_codes:
        return {'valid': False, 'reason': f'Unknown EU country code: {country_code}'}

    vat_number = cleaned[2:]
    if not vat_number.isalnum():
        return {'valid': False, 'reason': 'VAT number must be alphanumeric'}

    return {
        'valid': True,
        'checksum_valid': True,  # No generic checksum; per-country rules vary
        'metadata': {
            'country_code': country_code,
            'vat_number': vat_number,
            'formatted': f"{country_code} {vat_number}"
        }
    }


# EU Generic PII Patterns
EU_GENERIC_PATTERNS = CountryPatterns(
    country_code='eu',
    country_name='European Union',
    regulation='GDPR',
    language='multi',
    patterns={
        # IBAN (International Bank Account Number)
        'iban': PIIPattern(
            name='IBAN',
            category='financial',
            regex=r'\b[A-Z]{2}\d{2}[\s]?[A-Z0-9]{4}(?:[\s]?[A-Z0-9]{4}){1,7}(?:[\s]?[A-Z0-9]{1,4})?\b',
            description='International Bank Account Number (MOD97 validated)',
            validator=validate_iban,
            examples=[
                'DE89 3704 0044 0532 0130 00',
                'GB29 NWBK 6016 1331 9268 19',
                'NO93 8601 1117 947',
            ],
            sensitivity=4
        ),

        # EU VAT Number
        'eu_vat': PIIPattern(
            name='EU VAT Number',
            category='tax_id',
            regex=r'\b[A-Z]{2}\d{2,15}[A-Z0-9]*\b',
            description='EU VAT identification number (country prefix + digits)',
            validator=validate_eu_vat,
            examples=[
                'DE123456789',
                'FR12345678901',
                'SE556036079301',
            ],
            sensitivity=3
        ),
    }
)
