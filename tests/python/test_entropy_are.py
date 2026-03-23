"""Tests for the Algebraic Randomness Extraction (ARE) pure-Python module.

Covers:
- Determinism (same seed + input = same output)
- Different seeds produce different output
- extract_bytes returns correct length
- Large inputs do not overflow
- Division by zero safety (identity rule)
- Complex domain multiplication
- Explicit step construction (from_steps)
- Cross-validation against spec test vectors (are-spec.md)
"""

import os

import pytest

from zipminator.entropy.are import (
    AreExtractor,
    AreStep,
    Domain,
    Operation,
    domain_execute,
)


# ---------------------------------------------------------------------------
# Test 1: Roundtrip determinism
# ---------------------------------------------------------------------------

class TestDeterminism:
    """Same seed + same input must always produce the same output."""

    def test_roundtrip_determinism(self):
        seed = b"deterministic_seed_42"
        ext1 = AreExtractor.from_seed(seed, num_steps=8)
        ext2 = AreExtractor.from_seed(seed, num_steps=8)

        for x in [0, 1, 42, 255, 100_000, 2**64 - 1]:
            assert ext1.extract(x) == ext2.extract(x), (
                f"Non-deterministic output for input {x}"
            )

    def test_extract_bytes_determinism(self):
        seed = b"bytes_determinism"
        ext1 = AreExtractor.from_seed(seed)
        ext2 = AreExtractor.from_seed(seed)
        data = os.urandom(64)
        assert ext1.extract_bytes(data, 32) == ext2.extract_bytes(data, 32)


# ---------------------------------------------------------------------------
# Test 2: Different seeds produce different output
# ---------------------------------------------------------------------------

class TestDifferentSeeds:

    def test_different_seeds_different_output(self):
        ext_a = AreExtractor.from_seed(b"seed_alpha", num_steps=8)
        ext_b = AreExtractor.from_seed(b"seed_beta", num_steps=8)

        # With overwhelming probability, at least one of these inputs
        # will produce different output for different seeds.
        outputs_a = [ext_a.extract(x) for x in range(100)]
        outputs_b = [ext_b.extract(x) for x in range(100)]
        assert outputs_a != outputs_b, "Different seeds produced identical outputs"


# ---------------------------------------------------------------------------
# Test 3: extract_bytes returns correct length
# ---------------------------------------------------------------------------

class TestExtractBytes:

    @pytest.mark.parametrize("output_len", [1, 8, 16, 32, 64, 128, 255])
    def test_extract_bytes_length(self, output_len: int):
        ext = AreExtractor.from_seed(b"length_test", num_steps=4)
        data = os.urandom(64)
        result = ext.extract_bytes(data, output_len)
        assert len(result) == output_len

    def test_extract_bytes_short_input(self):
        ext = AreExtractor.from_seed(b"short_input")
        result = ext.extract_bytes(b"\x01", output_len=32)
        assert len(result) == 32


# ---------------------------------------------------------------------------
# Test 4: Large input no overflow
# ---------------------------------------------------------------------------

class TestLargeInput:

    def test_large_input_no_overflow(self):
        ext = AreExtractor.from_seed(b"overflow_test", num_steps=8)
        large_values = [
            2**63 - 1,
            2**64 - 1,
            2**127 - 1,
            10**30,
        ]
        for val in large_values:
            result = ext.extract(val)
            assert 0 <= result < ext.modulus, (
                f"Output {result} out of range for input {val}"
            )

    def test_large_bytes_input(self):
        ext = AreExtractor.from_seed(b"large_bytes")
        data = os.urandom(1024)
        result = ext.extract_bytes(data, 64)
        assert len(result) == 64


# ---------------------------------------------------------------------------
# Test 5: Division by zero safety
# ---------------------------------------------------------------------------

