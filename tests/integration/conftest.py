"""Shared fixtures for integration tests."""
import os
import subprocess
import pytest
import httpx

COMPOSE_FILE = os.path.join(
    os.path.dirname(__file__), "..", "..", "docker-compose.integration.yml"
)

API_URL = os.environ.get("ZIPMINATOR_API_URL", "http://localhost:8000")
KEYDIR_URL = os.environ.get("ZIPMINATOR_KEYDIR_URL", "http://localhost:8080")


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


# ── E2E Account Fixtures (Unit 1) ───────────────────────────────────────────

@pytest.fixture(scope="session")
def mock_users():
    """Seed 3 mock users and return their MockUser objects.

    Requires the API and keydir services to be running.
    """
    from tests.integration.seed_accounts import seed_all
    users = seed_all(api_url=API_URL, keydir_url=KEYDIR_URL)
    # Verify at least alice and bob got tokens
    alice = next(u for u in users if "alice" in u.email)
    bob = next(u for u in users if "bob" in u.email)
    assert alice.token, "Alice registration/login failed"
    assert bob.token, "Bob registration/login failed"
    return {u.email.split("@")[0]: u for u in users}


@pytest.fixture(scope="session")
def api_client():
    """HTTP client pointed at the API."""
    client = httpx.Client(base_url=API_URL, timeout=15)
    yield client
    client.close()


@pytest.fixture(scope="session")
def async_api_client():
    """Async HTTP client for WebSocket-adjacent tests."""
    import httpx
    client = httpx.AsyncClient(base_url=API_URL, timeout=15)
    yield client


def _auth_header(token: str) -> dict:
    """Build Authorization header from JWT token."""
    return {"Authorization": f"Bearer {token}"}
