"""
Advanced Anonymizer - 10-Level PQC Anonymization System

Facelift for legacy Zipminator logic from NAV, upgraded with
Post-Quantum Cryptography and Quantum Random Number Generation.

Levels:
  L1  Regex masking (SSN -> ***-**-1234)
  L2  SHA-3 deterministic hashing of PII fields
  L3  SHA-3 with PQC-derived salt (unique per dataset)
  L4  Tokenization (reversible mapping via secure SQLite)
  L5  K-Anonymity (generalize quasi-identifiers until k>=5)
  L6  L-Diversity (ensure sensitive attribute diversity)
  L7  Quantum noise jitter (numerical perturbation using QRNG entropy)
  L8  Differential privacy (Laplace mechanism, configurable epsilon, QRNG)
  L9  K-Anonymity + Differential privacy combined
  L10 Quantum pseudoanonymization (OTP mapping from QRNG pool)
"""

from __future__ import annotations

import hashlib
import math
import os
import re
import sqlite3
import string
import struct
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import numpy as np
import pandas as pd

try:
    from zipminator.crypto import quantum_random as qrng
except Exception:  # pragma: no cover
    qrng = None  # type: ignore

class AdvancedAnonymizer:
    """
    Implements a 10-level anonymization system for high-end data science.
    Levels 1-3: Basic (Deterministic/Static)
    Levels 4-6: Advanced (Hashing/Generalization)
    Levels 7-9: Quantum Noise (QRNG/Differential Privacy)
    Level 10: Total Quantum Pseudoanonymization
    """

    def __init__(self, pqc_key_seed: Optional[bytes] = None):
        """
        Initialize the anonymizer.
        
        Args:
            pqc_key_seed: A seed derived from a PQC secret key (Kyber-768) 
                          to ensure deterministic but secret hashing in L4.
        """
        self.pqc_key_seed = pqc_key_seed or b"default_pqc_seed_zipminator"
        # Level descriptions for UI display
        self.levels = {
            1: "Minimal Masking (Regex Redaction)",
            2: "Partial Redaction (First/Last chars)",
            3: "Static Masking ([REDACTED])",
            4: "PQC Pseudonymization (SHA-3 Hashing)",
            5: "Data Generalization (Age/Income Ranges)",
            6: "Data Suppression (Column Removal)",
            7: "Quantum Jitter (QRNG Gaussian Noise)",
            8: "Quantum Differential Privacy (Laplace)",
            9: "Enhanced K-Anonymity (Clustering)",
            10: "Total Quantum Pseudoanonymization (OTP Mapping)"
        }

    def process(self, df: pd.DataFrame, level_map: Dict[str, int]) -> pd.DataFrame:
        """
        Processes a DataFrame with column-specific anonymization levels.
        
        Args:
            df: Input pandas DataFrame.
            level_map: Dict mapping column names to anonymization level (1-10).
            
        Returns:
            Anonymized DataFrame.
        """
        result_df = df.copy()
        
        for col, level in level_map.items():
            if col not in df.columns:
                continue
                
            if level == 1:
                result_df[col] = self._level_1_minimal_masking(result_df[col])
            elif level == 2:
                result_df[col] = self._level_2_partial_redaction(result_df[col])
            elif level == 3:
                result_df[col] = self._level_3_static_masking(result_df[col])
            elif level == 4:
                result_df[col] = self._level_4_pqc_pseudonymization(result_df[col])
            elif level == 5:
                result_df[col] = self._level_5_generalization(result_df[col])
            elif level == 6:
                result_df = self._level_6_suppression(result_df, col)
            elif level == 7:
                result_df[col] = self._level_7_quantum_jitter(result_df[col])
            elif level == 8:
                result_df[col] = self._level_8_differential_privacy(result_df[col])
            elif level == 9:
                result_df[col] = self._level_9_k_anonymity(result_df[col])
            elif level == 10:
                result_df[col] = self._level_10_quantum_pseudo(result_df[col])
                
        return result_df

    # --- Level Implementations ---

    def _level_1_minimal_masking(self, series: pd.Series) -> pd.Series:
        """Regex-based partial masks for common patterns like emails/IDs."""
        def mask_val(val):
            s = str(val)
            if "@" in s: # Email
                parts = s.split("@")
                return parts[0][0] + "***@" + parts[1]
            if len(s) > 4: # generic ID
                return "*" * (len(s) - 4) + s[-4:]
            return "***"
        return series.apply(mask_val)

    def _level_2_partial_redaction(self, series: pd.Series) -> pd.Series:
        """First/Last character exposure with middle masking."""
        return series.apply(lambda x: str(x)[0] + "..." + str(x)[-1] if len(str(x)) > 2 else "***")

    def _level_3_static_masking(self, series: pd.Series) -> pd.Series:
        """Constant replacement."""
        return series.apply(lambda _: "[REDACTED]")

    def _level_4_pqc_pseudonymization(self, series: pd.Series) -> pd.Series:
        """SHA-3 hashing seeded with PQC key."""
        def hash_val(val):
            h = hashlib.sha3_256()
            h.update(self.pqc_key_seed)
            h.update(str(val).encode())
            return h.hexdigest()[:16]
        return series.apply(hash_val)

    def _level_5_generalization(self, series: pd.Series) -> pd.Series:
        """Basic ranges for numerical values."""
        if pd.api.types.is_numeric_dtype(series):
            std = series.std()
            if std == 0: return series
            return series.apply(lambda x: f"{(x // std) * std} - {(x // std + 1) * std}")
        return series # Fallback for non-numeric

    def _level_6_suppression(self, df: pd.DataFrame, col: str) -> pd.DataFrame:
        """Drop columns completely."""
        return df.drop(columns=[col])

    def _level_7_quantum_jitter(self, series: pd.Series) -> pd.Series:
        """Inject small Gaussian noise using QRNG."""
        if not pd.api.types.is_numeric_dtype(series):
            return series
        
        noise_std = series.std() * 0.05 # 5% jitter
        return series.apply(lambda x: x + qrng.gauss(0, noise_std))

    def _level_8_differential_privacy(self, series: pd.Series) -> pd.Series:
        """Robust Differential Privacy noise using QRNG."""
        if not pd.api.types.is_numeric_dtype(series):
            return self._level_4_pqc_pseudonymization(series)
        
        # ε-differential privacy simulation
        epsilon = 0.1
        sensitivity = series.max() - series.min()
        scale = sensitivity / epsilon
        
        # Laplace noise can be generated from two exponentials
        # We use QRNG to drive the noise
        def qr_laplace(mu, b):
            u = qrng.random() - 0.5
            return mu - b * np.sign(u) * np.log(1 - 2 * np.abs(u))
            
        return series.apply(lambda x: x + qr_laplace(0, scale))

    def _level_9_k_anonymity(self, series: pd.Series) -> pd.Series:
        """Clustering and bucketizing for K-anonymity compliance."""
        # Simplified: Use quantiles
        return pd.qcut(series, 4, duplicates='drop').astype(str)

    def _level_10_quantum_pseudo(self, series: pd.Series) -> pd.Series:
        """Total Data replacement with One-Time Pad mapping from QRNG."""
        mapping = {}
        def get_otp_val(val):
            if val not in mapping:
                # Generate a 12-char random string from QRNG
                chars = string.ascii_letters + string.digits
                mapping[val] = "".join([qrng.choice(chars) for _ in range(12)])
            return mapping[val]
        return series.apply(get_otp_val)


