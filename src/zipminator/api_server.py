from shared.providers import get_provider
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import os
import sys

# Ensure root is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


app = FastAPI(
    title="Zipminator Entropy API",
    description="Centralized Quantum Entropy Service for No-Account Mode",
    version="1.0.0"
)


class EntropyRequest(BaseModel):
    bits: int = 256


class EntropyResponse(BaseModel):
    binary: str
    provider: str
    timestamp: str


@app.get("/")
def read_root():
    return {"status": "online", "service": "Zipminator Quantum Entropy"}


@app.get("/entropy", response_model=EntropyResponse)
def get_entropy(bits: int = 256, x_api_key: Optional[str] = Header(None)):
    """
    Get quantum entropy.
    If a valid API key is provided (Pro/Enterprise), it routes to high-priority providers (Rigetti).
    Otherwise, it serves from the public pool (IBM/Simulation).
    """

    try:
        provider = get_provider()
        entropy = provider.get_entropy(bits)

        import datetime
        return {
            "binary": entropy,
            "provider": provider.name(),
            "timestamp": datetime.datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
