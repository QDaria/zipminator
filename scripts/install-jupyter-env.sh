#!/usr/bin/env bash
# install-jupyter-env.sh — One-click Zipminator PQC + JupyterLab installer
# Usage: bash scripts/install-jupyter-env.sh [--auto-launch]
set -euo pipefail

ENV_NAME="zip-pqc"
CHANNEL="conda-forge"
PYTHON_VER="3.11"
KERNEL_NAME="zip-pqc-kernel"
TUTORIAL_DIR="${HOME}/zipminator-tutorials"
AUTO_LAUNCH=false

for arg in "$@"; do
    case "$arg" in
        --auto-launch) AUTO_LAUNCH=true ;;
    esac
done

echo "=== Zipminator One-Click Installer ==="
echo "Environment: $ENV_NAME"
echo ""

# ---------------------------------------------------------------------------
# 0. Detect OS and architecture
# ---------------------------------------------------------------------------
OS="$(uname -s)"
ARCH="$(uname -m)"
echo "[0/8] Platform: $OS $ARCH"

case "$OS" in
    Darwin)
        PLATFORM="macOS"
        if [ "$ARCH" = "arm64" ]; then
            PLATFORM_DETAIL="macOS ARM64 (Apple Silicon)"
        else
            PLATFORM_DETAIL="macOS Intel"
        fi
        ;;
    Linux)
        PLATFORM="Linux"
        PLATFORM_DETAIL="Linux $ARCH"
        # Check for WSL
        if grep -qi microsoft /proc/version 2>/dev/null; then
            PLATFORM_DETAIL="WSL ($ARCH)"
        fi
        ;;
    *)
        echo "WARNING: Unsupported OS '$OS'. Attempting Linux-compatible install."
        PLATFORM="Linux"
        PLATFORM_DETAIL="Unknown ($OS $ARCH)"
        ;;
esac
echo "       Detected: $PLATFORM_DETAIL"
echo ""

# ---------------------------------------------------------------------------
# 1. Ensure micromamba is available
# ---------------------------------------------------------------------------
if ! command -v micromamba &>/dev/null; then
    echo "[1/8] Installing micromamba..."
    "${SHELL}" <(curl -L micro.mamba.pm/install.sh) </dev/null
    export MAMBA_ROOT_PREFIX="${MAMBA_ROOT_PREFIX:-$HOME/micromamba}"
    eval "$(micromamba shell hook --shell bash)"
else
    echo "[1/8] micromamba found: $(micromamba --version)"
    eval "$(micromamba shell hook --shell "$(basename "$SHELL")")"
fi

# ---------------------------------------------------------------------------
# 2. Ensure Rust toolchain is available (needed for maturin)
# ---------------------------------------------------------------------------
if ! command -v rustc &>/dev/null; then
    echo "[2/8] Installing Rust toolchain via rustup..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
    source "${HOME}/.cargo/env"
else
    RUST_VER="$(rustc --version)"
    echo "[2/8] Rust found: $RUST_VER"
fi

# ---------------------------------------------------------------------------
# 3. Create or update the micromamba environment
# ---------------------------------------------------------------------------
if micromamba env list 2>/dev/null | grep -q "$ENV_NAME"; then
    echo "[3/8] Environment '$ENV_NAME' exists, updating..."
else
    echo "[3/8] Creating environment '$ENV_NAME' (Python $PYTHON_VER)..."
    micromamba create -n "$ENV_NAME" -c "$CHANNEL" "python=$PYTHON_VER" -y
fi

# ---------------------------------------------------------------------------
# 4. Install data science + engineering stack via micromamba
# ---------------------------------------------------------------------------
echo "[4/8] Installing data science & engineering stack..."
micromamba install -n "$ENV_NAME" -c "$CHANNEL" -y \
    numpy pandas scipy matplotlib seaborn plotly \
    scikit-learn statsmodels xgboost lightgbm \
    polars pyarrow dask xarray \
    sqlalchemy openpyxl tabulate \
    networkx rich \
    jupyterlab ipywidgets ipython ipykernel \
    cryptography click pyyaml python-dotenv \
    pytest ruff black mypy \
    requests httpx beautifulsoup4 lxml

