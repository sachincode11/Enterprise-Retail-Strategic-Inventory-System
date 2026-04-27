"""
Application configuration loaded from environment variables / .env file.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Enterprise Retail & Strategic Inventory System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost/ersis"

    # JWT
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60          # 1 hour
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # OTP / 2FA
    OTP_EXPIRE_MINUTES: int = 5
    OTP_LENGTH: int = 6

    # Email (SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@ersis.com"

    # MQTT (IoT)
    MQTT_BROKER_HOST: str = "mosquitto"
    MQTT_BROKER_PORT: int = 1883
    MQTT_SCAN_TOPIC: str = "ersis/scans"

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8081"]

    # AI / RAG
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gpt-3.5-turbo"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
