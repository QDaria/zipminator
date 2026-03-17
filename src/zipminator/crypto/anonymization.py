"""
10-Level Anonymization System for Zipminator
Provides progressive data anonymization from basic masking to homomorphic encryption
"""

import hashlib
import random
import string
from typing import List, Dict, Any, Optional

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    np = None  # type: ignore
    NUMPY_AVAILABLE = False

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    pd = None  # type: ignore
    PANDAS_AVAILABLE = False

try:
    from faker import Faker
    FAKER_AVAILABLE = True
except ImportError:
    Faker = None  # type: ignore
    FAKER_AVAILABLE = False

try:
    from phe import paillier
    PHE_AVAILABLE = True
except ImportError:
    paillier = None  # type: ignore
    PHE_AVAILABLE = False


from .quantum_random import QuantumRandom


class AnonymizationEngine:
    """
    10-Level Anonymization Engine for Pandas DataFrames
    ...
    """

    def __init__(self):
        self._token_maps = {}
        self.faker = Faker() if FAKER_AVAILABLE else None
        self.public_key = None
        self.private_key = None
        self.qrand = QuantumRandom()  # Initialize Quantum Random Generator

    def apply_anonymization(self, df: pd.DataFrame, columns: List[str], level: int = 1) -> pd.DataFrame:
        """Apply anonymization based on the specified level (1-10)."""
        df = df.copy()

        for col in columns:
            if level == 1:
                df[col] = df[col].apply(
                    lambda x: hashlib.sha256(str(x).encode()).hexdigest())

            elif level == 2:
                chars = string.ascii_uppercase + string.digits
                df[col] = df[col].apply(lambda x: ''.join(
                    [self.qrand.choice(chars) for _ in range(10)]))

            elif level == 3:
                token_map = {}

                def tokenize(value):
                    if value not in token_map:
                        token_map[value] = f"TOKEN_{hashlib.md5(str(value).encode()).hexdigest()[:8].upper()}"
                    return token_map[value]
                df[col] = df[col].apply(tokenize)
                self._token_maps[col] = token_map

            elif level == 4:
                if pd.api.types.is_numeric_dtype(df[col]):
                    df[col] = df[col].apply(
                        lambda x: self._generalize_numeric(x))
                else:
                    df[col] = df[col].apply(lambda x: self._generalize_text(x))

            elif level == 5:
                # Suppression: Replace all values with None (NULL)
                # Using pd.NA for better pandas compatibility and explicit None values
                df[col] = pd.NA

            elif level == 6:
                if pd.api.types.is_numeric_dtype(df[col]):
                    noise_factor = 0.1
                    # random.uniform(-1, 1) -> qrand.random() * 2 - 1
                    df[col] = df[col].apply(
                        lambda x: x + (x * noise_factor * (self.qrand.random() * 2 - 1)))
                else:
                    chars = string.ascii_uppercase + string.digits
                    df[col] = df[col].apply(lambda x: ''.join(
                        [self.qrand.choice(chars) for _ in range(10)]))

            elif level == 7:
                df[col] = df[col].apply(
                    lambda x: self._generate_synthetic(col))

            elif level == 8:
                df = self._apply_k_anonymity(df, [col], k=5)

            elif level == 9:
                if pd.api.types.is_numeric_dtype(df[col]):
                    epsilon = 1.0
                    sensitivity = df[col].max() - df[col].min()
                    scale = sensitivity / epsilon if sensitivity > 0 else 1.0
                    # Note: Using numpy's laplace for now as implementing it from uniform is complex
                    # Ideally we would seed numpy with quantum entropy
                    df[col] = df[col].apply(
                        lambda x: x + np.random.laplace(0, scale))
                else:
                    # For text columns, always replace to prevent PII leakage.
                    # A truthful-response probability > 0 would leak original
                    # values, which violates the anonymization contract.
                    df[col] = df[col].apply(
                        lambda x: self._randomized_response(x, p=0.0))

            elif level == 10:
                if not PHE_AVAILABLE:
                    # Degrade to L9 (differential privacy) if phe not installed
                    return self.apply_anonymization(df, [col], level=9)
                # Real Homomorphic Encryption using Paillier
                if not self.public_key:
                    self.public_key, self.private_key = paillier.generate_paillier_keypair()

                if pd.api.types.is_numeric_dtype(df[col]):
                    df[col] = df[col].apply(
                        lambda x: self.public_key.encrypt(float(x)))
                else:
                    # Fallback for non-numeric: Standard encryption (simulated here as we can't do math on strings)
                    df[col] = df[col].apply(
                        lambda x: self._simple_homomorphic_encrypt(x))

            else:
                raise ValueError(
                    f"Invalid anonymization level: {level}. Must be between 1-10.")

        return df

    # ... (methods _generalize_numeric through _apply_k_anonymity unchanged) ...

    def _randomized_response(self, value: str, p: float = 0.75) -> str:
        """Apply randomized response for differential privacy on categorical data."""
        if self.qrand.random() < p:
            return value
        else:
            chars = string.ascii_uppercase + string.digits
            return ''.join([self.qrand.choice(chars) for _ in range(len(str(value)))])

    def _generalize_numeric(self, value: float, bucket_size: int = 10) -> str:
        """Generalize numeric value to a range."""
        try:
            val = float(value)
            lower = int(val // bucket_size) * bucket_size
            upper = lower + bucket_size
            return f"{lower}-{upper}"
        except:
            return "UNKNOWN"

    def _generalize_text(self, value: str) -> str:
        """Generalize text to a category."""
        try:
            return f"CATEGORY_{str(value)[0].upper()}"
        except:
            return "CATEGORY_UNKNOWN"

    def _generate_synthetic(self, column_name: str) -> str:
        """Generate synthetic data based on column name hints."""
        if not self.faker:
            # Fallback without faker: generate random string
            chars = string.ascii_letters + string.digits
            return ''.join([self.qrand.choice(chars) for _ in range(12)])

        col_lower = column_name.lower()

        if 'name' in col_lower:
            return self.faker.name()
        elif 'email' in col_lower:
            return self.faker.email()
        elif 'phone' in col_lower:
            return self.faker.phone_number()
        elif 'address' in col_lower:
            return self.faker.address()
        elif 'company' in col_lower:
            return self.faker.company()
        elif 'ssn' in col_lower or 'social' in col_lower:
            return self.faker.ssn()
        elif 'credit' in col_lower or 'card' in col_lower:
            return self.faker.credit_card_number()
        else:
            return self.faker.word()

    def _apply_k_anonymity(self, df: pd.DataFrame, quasi_identifiers: List[str], k: int = 5) -> pd.DataFrame:
        """Apply k-anonymity by generalizing quasi-identifiers.

        Numeric columns are bucketed into ranges. Text columns are
        generalized to category prefixes so that the original PII value
        is never preserved verbatim.
        """
        df_copy = df.copy()

        for col in quasi_identifiers:
            if pd.api.types.is_numeric_dtype(df_copy[col]):
                df_copy[col] = df_copy[col].apply(
                    lambda x: self._generalize_numeric(x, bucket_size=10))
            else:
                # Generalize text to category prefix (same as L4 text path)
                df_copy[col] = df_copy[col].apply(
                    lambda x: self._generalize_text(x))

        return df_copy

    def _simple_homomorphic_encrypt(self, value: Any) -> str:
        """Legacy/Fallback encryption for non-numeric data."""
        try:
            val_str = str(value)
            encrypted = hashlib.sha256(val_str.encode()).hexdigest()
            return f"ENC_{encrypted[:16]}"
        except:
            return "ENC_ERROR"
