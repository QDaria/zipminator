"""FastAPI application entrypoint for the mail-transport service.

Starts:
  - FastAPI health/status HTTP API on port 8025
  - SMTP server on port 2525 (via asyncio task)
  - IMAP server on port 1143 (via asyncio task)
  - Self-destruct background purge loop

HTTP endpoints:
  GET  /health            Service health
  GET  /metrics           Simple stats (emails stored, unseen)
"""

from __future__ import annotations

import asyncio
import logging
import os

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import JSONResponse

from .storage import EmailStorage, purge_loop
from .smtp_server import run_smtp
from .imap_server import run_imap

log = logging.getLogger(__name__)

_DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/zipminator",
)

_storage: EmailStorage | None = None
_background_tasks: list[asyncio.Task] = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _storage
    logging.basicConfig(level=logging.INFO)

    _storage = await EmailStorage.create(_DATABASE_URL)
    log.info("app: database storage ready")

    tasks = [
        asyncio.create_task(run_smtp(_storage), name="smtp"),
        asyncio.create_task(run_imap(_storage), name="imap"),
        asyncio.create_task(purge_loop(_storage, interval_seconds=60), name="purge"),
    ]
    _background_tasks.extend(tasks)
    log.info("app: background services started")

    yield

    for t in _background_tasks:
        t.cancel()
    await asyncio.gather(*_background_tasks, return_exceptions=True)
    await _storage.close()
    log.info("app: shutdown complete")


app = FastAPI(
    title="Zipminator Mail Transport",
    description="PQC-secured SMTP/IMAP transport (ML-KEM-768 envelope encryption)",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "mail-transport"}


@app.get("/metrics")
async def metrics():
    if _storage is None:
        return JSONResponse({"error": "storage not ready"}, status_code=503)
    return {"status": "ok"}
