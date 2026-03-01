# zipminator/regex_patterns.py
import re

# Personnummer
personnummer_regex = r"\b\d{11}\b"
personnummer_text = "13048212345"
personnummer_match = re.search(personnummer_regex, personnummer_text)
print(personnummer_match.group())

# Bankkontonummer
bankkontonummer_regex = r"\b\d{11}\b"
bankkontonummer_text = "12345678901"
bankkontonummer_match = re.search(bankkontonummer_regex, bankkontonummer_text)
print(bankkontonummer_match.group())

# Kredittkortnummer
kredittkortnummer_regex = r"\b(?:\d[ -]*?){13,16}\b"
kredittkortnummer_text = "1234-5678-9012-3456"
kredittkortnummer_match = re.search(
    kredittkortnummer_regex, kredittkortnummer_text)
print(kredittkortnummer_match.group())

# Passord
passord_regex = r"(?=.\d)(?=.[a-z])(?=.*[A-Z]).{8,}"
passord_text = "Sikker123"
passord_match = re.search(passord_regex, passord_text)
print(passord_match.group())

# E-postadresse
epost_regex = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
epost_text = "test@example.com"
epost_match = re.search(epost_regex, epost_text)
print(epost_match.group())

# Telefonnummer
telefon_regex = r"(?:\+\d{1,2}\s)?\d{3}?\d3?[\s.-]?\d{3}[\s.-]?\d{4}"
telefon_text = "+47 12345678"
telefon_match = re.search(telefon_regex, telefon_text)
print(telefon_match.group())

# Fødselsdato
fodselsdato_regex = r"\b\d{2}[./-]\d{2}[./-]\d{4}\b"
fodselsdato_text = "13-04-1982"
fodselsdato_match = re.search(fodselsdato_regex, fodselsdato_text)
print(fodselsdato_match.group())

# IP-adresse
ip_regex = r"\b(?:\d{1,3}\.){3}\d{1,3}\b"
ip_text = "192.168.0.1"
ip_match = re.search(ip_regex, ip_text)
print(ip_match.group())

# Skatte-ID
skatteid_regex = r"\b\d{9}\b"
skatteid_text = "123456789"
skatteid_match = re.search(skatteid_regex, skatteid_text)
print(skatteid_match.group())

# Bankkort-PIN
bankkort_pin_regex = r"\b\d{4}\b"
bankkort_pin_text = "1234"
bankkort_pin_match = re.search(bankkort_pin_regex, bankkort_pin_text)
print(bankkort_pin_match.group())
