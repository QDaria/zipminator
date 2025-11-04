#!/bin/bash

################################################################################
# provision_x86_64_vm.sh
#
# Automated x86_64 VM provisioning for QRNG validation
# Supports: AWS EC2, Azure VMs, Google Cloud
#
# Usage:
#   ./provision_x86_64_vm.sh --provider aws --instance-type c5.2xlarge
#   ./provision_x86_64_vm.sh --provider azure --instance-type F8s_v2
#   ./provision_x86_64_vm.sh --help
################################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
PROVIDER="aws"
INSTANCE_TYPE="c5.2xlarge"
REGION=""
KEY_NAME="qrng-validation-key"
SECURITY_GROUP_NAME="qrng-sg"
VM_NAME="qrng-validation-vm"
STORAGE_SIZE=30
SPOT_INSTANCE=false
AUTO_SHUTDOWN=3600  # 1 hour in seconds
DRY_RUN=false

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

################################################################################
# Helper Functions
################################################################################

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

show_help() {
    cat << EOF
Usage: $0 [OPTIONS]

Automated x86_64 VM provisioning for QRNG validation

OPTIONS:
    --provider PROVIDER       Cloud provider: aws, azure, gcp (default: aws)
    --instance-type TYPE      Instance type (default: c5.2xlarge for AWS)
    --region REGION           Cloud region (default: provider-specific)
    --key-name NAME           SSH key name (default: qrng-validation-key)
    --vm-name NAME            VM name (default: qrng-validation-vm)
    --storage-size SIZE       Storage in GB (default: 30)
    --spot                    Use spot/preemptible instances (default: false)
    --auto-shutdown SECONDS   Auto-shutdown timer in seconds (default: 3600)
    --dry-run                 Show commands without executing (default: false)
    --help                    Show this help message

EXAMPLES:
    # AWS c5.2xlarge in us-east-1
    $0 --provider aws --instance-type c5.2xlarge --region us-east-1

    # Azure F8s_v2 with spot pricing
    $0 --provider azure --instance-type F8s_v2 --spot

    # GCP c2-standard-8 with 2-hour auto-shutdown
    $0 --provider gcp --instance-type c2-standard-8 --auto-shutdown 7200

SUPPORTED INSTANCES:
    AWS:    c5.2xlarge, c5.4xlarge, c5.9xlarge
    Azure:  F8s_v2, F16s_v2, F32s_v2
    GCP:    c2-standard-8, c2-standard-16

PREREQUISITES:
    AWS:    aws-cli configured with valid credentials
    Azure:  azure-cli with active subscription
    GCP:    gcloud SDK configured with project

EOF
    exit 0
}

check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check for required tools
    case $PROVIDER in
        aws)
            if ! command -v aws &> /dev/null; then
                print_error "AWS CLI not found. Install: https://aws.amazon.com/cli/"
            fi
            if ! aws sts get-caller-identity &> /dev/null; then
                print_error "AWS credentials not configured. Run: aws configure"
            fi
            print_success "AWS CLI configured"
            ;;
        azure)
            if ! command -v az &> /dev/null; then
                print_error "Azure CLI not found. Install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
            fi
            if ! az account show &> /dev/null; then
                print_error "Azure not logged in. Run: az login"
            fi
            print_success "Azure CLI configured"
            ;;
        gcp)
            if ! command -v gcloud &> /dev/null; then
                print_error "Google Cloud SDK not found. Install: https://cloud.google.com/sdk/docs/install"
            fi
            if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
                print_error "GCP not authenticated. Run: gcloud auth login"
            fi
            print_success "Google Cloud SDK configured"
            ;;
        *)
            print_error "Unknown provider: $PROVIDER"
            ;;
    esac

    # Check for SSH key
    if [ ! -f "$HOME/.ssh/${KEY_NAME}.pem" ] && [ "$PROVIDER" != "azure" ]; then
        print_warning "SSH key not found, will generate: $HOME/.ssh/${KEY_NAME}.pem"
    fi
}

