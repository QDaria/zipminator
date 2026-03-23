"""CHSH Bell inequality test for device-independent entropy certification.

Periodically runs a 2-qubit entangled circuit and verifies Bell violation
(S > 2), certifying that the entropy source is genuinely quantum.

This module does NOT produce entropy. It CERTIFIES the quantum source.

Theory:
    The CHSH inequality bounds correlations achievable by classical
    (local hidden variable) theories: S <= 2. Quantum mechanics allows
    S up to 2*sqrt(2) ~ 2.828 (Tsirelson bound). If measured S > 2,
    the source is certified as non-classical (device-independent).

Usage:
    # With mock data (testing):
    result = run_bell_test(mock_counts_list=[...])

    # With real quantum backend (requires qiskit-ibm-runtime):
    result = run_bell_test(backend=ibm_backend, shots=4000)
"""

import logging
import math
from dataclasses import dataclass
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class BellResult:
    """Result of a CHSH Bell test."""

    s_value: float
    is_quantum: bool
    shots: int

    @property
    def violation_sigma(self) -> float:
        """Standard deviations above the classical bound S=2.

        Uses propagated statistical uncertainty from finite shot counts.
        Each correlator has uncertainty ~ 1/sqrt(N/4) where N is total shots
        across 4 circuits. The S value combines 4 correlators, so the
        propagated uncertainty is ~ 2/sqrt(N/4) = 4/sqrt(N).
        """
        if self.shots <= 0:
            return 0.0
        # Each circuit gets shots/4 measurements
        sigma_per_correlator = 1.0 / math.sqrt(self.shots / 4)
        # S combines 4 correlators with coefficients +/-1, so sigma_S = 2 * sigma_per
        sigma_s = 2.0 * sigma_per_correlator
        if sigma_s <= 0:
            return 0.0
        return (self.s_value - 2.0) / sigma_s


def create_chsh_circuits() -> list:
    """Create 4 CHSH measurement circuits for settings (a,b) in {0,1}^2.

    Each circuit prepares a Bell state |Phi+> = (|00> + |11>)/sqrt(2),
    then applies measurement basis rotations:
        Alice: a=0 -> Z basis, a=1 -> X basis (H before measure)
        Bob:   b=0 -> (Z+X)/sqrt(2), b=1 -> (Z-X)/sqrt(2)

    These settings maximize the CHSH violation for the |Phi+> state.

    Returns:
        List of 4 QuantumCircuits, ordered as (0,0), (0,1), (1,0), (1,1).
    """
    from qiskit.circuit import QuantumCircuit

    circuits = []
    for a in [0, 1]:
        for b in [0, 1]:
            qc = QuantumCircuit(2, 2)
            # Prepare Bell state |Phi+> = (|00> + |11>) / sqrt(2)
            qc.h(0)
            qc.cx(0, 1)
            # Alice's measurement basis rotation
            if a == 1:
                qc.h(0)
            # Bob's measurement basis rotation
            if b == 0:
                qc.ry(-math.pi / 4, 1)
            else:
                qc.ry(math.pi / 4, 1)
            qc.measure([0, 1], [0, 1])
            circuits.append(qc)
    return circuits


def correlator_from_counts(counts: Dict[str, int]) -> float:
    """Compute E(a,b) correlator from measurement outcome counts.

    E = (N_agree - N_disagree) / N_total
    where agree = {00, 11} and disagree = {01, 10}.

    Args:
        counts: Measurement outcome counts, e.g. {"00": 480, "11": 470, "01": 25, "10": 25}.

    Returns:
        Correlator value in [-1, +1]. Returns 0.0 if no counts.
    """
    agree = counts.get("00", 0) + counts.get("11", 0)
    disagree = counts.get("01", 0) + counts.get("10", 0)
    total = agree + disagree
    if total == 0:
        return 0.0
    return (agree - disagree) / total


