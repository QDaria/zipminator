"""
qBraid quantum provider implementation.

This module provides unified access to quantum hardware through the qBraid platform,
which aggregates multiple quantum providers (IBM, AWS Braket, IonQ, Rigetti, etc.).
"""

import os
import time
import json
from typing import Dict, List, Optional, Any
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from quantum_provider import (
    QuantumProvider, BackendInfo, QuantumJob, ProviderCredits,
    BackendStatus, ProviderStatus,
    AuthenticationError, BackendNotFoundError, BackendUnavailableError,
    InsufficientCreditsError, JobTimeoutError, JobFailedError
)

try:
    import qbraid
    from qbraid import QbraidProvider
    from qbraid.runtime import QuantumDevice
    QBRAID_AVAILABLE = True
except ImportError:
    QBRAID_AVAILABLE = False
    print("Warning: qbraid not installed. Install with: pip install qbraid")


class qBraidQuantumProvider(QuantumProvider):
    """qBraid quantum hardware provider."""

    def __init__(self, api_key: Optional[str] = None, priority: int = 1):
        """
        Initialize qBraid provider.

        Args:
            api_key: qBraid API key (or set QBRAID_API_KEY env var)
            priority: Selection priority (default: 1 = highest)
        """
        super().__init__(name="qBraid", priority=priority)

        if not QBRAID_AVAILABLE:
            raise ImportError("qbraid package not installed")

        self.api_key = api_key or os.getenv('QBRAID_API_KEY')
        self.provider = None
        self._backends_cache = []
        self._cache_time = 0
        self._cache_ttl = 300  # 5 minutes

        if self.api_key:
            self.authenticate({'api_key': self.api_key})

    def authenticate(self, credentials: Dict[str, str]) -> bool:
        """
        Authenticate with qBraid.

        Args:
            credentials: Dict with 'api_key'

        Returns:
            True if successful

        Raises:
            AuthenticationError: If authentication fails
        """
        try:
            api_key = credentials.get('api_key', self.api_key)
            if not api_key:
                raise AuthenticationError("No API key provided")

            # Set API key
            os.environ['QBRAID_API_KEY'] = api_key
            self.api_key = api_key

            # Initialize provider
            self.provider = QbraidProvider(api_key=api_key)

            # Test connection by listing devices
            self.provider.get_devices()

            self._status = ProviderStatus.AVAILABLE
            return True

        except Exception as e:
            self._status = ProviderStatus.UNAVAILABLE
            raise AuthenticationError(f"qBraid authentication failed: {e}")

    def list_backends(self, refresh: bool = False) -> List[BackendInfo]:
        """
        List available quantum backends through qBraid.

        Args:
            refresh: Force refresh of backend list

        Returns:
            List of available backends
        """
        if not self.provider:
            raise AuthenticationError("Not authenticated")

        # Check cache
        current_time = time.time()
        if not refresh and (current_time - self._cache_time) < self._cache_ttl:
            return self._backends_cache

        try:
            backends = []
            devices = self.provider.get_devices()

            for device in devices:
                try:
                    # Get device info
                    device_obj = self.provider.get_device(device)
                    metadata = device_obj.metadata()

                    # Map status
                    status_str = metadata.get('status', 'offline').lower()
                    if 'online' in status_str or 'available' in status_str:
                        status = BackendStatus.ONLINE
                    elif 'busy' in status_str or 'queue' in status_str:
                        status = BackendStatus.BUSY
                    elif 'maintenance' in status_str:
                        status = BackendStatus.MAINTENANCE
                    else:
                        status = BackendStatus.OFFLINE

                    # Extract properties
                    num_qubits = metadata.get('num_qubits', 0)
                    queue_depth = metadata.get('pending_jobs', 0)

                    # Estimate queue time (rough estimate)
                    avg_queue_time = queue_depth * 30.0  # 30 seconds per job estimate

                    # Get pricing info
                    pricing = metadata.get('pricing', {})
                    credits_per_shot = pricing.get('per_shot', 0.001)

                    # Get quality metrics
                    fidelity = metadata.get('fidelity', 0.95)
                    gate_error = metadata.get('gate_error_rate', 0.01)
                    readout_error = metadata.get('readout_error_rate', 0.02)

                    backend_info = BackendInfo(
                        name=device,
                        provider="qBraid",
                        num_qubits=num_qubits,
                        status=status,
                        queue_depth=queue_depth,
                        avg_queue_time=avg_queue_time,
                        credits_per_shot=credits_per_shot,
                        fidelity=fidelity,
                        gate_error_rate=gate_error,
                        readout_error_rate=readout_error,
                        connectivity=metadata.get('topology', 'unknown')
                    )

                    backends.append(backend_info)

                except Exception as e:
                    print(f"Error getting info for device {device}: {e}")
                    continue

            # Update cache
            self._backends_cache = backends
            self._cache_time = current_time

            return backends

        except Exception as e:
            raise BackendNotFoundError(f"Failed to list backends: {e}")

    def get_backend(self, name: str) -> BackendInfo:
        """
        Get information about a specific backend.

        Args:
            name: Backend name

        Returns:
            Backend information
        """
        backends = self.list_backends()
        for backend in backends:
            if backend.name == name:
                return backend
        raise BackendNotFoundError(f"Backend '{name}' not found")

    def generate_random_bits(self, num_bits: int, num_shots: int,
                            backend_name: Optional[str] = None) -> QuantumJob:
        """
        Generate quantum random bits using qBraid.

        Args:
            num_bits: Number of qubits to use
            num_shots: Number of measurements
            backend_name: Specific backend (optional, auto-selects if None)

        Returns:
            Quantum job object
        """
        if not self.provider:
            raise AuthenticationError("Not authenticated")

        # Select backend
        if backend_name is None:
            backend = self.select_best_backend(num_bits)
            if backend is None:
                raise BackendUnavailableError("No suitable backends available")
            backend_name = backend.name
        else:
            backend = self.get_backend(backend_name)

        # Check credits
        cost = self.estimate_cost(num_bits, num_shots, backend_name)
        credits = self.check_credits()
        if not credits.has_credits(cost):
            raise InsufficientCreditsError(
                f"Insufficient credits. Need {cost}, have {credits.remaining}"
            )

        try:
            # Get device
            device = self.provider.get_device(backend_name)

            # Create quantum circuit (Hadamard on all qubits)
            from qbraid.programs import ProgramSpec

            # qBraid uses OpenQASM 2.0 format
            qasm = self._create_hadamard_circuit_qasm(num_bits)

            # Submit job
            job = device.run(qasm, shots=num_shots)

            # Create job object
            quantum_job = QuantumJob(
                job_id=job.id(),
                provider="qBraid",
                backend_name=backend_name,
                num_qubits=num_bits,
                num_shots=num_shots,
                status="SUBMITTED",
                submitted_at=time.time(),
                cost=cost
            )

            return quantum_job

        except Exception as e:
            raise BackendUnavailableError(f"Failed to submit job: {e}")

    def _create_hadamard_circuit_qasm(self, num_qubits: int) -> str:
        """
        Create OpenQASM circuit with Hadamards and measurements.

        Args:
            num_qubits: Number of qubits

        Returns:
            QASM string
        """
        qasm = [
            'OPENQASM 2.0;',
            'include "qelib1.inc";',
            f'qreg q[{num_qubits}];',
            f'creg c[{num_qubits}];',
        ]

        # Add Hadamard gates
        for i in range(num_qubits):
            qasm.append(f'h q[{i}];')

        # Add measurements
        for i in range(num_qubits):
            qasm.append(f'measure q[{i}] -> c[{i}];')

        return '\n'.join(qasm)

    def get_job_status(self, job_id: str) -> QuantumJob:
        """
        Get status of a submitted job.

        Args:
            job_id: Job identifier

        Returns:
            Updated job object
        """
        if not self.provider:
            raise AuthenticationError("Not authenticated")

        try:
            # qBraid job tracking
            job = self.provider.get_job(job_id)
            status = job.status()

            # Map status to standard format
            status_map = {
                'COMPLETED': 'COMPLETED',
                'RUNNING': 'RUNNING',
                'QUEUED': 'QUEUED',
                'FAILED': 'FAILED',
                'CANCELLED': 'CANCELLED'
            }

            mapped_status = status_map.get(status.upper(), status.upper())

            quantum_job = QuantumJob(
                job_id=job_id,
                provider="qBraid",
                backend_name="",  # Would need to track this
                num_qubits=0,
                num_shots=0,
                status=mapped_status,
                submitted_at=0.0
            )

            if mapped_status == 'COMPLETED':
                quantum_job.completed_at = time.time()

            return quantum_job

        except Exception as e:
            raise JobFailedError(f"Failed to get job status: {e}")

    def get_job_result(self, job_id: str, wait: bool = True,
                       timeout: float = 300.0) -> Dict[str, int]:
        """
        Get results from a completed job.

        Args:
            job_id: Job identifier
            wait: Wait for completion
            timeout: Maximum wait time

        Returns:
            Measurement counts
        """
        if not self.provider:
            raise AuthenticationError("Not authenticated")

        try:
            job = self.provider.get_job(job_id)

            if wait:
                start_time = time.time()
                while time.time() - start_time < timeout:
                    status = job.status().upper()
                    if status == 'COMPLETED':
                        break
                    elif status in ['FAILED', 'CANCELLED']:
                        raise JobFailedError(f"Job failed with status: {status}")
                    time.sleep(5)
                else:
                    raise JobTimeoutError(f"Job timed out after {timeout}s")

            # Get results
            result = job.result()
            counts = result.measurement_counts()

            return counts

        except JobTimeoutError:
            raise
        except JobFailedError:
            raise
        except Exception as e:
            raise JobFailedError(f"Failed to get job result: {e}")

    def check_credits(self) -> ProviderCredits:
        """
        Check available qBraid credits.

        Returns:
            Credit information
        """
        if not self.provider:
            raise AuthenticationError("Not authenticated")

        try:
            # Get account info
            account = self.provider.get_account()

            total = account.get('total_credits', 1000.0)
            used = account.get('credits_used', 0.0)
            remaining = total - used

            return ProviderCredits(
                total=total,
                used=used,
                remaining=remaining,
                currency='credits',
                refresh_date=None
            )

        except Exception as e:
            # Return default if unable to check
            print(f"Warning: Unable to check credits: {e}")
            return ProviderCredits(
                total=1000.0,
                used=0.0,
                remaining=1000.0,
                currency='credits'
            )

    def estimate_cost(self, num_qubits: int, num_shots: int,
                     backend_name: Optional[str] = None) -> float:
        """
        Estimate cost for a quantum computation.

        Args:
            num_qubits: Number of qubits
            num_shots: Number of shots
            backend_name: Specific backend

        Returns:
            Estimated cost in credits
        """
        try:
            if backend_name:
                backend = self.get_backend(backend_name)
                credits_per_shot = backend.credits_per_shot
            else:
                # Use average cost
                credits_per_shot = 0.001

            return credits_per_shot * num_shots

        except Exception:
            # Conservative estimate
            return 0.01 * num_shots

    def _check_auth(self) -> bool:
        """Check if authenticated."""
        return self.provider is not None