generate_ssh_key() {
    print_header "SSH Key Management"

    case $PROVIDER in
        aws)
            if [ ! -f "$HOME/.ssh/${KEY_NAME}.pem" ]; then
                print_info "Generating AWS key pair..."
                aws ec2 create-key-pair \
                    --key-name "$KEY_NAME" \
                    --query 'KeyMaterial' \
                    --output text > "$HOME/.ssh/${KEY_NAME}.pem"
                chmod 400 "$HOME/.ssh/${KEY_NAME}.pem"
                print_success "Key pair created: $HOME/.ssh/${KEY_NAME}.pem"
            else
                print_info "Using existing key pair: $HOME/.ssh/${KEY_NAME}.pem"
            fi
            ;;
        azure)
            if [ ! -f "$HOME/.ssh/id_rsa.pub" ]; then
                print_info "Generating SSH key pair for Azure..."
                ssh-keygen -t rsa -b 4096 -f "$HOME/.ssh/id_rsa" -N ""
                print_success "SSH key pair generated"
            else
                print_info "Using existing SSH key: $HOME/.ssh/id_rsa.pub"
            fi
            ;;
        gcp)
            if [ ! -f "$HOME/.ssh/google_compute_engine" ]; then
                print_info "Generating SSH key pair for GCP..."
                ssh-keygen -t rsa -b 4096 -f "$HOME/.ssh/google_compute_engine" -N ""
                print_success "SSH key pair generated"
            else
                print_info "Using existing SSH key: $HOME/.ssh/google_compute_engine"
            fi
            ;;
    esac
}

