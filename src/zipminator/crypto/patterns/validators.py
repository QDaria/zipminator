# zipminator/patterns/validators.py
"""Checksum and validation algorithms for national IDs."""

from typing import Dict, Any
import datetime


def mod11_checksum(digits: str, weights: list) -> int:
    """
    Calculate MOD11 checksum.

    Used by: Norway, Netherlands, Denmark, Sweden

    Args:
        digits: String of digits to validate
        weights: List of weight factors

    Returns:
        Calculated checksum digit (0-10, where 10 means invalid)
    """
    total = sum(int(digit) * weight for digit, weight in zip(digits, weights))
    remainder = total % 11
    checksum = 11 - remainder

    if checksum == 11:
        return 0
    return checksum


def luhn_checksum(number: str) -> bool:
    """
    Validate using Luhn algorithm (credit cards, some national IDs).

    Used by: Credit cards, many national IDs

    Args:
        number: String of digits

    Returns:
        True if checksum is valid
    """
    def digits_of(n):
        return [int(d) for d in str(n)]

    digits = digits_of(number)
    odd_digits = digits[-1::-2]
    even_digits = digits[-2::-2]

    checksum = sum(odd_digits)
    for d in even_digits:
        checksum += sum(digits_of(d * 2))

    return checksum % 10 == 0


