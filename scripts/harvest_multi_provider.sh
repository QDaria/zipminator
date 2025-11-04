#!/bin/bash

# Multi-Provider Quantum Entropy Harvester
# Automated script for harvesting quantum random numbers from any provider

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
TARGET_BYTES=1000
PROVIDER="auto"
OUTPUT_DIR="data/quantum_entropy"
CONFIG_FILE="config/multi_provider_config.yaml"
OPTIMIZE_FOR="balanced"
MAX_COST=""
MAX_TIME=""
VERBOSE=false

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PYTHON_DIR="$PROJECT_DIR/src/python"

# Function to print colored messages
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

# Function to display usage
usage() {
    cat << EOF
Multi-Provider Quantum Entropy Harvester

Usage: $0 [OPTIONS]

OPTIONS:
    -b, --bytes NUM           Number of random bytes to generate (default: 1000)
    -p, --provider PROVIDER   Provider to use: auto, ibm, qbraid, ionq, rigetti, aws, oqc (default: auto)
    -o, --output DIR          Output directory (default: data/quantum_entropy)
    -c, --config FILE         Configuration file (default: config/multi_provider_config.yaml)
    -g, --goal GOAL           Optimization goal: balanced, cost, time, jobs, quality (default: balanced)
    -C, --max-cost AMOUNT     Maximum cost in USD
    -T, --max-time SECONDS    Maximum time in seconds
    -v, --verbose             Enable verbose output
    -h, --help                Display this help message

EXAMPLES:
    # Generate 1KB using best available provider
    $0 -b 1024

    # Generate 10KB from IBM Brisbane, optimize for cost
    $0 -b 10240 -p ibm -g cost

    # Generate 1MB with constraints
    $0 -b 1048576 -C 10.00 -T 3600

    # Use qBraid with verbose output
    $0 -b 1000 -p qbraid -v

PROVIDERS:
    auto     - Automatically select best provider (default)
    ibm      - IBM Quantum (127 qubit Brisbane/Kyoto)
    qbraid   - qBraid unified API
    ionq     - IonQ Harmony (11 qubit trapped ion)
    rigetti  - Rigetti Aspen (superconducting)
    aws      - AWS Braket
    oqc      - Oxford Quantum Circuits

OPTIMIZATION GOALS:
    balanced - Balance all factors (default)
    cost     - Minimize credit usage
    time     - Minimize wall-clock time
    jobs     - Minimize number of jobs
    quality  - Maximize randomness quality

ENVIRONMENT VARIABLES:
    IBM_QUANTUM_TOKEN     - IBM Quantum API token
    QBRAID_API_KEY        - qBraid API key
    AWS_ACCESS_KEY_ID     - AWS access key
    AWS_SECRET_ACCESS_KEY - AWS secret key
    IONQ_API_KEY          - IonQ API key
    RIGETTI_API_KEY       - Rigetti API key
    OQC_API_KEY           - OQC API key

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -b|--bytes)
                TARGET_BYTES="$2"
                shift 2
                ;;
            -p|--provider)
                PROVIDER="$2"
                shift 2
                ;;
            -o|--output)
                OUTPUT_DIR="$2"
                shift 2
                ;;
            -c|--config)
                CONFIG_FILE="$2"
                shift 2
                ;;
            -g|--goal)
                OPTIMIZE_FOR="$2"
                shift 2
                ;;
            -C|--max-cost)
                MAX_COST="$2"
                shift 2
                ;;
            -T|--max-time)
                MAX_TIME="$2"
                shift 2
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
}

# Check environment setup
check_environment() {
    log_info "Checking environment..."

    # Check Python
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 not found. Please install Python 3.8+"
        exit 1
    fi

    # Check required Python packages
    local packages=("qiskit" "numpy")
    local missing=()

    for package in "${packages[@]}"; do
        if ! python3 -c "import $package" 2>/dev/null; then
            missing+=("$package")
        fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
        log_warning "Missing Python packages: ${missing[*]}"
        log_info "Installing missing packages..."
        pip3 install "${missing[@]}"
    fi

    # Check for at least one provider credential
    local has_creds=false
    if [ -n "${IBM_QUANTUM_TOKEN:-}" ]; then
        log_success "IBM Quantum credentials found"
        has_creds=true
    fi
    if [ -n "${QBRAID_API_KEY:-}" ]; then
        log_success "qBraid credentials found"
        has_creds=true
    fi
    if [ -n "${AWS_ACCESS_KEY_ID:-}" ]; then
        log_success "AWS credentials found"
        has_creds=true
    fi

    if [ "$has_creds" = false ]; then
        log_warning "No provider credentials found in environment"
        log_info "Will use simulator fallback"
    fi

    # Create output directory
    mkdir -p "$OUTPUT_DIR"

    log_success "Environment check complete"
}

