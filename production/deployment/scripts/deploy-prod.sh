#!/bin/bash
set -euo pipefail

# Zipminator Production Deployment
# Usage: ./deploy-prod.sh [cpp|rust] [version]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

IMPLEMENTATION="${1:-cpp}"
VERSION="${2:-latest}"
NAMESPACE="zipminator-prod"
CONTEXT="prod-cluster"

echo "========================================="
echo "⚠️  PRODUCTION DEPLOYMENT ⚠️"
echo "========================================="
echo "Implementation: $IMPLEMENTATION"
echo "Version: $VERSION"
echo "Namespace: $NAMESPACE"
echo "Context: $CONTEXT"
echo ""

# Multiple confirmation prompts
echo "⚠️  WARNING: This will deploy to PRODUCTION!"
read -p "Type 'PRODUCTION' to confirm: " -r
if [[ ! $REPLY == "PRODUCTION" ]]; then
    echo "Deployment cancelled."
    exit 0
fi

read -p "Deploy version $VERSION to production? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Check prerequisites
echo "Checking prerequisites..."
command -v kubectl >/dev/null 2>&1 || { echo "kubectl is required. Aborting."; exit 1; }
command -v helm >/dev/null 2>&1 || { echo "helm is required. Aborting."; exit 1; }

# Verify we're not on a dev machine
if [[ "${HOSTNAME}" == *"dev"* ]] || [[ "${HOSTNAME}" == *"local"* ]]; then
    echo "ERROR: Cannot deploy to production from dev machine!"
    exit 1
fi

# Switch to production context
echo "Switching to production context..."
kubectl config use-context "$CONTEXT" || {
    echo "Failed to switch to production context!"
    exit 1
}

# Verify we're on the right cluster
CURRENT_CONTEXT=$(kubectl config current-context)
echo "Current context: $CURRENT_CONTEXT"
read -p "Confirm this is the production cluster? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Create namespace if it doesn't exist
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# Create backup of current deployment
echo "Creating backup of current deployment..."
BACKUP_FILE="/tmp/zipminator-prod-backup-$(date +%Y%m%d-%H%M%S).yaml"
kubectl get all -n "$NAMESPACE" -o yaml > "$BACKUP_FILE"
echo "Backup saved to: $BACKUP_FILE"

# Pre-deployment checks
echo "Running pre-deployment checks..."

# Check if secrets exist
kubectl get secret zipminator-secrets -n "$NAMESPACE" >/dev/null 2>&1 || {
    echo "ERROR: Required secrets not found!"
    echo "Please create secrets first: kubectl apply -f production/deployment/k8s/secret.yaml"
    exit 1
}

# Check cluster resources
NODE_COUNT=$(kubectl get nodes --no-headers | wc -l)
if [ "$NODE_COUNT" -lt 3 ]; then
    echo "WARNING: Less than 3 nodes available. Production requires at least 3 nodes."
    read -p "Continue anyway? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        exit 0
    fi
fi

# Deploy with Helm (blue-green strategy)
echo "Deploying with Helm..."
helm upgrade --install zipminator \
    "$PROJECT_ROOT/production/deployment/helm/zipminator" \
    --namespace "$NAMESPACE" \
    --values "$PROJECT_ROOT/production/deployment/helm/zipminator/values-prod.yaml" \
    --set image.tag="$VERSION" \
    --set image.implementation="$IMPLEMENTATION" \
    --wait \
    --timeout 15m \
    --atomic \
    --cleanup-on-fail

# Wait for rollout
echo "Waiting for rollout to complete..."
kubectl rollout status deployment/zipminator -n "$NAMESPACE" --timeout=15m

# Run comprehensive health checks
echo "Running health checks..."
sleep 10

# Get service endpoint
SERVICE_IP=$(kubectl get svc zipminator -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
if [ -z "$SERVICE_IP" ]; then
    echo "Using port-forward for health check..."
    kubectl port-forward -n "$NAMESPACE" svc/zipminator 8080:80 &
    PF_PID=$!
    sleep 3
    HEALTH_ENDPOINT="http://localhost:8080/health"
else
    HEALTH_ENDPOINT="http://$SERVICE_IP/health"
fi

# Health check
for i in {1..5}; do
    if curl -f "$HEALTH_ENDPOINT" >/dev/null 2>&1; then
        echo "Health check $i/5: PASSED"
    else
        echo "Health check $i/5: FAILED"
        echo "Rolling back deployment..."
        helm rollback zipminator -n "$NAMESPACE"
        [ ! -z "${PF_PID:-}" ] && kill "$PF_PID" 2>/dev/null || true
        exit 1
    fi
    sleep 2
done

[ ! -z "${PF_PID:-}" ] && kill "$PF_PID" 2>/dev/null || true

# Verify all pods are running
POD_COUNT=$(kubectl get pods -n "$NAMESPACE" -l app=zipminator --field-selector=status.phase=Running --no-headers | wc -l)
if [ "$POD_COUNT" -lt 3 ]; then
    echo "ERROR: Less than 3 pods running!"
    echo "Rolling back..."
    helm rollback zipminator -n "$NAMESPACE"
    exit 1
fi

# Show status
echo ""
echo "========================================="
echo "✅ Production Deployment Successful!"
echo "========================================="
kubectl get pods -n "$NAMESPACE" -l app=zipminator
kubectl get svc -n "$NAMESPACE" -l app=zipminator
kubectl get ingress -n "$NAMESPACE"

echo ""
echo "========================================="
echo "Post-Deployment Information"
echo "========================================="
echo "Access: https://api.zipminator.com"
echo "Backup saved: $BACKUP_FILE"
echo ""
echo "Monitor logs:"
echo "kubectl logs -n $NAMESPACE -l app=zipminator -f"
echo ""
echo "Rollback if needed:"
echo "helm rollback zipminator -n $NAMESPACE"
echo ""
echo "⚠️  Monitor the deployment for the next 30 minutes!"
echo ""
