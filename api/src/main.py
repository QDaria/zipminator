from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.config import settings
from src.routes import health, auth, keys, crypto, anonymize, signaling, messages, voip, email, ai
from src.middleware.logging import LoggingMiddleware
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

# Create FastAPI app
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description=settings.API_DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom logging middleware
app.add_middleware(LoggingMiddleware)

# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(keys.router, prefix="/v1/keys", tags=["keys"])
app.include_router(crypto.router, prefix="/v1", tags=["crypto"])
app.include_router(anonymize.router, prefix="/v1", tags=["anonymize"])
app.include_router(signaling.router, tags=["signaling"])
app.include_router(messages.router, prefix="/v1/messages", tags=["messages"])
app.include_router(voip.router, prefix="/v1/voip", tags=["voip"])
app.include_router(email.router, prefix="/v1/email", tags=["email"])
app.include_router(ai.router, tags=["ai"])


@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logging.info("Starting Zipminator API...")
    logging.info(f"Version: {settings.API_VERSION}")
    db_host = settings.DATABASE_URL.split('@')[-1].split('/')[0] if '@' in settings.DATABASE_URL else 'configured'
    logging.info(f"Database: {db_host}")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    logging.info("Shutting down Zipminator API...")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Zipminator API",
        "version": settings.API_VERSION,
        "description": "Quantum-secured post-quantum cryptography API",
        "docs": "/docs",
        "health": "/health"
    }
