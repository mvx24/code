import os
from typing import List

from dotenv import load_dotenv
from pydantic import BaseSettings, EmailStr, UrlStr

from .env import Env


class Settings(BaseSettings):
    ENV: Env = Env.DEVELOPMENT
    PRIMARY_KEY_AS_UUID: bool = False
    SECRET_KEY: str
    ALLOWED_HOSTS: List[str] = None
    GZIP_THRESHOLD: int = 2048

    # Paging
    DEFAULT_PAGE_SIZE: int = 50
    MAX_PAGE_SIZE: int = 250

    # Access Tokens
    TOKEN_ISSUER: str = "pyjwt"
    TOKEN_ALGORITHM: str = "HS256"
    TOKEN_EXPIRATION: int = (2 * 7 * 24 * 60 * 60)

    # CORS Configuration
    CORS_ALLOW_ORIGINS: List[str] = []
    CORS_ALLOW_ORIGIN_REGEX: str = ""
    CORS_ALLOW_METHODS: List[str] = ["GET"]
    CORS_ALLOW_HEADERS: List[str] = []
    CORS_ALLOW_HEADERS: List[str] = []
    CORS_ALLOW_CREDENTIALS: bool = False
    CORS_EXPOSE_HEADERS: List[str] = []
    CORS_MAX_AGE: int = 60

    # Database
    DB_DRIVERNAME: str = "postgresql"
    DB_USERNAME: str
    DB_PASSWORD: str
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_DATABASE: str = "postgres"
    DB_SSL: bool = False
    DB_POOL_SIZE: int = 10
    DB_POOL_OVERFLOW: int = 5
    DB_POOL_RECYCLE_TIMEOUT: int = 300
    DB_POOL_RECYCLE_QUERIES: int = 50000

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DATABASE: int = 0
    REDIS_PASSWORD: str = None

    # Email
    EMAIL_FROM_EMAIL: EmailStr = None
    EMAIL_FROM_NAME: str = ""
    EMAIL_SUBJECT_PREFIX: str = ""
    SMTP_HOST: str = None
    SMTP_USER: str = None
    SMTP_PASSWORD: str = None
    SMTP_PORT: int = 587
    SMTP_TLS: bool = True

    # Sentry
    SENTRY_DSN: UrlStr = None

    # Uploads
    UPLOAD_BUCKET: str = None
    UPLOAD_BUCKET_PROVIDER: str = None

    # Sourcemaps
    SOURCEMAP_BUCKET: str = None
    SOURCEMAP_BUCKET_PROVIDER: str = None

    # Media
    MEDIA_BUCKET: str = None
    MEDIA_BUCKET_PROVIDER: str = None


# Load up environment variables and initialize the settings
env = os.getenv("ASGI_ENV", Env.DEVELOPMENT)
load_dotenv(dotenv_path=os.path.abspath(f".env.{env}.local"))
load_dotenv(dotenv_path=os.path.abspath(f".env.{env}"))
load_dotenv(dotenv_path=os.path.abspath(".env.local"))
load_dotenv()

settings = Settings(ENV=env)
