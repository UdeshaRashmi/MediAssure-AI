from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = "postgresql+psycopg://mediassure:mediassure@localhost:5432/mediassure"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str = "change-me"
    aws_region: str = "ap-south-1"
    cors_origins: str = "http://localhost:5173,http://localhost:5174"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
