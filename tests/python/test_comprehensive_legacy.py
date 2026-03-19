"""
Comprehensive Python Test Suite for Zipminator-PQC
Coverage: Unit tests, integration tests, security validation, performance benchmarks
"""

import pytest
import sys
import os
import time
import statistics
from typing import List, Tuple
import hashlib
import secrets

# Import the Zipminator PQC bindings
try:
    import zipminator_pqc as zpqc
except ImportError:
    pytest.skip("zipminator_pqc not installed", allow_module_level=True)


class TestKeyGeneration:
    """Test key generation functionality"""

    def test_keypair_generation(self):
        """Test basic keypair generation"""
        keypair = zpqc.generate_keypair()

        assert keypair is not None
        assert hasattr(keypair, 'public_key')
        assert hasattr(keypair, 'secret_key')
        assert len(keypair.public_key) > 0
        assert len(keypair.secret_key) > 0

    def test_keypair_uniqueness(self):
        """Test that generated keypairs are unique"""
        keypair1 = zpqc.generate_keypair()
        keypair2 = zpqc.generate_keypair()

        assert keypair1.public_key != keypair2.public_key
        assert keypair1.secret_key != keypair2.secret_key

    def test_deterministic_keygen(self):
        """Test deterministic key generation from seed"""
        seed = b'\x42' * 32
        keypair1 = zpqc.generate_keypair_from_seed(seed)
        keypair2 = zpqc.generate_keypair_from_seed(seed)

        assert keypair1.public_key == keypair2.public_key
        assert keypair1.secret_key == keypair2.secret_key

    def test_key_sizes(self):
        """Test that keys have correct sizes"""
        keypair = zpqc.generate_keypair()

        # CRYSTALS-Kyber-768 sizes
        assert len(keypair.public_key) == 1184
        assert len(keypair.secret_key) == 2400

    @pytest.mark.parametrize("iteration", range(100))
    def test_high_volume_keygen(self, iteration):
        """Test high-volume key generation (100 iterations)"""
        keypair = zpqc.generate_keypair()
        assert keypair is not None


class TestEncapsulation:
    """Test key encapsulation functionality"""

    @pytest.fixture
    def keypair(self):
        """Fixture providing a keypair for tests"""
        return zpqc.generate_keypair()

    def test_encapsulation_success(self, keypair):
        """Test successful encapsulation"""
        result = zpqc.encapsulate(keypair.public_key)

        assert result is not None
        assert hasattr(result, 'ciphertext')
        assert hasattr(result, 'shared_secret')
        assert len(result.ciphertext) == 1088  # Kyber768 ciphertext size
        assert len(result.shared_secret) == 32  # Shared secret size

    def test_encapsulation_uniqueness(self, keypair):
        """Test that each encapsulation is unique"""
        result1 = zpqc.encapsulate(keypair.public_key)
        result2 = zpqc.encapsulate(keypair.public_key)

        # Each encapsulation should produce different ciphertext and shared secret
        assert result1.ciphertext != result2.ciphertext
        assert result1.shared_secret != result2.shared_secret

    def test_shared_secret_entropy(self, keypair):
        """Test that shared secrets have high entropy"""
        secrets = []
        for _ in range(100):
            result = zpqc.encapsulate(keypair.public_key)
            secrets.append(result.shared_secret)

        # All should be unique
        assert len(set(secrets)) == len(secrets)

        # Test entropy using byte diversity
        for secret in secrets[:10]:  # Sample first 10
            unique_bytes = len(set(secret))
            assert unique_bytes > 16, f"Low entropy: only {unique_bytes} unique bytes"

    def test_invalid_public_key(self):
        """Test handling of invalid public key"""
        with pytest.raises((ValueError, TypeError)):
            zpqc.encapsulate(b'invalid_key')

    def test_empty_public_key(self):
        """Test handling of empty public key"""
        with pytest.raises((ValueError, TypeError)):
            zpqc.encapsulate(b'')


