"""
Application configuration loaded from environment variables / .env file.
"""
import os
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class Settings(BaseSettings):
    # App
    APP_NAME: str
    APP_VERSION: str
    DEBUG: bool

    # Database
    DATABASE_URL: str

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_DAYS: int

    # OTP / 2FA
    OTP_EXPIRE_MINUTES: int
    OTP_LENGTH: int

    # Email (SMTP)
    SMTP_HOST: str
    SMTP_PORT: int
    SMTP_USER: str
    SMTP_PASSWORD: str
    EMAIL_FROM: str

    # MQTT (IoT)
    MQTT_BROKER_HOST: str
    MQTT_BROKER_PORT: int
    MQTT_SCAN_TOPIC: str

    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:8081",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "*", # Allow all for local network mobile testing
    ]

    # AI / RAG
    EMBEDDING_MODEL: str
    LLM_PROVIDER: str
    GROQ_API_KEY: str
    FAISS_INDEX_DIR: str

    model_config = SettingsConfigDict(
        # In Docker, environment variables are injected directly by docker-compose
        # (via env_file: and environment: directives), so the .env file may not
        # exist inside the container. Setting env_ignore_empty=False and
        # env_file to a list with the path (pydantic-settings silently skips
        # missing files in the list form) handles both cases.
        env_file=[os.path.join(BASE_DIR, ".env")],
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
