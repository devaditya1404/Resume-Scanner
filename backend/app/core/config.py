import os
from typing import List, Union
from pydantic import AnyHttpUrl, BeforeValidator, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing_extensions import Annotated


def parse_cors_origins(v: Union[str, List[str]]) -> List[str]:
    if isinstance(v, list):
        return v
    if isinstance(v, str):
        v = v.strip()
        if v.startswith("["):
            import json
            return json.loads(v)
        return [i.strip() for i in v.split(",") if i.strip()]
    raise ValueError(v)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore"
    )

    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "TalentVault AI"
    
    # Security
    SECRET_KEY: str = "super-secret-development-key-change-in-production-12345"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/recruitiq"

    # CORS - includes production Netlify URL as default fallback
    BACKEND_CORS_ORIGINS: Annotated[
        List[str], BeforeValidator(parse_cors_origins)
    ] = [
        "http://localhost:3000",
        "https://resumescanner007.netlify.app",
    ]


settings = Settings()
