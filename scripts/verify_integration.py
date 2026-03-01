from shared.core.quantum_random import QuantumRandom
from shared.core.zipit import Zipndel
import os
import sys
from pathlib import Path
import pandas as pd
import shutil

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))


def verify_integration():
    print("🧪 Starting Integration Verification...")

    # 1. Setup Dummy Entropy Pool
    entropy_dir = PROJECT_ROOT / "quantum_entropy"
    entropy_dir.mkdir(exist_ok=True)
    pool_file = entropy_dir / "entropy_pool.bin"

    # Create a dummy pool with 1KB of data
    dummy_entropy = os.urandom(1024)
    with open(pool_file, "wb") as f:
        f.write(dummy_entropy)
    print(f"✅ Created dummy entropy pool at {pool_file}")

    # 2. Verify QuantumRandom reads from pool
    qrand = QuantumRandom()
    if qrand._has_quantum_access:
        print("✅ QuantumRandom has quantum access enabled.")
        bytes_val = qrand._get_random_bytes(10)
        print(f"   Sample bytes: {bytes_val.hex()}")
        # Verify it consumed from pool (pool size should be same in file, but memory pool decreased)
        # We can't easily check memory pool state from here without accessing private members
    else:
        print("⚠️ QuantumRandom does NOT have quantum access (check license/env var).")
        # Force enable for testing if needed, but let's see default behavior

    # 3. Create Dummy Data for Zipndel
    data = {
        'Name': ['Alice', 'Bob', 'Charlie'],
        'Email': ['alice@example.com', 'bob@example.com', 'charlie@example.com'],
        'Age': [25, 30, 35],
        'Salary': [50000, 60000, 70000]
    }
    df = pd.DataFrame(data)
    csv_file = "test_data.csv"
    df.to_csv(csv_file, index=False)
    print(f"✅ Created dummy CSV: {csv_file}")

    # 4. Run Zipndel with Anonymization
    # We use a fixed password to avoid interactive prompt
    zipper = Zipndel(
        file_name=csv_file,
        password="securepassword",
        anonymize_columns=['Name', 'Email'],  # Level 1 default (hashing)
        # Level 2 uses random replacement (QuantumRandom)
        anonymization_level=2
    )

    print("🚀 Running Zipndel...")
    try:
        zipper.zipit(df)
        print("✅ Zipndel completed successfully.")
    except Exception as e:
        print(f"❌ Zipndel failed: {e}")
        import traceback
        traceback.print_exc()

    # 5. Verify Output
    zip_file = f"{csv_file}.zip"
    if not os.path.exists(zip_file):
        # Try alternative name logic
        zip_file = "test_data.zip"

    if os.path.exists(zip_file):
        print(f"✅ Output file created: {zip_file}")
        # Clean up
        os.remove(zip_file)
    else:
        print(f"❌ Output file NOT found: {zip_file}")
        print("Current directory contents:")
        for f in os.listdir("."):
            print(f" - {f}")

    # Clean up
    if os.path.exists(csv_file):
        os.remove(csv_file)
    # Don't remove entropy pool, useful for inspection


if __name__ == "__main__":
    # Set env var to force quantum enabled if needed, though license default is FREE
    # We need to simulate a tier that has access or set ZIPMINATOR_QUANTUM_ENABLED
    os.environ["ZIPMINATOR_QUANTUM_ENABLED"] = "true"
    verify_integration()
