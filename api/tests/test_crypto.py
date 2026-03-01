import pytest
from fastapi.testclient import TestClient
import base64


@pytest.mark.skip(reason="Requires Rust CLI binary and mocking")
def test_generate_keypair(authenticated_client: TestClient):
    """Test keypair generation"""
    # Create an API key first
    key_response = authenticated_client.post(
        "/v1/keys/",
        json={"name": "Crypto Test Key", "rate_limit": 1000}
    )
    api_key = key_response.json()["key"]

    # Use API key for crypto operations
    client_with_api_key = authenticated_client
    client_with_api_key.headers["Authorization"] = f"Bearer {api_key}"

    response = client_with_api_key.post(
        "/v1/keygen",
        json={"use_quantum": False}
    )
    assert response.status_code == 200
    data = response.json()
    assert "public_key" in data
    assert "secret_key" in data
    assert data["algorithm"] == "kyber768"


@pytest.mark.skip(reason="Requires Rust CLI binary and mocking")
def test_encrypt_decrypt_roundtrip(authenticated_client: TestClient):
    """Test encryption and decryption roundtrip"""
    # Create an API key
    key_response = authenticated_client.post(
        "/v1/keys/",
        json={"name": "Crypto Test Key", "rate_limit": 1000}
    )
    api_key = key_response.json()["key"]

    client_with_api_key = authenticated_client
    client_with_api_key.headers["Authorization"] = f"Bearer {api_key}"

    # Generate keypair
    keygen_response = client_with_api_key.post(
        "/v1/keygen",
        json={"use_quantum": False}
    )
    keys = keygen_response.json()

    # Encrypt data
    plaintext = b"Hello, quantum world!"
    plaintext_b64 = base64.b64encode(plaintext).decode()

    encrypt_response = client_with_api_key.post(
        "/v1/encrypt",
        json={
            "public_key": keys["public_key"],
            "plaintext": plaintext_b64
        }
    )
    assert encrypt_response.status_code == 200
    encrypted_data = encrypt_response.json()

    # Decrypt data
    decrypt_response = client_with_api_key.post(
        "/v1/decrypt",
        json={
            "secret_key": keys["secret_key"],
            "ciphertext": encrypted_data["ciphertext"]
        }
    )
    assert decrypt_response.status_code == 200
    decrypted_data = decrypt_response.json()

    # Verify roundtrip
    decrypted_plaintext = base64.b64decode(decrypted_data["plaintext"])
    assert decrypted_plaintext == plaintext


def test_crypto_operations_require_api_key(authenticated_client: TestClient):
    """Test that crypto operations require API key"""
    # Try to generate keypair without API key (using JWT token)
    response = authenticated_client.post(
        "/v1/keygen",
        json={"use_quantum": False}
    )
    # Should fail because crypto endpoints expect API key, not JWT
    assert response.status_code in [401, 403, 500]


def test_invalid_api_key(client: TestClient):
    """Test crypto operations with invalid API key"""
    client.headers["Authorization"] = "Bearer invalid_key_12345"

    response = client.post(
        "/v1/keygen",
        json={"use_quantum": False}
    )
    assert response.status_code == 401
