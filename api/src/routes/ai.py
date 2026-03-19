"""AI routes for Zipminator Q-AI assistant (Pillar 6).

All prompts pass through PromptGuard before reaching the LLM.
"""

from __future__ import annotations

import json
import logging
from typing import List, Optional

from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from zipminator.ai.prompt_guard import PromptGuard
from zipminator.ai.pqc_tunnel import PQCTunnel
from zipminator.crypto.pii_scanner import PIIScanner
from api.src.services.llm_service import OllamaClient

logger = logging.getLogger(__name__)
router = APIRouter()

# Singletons
_guard = PromptGuard()
_pii = PIIScanner(confidence_threshold=0.0)
_llm = OllamaClient()


# ---------- Request / Response models ----------

class ChatMessage(BaseModel):
    role: str = Field(..., description="One of: system, user, assistant")
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: str = "llama3.2"
    stream: bool = False


class SummarizeRequest(BaseModel):
    text: str
    max_length: int = 200


class ChatResponse(BaseModel):
    message: Optional[dict] = None
    model: Optional[str] = None
    error: Optional[str] = None


# ---------- Helpers ----------

def _scan_messages(messages: List[ChatMessage]) -> None:
    """Run prompt guard on every user message. Raises HTTPException(400) on detection."""
    for msg in messages:
        if msg.role == "user":
            result = _guard.scan(msg.content)
            if not result.is_safe:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": "Prompt injection detected",
                        "matched_patterns": result.matched_patterns,
                        "risk_score": result.risk_score,
                    },
                )


def _scan_pii(messages: List[ChatMessage]) -> None:
    """Scan user messages for PII. Raises HTTPException(400) if PII is found."""
    for msg in messages:
        if msg.role == "user":
            result = _pii.scan_text(msg.content)
            if result["pii_detected"]:
                types_str = ", ".join(result["types"])
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": (
                            f"Prompt contains PII: {types_str}. "
                            "Remove sensitive data before sending to AI."
                        ),
                        "pii_types": result["types"],
                        "risk_level": result["risk_level"].value,
                    },
                )


# ---------- Routes ----------

@router.post("/api/ai/chat", response_model=ChatResponse, tags=["ai"])
async def ai_chat(
    req: ChatRequest,
    x_pii_scan: Optional[str] = Header(None, alias="X-PII-Scan"),
    x_pqc_tunnel: Optional[str] = Header(None, alias="X-PQC-Tunnel"),
):
    """Chat with the local LLM. Prompt guard and PII scan run first.

    When the ``X-PQC-Tunnel: enabled`` header is present, the response payload
    is wrapped in a PQC (ML-KEM-768) envelope before being returned.  This
    protects the response even if the transport layer is compromised.
    """
    _scan_messages(req.messages)

    if x_pii_scan != "skip":
        _scan_pii(req.messages)

    # Initialise PQC tunnel when requested
    tunnel: Optional[PQCTunnel] = None
    if x_pqc_tunnel == "enabled":
        tunnel = PQCTunnel()

    if req.stream:
        async def _gen():
            async for chunk in _llm.chat_stream(
                messages=[m.model_dump() for m in req.messages],
                model=req.model,
            ):
                yield chunk + "\n"

        return StreamingResponse(_gen(), media_type="text/event-stream")

    result = await _llm.chat(
        messages=[m.model_dump() for m in req.messages],
        model=req.model,
    )

    if "error" in result:
        return ChatResponse(error=result["error"])

    response = ChatResponse(
        message=result.get("message"),
        model=result.get("model"),
    )

    if tunnel is not None:
        envelope = tunnel.encrypt(response.model_dump_json())
        return {
            "pqc_envelope": envelope,
            "pqc_public_key": __import__("base64").b64encode(tunnel.public_key).decode("ascii"),
        }

    return response


@router.post("/api/ai/summarize", response_model=ChatResponse, tags=["ai"])
async def ai_summarize(
    req: SummarizeRequest,
    x_pii_scan: Optional[str] = Header(None, alias="X-PII-Scan"),
):
    """Summarize text using the local LLM."""
    result = _guard.scan(req.text)
    if not result.is_safe:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Prompt injection detected in text",
                "matched_patterns": result.matched_patterns,
                "risk_score": result.risk_score,
            },
        )

    if x_pii_scan != "skip":
        pii_result = _pii.scan_text(req.text)
        if pii_result["pii_detected"]:
            types_str = ", ".join(pii_result["types"])
            raise HTTPException(
                status_code=400,
                detail={
                    "error": (
                        f"Text contains PII: {types_str}. "
                        "Remove sensitive data before sending to AI."
                    ),
                    "pii_types": pii_result["types"],
                    "risk_level": pii_result["risk_level"].value,
                },
            )

    messages = [
        {
            "role": "system",
            "content": (
                f"Summarize the following text in at most {req.max_length} words. "
                "Be concise and factual."
            ),
        },
        {"role": "user", "content": req.text},
    ]

    result = await _llm.chat(messages=messages)

    if "error" in result:
        return ChatResponse(error=result["error"])

    return ChatResponse(
        message=result.get("message"),
        model=result.get("model"),
    )


@router.get("/api/ai/models", tags=["ai"])
async def ai_models():
    """List locally available Ollama models."""
    models = await _llm.list_models()
    healthy = await _llm.health_check()
    return {
        "ollama_available": healthy,
        "models": models,
    }
