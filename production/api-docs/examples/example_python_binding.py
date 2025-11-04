#!/usr/bin/env python3
"""
Zipminator Python Bindings Example
Demonstrates Kyber key exchange and Dilithium signatures using ctypes

Requirements:
    pip install zipminator

Or manual ctypes binding (shown below)
"""

import ctypes
import os
import time
from ctypes import (
    CDLL, POINTER, Structure, c_char_p, c_uint8, c_uint32, c_uint64,
    c_size_t, c_int, c_bool, c_double, byref
)


# Load Zipminator library
try:
    lib = CDLL("libzipminator.so")
except OSError:
    # Try macOS
    try:
        lib = CDLL("libzipminator.dylib")
    except OSError:
        print("Error: libzipminator not found. Install with:")
        print("  sudo apt-get install libzipminator")
        exit(1)


# Error structure
class ZipminatorError(Structure):
    _fields_ = [
        ("code", c_int),
        ("message", c_char_p * 256),
        ("line", c_uint32),
        ("file", c_char_p)
    ]


# Config structure
class ZipminatorConfig(Structure):
    _fields_ = [
        ("entropy_source", c_int),
        ("enable_side_channel_protection", c_bool),
        ("enable_fault_protection", c_bool),
        ("qrng_health_check_interval_ms", c_uint32)
    ]


# QRNG health structure
class QRNGHealth(Structure):
    _fields_ = [
        ("is_healthy", c_bool),
        ("entropy_bits_generated", c_uint64),
        ("health_check_failures", c_uint32),
        ("throughput_mbps", c_double),
        ("device_model", c_char_p * 64)
    ]


# Version structure
class ZipminatorVersion(Structure):
    _fields_ = [
        ("major", c_uint8),
        ("minor", c_uint8),
        ("patch", c_uint8),
        ("git_commit", c_char_p * 8),
        ("fips_mode", c_bool),
        ("qrng_available", c_bool)
    ]


# Function prototypes
lib.zipminator_init.argtypes = [POINTER(ZipminatorConfig), POINTER(ZipminatorError)]
lib.zipminator_init.restype = c_int

lib.zipminator_get_version.argtypes = [POINTER(ZipminatorVersion)]
lib.zipminator_get_version.restype = None

lib.zipminator_kyber768_keygen.argtypes = [
    POINTER(c_uint8), POINTER(c_uint8), POINTER(ZipminatorError)
]
lib.zipminator_kyber768_keygen.restype = c_int

lib.zipminator_kyber768_encaps.argtypes = [
    POINTER(c_uint8), POINTER(c_uint8), POINTER(c_uint8), POINTER(ZipminatorError)
]
lib.zipminator_kyber768_encaps.restype = c_int

lib.zipminator_kyber768_decaps.argtypes = [
    POINTER(c_uint8), POINTER(c_uint8), POINTER(c_uint8), POINTER(ZipminatorError)
]
lib.zipminator_kyber768_decaps.restype = c_int

lib.zipminator_dilithium3_keygen.argtypes = [
    POINTER(c_uint8), POINTER(c_uint8), POINTER(ZipminatorError)
]
lib.zipminator_dilithium3_keygen.restype = c_int

lib.zipminator_dilithium3_sign.argtypes = [
    POINTER(c_uint8), c_size_t, POINTER(c_uint8),
    POINTER(c_uint8), POINTER(c_size_t), POINTER(ZipminatorError)
]
lib.zipminator_dilithium3_sign.restype = c_int

lib.zipminator_dilithium3_verify.argtypes = [
    POINTER(c_uint8), c_size_t, POINTER(c_uint8), c_size_t,
    POINTER(c_uint8), POINTER(ZipminatorError)
]
lib.zipminator_dilithium3_verify.restype = c_int

lib.zipminator_qrng_get_health.argtypes = [POINTER(QRNGHealth), POINTER(ZipminatorError)]
lib.zipminator_qrng_get_health.restype = c_int

lib.zipminator_cleanup.argtypes = []
lib.zipminator_cleanup.restype = None


