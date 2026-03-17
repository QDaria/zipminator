import os
from .ibm import IBMQuantumProvider
from .rigetti import RigettiProvider
from .qbraid import QBraidProvider
from .api import APIProxyProvider
from .base import QuantumProvider


def get_provider() -> QuantumProvider:
    """Return the best available quantum entropy provider."""
    qbraid_key = os.getenv("QBRAID_API_KEY")
    rigetti_key = os.getenv("RIGETTI_API_KEY")
    ibm_token = os.getenv("IBM_QUANTUM_TOKEN")

    if qbraid_key:
        return QBraidProvider(qbraid_key)
    elif rigetti_key:
        return RigettiProvider(rigetti_key)
    elif ibm_token:
        return IBMQuantumProvider(ibm_token)
    else:
        return APIProxyProvider()


# Alias for the public API
create_provider = get_provider
