#!/usr/bin/env bash
# Test Zipminator wheel installation in a fresh virtual environment
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_DIR="$SCRIPT_DIR/../cli"
TEST_DIR="$SCRIPT_DIR/../tests/wheel_test"

echo "🧪 Testing Zipminator Wheel Installation"
echo "========================================"

# Create test directory
rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Find the latest wheel
WHEEL=$(ls -t "$CLI_DIR/target/wheels/zipminator-"*.whl 2>/dev/null | head -1)

if [ -z "$WHEEL" ]; then
    echo "❌ No wheel found. Please build first with: ./scripts/build_wheel.sh"
    exit 1
fi

echo "📦 Testing wheel: $(basename $WHEEL)"
echo ""

# Create virtual environment
echo "🐍 Creating fresh virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install the wheel
echo "📥 Installing wheel..."
pip install --upgrade pip
pip install "$WHEEL"

# Create test script
echo "📝 Creating test script..."
cat > test_import.py << 'EOF'
#!/usr/bin/env python3
"""Test script to verify zipminator_pqc installation"""

import sys

def test_import():
    """Test basic imports"""
    print("Testing imports...")
    try:
        from zipminator_pqc import Kyber768, PublicKey, SecretKey
        print("✅ Imports successful")
        return True
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        return False

def test_keypair():
    """Test keypair generation"""
    print("\nTesting keypair generation...")
    try:
        from zipminator_pqc import Kyber768
        kyber = Kyber768()
        pk, sk = kyber.keypair()
        print(f"✅ Keypair generated: {pk}, {sk}")
        return True
    except Exception as e:
        print(f"❌ Keypair generation failed: {e}")
        return False

def test_encapsulation():
    """Test full KEM cycle"""
    print("\nTesting KEM cycle...")
    try:
        from zipminator_pqc import Kyber768
        kyber = Kyber768()

        # Generate keypair
        pk, sk = kyber.keypair()

        # Encapsulate
        ct, ss1 = kyber.encapsulate(pk)
        print(f"  Ciphertext: {ct}")
        print(f"  Shared secret 1: {ss1}")

        # Decapsulate
        ss2 = kyber.decapsulate(ct, sk)
        print(f"  Shared secret 2: {ss2}")

        # Verify
        if ss1 == ss2:
            print("✅ KEM cycle successful - shared secrets match")
            return True
        else:
            print("❌ KEM cycle failed - shared secrets don't match")
            return False
    except Exception as e:
        print(f"❌ KEM cycle failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_serialization():
    """Test key serialization"""
    print("\nTesting serialization...")
    try:
        from zipminator_pqc import Kyber768, PublicKey, SecretKey
        kyber = Kyber768()

        # Generate keypair
        pk, sk = kyber.keypair()

        # Serialize
        pk_bytes = pk.to_bytes()
        sk_bytes = sk.to_bytes()
        print(f"  Public key: {len(pk_bytes)} bytes")
        print(f"  Secret key: {len(sk_bytes)} bytes")

        # Deserialize
        pk2 = PublicKey.from_bytes(pk_bytes)
        sk2 = SecretKey.from_bytes(sk_bytes)

        # Verify round-trip
        if pk2.to_bytes() == pk_bytes and sk2.to_bytes() == sk_bytes:
            print("✅ Serialization successful")
            return True
        else:
            print("❌ Serialization failed - round-trip mismatch")
            return False
    except Exception as e:
        print(f"❌ Serialization failed: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("Zipminator PQC Wheel Test Suite")
    print("=" * 60)

    tests = [
        test_import,
        test_keypair,
        test_encapsulation,
        test_serialization,
    ]

    results = [test() for test in tests]

    print("\n" + "=" * 60)
    print(f"Results: {sum(results)}/{len(results)} tests passed")
    print("=" * 60)

    return 0 if all(results) else 1

if __name__ == "__main__":
    sys.exit(main())
EOF

# Run tests
echo ""
echo "🧪 Running tests..."
python test_import.py
TEST_RESULT=$?

# Cleanup
deactivate

echo ""
if [ $TEST_RESULT -eq 0 ]; then
    echo "✅ All tests passed!"
    echo ""
    echo "🎉 Wheel installation verified successfully!"
else
    echo "❌ Some tests failed!"
    exit 1
fi

echo ""
echo "📝 Test environment preserved at: $TEST_DIR"
echo "   To clean up: rm -rf $TEST_DIR"
