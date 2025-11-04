#!/usr/bin/env python3
"""
Secure IBM Quantum Random Number Generator
Uses environment variables for token storage instead of hardcoded credentials.
"""

import os
import sys
from typing import Optional

try:
    from qiskit import QuantumCircuit, transpile
    from qiskit.visualization import plot_histogram
    from qiskit_aer import AerSimulator
    from qiskit_ibm_runtime import QiskitRuntimeService, Sampler, Session
    import matplotlib.pyplot as plt
except ImportError as e:
    print(f"ERROR: Missing required package: {e}")
    print("Install with: pip install qiskit qiskit-aer qiskit-ibm-runtime matplotlib")
    sys.exit(1)

try:
    from dotenv import load_dotenv
    DOTENV_AVAILABLE = True
except ImportError:
    DOTENV_AVAILABLE = False
    print("WARNING: python-dotenv not installed. Environment variables must be set manually.")
    print("Install with: pip install python-dotenv")


class SecureQuantumRNG:
    """Secure Quantum Random Number Generator with environment-based authentication."""

    def __init__(
        self,
        num_bits: int = 8,
        token: Optional[str] = None,
        channel: str = "ibm_quantum",
        instance: str = "ibm-q/open/main"
    ):
        """
        Initialize secure QRNG.

        Args:
            num_bits: Number of random bits to generate (default: 8)
            token: IBM Quantum token (optional, reads from env if not provided)
            channel: IBM Quantum channel (default: ibm_quantum)
            instance: IBM Quantum instance (default: ibm-q/open/main)
        """
        self.num_bits = num_bits
        self.channel = channel
        self.instance = instance

        # Load environment variables if available
        if DOTENV_AVAILABLE:
            load_dotenv()

        # Get token from parameter or environment
        self.token = token or os.getenv("IBM_QUANTUM_TOKEN")

        if not self.token:
            raise ValueError(
                "IBM Quantum token not found!\n"
                "Options:\n"
                "  1. Set IBM_QUANTUM_TOKEN environment variable\n"
                "  2. Create .env file from .env.template\n"
                "  3. Pass token parameter to constructor\n"
                "\n"
                "Get token from: https://quantum.ibm.com/account"
            )

        # Override from environment if available
        self.channel = os.getenv("IBM_QUANTUM_CHANNEL", self.channel)
        self.instance = os.getenv("IBM_QUANTUM_INSTANCE", self.instance)

    def create_circuit(self) -> QuantumCircuit:
        """Create quantum circuit for random number generation."""
        circuit = QuantumCircuit(self.num_bits, self.num_bits, name="qrng")
        circuit.h(range(self.num_bits))
        circuit.measure(range(self.num_bits), range(self.num_bits))
        return circuit

    def run_simulation(self, circuit: QuantumCircuit) -> str:
        """
        Run circuit on local simulator.

        Args:
            circuit: Quantum circuit to execute

        Returns:
            Binary string of random bits
        """
        print("\n--- Running on Local Simulator ---")
        simulator = AerSimulator()
        job = simulator.run(circuit, shots=1)
        result = job.result()
        counts = result.get_counts(circuit)
        bit_string = list(counts.keys())[0]

        print(f"Simulator result: {bit_string} (decimal: {int(bit_string, 2)})")
        return bit_string

    def run_hardware(self, circuit: QuantumCircuit) -> tuple[str, str, str]:
        """
        Run circuit on real quantum hardware.

        Args:
            circuit: Quantum circuit to execute

        Returns:
            Tuple of (bit_string, backend_name, job_id)
        """
        print("\n--- Running on Real Quantum Hardware ---")

        # Authenticate (token is never printed or logged)
        service = QiskitRuntimeService(
            channel=self.channel,
            instance=self.instance,
            token=self.token
        )
        print(f"✓ Authenticated with IBM Quantum (instance: {self.instance})")

        # Select least busy backend
        backend = service.least_busy(
            min_num_qubits=self.num_bits,
            simulator=False,
            operational=True
        )
        print(f"✓ Selected backend: {backend.name}")

        # Execute on hardware
        print("Opening session...")
        with Session(backend=backend) as session:
            sampler = Sampler()

            print("Transpiling circuit...")
            transpiled_circuit = transpile(circuit, backend)

            print(f"Submitting job to {backend.name}...")
            job = sampler.run([transpiled_circuit], shots=1)

            job_id = job.job_id()
            print(f"Job ID: {job_id}")
            print("Waiting for results...")

            result = job.result()
            print("✓ Job completed")

            counts = result[0].data.c.get_counts()
            bit_string = list(counts.keys())[0]

            return bit_string, backend.name, job_id

    def generate(self, use_hardware: bool = True, visualize: bool = True) -> dict:
        """
        Generate quantum random number.

        Args:
            use_hardware: Use real quantum hardware (default: True)
            visualize: Display circuit and results (default: True)

        Returns:
            Dictionary with results including binary string, decimal value, backend
        """
        # Create circuit
        circuit = self.create_circuit()

        if visualize:
            print(f"\nQuantum Circuit for {self.num_bits} Random Bits:")
            print(circuit)

        results = {
            "num_bits": self.num_bits,
            "circuit": circuit,
        }

        # Run simulation
        sim_bits = self.run_simulation(circuit)
        results["simulation"] = {
            "binary": sim_bits,
            "decimal": int(sim_bits, 2)
        }

        # Run on hardware if requested
        if use_hardware:
            try:
                hw_bits, backend_name, job_id = self.run_hardware(circuit)
                results["hardware"] = {
                    "binary": hw_bits,
                    "decimal": int(hw_bits, 2),
                    "backend": backend_name,
                    "job_id": job_id
                }

                print("\n" + "=" * 50)
                print("QUANTUM RANDOM NUMBER (Hardware)")
                print("=" * 50)
                print(f"Binary:  {hw_bits}")
                print(f"Decimal: {int(hw_bits, 2)}")
                print(f"Backend: {backend_name}")
                print(f"Job ID:  {job_id}")
                print("=" * 50)

                if visualize:
                    plot_histogram(
                        {hw_bits: 1},
                        title=f"Quantum Hardware Result ({backend_name})"
                    )
                    plt.show()

            except Exception as e:
                print(f"\n✗ Hardware execution failed: {e}")
                print("✓ Simulation results are still available")
                results["hardware_error"] = str(e)

        return results


