"""Tests for CHSH Bell inequality certification.

Verifies:
- Circuit construction (4 circuits, 2 qubits each)
- Correlator computation from measurement counts
- S-value computation from correlators
- BellResult classification (quantum vs classical)
- Statistical significance (violation_sigma)
"""
import math

import pytest


class TestBellTestCircuits:
    """Tests for CHSH circuit creation."""

    def test_create_chsh_circuits_count(self):
        """Should create exactly 4 circuits for CHSH settings (a,b) in {0,1}^2."""
        from zipminator.entropy.bell_test import create_chsh_circuits

        circuits = create_chsh_circuits()
        assert len(circuits) == 4

    def test_create_chsh_circuits_qubits(self):
        """Each circuit should use exactly 2 qubits and 2 classical bits."""
        from zipminator.entropy.bell_test import create_chsh_circuits

        circuits = create_chsh_circuits()
        for qc in circuits:
            assert qc.num_qubits == 2
            assert qc.num_clbits == 2

    def test_create_chsh_circuits_have_measurements(self):
        """Each circuit should contain measurement operations."""
        from zipminator.entropy.bell_test import create_chsh_circuits

        circuits = create_chsh_circuits()
        for qc in circuits:
            ops = [inst.operation.name for inst in qc.data]
            assert "measure" in ops, f"Circuit missing measure gate: {ops}"


class TestCorrelatorFromCounts:
    """Tests for E(a,b) correlator computation from shot counts."""

    def test_perfect_correlation(self):
        """All outcomes agree (00 or 11) -> E = +1."""
        from zipminator.entropy.bell_test import correlator_from_counts

        counts = {"00": 500, "11": 500, "01": 0, "10": 0}
        e = correlator_from_counts(counts)
        assert abs(e - 1.0) < 0.01

    def test_perfect_anticorrelation(self):
        """All outcomes disagree (01 or 10) -> E = -1."""
        from zipminator.entropy.bell_test import correlator_from_counts

        counts = {"00": 0, "11": 0, "01": 500, "10": 500}
        e = correlator_from_counts(counts)
        assert abs(e - (-1.0)) < 0.01

    def test_no_correlation(self):
        """Equal agree/disagree -> E = 0."""
        from zipminator.entropy.bell_test import correlator_from_counts

        counts = {"00": 250, "11": 250, "01": 250, "10": 250}
        e = correlator_from_counts(counts)
        assert abs(e) < 0.01

    def test_empty_counts(self):
        """Empty counts should return 0.0, not raise."""
        from zipminator.entropy.bell_test import correlator_from_counts

        e = correlator_from_counts({})
        assert e == 0.0

    def test_missing_keys_treated_as_zero(self):
        """Counts dict with missing keys should treat them as 0."""
        from zipminator.entropy.bell_test import correlator_from_counts

        counts = {"00": 1000}
        e = correlator_from_counts(counts)
        assert abs(e - 1.0) < 0.01


class TestComputeSValue:
    """Tests for CHSH S-value computation."""

    def test_quantum_violates_bell(self):
        """Ideal quantum correlators should give S = 2*sqrt(2) ~ 2.828."""
        from zipminator.entropy.bell_test import compute_s_value

        # For a maximally entangled Bell state with optimal settings:
        # E(0,0) = cos(pi/4) = 1/sqrt(2)
        # E(0,1) = cos(3pi/4) = -1/sqrt(2)
        # E(1,0) = cos(pi/4) = 1/sqrt(2)
        # E(1,1) = cos(pi/4) = 1/sqrt(2)
        r = 1.0 / math.sqrt(2)
        correlators = [r, -r, r, r]
        s = compute_s_value(correlators)
        assert s > 2.0, f"Quantum S should violate Bell: got {s}"
        assert abs(s - 2 * math.sqrt(2)) < 0.01

    def test_classical_respects_bell(self):
        """Classical correlators (deterministic) cannot violate S <= 2."""
        from zipminator.entropy.bell_test import compute_s_value

        # Classical hidden variable: all correlators +1 or -1
        correlators = [1.0, 1.0, 1.0, -1.0]
        s = compute_s_value(correlators)
        assert s <= 2.0, f"Classical S should not violate Bell: got {s}"

    def test_wrong_number_of_correlators(self):
        """Should raise ValueError if not exactly 4 correlators."""
        from zipminator.entropy.bell_test import compute_s_value

        with pytest.raises(ValueError, match="4 correlators"):
            compute_s_value([1.0, 0.5])

    def test_zero_correlators(self):
        """All zero correlators give S = 0."""
        from zipminator.entropy.bell_test import compute_s_value

        s = compute_s_value([0.0, 0.0, 0.0, 0.0])
        assert s == 0.0


