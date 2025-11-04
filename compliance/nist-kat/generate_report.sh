#!/bin/bash

# Generate NIST KAT Validation Report
# This script aggregates test results and creates a comprehensive report

set -e

REPORT_TEMPLATE="reports/validation_report_template.md"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="reports/validation_report_${TIMESTAMP}.md"

echo "Generating NIST KAT Validation Report..."
echo "Timestamp: ${TIMESTAMP}"

# Run C++ tests and capture output
echo "Running C++ KAT tests..."
CPP_OUTPUT=$(./build/nist_kat_cpp test_vectors/kyber768.rsp 2>&1 || true)

# Run Rust tests and capture output
echo "Running Rust KAT tests..."
RUST_OUTPUT=$(cargo run --release -- test_vectors/kyber768.rsp 2>&1 || true)

# Parse results
CPP_PASSED=$(echo "$CPP_OUTPUT" | grep -o "Passed: *[0-9]*" | grep -o "[0-9]*" || echo "0")
CPP_FAILED=$(echo "$CPP_OUTPUT" | grep -o "Failed: *[0-9]*" | grep -o "[0-9]*" || echo "0")
RUST_PASSED=$(echo "$RUST_OUTPUT" | grep -o "Passed: *[0-9]*" | grep -o "[0-9]*" || echo "0")
RUST_FAILED=$(echo "$RUST_OUTPUT" | grep -o "Failed: *[0-9]*" | grep -o "[0-9]*" || echo "0")

# Calculate totals
CPP_TOTAL=$((CPP_PASSED + CPP_FAILED))
RUST_TOTAL=$((RUST_PASSED + RUST_FAILED))

# Calculate success rates
if [ $CPP_TOTAL -gt 0 ]; then
    CPP_SUCCESS=$(echo "scale=1; 100 * $CPP_PASSED / $CPP_TOTAL" | bc)
else
    CPP_SUCCESS="0.0"
fi

if [ $RUST_TOTAL -gt 0 ]; then
    RUST_SUCCESS=$(echo "scale=1; 100 * $RUST_PASSED / $RUST_TOTAL" | bc)
else
    RUST_SUCCESS="0.0"
fi

# Determine overall status
if [ $CPP_FAILED -eq 0 ] && [ $RUST_FAILED -eq 0 ] && [ $CPP_TOTAL -gt 0 ] && [ $RUST_TOTAL -gt 0 ]; then
    STATUS="PASS"
elif [ $CPP_TOTAL -eq 0 ] || [ $RUST_TOTAL -eq 0 ]; then
    STATUS="NO VECTORS"
else
    STATUS="FAIL"
fi

# Certification readiness
if [ "$STATUS" == "PASS" ]; then
    CPP_READY="YES"
    RUST_READY="YES"
else
    CPP_READY="NO"
    RUST_READY="NO"
fi

# Get system info
OS=$(uname -s)
ARCH=$(uname -m)
CPU=$(lscpu 2>/dev/null | grep "Model name" | cut -d: -f2 | xargs || echo "Unknown")
MEMORY=$(free -h 2>/dev/null | grep "Mem:" | awk '{print $2}' || echo "Unknown")

# Get compiler versions
GCC_VERSION=$(gcc --version 2>/dev/null | head -n1 || echo "Not found")
RUST_VERSION=$(rustc --version 2>/dev/null || echo "Not found")
OPENSSL_VERSION=$(openssl version 2>/dev/null || echo "Not found")

# Create report from template
cp "$REPORT_TEMPLATE" "$REPORT_FILE"

# Replace placeholders
sed -i.bak "s/YYYY-MM-DD/$(date +%Y-%m-%d)/g" "$REPORT_FILE"
sed -i.bak "s/\[PASS \/ FAIL \/ PARTIAL\]/$STATUS/g" "$REPORT_FILE"

# Replace statistics
sed -i.bak "s/| \*\*Total Test Vectors\*\* | XXX | XXX |/| **Total Test Vectors** | $CPP_TOTAL | $RUST_TOTAL |/g" "$REPORT_FILE"
sed -i.bak "s/| \*\*Passed\*\* | XXX ✓ | XXX ✓ |/| **Passed** | $CPP_PASSED ✓ | $RUST_PASSED ✓ |/g" "$REPORT_FILE"
sed -i.bak "s/| \*\*Failed\*\* | XXX | XXX |/| **Failed** | $CPP_FAILED | $RUST_FAILED |/g" "$REPORT_FILE"
sed -i.bak "s/| \*\*Success Rate\*\* | XX.X% | XX.X% |/| **Success Rate** | ${CPP_SUCCESS}% | ${RUST_SUCCESS}% |/g" "$REPORT_FILE"
sed -i.bak "s/| \*\*Certification Readiness\*\* | \[YES\/NO\] | \[YES\/NO\] |/| **Certification Readiness** | $CPP_READY | $RUST_READY |/g" "$REPORT_FILE"

# Replace system info
sed -i.bak "s/\[CPU Model\]/$CPU/g" "$REPORT_FILE"
sed -i.bak "s/x86_64 \/ ARM64/$ARCH/g" "$REPORT_FILE"
sed -i.bak "s/\[RAM size\]/$MEMORY/g" "$REPORT_FILE"
sed -i.bak "s/\[OS and version\]/$OS/g" "$REPORT_FILE"
sed -i.bak "s/\[GCC\/Clang version\]/$GCC_VERSION/g" "$REPORT_FILE"
sed -i.bak "s/\[rustc version\]/$RUST_VERSION/g" "$REPORT_FILE"
sed -i.bak "s/\[version\]/$OPENSSL_VERSION/g" "$REPORT_FILE"

# Replace readiness indicators
sed -i.bak "s/\[READY \/ NOT READY\]/$CPP_READY/g" "$REPORT_FILE"

# Clean up backup files
rm -f "$REPORT_FILE.bak"

echo ""
echo "Report generated: $REPORT_FILE"
echo ""
echo "Summary:"
echo "  Status: $STATUS"
echo "  C++:  $CPP_PASSED/$CPP_TOTAL passed (${CPP_SUCCESS}%)"
echo "  Rust: $RUST_PASSED/$RUST_TOTAL passed (${RUST_SUCCESS}%)"
echo ""

# Display report
cat "$REPORT_FILE"
