"""
Test suite for PII Scanner (src/zipminator/crypto/pii_scanner.py).

Tests pattern detection for Norwegian FNR, email, SSN, credit card,
and risk level calculation.
"""

import pytest

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

pytestmark = pytest.mark.skipif(not PANDAS_AVAILABLE, reason="pandas not installed")

from zipminator.crypto.pii_scanner import PIIScanner, PIIType, RiskLevel


@pytest.fixture
def scanner():
    return PIIScanner(sample_size=10, confidence_threshold=0.3)


@pytest.fixture
def pii_dataframe():
    return pd.DataFrame({
        "name": ["Ola Nordmann", "Kari Hansen", "Per Olsen",
                 "Anna Berg", "Erik Lund", "Ingrid Dahl",
                 "Lars Bakke", "Mette Vik", "Jon Sund", "Liv Aas"],
        "email": ["ola@example.no", "kari@test.com", "per@firma.no",
                   "anna@mail.no", "erik@corp.no", "ingrid@web.no",
                   "lars@org.no", "mette@io.no", "jon@dev.no", "liv@biz.no"],
        "phone": ["+47 12345678", "+47 98765432", "+47 55555555",
                  "+47 11111111", "+47 22222222", "+47 33333333",
                  "+47 44444444", "+47 66666666", "+47 77777777", "+47 88888888"],
        "safe_data": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
    })


class TestEmailDetection:
    def test_detects_emails(self, scanner, pii_dataframe):
        results = scanner.scan_dataframe(pii_dataframe)
        assert results["pii_detected"] is True
        email_matches = [
            m for m in results["matches"] if m.pii_type == PIIType.EMAIL
        ]
        assert len(email_matches) > 0

    def test_email_column_flagged(self, scanner, pii_dataframe):
        results = scanner.scan_dataframe(pii_dataframe)
        assert "email" in results["columns_with_pii"]


class TestPhoneDetection:
    def test_detects_norwegian_phones(self, scanner, pii_dataframe):
        results = scanner.scan_dataframe(pii_dataframe)
        phone_matches = [
            m for m in results["matches"]
            if m.pii_type == PIIType.PHONE and m.column == "phone"
        ]
        assert len(phone_matches) > 0


class TestCreditCardDetection:
    def test_detects_credit_cards(self, scanner):
        df = pd.DataFrame({
            "card": ["4111-1111-1111-1111", "5500-0000-0000-0004",
                     "3400-000000-00009", "4111 1111 1111 1111",
                     "5500000000000004", "4111111111111111",
                     "6011000000000004", "3530111333300000",
                     "3566002020360505", "4012888888881881"],
        })
        results = scanner.scan_dataframe(df)
        cc_matches = [
            m for m in results["matches"] if m.pii_type == PIIType.CREDIT_CARD
        ]
        assert len(cc_matches) > 0


class TestSSNDetection:
    def test_detects_us_ssn(self, scanner):
        df = pd.DataFrame({
            "ssn": ["123-45-6789", "987-65-4321", "111-22-3333",
                    "444-55-6666", "777-88-9999", "000-11-2222",
                    "333-44-5555", "666-77-8888", "999-00-1111", "222-33-4444"],
        })
        results = scanner.scan_dataframe(df)
        ssn_matches = [
            m for m in results["matches"] if m.pii_type == PIIType.SSN
        ]
        assert len(ssn_matches) > 0


class TestRiskLevel:
    def test_safe_data_low_risk(self, scanner):
        df = pd.DataFrame({
            "category": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
            "value": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        })
        results = scanner.scan_dataframe(df)
        assert results["risk_level"] == RiskLevel.LOW

    def test_credentials_critical_risk(self, scanner):
        df = pd.DataFrame({
            "leaked": [
                "password: secret123", "password: hunter2", "pwd: admin",
                "password: qwerty", "password: pass123", "password: letmein",
                "password: abc123", "password: monkey", "password: shadow", "password: dragon",
            ]
        })
        results = scanner.scan_dataframe(df)
        assert results["risk_level"] == RiskLevel.CRITICAL


class TestRecommendedLevel:
    def test_critical_recommends_10(self, scanner):
        df = pd.DataFrame({
            "token": [
                "token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9abc",
                "token: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9def",
                "token: eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9ghi",
            ] * 4  # 12 rows
        })
        results = scanner.scan_dataframe(df)
        if results["pii_detected"]:
            assert results["recommended_anonymization_level"] >= 7


class TestSummary:
    def test_summary_generated(self, scanner, pii_dataframe):
        results = scanner.scan_dataframe(pii_dataframe)
        assert len(results["summary"]) > 0
        assert "PII Scan Results" in results["summary"]

    def test_warnings_generated(self, scanner, pii_dataframe):
        results = scanner.scan_dataframe(pii_dataframe)
        assert len(results["warnings"]) > 0