def verhoeff_checksum(number: str) -> bool:
    """
    Validate using Verhoeff algorithm.

    Used by: India (Aadhaar)

    Args:
        number: String of digits

    Returns:
        True if checksum is valid
    """
    # Verhoeff multiplication table
    d_table = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
        [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
        [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
        [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
        [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
        [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
        [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
        [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
        [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    ]

    # Permutation table
    p_table = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
        [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
        [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
        [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
        [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
        [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
        [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
    ]

    # Inverse table
    inv_table = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]

    c = 0
    for i, digit in enumerate(reversed([int(d) for d in number])):
        c = d_table[c][p_table[(i % 8)][digit]]

    return c == 0


def validate_norwegian_fodselsnummer(fnr: str) -> Dict[str, Any]:
    """
    Validate Norwegian fødselsnummer (11 digits with MOD11 checksum).

    Format: DDMMYYIIIKK
    - DD: Day (01-31 or 41-71 for D-nummer)
    - MM: Month (01-12)
    - YY: Year (last 2 digits)
    - III: Individual number (odd=male, even=female)
    - KK: Checksum digits (K1 and K2)

    Args:
        fnr: 11-digit string

    Returns:
        Dictionary with validation results and metadata
    """
    if len(fnr) != 11 or not fnr.isdigit():
        return {'valid': False, 'reason': 'Invalid format'}

    # Extract components
    day = int(fnr[0:2])
    month = int(fnr[2:4])
    year = int(fnr[4:6])
    individual_num = int(fnr[6:9])
    k1 = int(fnr[9])
    k2 = int(fnr[10])

    # Check if D-nummer (day + 40)
    is_d_nummer = day > 40
    if is_d_nummer:
        day -= 40

    # Determine century
    if 0 <= individual_num <= 499:
        century = 1900
    elif 500 <= individual_num <= 749 and year >= 54:
        century = 1800
    elif 500 <= individual_num <= 999 and year < 40:
        century = 2000
    elif 900 <= individual_num <= 999 and year >= 40:
        century = 1900
    else:
        century = 1900  # Default fallback

    full_year = century + year

    # Validate date
    try:
        birth_date = datetime.date(full_year, month, day)
    except ValueError:
        return {'valid': False, 'reason': 'Invalid birth date'}

    # Validate K1 checksum
    weights_k1 = [3, 7, 6, 1, 8, 9, 4, 5, 2]
    calculated_k1 = mod11_checksum(fnr[0:9], weights_k1)

    if calculated_k1 == 10 or calculated_k1 != k1:
        return {'valid': False, 'reason': 'Invalid K1 checksum'}

    # Validate K2 checksum
    weights_k2 = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
    calculated_k2 = mod11_checksum(fnr[0:10], weights_k2)

    if calculated_k2 == 10 or calculated_k2 != k2:
        return {'valid': False, 'reason': 'Invalid K2 checksum'}

    # Determine gender (odd=male, even=female)
    gender = 'male' if individual_num % 2 == 1 else 'female'

    return {
        'valid': True,
        'checksum_valid': True,
        'metadata': {
            'birth_date': birth_date.isoformat(),
            'age': (datetime.date.today() - birth_date).days // 365,
            'gender': gender,
            'is_d_nummer': is_d_nummer,
            'century': century,
        }
    }


def validate_uk_ni_number(ni: str) -> Dict[str, Any]:
    """
    Validate UK National Insurance number.

    Format: XX 12 34 56 A
    - XX: Prefix (letters, excludes some combinations)
    - 6 digits
    - A: Suffix (A, B, C, or D)

    Args:
        ni: National Insurance number (with or without spaces)

    Returns:
        Validation result with metadata
    """
    # Remove spaces
    ni = ni.replace(' ', '').upper()

    if len(ni) != 9:
        return {'valid': False, 'reason': 'Invalid length'}

    # Check format: 2 letters, 6 digits, 1 letter
    if not (ni[0:2].isalpha() and ni[2:8].isdigit() and ni[8].isalpha()):
        return {'valid': False, 'reason': 'Invalid format'}

    # Invalid prefixes
    invalid_prefixes = ['BG', 'GB', 'NK', 'KN', 'TN', 'NT', 'ZZ']
    if ni[0:2] in invalid_prefixes:
        return {'valid': False, 'reason': f'Invalid prefix: {ni[0:2]}'}

    # First character cannot be D, F, I, Q, U, V
    if ni[0] in 'DFIQUV':
        return {'valid': False, 'reason': f'Invalid first character: {ni[0]}'}

    # Second character cannot be D, F, I, O, Q, U, V
    if ni[1] in 'DFIQUV':
        return {'valid': False, 'reason': f'Invalid second character: {ni[1]}'}

    # Suffix must be A, B, C, or D
    if ni[8] not in 'ABCD':
        return {'valid': False, 'reason': f'Invalid suffix: {ni[8]}'}

    return {
        'valid': True,
        'checksum_valid': True,  # No checksum in NI numbers
        'metadata': {
            'prefix': ni[0:2],
            'suffix': ni[8],
            'formatted': f"{ni[0:2]} {ni[2:4]} {ni[4:6]} {ni[6:8]} {ni[8]}"
        }
    }


def validate_us_ssn(ssn: str) -> Dict[str, Any]:
    """
    Validate US Social Security Number.

    Format: XXX-XX-XXXX
    - Area number (3 digits): 001-899 (excluding 666)
    - Group number (2 digits): 01-99
    - Serial number (4 digits): 0001-9999

    Args:
        ssn: SSN with or without dashes

    Returns:
        Validation result
    """
    # Remove dashes
    ssn = ssn.replace('-', '')

    if len(ssn) != 9 or not ssn.isdigit():
        return {'valid': False, 'reason': 'Invalid format'}

    area = int(ssn[0:3])
    group = int(ssn[3:5])
    serial = int(ssn[5:9])

    # Validate area number
    if area == 0 or area == 666 or area >= 900:
        return {'valid': False, 'reason': f'Invalid area number: {area}'}

    # Validate group number
    if group == 0:
        return {'valid': False, 'reason': 'Invalid group number: 00'}

    # Validate serial number
    if serial == 0:
        return {'valid': False, 'reason': 'Invalid serial number: 0000'}

    return {
        'valid': True,
        'checksum_valid': True,  # SSN has no checksum
        'metadata': {
            'area': area,
            'group': group,
            'serial': serial,
            'formatted': f"{ssn[0:3]}-{ssn[3:5]}-{ssn[5:9]}"
        }
    }


def validate_uae_emirates_id(eid: str) -> Dict[str, Any]:
    """
    Validate UAE Emirates ID.

    Format: 784-YYYY-NNNNNNN-C
    - 784: Country code (UAE)
    - YYYY: Year of birth
    - NNNNNNN: Serial number (7 digits)
    - C: Check digit

    Args:
        eid: 15-digit Emirates ID (with or without dashes)

    Returns:
        Validation result with metadata
    """
    # Remove dashes and spaces
    eid = eid.replace('-', '').replace(' ', '')

    if len(eid) != 15 or not eid.isdigit():
        return {'valid': False, 'reason': 'Invalid format'}

    country_code = eid[0:3]
    year = eid[3:7]
    serial = eid[7:14]
    check_digit = int(eid[14])

    # Validate country code
    if country_code != '784':
        return {'valid': False, 'reason': f'Invalid country code: {country_code}'}

    # Calculate check digit (Luhn algorithm)
    if not luhn_checksum(eid):
        return {'valid': False, 'reason': 'Invalid check digit'}

    return {
        'valid': True,
        'checksum_valid': True,
        'metadata': {
            'country_code': country_code,
            'birth_year': int(year),
            'serial_number': serial,
            'formatted': f"{country_code}-{year}-{serial}-{check_digit}"
        }
    }


def validate_brazilian_cpf(cpf: str) -> Dict[str, Any]:
    """
    Validate Brazilian CPF (Cadastro de Pessoas Físicas).

    Format: XXX.XXX.XXX-XX
    - 9 digits + 2 check digits

    Args:
        cpf: CPF with or without dots/dashes

    Returns:
        Validation result
    """
    # Remove formatting
    cpf = cpf.replace('.', '').replace('-', '')

    if len(cpf) != 11 or not cpf.isdigit():
        return {'valid': False, 'reason': 'Invalid format'}

    # Check for known invalid sequences
    invalid_sequences = [
        '00000000000', '11111111111', '22222222222', '33333333333',
        '44444444444', '55555555555', '66666666666', '77777777777',
        '88888888888', '99999999999'
    ]
    if cpf in invalid_sequences:
        return {'valid': False, 'reason': 'Invalid sequence'}

    # Validate first check digit
    sum1 = sum(int(cpf[i]) * (10 - i) for i in range(9))
    digit1 = (sum1 * 10) % 11
    if digit1 == 10:
        digit1 = 0

    if digit1 != int(cpf[9]):
        return {'valid': False, 'reason': 'Invalid first check digit'}

    # Validate second check digit
    sum2 = sum(int(cpf[i]) * (11 - i) for i in range(10))
    digit2 = (sum2 * 10) % 11
    if digit2 == 10:
        digit2 = 0

    if digit2 != int(cpf[10]):
        return {'valid': False, 'reason': 'Invalid second check digit'}

    return {
        'valid': True,
        'checksum_valid': True,
        'metadata': {
            'formatted': f"{cpf[0:3]}.{cpf[3:6]}.{cpf[6:9]}-{cpf[9:11]}"
        }
    }
