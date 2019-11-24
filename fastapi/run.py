#!./venv/bin/python
import os
import uvicorn


if __name__ == "__main__":
    port = 8000
    if os.getenv("FASTAPI_DOCKER"):
        os.system("./venv/bin/python wait.py")
        os.system("./venv/bin/alembic upgrade head")
        os.system("./venv/bin/python fixtures.py")
        if os.getenv("ASGI_ENV") == "production":
            port = 443
        uvicorn.run(
            "app.asgi:app",
            host="0.0.0.0",
            port=port,
            ssl_keyfile="./certs/domain.key",
            ssl_certfile="./certs/domain.crt",
        )
    else:
        os.system("./venv/bin/alembic upgrade head")
        os.system("./venv/bin/python fixtures.py")
        uvicorn.run("app.asgi:app", host="0.0.0.0", port=port, reload=True)