provision_aws() {
    print_header "Provisioning AWS EC2 Instance"

    # Set default region
    if [ -z "$REGION" ]; then
        REGION="us-east-1"
    fi

    print_info "Provider: AWS"
    print_info "Instance Type: $INSTANCE_TYPE"
    print_info "Region: $REGION"
    print_info "Spot Instance: $SPOT_INSTANCE"

    # Get latest Ubuntu 22.04 AMI
    print_info "Finding latest Ubuntu 22.04 AMI..."
    AMI_ID=$(aws ec2 describe-images \
        --region "$REGION" \
        --owners 099720109477 \
        --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" \
        --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' \
        --output text)
    print_success "AMI ID: $AMI_ID"

    # Create or get security group
    print_info "Setting up security group..."
    SG_ID=$(aws ec2 describe-security-groups \
        --region "$REGION" \
        --filters "Name=group-name,Values=$SECURITY_GROUP_NAME" \
        --query 'SecurityGroups[0].GroupId' \
        --output text 2>/dev/null || echo "")

    if [ "$SG_ID" == "None" ] || [ -z "$SG_ID" ]; then
        print_info "Creating security group..."
        SG_ID=$(aws ec2 create-security-group \
            --region "$REGION" \
            --group-name "$SECURITY_GROUP_NAME" \
            --description "Security group for QRNG validation" \
            --query 'GroupId' \
            --output text)

        # Add SSH rule (from your IP only)
        MY_IP=$(curl -s https://checkip.amazonaws.com)
        aws ec2 authorize-security-group-ingress \
            --region "$REGION" \
            --group-id "$SG_ID" \
            --protocol tcp \
            --port 22 \
            --cidr "${MY_IP}/32"

        print_success "Security group created: $SG_ID (SSH from $MY_IP)"
    else
        print_info "Using existing security group: $SG_ID"
    fi

    # Launch instance
    print_info "Launching EC2 instance..."

    if [ "$SPOT_INSTANCE" = true ]; then
        # Spot instance request
        SPOT_PRICE="0.17"  # 50% discount for c5.2xlarge
        print_info "Requesting spot instance (max price: \$$SPOT_PRICE/hr)..."

        SPOT_REQUEST_ID=$(aws ec2 request-spot-instances \
            --region "$REGION" \
            --spot-price "$SPOT_PRICE" \
            --instance-count 1 \
            --type "one-time" \
            --launch-specification "{
                \"ImageId\": \"$AMI_ID\",
                \"InstanceType\": \"$INSTANCE_TYPE\",
                \"KeyName\": \"$KEY_NAME\",
                \"SecurityGroupIds\": [\"$SG_ID\"],
                \"BlockDeviceMappings\": [{
                    \"DeviceName\": \"/dev/sda1\",
                    \"Ebs\": {
                        \"VolumeSize\": $STORAGE_SIZE,
                        \"VolumeType\": \"gp3\"
                    }
                }]
            }" \
            --query 'SpotInstanceRequests[0].SpotInstanceRequestId' \
            --output text)

        print_info "Waiting for spot instance to launch (may take 1-2 minutes)..."
        aws ec2 wait spot-instance-request-fulfilled \
            --region "$REGION" \
            --spot-instance-request-ids "$SPOT_REQUEST_ID"

        INSTANCE_ID=$(aws ec2 describe-spot-instance-requests \
            --region "$REGION" \
            --spot-instance-request-ids "$SPOT_REQUEST_ID" \
            --query 'SpotInstanceRequests[0].InstanceId' \
            --output text)
    else
        # On-demand instance
        INSTANCE_ID=$(aws ec2 run-instances \
            --region "$REGION" \
            --image-id "$AMI_ID" \
            --instance-type "$INSTANCE_TYPE" \
            --key-name "$KEY_NAME" \
            --security-group-ids "$SG_ID" \
            --block-device-mappings "[{\"DeviceName\":\"/dev/sda1\",\"Ebs\":{\"VolumeSize\":$STORAGE_SIZE,\"VolumeType\":\"gp3\"}}]" \
            --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$VM_NAME}]" \
            --query 'Instances[0].InstanceId' \
            --output text)
    fi

    print_success "Instance launched: $INSTANCE_ID"

    # Wait for instance to be running
    print_info "Waiting for instance to be running..."
    aws ec2 wait instance-running --region "$REGION" --instance-ids "$INSTANCE_ID"

    # Get public IP
    PUBLIC_IP=$(aws ec2 describe-instances \
        --region "$REGION" \
        --instance-ids "$INSTANCE_ID" \
        --query 'Reservations[0].Instances[0].PublicIpAddress' \
        --output text)

    print_success "Instance running at: $PUBLIC_IP"

    # Wait for SSH to be ready
    print_info "Waiting for SSH to be ready (may take 30-60 seconds)..."
    while ! ssh -i "$HOME/.ssh/${KEY_NAME}.pem" \
              -o StrictHostKeyChecking=no \
              -o ConnectTimeout=5 \
              "ubuntu@$PUBLIC_IP" "echo 'SSH ready'" &> /dev/null; do
        sleep 5
    done

    # Save connection info
    cat > "$SCRIPT_DIR/.vm_connection_info" << EOF
PROVIDER=aws
INSTANCE_ID=$INSTANCE_ID
PUBLIC_IP=$PUBLIC_IP
REGION=$REGION
SSH_KEY=$HOME/.ssh/${KEY_NAME}.pem
SSH_USER=ubuntu
EOF

    print_success "VM provisioned successfully!"
    print_info "Connection info saved to: $SCRIPT_DIR/.vm_connection_info"
}

