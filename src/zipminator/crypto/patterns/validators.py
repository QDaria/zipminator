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


def validate_swedish_personnummer(pnr: str) -> Dict[str, Any]:
    """
    Validate Swedish personnummer (personal identity number).

    Format: YYMMDD-XXXX or YYYYMMDD-XXXX
    - YYMMDD or YYYYMMDD: Birth date (day+60 for samordningsnummer)
    - XXXX: Birth number (3 digits) + Luhn check digit
    - Gender: 3rd digit of birth number (odd=male, even=female)

    Luhn check is computed on the 10-digit form (YYMMDDBBBX).

    Args:
        pnr: Swedish personnummer string

    Returns:
        Dictionary with validation results and metadata
    """
    # Normalize: remove dash or plus, strip century digits if present
    cleaned = pnr.replace('-', '').replace('+', '')

    if len(cleaned) == 12:
        century_str = cleaned[0:2]
        cleaned = cleaned[2:]
    elif len(cleaned) == 10:
        century_str = None
    else:
        return {'valid': False, 'reason': 'Invalid length'}

    if not cleaned.isdigit():
        return {'valid': False, 'reason': 'Non-digit characters'}

    year_part = int(cleaned[0:2])
    month = int(cleaned[2:4])
    day = int(cleaned[4:6])
    birth_num = int(cleaned[6:9])
    check_digit = int(cleaned[9])

    # Detect samordningsnummer (day + 60)
    is_samordning = day > 60
    actual_day = day - 60 if is_samordning else day

    # Determine century
    if century_str is not None:
        century = int(century_str) * 100
    else:
        # '+' separator means born 100+ years ago
        if '+' in pnr:
            century = 1900
        else:
            # Default heuristic: 2000s if year_part <= current 2-digit year, else 1900s
            import datetime as _dt
            current_two = _dt.date.today().year % 100
            century = 2000 if year_part <= current_two else 1900

    full_year = century + year_part

    # Validate date
    try:
        birth_date = datetime.date(full_year, month, actual_day)
    except ValueError:
        return {'valid': False, 'reason': 'Invalid birth date'}

    # Luhn validation on 10-digit string
    if not luhn_checksum(cleaned):
        return {
            'valid': False,
            'checksum_valid': False,
            'reason': 'Invalid Luhn checksum'
        }

    gender = 'male' if birth_num % 2 == 1 else 'female'

    return {
        'valid': True,
        'checksum_valid': True,
        'metadata': {
            'birth_date': birth_date.isoformat(),
            'gender': gender,
            'is_samordningsnummer': is_samordning,
            'formatted': f"{cleaned[0:6]}-{cleaned[6:10]}"
        }
    }


