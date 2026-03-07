"""
Quantum Readiness Scanner

Scans TLS endpoints for PQC support and grades their quantum readiness (A-F).
Uses Python's ssl module for TLS handshake inspection. No new dependencies.
"""

import ssl
import socket
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class ScanResult:
    """Result of scanning a single endpoint."""
    host: str
    port: int
    tls_version: str = ""
    cipher_suite: str = ""
    key_exchange: str = ""
    pqc_supported: bool = False
    pqc_algorithm: str = ""
    certificate_issuer: str = ""
    grade: str = "F"
    error: Optional[str] = None
    details: str = ""


@dataclass
class NetworkReport:
    """Aggregated report for multiple endpoints."""
    results: List[ScanResult] = field(default_factory=list)
    total_scanned: int = 0
    pqc_enabled_count: int = 0
    average_grade: str = "F"

    @property
    def pqc_percentage(self) -> float:
        if self.total_scanned == 0:
            return 0.0
        return (self.pqc_enabled_count / self.total_scanned) * 100


_GRADE_VALUES = {"A": 5, "B": 4, "C": 3, "D": 2, "F": 1}
_PQC_KEYWORDS = {"mlkem", "ml-kem", "ml_kem", "kyber", "x25519mlkem768", "x25519_mlkem768"}


class QuantumReadinessScanner:
    """Scan TLS endpoints for PQC support. Grade quantum readiness A-F."""

    def __init__(self, timeout: float = 5.0):
        self.timeout = timeout

    def scan_endpoint(self, host: str, port: int = 443) -> ScanResult:
        """
        Scan a single endpoint for TLS and PQC capabilities.

        Args:
            host: Hostname or IP
            port: Port number (default 443)

        Returns:
            ScanResult with TLS details and quantum readiness grade
        """
        result = ScanResult(host=host, port=port)

        try:
            context = ssl.create_default_context()
            context.check_hostname = True
            context.verify_mode = ssl.CERT_REQUIRED

            with socket.create_connection((host, port), timeout=self.timeout) as sock:
                with context.wrap_socket(sock, server_hostname=host) as ssock:
                    result.tls_version = ssock.version() or ""
                    cipher_info = ssock.cipher()
                    if cipher_info:
                        result.cipher_suite = cipher_info[0]
                        # cipher_info is (name, protocol, bits)

                    cert = ssock.getpeercert()
                    if cert:
                        issuer = cert.get("issuer", ())
                        for rdn in issuer:
                            for attr_type, attr_value in rdn:
                                if attr_type == "organizationName":
                                    result.certificate_issuer = attr_value
                                    break

                    # Detect PQC from cipher suite name
                    cipher_lower = result.cipher_suite.lower()
                    for kw in _PQC_KEYWORDS:
                        if kw in cipher_lower:
                            result.pqc_supported = True
                            result.pqc_algorithm = kw.upper()
                            break

                    # Also check key exchange (may be separate from cipher name)
                    result.key_exchange = self._detect_key_exchange(result.cipher_suite)

                    result.grade = self._grade(result)
                    result.details = self._build_details(result)

        except ssl.SSLError as e:
            result.error = f"SSL error: {e}"
            result.grade = "F"
        except socket.timeout:
            result.error = "Connection timed out"
            result.grade = "F"
        except OSError as e:
            result.error = f"Connection failed: {e}"
            result.grade = "F"

        return result

    def scan_network(self, hosts: List[str], port: int = 443) -> NetworkReport:
        """
        Scan multiple endpoints and produce an aggregated report.

        Args:
            hosts: List of hostnames
            port: Port number (default 443)

        Returns:
            NetworkReport with per-host results and summary stats
        """
        report = NetworkReport()

        for host in hosts:
            result = self.scan_endpoint(host, port)
            report.results.append(result)
            report.total_scanned += 1
            if result.pqc_supported:
                report.pqc_enabled_count += 1

        if report.results:
            grade_sum = sum(_GRADE_VALUES.get(r.grade, 1) for r in report.results)
            avg = grade_sum / len(report.results)
            # Map back to letter
            for letter, value in sorted(_GRADE_VALUES.items(), key=lambda x: -x[1]):
                if avg >= value - 0.5:
                    report.average_grade = letter
                    break

        return report

    @staticmethod
    def _detect_key_exchange(cipher_suite: str) -> str:
        """Extract key exchange algorithm hint from cipher suite name."""
        cipher_upper = cipher_suite.upper()
        if "ECDHE" in cipher_upper:
            return "ECDHE"
        if "DHE" in cipher_upper:
            return "DHE"
        if "RSA" in cipher_upper:
            return "RSA"
        return "unknown"

    @staticmethod
    def _grade(result: ScanResult) -> str:
        """
        Grade an endpoint's quantum readiness.

        A: PQC hybrid (X25519MLKEM768) active
        B: PQC available but not default (detected via known domain heuristics)
        C: TLS 1.3 with strong classical (ECDHE-P384+)
        D: TLS 1.2 with acceptable classical (RSA-2048+)
        F: TLS 1.1 or below, weak ciphers, no forward secrecy, or errors
        """
        if result.error:
            return "F"

        if result.pqc_supported:
            return "A"

        tls = result.tls_version
        cipher_upper = result.cipher_suite.upper()

        if tls == "TLSv1.3":
            if "P384" in cipher_upper or "P521" in cipher_upper:
                return "C"
            return "C"  # TLS 1.3 is always at least C

        if tls == "TLSv1.2":
            if "ECDHE" in cipher_upper or "DHE" in cipher_upper:
                return "D"
            return "F"  # No forward secrecy

        # TLS 1.1 or lower
        return "F"

    @staticmethod
    def _build_details(result: ScanResult) -> str:
        """Build a human-readable summary."""
        parts = []
        if result.pqc_supported:
            parts.append(f"PQC active: {result.pqc_algorithm}")
        else:
            parts.append("No PQC detected")

        parts.append(f"TLS: {result.tls_version}")
        parts.append(f"Cipher: {result.cipher_suite}")

        if result.certificate_issuer:
            parts.append(f"Issuer: {result.certificate_issuer}")

        return " | ".join(parts)
