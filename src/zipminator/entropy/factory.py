import logging
import os
from pathlib import Path
from typing import List, Optional

from .ibm import IBMQuantumProvider
from .rigetti import RigettiProvider
from .qbraid import QBraidProvider
from .api import APIProxyProvider
from .pool_provider import PoolProvider
from .base import QuantumProvider

logger = logging.getLogger(__name__)


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


def _collect_providers(pool_path: Optional[str] = None) -> List[QuantumProvider]:
    """Collect all available providers for multi-source composition.

    Returns every provider that can be instantiated, not just the
    highest-priority one. This enables the compositor to XOR-fuse
    entropy from multiple independent sources.
    """
    providers: List[QuantumProvider] = []

    # 1. Pool provider
    pool = Path(pool_path) if pool_path else None
    if pool is None:
        pp = PoolProvider()
        if pp.bytes_remaining() > 0:
            providers.append(pp)
    else:
        if pool.exists() and pool.stat().st_size > 0:
            providers.append(PoolProvider(pool_path=str(pool)))

    # 2. Cloud providers keyed on environment variables
    qbraid_key = os.getenv("QBRAID_API_KEY")
    ibm_token = os.getenv("IBM_QUANTUM_TOKEN")
    rigetti_key = os.getenv("RIGETTI_API_KEY")

    if qbraid_key:
        try:
            providers.append(QBraidProvider(qbraid_key))
        except Exception as exc:
            logger.debug("QBraid provider unavailable: %s", exc)

    if ibm_token:
        try:
            providers.append(IBMQuantumProvider(ibm_token))
        except Exception as exc:
            logger.debug("IBM provider unavailable: %s", exc)

    if rigetti_key:
        try:
            providers.append(RigettiProvider(rigetti_key))
        except Exception as exc:
            logger.debug("Rigetti provider unavailable: %s", exc)

    # 3. Always include API proxy as fallback (it has OS urandom inside)
    if not providers:
        providers.append(APIProxyProvider())

    return providers


def get_compositor(
    pool_path: Optional[str] = None,
    min_sources: int = 1,
) -> "EntropyCompositor":
    """Return an EntropyCompositor wrapping all available providers.

    Each QuantumProvider is adapted to the EntropySource protocol
    via QuantumProviderAdapter, which runs NIST SP 800-90B health
    tests and min-entropy estimation on every byte.

    The existing ``get_provider()`` function is unchanged for
    backward compatibility.

    Args:
        pool_path: Override path to the entropy pool binary file.
        min_sources: Minimum number of healthy sources required.

    Returns:
        An EntropyCompositor ready to produce composed entropy.
    """
    from .compositor import EntropyCompositor, QuantumProviderAdapter

    raw_providers = _collect_providers(pool_path)
    sources = [QuantumProviderAdapter(p) for p in raw_providers]
    return EntropyCompositor(sources, min_sources=min_sources)
