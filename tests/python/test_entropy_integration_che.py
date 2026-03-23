"""Integration tests for the Certified Heterogeneous Entropy (CHE) provider.

Tests the full pipeline: sources -> health check -> compositor -> provenance certificate.
This is the top-level API that consumers of certified entropy will use.
"""
import pytest

from zipminator.entropy.certified import (
    CertifiedEntropyProvider,
    CertifiedEntropyResult,
)


class TestFullCHEPipeline:
    """End-to-end integration tests."""

    def test_full_che_pipeline(self):
        """Provider -> compose -> certificate -> verify."""
        provider = CertifiedEntropyProvider()
        result = provider.get_certified_entropy(256)

        assert isinstance(result, CertifiedEntropyResult)
        assert len(result.data) == 32  # 256 bits = 32 bytes
        assert result.certificate is not None
        assert result.certificate.verify()
        assert result.min_entropy_bits > 0
        assert len(result.sources) >= 1

    def test_certified_entropy_length(self):
        """Requested bit count should produce correct byte length."""
        provider = CertifiedEntropyProvider()

        for num_bits in [8, 64, 128, 256, 512, 1024]:
            result = provider.get_certified_entropy(num_bits)
            expected_bytes = num_bits // 8
            assert len(result.data) == expected_bytes, (
                f"Expected {expected_bytes} bytes for {num_bits} bits, "
                f"got {len(result.data)}"
            )

    def test_certificate_verifies(self):
        """The certificate attached to the result must verify."""
        provider = CertifiedEntropyProvider()
        result = provider.get_certified_entropy(128)
        assert result.certificate.verify() is True

    def test_min_entropy_positive(self):
        """Min-entropy estimate should be strictly positive."""
        provider = CertifiedEntropyProvider()
        result = provider.get_certified_entropy(256)
        assert result.min_entropy_bits > 0

    def test_sources_nonempty(self):
        """At least 1 source must have been used."""
        provider = CertifiedEntropyProvider()
        result = provider.get_certified_entropy(64)
        assert len(result.sources) >= 1
        assert all(isinstance(s, str) for s in result.sources)

    def test_different_calls_different_data(self):
        """Two calls should produce different entropy (with overwhelming probability)."""
        provider = CertifiedEntropyProvider()
        r1 = provider.get_certified_entropy(256)
        r2 = provider.get_certified_entropy(256)
        # With 256 bits of entropy, collision probability is negligible
        assert r1.data != r2.data

    def test_certificate_records_match_sources(self):
        """Certificate records should correspond to sources used."""
        provider = CertifiedEntropyProvider()
        result = provider.get_certified_entropy(128)
        cert_sources = {rec.source_name for rec in result.certificate.records}
        result_sources = set(result.sources)
        assert cert_sources == result_sources

    def test_min_sources_parameter(self):
        """Provider with min_sources=1 should work (at least OS fallback)."""
        provider = CertifiedEntropyProvider(min_sources=1)
        result = provider.get_certified_entropy(64)
        assert len(result.data) == 8
        assert result.certificate.verify()

    def test_result_data_is_bytes(self):
        """Result data should be bytes, not bytearray or str."""
        provider = CertifiedEntropyProvider()
        result = provider.get_certified_entropy(64)
        assert isinstance(result.data, bytes)
