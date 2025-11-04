#!/bin/bash
set -euo pipefail

# Zipminator Development Environment Deployment
# Usage: ./deploy-dev.sh [cpp|rust]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

IMPLEMENTATION="${1:-cpp}"
NAMESPACE="zipminator-dev"
CONTEXT="dev-cluster"

echo "========================================="
echo "Zipminator Development Deployment"
echo "========================================="
echo "Implementation: $IMPLEMENTATION"
echo "Namespace: $NAMESPACE"
echo "Context: $CONTEXT"
echo ""

# Check prerequisites
echo "Checking prerequisites..."
command -v kubectl >/dev/null 2>&1 || { echo "kubectl is required but not installed. Aborting."; exit 1; }
command -v helm >/dev/null 2>&1 || { echo "helm is required but not installed. Aborting."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "docker is required but not installed. Aborting."; exit 1; }

# Switch to dev context
echo "Switching to dev context..."
kubectl config use-context "$CONTEXT" || {
    echo "Failed to switch to context $CONTEXT"
    echo "Available contexts:"
    kubectl config get-contexts
    exit 1
}

# Create namespace if it doesn't exist
echo "Creating namespace $NAMESPACE..."
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# Build Docker image
echo "Building Docker image..."
cd "$PROJECT_ROOT"
docker build -f "production/deployment/Dockerfile.$IMPLEMENTATION" \
    -t "zipminator-$IMPLEMENTATION:dev" .

# Load image to kind/minikube if using local cluster
if kubectl config current-context | grep -q "kind\|minikube"; then
    echo "Loading image to local cluster..."
    if command -v kind >/dev/null 2>&1; then
        kind load docker-image "zipminator-$IMPLEMENTATION:dev"
    elif command -v minikube >/dev/null 2>&1; then
        minikube image load "zipminator-$IMPLEMENTATION:dev"
    fi
fi

# Deploy with Helm
echo "Deploying with Helm..."
helm upgrade --install zipminator \
    "$PROJECT_ROOT/production/deployment/helm/zipminator" \
    --namespace "$NAMESPACE" \
    --values "$PROJECT_ROOT/production/deployment/helm/zipminator/values-dev.yaml" \
    --set image.tag=dev \
    --set image.implementation="$IMPLEMENTATION" \
    --wait \
    --timeout 5m

# Wait for deployment
echo "Waiting for deployment to be ready..."
kubectl rollout status deployment/zipminator -n "$NAMESPACE" --timeout=5m

# Show status
echo ""
echo "========================================="
echo "Deployment Status"
echo "========================================="
kubectl get pods -n "$NAMESPACE" -l app=zipminator
echo ""
kubectl get svc -n "$NAMESPACE" -l app=zipminator

# Port forwarding info
echo ""
echo "========================================="
echo "Access the service:"
echo "========================================="
echo "kubectl port-forward -n $NAMESPACE svc/zipminator 8080:80"
echo "Then access: http://localhost:8080"
echo ""
echo "View logs:"
echo "kubectl logs -n $NAMESPACE -l app=zipminator -f"
echo ""
