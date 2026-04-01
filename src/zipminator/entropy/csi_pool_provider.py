"""
CSI entropy pool provider.

Reads pre-harvested WiFi CSI entropy from a local pool file
(quantum_entropy/csi_entropy_pool.bin). This is SEPARATE from
the quantum entropy pool to preserve provenance: CSI entropy is
classical physical randomness, not quantum randomness.

The design mirrors pool_provider.py but does NOT fall back to
os.urandom. If the CSI pool is exhausted or missing, it raises
RuntimeError so the compositor knows this source is unavailable
(rather than silently injecting OS entropy with CSI provenance).

Part of the Certified Heterogeneous Entropy (CHE) framework.
"""

import logging
import struct
import threading
import time
from pathlib import Path
from typing import Optional, Tuple

from .base import QuantumProvider

try:
    import fcntl
    _HAS_FCNTL = True
except ImportError:
    _HAS_FCNTL = False

logger = logging.getLogger(__name__)

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
DEFAULT_CSI_POOL_PATH = _PROJECT_ROOT / "quantum_entropy" / "csi_entropy_pool.bin"


class CsiPoolProvider(QuantumProvider):
    """Reads entropy from a local CSI entropy pool file.

    Populated by ESP32-S3 CSI harvester or the Rust
    ``CsiEntropySource`` writer. Consumes bytes sequentially
    with position persistence in a companion ``.pos`` file.

    Unlike PoolProvider, this does NOT fall back to os.urandom.
    Provenance integrity requires that CSI bytes come only from
    actual CSI measurements.
    """

    def __init__(self, pool_path: Optional[str] = None) -> None:
        self._pool_path = Path(pool_path) if pool_path else DEFAULT_CSI_POOL_PATH
        self._pos_path = self._pool_path.with_suffix(".pos")
        self._lock = threading.Lock()

    def name(self) -> str:
        return "CsiPoolProvider"

    def get_entropy(self, num_bits: int) -> str:
        num_bytes = (num_bits + 7) // 8
        data = self._read_pool(num_bytes)
        bitstring = "".join(f"{byte:08b}" for byte in data)
        return bitstring[:num_bits]

    def check_freshness(self) -> Tuple[bool, float]:
        if not self._pool_path.exists():
            return False, float("inf")
        mtime = self._pool_path.stat().st_mtime
        age_seconds = time.time() - mtime
        age_hours = age_seconds / 3600.0
        return age_hours < (7 * 24), age_hours

    def bytes_remaining(self) -> int:
        if not self._pool_path.exists():
            return 0
        pool_size = self._pool_path.stat().st_size
        pos = self._load_position()
        return max(0, pool_size - pos)

    def _read_pool(self, num_bytes: int) -> bytes:
        with self._lock:
            if not self._pool_path.exists():
                raise RuntimeError(
                    f"CSI pool not found: {self._pool_path}"
                )

            pool_size = self._pool_path.stat().st_size
            if pool_size == 0:
                raise RuntimeError("CSI pool is empty")

            pos = self._load_position()
            if pos >= pool_size:
                raise RuntimeError(
                    f"CSI pool exhausted ({pos}/{pool_size} bytes consumed)"
                )

            available = pool_size - pos
            from_pool = min(num_bytes, available)
            data = self._locked_read(pos, from_pool)
            self._save_position(pos + from_pool)

            if from_pool < num_bytes:
                raise RuntimeError(
                    f"CSI pool exhausted mid-read "
                    f"(got {from_pool}/{num_bytes} bytes)"
                )
            return data

    def _locked_read(self, offset: int, length: int) -> bytes:
        with open(self._pool_path, "rb") as f:
            if _HAS_FCNTL:
                fcntl.flock(f.fileno(), fcntl.LOCK_SH)
            try:
                f.seek(offset)
                return f.read(length)
            finally:
                if _HAS_FCNTL:
                    fcntl.flock(f.fileno(), fcntl.LOCK_UN)

    def _load_position(self) -> int:
        if not self._pos_path.exists():
            return 0
        try:
            raw = self._pos_path.read_bytes()
            if len(raw) < 8:
                return 0
            return struct.unpack("<Q", raw[:8])[0]
        except (OSError, struct.error):
            return 0

    def _save_position(self, pos: int) -> None:
        self._pos_path.parent.mkdir(parents=True, exist_ok=True)
        self._pos_path.write_bytes(struct.pack("<Q", pos))