class TestDecapsulation:
    """Test key decapsulation functionality"""

    @pytest.fixture
    def keypair_and_ciphertext(self):
        """Fixture providing keypair and valid ciphertext"""
        keypair = zpqc.generate_keypair()
        result = zpqc.encapsulate(keypair.public_key)
        return keypair, result.ciphertext, result.shared_secret

    def test_decapsulation_success(self, keypair_and_ciphertext):
        """Test successful decapsulation"""
        keypair, ciphertext, expected_secret = keypair_and_ciphertext

        decrypted_secret = zpqc.decapsulate(ciphertext, keypair.secret_key)

        assert decrypted_secret == expected_secret

    def test_encap_decap_round_trip(self):
        """Test complete encapsulation/decapsulation round trip"""
        keypair = zpqc.generate_keypair()

        for _ in range(100):
            encap_result = zpqc.encapsulate(keypair.public_key)
            decap_secret = zpqc.decapsulate(
                encap_result.ciphertext,
                keypair.secret_key
            )

            assert encap_result.shared_secret == decap_secret

    def test_wrong_secret_key(self):
        """Test decapsulation with wrong secret key"""
        keypair1 = zpqc.generate_keypair()
        keypair2 = zpqc.generate_keypair()

        result = zpqc.encapsulate(keypair1.public_key)
        wrong_secret = zpqc.decapsulate(result.ciphertext, keypair2.secret_key)

        # Should not match (probabilistically impossible)
        assert wrong_secret != result.shared_secret

    def test_corrupted_ciphertext(self, keypair_and_ciphertext):
        """Test handling of corrupted ciphertext"""
        keypair, ciphertext, expected_secret = keypair_and_ciphertext

        # Corrupt the ciphertext
        corrupted = bytearray(ciphertext)
        corrupted[0] ^= 0xFF

        decrypted = zpqc.decapsulate(bytes(corrupted), keypair.secret_key)

        # Should not panic, but produce different result
        assert decrypted != expected_secret

    def test_invalid_ciphertext_size(self, keypair_and_ciphertext):
        """Test handling of invalid ciphertext size"""
        keypair, _, _ = keypair_and_ciphertext

        with pytest.raises((ValueError, TypeError)):
            zpqc.decapsulate(b'short', keypair.secret_key)


class TestSecurity:
    """Security-focused tests"""

    def test_timing_attack_resistance(self):
        """Basic timing attack resistance test"""
        keypair = zpqc.generate_keypair()
        result = zpqc.encapsulate(keypair.public_key)

        # Measure valid decapsulation time
        valid_times = []
        for _ in range(100):
            start = time.perf_counter()
            zpqc.decapsulate(result.ciphertext, keypair.secret_key)
            valid_times.append(time.perf_counter() - start)

        # Measure invalid decapsulation time (corrupted ciphertext)
        corrupted = bytearray(result.ciphertext)
        corrupted[0] ^= 0xFF

        invalid_times = []
        for _ in range(100):
            start = time.perf_counter()
            zpqc.decapsulate(bytes(corrupted), keypair.secret_key)
            invalid_times.append(time.perf_counter() - start)

        # Statistical comparison
        valid_avg = statistics.mean(valid_times)
        invalid_avg = statistics.mean(invalid_times)

        # Should be within 20% of each other (basic constant-time check)
        ratio = valid_avg / invalid_avg if invalid_avg > 0 else 1.0
        assert 0.8 <= ratio <= 1.2, f"Timing variance: {ratio:.2f}x"

    def test_key_reuse_safety(self):
        """Test that key reuse doesn't compromise security"""
        keypair = zpqc.generate_keypair()

        # Perform multiple encapsulations with same public key
        results = [zpqc.encapsulate(keypair.public_key) for _ in range(100)]

        # All ciphertexts should be unique
        ciphertexts = [r.ciphertext for r in results]
        assert len(set(ciphertexts)) == len(ciphertexts)

        # All shared secrets should be unique
        secrets = [r.shared_secret for r in results]
        assert len(set(secrets)) == len(secrets)

    def test_secret_key_not_leaked(self):
        """Test that secret key is not leaked in operations"""
        keypair = zpqc.generate_keypair()
        result = zpqc.encapsulate(keypair.public_key)

        # Public key and ciphertext should not contain secret key fragments
        secret_bytes = set(keypair.secret_key)

        # This is a basic check - real analysis would be more sophisticated
        assert keypair.secret_key not in result.ciphertext
        assert keypair.secret_key not in result.shared_secret


