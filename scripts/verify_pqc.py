from shared.core.pqc import PQC
from shared.core.zipit import Zipndel
import os
import sys
from pathlib import Path
import pandas as pd
import pyzipper

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))


def verify_pqc():
    print("🧪 Starting PQC Verification...")

    # 1. Generate Keys
    print("🔑 Generating Kyber768 Keypair...")
    pqc = PQC(level=768)
    pk, sk = pqc.generate_keypair()

    with open("public_key.bin", "wb") as f:
        f.write(pk)
    with open("secret_key.bin", "wb") as f:
        f.write(sk)
    print("✅ Keys saved to public_key.bin and secret_key.bin")

    # 2. Create Dummy Data
    data = {'Secret': ['Data', 'For', 'Quantum', 'Eyes', 'Only']}
    df = pd.DataFrame(data)
    csv_file = "pqc_test.csv"
    df.to_csv(csv_file, index=False)

    # 3. Encrypt with Zipndel + PQC
    print("🚀 Encrypting with Zipndel (PQC Mode)...")
    zipper = Zipndel(
        file_name=csv_file,
        public_key_file="public_key.bin"
    )
    zipper.zipit(df)

    zip_file = f"{csv_file}.zip"
    kyber_file = f"{zip_file}.kyber"

    if os.path.exists(zip_file) and os.path.exists(kyber_file):
        print(f"✅ Encrypted files created: {zip_file}, {kyber_file}")
    else:
        print("❌ Failed to create encrypted files.")
        return

    # 4. Decrypt
    print("🔓 Decrypting...")

    # Read ciphertext
    with open(kyber_file, "rb") as f:
        ciphertext = f.read()

    # Decapsulate to get password
    shared_secret = pqc.decapsulate(sk, ciphertext)
    password = shared_secret.hex()
    print(f"   Recovered Password: {password[:16]}...")

    # Unzip
    try:
        with pyzipper.AESZipFile(zip_file) as zf:
            zf.setpassword(password.encode('utf-8'))
            # Extract to 'restored' folder
            zf.extractall("restored")

        # Verify content
        restored_file = Path("restored") / csv_file
        if restored_file.exists():
            df_restored = pd.read_csv(restored_file)
            if df_restored.equals(df):
                print("✅ Decryption Successful! Data matches.")
            else:
                print("❌ Data mismatch!")
        else:
            print("❌ Extraction failed (file not found).")

    except Exception as e:
        print(f"❌ Decryption Failed: {e}")

    # Cleanup
    # os.remove(csv_file)
    # os.remove(zip_file)
    # os.remove(kyber_file)
    # shutil.rmtree("restored")


if __name__ == "__main__":
    verify_pqc()