# Constants
ZIPMINATOR_SUCCESS = 0
ZIPMINATOR_ENTROPY_QRNG = 0


# Helper functions
def check_error(result: int, error: ZipminatorError) -> None:
    """Check result and raise exception on error"""
    if result != ZIPMINATOR_SUCCESS:
        msg = error.message[0].decode('utf-8') if error.message[0] else "Unknown error"
        raise RuntimeError(f"Zipminator error: {msg} (code {error.code})")


def bytes_to_hex(data: bytes, limit: int = 32) -> str:
    """Convert bytes to hex string (limited length)"""
    hex_str = data[:limit].hex()
    if len(data) > limit:
        hex_str += "..."
    return hex_str


# Main API
def kyber768_example():
    """Demonstrate Kyber-768 key exchange"""
    print("\n=== Kyber-768 Key Exchange Example ===\n")

    error = ZipminatorError()

    # Alice: Generate key pair
    print("[Alice] Generating Kyber-768 key pair...")
    alice_pk = (c_uint8 * 1184)()
    alice_sk = (c_uint8 * 2400)()

    start = time.time()
    result = lib.zipminator_kyber768_keygen(alice_pk, alice_sk, byref(error))
    elapsed = (time.time() - start) * 1000
    check_error(result, error)

    print(f"  KeyGen time: {elapsed:.3f} ms")
    print(f"  Public key: {bytes_to_hex(bytes(alice_pk))}")
    print(f"  Secret key: {bytes_to_hex(bytes(alice_sk))}")

    # Bob: Encapsulate shared secret
    print("\n[Bob] Encapsulating shared secret...")
    ciphertext = (c_uint8 * 1088)()
    bob_shared = (c_uint8 * 32)()

    start = time.time()
    result = lib.zipminator_kyber768_encaps(alice_pk, ciphertext, bob_shared, byref(error))
    elapsed = (time.time() - start) * 1000
    check_error(result, error)

    print(f"  Encaps time: {elapsed:.3f} ms")
    print(f"  Ciphertext: {bytes_to_hex(bytes(ciphertext))}")
    print(f"  Bob's shared secret: {bytes_to_hex(bytes(bob_shared), 32)}")

    # Alice: Decapsulate
    print("\n[Alice] Decapsulating ciphertext...")
    alice_shared = (c_uint8 * 32)()

    start = time.time()
    result = lib.zipminator_kyber768_decaps(ciphertext, alice_sk, alice_shared, byref(error))
    elapsed = (time.time() - start) * 1000
    check_error(result, error)

    print(f"  Decaps time: {elapsed:.3f} ms")
    print(f"  Alice's shared secret: {bytes_to_hex(bytes(alice_shared), 32)}")

    # Verify
    print("\n[Verification] Comparing shared secrets...")
    if bytes(alice_shared) == bytes(bob_shared):
        print("  ✓ SUCCESS: Shared secrets match!")
        return True
    else:
        print("  ✗ FAILURE: Shared secrets DO NOT match!")
        return False


