"""
Integration tests for all 10 anonymization levels.

Verifies that every level (L1-L10) of the AnonymizationEngine:
1. Runs without error
2. Produces output distinct from the original input
3. Higher levels produce progressively different transformations
4. PII (SSN-like data) is removed or obscured at every level
"""

import pytest

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

pytestmark = pytest.mark.skipif(not PANDAS_AVAILABLE, reason="pandas not installed")

from zipminator.crypto.anonymization import AnonymizationEngine


@pytest.fixture
def engine():
    return AnonymizationEngine()


@pytest.fixture
def sample_df():
    """DataFrame with mixed PII: names, SSN-like numbers, emails, ages."""
    return pd.DataFrame({
        "name": ["John Doe", "Jane Smith", "Bob Wilson", "Alice Brown", "Eve Davis"],
        "ssn": ["123-45-6789", "987-65-4321", "555-12-3456", "111-22-3333", "444-55-6666"],
        "email": ["john@example.com", "jane@test.org", "bob@mail.net", "alice@co.io", "eve@x.com"],
        "age": [34, 28, 45, 52, 19],
        "salary": [75000, 82000, 65000, 91000, 48000],
    })


class TestAllLevelsRun:
    """Every level (1-10) must execute without raising."""

    @pytest.mark.parametrize("level", range(1, 11))
    def test_level_runs_on_text_column(self, engine, sample_df, level):
        result = engine.apply_anonymization(sample_df, ["name"], level=level)
        assert isinstance(result, pd.DataFrame)
        assert len(result) == len(sample_df)

    @pytest.mark.parametrize("level", range(1, 11))
    def test_level_runs_on_numeric_column(self, engine, sample_df, level):
        result = engine.apply_anonymization(sample_df, ["salary"], level=level)
        assert isinstance(result, pd.DataFrame)
        assert len(result) == len(sample_df)


class TestLevelsProduceDifferentOutputs:
    """Different levels must produce detectably different transformations."""

    def test_l1_and_l10_differ_on_text(self, engine, sample_df):
        r1 = engine.apply_anonymization(sample_df, ["name"], level=1)
        r10 = engine.apply_anonymization(sample_df, ["name"], level=10)
        assert not r1["name"].equals(r10["name"]), "L1 and L10 must differ on text column"

    def test_l1_and_l10_differ_on_numeric(self, engine, sample_df):
        r1 = engine.apply_anonymization(sample_df, ["salary"], level=1)
        r10 = engine.apply_anonymization(sample_df, ["salary"], level=10)
        assert not r1["salary"].equals(r10["salary"]), "L1 and L10 must differ on numeric column"

    def test_at_least_5_distinct_outputs_across_10_levels(self, engine, sample_df):
        """With 10 levels, at least 5 should produce unique name-column outputs."""
        outputs = set()
        for level in range(1, 11):
            result = engine.apply_anonymization(sample_df, ["name"], level=level)
            # Convert to tuple of strings for hashability
            output_key = tuple(str(v) for v in result["name"].tolist())
            outputs.add(output_key)
        assert len(outputs) >= 5, (
            f"Expected at least 5 distinct outputs across 10 levels, got {len(outputs)}"
        )


class TestPIIRemoval:
    """SSN-like values must not survive anonymization at any level."""

    @pytest.mark.parametrize("level", range(1, 11))
    def test_ssn_not_in_output(self, engine, sample_df, level):
        result = engine.apply_anonymization(sample_df, ["ssn"], level=level)
        original_ssns = sample_df["ssn"].tolist()
        result_values = [str(v) for v in result["ssn"].tolist()]
        for ssn in original_ssns:
            for val in result_values:
                assert ssn not in val, (
                    f"L{level}: original SSN '{ssn}' found in output '{val}'"
                )


