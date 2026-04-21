from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/jobscholar"
    REDIS_URL: str = "redis://localhost:6379/0"
    MEILISEARCH_URL: str = "http://localhost:7700"
    MEILISEARCH_KEY: str = "your-master-key"
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    CUSTOM_LLM_URL: str = "http://171.226.10.154:8080/v1"
    CUSTOM_LLM_KEY: str = "458d41f783134eb3715cc8f371af8351"
    
    # Auth settings
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"

settings = Settings()
