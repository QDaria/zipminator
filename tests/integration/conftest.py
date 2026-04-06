"""Shared fixtures for integration tests.

These tests require a running API server (FastAPI) and optionally Docker services
(GreenMail, PostgreSQL, etc.). When the API is not reachable, all dependent tests
are automatically skipped rather than erroring out.
"""
import os
import socket
import subprocess
import pytest
import httpx

COMPOSE_FILE = os.path.join(
    os.path.dirname(__file__), "..", "..", "docker-compose.integration.yml"
)

API_URL = os.environ.get("ZIPMINATOR_API_URL", "http://localhost:8000")
WS_URL = os.environ.get("ZIPMINATOR_WS_URL", "ws://localhost:8765")
KEYDIR_URL = os.environ.get("ZIPMINATOR_KEYDIR_URL", "http://localhost:8080")


def _is_api_reachable(url: str = API_URL, timeout: float = 2.0) -> bool:
    """Check if the API server is accepting connections."""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        host = parsed.hostname or "localhost"
        port = parsed.port or 8000
        sock = socket.create_connection((host, port), timeout=timeout)
        sock.close()
        return True
    except (OSError, ConnectionRefusedError, socket.timeout):
        return False


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
    Skips gracefully if the API server is not reachable.
    """
    if not _is_api_reachable():
        pytest.skip(
            f"API server not reachable at {API_URL} — "
            "start with `docker compose up` or `uvicorn api.src.main:app`"
        )

    try:
        from tests.integration.seed_accounts import seed_all
        users = seed_all(api_url=API_URL, keydir_url=KEYDIR_URL)
    except (ConnectionError, httpx.ConnectError, httpx.ConnectTimeout, OSError) as exc:
        pytest.skip(f"Cannot seed test accounts — API not available: {exc}")

    # Verify at least alice and bob got tokens
    alice = next((u for u in users if "alice" in u.email), None)
    bob = next((u for u in users if "bob" in u.email), None)
    if not alice or not alice.token or not bob or not bob.token:
        pytest.skip("Account seeding returned incomplete results — API may be partially up")
    return {u.email.split("@")[0]: u for u in users}


@pytest.fixture(scope="session")
def api_client():
    """HTTP client pointed at the API.

    Skips if the API server is not reachable.
    """
    if not _is_api_reachable():
        pytest.skip(f"API server not reachable at {API_URL}")
    client = httpx.Client(base_url=API_URL, timeout=15)
    yield client
    client.close()


@pytest.fixture(scope="session")
def async_api_client():
    """Async HTTP client for WebSocket-adjacent tests."""
    if not _is_api_reachable():
        pytest.skip(f"API server not reachable at {API_URL}")
    client = httpx.AsyncClient(base_url=API_URL, timeout=15)
    yield client


@pytest.fixture(scope="session")
def ws_url():
    """WebSocket URL for the signaling server.

    Defaults to ws://localhost:8765. Override with ZIPMINATOR_WS_URL env var.
    Used by live-server integration tests (test_websocket_ratchet.py when run
    against a deployed signaling server instead of in-process TestClient).
    """
    return WS_URL


def _auth_header(token: str) -> dict:
    """Build Authorization header from JWT token."""
    return {"Authorization": f"Bearer {token}"}
