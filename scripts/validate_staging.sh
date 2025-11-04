#!/bin/bash
set -euo pipefail

# Zipminator Staging Validation Script
# Comprehensive validation suite for staging deployment
# Usage: ./validate_staging.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NAMESPACE="zipminator-staging"
CONTEXT="${KUBE_CONTEXT:-staging-cluster}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNING=0

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[PASS]${NC} $1"; ((TESTS_PASSED++)); }
log_error() { echo -e "${RED}[FAIL]${NC} $1"; ((TESTS_FAILED++)); }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; ((TESTS_WARNING++)); }

print_header() {
    echo ""
    echo "=============================================="
    echo "  Zipminator Staging Validation"
    echo "=============================================="
    echo "Namespace: $NAMESPACE"
    echo "Timestamp: $(date)"
    echo "=============================================="
    echo ""
}

# 1. Infrastructure validation
validate_infrastructure() {
    echo "=== Infrastructure Validation ==="

    # Check cluster access
    if kubectl cluster-info >/dev/null 2>&1; then
        log_success "Cluster access verified"
    else
        log_error "Cannot access Kubernetes cluster"
        return 1
    fi

    # Check namespace
    if kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
        log_success "Namespace exists: $NAMESPACE"
    else
        log_error "Namespace not found: $NAMESPACE"
        return 1
    fi

    # Check nodes
    local ready_nodes=$(kubectl get nodes -o json | jq '[.items[] | select(.status.conditions[] | select(.type=="Ready" and .status=="True"))] | length')
    if [ "$ready_nodes" -gt 0 ]; then
        log_success "Cluster has $ready_nodes ready node(s)"
    else
        log_error "No ready nodes found"
        return 1
    fi
}

# 2. Deployment validation
validate_deployment() {
    echo ""
    echo "=== Deployment Validation ==="

    # Check deployment exists
    if kubectl get deployment zipminator -n "$NAMESPACE" >/dev/null 2>&1; then
        log_success "Deployment exists"
    else
        log_error "Deployment not found"
        return 1
    fi

    # Check desired vs available replicas
    local desired=$(kubectl get deployment zipminator -n "$NAMESPACE" -o jsonpath='{.spec.replicas}')
    local available=$(kubectl get deployment zipminator -n "$NAMESPACE" -o jsonpath='{.status.availableReplicas}')

    if [ "$available" = "$desired" ]; then
        log_success "All replicas available ($available/$desired)"
    else
        log_error "Replica mismatch: $available available, $desired desired"
        return 1
    fi

    # Check pods
    local running_pods=$(kubectl get pods -n "$NAMESPACE" -l app=zipminator -o json | \
        jq '[.items[] | select(.status.phase=="Running")] | length')

    if [ "$running_pods" -ge 2 ]; then
        log_success "$running_pods pods running"
    else
        log_error "Insufficient running pods: $running_pods"
        return 1
    fi

    # Check pod status
    local pods_not_ready=$(kubectl get pods -n "$NAMESPACE" -l app=zipminator -o json | \
        jq '[.items[] | select(.status.conditions[] | select(.type=="Ready" and .status!="True"))] | length')

    if [ "$pods_not_ready" -eq 0 ]; then
        log_success "All pods ready"
    else
        log_error "$pods_not_ready pod(s) not ready"
        kubectl get pods -n "$NAMESPACE" -l app=zipminator
        return 1
    fi
}

# 3. Service validation
validate_service() {
    echo ""
    echo "=== Service Validation ==="

    # Check service exists
    if kubectl get service zipminator -n "$NAMESPACE" >/dev/null 2>&1; then
        log_success "Service exists"
    else
        log_error "Service not found"
        return 1
    fi

    # Check endpoints
    local endpoint_count=$(kubectl get endpoints zipminator -n "$NAMESPACE" -o json | \
        jq '.subsets[0].addresses | length')

    if [ "$endpoint_count" -gt 0 ]; then
        log_success "Service has $endpoint_count endpoint(s)"
    else
        log_error "Service has no endpoints"
        return 1
    fi
}

# 4. Ingress validation
validate_ingress() {
    echo ""
    echo "=== Ingress Validation ==="

    # Check ingress exists
    if kubectl get ingress -n "$NAMESPACE" >/dev/null 2>&1; then
        log_success "Ingress exists"
    else
        log_warning "No ingress found"
        return 0
    fi

    # Check ingress configuration
    local ingress_host=$(kubectl get ingress -n "$NAMESPACE" -o jsonpath='{.items[0].spec.rules[0].host}')
    if [ -n "$ingress_host" ]; then
        log_success "Ingress host configured: $ingress_host"
    else
        log_warning "Ingress host not configured"
    fi

    # Check TLS
    local tls_secret=$(kubectl get ingress -n "$NAMESPACE" -o jsonpath='{.items[0].spec.tls[0].secretName}')
    if [ -n "$tls_secret" ]; then
        log_success "TLS configured with secret: $tls_secret"
    else
        log_warning "TLS not configured"
    fi
}

