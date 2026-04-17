from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Retail Backend"
    environment: str = "development"
    api_prefix: str = "/api/v1"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])

    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_db_url: str = ""

    telegram_bot_token: str = ""
    telegram_auth_max_age_seconds: int = 86400


@lru_cache
def get_settings() -> Settings:
    return Settings()
