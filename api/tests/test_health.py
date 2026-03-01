import pytest
from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data


def test_root_endpoint(client: TestClient):
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "Zipminator API"
    assert "version" in data
    assert "docs" in data


def test_readiness_check(client: TestClient):
    """Test readiness check endpoint"""
    response = client.get("/ready")
    # May fail if services are not running, but should return a response
    assert response.status_code in [200, 503]
    data = response.json()
    assert "status" in data
    assert "services" in data
