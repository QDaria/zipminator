import pytest
from fastapi.testclient import TestClient


def test_create_api_key(authenticated_client: TestClient):
    """Test API key creation"""
    response = authenticated_client.post(
        "/v1/keys/",
        json={"name": "Test Key", "rate_limit": 1000}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Key"
    assert data["rate_limit"] == 1000
    assert "key" in data  # Plaintext key returned on creation
    assert data["key"].startswith("zip_")


def test_list_api_keys(authenticated_client: TestClient):
    """Test listing API keys"""
    # Create a key
    authenticated_client.post(
        "/v1/keys/",
        json={"name": "Test Key 1", "rate_limit": 1000}
    )

    # List keys
    response = authenticated_client.get("/v1/keys/")
    assert response.status_code == 200
    data = response.json()
    assert "keys" in data
    assert "total" in data
    assert data["total"] >= 1
    assert len(data["keys"]) >= 1


def test_get_api_key(authenticated_client: TestClient):
    """Test getting specific API key"""
    # Create a key
    create_response = authenticated_client.post(
        "/v1/keys/",
        json={"name": "Test Key", "rate_limit": 1000}
    )
    key_id = create_response.json()["id"]

    # Get the key
    response = authenticated_client.get(f"/v1/keys/{key_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == key_id
    assert data["name"] == "Test Key"


def test_delete_api_key(authenticated_client: TestClient):
    """Test deleting API key"""
    # Create a key
    create_response = authenticated_client.post(
        "/v1/keys/",
        json={"name": "Test Key", "rate_limit": 1000}
    )
    key_id = create_response.json()["id"]

    # Delete the key
    response = authenticated_client.delete(f"/v1/keys/{key_id}")
    assert response.status_code == 204

    # Verify it's deleted
    get_response = authenticated_client.get(f"/v1/keys/{key_id}")
    assert get_response.status_code == 404


def test_deactivate_api_key(authenticated_client: TestClient):
    """Test deactivating API key"""
    # Create a key
    create_response = authenticated_client.post(
        "/v1/keys/",
        json={"name": "Test Key", "rate_limit": 1000}
    )
    key_id = create_response.json()["id"]

    # Deactivate the key
    response = authenticated_client.patch(f"/v1/keys/{key_id}/deactivate")
    assert response.status_code == 200
    data = response.json()
    assert data["is_active"] is False


def test_create_api_key_unauthorized(client: TestClient):
    """Test creating API key without authentication"""
    response = client.post(
        "/v1/keys/",
        json={"name": "Test Key", "rate_limit": 1000}
    )
    assert response.status_code == 403
