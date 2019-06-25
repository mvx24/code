from fastapi import Depends, HTTPException
from starlette.status import HTTP_501_NOT_IMPLEMENTED

from app import settings
from app.asgi import app
from dependencies import current_staff
from models import User
from utils.source_map import download_source_map


@app.get("/source-map/{filename}")
async def source_map(filename, _: User = Depends(current_staff)):
    if not settings.SOURCEMAP_BUCKET:
        raise HTTPException(
            status_code=HTTP_501_NOT_IMPLEMENTED, detail="Uploading is unavailable"
        )
    return await download_source_map(filename)
