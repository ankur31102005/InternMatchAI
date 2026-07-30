"""
InternMatch AI – Application Settings
Uses pydantic-settings for environment variable loading with validation.
"""

from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────
    APP_NAME: str = "InternMatch AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # ── Database ──────────────────────────────────────────────
    DATABASE_URL: str = "sqlite+aiosqlite:///./internmatch.db"

    # ── JWT ───────────────────────────────────────────────────
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── CORS ──────────────────────────────────────────────────
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_cors(cls, v: str) -> str:
        return v

    def get_allowed_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    # ── Storage ───────────────────────────────────────────────
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 10

    # ── AI Service ────────────────────────────────────────────
    AI_SERVICE_URL: str = "http://localhost:8001"

    # ── Google OAuth ──────────────────────────────────────────
    GOOGLE_CLIENT_ID: str = ""

    # ── Rate Limiting ─────────────────────────────────────────
    RATE_LIMIT_PER_MINUTE: int = 60


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance (singleton pattern)."""
    return Settings()


settings = get_settings()
