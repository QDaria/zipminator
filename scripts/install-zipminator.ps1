#Requires -Version 5.1
<#
.SYNOPSIS
    Zipminator-PQC Universal Installer for Windows

.DESCRIPTION
    Installs micromamba, creates the zip-pqc environment, and installs
    Zipminator with optional data science stack and Rust native bindings.

    The world's first PQC super-app installer for Windows.

.PARAMETER DryRun
    Print what would be done without executing any commands.

.PARAMETER NoDataScience
    Skip the optional data science stack (numpy, pandas, etc.).

.PARAMETER Help
    Show this help message and exit.

.EXAMPLE
    .\scripts\install-zipminator.ps1
    .\scripts\install-zipminator.ps1 -DryRun
    .\scripts\install-zipminator.ps1 -NoDataScience

.LINK
    https://github.com/QDaria/zipminator

.NOTES
    Author:  Zipminator Team (mo@qdaria.com)
    Version: 1.0.0
    Date:    March 2026
#>

[CmdletBinding()]
param(
    [switch]$DryRun,
    [switch]$NoDataScience,
    [switch]$Help
)

# ──────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────

$Script:Version      = "1.0.0"
$Script:EnvName      = "zip-pqc"
$Script:PythonVersion = "3.12"
$Script:MinPyMajor   = 3
$Script:MinPyMinor   = 9

$ErrorActionPreference = "Stop"

# ──────────────────────────────────────────────────────────────
# Logging helpers
# ──────────────────────────────────────────────────────────────

function Write-Step  { param([string]$Msg) Write-Host "[$(Get-Date -Format 'HH:mm:ss')] " -NoNewline -ForegroundColor Blue; Write-Host "> " -NoNewline -ForegroundColor Cyan;  Write-Host $Msg }
function Write-Ok    { param([string]$Msg) Write-Host "[$(Get-Date -Format 'HH:mm:ss')] " -NoNewline -ForegroundColor Blue; Write-Host "ok " -NoNewline -ForegroundColor Green; Write-Host $Msg }
function Write-Warn  { param([string]$Msg) Write-Host "[$(Get-Date -Format 'HH:mm:ss')] " -NoNewline -ForegroundColor Blue; Write-Host "!! " -NoNewline -ForegroundColor Yellow; Write-Host $Msg }
function Write-Err   { param([string]$Msg) Write-Host "[$(Get-Date -Format 'HH:mm:ss')] " -NoNewline -ForegroundColor Blue; Write-Host "ERR " -NoNewline -ForegroundColor Red; Write-Host $Msg }
function Write-Dry   { param([string]$Msg) Write-Host "[$(Get-Date -Format 'HH:mm:ss')] " -NoNewline -ForegroundColor Blue; Write-Host "DRY " -NoNewline -ForegroundColor Magenta; Write-Host $Msg }

function Invoke-Cmd {
    param([string]$Description, [scriptblock]$Command)
    if ($DryRun) {
        Write-Dry "Would run: $Description"
    } else {
        & $Command
    }
}

# ──────────────────────────────────────────────────────────────
# Help
# ──────────────────────────────────────────────────────────────

if ($Help) {
    Get-Help $MyInvocation.MyCommand.Path -Detailed
    exit 0
}

# ──────────────────────────────────────────────────────────────
# Banner
# ──────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "  _____ _             _             _              " -ForegroundColor Cyan
Write-Host " |__  /(_)_ __  _ __ (_)_ __   __ _| |_ ___  _ __ " -ForegroundColor Cyan
Write-Host "   / / | | '_ \| '_ \| | '_ \ / _`` | __/ _ \| '__|" -ForegroundColor Cyan
Write-Host "  / /_ | | |_) | | | | | | | | (_| | || (_) | |   " -ForegroundColor Cyan
Write-Host " /____|_| .__/|_| |_|_|_| |_|\__,_|\__\___/|_|   " -ForegroundColor Cyan
Write-Host "        |_|                                         " -ForegroundColor Cyan
Write-Host ""
Write-Host "  Universal Installer v$($Script:Version) -- Post-Quantum Cryptography" -ForegroundColor White
Write-Host "  https://github.com/QDaria/zipminator" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "  DRY RUN MODE -- no changes will be made" -ForegroundColor Magenta
    Write-Host ""
}

