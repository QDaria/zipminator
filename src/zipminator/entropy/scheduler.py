"""
Scheduled Quantum Entropy Harvester

Continuously harvests real quantum entropy from IBM Fez / Marrakesh
156-qubit Heron r2 processors (via qBraid or direct IBM Quantum Platform)
into an ever-growing pool file. Runs as a background daemon or launchd
scheduled task.

Usage:
    # Daemon mode (runs forever, harvests every INTERVAL seconds):
    python -m zipminator.entropy.scheduler --daemon --interval 3600

    # One-shot (harvest once, then exit; suitable for cron/launchd):
    python -m zipminator.entropy.scheduler --once

    # Check pool stats:
    python -m zipminator.entropy.scheduler --stats

    # launchd (macOS): ~/Library/LaunchAgents/com.qdaria.entropy-harvester.plist
    # Wrapper script: scripts/harvest-entropy.sh

Environment:
    QBRAID_API_KEY                qBraid API key (primary, free Fez/Marrakesh access)
    IBM_CLOUD_TOKEN               IBM Quantum Platform API token (secondary/fallback)
    ZIPMINATOR_ENTROPY_INTERVAL   Override default interval (seconds, default 3600)
    ZIPMINATOR_ENTROPY_DIR        Override entropy directory path
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
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

# --- Configuration ---
TARGET_BYTES_PER_CYCLE = 1024 * 50  # 50 KB per harvest cycle
NUM_QUBITS = 120  # Use 120 of the 156 available qubits (avoids edge effects)
DEFAULT_INTERVAL = 3600  # 1 hour
LOW_POOL_THRESHOLD = 1024 * 100  # 100 KB -- trigger warning below this

BACKEND_PRIORITY = ["ibm_fez", "ibm_marrakesh", "ibm_kingston", "ibm_aachen"]

# IBM QPU Budget Guard: 10 min/month free tier, keep 2 min buffer
DEFAULT_QPU_BUDGET_SECONDS = 480  # 8 min of 10 min free tier
QPU_SECONDS_PER_SHOT = 0.001  # Conservative estimate: 1ms/shot (overestimates 2-5x)
QPU_WARNING_THRESHOLD = 0.75  # Warn at 75% budget consumed

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
ENTROPY_DIR = Path(os.getenv("ZIPMINATOR_ENTROPY_DIR", str(PROJECT_ROOT / "quantum_entropy")))
ENTROPY_POOL = ENTROPY_DIR / "quantum_entropy_pool.bin"
HARVEST_LOG = ENTROPY_DIR / "harvest_log.jsonl"
BUDGET_FILE = ENTROPY_DIR / "ibm_budget.json"


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


# --- IBM QPU Budget Guard ---

def _get_qpu_budget() -> float:
    """Max QPU seconds per month. Override with IBM_QPU_BUDGET_SECONDS env var."""
    return float(os.getenv("IBM_QPU_BUDGET_SECONDS", str(DEFAULT_QPU_BUDGET_SECONDS)))


def _current_month() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


def _load_budget() -> dict:
    """Load budget tracking for current month. Resets on month rollover."""
    month = _current_month()
    if BUDGET_FILE.exists():
        try:
            with open(BUDGET_FILE) as f:
                data = json.load(f)
            if data.get("month") == month:
                return data
        except (json.JSONDecodeError, KeyError):
            pass
    # New month or corrupted file: reset
    return {"month": month, "cumulative_seconds": 0.0, "jobs": []}


def _save_budget(data: dict) -> None:
    ENTROPY_DIR.mkdir(parents=True, exist_ok=True)
    with open(BUDGET_FILE, "w") as f:
        json.dump(data, f, indent=2)


def _estimate_qpu_seconds(shots: int) -> float:
    """Conservative estimate of QPU time for a given number of shots."""
    return shots * QPU_SECONDS_PER_SHOT


def _check_budget(estimated_seconds: float) -> bool:
    """Return True if submitting this job stays within budget. Logs warnings."""
    budget = _load_budget()
    limit = _get_qpu_budget()
    used = budget["cumulative_seconds"]
    projected = used + estimated_seconds

    if projected > limit:
        logger.error(
            "IBM QPU BUDGET EXCEEDED: used=%.1fs + estimated=%.1fs = %.1fs > limit=%.1fs. "
            "Skipping quantum harvest to protect free tier. "
            "Override with IBM_QPU_BUDGET_SECONDS env var.",
            used, estimated_seconds, projected, limit,
        )
        return False

    if used / limit >= QPU_WARNING_THRESHOLD:
        logger.warning(
            "IBM QPU budget at %.0f%%: %.1fs of %.1fs used this month (%s)",
            (used / limit) * 100, used, limit, budget["month"],
        )

    return True


def _record_qpu_usage(backend_name: str, shots: int, actual_seconds: Optional[float]) -> None:
    """Record actual QPU usage after a job completes."""
    budget = _load_budget()
    seconds = actual_seconds if actual_seconds is not None else _estimate_qpu_seconds(shots)
    budget["cumulative_seconds"] += seconds
    budget["jobs"].append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "backend": backend_name,
        "shots": shots,
        "seconds": seconds,
        "source": "actual" if actual_seconds is not None else "estimated",
    })
    _save_budget(budget)
    limit = _get_qpu_budget()
    logger.info(
        "QPU usage recorded: %.1fs for %d shots on %s. Month total: %.1fs / %.1fs (%.0f%%)",
        seconds, shots, backend_name, budget["cumulative_seconds"],
        limit, (budget["cumulative_seconds"] / limit) * 100,
    )


def get_budget_status() -> dict:
    """Get current IBM QPU budget status for display."""
    budget = _load_budget()
    limit = _get_qpu_budget()
    used = budget["cumulative_seconds"]
    return {
        "month": budget["month"],
        "used_seconds": used,
        "budget_seconds": limit,
        "remaining_seconds": max(0, limit - used),
        "percent_used": (used / limit) * 100 if limit > 0 else 0,
        "jobs_this_month": len(budget["jobs"]),
    }


def harvest_quantum(target_bytes: int = TARGET_BYTES_PER_CYCLE) -> dict:
    """
    Harvest real quantum entropy from IBM Fez/Marrakesh backends.

    Priority:
        1. qBraid (free access to IBM Fez/Marrakesh, via QBRAID_API_KEY)
        2. IBM Quantum Platform direct (via IBM_CLOUD_TOKEN)
        3. os.urandom fallback (cryptographically secure, but not quantum)

    Returns a dict with harvest metadata.
    """
    pool_before = _get_pool_size()
    timestamp = datetime.now(timezone.utc).isoformat()

    entropy_bytes = None
    backend_used = None

    # 1. Try qBraid (primary -- free access to IBM Fez/Marrakesh)
    qbraid_key = os.getenv("QBRAID_API_KEY")
    if qbraid_key and entropy_bytes is None:
        try:
            entropy_bytes, backend_used = _harvest_qbraid(qbraid_key, target_bytes)
        except Exception as e:
            logger.warning("qBraid harvest failed: %s", e)

    # 2. Try IBM Quantum Platform directly (secondary)
    ibm_token = os.getenv("IBM_CLOUD_TOKEN")
    if ibm_token and entropy_bytes is None:
        try:
            entropy_bytes, backend_used = _harvest_ibm(ibm_token, target_bytes)
        except Exception as e:
            logger.warning("IBM Quantum harvest failed: %s", e)

    # 3. Fallback: cryptographically secure system entropy
    if entropy_bytes is None:
        entropy_bytes = secrets.token_bytes(target_bytes)
        backend_used = "os.urandom"
        logger.info("Using system entropy fallback: %d bytes", target_bytes)

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

    if pool_after < LOW_POOL_THRESHOLD:
        logger.warning(
            "Pool is low: %s. Consider increasing harvest frequency.",
            _human_bytes(pool_after),
        )

    logger.info(
        "Harvested %s from %s. Pool: %s -> %s",
        _human_bytes(len(entropy_bytes)),
        backend_used,
        _human_bytes(pool_before),
        _human_bytes(pool_after),
    )
    return record


def _harvest_ibm(token: str, target_bytes: int) -> Tuple[bytes, str]:
    """Harvest from IBM Quantum via qiskit-ibm-runtime SamplerV2.

    Includes QPU budget guard: estimates QPU time before submitting,
    aborts if it would exceed the monthly free-tier limit (default 8 min
    of the 10 min free tier, configurable via IBM_QPU_BUDGET_SECONDS).
    """
    from qiskit.circuit import QuantumCircuit
    from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2
    from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager

    bytes_per_shot = NUM_QUBITS // 8
    shots_needed = math.ceil(target_bytes / bytes_per_shot)

    # --- Budget pre-flight check ---
    estimated_seconds = _estimate_qpu_seconds(shots_needed)
    if not _check_budget(estimated_seconds):
        raise RuntimeError(
            f"IBM QPU budget would be exceeded: need ~{estimated_seconds:.1f}s for {shots_needed} shots. "
            f"Budget status: {get_budget_status()}"
        )

    svc = QiskitRuntimeService(channel="ibm_quantum_platform", token=token)

    # Find best available backend from priority list
    backend = None
    backend_name = None
    available = {b.name for b in svc.backends(operational=True)}
    for name in BACKEND_PRIORITY:
        if name in available:
            backend = svc.backend(name)
            backend_name = name
            break

    if backend is None:
        raise RuntimeError(f"No operational backend in {BACKEND_PRIORITY}. Available: {available}")

    logger.info("Using backend %s (%d qubits)", backend_name, backend.num_qubits)

    # Hadamard circuit: apply H to all qubits, then measure.
    # Each shot produces NUM_QUBITS truly random bits from Born's rule.
    qc = QuantumCircuit(NUM_QUBITS)
    qc.h(range(NUM_QUBITS))
    qc.measure_all()

    # Transpile for the target hardware topology
    pm = generate_preset_pass_manager(optimization_level=1, backend=backend)
    isa_circuit = pm.run(qc)

    # IBM caps at 100_000 shots per job; split if needed
    max_shots = 100_000

    byte_data = b""
    remaining_shots = shots_needed
    total_qpu_seconds = 0.0

    while remaining_shots > 0:
        batch = min(remaining_shots, max_shots)

        # Per-batch budget check (catches multi-batch overruns)
        batch_estimate = _estimate_qpu_seconds(batch)
        if not _check_budget(batch_estimate):
            logger.warning(
                "Budget limit hit mid-harvest after %d of %d shots. Returning partial data.",
                shots_needed - remaining_shots, shots_needed,
            )
            break

        sampler = SamplerV2(mode=backend)
        job = sampler.run([isa_circuit], shots=batch)
        logger.info("Submitted job %s (%d shots) to %s", job.job_id(), batch, backend_name)

        result = job.result()

        # Extract actual QPU time from job metadata if available
        actual_seconds = None
        try:
            metadata = result[0].metadata
            if "execution" in metadata:
                actual_seconds = metadata["execution"].get("execution_spans_duration")
            elif "time_taken" in metadata:
                actual_seconds = metadata["time_taken"]
        except (AttributeError, IndexError, KeyError, TypeError):
            pass

        # Record usage (actual if available, estimated otherwise)
        _record_qpu_usage(backend_name, batch, actual_seconds)
        total_qpu_seconds += actual_seconds if actual_seconds else batch_estimate

        bitstrings = result[0].data.meas.get_bitstrings()
        for bs in bitstrings:
            byte_data += int(bs, 2).to_bytes(bytes_per_shot, "big")

        remaining_shots -= batch

    logger.info(
        "IBM harvest complete: %d bytes, ~%.1fs QPU time on %s",
        len(byte_data[:target_bytes]), total_qpu_seconds, backend_name,
    )
    return byte_data[:target_bytes], backend_name


def _harvest_qbraid(api_key: str, target_bytes: int) -> Tuple[bytes, str]:
    """Harvest from qBraid quantum backends (Fez/Marrakesh via qBraid SDK v0.8).

    Subject to the same QPU budget guard as _harvest_ibm (qBraid routes to
    the same IBM hardware, so the QPU time counts against the same free tier).
    """
    import warnings
    warnings.filterwarnings("ignore", category=UserWarning, module="qbraid")
    warnings.filterwarnings("ignore", category=UserWarning, module="qbraid_core")
    import qbraid
    from qiskit.circuit import QuantumCircuit

    bytes_per_shot = NUM_QUBITS // 8
    shots_needed = math.ceil(target_bytes / bytes_per_shot)

    # --- Budget pre-flight check ---
    estimated_seconds = _estimate_qpu_seconds(shots_needed)
    if not _check_budget(estimated_seconds):
        raise RuntimeError(
            f"IBM QPU budget would be exceeded via qBraid: need ~{estimated_seconds:.1f}s for {shots_needed} shots. "
            f"Budget status: {get_budget_status()}"
        )

    provider = qbraid.QbraidProvider(api_key=api_key)

    # Find first available backend from priority list
    device = None
    device_name = None
    for name in BACKEND_PRIORITY:
        try:
            d = provider.get_device(name)
            if d.status().name == "ONLINE":
                device = d
                device_name = name
                break
        except Exception:
            continue

    if device is None:
        raise RuntimeError(f"No online qBraid backend in {BACKEND_PRIORITY}")

    logger.info("Using qBraid device %s (%d qubits, queue=%d)",
                device_name, device.num_qubits, device.queue_depth())

    # Hadamard circuit: H on every qubit, then measure all.
    qc = QuantumCircuit(NUM_QUBITS)
    qc.h(range(NUM_QUBITS))
    qc.measure_all()

    # Convert to OpenQASM 2.0 and submit via qBraid's submit endpoint.
    from qiskit.qasm2 import dumps as qasm2_dumps
    qasm_str = qasm2_dumps(qc)
    payload = {"openQasm": qasm_str}
    job = device.submit(payload, shots=shots_needed)
    logger.info("Submitted qBraid job %s (%d shots) to %s",
                getattr(job, 'id', 'unknown'), shots_needed, device_name)

    result = job.result()

    # Record QPU usage (qBraid doesn't expose exact QPU time, use estimate)
    _record_qpu_usage(f"qbraid:{device_name}", shots_needed, None)

    # Extract bitstrings from result
    byte_data = b""
    if hasattr(result, 'get_counts'):
        counts = result.get_counts()
        for bit_string, count in counts.items():
            bs = bit_string.replace(" ", "")
            chunk = int(bs, 2).to_bytes(bytes_per_shot, "big")
            byte_data += chunk * count
    elif hasattr(result, 'measurements'):
        for bits in result.measurements:
            bs = "".join(str(b) for b in bits)
            byte_data += int(bs, 2).to_bytes(bytes_per_shot, "big")
    else:
        raise RuntimeError(f"Unknown result format: {type(result)}")

    return byte_data[:target_bytes], f"qbraid:{device_name}"


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
    parser.add_argument("--budget", action="store_true", help="Show IBM QPU budget status")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    if args.budget:
        status = get_budget_status()
        print(f"IBM QPU Budget — {status['month']}")
        print(f"  Used:      {status['used_seconds']:.1f}s ({status['percent_used']:.1f}%)")
        print(f"  Budget:    {status['budget_seconds']:.0f}s ({status['budget_seconds']/60:.0f} min)")
        print(f"  Remaining: {status['remaining_seconds']:.1f}s ({status['remaining_seconds']/60:.1f} min)")
        print(f"  Jobs:      {status['jobs_this_month']}")
    elif args.stats:
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
