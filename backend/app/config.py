import json
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./supportdesk.db"
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    OVERDUE_HOURS: int = 24
    APP_ENV: str = "development"
    JWT_SECRET: str = "super-secret-jwt-key-for-dev-change-in-prod"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_MINUTES: int = 60 * 24
    SLA_HOURS: Union[dict[str, int], str] = {"urgent": 4, "high": 8, "medium": 24, "low": 48}

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @field_validator("SLA_HOURS", mode="before")
    @classmethod
    def parse_sla_hours(cls, v: Union[dict[str, int], str]) -> dict[str, int]:
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                return {str(k).lower(): int(val) for k, val in parsed.items()}
            except Exception:
                pass
        if isinstance(v, dict):
            return {str(k).lower(): int(val) for k, val in v.items()}
        return {"urgent": 4, "high": 8, "medium": 24, "low": 48}

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("postgres://"):
                v = v.replace("postgres://", "postgresql+psycopg://", 1)
            elif v.startswith("postgresql://") and not v.startswith("postgresql+"):
                v = v.replace("postgresql://", "postgresql+psycopg://", 1)
        return v

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v


settings = Settings()