def validate_danish_cpr(cpr: str) -> Dict[str, Any]:
    """
    Validate Danish CPR number (Det Centrale Personregister).

    Format: DDMMYY-SSSS or DDMMYYSSSS (10 digits)
    - DD: Day of birth
    - MM: Month of birth
    - YY: Year of birth (last 2 digits)
    - SSSS: Sequence number (4th digit determines gender: odd=male, even=female)

    MOD11 checksum applies to births before 2007-10-01.
    Post-2007 births may have sequence numbers that do not satisfy MOD11.

    Args:
        cpr: Danish CPR number string

    Returns:
        Dictionary with validation results and metadata
    """
    cleaned = cpr.replace('-', '').replace(' ', '')

    if len(cleaned) != 10 or not cleaned.isdigit():
        return {'valid': False, 'reason': 'Invalid format'}

    day = int(cleaned[0:2])
    month = int(cleaned[2:4])
    year_part = int(cleaned[4:6])
    seq = int(cleaned[6:10])

    # Determine century from 7th digit
    seventh = int(cleaned[6])
    if seventh in (0, 1, 2, 3):
        century = 1900
    elif seventh in (4, 9):
        if year_part <= 36:
            century = 2000
        else:
            century = 1900
    elif seventh in (5, 6, 7, 8):
        if year_part <= 57:
            century = 2000
        else:
            century = 1800
    else:
        century = 1900

    full_year = century + year_part

    # Validate date
    try:
        birth_date = datetime.date(full_year, month, day)
    except ValueError:
        return {'valid': False, 'reason': 'Invalid birth date'}

    # MOD11 checksum (pre-2007-10-01 births only)
    checksum_exempt = birth_date >= datetime.date(2007, 10, 1)
    checksum_valid = None

    if not checksum_exempt:
        weights = [4, 3, 2, 7, 6, 5, 4, 3, 2, 1]
        total = sum(int(d) * w for d, w in zip(cleaned, weights))
        checksum_valid = (total % 11 == 0)
    else:
        checksum_valid = True  # Exempt; accept any sequence

    if not checksum_valid:
        return {
            'valid': False,
            'checksum_valid': False,
            'reason': 'Invalid MOD11 checksum'
        }

    gender = 'male' if seq % 2 == 1 else 'female'

    return {
        'valid': True,
        'checksum_valid': True,
        'metadata': {
            'birth_date': birth_date.isoformat(),
            'gender': gender,
            'checksum_exempt': checksum_exempt,
            'formatted': f"{cleaned[0:6]}-{cleaned[6:10]}"
        }
    }


def validate_finnish_henkilotunnus(hetu: str) -> Dict[str, Any]:
    """
    Validate Finnish henkilötunnus (personal identity code).

    Format: DDMMYY[+-A]XXXC
    - DDMMYY: Birth date
    - Century marker: + (1800s), - (1900s), A (2000s)
    - XXX: Individual number (odd=male, even=female)
    - C: Check character = remainder of DDMMYYXXX / 31 mapped to lookup string

    Args:
        hetu: Finnish henkilötunnus string

    Returns:
        Dictionary with validation results and metadata
    """
    hetu = hetu.strip().upper()

    if len(hetu) != 11:
        return {'valid': False, 'reason': 'Invalid length'}

    date_part = hetu[0:6]
    separator = hetu[6]
    individual = hetu[7:10]
    check_char = hetu[10]

    if not date_part.isdigit() or not individual.isdigit():
        return {'valid': False, 'reason': 'Invalid format'}

    # Century marker
    century_map = {'+': 1800, '-': 1900, 'A': 2000}
    if separator not in century_map:
        return {'valid': False, 'reason': f'Invalid century marker: {separator}'}

    century = century_map[separator]

    day = int(date_part[0:2])
    month = int(date_part[2:4])
    year_part = int(date_part[4:6])
    full_year = century + year_part

    # Validate date
    try:
        birth_date = datetime.date(full_year, month, day)
    except ValueError:
        return {'valid': False, 'reason': 'Invalid birth date'}

    # Check character validation
    check_lookup = '0123456789ABCDEFHJKLMNPRSTUVWXY'
    nine_digit = int(date_part + individual)
    expected_check = check_lookup[nine_digit % 31]

    if check_char != expected_check:
        return {
            'valid': False,
            'checksum_valid': False,
            'reason': f'Invalid check character: expected {expected_check}, got {check_char}'
        }

    individual_num = int(individual)
    gender = 'male' if individual_num % 2 == 1 else 'female'

    return {
        'valid': True,
        'checksum_valid': True,
        'metadata': {
            'birth_date': birth_date.isoformat(),
            'gender': gender,
            'century_marker': separator,
            'formatted': f"{date_part}{separator}{individual}{check_char}"
        }
    }


