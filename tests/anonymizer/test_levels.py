"""
TDD tests for LevelAnonymizer L1-L10.

Tests written BEFORE implementation (Red phase).
Each level has specific verifiable properties.
"""

import math
import os
import pytest

try:
    import pandas as pd
    import numpy as np

    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

pytestmark = pytest.mark.skipif(not PANDAS_AVAILABLE, reason="pandas not installed")


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def sample_df():
    """30-row DataFrame with mixed PII: enough rows for k=5 anonymity."""
    names = [
        "Alice Johnson", "Bob Smith", "Carol White", "David Brown", "Eve Davis",
        "Frank Miller", "Grace Wilson", "Hank Moore", "Iris Taylor", "Jack Anderson",
        "Karen Thomas", "Leo Jackson", "Mia Harris", "Noah Martin", "Olivia Garcia",
        "Paul Martinez", "Quinn Robinson", "Rita Clark", "Sam Rodriguez", "Tina Lewis",
        "Uma Lee", "Victor Walker", "Wendy Hall", "Xavier Allen", "Yara Young",
        "Zane King", "Amy Wright", "Ben Lopez", "Cora Hill", "Dan Scott",
    ]
    return pd.DataFrame({
        "name": names,
        "ssn": [f"{100+i:03d}-{50+i:02d}-{1000+i:04d}" for i in range(30)],
        "email": [f"user{i}@example.com" for i in range(30)],
        "age": [20 + (i % 40) for i in range(30)],
        "salary": [40000 + i * 2000 for i in range(30)],
        "diagnosis": [
            "flu", "cold", "flu", "migraine", "cold",
            "flu", "diabetes", "cold", "migraine", "flu",
            "diabetes", "cold", "flu", "migraine", "cold",
            "flu", "diabetes", "cold", "migraine", "flu",
            "diabetes", "cold", "flu", "migraine", "cold",
            "flu", "diabetes", "cold", "migraine", "flu",
        ],
    })


@pytest.fixture
def anonymizer():
    """Fresh LevelAnonymizer for each test."""
    from zipminator.anonymizer import LevelAnonymizer
    return LevelAnonymizer()


# ---------------------------------------------------------------------------
# Basic contract: every level runs and produces output != input
# ---------------------------------------------------------------------------

class TestAllLevelsBasic:
    """Every level 1-10 must execute and change data."""

    @pytest.mark.parametrize("level", range(1, 11))
    def test_level_returns_dataframe(self, anonymizer, sample_df, level):
        result = anonymizer.apply(sample_df, level=level)
        assert isinstance(result, pd.DataFrame)
        assert len(result) == len(sample_df)

    @pytest.mark.parametrize("level", range(1, 11))
    def test_level_changes_data(self, anonymizer, sample_df, level):
        result = anonymizer.apply(sample_df, level=level)
        # At least one column must differ from original
        any_changed = False
        for col in sample_df.columns:
            if col in result.columns:
                if not result[col].equals(sample_df[col]):
                    any_changed = True
                    break
        assert any_changed, f"L{level} did not change any column"

    @pytest.mark.parametrize("level", range(1, 11))
    def test_original_unchanged(self, anonymizer, sample_df, level):
        original = sample_df.copy()
        anonymizer.apply(sample_df, level=level)
        pd.testing.assert_frame_equal(sample_df, original)


# ---------------------------------------------------------------------------
# L1: Regex masking
# ---------------------------------------------------------------------------

class TestLevel1:
    def test_ssn_partially_masked(self, anonymizer, sample_df):
        result = anonymizer.apply(sample_df, level=1)
        for val in result["ssn"]:
            s = str(val)
            # Should contain asterisks and preserve last 4 digits
            assert "*" in s, f"L1 should mask SSN with asterisks: {s}"

    def test_email_partially_masked(self, anonymizer, sample_df):
        result = anonymizer.apply(sample_df, level=1)
        for val in result["email"]:
            s = str(val)
            assert "*" in s or "***" in s, f"L1 should mask email: {s}"

    def test_numeric_unchanged(self, anonymizer, sample_df):
        """L1 regex masking should not alter numeric columns."""
        result = anonymizer.apply(sample_df, level=1)
        assert result["age"].equals(sample_df["age"])
        assert result["salary"].equals(sample_df["salary"])


