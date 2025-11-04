#!/bin/bash
set -euo pipefail

# Zipminator Staging Rollback Script
# Quick and safe rollback procedures for staging environment
# Usage: ./rollback_staging.sh [revision]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NAMESPACE="zipminator-staging"
CONTEXT="${KUBE_CONTEXT:-staging-cluster}"
HELM_RELEASE="zipminator"
BACKUP_DIR="/tmp/zipminator-backups"
REVISION="${1:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

print_banner() {
    echo ""
    echo "=============================================="
    echo "  Zipminator Staging Rollback"
    echo "=============================================="
    echo "Namespace: $NAMESPACE"
    echo "Context: $CONTEXT"
    if [ -n "$REVISION" ]; then
        echo "Target Revision: $REVISION"
    else
        echo "Target: Previous revision"
    fi
    echo "=============================================="
    echo ""
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    command -v kubectl >/dev/null 2>&1 || { log_error "kubectl is required"; exit 1; }
    command -v helm >/dev/null 2>&1 || { log_error "helm is required"; exit 1; }

    log_success "Prerequisites satisfied"
}

verify_cluster_access() {
    log_info "Verifying cluster access..."

    if ! kubectl config use-context "$CONTEXT" >/dev/null 2>&1; then
        log_error "Failed to switch to context: $CONTEXT"
        exit 1
    fi

    if ! kubectl cluster-info >/dev/null 2>&1; then
        log_error "Cannot access Kubernetes cluster"
        exit 1
    fi

    log_success "Cluster access verified"
}

show_release_history() {
    log_info "Helm release history:"
    echo ""
    helm history "$HELM_RELEASE" -n "$NAMESPACE" --max 10
    echo ""
}

get_current_status() {
    log_info "Current deployment status:"
    echo ""
    kubectl get deployment "$HELM_RELEASE" -n "$NAMESPACE" -o wide
    echo ""
    kubectl get pods -n "$NAMESPACE" -l app=zipminator
    echo ""
}

perform_rollback() {
    log_info "Performing rollback..."

    local rollback_cmd=(helm rollback "$HELM_RELEASE" -n "$NAMESPACE" --wait --timeout=10m)

    if [ -n "$REVISION" ]; then
        rollback_cmd+=("$REVISION")
        log_info "Rolling back to revision $REVISION"
    else
        log_info "Rolling back to previous revision"
    fi

    if "${rollback_cmd[@]}"; then
        log_success "Rollback command executed"
    else
        log_error "Rollback failed"
        return 1
    fi
}

wait_for_rollback() {
    log_info "Waiting for rollback to complete..."

    if ! kubectl rollout status deployment/"$HELM_RELEASE" -n "$NAMESPACE" --timeout=5m; then
        log_error "Rollback did not complete successfully"
        return 1
    fi

    log_success "Rollback completed"
}

verify_health() {
    log_info "Verifying service health..."

    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        local ready_pods=$(kubectl get pods -n "$NAMESPACE" -l app=zipminator -o json | \
            jq '[.items[] | select(.status.phase=="Running" and .status.conditions[] | select(.type=="Ready" and .status=="True"))] | length')
        local total_pods=$(kubectl get pods -n "$NAMESPACE" -l app=zipminator -o json | \
            jq '.items | length')

        if [ "$ready_pods" -eq "$total_pods" ] && [ "$ready_pods" -gt 0 ]; then
            log_success "All $ready_pods pods are healthy"
            break
        fi

        log_info "Waiting for pods... ($ready_pods/$total_pods ready)"
        sleep 5
        ((attempt++))
    done

    if [ $attempt -eq $max_attempts ]; then
        log_error "Health verification timed out"
        return 1
    fi
}

test_endpoints() {
    log_info "Testing endpoints..."

    local pod=$(kubectl get pod -n "$NAMESPACE" -l app=zipminator -o jsonpath='{.items[0].metadata.name}')

    if [ -z "$pod" ]; then
        log_error "No pods found"
        return 1
    fi

    # Test health endpoint
    if kubectl exec -n "$NAMESPACE" "$pod" -- curl -sf http://localhost:8080/health >/dev/null; then
        log_success "Health endpoint responding"
    else
        log_error "Health endpoint not responding"
        return 1
    fi

    # Test readiness endpoint
    if kubectl exec -n "$NAMESPACE" "$pod" -- curl -sf http://localhost:8080/ready >/dev/null; then
        log_success "Readiness endpoint responding"
    else
        log_error "Readiness endpoint not responding"
        return 1
    fi
}

