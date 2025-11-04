#!/bin/bash

################################################################################
# collect_results.sh
#
# Collect validation results from remote x86_64 VM
# Downloads results, generates reports, archives artifacts
#
# Usage:
#   ./collect_results.sh [OPTIONS]
#   ./collect_results.sh --format html     # Generate HTML report
#   ./collect_results.sh --compress        # Create compressed archive
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
LOCAL_RESULTS_DIR="$SCRIPT_DIR/../results"
REMOTE_RESULTS_DIR="~/qdaria-qrng/results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_NAME="qrng_validation_${TIMESTAMP}.tar.gz"
GENERATE_HTML=false
COMPRESS=false

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

Collect validation results from remote x86_64 VM

OPTIONS:
    --format FORMAT     Output format: text, json, html (default: text)
    --compress          Create compressed archive
    --upload            Upload results to cloud storage
    --clean             Remove results from VM after download
    --help              Show this help message

EXAMPLES:
    # Download results
    $0

    # Download and generate HTML report
    $0 --format html

    # Download, compress, and clean up VM
    $0 --compress --clean

EOF
    exit 0
}

check_connection() {
    print_header "Checking VM Connection"

    if [ ! -f "$CONNECTION_FILE" ]; then
        print_error "VM connection info not found. Run provision_x86_64_vm.sh first."
    fi

    source "$CONNECTION_FILE"

    print_info "Provider: $PROVIDER"
    print_info "VM: $PUBLIC_IP"
    print_info "User: $SSH_USER"

    # Test SSH connection
    if ! ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=5 \
         "${SSH_USER}@${PUBLIC_IP}" "echo 'Connection OK'" &> /dev/null; then
        print_error "Cannot connect to VM. Check if VM is running."
    fi

    print_success "VM connection verified"
}

download_results() {
    print_header "Downloading Results"

    mkdir -p "$LOCAL_RESULTS_DIR"

    source "$CONNECTION_FILE"

    print_info "Downloading from: ${SSH_USER}@${PUBLIC_IP}:${REMOTE_RESULTS_DIR}"
    print_info "Saving to: $LOCAL_RESULTS_DIR"

    # Download all results
    rsync -avz --progress \
        -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
        "${SSH_USER}@${PUBLIC_IP}:${REMOTE_RESULTS_DIR}/" \
        "$LOCAL_RESULTS_DIR/"

    if [ $? -eq 0 ]; then
        print_success "Results downloaded successfully"
    else
        print_error "Failed to download results"
    fi

    # List downloaded files
    echo ""
    print_info "Downloaded files:"
    ls -lh "$LOCAL_RESULTS_DIR" | tail -n +2 | awk '{printf "  %s (%s)\n", $9, $5}'
}

