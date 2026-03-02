from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings -- all secrets MUST be provided via environment or .env file."""

    # API
    API_TITLE: str = "Zipminator API"
    API_VERSION: str = "0.1.0"
    API_DESCRIPTION: str = "Quantum-secured post-quantum cryptography API"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]

    # Database (no default -- must be set via .env or environment)
    DATABASE_URL: str

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # JWT (no default secret -- must be set via .env or environment)
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Rust CLI
    CLI_PATH: str = "../crates/zipminator-core/target/release/zipminator"

    # Rate Limiting
    DEFAULT_RATE_LIMIT: int = 1000  # requests per hour

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