provision_azure() {
    print_header "Provisioning Azure VM"

    # Set default region
    if [ -z "$REGION" ]; then
        REGION="eastus"
    fi

    print_info "Provider: Azure"
    print_info "Instance Type: $INSTANCE_TYPE"
    print_info "Region: $REGION"

    # Create resource group
    RESOURCE_GROUP="qrng-validation-rg"
    print_info "Creating resource group: $RESOURCE_GROUP"
    az group create \
        --name "$RESOURCE_GROUP" \
        --location "$REGION" \
        --output none

    # Create VM
    print_info "Creating VM: $VM_NAME"

    VM_CREATE_CMD="az vm create \
        --resource-group $RESOURCE_GROUP \
        --name $VM_NAME \
        --image UbuntuLTS \
        --size Standard_$INSTANCE_TYPE \
        --admin-username azureuser \
        --generate-ssh-keys \
        --public-ip-sku Standard"

    if [ "$SPOT_INSTANCE" = true ]; then
        VM_CREATE_CMD="$VM_CREATE_CMD --priority Spot --max-price -1 --eviction-policy Deallocate"
        print_info "Using spot instance (up to 80% discount)"
    fi

    VM_INFO=$(eval "$VM_CREATE_CMD" --output json)

    PUBLIC_IP=$(echo "$VM_INFO" | jq -r '.publicIpAddress')
    print_success "VM created at: $PUBLIC_IP"

    # Save connection info
    cat > "$SCRIPT_DIR/.vm_connection_info" << EOF
PROVIDER=azure
RESOURCE_GROUP=$RESOURCE_GROUP
VM_NAME=$VM_NAME
PUBLIC_IP=$PUBLIC_IP
REGION=$REGION
SSH_KEY=$HOME/.ssh/id_rsa
SSH_USER=azureuser
EOF

    print_success "VM provisioned successfully!"
}

