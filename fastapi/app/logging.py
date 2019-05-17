import logging

from .env import Env
from .settings import settings


# Configure logging
logging.basicConfig(level=0)

if settings.ENV == Env.DEVELOPMENT:
    pass
elif settings.ENV == Env.PRODUCTION:
    pass
