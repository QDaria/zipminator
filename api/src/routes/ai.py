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


# ---------- Routes ----------

@router.post("/api/ai/chat", response_model=ChatResponse, tags=["ai"])
async def ai_chat(req: ChatRequest):
    """Chat with the local LLM. Prompt guard runs first."""
    _scan_messages(req.messages)

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

    return ChatResponse(
        message=result.get("message"),
        model=result.get("model"),
    )


@router.post("/api/ai/summarize", response_model=ChatResponse, tags=["ai"])
async def ai_summarize(req: SummarizeRequest):
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
