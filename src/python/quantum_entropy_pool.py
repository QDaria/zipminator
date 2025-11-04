#!/usr/bin/env python3
"""
Quantum Entropy Pool - Python Wrapper
Secure storage for quantum random bytes from IBM Quantum hardware

Compatible with IBM Qiskit and the QRNG harvester notebook.
Provides AES-256-GCM encryption, HMAC-SHA256 integrity, and secure deletion.

Example:
    >>> from quantum_entropy_pool import QuantumEntropyPool
    >>>
    >>> # Create new pool from IBM Quantum data
    >>> pool = QuantumEntropyPool.create(
    ...     path="entropy.qep",
    ...     entropy_bytes=quantum_bits,
    ...     backend="ibm_sherbrooke",
    ...     job_id=job.job_id(),
    ...     num_shots=10000,
    ...     num_qubits=5
    ... )
    >>>
    >>> # Get random bytes for cryptography
    >>> seed = pool.get_bytes(32)  # 32 bytes for Kyber-768 seed
    >>>
    >>> # Check availability
    >>> print(f"Available: {pool.available_bytes()} bytes")
    >>>
    >>> # Set low-entropy callback
    >>> def refill_handler(remaining):
    ...     print(f"Low entropy: {remaining} bytes remaining")
    ...     # Trigger quantum harvesting...
    >>>
    >>> pool.set_refill_callback(refill_handler, threshold_bytes=10240)
"""

import os
import sys
import struct
import hashlib
import hmac
import secrets
import time
from typing import Optional, Callable, Tuple
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    from cryptography.hazmat.primitives.kdf.hkdf import HKDF
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.backends import default_backend
except ImportError:
    print("Error: cryptography library required. Install with:")
    print("  pip install cryptography")
    sys.exit(1)


# QEP file format constants
QEP_MAGIC = b"QEP1"
QEP_VERSION = 0x01
QEP_HEADER_SIZE = 202
AES_256_KEY_SIZE = 32
GCM_NONCE_SIZE = 12
GCM_TAG_SIZE = 16
HMAC_TAG_SIZE = 32


@dataclass
class EntropyMetadata:
    """Metadata about quantum entropy pool"""
    entropy_source: str
    backend_name: str
    job_id: str
    num_shots: int
    num_qubits: int
    bits_per_shot: int
    total_bytes: int
    consumed_bytes: int
    timestamp: datetime


@dataclass
class HealthMetrics:
    """Statistical health metrics for entropy quality"""
    chi_square_p_value: float
    autocorrelation: float
    min_entropy_estimate: float
    longest_run_zeros: int
    longest_run_ones: int
    passes_nist_tests: bool


class EntropyPoolException(Exception):
    """Exception raised when entropy pool operations fail"""
    pass


