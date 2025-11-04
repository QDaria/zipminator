import os
import math
from dotenv import load_dotenv
from pathlib import Path  # <-- IMPORT PATHLIB
from qiskit import QuantumCircuit
from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2 as Sampler
from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager

# --- Configuration ---
# TARGET_BYTES = 15  # <-- START WITH 1 SHOT (15 bytes) FOR TESTING
# TARGET_BYTES = 3000  # <-- Max for demo (~9 mins)
TARGET_BYTES = 15 * 50  # <-- 750 Bytes for full test
BYTES_PER_SHOT = 15
NUM_QUBITS = BYTES_PER_SHOT * 8

# --- Path Fixes ---
# Find the project root (which is 2 levels up from this file)
PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = PROJECT_ROOT / ".env"
# RENAME THE OUTPUT FILE TO PRESERVE YOUR TEST FILE
OUTPUT_DIR = PROJECT_ROOT / "quantum_entropy" # <-- This is your correct path
OUTPUT_FILE = OUTPUT_DIR / "entropy_demo_750B.bin"
#OUTPUT_FILE = OUTPUT_DIR / "entropy_pool.bin"
# --------------------

def create_q_rng_circuit(num_bits):
    circuit = QuantumCircuit(num_bits, num_bits, name="qrng")
    circuit.h(range(num_bits))
    circuit.measure(range(num_bits), range(num_bits))
    return circuit

def load_credentials():
    """Loads IBM Cloud credentials securely from .env file."""
    load_dotenv(dotenv_path=ENV_PATH)  # <-- Specify .env path
    token = os.getenv("IBM_CLOUD_TOKEN")
    instance = os.getenv("IBM_CLOUD_INSTANCE")
    
    if not token or not instance:
        print("="*50)
        print(f"ERROR: Could not find .env file at {ENV_PATH}")
        print("Please create a .env file in the project root.")
        print("="*50)
        return None, None
    return token, instance

def main():
    """Main function to generate and save quantum entropy."""
    
    print("Starting Zipminator Quantum Entropy Harvester...")
    token, instance = load_credentials()
    if not token:
        return

    try:
        # --- 1. Authentication ---
        print("Connecting to IBM Quantum...")
        service = QiskitRuntimeService(channel="ibm_cloud", instance=instance, token=token)
        
        backend = service.least_busy(min_num_qubits=NUM_QUBITS, simulator=False, operational=True)
        print(f"Secured backend: {backend.name} ({backend.num_qubits} qubits)")

        # --- 2. Circuit Preparation ---
        print(f"Requesting {TARGET_BYTES} bytes of quantum entropy.")
        print(f"Using {NUM_QUBITS} qubits ({BYTES_PER_SHOT} bytes per shot).")
        
        shots_needed = math.ceil(TARGET_BYTES / BYTES_PER_SHOT)
        print(f"Calculated shots needed: {shots_needed}")

        qc = create_q_rng_circuit(NUM_QUBITS)
        
        print("Transpiling circuit for backend...")
        pm = generate_preset_pass_manager(backend=backend, optimization_level=1)
        isa_qc = pm.run(qc)

        # --- 3. Run on Quantum Hardware ---
        print("Initializing SamplerV2 in 'job' mode...")
        sampler = Sampler(mode=backend) 
        
        print(f"Sending job to {backend.name}...")
        job = sampler.run([isa_qc], shots=shots_needed)
        print(f"Job ID: {job.job_id()}. Waiting for results...")
        
        result_hw = job.result() 
        print("Job finished. Processing results...")

        # --- 4. Process and Save Data ---
        counts = result_hw[0].data.c.get_counts()
        all_bit_strings = list(counts.keys())
        
        byte_data = b''
        for bit_string in all_bit_strings:
            byte_data += int(bit_string, 2).to_bytes(BYTES_PER_SHOT, 'big')

        final_entropy = byte_data[:TARGET_BYTES]
        
        # Create the data directory if it doesn't exist
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

        with open(OUTPUT_FILE, 'wb') as f:
            f.write(final_entropy)
        
        print("\n" + "="*50)
        print("✅ SUCCESS!")
        print(f"Successfully harvested {len(final_entropy)} bytes of quantum entropy.")
        print(f"Data saved to: {OUTPUT_FILE}")
        print("="*50)

    except Exception as e:
        print(f"\nAn error occurred: {e}")

if __name__ == "__main__":
    main()