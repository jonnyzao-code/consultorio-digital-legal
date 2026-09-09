"""
Configuración central de la aplicación (lee desde .env)
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # App
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "debug"
    API_SECRET_KEY: str = "cambia_esto_por_un_secreto_seguro"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8000",
        "http://localhost:9500",
        "http://localhost:9501",
        "http://localhost:9504",
        "http://127.0.0.1:9500",
        "http://127.0.0.1:9504",
        "https://consultoriodigitallegal.co",
    ]

    # Base de datos
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/consultorio_legal"

    # Supabase
    NEXT_PUBLIC_SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # Gemini AI — las claves se inyectan SOLO por variables de entorno (.env).
    # ⚠️ Rotar cualquier clave que haya estado hardcodeada en versiones anteriores.
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # Wompi (Pasarela Pagos Colombia) — se inyectan por .env / secret-manager.
    NEXT_PUBLIC_WOMPI_PUBLIC_KEY: str = ""
    WOMPI_PRIVATE_KEY: str = ""
    WOMPI_INTEGRITY_SECRET: str = ""
    WOMPI_EVENTS_SECRET: str = ""

    # SMTP (correos transaccionales: confirmación y restablecimiento)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@consultoriodigitallegal.co"

    # Twilio
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_FROM: str = "whatsapp:+14155238886"

    # SendGrid
    SENDGRID_API_KEY: str = ""
    EMAIL_FROM: str = "noreply@consultoriodigitallegal.co"

    # Firebase
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_PRIVATE_KEY: str = ""
    FIREBASE_CLIENT_EMAIL: str = ""

    # Redis / Celery
    REDIS_URL: str = "redis://localhost:6379/0"


settings = Settings()
