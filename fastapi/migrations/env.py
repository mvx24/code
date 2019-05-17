


# configure function handles creating the schema and loading database settings
def configure():
    import os
    import sys
    sys.path.append(os.path.abspath('.'))
    os.environ.setdefault('ASGI_ENV', 'migrate')
    from sqlalchemy.engine.url import URL
    from app import settings
    from database import metadata, DbBaseModel, generate_table
    import models
    config.set_main_option('sqlalchemy.url', str(URL(**{
        'drivername': settings.DB_DRIVERNAME,
        'username': settings.DB_USERNAME,
        'password': settings.DB_PASSWORD,
        'host': settings.DB_HOST,
        'port': settings.DB_PORT,
        'database': settings.DB_DATABASE,
    })))
    # Generate the complete database schema
    for name in models.__all__:
        model = getattr(models, name)
        if issubclass(model, DbBaseModel):
            generate_table(model, metadata)
    return metadata


def process_revision_directives(context, revision, directives):
    if config.cmd_opts.autogenerate:
        script = directives[0]
        if script.upgrade_ops.is_empty():
            print('\033[1mNo changes found to migrate!\033[0m')
            directives[:] = []

