"""Tests for mesh key provisioning script."""
import hashlib
import struct
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest

SCRIPT = Path("scripts/provision_ruview_mesh.py")


def test_provision_script_generates_valid_nvs():
    """Verify the provisioning script produces valid NVS binary."""
    with tempfile.TemporaryDirectory() as tmp:
        output = Path(tmp) / "test_mesh.bin"

        result = subprocess.run(
            [sys.executable, str(SCRIPT), "--mesh-id", "42", "--output", str(output), "--hex"],
            capture_output=True, text=True, cwd=str(Path.cwd()),
        )

        assert result.returncode == 0, f"Script failed: {result.stderr}"
        assert output.exists()

        data = output.read_bytes()
        # NVS format: magic(4) + version(1) + mesh_id(4) + psk(16) + siphash(16) + sha256(32) = 73
        assert len(data) == 73, f"Expected 73 bytes, got {len(data)}"

        # Verify magic
        assert data[:4] == b"RVMK"

        # Verify version
        assert data[4] == 1

        # Verify mesh_id
        mesh_id = struct.unpack("<I", data[5:9])[0]
        assert mesh_id == 42

        # Verify checksum
        payload = data[:-32]
        checksum = data[-32:]
        assert hashlib.sha256(payload).digest() == checksum


def test_provision_different_mesh_ids_produce_different_keys():
    """Different mesh IDs must produce different PSKs."""
    with tempfile.TemporaryDirectory() as tmp:
        out1 = Path(tmp) / "mesh1.bin"
        out2 = Path(tmp) / "mesh2.bin"

        for mesh_id, out in [(1, out1), (2, out2)]:
            subprocess.run(
                [sys.executable, str(SCRIPT), "--mesh-id", str(mesh_id), "--output", str(out)],
                capture_output=True, cwd=str(Path.cwd()),
            )

        data1 = out1.read_bytes()
        data2 = out2.read_bytes()

        # PSK is at bytes 9:25
        psk1 = data1[9:25]
        psk2 = data2[9:25]
        assert psk1 != psk2, "Different mesh IDs produced identical PSKs"


def test_provision_with_custom_entropy_pool():
    """Verify script works with a custom entropy pool file."""
    with tempfile.TemporaryDirectory() as tmp:
        # Create a fake entropy pool
        pool = Path(tmp) / "test_pool.bin"
        pool.write_bytes(bytes(range(256)) * 4)  # 1024 bytes

        output = Path(tmp) / "mesh_custom.bin"
        result = subprocess.run(
            [sys.executable, str(SCRIPT),
             "--entropy-pool", str(pool),
             "--mesh-id", "99",
             "--output", str(output)],
            capture_output=True, text=True, cwd=str(Path.cwd()),
        )

        assert result.returncode == 0, f"Script failed: {result.stderr}"
        assert output.exists()
        assert len(output.read_bytes()) == 73