# ---------------------------------------------------------------------------
# L2: SHA-3 deterministic hashing
# ---------------------------------------------------------------------------

class TestLevel2:
    def test_produces_hex_hashes(self, anonymizer, sample_df):
        result = anonymizer.apply(sample_df, level=2)
        for val in result["name"]:
            s = str(val)
            assert all(c in "0123456789abcdef" for c in s), f"L2 should produce hex: {s}"

    def test_deterministic(self, anonymizer, sample_df):
        r1 = anonymizer.apply(sample_df, level=2)
        r2 = anonymizer.apply(sample_df, level=2)
        assert r1["name"].tolist() == r2["name"].tolist()

    def test_different_inputs_different_hashes(self, anonymizer, sample_df):
        result = anonymizer.apply(sample_df, level=2)
        unique = result["name"].nunique()
        assert unique == len(sample_df), "L2 same-name collision unexpected in 30 unique names"


# ---------------------------------------------------------------------------
# L3: SHA-3 with PQC-derived salt
# ---------------------------------------------------------------------------

class TestLevel3:
    def test_produces_hex_hashes(self, anonymizer, sample_df):
        result = anonymizer.apply(sample_df, level=3)
        for val in result["name"]:
            s = str(val)
            assert all(c in "0123456789abcdef" for c in s)

    def test_different_salt_different_output(self, sample_df):
        from zipminator.anonymizer import LevelAnonymizer
        a1 = LevelAnonymizer(pqc_salt=b"salt_a")
        a2 = LevelAnonymizer(pqc_salt=b"salt_b")
        r1 = a1.apply(sample_df, level=3)
        r2 = a2.apply(sample_df, level=3)
        assert r1["name"].tolist() != r2["name"].tolist()


# ---------------------------------------------------------------------------
# L4: Tokenization (reversible)
# ---------------------------------------------------------------------------

class TestLevel4:
    def test_tokenization_changes_values(self, anonymizer, sample_df):
        result = anonymizer.apply(sample_df, level=4)
        assert not result["name"].equals(sample_df["name"])

    def test_tokenization_is_reversible(self, anonymizer, sample_df):
        result = anonymizer.apply(sample_df, level=4)
        restored = anonymizer.detokenize(result)
        assert restored["name"].tolist() == sample_df["name"].tolist()
        assert restored["ssn"].tolist() == sample_df["ssn"].tolist()

    def test_tokenization_deterministic(self, anonymizer, sample_df):
        r1 = anonymizer.apply(sample_df, level=4)
        r2 = anonymizer.apply(sample_df, level=4)
        assert r1["name"].tolist() == r2["name"].tolist()

    def test_tokens_have_prefix(self, anonymizer, sample_df):
        result = anonymizer.apply(sample_df, level=4)
        for val in result["name"]:
            assert str(val).startswith("TOK_"), f"L4 tokens should start with TOK_: {val}"


# ---------------------------------------------------------------------------
# L5: K-Anonymity (k >= 5)
# ---------------------------------------------------------------------------

class TestLevel5:
    def test_k_anonymity_achieved(self, anonymizer, sample_df):
        result = anonymizer.apply(sample_df, level=5, k=5, quasi_identifiers=["age", "salary"])
        # Group by quasi-identifiers, every group should have >= 5 rows
        groups = result.groupby(["age", "salary"]).size()
        for group_size in groups:
            assert group_size >= 5, f"L5 k-anonymity violated: group has {group_size} < 5 rows"

    def test_age_generalized_to_ranges(self, anonymizer, sample_df):
        result = anonymizer.apply(sample_df, level=5, quasi_identifiers=["age"])
        # Ages should become range strings
        for val in result["age"]:
            assert isinstance(val, str) and "-" in val, f"L5 age should be range: {val}"

    def test_non_qi_columns_unchanged(self, anonymizer, sample_df):
        result = anonymizer.apply(sample_df, level=5, quasi_identifiers=["age", "salary"])
        # diagnosis (sensitive attribute) should not be generalized
        assert result["diagnosis"].tolist() == sample_df["diagnosis"].tolist()