class TestDivisionByZero:

    def test_division_by_zero_returns_identity(self):
        """Div by 0 must return the input unchanged (identity rule)."""
        steps = [AreStep(Domain.NATURAL, 0, 0, Operation.DIV)]
        ext = AreExtractor.from_steps(steps, modulus=257, domain_bound=256)
        # For input 77: div(77, 0) -> 77, then 77 mod 257 = 77
        assert ext.extract(77) == 77

    def test_mod_by_zero_returns_identity(self):
        """Mod by 0 must return the input unchanged."""
        steps = [AreStep(Domain.NATURAL, 0, 0, Operation.MOD)]
        ext = AreExtractor.from_steps(steps, modulus=257, domain_bound=256)
        assert ext.extract(42) == 42

    def test_integer_div_by_zero(self):
        steps = [AreStep(Domain.INTEGER, 0, 0, Operation.DIV)]
        ext = AreExtractor.from_steps(steps, modulus=257, domain_bound=256)
        result = ext.extract(99)
        assert 0 <= result < 257


# ---------------------------------------------------------------------------
# Test 6: Complex domain
# ---------------------------------------------------------------------------

class TestComplexDomain:

    def test_complex_multiplication(self):
        """Complex mul: Re((a+0i)(c+di)) = a*c."""
        # (50 + 0i) * (3 + 4i) -> real part = 50*3 = 150
        result = domain_execute(
            Domain.COMPLEX,
            Operation.MUL,
            input_val=50,
            value=3,
            value_imag=4,
            modulus=257,
            domain_bound=256,
        )
        # 50*3 = 150, projected to Z_256 = 150
        assert result == 150

    def test_complex_addition(self):
        result = domain_execute(
            Domain.COMPLEX,
            Operation.ADD,
            input_val=100,
            value=55,
            value_imag=10,
            modulus=257,
            domain_bound=256,
        )
        # (100+0i) + (55+10i) -> real part = 155
        assert result == 155

    def test_complex_div_by_zero(self):
        """Division by (0+0i) should return identity."""
        result = domain_execute(
            Domain.COMPLEX,
            Operation.DIV,
            input_val=42,
            value=0,
            value_imag=0,
            modulus=257,
            domain_bound=256,
        )
        # Should be project_to_integer(42, 256) = 42
        assert result == 42


# ---------------------------------------------------------------------------
# Test 7: Explicit step construction (from_steps)
# ---------------------------------------------------------------------------

class TestFromSteps:

    def test_from_steps_single_add(self):
        steps = [AreStep(Domain.NATURAL, 10, 0, Operation.ADD)]
        ext = AreExtractor.from_steps(steps, modulus=257, domain_bound=256)
        assert ext.extract(42) == 52

    def test_from_steps_properties(self):
        steps = [
            AreStep(Domain.INTEGER, 3, 0, Operation.MUL),
            AreStep(Domain.NATURAL, 5, 0, Operation.ADD),
        ]
        ext = AreExtractor.from_steps(steps, modulus=1009, domain_bound=256)
        assert ext.modulus == 1009
        assert len(ext.steps) == 2

    def test_from_steps_empty_raises(self):
        with pytest.raises(ValueError, match="at least one step"):
            AreExtractor.from_steps([], modulus=257)

    def test_from_steps_bad_modulus(self):
        steps = [AreStep(Domain.NATURAL, 1, 0, Operation.ADD)]
        with pytest.raises(ValueError, match="Modulus must be >= 2"):
            AreExtractor.from_steps(steps, modulus=1)


# ---------------------------------------------------------------------------
# Test 8: Cross-validation with spec test vectors (are-spec.md)
# ---------------------------------------------------------------------------

