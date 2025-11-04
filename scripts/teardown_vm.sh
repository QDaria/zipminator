#!/bin/bash

################################################################################
# teardown_vm.sh
#
# Safely terminate x86_64 VM and cleanup resources
# Prevents runaway cloud costs after validation
#
# Usage:
#   ./teardown_vm.sh [OPTIONS]
#   ./teardown_vm.sh --force      # Skip confirmation
#   ./teardown_vm.sh --keep-data  # Keep downloaded results
################################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONNECTION_FILE="$SCRIPT_DIR/.vm_connection_info"
FORCE=false
KEEP_DATA=false

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
    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

show_help() {
    cat << EOF
Usage: $0 [OPTIONS]

Safely terminate x86_64 VM and cleanup resources

OPTIONS:
    --force         Skip confirmation prompts
    --keep-data     Keep downloaded results (default: delete)
    --help          Show this help message

EXAMPLES:
    # Interactive teardown
    $0

    # Force teardown without confirmation
    $0 --force

    # Teardown but keep results
    $0 --keep-data

IMPORTANT:
    This script will permanently delete the VM and associated resources.
    Make sure you have downloaded all validation results before running.

EOF
    exit 0
}

check_connection_info() {
    if [ ! -f "$CONNECTION_FILE" ]; then
        print_warning "No VM connection info found."
        print_info "Either VM was not provisioned or already terminated."
        exit 0
    fi

    source "$CONNECTION_FILE"
}

confirm_teardown() {
    if [ "$FORCE" = true ]; then
        return 0
    fi

    print_header "VM Teardown Confirmation"

    source "$CONNECTION_FILE"

    echo -e "${YELLOW}This will permanently delete:${NC}"
    echo "  Provider: $PROVIDER"
    echo "  VM: $VM_NAME"
    echo "  IP: $PUBLIC_IP"
    echo ""
    echo -e "${RED}This action CANNOT be undone!${NC}"
    echo ""

    read -p "Are you sure you want to terminate the VM? (yes/no): " -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Teardown cancelled."
        exit 0
    fi
}

check_results_downloaded() {
    if [ "$FORCE" = true ]; then
        return 0
    fi

    print_header "Checking Downloaded Results"

    local results_dir="$SCRIPT_DIR/../results"

    if [ -d "$results_dir" ] && [ "$(ls -A "$results_dir" 2>/dev/null)" ]; then
        local file_count=$(ls -1 "$results_dir" | wc -l)
        print_success "Found $file_count result files in $results_dir"
        return 0
    else
        print_warning "No results found in $results_dir"
        echo ""
        read -p "Results may not be downloaded. Continue teardown? (yes/no): " -r
        echo ""

        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            print_info "Teardown cancelled. Run ./collect_results.sh first."
            exit 0
        fi
    fi
}

teardown_aws() {
    print_header "Terminating AWS EC2 Instance"

    source "$CONNECTION_FILE"

    print_info "Terminating instance: $INSTANCE_ID"
    aws ec2 terminate-instances \
        --region "$REGION" \
        --instance-ids "$INSTANCE_ID" \
        --output text

    print_info "Waiting for instance to terminate..."
    aws ec2 wait instance-terminated \
        --region "$REGION" \
        --instance-ids "$INSTANCE_ID"

    print_success "Instance terminated"

    # Optional: Delete security group
    if [ "$FORCE" = true ]; then
        print_info "Deleting security group..."
        aws ec2 delete-security-group \
            --region "$REGION" \
            --group-id "$SG_ID" 2>/dev/null || true
    fi
}

teardown_azure() {
    print_header "Deleting Azure VM"

    source "$CONNECTION_FILE"

    print_info "Deleting resource group: $RESOURCE_GROUP"
    print_warning "This will delete ALL resources in the resource group"

    az group delete \
        --name "$RESOURCE_GROUP" \
        --yes \
        --no-wait

    print_success "Deletion initiated (running in background)"
    print_info "Check status: az group show --name $RESOURCE_GROUP"
}

teardown_gcp() {
    print_header "Deleting Google Cloud VM"

    source "$CONNECTION_FILE"

    print_info "Deleting instance: $VM_NAME"
    gcloud compute instances delete "$VM_NAME" \
        --zone="$ZONE" \
        --quiet

    print_success "Instance deleted"
}

cleanup_local_data() {
    print_header "Cleaning Up Local Data"

    # Remove connection info
    if [ -f "$CONNECTION_FILE" ]; then
        rm "$CONNECTION_FILE"
        print_info "Removed connection info"
    fi

    # Remove results if not keeping
    if [ "$KEEP_DATA" = false ]; then
        local results_dir="$SCRIPT_DIR/../results"
        if [ -d "$results_dir" ]; then
            print_warning "Deleting local results: $results_dir"
            rm -rf "$results_dir"
            print_info "Local results deleted"
        fi
    else
        print_info "Keeping local results"
    fi

    print_success "Local cleanup complete"
}

calculate_total_cost() {
    print_header "Cost Summary"

    source "$CONNECTION_FILE"

    # Calculate uptime
    local provision_time=$(stat -f %B "$CONNECTION_FILE" 2>/dev/null || stat -c %Y "$CONNECTION_FILE")
    local current_time=$(date +%s)
    local uptime_seconds=$((current_time - provision_time))
    local uptime_hours=$(echo "scale=2; $uptime_seconds / 3600" | bc)

    # Estimate cost
    local cost_per_hour=0
    case $PROVIDER in
        aws)
            cost_per_hour=0.34
            ;;
        azure)
            cost_per_hour=0.338
            ;;
        gcp)
            cost_per_hour=0.376
            ;;
    esac

    local total_cost=$(echo "scale=2; $uptime_hours * $cost_per_hour" | bc)

    print_info "VM Uptime: ${uptime_hours} hours"
    print_info "Cost Rate: \$${cost_per_hour}/hour"
    print_success "Estimated Total Cost: \$${total_cost}"
}

################################################################################
# Main Execution
################################################################################

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE=true
            shift
            ;;
        --keep-data)
            KEEP_DATA=true
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
print_header "QRNG VM Teardown"

check_connection_info
check_results_downloaded
confirm_teardown

source "$CONNECTION_FILE"

case $PROVIDER in
    aws)
        teardown_aws
        ;;
    azure)
        teardown_azure
        ;;
    gcp)
        teardown_gcp
        ;;
    *)
        print_error "Unknown provider: $PROVIDER"
        ;;
esac

calculate_total_cost
cleanup_local_data

print_success "Teardown complete!"
print_info "VM and associated resources have been terminated."

if [ "$KEEP_DATA" = true ]; then
    print_info "Results preserved in: $SCRIPT_DIR/../results"
fi
