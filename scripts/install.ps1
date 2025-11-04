# Windows PowerShell installer for Zipminator
# Usage: powershell -ExecutionPolicy Bypass -File install.ps1

param(
    [string]$Prefix = "C:\Program Files\Zipminator",
    [switch]$CurrentUser = $false,
    [switch]$Help = $false
)

$VERSION = "0.1.0"
$REPO = "https://github.com/qdaria/zipminator"
$RELEASES_URL = "$REPO/releases/download/v$VERSION"

# Color function
function Write-Info {
    Write-Host "[INFO] $args" -ForegroundColor Green
}

function Write-Error {
    Write-Host "[ERROR] $args" -ForegroundColor Red
}

function Write-Warning {
    Write-Host "[WARN] $args" -ForegroundColor Yellow
}

if ($Help) {
    Write-Output @"
Zipminator Installer for Windows

Usage: powershell -ExecutionPolicy Bypass -File install.ps1 [OPTIONS]

Options:
  -Prefix <DIR>      Installation directory
  -CurrentUser       Install for current user only
  -Help              Show this help message

Examples:
  powershell -ExecutionPolicy Bypass -File install.ps1
  powershell -ExecutionPolicy Bypass -File install.ps1 -Prefix "C:\Tools"
  powershell -ExecutionPolicy Bypass -File install.ps1 -CurrentUser

"@
    exit 0
}

function Detect-Architecture {
    if ([Environment]::Is64BitProcess) {
        return "x86_64-pc-windows-msvc"
    } else {
        return "i686-pc-windows-msvc"
    }
}

function Download-Binary {
    param(
        [string]$Url,
        [string]$Output
    )

    Write-Info "Downloading from: $Url"

    try {
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $Url -OutFile $Output -UseBasicParsing
        Write-Info "Downloaded successfully"
    } catch {
        Write-Error "Download failed: $_"
        exit 1
    }
}

function Verify-Installation {
    $BinaryPath = "$Prefix\zipminator.exe"

    if (Test-Path $BinaryPath) {
        Write-Info "Installation verified!"
        & $BinaryPath --version
        return $true
    } else {
        Write-Error "Installation verification failed"
        return $false
    }
}

function Main {
    Write-Info "Zipminator Installer v$VERSION"

    # Detect architecture
    $PLATFORM = Detect-Architecture
    Write-Info "Detected platform: $PLATFORM"

    # Set paths
    if ($CurrentUser) {
        $Prefix = "$env:APPDATA\Zipminator"
    }
    Write-Info "Installation location: $Prefix"

    # Create directory
    if (-not (Test-Path $Prefix)) {
        Write-Info "Creating directory: $Prefix"
        New-Item -ItemType Directory -Path $Prefix -Force | Out-Null
    }

    # Download binary
    $BinaryUrl = "$RELEASES_URL/zipminator-$PLATFORM.exe"
    $TempFile = "$env:TEMP\zipminator-$PLATFORM.exe"

    Download-Binary $BinaryUrl $TempFile

    # Move to final location
    $FinalPath = "$Prefix\zipminator.exe"
    Write-Info "Moving binary to: $FinalPath"
    Move-Item -Path $TempFile -Destination $FinalPath -Force

    # Add to PATH if not already there
    if ($CurrentUser) {
        $UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
        if ($UserPath -notcontains $Prefix) {
            Write-Info "Adding to user PATH"
            $NewPath = "$UserPath;$Prefix"
            [Environment]::SetEnvironmentVariable("Path", $NewPath, "User")
            $env:Path = "$env:Path;$Prefix"
        }
    } else {
        # System PATH (requires admin)
        if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
            Write-Warning "Skipping PATH update - administrator privileges required"
            Write-Info "Manual PATH addition: $Prefix"
        } else {
            $SystemPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
            if ($SystemPath -notcontains $Prefix) {
                Write-Info "Adding to system PATH"
                $NewPath = "$SystemPath;$Prefix"
                [Environment]::SetEnvironmentVariable("Path", $NewPath, "Machine")
                $env:Path = "$env:Path;$Prefix"
            }
        }
    }

    # Verify
    Write-Info "Verifying installation..."
    if (Verify-Installation) {
        Write-Info "Zipminator installed successfully!"
        exit 0
    } else {
        Write-Error "Installation failed"
        exit 1
    }
}

Main
