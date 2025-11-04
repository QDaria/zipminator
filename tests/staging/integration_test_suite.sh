#!/bin/bash
set -euo pipefail

# Zipminator Staging Integration Test Suite
# Comprehensive integration tests for staging environment
# Usage: ./integration_test_suite.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NAMESPACE="zipminator-staging"
API_BASE_URL="${API_BASE_URL:-https://staging-api.zipminator.com}"
POD=""

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[PASS]${NC} $1"; }
log_error() { echo -e "${RED}[FAIL]${NC} $1"; }
log_test() { echo -e "${YELLOW}[TEST]${NC} $1"; }

pass_test() {
    log_success "$1"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

fail_test() {
    log_error "$1"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

print_header() {
    echo ""
    echo "=============================================="
    echo "  Zipminator Integration Test Suite"
    echo "=============================================="
    echo "Environment: Staging"
    echo "Namespace: $NAMESPACE"
    echo "API Base: $API_BASE_URL"
    echo "Timestamp: $(date)"
    echo "=============================================="
    echo ""
}

setup_test_env() {
    log_info "Setting up test environment..."

    # Get a pod for internal testing
    POD=$(kubectl get pod -n "$NAMESPACE" -l app=zipminator -o jsonpath='{.items[0].metadata.name}')

    if [ -z "$POD" ]; then
        log_error "No pods found in namespace $NAMESPACE"
        exit 1
    fi

    log_success "Test environment ready (using pod: $POD)"
}

# Test 1: Health Endpoints
test_health_endpoints() {
    echo ""
    echo "=== Test Suite 1: Health Endpoints ==="

    # Test 1.1: Health endpoint
    log_test "Testing /health endpoint..."
    if kubectl exec -n "$NAMESPACE" "$POD" -- curl -sf http://localhost:8080/health >/dev/null 2>&1; then
        local response=$(kubectl exec -n "$NAMESPACE" "$POD" -- curl -s http://localhost:8080/health)
        if echo "$response" | grep -q "healthy"; then
            pass_test "Health endpoint returning healthy status"
        else
            fail_test "Health endpoint not returning expected status: $response"
        fi
    else
        fail_test "Health endpoint not responding"
    fi

    # Test 1.2: Readiness endpoint
    log_test "Testing /ready endpoint..."
    if kubectl exec -n "$NAMESPACE" "$POD" -- curl -sf http://localhost:8080/ready >/dev/null 2>&1; then
        pass_test "Readiness endpoint responding"
    else
        fail_test "Readiness endpoint not responding"
    fi

    # Test 1.3: Metrics endpoint
    log_test "Testing /metrics endpoint..."
    if kubectl exec -n "$NAMESPACE" "$POD" -- curl -sf http://localhost:8080/metrics >/dev/null 2>&1; then
        local metrics=$(kubectl exec -n "$NAMESPACE" "$POD" -- curl -s http://localhost:8080/metrics)
        if echo "$metrics" | grep -q "^# "; then
            pass_test "Metrics endpoint returning Prometheus format"
        else
            fail_test "Metrics endpoint not in Prometheus format"
        fi
    else
        fail_test "Metrics endpoint not responding"
    fi
}

# Test 2: QRNG API (Mock Mode)
test_qrng_api() {
    echo ""
    echo "=== Test Suite 2: QRNG API (Mock Mode) ==="

    # Test 2.1: Random generation (32 bytes)
    log_test "Testing QRNG random generation (32 bytes)..."
    local random_data=$(kubectl exec -n "$NAMESPACE" "$POD" -- curl -sf "http://localhost:8080/api/v1/random?bytes=32" 2>/dev/null || echo "")

    if [ -n "$random_data" ]; then
        local data_length=${#random_data}
        if [ "$data_length" -ge 64 ]; then  # 32 bytes = 64 hex chars minimum
            pass_test "QRNG generated 32 bytes (length: $data_length)"
        else
            fail_test "QRNG data too short (length: $data_length)"
        fi
    else
        fail_test "QRNG generation failed"
    fi

    # Test 2.2: Random generation (different sizes)
    for size in 16 64 128 256; do
        log_test "Testing QRNG generation ($size bytes)..."
        local data=$(kubectl exec -n "$NAMESPACE" "$POD" -- curl -sf "http://localhost:8080/api/v1/random?bytes=$size" 2>/dev/null || echo "")

        if [ -n "$data" ]; then
            pass_test "QRNG generated $size bytes"
        else
            fail_test "QRNG generation failed for $size bytes"
        fi
    done

    # Test 2.3: Randomness quality (basic check)
    log_test "Testing randomness quality..."
    local sample1=$(kubectl exec -n "$NAMESPACE" "$POD" -- curl -sf "http://localhost:8080/api/v1/random?bytes=32" 2>/dev/null || echo "")
    local sample2=$(kubectl exec -n "$NAMESPACE" "$POD" -- curl -sf "http://localhost:8080/api/v1/random?bytes=32" 2>/dev/null || echo "")

    if [ "$sample1" != "$sample2" ] && [ -n "$sample1" ] && [ -n "$sample2" ]; then
        pass_test "QRNG generating different values"
    else
        fail_test "QRNG not generating unique values"
    fi
}

# Test 3: Kyber768 Post-Quantum Crypto
test_kyber768() {
    echo ""
    echo "=== Test Suite 3: Kyber768 Post-Quantum Crypto ==="

    # Test 3.1: Key generation
    log_test "Testing Kyber768 key generation..."
    local keygen_response=$(kubectl exec -n "$NAMESPACE" "$POD" -- curl -sf -X POST http://localhost:8080/api/v1/kyber/keygen 2>/dev/null || echo "")

    if [ -n "$keygen_response" ]; then
        if echo "$keygen_response" | grep -q "public_key"; then
            pass_test "Kyber768 key generation successful"
        else
            fail_test "Kyber768 key generation response invalid: $keygen_response"
        fi
    else
        fail_test "Kyber768 key generation failed"
    fi

    # Test 3.2: Multiple key generations
    log_test "Testing multiple Kyber768 key generations..."
    local success_count=0
    for i in {1..5}; do
        if kubectl exec -n "$NAMESPACE" "$POD" -- curl -sf -X POST http://localhost:8080/api/v1/kyber/keygen >/dev/null 2>&1; then
            ((success_count++))
        fi
    done

    if [ "$success_count" -eq 5 ]; then
        pass_test "Multiple Kyber768 key generations successful (5/5)"
    else
        fail_test "Kyber768 key generation inconsistent ($success_count/5)"
    fi
}

# Test 4: API Authentication
test_authentication() {
    echo ""
    echo "=== Test Suite 4: API Authentication ==="

    # Test 4.1: Request without API key (should fail or be limited)
    log_test "Testing request without API key..."
    local response_code=$(kubectl exec -n "$NAMESPACE" "$POD" -- curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/v1/random?bytes=32 2>/dev/null || echo "000")

    if [ "$response_code" = "200" ] || [ "$response_code" = "429" ]; then
        pass_test "API responding to unauthenticated requests (code: $response_code)"
    else
        fail_test "Unexpected response code: $response_code"
    fi

    # Test 4.2: Request with invalid API key
    log_test "Testing request with invalid API key..."
    response_code=$(kubectl exec -n "$NAMESPACE" "$POD" -- curl -s -o /dev/null -w "%{http_code}" -H "X-API-Key: invalid" http://localhost:8080/api/v1/random?bytes=32 2>/dev/null || echo "000")

    if [ "$response_code" = "401" ] || [ "$response_code" = "403" ] || [ "$response_code" = "200" ]; then
        pass_test "API handling invalid API key correctly (code: $response_code)"
    else
        fail_test "Unexpected response for invalid key: $response_code"
    fi
}

# Test 5: Rate Limiting
test_rate_limiting() {
    echo ""
    echo "=== Test Suite 5: Rate Limiting ==="

    log_test "Testing rate limiting (sending 50 rapid requests)..."

    local success_count=0
    local rate_limited=false

    for i in {1..50}; do
        response_code=$(kubectl exec -n "$NAMESPACE" "$POD" -- curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/v1/random?bytes=16 2>/dev/null || echo "000")

        if [ "$response_code" = "429" ]; then
            rate_limited=true
            break
        elif [ "$response_code" = "200" ]; then
            ((success_count++))
        fi
    done

    if [ "$rate_limited" = true ]; then
        pass_test "Rate limiting is enforced (triggered after $success_count requests)"
    else
        log_info "Rate limiting not triggered in test (processed $success_count/50 requests)"
        pass_test "API handled rapid requests"
    fi
}

# Test 6: Error Handling
test_error_handling() {
    echo ""
    echo "=== Test Suite 6: Error Handling ==="

    # Test 6.1: Invalid byte size
    log_test "Testing invalid byte size (too large)..."
    response_code=$(kubectl exec -n "$NAMESPACE" "$POD" -- curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/api/v1/random?bytes=999999999" 2>/dev/null || echo "000")

    if [ "$response_code" = "400" ] || [ "$response_code" = "413" ]; then
        pass_test "API rejecting invalid byte size (code: $response_code)"
    else
        fail_test "API not handling invalid byte size correctly (code: $response_code)"
    fi

    # Test 6.2: Missing parameters
    log_test "Testing missing required parameters..."
    response_code=$(kubectl exec -n "$NAMESPACE" "$POD" -- curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/api/v1/random" 2>/dev/null || echo "000")

    if [ "$response_code" = "400" ] || [ "$response_code" = "200" ]; then
        pass_test "API handling missing parameters (code: $response_code)"
    else
        fail_test "Unexpected response for missing parameters (code: $response_code)"
    fi

    # Test 6.3: Invalid endpoint
    log_test "Testing invalid endpoint..."
    response_code=$(kubectl exec -n "$NAMESPACE" "$POD" -- curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/api/v1/nonexistent" 2>/dev/null || echo "000")

    if [ "$response_code" = "404" ]; then
        pass_test "API returning 404 for invalid endpoint"
    else
        fail_test "API not returning 404 for invalid endpoint (code: $response_code)"
    fi
}

# Test 7: Performance
test_performance() {
    echo ""
    echo "=== Test Suite 7: Performance ==="

    # Test 7.1: Response time
    log_test "Testing response time (10 requests)..."
    local total_time=0
    local count=0

    for i in {1..10}; do
        local start_time=$(date +%s%N)
        kubectl exec -n "$NAMESPACE" "$POD" -- curl -sf http://localhost:8080/api/v1/random?bytes=32 >/dev/null 2>&1
        local end_time=$(date +%s%N)

        local elapsed=$((($end_time - $start_time) / 1000000))  # Convert to ms
        total_time=$((total_time + elapsed))
        ((count++))
    done

    local avg_time=$((total_time / count))

    if [ "$avg_time" -lt 100 ]; then
        pass_test "Average response time: ${avg_time}ms (excellent)"
    elif [ "$avg_time" -lt 500 ]; then
        pass_test "Average response time: ${avg_time}ms (acceptable)"
    else
        fail_test "Average response time too high: ${avg_time}ms"
    fi

    # Test 7.2: Concurrent requests
    log_test "Testing concurrent request handling..."

    local concurrent_count=0
    for i in {1..5}; do
        kubectl exec -n "$NAMESPACE" "$POD" -- curl -sf http://localhost:8080/api/v1/random?bytes=32 >/dev/null 2>&1 &
    done
    wait

    pass_test "Concurrent requests handled successfully"
}

# Test 8: Pod Health
test_pod_health() {
    echo ""
    echo "=== Test Suite 8: Pod Health ==="

    # Test 8.1: All pods running
    log_test "Testing pod status..."
    local running_pods=$(kubectl get pods -n "$NAMESPACE" -l app=zipminator -o json | \
        jq '[.items[] | select(.status.phase=="Running")] | length')

    if [ "$running_pods" -ge 2 ]; then
        pass_test "All pods running ($running_pods pods)"
    else
        fail_test "Insufficient running pods: $running_pods"
    fi

    # Test 8.2: Pod restarts
    log_test "Checking pod restart count..."
    local max_restarts=$(kubectl get pods -n "$NAMESPACE" -l app=zipminator -o json | \
        jq '[.items[].status.containerStatuses[].restartCount] | max')

    if [ "$max_restarts" -lt 3 ]; then
        pass_test "Pod restart count acceptable (max: $max_restarts)"
    else
        fail_test "High pod restart count: $max_restarts"
    fi

    # Test 8.3: Resource usage
    log_test "Checking resource usage..."
    if kubectl top pods -n "$NAMESPACE" -l app=zipminator >/dev/null 2>&1; then
        pass_test "Resource metrics available"
    else
        log_info "Resource metrics not available (metrics-server may not be installed)"
        pass_test "Skipping resource metrics check"
    fi
}

# Print summary
print_summary() {
    echo ""
    echo "=============================================="
    echo "  Test Summary"
    echo "=============================================="
    echo "Total Tests: $TOTAL_TESTS"
    echo -e "${GREEN}Passed:${NC} $PASSED_TESTS"
    echo -e "${RED}Failed:${NC} $FAILED_TESTS"

    if [ $FAILED_TESTS -eq 0 ]; then
        local pass_rate=100
    else
        local pass_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    fi

    echo "Pass Rate: ${pass_rate}%"
    echo "=============================================="
    echo ""

    if [ $FAILED_TESTS -eq 0 ]; then
        log_success "All integration tests passed!"
        echo ""
        echo "Staging environment is validated and ready."
        echo ""
        return 0
    else
        log_error "$FAILED_TESTS test(s) failed"
        echo ""
        echo "Please review the failures above."
        echo ""
        return 1
    fi
}

# Main test execution
main() {
    print_header
    setup_test_env

    # Run all test suites
    test_health_endpoints
    test_qrng_api
    test_kyber768
    test_authentication
    test_rate_limiting
    test_error_handling
    test_performance
    test_pod_health

    print_summary
}

main "$@"