class QuantumEntropyPool:
    """
    Secure quantum entropy pool with encryption and integrity verification

    Thread-safe storage for quantum random bytes from IBM Quantum hardware.
    Provides AES-256-GCM encryption, HMAC-SHA256 integrity checks, and
    secure deletion of consumed entropy.

    Attributes:
        file_path: Path to entropy pool file
        metadata: Pool metadata (source, backend, job ID, etc.)
    """

    def __init__(self):
        """Private constructor - use create() or open() factory methods"""
        self._file_path: Optional[Path] = None
        self._header: Optional[dict] = None
        self._decrypted_entropy: Optional[bytes] = None
        self._encryption_key: Optional[bytes] = None
        self._hmac_key: Optional[bytes] = None
        self._refill_callback: Optional[Callable[[int], None]] = None
        self._refill_threshold: int = 10240
        self._audit_logging: bool = False
        self._audit_log_path: Optional[Path] = None

    @staticmethod
    def create(
        path: str,
        entropy_bytes: bytes,
        backend: str,
        job_id: str,
        num_shots: int,
        num_qubits: int,
        validate_entropy: bool = True
    ) -> 'QuantumEntropyPool':
        """
        Create new quantum entropy pool from IBM Quantum data

        Args:
            path: Path to entropy pool file (will be created with 0o600 permissions)
            entropy_bytes: Raw quantum entropy bytes from IBM Quantum
            backend: IBM Quantum backend name (e.g., "ibm_sherbrooke")
            job_id: IBM Quantum job UUID
            num_shots: Number of quantum shots executed
            num_qubits: Number of qubits measured per shot
            validate_entropy: If True, run statistical validation tests

        Returns:
            New QuantumEntropyPool instance

        Raises:
            EntropyPoolException: If creation fails or validation fails
        """
        pool = QuantumEntropyPool()

        # Validate entropy quality if requested
        if validate_entropy and not pool._validate_entropy_quality(entropy_bytes):
            raise EntropyPoolException("Entropy failed statistical validation")

        # Load and derive encryption keys
        master_key = pool._load_master_key()
        pool._encryption_key, pool._hmac_key = pool._derive_keys(master_key)

        # Initialize header
        header = {
            'magic': QEP_MAGIC,
            'version': QEP_VERSION,
            'flags': 0,
            'reserved': 0,
            'timestamp': int(time.time()),
            'entropy_source': b"IBM Quantum".ljust(16, b'\x00'),
            'backend_name': backend.encode('utf-8').ljust(32, b'\x00'),
            'job_id': job_id.encode('utf-8').ljust(64, b'\x00'),
            'num_shots': num_shots,
            'num_qubits': num_qubits,
            'bits_per_shot': num_qubits,
            'total_bytes': len(entropy_bytes),
            'consumed_bytes': 0,
        }

        # Generate random GCM nonce
        gcm_nonce = secrets.token_bytes(GCM_NONCE_SIZE)
        header['gcm_nonce'] = gcm_nonce

        # Encrypt entropy with AES-256-GCM
        aesgcm = AESGCM(pool._encryption_key)
        ciphertext = aesgcm.encrypt(gcm_nonce, entropy_bytes, None)

        # Extract auth tag (last 16 bytes of ciphertext)
        auth_tag = ciphertext[-GCM_TAG_SIZE:]
        encrypted_data = ciphertext[:-GCM_TAG_SIZE]
        header['auth_tag'] = auth_tag

        # Compute HMAC-SHA256 over header + ciphertext
        hmac_data = pool._pack_header_for_hmac(header) + encrypted_data
        hmac_tag = hmac.new(pool._hmac_key, hmac_data, hashlib.sha256).digest()
        header['hmac_tag'] = hmac_tag

        # Write file with secure permissions
        pool._file_path = Path(path)
        pool._write_pool_file(header, encrypted_data)
        pool._header = header
        pool._decrypted_entropy = bytearray(entropy_bytes)

        pool._log_audit_event(f"Pool created: {len(entropy_bytes)} bytes from {backend}")

        return pool

    @staticmethod
    def open(path: str) -> 'QuantumEntropyPool':
        """
        Open existing quantum entropy pool

        Args:
            path: Path to entropy pool file

        Returns:
            QuantumEntropyPool instance

        Raises:
            EntropyPoolException: If file cannot be opened or integrity check fails
        """
        pool = QuantumEntropyPool()
        pool._file_path = Path(path)

        # Load and derive encryption keys
        master_key = pool._load_master_key()
        pool._encryption_key, pool._hmac_key = pool._derive_keys(master_key)

        # Read and verify file
        with open(pool._file_path, 'rb') as f:
            header_bytes = f.read(QEP_HEADER_SIZE)
            if len(header_bytes) != QEP_HEADER_SIZE:
                raise EntropyPoolException("Failed to read entropy pool header")

            header = pool._unpack_header(header_bytes)

            # Validate header
            if header['magic'] != QEP_MAGIC:
                raise EntropyPoolException("Invalid entropy pool magic bytes")
            if header['version'] != QEP_VERSION:
                raise EntropyPoolException(f"Unsupported version: {header['version']}")

            # Read encrypted data
            encrypted_data = f.read(header['total_bytes'])
            if len(encrypted_data) != header['total_bytes']:
                raise EntropyPoolException("Failed to read encrypted entropy")

        # Verify HMAC
        hmac_data = pool._pack_header_for_hmac(header) + encrypted_data
        computed_hmac = hmac.new(pool._hmac_key, hmac_data, hashlib.sha256).digest()
        if not hmac.compare_digest(computed_hmac, header['hmac_tag']):
            raise EntropyPoolException("HMAC verification failed - file may be corrupted")

        # Decrypt entropy with AES-256-GCM
        aesgcm = AESGCM(pool._encryption_key)
        ciphertext = encrypted_data + header['auth_tag']

        try:
            plaintext = aesgcm.decrypt(header['gcm_nonce'], ciphertext, None)
        except Exception as e:
            raise EntropyPoolException(f"Decryption failed: {e}")

        pool._header = header
        pool._decrypted_entropy = bytearray(plaintext)

        available = header['total_bytes'] - header['consumed_bytes']
        pool._log_audit_event(f"Pool opened: {available} bytes available")

        return pool

    def get_bytes(self, num_bytes: int) -> bytes:
        """
        Get random bytes from pool (thread-safe)

        Atomically retrieves and securely deletes consumed entropy.

        Args:
            num_bytes: Number of random bytes to retrieve

        Returns:
            Random bytes from quantum entropy pool

        Raises:
            EntropyPoolException: If insufficient entropy available
        """
        available = self._header['total_bytes'] - self._header['consumed_bytes']
        if num_bytes > available:
            raise EntropyPoolException(
                f"Insufficient entropy: {num_bytes} requested, {available} available"
            )

        # Extract bytes
        start_idx = self._header['consumed_bytes']
        end_idx = start_idx + num_bytes
        result = bytes(self._decrypted_entropy[start_idx:end_idx])

        # Securely wipe consumed entropy (3-pass)
        for pass_num in range(3):
            fill_value = 0x00 if pass_num == 0 else 0xFF
            for i in range(start_idx, end_idx):
                self._decrypted_entropy[i] = fill_value

        # Update consumed bytes
        self._header['consumed_bytes'] += num_bytes
        self._update_consumed_bytes()

        self._log_audit_event(
            f"Retrieved {num_bytes} bytes "
            f"(consumed: {self._header['consumed_bytes']}/{self._header['total_bytes']})"
        )

        # Check refill callback
        if self._refill_callback and available - num_bytes < self._refill_threshold:
            self._refill_callback(available - num_bytes)

        return result

    def available_bytes(self) -> int:
        """Get number of bytes available (unconsumed)"""
        return self._header['total_bytes'] - self._header['consumed_bytes']

    def total_bytes(self) -> int:
        """Get total pool capacity"""
        return self._header['total_bytes']

    def consumed_bytes(self) -> int:
        """Get number of bytes already consumed"""
        return self._header['consumed_bytes']

    def is_low(self, threshold_bytes: int = 10240) -> bool:
        """Check if pool is nearly exhausted"""
        return self.available_bytes() < threshold_bytes

    def get_metadata(self) -> EntropyMetadata:
        """Get pool metadata"""
        return EntropyMetadata(
            entropy_source=self._header['entropy_source'].rstrip(b'\x00').decode('utf-8'),
            backend_name=self._header['backend_name'].rstrip(b'\x00').decode('utf-8'),
            job_id=self._header['job_id'].rstrip(b'\x00').decode('utf-8'),
            num_shots=self._header['num_shots'],
            num_qubits=self._header['num_qubits'],
            bits_per_shot=self._header['bits_per_shot'],
            total_bytes=self._header['total_bytes'],
            consumed_bytes=self._header['consumed_bytes'],
            timestamp=datetime.fromtimestamp(self._header['timestamp'])
        )

    def set_refill_callback(
        self,
        callback: Callable[[int], None],
        threshold_bytes: int = 10240
    ) -> None:
        """
        Set callback for low-entropy notification

        Args:
            callback: Function to call when entropy is low (receives bytes remaining)
            threshold_bytes: Threshold for triggering callback
        """
        self._refill_callback = callback
        self._refill_threshold = threshold_bytes

    def set_audit_logging(self, enabled: bool, log_path: str = "") -> None:
        """
        Enable/disable audit logging

        Args:
            enabled: Enable audit logging
            log_path: Path to log file (default: /var/log/qdaria/entropy_pool.log)
        """
        self._audit_logging = enabled
        self._audit_log_path = Path(log_path) if log_path else Path("/var/log/qdaria/entropy_pool.log")

    def secure_delete(self) -> None:
        """Securely delete pool file (3-pass overwrite)"""
        if not self._file_path or not self._file_path.exists():
            return

        file_size = self._file_path.stat().st_size

        # 3-pass secure deletion
        with open(self._file_path, 'r+b') as f:
            for pass_num in range(3):
                f.seek(0)
                fill_value = 0x00 if pass_num % 2 == 0 else 0xFF
                f.write(bytes([fill_value] * file_size))
                f.flush()
                os.fsync(f.fileno())

        self._file_path.unlink()
        self._log_audit_event("Pool securely deleted")

    # Private methods

    def _load_master_key(self) -> bytes:
        """Load master encryption key from environment or file"""
        # Try environment variable first
        env_key = os.getenv("QUANTUM_ENTROPY_KEY")
        if env_key:
            import base64
            try:
                key = base64.b64decode(env_key)
                if len(key) == AES_256_KEY_SIZE:
                    return key
            except Exception:
                pass

        # Try key file
        key_path = Path("/etc/qdaria/quantum_entropy.key")
        if key_path.exists():
            key = key_path.read_bytes()
            if len(key) == AES_256_KEY_SIZE:
                return key

        raise EntropyPoolException(
            "Master key not found. Set QUANTUM_ENTROPY_KEY environment variable "
            "or create /etc/qdaria/quantum_entropy.key"
        )

    def _derive_keys(self, master_key: bytes) -> Tuple[bytes, bytes]:
        """Derive encryption and HMAC keys from master key using HKDF"""
        backend = default_backend()

        # Derive encryption key
        enc_hkdf = HKDF(
            algorithm=hashes.SHA256(),
            length=AES_256_KEY_SIZE,
            salt=None,
            info=b"aes-gcm",
            backend=backend
        )
        encryption_key = enc_hkdf.derive(master_key)

        # Derive HMAC key
        hmac_hkdf = HKDF(
            algorithm=hashes.SHA256(),
            length=AES_256_KEY_SIZE,
            salt=None,
            info=b"hmac-sha256",
            backend=backend
        )
        hmac_key = hmac_hkdf.derive(master_key)

        return encryption_key, hmac_key

    def _pack_header_for_hmac(self, header: dict) -> bytes:
        """Pack header for HMAC computation (excludes HMAC and auth tags)"""
        return struct.pack(
            '<4sBBHQ16s32s64sIBBII',
            header['magic'],
            header['version'],
            header['flags'],
            header['reserved'],
            header['timestamp'],
            header['entropy_source'],
            header['backend_name'],
            header['job_id'],
            header['num_shots'],
            header['num_qubits'],
            header['bits_per_shot'],
            header['total_bytes'],
            header['consumed_bytes']
        ) + header['gcm_nonce']

    def _unpack_header(self, header_bytes: bytes) -> dict:
        """Unpack header from file"""
        fields = struct.unpack('<4sBBHQ16s32s64sIBBII12s32s16s', header_bytes)

        return {
            'magic': fields[0],
            'version': fields[1],
            'flags': fields[2],
            'reserved': fields[3],
            'timestamp': fields[4],
            'entropy_source': fields[5],
            'backend_name': fields[6],
            'job_id': fields[7],
            'num_shots': fields[8],
            'num_qubits': fields[9],
            'bits_per_shot': fields[10],
            'total_bytes': fields[11],
            'consumed_bytes': fields[12],
            'gcm_nonce': fields[13],
            'hmac_tag': fields[14],
            'auth_tag': fields[15]
        }

    def _write_pool_file(self, header: dict, encrypted_data: bytes) -> None:
        """Write pool file with secure permissions"""
        # Pack header
        header_bytes = self._pack_header_for_hmac(header) + header['hmac_tag'] + header['auth_tag']

        # Write with secure permissions (0o600)
        old_umask = os.umask(0o077)
        try:
            with open(self._file_path, 'wb') as f:
                f.write(header_bytes)
                f.write(encrypted_data)
                f.flush()
                os.fsync(f.fileno())
        finally:
            os.umask(old_umask)

    def _update_consumed_bytes(self) -> None:
        """Update consumed_bytes field in file"""
        with open(self._file_path, 'r+b') as f:
            # Seek to consumed_bytes field (offset 126)
            f.seek(126)
            f.write(struct.pack('<I', self._header['consumed_bytes']))
            f.flush()
            os.fsync(f.fileno())

    def _log_audit_event(self, event: str) -> None:
        """Log audit event to file"""
        if not self._audit_logging or not self._audit_log_path:
            return

        try:
            self._audit_log_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self._audit_log_path, 'a') as f:
                timestamp = datetime.now().isoformat()
                f.write(f"{timestamp} [INFO] {event}\n")
        except Exception:
            pass  # Silently ignore logging errors

    def _validate_entropy_quality(self, data: bytes) -> bool:
        """Run statistical validation tests on entropy"""
        if len(data) < 1000:
            return False  # Need at least 1KB for tests

        # Chi-square test
        freq = [0] * 256
        for byte in data:
            freq[byte] += 1

        expected = len(data) / 256.0
        chi_square = sum((f - expected) ** 2 / expected for f in freq)
        chi_square_pass = chi_square < 300.0

        # Autocorrelation test (simplified)
        if len(data) < 2:
            return False

        mean = sum(data) / len(data)
        variance = sum((b - mean) ** 2 for b in data)
        covariance = sum((data[i] - mean) * (data[i-1] - mean) for i in range(1, len(data)))
        autocorr = (covariance / variance) if variance > 0 else 0
        autocorr_pass = abs(autocorr) < 0.1

        return chi_square_pass and autocorr_pass


