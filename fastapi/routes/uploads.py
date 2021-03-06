from uuid import uuid4

from fastapi import Depends, HTTPException
from starlette.status import HTTP_501_NOT_IMPLEMENTED

from app.asgi import app
from app import settings
from dependencies import current_user
from models import User
from utils.uploads import create_b2_upload_url, create_s3_upload_url


@app.get("/upload-url")
async def get_upload_url(key: str = None, _: User = Depends(current_user)):
    if settings.UPLOAD_BUCKET:
        if settings.UPLOAD_BUCKET_PROVIDER == "b2":
            return await create_b2_upload_url(
                settings.UPLOAD_BUCKET, key or str(uuid4())
            )
        elif settings.UPLOAD_BUCKET_PROVIDER == "s3":
            return await create_s3_upload_url(
                settings.UPLOAD_BUCKET, key or str(uuid4())
            )
    else:
        raise HTTPException(
            status_code=HTTP_501_NOT_IMPLEMENTED, detail="Uploading is unavailable"
        )
