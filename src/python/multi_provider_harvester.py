"""
Multi-Provider Quantum Random Number Generator Harvester
Supports IBM, IonQ, Rigetti, AWS Braket, OQC via qBraid and direct APIs
"""

import os
import math
import time
import logging
from enum import Enum
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
import hashlib
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class QuantumProvider(Enum):
    """Supported quantum hardware providers"""
    IBM_DIRECT = "ibm"           # Direct IBM Quantum API
    QBRAID_IBM = "qbraid_ibm"    # IBM via qBraid
    IONQ = "ionq"                # IonQ Harmony (11 qubits)
    RIGETTI = "rigetti"          # Rigetti Aspen
    AWS_BRAKET = "aws_braket"    # AWS Braket
    OQC = "oqc"                  # Oxford Quantum Circuits
    SIMULATOR = "simulator"       # Fallback simulator


@dataclass
class BackendInfo:
    """Information about a quantum backend"""
    provider: QuantumProvider
    name: str
    num_qubits: int
    available: bool
    queue_depth: int = 0
    credits_per_shot: float = 0.0
    error_rate: float = 0.0


@dataclass
class HarvestStrategy:
    """Optimal harvesting strategy"""
    num_qubits: int
    num_shots: int
    bytes_per_shot: int
    total_bytes: int
    num_jobs: int
    estimated_credits: float