class TestBellResult:
    """Tests for BellResult dataclass."""

    def test_quantum_result(self):
        """BellResult with S > 2 should report is_quantum=True."""
        from zipminator.entropy.bell_test import BellResult

        result = BellResult(s_value=2.5, is_quantum=True, shots=4000)
        assert result.is_quantum
        assert result.s_value == 2.5
        assert result.shots == 4000

    def test_classical_result(self):
        """BellResult with S <= 2 should report is_quantum=False."""
        from zipminator.entropy.bell_test import BellResult

        result = BellResult(s_value=1.8, is_quantum=False, shots=4000)
        assert not result.is_quantum

    def test_violation_sigma_positive_for_quantum(self):
        """Violation sigma should be positive when S > 2."""
        from zipminator.entropy.bell_test import BellResult

        result = BellResult(s_value=2.5, is_quantum=True, shots=4000)
        assert result.violation_sigma > 0.0

    def test_violation_sigma_negative_for_classical(self):
        """Violation sigma should be <= 0 when S <= 2."""
        from zipminator.entropy.bell_test import BellResult

        result = BellResult(s_value=1.8, is_quantum=False, shots=4000)
        assert result.violation_sigma <= 0.0

    def test_violation_sigma_zero_shots(self):
        """Zero shots should return sigma = 0 (avoid division by zero)."""
        from zipminator.entropy.bell_test import BellResult

        result = BellResult(s_value=2.5, is_quantum=True, shots=0)
        assert result.violation_sigma == 0.0


class TestRunBellTest:
    """Tests for the run_bell_test orchestrator function."""

    def test_run_bell_test_with_quantum_mock(self):
        """Simulated quantum results should produce S > 2."""
        from zipminator.entropy.bell_test import run_bell_test

        # Mock counts that simulate quantum correlations
        # These approximate the ideal quantum result
        mock_counts_list = [
            # E(0,0) ~ +0.707: mostly agree
            {"00": 427, "11": 427, "01": 73, "10": 73},
            # E(0,1) ~ -0.707: mostly disagree
            {"00": 73, "11": 73, "01": 427, "10": 427},
            # E(1,0) ~ +0.707: mostly agree
            {"00": 427, "11": 427, "01": 73, "10": 73},
            # E(1,1) ~ +0.707: mostly agree
            {"00": 427, "11": 427, "01": 73, "10": 73},
        ]
        result = run_bell_test(mock_counts_list=mock_counts_list)
        assert result.is_quantum
        assert result.s_value > 2.0

    def test_run_bell_test_with_classical_mock(self):
        """Simulated classical results should produce S <= 2."""
        from zipminator.entropy.bell_test import run_bell_test

        # Mock counts that simulate classical (no entanglement)
        # Uniform random: E ~ 0 for all settings
        mock_counts_list = [
            {"00": 250, "11": 250, "01": 250, "10": 250},
            {"00": 250, "11": 250, "01": 250, "10": 250},
            {"00": 250, "11": 250, "01": 250, "10": 250},
            {"00": 250, "11": 250, "01": 250, "10": 250},
        ]
        result = run_bell_test(mock_counts_list=mock_counts_list)
        assert not result.is_quantum
        assert result.s_value <= 2.0
