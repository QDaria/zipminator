from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from src.db.database import get_db
from src.config import settings
from pathlib import Path
import redis

router = APIRouter()


@router.get("/health")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.API_VERSION,
        "service": "zipminator-api"
    }


@router.get("/ready")
async def readiness_check(db: Session = Depends(get_db)):
    """
    Readiness check - verifies all dependencies are available

    Checks:
    - Database connection
    - Redis connection
    - Rust CLI binary exists
    """
    services = {}

    # Check database
    try:
        db.execute(text("SELECT 1"))
        services["database"] = "ok"
    except Exception as e:
        services["database"] = f"error: {str(e)}"

    # Check Redis
    try:
        redis_client = redis.from_url(settings.REDIS_URL)
        redis_client.ping()
        services["redis"] = "ok"
    except Exception as e:
        services["redis"] = f"error: {str(e)}"

    # Check Rust CLI binary
    cli_path = Path(__file__).parent.parent.parent.parent / settings.CLI_PATH
    if cli_path.exists():
        services["cli"] = "ok"
    else:
        services["cli"] = f"error: binary not found at {cli_path}"

    # Determine overall status
    all_ok = all(v == "ok" for v in services.values())
    status_code = status.HTTP_200_OK if all_ok else status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "ready" if all_ok else "not_ready",
        "services": services
    }
