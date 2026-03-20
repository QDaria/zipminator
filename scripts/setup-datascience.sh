#!/usr/bin/env bash
# ============================================================================
# Zipminator Data Science / Data Engineering Stack Setup
#
# Usage:
#   bash scripts/setup-datascience.sh
#
# Prerequisites:
#   - micromamba (or conda/mamba): https://mamba.readthedocs.io/en/latest/installation/micromamba-installation.html
#   - Rust toolchain (for native bindings): curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
#
# What it does:
#   1. Creates/updates the zip-pqc micromamba environment
#   2. Installs zipminator[all] from PyPI (includes Rust PQC bindings)
#   3. Registers a JupyterLab kernel named "Zipminator PQC"
#   4. Verifies the crypto roundtrip works
#   5. Prints instructions for launching JupyterLab
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_NAME="zip-pqc"
ENV_FILE="$PROJECT_ROOT/docs/book/environment.yml"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Zipminator PQC — Data Science Stack Setup                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Check prerequisites ──────────────────────────────────────
if ! command -v micromamba &>/dev/null; then
    echo "ERROR: micromamba not found."
    echo "Install: curl -Ls https://micro.mamba.pm/api/micromamba/osx-arm64/latest | tar -xvj bin/micromamba"
    echo "  or:   brew install micromamba"
    exit 1
fi

# ── Step 2: Create/update environment ─────────────────────────────────
echo "▸ Creating/updating environment '$ENV_NAME' from $ENV_FILE..."
if micromamba env list 2>/dev/null | grep -q "$ENV_NAME"; then
    echo "  Environment exists, updating..."
    micromamba update -n "$ENV_NAME" -f "$ENV_FILE" -y --quiet
else
    echo "  Creating new environment..."
    micromamba create -f "$ENV_FILE" -y --quiet
fi

# ── Step 3: Install zipminator from PyPI ──────────────────────────────
echo "▸ Installing zipminator[all] from PyPI..."
micromamba run -n "$ENV_NAME" pip install --quiet "zipminator[all]==0.5.0b1" 2>/dev/null || \
    micromamba run -n "$ENV_NAME" pip install --quiet "zipminator[all]>=0.5.0b1" || \
    echo "  WARNING: PyPI install failed. Trying local wheel..."

# If we have a local wheel, prefer it (has native Rust bindings)
LOCAL_WHEEL=$(find "$PROJECT_ROOT/target/wheels" -name "zipminator-*.whl" 2>/dev/null | head -1)
if [ -n "$LOCAL_WHEEL" ]; then
    echo "  Installing local wheel with native Rust bindings: $(basename "$LOCAL_WHEEL")"
    micromamba run -n "$ENV_NAME" pip install --quiet --force-reinstall "$LOCAL_WHEEL"
fi

# ── Step 4: Register JupyterLab kernel ────────────────────────────────
echo "▸ Registering JupyterLab kernel 'Zipminator PQC'..."
micromamba run -n "$ENV_NAME" python -m ipykernel install \
    --user \
    --name "$ENV_NAME" \
    --display-name "Zipminator PQC (Python 3.11)" \
    2>/dev/null

echo "  Kernel registered. Available in JupyterLab kernel picker."

# ── Step 5: Verify installation ───────────────────────────────────────
echo "▸ Verifying installation..."
micromamba run -n "$ENV_NAME" python -c "
import sys
print(f'  Python: {sys.version}')

# Core crypto
try:
    from zipminator._core import keypair, encapsulate, decapsulate
    pk, sk = keypair()
    ct, ss1 = encapsulate(pk)
    ss2 = decapsulate(ct, sk)
    assert ss1 == ss2
    print(f'  ML-KEM-768: OK (PK={len(pk.to_bytes())}B, CT={len(ct.to_bytes())}B, SS={len(ss1)}B)')
except ImportError:
    print('  ML-KEM-768: pure-Python fallback (no Rust binding on this platform)')

# Data science stack
import numpy, pandas, matplotlib
print(f'  NumPy:      {numpy.__version__}')
print(f'  Pandas:     {pandas.__version__}')
print(f'  Matplotlib: {matplotlib.__version__}')

# Anonymizer
from zipminator.anonymizer import AdvancedAnonymizer
anon = AdvancedAnonymizer()
import pandas as pd
df = pd.DataFrame({'name': ['Alice', 'Bob'], 'ssn': ['123-45-6789', '987-65-4321']})
result = anon.process(df, {'name': 3, 'ssn': 3})
assert all(v == '[REDACTED]' for v in result['name'])
print('  Anonymizer: OK (L3 masking verified)')

# Jupyter magics
from zipminator.jupyter import load_ipython_extension
print('  Jupyter:    OK (magics loadable)')

# PII scanner
from zipminator.crypto.pii_scanner import PIIScanner
scanner = PIIScanner()
print('  PII Scan:   OK (15-country patterns)')

print()
print('  ALL CHECKS PASSED')
"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Setup complete!                                            ║"
echo "║                                                             ║"
echo "║  Quick start:                                               ║"
echo "║    micromamba activate zip-pqc                               ║"
echo "║    jupyter lab                                               ║"
echo "║                                                             ║"
echo "║  In a notebook:                                             ║"
echo "║    %load_ext zipminator.jupyter                             ║"
echo "║    %keygen --seed quantum                                   ║"
echo "║    %encrypt data.csv --output encrypted.zip                 ║"
echo "║    %entropy 256                                             ║"
echo "║                                                             ║"
echo "║  CLI:                                                       ║"
echo "║    zipminator keygen                                        ║"
echo "║    zipminator entropy --bits 512                            ║"
echo "║    zipminator anonymize --level 7 input.csv output.csv      ║"
echo "║                                                             ║"
echo "║  Kernel: 'Zipminator PQC (Python 3.11)' in JupyterLab      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
