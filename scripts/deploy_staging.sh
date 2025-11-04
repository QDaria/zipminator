#!/bin/bash
set -euo pipefail

# Zipminator Staging Environment Deployment Script
# Comprehensive automation for Week 4 staging deployment
# Usage: ./deploy_staging.sh [cpp|rust] [version]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Configuration
IMPLEMENTATION="${1:-cpp}"
VERSION="${2:-staging-$(date +%Y%m%d-%H%M%S)}"
NAMESPACE="zipminator-staging"
CONTEXT="${KUBE_CONTEXT:-staging-cluster}"
HELM_RELEASE="zipminator"
BACKUP_DIR="/tmp/zipminator-backups"
DRY_RUN="${DRY_RUN:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Print deployment banner
print_banner() {
    echo ""
    echo "=============================================="
    echo "  Zipminator Staging Deployment"
    echo "=============================================="
    echo "Implementation: $IMPLEMENTATION"
    echo "Version: $VERSION"
    echo "Namespace: $NAMESPACE"
    echo "Context: $CONTEXT"
    echo "Dry Run: $DRY_RUN"
    echo "=============================================="
    echo ""
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    local missing_tools=()

    command -v kubectl >/dev/null 2>&1 || missing_tools+=("kubectl")
    command -v helm >/dev/null 2>&1 || missing_tools+=("helm")
    command -v jq >/dev/null 2>&1 || missing_tools+=("jq")
    command -v curl >/dev/null 2>&1 || missing_tools+=("curl")

    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_error "Please install missing tools and try again"
        exit 1
    fi

    log_success "All prerequisites satisfied"
}

# Verify cluster access
verify_cluster_access() {
    log_info "Verifying cluster access..."

    if ! kubectl config use-context "$CONTEXT" >/dev/null 2>&1; then
        log_error "Failed to switch to context: $CONTEXT"
        log_error "Available contexts:"
        kubectl config get-contexts
        exit 1
    fi

    if ! kubectl cluster-info >/dev/null 2>&1; then
        log_error "Cannot access Kubernetes cluster"
        exit 1
    fi

    log_success "Cluster access verified"
}

# Create namespace if needed
create_namespace() {
    log_info "Ensuring namespace exists: $NAMESPACE"

    if kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
        log_info "Namespace already exists"
    else
        kubectl create namespace "$NAMESPACE"
        log_success "Namespace created: $NAMESPACE"
    fi

    # Label namespace
    kubectl label namespace "$NAMESPACE" environment=staging --overwrite
}

# Backup current deployment
backup_current_deployment() {
    log_info "Creating backup of current deployment..."

    mkdir -p "$BACKUP_DIR"
    local backup_file="$BACKUP_DIR/staging-backup-$(date +%Y%m%d-%H%M%S)"

    # Backup deployment
    kubectl get deployment "$HELM_RELEASE" -n "$NAMESPACE" -o yaml > "${backup_file}-deployment.yaml" 2>/dev/null || true

    # Backup configmap
    kubectl get configmap -n "$NAMESPACE" -o yaml > "${backup_file}-configmap.yaml" 2>/dev/null || true

    # Backup secrets (names only for security)
    kubectl get secrets -n "$NAMESPACE" -o json | jq '.items[].metadata.name' > "${backup_file}-secrets.txt" 2>/dev/null || true

    # Backup ingress
    kubectl get ingress -n "$NAMESPACE" -o yaml > "${backup_file}-ingress.yaml" 2>/dev/null || true

    # Backup current state
    kubectl get all -n "$NAMESPACE" > "${backup_file}-state.txt" 2>/dev/null || true

    log_success "Backup created: $backup_file"
    echo "$backup_file" > "$BACKUP_DIR/latest"
}

# Validate Helm chart
validate_helm_chart() {
    log_info "Validating Helm chart..."

    local chart_path="$PROJECT_ROOT/production/deployment/helm/zipminator"
    local values_file="$chart_path/values-staging.yaml"

    if [ ! -d "$chart_path" ]; then
        log_error "Helm chart not found: $chart_path"
        exit 1
    fi

    if [ ! -f "$values_file" ]; then
        log_error "Values file not found: $values_file"
        exit 1
    fi

    # Lint chart
    if ! helm lint "$chart_path" --values "$values_file"; then
        log_error "Helm chart validation failed"
        exit 1
    fi

    # Template chart (dry-run)
    if ! helm template "$HELM_RELEASE" "$chart_path" \
        --namespace "$NAMESPACE" \
        --values "$values_file" \
        --set image.tag="$VERSION" \
        --set image.implementation="$IMPLEMENTATION" \
        > /dev/null; then
        log_error "Helm template generation failed"
        exit 1
    fi

    log_success "Helm chart validation passed"
}

