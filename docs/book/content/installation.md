# Installation

## System Requirements

| Requirement | Version | Notes |
|-------------|---------|-------|
| Python | 3.9+ | CPython only (no PyPy) |
| Rust | 1.70+ | Only for building from source |
| OS | Linux, macOS, Windows | Pre-built wheels for common platforms |

## From PyPI

The simplest installation. The wheel includes the pre-compiled Rust Kyber768 engine (~894KB).

```bash
# Core package (Kyber768, PQC wrapper, quantum random)
pip install zipminator

# With CLI tools (typer, rich)
pip install zipminator[cli]

# With data processing (numpy, pandas, pyzipper)
pip install zipminator[data]

# With anonymization (faker, numpy, pandas)
pip install zipminator[anonymization]

# With Jupyter support (jupyterlab, ipywidgets, plotly)
pip install zipminator[jupyter]

# With quantum provider extras
pip install zipminator[quantum]

# Everything
pip install zipminator[all]
```

### Extras Reference

| Extra | Adds | Use Case |
|-------|------|----------|
| `cli` | typer, rich | Command-line `zipminator keygen`, `zipminator entropy` |
| `data` | numpy, pandas, pyzipper | DataFrame processing, encrypted ZIP |
| `anonymization` | faker, numpy, pandas | Synthetic data generation (L7) |
| `jupyter` | jupyterlab, ipywidgets, plotly | Interactive notebooks with magics |
| `quantum` | qiskit, pyquil, qbraid | Direct quantum hardware access |
| `email` | aiosmtpd | PQC email transport testing |
| `benchmark` | pytest-benchmark | Performance measurement |
| `dev` | pytest, ruff, black, mypy | Development and testing |
| `all` | All of the above | Full installation |

## From Source

Building from source requires the Rust toolchain.

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Clone the repository
git clone https://github.com/QDaria/zipminator.git
cd zipminator

# Build Rust core + Python bindings
pip install maturin
maturin develop --release --strip

# Install with development dependencies
pip install -e ".[dev,data,anonymization,cli]"

# Verify the build
cargo test --workspace          # 413 Rust tests
pytest tests/python/ -v         # 162 Python tests
```

## With Conda / Micromamba

```bash
# Create a dedicated environment
micromamba create -n zip-pqc python=3.12
micromamba activate zip-pqc

# Install via pip inside the conda env
pip install zipminator[all]
```

Or with standard conda:

```bash
conda create -n zip-pqc python=3.12
conda activate zip-pqc
pip install zipminator[all]
```

## Docker

A Dockerfile is provided in the repository root:

```bash
git clone https://github.com/QDaria/zipminator.git
cd zipminator
docker build -t zipminator .
docker run --rm zipminator python -c "
from zipminator import keypair, encapsulate, decapsulate
pk, sk = keypair()
ct, ss = encapsulate(pk)
assert ss == decapsulate(ct, sk)
print('Kyber768 round-trip OK')
"
```

## Verifying Installation

After installation, verify that the Rust bindings are available:

```python
import zipminator
print(f"Version: {zipminator.__version__}")     # 0.5.0b1
print(f"Rust available: {zipminator.RUST_AVAILABLE}")  # True

# Quick round-trip test
from zipminator import keypair, encapsulate, decapsulate
pk, sk = keypair()
ct, ss = encapsulate(pk)
assert ss == decapsulate(ct, sk)
print("Kyber768 round-trip: OK")
```

If `RUST_AVAILABLE` is `False`, the Rust extension failed to load. This typically means the wheel does not match your platform. Build from source as a fallback.

## Jupyter Kernel Registration

To use Zipminator notebooks interactively, register a Jupyter kernel:

```bash
micromamba activate zip-pqc
pip install 'zipminator[jupyter]'
python -m ipykernel install --user --name zip-pqc --display-name "Zipminator PQC"
```

Then select **"Zipminator PQC"** from the kernel picker in JupyterLab.

## Troubleshooting

```{dropdown} ImportError: cannot import name 'keypair'
The Rust extension module (`_core.abi3.so`) is not found. Ensure you installed the correct platform wheel, or build from source with `maturin develop --release`.
```

```{dropdown} maturin develop fails with compiler errors
Ensure Rust 1.70+ is installed (`rustup update stable`). On macOS, Xcode command-line tools must be present (`xcode-select --install`).
```

```{dropdown} Slow key generation
You may be running a debug build. Use `maturin develop --release --strip` for optimized performance.
```

```{dropdown} Jupyter kernel not showing up
Run `jupyter kernelspec list` to verify the kernel is registered. If missing, re-run:

    python -m ipykernel install --user --name zip-pqc --display-name "Zipminator PQC"
```
