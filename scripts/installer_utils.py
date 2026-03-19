"""
Zipminator Installer Utilities

Testable utility functions for platform detection, Python version parsing,
command existence checks, and package manager detection.

Author:  Zipminator Team (mo@qdaria.com)
Repo:    https://github.com/QDaria/zipminator
"""

from __future__ import annotations

import platform
import re
import shutil
import subprocess
from typing import Optional


def detect_platform() -> dict:
    """Detect the current operating system, architecture, and package manager.

    Returns:
        dict with keys:
            os: "macos" | "linux" | "windows" | "unknown"
            arch: "x86_64" | "aarch64" | "unknown"
            package_manager: "brew" | "apt" | "dnf" | "pacman" | "zypper"
                             | "winget" | "scoop" | "choco" | "none"
    """
    system = platform.system().lower()

    if system == "darwin":
        os_name = "macos"
    elif system == "linux":
        os_name = "linux"
    elif system == "windows":
        os_name = "windows"
    else:
        os_name = "unknown"

    machine = platform.machine().lower()
    arch_map = {
        "x86_64": "x86_64",
        "amd64": "x86_64",
        "arm64": "aarch64",
        "aarch64": "aarch64",
    }
    arch = arch_map.get(machine, "unknown")

    pkg_manager = get_package_manager(os_name)

    return {
        "os": os_name,
        "arch": arch,
        "package_manager": pkg_manager,
    }


def parse_python_version(version_string: str) -> tuple:
    """Parse a Python version string into a tuple of integers.

    Args:
        version_string: A string like "Python 3.12.1" or "3.12.1".

    Returns:
        Tuple of (major, minor, patch) as integers.

    Raises:
        ValueError: If the version string cannot be parsed.
    """
    match = re.search(r"(\d+)\.(\d+)\.(\d+)", version_string)
    if not match:
        raise ValueError(f"Cannot parse Python version from: {version_string!r}")
    return (int(match.group(1)), int(match.group(2)), int(match.group(3)))


def check_python_version(min_version: tuple = (3, 9, 0)) -> bool:
    """Check whether the system Python meets the minimum version requirement.

    Args:
        min_version: Tuple of (major, minor, patch) representing the minimum.

    Returns:
        True if a sufficient Python is found on PATH, False otherwise.
    """
    for candidate in ("python3", "python", "python3.12", "python3.11", "python3.10", "python3.9"):
        if not check_command_exists(candidate):
            continue
        try:
            result = subprocess.run(
                [candidate, "--version"],
                capture_output=True,
                text=True,
                timeout=10,
            )
            output = (result.stdout + result.stderr).strip()
            version = parse_python_version(output)
            if version >= min_version:
                return True
        except (subprocess.SubprocessError, ValueError):
            continue
    return False


def check_command_exists(cmd: str) -> bool:
    """Check whether a command is available on the system PATH.

    Args:
        cmd: The command name to look for (e.g. "rustc", "micromamba").

    Returns:
        True if the command is found, False otherwise.
    """
    return shutil.which(cmd) is not None


def get_package_manager(os_name: Optional[str] = None) -> str:
    """Detect the system package manager.

    Args:
        os_name: One of "macos", "linux", "windows", or None (auto-detect).

    Returns:
        The package manager name: "brew", "apt", "dnf", "pacman", "zypper",
        "winget", "scoop", "choco", or "none".
    """
    if os_name is None:
        system = platform.system().lower()
        if system == "darwin":
            os_name = "macos"
        elif system == "linux":
            os_name = "linux"
        elif system == "windows":
            os_name = "windows"
        else:
            return "none"

    if os_name == "macos":
        return "brew" if shutil.which("brew") else "none"

    if os_name == "linux":
        for mgr in ("apt-get", "dnf", "pacman", "zypper"):
            if shutil.which(mgr):
                # Normalize apt-get -> apt
                return mgr.replace("-get", "")
        return "none"

    if os_name == "windows":
        for mgr in ("winget", "scoop", "choco"):
            if shutil.which(mgr):
                return mgr
        return "none"

    return "none"
