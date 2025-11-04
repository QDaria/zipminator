#!/bin/bash

# Universal installer script for Zipminator
# Detects OS and architecture, then installs from appropriate source

set -e

VERSION="0.1.0"
REPO="https://github.com/qdaria/zipminator"
RELEASES_URL="${REPO}/releases/download/v${VERSION}"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

detect_platform() {
  local OS=$(uname -s)
  local ARCH=$(uname -m)

  case "$OS" in
    Darwin)
      case "$ARCH" in
        x86_64)
          echo "x86_64-apple-darwin"
          ;;
        arm64|aarch64)
          echo "aarch64-apple-darwin"
          ;;
        *)
          print_error "Unsupported architecture: $ARCH on $OS"
          exit 1
          ;;
      esac
      ;;
    Linux)
      case "$ARCH" in
        x86_64)
          echo "x86_64-unknown-linux-gnu"
          ;;
        aarch64)
          echo "aarch64-unknown-linux-gnu"
          ;;
        armv7l)
          echo "armv7-unknown-linux-gnueabihf"
          ;;
        *)
          print_error "Unsupported architecture: $ARCH on $OS"
          exit 1
          ;;
      esac
      ;;
    *)
      print_error "Unsupported OS: $OS"
      exit 1
      ;;
  esac
}

check_prerequisites() {
  # Check if curl or wget is available
  if ! command -v curl &> /dev/null && ! command -v wget &> /dev/null; then
    print_error "curl or wget is required for installation"
    exit 1
  fi

  # Check write permissions
  if [ ! -w "$(dirname "$INSTALL_PATH")" ]; then
    print_warning "No write permission to $(dirname "$INSTALL_PATH")"
    print_info "Attempting with sudo..."
    SUDO="sudo"
  fi
}

download_binary() {
  local url="$1"
  local output="$2"

  print_info "Downloading from: $url"

  if command -v curl &> /dev/null; then
    curl -fsSL "$url" -o "$output"
  elif command -v wget &> /dev/null; then
    wget -q "$url" -O "$output"
  else
    print_error "curl or wget required"
    exit 1
  fi

  # Make executable
  chmod +x "$output"
  print_info "Downloaded successfully"
}

verify_installation() {
  if command -v zipminator &> /dev/null; then
    print_info "Installation verified!"
    zipminator --version
    return 0
  else
    print_error "Installation verification failed"
    return 1
  fi
}

main() {
  print_info "Zipminator Installer v${VERSION}"
  print_info "Installation location: ${INSTALL_PATH:-/usr/local/bin}"

  # Detect platform
  PLATFORM=$(detect_platform)
  print_info "Detected platform: $PLATFORM"

  # Set install path
  INSTALL_PATH="${INSTALL_PATH:-/usr/local/bin/zipminator}"
  TEMP_FILE="/tmp/zipminator-${PLATFORM}-${VERSION}"

  # Check prerequisites
  check_prerequisites

  # Download binary
  BINARY_URL="${RELEASES_URL}/zipminator-${PLATFORM}"
  download_binary "$BINARY_URL" "$TEMP_FILE"

  # Move to final location
  print_info "Installing to: $INSTALL_PATH"
  ${SUDO} mv "$TEMP_FILE" "$INSTALL_PATH"
  ${SUDO} chmod +x "$INSTALL_PATH"

  # Verify
  print_info "Verifying installation..."
  if verify_installation; then
    print_info "Zipminator installed successfully!"
    exit 0
  else
    print_error "Installation failed"
    exit 1
  fi
}

# Handle options
case "${1:-}" in
  --help|-h)
    cat << EOF
Zipminator Installer

Usage: $0 [OPTIONS]

Options:
  --prefix DIR      Installation directory (default: /usr/local/bin)
  --help           Show this help message

Examples:
  $0                                    # Install to /usr/local/bin
  $0 --prefix ~/.local/bin             # Install to user directory

EOF
    exit 0
    ;;
  --prefix)
    INSTALL_PATH="${2}/zipminator"
    shift 2
    main
    ;;
  *)
    main
    ;;
esac