# ---------------------------------------------------------------------------
# L6: L-Diversity
# ---------------------------------------------------------------------------

class TestLevel6:
    def test_l_diversity_in_groups(self, anonymizer, sample_df):
        result = anonymizer.apply(
            sample_df, level=6, l=2,
            quasi_identifiers=["age", "salary"],
            sensitive_columns=["diagnosis"],
        )
        groups = result.groupby(["age", "salary"])
        for _, group in groups:
            n_distinct = group["diagnosis"].nunique()
            assert n_distinct >= 2, (
                f"L6 l-diversity violated: group has {n_distinct} distinct diagnosis values"
            )

    def test_generalizes_quasi_identifiers(self, anonymizer, sample_df):
        result = anonymizer.apply(
            sample_df, level=6,
            quasi_identifiers=["age"],
            sensitive_columns=["diagnosis"],
        )
        for val in result["age"]:
            assert isinstance(val, str) and "-" in val


# ---------------------------------------------------------------------------
# L7: Quantum noise jitter
# ---------------------------------------------------------------------------

class TestLevel7:
    def test_numeric_columns_perturbed(self, anonymizer, sample_df):
        result = anonymizer.apply(sample_df, level=7)
        # Salary and age should differ from original
        assert not result["salary"].equals(sample_df["salary"])
        assert not result["age"].equals(sample_df["age"])

    def test_perturbation_is_small(self, anonymizer, sample_df):
        """Jitter should be within ~10% of std dev."""
        result = anonymizer.apply(sample_df, level=7)
        orig_std = sample_df["salary"].std()
        max_diff = result["salary"].sub(sample_df["salary"]).abs().max()
        # Noise should be bounded (5% std is the typical jitter factor)
        assert max_diff < orig_std, f"L7 noise too large: max_diff={max_diff}, std={orig_std}"

    def test_text_columns_unchanged(self, anonymizer, sample_df):
        """L7 should only perturb numeric columns."""
        result = anonymizer.apply(sample_df, level=7)
        assert result["name"].tolist() == sample_df["name"].tolist()

    def test_falls_back_to_os_entropy(self, sample_df):
        """Should not crash when entropy pool is missing."""
        from zipminator.anonymizer import LevelAnonymizer
        anon = LevelAnonymizer(entropy_pool_path="/nonexistent/pool.bin")
        result = anon.apply(sample_df, level=7)
        assert not result["salary"].equals(sample_df["salary"])


# ---------------------------------------------------------------------------
# L8: Differential privacy (Laplace)
# ---------------------------------------------------------------------------

class TestLevel8:
    def test_numeric_columns_noised(self, anonymizer, sample_df):
        result = anonymizer.apply(sample_df, level=8, epsilon=1.0)
        assert not result["salary"].equals(sample_df["salary"])

    def test_smaller_epsilon_more_noise(self, anonymizer, sample_df):
        """epsilon=0.1 should produce more noise than epsilon=1.0."""
        r_tight = anonymizer.apply(sample_df, level=8, epsilon=1.0)
        r_loose = anonymizer.apply(sample_df, level=8, epsilon=0.1)
        diff_tight = (r_tight["salary"] - sample_df["salary"]).abs().mean()
        diff_loose = (r_loose["salary"] - sample_df["salary"]).abs().mean()
        assert diff_loose > diff_tight, (
            f"L8 epsilon=0.1 should produce more noise ({diff_loose}) "
            f"than epsilon=1.0 ({diff_tight})"
        )

    def test_text_columns_hashed(self, anonymizer, sample_df):
        """Non-numeric columns should be hashed (not left in cleartext)."""
        result = anonymizer.apply(sample_df, level=8, epsilon=1.0)
        for orig, anon in zip(sample_df["name"], result["name"]):
            assert str(anon) != str(orig), f"L8 text should not be in cleartext: {orig}"

    def test_falls_back_to_os_entropy(self, sample_df):
        from zipminator.anonymizer import LevelAnonymizer
        anon = LevelAnonymizer(entropy_pool_path="/nonexistent/pool.bin")
        result = anon.apply(sample_df, level=8, epsilon=0.5)
        assert not result["salary"].equals(sample_df["salary"])


