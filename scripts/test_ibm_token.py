#!/usr/bin/env python3
"""
IBM Quantum Token Validation Script

This script validates the IBM Quantum token and lists available backends.
It checks token validity, available quantum systems, and backend capabilities.

Usage:
    python test_ibm_token.py

Requirements:
    - qiskit-ibm-runtime
    - python-dotenv
    - IBM_QUANTUM_TOKEN in .env file
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Optional
from dotenv import load_dotenv

try:
    from qiskit_ibm_runtime import QiskitRuntimeService
except ImportError:
    print("ERROR: qiskit-ibm-runtime not installed")
    print("Install with: pip install qiskit-ibm-runtime")
    sys.exit(1)


class IBMTokenValidator:
    """Validates IBM Quantum token and retrieves backend information."""

    def __init__(self):
        """Initialize the validator and load environment variables."""
        # Load .env from project root
        env_path = Path(__file__).parent.parent / '.env'
        load_dotenv(env_path)

        self.token = os.getenv("IBM_QUANTUM_TOKEN")
        self.service: Optional[QiskitRuntimeService] = None

    def validate_token(self) -> Dict[str, any]:
        """
        Validate the IBM Quantum token.

        Returns:
            Dict containing validation status and details
        """
        result = {
            'status': 'FAIL',
            'token_present': False,
            'token_valid': False,
            'service_connected': False,
            'error': None
        }

        # Check if token exists
        if not self.token or self.token == "your_new_token":
            result['error'] = "Token not found or not updated in .env file"
            return result

        result['token_present'] = True

        # Attempt to connect to IBM Quantum
        try:
            self.service = QiskitRuntimeService(
                channel="ibm_quantum_platform",
                token=self.token
            )
            result['token_valid'] = True
            result['service_connected'] = True
            result['status'] = 'PASS'

        except Exception as e:
            result['error'] = f"Failed to connect: {str(e)}"
            return result

        return result

    def get_backends(self) -> List[Dict[str, any]]:
        """
        Retrieve available quantum backends.

        Returns:
            List of backend information dictionaries
        """
        if not self.service:
            return []

        backends_info = []

        try:
            backends = self.service.backends()

            for backend in backends:
                config = backend.configuration()
                status = backend.status()

                backend_info = {
                    'name': backend.name,
                    'num_qubits': config.n_qubits,
                    'operational': status.operational,
                    'pending_jobs': status.pending_jobs,
                    'status_msg': status.status_msg,
                    'simulator': config.simulator,
                    'local': config.local,
                }

                backends_info.append(backend_info)

        except Exception as e:
            print(f"Warning: Error retrieving backends: {e}")

        return backends_info

    def get_optimal_backend(self, min_qubits: int = 100) -> Optional[Dict[str, any]]:
        """
        Find the optimal backend for quantum entropy generation.

        Args:
            min_qubits: Minimum number of qubits required

        Returns:
            Dict containing optimal backend information or None
        """
        backends = self.get_backends()

        # Filter for real quantum devices with enough qubits
        candidates = [
            b for b in backends
            if not b['simulator']
            and b['operational']
            and b['num_qubits'] >= min_qubits
        ]

        if not candidates:
            return None

        # Sort by number of qubits (descending) and pending jobs (ascending)
        candidates.sort(key=lambda x: (-x['num_qubits'], x['pending_jobs']))

        return candidates[0]

    def print_report(self):
        """Print a comprehensive validation report."""
        print("=" * 70)
        print("IBM QUANTUM TOKEN VALIDATION REPORT")
        print("=" * 70)

        # Validate token
        validation = self.validate_token()

        print("\n[1] TOKEN VALIDATION")
        print("-" * 70)
        print(f"Status: {validation['status']}")
        print(f"Token Present: {validation['token_present']}")
        print(f"Token Valid: {validation['token_valid']}")
        print(f"Service Connected: {validation['service_connected']}")

        if validation['error']:
            print(f"Error: {validation['error']}")
            return

        # Get backends
        print("\n[2] AVAILABLE BACKENDS")
        print("-" * 70)

        backends = self.get_backends()

        if not backends:
            print("No backends available")
            return

        # Separate real devices and simulators
        real_devices = [b for b in backends if not b['simulator']]
        simulators = [b for b in backends if b['simulator']]

        print(f"\nReal Quantum Devices: {len(real_devices)}")
        for backend in real_devices:
            status_icon = "✓" if backend['operational'] else "✗"
            print(f"  {status_icon} {backend['name']:20s} "
                  f"| Qubits: {backend['num_qubits']:3d} "
                  f"| Pending Jobs: {backend['pending_jobs']:3d} "
                  f"| Status: {backend['status_msg']}")

        print(f"\nSimulators: {len(simulators)}")
        for backend in simulators:
            print(f"  • {backend['name']:20s} | Qubits: {backend['num_qubits']:3d}")

        # Optimal backend recommendation
        print("\n[3] OPTIMAL BACKEND RECOMMENDATION")
        print("-" * 70)

        optimal = self.get_optimal_backend(min_qubits=100)

        if optimal:
            print(f"Recommended Backend: {optimal['name']}")
            print(f"  Number of Qubits: {optimal['num_qubits']}")
            print(f"  Operational: {optimal['operational']}")
            print(f"  Pending Jobs: {optimal['pending_jobs']}")
            print(f"  Status: {optimal['status_msg']}")

            # Calculate optimal harvest parameters
            usable_qubits = optimal['num_qubits'] - 7  # Reserve 7 qubits for overhead
            usable_qubits = (usable_qubits // 8) * 8  # Round down to multiple of 8
            bytes_per_shot = usable_qubits // 8

            print(f"\n  Harvest Strategy:")
            print(f"    Usable Qubits: {usable_qubits}")
            print(f"    Bytes per Shot: {bytes_per_shot}")
            print(f"    Shots for 1000 bytes: {1000 // bytes_per_shot + 1}")
            print(f"    Total Bytes Generated: {bytes_per_shot * (1000 // bytes_per_shot + 1)}")
        else:
            print("No suitable backend found (requires 100+ qubits)")

        print("\n" + "=" * 70)
        print("VALIDATION COMPLETE")
        print("=" * 70)


def main():
    """Main execution function."""
    validator = IBMTokenValidator()
    validator.print_report()


if __name__ == "__main__":
    main()
