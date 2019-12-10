#!./venv/bin/python
import os
import uvicorn


if __name__ == "__main__":
    port = 8000
    ssl_keyfile = None
    ssl_certfile = None
    if os.getenv("FASTAPI_DOCKER"):
        os.system("./venv/bin/python wait.py")
        os.system("./venv/bin/alembic upgrade head")
        os.system("./venv/bin/python fixtures.py")
        if os.getenv("ASGI_ENV") == "production":
            port = 443
            ssl_keyfile = "./certs/domain.key"
            ssl_certfile = "./certs/domain.crt"
        uvicorn.run(
            "app.asgi:app",
            host="0.0.0.0",
            port=port,
            ssl_keyfile=ssl_keyfile,
            ssl_certfile=ssl_certfile,
        )
    else:
        os.system("./venv/bin/alembic upgrade head")
        os.system("./venv/bin/python fixtures.py")
        uvicorn.run("app.asgi:app", host="0.0.0.0", port=port, reload=True)
