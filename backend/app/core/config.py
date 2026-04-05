from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Prometheon"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://prometheon:prometheon_secret@localhost:5432/prometheon"
    # Sync URL for Alembic migrations
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://prometheon:prometheon_secret@localhost:5432/prometheon"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Auth / JWT
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # S3
    S3_BUCKET_NAME: str = "prometheon-docs"
    S3_REGION: str = "ap-south-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # Carry-forward
    CARRY_FORWARD_CUTOFF_HOUR: int = 19  # 7 PM IST

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()
