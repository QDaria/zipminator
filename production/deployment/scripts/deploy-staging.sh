#!/bin/bash
set -euo pipefail

# Zipminator Staging Environment Deployment
# Usage: ./deploy-staging.sh [cpp|rust] [version]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

IMPLEMENTATION="${1:-cpp}"
VERSION="${2:-staging}"
NAMESPACE="zipminator-staging"
CONTEXT="staging-cluster"

echo "========================================="
echo "Zipminator Staging Deployment"
echo "========================================="
echo "Implementation: $IMPLEMENTATION"
echo "Version: $VERSION"
echo "Namespace: $NAMESPACE"
echo "Context: $CONTEXT"
echo ""

# Confirmation prompt
read -p "Deploy to STAGING environment? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Check prerequisites
echo "Checking prerequisites..."
command -v kubectl >/dev/null 2>&1 || { echo "kubectl is required. Aborting."; exit 1; }
command -v helm >/dev/null 2>&1 || { echo "helm is required. Aborting."; exit 1; }

# Switch to staging context
echo "Switching to staging context..."
kubectl config use-context "$CONTEXT"

# Create namespace if it doesn't exist
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# Create backup of current deployment
echo "Creating backup of current deployment..."
kubectl get deployment zipminator -n "$NAMESPACE" -o yaml > "/tmp/zipminator-backup-$(date +%Y%m%d-%H%M%S).yaml" 2>/dev/null || true

# Deploy with Helm
echo "Deploying with Helm..."
helm upgrade --install zipminator \
    "$PROJECT_ROOT/production/deployment/helm/zipminator" \
    --namespace "$NAMESPACE" \
    --values "$PROJECT_ROOT/production/deployment/helm/zipminator/values-staging.yaml" \
    --set image.tag="$VERSION" \
    --set image.implementation="$IMPLEMENTATION" \
    --wait \
    --timeout 10m

# Run smoke tests
echo "Running smoke tests..."
POD=$(kubectl get pod -n "$NAMESPACE" -l app=zipminator -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n "$NAMESPACE" "$POD" -- curl -f http://localhost:8080/health || {
    echo "Health check failed!"
    echo "Rolling back..."
    helm rollback zipminator -n "$NAMESPACE"
    exit 1
}

# Show status
echo ""
echo "========================================="
echo "Deployment Status"
echo "========================================="
kubectl get pods -n "$NAMESPACE" -l app=zipminator
kubectl get svc -n "$NAMESPACE" -l app=zipminator
kubectl get ingress -n "$NAMESPACE"

echo ""
echo "========================================="
echo "Deployment successful!"
echo "========================================="
echo "Access: https://staging-api.zipminator.com"
echo ""
echo "Monitor logs:"
echo "kubectl logs -n $NAMESPACE -l app=zipminator -f"
echo ""