parse_results() {
    print_header "Parsing Results"

    # Find latest results
    local latest_dudect=$(ls -t "$LOCAL_RESULTS_DIR"/dudect_*.json 2>/dev/null | head -n 1)
    local latest_benchmark=$(ls -t "$LOCAL_RESULTS_DIR"/benchmark_*.json 2>/dev/null | head -n 1)
    local latest_summary=$(ls -t "$LOCAL_RESULTS_DIR"/validation_summary_*.txt 2>/dev/null | head -n 1)

    # Parse dudect results
    if [ -n "$latest_dudect" ] && [ -f "$latest_dudect" ]; then
        print_info "dudect Results:"
        echo ""
        jq -r '
            "  Samples:      \(.samples | tonumber | tostring | sub("(?<a>[0-9]{1,3})(?<b>[0-9]{3})(?<c>[0-9]{3})$"; "\(.a),\(.b),\(.c)"))",
            "  t-statistic:  \(.t_statistic)",
            "  Confidence:   \(.confidence * 100)%",
            "  Result:       \(.result)",
            "  Duration:     \(.duration_seconds)s"
        ' "$latest_dudect"
        echo ""

        local t_stat=$(jq -r '.t_statistic' "$latest_dudect")
        local result=$(jq -r '.result' "$latest_dudect")

        if [ "$result" == "PASS" ]; then
            echo -e "  ${GREEN}✓ Constant-time validation PASSED${NC}"
        else
            echo -e "  ${RED}✗ Constant-time validation FAILED${NC}"
        fi
    else
        print_warning "No dudect results found"
    fi

    echo ""

    # Parse benchmark results
    if [ -n "$latest_benchmark" ] && [ -f "$latest_benchmark" ]; then
        print_info "Performance Benchmarks:"
        echo ""

        jq -r '
            .operations | to_entries[] |
            "  \(.key | ascii_upcase):",
            "    Average: \(.value.average_us) μs",
            "    Std Dev: \(.value.stddev_us) μs",
            "    Min:     \(.value.min_us) μs",
            "    Max:     \(.value.max_us) μs",
            "    Median:  \(.value.median_us) μs",
            ""
        ' "$latest_benchmark"

        # Performance evaluation
        local keygen_avg=$(jq -r '.operations.keygen.average_us' "$latest_benchmark")
        local encaps_avg=$(jq -r '.operations.encaps.average_us' "$latest_benchmark")
        local decaps_avg=$(jq -r '.operations.decaps.average_us' "$latest_benchmark")

        echo -e "  ${CYAN}Performance Targets:${NC}"
        printf "    KeyGen: %.2f μs " "$keygen_avg"
        if (( $(echo "$keygen_avg < 30" | bc -l) )); then
            echo -e "${GREEN}✓ (<30μs target)${NC}"
        else
            echo -e "${YELLOW}⚠ (target: <30μs)${NC}"
        fi

        printf "    Encaps: %.2f μs " "$encaps_avg"
        if (( $(echo "$encaps_avg < 40" | bc -l) )); then
            echo -e "${GREEN}✓ (<40μs target)${NC}"
        else
            echo -e "${YELLOW}⚠ (target: <40μs)${NC}"
        fi

        printf "    Decaps: %.2f μs " "$decaps_avg"
        if (( $(echo "$decaps_avg < 45" | bc -l) )); then
            echo -e "${GREEN}✓ (<45μs target)${NC}"
        else
            echo -e "${YELLOW}⚠ (target: <45μs)${NC}"
        fi
    else
        print_warning "No benchmark results found"
    fi

    echo ""

    # Show summary
    if [ -n "$latest_summary" ] && [ -f "$latest_summary" ]; then
        print_info "Validation Summary:"
        echo ""
        cat "$latest_summary"
    fi
}

