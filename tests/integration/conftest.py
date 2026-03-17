"""Shared fixtures for integration tests."""
import os
import subprocess
import pytest

COMPOSE_FILE = os.path.join(
    os.path.dirname(__file__), "..", "..", "docker-compose.integration.yml"
)

@pytest.fixture(scope="session")
def docker_services():
    """Start docker-compose services on demand (not autouse).

    Tests that need docker should request this fixture explicitly.
    Tests that don't need docker (e.g., self-destruct) run without it.
    """
    if os.environ.get("CI_SKIP_DOCKER"):
        pytest.skip("Docker services not available in this CI environment")
    result = subprocess.run(
        ["docker", "compose", "-f", COMPOSE_FILE, "ps", "--format", "json"],
        capture_output=True, text=True
    )
    if "greenmail" not in result.stdout:
        try:
            subprocess.run(
                ["docker", "compose", "-f", COMPOSE_FILE, "up", "-d", "--wait"],
                check=True, timeout=180
            )
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError):
            pytest.skip("Docker services failed to start")
    yield

@pytest.fixture
def smtp_config():
    return {"host": "localhost", "port": 3025, "use_tls": False}

@pytest.fixture
def imap_config():
    return {"host": "localhost", "port": 3143, "use_tls": False, "user": "test", "password": "test"}

@pytest.fixture
def turn_config():
    return {"host": "localhost", "port": 3478, "user": "test", "password": "test"}

@pytest.fixture
def ollama_url():
    return "http://localhost:11434"
