import os
import hashlib
import math
from dotenv import load_dotenv
from pathlib import Path
from qiskit import QuantumCircuit
# Use qBraid provider to access IBM backends for free
from qbraid.providers.qiskit import QbraidProvider
from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager

# --- Configuration ---
# Harvesting continuously to build a massive entropy pool
TARGET_BYTES = 1024 * 50  # 50 KB per harvest cycle
BYTES_PER_SHOT = 15
NUM_QUBITS = BYTES_PER_SHOT * 8

# Backend preference order (156-qubit Eagle r3 processors)
BACKEND_PRIORITY = ["ibm_q_marrakesh", "ibm_q_fez"]

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = PROJECT_ROOT / ".env"
OUTPUT_DIR = PROJECT_ROOT / "quantum_entropy"
OUTPUT_FILE = OUTPUT_DIR / "quantum_entropy_pool.bin"


def _connect_backend(provider):
    """Try each backend in priority order, return the first that connects."""
    for backend_name in BACKEND_PRIORITY:
        try:
            print(f"📡 Trying qBraid backend: {backend_name}...")
            backend = provider.get_backend(backend_name)
            print(f"✅ Connected to {backend_name}")
            return backend, backend_name
        except Exception as e:
            print(f"⚠️  {backend_name} unavailable: {e}")
    raise RuntimeError(
        f"All backends failed: {', '.join(BACKEND_PRIORITY)}. "
        "Check qBraid account status and backend availability."
    )


def main():
    load_dotenv(ENV_PATH)
    qbraid_api_key = os.getenv("QBRAID_API_KEY")

    if not qbraid_api_key:
        print("❌ ERROR: QBRAID_API_KEY environment variable not found in .env!")
        return

    try:
        print("🚀 Initializing qBraid Provider...")
        provider = QbraidProvider(qbraid_api_key=qbraid_api_key)

        # Connect to best available backend (Marrakesh first, then Fez)
        backend, backend_name = _connect_backend(provider)

        print(f"🏗️ Building {NUM_QUBITS}-qubit Quantum Hadamard Circuit...")
        qc = QuantumCircuit(NUM_QUBITS, NUM_QUBITS)
        for i in range(NUM_QUBITS):
            qc.h(i)
        qc.measure(range(NUM_QUBITS), range(NUM_QUBITS))

        print("⚙️ Transpiling for hardware...")
        pm = generate_preset_pass_manager(optimization_level=1, backend=backend)
        isa_circuit = pm.run(qc)

        shots_needed = math.ceil(TARGET_BYTES / BYTES_PER_SHOT)
        print(f"📤 Submitting job to qBraid ({backend_name}) for {shots_needed} shots...")

        job = backend.run(isa_circuit, shots=shots_needed)
        print(f"⏳ Job ID: {job.job_id()}. Waiting for execution...")

        result = job.result()
        counts = result.get_counts()

        all_bit_strings = list(counts.keys())
        byte_data = b''
        for bit_string in all_bit_strings:
            byte_data += int(bit_string, 2).to_bytes(BYTES_PER_SHOT, 'big')

        final_entropy = byte_data[:TARGET_BYTES]

        # SHA-256 integrity hash for this harvest cycle
        harvest_hash = hashlib.sha256(final_entropy).hexdigest()

        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

        # Record pool size before append
        pool_before = OUTPUT_FILE.stat().st_size if OUTPUT_FILE.exists() else 0

        # APPEND TO THE POOL (ever-increasing, no maximum limit)
        with open(OUTPUT_FILE, 'ab') as f:
            f.write(final_entropy)

        pool_after = OUTPUT_FILE.stat().st_size

        print("\n" + "=" * 60)
        print("✅ HARVEST COMPLETE")
        print(f"  Backend        : {backend_name}")
        print(f"  Harvested      : {len(final_entropy):,} bytes")
        print(f"  SHA-256        : {harvest_hash}")
        print(f"  Pool Before    : {pool_before:,} bytes")
        print(f"  Pool After     : {pool_after:,} bytes")
        print(f"  Pool Location  : {OUTPUT_FILE}")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Harvest failed: {e}")

if __name__ == "__main__":
    main()