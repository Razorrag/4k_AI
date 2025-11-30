"""Application configuration"""

from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    # Server Configuration (Custom Ports)
    PORT: int = 38291
    HOST: str = "0.0.0.0"
    
    # Redis Configuration (Custom Port)
    REDIS_URL: str = "redis://redis:51647/0"
    
    # File Upload Settings
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_EXTENSIONS: set = {"jpg", "jpeg", "png", "webp"}
    UPLOAD_DIR: Path = Path("/app/uploads")
    PROCESSED_DIR: Path = Path("/app/processed")
    MODELS_DIR: Path = Path("/app/models")
    
    # Processing Settings
    MAX_CONCURRENT_JOBS: int = 4
    JOB_TIMEOUT: int = 300  # 5 minutes
    CLEANUP_AFTER_HOURS: int = 24
    
    # AI Model Settings
    DEVICE: str = "cpu"
    TILE_SIZE: int = 400
    TILE_PAD: int = 10
    SCALE: int = 4
    
    class Config:
        env_file = ".env"

settings = Settings()

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)
