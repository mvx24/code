from fastapi import Depends, HTTPException
from starlette.status import HTTP_401_UNAUTHORIZED

from models import User
from .current_user import current_user


async def current_admin(user: User = Depends(current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Not authorized")
    return user
