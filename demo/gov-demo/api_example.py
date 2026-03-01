#!/usr/bin/env python3
"""
Zipminator -- API Integration Examples
=======================================

Shows how to integrate Kyber768 post-quantum cryptography into
existing Python applications, REST APIs, and microservices.

Prerequisites:
  - Run install.sh first
  - Activate venv: source ../../.venv/bin/activate
"""

import time
import hashlib
import json
import base64
from typing import Tuple


# ═══════════════════════════════════════════════════════════════════
# Example 1: Direct Rust API Usage
# ═══════════════════════════════════════════════════════════════════

def example_direct_api():
    """
    Lowest-level API -- direct Rust bindings.
    Use when you need maximum control and performance.
    """
    from zipminator._core import (
        keypair, keypair_from_seed,
        encapsulate, decapsulate,
        PublicKey, SecretKey, Ciphertext,
    )

    print("Example 1: Direct Rust API")
    print("-" * 40)

    # Generate keys
    pk, sk = keypair()

    # Serialize keys for storage/transmission
    pk_bytes = pk.to_bytes()  # 1184 bytes
    sk_bytes = sk.to_bytes()  # 2400 bytes

    # Reconstruct from bytes (e.g., loaded from database)
    pk_restored = PublicKey.from_bytes(pk_bytes)
    sk_restored = SecretKey.from_bytes(sk_bytes)

    # Encapsulate and decapsulate
    ct, ss_sender = encapsulate(pk_restored)
    ss_receiver = decapsulate(ct, sk_restored)

    assert ss_sender == ss_receiver
    print(f"  Shared secret: {ss_sender.hex()[:32]}...")
    print(f"  Verified: OK")
    print()


# ═══════════════════════════════════════════════════════════════════
# Example 2: High-Level PQC Wrapper
# ═══════════════════════════════════════════════════════════════════

def example_pqc_wrapper():
    """
    Simplified API -- works with raw bytes.
    Ideal for REST APIs and database storage.
    """
    from zipminator.crypto.pqc import PQC

    print("Example 2: PQC Wrapper (bytes-based)")
    print("-" * 40)

    pqc = PQC(level=768)

    # All operations return/accept plain bytes
    pk_bytes, sk_bytes = pqc.generate_keypair()
    ct_bytes, shared_secret = pqc.encapsulate(pk_bytes)
    recovered = pqc.decapsulate(sk_bytes, ct_bytes)

    assert shared_secret == recovered
    print(f"  Public key: {len(pk_bytes)} bytes")
    print(f"  Shared secret matches: {shared_secret == recovered}")
    print()


# ═══════════════════════════════════════════════════════════════════
# Example 3: JSON Serialization for REST APIs
# ═══════════════════════════════════════════════════════════════════

def example_json_serialization():
    """
    Shows how to serialize Kyber keys and ciphertexts as JSON
    for transmission via REST APIs.
    """
    from zipminator._core import keypair, encapsulate, decapsulate, PublicKey, SecretKey, Ciphertext

    print("Example 3: JSON Serialization for REST")
    print("-" * 40)

    pk, sk = keypair()
    ct, ss = encapsulate(pk)

    # Serialize to JSON-safe format
    payload = {
        "algorithm": "Kyber768",
        "standard": "FIPS-203",
        "public_key": base64.b64encode(pk.to_bytes()).decode("ascii"),
        "ciphertext": base64.b64encode(ct.to_bytes()).decode("ascii"),
        "shared_secret_hash": hashlib.sha256(ss).hexdigest(),
    }

    json_str = json.dumps(payload, indent=2)
    print(f"  JSON payload ({len(json_str)} chars):")
    print(f"    algorithm: {payload['algorithm']}")
    print(f"    pk length: {len(payload['public_key'])} base64 chars")
    print(f"    ct length: {len(payload['ciphertext'])} base64 chars")
    print()

    # Deserialize and verify
    loaded = json.loads(json_str)
    pk_back = PublicKey.from_bytes(base64.b64decode(loaded["public_key"]))
    ct_back = Ciphertext.from_bytes(base64.b64decode(loaded["ciphertext"]))
    ss_back = decapsulate(ct_back, sk)
    assert ss == ss_back
    print(f"  Round-trip JSON -> decapsulate: OK")
    print()


