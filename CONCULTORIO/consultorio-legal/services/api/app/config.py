"""Application configuration using pydantic-settings."""

from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All application settings loaded from environment variables or .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # --- Database ---
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/consultorio_legal"

    # --- Redis ---
    REDIS_URL: str = "redis://localhost:6379/0"

    # --- JWT ---
    JWT_SECRET: str = "changeme-super-secret-key-at-least-32-chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # --- Gemini ---
    GEMINI_API_KEY: str = ""

    # --- Wompi ---
    WOMPI_PUBLIC_KEY: str = ""
    WOMPI_PRIVATE_KEY: str = ""
    WOMPI_EVENTS_KEY: str = ""  # Used to validate webhook signatures

    # --- Twilio ---
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_FROM: str = "whatsapp:+14155238886"

    # --- SendGrid ---
    SENDGRID_API_KEY: str = ""

    # --- Google Cloud Storage ---
    GCS_BUCKET_NAME: str = "consultorio-legal-docs"
    GOOGLE_CLOUD_PROJECT: str = ""

    # --- CORS ---
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    # --- App ---
    DEBUG: bool = True
    APP_NAME: str = "Consultorio Digital Legal API"
    APP_VERSION: str = "0.1.0"

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v


@lru_cache()
def get_settings() -> Settings:
    """Return cached Settings singleton."""
    return Settings()
