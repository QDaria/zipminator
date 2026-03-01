#!/usr/bin/env python3
"""
Zipminator Post-Quantum Cryptography -- Python Tutorial
========================================================

Target audience: Norwegian Government / Digitaliseringsdirektoratet
Standard: NIST FIPS 203 (ML-KEM / CRYSTALS-Kyber-768)

This tutorial demonstrates:
  1. Basic key generation and encapsulation
  2. Deterministic keygen from quantum entropy seed
  3. The high-level PQC wrapper API
  4. Quantum-enhanced random number generation
  5. Integration patterns for government systems

Prerequisites:
  - Run install.sh first (builds Rust core + Python bindings)
  - Activate the virtual environment: source ../../.venv/bin/activate

Usage:
  python3 tutorial.py
"""

import sys
import time
import hashlib

# ═══════════════════════════════════════════════════════════════════
# Section 0: Verify installation
# ═══════════════════════════════════════════════════════════════════

print()
print("=" * 68)
print("  Zipminator Post-Quantum Cryptography -- Python Tutorial")
print("  NIST FIPS 203 | CRYSTALS-Kyber-768 | Security Level 3")
print("=" * 68)
print()

try:
    from zipminator._core import (
        keypair,
        keypair_from_seed,
        encapsulate,
        encapsulate_with_coins,
        decapsulate,
        get_constants,
        PublicKey,
        SecretKey,
        Ciphertext,
    )
    print("[OK] Rust Kyber768 bindings loaded successfully")
except ImportError as e:
    print(f"[FAIL] Could not import Rust bindings: {e}")
    print("       Run install.sh first, then activate the venv.")
    sys.exit(1)

try:
    from zipminator.crypto.pqc import PQC
    print("[OK] High-level PQC wrapper loaded")
except ImportError:
    print("[!]  PQC wrapper not available (optional)")

try:
    from zipminator.crypto.quantum_random import QuantumRandom
    print("[OK] Quantum random module loaded")
except ImportError:
    print("[!]  Quantum random not available (optional)")

print()

# ═══════════════════════════════════════════════════════════════════
# Section 1: Basic Key Encapsulation Mechanism (KEM)
# ═══════════════════════════════════════════════════════════════════

print("-" * 68)
print("  Section 1: Basic Key Encapsulation Mechanism")
print("-" * 68)
print()
print("  CRYSTALS-Kyber is a Key Encapsulation Mechanism (KEM).")
print("  It allows two parties to establish a shared secret key")
print("  over an insecure channel, safe against quantum attacks.")
print()

# Step 1: Alice generates a key pair
print("  Step 1: Alice generates a key pair")
t0 = time.perf_counter()
pk, sk = keypair()
t1 = time.perf_counter()

print(f"    Public key  : {pk.to_bytes()[:20].hex()}... ({pk.size} bytes)")
print(f"    Secret key  : [kept private] ({sk.size} bytes)")
print(f"    Time        : {(t1-t0)*1000:.2f} ms")
print()

# Step 2: Bob encapsulates using Alice's public key
print("  Step 2: Bob uses Alice's public key to create a shared secret")
t0 = time.perf_counter()
ct, ss_bob = encapsulate(pk)
t1 = time.perf_counter()

print(f"    Ciphertext  : {ct.to_bytes()[:20].hex()}... ({ct.size} bytes)")
print(f"    Shared secret (Bob): {ss_bob.hex()}")
print(f"    Time        : {(t1-t0)*1000:.2f} ms")
print()

# Step 3: Alice decapsulates using her secret key
print("  Step 3: Alice recovers the shared secret from the ciphertext")
t0 = time.perf_counter()
ss_alice = decapsulate(ct, sk)
t1 = time.perf_counter()

print(f"    Shared secret (Alice): {ss_alice.hex()}")
print(f"    Time        : {(t1-t0)*1000:.2f} ms")
print()

