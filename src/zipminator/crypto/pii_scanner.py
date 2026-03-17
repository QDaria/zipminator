"""
Automatic PII Detection Scanner
Uses pattern matching and analysis for multi-language PII detection
Implements comprehensive scanning for Norwegian, US, and European PII types
"""

import re
import pandas as pd
from typing import Dict, List, Set, Tuple, Optional, Any
from dataclasses import dataclass
from enum import Enum


class RiskLevel(Enum):
    """Risk levels for PII detection"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class PIIType(Enum):
    """Types of PII that can be detected"""
    # Norwegian PII
    NORWEGIAN_FNR = "norwegian_fnr"  # Fødselsnummer
    NORWEGIAN_ACCOUNT = "norwegian_account"  # Kontonummer
    NORWEGIAN_ORG = "norwegian_org_number"  # Organisasjonsnummer

    # General PII
    EMAIL = "email"
    PHONE = "phone"
    CREDIT_CARD = "credit_card"
    SSN = "ssn"  # US Social Security Number
    IP_ADDRESS = "ip_address"

    # Sensitive data
    PASSWORD = "password"
    AUTH_TOKEN = "auth_token"
    API_KEY = "api_key"
    CRYPTO_KEY = "crypto_key"

    # Personal identifiers
    PERSON_NAME = "person_name"
    ADDRESS = "address"
    DATE_OF_BIRTH = "date_of_birth"

    # Financial
    IBAN = "iban"
    SWIFT = "swift_bic"
    TAX_ID = "tax_id"


@dataclass
class PIIMatch:
    """Represents a PII match found in data"""
    pii_type: PIIType
    column: str
    sample_count: int
    confidence: float
    pattern: str


class PIIScanner:
    """Automatic PII detection and risk assessment"""

    # Comprehensive regex patterns for PII detection
    PATTERNS = {
        PIIType.NORWEGIAN_FNR: [
            r'\b\d{11}\b',  # 11 digits
            r'\b\d{6}[-\s]?\d{5}\b',  # DDMMYY-NNNNN format
        ],
        PIIType.NORWEGIAN_ACCOUNT: [
            r'\b\d{4}[\s.]?\d{2}[\s.]?\d{5}\b',  # XXXX.XX.XXXXX format
            r'\b\d{11}\b',  # 11 digits
        ],
        PIIType.NORWEGIAN_ORG: [
            r'\b\d{9}\b',  # 9 digits for org number
        ],
        PIIType.EMAIL: [
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        ],
        PIIType.PHONE: [
            r'(?:\+47|0047|47)?\s?\d{8}',  # Norwegian
            r'(?:\+\d{1,3}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}',  # International
        ],
        PIIType.CREDIT_CARD: [
            r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b',
            r'\b(?:\d[ -]*?){13,16}\b',
        ],
        PIIType.SSN: [
            r'\b\d{3}-\d{2}-\d{4}\b',  # US SSN format
            r'\b\d{9}\b',  # SSN without dashes
        ],
        PIIType.IP_ADDRESS: [
            r'\b(?:\d{1,3}\.){3}\d{1,3}\b',  # IPv4
            r'\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b',  # IPv6
        ],
        PIIType.DATE_OF_BIRTH: [
            r'\b\d{2}[./-]\d{2}[./-]\d{4}\b',  # DD/MM/YYYY
            r'\b\d{4}[./-]\d{2}[./-]\d{2}\b',  # YYYY-MM-DD
        ],
        PIIType.PASSWORD: [
            r'(?i)password[:\s=]+\S+',
            r'(?i)pwd[:\s=]+\S+',
        ],
        PIIType.AUTH_TOKEN: [
            r'(?i)token[:\s=]+[A-Za-z0-9_-]{20,}',
            r'(?i)bearer\s+[A-Za-z0-9_.-]+',
        ],
        PIIType.API_KEY: [
            r'(?i)api[_-]?key[:\s=]+[A-Za-z0-9_-]{20,}',
            r'(?i)apikey[:\s=]+[A-Za-z0-9_-]{20,}',
        ],
        PIIType.IBAN: [
            r'\b[A-Z]{2}\d{2}[A-Z0-9]{1,30}\b',
        ],
        PIIType.TAX_ID: [
            r'\b\d{9}\b',  # Generic 9-digit tax ID
        ],
    }

    # Critical PII types that require immediate attention
    CRITICAL_TYPES = {
        PIIType.PASSWORD,
        PIIType.AUTH_TOKEN,
        PIIType.API_KEY,
        PIIType.CRYPTO_KEY,
    }

    # High-risk PII types
    HIGH_RISK_TYPES = {
        PIIType.CREDIT_CARD,
        PIIType.SSN,
        PIIType.NORWEGIAN_FNR,
        PIIType.IBAN,
    }

    def __init__(self, sample_size: int = 100, confidence_threshold: float = 0.3):
        """
        Initialize PII Scanner

        Args:
            sample_size: Number of rows to sample for pattern detection
            confidence_threshold: Minimum confidence score to report a match (0-1)
        """
        self.sample_size = sample_size
        self.confidence_threshold = confidence_threshold
        self.compiled_patterns = self._compile_patterns()

    def _compile_patterns(self) -> Dict[PIIType, List[re.Pattern]]:
        """Compile all regex patterns for efficient matching"""
        compiled = {}
        for pii_type, patterns in self.PATTERNS.items():
            compiled[pii_type] = [re.compile(p) for p in patterns]
        return compiled

    def scan_dataframe(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Scan DataFrame for PII

        Args:
            df: DataFrame to scan

        Returns:
            Dictionary containing scan results with:
                - pii_detected: bool
                - columns_with_pii: Dict[str, List[PIIMatch]]
                - risk_level: RiskLevel
                - recommended_anonymization_level: int (1-10)
                - warnings: List[str]
                - summary: str
        """
        results = {
            'pii_detected': False,
            'columns_with_pii': {},
            'risk_level': RiskLevel.LOW,
            'recommended_anonymization_level': 1,
            'warnings': [],
            'summary': '',
            'matches': []
        }

        all_matches = []

        for column in df.columns:
            matches = self._scan_column(df[column], column)
            if matches:
                results['pii_detected'] = True
                results['columns_with_pii'][column] = matches
                all_matches.extend(matches)

        # Calculate risk level and recommendations
        if results['pii_detected']:
            results['risk_level'] = self._calculate_risk(all_matches)
            results['recommended_anonymization_level'] = self._recommend_level(
                results['risk_level']
            )
            results['warnings'] = self._generate_warnings(all_matches)
            results['summary'] = self._generate_summary(results)

        results['matches'] = all_matches
        return results

    def _scan_column(self, series: pd.Series, column_name: str) -> List[PIIMatch]:
        """
        Scan single column for PII types

        Args:
            series: Pandas Series to scan
            column_name: Name of the column

        Returns:
            List of PIIMatch objects found
        """
        matches = []

        # Sample the column
        sample_size = min(self.sample_size, len(series))
        sample = series.astype(str).sample(n=sample_size, random_state=42)

        # Check each PII type
        for pii_type, patterns in self.compiled_patterns.items():
            match_count = 0

            for text in sample:
                for pattern in patterns:
                    if pattern.search(text):
                        match_count += 1
                        break  # Count only once per row

            # Calculate confidence
            confidence = match_count / sample_size

            if confidence >= self.confidence_threshold:
                matches.append(PIIMatch(
                    pii_type=pii_type,
                    column=column_name,
                    sample_count=match_count,
                    confidence=confidence,
                    pattern=patterns[0].pattern
                ))

        return matches

    def _calculate_risk(self, matches: List[PIIMatch]) -> RiskLevel:
        """Calculate risk level based on PII types detected"""
        pii_types = {match.pii_type for match in matches}

        # Critical: Contains credentials or keys
        if any(t in self.CRITICAL_TYPES for t in pii_types):
            return RiskLevel.CRITICAL

        # High: Contains financial or government IDs
        if any(t in self.HIGH_RISK_TYPES for t in pii_types):
            return RiskLevel.HIGH

        # Medium: Multiple PII types or high-confidence matches
        high_confidence_matches = [m for m in matches if m.confidence > 0.7]
        if len(pii_types) > 3 or len(high_confidence_matches) > 2:
            return RiskLevel.MEDIUM

        # Low: Few PII types detected
        return RiskLevel.LOW

    def _recommend_level(self, risk: RiskLevel) -> int:
        """
        Recommend anonymization level based on risk

        Returns:
            Anonymization level 1-10
        """
        mapping = {
            RiskLevel.LOW: 3,
            RiskLevel.MEDIUM: 5,
            RiskLevel.HIGH: 7,
            RiskLevel.CRITICAL: 10
        }
        return mapping[risk]

    def _generate_warnings(self, matches: List[PIIMatch]) -> List[str]:
        """Generate human-readable warnings based on detected PII"""
        warnings = []

        pii_by_type = {}
        for match in matches:
            if match.pii_type not in pii_by_type:
                pii_by_type[match.pii_type] = []
            pii_by_type[match.pii_type].append(match)

        for pii_type, type_matches in pii_by_type.items():
            columns = [m.column for m in type_matches]
            avg_confidence = sum(m.confidence for m in type_matches) / len(type_matches)

            warning = (
                f"{pii_type.value.upper()}: Found in {len(columns)} column(s) "
                f"{columns} with {avg_confidence:.0%} confidence"
            )

            if pii_type in self.CRITICAL_TYPES:
                warning = "🔴 CRITICAL: " + warning
            elif pii_type in self.HIGH_RISK_TYPES:
                warning = "🟠 HIGH RISK: " + warning

            warnings.append(warning)

        return warnings

    def _generate_summary(self, results: Dict) -> str:
        """Generate summary text for scan results"""
        pii_count = len(results['columns_with_pii'])
        risk = results['risk_level'].value
        level = results['recommended_anonymization_level']

        summary = (
            f"PII Scan Results:\n"
            f"  - {pii_count} column(s) contain PII\n"
            f"  - Risk Level: {risk.upper()}\n"
            f"  - Recommended Anonymization Level: {level}/10\n"
        )

        if results['warnings']:
            summary += "\nDetected PII Types:\n"
            for warning in results['warnings']:
                summary += f"  - {warning}\n"

        return summary