# ──────────────────────────────────────────────────────────────
# Step 1: Detect platform
# ──────────────────────────────────────────────────────────────

Write-Step "Detecting platform..."

$OsArch = if ([System.Environment]::Is64BitOperatingSystem) { "x86_64" } else { "x86" }
$WinVer = [System.Environment]::OSVersion.Version

if ($WinVer.Major -lt 10) {
    Write-Err "Windows 10 or higher is required (detected: $($WinVer.Major).$($WinVer.Minor))."
    exit 1
}

# Detect package manager
$PkgManager = "none"
if (Get-Command winget -ErrorAction SilentlyContinue) { $PkgManager = "winget" }
elseif (Get-Command scoop -ErrorAction SilentlyContinue) { $PkgManager = "scoop" }
elseif (Get-Command choco -ErrorAction SilentlyContinue) { $PkgManager = "choco" }

Write-Ok "Platform: Windows $($WinVer.Major).$($WinVer.Minor) / $OsArch (package manager: $PkgManager)"

# ──────────────────────────────────────────────────────────────
# Step 2: Check for Python 3.9+
# ──────────────────────────────────────────────────────────────

Write-Step "Checking for Python $($Script:MinPyMajor).$($Script:MinPyMinor)+..."

$SystemPython = $null
foreach ($candidate in @("python3", "python", "py")) {
    $cmd = Get-Command $candidate -ErrorAction SilentlyContinue
    if ($cmd) {
        try {
            $pyVerStr = & $candidate --version 2>&1
            if ($pyVerStr -match '(\d+)\.(\d+)\.(\d+)') {
                $pyMaj = [int]$Matches[1]
                $pyMin = [int]$Matches[2]
                if ($pyMaj -ge $Script:MinPyMajor -and $pyMin -ge $Script:MinPyMinor) {
                    $SystemPython = $candidate
                    Write-Ok "Found $candidate ($($Matches[0]))"
                    break
                }
            }
        } catch { }
    }
}

if (-not $SystemPython) {
    Write-Warn "Python $($Script:MinPyMajor).$($Script:MinPyMinor)+ not found on system PATH."
    switch ($PkgManager) {
        "winget" { Write-Warn "Install with: winget install Python.Python.3.12" }
        "scoop"  { Write-Warn "Install with: scoop install python" }
        "choco"  { Write-Warn "Install with: choco install python312" }
        default  { Write-Warn "Install from https://python.org/downloads/" }
    }
    Write-Warn "Micromamba will provide its own Python, so installation can continue."
}

# ──────────────────────────────────────────────────────────────
# Step 3: Check for / install micromamba
# ──────────────────────────────────────────────────────────────

Write-Step "Checking for micromamba..."

$MambaCmd = $null
if (Get-Command micromamba -ErrorAction SilentlyContinue) {
    $MambaCmd = "micromamba"
    $mambaVer = & micromamba --version 2>$null
    Write-Ok "micromamba $mambaVer already installed"
} else {
    $MambaPath = Join-Path $env:LOCALAPPDATA "micromamba\micromamba.exe"
    if (Test-Path $MambaPath) {
        $MambaCmd = $MambaPath
        Write-Ok "micromamba found at $MambaPath"
    } else {
        Write-Step "Installing micromamba..."
        if ($DryRun) {
            Write-Dry "Would download and install micromamba from https://micro.mamba.pm"
            $MambaCmd = "micromamba"
        } else {
            $InstallerUrl = "https://micro.mamba.pm/api/micromamba/win-64/latest"
            $TempZip = Join-Path $env:TEMP "micromamba.tar.bz2"
            $InstallDir = Join-Path $env:LOCALAPPDATA "micromamba"

            if (-not (Test-Path $InstallDir)) {
                New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
            }

            Invoke-WebRequest -Uri $InstallerUrl -OutFile $TempZip -UseBasicParsing

            # Extract using tar (available on Windows 10+)
            tar -xf $TempZip -C $InstallDir 2>$null

            $MambaExe = Get-ChildItem -Path $InstallDir -Filter "micromamba.exe" -Recurse | Select-Object -First 1
            if ($MambaExe) {
                $MambaCmd = $MambaExe.FullName
                # Add to current session PATH
                $env:PATH = "$($MambaExe.DirectoryName);$env:PATH"
                Write-Ok "micromamba installed at $MambaCmd"
            } else {
                Write-Err "micromamba installation failed. Binary not found."
                Write-Err "Download manually from https://mamba.readthedocs.io/en/latest/installation/micromamba-installation.html"
                exit 1
            }

            Remove-Item $TempZip -ErrorAction SilentlyContinue
        }
    }
}