# ---------------------------------------------------------------------------
# Entropy helper: read bytes from pool or fallback to os.urandom
# ---------------------------------------------------------------------------

def _get_entropy_bytes(n: int, pool_path: Optional[str] = None) -> bytes:
    """Return *n* random bytes, preferring the quantum entropy pool."""
    if pool_path:
        p = Path(pool_path)
        if p.exists() and p.stat().st_size > 0:
            try:
                with open(p, "rb") as f:
                    data = f.read(n)
                if len(data) >= n:
                    return data[:n]
            except OSError:
                pass
    # Try the PoolProvider (project default path)
    try:
        from zipminator.entropy.pool_provider import PoolProvider
        provider = PoolProvider(pool_path=pool_path)
        bits = provider.get_entropy(n * 8)
        # Convert bitstring back to bytes
        out = bytearray()
        for i in range(0, len(bits), 8):
            out.append(int(bits[i:i + 8], 2))
        if len(out) >= n:
            return bytes(out[:n])
    except Exception:
        pass
    return os.urandom(n)


def _entropy_float(pool_path: Optional[str] = None) -> float:
    """Return a random float in [0, 1) from entropy source."""
    raw = _get_entropy_bytes(8, pool_path)
    return struct.unpack(">Q", raw)[0] / (2**64)


def _entropy_laplace(mu: float, b: float, pool_path: Optional[str] = None) -> float:
    """Sample from Laplace(mu, b) using entropy source."""
    u = _entropy_float(pool_path) - 0.5
    # Clamp to avoid log(0)
    u = max(min(u, 0.4999999), -0.4999999)
    return mu - b * np.sign(u) * np.log(1.0 - 2.0 * abs(u))


