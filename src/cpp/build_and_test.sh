#!/bin/bash
# Build and test Kyber-768 C++ implementation
# This script verifies the gold standard implementation

set -e  # Exit on error

echo "======================================"
echo "Kyber-768 C++ Build and Test Script"
echo "======================================"
echo ""

# Check for AVX2 support
echo "[1/5] Checking AVX2 support..."
if [ "$(uname)" == "Darwin" ]; then
    if sysctl -a | grep -q "machdep.cpu.features.*AVX2"; then
        echo "✅ AVX2 supported"
    else
        echo "⚠️  AVX2 not detected (build may fail or be slow)"
    fi
elif [ "$(uname)" == "Linux" ]; then
    if grep -q avx2 /proc/cpuinfo; then
        echo "✅ AVX2 supported"
    else
        echo "⚠️  AVX2 not detected (build may fail or be slow)"
    fi
fi
echo ""

# Check compiler
echo "[2/5] Checking compiler..."
if command -v g++ &> /dev/null; then
    GCC_VERSION=$(g++ --version | head -n1)
    echo "✅ Found: $GCC_VERSION"
elif command -v clang++ &> /dev/null; then
    CLANG_VERSION=$(clang++ --version | head -n1)
    echo "✅ Found: $CLANG_VERSION"
else
    echo "❌ No C++ compiler found (g++ or clang++ required)"
    exit 1
fi
echo ""

# Clean previous build
echo "[3/5] Cleaning previous build..."
make clean 2>/dev/null || true
echo "✅ Clean complete"
echo ""

# Build
echo "[4/5] Building Kyber-768 with AVX2 optimization..."
if make all; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi
echo ""

# Run tests
echo "[5/5] Running unit tests..."
echo "======================================"
if make check; then
    echo "======================================"
    echo ""
    echo "✅ ALL TESTS PASSED"
    echo ""
    echo "Gold Standard Implementation Complete!"
    echo "Ready for Rust and Mojo comparison."
else
    echo "======================================"
    echo ""
    echo "❌ TESTS FAILED"
    exit 1
fi
echo ""

# Show file sizes
echo "Build artifacts:"
ls -lh libkyber768.* test_kyber768 2>/dev/null || true
echo ""

echo "======================================"
echo "Next Steps:"
echo "1. Run: make benchmark"
echo "2. Integrate QRNG interface"
echo "3. Add NIST KAT validation"
echo "4. Run dudect timing analysis"
echo "======================================"