# ═══════════════════════════════════════════════════════════════════
# Example 4: Hybrid Encryption (Kyber + AES-256-GCM)
# ═══════════════════════════════════════════════════════════════════

def example_hybrid_encryption():
    """
    Real-world pattern: use Kyber for key exchange,
    then AES-256-GCM for actual data encryption.
    This is the recommended deployment pattern.
    """
    from zipminator._core import keypair, encapsulate, decapsulate
    from hashlib import sha256
    import os

    print("Example 4: Hybrid Encryption (Kyber + AES-GCM)")
    print("-" * 40)

    # Simulate a document to encrypt
    document = b"CLASSIFIED: Norwegian defense procurement strategy 2027-2030"
    print(f"  Document: {len(document)} bytes")

    # Step 1: Recipient generates Kyber key pair (stored in HSM)
    pk, sk = keypair()
    print(f"  Recipient key pair generated")

    # Step 2: Sender encapsulates to get data encryption key
    ct, shared_secret = encapsulate(pk)

    # Derive AES key from shared secret using HKDF-like construction
    aes_key = sha256(shared_secret + b"zipminator-aes-key-v1").digest()
    print(f"  AES-256 key derived from KEM shared secret")

    # Step 3: Encrypt document with AES-256-GCM
    try:
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        nonce = os.urandom(12)
        aesgcm = AESGCM(aes_key)
        encrypted = aesgcm.encrypt(nonce, document, None)
        print(f"  Encrypted: {len(encrypted)} bytes (AES-256-GCM)")

        # Step 4: Recipient decapsulates to recover AES key
        recovered_ss = decapsulate(ct, sk)
        recovered_aes_key = sha256(recovered_ss + b"zipminator-aes-key-v1").digest()

        aesgcm2 = AESGCM(recovered_aes_key)
        decrypted = aesgcm2.decrypt(nonce, encrypted, None)
        assert decrypted == document
        print(f"  Decrypted: {decrypted.decode()[:40]}...")
        print(f"  Integrity: verified (GCM authentication tag)")

    except ImportError:
        print("  [!] cryptography package not installed, skipping AES step")
        print("      pip install cryptography")

    print()


# ═══════════════════════════════════════════════════════════════════
# Example 5: Quantum-Seeded Key Generation
# ═══════════════════════════════════════════════════════════════════

def example_quantum_seeded():
    """
    Use quantum entropy as the seed for deterministic key generation.
    Enables reproducible keys backed by true quantum randomness.
    """
    from zipminator._core import keypair_from_seed
    from zipminator.crypto.quantum_random import QuantumRandom

    print("Example 5: Quantum-Seeded Key Generation")
    print("-" * 40)

    # Get 32 bytes of quantum entropy
    qr = QuantumRandom()
    quantum_seed = qr.randbytes(32)
    print(f"  Quantum seed: {quantum_seed.hex()[:32]}...")

    # Generate a deterministic key pair from this seed
    pk, sk = keypair_from_seed(quantum_seed)
    print(f"  Key pair generated from quantum entropy")
    print(f"  Public key: {pk.to_bytes()[:12].hex()}... ({pk.size} bytes)")

    # Same seed always gives same keys (for backup/recovery)
    pk2, sk2 = keypair_from_seed(quantum_seed)
    assert pk.to_bytes() == pk2.to_bytes()
    assert sk.to_bytes() == sk2.to_bytes()
    print(f"  Reproducibility: verified (same seed -> same keys)")
    print()


# ═══════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print()
    print("=" * 50)
    print("  Zipminator API Integration Examples")
    print("=" * 50)
    print()

    example_direct_api()
    example_pqc_wrapper()
    example_json_serialization()
    example_hybrid_encryption()
    example_quantum_seeded()

    print("=" * 50)
    print("  All examples completed successfully.")
    print("=" * 50)
    print()