generate_html_report() {
    print_header "Generating HTML Report"

    local html_file="$LOCAL_RESULTS_DIR/validation_report_${TIMESTAMP}.html"
    local latest_dudect=$(ls -t "$LOCAL_RESULTS_DIR"/dudect_*.json 2>/dev/null | head -n 1)
    local latest_benchmark=$(ls -t "$LOCAL_RESULTS_DIR"/benchmark_*.json 2>/dev/null | head -n 1)

    cat > "$html_file" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QRNG Kyber768 Validation Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0 0 10px 0;
        }
        .card {
            background: white;
            border-radius: 10px;
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .card h2 {
            margin-top: 0;
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .metric {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .metric:last-child {
            border-bottom: none;
        }
        .metric-label {
            font-weight: 600;
            color: #555;
        }
        .metric-value {
            color: #333;
        }
        .status-pass {
            color: #10b981;
            font-weight: 600;
        }
        .status-fail {
            color: #ef4444;
            font-weight: 600;
        }
        .status-warning {
            color: #f59e0b;
            font-weight: 600;
        }
        .chart {
            margin: 20px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        th {
            background: #f8f9fa;
            font-weight: 600;
            color: #555;
        }
        .footer {
            text-align: center;
            color: #888;
            margin-top: 40px;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>QRNG Kyber768 Validation Report</h1>
        <p>Generated: <span id="timestamp"></span></p>
    </div>

    <div class="card">
        <h2>Constant-Time Validation (dudect)</h2>
        <div id="dudect-results"></div>
    </div>

    <div class="card">
        <h2>Performance Benchmarks</h2>
        <div id="benchmark-results"></div>
    </div>

    <div class="card">
        <h2>System Information</h2>
        <div id="system-info"></div>
    </div>

    <div class="footer">
        <p>QRNG Kyber768 Implementation - Zipminator Week 1</p>
    </div>

    <script>
        // Set timestamp
        document.getElementById('timestamp').textContent = new Date().toLocaleString();

        // Load dudect results
        const dudectData = DUDECT_DATA_PLACEHOLDER;
        if (dudectData) {
            const dudectDiv = document.getElementById('dudect-results');
            const statusClass = dudectData.result === 'PASS' ? 'status-pass' : 'status-fail';
            dudectDiv.innerHTML = `
                <div class="metric">
                    <span class="metric-label">Samples</span>
                    <span class="metric-value">${dudectData.samples.toLocaleString()}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">t-statistic</span>
                    <span class="metric-value">${dudectData.t_statistic}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Confidence</span>
                    <span class="metric-value">${(dudectData.confidence * 100).toFixed(1)}%</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Result</span>
                    <span class="metric-value ${statusClass}">${dudectData.result}</span>
                </div>
            `;
        }

        // Load benchmark results
        const benchmarkData = BENCHMARK_DATA_PLACEHOLDER;
        if (benchmarkData && benchmarkData.operations) {
            const benchmarkDiv = document.getElementById('benchmark-results');
            let tableHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Operation</th>
                            <th>Average (μs)</th>
                            <th>Std Dev (μs)</th>
                            <th>Min (μs)</th>
                            <th>Max (μs)</th>
                            <th>Target</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            const targets = {
                keygen: 30,
                encaps: 40,
                decaps: 45,
                full_cycle: 110
            };

            for (const [op, data] of Object.entries(benchmarkData.operations)) {
                const target = targets[op];
                const statusClass = data.average_us < target ? 'status-pass' : 'status-warning';
                tableHTML += `
                    <tr>
                        <td>${op.toUpperCase()}</td>
                        <td class="${statusClass}">${data.average_us.toFixed(2)}</td>
                        <td>${data.stddev_us.toFixed(2)}</td>
                        <td>${data.min_us.toFixed(2)}</td>
                        <td>${data.max_us.toFixed(2)}</td>
                        <td><${target}μs</td>
                    </tr>
                `;
            }

            tableHTML += '</tbody></table>';
            benchmarkDiv.innerHTML = tableHTML;
        }
    </script>
</body>
</html>
EOF

    # Inject data
    if [ -n "$latest_dudect" ] && [ -f "$latest_dudect" ]; then
        local dudect_json=$(cat "$latest_dudect")
        sed -i.bak "s/DUDECT_DATA_PLACEHOLDER/${dudect_json}/" "$html_file"
    fi

    if [ -n "$latest_benchmark" ] && [ -f "$latest_benchmark" ]; then
        local benchmark_json=$(cat "$latest_benchmark")
        sed -i.bak "s/BENCHMARK_DATA_PLACEHOLDER/${benchmark_json}/" "$html_file"
    fi

    rm -f "${html_file}.bak"

    print_success "HTML report generated: $html_file"
}

create_archive() {
    print_header "Creating Archive"

    cd "$(dirname "$LOCAL_RESULTS_DIR")"
    tar -czf "$ARCHIVE_NAME" "$(basename "$LOCAL_RESULTS_DIR")"

    if [ $? -eq 0 ]; then
        local size=$(du -h "$ARCHIVE_NAME" | cut -f1)
        print_success "Archive created: $ARCHIVE_NAME ($size)"
    else
        print_error "Failed to create archive"
    fi
}

clean_remote_results() {
    print_header "Cleaning Remote Results"

    source "$CONNECTION_FILE"

    print_info "Removing results from VM..."
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no \
        "${SSH_USER}@${PUBLIC_IP}" \
        "rm -rf ${REMOTE_RESULTS_DIR}/*"

    if [ $? -eq 0 ]; then
        print_success "Remote results cleaned"
    else
        print_warning "Failed to clean remote results"
    fi
}

################################################################################
# Main Execution
################################################################################

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --format)
            FORMAT="$2"
            if [ "$FORMAT" == "html" ]; then
                GENERATE_HTML=true
            fi
            shift 2
            ;;
        --compress)
            COMPRESS=true
            shift
            ;;
        --clean)
            CLEAN=true
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
print_header "QRNG Results Collection"

check_connection
download_results
parse_results

if [ "$GENERATE_HTML" = true ]; then
    generate_html_report
fi

if [ "$COMPRESS" = true ]; then
    create_archive
fi

if [ "$CLEAN" = true ]; then
    clean_remote_results
fi

print_success "Results collection complete!"
print_info "Results location: $LOCAL_RESULTS_DIR"

if [ "$COMPRESS" = true ]; then
    print_info "Archive: $(dirname "$LOCAL_RESULTS_DIR")/$ARCHIVE_NAME"
fi
