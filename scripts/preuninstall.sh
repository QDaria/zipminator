#!/usr/bin/env bash
#
# Pre-uninstall script
# Runs before package removal
#

set -e

echo "Preparing to uninstall QDaria QRNG..."

# Ask user if they want to keep configuration
read -p "Keep configuration files? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Removing configuration files..."
    rm -rf "${HOME}/.qdaria/qrng"
    echo "Configuration removed."
else
    echo "Configuration files preserved at: ${HOME}/.qdaria/qrng"
fi

echo "Uninstall preparation complete."
