from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""

    # API
    API_TITLE: str = "Zipminator API"
    API_VERSION: str = "0.1.0"
    API_DESCRIPTION: str = "Quantum-secured post-quantum cryptography API"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]

    # Database
    DATABASE_URL: str = "postgresql://zipminator:dev_password@localhost:5432/zipminator_dev"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Rust CLI
    CLI_PATH: str = "../cli/target/release/zipminator"

    # Rate Limiting
    DEFAULT_RATE_LIMIT: int = 1000  # requests per hour

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