class TestSpecVectors:
    """Test vectors from docs/papers/che-framework/are-spec.md.

    All vectors use n=256 (8-bit domain bound) and p=257.
    """

    MODULUS = 257
    BOUND = 256

    def _make_ext(self, steps: list[AreStep]) -> AreExtractor:
        return AreExtractor.from_steps(
            steps, modulus=self.MODULUS, domain_bound=self.BOUND
        )

    def test_vector1_single_natural_add(self):
        """Vector 1: x=42, [(N, 10, Add)], p=257 -> 52."""
        ext = self._make_ext([AreStep(Domain.NATURAL, 10, 0, Operation.ADD)])
        assert ext.extract(42) == 52

    def test_vector2_integer_mul_sub(self):
        """Vector 2: x=100, [(Z, 3, Mul), (Z, 50, Sub)], p=257 -> 250."""
        ext = self._make_ext([
            AreStep(Domain.INTEGER, 3, 0, Operation.MUL),
            AreStep(Domain.INTEGER, 50, 0, Operation.SUB),
        ])
        assert ext.extract(100) == 250

    def test_vector3_div_by_zero(self):
        """Vector 3: x=77, [(N, 0, Div), (N, 5, Add)], p=257 -> 82."""
        ext = self._make_ext([
            AreStep(Domain.NATURAL, 0, 0, Operation.DIV),
            AreStep(Domain.NATURAL, 5, 0, Operation.ADD),
        ])
        assert ext.extract(77) == 82

    def test_vector4_natural_overflow(self):
        """Vector 4: x=200, [(N, 200, Add), (N, 3, Mul)], p=257 -> 176.

        Trace: (200+200) mod 256=144, 144*3=432 mod 256=176.
        """
        ext = self._make_ext([
            AreStep(Domain.NATURAL, 200, 0, Operation.ADD),
            AreStep(Domain.NATURAL, 3, 0, Operation.MUL),
        ])
        assert ext.extract(200) == 176

    def test_vector5_mixed_domain(self):
        """Vector 5: x=50, [(N,7,Mul),(Z,-20,Add),(N,13,Mod)], p=257 -> 9.

        Trace: 50*7=350 mod 256=94, project to Z: 94+(-20)=74,
               project to N: 74 mod 13=9.
        """
        ext = self._make_ext([
            AreStep(Domain.NATURAL, 7, 0, Operation.MUL),
            AreStep(Domain.INTEGER, -20, 0, Operation.ADD),
            AreStep(Domain.NATURAL, 13, 0, Operation.MOD),
        ])
        assert ext.extract(50) == 9

    def test_vector6_exponentiation(self):
        """Vector 6: x=2, [(N, 10, Exp)], p=257 -> 0.

        Trace: 2^10=1024 mod 256=0.
        """
        ext = self._make_ext([AreStep(Domain.NATURAL, 10, 0, Operation.EXP)])
        assert ext.extract(2) == 0

    def test_vector7_multi_step_large_acc(self):
        """Vector 7: x=128, [(Z,127,Add),(N,2,Mul),(Z,-1,Add)], p=257 -> 253.

        Trace: 128+127=255, 255*2=510 mod 256=254, 254+(-1)=253.
        """
        ext = self._make_ext([
            AreStep(Domain.INTEGER, 127, 0, Operation.ADD),
            AreStep(Domain.NATURAL, 2, 0, Operation.MUL),
            AreStep(Domain.INTEGER, -1, 0, Operation.ADD),
        ])
        assert ext.extract(128) == 253

    def test_vector8_chained_mul_avalanche(self):
        """Vector 8: x=1, 4x(N, *, Mul) with 137,149,163,173, p=257.

        Corrected trace (spec has arithmetic errors from step 2 onward):
          step 1: 1*137 = 137
          step 2: 137*149 = 20413 mod 256 = 189  (spec claims 157, but 20413%256=189)
          step 3: 189*163 = 30807 mod 256 = 87
          step 4: 87*173 = 15051 mod 256 = 203
        Output: 203 mod 257 = 203
        """
        ext = self._make_ext([
            AreStep(Domain.NATURAL, 137, 0, Operation.MUL),
            AreStep(Domain.NATURAL, 149, 0, Operation.MUL),
            AreStep(Domain.NATURAL, 163, 0, Operation.MUL),
            AreStep(Domain.NATURAL, 173, 0, Operation.MUL),
        ])
        assert ext.extract(1) == 203