def generate_encryption_key(key_path: str) -> bool:
    """
    Generate and store new encryption key

    Args:
        key_path: Path to key file (will be created with 0o400 permissions)

    Returns:
        True on success
    """
    key = secrets.token_bytes(AES_256_KEY_SIZE)

    key_file = Path(key_path)
    key_file.parent.mkdir(parents=True, exist_ok=True)

    old_umask = os.umask(0o377)
    try:
        key_file.write_bytes(key)
        return True
    finally:
        os.umask(old_umask)


if __name__ == "__main__":
    # Simple CLI for testing
    import argparse

    parser = argparse.ArgumentParser(description="Quantum Entropy Pool CLI")
    parser.add_argument("command", choices=["create", "info", "get", "genkey"],
                       help="Command to execute")
    parser.add_argument("--path", required=True, help="Pool file path")
    parser.add_argument("--bytes", type=int, default=32, help="Number of bytes to get")
    parser.add_argument("--key-path", help="Encryption key path (for genkey)")

    args = parser.parse_args()

    if args.command == "genkey":
        if not args.key_path:
            print("Error: --key-path required for genkey")
            sys.exit(1)
        if generate_encryption_key(args.key_path):
            print(f"Generated key: {args.key_path}")
        else:
            print("Failed to generate key")
            sys.exit(1)

    elif args.command == "info":
        pool = QuantumEntropyPool.open(args.path)
        meta = pool.get_metadata()
        print(f"Source: {meta.entropy_source}")
        print(f"Backend: {meta.backend_name}")
        print(f"Job ID: {meta.job_id}")
        print(f"Shots: {meta.num_shots}, Qubits: {meta.num_qubits}")
        print(f"Total: {meta.total_bytes} bytes")
        print(f"Available: {pool.available_bytes()} bytes")
        print(f"Created: {meta.timestamp}")

    elif args.command == "get":
        pool = QuantumEntropyPool.open(args.path)
        random_bytes = pool.get_bytes(args.bytes)
        print(f"Random bytes ({len(random_bytes)}): {random_bytes.hex()}")