def validate_german_steuer_id(steuer_id: str) -> Dict[str, Any]:
    """
    Validate German Steuerliche Identifikationsnummer (Tax ID).

    Format: 11 digits, ISO 7064 MOD 11,10 checksum.
    First digit cannot be 0.

    Args:
        steuer_id: 11-digit string

    Returns:
        Validation result with metadata
    """
    steuer_id = steuer_id.replace(' ', '')

    if len(steuer_id) != 11 or not steuer_id.isdigit():
        return {'valid': False, 'reason': 'Invalid format'}

    if steuer_id[0] == '0':
        return {'valid': False, 'reason': 'First digit cannot be 0'}

    # ISO 7064 MOD 11,10 checksum
    product = 10
    for i in range(10):
        total = (int(steuer_id[i]) + product) % 10
        if total == 0:
            total = 10
        product = (total * 2) % 11

    check_digit = (11 - product) % 10
    if check_digit != int(steuer_id[10]):
        return {'valid': False, 'reason': 'Invalid checksum'}

    return {
        'valid': True,
        'checksum_valid': True,
        'metadata': {
            'formatted': steuer_id
        }
    }


def validate_french_nir(nir: str) -> Dict[str, Any]:
    """
    Validate French NIR (Numero d'Inscription au Repertoire / INSEE number).

    Format: 15 digits = 13-digit body + 2-digit key.
    Structure: S YY MM DD CCC OOO KK
    - S: Sex (1=male, 2=female)
    - YY: Year of birth
    - MM: Month of birth (01-12)
    - DD: Department (01-95, 971-974 overseas)
    - CCC: Commune code (001-999)
    - OOO: Order of registration (001-999)
    - KK: Key = 97 - (first 13 digits MOD 97)

    Args:
        nir: 15-digit string (may contain spaces)

    Returns:
        Validation result with metadata
    """
    nir = nir.replace(' ', '')

    if len(nir) != 15 or not nir.isdigit():
        return {'valid': False, 'reason': 'Invalid format'}

    sex = int(nir[0])
    if sex not in (1, 2):
        return {'valid': False, 'reason': 'Invalid sex digit'}

    year = nir[1:3]
    month = int(nir[3:5])
    dept = nir[5:7]

    if month < 1 or month > 12:
        return {'valid': False, 'reason': 'Invalid month'}

    # Key validation: key = 97 - (body MOD 97)
    body = int(nir[0:13])
    key = int(nir[13:15])
    expected_key = 97 - (body % 97)

    if key != expected_key:
        return {'valid': False, 'reason': 'Invalid key'}

    gender = 'male' if sex == 1 else 'female'

    return {
        'valid': True,
        'checksum_valid': True,
        'metadata': {
            'gender': gender,
            'birth_year_suffix': year,
            'birth_month': month,
            'department': dept,
            'formatted': f"{nir[0]} {nir[1:3]} {nir[3:5]} {nir[5:7]} {nir[7:10]} {nir[10:13]} {nir[13:15]}"
        }
    }


def validate_french_nir_corsica(nir: str) -> Dict[str, Any]:
    """
    Validate French NIR with Corsica department support.

    Corsica departments: '2A' (replaced with 19) and '2B' (replaced with 18)
    for the checksum computation.

    Args:
        nir: 15-character string (may contain 'A' or 'B' for Corsica)

    Returns:
        Validation result with metadata
    """
    nir = nir.replace(' ', '').upper()

    if len(nir) != 15:
        return {'valid': False, 'reason': 'Invalid length'}

    # Handle Corsica departments
    nir_numeric = nir
    if nir[5:7] == '2A':
        nir_numeric = nir[:5] + '19' + nir[7:]
    elif nir[5:7] == '2B':
        nir_numeric = nir[:5] + '18' + nir[7:]

    if not nir_numeric.isdigit():
        return {'valid': False, 'reason': 'Invalid format'}

    return validate_french_nir(nir_numeric)


