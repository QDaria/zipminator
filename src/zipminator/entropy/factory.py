import os
from pathlib import Path
from typing import Optional

from .ibm import IBMQuantumProvider
from .rigetti import RigettiProvider
from .qbraid import QBraidProvider
from .api import APIProxyProvider
from .pool_provider import PoolProvider
from .base import QuantumProvider


def get_provider(pool_path: Optional[str] = None) -> QuantumProvider:
    """Return the best available quantum entropy provider.

    Priority order:
        1. PoolProvider   -- local pre-harvested quantum entropy (fastest)
        2. QBraidProvider -- qBraid multi-cloud gateway
        3. IBMProvider    -- IBM Quantum direct
        4. RigettiProvider -- Rigetti direct
        5. APIProxyProvider -- proxy / simulator fallback
        6. OS fallback    -- handled inside PoolProvider when pool is missing

    Args:
        pool_path: Override path to the entropy pool binary file.
            When *None*, the default ``quantum_entropy/quantum_entropy_pool.bin``
            is used.
    """
    # 1. Pool provider (check if file exists and has content)
    pool = Path(pool_path) if pool_path else None
    if pool is None:
        # Use PoolProvider's default path logic
        provider = PoolProvider()
        if provider.bytes_remaining() > 0:
            return provider
    else:
        if pool.exists() and pool.stat().st_size > 0:
            return PoolProvider(pool_path=str(pool))

    # 2. Cloud providers keyed on environment variables
    qbraid_key = os.getenv("QBRAID_API_KEY")
    rigetti_key = os.getenv("RIGETTI_API_KEY")
    ibm_token = os.getenv("IBM_QUANTUM_TOKEN")

    if qbraid_key:
        return QBraidProvider(qbraid_key)
    elif ibm_token:
        return IBMQuantumProvider(ibm_token)
    elif rigetti_key:
        return RigettiProvider(rigetti_key)

    # 3. API proxy (may itself fall back to simulation)
    return APIProxyProvider()


# Alias for the public API
create_provider = get_provider
