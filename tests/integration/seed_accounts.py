"""Mock account seeder for E2E integration tests (Unit 1).

Creates 3 test users (alice, bob, carol) via the API's /auth/register endpoint
and publishes their ML-KEM-768 public keys to the key directory.

Usage:
    python tests/integration/seed_accounts.py          # seed against localhost:8000
    python tests/integration/seed_accounts.py --api-url http://host:8000

Can also be imported as a module for pytest fixtures.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import os
import sys
from dataclasses import dataclass, field
from typing import Optional

import httpx

# ── Try to use real KEM, fall back to random bytes ───────────────────────────

try:
    from zipminator._core import keypair as _kem_keypair
    _HAS_KEM = True
except ImportError:
    _HAS_KEM = False


@dataclass
class MockUser:
    email: str
    password: str
    pk_bytes: bytes = field(default_factory=bytes)
    sk_bytes: bytes = field(default_factory=bytes)
    pk_b64: str = ""
    sk_b64: str = ""
    fingerprint: str = ""
    user_id: Optional[int] = None
    token: Optional[str] = None


MOCK_USERS = [
    MockUser(email="alice@zipminator.zip", password="alice-test-pw-12345"),
    MockUser(email="bob@zipminator.zip", password="bob-test-pw-12345"),
    MockUser(email="carol@zipminator.zip", password="carol-test-pw-12345"),
]


def generate_keypairs(users: list[MockUser]) -> None:
    """Generate ML-KEM-768 keypairs for each user."""
    for u in users:
        if _HAS_KEM:
            result = _kem_keypair()
            u.pk_bytes = result[0].to_bytes()
            u.sk_bytes = result[1].to_bytes()
        else:
            u.pk_bytes = os.urandom(1184)
            u.sk_bytes = os.urandom(2400)
        u.pk_b64 = base64.b64encode(u.pk_bytes).decode()
        u.sk_b64 = base64.b64encode(u.sk_bytes).decode()
        u.fingerprint = hashlib.sha256(u.pk_bytes).hexdigest()


def register_users(users: list[MockUser], api_url: str) -> None:
    """Register users via POST /auth/register and login to get JWT tokens."""
    client = httpx.Client(base_url=api_url, timeout=10)

    for u in users:
        # Register (ignore 400 if already exists)
        resp = client.post("/auth/register", json={
            "email": u.email,
            "password": u.password,
        })
        if resp.status_code == 201:
            u.user_id = resp.json()["id"]
        elif resp.status_code == 400 and "already registered" in resp.text:
            pass  # Already exists, try login
        else:
            print(f"  WARN: register {u.email} returned {resp.status_code}: {resp.text}")

        # Login to get JWT
        resp = client.post("/auth/login", json={
            "email": u.email,
            "password": u.password,
        })
        if resp.status_code == 200:
            u.token = resp.json()["access_token"]
            # Get user ID from /auth/me if not set
            if u.user_id is None:
                me_resp = client.get("/auth/me", headers={
                    "Authorization": f"Bearer {u.token}"
                })
                if me_resp.status_code == 200:
                    u.user_id = me_resp.json()["id"]
        else:
            print(f"  WARN: login {u.email} failed: {resp.status_code}")

    client.close()


def publish_keys(users: list[MockUser], keydir_url: str) -> None:
    """Publish ML-KEM-768 public keys to the key directory.

    Silently skips if the key directory service is not available.
    """
    auth_token = os.environ.get("KEYDIR_AUTH_TOKEN", "dev-token-change-me")
    try:
        client = httpx.Client(base_url=keydir_url, timeout=5)
        # Quick health check
        health = client.get("/health")
        if health.status_code != 200:
            print(f"  INFO: keydir not available at {keydir_url}, skipping key publish")
            client.close()
            return
    except Exception:
        print(f"  INFO: keydir not reachable at {keydir_url}, skipping key publish")
        return

    for u in users:
        resp = client.post("/keys", json={
            "email": u.email,
            "mlkem_pk": u.pk_b64,
            "x25519_pk": "",
            "ed25519_pk": "",
            "fingerprint": u.fingerprint,
        }, headers={
            "Authorization": f"Bearer {auth_token}",
        })
        if resp.status_code in (201, 409):
            pass  # Created or already exists
        else:
            print(f"  WARN: publish key for {u.email}: {resp.status_code}: {resp.text}")

    client.close()


def seed_all(
    api_url: str = "http://localhost:8000",
    keydir_url: str = "http://localhost:8080",
) -> list[MockUser]:
    """Run the full seeding flow: keypairs → register → publish keys."""
    users = [MockUser(email=u.email, password=u.password) for u in MOCK_USERS]
    generate_keypairs(users)
    register_users(users, api_url)
    publish_keys(users, keydir_url)
    return users


# ── CLI entry point ──────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Seed mock accounts for E2E tests")
    parser.add_argument("--api-url", default="http://localhost:8000")
    parser.add_argument("--keydir-url", default="http://localhost:8080")
    args = parser.parse_args()

    print("Seeding mock accounts...")
    users = seed_all(args.api_url, args.keydir_url)
    for u in users:
        status = "OK" if u.token else "FAILED"
        print(f"  {u.email}: id={u.user_id} token={status} fp={u.fingerprint[:16]}...")
    print("Done.")


if __name__ == "__main__":
    main()
