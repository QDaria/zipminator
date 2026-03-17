"""
Scheduled Quantum Entropy Harvester

Continuously harvests real quantum entropy from qBraid (IBM Fez / Marrakesh)
into an ever-growing pool file. Runs as a background daemon or cron-triggered
one-shot.

Usage:
    # Daemon mode (runs forever, harvests every INTERVAL seconds):
    python -m zipminator.entropy.scheduler --daemon --interval 3600

    # One-shot (harvest once, then exit; suitable for cron):
    python -m zipminator.entropy.scheduler --once

    # Crontab example (every 6 hours):
    # 0 */6 * * * /path/to/micromamba run -n zip-pqc python -m zipminator.entropy.scheduler --once

Environment:
    QBRAID_API_KEY    Required for real quantum hardware
    ZIPMINATOR_ENTROPY_INTERVAL  Override default interval (seconds, default 3600)
"""

import hashlib
import json
import logging
import math
import os
import secrets
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# --- Configuration ---
TARGET_BYTES_PER_CYCLE = 1024 * 50  # 50 KB per harvest cycle
BYTES_PER_SHOT = 15
NUM_QUBITS = BYTES_PER_SHOT * 8
DEFAULT_INTERVAL = 3600  # 1 hour

BACKEND_PRIORITY = ["ibm_fez", "ibm_marrakesh"]

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
ENTROPY_DIR = PROJECT_ROOT / "quantum_entropy"
ENTROPY_POOL = ENTROPY_DIR / "quantum_entropy_pool.bin"
HARVEST_LOG = ENTROPY_DIR / "harvest_log.jsonl"


def _get_pool_size() -> int:
    """Current entropy pool size in bytes."""
    if ENTROPY_POOL.exists():
        return ENTROPY_POOL.stat().st_size
    return 0


def _append_to_pool(data: bytes) -> int:
    """Append entropy bytes to the ever-growing pool. Returns new pool size."""
    ENTROPY_DIR.mkdir(parents=True, exist_ok=True)
    with open(ENTROPY_POOL, "ab") as f:
        f.write(data)
    return _get_pool_size()


def _log_harvest(record: dict) -> None:
    """Append a harvest record to the JSONL log."""
    ENTROPY_DIR.mkdir(parents=True, exist_ok=True)
    with open(HARVEST_LOG, "a") as f:
        f.write(json.dumps(record) + "\n")


def harvest_quantum(target_bytes: int = TARGET_BYTES_PER_CYCLE) -> dict:
    """
    Harvest real quantum entropy from qBraid backends.

    Returns a dict with harvest metadata (bytes_harvested, backend, sha256, etc.).
    Falls back to os.urandom if no quantum backend is available.
    """
    pool_before = _get_pool_size()
    timestamp = datetime.now(timezone.utc).isoformat()

    # Try real quantum hardware via qBraid
    entropy_bytes = None
    backend_used = None

    qbraid_key = os.getenv("QBRAID_API_KEY")
    if qbraid_key:
        try:
            entropy_bytes, backend_used = _harvest_qbraid(qbraid_key, target_bytes)
        except Exception as e:
            logger.warning(f"Quantum harvest failed: {e}. Falling back to system entropy.")

    # Fallback: cryptographically secure system entropy
    if entropy_bytes is None:
        entropy_bytes = secrets.token_bytes(target_bytes)
        backend_used = "os.urandom"
        logger.info(f"Using system entropy fallback: {target_bytes} bytes")

    # Append to ever-growing pool (no maximum)
    pool_after = _append_to_pool(entropy_bytes)
    harvest_hash = hashlib.sha256(entropy_bytes).hexdigest()

    record = {
        "timestamp": timestamp,
        "backend": backend_used,
        "bytes_harvested": len(entropy_bytes),
        "sha256": harvest_hash,
        "pool_before": pool_before,
        "pool_after": pool_after,
    }
    _log_harvest(record)

    logger.info(
        f"Harvested {len(entropy_bytes):,} bytes from {backend_used}. "
        f"Pool: {pool_before:,} -> {pool_after:,} bytes"
    )
    return record