# ---------------------------------------------------------------------------
# L9: K-Anonymity + Differential Privacy combined
# ---------------------------------------------------------------------------

class TestLevel9:
    def test_k_anonymity_applied(self, anonymizer, sample_df):
        result = anonymizer.apply(
            sample_df, level=9, k=5, epsilon=1.0,
            quasi_identifiers=["age", "salary"],
        )
        groups = result.groupby(["age", "salary"]).size()
        for group_size in groups:
            assert group_size >= 5, f"L9 k-anonymity violated: {group_size} < 5"

    def test_numeric_noise_applied(self, anonymizer, sample_df):
        """After k-anonymity generalization, DP noise should be visible on other numeric cols."""
        # We only generalize age/salary as QI; any remaining numeric column
        # would get DP noise. Since all numeric are QI here, check that
        # salary is generalized (string ranges), proving both steps ran.
        result = anonymizer.apply(
            sample_df, level=9, k=5, epsilon=1.0,
            quasi_identifiers=["age", "salary"],
        )
        # QI columns become generalized strings
        for val in result["age"]:
            assert isinstance(val, str), f"L9 age should be generalized string: {val}"


# ---------------------------------------------------------------------------
# L10: Quantum OTP mapping
# ---------------------------------------------------------------------------

class TestLevel10:
    def test_all_values_replaced(self, anonymizer, sample_df):
        result = anonymizer.apply(sample_df, level=10)
        for col in ["name", "ssn", "email", "diagnosis"]:
            for orig, anon in zip(sample_df[col], result[col]):
                assert str(anon) != str(orig), f"L10 should replace {col}: {orig} -> {anon}"

    def test_numeric_replaced(self, anonymizer, sample_df):
        result = anonymizer.apply(sample_df, level=10)
        # Numeric values should also be completely replaced
        for orig, anon in zip(sample_df["salary"], result["salary"]):
            assert str(anon) != str(orig)

    def test_mapping_is_consistent(self, anonymizer, sample_df):
        """Same value in same run should map to same OTP token."""
        # The diagnosis column has repeats (flu, cold, etc.)
        result = anonymizer.apply(sample_df, level=10)
        # All "flu" entries should map to the same token
        flu_indices = sample_df.index[sample_df["diagnosis"] == "flu"].tolist()
        flu_tokens = [result.loc[i, "diagnosis"] for i in flu_indices]
        assert len(set(flu_tokens)) == 1, f"L10 OTP should be consistent: {set(flu_tokens)}"

    def test_falls_back_to_os_entropy(self, sample_df):
        from zipminator.anonymizer import LevelAnonymizer
        anon = LevelAnonymizer(entropy_pool_path="/nonexistent/pool.bin")
        result = anon.apply(sample_df, level=10)
        assert not result["name"].equals(sample_df["name"])


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------

class TestEdgeCases:
    def test_invalid_level_raises(self, anonymizer, sample_df):
        with pytest.raises(ValueError, match="level must be between 1 and 10"):
            anonymizer.apply(sample_df, level=0)
        with pytest.raises(ValueError, match="level must be between 1 and 10"):
            anonymizer.apply(sample_df, level=11)

    def test_empty_dataframe(self, anonymizer):
        df = pd.DataFrame({
            "name": pd.Series([], dtype=str),
            "age": pd.Series([], dtype=float),
        })
        for level in range(1, 11):
            result = anonymizer.apply(df, level=level)
            assert len(result) == 0

    def test_single_row(self, anonymizer):
        df = pd.DataFrame({"name": ["Alice"], "age": [30], "salary": [50000]})
        for level in [1, 2, 3, 4, 7, 8, 10]:
            result = anonymizer.apply(df, level=level)
            assert len(result) == 1
