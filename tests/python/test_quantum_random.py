"""
Test suite for QuantumRandom (src/zipminator/crypto/quantum_random.py).

Tests random(), randint(), randbytes(), choice(), shuffle(), sample(),
entropy pool stats, and license tier detection.
"""

import pytest
from zipminator.crypto.quantum_random import QuantumRandom


class TestRandomFloat:
    def test_random_in_range(self):
        qr = QuantumRandom()
        for _ in range(100):
            val = qr.random()
            assert 0.0 <= val < 1.0

    def test_random_not_constant(self):
        qr = QuantumRandom()
        vals = {qr.random() for _ in range(50)}
        assert len(vals) > 40  # at least mostly unique


class TestRandint:
    def test_randint_inclusive(self):
        qr = QuantumRandom()
        for _ in range(200):
            val = qr.randint(1, 6)
            assert 1 <= val <= 6

    def test_randint_single_value(self):
        qr = QuantumRandom()
        assert qr.randint(5, 5) == 5

    def test_randint_invalid_range(self):
        qr = QuantumRandom()
        with pytest.raises(ValueError):
            qr.randint(10, 5)


class TestRandbytes:
    def test_correct_length(self):
        qr = QuantumRandom()
        for n in [1, 16, 32, 64, 256]:
            assert len(qr.randbytes(n)) == n

    def test_nonzero_entropy(self):
        qr = QuantumRandom()
        b = qr.randbytes(32)
        assert len(set(b)) > 10  # reasonable byte diversity


class TestChoice:
    def test_choice_from_list(self):
        qr = QuantumRandom()
        items = ["a", "b", "c", "d"]
        for _ in range(50):
            assert qr.choice(items) in items

    def test_choice_empty_raises(self):
        qr = QuantumRandom()
        with pytest.raises(IndexError):
            qr.choice([])


class TestShuffle:
    def test_shuffle_preserves_elements(self):
        qr = QuantumRandom()
        original = list(range(20))
        shuffled = original.copy()
        qr.shuffle(shuffled)
        assert sorted(shuffled) == original

    def test_shuffle_changes_order(self):
        qr = QuantumRandom()
        original = list(range(20))
        shuffled = original.copy()
        qr.shuffle(shuffled)
        # With 20 elements, shuffle should change something
        assert shuffled != original


class TestSample:
    def test_sample_correct_size(self):
        qr = QuantumRandom()
        result = qr.sample(range(100), 10)
        assert len(result) == 10

    def test_sample_unique(self):
        qr = QuantumRandom()
        result = qr.sample(range(100), 10)
        assert len(set(result)) == 10

    def test_sample_too_large_raises(self):
        qr = QuantumRandom()
        with pytest.raises(ValueError):
            qr.sample(range(5), 10)


class TestLicenseTier:
    def test_free_tier_no_quantum(self):
        qr = QuantumRandom(license_tier="FREE")
        assert qr._has_quantum_access is False

    def test_enterprise_level10_quantum(self):
        qr = QuantumRandom(license_tier="ROBINDRA-LEVEL10")
        assert qr._has_quantum_access is True

    def test_env_var_override(self, monkeypatch):
        monkeypatch.setenv("ZIPMINATOR_QUANTUM_ENABLED", "true")
        qr = QuantumRandom(license_tier="FREE")
        assert qr._has_quantum_access is True


class TestStats:
    def test_stats_has_required_keys(self):
        qr = QuantumRandom()
        stats = qr.get_stats()
        assert "license_tier" in stats
        assert "quantum_access" in stats


class TestGetrandbits:
    def test_getrandbits_range(self):
        qr = QuantumRandom()
        for _ in range(50):
            val = qr.getrandbits(8)
            assert 0 <= val < 256

    def test_getrandbits_zero_raises(self):
        qr = QuantumRandom()
        with pytest.raises(ValueError):
            qr.getrandbits(0)
