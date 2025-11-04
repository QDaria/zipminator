"""
Abstract base class for quantum hardware providers.

This module defines the interface that all quantum providers must implement
to work with the universal QRNG harvester system.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, List, Optional, Any
from enum import Enum
import time


class ProviderStatus(Enum):
    """Provider availability status."""
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    DEGRADED = "degraded"
    MAINTENANCE = "maintenance"
    NO_CREDITS = "no_credits"


class BackendStatus(Enum):
    """Backend device status."""
    ONLINE = "online"
    OFFLINE = "offline"
    BUSY = "busy"
    MAINTENANCE = "maintenance"


@dataclass
class BackendInfo:
    """Information about a quantum backend."""
    name: str
    provider: str
    num_qubits: int
    status: BackendStatus
    queue_depth: int
    avg_queue_time: float  # seconds
    credits_per_shot: float
    fidelity: float  # 0-1
    gate_error_rate: float
    readout_error_rate: float
    connectivity: str  # 'full', 'limited', 'line', etc.

    def score(self, credit_weight: float = 0.4,
              queue_weight: float = 0.3,
              quality_weight: float = 0.3) -> float:
        """
        Calculate a composite score for backend selection.

        Higher score = better backend.

        Args:
            credit_weight: Weight for credit efficiency (0-1)
            queue_weight: Weight for queue time (0-1)
            quality_weight: Weight for qubit quality (0-1)

        Returns:
            Composite score (0-100)
        """
        # Normalize metrics to 0-1 scale (higher is better)
        credit_score = 1.0 / (1.0 + self.credits_per_shot * 100)
        queue_score = 1.0 / (1.0 + self.avg_queue_time / 60)  # Normalize by minutes
        quality_score = self.fidelity * (1.0 - self.gate_error_rate) * (1.0 - self.readout_error_rate)

        # Weight and combine
        total_score = (
            credit_score * credit_weight +
            queue_score * queue_weight +
            quality_score * quality_weight
        )

        return total_score * 100


@dataclass
class QuantumJob:
    """Represents a quantum computation job."""
    job_id: str
    provider: str
    backend_name: str
    num_qubits: int
    num_shots: int
    status: str
    submitted_at: float
    completed_at: Optional[float] = None
    cost: float = 0.0
    result: Optional[Dict[str, int]] = None

    def duration(self) -> float:
        """Get job duration in seconds."""
        if self.completed_at:
            return self.completed_at - self.submitted_at
        return time.time() - self.submitted_at

    def is_complete(self) -> bool:
        """Check if job is complete."""
        return self.status in ['COMPLETED', 'DONE', 'SUCCESS']

    def is_failed(self) -> bool:
        """Check if job failed."""
        return self.status in ['FAILED', 'ERROR', 'CANCELLED']


@dataclass
class ProviderCredits:
    """Credit information for a provider."""
    total: float
    used: float
    remaining: float
    currency: str  # 'USD', 'credits', 'units'
    refresh_date: Optional[str] = None

    def has_credits(self, required: float = 0.0) -> bool:
        """Check if provider has sufficient credits."""
        return self.remaining > required


class QuantumProvider(ABC):
    """Abstract base class for quantum hardware providers."""

    def __init__(self, name: str, priority: int = 100):
        """
        Initialize provider.

        Args:
            name: Provider name
            priority: Selection priority (lower = higher priority)
        """
        self.name = name
        self.priority = priority
        self._status = ProviderStatus.UNAVAILABLE
        self._last_check = 0.0
        self._check_interval = 300.0  # 5 minutes

    @abstractmethod
    def authenticate(self, credentials: Dict[str, str]) -> bool:
        """
        Authenticate with the provider.

        Args:
            credentials: Provider-specific credentials

        Returns:
            True if authentication successful

        Raises:
            AuthenticationError: If authentication fails
        """
        pass

    @abstractmethod
    def list_backends(self, refresh: bool = False) -> List[BackendInfo]:
        """
        List available quantum backends.

        Args:
            refresh: Force refresh of backend list

        Returns:
            List of available backends
        """
        pass

    @abstractmethod
    def get_backend(self, name: str) -> BackendInfo:
        """
        Get information about a specific backend.

        Args:
            name: Backend name

        Returns:
            Backend information

        Raises:
            BackendNotFoundError: If backend doesn't exist
        """
        pass

    @abstractmethod
    def generate_random_bits(self, num_bits: int, num_shots: int,
                            backend_name: Optional[str] = None) -> QuantumJob:
        """
        Generate quantum random bits.

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
        pass

    @abstractmethod
    def get_job_status(self, job_id: str) -> QuantumJob:
        """
        Get status of a submitted job.

        Args:
            job_id: Job identifier

        Returns:
            Updated job object
        """
        pass

    @abstractmethod
    def get_job_result(self, job_id: str, wait: bool = True,
                       timeout: float = 300.0) -> Dict[str, int]:
        """
        Get results from a completed job.

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
        pass

    @abstractmethod
    def check_credits(self) -> ProviderCredits:
        """
        Check available credits.

        Returns:
            Credit information
        """
        pass

    @abstractmethod
    def estimate_cost(self, num_qubits: int, num_shots: int,
                     backend_name: Optional[str] = None) -> float:
        """
        Estimate cost for a quantum computation.

        Args:
            num_qubits: Number of qubits
            num_shots: Number of measurements
            backend_name: Specific backend (optional)

        Returns:
            Estimated cost in provider units
        """
        pass

    def is_available(self) -> bool:
        """
        Check if provider is currently available.

        Returns:
            True if provider can accept jobs
        """
        # Cache status checks
        current_time = time.time()
        if current_time - self._last_check < self._check_interval:
            return self._status == ProviderStatus.AVAILABLE

        self._last_check = current_time

        try:
            # Check authentication
            if not self._check_auth():
                self._status = ProviderStatus.UNAVAILABLE
                return False

            # Check credits
            credits = self.check_credits()
            if not credits.has_credits():
                self._status = ProviderStatus.NO_CREDITS
                return False

            # Check if any backends available
            backends = self.list_backends()
            if not any(b.status == BackendStatus.ONLINE for b in backends):
                self._status = ProviderStatus.UNAVAILABLE
                return False

            self._status = ProviderStatus.AVAILABLE
            return True

        except Exception as e:
            print(f"Provider {self.name} availability check failed: {e}")
            self._status = ProviderStatus.UNAVAILABLE
            return False

    def _check_auth(self) -> bool:
        """
        Check if provider is authenticated.

        Returns:
            True if authenticated
        """
        # Override in subclass if needed
        return True

    def select_best_backend(self, num_qubits: int,
                          credit_weight: float = 0.4,
                          queue_weight: float = 0.3,
                          quality_weight: float = 0.3) -> Optional[BackendInfo]:
        """
        Select the best backend for given requirements.

        Args:
            num_qubits: Required number of qubits
            credit_weight: Weight for credit efficiency
            queue_weight: Weight for queue time
            quality_weight: Weight for qubit quality

        Returns:
            Best backend or None if none available
        """
        backends = self.list_backends()

        # Filter by requirements
        suitable = [
            b for b in backends
            if b.num_qubits >= num_qubits
            and b.status == BackendStatus.ONLINE
        ]

        if not suitable:
            return None

        # Score and sort
        scored = [
            (b, b.score(credit_weight, queue_weight, quality_weight))
            for b in suitable
        ]
        scored.sort(key=lambda x: x[1], reverse=True)

        return scored[0][0]

    def get_status(self) -> ProviderStatus:
        """Get current provider status."""
        return self._status

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(name='{self.name}', priority={self.priority}, status={self._status.value})"


# Custom Exceptions

class ProviderError(Exception):
    """Base exception for provider errors."""
    pass


class AuthenticationError(ProviderError):
    """Authentication failed."""
    pass


class BackendNotFoundError(ProviderError):
    """Backend not found."""
    pass


class BackendUnavailableError(ProviderError):
    """Backend unavailable."""
    pass


class InsufficientCreditsError(ProviderError):
    """Not enough credits."""
    pass


class JobTimeoutError(ProviderError):
    """Job timed out."""
    pass


class JobFailedError(ProviderError):
    """Job failed."""
    pass
