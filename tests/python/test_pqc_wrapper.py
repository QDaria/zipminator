"""
Test suite for the PQC wrapper class (src/zipminator/crypto/pqc.py).

Tests Rust backend usage, key generation with/without seed, and encap/decap.
"""

import pytest

from zipminator.crypto.pqc import PQC, RUST_AVAILABLE


@pytest.mark.skipif(not RUST_AVAILABLE, reason="Rust bindings not built")
class TestPQCRustBackend:
    def test_default_uses_rust(self):
        pqc = PQC()
        assert pqc.use_rust is True

    def test_keypair_returns_bytes(self):
        pqc = PQC()
        pk, sk = pqc.generate_keypair()
        assert isinstance(pk, bytes)
        assert isinstance(sk, bytes)
        assert len(pk) == 1184
        assert len(sk) == 2400

    def test_seeded_keypair_deterministic(self):
        pqc = PQC()
        seed = b"\xAB" * 32
        pk1, sk1 = pqc.generate_keypair(seed=seed)
        pk2, sk2 = pqc.generate_keypair(seed=seed)
        assert pk1 == pk2
        assert sk1 == sk2

    def test_invalid_seed_length(self):
        pqc = PQC()
        with pytest.raises(ValueError, match="32 bytes"):
            pqc.generate_keypair(seed=b"\x00" * 16)

    def test_encap_decap_round_trip(self):
        pqc = PQC()
        pk, sk = pqc.generate_keypair()
        ct, ss = pqc.encapsulate(pk)
        ss2 = pqc.decapsulate(sk, ct)
        assert ss == ss2

    def test_ciphertext_sizes(self):
        pqc = PQC()
        pk, sk = pqc.generate_keypair()
        ct, ss = pqc.encapsulate(pk)
        assert len(ct) == 1088
        assert len(ss) == 32