def _harvest_qbraid(api_key: str, target_bytes: int) -> tuple:
    """Harvest from qBraid quantum backends. Returns (bytes, backend_name)."""
    from qiskit import QuantumCircuit
    from qbraid.providers.qiskit import QbraidProvider
    from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager

    provider = QbraidProvider(qbraid_api_key=api_key)

    # Try backends in priority order
    backend = None
    backend_name = None
    for name in BACKEND_PRIORITY:
        try:
            backend = provider.get_backend(name)
            backend_name = name
            break
        except Exception:
            continue

    if backend is None:
        raise RuntimeError(f"No quantum backend available: {BACKEND_PRIORITY}")

    # Build Hadamard circuit
    qc = QuantumCircuit(NUM_QUBITS, NUM_QUBITS)
    for i in range(NUM_QUBITS):
        qc.h(i)
    qc.measure(range(NUM_QUBITS), range(NUM_QUBITS))

    # Transpile for hardware
    pm = generate_preset_pass_manager(optimization_level=1, backend=backend)
    isa_circuit = pm.run(qc)

    shots_needed = math.ceil(target_bytes / BYTES_PER_SHOT)
    job = backend.run(isa_circuit, shots=shots_needed)
    result = job.result()
    counts = result.get_counts()

    # Extract entropy from measurement outcomes
    byte_data = b""
    for bit_string in counts.keys():
        byte_data += int(bit_string, 2).to_bytes(BYTES_PER_SHOT, "big")

    return byte_data[:target_bytes], backend_name


def get_pool_stats() -> dict:
    """Get current entropy pool statistics."""
    pool_size = _get_pool_size()

    # Count harvest records
    harvest_count = 0
    last_harvest = None
    if HARVEST_LOG.exists():
        with open(HARVEST_LOG) as f:
            for line in f:
                harvest_count += 1
                try:
                    last_harvest = json.loads(line)
                except json.JSONDecodeError:
                    pass

    return {
        "pool_path": str(ENTROPY_POOL),
        "pool_size_bytes": pool_size,
        "pool_size_human": _human_bytes(pool_size),
        "total_harvests": harvest_count,
        "last_harvest": last_harvest,
    }


def _human_bytes(n: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


def run_daemon(interval: Optional[int] = None) -> None:
    """Run harvester as a continuous daemon."""
    if interval is None:
        interval = int(os.getenv("ZIPMINATOR_ENTROPY_INTERVAL", str(DEFAULT_INTERVAL)))

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    logger.info(f"Entropy harvester daemon starting (interval={interval}s)")

    while True:
        try:
            record = harvest_quantum()
            logger.info(f"Cycle complete: {record['bytes_harvested']:,} bytes from {record['backend']}")
        except Exception as e:
            logger.error(f"Harvest cycle failed: {e}")
        time.sleep(interval)


def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Zipminator Quantum Entropy Harvester")
    parser.add_argument("--daemon", action="store_true", help="Run as continuous daemon")
    parser.add_argument("--once", action="store_true", help="Harvest once and exit")
    parser.add_argument("--interval", type=int, default=None, help="Harvest interval in seconds (daemon mode)")
    parser.add_argument("--stats", action="store_true", help="Show pool statistics")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    if args.stats:
        stats = get_pool_stats()
        print(f"Pool: {stats['pool_size_human']} ({stats['pool_size_bytes']:,} bytes)")
        print(f"Path: {stats['pool_path']}")
        print(f"Harvests: {stats['total_harvests']}")
        if stats['last_harvest']:
            lh = stats['last_harvest']
            print(f"Last: {lh['timestamp']} via {lh['backend']} ({lh['bytes_harvested']:,} bytes)")
    elif args.daemon:
        run_daemon(args.interval)
    elif args.once:
        record = harvest_quantum()
        print(f"Harvested {record['bytes_harvested']:,} bytes from {record['backend']}")
        print(f"Pool now: {record['pool_after']:,} bytes")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