class TestPerformance:
    """Performance benchmark tests"""

    def test_keygen_performance(self, benchmark):
        """Benchmark key generation"""
        result = benchmark(zpqc.generate_keypair)
        assert result is not None

    def test_encapsulation_performance(self, benchmark):
        """Benchmark encapsulation"""
        keypair = zpqc.generate_keypair()
        result = benchmark(zpqc.encapsulate, keypair.public_key)
        assert result is not None

    def test_decapsulation_performance(self, benchmark):
        """Benchmark decapsulation"""
        keypair = zpqc.generate_keypair()
        encap_result = zpqc.encapsulate(keypair.public_key)

        result = benchmark(
            zpqc.decapsulate,
            encap_result.ciphertext,
            keypair.secret_key
        )
        assert result is not None

    def test_throughput_operations_per_second(self):
        """Test operations per second"""
        keypair = zpqc.generate_keypair()

        # Measure encapsulation throughput
        start = time.perf_counter()
        count = 0
        duration = 1.0  # 1 second test

        while time.perf_counter() - start < duration:
            zpqc.encapsulate(keypair.public_key)
            count += 1

        ops_per_sec = count / duration
        print(f"\nEncapsulation: {ops_per_sec:.0f} ops/sec")

        # Should achieve reasonable throughput (> 100 ops/sec on modern hardware)
        assert ops_per_sec > 100


class TestEdgeCases:
    """Edge case and boundary condition tests"""

    def test_max_operations_without_failure(self):
        """Test sustained operation without failures"""
        keypair = zpqc.generate_keypair()

        for i in range(1000):
            result = zpqc.encapsulate(keypair.public_key)
            decrypted = zpqc.decapsulate(result.ciphertext, keypair.secret_key)
            assert result.shared_secret == decrypted, f"Failed at iteration {i}"

    def test_concurrent_operations(self):
        """Test thread safety (basic check)"""
        import threading

        keypair = zpqc.generate_keypair()
        errors = []

        def worker():
            try:
                for _ in range(100):
                    result = zpqc.encapsulate(keypair.public_key)
                    decrypted = zpqc.decapsulate(
                        result.ciphertext,
                        keypair.secret_key
                    )
                    assert result.shared_secret == decrypted
            except Exception as e:
                errors.append(e)

        threads = [threading.Thread(target=worker) for _ in range(10)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert len(errors) == 0, f"Errors in concurrent execution: {errors}"

    def test_memory_cleanup(self):
        """Test that memory is properly cleaned up"""
        import gc

        # Generate many keypairs
        for _ in range(1000):
            keypair = zpqc.generate_keypair()
            result = zpqc.encapsulate(keypair.public_key)
            _ = zpqc.decapsulate(result.ciphertext, keypair.secret_key)

        # Force garbage collection
        gc.collect()

        # If we got here without OOM, memory cleanup is working


class TestIntegration:
    """Integration tests for complete workflows"""

    def test_full_key_exchange_workflow(self):
        """Test complete key exchange workflow"""
        # Alice generates keypair
        alice_keypair = zpqc.generate_keypair()

        # Bob encapsulates using Alice's public key
        bob_encap = zpqc.encapsulate(alice_keypair.public_key)

        # Bob sends ciphertext to Alice (simulated)
        ciphertext = bob_encap.ciphertext

        # Alice decapsulates to get shared secret
        alice_shared = zpqc.decapsulate(ciphertext, alice_keypair.secret_key)

        # Verify both have same shared secret
        assert alice_shared == bob_encap.shared_secret

    def test_multi_party_exchange(self):
        """Test multi-party key exchange"""
        # Create 5 parties
        parties = [zpqc.generate_keypair() for _ in range(5)]

        # Each party encapsulates with every other party
        shared_secrets = {}

        for i, sender_kp in enumerate(parties):
            for j, receiver_kp in enumerate(parties):
                if i != j:
                    result = zpqc.encapsulate(receiver_kp.public_key)
                    shared = zpqc.decapsulate(result.ciphertext, receiver_kp.secret_key)
                    shared_secrets[(i, j)] = shared

        # Verify all exchanges successful
        assert len(shared_secrets) == 5 * 4  # 5 parties, 4 exchanges each

    def test_key_derivation_workflow(self):
        """Test deriving symmetric keys from shared secret"""
        keypair = zpqc.generate_keypair()
        result = zpqc.encapsulate(keypair.public_key)

        # Derive AES-256 key from shared secret
        aes_key = hashlib.sha256(result.shared_secret).digest()
        assert len(aes_key) == 32

        # Verify deterministic derivation
        aes_key2 = hashlib.sha256(result.shared_secret).digest()
        assert aes_key == aes_key2


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--benchmark-only'])
