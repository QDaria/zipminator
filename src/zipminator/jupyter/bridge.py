"""HTTP client bridge to the Zipminator Flask demo backend (port 5001).

Falls back to direct SDK import when the server is unreachable.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, Optional, Tuple
from urllib.error import URLError
from urllib.request import Request, urlopen

logger = logging.getLogger(__name__)

DEFAULT_BASE = "http://localhost:5001"
_TIMEOUT = 3  # seconds


class FlaskBridge:
    """Thin wrapper around the demo Flask backend API.

    All methods fall back to the local SDK when the server is unavailable.
    """

    def __init__(self, base_url: str = DEFAULT_BASE) -> None:
        self.base_url = base_url.rstrip("/")
        self._server_up: Optional[bool] = None

    def is_server_running(self) -> bool:
        if self._server_up is not None:
            return self._server_up
        try:
            resp = urlopen(f"{self.base_url}/api/quantum/status", timeout=_TIMEOUT)
            self._server_up = resp.status == 200
        except (URLError, OSError):
            self._server_up = False
        return self._server_up

    def _post(self, path: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        body = json.dumps(payload or {}).encode()
        req = Request(
            f"{self.base_url}{path}",
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urlopen(req, timeout=_TIMEOUT) as resp:
            return json.loads(resp.read())

    def _get(self, path: str) -> Dict[str, Any]:
        with urlopen(f"{self.base_url}{path}", timeout=_TIMEOUT) as resp:
            return json.loads(resp.read())

    # -- KEM operations --

    def generate_keypair(self, seed_hex: Optional[str] = None) -> Tuple[bytes, bytes]:
        if self.is_server_running():
            try:
                payload: Dict[str, Any] = {}
                if seed_hex:
                    payload["seed"] = seed_hex
                data = self._post("/api/kyber/generate", payload)
                pk = bytes.fromhex(data["public_key"])
                sk = bytes.fromhex(data["secret_key"])
                return pk, sk
            except Exception as exc:
                logger.debug("Flask keygen failed, falling back to SDK: %s", exc)

        from zipminator.crypto.pqc import PQC

        pqc = PQC(level=768)
        seed = bytes.fromhex(seed_hex) if seed_hex else None
        return pqc.generate_keypair(seed=seed)

    def encapsulate(self, pk_hex: str) -> Tuple[bytes, bytes]:
        if self.is_server_running():
            try:
                data = self._post("/api/kyber/encrypt", {"public_key": pk_hex})
                ct = bytes.fromhex(data["ciphertext"])
                ss = bytes.fromhex(data["shared_secret"])
                return ct, ss
            except Exception as exc:
                logger.debug("Flask encaps failed, falling back to SDK: %s", exc)

        from zipminator.crypto.pqc import PQC

        pqc = PQC(level=768)
        return pqc.encapsulate(bytes.fromhex(pk_hex))

    def decapsulate(self, sk_hex: str, ct_hex: str) -> bytes:
        if self.is_server_running():
            try:
                data = self._post("/api/kyber/decrypt", {
                    "secret_key": sk_hex,
                    "ciphertext": ct_hex,
                })
                return bytes.fromhex(data["shared_secret"])
            except Exception as exc:
                logger.debug("Flask decaps failed, falling back to SDK: %s", exc)

        from zipminator.crypto.pqc import PQC

        pqc = PQC(level=768)
        return pqc.decapsulate(bytes.fromhex(sk_hex), bytes.fromhex(ct_hex))

    def entropy_status(self) -> Dict[str, Any]:
        if self.is_server_running():
            try:
                return self._get("/api/quantum/status")
            except Exception as exc:
                logger.debug("Flask entropy status failed, falling back to SDK: %s", exc)

        from zipminator.crypto.quantum_random import QuantumEntropyPool

        pool = QuantumEntropyPool()
        return pool.get_stats()