# 5. Health endpoint validation
validate_health_endpoints() {
    echo ""
    echo "=== Health Endpoint Validation ==="

    local pod=$(kubectl get pod -n "$NAMESPACE" -l app=zipminator -o jsonpath='{.items[0].metadata.name}')

    if [ -z "$pod" ]; then
        log_error "No pods found"
        return 1
    fi

    # Test /health endpoint
    if kubectl exec -n "$NAMESPACE" "$pod" -- curl -sf http://localhost:8080/health >/dev/null 2>&1; then
        log_success "/health endpoint responding"

        # Get health response
        local health_response=$(kubectl exec -n "$NAMESPACE" "$pod" -- curl -s http://localhost:8080/health)
        echo "  Response: $health_response"
    else
        log_error "/health endpoint not responding"
        return 1
    fi

    # Test /ready endpoint
    if kubectl exec -n "$NAMESPACE" "$pod" -- curl -sf http://localhost:8080/ready >/dev/null 2>&1; then
        log_success "/ready endpoint responding"
    else
        log_error "/ready endpoint not responding"
        return 1
    fi

    # Test /metrics endpoint
    if kubectl exec -n "$NAMESPACE" "$pod" -- curl -sf http://localhost:8080/metrics >/dev/null 2>&1; then
        log_success "/metrics endpoint responding"
    else
        log_warning "/metrics endpoint not responding"
    fi
}

# 6. API validation
validate_api() {
    echo ""
    echo "=== API Validation ==="

    local pod=$(kubectl get pod -n "$NAMESPACE" -l app=zipminator -o jsonpath='{.items[0].metadata.name}')

    # Test QRNG endpoint (mock mode)
    log_info "Testing QRNG generation (mock mode)..."
    local qrng_response=$(kubectl exec -n "$NAMESPACE" "$pod" -- curl -sf http://localhost:8080/api/v1/random?bytes=32 2>/dev/null || echo "")

    if [ -n "$qrng_response" ] && [ "${#qrng_response}" -gt 10 ]; then
        log_success "QRNG endpoint responding (mock mode)"
        echo "  Sample: ${qrng_response:0:64}..."
    else
        log_error "QRNG endpoint not responding"
        return 1
    fi

    # Test Kyber768 endpoint
    log_info "Testing Kyber768 key generation..."
    if kubectl exec -n "$NAMESPACE" "$pod" -- curl -sf -X POST http://localhost:8080/api/v1/kyber/keygen >/dev/null 2>&1; then
        log_success "Kyber768 key generation working"
    else
        log_warning "Kyber768 endpoint not responding"
    fi
}

# 7. Configuration validation
validate_configuration() {
    echo ""
    echo "=== Configuration Validation ==="

    # Check ConfigMap
    if kubectl get configmap -n "$NAMESPACE" >/dev/null 2>&1; then
        log_success "ConfigMap(s) exist"
    else
        log_warning "No ConfigMaps found"
    fi

    # Check Secrets
    if kubectl get secrets -n "$NAMESPACE" >/dev/null 2>&1; then
        log_success "Secret(s) exist"
    else
        log_warning "No Secrets found"
    fi

    # Validate mock QRNG configuration
    local pod=$(kubectl get pod -n "$NAMESPACE" -l app=zipminator -o jsonpath='{.items[0].metadata.name}')
    local qrng_mode=$(kubectl exec -n "$NAMESPACE" "$pod" -- env | grep -i "QRNG" | head -1 || echo "")

    if [ -n "$qrng_mode" ]; then
        log_success "QRNG configuration present"
        echo "  Config: $qrng_mode"
    else
        log_warning "QRNG configuration not found in environment"
    fi
}

# 8. Resource usage validation
validate_resources() {
    echo ""
    echo "=== Resource Usage Validation ==="

    # Check HPA
    if kubectl get hpa -n "$NAMESPACE" >/dev/null 2>&1; then
        log_success "HPA configured"

        local current_replicas=$(kubectl get hpa -n "$NAMESPACE" -o jsonpath='{.items[0].status.currentReplicas}')
        local desired_replicas=$(kubectl get hpa -n "$NAMESPACE" -o jsonpath='{.items[0].status.desiredReplicas}')
        echo "  Current replicas: $current_replicas, Desired: $desired_replicas"
    else
        log_warning "HPA not configured"
    fi

    # Check pod resource usage
    if kubectl top pods -n "$NAMESPACE" >/dev/null 2>&1; then
        log_success "Pod metrics available"
        kubectl top pods -n "$NAMESPACE" -l app=zipminator | head -6
    else
        log_warning "Metrics not available (metrics-server may not be installed)"
    fi
}

# 9. Monitoring validation
validate_monitoring() {
    echo ""
    echo "=== Monitoring Validation ==="

    # Check Prometheus annotations
    local prometheus_scrape=$(kubectl get pods -n "$NAMESPACE" -l app=zipminator -o jsonpath='{.items[0].metadata.annotations.prometheus\.io/scrape}')

    if [ "$prometheus_scrape" = "true" ]; then
        log_success "Prometheus scraping enabled"
    else
        log_warning "Prometheus scraping not configured"
    fi

    # Check ServiceMonitor (if Prometheus Operator is used)
    if kubectl get servicemonitor -n "$NAMESPACE" >/dev/null 2>&1; then
        log_success "ServiceMonitor configured"
    else
        log_warning "ServiceMonitor not found (may be using annotations)"
    fi
}

# 10. Security validation
validate_security() {
    echo ""
    echo "=== Security Validation ==="

    local pod=$(kubectl get pod -n "$NAMESPACE" -l app=zipminator -o jsonpath='{.items[0].metadata.name}')

    # Check security context
    local run_as_non_root=$(kubectl get pod "$pod" -n "$NAMESPACE" -o jsonpath='{.spec.securityContext.runAsNonRoot}')
    if [ "$run_as_non_root" = "true" ]; then
        log_success "Pod runs as non-root"
    else
        log_error "Pod security: runAsNonRoot not set"
    fi

    local read_only_root=$(kubectl get pod "$pod" -n "$NAMESPACE" -o jsonpath='{.spec.containers[0].securityContext.readOnlyRootFilesystem}')
    if [ "$read_only_root" = "true" ]; then
        log_success "Read-only root filesystem"
    else
        log_warning "Root filesystem not read-only"
    fi

    # Check network policies
    if kubectl get networkpolicy -n "$NAMESPACE" >/dev/null 2>&1; then
        log_success "Network policies configured"
    else
        log_warning "No network policies found"
    fi
}

# 11. Log validation
validate_logs() {
    echo ""
    echo "=== Log Validation ==="

    local pod=$(kubectl get pod -n "$NAMESPACE" -l app=zipminator -o jsonpath='{.items[0].metadata.name}')

    # Check for errors in logs
    local error_count=$(kubectl logs -n "$NAMESPACE" "$pod" --tail=100 2>/dev/null | grep -ci "error" || echo "0")

    if [ "$error_count" -eq 0 ]; then
        log_success "No errors in recent logs"
    else
        log_warning "$error_count error(s) found in logs"
        echo "  Recent errors:"
        kubectl logs -n "$NAMESPACE" "$pod" --tail=100 | grep -i "error" | head -5
    fi

    # Check log format
    local log_sample=$(kubectl logs -n "$NAMESPACE" "$pod" --tail=1 2>/dev/null)
    if [ -n "$log_sample" ]; then
        log_success "Logs are being generated"
        echo "  Sample: ${log_sample:0:100}..."
    else
        log_warning "No logs found"
    fi
}

# Print summary
print_summary() {
    echo ""
    echo "=============================================="
    echo "  Validation Summary"
    echo "=============================================="
    echo -e "${GREEN}Passed:${NC}  $TESTS_PASSED"
    echo -e "${YELLOW}Warnings:${NC} $TESTS_WARNING"
    echo -e "${RED}Failed:${NC}  $TESTS_FAILED"
    echo "=============================================="
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        log_success "All critical validations passed!"
        echo ""
        echo "Staging environment is ready for integration testing."
        echo ""
        return 0
    else
        log_error "$TESTS_FAILED validation(s) failed"
        echo ""
        echo "Please review the failures above before proceeding."
        echo ""
        return 1
    fi
}

# Main validation flow
main() {
    print_header

    validate_infrastructure || true
    validate_deployment || true
    validate_service || true
    validate_ingress || true
    validate_health_endpoints || true
    validate_api || true
    validate_configuration || true
    validate_resources || true
    validate_monitoring || true
    validate_security || true
    validate_logs || true

    print_summary
}

main "$@"