# Verify
assert ss_bob == ss_alice, "CRITICAL: Shared secrets do not match!"
print(f"    MATCH: {ss_bob == ss_alice}")
print()
print("  Both parties now share the same 256-bit secret key.")
print("  This key can be used for AES-256 symmetric encryption.")
print()
input("  Press Enter to continue... ")

# ═══════════════════════════════════════════════════════════════════
# Section 2: Deterministic Key Generation
# ═══════════════════════════════════════════════════════════════════

print()
print("-" * 68)
print("  Section 2: Deterministic Key Generation from Seed")
print("-" * 68)
print()
print("  In government deployments, you may need reproducible keys")
print("  derived from a hardware security module (HSM) or quantum")
print("  random number generator (QRNG) seed.")
print()

# Same 32-byte seed always produces the same key pair
seed = bytes.fromhex(
    "4f6e20746865206272696467652c2077"
    "6520736565206120667574757265202e"
)
print(f"  Seed: {seed.hex()}")
print()

pk1, sk1 = keypair_from_seed(seed)
pk2, sk2 = keypair_from_seed(seed)

print(f"  Key pair 1: pk={pk1.to_bytes()[:12].hex()}...")
print(f"  Key pair 2: pk={pk2.to_bytes()[:12].hex()}...")
print(f"  Identical : {pk1.to_bytes() == pk2.to_bytes()}")
print()
print("  Same seed -> same key pair. This enables key escrow,")
print("  backup/recovery, and HSM-based key management.")
print()
input("  Press Enter to continue... ")

# ═══════════════════════════════════════════════════════════════════
# Section 3: High-Level PQC Wrapper
# ═══════════════════════════════════════════════════════════════════

print()
print("-" * 68)
print("  Section 3: High-Level PQC API")
print("-" * 68)
print()
print("  The PQC class provides a simplified API for integration")
print("  into existing government systems (e.g., Altinn, ID-porten).")
print()

try:
    pqc = PQC(level=768)  # NIST Level 3
    print(f"  Backend: {'Rust (high-performance)' if pqc.use_rust else 'Python (fallback)'}")
    print()

    # Generate keys as raw bytes (easy to serialize/store)
    pk_bytes, sk_bytes = pqc.generate_keypair()
    print(f"  Public key : {len(pk_bytes)} bytes")
    print(f"  Secret key : {len(sk_bytes)} bytes")

    # Encapsulate
    ct_bytes, ss1 = pqc.encapsulate(pk_bytes)
    print(f"  Ciphertext : {len(ct_bytes)} bytes")
    print(f"  Shared key : {ss1.hex()[:32]}...")

    # Decapsulate
    ss2 = pqc.decapsulate(sk_bytes, ct_bytes)
    print(f"  Recovered  : {ss2.hex()[:32]}...")
    print(f"  Match      : {ss1 == ss2}")
    print()
    print("  The PQC wrapper returns raw bytes -- ready to store in")
    print("  databases, pass through REST APIs, or embed in X.509.")

except Exception as e:
    print(f"  [Skipped] PQC wrapper error: {e}")

print()
input("  Press Enter to continue... ")

# ═══════════════════════════════════════════════════════════════════
# Section 4: Quantum-Enhanced Random Number Generation
# ═══════════════════════════════════════════════════════════════════

print()
print("-" * 68)
print("  Section 4: Quantum Random Number Generation")
print("-" * 68)
print()
print("  Zipminator includes a QRNG module that provides quantum-")
print("  sourced entropy. In production, this connects to IBM Quantum")
print("  or Rigetti hardware. For evaluation, it uses system CSPRNG.")
print()

try:
    qr = QuantumRandom()
    print(f"  License tier: {qr.license_tier}")
    print()

    # Generate random values
    r_int = qr.randint(1, 1_000_000)
    r_float = qr.random()
    r_bytes = qr.randbytes(32)
    r_gauss = qr.gauss(mu=0.0, sigma=1.0)

    print(f"  randint(1, 1M)  : {r_int}")
    print(f"  random()        : {r_float:.15f}")
    print(f"  randbytes(32)   : {r_bytes.hex()[:32]}...")
    print(f"  gauss(0, 1)     : {r_gauss:.6f}")
    print()
    print("  API is compatible with Python's `random` module.")
    print("  Drop-in replacement for existing applications.")

