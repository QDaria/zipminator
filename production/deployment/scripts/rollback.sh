#!/bin/bash
set -euo pipefail

# Zipminator Rollback Script
# Usage: ./rollback.sh [environment] [revision]

ENVIRONMENT="${1:-prod}"
REVISION="${2:-0}"  # 0 means previous revision

case "$ENVIRONMENT" in
    dev)
        NAMESPACE="zipminator-dev"
        CONTEXT="dev-cluster"
        ;;
    staging)
        NAMESPACE="zipminator-staging"
        CONTEXT="staging-cluster"
        ;;
    prod)
        NAMESPACE="zipminator-prod"
        CONTEXT="prod-cluster"
        ;;
    *)
        echo "Invalid environment: $ENVIRONMENT"
        echo "Usage: ./rollback.sh [dev|staging|prod] [revision]"
        exit 1
        ;;
esac

echo "========================================="
echo "⚠️  ROLLBACK OPERATION ⚠️"
echo "========================================="
echo "Environment: $ENVIRONMENT"
echo "Namespace: $NAMESPACE"
echo "Context: $CONTEXT"
echo ""

# Show deployment history
echo "Deployment history:"
helm history zipminator -n "$NAMESPACE" || {
    echo "No deployment history found!"
    exit 1
}
echo ""

# Confirmation
if [ "$ENVIRONMENT" == "prod" ]; then
    echo "⚠️  WARNING: This will rollback PRODUCTION!"
    read -p "Type 'ROLLBACK' to confirm: " -r
    if [[ ! $REPLY == "ROLLBACK" ]]; then
        echo "Rollback cancelled."
        exit 0
    fi
fi

read -p "Proceed with rollback? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Rollback cancelled."
    exit 0
fi

# Switch to context
kubectl config use-context "$CONTEXT"

# Create backup before rollback
echo "Creating backup before rollback..."
BACKUP_FILE="/tmp/zipminator-${ENVIRONMENT}-pre-rollback-$(date +%Y%m%d-%H%M%S).yaml"
kubectl get all -n "$NAMESPACE" -o yaml > "$BACKUP_FILE"
echo "Backup saved to: $BACKUP_FILE"

# Perform rollback
echo "Performing rollback..."
if [ "$REVISION" -eq 0 ]; then
    helm rollback zipminator -n "$NAMESPACE" --wait --timeout 10m
else
    helm rollback zipminator "$REVISION" -n "$NAMESPACE" --wait --timeout 10m
fi

# Wait for rollout
echo "Waiting for rollout to complete..."
kubectl rollout status deployment/zipminator -n "$NAMESPACE" --timeout=10m

# Health check
echo "Running health check..."
sleep 5

POD=$(kubectl get pod -n "$NAMESPACE" -l app=zipminator -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n "$NAMESPACE" "$POD" -- curl -f http://localhost:8080/health || {
    echo "Health check failed after rollback!"
    exit 1
}

# Show status
echo ""
echo "========================================="
echo "✅ Rollback Successful!"
echo "========================================="
kubectl get pods -n "$NAMESPACE" -l app=zipminator
echo ""
echo "Current deployment:"
helm list -n "$NAMESPACE"
echo ""
echo "Monitor logs:"
echo "kubectl logs -n $NAMESPACE -l app=zipminator -f"
echo ""
