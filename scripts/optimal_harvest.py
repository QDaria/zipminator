#!/usr/bin/env python3
"""
Optimal Quantum Entropy Harvester for IBM Brisbane

This script performs optimized quantum entropy harvesting using IBM Brisbane's
127-qubit quantum computer. It maximizes efficiency by using 120 qubits per shot,
generating 15 bytes per measurement.

Usage:
    python optimal_harvest.py --bytes 1000 --output entropy.bin
    python optimal_harvest.py --shots 67 --output entropy.bin --backend ibm_brisbane

Requirements:
    - qiskit-ibm-runtime
    - python-dotenv
    - IBM_QUANTUM_TOKEN in .env file
"""

import os
import sys
import argparse
import math
import json
from pathlib import Path
from typing import Dict, Optional
from datetime import datetime
from dotenv import load_dotenv

try:
    from qiskit import QuantumCircuit, transpile
    from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2 as Sampler, Session
except ImportError:
    print("ERROR: qiskit packages not installed")
    print("Install with: pip install qiskit qiskit-ibm-runtime")
    sys.exit(1)


class OptimalQuantumHarvester:
    """Optimized quantum entropy harvester for IBM Brisbane."""

    # Brisbane-optimized parameters
    DEFAULT_BACKEND = "ibm_brisbane"
    OPTIMAL_QUBITS = 120  # 127 total - 7 reserved for overhead
    BYTES_PER_SHOT = OPTIMAL_QUBITS // 8  # 15 bytes

    def __init__(self, backend_name: Optional[str] = None):
        """
        Initialize the harvester.

        Args:
            backend_name: Name of the IBM backend to use
        """
        # Load environment
        env_path = Path(__file__).parent.parent / '.env'
        load_dotenv(env_path)

        self.token = os.getenv("IBM_QUANTUM_TOKEN")
        if not self.token or self.token == "your_new_token":
            raise ValueError("IBM_QUANTUM_TOKEN not set in .env file")

        # Initialize service
        self.service = QiskitRuntimeService(
            channel="ibm_quantum_platform",
            token=self.token
        )

        # Select backend
        self.backend_name = backend_name or self.DEFAULT_BACKEND
        self.backend = self.service.backend(self.backend_name)

        # Verify backend capabilities
        config = self.backend.configuration()
        if config.n_qubits < self.OPTIMAL_QUBITS:
            raise ValueError(
                f"Backend {self.backend_name} has only {config.n_qubits} qubits, "
                f"need at least {self.OPTIMAL_QUBITS}"
            )

    def create_entropy_circuit(self, num_qubits: int) -> QuantumCircuit:
        """
        Create a quantum circuit optimized for entropy generation.

        Args:
            num_qubits: Number of qubits to use

        Returns:
            QuantumCircuit configured for maximum entropy
        """
        circuit = QuantumCircuit(num_qubits, num_qubits)

        # Apply Hadamard gates to create superposition
        circuit.h(range(num_qubits))

        # Measure all qubits
        circuit.measure(range(num_qubits), range(num_qubits))

        return circuit

    def calculate_job_parameters(self, target_bytes: int) -> Dict[str, int]:
        """
        Calculate optimal job parameters for target byte count.

        Args:
            target_bytes: Desired number of random bytes

        Returns:
            Dict with qubits, shots, and expected bytes
        """
        num_shots = math.ceil(target_bytes / self.BYTES_PER_SHOT)
        actual_bytes = num_shots * self.BYTES_PER_SHOT

        return {
            'qubits': self.OPTIMAL_QUBITS,
            'shots': num_shots,
            'bytes_per_shot': self.BYTES_PER_SHOT,
            'expected_bytes': actual_bytes,
            'target_bytes': target_bytes
        }

    def estimate_credits(self, num_shots: int) -> Dict[str, float]:
        """
        Estimate IBM Quantum credits for job.

        Args:
            num_shots: Number of circuit executions

        Returns:
            Dict with credit estimation details
        """
        # IBM credits based on queue time, not qubit count
        # Average: 0.5-1.0 credits per minute
        # Conservative estimate: 5 minutes queue time

        estimated_queue_minutes = 5
        credits_per_minute = 0.7
        estimated_credits = estimated_queue_minutes * credits_per_minute

        return {
            'estimated_queue_minutes': estimated_queue_minutes,
            'credits_per_minute': credits_per_minute,
            'estimated_credits': estimated_credits,
            'shots': num_shots
        }

    def harvest(self, num_shots: int, output_file: Optional[str] = None) -> bytes:
        """
        Perform quantum entropy harvest.

        Args:
            num_shots: Number of circuit executions
            output_file: Optional file path to save raw entropy

        Returns:
            Raw entropy bytes
        """
        print(f"Starting quantum entropy harvest on {self.backend_name}")
        print(f"Qubits: {self.OPTIMAL_QUBITS}, Shots: {num_shots}")

        # Create circuit
        circuit = self.create_entropy_circuit(self.OPTIMAL_QUBITS)

        # Transpile circuit for target hardware (required as of March 2024)
        print("Transpiling circuit for hardware...")
        transpiled_circuit = transpile(circuit, backend=self.backend, optimization_level=1)

        print("Submitting job to IBM Quantum...")

        # Create sampler (SamplerV2 accepts backend name string)
        sampler = Sampler(mode=self.backend)

        # Submit job with transpiled circuit
        job = sampler.run([transpiled_circuit], shots=num_shots)

        print(f"Job ID: {job.job_id()}")
        print("Waiting for results...")

        # Wait for results
        result = job.result()

        print("Job completed successfully!")

        # Extract measurement data
        pub_result = result[0]
        counts = pub_result.data.meas.get_counts()

        # Convert counts to raw bytes
        entropy_bytes = bytearray()

        for bitstring, count in counts.items():
            # Convert bitstring to bytes
            bit_value = int(bitstring, 2)
            byte_data = bit_value.to_bytes(self.BYTES_PER_SHOT, byteorder='big')

            # Repeat based on count
            for _ in range(count):
                entropy_bytes.extend(byte_data)

        entropy_bytes = bytes(entropy_bytes)

        # Save to file if requested
        if output_file:
            output_path = Path(output_file)
            output_path.write_bytes(entropy_bytes)
            print(f"Entropy saved to: {output_path}")

        # Generate harvest report
        self._generate_report(job, len(entropy_bytes), num_shots)

        return entropy_bytes

    def _generate_report(self, job, bytes_generated: int, num_shots: int):
        """Generate harvest report."""
        report = {
            'timestamp': datetime.utcnow().isoformat(),
            'job_id': job.job_id(),
            'backend': self.backend_name,
            'qubits_used': self.OPTIMAL_QUBITS,
            'shots': num_shots,
            'bytes_generated': bytes_generated,
            'bytes_per_shot': self.BYTES_PER_SHOT,
            'credit_estimate': self.estimate_credits(num_shots)
        }

        # Save report
        report_path = Path(__file__).parent.parent / 'docs' / 'harvest_report.json'
        report_path.parent.mkdir(parents=True, exist_ok=True)

        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)

        print("\nHarvest Report:")
        print("-" * 60)
        print(f"Job ID: {report['job_id']}")
        print(f"Backend: {report['backend']}")
        print(f"Qubits: {report['qubits_used']}")
        print(f"Shots: {report['shots']}")
        print(f"Bytes Generated: {report['bytes_generated']}")
        print(f"Estimated Credits: {report['credit_estimate']['estimated_credits']:.2f}")
        print(f"Report saved to: {report_path}")
        print("-" * 60)


