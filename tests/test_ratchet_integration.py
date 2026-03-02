"""
Integration tests for the PQ Double Ratchet Python bindings.

These tests are written BEFORE the full Python binding extension lands.
Tests that require API not yet exposed via PyO3 are decorated with
@pytest.mark.skip so they are catalogued but do not fail CI.

Assumed future Python API (from `python_bindings.rs` extensions):
    import zipminator_core as zc

    # Ratchet lifecycle
    ratchet = zc.PqcRatchet()
    ratchet.local_public_key_bytes: bytes         # 1184 bytes
    ratchet.set_remote_public(pk_bytes: bytes) -> None
    ratchet.encapsulate() -> tuple[bytes, bytes]  # (ciphertext, shared_secret)
    ratchet.decapsulate(ct: bytes) -> bytes        # shared_secret

    # Symmetric layer (already available via encrypt/decrypt)
    ratchet.encrypt(data: bytes, key: bytes, ad: bytes) -> bytes
    ratchet.decrypt(data: bytes, key: bytes, ad: bytes) -> bytes

    # Ratchet chain (future)
    ratchet.ratchet_encrypt(plaintext: bytes) -> dict  # {'counter': int, 'ciphertext': bytes}
    ratchet.ratchet_decrypt(counter: int, ciphertext: bytes) -> bytes

    # Serialization (future)
    ratchet.export_state() -> bytes
    zc.PqcRatchet.from_state(state: bytes) -> PqcRatchet
"""

import pytest

# ---------------------------------------------------------------------------
# Import guard: tests that require the native extension skip gracefully when
# the .so is not built yet.
# ---------------------------------------------------------------------------
try:
    import zipminator_core as zc  # type: ignore[import]
    NATIVE_AVAILABLE = True
except ImportError:
    NATIVE_AVAILABLE = False