def compute_s_value(correlators: List[float]) -> float:
    """Compute CHSH S value from 4 correlators E(a,b).

    S = |E(0,0) - E(0,1) + E(1,0) + E(1,1)|

    Classical bound: |S| <= 2  (Bell inequality)
    Quantum maximum: 2*sqrt(2) ~ 2.828  (Tsirelson bound)

    Args:
        correlators: List of 4 correlator values [E(0,0), E(0,1), E(1,0), E(1,1)].

    Returns:
        Absolute CHSH S value.

    Raises:
        ValueError: If not exactly 4 correlators provided.
    """
    if len(correlators) != 4:
        raise ValueError(f"Need exactly 4 correlators, got {len(correlators)}")
    return abs(correlators[0] - correlators[1] + correlators[2] + correlators[3])


def run_bell_test(
    *,
    backend: Optional[object] = None,
    shots: int = 4000,
    mock_counts_list: Optional[List[Dict[str, int]]] = None,
) -> BellResult:
    """Run a full CHSH Bell test and return certification result.

    Either provide a real quantum backend or mock_counts_list for testing.
    When mock_counts_list is provided, backend and shots are ignored.

    Args:
        backend: A qiskit backend object (e.g., from IBM Runtime).
            If None and no mock_counts_list, raises ValueError.
        shots: Number of shots per circuit (default 4000, so 1000 per setting).
        mock_counts_list: List of 4 count dicts for testing without hardware.

    Returns:
        BellResult with s_value, is_quantum flag, and total shot count.

    Raises:
        ValueError: If neither backend nor mock_counts_list is provided.
    """
    if mock_counts_list is not None:
        if len(mock_counts_list) != 4:
            raise ValueError(
                f"mock_counts_list must have exactly 4 entries, got {len(mock_counts_list)}"
            )
        counts_list = mock_counts_list
        total_shots = sum(
            sum(c.values()) for c in counts_list
        )
    elif backend is not None:
        counts_list = _run_on_backend(backend, shots)
        total_shots = shots
    else:
        raise ValueError(
            "Provide either a quantum backend or mock_counts_list for testing."
        )

    # Compute correlators for each measurement setting
    correlators = [correlator_from_counts(c) for c in counts_list]
    s = compute_s_value(correlators)
    is_quantum = s > 2.0

    logger.info(
        "Bell test: S=%.4f (%s), correlators=%s",
        s,
        "QUANTUM" if is_quantum else "CLASSICAL",
        [f"{e:.3f}" for e in correlators],
    )

    return BellResult(s_value=s, is_quantum=is_quantum, shots=total_shots)


def _run_on_backend(backend: object, shots: int) -> List[Dict[str, int]]:
    """Execute CHSH circuits on a real quantum backend.

    Args:
        backend: A qiskit-compatible backend.
        shots: Total shots (split evenly across 4 circuits).

    Returns:
        List of 4 count dicts from circuit execution.
    """
    from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager

    circuits = create_chsh_circuits()
    shots_per_circuit = shots // 4

    # Transpile for target hardware
    pm = generate_preset_pass_manager(optimization_level=1, backend=backend)
    isa_circuits = pm.run(circuits)

    # Execute using SamplerV2 if available, fall back to basic run
    try:
        from qiskit_ibm_runtime import SamplerV2

        sampler = SamplerV2(mode=backend)
        job = sampler.run(isa_circuits, shots=shots_per_circuit)
        result = job.result()
        counts_list = []
        for i in range(4):
            bitstrings = result[i].data.meas.get_bitstrings()
            counts: Dict[str, int] = {}
            for bs in bitstrings:
                counts[bs] = counts.get(bs, 0) + 1
            counts_list.append(counts)
    except ImportError:
        # Fallback: use basic Estimator or Sampler
        logger.warning(
            "qiskit-ibm-runtime not available; attempting basic backend.run()"
        )
        from qiskit import execute  # type: ignore[attr-defined]

        job = execute(isa_circuits, backend, shots=shots_per_circuit)
        result = job.result()
        counts_list = [result.get_counts(i) for i in range(4)]

    return counts_list
