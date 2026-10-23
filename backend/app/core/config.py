from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, SecretStr
from typing import Literal


class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = "postgresql+psycopg://mediassure:mediassure@localhost:5433/mediassure"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str = "change-me"
    aws_region: str = "ap-south-1"
    cors_origins: str = "http://localhost:5173,http://localhost:5174"
    email_transport: Literal["disabled", "smtp", "file"] = "disabled"
    smtp_host: str = ""
    smtp_port: int = Field(default=587, ge=1, le=65535)
    smtp_username: str = ""
    smtp_password: SecretStr = SecretStr("")
    smtp_from: str = ""
    smtp_security: Literal["starttls", "ssl", "plain"] = "starttls"
    email_preview_dir: str = "email_previews"

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
    )

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