def validate_japan_my_number(num: str) -> Dict[str, Any]:
    """
    Validate Japanese My Number (Individual Number).

    Format: 12 digits with check digit.
    Check digit algorithm:
    - For digits d[0]..d[10] (left to right), position from right p=11-i
    - Weight = p+1 if p<=6, else p-5
    - remainder = sum % 11
    - check_digit = 0 if remainder <= 1, else 11 - remainder

    Args:
        num: 12-digit string

    Returns:
        Validation result with metadata
    """
    num = num.replace(' ', '').replace('-', '')

    if len(num) != 12 or not num.isdigit():
        return {'valid': False, 'reason': 'Invalid format'}

    digits = [int(d) for d in num[:11]]
    total = 0
    for i in range(11):
        p = 11 - i  # position from right (1-based)
        if p <= 6:
            weight = p + 1
        else:
            weight = p - 5
        total += digits[i] * weight

    remainder = total % 11
    expected = 0 if remainder <= 1 else 11 - remainder

    if expected != int(num[11]):
        return {'valid': False, 'reason': 'Invalid check digit'}

    return {
        'valid': True,
        'checksum_valid': True,
        'metadata': {
            'formatted': f"{num[:4]} {num[4:8]} {num[8:12]}"
        }
    }


def validate_australia_tfn(tfn: str) -> Dict[str, Any]:
    """
    Validate Australian Tax File Number (TFN).

    Format: 8 or 9 digits.
    Weighted checksum: weights [1, 4, 3, 7, 5, 8, 6, 9, 10],
    sum of (digit * weight) MOD 11 == 0.

    Args:
        tfn: 8 or 9 digit string

    Returns:
        Validation result with metadata
    """
    tfn = tfn.replace(' ', '').replace('-', '')

    if len(tfn) not in (8, 9) or not tfn.isdigit():
        return {'valid': False, 'reason': 'Invalid format'}

    weights_9 = [1, 4, 3, 7, 5, 8, 6, 9, 10]
    weights_8 = [10, 7, 8, 4, 6, 3, 5, 1]

    weights = weights_9 if len(tfn) == 9 else weights_8

    total = sum(int(d) * w for d, w in zip(tfn, weights))

    if total % 11 != 0:
        return {'valid': False, 'reason': 'Invalid checksum'}

    return {
        'valid': True,
        'checksum_valid': True,
        'metadata': {
            'digits': len(tfn),
            'formatted': f"{tfn[:3]} {tfn[3:6]} {tfn[6:]}"
        }
    }


def validate_canada_sin(sin: str) -> Dict[str, Any]:
    """
    Validate Canadian Social Insurance Number (SIN).

    Format: 9 digits, validated by Luhn algorithm.
    First digit indicates province of issuance.

    Args:
        sin: 9-digit string (with or without spaces/dashes)

    Returns:
        Validation result with metadata
    """
    sin = sin.replace(' ', '').replace('-', '')

    if len(sin) != 9 or not sin.isdigit():
        return {'valid': False, 'reason': 'Invalid format'}

    if len(set(sin)) == 1:
        return {'valid': False, 'reason': 'Invalid sequence'}

    if not luhn_checksum(sin):
        return {'valid': False, 'reason': 'Invalid Luhn checksum'}

    province_map = {
        '1': 'Atlantic (NS, NB, PE, NL)',
        '2': 'Quebec',
        '3': 'Quebec',
        '4': 'Ontario (excluding NW Ontario)',
        '5': 'Ontario (NW Ontario)',
        '6': 'Prairie (MB, SK, AB, NWT, NU)',
        '7': 'Pacific (BC, YT)',
        '8': 'Not yet assigned',
        '9': 'Temporary / non-permanent resident',
        '0': 'Not yet assigned',
    }

    first_digit = sin[0]
    province = province_map.get(first_digit, 'Unknown')

    return {
        'valid': True,
        'checksum_valid': True,
        'metadata': {
            'province_region': province,
            'temporary': first_digit == '9',
            'formatted': f"{sin[:3]} {sin[3:6]} {sin[6:9]}"
        }
    }