# ---------------------------------------------------------------------------
# 5. Install uv (fast pip replacement)
# ---------------------------------------------------------------------------
echo "[5/8] Installing uv package manager..."
micromamba install -n "$ENV_NAME" -c "$CHANNEL" -y uv 2>/dev/null || {
    echo "  uv not in conda-forge, installing via pip..."
    micromamba run -n "$ENV_NAME" pip install uv
}

# ---------------------------------------------------------------------------
# 6. Install Python packages via uv pip (maturin, pyzipper, dotenv)
# ---------------------------------------------------------------------------
echo "[6/8] Installing Python packages via uv pip..."
PROJ_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
micromamba run -n "$ENV_NAME" uv pip install maturin pyzipper python-dotenv 2>/dev/null || {
    echo "  uv pip fallback to regular pip..."
    micromamba run -n "$ENV_NAME" pip install maturin pyzipper python-dotenv
}

# Build Rust -> Python bindings
echo "       Building Rust bindings with maturin..."
(cd "$PROJ_ROOT" && micromamba run -n "$ENV_NAME" maturin develop 2>/dev/null) || {
    echo "  (maturin develop skipped — run manually: micromamba activate $ENV_NAME && maturin develop)"
}

# ---------------------------------------------------------------------------
# 7. Register JupyterLab kernel
# ---------------------------------------------------------------------------
echo "[7/8] Registering JupyterLab kernel '$KERNEL_NAME'..."
micromamba run -n "$ENV_NAME" python -m ipykernel install \
    --user \
    --name "$KERNEL_NAME" \
    --display-name "Zipminator PQC (Python $PYTHON_VER)" \
    2>/dev/null || echo "  Kernel registration skipped (may need manual install)"

# ---------------------------------------------------------------------------
# 8. Copy tutorial notebooks
# ---------------------------------------------------------------------------
echo "[8/8] Copying tutorial notebooks to $TUTORIAL_DIR..."
mkdir -p "$TUTORIAL_DIR"

NOTEBOOK_DIRS=(
    "$PROJ_ROOT/docs/book/notebooks"
    "$PROJ_ROOT/examples/notebooks"
)

COPIED=0
for nb_dir in "${NOTEBOOK_DIRS[@]}"; do
    if [ -d "$nb_dir" ]; then
        for nb in "$nb_dir"/*.ipynb; do
            [ -f "$nb" ] && cp "$nb" "$TUTORIAL_DIR/" && COPIED=$((COPIED + 1))
        done
    fi
done
echo "       Copied $COPIED notebook(s)"

# ---------------------------------------------------------------------------
# Verify installation
# ---------------------------------------------------------------------------
echo ""
echo "Verifying installation..."
micromamba run -n "$ENV_NAME" python -c "
import numpy, pandas, scipy, matplotlib, sklearn, polars, pyarrow
print(f'  numpy      {numpy.__version__}')
print(f'  pandas     {pandas.__version__}')
print(f'  scipy      {scipy.__version__}')
print(f'  sklearn    {sklearn.__version__}')
print(f'  polars     {polars.__version__}')
print(f'  pyarrow    {pyarrow.__version__}')
print('  All core packages verified.')
"

PKG_COUNT=$(micromamba list -n "$ENV_NAME" 2>/dev/null | wc -l | tr -d ' ')
echo ""
echo "=== Installation Complete ==="
echo "Platform:        $PLATFORM_DETAIL"
echo "Packages:        ~$PKG_COUNT"
echo "Kernel:          $KERNEL_NAME"
echo "Tutorials:       $TUTORIAL_DIR ($COPIED notebooks)"
echo ""
echo "Quick start:"
echo "  micromamba activate $ENV_NAME"
echo "  jupyter lab"
echo ""
echo "In a notebook:"
echo "  %load_ext zipminator.jupyter"
echo "  %keygen"
echo "  %encrypt pk"
echo "  %decrypt ct sk"
echo ""
echo "Build Rust bindings (if skipped):"
echo "  micromamba activate $ENV_NAME"
echo "  cd $(dirname "$0")/.."
echo "  maturin develop"

# ---------------------------------------------------------------------------
# Optional auto-launch
# ---------------------------------------------------------------------------
if [ "$AUTO_LAUNCH" = true ]; then
    echo ""
    echo "Auto-launching JupyterLab..."
    micromamba run -n "$ENV_NAME" jupyter lab "$TUTORIAL_DIR"
fi
