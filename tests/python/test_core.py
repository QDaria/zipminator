"""
Test suite for Rust Kyber768 bindings via zipminator._core.

Tests the raw Rust API: keypair, encapsulate, decapsulate, deterministic keygen,
key sizes, round-trip correctness, and wrong-key rejection.
"""

import pytest
import threading

try:
    from zipminator._core import (
        keypair,
        keypair_from_seed,
        encapsulate,
        decapsulate,
        PublicKey,
        SecretKey,
        Ciphertext,
    )
    RUST_AVAILABLE = True
except ImportError:
    RUST_AVAILABLE = False

pytestmark = pytest.mark.skipif(not RUST_AVAILABLE, reason="Rust bindings not built")

# CRYSTALS-Kyber-768 constants
PK_SIZE = 1184
SK_SIZE = 2400
CT_SIZE = 1088
SS_SIZE = 32


class TestKeypairGeneration:
    def test_keypair_returns_tuple(self):
        pk, sk = keypair()
        assert isinstance(pk, PublicKey)
        assert isinstance(sk, SecretKey)

    def test_key_sizes(self):
        pk, sk = keypair()
        assert len(pk.to_bytes()) == PK_SIZE
        assert len(sk.to_bytes()) == SK_SIZE

    def test_keypair_uniqueness(self):
        pk1, sk1 = keypair()
        pk2, sk2 = keypair()
        assert pk1.to_bytes() != pk2.to_bytes()
        assert sk1.to_bytes() != sk2.to_bytes()

    def test_deterministic_keygen(self):
        seed = b"\x42" * 32
        pk1, sk1 = keypair_from_seed(seed)
        pk2, sk2 = keypair_from_seed(seed)
        assert pk1.to_bytes() == pk2.to_bytes()
        assert sk1.to_bytes() == sk2.to_bytes()

    def test_different_seeds_different_keys(self):
        pk1, _ = keypair_from_seed(b"\x01" * 32)
        pk2, _ = keypair_from_seed(b"\x02" * 32)
        assert pk1.to_bytes() != pk2.to_bytes()

    def test_from_bytes_round_trip(self):
        pk, sk = keypair()
        pk2 = PublicKey.from_bytes(pk.to_bytes())
        sk2 = SecretKey.from_bytes(sk.to_bytes())
        assert pk.to_bytes() == pk2.to_bytes()
        assert sk.to_bytes() == sk2.to_bytes()

    @pytest.mark.parametrize("_", range(50))
    def test_bulk_keygen(self, _):
        pk, sk = keypair()
        assert len(pk.to_bytes()) == PK_SIZE


class TestEncapsulation:
    def test_encapsulate_returns_tuple(self):
        pk, _ = keypair()
        ct, ss = encapsulate(pk)
        assert isinstance(ct, Ciphertext)
        assert isinstance(ss, bytes)

    def test_ciphertext_size(self):
        pk, _ = keypair()
        ct, _ = encapsulate(pk)
        assert len(ct.to_bytes()) == CT_SIZE

    def test_shared_secret_size(self):
        pk, _ = keypair()
        _, ss = encapsulate(pk)
        assert len(ss) == SS_SIZE

    def test_encapsulation_uniqueness(self):
        pk, _ = keypair()
        ct1, ss1 = encapsulate(pk)
        ct2, ss2 = encapsulate(pk)
        assert ct1.to_bytes() != ct2.to_bytes()
        assert ss1 != ss2

    def test_shared_secret_entropy(self):
        pk, _ = keypair()
        secrets = set()
        for _ in range(50):
            _, ss = encapsulate(pk)
            secrets.add(ss)
        assert len(secrets) == 50  # all unique


class TestDecapsulation:
    def test_round_trip(self):
        pk, sk = keypair()
        ct, ss = encapsulate(pk)
        ss2 = decapsulate(ct, sk)
        assert ss == ss2

    def test_round_trip_100x(self):
        pk, sk = keypair()
        for _ in range(100):
            ct, ss = encapsulate(pk)
            ss2 = decapsulate(ct, sk)
            assert ss == ss2

    def test_wrong_secret_key(self):
        pk1, sk1 = keypair()
        _, sk2 = keypair()
        ct, ss = encapsulate(pk1)
        ss_wrong = decapsulate(ct, sk2)
        assert ss_wrong != ss  # IND-CCA2: wrong key yields different result

    def test_corrupted_ciphertext(self):
        pk, sk = keypair()
        ct, ss = encapsulate(pk)
        corrupted = bytearray(ct.to_bytes())
        corrupted[0] ^= 0xFF
        ct_bad = Ciphertext.from_bytes(bytes(corrupted))
        ss_bad = decapsulate(ct_bad, sk)
        assert ss_bad != ss

    def test_from_bytes_decapsulation(self):
        """Test round-trip through serialization."""
        pk, sk = keypair()
        ct, ss = encapsulate(pk)
        # Serialize and deserialize
        ct2 = Ciphertext.from_bytes(ct.to_bytes())
        sk2 = SecretKey.from_bytes(sk.to_bytes())
        ss2 = decapsulate(ct2, sk2)
        assert ss == ss2


class TestThreadSafety:
    def test_concurrent_encap_decap(self):
        pk, sk = keypair()
        errors = []

        def worker():
            try:
                for _ in range(50):
                    ct, ss = encapsulate(pk)
                    ss2 = decapsulate(ct, sk)
                    assert ss == ss2
            except Exception as e:
                errors.append(e)

        threads = [threading.Thread(target=worker) for _ in range(4)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        assert len(errors) == 0, f"Thread errors: {errors}"
