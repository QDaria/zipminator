import subprocess
import base64
import time
from pathlib import Path
from typing import Tuple, Optional
from src.config import settings


class RustCLIWrapper:
    """Wrapper around the Rust Zipminator CLI"""

    def __init__(self):
        self.cli_path = Path(__file__).parent.parent.parent.parent / settings.CLI_PATH
        if not self.cli_path.exists():
            raise FileNotFoundError(f"Rust CLI binary not found at {self.cli_path}")

    def generate_keypair(self, use_quantum: bool = False) -> Tuple[str, str]:
        """
        Generate Kyber768 keypair

        Args:
            use_quantum: Whether to use quantum entropy

        Returns:
            Tuple of (public_key_base64, secret_key_base64)
        """
        cmd = [str(self.cli_path), "keygen"]
        if use_quantum:
            cmd.append("--quantum")

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True,
                timeout=30,
            )

            output = result.stdout.strip()
            lines = output.split('\n')

            public_key = None
            secret_key = None

            for line in lines:
                if line.startswith("Public key:"):
                    public_key = line.split(":", 1)[1].strip()
                elif line.startswith("Secret key:"):
                    secret_key = line.split(":", 1)[1].strip()

            if not public_key or not secret_key:
                raise ValueError("Failed to parse keypair from CLI output")

            return public_key, secret_key

        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"CLI keygen failed: {e.stderr}")
        except subprocess.TimeoutExpired:
            raise RuntimeError("CLI keygen timed out after 30 seconds")

    def encrypt(self, public_key: str, plaintext: bytes) -> Tuple[str, str]:
        """
        Encrypt data using Kyber768

        Args:
            public_key: Base64-encoded public key
            plaintext: Raw bytes to encrypt

        Returns:
            Tuple of (ciphertext_base64, shared_secret_base64)
        """
        try:
            plaintext_b64 = base64.b64encode(plaintext).decode('utf-8')

            # Pass public key via stdin to avoid process listing exposure
            cmd = [str(self.cli_path), "encrypt"]

            result = subprocess.run(
                cmd,
                input=f"{public_key}\n{plaintext_b64}",
                capture_output=True,
                text=True,
                check=True,
                timeout=30,
            )

            output = result.stdout.strip()
            lines = output.split('\n')

            ciphertext = None
            shared_secret = None

            for line in lines:
                if line.startswith("Ciphertext:"):
                    ciphertext = line.split(":", 1)[1].strip()
                elif line.startswith("Shared secret:"):
                    shared_secret = line.split(":", 1)[1].strip()

            if not ciphertext or not shared_secret:
                raise ValueError("Failed to parse encryption output from CLI")

            return ciphertext, shared_secret

        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"CLI encryption failed: {e.stderr}")
        except subprocess.TimeoutExpired:
            raise RuntimeError("CLI encryption timed out after 30 seconds")

    def decrypt(self, secret_key: str, ciphertext: str) -> Tuple[bytes, str]:
        """
        Decrypt data using Kyber768

        Args:
            secret_key: Base64-encoded secret key
            ciphertext: Base64-encoded ciphertext

        Returns:
            Tuple of (plaintext_bytes, shared_secret_base64)
        """
        try:
            # Pass secret key via stdin to avoid process listing exposure
            cmd = [str(self.cli_path), "decrypt"]

            result = subprocess.run(
                cmd,
                input=f"{secret_key}\n{ciphertext}",
                capture_output=True,
                text=True,
                check=True,
                timeout=30,
            )

            output = result.stdout.strip()
            lines = output.split('\n')

            plaintext_b64 = None
            shared_secret = None

            for line in lines:
                if line.startswith("Plaintext:"):
                    plaintext_b64 = line.split(":", 1)[1].strip()
                elif line.startswith("Shared secret:"):
                    shared_secret = line.split(":", 1)[1].strip()

            if not plaintext_b64 or not shared_secret:
                raise ValueError("Failed to parse decryption output from CLI")

            plaintext = base64.b64decode(plaintext_b64)

            return plaintext, shared_secret

        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"CLI decryption failed: {e.stderr}")
        except subprocess.TimeoutExpired:
            raise RuntimeError("CLI decryption timed out after 30 seconds")


# Lazy singleton -- only initialize when first accessed
_cli_wrapper: Optional[RustCLIWrapper] = None


def get_cli_wrapper() -> RustCLIWrapper:
    global _cli_wrapper
    if _cli_wrapper is None:
        _cli_wrapper = RustCLIWrapper()
    return _cli_wrapper
