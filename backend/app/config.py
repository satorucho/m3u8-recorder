from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "postgresql://m3u8_user:m3u8_password@localhost:5432/m3u8_recorder"
    recordings_path: str = "/app/recordings"
    
    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()

