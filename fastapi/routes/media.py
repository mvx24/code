from typing import List

from fastapi import Depends

from app.asgi import app
from dependencies import current_user, CommonQueryParams
from models import Image, Video, Media, User


@app.get("/media", response_model=List[Media])
async def get_media(
    user: User = Depends(current_user), params: CommonQueryParams = Depends()
):
    media = await Media.union(
        (Image, Video),
        ((Image.c.user_id == user.id), (Video.c.user_id == user.id)),
        start=params.start,
        stop=params.stop,
    )
    return media
