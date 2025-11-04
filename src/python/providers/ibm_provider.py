"""
IBM Quantum Provider Implementation
Implements the QuantumProvider interface for IBM Quantum hardware
"""

import os
import time
import logging
from typing import Dict, List, Optional
from ..quantum_provider import (
    QuantumProvider,
    BackendInfo,
    BackendStatus,
    ProviderCredits,
    QuantumJob,
    ProviderStatus,
    AuthenticationError,
    BackendNotFoundError,
    InsufficientCreditsError,
    BackendUnavailableError
)

logger = logging.getLogger(__name__)


class IBMQuantumProvider(QuantumProvider):
    """IBM Quantum provider implementation"""

    def __init__(self, priority: int = 10):
        """
        Initialize IBM Quantum provider

        Args:
            priority: Selection priority (lower = higher priority)
        """
        super().__init__("IBM Quantum", priority)
        self._service = None
        self._backends_cache = []
        self._cache_time = 0.0

    def authenticate(self, credentials: Dict[str, str]) -> bool:
        """
        Authenticate with IBM Quantum

        Args:
            credentials: Must contain 'token' key with IBM Quantum API token

        Returns:
            True if authentication successful

        Raises:
            AuthenticationError: If authentication fails
        """
        try:
            from qiskit_ibm_runtime import QiskitRuntimeService

            token = credentials.get('token') or os.getenv('IBM_QUANTUM_TOKEN')
            if not token:
                raise AuthenticationError("IBM Quantum token not provided")

            self._service = QiskitRuntimeService(
                channel="ibm_quantum",
                token=token
            )

            # Test authentication by listing backends
            _ = self._service.backends()

            self._status = ProviderStatus.AVAILABLE
            logger.info("IBM Quantum authentication successful")
            return True

        except Exception as e:
            self._status = ProviderStatus.UNAVAILABLE
            raise AuthenticationError(f"IBM Quantum authentication failed: {e}")

    def list_backends(self, refresh: bool = False) -> List[BackendInfo]:
        """
        List available IBM Quantum backends

        Args:
            refresh: Force refresh of backend list

        Returns:
            List of available backends
        """
        if not self._service:
            return []

        # Use cache if recent and not forcing refresh
        current_time = time.time()
        if not refresh and self._backends_cache and (current_time - self._cache_time) < 300:
            return self._backends_cache

        backends = []

        try:
            ibm_backends = self._service.backends()

            for backend in ibm_backends:
                try:
                    config = backend.configuration()
                    status = backend.status()

                    # Determine backend status
                    if not status.operational:
                        backend_status = BackendStatus.OFFLINE
                    elif status.status_msg == 'retired':
                        backend_status = BackendStatus.MAINTENANCE
                    elif status.pending_jobs > 50:
                        backend_status = BackendStatus.BUSY
                    else:
                        backend_status = BackendStatus.ONLINE

                    # Calculate fidelity and error rates
                    props = backend.properties() if hasattr(backend, 'properties') else None

                    if props:
                        # Average single-qubit gate error
                        gate_errors = [gate.error for qubit in props.qubits for gate in qubit]
                        gate_error_rate = sum(gate_errors) / len(gate_errors) if gate_errors else 0.01

                        # Average readout error
                        readout_errors = [qubit[0].value for qubit in props.qubits]
                        readout_error_rate = sum(readout_errors) / len(readout_errors) if readout_errors else 0.02

                        fidelity = 1.0 - (gate_error_rate + readout_error_rate) / 2
                    else:
                        gate_error_rate = 0.01
                        readout_error_rate = 0.02
                        fidelity = 0.98

                    backend_info = BackendInfo(
                        name=backend.name,
                        provider="IBM Quantum",
                        num_qubits=config.n_qubits,
                        status=backend_status,
                        queue_depth=status.pending_jobs,
                        avg_queue_time=status.pending_jobs * 30.0,  # Estimate: 30s per job
                        credits_per_shot=0.00001,  # Approximate
                        fidelity=fidelity,
                        gate_error_rate=gate_error_rate,
                        readout_error_rate=readout_error_rate,
                        connectivity='limited'
                    )

                    backends.append(backend_info)

                except Exception as e:
                    logger.warning(f"Failed to get info for backend {backend.name}: {e}")
                    continue

            self._backends_cache = backends
            self._cache_time = current_time

        except Exception as e:
            logger.error(f"Failed to list IBM backends: {e}")

        return backends

    def get_backend(self, name: str) -> BackendInfo:
        """
        Get information about a specific backend

        Args:
            name: Backend name

        Returns:
            Backend information

        Raises:
            BackendNotFoundError: If backend doesn't exist
        """
        backends = self.list_backends()

        for backend in backends:
            if backend.name == name:
                return backend

        raise BackendNotFoundError(f"Backend not found: {name}")

    def generate_random_bits(
        self,
        num_bits: int,
        num_shots: int,
        backend_name: Optional[str] = None
    ) -> QuantumJob:
        """
        Generate quantum random bits using IBM Quantum

        Args:
            num_bits: Number of qubits to use
            num_shots: Number of measurements
            backend_name: Specific backend to use (optional)

        Returns:
            Quantum job object

        Raises:
            InsufficientCreditsError: If not enough credits
            BackendUnavailableError: If backend unavailable
        """
        if not self._service:
            raise RuntimeError("Not authenticated with IBM Quantum")

        # Select backend
        if backend_name:
            backend_info = self.get_backend(backend_name)
        else:
            backend_info = self.select_best_backend(num_bits)

        if not backend_info:
            raise BackendUnavailableError("No suitable backend available")

        if backend_info.status != BackendStatus.ONLINE:
            raise BackendUnavailableError(f"Backend {backend_info.name} is not online")

        try:
            from qiskit import QuantumCircuit, transpile
            from qiskit_ibm_runtime import Sampler, Session

            # Create quantum circuit for random number generation
            qc = QuantumCircuit(num_bits, num_bits)

            # Apply Hadamard gates to create superposition
            for i in range(num_bits):
                qc.h(i)

            # Measure all qubits
            qc.measure(range(num_bits), range(num_bits))

            # Get backend object
            backend = self._service.backend(backend_info.name)

            # Transpile circuit
            transpiled_qc = transpile(qc, backend=backend)

            # Submit job
            with Session(service=self._service, backend=backend_info.name) as session:
                sampler = Sampler(session=session)
                job = sampler.run([transpiled_qc], shots=num_shots)

                quantum_job = QuantumJob(
                    job_id=job.job_id(),
                    provider="IBM Quantum",
                    backend_name=backend_info.name,
                    num_qubits=num_bits,
                    num_shots=num_shots,
                    status="QUEUED",
                    submitted_at=time.time(),
                    cost=num_shots * backend_info.credits_per_shot
                )

                return quantum_job

        except Exception as e:
            logger.error(f"Failed to submit job: {e}")
            raise

    def get_job_status(self, job_id: str) -> QuantumJob:
        """
        Get status of a submitted job

        Args:
            job_id: Job identifier

        Returns:
            Updated job object
        """
        if not self._service:
            raise RuntimeError("Not authenticated")

        try:
            job = self._service.job(job_id)
            status_str = job.status()

            quantum_job = QuantumJob(
                job_id=job_id,
                provider="IBM Quantum",
                backend_name=job.backend().name,
                num_qubits=0,  # Not available from job status
                num_shots=0,  # Not available from job status
                status=str(status_str),
                submitted_at=0.0,  # Not available from job status
                completed_at=time.time() if status_str in ['DONE', 'COMPLETED'] else None
            )

            return quantum_job

        except Exception as e:
            logger.error(f"Failed to get job status: {e}")
            raise

    def get_job_result(
        self,
        job_id: str,
        wait: bool = True,
        timeout: float = 300.0
    ) -> Dict[str, int]:
        """
        Get results from a completed job

        Args:
            job_id: Job identifier
            wait: Wait for job to complete
            timeout: Maximum wait time in seconds

        Returns:
            Measurement counts dictionary

        Raises:
            JobTimeoutError: If job doesn't complete in time
            JobFailedError: If job failed
        """
        if not self._service:
            raise RuntimeError("Not authenticated")

        try:
            job = self._service.job(job_id)

            if wait:
                job.wait_for_final_state(timeout=timeout)

            result = job.result()

            # Extract counts from result
            if hasattr(result, 'quasi_dists'):
                counts = result.quasi_dists[0]
            elif hasattr(result, 'get_counts'):
                counts = result.get_counts()
            else:
                counts = {}

            return counts

        except Exception as e:
            logger.error(f"Failed to get job result: {e}")
            raise

    def check_credits(self) -> ProviderCredits:
        """
        Check available IBM Quantum credits

        Returns:
            Credit information
        """
        # IBM Quantum credit information is not directly accessible via API
        # This is a placeholder implementation
        return ProviderCredits(
            total=600.0,  # 10 minutes monthly
            used=0.0,
            remaining=600.0,
            currency='seconds',
            refresh_date='Monthly on 1st'
        )

    def estimate_cost(
        self,
        num_qubits: int,
        num_shots: int,
        backend_name: Optional[str] = None
    ) -> float:
        """
        Estimate cost for a quantum computation

        Args:
            num_qubits: Number of qubits
            num_shots: Number of measurements
            backend_name: Specific backend (optional)

        Returns:
            Estimated cost in provider units (seconds)
        """
        # IBM charges in time (seconds)
        # Approximate: 0.6 seconds per shot on average
        estimated_time = num_shots * 0.0006

        return estimated_time

    def _check_auth(self) -> bool:
        """Check if provider is authenticated"""
        return self._service is not None
