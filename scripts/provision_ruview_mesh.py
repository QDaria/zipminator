#!/usr/bin/env python3
"""Provision RuView mesh nodes with QRNG-derived keys.

Reads quantum entropy from the pool, derives a 16-byte mesh PSK via HKDF-SHA256,
and outputs an NVS binary compatible with MeshProvisioner::provision_nvs_binary().

Usage:
    python scripts/provision_ruview_mesh.py --mesh-id 1 --output mesh_key.bin
    python scripts/provision_ruview_mesh.py --entropy-pool quantum_entropy/quantum_entropy_pool.bin --mesh-id 42
"""
import argparse
import hashlib
import hmac
import os
import struct
import sys
from pathlib import Path

# NVS binary format (must match crates/zipminator-mesh/src/provisioner.rs):
# [magic: 4B "RVMK"] [version: 1B] [mesh_id: 4B LE] [psk: 16B] [siphash_key: 16B] [checksum: 32B SHA-256]
NVS_MAGIC = b"RVMK"
NVS_VERSION = 1


def hkdf_sha256(ikm: bytes, salt: bytes, info: bytes, length: int) -> bytes:
    """HKDF-SHA256 extract-then-expand."""
    # Extract
    prk = hmac.new(salt, ikm, hashlib.sha256).digest()
    # Expand
    t = b""
    okm = b""
    counter = 1
    while len(okm) < length:
        t = hmac.new(prk, t + info + bytes([counter]), hashlib.sha256).digest()
        okm += t
        counter += 1
    return okm[:length]


def read_entropy(pool_path: Path, num_bytes: int) -> bytes:
    """Read entropy bytes from a pool file."""
    if not pool_path.exists():
        print(f"Warning: entropy pool {pool_path} not found, using os.urandom", file=sys.stderr)
        return os.urandom(num_bytes)

    pool_data = pool_path.read_bytes()
    if len(pool_data) < num_bytes:
        print(f"Warning: pool has {len(pool_data)} bytes, need {num_bytes}, padding with os.urandom", file=sys.stderr)
        return pool_data + os.urandom(num_bytes - len(pool_data))

    # Read from a random offset to avoid always using the same bytes
    import secrets
    offset = secrets.randbelow(max(1, len(pool_data) - num_bytes))
    return pool_data[offset:offset + num_bytes]


def provision_mesh_key(entropy: bytes, mesh_id: int) -> tuple[bytes, bytes]:
    """Derive mesh PSK and SipHash key from entropy via HKDF."""
    salt = f"zipminator-mesh-{mesh_id}".encode()

    psk = hkdf_sha256(entropy, salt, b"mesh-psk", 16)
    siphash_key = hkdf_sha256(entropy, salt, b"siphash-frame", 16)

    return psk, siphash_key


def build_nvs_binary(mesh_id: int, psk: bytes, siphash_key: bytes) -> bytes:
    """Build NVS binary blob for ESP32-S3 provisioning."""
    assert len(psk) == 16
    assert len(siphash_key) == 16

    # Header + keys
    header = NVS_MAGIC + bytes([NVS_VERSION]) + struct.pack("<I", mesh_id)
    payload = header + psk + siphash_key

    # SHA-256 checksum over everything
    checksum = hashlib.sha256(payload).digest()

    return payload + checksum


def main():
    parser = argparse.ArgumentParser(description="Provision RuView mesh nodes with QRNG-derived keys")
    parser.add_argument("--entropy-pool", type=Path,
                        default=Path("quantum_entropy/quantum_entropy_pool.bin"),
                        help="Path to quantum entropy pool (default: quantum_entropy/quantum_entropy_pool.bin)")
    parser.add_argument("--mesh-id", type=int, required=True, help="Mesh network ID (u32)")
    parser.add_argument("--output", type=Path, default=None, help="Output path for NVS binary")
    parser.add_argument("--hex", action="store_true", help="Print key material as hex to stdout")

    args = parser.parse_args()

    # Read 64 bytes of entropy (enough for HKDF to derive both keys)
    entropy = read_entropy(args.entropy_pool, 64)

    # Derive keys
    psk, siphash_key = provision_mesh_key(entropy, args.mesh_id)

    if args.hex:
        print(f"mesh_id:     {args.mesh_id}")
        print(f"psk:         {psk.hex()}")
        print(f"siphash_key: {siphash_key.hex()}")

    # Build NVS binary
    nvs = build_nvs_binary(args.mesh_id, psk, siphash_key)

    output_path = args.output or Path(f"mesh_key_{args.mesh_id}.bin")
    output_path.write_bytes(nvs)
    print(f"NVS binary written to {output_path} ({len(nvs)} bytes)")

    # Verify checksum
    payload = nvs[:-32]
    checksum = nvs[-32:]
    assert hashlib.sha256(payload).digest() == checksum, "Checksum verification failed!"
    print("Checksum verified OK")


if __name__ == "__main__":
    main()