def compare_strategies():
    """Compare different harvesting strategies."""
    print("=" * 70)
    print("QUANTUM ENTROPY HARVESTING STRATEGY COMPARISON")
    print("=" * 70)

    strategies = [
        ('8 qubits × 1000 shots', 8, 1000),
        ('64 qubits × 125 shots', 64, 125),
        ('120 qubits × 67 shots', 120, 67),
    ]

    print("\nTarget: 1000 bytes of quantum entropy\n")

    for name, qubits, shots in strategies:
        bytes_per_shot = qubits // 8
        bytes_gen = bytes_per_shot * shots

        print(f"{name}")
        print(f"  Bytes per Shot: {bytes_per_shot}")
        print(f"  Total Bytes: {bytes_gen}")
        print(f"  Job Submissions: {shots}")
        print(f"  Efficiency: {bytes_gen / shots:.2f} bytes/shot")

        if qubits == 120:
            print(f"  ★ OPTIMAL STRATEGY ★")

        print()

    print("=" * 70)


def main():
    """Main execution function."""
    parser = argparse.ArgumentParser(
        description="Optimal quantum entropy harvester for IBM Brisbane"
    )

    parser.add_argument(
        '--bytes',
        type=int,
        default=1000,
        help='Target number of random bytes (default: 1000)'
    )

    parser.add_argument(
        '--shots',
        type=int,
        help='Number of shots (overrides --bytes)'
    )

    parser.add_argument(
        '--backend',
        type=str,
        default='ibm_brisbane',
        help='IBM backend name (default: ibm_brisbane)'
    )

    parser.add_argument(
        '--output',
        type=str,
        default='entropy.bin',
        help='Output file path (default: entropy.bin)'
    )

    parser.add_argument(
        '--compare',
        action='store_true',
        help='Compare harvesting strategies'
    )

    args = parser.parse_args()

    if args.compare:
        compare_strategies()
        return

    try:
        # Initialize harvester
        harvester = OptimalQuantumHarvester(backend_name=args.backend)

        # Calculate parameters
        if args.shots:
            num_shots = args.shots
            print(f"Using {num_shots} shots (manual override)")
        else:
            params = harvester.calculate_job_parameters(args.bytes)
            num_shots = params['shots']
            print(f"Calculated parameters:")
            print(f"  Target Bytes: {params['target_bytes']}")
            print(f"  Shots Required: {params['shots']}")
            print(f"  Expected Bytes: {params['expected_bytes']}")

        # Estimate credits
        credit_est = harvester.estimate_credits(num_shots)
        print(f"\nCredit Estimate:")
        print(f"  Estimated Credits: {credit_est['estimated_credits']:.2f}")
        print(f"  Queue Time: ~{credit_est['estimated_queue_minutes']} minutes")

        # Confirm execution
        response = input("\nProceed with harvest? (yes/no): ")
        if response.lower() not in ['yes', 'y']:
            print("Harvest cancelled")
            return

        # Perform harvest
        entropy = harvester.harvest(num_shots, args.output)

        print(f"\n✓ Successfully harvested {len(entropy)} bytes of quantum entropy")

    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