def scan_file_for_pii(file_path: str, **kwargs) -> Dict[str, Any]:
    """
    Convenience function to scan a file for PII

    Args:
        file_path: Path to CSV/Excel file
        **kwargs: Additional arguments for PIIScanner

    Returns:
        Scan results dictionary
    """
    # Detect file type and read
    if file_path.endswith('.csv'):
        df = pd.read_csv(file_path)
    elif file_path.endswith(('.xlsx', '.xls')):
        df = pd.read_excel(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_path}")

    scanner = PIIScanner(**kwargs)
    return scanner.scan_dataframe(df)


# Example usage
if __name__ == "__main__":
    # Test scanner with sample data
    test_data = pd.DataFrame({
        'name': ['John Doe', 'Jane Smith', 'Bob Johnson'],
        'email': ['john@example.com', 'jane@test.no', 'bob@company.com'],
        'phone': ['+47 12345678', '+47 98765432', '+47 55555555'],
        'fnr': ['13048212345', '01019012345', '15129812345'],
        'account': ['1234.56.78901', '9876.54.32109', '5555.55.55555'],
        'safe_data': ['A', 'B', 'C']
    })

    scanner = PIIScanner()
    results = scanner.scan_dataframe(test_data)

    print("\n" + "="*80)
    print(results['summary'])
    print("="*80)

    if results['pii_detected']:
        print(f"\nRecommendation: Use anonymization_level={results['recommended_anonymization_level']}")
        print(f"\nAffected columns: {list(results['columns_with_pii'].keys())}")