class TestLevelSpecificBehavior:
    """Verify known properties of specific levels."""

    def test_l1_produces_sha256_hashes(self, engine, sample_df):
        result = engine.apply_anonymization(sample_df, ["name"], level=1)
        for val in result["name"]:
            # SHA-256 hex digest is 64 chars of hex
            assert len(str(val)) == 64, f"L1 should produce 64-char SHA-256 hash, got len={len(str(val))}"
            assert all(c in "0123456789abcdef" for c in str(val)), "L1 output should be hex"

    def test_l3_tokenization_is_deterministic(self, engine, sample_df):
        """L3 tokenization: same input -> same token."""
        df_dup = pd.DataFrame({"name": ["John Doe", "John Doe", "Jane Smith"]})
        result = engine.apply_anonymization(df_dup, ["name"], level=3)
        vals = result["name"].tolist()
        assert vals[0] == vals[1], "L3 tokenization should be deterministic for same input"
        assert vals[0] != vals[2], "L3 tokens should differ for different inputs"

    def test_l4_generalizes_numeric(self, engine, sample_df):
        """L4 should generalize numeric values to ranges like '30-40'."""
        result = engine.apply_anonymization(sample_df, ["age"], level=4)
        for val in result["age"]:
            assert "-" in str(val), f"L4 numeric should produce range string, got '{val}'"

    def test_l5_suppresses_to_null(self, engine, sample_df):
        """L5 should suppress all values to NA/None."""
        result = engine.apply_anonymization(sample_df, ["name"], level=5)
        assert result["name"].isna().all(), "L5 should set all values to NA"

    def test_l6_adds_noise_to_numeric(self, engine, sample_df):
        """L6 should add noise to numeric columns — values change but stay numeric."""
        result = engine.apply_anonymization(sample_df, ["salary"], level=6)
        for orig, anon in zip(sample_df["salary"], result["salary"]):
            assert isinstance(anon, (int, float)), f"L6 numeric should stay numeric, got {type(anon)}"
            # Noise is ±10%, so value should be within ~20% of original
            assert abs(anon - orig) < orig * 0.15, (
                f"L6 noise too large: orig={orig}, anon={anon}"
            )

    def test_l7_generates_synthetic_data(self, engine, sample_df):
        """L7 should replace values with synthetic data (not original)."""
        result = engine.apply_anonymization(sample_df, ["name"], level=7)
        for orig, anon in zip(sample_df["name"], result["name"]):
            assert str(anon) != str(orig), f"L7 should replace '{orig}' with synthetic data"

    def test_l8_k_anonymity_generalizes(self, engine, sample_df):
        """L8 applies k-anonymity — numeric quasi-identifiers get generalized."""
        result = engine.apply_anonymization(sample_df, ["age"], level=8)
        for val in result["age"]:
            # k-anonymity generalizes numeric to ranges
            assert "-" in str(val), f"L8 should generalize age to range, got '{val}'"

    def test_l9_differential_privacy_numeric(self, engine, sample_df):
        """L9 adds Laplace noise for differential privacy."""
        result = engine.apply_anonymization(sample_df, ["salary"], level=9)
        changed = sum(
            1 for orig, anon in zip(sample_df["salary"], result["salary"])
            if orig != anon
        )
        # With Laplace noise, virtually all values should change
        assert changed >= 3, f"L9 should change most values via Laplace noise, only {changed}/5 changed"


class TestEdgeCases:
    """Edge cases and robustness checks."""

    def test_invalid_level_raises(self, engine, sample_df):
        with pytest.raises(ValueError, match="Invalid anonymization level"):
            engine.apply_anonymization(sample_df, ["name"], level=0)
        with pytest.raises(ValueError, match="Invalid anonymization level"):
            engine.apply_anonymization(sample_df, ["name"], level=11)

    def test_empty_dataframe(self, engine):
        df = pd.DataFrame({"col": pd.Series([], dtype=str)})
        for level in range(1, 11):
            result = engine.apply_anonymization(df, ["col"], level=level)
            assert len(result) == 0

    def test_multiple_columns_simultaneously(self, engine, sample_df):
        result = engine.apply_anonymization(sample_df, ["name", "ssn"], level=1)
        # Both columns should be hashed
        for col in ["name", "ssn"]:
            for val in result[col]:
                assert len(str(val)) == 64, f"Both columns should be anonymized"

    def test_original_dataframe_unchanged(self, engine, sample_df):
        """Anonymization must not mutate the original DataFrame."""
        original_copy = sample_df.copy()
        engine.apply_anonymization(sample_df, ["name", "salary"], level=6)
        pd.testing.assert_frame_equal(sample_df, original_copy)
