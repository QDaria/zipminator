"""Anonymization module for Zipminator NAV."""

import random
import string
from typing import Any, List
import pandas as pd


class Anonymize:
    """Provides anonymization functionality for DataFrame columns."""

    @staticmethod
    def anonymize_columns(df: pd.DataFrame, columns: List[str]) -> pd.DataFrame:
        """
        Anonymize specified columns in a DataFrame by replacing values with random strings.

        Args:
            df: The DataFrame to anonymize
            columns: List of column names to anonymize

        Returns:
            A new DataFrame with anonymized columns

        Raises:
            ValueError: If specified columns don't exist in the DataFrame
            TypeError: If df is not a pandas DataFrame
        """
        if not isinstance(df, pd.DataFrame):
            raise TypeError(f"Expected pandas DataFrame, got {type(df).__name__}")

        missing_cols = [col for col in columns if col not in df.columns]
        if missing_cols:
            raise ValueError(f"Columns not found in DataFrame: {missing_cols}")

        try:
            df = df.copy()
            for col in columns:
                df[col] = df[col].apply(
                    lambda x: ''.join(
                        random.choices(string.ascii_uppercase + string.digits, k=10)
                    )
                )
            return df
        except Exception as e:
            raise RuntimeError(f"Error during anonymization: {e}") from e
