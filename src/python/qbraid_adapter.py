"""
qBraid Adapter for Multi-Provider Quantum Access
Unified interface to IBM, IonQ, Rigetti, OQC via qBraid
"""

import os
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)


class QBraidProvider(Enum):
    """qBraid-supported providers"""
    IBM_QUANTUM = "ibm_quantum"
    IONQ = "ionq"
    RIGETTI = "rigetti"
    OQC = "oqc"
    AWS_BRAKET = "aws_braket"


@dataclass
class QBraidDevice:
    """qBraid device information"""
    device_id: str
    provider: str
    name: str
    num_qubits: int
    status: str
    queue_depth: int
    price_per_shot: float = 0.0
    price_per_task: float = 0.0


class QBraidAdapter:
    """
    Adapter for accessing quantum hardware through qBraid
    Provides unified interface to multiple cloud providers
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize qBraid adapter

        Args:
            api_key: qBraid API key (uses QBRAID_API_KEY env var if None)
        """
        self.api_key = api_key or os.getenv('QBRAID_API_KEY')
        if not self.api_key:
            raise ValueError("qBraid API key required")

        self._initialize_qbraid()
        self.devices: List[QBraidDevice] = []
        self._discover_devices()

    def _initialize_qbraid(self):
        """Initialize qBraid SDK"""
        try:
            import qbraid
            qbraid.set_api_key(self.api_key)
            self.qbraid = qbraid
            logger.info("qBraid SDK initialized successfully")
        except ImportError:
            raise ImportError("qBraid SDK not installed. Run: pip install qbraid")
        except Exception as e:
            raise RuntimeError(f"Failed to initialize qBraid: {e}")

    def _discover_devices(self):
        """Discover all available qBraid devices"""
        try:
            devices = self.qbraid.get_devices()

            for device_data in devices:
                device = QBraidDevice(
                    device_id=device_data.get('id'),
                    provider=device_data.get('provider'),
                    name=device_data.get('name', device_data.get('id')),
                    num_qubits=device_data.get('num_qubits', 0),
                    status=device_data.get('status', 'UNKNOWN'),
                    queue_depth=device_data.get('queue_depth', 0),
                    price_per_shot=device_data.get('price_per_shot', 0.0),
                    price_per_task=device_data.get('price_per_task', 0.0)
                )
                self.devices.append(device)
                logger.info(f"Found device: {device.name} ({device.provider}) - {device.num_qubits} qubits")

            logger.info(f"Total devices discovered: {len(self.devices)}")

        except Exception as e:
            logger.error(f"Failed to discover devices: {e}")
            raise

    def get_device(self, device_id: str) -> Optional[QBraidDevice]:
        """Get device by ID"""
        for device in self.devices:
            if device.device_id == device_id:
                return device
        return None

    def get_devices_by_provider(self, provider: QBraidProvider) -> List[QBraidDevice]:
        """Get all devices from specific provider"""
        return [
            device for device in self.devices
            if device.provider == provider.value
        ]

    def get_best_device(
        self,
        min_qubits: int = 8,
        provider: Optional[QBraidProvider] = None
    ) -> Optional[QBraidDevice]:
        """
        Get best available device based on criteria

        Args:
            min_qubits: Minimum required qubits
            provider: Preferred provider filter

        Returns:
            Best device or None
        """
        candidates = [
            d for d in self.devices
            if d.status == 'ONLINE' and d.num_qubits >= min_qubits
        ]

        if provider:
            candidates = [
                d for d in candidates
                if d.provider == provider.value
            ]

        if not candidates:
            return None

        # Sort by: qubits (desc), queue depth (asc), price (asc)
        candidates.sort(key=lambda d: (-d.num_qubits, d.queue_depth, d.price_per_shot))

        return candidates[0]

    def create_quantum_circuit(self, num_qubits: int, format: str = "qiskit") -> str:
        """
        Create quantum circuit for entropy generation

        Args:
            num_qubits: Number of qubits
            format: Circuit format (qiskit, openqasm, braket)

        Returns:
            Circuit definition string
        """
        if format == "openqasm":
            return self._create_openqasm_circuit(num_qubits)
        elif format == "qiskit":
            return self._create_qiskit_circuit(num_qubits)
        elif format == "braket":
            return self._create_braket_circuit(num_qubits)
        else:
            raise ValueError(f"Unsupported format: {format}")

    def _create_openqasm_circuit(self, num_qubits: int) -> str:
        """Create OpenQASM 2.0 circuit"""
        qasm = f"""OPENQASM 2.0;
include "qelib1.inc";
qreg q[{num_qubits}];
creg c[{num_qubits}];
"""

        # Apply Hadamard gates
        for i in range(num_qubits):
            qasm += f"h q[{i}];\n"

        # Measure all qubits
        for i in range(num_qubits):
            qasm += f"measure q[{i}] -> c[{i}];\n"

        return qasm

    def _create_qiskit_circuit(self, num_qubits: int) -> Any:
        """Create Qiskit circuit"""
        from qiskit import QuantumCircuit

        qc = QuantumCircuit(num_qubits, num_qubits)

        # Apply Hadamard gates
        for i in range(num_qubits):
            qc.h(i)

        # Measure all qubits
        qc.measure(range(num_qubits), range(num_qubits))

        return qc

    def _create_braket_circuit(self, num_qubits: int) -> Any:
        """Create AWS Braket circuit"""
        try:
            from braket.circuits import Circuit

            circuit = Circuit()

            # Apply Hadamard gates
            for i in range(num_qubits):
                circuit.h(i)

            return circuit

        except ImportError:
            raise ImportError("AWS Braket SDK not installed")

    def submit_job(
        self,
        device_id: str,
        circuit: Any,
        shots: int
    ) -> Any:
        """
        Submit quantum job to qBraid device

        Args:
            device_id: Target device ID
            circuit: Quantum circuit
            shots: Number of measurement shots

        Returns:
            Job object
        """
        try:
            device = self.qbraid.device_wrapper(device_id)
            job = device.run(circuit, shots=shots)
            logger.info(f"Job submitted to {device_id}: {job.id}")
            return job

        except Exception as e:
            logger.error(f"Job submission failed: {e}")
            raise

    def get_job_result(self, job: Any) -> Dict[str, int]:
        """
        Get job result (blocking)

        Args:
            job: Job object

        Returns:
            Measurement counts dictionary
        """
        try:
            result = job.result()
            return result.measurement_counts()

        except Exception as e:
            logger.error(f"Failed to get job result: {e}")
            raise

    def harvest_entropy(
        self,
        num_bytes: int,
        device_id: Optional[str] = None,
        min_qubits: int = 8
    ) -> bytes:
        """
        Harvest quantum entropy via qBraid

        Args:
            num_bytes: Target number of bytes
            device_id: Specific device ID (None for auto-select)
            min_qubits: Minimum required qubits

        Returns:
            Quantum random bytes
        """
        # Select device
        if device_id:
            device = self.get_device(device_id)
            if not device:
                raise ValueError(f"Device not found: {device_id}")
        else:
            device = self.get_best_device(min_qubits)
            if not device:
                raise RuntimeError("No available devices")

        logger.info(f"Harvesting {num_bytes} bytes from {device.name}")

        # Calculate optimal strategy
        num_qubits = (min(device.num_qubits, 120) // 8) * 8  # Byte-aligned
        bytes_per_shot = num_qubits // 8
        num_shots = (num_bytes + bytes_per_shot - 1) // bytes_per_shot

        logger.info(f"Strategy: {num_qubits} qubits × {num_shots} shots")

        # Create circuit
        circuit = self.create_quantum_circuit(num_qubits, format="openqasm")

        # Submit job
        job = self.submit_job(device.device_id, circuit, num_shots)

        # Get results
        counts = self.get_job_result(job)

        # Convert to bytes
        entropy_data = []
        for bitstring, count in counts.items():
            for _ in range(count):
                byte_data = int(bitstring, 2).to_bytes(bytes_per_shot, byteorder='big')
                entropy_data.append(byte_data)

        result = b''.join(entropy_data)[:num_bytes]
        logger.info(f"Harvested {len(result)} bytes")

        return result

    def get_account_balance(self) -> Dict[str, Any]:
        """Get qBraid account balance and credits"""
        try:
            balance = self.qbraid.get_credits()
            return {
                'credits': balance.get('credits', 0),
                'currency': balance.get('currency', 'USD')
            }
        except Exception as e:
            logger.warning(f"Failed to get account balance: {e}")
            return {'credits': 0, 'currency': 'USD'}

    def estimate_cost(
        self,
        device_id: str,
        num_shots: int
    ) -> float:
        """
        Estimate job cost

        Args:
            device_id: Target device
            num_shots: Number of shots

        Returns:
            Estimated cost in credits/USD
        """
        device = self.get_device(device_id)
        if not device:
            return 0.0

        if device.price_per_shot > 0:
            return num_shots * device.price_per_shot
        elif device.price_per_task > 0:
            return device.price_per_task
        else:
            return 0.0


# Example usage
if __name__ == "__main__":
    # Initialize adapter
    try:
        adapter = QBraidAdapter()

        # Show available devices
        print("\nAvailable qBraid Devices:")
        print("=" * 80)
        for device in adapter.devices:
            status = "✓" if device.status == "ONLINE" else "✗"
            print(f"{status} {device.name:30} | {device.provider:15} | "
                  f"{device.num_qubits:3} qubits | Queue: {device.queue_depth:3}")

        # Show account balance
        balance = adapter.get_account_balance()
        print(f"\nAccount Balance: {balance['credits']} {balance['currency']}")

        # Get best device
        best = adapter.get_best_device(min_qubits=8)
        if best:
            print(f"\nBest device: {best.name} ({best.num_qubits} qubits)")

            # Estimate cost for 1000 bytes
            num_qubits = min(best.num_qubits, 120)
            bytes_per_shot = num_qubits // 8
            num_shots = 1000 // bytes_per_shot
            cost = adapter.estimate_cost(best.device_id, num_shots)
            print(f"Cost for 1000 bytes: ${cost:.2f}")

    except Exception as e:
        print(f"Error: {e}")
        print("Make sure QBRAID_API_KEY is set in environment")