def main():
    """Main execution function."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Secure Quantum Random Number Generator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate 8-bit random number on hardware
  python ibm_qrng_secure.py

  # Generate 16-bit number
  python ibm_qrng_secure.py --bits 16

  # Simulation only (no hardware)
  python ibm_qrng_secure.py --no-hardware

  # Use custom token
  python ibm_qrng_secure.py --token "your_token_here"

Environment Variables:
  IBM_QUANTUM_TOKEN    - IBM Quantum API token (required)
  IBM_QUANTUM_CHANNEL  - Channel (default: ibm_quantum)
  IBM_QUANTUM_INSTANCE - Instance (default: ibm-q/open/main)
        """
    )

    parser.add_argument(
        "--bits",
        type=int,
        default=8,
        help="Number of random bits to generate (default: 8)"
    )

    parser.add_argument(
        "--no-hardware",
        action="store_true",
        help="Use simulation only (no real quantum hardware)"
    )

    parser.add_argument(
        "--no-viz",
        action="store_true",
        help="Disable visualization"
    )

    parser.add_argument(
        "--token",
        help="IBM Quantum token (or set IBM_QUANTUM_TOKEN env var)",
        default=None
    )

    parser.add_argument(
        "--channel",
        default="ibm_quantum",
        help="IBM Quantum channel (default: ibm_quantum)"
    )

    parser.add_argument(
        "--instance",
        default="ibm-q/open/main",
        help="IBM Quantum instance (default: ibm-q/open/main)"
    )

    args = parser.parse_args()

    try:
        # Initialize secure QRNG
        qrng = SecureQuantumRNG(
            num_bits=args.bits,
            token=args.token,
            channel=args.channel,
            instance=args.instance
        )

        # Generate random number
        results = qrng.generate(
            use_hardware=not args.no_hardware,
            visualize=not args.no_viz
        )

        # Exit with success
        sys.exit(0)

    except ValueError as e:
        print(f"\nERROR: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"\nUNEXPECTED ERROR: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(2)


if __name__ == "__main__":
    main()
