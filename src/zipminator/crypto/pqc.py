import os
from typing import Tuple, Optional

# Try to import Rust bindings first (High Performance)
try:
    from zipminator import _core as zipminator_pqc
    RUST_AVAILABLE = True
except ImportError:
    RUST_AVAILABLE = False

# Fallback to pure Python (Slower)
try:
    from kyber_py.ml_kem.default_parameters import ML_KEM_512, ML_KEM_768, ML_KEM_1024
    KYBER_AVAILABLE = True
except ImportError:
    KYBER_AVAILABLE = False


class PQC:
    """
    Post-Quantum Cryptography Wrapper (FIPS 203 / ML-KEM).
    Prioritizes high-performance Rust implementation.
    """

    def __init__(self, level: int = 768):
        """
        Initialize PQC wrapper.
        Args:
            level: Security level (512, 768, 1024). Default 768 (NIST Level 3).
        """
        self.level = level
        self.use_rust = False

        if RUST_AVAILABLE and level == 768:
            self.use_rust = True
        elif KYBER_AVAILABLE:
            if level == 512:
                self.kyber = ML_KEM_512
            elif level == 768:
                self.kyber = ML_KEM_768
            elif level == 1024:
                self.kyber = ML_KEM_1024
            else:
                raise ValueError(
                    "Invalid Kyber level. Must be 512, 768, or 1024.")
        else:
            raise ImportError(
                "No PQC backend found. Please install 'zipminator-pqc' (Rust) or 'kyber-py' (Python).")

    def generate_keypair(self, seed: Optional[bytes] = None) -> Tuple[bytes, bytes]:
        """
        Generate a new keypair.
        Args:
            seed: Optional 32-byte seed for deterministic generation (e.g. from Quantum Entropy).
        Returns:
            (public_key, secret_key) as bytes.
        """
        if self.use_rust:
            if seed:
                if len(seed) != 32:
                    raise ValueError(
                        "Seed must be exactly 32 bytes for Rust backend.")
                pk, sk = zipminator_pqc.keypair_from_seed(seed)
            else:
                pk, sk = zipminator_pqc.keypair()
            return pk.to_bytes(), sk.to_bytes()
        else:
            # Python fallback (does not support seeding in this wrapper version easily)
            if seed:
                print(
                    "Warning: Seeding not supported in Python fallback. Using system randomness.")
            pk, sk = self.kyber.keygen()
            return pk, sk

    def encapsulate(self, pk_bytes: bytes) -> Tuple[bytes, bytes]:
        """
        Encapsulate a shared secret using the public key.
        """
        if self.use_rust:
            pk = zipminator_pqc.PublicKey.from_bytes(pk_bytes)
            ct, ss = zipminator_pqc.encapsulate(pk)
            return ct.to_bytes(), ss
        else:
            key, c = self.kyber.encaps(pk_bytes)
            return c, key

    def decapsulate(self, sk_bytes: bytes, ct_bytes: bytes) -> bytes:
        """
        Decapsulate the shared secret using the secret key.
        """
        if self.use_rust:
            sk = zipminator_pqc.SecretKey.from_bytes(sk_bytes)
            ct = zipminator_pqc.Ciphertext.from_bytes(ct_bytes)
            ss = zipminator_pqc.decapsulate(ct, sk)
            return ss
        else:
            key = self.kyber.decaps(sk_bytes, ct_bytes)
            return key