# ──────────────────────────────────────────────────────────────
# Step 4: Create zip-pqc environment
# ──────────────────────────────────────────────────────────────

Write-Step "Setting up '$($Script:EnvName)' environment with Python $($Script:PythonVersion)..."

$EnvExists = $false
$envListOutput = & $MambaCmd env list 2>$null
if ($envListOutput -match $Script:EnvName) {
    $EnvExists = $true
}

$Recreate = "N"
if ($EnvExists) {
    Write-Warn "Environment '$($Script:EnvName)' already exists."
    if (-not $DryRun) {
        $Recreate = Read-Host "  Recreate it? [y/N]"
        if ($Recreate -match '^[Yy]$') {
            Write-Step "Removing existing environment..."
            & $MambaCmd env remove -n $Script:EnvName -y
        } else {
            Write-Ok "Keeping existing environment."
        }
    } else {
        Write-Dry "Would ask whether to recreate existing environment."
    }
}

if (-not $EnvExists -or $Recreate -match '^[Yy]$') {
    Invoke-Cmd "Create $($Script:EnvName) environment" {
        & $MambaCmd create -n $Script:EnvName "python=$($Script:PythonVersion)" -c conda-forge -y
    }
    Write-Ok "Environment '$($Script:EnvName)' created with Python $($Script:PythonVersion)"
}

# ──────────────────────────────────────────────────────────────
# Step 5: Install uv
# ──────────────────────────────────────────────────────────────

Write-Step "Installing uv (fast pip replacement)..."
Invoke-Cmd "Install uv" { & $MambaCmd run -n $Script:EnvName pip install uv }
Write-Ok "uv installed"

# ──────────────────────────────────────────────────────────────
# Step 6: Install zipminator
# ──────────────────────────────────────────────────────────────

Write-Step "Installing zipminator[all]..."
Invoke-Cmd "Install zipminator" { & $MambaCmd run -n $Script:EnvName uv pip install "zipminator[all]" }
Write-Ok "zipminator installed"

# ──────────────────────────────────────────────────────────────
# Step 7: Offer Rust native bindings
# ──────────────────────────────────────────────────────────────

if (Get-Command rustc -ErrorAction SilentlyContinue) {
    $rustVer = & rustc --version 2>$null
    Write-Ok "Rust toolchain detected ($rustVer)"

    $BuildNative = $false
    if (-not $DryRun) {
        $resp = Read-Host "  Build native Rust bindings with maturin? (faster crypto) [y/N]"
        if ($resp -match '^[Yy]$') { $BuildNative = $true }
    } else {
        Write-Dry "Would offer to build native Rust bindings via maturin."
    }

    if ($BuildNative) {
        Write-Step "Installing maturin..."
        & $MambaCmd run -n $Script:EnvName uv pip install maturin

        Write-Step "Building Rust native bindings (this may take 2-5 minutes)..."
        if (Test-Path "pyproject.toml") {
            & $MambaCmd run -n $Script:EnvName maturin develop --release --strip
            Write-Ok "Native Rust bindings built and installed"
        } else {
            Write-Warn "Could not locate pyproject.toml for maturin build. Skipping."
        }
    }
} else {
    Write-Warn "Rust toolchain not detected. Skipping native binding build."
    Write-Warn "Install Rust from https://rustup.rs for native PQC performance."
}