# Generate unique filename
generate_filename() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local provider_suffix="${PROVIDER}"
    echo "${OUTPUT_DIR}/quantum_entropy_${TARGET_BYTES}bytes_${provider_suffix}_${timestamp}.bin"
}

# Run optimization analysis
analyze_optimization() {
    log_info "Analyzing optimal strategy..."

    local cmd="python3 $PYTHON_DIR/credit_optimizer.py"

    if [ "$VERBOSE" = true ]; then
        eval "$cmd"
    else
        eval "$cmd" > /dev/null 2>&1
    fi
}

# Harvest quantum entropy
harvest_entropy() {
    log_info "Harvesting $TARGET_BYTES bytes of quantum entropy..."
    log_info "Provider: $PROVIDER"
    log_info "Optimization goal: $OPTIMIZE_FOR"

    local output_file=$(generate_filename)

    # Build Python command
    local python_cmd="
import sys
sys.path.append('$PYTHON_DIR')
from multi_provider_harvester import MultiProviderHarvester, QuantumProvider

# Initialize harvester
harvester = MultiProviderHarvester()

# Show status
if $VERBOSE:
    status = harvester.get_provider_status()
    print('Initialized providers:', status['initialized_providers'])
    print('Available backends:', status['total_backends'])

# Map provider name to enum
provider_map = {
    'auto': None,
    'ibm': QuantumProvider.IBM_DIRECT,
    'qbraid': QuantumProvider.QBRAID_IBM,
    'ionq': QuantumProvider.IONQ,
    'rigetti': QuantumProvider.RIGETTI,
    'aws': QuantumProvider.AWS_BRAKET,
    'oqc': QuantumProvider.OQC
}

provider = provider_map.get('$PROVIDER')

# Harvest entropy
try:
    entropy = harvester.harvest_quantum_entropy(
        num_bytes=$TARGET_BYTES,
        provider=provider
    )

    # Save to file
    with open('$output_file', 'wb') as f:
        f.write(entropy)

    print('SUCCESS:$output_file')

except Exception as e:
    print(f'ERROR: {e}', file=sys.stderr)
    sys.exit(1)
"

    # Execute Python command
    local result=$(python3 -c "$python_cmd")

    if [[ $result == SUCCESS:* ]]; then
        local saved_file="${result#SUCCESS:}"
        log_success "Quantum entropy harvested successfully!"
        log_info "Output file: $saved_file"
        log_info "File size: $(stat -f%z "$saved_file" 2>/dev/null || stat -c%s "$saved_file" 2>/dev/null) bytes"

        # Show file hash
        if command -v sha256sum &> /dev/null; then
            local hash=$(sha256sum "$saved_file" | cut -d' ' -f1)
        elif command -v shasum &> /dev/null; then
            local hash=$(shasum -a 256 "$saved_file" | cut -d' ' -f1)
        else
            local hash="(sha256 not available)"
        fi
        log_info "SHA-256: $hash"

    else
        log_error "Harvest failed!"
        return 1
    fi
}

# Run quality tests
run_quality_tests() {
    log_info "Running quality tests..."

    # TODO: Implement NIST and Dieharder tests
    log_warning "Quality tests not yet implemented"
}

# Main function
main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║   Multi-Provider Quantum Random Number Generator          ║"
    echo "║   Support: IBM, qBraid, IonQ, Rigetti, AWS Braket, OQC    ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""

    parse_args "$@"
    check_environment

    if [ "$VERBOSE" = true ]; then
        analyze_optimization
    fi

    harvest_entropy

    echo ""
    log_success "Harvest complete!"
    echo ""
}

# Run main function
main "$@"