# Check resource availability
check_resources() {
    log_info "Checking cluster resources..."

    # Get node resources
    local total_cpu=$(kubectl top nodes 2>/dev/null | awk 'NR>1 {sum+=$2} END {print sum}' | sed 's/m//')
    local total_mem=$(kubectl top nodes 2>/dev/null | awk 'NR>1 {sum+=$4} END {print sum}' | sed 's/Mi//')

    if [ -n "$total_cpu" ] && [ "$total_cpu" -gt 8000 ]; then
        log_warning "High CPU usage on nodes: ${total_cpu}m"
    fi

    if [ -n "$total_mem" ] && [ "$total_mem" -gt 16000 ]; then
        log_warning "High memory usage on nodes: ${total_mem}Mi"
    fi

    log_success "Resource check complete"
}

# Deploy with Helm
deploy_helm() {
    log_info "Deploying with Helm..."

    local chart_path="$PROJECT_ROOT/production/deployment/helm/zipminator"
    local values_file="$chart_path/values-staging.yaml"

    local helm_args=(
        upgrade --install "$HELM_RELEASE"
        "$chart_path"
        --namespace "$NAMESPACE"
        --values "$values_file"
        --set image.tag="$VERSION"
        --set image.implementation="$IMPLEMENTATION"
        --wait
        --timeout 10m
        --atomic
        --create-namespace
    )

    if [ "$DRY_RUN" = "true" ]; then
        helm_args+=(--dry-run)
        log_warning "DRY RUN MODE - No actual deployment"
    fi

    if helm "${helm_args[@]}"; then
        log_success "Helm deployment completed"
    else
        log_error "Helm deployment failed"
        log_error "Check rollback status with: helm history $HELM_RELEASE -n $NAMESPACE"
        exit 1
    fi
}

# Wait for deployment rollout
wait_for_rollout() {
    log_info "Waiting for deployment rollout..."

    if ! kubectl rollout status deployment/"$HELM_RELEASE" -n "$NAMESPACE" --timeout=5m; then
        log_error "Deployment rollout failed"
        log_error "Pod status:"
        kubectl get pods -n "$NAMESPACE" -l app=zipminator
        log_error "Recent events:"
        kubectl get events -n "$NAMESPACE" --sort-by='.lastTimestamp' | tail -20
        exit 1
    fi

    log_success "Deployment rollout completed"
}

# Verify pod health
verify_pod_health() {
    log_info "Verifying pod health..."

    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        local ready_pods=$(kubectl get pods -n "$NAMESPACE" -l app=zipminator -o json | \
            jq '[.items[] | select(.status.phase=="Running")] | length')
        local total_pods=$(kubectl get pods -n "$NAMESPACE" -l app=zipminator -o json | \
            jq '.items | length')

        if [ "$ready_pods" -eq "$total_pods" ] && [ "$ready_pods" -gt 0 ]; then
            log_success "All $ready_pods pods are healthy"
            return 0
        fi

        log_info "Waiting for pods... ($ready_pods/$total_pods ready)"
        sleep 5
        ((attempt++))
    done

    log_error "Pod health check timed out"
    kubectl get pods -n "$NAMESPACE" -l app=zipminator
    return 1
}

# Run health checks
run_health_checks() {
    log_info "Running health checks..."

    local pod=$(kubectl get pod -n "$NAMESPACE" -l app=zipminator -o jsonpath='{.items[0].metadata.name}')

    if [ -z "$pod" ]; then
        log_error "No pods found"
        return 1
    fi

    # Liveness check
    log_info "Checking liveness endpoint..."
    if kubectl exec -n "$NAMESPACE" "$pod" -- curl -sf http://localhost:8080/health >/dev/null; then
        log_success "Liveness check passed"
    else
        log_error "Liveness check failed"
        return 1
    fi

    # Readiness check
    log_info "Checking readiness endpoint..."
    if kubectl exec -n "$NAMESPACE" "$pod" -- curl -sf http://localhost:8080/ready >/dev/null; then
        log_success "Readiness check passed"
    else
        log_error "Readiness check failed"
        return 1
    fi

    # Metrics check
    log_info "Checking metrics endpoint..."
    if kubectl exec -n "$NAMESPACE" "$pod" -- curl -sf http://localhost:8080/metrics >/dev/null; then
        log_success "Metrics endpoint accessible"
    else
        log_warning "Metrics endpoint not accessible"
    fi

    return 0
}

