from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # App Config
    PROJECT_NAME: str = "Casino Platform API"
    API_V1_STR: str = "/api/v1"
    
    # Database Credentials (from .env)
    DB_NAME: str
    DB_USER: str
    DB_PASS: str
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 Hours

    # Pydantic V2 Config
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def DB_CONFIG(self) -> str:
        """Constructs the connection string for psycopg"""
        return f"dbname={self.DB_NAME} user={self.DB_USER} password={self.DB_PASS} host={self.DB_HOST} port={self.DB_PORT}"

settings = Settings()