def dilithium3_example():
    """Demonstrate Dilithium-3 digital signatures"""
    print("\n\n=== Dilithium-3 Digital Signature Example ===\n")

    error = ZipminatorError()

    # Generate signing key pair
    print("[Signer] Generating Dilithium-3 key pair...")
    public_key = (c_uint8 * 1952)()
    secret_key = (c_uint8 * 4000)()

    start = time.time()
    result = lib.zipminator_dilithium3_keygen(public_key, secret_key, byref(error))
    elapsed = (time.time() - start) * 1000
    check_error(result, error)

    print(f"  KeyGen time: {elapsed:.3f} ms")
    print(f"  Public key: {bytes_to_hex(bytes(public_key))}")

    # Sign message
    message = b"CNSA 2.0 compliant post-quantum signature - Zipminator by QDaria"
    print(f"\n[Signer] Signing message: \"{message.decode()}\"")

    signature = (c_uint8 * 3293)()
    sig_len = c_size_t()

    start = time.time()
    result = lib.zipminator_dilithium3_sign(
        (c_uint8 * len(message))(*message), len(message),
        secret_key, signature, byref(sig_len), byref(error)
    )
    elapsed = (time.time() - start) * 1000
    check_error(result, error)

    print(f"  Sign time: {elapsed:.3f} ms")
    print(f"  Signature: {bytes_to_hex(bytes(signature)[:sig_len.value])}")

    # Verify signature
    print("\n[Verifier] Verifying signature...")

    start = time.time()
    result = lib.zipminator_dilithium3_verify(
        (c_uint8 * len(message))(*message), len(message),
        signature, sig_len, public_key, byref(error)
    )
    elapsed = (time.time() - start) * 1000

    if result == ZIPMINATOR_SUCCESS:
        print(f"  Verify time: {elapsed:.3f} ms")
        print("  ✓ SUCCESS: Signature is VALID")
    else:
        print("  ✗ FAILURE: Signature is INVALID")
        return False

    # Test tampering
    print("\n[Verifier] Testing tampering detection...")
    tampered = b"Tampered message - should fail"

    result = lib.zipminator_dilithium3_verify(
        (c_uint8 * len(tampered))(*tampered), len(tampered),
        signature, sig_len, public_key, byref(error)
    )

    if result != ZIPMINATOR_SUCCESS:
        print("  ✓ SUCCESS: Tampered message correctly REJECTED")
        return True
    else:
        print("  ✗ FAILURE: Tampered message was ACCEPTED (security failure!)")
        return False


def qrng_health_example():
    """Demonstrate QRNG health monitoring"""
    print("\n\n=== QRNG Health Monitoring Example ===\n")

    health = QRNGHealth()
    error = ZipminatorError()

    result = lib.zipminator_qrng_get_health(byref(health), byref(error))

    if result != ZIPMINATOR_SUCCESS:
        print(f"QRNG health check failed: {error.message[0].decode()}")
        return False

    print("QRNG Status:")
    print(f"  Health: {'HEALTHY ✓' if health.is_healthy else 'UNHEALTHY ✗'}")
    print(f"  Device: {health.device_model[0].decode()}")
    print(f"  Entropy generated: {health.entropy_bits_generated} bits")
    print(f"  Throughput: {health.throughput_mbps:.2f} Mbps")
    print(f"  Health check failures: {health.health_check_failures}")

    if health.health_check_failures > 0:
        print("  ⚠ WARNING: QRNG has experienced health check failures!")

    return True


def main():
    print("=" * 50)
    print("Zipminator PQC Library - Python Example")
    print("=" * 50)

    # Initialize library
    config = ZipminatorConfig()
    config.entropy_source = ZIPMINATOR_ENTROPY_QRNG
    config.enable_side_channel_protection = True
    config.enable_fault_protection = True
    config.qrng_health_check_interval_ms = 100

    error = ZipminatorError()

    print("\nInitializing Zipminator library...")
    result = lib.zipminator_init(byref(config), byref(error))
    if result != ZIPMINATOR_SUCCESS:
        print(f"Initialization failed: {error.message[0].decode()}")
        print("Note: If QRNG device not available, library will use system PRNG")
        return 1

    # Get version
    version = ZipminatorVersion()
    lib.zipminator_get_version(byref(version))
    print(f"  Version: {version.major}.{version.minor}.{version.patch} (commit {version.git_commit[0].decode()})")
    print(f"  FIPS mode: {'Yes' if version.fips_mode else 'No'}")
    print(f"  QRNG available: {'Yes' if version.qrng_available else 'No'}")

    # Run examples
    try:
        success = True
        success &= kyber768_example()
        success &= dilithium3_example()
        success &= qrng_health_example()

        if success:
            print("\n✓ All examples completed successfully!")
            return 0
        else:
            print("\n✗ Some examples failed")
            return 1

    finally:
        # Cleanup
        print("\nCleaning up...")
        lib.zipminator_cleanup()


if __name__ == "__main__":
    exit(main())