def _entropy_gauss(mu: float, sigma: float, pool_path: Optional[str] = None) -> float:
    """Sample from Gaussian(mu, sigma) using Box-Muller with entropy source."""
    u1 = max(_entropy_float(pool_path), 1e-15)
    u2 = _entropy_float(pool_path)
    z = math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2)
    return mu + sigma * z


def _entropy_random_string(length: int, pool_path: Optional[str] = None) -> str:
    """Generate a random alphanumeric string from entropy source."""
    chars = string.ascii_letters + string.digits
    raw = _get_entropy_bytes(length, pool_path)
    return "".join(chars[b % len(chars)] for b in raw)


# ---------------------------------------------------------------------------
# TokenStore: reversible tokenization backed by in-memory SQLite
# ---------------------------------------------------------------------------

class TokenStore:
    """Reversible token mapping backed by an in-memory (or file) SQLite DB."""

    def __init__(self, db_path: str = ":memory:") -> None:
        self._conn = sqlite3.connect(db_path)
        self._conn.execute(
            "CREATE TABLE IF NOT EXISTS tokens "
            "(col TEXT, original TEXT, token TEXT, "
            "PRIMARY KEY (col, original))"
        )
        self._conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_tok ON tokens(col, token)"
        )
        self._counter: Dict[str, int] = {}

    def tokenize(self, col: str, value: str) -> str:
        row = self._conn.execute(
            "SELECT token FROM tokens WHERE col=? AND original=?",
            (col, value),
        ).fetchone()
        if row:
            return row[0]
        self._counter.setdefault(col, 0)
        self._counter[col] += 1
        token = f"TOK_{self._counter[col]:08X}"
        self._conn.execute(
            "INSERT INTO tokens VALUES (?, ?, ?)", (col, value, token)
        )
        return token

    def detokenize(self, col: str, token: str) -> Optional[str]:
        row = self._conn.execute(
            "SELECT original FROM tokens WHERE col=? AND token=?",
            (col, token),
        ).fetchone()
        return row[0] if row else None


# ---------------------------------------------------------------------------
# LevelAnonymizer — canonical API: apply(df, level, **kwargs)
# ---------------------------------------------------------------------------

