#!/bin/bash
# IBM Quantum QRNG Harvester - Automation Wrapper
# Usage: ./harvest_quantum_entropy.sh [OPTIONS]

set -e  # Exit on error

# Default configuration
SHOTS=1000
BITS=8
CONFIG="config/ibm_qrng_config.yaml"
TOKEN="${IBM_QUANTUM_TOKEN}"
OUTPUT_DIR="data/quantum_entropy"
ENCRYPT=true
BATCH_MODE=false
BATCH_COUNT=1
ESTIMATE_ONLY=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Help message
show_help() {
    cat << EOF
IBM Quantum QRNG Harvester - Automation Wrapper

USAGE:
    ./harvest_quantum_entropy.sh [OPTIONS]

OPTIONS:
    -s, --shots NUM         Number of quantum shots (default: 1000)
    -b, --bits NUM          Number of qubits/bits (default: 8)
    -t, --token TOKEN       IBM Quantum token (or set IBM_QUANTUM_TOKEN env var)
    -c, --config FILE       Configuration file (default: config/ibm_qrng_config.yaml)
    -o, --output DIR        Output directory (default: data/quantum_entropy)
    --no-encrypt            Disable output encryption
    --batch NUM             Run NUM jobs in batch mode
    --estimate              Show cost estimate only
    -h, --help              Show this help message

EXAMPLES:
    # Basic harvest (1000 shots)
    ./harvest_quantum_entropy.sh

    # Harvest 5000 shots
    ./harvest_quantum_entropy.sh --shots 5000

    # Batch harvest (5 jobs x 1000 shots)
    ./harvest_quantum_entropy.sh --batch 5

    # Estimate only (no actual harvest)
    ./harvest_quantum_entropy.sh --estimate --shots 2000

    # Custom token and output
    ./harvest_quantum_entropy.sh --token "your_token_here" --output /custom/path

ENVIRONMENT VARIABLES:
    IBM_QUANTUM_TOKEN       IBM Quantum API token
    QRNG_ENCRYPTION_KEY     Encryption password for output files

NOTES:
    - IBM free tier provides 10 minutes of quantum computing time
    - Recommended: 500-1000 shots per job for optimal efficiency
    - Large batches may exceed free tier limits
    - Set IBM_QUANTUM_TOKEN environment variable to avoid passing token via CLI

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--shots)
            SHOTS="$2"
            shift 2
            ;;
        -b|--bits)
            BITS="$2"
            shift 2
            ;;
        -t|--token)
            TOKEN="$2"
            shift 2
            ;;
        -c|--config)
            CONFIG="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --no-encrypt)
            ENCRYPT=false
            shift
            ;;
        --batch)
            BATCH_MODE=true
            BATCH_COUNT="$2"
            shift 2
            ;;
        --estimate)
            ESTIMATE_ONLY=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Check for required dependencies
check_dependencies() {
    echo -e "${BLUE}Checking dependencies...${NC}"

    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}ERROR: python3 not found${NC}"
        exit 1
    fi

    # Check Python packages
    python3 -c "import qiskit" 2>/dev/null || {
        echo -e "${RED}ERROR: qiskit not installed${NC}"
        echo "Install with: pip install qiskit qiskit-ibm-runtime"
        exit 1
    }

    python3 -c "import yaml" 2>/dev/null || {
        echo -e "${RED}ERROR: pyyaml not installed${NC}"
        echo "Install with: pip install pyyaml"
        exit 1
    }

    python3 -c "import cryptography" 2>/dev/null || {
        echo -e "${RED}ERROR: cryptography not installed${NC}"
        echo "Install with: pip install cryptography"
        exit 1
    }

    echo -e "${GREEN}✓ All dependencies satisfied${NC}"
}

# Check token
check_token() {
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}ERROR: IBM Quantum token not provided${NC}"
        echo "Set IBM_QUANTUM_TOKEN environment variable or use --token option"
        echo ""
        echo "Get your token at: https://quantum.ibm.com/account"
        exit 1
    fi

    echo -e "${GREEN}✓ Token found${NC}"
}

# Create directories
setup_directories() {
    mkdir -p "$OUTPUT_DIR"
    mkdir -p logs
    mkdir -p data/quantum_entropy
    echo -e "${GREEN}✓ Directories created${NC}"
}

# Run harvester
run_harvest() {
    local job_num=$1
    local total_jobs=$2

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  Job $job_num/$total_jobs: Harvesting $SHOTS shots${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # Build command
    CMD="python3 src/python/ibm_qrng_harvester.py"
    CMD="$CMD --shots $SHOTS"
    CMD="$CMD --bits $BITS"
    CMD="$CMD --token $TOKEN"
    CMD="$CMD --config $CONFIG"

    if [ "$ENCRYPT" = false ]; then
        CMD="$CMD --no-encrypt"
    fi

    if [ "$ESTIMATE_ONLY" = true ]; then
        CMD="$CMD --estimate-only"
    fi

    # Run
    echo -e "${YELLOW}Running: $CMD${NC}"
    echo ""

    if $CMD; then
        echo ""
        echo -e "${GREEN}✓ Job $job_num completed successfully${NC}"
        return 0
    else
        echo ""
        echo -e "${RED}✗ Job $job_num failed${NC}"
        return 1
    fi
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║     IBM Quantum QRNG Harvester - Automation Wrapper      ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    # Checks
    check_dependencies
    check_token
    setup_directories

    echo ""
    echo -e "${BLUE}Configuration:${NC}"
    echo "  Shots per job: $SHOTS"
    echo "  Qubits/bits: $BITS"
    echo "  Config file: $CONFIG"
    echo "  Output directory: $OUTPUT_DIR"
    echo "  Encryption: $ENCRYPT"
    echo "  Batch mode: $BATCH_MODE"
    if [ "$BATCH_MODE" = true ]; then
        echo "  Batch count: $BATCH_COUNT jobs"
    fi
    echo ""

    # Run harvest
    if [ "$BATCH_MODE" = true ]; then
        echo -e "${YELLOW}Running batch harvest: $BATCH_COUNT jobs${NC}"

        success_count=0
        fail_count=0

        for ((i=1; i<=BATCH_COUNT; i++)); do
            if run_harvest $i $BATCH_COUNT; then
                ((success_count++))
            else
                ((fail_count++))
            fi

            # Delay between jobs (except last one)
            if [ $i -lt $BATCH_COUNT ]; then
                echo -e "${YELLOW}Waiting 10 seconds before next job...${NC}"
                sleep 10
            fi
        done

        # Summary
        echo ""
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BLUE}  BATCH HARVEST SUMMARY${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "  Total jobs: $BATCH_COUNT"
        echo -e "  ${GREEN}Successful: $success_count${NC}"
        echo -e "  ${RED}Failed: $fail_count${NC}"
        echo -e "  Total bytes harvested: $((success_count * SHOTS)) bytes"
        echo ""

        if [ $fail_count -eq 0 ]; then
            echo -e "${GREEN}✓ All batch jobs completed successfully!${NC}"
            exit 0
        else
            echo -e "${YELLOW}⚠ Some batch jobs failed${NC}"
            exit 1
        fi
    else
        # Single job
        if run_harvest 1 1; then
            echo ""
            echo -e "${GREEN}✓ Harvest completed successfully!${NC}"
            echo ""
            echo -e "${BLUE}Output location: $OUTPUT_DIR${NC}"
            echo -e "${BLUE}Logs: logs/ibm_qrng_harvester.log${NC}"
            exit 0
        else
            echo ""
            echo -e "${RED}✗ Harvest failed${NC}"
            exit 1
        fi
    fi
}

# Run main
main