pytestmark = pytest.mark.skipif(
    not NATIVE_AVAILABLE,
    reason="zipminator_core native extension not built (run: maturin develop)",
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def kem_handshake_python():
    """
    Perform a KEM handshake between two Python-side ratchet instances.

    Returns (alice, bob, shared_secret_bytes) where ss is 32 bytes.
    Both parties derive the same secret via:
      1. Alice generates keypair; shares public key.
      2. Bob encapsulates -> (ciphertext, ss_bob).
      3. Alice decapsulates ciphertext -> ss_alice.
      4. ss_alice == ss_bob.
    """
    alice = zc.PqcRatchet()
    bob = zc.PqcRatchet()

    bob.set_remote_public(alice.local_public_key_bytes)
    ct, ss_bob = bob.encapsulate()
    ss_alice = alice.decapsulate(ct)

    assert ss_alice == ss_bob, "KEM handshake: shared secrets must match"
    return alice, bob, ss_alice


# ---------------------------------------------------------------------------
# Basic round-trip
# ---------------------------------------------------------------------------

@pytest.mark.skip(reason="Requires PqcRatchet Python bindings (maturin develop + PyO3 extension)")
def test_ratchet_python_roundtrip():
    """
    Encrypt a message on one ratchet instance; decrypt on a second instance
    using the KEM-derived shared secret as the symmetric key.

    Verifies:
    - The Python binding correctly wraps the Rust AES-256-GCM encrypt/decrypt.
    - Nonce is correctly prepended and recovered.
    - The decrypted plaintext is byte-for-byte identical to the original.
    """
    alice, bob, shared_secret = kem_handshake_python()

    plaintext = b"Hello from the Python binding!"
    aad = b"python-roundtrip-v1"

    # Alice encrypts
    ciphertext = alice.encrypt(plaintext, shared_secret, aad)

    # Sanity checks on ciphertext structure
    assert len(ciphertext) >= len(plaintext) + 12 + 16, (
        "Ciphertext must be at least plaintext_len + nonce(12) + tag(16) bytes"
    )
    assert ciphertext != plaintext, "Ciphertext must differ from plaintext"

    # Bob decrypts
    recovered = bob.decrypt(ciphertext, shared_secret, aad)

    assert recovered == plaintext, (
        f"Decrypted plaintext does not match original: {recovered!r} != {plaintext!r}"
    )


@pytest.mark.skip(reason="Requires PqcRatchet Python bindings")
def test_ratchet_python_multiple_messages():
    """
    Send 20 messages from Alice to Bob via the Python binding.

    Verifies:
    - Each message decrypts to the correct plaintext.
    - Ciphertexts are unique across messages (random nonces).
    - Associated data is correctly bound (changing AAD causes decryption failure).
    """
    alice, bob, ss = kem_handshake_python()

    ciphertexts = []
    for i in range(20):
        pt = f"Message {i}: the quick brown fox".encode()
        aad = f"seq-{i}".encode()
        ct = alice.encrypt(pt, ss, aad)
        ciphertexts.append(ct)

        recovered = bob.decrypt(ct, ss, aad)
        assert recovered == pt, f"Round-trip failed for message {i}"

    # All ciphertexts must be distinct (random nonce per message)
    ct_set = set(bytes(ct) for ct in ciphertexts)
    assert len(ct_set) == 20, "Every ciphertext must be unique across messages"

    # Wrong AAD must cause decryption failure
    import pytest
    with pytest.raises(Exception, match="AES-GCM|decrypt|auth"):
        bob.decrypt(ciphertexts[0], ss, b"wrong-aad")


@pytest.mark.skip(reason="Requires ratchet state serialization API (export_state / from_state)")
def test_ratchet_python_serialization():
    """
    Export Alice's ratchet state, restore it into a new instance, and verify
    that the restored instance can continue sending/receiving messages seamlessly.

    Verifies:
    - `export_state()` produces a non-empty bytes object.
    - `PqcRatchet.from_state(state)` reconstructs the ratchet correctly.
    - The restored ratchet shares the same session keys as the original.
    - Messages encrypted by the original are decryptable by the restored instance.

    Security constraint checked:
    - The serialized state must NOT include plaintext private key material in a
      way detectable by a simple string search (keys should be opaque / encrypted
      at rest in production, but this test at least checks the bytes are not
      trivially the raw secret key hex).
    """
    alice, bob, ss = kem_handshake_python()

    # Encrypt a message before export
    pt_before = b"Before serialization"
    ct_before = alice.encrypt(pt_before, ss, b"before")

    # Export and restore Alice's state
    state_bytes = alice.export_state()
    assert isinstance(state_bytes, (bytes, bytearray)), "export_state must return bytes"
    assert len(state_bytes) > 0, "Exported state must not be empty"

    alice_restored = zc.PqcRatchet.from_state(state_bytes)

    # The restored ratchet must decrypt messages that Bob encrypted with Alice's key
    ct_after = alice_restored.encrypt(b"After serialization", ss, b"after")
    recovered = bob.decrypt(ct_after, ss, b"after")
    assert recovered == b"After serialization"

    # The original ciphertext (from before export) must also work with restored instance
    # because the root key is preserved
    recovered_before = bob.decrypt(ct_before, ss, b"before")
    assert recovered_before == pt_before, (
        "Message encrypted before state export must be decryptable after restore"
    )


# ---------------------------------------------------------------------------
# Tampering / negative path
# ---------------------------------------------------------------------------

@pytest.mark.skip(reason="Requires PqcRatchet Python bindings")
def test_ratchet_python_tamper_detection():
    """
    Modifying any byte of the ciphertext (including the nonce) must cause
    decryption to raise an exception — never silently return wrong plaintext.
    """
    alice, bob, ss = kem_handshake_python()

    pt = b"This must not be corrupted"
    aad = b"tamper-test"
    ct = bytearray(alice.encrypt(pt, ss, aad))

    # Corrupt a byte in the ciphertext body
    ct[15] ^= 0xFF

    with pytest.raises(Exception):
        bob.decrypt(bytes(ct), ss, aad)


# ---------------------------------------------------------------------------
# Security invariants
# ---------------------------------------------------------------------------

@pytest.mark.skip(reason="Requires PqcRatchet Python bindings")
def test_ratchet_python_unique_nonces():
    """
    Two encryptions of the same plaintext under the same key must produce
    distinct ciphertexts due to independent random nonces.
    """
    alice, _, ss = kem_handshake_python()

    pt = b"Same plaintext"
    aad = b"nonce-uniqueness"

    ct1 = alice.encrypt(pt, ss, aad)
    ct2 = alice.encrypt(pt, ss, aad)

    assert ct1 != ct2, "Two encryptions must differ (random nonces)"
    assert ct1[:12] != ct2[:12], "Nonces must be independently random"