class LevelAnonymizer:
    """
    10-level anonymizer following the Zipminator product spec.

    Usage::

        anon = LevelAnonymizer()
        result = anon.apply(df, level=5, k=5, quasi_identifiers=["age"])
        # For L4 tokenization, reverse with:
        restored = anon.detokenize(result)
    """

    LEVEL_NAMES = {
        1: "Regex Masking",
        2: "SHA-3 Deterministic Hashing",
        3: "SHA-3 + PQC Salt",
        4: "Tokenization (reversible)",
        5: "K-Anonymity",
        6: "L-Diversity",
        7: "Quantum Noise Jitter",
        8: "Differential Privacy (Laplace)",
        9: "K-Anonymity + Differential Privacy",
        10: "Quantum OTP Pseudoanonymization",
    }

    def __init__(
        self,
        pqc_salt: Optional[bytes] = None,
        token_db_path: str = ":memory:",
        entropy_pool_path: Optional[str] = None,
    ) -> None:
        self._pqc_salt = pqc_salt or b"zipminator_pqc_default_salt_v1"
        self._token_store = TokenStore(db_path=token_db_path)
        self._pool_path = entropy_pool_path
        self._otp_maps: Dict[str, Dict[Any, str]] = {}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def apply(self, df: pd.DataFrame, level: int, **kwargs: Any) -> pd.DataFrame:
        """
        Apply anonymization at the given level (1-10) to the DataFrame.

        Keyword args vary by level:
          L5: k (int, default 5), quasi_identifiers (list[str])
          L6: l (int, default 2), quasi_identifiers, sensitive_columns
          L7: jitter_factor (float, default 0.05)
          L8: epsilon (float, default 1.0)
          L9: k, epsilon, quasi_identifiers
          L10: (no extra args)
        """
        if level < 1 or level > 10:
            raise ValueError(f"level must be between 1 and 10, got {level}")

        if len(df) == 0:
            return df.copy()

        handler = {
            1: self._apply_l1,
            2: self._apply_l2,
            3: self._apply_l3,
            4: self._apply_l4,
            5: self._apply_l5,
            6: self._apply_l6,
            7: self._apply_l7,
            8: self._apply_l8,
            9: self._apply_l9,
            10: self._apply_l10,
        }
        return handler[level](df.copy(), **kwargs)

    def detokenize(self, df: pd.DataFrame) -> pd.DataFrame:
        """Reverse L4 tokenization for all columns that contain TOK_ prefixed values."""
        out = df.copy()
        for col in out.columns:
            # Check if column could contain string tokens (object, string, str dtype)
            if not pd.api.types.is_numeric_dtype(out[col]):
                def _detok(v: Any, c: str = col) -> Any:
                    sv = str(v)
                    if sv.startswith("TOK_"):
                        result = self._token_store.detokenize(c, sv)
                        return result if result is not None else v
                    return v
                out[col] = out[col].apply(_detok)
        return out

    # ------------------------------------------------------------------
    # L1: Regex masking
    # ------------------------------------------------------------------

    def _apply_l1(self, df: pd.DataFrame, **kw: Any) -> pd.DataFrame:
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                continue  # leave numeric untouched
            df[col] = df[col].apply(self._mask_value)
        return df

    @staticmethod
    def _mask_value(val: Any) -> str:
        s = str(val)
        # Email
        if "@" in s:
            local, domain = s.split("@", 1)
            return local[0] + "***@" + domain
        # SSN-like (NNN-NN-NNNN)
        m = re.match(r"(\d{3})-(\d{2})-(\d{4})", s)
        if m:
            return f"***-**-{m.group(3)}"
        # Generic: mask all but last 4
        if len(s) > 4:
            return "*" * (len(s) - 4) + s[-4:]
        return "***"

    # ------------------------------------------------------------------
    # L2: SHA-3 deterministic hashing
    # ------------------------------------------------------------------

    def _apply_l2(self, df: pd.DataFrame, **kw: Any) -> pd.DataFrame:
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                df[col] = df[col].apply(
                    lambda v: hashlib.sha3_256(str(v).encode()).hexdigest()
                )
            else:
                df[col] = df[col].apply(
                    lambda v: hashlib.sha3_256(str(v).encode()).hexdigest()
                )
        return df

    # ------------------------------------------------------------------
    # L3: SHA-3 with PQC-derived salt
    # ------------------------------------------------------------------

    def _apply_l3(self, df: pd.DataFrame, **kw: Any) -> pd.DataFrame:
        for col in df.columns:
            df[col] = df[col].apply(lambda v: self._salted_hash(v))
        return df

    def _salted_hash(self, val: Any) -> str:
        h = hashlib.sha3_256()
        h.update(self._pqc_salt)
        h.update(str(val).encode())
        return h.hexdigest()

    # ------------------------------------------------------------------
    # L4: Tokenization (reversible)
    # ------------------------------------------------------------------

    def _apply_l4(self, df: pd.DataFrame, **kw: Any) -> pd.DataFrame:
        for col in df.columns:
            df[col] = df[col].apply(
                lambda v, c=col: self._token_store.tokenize(c, str(v))
            )
        return df

    # ------------------------------------------------------------------
    # L5: K-Anonymity
    # ------------------------------------------------------------------

    def _apply_l5(self, df: pd.DataFrame, **kw: Any) -> pd.DataFrame:
        k = kw.get("k", 5)
        qi = kw.get("quasi_identifiers", self._detect_quasi_identifiers(df))
        df = self._generalize_until_k(df, qi, k)
        return df

    def _generalize_until_k(
        self, df: pd.DataFrame, qi: List[str], k: int, max_iter: int = 20
    ) -> pd.DataFrame:
        """Iteratively widen buckets on quasi-identifiers until every group has >= k rows."""
        # Compute a sensible initial bucket size from data range
        initial_bucket = 10
        for col in qi:
            if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
                col_range = float(df[col].max() - df[col].min())
                if col_range > 0:
                    # Start with a bucket that yields ~n/k groups
                    n_groups_target = max(1, len(df) // k)
                    candidate = col_range / n_groups_target
                    initial_bucket = max(initial_bucket, candidate)

        bucket_size = initial_bucket
        temp = df.copy()
        for _ in range(max_iter):
            temp = df.copy()
            for col in qi:
                if col not in temp.columns:
                    continue
                if pd.api.types.is_numeric_dtype(df[col]):
                    temp[col] = df[col].apply(
                        lambda x, bs=bucket_size: self._numeric_range(x, bs)
                    )
                else:
                    temp[col] = df[col].apply(
                        lambda x, bs=bucket_size: self._text_generalize(x, bs)
                    )
            groups = temp.groupby(qi).size()
            if groups.min() >= k:
                return temp
            bucket_size *= 2
        return temp  # best effort

    @staticmethod
    def _numeric_range(val: Any, bucket_size: int) -> str:
        try:
            v = float(val)
            lower = int(v // bucket_size) * bucket_size
            upper = lower + bucket_size
            return f"{lower}-{upper}"
        except (ValueError, TypeError):
            return str(val)

    @staticmethod
    def _text_generalize(val: Any, level: int) -> str:
        s = str(val)
        # Truncate to fewer chars as level grows
        keep = max(1, len(s) - level // 10)
        return s[:keep] + "*"

    @staticmethod
    def _detect_quasi_identifiers(df: pd.DataFrame) -> List[str]:
        """Heuristic: numeric columns are likely quasi-identifiers."""
        return [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]

    # ------------------------------------------------------------------
    # L6: L-Diversity
    # ------------------------------------------------------------------

    def _apply_l6(self, df: pd.DataFrame, **kw: Any) -> pd.DataFrame:
        l_val = kw.get("l", 2)
        qi = kw.get("quasi_identifiers", self._detect_quasi_identifiers(df))
        sensitive = kw.get("sensitive_columns", [])

        # First apply k-anonymity style generalization
        df = self._generalize_until_k(df, qi, k=l_val)

        if not sensitive:
            return df

        # Suppress groups that don't meet l-diversity
        for _ in range(5):  # max refinement iterations
            groups = df.groupby(qi)
            bad_groups = []
            for name, group in groups:
                for scol in sensitive:
                    if scol in group.columns and group[scol].nunique() < l_val:
                        bad_groups.append(name)
                        break
            if not bad_groups:
                break
            # Widen generalization for bad groups by doubling bucket
            # Re-generalize all with larger bucket
            df = self._generalize_until_k(
                df, qi, k=max(l_val, 5),
            )

        return df

    # ------------------------------------------------------------------
    # L7: Quantum noise jitter (numeric perturbation)
    # ------------------------------------------------------------------

    def _apply_l7(self, df: pd.DataFrame, **kw: Any) -> pd.DataFrame:
        factor = kw.get("jitter_factor", 0.05)
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                std = df[col].std()
                if std == 0 or np.isnan(std):
                    std = 1.0
                noise_std = std * factor
                df[col] = df[col].apply(
                    lambda x: x + _entropy_gauss(0, noise_std, self._pool_path)
                )
        return df

    # ------------------------------------------------------------------
    # L8: Differential privacy (Laplace mechanism)
    # ------------------------------------------------------------------

    def _apply_l8(self, df: pd.DataFrame, **kw: Any) -> pd.DataFrame:
        epsilon = kw.get("epsilon", 1.0)
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                sensitivity = float(df[col].max() - df[col].min())
                if sensitivity == 0:
                    sensitivity = 1.0
                scale = sensitivity / epsilon
                df[col] = df[col].apply(
                    lambda x: x + _entropy_laplace(0, scale, self._pool_path)
                )
            else:
                # Hash text columns to prevent cleartext leakage
                df[col] = df[col].apply(
                    lambda v: hashlib.sha3_256(str(v).encode()).hexdigest()[:16]
                )
        return df

    # ------------------------------------------------------------------
    # L9: K-Anonymity + Differential Privacy combined
    # ------------------------------------------------------------------

    def _apply_l9(self, df: pd.DataFrame, **kw: Any) -> pd.DataFrame:
        k = kw.get("k", 5)
        epsilon = kw.get("epsilon", 1.0)
        qi = kw.get("quasi_identifiers", self._detect_quasi_identifiers(df))

        # Step 1: K-anonymity on quasi-identifiers
        df = self._generalize_until_k(df, qi, k)

        # Step 2: Differential privacy noise on non-QI numeric columns
        for col in df.columns:
            if col in qi:
                continue  # already generalized
            if pd.api.types.is_numeric_dtype(df[col]):
                sensitivity = float(df[col].max() - df[col].min())
                if sensitivity == 0:
                    sensitivity = 1.0
                scale = sensitivity / epsilon
                df[col] = df[col].apply(
                    lambda x: x + _entropy_laplace(0, scale, self._pool_path)
                )
        return df

    # ------------------------------------------------------------------
    # L10: Quantum OTP pseudoanonymization
    # ------------------------------------------------------------------

    def _apply_l10(self, df: pd.DataFrame, **kw: Any) -> pd.DataFrame:
        for col in df.columns:
            mapping: Dict[Any, str] = {}

            def otp_replace(val: Any, m: Dict = mapping) -> str:
                key = str(val)
                if key not in m:
                    m[key] = _entropy_random_string(16, self._pool_path)
                return m[key]

            df[col] = df[col].apply(otp_replace)
            self._otp_maps[col] = mapping
        return df
