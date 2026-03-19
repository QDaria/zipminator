"""Ollama LLM client for Zipminator Q-AI assistant (Pillar 6).

Local-first: connects to Ollama at localhost:11434.
Graceful degradation when Ollama is not running.
"""

from __future__ import annotations

import logging
from typing import Any, AsyncIterator, Dict, List, Optional

import httpx

logger = logging.getLogger(__name__)

_TIMEOUT = httpx.Timeout(connect=5.0, read=120.0, write=10.0, pool=5.0)


class OllamaClient:
    """Async client for the Ollama REST API."""

    def __init__(self, base_url: str = "http://localhost:11434") -> None:
        self.base_url = base_url.rstrip("/")

    # -- low-level helpers (patched in tests) --

    async def _get(self, path: str) -> httpx.Response:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            return await client.get(f"{self.base_url}{path}")

    async def _post(self, path: str, json: dict) -> httpx.Response:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            return await client.post(f"{self.base_url}{path}", json=json)

    # -- public API --

    async def health_check(self) -> bool:
        """Return True if Ollama is reachable."""
        try:
            resp = await self._get("/")
            return resp.status_code == 200
        except (httpx.ConnectError, httpx.TimeoutException, OSError):
            return False

    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: str = "llama3.2",
        stream: bool = False,
    ) -> Dict[str, Any]:
        """Send a chat completion request.

        Returns the full Ollama response dict on success, or
        ``{"error": "..."}`` when Ollama is unreachable.
        """
        payload = {
            "model": model,
            "messages": messages,
            "stream": stream,
        }
        try:
            resp = await self._post("/api/chat", json=payload)
            return resp.json()
        except (httpx.ConnectError, httpx.TimeoutException, OSError) as exc:
            logger.warning("Ollama not available: %s", exc)
            return {
                "error": (
                    "Ollama is not available. Start it with `ollama serve` "
                    "or install from https://ollama.com."
                )
            }

    async def chat_stream(
        self,
        messages: List[Dict[str, str]],
        model: str = "llama3.2",
    ) -> AsyncIterator[str]:
        """Stream chat tokens as an async generator.

        Yields JSON-encoded chunks. Falls back to a single error chunk
        if Ollama is unreachable.
        """
        import json as _json

        payload = {"model": model, "messages": messages, "stream": True}
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                async with client.stream(
                    "POST", f"{self.base_url}/api/chat", json=payload
                ) as resp:
                    async for line in resp.aiter_lines():
                        if line.strip():
                            yield line
        except (httpx.ConnectError, httpx.TimeoutException, OSError) as exc:
            logger.warning("Ollama stream not available: %s", exc)
            yield _json.dumps(
                {"error": "Ollama is not available. Start it with `ollama serve`."}
            )

    async def list_models(self) -> List[Dict[str, Any]]:
        """List locally available models. Returns [] on failure."""
        try:
            resp = await self._get("/api/tags")
            data = resp.json()
            return data.get("models", [])
        except (httpx.ConnectError, httpx.TimeoutException, OSError):
            return []