except Exception as e:
    print(f"  [Skipped] QuantumRandom error: {e}")

print()
input("  Press Enter to continue... ")

# ═══════════════════════════════════════════════════════════════════
# Section 5: Integration Patterns for Government
# ═══════════════════════════════════════════════════════════════════

print()
print("-" * 68)
print("  Section 5: Government Integration Patterns")
print("-" * 68)
print()

print("""  Pattern A: Hybrid TLS Key Exchange
  ────────────────────────────────────
  Combine Kyber768 with X25519 for post-quantum + classical security.
  The shared secret from Kyber is mixed with the ECDH shared secret.

    kyber_ss = decapsulate(ciphertext, secret_key)
    ecdh_ss  = x25519(private_key, peer_public_key)
    session_key = SHA-256(kyber_ss || ecdh_ss)

  Pattern B: Document Encryption at Rest
  ───────────────────────────────────────
  Protect classified documents with quantum-safe key wrapping.

    pk, sk = keypair()                    # Stored in HSM
    ct, data_key = encapsulate(pk)        # data_key is AES-256 key
    encrypted = AES-256-GCM(data_key, document)
    store(ct, encrypted)                  # ct is the wrapped key

  Pattern C: Secure Inter-Agency Communication
  ─────────────────────────────────────────────
  Each agency has a Kyber key pair. To send a secret:

    ct, shared_secret = encapsulate(recipient_agency_pk)
    message_key = HKDF(shared_secret, info=b"inter-agency-v1")
    encrypted_msg = AES-256-GCM(message_key, message)
    send(ct, encrypted_msg)               # Only recipient can decrypt
""")
input("  Press Enter to continue to final summary... ")

# ═══════════════════════════════════════════════════════════════════
# Section 6: Compliance Summary
# ═══════════════════════════════════════════════════════════════════

print()
print("-" * 68)
print("  Section 6: Compliance and Readiness Summary")
print("-" * 68)
print()

constants = get_constants()

# Run a quick verification
all_ok = True
for i in range(10):
    pk_i, sk_i = keypair()
    ct_i, ss_a = encapsulate(pk_i)
    ss_b = decapsulate(ct_i, sk_i)
    if ss_a != ss_b:
        all_ok = False
        break

print(f"""  Algorithm          : CRYSTALS-Kyber-768 (ML-KEM)
  NIST Standard      : FIPS 203 (August 2024)
  Security Level     : 3 (equivalent to AES-192)
  Implementation     : Rust (constant-time operations)

  Key Sizes:
    Public Key       : {constants['public_key_bytes']} bytes
    Secret Key       : {constants['secret_key_bytes']} bytes
    Ciphertext       : {constants['ciphertext_bytes']} bytes
    Shared Secret    : {constants['shared_secret_bytes']} bytes (256-bit)

  Verification:
    10-round test    : {'PASSED' if all_ok else 'FAILED'}
    Implicit reject  : Supported (FIPS 203 compliant)
    Constant-time    : Yes (side-channel resistant)

  Deployment Options:
    - Standalone Rust library (no runtime dependencies)
    - Python SDK with PyO3 bindings (pip installable)
    - REST API server (FastAPI)
    - Docker container (self-contained)

  Quantum Entropy:
    - IBM Quantum (127-qubit Eagle processor)
    - Rigetti Computing (Ankaa-3 processor)
    - System CSPRNG fallback (/dev/urandom)
""")

print("=" * 68)
print("  Tutorial complete. For questions or integration support,")
print("  contact QDaria AS -- post-quantum cryptography specialists.")
print("=" * 68)
print()
