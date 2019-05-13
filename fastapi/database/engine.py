from databases import Database
from sqlalchemy import MetaData
from sqlalchemy.engine.url import URL

from app import settings


database = Database(
    URL(**{
        'drivername': settings.DB_DRIVERNAME,
        'username': settings.DB_USERNAME,
        'password': settings.DB_PASSWORD,
        'host': settings.DB_HOST,
        'port': settings.DB_PORT,
        'database': settings.DB_DATABASE,
    }),
    ssl=settings.DB_SSL,
    min_size=settings.DB_POOL_SIZE,
    max_size=settings.DB_POOL_SIZE + settings.DB_POOL_OVERFLOW,
    max_queries=settings.DB_POOL_RECYCLE_QUERIES,
    max_inactive_connection_lifetime=settings.DB_POOL_RECYCLE_TIMEOUT,
)
metadata = MetaData()
