"""
HNDL (Harvest Now, Decrypt Later) Risk Calculator

Quantifies the risk of data being harvested today for future quantum decryption.
Uses NIST timeline estimates (2030-2040 for CRQC) and data sensitivity scoring.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class HNDLRiskScore:
    """Result of an HNDL risk assessment."""
    overall_risk: float           # 0-100
    risk_level: str               # LOW / MEDIUM / HIGH / CRITICAL
    years_until_quantum_break: int
    data_exposure_probability: float  # 0.0-1.0
    recommended_action: str
    current_protection: str
    details: str


# NIST/expert consensus estimates for cryptographically-relevant quantum computer
_CRQC_YEAR_ESTIMATES = {
    "optimistic": 2030,
    "moderate": 2035,
    "conservative": 2040,
}

_SENSITIVITY_WEIGHTS = {
    "public": 0.1,
    "internal": 0.3,
    "confidential": 0.7,
    "top_secret": 1.0,
}

_ENCRYPTION_STRENGTH = {
    "none": 0.0,
    "aes128": 0.4,
    "aes256": 0.5,
    "rsa2048": 0.3,
    "rsa4096": 0.35,
    "ecdsa_p256": 0.3,
    "ecdsa_p384": 0.35,
    "pqc_hybrid": 0.95,
    "pqc_only": 0.9,
    "kyber768": 0.95,
}

_INDUSTRY_MULTIPLIER = {
    "government": 1.5,
    "defense": 1.6,
    "healthcare": 1.3,
    "finance": 1.4,
    "legal": 1.2,
    "critical_infrastructure": 1.5,
    "technology": 1.0,
    "education": 0.8,
    "retail": 0.7,
    "other": 1.0,
}


class HNDLCalculator:
    """
    Calculate HNDL risk based on data sensitivity, retention period,
    current encryption, and industry context.
    """

    def calculate(
        self,
        data_sensitivity: str = "confidential",
        retention_years: int = 10,
        current_encryption: str = "aes256",
        industry: str = "technology",
        crqc_estimate: str = "moderate",
    ) -> HNDLRiskScore:
        """
        Calculate the HNDL risk score.

        Args:
            data_sensitivity: public / internal / confidential / top_secret
            retention_years: How many years data must remain confidential
            current_encryption: Current encryption algorithm in use
            industry: Industry vertical
            crqc_estimate: optimistic / moderate / conservative timeline

        Returns:
            HNDLRiskScore with overall risk 0-100 and recommendations
        """
        sensitivity = _SENSITIVITY_WEIGHTS.get(data_sensitivity, 0.5)
        protection = _ENCRYPTION_STRENGTH.get(current_encryption, 0.3)
        multiplier = _INDUSTRY_MULTIPLIER.get(industry, 1.0)
        crqc_year = _CRQC_YEAR_ESTIMATES.get(crqc_estimate, 2035)

        current_year = 2026
        years_until_break = max(0, crqc_year - current_year)

        # Data is vulnerable if retention extends past CRQC arrival
        overlap_years = max(0, retention_years - years_until_break)

        # Exposure probability: how likely is data still sensitive when CRQC arrives
        if retention_years <= 0:
            exposure_prob = 0.0
        else:
            exposure_prob = min(1.0, overlap_years / retention_years)

        # PQC protection dramatically reduces risk
        pqc_reduction = protection if "pqc" in current_encryption or "kyber" in current_encryption else 0.0

        # Classical encryption provides no protection against quantum attacks
        classical_vulnerability = 1.0 - pqc_reduction

        # Core risk formula
        raw_risk = (
            sensitivity * 40 +
            exposure_prob * 30 +
            classical_vulnerability * 20 +
            (overlap_years / max(retention_years, 1)) * 10
        ) * multiplier

        overall_risk = min(100.0, max(0.0, raw_risk))

        # Determine risk level
        if overall_risk >= 80:
            risk_level = "CRITICAL"
        elif overall_risk >= 60:
            risk_level = "HIGH"
        elif overall_risk >= 35:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Generate recommendation
        recommended_action = self._recommend(
            risk_level, current_encryption, data_sensitivity, overlap_years
        )

        # Protection status
        if "pqc" in current_encryption or "kyber" in current_encryption:
            current_protection = "Quantum-resistant (PQC)"
        elif current_encryption == "none":
            current_protection = "No encryption"
        else:
            current_protection = f"Classical only ({current_encryption}) - vulnerable to quantum"

        details = (
            f"CRQC estimated by {crqc_year} ({crqc_estimate}). "
            f"Data requires {retention_years}yr confidentiality. "
            f"{overlap_years}yr overlap with quantum threat window. "
            f"Industry multiplier: {multiplier}x ({industry})."
        )

        return HNDLRiskScore(
            overall_risk=round(overall_risk, 1),
            risk_level=risk_level,
            years_until_quantum_break=years_until_break,
            data_exposure_probability=round(exposure_prob, 3),
            recommended_action=recommended_action,
            current_protection=current_protection,
            details=details,
        )

    @staticmethod
    def _recommend(
        risk_level: str,
        encryption: str,
        sensitivity: str,
        overlap_years: int,
    ) -> str:
        if "pqc" in encryption or "kyber" in encryption:
            return "Your data is protected with post-quantum cryptography. Continue monitoring NIST standards updates."

        if risk_level == "CRITICAL":
            return (
                "IMMEDIATE ACTION REQUIRED: Migrate to PQC encryption (ML-KEM-768/Kyber768). "
                "Your data will be exposed to quantum decryption within the retention period. "
                "Consider Zipminator Enterprise tier for QRNG + Kyber768 protection."
            )
        if risk_level == "HIGH":
            return (
                "HIGH PRIORITY: Begin PQC migration planning. "
                f"Your {sensitivity} data has {overlap_years} years of quantum exposure. "
                "Zipminator Pro tier provides hybrid PQC encryption for immediate protection."
            )
        if risk_level == "MEDIUM":
            return (
                "Plan PQC migration within 12-18 months. "
                "Current encryption provides no quantum resistance. "
                "Zipminator Developer tier offers PQC protection for development workloads."
            )
        return (
            "Low immediate risk, but monitor quantum computing advances. "
            "Consider PQC adoption as part of regular security updates."
        )
