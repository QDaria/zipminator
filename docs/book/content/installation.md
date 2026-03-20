# Installation

## System Requirements

| Requirement | Version | Notes |
|-------------|---------|-------|
| Python | 3.9+ | CPython only (no PyPy) |
| Rust | 1.70+ | Only for building from source |
| OS | Linux, macOS, Windows | Pre-built wheels for common platforms |

```{admonition} What is a "wheel"?
:class: tip

A Python wheel (`.whl` file) is a pre-compiled package. When you `pip install zipminator`, Python downloads a wheel that already contains the compiled Rust crypto engine. You do **not** need Rust installed on your machine for a wheel install.
```

## Recommended: micromamba + uv

We recommend using **micromamba** for environment isolation and **uv** for fast package installs.

```{admonition} Why micromamba + uv?
:class: note

**micromamba** is a fast, minimal conda replacement. It creates isolated Python environments so Zipminator's dependencies don't conflict with your other projects.

**uv** is a Rust-based pip replacement that's 10-100x faster than regular pip.
```

### Step 1: Create an isolated environment

```bash
# Install micromamba (if you don't have it)
# See: https://mamba.readthedocs.io/en/latest/installation/micromamba-installation.html

# Create a fresh Python 3.11 environment
micromamba create -n zip-pqc python=3.11 -y
micromamba activate zip-pqc
```

### Step 2: Install Zipminator

````{tab-set}
```{tab-item} Core only
The minimal install gives you Kyber768 key exchange, PQC wrapper, and quantum random:

    micromamba activate zip-pqc
    uv pip install zipminator
```

```{tab-item} With Jupyter
For interactive notebook exploration with magics and widgets:

    micromamba activate zip-pqc
    uv pip install 'zipminator[jupyter]'
```

```{tab-item} Everything
All features including anonymization, CLI, quantum providers, and dev tools:

    micromamba activate zip-pqc
    uv pip install 'zipminator[all]'
```
````

### Step 3: Verify

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

## Extras Reference

Each extra adds specific dependencies for a use case:

| Extra | What it adds | When you need it |
|-------|-------------|-----------------|
| `cli` | typer, rich | `zipminator keygen` and `zipminator entropy` CLI commands |
| `data` | numpy, pandas, pyzipper | DataFrame processing, encrypted ZIP archives |
| `anonymization` | faker, numpy, pandas | Synthetic data generation (Level 7) |
| `jupyter` | jupyterlab, ipywidgets, plotly | Interactive notebooks with `%keygen` magics |
| `quantum` | qiskit, pyquil, qbraid | Direct quantum hardware access for entropy |
| `email` | aiosmtpd | PQC email transport testing |
| `benchmark` | pytest-benchmark | Performance measurement |
| `dev` | pytest, ruff, black, mypy | Development and testing |
| `all` | All of the above | Full installation |

```{admonition} Example
:class: tip

To install core + Jupyter + anonymization:

    uv pip install 'zipminator[jupyter,anonymization]'

You can combine any extras with commas.
```

## From PyPI (pip)

If you prefer standard pip without micromamba:

```bash
pip install zipminator
```

The wheel is ~894KB and includes the pre-compiled Rust Kyber768 engine.

## From Source

Building from source requires the Rust toolchain. This is for contributors or when no pre-built wheel exists for your platform.

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Clone the repository
git clone https://github.com/QDaria/zipminator.git
cd zipminator

# Create environment
micromamba create -n zip-pqc python=3.11 -y
micromamba activate zip-pqc

# Build Rust core + Python bindings
uv pip install maturin
maturin develop --release --strip

# Install with development dependencies
uv pip install -e ".[dev,data,anonymization,cli]"

# Verify the build
cargo test --workspace          # 441 Rust tests
pytest tests/ -v                # 429 Python tests
```

## Docker

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

## Jupyter Kernel Registration

To use Zipminator in JupyterLab notebooks:

```bash
micromamba activate zip-pqc
uv pip install 'zipminator[jupyter]'
python -m ipykernel install --user --name zip-pqc --display-name "Zipminator PQC"
```

Then select **"Zipminator PQC"** from the kernel picker in JupyterLab.

## Troubleshooting

```{dropdown} ImportError: cannot import name 'keypair'
The Rust extension module (`_core.abi3.so`) is not found. This means the wheel doesn't match your platform.

**Fix:** Build from source:

    micromamba activate zip-pqc
    uv pip install maturin
    maturin develop --release
```

```{dropdown} maturin develop fails with compiler errors
Ensure Rust 1.70+ is installed:

    rustup update stable

On macOS, Xcode command-line tools must be present:

    xcode-select --install
```

```{dropdown} Slow key generation
You may be running a debug build. Use the `--release` flag:

    maturin develop --release --strip
```

```{dropdown} Jupyter kernel not showing up
Verify the kernel is registered:

    jupyter kernelspec list

If missing, re-register:

    python -m ipykernel install --user --name zip-pqc --display-name "Zipminator PQC"
```

```{dropdown} uv not found
Install uv:

    pip install uv

Or with curl (recommended):

    curl -LsSf https://astral.sh/uv/install.sh | sh
```