def validate_brazilian_cnpj(cnpj: str) -> Dict[str, Any]:
    """
    Validate Brazilian CNPJ (Cadastro Nacional da Pessoa Juridica).

    Format: XX.XXX.XXX/XXXX-XX (14 digits total).
    Two check digits computed with weighted sums.

    Args:
        cnpj: CNPJ with or without formatting

    Returns:
        Validation result with metadata
    """
    cnpj = cnpj.replace('.', '').replace('/', '').replace('-', '').replace(' ', '')

    if len(cnpj) != 14 or not cnpj.isdigit():
        return {'valid': False, 'reason': 'Invalid format'}

    if len(set(cnpj)) == 1:
        return {'valid': False, 'reason': 'Invalid sequence'}

    weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    sum1 = sum(int(cnpj[i]) * weights1[i] for i in range(12))
    remainder1 = sum1 % 11
    digit1 = 0 if remainder1 < 2 else 11 - remainder1

    if digit1 != int(cnpj[12]):
        return {'valid': False, 'reason': 'Invalid first check digit'}

    weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    sum2 = sum(int(cnpj[i]) * weights2[i] for i in range(13))
    remainder2 = sum2 % 11
    digit2 = 0 if remainder2 < 2 else 11 - remainder2

    if digit2 != int(cnpj[13]):
        return {'valid': False, 'reason': 'Invalid second check digit'}

    return {
        'valid': True,
        'checksum_valid': True,
        'metadata': {
            'formatted': f"{cnpj[:2]}.{cnpj[2:5]}.{cnpj[5:8]}/{cnpj[8:12]}-{cnpj[12:14]}"
        }
    }


def validate_india_pan(pan: str) -> Dict[str, Any]:
    """
    Validate Indian PAN (Permanent Account Number).

    Format: AAAAA9999A (5 letters + 4 digits + 1 letter).
    Fourth character indicates holder type.

    Args:
        pan: 10-character string

    Returns:
        Validation result with metadata
    """
    import re as _re

    pan = pan.upper().strip()

    if len(pan) != 10:
        return {'valid': False, 'reason': 'Invalid length'}

    if not _re.match(r'^[A-Z]{5}\d{4}[A-Z]$', pan):
        return {'valid': False, 'reason': 'Invalid format'}

    holder_type_map = {
        'A': 'Association of Persons (AOP)',
        'B': 'Body of Individuals (BOI)',
        'C': 'Company',
        'F': 'Firm',
        'G': 'Government',
        'H': 'Hindu Undivided Family (HUF)',
        'J': 'Artificial Juridical Person',
        'L': 'Local Authority',
        'P': 'Person (Individual)',
        'T': 'Trust',
    }

    fourth_char = pan[3]
    holder_type = holder_type_map.get(fourth_char, 'Unknown')

    return {
        'valid': True,
        'checksum_valid': True,
        'metadata': {
            'holder_type_code': fourth_char,
            'holder_type': holder_type,
            'formatted': pan
        }
    }


def validate_india_aadhaar(aadhaar: str) -> Dict[str, Any]:
    """
    Validate Indian Aadhaar number.

    Format: 12 digits, Verhoeff checksum, cannot start with 0 or 1.

    Args:
        aadhaar: 12-digit string (with or without spaces)

    Returns:
        Validation result with metadata
    """
    aadhaar = aadhaar.replace(' ', '').replace('-', '')

    if len(aadhaar) != 12 or not aadhaar.isdigit():
        return {'valid': False, 'reason': 'Invalid format'}

    if aadhaar[0] in ('0', '1'):
        return {'valid': False, 'reason': 'Cannot start with 0 or 1'}

    if not verhoeff_checksum(aadhaar):
        return {'valid': False, 'reason': 'Invalid Verhoeff checksum'}

    return {
        'valid': True,
        'checksum_valid': True,
        'metadata': {
            'formatted': f"{aadhaar[:4]} {aadhaar[4:8]} {aadhaar[8:12]}"
        }
    }
