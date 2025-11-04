#!/usr/bin/env bash
#
# Post-installation script
# Runs after package installation to configure the system
#

set -e

echo "Configuring QDaria QRNG..."

# Create configuration directory
CONFIG_DIR="${HOME}/.qdaria/qrng"
mkdir -p "${CONFIG_DIR}"

# Create default configuration if it doesn't exist
if [[ ! -f "${CONFIG_DIR}/config.yaml" ]]; then
    cat > "${CONFIG_DIR}/config.yaml" <<'EOF'
# QDaria QRNG Configuration
# See documentation at: https://github.com/QDaria/qrng

providers:
  ibm:
    enabled: false
    # Set your IBM Quantum token: ibm_token: "YOUR_TOKEN_HERE"

  qbraid:
    enabled: false
    # Set your QBraid API key: api_key: "YOUR_KEY_HERE"

  azure:
    enabled: false
    # Set your Azure credentials in environment variables

harvesting:
  auto_optimize: true
  batch_size: 1000
  max_retries: 3

security:
  use_kyber768: true
  entropy_pool_size: 10000

logging:
  level: INFO
  file: ~/.qdaria/qrng/qrng.log
EOF
    echo "Created default configuration at: ${CONFIG_DIR}/config.yaml"
fi

# Set permissions
chmod 700 "${CONFIG_DIR}"
chmod 600 "${CONFIG_DIR}/config.yaml"

# Create logs directory
mkdir -p "${HOME}/.qdaria/qrng/logs"

echo "Installation complete!"
echo ""
echo "Next steps:"
echo "1. Configure your quantum provider credentials in: ${CONFIG_DIR}/config.yaml"
echo "2. Run 'qrng-harvester --help' to get started"
echo "3. See documentation: https://github.com/QDaria/qrng"
