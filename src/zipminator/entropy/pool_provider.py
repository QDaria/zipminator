"""
Pool-based entropy provider.

Reads pre-harvested quantum entropy from the local pool file
(quantum_entropy/quantum_entropy_pool.bin). This is the preferred
entropy source: fastest, offline-capable, and backed by real
quantum hardware via the harvest scheduler.

Thread-safe reads with file-level locking (fcntl on Unix).
Falls back to os.urandom when the pool is empty or missing.
"""

import logging
import os
import struct
import threading
from pathlib import Path
from typing import Optional, Tuple

from .base import QuantumProvider

try:
    import fcntl
    _HAS_FCNTL = True
except ImportError:
    # Windows does not have fcntl; skip file locking there
    _HAS_FCNTL = False

logger = logging.getLogger(__name__)

# Default pool location: <project_root>/quantum_entropy/quantum_entropy_pool.bin
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
_DEFAULT_POOL_PATH = _PROJECT_ROOT / "quantum_entropy" / "quantum_entropy_pool.bin"


class PoolProvider(QuantumProvider):
    """
    Reads entropy from a local binary pool file.

    The pool is populated by the harvest scheduler
    (``zipminator.entropy.scheduler``). This provider consumes
    bytes sequentially, tracking the read position in a companion
    ``.pos`` file so progress survives across process restarts.

    Args:
        pool_path: Path to the pool binary file. Defaults to
            ``quantum_entropy/quantum_entropy_pool.bin``.
        user_id: Optional user identifier for quota tracking.
        tier: Subscription tier for quota enforcement.
    """

    def __init__(
        self,
        pool_path: Optional[str] = None,
        user_id: Optional[str] = None,
        tier: str = "amir",
    ) -> None:
        self._pool_path = Path(pool_path) if pool_path else _DEFAULT_POOL_PATH
        self._pos_path = self._pool_path.with_suffix(".pos")
        self._lock = threading.Lock()
        self._user_id = user_id
        self._tier = tier
        self._quota_mgr = None

        if user_id:
            try:
                from .quota import EntropyQuotaManager
                self._quota_mgr = EntropyQuotaManager()
            except Exception:
                logger.warning("Could not initialize quota manager")

    # ── QuantumProvider interface ──

    def name(self) -> str:
        return "PoolProvider"

    def get_entropy(self, num_bits: int) -> str:
        """
        Read ``num_bits / 8`` bytes from the pool and return as a binary string.

        Falls back to ``os.urandom`` when the pool is exhausted or missing.
        Records consumption against the user quota when a ``user_id`` was
        provided at construction time.
        """
        num_bytes = (num_bits + 7) // 8

        # Quota check (non-blocking: warns but does not deny)
        if self._quota_mgr and self._user_id:
            allowed, msg = self._quota_mgr.check_quota(
                self._user_id, self._tier, num_bytes
            )
            if msg:
                logger.warning("Quota notice: %s", msg)

        data = self._read_pool(num_bytes)

        # Record usage after successful read
        if self._quota_mgr and self._user_id:
            self._quota_mgr.record_usage(self._user_id, self._tier, num_bytes)

        # Convert bytes to bitstring
        bitstring = "".join(f"{byte:08b}" for byte in data)
        return bitstring[:num_bits]

    # ── Pool-specific helpers ──

    def check_freshness(self) -> Tuple[bool, float]:
        """
        Check how fresh the pool file is.

        Returns:
            (is_fresh, age_hours) where ``is_fresh`` is True when the
            pool was modified within the last 7 days.
        """
        if not self._pool_path.exists():
            return False, float("inf")

        import time

        mtime = self._pool_path.stat().st_mtime
        age_seconds = time.time() - mtime
        age_hours = age_seconds / 3600.0
        is_fresh = age_hours < (7 * 24)  # 7 days
        return is_fresh, age_hours

    def bytes_remaining(self) -> int:
        """Return the number of unread bytes left in the pool."""
        if not self._pool_path.exists():
            return 0
        pool_size = self._pool_path.stat().st_size
        pos = self._load_position()
        return max(0, pool_size - pos)

    # ── Internal I/O ──

    def _read_pool(self, num_bytes: int) -> bytes:
        """
        Read *num_bytes* from the pool file, advancing the position.

        Thread-safe via ``threading.Lock``. Uses ``fcntl.flock`` on
        Unix for cross-process safety.

        Falls back to ``os.urandom`` when the pool cannot satisfy the
        request.
        """
        with self._lock:
            if not self._pool_path.exists():
                logger.warning(
                    "Pool file %s not found; falling back to os.urandom",
                    self._pool_path,
                )
                return os.urandom(num_bytes)

            pool_size = self._pool_path.stat().st_size
            if pool_size == 0:
                logger.warning("Pool file is empty; falling back to os.urandom")
                return os.urandom(num_bytes)

            pos = self._load_position()

            if pos >= pool_size:
                logger.warning(
                    "Pool exhausted (%d/%d bytes consumed); "
                    "falling back to os.urandom",
                    pos,
                    pool_size,
                )
                return os.urandom(num_bytes)

            available = pool_size - pos
            from_pool = min(num_bytes, available)

            data = self._locked_read(pos, from_pool)

            new_pos = pos + from_pool
            self._save_position(new_pos)

            if from_pool < num_bytes:
                shortfall = num_bytes - from_pool
                logger.warning(
                    "Pool partially exhausted; supplementing %d bytes from os.urandom",
                    shortfall,
                )
                data += os.urandom(shortfall)

            return data

    def _locked_read(self, offset: int, length: int) -> bytes:
        """Read *length* bytes at *offset* with optional file locking."""
        with open(self._pool_path, "rb") as f:
            if _HAS_FCNTL:
                fcntl.flock(f.fileno(), fcntl.LOCK_SH)
            try:
                f.seek(offset)
                return f.read(length)
            finally:
                if _HAS_FCNTL:
                    fcntl.flock(f.fileno(), fcntl.LOCK_UN)

    # ── Position persistence ──

    def _load_position(self) -> int:
        """Load the current read position from the companion .pos file."""
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
        """Persist the read position as a little-endian uint64."""
        self._pos_path.parent.mkdir(parents=True, exist_ok=True)
        self._pos_path.write_bytes(struct.pack("<Q", pos))
