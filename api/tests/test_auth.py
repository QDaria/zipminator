import pytest
from fastapi.testclient import TestClient


def test_user_registration(client: TestClient, test_user_data):
    """Test user registration"""
    response = client.post("/auth/register", json=test_user_data)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == test_user_data["email"]
    assert "id" in data
    assert "password" not in data


def test_duplicate_registration(client: TestClient, test_user_data):
    """Test duplicate user registration fails"""
    # Register first time
    client.post("/auth/register", json=test_user_data)

    # Try to register again
    response = client.post("/auth/register", json=test_user_data)
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


def test_user_login(client: TestClient, test_user_data):
    """Test user login"""
    # Register user
    client.post("/auth/register", json=test_user_data)

    # Login
    response = client.post("/auth/login", json=test_user_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials(client: TestClient, test_user_data):
    """Test login with invalid credentials"""
    # Register user
    client.post("/auth/register", json=test_user_data)

    # Try to login with wrong password
    wrong_data = test_user_data.copy()
    wrong_data["password"] = "wrongpassword"
    response = client.post("/auth/login", json=wrong_data)
    assert response.status_code == 401


def test_get_current_user(authenticated_client: TestClient, test_user_data):
    """Test getting current user info"""
    response = authenticated_client.get("/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user_data["email"]


def test_get_current_user_unauthorized(client: TestClient):
    """Test getting current user without token"""
    response = client.get("/auth/me")
    assert response.status_code == 403  # No authorization header
