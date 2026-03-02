"""Data masking module for Zipminator NAV."""

import secrets
import string
from typing import List, Optional, Dict, Any
import pandas as pd
import hashlib


class DataMask:
    """Provides data masking functionality for DataFrame columns."""

    @staticmethod
    def mask_columns(
        df: pd.DataFrame,
        columns: List[str],
        mask_type: str = 'random',
        mask_char: str = '*',
        preserve_length: bool = True
    ) -> pd.DataFrame:
        """
        Mask specified columns in a DataFrame using various masking strategies.

        Args:
            df: The DataFrame to mask
            columns: List of column names to mask
            mask_type: Type of masking ('random', 'hash', 'static', 'partial')
            mask_char: Character to use for static masking
            preserve_length: Whether to preserve original value length

        Returns:
            A new DataFrame with masked columns

        Raises:
            ValueError: If specified columns don't exist or mask_type is invalid
            TypeError: If df is not a pandas DataFrame
        """
        if not isinstance(df, pd.DataFrame):
            raise TypeError(f"Expected pandas DataFrame, got {type(df).__name__}")

        valid_mask_types = ['random', 'hash', 'static', 'partial']
        if mask_type not in valid_mask_types:
            raise ValueError(f"Invalid mask_type: {mask_type}. Choose from {valid_mask_types}")

        missing_cols = [col for col in columns if col not in df.columns]
        if missing_cols:
            raise ValueError(f"Columns not found in DataFrame: {missing_cols}")

        try:
            df = df.copy()

            for col in columns:
                if mask_type == 'random':
                    df[col] = df[col].apply(
                        lambda x: DataMask._random_mask(x, preserve_length)
                    )
                elif mask_type == 'hash':
                    df[col] = df[col].apply(DataMask._hash_mask)
                elif mask_type == 'static':
                    df[col] = df[col].apply(
                        lambda x: DataMask._static_mask(x, mask_char, preserve_length)
                    )
                elif mask_type == 'partial':
                    df[col] = df[col].apply(DataMask._partial_mask)

            return df

        except Exception as e:
            raise RuntimeError(f"Error during masking: {e}") from e

    @staticmethod
    def _random_mask(value: Any, preserve_length: bool = True) -> str:
        """Generate a random mask for a value."""
        if pd.isna(value):
            return value

        str_value = str(value)
        length = len(str_value) if preserve_length else 10

        chars = string.ascii_uppercase + string.digits
        return ''.join(secrets.choice(chars) for _ in range(length))

    @staticmethod
    def _hash_mask(value: Any) -> str:
        """Generate a hash-based mask for a value."""
        if pd.isna(value):
            return value

        str_value = str(value)
        return hashlib.sha256(str_value.encode()).hexdigest()[:16]

    @staticmethod
    def _static_mask(value: Any, mask_char: str = '*', preserve_length: bool = True) -> str:
        """Generate a static character mask for a value."""
        if pd.isna(value):
            return value

        str_value = str(value)
        length = len(str_value) if preserve_length else 10

        return mask_char * length

    @staticmethod
    def _partial_mask(value: Any, visible_chars: int = 4) -> str:
        """
        Partially mask a value, keeping first and last characters visible.

        Args:
            value: The value to mask
            visible_chars: Number of characters to keep visible at each end
        """
        if pd.isna(value):
            return value

        str_value = str(value)
        if len(str_value) <= visible_chars * 2:
            return str_value

        visible = visible_chars // 2
        masked_length = len(str_value) - (visible * 2)
        return f"{str_value[:visible]}{'*' * masked_length}{str_value[-visible:]}"


class Anonymize:
    """Legacy class for backward compatibility. Use DataMask instead."""

    @staticmethod
    def anonymize_columns(df: pd.DataFrame, columns: List[str]) -> pd.DataFrame:
        """
        Anonymize specified columns (legacy method - use DataMask.mask_columns instead).

        Args:
            df: The DataFrame to anonymize
            columns: List of column names to anonymize

        Returns:
            A new DataFrame with anonymized columns
        """
        return DataMask.mask_columns(df, columns, mask_type='random')
