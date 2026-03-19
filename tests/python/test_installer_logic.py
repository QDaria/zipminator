"""
Tests for scripts/installer_utils.py

Covers platform detection, Python version parsing, command existence checks,
and package manager detection with mocked subprocess/platform calls.
"""

import sys
import os
from unittest.mock import patch, MagicMock

import pytest

# Add scripts/ to import path so installer_utils can be imported directly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "scripts"))

from installer_utils import (
    check_command_exists,
    check_python_version,
    detect_platform,
    get_package_manager,
    parse_python_version,
)


# ──────────────────────────────────────────────────────────────
# detect_platform
# ──────────────────────────────────────────────────────────────


@patch("installer_utils.get_package_manager", return_value="brew")
@patch("installer_utils.platform")
def test_detect_platform_macos(mock_platform, mock_pkg):
    mock_platform.system.return_value = "Darwin"
    mock_platform.machine.return_value = "arm64"

    result = detect_platform()
    assert result["os"] == "macos"
    assert result["arch"] == "aarch64"
    assert result["package_manager"] == "brew"


@patch("installer_utils.get_package_manager", return_value="apt")
@patch("installer_utils.platform")
def test_detect_platform_linux(mock_platform, mock_pkg):
    mock_platform.system.return_value = "Linux"
    mock_platform.machine.return_value = "x86_64"

    result = detect_platform()
    assert result["os"] == "linux"
    assert result["arch"] == "x86_64"
    assert result["package_manager"] == "apt"


@patch("installer_utils.get_package_manager", return_value="winget")
@patch("installer_utils.platform")
def test_detect_platform_windows(mock_platform, mock_pkg):
    mock_platform.system.return_value = "Windows"
    mock_platform.machine.return_value = "AMD64"

    result = detect_platform()
    assert result["os"] == "windows"
    assert result["arch"] == "x86_64"
    assert result["package_manager"] == "winget"


@patch("installer_utils.get_package_manager", return_value="none")
@patch("installer_utils.platform")
def test_detect_platform_unknown_arch(mock_platform, mock_pkg):
    mock_platform.system.return_value = "Linux"
    mock_platform.machine.return_value = "riscv64"

    result = detect_platform()
    assert result["os"] == "linux"
    assert result["arch"] == "unknown"


# ──────────────────────────────────────────────────────────────
# parse_python_version
# ──────────────────────────────────────────────────────────────


def test_parse_python_version_full_string():
    assert parse_python_version("Python 3.12.1") == (3, 12, 1)


def test_parse_python_version_bare():
    assert parse_python_version("3.9.7") == (3, 9, 7)


def test_parse_python_version_with_prefix():
    assert parse_python_version("Python 3.11.0rc2") == (3, 11, 0)


def test_parse_python_version_invalid():
    with pytest.raises(ValueError, match="Cannot parse"):
        parse_python_version("not-a-version")


def test_parse_python_version_empty():
    with pytest.raises(ValueError, match="Cannot parse"):
        parse_python_version("")


# ──────────────────────────────────────────────────────────────
# check_python_version
# ──────────────────────────────────────────────────────────────


@patch("installer_utils.check_command_exists", return_value=True)
@patch("installer_utils.subprocess.run")
def test_check_python_version_sufficient(mock_run, mock_exists):
    mock_run.return_value = MagicMock(stdout="Python 3.12.1", stderr="", returncode=0)
    assert check_python_version((3, 9, 0)) is True


@patch("installer_utils.check_command_exists", return_value=True)
@patch("installer_utils.subprocess.run")
def test_check_python_version_too_old(mock_run, mock_exists):
    mock_run.return_value = MagicMock(stdout="Python 3.7.4", stderr="", returncode=0)
    assert check_python_version((3, 9, 0)) is False


@patch("installer_utils.check_command_exists", return_value=False)
def test_check_python_version_no_python(mock_exists):
    assert check_python_version((3, 9, 0)) is False


# ──────────────────────────────────────────────────────────────
# check_command_exists
# ──────────────────────────────────────────────────────────────


@patch("installer_utils.shutil.which", return_value="/usr/bin/rustc")
def test_check_command_exists_found(mock_which):
    assert check_command_exists("rustc") is True
    mock_which.assert_called_once_with("rustc")


@patch("installer_utils.shutil.which", return_value=None)
def test_check_command_exists_missing(mock_which):
    assert check_command_exists("nonexistent-tool-xyz") is False


# ──────────────────────────────────────────────────────────────
# get_package_manager
# ──────────────────────────────────────────────────────────────


@patch("installer_utils.shutil.which", return_value="/opt/homebrew/bin/brew")
def test_get_package_manager_macos(mock_which):
    assert get_package_manager("macos") == "brew"


@patch("installer_utils.shutil.which", side_effect=lambda cmd: "/usr/bin/apt-get" if cmd == "apt-get" else None)
def test_get_package_manager_ubuntu(mock_which):
    assert get_package_manager("linux") == "apt"


@patch("installer_utils.shutil.which", side_effect=lambda cmd: "/usr/bin/dnf" if cmd == "dnf" else None)
def test_get_package_manager_fedora(mock_which):
    assert get_package_manager("linux") == "dnf"


@patch("installer_utils.shutil.which", side_effect=lambda cmd: "/usr/bin/pacman" if cmd == "pacman" else None)
def test_get_package_manager_arch(mock_which):
    assert get_package_manager("linux") == "pacman"


@patch("installer_utils.shutil.which", return_value=None)
def test_get_package_manager_none(mock_which):
    assert get_package_manager("linux") == "none"
