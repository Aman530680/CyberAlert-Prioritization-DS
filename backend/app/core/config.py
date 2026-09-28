"""
CyberAlert-Prioritization: Centralized Backend Configuration
Loads settings from .env file using Pydantic Settings.
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


from urllib.parse import quote_plus

class Settings(BaseSettings):
    PROJECT_NAME: str = "CyberAlert Prioritization Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # MySQL Database
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_DATABASE: str = "cyberalert_db"
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = ""
    
    # Server & CORS
    API_HOST: str = "127.0.0.1"
    API_PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
    
    # Artifact Paths
    RAW_DATA_PATH: str = "data/raw/advanced_siem_dataset.jsonl"
    PROCESSED_DATA_PATH: str = "data/processed/cleaned_alerts.parquet"
    MODEL_PATH: str = "models/random_forest.joblib"
    FEATURE_COLS_PATH: str = "models/feature_columns.json"
    METADATA_PATH: str = "models/model_metadata.json"
    EVALUATION_REPORT_PATH: str = "models/evaluation_report.json"
    DATA_QUALITY_REPORT_PATH: str = "data/processed/data_quality_report.json"

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        encoded_password = quote_plus(self.MYSQL_PASSWORD)
        return f"mysql+pymysql://{self.MYSQL_USER}:{encoded_password}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}?charset=utf8mb4"

    @property
    def CORS_ORIGIN_LIST(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
