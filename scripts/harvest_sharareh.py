#!/usr/bin/env python3
"""
Harvest real quantum entropy from IBM via Sharareh's QDaria account.
Budget: MAX 8 minutes execution time (out of 10 min free tier).
Uses 156 qubits × 4096 shots per job for maximum entropy yield.
"""
import json
import hashlib
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# Budget: ~5.5 min remaining (used ~54s from parsing-fail attempts).
# Stop at 330s to stay safely under 8 min total.
MAX_EXECUTION_SECONDS = 330
QUBITS = 156
SHOTS = 4096
POOL_PATH = Path(__file__).parent.parent / "quantum_entropy" / "quantum_entropy_pool.bin"
LOG_PATH = Path(__file__).parent.parent / "quantum_entropy" / "harvest_log.jsonl"

def main():
    from qiskit import QuantumCircuit
    from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager
    from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2

    # Sharareh's API key
    api_key = "0fZ6_nNKPvCqcSZkm4fbvIcqqRCd1sOCWOo_yXRgeZXw"

    print(f"IBM Quantum Entropy Harvester (Sharareh/QDaria)")
    print(f"Budget: {MAX_EXECUTION_SECONDS}s execution time")
    print(f"Circuit: {QUBITS} qubits × {SHOTS} shots")
    print(f"Expected: ~{QUBITS * SHOTS // 8:,} bytes/job")
    print("=" * 60)

    # Connect
    service = QiskitRuntimeService(
        channel="ibm_quantum_platform",
        token=api_key,
    )
    print("Connected to IBM Quantum")

    # Pick least busy backend with 156+ qubits
    backends = service.backends(
        min_num_qubits=QUBITS,
        simulator=False,
        operational=True,
    )
    if not backends:
        # Fall back to 133q if no 156q available
        print("No 156q backends available, trying 133q...")
        backends = service.backends(
            min_num_qubits=127,
            simulator=False,
            operational=True,
        )

    if not backends:
        print("ERROR: No backends available")
        sys.exit(1)

    # Sort by queue length (least busy first)
    backend = min(backends, key=lambda b: b.status().pending_jobs)
    actual_qubits = min(QUBITS, backend.num_qubits)
    print(f"Selected: {backend.name} ({backend.num_qubits}q, "
          f"queue={backend.status().pending_jobs})")

    # Build circuit and transpile to backend's native gate set
    qc = QuantumCircuit(actual_qubits, actual_qubits)
    qc.h(range(actual_qubits))
    qc.measure(range(actual_qubits), range(actual_qubits))

    print(f"Transpiling to {backend.name} native gates...")
    pm = generate_preset_pass_manager(backend=backend, optimization_level=1)
    isa_circuit = pm.run(qc)
    print(f"Transpiled: depth={isa_circuit.depth()}, "
          f"gates={dict(isa_circuit.count_ops())}")

    bytes_per_job = actual_qubits * SHOTS // 8
    print(f"Bytes per job: {bytes_per_job:,}")

    # Harvest loop
    total_execution_time = 0.0
    total_bytes = 0
    job_count = 0
    pool_before = POOL_PATH.stat().st_size if POOL_PATH.exists() else 0

    sampler = SamplerV2(mode=backend)

    while total_execution_time < MAX_EXECUTION_SECONDS:
        remaining = MAX_EXECUTION_SECONDS - total_execution_time
        if remaining < 30:
            print(f"Only {remaining:.0f}s left in budget. Stopping.")
            break

        job_count += 1
        print(f"\nJob {job_count}: Submitting {actual_qubits}q × {SHOTS} shots "
              f"(budget used: {total_execution_time:.1f}s / {MAX_EXECUTION_SECONDS}s)")

        try:
            t0 = time.time()
            job = sampler.run([isa_circuit], shots=SHOTS)
            result = job.result()
            wall_time = time.time() - t0

            # Estimate execution time (conservative: cap at 30s per job)
            est_exec = min(wall_time, 30.0)
            total_execution_time += est_exec

            # Extract entropy bytes directly from BitArray
            pub_result = result[0]
            bit_array = pub_result.data.c
            # .array is numpy uint8, shape (shots, ceil(qubits/8))
            raw = bit_array.array.tobytes()
            entropy_bytes = bytes(raw[:bytes_per_job])
            total_bytes += len(entropy_bytes)

            with open(POOL_PATH, "ab") as f:
                f.write(entropy_bytes)

            sha = hashlib.sha256(entropy_bytes).hexdigest()
            log_entry = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "source": f"ibm_quantum/{backend.name}",
                "account": "sharareh@qdaria.com",
                "job_id": job.job_id(),
                "qubits": actual_qubits,
                "shots": SHOTS,
                "entropy_bytes": len(entropy_bytes),
                "sha256": sha,
                "est_execution_time_s": est_exec,
                "cumulative_execution_s": total_execution_time,
                "pool_after": pool_before + total_bytes,
            }
            with open(LOG_PATH, "a") as f:
                f.write(json.dumps(log_entry) + "\n")

            print(f"  Harvested: {len(entropy_bytes):,} bytes "
                  f"(job: {job.job_id()}, ~{est_exec:.1f}s exec)")
            print(f"  Total: {total_bytes:,} bytes, "
                  f"budget: {total_execution_time:.1f}s / {MAX_EXECUTION_SECONDS}s")

        except Exception as e:
            print(f"  Job failed: {e}")
            if "runtime limit" in str(e).lower() or "exceeded" in str(e).lower():
                print("  Runtime limit reached. Stopping.")
                break
            consecutive_failures = getattr(main, '_failures', 0) + 1
            main._failures = consecutive_failures
            if consecutive_failures >= 3:
                print(f"  {consecutive_failures} consecutive failures. Stopping.")
                break
            continue
        else:
            main._failures = 0  # reset on success

    print(f"\n{'=' * 60}")
    print(f"DONE: {job_count} jobs, {total_bytes:,} bytes harvested")
    print(f"Execution budget used: {total_execution_time:.1f}s / {MAX_EXECUTION_SECONDS}s")
    print(f"Pool size: {POOL_PATH.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