# ──────────────────────────────────────────────────────────────
# Step 8: Optional data science stack
# ──────────────────────────────────────────────────────────────

if (-not $NoDataScience) {
    Write-Step "Installing data science stack (numpy, pandas, scipy, scikit-learn, matplotlib, seaborn, jupyterlab)..."
    Invoke-Cmd "Install data science stack" {
        & $MambaCmd install -n $Script:EnvName -c conda-forge `
            numpy pandas scipy scikit-learn matplotlib seaborn jupyterlab sqlite ipykernel -y
    }
    Write-Ok "Data science stack installed"

    # Step 9: Register JupyterLab kernel
    Write-Step "Registering JupyterLab kernel '$($Script:EnvName)'..."
    Invoke-Cmd "Register Jupyter kernel" {
        & $MambaCmd run -n $Script:EnvName python -m ipykernel install `
            --user --name $Script:EnvName --display-name "Zipminator PQC"
    }
    Write-Ok "Jupyter kernel 'Zipminator PQC' registered"
} else {
    Write-Warn "Skipping data science stack (-NoDataScience)."
}

# ──────────────────────────────────────────────────────────────
# Step 10: Verify installation
# ──────────────────────────────────────────────────────────────

Write-Step "Verifying installation..."

if ($DryRun) {
    Write-Dry "Would verify: from zipminator import keypair; keypair()"
} else {
    try {
        $verifyOutput = & $MambaCmd run -n $Script:EnvName python -c @"
from zipminator import keypair
pk, sk = keypair()
pk_bytes = pk.to_bytes()
sk_bytes = sk.to_bytes()
print(f'Kyber768 keypair generated: PK={len(pk_bytes)}B, SK={len(sk_bytes)}B')
"@ 2>&1

        if ($verifyOutput -match "Kyber768 keypair generated") {
            Write-Ok $verifyOutput
        } else {
            throw "keypair check failed"
        }
    } catch {
        Write-Warn "Native Rust keypair not available (expected if installed from PyPI without maturin build)."
        try {
            $simpleCheck = & $MambaCmd run -n $Script:EnvName python -c "import zipminator; print(f'zipminator {zipminator.__version__}')" 2>&1
            Write-Ok "Package importable: $simpleCheck"
        } catch {
            Write-Err "zipminator package could not be imported. Check installation logs above."
        }
    }
}

# ──────────────────────────────────────────────────────────────
# Success banner
# ──────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "  Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "  Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. Activate the environment:" -ForegroundColor Yellow
Write-Host "     micromamba activate $($Script:EnvName)" -ForegroundColor Blue
Write-Host ""
Write-Host "  2. Verify the installation:" -ForegroundColor Yellow
Write-Host '     python -c "from zipminator import keypair; print(keypair())"' -ForegroundColor Blue
Write-Host ""
Write-Host "  3. Generate a keypair via CLI:" -ForegroundColor Yellow
Write-Host "     zipminator keygen" -ForegroundColor Blue
Write-Host ""
Write-Host "  4. Check quantum entropy:" -ForegroundColor Yellow
Write-Host "     zipminator entropy" -ForegroundColor Blue
Write-Host ""

if (-not $NoDataScience) {
    Write-Host "  5. Launch JupyterLab:" -ForegroundColor Yellow
    Write-Host "     jupyter lab" -ForegroundColor Blue
    Write-Host ""
}

Write-Host "  Documentation:" -ForegroundColor Cyan
Write-Host "  Repo:     https://github.com/QDaria/zipminator" -ForegroundColor Blue
Write-Host "  Issues:   https://github.com/QDaria/zipminator/issues" -ForegroundColor Blue
Write-Host "  Support:  mo@qdaria.com" -ForegroundColor Blue
Write-Host ""