class MultiProviderHarvester:
    """
    Unified quantum entropy harvester supporting multiple providers
    with automatic fallback and load balancing
    """

    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize multi-provider harvester

        Args:
            config_path: Path to configuration file
        """
        self.config = self._load_config(config_path)
        self.providers: Dict[QuantumProvider, Any] = {}
        self.available_backends: List[BackendInfo] = []
        self._initialize_providers()
        self._discover_backends()

    def _load_config(self, config_path: Optional[str]) -> Dict:
        """Load configuration from file or environment"""
        config = {
            'ibm_token': os.getenv('IBM_QUANTUM_TOKEN'),
            'qbraid_api_key': os.getenv('QBRAID_API_KEY'),
            'aws_access_key': os.getenv('AWS_ACCESS_KEY_ID'),
            'aws_secret_key': os.getenv('AWS_SECRET_ACCESS_KEY'),
            'ionq_api_key': os.getenv('IONQ_API_KEY'),
            'rigetti_api_key': os.getenv('RIGETTI_API_KEY'),
            'max_qubits_per_shot': 120,  # Conservative limit
            'max_shots_per_job': 8192,
            'preferred_providers': [
                QuantumProvider.IBM_DIRECT,
                QuantumProvider.IONQ,
                QuantumProvider.RIGETTI,
                QuantumProvider.AWS_BRAKET,
                QuantumProvider.QBRAID_IBM,
                QuantumProvider.SIMULATOR
            ]
        }
        return config

    def _initialize_providers(self):
        """Initialize all available provider clients"""
        # IBM Direct
        if self.config.get('ibm_token'):
            try:
                from qiskit_ibm_runtime import QiskitRuntimeService
                service = QiskitRuntimeService(
                    channel="ibm_quantum",
                    token=self.config['ibm_token']
                )
                self.providers[QuantumProvider.IBM_DIRECT] = service
                logger.info("IBM Direct provider initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize IBM Direct: {e}")

        # qBraid (supports multiple providers)
        if self.config.get('qbraid_api_key'):
            try:
                import qbraid
                qbraid.set_api_key(self.config['qbraid_api_key'])
                self.providers[QuantumProvider.QBRAID_IBM] = qbraid
                logger.info("qBraid provider initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize qBraid: {e}")

        # AWS Braket
        if self.config.get('aws_access_key') and self.config.get('aws_secret_key'):
            try:
                import boto3
                session = boto3.Session(
                    aws_access_key_id=self.config['aws_access_key'],
                    aws_secret_access_key=self.config['aws_secret_key']
                )
                self.providers[QuantumProvider.AWS_BRAKET] = session
                logger.info("AWS Braket provider initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize AWS Braket: {e}")

        # IonQ
        if self.config.get('ionq_api_key'):
            try:
                # IonQ client initialization
                self.providers[QuantumProvider.IONQ] = {
                    'api_key': self.config['ionq_api_key']
                }
                logger.info("IonQ provider initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize IonQ: {e}")

        # Rigetti
        if self.config.get('rigetti_api_key'):
            try:
                # Rigetti client initialization
                self.providers[QuantumProvider.RIGETTI] = {
                    'api_key': self.config['rigetti_api_key']
                }
                logger.info("Rigetti provider initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Rigetti: {e}")

    def _discover_backends(self):
        """Discover available quantum backends from all providers"""
        self.available_backends = []

        # IBM backends
        if QuantumProvider.IBM_DIRECT in self.providers:
            try:
                service = self.providers[QuantumProvider.IBM_DIRECT]
                backends = service.backends()
                for backend in backends:
                    config = backend.configuration()
                    status = backend.status()
                    info = BackendInfo(
                        provider=QuantumProvider.IBM_DIRECT,
                        name=backend.name,
                        num_qubits=config.n_qubits,
                        available=status.operational and not status.status_msg == 'retired',
                        queue_depth=status.pending_jobs,
                        credits_per_shot=0.01  # Approximate
                    )
                    self.available_backends.append(info)
                    logger.info(f"Found IBM backend: {backend.name} ({config.n_qubits} qubits)")
            except Exception as e:
                logger.warning(f"Failed to discover IBM backends: {e}")

        # qBraid backends
        if QuantumProvider.QBRAID_IBM in self.providers:
            try:
                import qbraid
                devices = qbraid.get_devices()
                for device in devices:
                    if device.get('status') == 'ONLINE':
                        info = BackendInfo(
                            provider=QuantumProvider.QBRAID_IBM,
                            name=device.get('id'),
                            num_qubits=device.get('num_qubits', 0),
                            available=True,
                            queue_depth=device.get('queue_depth', 0)
                        )
                        self.available_backends.append(info)
                        logger.info(f"Found qBraid device: {device.get('id')}")
            except Exception as e:
                logger.warning(f"Failed to discover qBraid backends: {e}")

        # Add simulator as fallback
        self.available_backends.append(BackendInfo(
            provider=QuantumProvider.SIMULATOR,
            name="aer_simulator",
            num_qubits=32,
            available=True,
            queue_depth=0,
            credits_per_shot=0.0
        ))

        logger.info(f"Total backends discovered: {len(self.available_backends)}")

    def calculate_optimal_strategy(
        self,
        target_bytes: int,
        backend: BackendInfo
    ) -> HarvestStrategy:
        """
        Calculate optimal harvesting strategy for given backend

        For IBM Brisbane (127 qubits):
        - Strategy 1: 8 qubits × 1000 shots = 1000 bytes (inefficient)
        - Strategy 2: 64 qubits × 125 shots = 1000 bytes (better)
        - Strategy 3: 120 qubits × 67 shots = 1005 bytes (optimal)

        Args:
            target_bytes: Target number of random bytes
            backend: Backend information

        Returns:
            Optimal harvest strategy
        """
        max_qubits = min(
            backend.num_qubits,
            self.config['max_qubits_per_shot']
        )

        # Use multiples of 8 qubits for byte alignment
        num_qubits = (max_qubits // 8) * 8
        bytes_per_shot = num_qubits // 8

        # Calculate required shots
        num_shots = math.ceil(target_bytes / bytes_per_shot)
        total_bytes = num_shots * bytes_per_shot

        # Calculate number of jobs (limited by max_shots_per_job)
        max_shots = self.config['max_shots_per_job']
        num_jobs = math.ceil(num_shots / max_shots)

        # Estimate credits
        estimated_credits = num_shots * backend.credits_per_shot

        strategy = HarvestStrategy(
            num_qubits=num_qubits,
            num_shots=num_shots,
            bytes_per_shot=bytes_per_shot,
            total_bytes=total_bytes,
            num_jobs=num_jobs,
            estimated_credits=estimated_credits
        )

        logger.info(f"Optimal strategy for {backend.name}:")
        logger.info(f"  Qubits: {num_qubits}")
        logger.info(f"  Shots: {num_shots}")
        logger.info(f"  Bytes per shot: {bytes_per_shot}")
        logger.info(f"  Total bytes: {total_bytes}")
        logger.info(f"  Number of jobs: {num_jobs}")
        logger.info(f"  Estimated credits: {estimated_credits:.2f}")

        return strategy

    def select_backend(
        self,
        provider: Optional[QuantumProvider] = None,
        min_qubits: int = 8
    ) -> Optional[BackendInfo]:
        """
        Select best available backend based on criteria

        Args:
            provider: Preferred provider (None for automatic)
            min_qubits: Minimum required qubits

        Returns:
            Selected backend or None if none available
        """
        # Filter available backends
        candidates = [
            b for b in self.available_backends
            if b.available and b.num_qubits >= min_qubits
        ]

        if not candidates:
            logger.warning("No available backends meet requirements")
            return None

        # Filter by provider if specified
        if provider:
            candidates = [b for b in candidates if b.provider == provider]
            if not candidates:
                logger.warning(f"No available {provider.value} backends")
                return None

        # Sort by priority: qubits (desc), queue depth (asc)
        candidates.sort(key=lambda b: (-b.num_qubits, b.queue_depth))

        selected = candidates[0]
        logger.info(f"Selected backend: {selected.name} ({selected.provider.value})")
        return selected

    def harvest_quantum_entropy(
        self,
        num_bytes: int,
        provider: Optional[QuantumProvider] = None,
        min_qubits: int = 8
    ) -> bytes:
        """
        Harvest quantum entropy from best available provider

        Args:
            num_bytes: Number of random bytes to generate
            provider: Preferred provider (None for automatic selection)
            min_qubits: Minimum required qubits

        Returns:
            Random bytes
        """
        logger.info(f"Harvesting {num_bytes} bytes of quantum entropy")

        # Select backend
        backend = self.select_backend(provider, min_qubits)
        if not backend:
            raise RuntimeError("No available quantum backends")

        # Calculate optimal strategy
        strategy = self.calculate_optimal_strategy(num_bytes, backend)

        # Execute harvest
        entropy_bytes = self._execute_harvest(backend, strategy)

        # Truncate to requested size
        return entropy_bytes[:num_bytes]

    def _execute_harvest(
        self,
        backend: BackendInfo,
        strategy: HarvestStrategy
    ) -> bytes:
        """
        Execute quantum entropy harvest

        Args:
            backend: Selected backend
            strategy: Harvest strategy

        Returns:
            Raw entropy bytes
        """
        logger.info(f"Executing harvest on {backend.name}")

        if backend.provider == QuantumProvider.IBM_DIRECT:
            return self._harvest_ibm_direct(backend, strategy)
        elif backend.provider == QuantumProvider.QBRAID_IBM:
            return self._harvest_qbraid(backend, strategy)
        elif backend.provider == QuantumProvider.SIMULATOR:
            return self._harvest_simulator(backend, strategy)
        else:
            raise NotImplementedError(f"Provider {backend.provider} not implemented")

    def _harvest_ibm_direct(
        self,
        backend: BackendInfo,
        strategy: HarvestStrategy
    ) -> bytes:
        """Harvest from IBM Quantum directly"""
        from qiskit import QuantumCircuit, transpile
        from qiskit_ibm_runtime import Sampler, Session

        service = self.providers[QuantumProvider.IBM_DIRECT]
        backend_obj = service.backend(backend.name)

        # Create quantum circuit
        qc = QuantumCircuit(strategy.num_qubits, strategy.num_qubits)

        # Apply Hadamard gates for superposition
        for i in range(strategy.num_qubits):
            qc.h(i)

        # Measure all qubits
        qc.measure(range(strategy.num_qubits), range(strategy.num_qubits))

        # Transpile circuit
        transpiled_qc = transpile(qc, backend=backend_obj)

        entropy_data = []
        shots_remaining = strategy.num_shots

        with Session(service=service, backend=backend.name) as session:
            sampler = Sampler(session=session)

            while shots_remaining > 0:
                batch_shots = min(shots_remaining, self.config['max_shots_per_job'])

                logger.info(f"Submitting job: {batch_shots} shots")
                job = sampler.run([transpiled_qc], shots=batch_shots)
                result = job.result()

                # Extract bitstrings
                counts = result.quasi_dists[0]
                for bitstring, count in counts.items():
                    for _ in range(int(count)):
                        # Convert bitstring to bytes
                        bit_value = format(bitstring, f'0{strategy.num_qubits}b')
                        byte_data = int(bit_value, 2).to_bytes(
                            strategy.bytes_per_shot,
                            byteorder='big'
                        )
                        entropy_data.append(byte_data)

                shots_remaining -= batch_shots
                time.sleep(1)  # Rate limiting

        return b''.join(entropy_data)

    def _harvest_qbraid(
        self,
        backend: BackendInfo,
        strategy: HarvestStrategy
    ) -> bytes:
        """Harvest via qBraid API"""
        import qbraid

        # Get device
        device = qbraid.device_wrapper(backend.name)

        # Create circuit (qBraid uses OpenQASM)
        qasm = f"""
        OPENQASM 2.0;
        include "qelib1.inc";
        qreg q[{strategy.num_qubits}];
        creg c[{strategy.num_qubits}];
        """

        for i in range(strategy.num_qubits):
            qasm += f"h q[{i}];\n"

        for i in range(strategy.num_qubits):
            qasm += f"measure q[{i}] -> c[{i}];\n"

        # Submit job
        job = device.run(qasm, shots=strategy.num_shots)
        result = job.result()

        # Extract measurements
        entropy_data = []
        for bitstring in result.measurements():
            byte_data = int(bitstring, 2).to_bytes(
                strategy.bytes_per_shot,
                byteorder='big'
            )
            entropy_data.append(byte_data)

        return b''.join(entropy_data)

    def _harvest_simulator(
        self,
        backend: BackendInfo,
        strategy: HarvestStrategy
    ) -> bytes:
        """Harvest from simulator (fallback)"""
        logger.warning("Using simulator fallback - NOT true quantum randomness!")

        from qiskit import QuantumCircuit
        from qiskit_aer import AerSimulator

        # Create circuit
        qc = QuantumCircuit(strategy.num_qubits, strategy.num_qubits)

        for i in range(strategy.num_qubits):
            qc.h(i)

        qc.measure(range(strategy.num_qubits), range(strategy.num_qubits))

        # Run simulation
        simulator = AerSimulator()
        job = simulator.run(qc, shots=strategy.num_shots)
        result = job.result()
        counts = result.get_counts()

        # Extract measurements
        entropy_data = []
        for bitstring, count in counts.items():
            for _ in range(count):
                byte_data = int(bitstring, 2).to_bytes(
                    strategy.bytes_per_shot,
                    byteorder='big'
                )
                entropy_data.append(byte_data)

        return b''.join(entropy_data)

    def get_provider_status(self) -> Dict[str, Any]:
        """Get status of all providers"""
        status = {
            'initialized_providers': [p.value for p in self.providers.keys()],
            'available_backends': [
                {
                    'provider': b.provider.value,
                    'name': b.name,
                    'qubits': b.num_qubits,
                    'available': b.available,
                    'queue_depth': b.queue_depth
                }
                for b in self.available_backends
            ],
            'total_backends': len(self.available_backends)
        }
        return status


def calculate_bytes_per_shot(num_qubits: int) -> int:
    """
    Calculate bytes generated per measurement shot

    Args:
        num_qubits: Number of qubits used

    Returns:
        Bytes per shot (num_qubits // 8)
    """
    return num_qubits // 8


def calculate_optimal_harvest(target_bytes: int, max_qubits: int) -> Tuple[int, int]:
    """
    Calculate optimal qubit count and shot count

    Args:
        target_bytes: Target number of bytes
        max_qubits: Maximum available qubits

    Returns:
        Tuple of (num_qubits, num_shots)
    """
    # Use multiples of 8 for byte alignment
    num_qubits = (max_qubits // 8) * 8
    bytes_per_shot = num_qubits // 8
    num_shots = math.ceil(target_bytes / bytes_per_shot)

    return (num_qubits, num_shots)


# Example usage
if __name__ == "__main__":
    # Initialize harvester
    harvester = MultiProviderHarvester()

    # Show provider status
    status = harvester.get_provider_status()
    print("\nProvider Status:")
    print(f"Initialized providers: {status['initialized_providers']}")
    print(f"Available backends: {status['total_backends']}")

    # Example: Calculate optimal strategy for IBM Brisbane (127 qubits)
    print("\n\nExample: IBM Brisbane (127 qubits)")
    print("=" * 50)

    qubits, shots = calculate_optimal_harvest(1000, 127)
    print(f"Target: 1000 bytes")
    print(f"Strategy: {qubits} qubits × {shots} shots")
    print(f"Bytes per shot: {calculate_bytes_per_shot(qubits)}")
    print(f"Total bytes: {shots * calculate_bytes_per_shot(qubits)}")
    print(f"\nComparison:")
    print(f"  8 qubits × 1000 shots = 1000 bytes (inefficient)")
    print(f"  120 qubits × 67 shots = 1005 bytes (optimal!)")

    # Harvest example (uncomment when configured)
    # entropy = harvester.harvest_quantum_entropy(1000)
    # print(f"\nHarvested {len(entropy)} bytes of quantum entropy")
