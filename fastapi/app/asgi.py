# pylint: disable=unused-import,invalid-name
from fastapi import FastAPI
from sentry_asgi import SentryMiddleware
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from database.engine import database
from middleware.xframe import XFrameHeaderMiddleware
from .env import Env
from .settings import settings


APP_ARGS = {}
if settings.ENV == Env.PRODUCTION:
    APP_ARGS.update({
        'openapi_url': None,
        'docs_url': None,
        'redoc_url': None,
    })


app = FastAPI(
    title='App',
    description='API for app.',
    version='0.1.0',
    **APP_ARGS,
)


# Configure Middleware
if settings.ENV == Env.PRODUCTION:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)
    app.add_middleware(HTTPSRedirectMiddleware)
    if settings.CORS_ALLOW_ORIGINS or settings.CORS_ALLOW_ORIGIN_REGEX:
        opts = {
            'allow_methods': settings.CORS_ALLOW_METHODS,
            'allow_headers': settings.CORS_ALLOW_HEADERS,
            'allow_credentials': settings.CORS_ALLOW_CREDENTIALS,
            'expose_headers': settings.CORS_EXPOSE_HEADERS,
            'max_age': settings.CORS_MAX_AGE,
        }
        if settings.CORS_ALLOW_ORIGINS:
            opts['allow_origins'] = settings.CORS_ALLOW_ORIGINS
        else:
            opts['allow_origin_regex'] = settings.CORS_ALLOW_ORIGIN_REGEX
        app.add_middleware(CORSMiddleware, **opts)
    if settings.SENTRY_DSN:
        app.add_middleware(SentryMiddleware)
    app.add_middleware(XFrameHeaderMiddleware)
    app.add_middleware(GZipMiddleware, minimum_size=settings.GZIP_THRESHOLD)


@app.on_event('startup')
async def startup():
    # Adjust __fields__.schema.extra casing of non-database models for use in openapi.json
    if settings.ENV == Env.DEVELOPMENT:
        import models
        from database import DbBaseModel
        from utils.casing import camel_case_dict
        for name in models.__all__:
            model = getattr(models, name)
            if not isinstance(model, DbBaseModel):
                for field in model.__fields__.values():
                    camel_case_dict(field.schema.extra)

    # Initialize all of the API routes
    try:
        import routes
    except Exception as e:
        print(f'\033[1;31mError on startup!\033[0m')
        import sys
        import traceback
        traceback.print_exc(file=sys.stdout)

    # Init the Sentry SDK so the middleware works properly
    if settings.ENV == Env.PRODUCTION:
        if settings.SENTRY_DSN:
            import sentry_sdk
            sentry_sdk.init(dsn=settings.SENTRY_DSN)

    # Init the database pool
    await database.connect()


@app.on_event('shutdown')
async def shutdown():
    await database.disconnect()