# Test external access
test_external_access() {
    log_info "Testing external access..."

    local ingress_host=$(kubectl get ingress -n "$NAMESPACE" -o jsonpath='{.items[0].spec.rules[0].host}')

    if [ -z "$ingress_host" ]; then
        log_warning "No ingress host found, skipping external access test"
        return 0
    fi

    log_info "Testing https://$ingress_host/health"

    local max_attempts=10
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if curl -sf -k "https://$ingress_host/health" >/dev/null 2>&1; then
            log_success "External access verified"
            return 0
        fi

        log_info "Waiting for ingress... (attempt $((attempt+1))/$max_attempts)"
        sleep 10
        ((attempt++))
    done

    log_warning "External access test timed out (this may be normal if DNS not propagated)"
    return 0
}

# Display deployment status
display_status() {
    log_info "Deployment Status:"
    echo ""

    echo "Pods:"
    kubectl get pods -n "$NAMESPACE" -l app=zipminator
    echo ""

    echo "Services:"
    kubectl get svc -n "$NAMESPACE" -l app=zipminator
    echo ""

    echo "Ingress:"
    kubectl get ingress -n "$NAMESPACE"
    echo ""

    echo "HPA:"
    kubectl get hpa -n "$NAMESPACE"
    echo ""
}

# Print next steps
print_next_steps() {
    echo ""
    echo "=============================================="
    echo "  Deployment Complete!"
    echo "=============================================="
    echo ""
    log_success "Zipminator deployed to staging"
    echo ""
    echo "Next Steps:"
    echo "  1. Run validation: ./scripts/validate_staging.sh"
    echo "  2. Run integration tests: ./tests/staging/integration_test_suite.sh"
    echo "  3. Monitor logs: kubectl logs -n $NAMESPACE -l app=zipminator -f"
    echo "  4. View metrics: kubectl port-forward -n monitoring svc/grafana 3000:3000"
    echo ""
    echo "Useful Commands:"
    echo "  - Check pods: kubectl get pods -n $NAMESPACE"
    echo "  - View logs: kubectl logs -n $NAMESPACE -l app=zipminator"
    echo "  - Port forward: kubectl port-forward -n $NAMESPACE svc/zipminator 8080:80"
    echo "  - Rollback: ./scripts/rollback_staging.sh"
    echo ""
    echo "Access:"
    local ingress_host=$(kubectl get ingress -n "$NAMESPACE" -o jsonpath='{.items[0].spec.rules[0].host}')
    if [ -n "$ingress_host" ]; then
        echo "  https://$ingress_host"
    fi
    echo ""
}

# Cleanup on failure
cleanup_on_failure() {
    log_error "Deployment failed, checking rollback status..."

    # Helm's --atomic flag handles rollback automatically
    log_info "Helm atomic rollback should have been triggered"

    # Show recent events
    log_info "Recent events:"
    kubectl get events -n "$NAMESPACE" --sort-by='.lastTimestamp' | tail -20
}

# Main deployment flow
main() {
    print_banner

    # Confirmation prompt (skip in non-interactive mode)
    if [ -t 0 ] && [ "$DRY_RUN" != "true" ]; then
        echo -n "Deploy to STAGING environment? (yes/no): "
        read -r response
        if [[ ! "$response" =~ ^[Yy][Ee][Ss]$ ]]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi

    # Pre-deployment checks
    check_prerequisites
    verify_cluster_access
    create_namespace
    validate_helm_chart
    check_resources

    # Backup current state
    backup_current_deployment

    # Deploy
    if deploy_helm; then
        wait_for_rollout
        verify_pod_health

        if run_health_checks; then
            test_external_access
            display_status
            print_next_steps
            exit 0
        else
            log_error "Health checks failed"
            cleanup_on_failure
            exit 1
        fi
    else
        cleanup_on_failure
        exit 1
    fi
}

# Trap errors
trap cleanup_on_failure ERR

# Run main
main "$@"