provision_gcp() {
    print_header "Provisioning Google Cloud VM"

    # Set default region
    if [ -z "$REGION" ]; then
        REGION="us-central1"
    fi
    ZONE="${REGION}-a"

    print_info "Provider: GCP"
    print_info "Instance Type: $INSTANCE_TYPE"
    print_info "Zone: $ZONE"

    # Get project ID
    PROJECT_ID=$(gcloud config get-value project)
    print_info "Project: $PROJECT_ID"

    # Create instance
    print_info "Creating VM: $VM_NAME"

    GCLOUD_CMD="gcloud compute instances create $VM_NAME \
        --zone=$ZONE \
        --machine-type=$INSTANCE_TYPE \
        --image-family=ubuntu-2204-lts \
        --image-project=ubuntu-os-cloud \
        --boot-disk-size=${STORAGE_SIZE}GB \
        --boot-disk-type=pd-ssd"

    if [ "$SPOT_INSTANCE" = true ]; then
        GCLOUD_CMD="$GCLOUD_CMD --preemptible"
        print_info "Using preemptible instance (up to 80% discount)"
    fi

    eval "$GCLOUD_CMD"

    # Get external IP
    PUBLIC_IP=$(gcloud compute instances describe "$VM_NAME" \
        --zone="$ZONE" \
        --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

    print_success "VM created at: $PUBLIC_IP"

    # Save connection info
    cat > "$SCRIPT_DIR/.vm_connection_info" << EOF
PROVIDER=gcp
VM_NAME=$VM_NAME
PUBLIC_IP=$PUBLIC_IP
ZONE=$ZONE
PROJECT_ID=$PROJECT_ID
SSH_KEY=$HOME/.ssh/google_compute_engine
SSH_USER=$USER
EOF

    print_success "VM provisioned successfully!"
}

setup_vm() {
    print_header "Configuring VM"

    # Load connection info
    source "$SCRIPT_DIR/.vm_connection_info"

    print_info "Uploading provisioning scripts..."
    scp -i "$SSH_KEY" \
        -o StrictHostKeyChecking=no \
        "$SCRIPT_DIR/run_validation_suite.sh" \
        "$SCRIPT_DIR/collect_results.sh" \
        "${SSH_USER}@${PUBLIC_IP}:/tmp/"

    print_info "Installing dependencies and cloning repository..."
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${SSH_USER}@${PUBLIC_IP}" << 'ENDSSH'
set -euo pipefail

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install build tools
sudo apt-get install -y \
    build-essential \
    cmake \
    git \
    libusb-1.0-0-dev \
    pkg-config \
    clang \
    llvm \
    valgrind \
    linux-tools-common \
    linux-tools-generic \
    jq \
    htop

# Verify AVX2 support
if ! grep -q avx2 /proc/cpuinfo; then
    echo "ERROR: AVX2 not supported on this CPU"
    exit 1
fi
echo "AVX2 support confirmed"

# Clone repository
cd ~
if [ ! -d "qdaria-qrng" ]; then
    git clone https://github.com/yourusername/qdaria-qrng.git
fi

# Build project
cd qdaria-qrng
mkdir -p build && cd build
cmake .. \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_CXX_FLAGS="-march=native -mavx2 -O3" \
    -DENABLE_DUDECT=ON \
    -DENABLE_BENCHMARKS=ON
make -j$(nproc)

# Move scripts to proper location
mv /tmp/run_validation_suite.sh ~/qdaria-qrng/scripts/
mv /tmp/collect_results.sh ~/qdaria-qrng/scripts/
chmod +x ~/qdaria-qrng/scripts/*.sh

echo "VM setup complete!"
ENDSSH

    print_success "VM configured and ready for validation"
}

print_connection_info() {
    print_header "Connection Information"

    # Load connection info
    source "$SCRIPT_DIR/.vm_connection_info"

    echo -e "${GREEN}SSH Command:${NC}"
    echo -e "  ssh -i $SSH_KEY ${SSH_USER}@${PUBLIC_IP}"
    echo ""
    echo -e "${GREEN}Run Validation:${NC}"
    echo -e "  ssh -i $SSH_KEY ${SSH_USER}@${PUBLIC_IP} 'cd qdaria-qrng/scripts && ./run_validation_suite.sh'"
    echo ""
    echo -e "${GREEN}Collect Results:${NC}"
    echo -e "  ./collect_results.sh"
    echo ""
    echo -e "${GREEN}Terminate VM:${NC}"
    echo -e "  ./teardown_vm.sh"
    echo ""

    # Cost estimation
    case $PROVIDER in
        aws)
            COST_PER_HOUR=0.34
            if [ "$SPOT_INSTANCE" = true ]; then
                COST_PER_HOUR=0.17
            fi
            ;;
        azure)
            COST_PER_HOUR=0.338
            if [ "$SPOT_INSTANCE" = true ]; then
                COST_PER_HOUR=0.068
            fi
            ;;
        gcp)
            COST_PER_HOUR=0.376
            if [ "$SPOT_INSTANCE" = true ]; then
                COST_PER_HOUR=0.075
            fi
            ;;
    esac

    echo -e "${YELLOW}Cost Estimation:${NC}"
    printf "  \$%.2f/hour\n" "$COST_PER_HOUR"
    printf "  \$%.2f for 3 hours (typical validation)\n" "$(echo "$COST_PER_HOUR * 3" | bc)"
    echo ""

    if [ "$AUTO_SHUTDOWN" -gt 0 ]; then
        HOURS=$(echo "scale=1; $AUTO_SHUTDOWN / 3600" | bc)
        echo -e "${YELLOW}Auto-shutdown:${NC} $HOURS hours"
    fi
}

################################################################################
# Main
################################################################################

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --provider)
            PROVIDER="$2"
            shift 2
            ;;
        --instance-type)
            INSTANCE_TYPE="$2"
            shift 2
            ;;
        --region)
            REGION="$2"
            shift 2
            ;;
        --key-name)
            KEY_NAME="$2"
            shift 2
            ;;
        --vm-name)
            VM_NAME="$2"
            shift 2
            ;;
        --storage-size)
            STORAGE_SIZE="$2"
            shift 2
            ;;
        --spot)
            SPOT_INSTANCE=true
            shift
            ;;
        --auto-shutdown)
            AUTO_SHUTDOWN="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            show_help
            ;;
        *)
            print_error "Unknown option: $1. Use --help for usage."
            ;;
    esac
done

# Main execution
print_header "QRNG x86_64 VM Provisioning"

check_prerequisites
generate_ssh_key

case $PROVIDER in
    aws)
        provision_aws
        ;;
    azure)
        provision_azure
        ;;
    gcp)
        provision_gcp
        ;;
    *)
        print_error "Unsupported provider: $PROVIDER"
        ;;
esac

setup_vm
print_connection_info

print_success "Provisioning complete! VM is ready for validation."
