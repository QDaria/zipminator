#!/usr/bin/env python3
"""Test Zipminator installation - Run this to verify everything works."""

import sys
import pandas as pd
from pathlib import Path

print("=" * 60)
print("ZIPMINATOR INSTALLATION TEST")
print("=" * 60)

# Test 1: Import zipminator-nav
print("\n1. Testing zipminator-nav import...")
try:
    from zipminator import Zipndel, Unzipndel
    print("   ✅ zipminator-nav imported successfully")
except ImportError as e:
    print(f"   ❌ Failed to import: {e}")
    print("   Run: pip install -e /Users/mos/dev/zipminator/zipminator-nav")
    sys.exit(1)

# Test 2: Create sample DataFrame
print("\n2. Creating test DataFrame...")
df = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie'],
    'ssn': ['13048212345', '23119012345', '15038512345'],  # Norwegian fødselsnummer
    'email': ['alice@example.com', 'bob@example.com', 'charlie@example.com'],
    'salary': [75000, 85000, 95000]
})
print(f"   ✅ Created DataFrame with {len(df)} rows")
print(df)

# Test 3: Test Zipndel (encryption)
print("\n3. Testing Zipndel (encryption)...")
try:
    output_dir = Path('/tmp/zipminator_test')
    output_dir.mkdir(exist_ok=True)

    zipper = Zipndel(
        file_name='test_data',
        password='SecurePassword123',
        output_dir=str(output_dir),
        mask_columns=['ssn'],  # Mask fødselsnummer
        anonymize_columns=['name'],  # Anonymize names
        self_destruct_time=(24, 0, 0),  # 24 hours
        compliance_check=True,
        audit_trail=True
    )

    zipper.zipit(df)
    print(f"   ✅ Encrypted and saved to {output_dir}/test_data.zip")

    # Check file exists
    zip_file = output_dir / 'test_data.zip'
    if zip_file.exists():
        print(f"   ✅ Verified file exists ({zip_file.stat().st_size} bytes)")
    else:
        print(f"   ❌ File not found: {zip_file}")

except Exception as e:
    print(f"   ❌ Encryption failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 4: Test Unzipndel (decryption)
print("\n4. Testing Unzipndel (decryption)...")
try:
    # Manually provide password (bypass getpass for testing)
    import getpass
    original_getpass = getpass.getpass
    getpass.getpass = lambda prompt='Password: ': 'SecurePassword123'

    unzipper = Unzipndel(
        file_name='test_data',
        file_format='csv',
        input_dir=str(output_dir)
    )

    df_decrypted = unzipper.unzipit()

    # Restore original getpass
    getpass.getpass = original_getpass

    print(f"   ✅ Decrypted successfully ({len(df_decrypted)} rows)")
    print(df_decrypted)

except Exception as e:
    print(f"   ❌ Decryption failed: {e}")
    import traceback
    traceback.print_exc()

# Test 5: Test PII detection
print("\n5. Testing Norwegian PII detection...")
try:
    from zipminator.regex_patterns import personnummer_regex
    import re

    test_text = "My fødselsnummer is 13048212345 and my email is test@example.com"
    matches = re.findall(personnummer_regex, test_text)

    if matches:
        print(f"   ✅ Detected {len(matches)} fødselsnummer: {matches}")
    else:
        print("   ⚠️  No fødselsnummer detected")

except Exception as e:
    print(f"   ❌ PII detection failed: {e}")

# Test 6: Test Rust CLI (if available)
print("\n6. Testing Rust CLI binary...")
import subprocess

try:
    result = subprocess.run(
        ['/usr/local/bin/zipminator', '--version'],
        capture_output=True,
        text=True,
        timeout=5
    )

    if result.returncode == 0:
        print(f"   ✅ Rust CLI works: {result.stdout.strip()}")
    else:
        print(f"   ❌ Rust CLI failed: {result.stderr}")

except FileNotFoundError:
    print("   ⚠️  Rust CLI not found at /usr/local/bin/zipminator")
    print("   Run: sudo cp /Users/mos/dev/zipminator/cli/target/release/zipminator /usr/local/bin/")
except Exception as e:
    print(f"   ❌ Error testing Rust CLI: {e}")

# Test 7: Test Kyber768 keygen via CLI
print("\n7. Testing Kyber768 key generation...")
try:
    result = subprocess.run(
        ['/usr/local/bin/zipminator', 'keygen', '--output', '/tmp/test_kyber_keys'],
        capture_output=True,
        text=True,
        timeout=10
    )

    if result.returncode == 0:
        print("   ✅ Kyber768 keygen successful")
        print(result.stdout)

        # Check keys exist
        if Path('/tmp/public_key.bin').exists():
            size = Path('/tmp/public_key.bin').stat().st_size
            print(f"   ✅ Public key: {size} bytes (expected: 1184 bytes)")
        if Path('/tmp/secret_key.bin').exists():
            size = Path('/tmp/secret_key.bin').stat().st_size
            print(f"   ✅ Secret key: {size} bytes (expected: 2400 bytes)")
    else:
        print(f"   ❌ Kyber768 keygen failed: {result.stderr}")

except Exception as e:
    print(f"   ❌ Keygen test failed: {e}")

print("\n" + "=" * 60)
print("INSTALLATION TEST COMPLETE")
print("=" * 60)
print("\n✅ If all tests passed, Zipminator is ready to use!")
print("❌ If any tests failed, check error messages above.")