backup_failed_state() {
    log_info "Backing up failed deployment state for analysis..."

    mkdir -p "$BACKUP_DIR"
    local backup_file="$BACKUP_DIR/failed-deployment-$(date +%Y%m%d-%H%M%S)"

    kubectl get all -n "$NAMESPACE" -o yaml > "${backup_file}-state.yaml" 2>/dev/null || true
    kubectl get events -n "$NAMESPACE" --sort-by='.lastTimestamp' > "${backup_file}-events.txt" 2>/dev/null || true
    kubectl logs -n "$NAMESPACE" -l app=zipminator --all-containers --tail=1000 > "${backup_file}-logs.txt" 2>/dev/null || true

    log_success "Failed state backed up to: $backup_file"
}

show_post_rollback_status() {
    echo ""
    log_info "Post-rollback status:"
    echo ""

    echo "Deployment:"
    kubectl get deployment "$HELM_RELEASE" -n "$NAMESPACE"
    echo ""

    echo "Pods:"
    kubectl get pods -n "$NAMESPACE" -l app=zipminator
    echo ""

    echo "Services:"
    kubectl get svc -n "$NAMESPACE" -l app=zipminator
    echo ""

    echo "Helm Release:"
    helm list -n "$NAMESPACE"
    echo ""
}

print_summary() {
    echo ""
    echo "=============================================="
    echo "  Rollback Complete"
    echo "=============================================="
    log_success "Staging environment rolled back successfully"
    echo ""
    echo "Next Steps:"
    echo "  1. Verify application functionality"
    echo "  2. Run validation: ./scripts/validate_staging.sh"
    echo "  3. Investigate root cause of failure"
    echo "  4. Monitor logs: kubectl logs -n $NAMESPACE -l app=zipminator -f"
    echo ""
    echo "Useful Commands:"
    echo "  - View history: helm history $HELM_RELEASE -n $NAMESPACE"
    echo "  - Check logs: kubectl logs -n $NAMESPACE -l app=zipminator"
    echo "  - Describe pods: kubectl describe pods -n $NAMESPACE"
    echo ""
}

emergency_rollback() {
    log_error "Performing emergency rollback..."

    # Try Helm rollback
    log_info "Attempting Helm rollback..."
    if helm rollback "$HELM_RELEASE" -n "$NAMESPACE" --wait --timeout=5m 2>/dev/null; then
        log_success "Helm rollback succeeded"
        return 0
    fi

    # Try kubectl rollout undo
    log_info "Attempting kubectl rollout undo..."
    if kubectl rollout undo deployment/"$HELM_RELEASE" -n "$NAMESPACE"; then
        log_success "Kubectl rollback succeeded"
        if kubectl rollout status deployment/"$HELM_RELEASE" -n "$NAMESPACE" --timeout=5m; then
            return 0
        fi
    fi

    # Last resort: restore from backup
    if [ -f "$BACKUP_DIR/latest" ]; then
        local latest_backup=$(cat "$BACKUP_DIR/latest")
        log_info "Attempting restore from backup: $latest_backup"

        if [ -f "${latest_backup}-deployment.yaml" ]; then
            kubectl apply -f "${latest_backup}-deployment.yaml"
            kubectl rollout status deployment/"$HELM_RELEASE" -n "$NAMESPACE" --timeout=5m
            return 0
        fi
    fi

    log_error "All rollback attempts failed"
    return 1
}

main() {
    print_banner

    # Confirmation prompt
    if [ -t 0 ]; then
        log_warning "This will rollback the staging deployment"
        echo -n "Proceed with rollback? (yes/no): "
        read -r response
        if [[ ! "$response" =~ ^[Yy][Ee][Ss]$ ]]; then
            log_info "Rollback cancelled"
            exit 0
        fi
    fi

    check_prerequisites
    verify_cluster_access

    # Show current state
    show_release_history
    get_current_status

    # Backup failed state
    backup_failed_state

    # Perform rollback
    if perform_rollback; then
        if wait_for_rollback; then
            if verify_health && test_endpoints; then
                show_post_rollback_status
                print_summary
                exit 0
            else
                log_error "Health checks failed after rollback"
                emergency_rollback
                exit 1
            fi
        else
            log_error "Rollback did not complete"
            emergency_rollback
            exit 1
        fi
    else
        log_error "Rollback command failed"
        emergency_rollback
        exit 1
    fi
}

# Trap errors
trap 'log_error "Script failed at line $LINENO"' ERR

main "$@"
