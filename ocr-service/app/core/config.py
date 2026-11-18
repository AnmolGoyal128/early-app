"""
Configuration settings for the EARLY OCR Service.
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment override support."""
    model_config = SettingsConfigDict(env_prefix="EARLY_OCR_", case_sensitive=False)

    HOST: str = "0.0.0.0"
    PORT: int = 8000
    SERVICE_NAME: str = "early-ocr-service"
    VERSION: str = "1.0.0"

    # CORS origins allowing frontend (:3000) and backend (:8080)
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ]

    MAX_UPLOAD_SIZE_MB: int = 15


settings = Settings()
